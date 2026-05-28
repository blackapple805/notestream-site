// supabase/functions/expand-note/index.ts
// ─────────────────────────────────────────────────────────────────────
// EXPAND — develops the note further without changing its meaning or
// inventing wild new claims. Modes:
//   · "detail"   — flesh out thin sections with supporting detail
//   · "examples" — add concrete illustrations / examples where useful
//   · "context"  — add background/setup so a new reader follows along
//
// Like rewrite-note, this returns plain text and does NOT persist to
// the DB. The frontend shows the result in a diff modal and the user
// commits via the regular updateNote() path if they accept.
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

type ExpandPayload = {
  title?: unknown;
  body?: unknown;
  mode?: unknown;
};

type ExpandMode = "detail" | "examples" | "context";

const MODE_INSTRUCTIONS: Record<ExpandMode, string> = {
  detail:
    "ADD DETAIL: identify the 1–3 thinnest passages and develop them with supporting sentences that elaborate on what the author already said. Do not invent new arguments or claims. Stay close to the existing material.",
  examples:
    "ADD EXAMPLES: where the note makes a general claim, add a concrete illustration (a scenario, a brief anecdote, a specific case). Only add examples that are clearly consistent with what the author already wrote. If you can't think of one that fits, leave that section alone.",
  context:
    "ADD CONTEXT: assume a reader who is encountering the topic for the first time. Insert brief setup sentences that establish what is being discussed, why it matters, and what background a newcomer would need — without lecturing or padding.",
};

function coerceMode(v: unknown): ExpandMode {
  if (v === "detail" || v === "examples" || v === "context") return v;
  return "detail";
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

    const payload: ExpandPayload = await req.json().catch(() => ({}));

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

    const systemPrompt = `You are a careful collaborator inside the NoteStream app.

Expand the user's note according to the mode instruction below.

Rules:
- Return ONLY the expanded note body. No preface, no commentary, no "Here is...", no markdown code fences.
- Preserve paragraph breaks and the order of ideas. Insertions go where they fit best inside the existing flow.
- Match the author's voice: tone, perspective, vocabulary, sentence rhythm.
- Do not invent facts, names, dates, statistics, or external sources that aren't already in the original.
- Aim for roughly 30–70% longer than the input. Do not balloon to multiple times the length.
- Do not add bullet lists, headings, or other structural elements that weren't already there.

${MODE_INSTRUCTIONS[mode]}`;

    const userMessage = `Note Title: ${title || "Untitled"}

Note Body:
${truncatedBody}`;

    const llm = await callLLM({
      // Expand can grow the output up to ~1.7× the input, so we need
      // more headroom than rewrite. 4096 fits a maxed-out input plus
      // its 70% expansion comfortably.
      max_tokens: 4096,
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
        expanded: cleaned,
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
    console.error("expand-note crash:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", fallback: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
