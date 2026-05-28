// src/lib/edgeFunctions.js
// Shared helpers for calling Supabase Edge Functions via plain fetch().
//
// Why plain fetch() instead of supabase.functions.invoke()?
// The Supabase JS SDK auto-appends `x-supabase-client-platform` which causes
// CORS preflight failures in some browsers. Plain fetch sidesteps that.
//
// This module replaces near-identical `getAuthToken` + `callEdgeFunction`
// blocks that were duplicated in 5 lib files
// (noteAI, documentAI, insightAI, voiceAI, writingProfileAI).

import { supabase } from "./supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Get a usable auth token. Tries the current session, then a refresh,
 * and finally falls back to the anon key (so unauthenticated calls still work
 * when the edge function allows them).
 *
 * @returns {Promise<string>} bearer token
 */
export async function getAuthToken() {
  let token = null;

  if (supabase) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) token = session.access_token;
    } catch {
      /* ignore */
    }

    if (!token) {
      try {
        const {
          data: { session },
        } = await supabase.auth.refreshSession();
        if (session?.access_token) token = session.access_token;
      } catch {
        /* ignore */
      }
    }
  }

  return token || SUPABASE_ANON_KEY;
}

/**
 * POST a JSON payload to a Supabase Edge Function and return the parsed body.
 *
 * Throws on:
 *   - missing supabase env vars
 *   - non-2xx response
 *   - empty body
 *   - body marked `{ fallback: true }` (used by our edge functions to signal
 *     that they were unable to reach the AI provider; callers should catch
 *     and fall back to their local implementation)
 *
 * @param {string} endpoint  function name, e.g. "analyze-note"
 * @param {object} payload   JSON body
 * @returns {Promise<object>} parsed JSON response
 */
export async function callEdgeFunction(endpoint, payload) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase not configured");
  }

  const authToken = await getAuthToken();

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/${endpoint}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "Unknown error");
    throw new Error(`Edge function failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  if (!data) throw new Error("Empty response from Edge Function");

  // If the edge function signaled fallback, preserve the structured
  // error info (status code + provider details) so the caller can
  // distinguish rate-limit / quota / blocked vs generic failure.
  // Without this, every AI failure surfaces as the same opaque
  // "Gemini API request failed" message regardless of cause.
  if (data.fallback) {
    const status = Number(data.status) || 0;
    const details = typeof data.details === "string" ? data.details : "";

    // Detect rate-limit / quota issues. Gemini returns 429 with
    // RESOURCE_EXHAUSTED in the body; Anthropic returns 429 too.
    // We craft a user-readable message rather than dumping the raw
    // provider JSON into the UI.
    const isQuota =
      status === 429 ||
      /RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(details);

    if (isQuota) {
      const err = new Error(
        "The AI service is rate-limited right now. Free Gemini accounts get a limited number of requests per day. Try again in a few minutes, or switch the GEMINI_MODEL env var to gemini-2.0-flash (higher quota) on your Supabase project.",
      );
      err.code = "RATE_LIMIT";
      err.status = status;
      throw err;
    }

    // Generic fallback — include the first ~200 chars of provider
    // details so we can see what actually went wrong in the toast.
    const detailSnippet = details ? ` (${details.slice(0, 200)})` : "";
    throw new Error(`${data.error || "AI unavailable"}${detailSnippet}`);
  }

  return data;
}
