// supabase/functions/insight-query/index.ts
// ✅ Edge function for Insight Explorer — workspace-aware AI Q&A
// ✅ Same CORS pattern as analyze-note & summarize-document
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts";
import {
  activeModelName,
  callLLM,
  hasApiKey,
  providerLabel,
} from "../_shared/aiProvider.ts";

const MAX_CONTEXT_CHARS = 10000;

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

type QueryPayload = {
  query?: unknown;
  context?: unknown; // { name: string; content: string; type: string }[]
  conversationHistory?: unknown; // { role: "user"|"assistant"; content: string }[]
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SYSTEM_PROMPT = `You are the Insight Explorer AI for the NoteStream app.
You help users search, analyze, and understand their workspace documents and notes.

You receive the user's question along with context from their selected workspace files.
Provide clear, actionable answers based on the provided context.

Rules:
- Base your answers on the provided context when available
- Use **bold** for key terms and important items
- Use bullet points (•) for lists
- If the context doesn't contain enough info, say so honestly and suggest what the user could look for
- Keep answers concise but thorough (3-8 bullet points for lists, 2-4 sentences for summaries)
- When referencing specific files, mention them by name

Return ONLY valid JSON with these exact fields:
- "answer": string (your formatted response with **bold** and • bullets)
- "sources": string[] (names of the files/notes most relevant to the answer)
- "followUp": string[] (2-3 suggested follow-up questions, optional)

No markdown fences. No backticks wrapping the JSON. No explanations outside the JSON.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!hasApiKey()) {
      return jsonResponse({
        error: `${providerLabel()} API key not configured`,
        fallback: true,
      });
    }

    const payload: QueryPayload = await req.json().catch(() => ({}));

    const query = typeof payload.query === "string" ? payload.query.trim() : "";
    if (!query || query.length < 3) {
      return jsonResponse({ error: "Query too short", fallback: true });
    }

    // Build context from provided files/notes
    const contextItems = Array.isArray(payload.context) ? payload.context : [];
    let contextBlock = "";

    if (contextItems.length > 0) {
      const perItemLimit = Math.floor(MAX_CONTEXT_CHARS / contextItems.length);
      const sections = contextItems.map(
        (item: { name?: string; content?: string; type?: string }, i: number) => {
          const name = typeof item.name === "string" ? item.name : `Item ${i + 1}`;
          const type = typeof item.type === "string" ? item.type : "file";
          const content =
            typeof item.content === "string"
              ? item.content.slice(0, perItemLimit)
              : "";
          return `--- ${type}: ${name} ---\n${content || "(no content available)"}`;
        }
      );
      contextBlock = sections.join("\n\n");
    }

    // Build conversation history for multi-turn
    const history = Array.isArray(payload.conversationHistory)
      ? payload.conversationHistory
          .filter(
            (m: { role?: string; content?: string }) =>
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
          .slice(-6) // last 6 turns max
          .map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
      : [];

    // Build the user message
    const userMessage = contextBlock
      ? `Workspace context:\n${contextBlock}\n\nUser question: ${query}`
      : `User question: ${query}\n\n(No specific files selected — answer based on the question alone or suggest what the user could search for)`;

    // Build messages array with history
    const messages = [
      ...history,
      { role: "user" as const, content: userMessage },
    ];

    const llm = await callLLM({
      max_tokens: 1536,
      system: SYSTEM_PROMPT,
      messages,
    });

    if (!llm.ok) {
      return jsonResponse({
        error: `${providerLabel()} API request failed`,
        status: llm.status,
        details: llm.details,
        fallback: true,
      });
    }

    const data = { content: llm.content };

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
      // If the model didn't return valid JSON, wrap the raw text
      console.warn("AI returned non-JSON, wrapping:", cleaned.slice(0, 200));
      return jsonResponse({
        answer: cleaned,
        sources: [],
        followUp: [],
        model: activeModelName(),
      });
    }

    const result = {
      answer: typeof parsed.answer === "string" ? parsed.answer : cleaned,
      sources: Array.isArray(parsed.sources)
        ? parsed.sources.filter((s: unknown) => typeof s === "string").slice(0, 5)
        : [],
      followUp: Array.isArray(parsed.followUp)
        ? parsed.followUp.filter((s: unknown) => typeof s === "string").slice(0, 3)
        : [],
      model: activeModelName(),
    };

    return jsonResponse(result);
  } catch (err) {
    console.error("insight-query crash:", err);
    return jsonResponse({ error: "Internal error", fallback: true });
  }
});