// supabase/functions/rewrite-note/index.ts
// ─────────────────────────────────────────────────────────────────────
// REWRITE — rephrases a note's body in one of three modes without
// changing its meaning. Modes:
//   · "tighten"  — shorter, denser, fewer filler words
//   · "clarify"  — same length-ish, clearer structure and sentences
//   · "polish"   — fix flow, rhythm, transitions; light grammar pass
//
// Returns plain text (NOT JSON). The frontend shows the result in a
// diff modal and the user decides whether to commit it. Persisting
// here would silently overwrite the note before the user accepts —
// so this function deliberately does not write to the DB.
// ─────────────────────────────────────────────────────────────────────

// deno-lint-ignore no-import-prefix
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts";
import {
  activeModelName,
  callLLM,
  hasApiKey,
  providerLabel,
} from "../_shared/aiProvider.ts";

const MAX_INPUT_CHARS = 8000;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

type AnthropicTextBlock = { type: "text"; text: string };

type RewritePayload = {
  title?: unknown;
  body?: unknown;
  mode?: unknown;
};

type RewriteMode = "tighten" | "clarify" | "polish";

const MODE_INSTRUCTIONS: Record<RewriteMode, string> = {
  tighten:
    "TIGHTEN: cut filler words, redundancy, and throat-clearing. Keep every fact and idea. Aim for 25–40% shorter without losing nuance. Don't summarize — rewrite.",
  clarify:
    "CLARIFY: make every sentence easier to parse on first read. Break long sentences. Replace vague pronouns with their referents. Reorder clauses for logical flow. Keep roughly the same length.",
  polish:
    "POLISH: smooth transitions, fix awkward rhythm, repair light grammar and punctuation issues. Preserve the author's voice — do not flatten the style. Keep roughly the same length.",
};

function coerceMode(v: unknown): RewriteMode {
  if (v === "tighten" || v === "clarify" || v === "polish") return v;
  return "polish";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!hasApiKey()) {
      return new Response(
        JSON.stringify({
          error: `${providerLabel()} API key not configured`,
          fallback: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const payload: RewritePayload = await req.json().catch(() => ({}));

    const title = typeof payload.title === "string" ? payload.title : "Untitled";
    const body = typeof payload.body === "string" ? payload.body : "";
    const mode = coerceMode(payload.mode);

    if (!body.trim() || body.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Note body too short", fallback: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const truncatedBody = body.slice(0, MAX_INPUT_CHARS);

    // System prompt: we want plain rewritten prose, no commentary, no
    // markdown fences. The mode line at the bottom is the only thing
    // that differs between the three options.
    const systemPrompt = `You are a careful editor inside the NoteStream app.

Rewrite the user's note according to the mode instruction below.

Rules:
- Return ONLY the rewritten note body. No preface, no commentary, no "Here is...", no markdown code fences, no quotation marks around the whole output.
- Preserve paragraph breaks. If the original has 3 paragraphs, the output should have a similar number.
- Do not invent facts, names, dates, or details that aren't in the original.
- Do not change the author's first-person/third-person stance.
- Do not add or remove section headings.
- If the note is already excellent, return it nearly unchanged rather than forcing edits.

${MODE_INSTRUCTIONS[mode]}`;

    const userMessage = `Note Title: ${title || "Untitled"}

Note Body:
${truncatedBody}`;

    const llm = await callLLM({
      // Rewrites are usually similar length to the input. Token budget
      // generous enough to fit a full 8000-char input plus a little
      // headroom (≈2500 tokens at our ~3.2 chars/token average).
      max_tokens: 2600,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    if (!llm.ok) {
      return new Response(
        JSON.stringify({
          error: `${providerLabel()} API request failed`,
          status: llm.status,
          details: llm.details,
          fallback: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const text = (llm.content ?? [])
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

    // Strip code fences if the model wraps the output despite instructions,
    // and strip surrounding quotes if it adds those.
    let cleaned = text
      .replace(/^```(?:markdown|md|text)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    if (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))
    ) {
      cleaned = cleaned.slice(1, -1).trim();
    }

    return new Response(
      JSON.stringify({
        rewritten: cleaned,
        mode,
        model: activeModelName(),
        generatedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("rewrite-note crash:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", fallback: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
