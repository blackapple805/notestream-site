// src/lib/voiceAI.js
// ✅ AI Voice Processing — calls transcribe-voice edge function
// ✅ Uses Web Speech API for real-time speech-to-text capture
// ✅ Sends raw text to edge function for cleanup + analysis
// ✅ Graceful fallback when AI is unavailable

import { supabase } from "./supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ─── Auth helper ───────────────────────────────────────────────

async function getAuthToken() {
  let token = null;
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) token = session.access_token;
    } catch { /* ignore */ }
    if (!token) {
      try {
        const { data: { session } } = await supabase.auth.refreshSession();
        if (session?.access_token) token = session.access_token;
      } catch { /* ignore */ }
    }
  }
  return token || SUPABASE_ANON_KEY;
}

// ─── Edge function caller ──────────────────────────────────────

async function callEdgeFunction(payload) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase not configured");
  }

  const authToken = await getAuthToken();

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/transcribe-voice`,
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
  if (!data) throw new Error("Empty response");
  if (data.fallback) throw new Error(data.error || "AI unavailable");
  return data;
}

// ─── Local fallback ────────────────────────────────────────────

function localProcessTranscription(rawText) {
  const sentences = rawText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  const actionKeywords = /\b(need to|should|must|todo|action|follow up|fix|review|send|submit|schedule|remember)\b/i;
  const actionItems = sentences
    .filter((s) => actionKeywords.test(s))
    .slice(0, 5);

  return {
    title: "Voice Note",
    cleanedText: rawText,
    actionItems,
    category: "general",
    summary: sentences.slice(0, 2).join(". ") + (sentences.length ? "." : ""),
    sentiment: "neutral",
    model: "local-fallback",
    processedAt: new Date().toISOString(),
  };
}

// ─── Web Speech API helper ─────────────────────────────────────

/**
 * Create a speech recognition session.
 * Returns an object with start/stop/onResult/onError methods.
 */
export function createSpeechRecognizer() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null; // browser doesn't support it
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  let finalTranscript = "";
  let interimTranscript = "";
  let onResultCallback = null;
  let onErrorCallback = null;
  let onEndCallback = null;

  recognition.onresult = (event) => {
    interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript + " ";
      } else {
        interimTranscript += result[0].transcript;
      }
    }
    if (onResultCallback) {
      onResultCallback({
        final: finalTranscript.trim(),
        interim: interimTranscript.trim(),
        combined: (finalTranscript + interimTranscript).trim(),
      });
    }
  };

  recognition.onerror = (event) => {
    if (onErrorCallback) onErrorCallback(event.error);
  };

  recognition.onend = () => {
    if (onEndCallback) onEndCallback(finalTranscript.trim());
  };

  return {
    start: () => {
      finalTranscript = "";
      interimTranscript = "";
      recognition.start();
    },
    stop: () => recognition.stop(),
    abort: () => recognition.abort(),
    onResult: (cb) => { onResultCallback = cb; },
    onError: (cb) => { onErrorCallback = cb; },
    onEnd: (cb) => { onEndCallback = cb; },
    getFinalTranscript: () => finalTranscript.trim(),
  };
}

// ─── Public API ────────────────────────────────────────────────

/**
 * Process raw transcribed text through AI for cleanup and analysis.
 * Falls back to local processing when AI is unavailable.
 *
 * @param {string} rawText - Raw transcription from Web Speech API
 * @param {string} [titleHint] - Optional title hint
 * @returns {object} Processed transcription result
 */
export async function processTranscription(rawText, titleHint = "") {
  if (!rawText || rawText.trim().length < 5) {
    return localProcessTranscription(rawText || "");
  }

  try {
    const result = await callEdgeFunction({
      rawText: rawText.trim(),
      title: titleHint || undefined,
    });
    return result;
  } catch (err) {
    console.warn("AI transcription processing unavailable, using local fallback:", err);
    return localProcessTranscription(rawText);
  }
}