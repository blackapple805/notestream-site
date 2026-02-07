// src/lib/writingProfileAI.js
// ✅ AI Writing Profile — calls writing-profile edge function
// ✅ Two modes: analyze (build profile from notes) and suggest (write in user's style)
// ✅ Stores profile in Supabase user_engagement_stats or a dedicated table
// ✅ Graceful fallback when AI is unavailable

import { supabase } from "./supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const NOTES_TABLE = "notes";
const STATS_TABLE = "user_engagement_stats";

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

// ─── Local fallback profile ────────────────────────────────────

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
      favoriteWords: ["need", "important", "review", "update", "plan"],
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
    topicDistribution: [
      { topic: "Work & Tasks", percentage: 40 },
      { topic: "Ideas", percentage: 25 },
      { topic: "Personal", percentage: 20 },
      { topic: "Research", percentage: 15 },
    ],
    writingHabits: {
      writesInFirstPerson: true,
      usesContractions: true,
      askQuestions: false,
      usesEmoji: false,
      capitalizationStyle: "standard",
    },
    strengthsAndWeaknesses: {
      strengths: ["Clear and concise", "Action-oriented"],
      areasForImprovement: ["Could use more structure", "Add more context"],
    },
    overallDescription:
      "Your writing style is direct and task-oriented, favoring concise bullet points and action items. You tend toward a semi-formal tone with practical, no-nonsense language.",
    confidenceScore: 35,
    samplesAnalyzed: notes.length,
    tokensProcessed: totalWords,
    model: "local-fallback",
    analyzedAt: new Date().toISOString(),
  };
}

// ─── Profile persistence ───────────────────────────────────────

/**
 * Load stored writing profile from Supabase.
 * Stored as JSON in user_engagement_stats.metadata or a dedicated column.
 */
export async function loadStoredProfile(userId) {
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from(STATS_TABLE)
      .select("metadata")
      .eq("user_id", userId)
      .single();

    if (error || !data?.metadata) return null;

    const meta = typeof data.metadata === "string"
      ? JSON.parse(data.metadata)
      : data.metadata;

    return meta?.writingProfile || null;
  } catch {
    return null;
  }
}

/**
 * Save writing profile to Supabase.
 */
export async function saveProfile(userId, profile) {
  if (!supabase || !userId || !profile) return;

  try {
    // Load existing metadata first
    const { data } = await supabase
      .from(STATS_TABLE)
      .select("metadata")
      .eq("user_id", userId)
      .single();

    const existingMeta = data?.metadata || {};
    const mergedMeta = {
      ...(typeof existingMeta === "object" ? existingMeta : {}),
      writingProfile: profile,
      writingProfileUpdatedAt: new Date().toISOString(),
    };

    await supabase
      .from(STATS_TABLE)
      .update({ metadata: mergedMeta, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
  } catch (err) {
    console.warn("Failed to save writing profile:", err);
  }
}

// ─── Public API ────────────────────────────────────────────────

/**
 * Fetch user's notes and analyze their writing style.
 * Returns a comprehensive writing profile.
 *
 * @param {string} userId
 * @param {object|null} existingProfile - Previous profile for incremental update
 * @returns {object} Writing style profile
 */
export async function analyzeWritingStyle(userId, existingProfile = null) {
  if (!supabase || !userId) {
    throw new Error("Not authenticated");
  }

  // Fetch user's notes
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
      notes: notes.map((n) => ({
        title: n.title || "Untitled",
        body: n.body || "",
      })),
      existingProfile: existingProfile || undefined,
    });

    // Save to DB
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
 * Generate text in the user's writing style.
 *
 * @param {object} profile - The user's writing profile
 * @param {string} prompt - What to write
 * @returns {{ generatedText: string, styleMatchScore: number, styleNotes: string[] }}
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
export function getProfileSummary(profile) {
  if (!profile) return null;

  return {
    description: profile.overallDescription || "No profile built yet.",
    confidence: profile.confidenceScore || 0,
    samplesAnalyzed: profile.samplesAnalyzed || 0,
    tokensProcessed: profile.tokensProcessed || 0,
    tone: profile.toneProfile?.primary || "unknown",
    formality: profile.toneProfile?.formality || "unknown",
    complexity: profile.vocabularyStats?.complexityLevel || "unknown",
    format: profile.structurePatterns?.preferredFormat || "unknown",
    topTopics: (profile.topicDistribution || []).slice(0, 5),
    strengths: profile.strengthsAndWeaknesses?.strengths || [],
    improvements: profile.strengthsAndWeaknesses?.areasForImprovement || [],
    favoriteWords: profile.vocabularyStats?.favoriteWords || [],
    lastUpdated: profile.analyzedAt || null,
    model: profile.model || "unknown",
  };
}