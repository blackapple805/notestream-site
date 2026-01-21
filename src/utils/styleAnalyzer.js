// src/utils/styleAnalyzer.js

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const safeAvg = (arr) => {
  if (!arr || arr.length === 0) return 0;
  const sum = arr.reduce((a, b) => a + b, 0);
  return sum / arr.length;
};

const tokenize = (text) =>
  String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const splitSentences = (text) => {
  const t = String(text || "").trim();
  if (!t) return [];
  // Simple heuristic, good enough for mock training
  return t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
};

export function getDefaultProfile() {
  return {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    training: {
      confidence: 0, // 0-100
      samplesAnalyzed: 0,
      totalTokens: 0,
      lastTrainedAt: null,
    },

    metrics: {
      avgWordsPerSentence: 14,
      avgWordsPerSample: 80,
      punctuationRate: 0.12, // punctuation chars per token
      emojiRate: 0.0, // emoji per token
      questionRate: 0.05, // question marks per sentence
      exclamationRate: 0.02, // exclamation per sentence
      capitalizationRate: 0.08, // ALLCAPS tokens / tokens
      bulletRate: 0.1, // lines starting with bullets / lines
      formalityScore: 50, // heuristic 0-100
      brevityScore: 50, // heuristic 0-100
    },

    styleTags: {
      tone: "neutral", // neutral | casual | formal
      structure: "mixed", // mixed | bullets | paragraphs
      verbosity: "medium", // short | medium | long
    },

    userOverrides: {
      tone: null,
      structure: null,
      verbosity: null,
      preferredPhrases: [],
      avoidedPhrases: [],
    },

    settings: {
      autoTrain: true,
      includeNotesOnTrain: true,
      privacyMode: false,
    },
  };
}

export function analyzeWritingStyle(textSamples) {
  const samples = Array.isArray(textSamples) ? textSamples : [textSamples];
  const cleanSamples = samples
    .map((s) => String(s || "").trim())
    .filter((s) => s.length > 0);

  const allTokens = [];
  const sentenceWordCounts = [];
  let punctuationCount = 0;
  let emojiCount = 0;
  let questionCount = 0;
  let exclamationCount = 0;
  let capsCount = 0;
  let totalSentences = 0;

  let bulletLines = 0;
  let totalLines = 0;

  const emojiRegex =
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF])/g;

  for (const sample of cleanSamples) {
    const tokens = tokenize(sample);
    allTokens.push(...tokens);

    const sentences = splitSentences(sample);
    totalSentences += sentences.length;

    for (const s of sentences) {
      const wc = tokenize(s).length;
      if (wc > 0) sentenceWordCounts.push(wc);
      questionCount += (s.match(/\?/g) || []).length;
      exclamationCount += (s.match(/!/g) || []).length;
    }

    punctuationCount += (sample.match(/[.,;:!?]/g) || []).length;
    emojiCount += (sample.match(emojiRegex) || []).length;

    for (const t of tokens) {
      if (t.length >= 3 && t === t.toUpperCase() && /[A-Z]/.test(t)) {
        capsCount += 1;
      }
    }

    const lines = sample.split("\n");
    totalLines += lines.length;
    bulletLines += lines.filter((l) => /^\s*([-*•]|\d+\.)\s+/.test(l)).length;
  }

  const tokenCount = allTokens.length;
  const avgWordsPerSentence = sentenceWordCounts.length ? safeAvg(sentenceWordCounts) : 14;
  const avgWordsPerSample = cleanSamples.length
    ? safeAvg(cleanSamples.map((s) => tokenize(s).length))
    : 80;

  const punctuationRate = tokenCount ? punctuationCount / tokenCount : 0;
  const emojiRate = tokenCount ? emojiCount / tokenCount : 0;
  const capitalizationRate = tokenCount ? capsCount / tokenCount : 0;

  const questionRate = totalSentences ? questionCount / totalSentences : 0;
  const exclamationRate = totalSentences ? exclamationCount / totalSentences : 0;

  const bulletRate = totalLines ? bulletLines / totalLines : 0;

  // Heuristic scoring
  const formalityScore = clamp(
    50 +
      (punctuationRate * 120 - emojiRate * 200 - exclamationRate * 80) +
      (capitalizationRate * -60),
    0,
    100
  );

  const brevityScore = clamp(70 - avgWordsPerSentence * 2 - avgWordsPerSample * 0.15, 0, 100);

  // Tags
  const tone =
    formalityScore >= 65 ? "formal" : formalityScore <= 40 ? "casual" : "neutral";

  const structure =
    bulletRate >= 0.25 ? "bullets" : bulletRate <= 0.05 ? "paragraphs" : "mixed";

  const verbosity =
    avgWordsPerSample >= 180 ? "long" : avgWordsPerSample <= 70 ? "short" : "medium";

  // Confidence grows with tokens analyzed
  const confidence = clamp(Math.round((tokenCount / 900) * 100), 0, 100);

  return {
    training: {
      confidence,
      samplesAnalyzed: cleanSamples.length,
      totalTokens: tokenCount,
      lastTrainedAt: new Date().toISOString(),
    },
    metrics: {
      avgWordsPerSentence,
      avgWordsPerSample,
      punctuationRate,
      emojiRate,
      questionRate,
      exclamationRate,
      capitalizationRate,
      bulletRate,
      formalityScore,
      brevityScore,
    },
    styleTags: { tone, structure, verbosity },
  };
}

