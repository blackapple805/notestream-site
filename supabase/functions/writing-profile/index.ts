// supabase/functions/writing-profile/index.ts
// ✅ Edge function for Custom AI Training — analyzes user's writing style
// ✅ Two modes:
//    - "analyze": Analyze a batch of notes to build/update a writing profile
//    - "suggest": Given a profile + prompt, generate text in the user's style
import "jsr:@supabase/functions-js@^2/edge-runtime.d.ts";
import {
  activeModelName,
  callLLM,
  hasApiKey,
  providerLabel,
} from "../_shared/aiProvider.ts";

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

type ProfilePayload = {
  mode?: unknown; // "analyze" | "suggest"
  // analyze mode
  notes?: unknown; // { title: string; body: string }[]
  existingProfile?: unknown; // previous profile JSON (for incremental updates)
  // suggest mode
  profile?: unknown; // the stored profile
  prompt?: unknown; // what to write
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const ANALYZE_SYSTEM = `You are a writing style analyst for the NoteStream app.
You analyze a collection of user-written notes to build a detailed writing style profile.

Analyze the provided notes and return ONLY valid JSON with these exact fields:
- "toneProfile": { "primary": string, "secondary": string, "formality": "formal"|"semi-formal"|"casual"|"mixed", "energy": "high"|"medium"|"low"|"varied" }
- "vocabularyStats": { "averageSentenceLength": number, "complexityLevel": "advanced"|"intermediate"|"basic"|"mixed", "favoriteWords": string[], "avoidedPatterns": string[], "jargonDomains": string[] }
- "structurePatterns": { "preferredFormat": "bullets"|"paragraphs"|"mixed"|"headers", "averageNoteLength": "short"|"medium"|"long", "usesActionItems": boolean, "usesHeaders": boolean, "preferredListStyle": "bullets"|"numbered"|"dashes"|"none" }
- "topicDistribution": { "topic": string, "percentage": number }[] (top 5-8 topics)
- "writingHabits": { "writesInFirstPerson": boolean, "usesContractions": boolean, "askQuestions": boolean, "usesEmoji": boolean, "capitalizationStyle": "standard"|"all-caps-headers"|"lowercase"|"mixed" }
- "strengthsAndWeaknesses": { "strengths": string[], "areasForImprovement": string[] }
- "overallDescription": string (2-3 sentence natural language description of the user's writing style)
- "confidenceScore": number (0-100, how confident the analysis is based on sample size)
- "samplesAnalyzed": number
- "tokensProcessed": number (approximate)

No markdown. No backticks. No explanations outside the JSON.`;

const SUGGEST_SYSTEM = `You are a writing assistant for the NoteStream app.
You have been trained on the user's writing style profile and must write NEW content that matches their style exactly.

You will receive:
1. The user's writing style profile (JSON)
2. A prompt describing what to write

Write the content matching their tone, vocabulary, structure patterns, and habits as closely as possible.

Return ONLY valid JSON with these exact fields:
- "generatedText": string (the written content in the user's style)
- "styleMatchScore": number (0-100, how well this matches their profile)
- "styleNotes": string[] (2-3 brief notes about which style elements were applied)

No markdown fences. No backticks. No explanations outside the JSON.`;

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

    const payload: ProfilePayload = await req.json().catch(() => ({}));
    const mode = typeof payload.mode === "string" ? payload.mode : "analyze";

    // =====================
    // MODE: analyze — build writing profile from notes
    // =====================
    if (mode === "analyze") {
      const notes = Array.isArray(payload.notes) ? payload.notes : [];

      if (notes.length < 3) {
        return jsonResponse({ error: "Need at least 3 notes to analyze", fallback: true });
      }

      // Build content from notes
      const perNoteLimit = Math.floor(MAX_INPUT_CHARS / notes.length);
      const notesSample = notes
        .slice(0, 20) // max 20 notes
        .map((n: { title?: string; body?: string }, i: number) => {
          const title = typeof n.title === "string" ? n.title : `Note ${i + 1}`;
          const body = typeof n.body === "string" ? n.body.slice(0, perNoteLimit) : "";
          return `--- Note: ${title} ---\n${body}`;
        })
        .join("\n\n");

      let userMessage = `Analyze the following ${notes.length} notes to build a writing style profile:\n\n${notesSample}`;

      // If we have an existing profile, ask for incremental update
      if (payload.existingProfile && typeof payload.existingProfile === "object") {
        userMessage += `\n\n--- Existing Profile (update/refine this) ---\n${JSON.stringify(payload.existingProfile)}`;
      }

      const llm = await callLLM({
        // 4096 (was 2048) — Gemini is more verbose than Claude on this large
        // nested schema (toneProfile, vocabularyStats, structurePatterns, etc.)
        // and was truncating mid-object at 2048, producing invalid JSON.
        max_tokens: 4096,
        system: ANALYZE_SYSTEM,
        messages: [{ role: "user", content: userMessage }],
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
        console.error("Invalid JSON from AI:", cleaned);
        return jsonResponse({ error: "Invalid AI response", fallback: true });
      }

      const result = {
        ...parsed,
        model: activeModelName(),
        analyzedAt: new Date().toISOString(),
      };

      return jsonResponse(result);
    }

    // =====================
    // MODE: suggest — write in user's style
    // =====================
    if (mode === "suggest") {
      const profile = payload.profile;
      const prompt = typeof payload.prompt === "string" ? payload.prompt.trim() : "";

      if (!prompt || prompt.length < 5) {
        return jsonResponse({ error: "Prompt too short", fallback: true });
      }

      if (!profile || typeof profile !== "object") {
        return jsonResponse({ error: "No writing profile provided", fallback: true });
      }

      const userMessage = `User's writing style profile:\n${JSON.stringify(profile)}\n\nWrite this in the user's style:\n${prompt.slice(0, 2000)}`;

      const llm = await callLLM({
        // 2048 (was 1536) — give Gemini room for both the generated text
        // and the styleMatchScore + styleNotes JSON envelope.
        max_tokens: 2048,
        system: SUGGEST_SYSTEM,
        messages: [{ role: "user", content: userMessage }],
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
        return jsonResponse({
          generatedText: cleaned,
          styleMatchScore: 0,
          styleNotes: ["Could not parse structured response"],
          model: activeModelName(),
        });
      }

      return jsonResponse({
        generatedText: typeof parsed.generatedText === "string" ? parsed.generatedText : cleaned,
        styleMatchScore: typeof parsed.styleMatchScore === "number" ? parsed.styleMatchScore : 0,
        styleNotes: Array.isArray(parsed.styleNotes) ? parsed.styleNotes : [],
        model: activeModelName(),
      });
    }

    return jsonResponse({ error: `Unknown mode: ${mode}`, fallback: true });
  } catch (err) {
    console.error("writing-profile crash:", err);
    return jsonResponse({ error: "Internal error", fallback: true });
  }
});