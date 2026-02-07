// supabase/functions/summarize-document/index.ts
// ✅ Edge function for AI document summaries & multi-doc synthesis
// ✅ Same CORS pattern as analyze-note (plain fetch friendly)
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-20250514";
const MAX_INPUT_CHARS = 12000;

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

// ---------- payload types ----------

type SummarizePayload = {
  mode?: unknown; // "summary" | "synthesis"
  // single-doc summary
  docName?: unknown;
  docContent?: unknown;
  // multi-doc synthesis
  documents?: unknown; // { name: string; content: string }[]
};

// ---------- prompts ----------

const SUMMARY_SYSTEM = `You are an AI assistant for the NoteStream app's Research Synthesizer.
You produce document summaries.

Return ONLY valid JSON with these exact fields:
- "summaryText": string (3-5 sentence executive summary)
- "keyInsights": string[] (3-6 bullet points)
- "actionPlan": { "priority": "Critical"|"High"|"Medium"|"Low", "title": string, "ownerHint": string, "effort": string, "dueHint": string }[] (2-5 items)
- "risks": string[] (2-4 items)

No markdown. No backticks. No explanations.`;

const SYNTHESIS_SYSTEM = `You are an AI assistant for the NoteStream app's Research Synthesizer.
You synthesize multiple documents into a unified research brief.

Return ONLY valid JSON with these exact fields:
- "executiveSummary": string (4-6 sentence unified summary)
- "keyThemes": { "theme": string, "frequency": "High"|"Medium"|"Low", "insight": string }[] (3-5 items)
- "consolidatedInsights": string[] (4-6 items)
- "unifiedActionPlan": { "priority": "Critical"|"High"|"Medium"|"Low", "action": string, "owners": string, "deadline": string }[] (3-5 items)
- "contradictions": { "topic": string, "conflict": string, "recommendation": string }[] (0-3 items, can be empty)
- "gaps": string[] (2-4 items)

No markdown. No backticks. No explanations.`;

// ---------- helpers ----------

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toStringArray(v: unknown, max = 8): string[] {
  return Array.isArray(v)
    ? v.filter((x) => typeof x === "string").slice(0, max)
    : [];
}

// ---------- handler ----------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return jsonResponse({ error: "ANTHROPIC_API_KEY not configured", fallback: true });
    }

    const payload: SummarizePayload = await req.json().catch(() => ({}));
    const mode = typeof payload.mode === "string" ? payload.mode : "summary";

    // =====================
    // MODE: single doc summary
    // =====================
    if (mode === "summary") {
      const docName =
        typeof payload.docName === "string" ? payload.docName : "Document";
      const docContent =
        typeof payload.docContent === "string" ? payload.docContent : "";

      if (!docContent.trim() || docContent.trim().length < 10) {
        return jsonResponse({ error: "Document content too short", fallback: true });
      }

      const truncated = docContent.slice(0, MAX_INPUT_CHARS);

      const userMessage = `Document Name: ${docName}\n\nDocument Content:\n${truncated}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1536,
          system: SUMMARY_SYSTEM,
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
        summaryText:
          typeof parsed.summaryText === "string" ? parsed.summaryText : "",
        keyInsights: toStringArray(parsed.keyInsights, 6),
        actionPlan: Array.isArray(parsed.actionPlan)
          ? parsed.actionPlan.slice(0, 5)
          : [],
        risks: toStringArray(parsed.risks, 4),
        meta: {
          generatedAt: new Date().toISOString(),
          model: MODEL,
        },
      };

      return jsonResponse(result);
    }

    // =====================
    // MODE: multi-doc synthesis
    // =====================
    if (mode === "synthesis") {
      const documents = Array.isArray(payload.documents)
        ? payload.documents
        : [];

      if (documents.length < 2) {
        return jsonResponse({ error: "Need at least 2 documents", fallback: true });
      }

      // Build combined content (truncate each doc)
      const perDocLimit = Math.floor(MAX_INPUT_CHARS / documents.length);
      const docSections = documents
        .map((d: { name?: string; content?: string }, i: number) => {
          const name = typeof d.name === "string" ? d.name : `Document ${i + 1}`;
          const content =
            typeof d.content === "string"
              ? d.content.slice(0, perDocLimit)
              : "";
          return `--- Document ${i + 1}: ${name} ---\n${content}`;
        })
        .join("\n\n");

      const userMessage = `Synthesize the following ${documents.length} documents into a unified research brief:\n\n${docSections}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2048,
          system: SYNTHESIS_SYSTEM,
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
        executiveSummary:
          typeof parsed.executiveSummary === "string"
            ? parsed.executiveSummary
            : "",
        keyThemes: Array.isArray(parsed.keyThemes)
          ? parsed.keyThemes.slice(0, 5)
          : [],
        consolidatedInsights: toStringArray(parsed.consolidatedInsights, 6),
        unifiedActionPlan: Array.isArray(parsed.unifiedActionPlan)
          ? parsed.unifiedActionPlan.slice(0, 5)
          : [],
        contradictions: Array.isArray(parsed.contradictions)
          ? parsed.contradictions.slice(0, 3)
          : [],
        gaps: toStringArray(parsed.gaps, 4),
        meta: {
          generatedAt: new Date().toISOString(),
          model: MODEL,
        },
      };

      return jsonResponse(result);
    }

    return jsonResponse({ error: `Unknown mode: ${mode}`, fallback: true });
  } catch (err) {
    console.error("summarize-document crash:", err);
    return jsonResponse({ error: "Internal error", fallback: true });
  }
});