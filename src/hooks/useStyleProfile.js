// src/hooks/useStyleProfile.js
// ✅ Rewritten: Supabase writing_profiles table replaces localStorage
// ✅ Calls writing-profile edge function for AI analysis
// ✅ All values start at 0 for new users (no mock data)
// ✅ Same return interface — CustomTraining.jsx needs zero changes
// ✅ Removed: localStorage, styleAnalyzer imports

import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import {
  loadStoredProfile,
  saveProfile as dbSaveProfile,
  analyzeWritingStyle,
  analyzeManualSamples,
} from "../lib/writingProfileAI";

// ─── Defaults (everything starts at 0) ────────────────────────

function getDefaultProfile() {
  return {
    tone: { formal: 0, casual: 0, friendly: 0, professional: 0 },
    metrics: {
      formalityScore: 0,
      brevityScore: 0,
      bulletRate: 0,
      emojiRate: 0,
      avgWordsPerSentence: 0,
      avgWordsPerSample: 0,
      punctuationRate: 0,
    },
    structure: { bulletListUsage: 0, headerUsage: 0, avgParagraphLength: 0 },
    vocabulary: { complexity: "moderate", commonWords: [], industryTerms: [] },
    preferences: { useEmojis: false },
    userOverrides: { preferredTone: null, customInstructions: "" },
    settings: {
      enabled: true,
      learnFromNotes: true,
      learnFromDocuments: true,
      learnFromSummaries: false,
      autoUpdate: true,
    },
    training: {
      confidence: 0,
      samplesAnalyzed: 0,
      totalTokens: 0,
      lastTrainedAt: null,
    },
    _raw: null,
  };
}

// ─── Map AI edge-function response → UI shape ─────────────────

function mapAiProfileToUi(aiData, existingOverrides, existingSettings) {
  if (!aiData) return getDefaultProfile();

  const tone = aiData.toneProfile || {};
  const vocab = aiData.vocabularyStats || {};
  const structure = aiData.structurePatterns || {};
  const habits = aiData.writingHabits || {};

  const formalityMap = { formal: 80, "semi-formal": 55, casual: 25, mixed: 50 };
  const formalityScore = formalityMap[tone.formality] ?? 50;

  const energyMap = { high: 30, medium: 50, low: 75, varied: 50 };
  const brevityScore = energyMap[tone.energy] ?? 50;

  const bulletRate =
    structure.preferredListStyle === "bullets" ? 0.6
    : structure.preferredListStyle === "numbered" ? 0.4
    : structure.preferredListStyle === "none" ? 0
    : 0.2;

  const emojiRate = habits.usesEmoji ? 0.3 : 0;

  return {
    tone: {
      formal: formalityScore,
      casual: 100 - formalityScore,
      friendly: tone.primary === "friendly" || tone.secondary === "friendly" ? 70 : 30,
      professional: tone.primary === "professional" || tone.secondary === "professional" ? 70 : 40,
    },
    metrics: {
      formalityScore,
      brevityScore,
      bulletRate,
      emojiRate,
      avgWordsPerSentence: vocab.averageSentenceLength || 0,
      avgWordsPerSample:
        (aiData.tokensProcessed || 0) / Math.max(aiData.samplesAnalyzed || 1, 1),
      punctuationRate: structure.usesHeaders ? 0.12 : 0.04,
    },
    structure: {
      bulletListUsage: bulletRate * 100,
      headerUsage: structure.usesHeaders ? 12 : 0,
      avgParagraphLength:
        structure.averageNoteLength === "long" ? 6
        : structure.averageNoteLength === "medium" ? 4
        : 2,
    },
    vocabulary: {
      complexity: vocab.complexityLevel || "moderate",
      commonWords: vocab.favoriteWords || [],
      industryTerms: vocab.jargonDomains || [],
    },
    preferences: { useEmojis: !!habits.usesEmoji },
    userOverrides: existingOverrides || { preferredTone: null, customInstructions: "" },
    settings: existingSettings || {
      enabled: true,
      learnFromNotes: true,
      learnFromDocuments: true,
      learnFromSummaries: false,
      autoUpdate: true,
    },
    training: {
      confidence: aiData.confidenceScore || 0,
      samplesAnalyzed: aiData.samplesAnalyzed || 0,
      totalTokens: aiData.tokensProcessed || 0,
      lastTrainedAt: aiData.analyzedAt || new Date().toISOString(),
    },
    _raw: aiData,
  };
}

// ─── Hook ──────────────────────────────────────────────────────

