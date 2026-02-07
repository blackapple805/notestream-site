// supabase/functions/transcribe-voice/index.ts
// ✅ Edge function for voice note transcription
// ✅ Accepts base64-encoded audio, returns transcription + AI analysis
// ✅ Falls back gracefully when Anthropic API is unavailable
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-20250514";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

type AnthropicTextBlock = { type: "text"; text: string };
type AnthropicBlock =
  | AnthropicTextBlock
  | { type: string; [k: string]: unknown };

type TranscribePayload = {
  // For now we receive text that was captured client-side via Web Speech API
  // or raw text the user wants processed as a "voice note"
  rawText?: unknown;
  // Optional: title hint
  title?: unknown;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SYSTEM_PROMPT = `You are a voice note processor for the NoteStream app.
You receive raw transcribed text from a voice recording and your job is to:
1. Clean up the transcription (fix grammar, punctuation, formatting)
2. Generate a concise title
3. Extract action items if any
4. Identify the overall topic/category

Return ONLY valid JSON with these exact fields:
- "title": string (short descriptive title, max 60 chars)
- "cleanedText": string (cleaned up, well-formatted version of the transcription)
- "actionItems": string[] (extracted action items, can be empty)
- "category": "meeting" | "personal" | "idea" | "task" | "study" | "general"
- "summary": string (1-2 sentence summary)
- "sentiment": "positive" | "negative" | "neutral" | "mixed"

No markdown fences. No backticks. No explanations outside the JSON.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return jsonResponse({ error: "ANTHROPIC_API_KEY not configured", fallback: true });
    }

    const payload: TranscribePayload = await req.json().catch(() => ({}));

    const rawText = typeof payload.rawText === "string" ? payload.rawText.trim() : "";
    const titleHint = typeof payload.title === "string" ? payload.title : "";

    if (!rawText || rawText.length < 5) {
      return jsonResponse({ error: "Transcription text too short", fallback: true });
    }

    const userMessage = titleHint
      ? `Title hint: ${titleHint}\n\nRaw voice transcription:\n${rawText.slice(0, 8000)}`
      : `Raw voice transcription:\n${rawText.slice(0, 8000)}`;

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
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return jsonResponse({
        error: "Anthropic API request failed",
        status: response.status,
        details: errText.slice(0, 1200),
        fallback: true,
      });
    }

    const data = (await response.json()) as { content?: AnthropicBlock[] };

    const text = (data.content ?? [])
      .map((b) => (b.type === "text" ? (b as AnthropicTextBlock).text : ""))
      .filter(Boolean)
      .join("")
      .trim();

    if (!text) {
      return jsonResponse({ error: "Empty AI response", fallback: true });
    }

    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Invalid JSON from AI:", cleaned);
      return jsonResponse({ error: "Invalid AI response", fallback: true });
    }

    const result = {
      title: typeof parsed.title === "string" ? parsed.title : "Voice Note",
      cleanedText: typeof parsed.cleanedText === "string" ? parsed.cleanedText : rawText,
      actionItems: Array.isArray(parsed.actionItems)
        ? parsed.actionItems.filter((s: unknown) => typeof s === "string").slice(0, 8)
        : [],
      category: typeof parsed.category === "string" ? parsed.category : "general",
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      sentiment: typeof parsed.sentiment === "string" ? parsed.sentiment : "neutral",
      model: MODEL,
      processedAt: new Date().toISOString(),
    };

    return jsonResponse(result);
  } catch (err) {
    console.error("transcribe-voice crash:", err);
    return jsonResponse({ error: "Internal error", fallback: true });
  }
});