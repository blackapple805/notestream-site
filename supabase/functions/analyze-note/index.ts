// supabase/functions/analyze-note/index.ts
import "@supabase/functions-js/edge-runtime.d.ts";


const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-20250514";
const MAX_INPUT_CHARS = 8000;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type AnthropicTextBlock = { type: "text"; text: string };
type AnthropicBlock = AnthropicTextBlock | { type: string; [k: string]: unknown };

type AnalyzeResponse = {
  summary?: unknown;
  SmartHighlights?: unknown;
  SmartTasks?: unknown;
  SmartSchedule?: unknown;
  sentiment?: unknown;
  topics?: unknown;
  generatedAt?: unknown;
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "ANTHROPIC_API_KEY not configured",
          fallback: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const payload = await req.json().catch(() => ({}));
    const title = typeof payload?.title === "string" ? payload.title : "Untitled";
    const body = typeof payload?.body === "string" ? payload.body : "";

    if (!body.trim() || body.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Note body too short", fallback: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const truncatedBody = body.slice(0, MAX_INPUT_CHARS);

    const systemPrompt =
      `You are an AI assistant for the NoteStream app.

Return ONLY valid JSON with these exact fields:
- "summary": string (2–3 sentences)
- "SmartHighlights": string[]
- "SmartTasks": string[]
- "SmartSchedule": string[]
- "sentiment": "positive" | "negative" | "neutral" | "mixed"
- "topics": string[]

No markdown. No backticks. No explanations.`;

    const userMessage =
      `Note Title: ${title || "Untitled"}

Note Content:
${truncatedBody}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);

      // Return status + truncated body so you can debug from curl
      return new Response(
        JSON.stringify({
          error: "Anthropic API request failed",
          status: response.status,
          details: errText.slice(0, 1200),
          fallback: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }


    const data = await response.json() as { content?: AnthropicBlock[] };

    const text = (data.content ?? [])
      .map((b) => (b.type === "text" ? (b as AnthropicTextBlock).text : ""))
      .filter(Boolean)
      .join("")
      .trim();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Empty AI response", fallback: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // If the model accidentally wraps JSON in fences, strip them
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed: AnalyzeResponse;
    try {
      parsed = JSON.parse(cleaned) as AnalyzeResponse;
    } catch {
      console.error("Invalid JSON from AI:", cleaned);
      return new Response(
        JSON.stringify({ error: "Invalid AI response", fallback: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const now = new Date().toISOString();

    const toStringArray = (v: unknown) =>
      Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 8) : [];

    const sentimentRaw = parsed.sentiment;
    const sentiment =
      sentimentRaw === "positive" ||
      sentimentRaw === "negative" ||
      sentimentRaw === "neutral" ||
      sentimentRaw === "mixed"
        ? sentimentRaw
        : "neutral";

    const result = {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      SmartHighlights: toStringArray(parsed.SmartHighlights),
      SmartTasks: toStringArray(parsed.SmartTasks),
      SmartSchedule: toStringArray(parsed.SmartSchedule),
      sentiment,
      topics: toStringArray(parsed.topics),
      generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : now,
      model: MODEL,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-note crash:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", fallback: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