export function useStyleProfile() {
  const [profile, setProfile] = useState(getDefaultProfile());
  const [samples, setSamples] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  const supabaseReady =
    typeof isSupabaseConfigured === "function"
      ? isSupabaseConfigured()
      : !!isSupabaseConfigured;

  // ─── Persist helper ──────────────────────────────────────────

  const persistToDb = useCallback(
    async (prof, samplesArr, overrides) => {
      if (!userId) return;
      const raw = prof?._raw || prof;
      await dbSaveProfile(userId, raw, {
        samples: samplesArr,
        samplesCount: samplesArr?.length ?? 0,
        tokensCount: raw?.tokensProcessed ?? prof?.training?.totalTokens ?? 0,
        confidence: raw?.confidenceScore ?? prof?.training?.confidence ?? 0,
        userOverrides: overrides ?? prof?.userOverrides,
      }).catch((err) => console.warn("persistToDb failed:", err));
    },
    [userId]
  );

  // ─── Load on mount ──────────────────────────────────────────

  const loadProfile = useCallback(async () => {
    if (!supabaseReady || !supabase) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) {
        setIsLoading(false);
        return;
      }
      setUserId(uid);

      const row = await loadStoredProfile(uid);

      if (row) {
        const pd = row.profile_data || {};
        const overrides =
          row.user_overrides && typeof row.user_overrides === "object"
            ? row.user_overrides
            : undefined;

        const mapped = mapAiProfileToUi(pd, overrides);

        // Restore training stats from DB columns (source of truth)
        mapped.training = {
          confidence: row.confidence_score || 0,
          samplesAnalyzed: row.samples_count || 0,
          totalTokens: row.tokens_count || 0,
          lastTrainedAt: row.last_trained_at || null,
        };

        setProfile(mapped);
        setSamples(Array.isArray(row.samples) ? row.samples : []);
      }
      // else: all defaults (0s) stay in place

      setError(null);
    } catch (err) {
      console.error("useStyleProfile load failed:", err);
      setError("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [supabaseReady]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ─── Add a writing sample ───────────────────────────────────

  const addSample = useCallback(
    (text, source = "manual", autoTrain = true) => {
      if (!text || text.trim().length < 20) {
        return { success: false, error: "Text too short (minimum 20 characters)" };
      }

      const wordCount = text.trim().split(/\s+/).length;
      const newSample = {
        id: `sample_${Date.now()}`,
        text: text.trim(),
        source,
        addedAt: new Date().toISOString(),
        wordCount,
      };

      const updated = [...samples, newSample].slice(-50);
      setSamples(updated);

      // Update training stats optimistically
      setProfile((prev) => ({
        ...prev,
        training: {
          ...prev.training,
          samplesAnalyzed: (prev.training.samplesAnalyzed || 0) + 1,
          totalTokens: (prev.training.totalTokens || 0) + wordCount,
        },
      }));

      // Persist samples to DB
      if (userId) {
        persistToDb(profile, updated, profile.userOverrides);
      }

      // Auto-train if requested
      if (autoTrain) {
        trainOnSamples([text]);
      }

      return { success: true, sample: newSample };
    },
    [samples, userId, profile, persistToDb]
  );

  // ─── Train on text samples (AI edge function) ───────────────

  const trainOnSamples = useCallback(
    async (textSamples) => {
      if (!textSamples || textSamples.length === 0) {
        return { success: false, error: "No samples provided" };
      }
      if (!userId) {
        return { success: false, error: "Not authenticated" };
      }

      setIsTraining(true);
      setError(null);

      try {
        const samplesForAi = textSamples.map((t, i) => ({
          title: `Sample ${i + 1}`,
          text: t,
        }));

        const aiResult = await analyzeManualSamples(
          userId,
          samplesForAi,
          profile._raw
        );

        const mapped = mapAiProfileToUi(
          aiResult,
          profile.userOverrides,
          profile.settings
        );

        setProfile(mapped);
        await persistToDb(mapped, samples, profile.userOverrides);

        return {
          success: true,
          profile: mapped,
          samplesProcessed: textSamples.length,
        };
      } catch (err) {
        console.error("Training failed:", err);
        setError("Training failed");
        return { success: false, error: err.message };
      } finally {
        setIsTraining(false);
      }
    },
    [userId, profile, samples, persistToDb]
  );

  // ─── Run full training on all stored samples ────────────────

  const runFullTraining = useCallback(async () => {
    if (samples.length === 0) {
      return { success: false, error: "No samples to train on" };
    }
    const textSamples = samples.map((s) => s.text);
    return trainOnSamples(textSamples);
  }, [samples, trainOnSamples]);

  // ─── Train from user's notes in Supabase ────────────────────

  const trainFromNotes = useCallback(async () => {
    if (!userId) {
      return { success: false, error: "Not authenticated", notesProcessed: 0 };
    }

    setIsTraining(true);
    setError(null);

    try {
      const existing = profile._raw || null;
      const aiResult = await analyzeWritingStyle(userId, existing);

      const mapped = mapAiProfileToUi(
        aiResult,
        profile.userOverrides,
        profile.settings
      );

      setProfile(mapped);
      await persistToDb(mapped, samples, profile.userOverrides);

      return {
        success: true,
        notesProcessed: aiResult.samplesAnalyzed || 0,
      };
    } catch (err) {
      console.error("Training from notes failed:", err);
      setError(err.message || "Failed to train from notes");
      return { success: false, error: err.message, notesProcessed: 0 };
    } finally {
      setIsTraining(false);
    }
  }, [userId, profile, samples, persistToDb]);

  // ─── Update user overrides ──────────────────────────────────

  const updateOverrides = useCallback(
    (overrides) => {
      const merged = { ...profile.userOverrides, ...overrides };
      const updated = { ...profile, userOverrides: merged };
      setProfile(updated);

      if (userId) persistToDb(updated, samples, merged);

      return { success: true, profile: updated };
    },
    [profile, userId, samples, persistToDb]
  );

  // ─── Update training settings ───────────────────────────────

  const updateTrainingSettings = useCallback(
    (settings) => {
      const updated = {
        ...profile,
        settings: { ...profile.settings, ...settings },
      };
      setProfile(updated);
      if (userId) persistToDb(updated, samples, profile.userOverrides);
      return { success: true };
    },
    [profile, userId, samples, persistToDb]
  );

  // ─── Reset profile ─────────────────────────────────────────

  const resetProfile = useCallback(async () => {
    setProfile(getDefaultProfile());
    setSamples([]);
    setError(null);

    if (userId && supabase) {
      try {
        await supabase
          .from("writing_profiles")
          .delete()
          .eq("user_id", userId);
      } catch (err) {
        console.error("resetProfile delete failed:", err);
      }
    }

    return { success: true };
  }, [userId]);

  // ─── Delete a sample ────────────────────────────────────────

  const deleteSample = useCallback(
    (sampleId) => {
      const removed = samples.find((s) => s.id === sampleId);
      const updated = samples.filter((s) => s.id !== sampleId);
      setSamples(updated);

      if (removed) {
        setProfile((prev) => ({
          ...prev,
          training: {
            ...prev.training,
            totalTokens: Math.max(
              0,
              (prev.training.totalTokens || 0) - (removed.wordCount || 0)
            ),
          },
        }));
      }

      if (userId) persistToDb(profile, updated, profile.userOverrides);

      return { success: true };
    },
    [samples, userId, profile, persistToDb]
  );

  // ─── Export / Import ────────────────────────────────────────

  const exportProfile = useCallback(() => {
    return {
      profile: profile._raw || profile,
      samples,
      overrides: profile.userOverrides,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };
  }, [profile, samples]);

  const importProfile = useCallback(
    (data) => {
      try {
        if (!data || typeof data !== "object") {
          return { success: false, error: "Invalid import data" };
        }

        const imported = data.profile || data;
        const importedSamples = Array.isArray(data.samples) ? data.samples : [];
        const importedOverrides = data.overrides || {};

        const mapped = mapAiProfileToUi(imported, {
          ...profile.userOverrides,
          ...importedOverrides,
        });

        setProfile(mapped);
        setSamples(importedSamples);

        if (userId) persistToDb(mapped, importedSamples, mapped.userOverrides);

        return { success: true };
      } catch {
        return { success: false, error: "Invalid import data" };
      }
    },
    [userId, profile.userOverrides, persistToDb]
  );

  // ─── Generate style prompt ─────────────────────────────────

  const getStylePrompt = useCallback(() => {
    const raw = profile._raw;
    if (!raw || !raw.overallDescription) return "";

    const parts = [`Writing style: ${raw.overallDescription}`];

    if (raw.toneProfile) {
      parts.push(
        `Tone: ${raw.toneProfile.primary || ""} / ${raw.toneProfile.secondary || ""}, formality: ${raw.toneProfile.formality || "mixed"}`
      );
    }

    if (raw.vocabularyStats?.favoriteWords?.length) {
      parts.push(`Frequently used words: ${raw.vocabularyStats.favoriteWords.join(", ")}`);
    }

    if (raw.structurePatterns) {
      parts.push(
        `Preferred format: ${raw.structurePatterns.preferredFormat || "mixed"}, list style: ${raw.structurePatterns.preferredListStyle || "bullets"}`
      );
    }

    if (profile.userOverrides?.preferredTone) {
      parts.push(`User prefers a ${profile.userOverrides.preferredTone} tone.`);
    }

    if (profile.userOverrides?.customInstructions) {
      parts.push(`Custom instructions: ${profile.userOverrides.customInstructions}`);
    }

    return parts.join("\n");
  }, [profile]);

  // ─── Derived ────────────────────────────────────────────────

  const isReady = profile && (profile.training?.confidence || 0) >= 20;

  const trainingStatus = {
    isReady: !!isReady,
    confidence: profile?.training?.confidence || 0,
    samplesCount: profile?.training?.samplesAnalyzed || 0,
    tokensCount: profile?.training?.totalTokens || 0,
    lastTrainedAt: profile?.training?.lastTrainedAt || null,
  };

  // ─── Return (same interface as original) ────────────────────

  return {
    profile,
    samples,
    isLoading,
    isTraining,
    error,
    isReady,
    trainingStatus,

    addSample,
    trainOnSamples,
    runFullTraining,
    trainFromNotes,
    updateOverrides,
    updateTrainingSettings,
    resetProfile,
    deleteSample,
    exportProfile,
    importProfile,
    getStylePrompt,
    loadProfile,
  };
}

export default useStyleProfile;