// supabase/functions/_shared/aiProvider.ts
// Provider-agnostic LLM helper.
//
// Why: the 5 edge functions (analyze-note, insight-query, summarize-document,
// transcribe-voice, writing-profile) all spoke directly to the Anthropic API
// with the same request/response shape. Switching providers used to mean
// editing 7 call sites. Now they just call `callLLM(...)` here.
//
// Default provider is "gemini" (Google AI Studio free tier — 1,500 req/day on
// gemini-2.0-flash, no credit card). Set AI_PROVIDER=anthropic to fall back
// to Claude. The function signature mimics Anthropic's so call sites that
// were already structured for Claude don't need rewriting.

const PROVIDER = (Deno.env.get("AI_PROVIDER") ?? "gemini").toLowerCase();

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.0-flash";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ANTHROPIC_MODEL =
  Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-20250514";

export type LLMTextBlock = { type: "text"; text: string };
export type LLMMessage = { role: "user" | "assistant"; content: string };

export type LLMRequest = {
  max_tokens: number;
  system: string;
  messages: LLMMessage[];
};

export type LLMResponse =
  | { ok: true; content: LLMTextBlock[]; model: string }
  | { ok: false; status: number; details: string };

/**
 * Returns true if a usable API key is configured for the active provider.
 * Call sites check this before doing work, mirroring the previous
 * `if (!ANTHROPIC_API_KEY)` guards.
 */
export function hasApiKey(): boolean {
  if (PROVIDER === "anthropic") return Boolean(ANTHROPIC_API_KEY);
  return Boolean(GEMINI_API_KEY);
}

/** Name of the active model — used to populate the `model` field in responses. */
export function activeModelName(): string {
  return PROVIDER === "anthropic" ? ANTHROPIC_MODEL : GEMINI_MODEL;
}

/** Human-readable provider label for log/error messages. */
export function providerLabel(): string {
  return PROVIDER === "anthropic" ? "Anthropic" : "Gemini";
}

/**
 * Single entry point used by every edge function. Mirrors the Anthropic
 * request shape and returns an Anthropic-shaped content array so the
 * existing `.map((b) => b.type === "text" ? b.text : "")` extraction code
 * in each function keeps working.
 */
export async function callLLM(req: LLMRequest): Promise<LLMResponse> {
  if (PROVIDER === "anthropic") {
    return await callAnthropic(req);
  }
  return await callGemini(req);
}

// ---------------------------------------------------------------------------
// Gemini implementation
// ---------------------------------------------------------------------------

async function callGemini(req: LLMRequest): Promise<LLMResponse> {
  if (!GEMINI_API_KEY) {
    return { ok: false, status: 500, details: "GEMINI_API_KEY not configured" };
  }

  // Gemini doesn't have a top-level `system` field the same way Claude does;
  // it uses `systemInstruction`. Roles are `user` / `model` instead of
  // `user` / `assistant`, and content is `parts: [{ text }]` instead of a
  // bare string.
  const contents = req.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body = {
    systemInstruction: { parts: [{ text: req.system }] },
    contents,
    generationConfig: {
      maxOutputTokens: req.max_tokens,
      // 0.3 (was 0.7) — most edge functions ask Gemini to return strict JSON
      // matching a schema. Lower temperature = far fewer "creative" deviations
      // like extra prose, missing commas, or truncated objects.
      temperature: 0.3,
    },
  };

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent` +
    `?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "Unknown error");
    console.error("Gemini API error:", response.status, errText);
    return {
      ok: false,
      status: response.status,
      details: errText.slice(0, 1200),
    };
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    promptFeedback?: { blockReason?: string };
  };

  // Safety block — surface as a soft error so the caller falls back.
  if (data.promptFeedback?.blockReason) {
    return {
      ok: false,
      status: 400,
      details: `Gemini blocked: ${data.promptFeedback.blockReason}`,
    };
  }

  // Surface truncation explicitly — a MAX_TOKENS finishReason means the JSON
  // schema didn't fit and downstream JSON.parse will fail. Better to log here
  // than to die later as a generic "Invalid AI response".
  const finishReason = data.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== "STOP") {
    console.warn(
      `Gemini finishReason=${finishReason} — response may be truncated/blocked.`,
    );
  }

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .filter(Boolean)
      .join("")
      .trim() ?? "";

  if (!text) {
    return { ok: false, status: 502, details: "Empty Gemini response" };
  }

  // Repackage as Anthropic-shaped content so call sites don't change.
  return {
    ok: true,
    model: GEMINI_MODEL,
    content: [{ type: "text", text }],
  };
}

// ---------------------------------------------------------------------------
// Anthropic implementation (kept for optional fallback / parity testing)
// ---------------------------------------------------------------------------

async function callAnthropic(req: LLMRequest): Promise<LLMResponse> {
  if (!ANTHROPIC_API_KEY) {
    return {
      ok: false,
      status: 500,
      details: "ANTHROPIC_API_KEY not configured",
    };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: req.max_tokens,
      system: req.system,
      messages: req.messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "Unknown error");
    console.error("Anthropic API error:", response.status, errText);
    return {
      ok: false,
      status: response.status,
      details: errText.slice(0, 1200),
    };
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const content: LLMTextBlock[] = (data.content ?? [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => ({ type: "text" as const, text: b.text as string }));

  if (content.length === 0) {
    return { ok: false, status: 502, details: "Empty Anthropic response" };
  }

  return { ok: true, model: ANTHROPIC_MODEL, content };
}
