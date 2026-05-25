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
  if (data.fallback) throw new Error(data.error || "AI unavailable");

  return data;
}