export function mergeProfiles(existingProfile, newAnalysis) {
  const base = existingProfile || getDefaultProfile();
  const now = new Date().toISOString();

  const prevN = base.training?.samplesAnalyzed || 0;
  const newN = newAnalysis?.training?.samplesAnalyzed || 0;
  const totalN = prevN + newN;

  const wPrev = totalN ? prevN / totalN : 0;
  const wNew = totalN ? newN / totalN : 1;

  const prevM = base.metrics || {};
  const newM = newAnalysis.metrics || {};

  const blended = (key, fallback) =>
    (prevM[key] ?? fallback) * wPrev + (newM[key] ?? fallback) * wNew;

  // Keep user overrides, they win later in prompt generation
  const merged = {
    ...base,
    updatedAt: now,
    training: {
      confidence: clamp(
        Math.round(
          (base.training?.confidence || 0) * wPrev + (newAnalysis.training?.confidence || 0) * wNew
        ),
        0,
        100
      ),
      samplesAnalyzed: totalN,
      totalTokens: (base.training?.totalTokens || 0) + (newAnalysis.training?.totalTokens || 0),
      lastTrainedAt: newAnalysis.training?.lastTrainedAt || base.training?.lastTrainedAt || now,
    },
    metrics: {
      avgWordsPerSentence: blended("avgWordsPerSentence", 14),
      avgWordsPerSample: blended("avgWordsPerSample", 80),
      punctuationRate: blended("punctuationRate", 0.12),
      emojiRate: blended("emojiRate", 0.0),
      questionRate: blended("questionRate", 0.05),
      exclamationRate: blended("exclamationRate", 0.02),
      capitalizationRate: blended("capitalizationRate", 0.08),
      bulletRate: blended("bulletRate", 0.1),
      formalityScore: blended("formalityScore", 50),
      brevityScore: blended("brevityScore", 50),
    },
    styleTags: {
      tone: newAnalysis.styleTags?.tone || base.styleTags?.tone || "neutral",
      structure: newAnalysis.styleTags?.structure || base.styleTags?.structure || "mixed",
      verbosity: newAnalysis.styleTags?.verbosity || base.styleTags?.verbosity || "medium",
    },
  };

  return merged;
}

export function generateStylePrompt(profile) {
  const p = profile || getDefaultProfile();
  const o = p.userOverrides || {};
  const tags = p.styleTags || {};
  const m = p.metrics || {};

  const tone = o.tone || tags.tone || "neutral";
  const structure = o.structure || tags.structure || "mixed";
  const verbosity = o.verbosity || tags.verbosity || "medium";

  const preferred = Array.isArray(o.preferredPhrases) ? o.preferredPhrases : [];
  const avoided = Array.isArray(o.avoidedPhrases) ? o.avoidedPhrases : [];

  const lines = [
    "You are writing in the user's personal style.",
    `Tone: ${tone}.`,
    `Structure: ${structure}.`,
    `Verbosity: ${verbosity}.`,
    `Avg words per sentence: ${Math.round(m.avgWordsPerSentence || 14)}.`,
    `Formality score: ${Math.round(m.formalityScore || 50)}/100.`,
    `Brevity score: ${Math.round(m.brevityScore || 50)}/100.`,
  ];

  if (preferred.length) lines.push(`Prefer phrases: ${preferred.slice(0, 8).join(", ")}.`);
  if (avoided.length) lines.push(`Avoid phrases: ${avoided.slice(0, 8).join(", ")}.`);

  return lines.join("\n");
}
