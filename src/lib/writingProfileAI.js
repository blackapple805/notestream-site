// src/lib/writingProfileAI.js
// ✅ AI Writing Profile — calls writing-profile edge function
// ✅ Uses writing_profiles table (not user_engagement_stats)
// ✅ Two modes: analyze (build profile from notes) and suggest (write in user's style)
// ✅ Graceful fallback when AI is unavailable

import { supabase } from "./supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const NOTES_TABLE = "notes";
const PROFILES_TABLE = "writing_profiles";

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
    `${SUPABASE_URL}/functions/v1/writing-profile`,
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

// ─── DB helpers ────────────────────────────────────────────────

/**
 * Load the user's writing profile row from Supabase.
 */
export async function loadStoredProfile(userId) {
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // PGRST116 = no rows found — not an error, just no profile yet
      if (error.code === "PGRST116") return null;
      console.error("loadStoredProfile error:", error);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Upsert writing profile to Supabase.
 */
export async function saveProfile(userId, profileData, extras = {}) {
  if (!supabase || !userId) return;

  const row = {
    user_id: userId,
    profile_data: profileData,
    samples_count: extras.samplesCount ?? profileData?.samplesAnalyzed ?? 0,
    tokens_count: extras.tokensCount ?? profileData?.tokensProcessed ?? 0,
    confidence_score: extras.confidence ?? profileData?.confidenceScore ?? 0,
    last_trained_at: new Date().toISOString(),
    ...(extras.samples !== undefined ? { samples: extras.samples } : {}),
    ...(extras.userOverrides !== undefined ? { user_overrides: extras.userOverrides } : {}),
  };

  try {
    const { error } = await supabase
      .from(PROFILES_TABLE)
      .upsert(row, { onConflict: "user_id" });

    if (error) console.error("saveProfile error:", error);
  } catch (err) {
    console.warn("Failed to save writing profile:", err);
  }
}

// ─── Local fallback profile builder ────────────────────────────

function localBuildProfile(notes) {
  const totalWords = notes.reduce((sum, n) => {
    const body = typeof n.body === "string" ? n.body : "";
    return sum + body.split(/\s+/).filter(Boolean).length;
  }, 0);

  const avgWords = notes.length > 0 ? Math.round(totalWords / notes.length) : 0;

  return {
    toneProfile: {
      primary: "informative",
      secondary: "direct",
      formality: "semi-formal",
      energy: "medium",
    },
    vocabularyStats: {
      averageSentenceLength: 14,
      complexityLevel: "intermediate",
      favoriteWords: [],
      avoidedPatterns: [],
      jargonDomains: ["general"],
    },
    structurePatterns: {
      preferredFormat: "mixed",
      averageNoteLength: avgWords > 200 ? "long" : avgWords > 80 ? "medium" : "short",
      usesActionItems: true,
      usesHeaders: false,
      preferredListStyle: "bullets",
    },
    topicDistribution: [{ topic: "General", percentage: 100 }],
    writingHabits: {
      writesInFirstPerson: true,
      usesContractions: true,
      askQuestions: false,
      usesEmoji: false,
      capitalizationStyle: "standard",
    },
    strengthsAndWeaknesses: {
      strengths: [],
      areasForImprovement: [],
    },
    overallDescription: "Not enough data to build a complete profile yet.",
    confidenceScore: 0,
    samplesAnalyzed: notes.length,
    tokensProcessed: totalWords,
    model: "local-fallback",
    analyzedAt: new Date().toISOString(),
  };
}

// ─── Public API ────────────────────────────────────────────────

/**
 * Fetch user's notes and analyze their writing style via edge function.
 */
export async function analyzeWritingStyle(userId, existingProfile = null) {
  if (!supabase || !userId) throw new Error("Not authenticated");

  const { data: notes, error } = await supabase
    .from(NOTES_TABLE)
    .select("title, body")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  if (!notes || notes.length < 3) {
    throw new Error("Need at least 3 notes to build a writing profile. Keep writing!");
  }

  try {
    const result = await callEdgeFunction({
      mode: "analyze",
      notes: notes.map((n) => ({ title: n.title || "Untitled", body: n.body || "" })),
      existingProfile: existingProfile || undefined,
    });

    await saveProfile(userId, result);
    return result;
  } catch (err) {
    console.warn("AI writing analysis unavailable, using local fallback:", err);
    const fallback = localBuildProfile(notes);
    await saveProfile(userId, fallback);
    return fallback;
  }
}

/**
 * Analyze specific text samples (manual add) via edge function.
 */
export async function analyzeManualSamples(userId, samplesArray, existingProfile = null) {
  if (!supabase || !userId) throw new Error("Not authenticated");
  if (!samplesArray || samplesArray.length < 1) throw new Error("No samples provided");

  try {
    const result = await callEdgeFunction({
      mode: "analyze",
      notes: samplesArray.map((s, i) => ({
        title: s.title || `Sample ${i + 1}`,
        body: s.text || s.body || "",
      })),
      existingProfile: existingProfile || undefined,
    });
    return result;
  } catch (err) {
    console.warn("AI sample analysis unavailable:", err);
    return localBuildProfile(samplesArray.map((s) => ({ body: s.text || s.body || "" })));
  }
}

/**
 * Generate text in the user's writing style.
 */
export async function generateInStyle(profile, prompt) {
  if (!profile) throw new Error("No writing profile available");
  if (!prompt || prompt.trim().length < 5) throw new Error("Prompt too short");

  try {
    const result = await callEdgeFunction({
      mode: "suggest",
      profile,
      prompt: prompt.trim(),
    });
    return {
      generatedText: result.generatedText || "",
      styleMatchScore: result.styleMatchScore || 0,
      styleNotes: result.styleNotes || [],
    };
  } catch (err) {
    console.warn("AI style generation unavailable:", err);
    return {
      generatedText: `[AI unavailable] Here's a basic version:\n\n${prompt}`,
      styleMatchScore: 0,
      styleNotes: ["Fallback mode — AI credits needed for style matching"],
    };
  }
}

/**
 * Get a quick summary of the profile for display.
 */
export function getProfileSummary(profileData) {
  if (!profileData) return null;
  return {
    description: profileData.overallDescription || "No profile built yet.",
    confidence: profileData.confidenceScore || 0,
    samplesAnalyzed: profileData.samplesAnalyzed || 0,
    tokensProcessed: profileData.tokensProcessed || 0,
    tone: profileData.toneProfile?.primary || "unknown",
    formality: profileData.toneProfile?.formality || "unknown",
    complexity: profileData.vocabularyStats?.complexityLevel || "unknown",
    format: profileData.structurePatterns?.preferredFormat || "unknown",
    topTopics: (profileData.topicDistribution || []).slice(0, 5),
    strengths: profileData.strengthsAndWeaknesses?.strengths || [],
    improvements: profileData.strengthsAndWeaknesses?.areasForImprovement || [],
    favoriteWords: profileData.vocabularyStats?.favoriteWords || [],
    lastUpdated: profileData.analyzedAt || null,
    model: profileData.model || "unknown",
  };
}