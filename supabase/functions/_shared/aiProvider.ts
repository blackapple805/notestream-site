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

// Comma-separated list of models to try if the primary GEMINI_MODEL fails
// with a retryable error (overloaded / server hiccup). Default chain
// covers the 2025-12 free-tier reality where 2.5-flash gets 503'd often
// but 2.0-flash remains reliable. Override via env if you want a
// different order or to disable fallback entirely (set to empty string).
//
//   GEMINI_FALLBACK_MODELS=""                       → no fallback
//   GEMINI_FALLBACK_MODELS="gemini-2.0-flash"       → just one fallback
//   GEMINI_FALLBACK_MODELS="gemini-2.0-flash,gemini-1.5-flash"  → chain
const GEMINI_FALLBACK_MODELS = (
  Deno.env.get("GEMINI_FALLBACK_MODELS") ?? "gemini-2.0-flash,gemini-1.5-flash"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

// Full chain: primary first, then any fallbacks that aren't already the
// primary (avoid retrying the same model twice).
const GEMINI_MODEL_CHAIN = [
  GEMINI_MODEL,
  ...GEMINI_FALLBACK_MODELS.filter((m) => m !== GEMINI_MODEL),
];

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

  // ─── Multi-model fallback chain ──────────────────────────────────
  // Walk the configured model chain (primary → fallback1 → fallback2…).
  // If a model fails with a retryable error after exhausting its own
  // per-model retry budget, slide to the next model SILENTLY — the
  // user never sees an error, just gets a slightly slower response.
  //
  // The successful model's name is what comes back in the response
  // (parseGeminiSuccess returns whichever model actually answered),
  // so the UI badge accurately reflects what served the request —
  // not the originally-requested model.
  //
  // We only fall through to the next model on RETRYABLE failures
  // (overload, transient server errors). For non-retryable failures
  // (auth, malformed prompt, safety block), we return immediately
  // without burning the rest of the chain.

  const NON_RETRYABLE_STATUS = new Set([400, 401, 403, 429]);

  let lastResult: LLMResponse = {
    ok: false,
    status: 0,
    details: "No models configured in chain",
  };

  for (let i = 0; i < GEMINI_MODEL_CHAIN.length; i++) {
    const model = GEMINI_MODEL_CHAIN[i];
    const isLastInChain = i === GEMINI_MODEL_CHAIN.length - 1;

    const result = await callGeminiOnce(model, req);

    if (result.ok) {
      // Useful breadcrumb for debugging — shows in supabase function
      // logs which model actually served a given request. Only logs
      // when fallback kicked in (i > 0); the happy path stays quiet.
      if (i > 0) {
        console.log(
          `Gemini fallback succeeded: primary "${GEMINI_MODEL_CHAIN[0]}" → served by "${model}"`,
        );
      }
      return result;
    }

    lastResult = result;

    // Non-retryable error — don't waste the rest of the chain on a
    // problem retrying won't fix. Return immediately.
    if (NON_RETRYABLE_STATUS.has(result.status)) {
      return result;
    }

    if (!isLastInChain) {
      console.warn(
        `Gemini "${model}" failed (status ${result.status}), falling back to "${GEMINI_MODEL_CHAIN[i + 1]}"`,
      );
    }
  }

  // Whole chain exhausted. Surface the last error.
  return {
    ok: false,
    status: lastResult.status,
    details: `All Gemini models in fallback chain failed. Last error: ${lastResult.details}`,
  };
}

// One model attempt — internal helper. Has its own retry-with-backoff
// for transient blips on the SAME model (e.g. one 503 then it recovers).
// Returns the served model name on success so the caller can tell which
// fallback level actually answered.
async function callGeminiOnce(
  model: string,
  req: LLMRequest,
): Promise<LLMResponse> {
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
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
    `?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  // ─── Retry with exponential backoff (same-model) ──────────────────
  // Two attempts per model with a quick 700ms backoff. If both fail
  // we hand back to the chain loop which will switch models — and a
  // model swap fixes overload much more reliably than retrying the
  // overloaded model a third time. Total worst-case latency for a
  // 3-model chain (2 attempts each) is roughly:
  //   2.5-flash retry: ~6s + 700ms + ~6s = 12.7s
  //   2.0-flash retry: ~2s + 700ms + ~2s = 4.7s
  //   1.5-flash retry: ~2s + 700ms + ~2s = 4.7s
  // ~22s worst case before total failure — well under Supabase's
  // 60s edge function timeout, and ~99% of calls succeed on the
  // first attempt of the first model anyway.
  const MAX_ATTEMPTS = 2;
  const BACKOFF_MS = [700];
  const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);

  let lastStatus = 0;
  let lastDetails = "";

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let response: Response | null = null;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      lastStatus = 0;
      lastDetails =
        err instanceof Error ? err.message : "Network error contacting Gemini";
      console.warn(
        `Gemini "${model}" fetch failed (attempt ${attempt + 1}/${MAX_ATTEMPTS}):`,
        lastDetails,
      );
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(BACKOFF_MS[attempt]);
        continue;
      }
      break;
    }

    if (response.ok) {
      return await parseGeminiSuccess(response, model);
    }

    const errText = await response.text().catch(() => "Unknown error");
    lastStatus = response.status;
    lastDetails = errText;

    if (RETRYABLE_STATUS.has(response.status) && attempt < MAX_ATTEMPTS - 1) {
      console.warn(
        `Gemini "${model}" ${response.status} (attempt ${attempt + 1}/${MAX_ATTEMPTS}), retrying in ${BACKOFF_MS[attempt]}ms`,
      );
      await sleep(BACKOFF_MS[attempt]);
      continue;
    }

    // Out of attempts on this model, or non-retryable status. Return
    // — the outer chain loop decides whether to try another model.
    return {
      ok: false,
      status: response.status,
      details: errText.slice(0, 1200),
    };
  }

  return {
    ok: false,
    status: lastStatus,
    details:
      `Gemini "${model}" failed after ${MAX_ATTEMPTS} attempts. Last error: ${lastDetails.slice(0, 1000)}`,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Pulled out of the main flow so the retry loop above stays readable.
// Handles the "200 OK but the body is weird" cases — empty candidates,
// safety blocks, truncation — exactly as the previous inline code did.
// Takes the model name so the response carries the model that actually
// served the request (important when fallback kicked in — the UI badge
// should reflect what answered, not what was originally requested).
async function parseGeminiSuccess(
  response: Response,
  model: string,
): Promise<LLMResponse> {
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
      `Gemini "${model}" finishReason=${finishReason} — response may be truncated/blocked.`,
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
  // The model field reflects which model actually served the request —
  // this is what the UI badge will display.
  return {
    ok: true,
    model,
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
