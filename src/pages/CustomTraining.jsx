// src/pages/CustomTraining.jsx
import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import { useStyleProfile } from "../hooks/useStyleProfile";
import { useSubscription } from "../hooks/useSubscription";
import {
  Robot,
  Lightning,
  ArrowLeft,
  Trash,
  CheckCircle,
  WarningCircle,
  Info,
  Play,
  Sparkle,
  Crown,
  BookOpen,
  ChartBar,
  Sliders,
  FileText,
  Upload,
  Export,
  MagicWand,
  Target,
  Gauge,
  TreeStructure,
  TextAa,
  ChatCircleDots,
  ListBullets,
  Smiley,
} from "phosphor-react";
import {
  FiCheck,
  FiX,
  FiDownload,
  FiUpload,
  FiCopy,
  FiZap,
  FiRefreshCw,
  FiBookOpen,
  FiEdit3,
  FiSearch,
} from "react-icons/fi";

export default function CustomTraining() {
  const navigate = useNavigate();
  const { isFeatureUnlocked } = useSubscription();
  const {
    profile,
    samples,
    isLoading,
    isTraining,
    trainingStatus,
    addSample,
    trainFromNotes,
    runFullTraining,
    updateOverrides,
    resetProfile,
    deleteSample,
    exportProfile,
    importProfile,
    getStylePrompt,
  } = useStyleProfile();

  const [activeTab, setActiveTab] = useState("overview");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [toast, setToast] = useState(null);
  const [sampleText, setSampleText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Test generation states
  const [testPrompt, setTestPrompt] = useState("");
  const [testResult, setTestResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const mockPresets = useMemo(
    () => [
      "Write a short follow-up email after an interview.",
      "Summarize a meeting about deadlines and owners.",
      "Turn these notes into clear bullet points.",
      "Draft a friendly message to a recruiter on LinkedIn.",
    ],
    []
  );

  const toastTimerRef = useRef(null);
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const isUnlocked = isFeatureUnlocked("custom");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  const handleAddSample = () => {
    if (!sampleText.trim()) {
      showToast("Please enter some text", "error");
      return;
    }
    const result = addSample(sampleText, "manual");
    if (result?.success) {
      setSampleText("");
      showToast("Sample added and profile updated!");
    } else {
      showToast(result?.error || "Unable to add sample", "error");
    }
  };

  const handleTrainFromNotes = async () => {
    const result = await trainFromNotes();
    if (result?.success) {
      showToast(`Trained on ${result.notesProcessed} notes!`);
    } else {
      showToast(result?.error || "No notes found", "error");
    }
  };

  const handleExport = () => {
    const data = exportProfile();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notestream-style-profile-${new Date()
      .toISOString()
      .split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Profile exported!");
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      const result = importProfile(data);
      if (result?.success) {
        showToast("Profile imported!");
        setShowImportModal(false);
        setImportText("");
      } else {
        showToast(result?.error || "Import failed", "error");
      }
    } catch {
      showToast("Invalid JSON format", "error");
    }
  };

  const handleReset = () => {
    resetProfile();
    setShowResetConfirm(false);
    showToast("Profile reset to defaults");
  };

  const handleTestGeneration = async () => {
    if (!testPrompt.trim()) {
      showToast("Enter a test prompt", "error");
      return;
    }

    setIsGenerating(true);
    setTestResult("");

    // Simulate AI generation with style (in production, call your AI API)
    await new Promise((r) => setTimeout(r, 900));

    // Mock response based on profile
    let response = "";

    if ((profile?.tone?.formal || 0) > 40) {
      response =
        "Based on the provided context, I would recommend the following approach: ";
    } else if ((profile?.tone?.casual || 0) > 40) {
      response = "So here's what I'm thinking - ";
    } else {
      response = "Here's my take on this: ";
    }

    const promptLower = testPrompt.toLowerCase();
    response += promptLower.includes("meeting")
      ? "The meeting summary should focus on key decisions, owners, and deadlines."
      : promptLower.includes("email")
      ? "I'd suggest keeping the message concise while covering all essential points."
      : promptLower.includes("notes")
      ? "We can convert the notes into a clear structure with action items."
      : "This is a good opportunity to explore a few approaches and pick the cleanest one.";

    if ((profile?.structure?.bulletListUsage || 0) > 40) {
      response +=
        "\n\n• Key point one\n• Key point two\n• Final recommendation";
    }

    if (profile?.preferences?.useEmojis) {
      response += " 👍";
    }

    setTestResult(response);
    setIsGenerating(false);
  };

  const stylePrompt = useMemo(() => getStylePrompt(), [getStylePrompt, profile]);

  const filteredSamples = useMemo(() => {
    if (!searchQuery) return samples;
    const q = searchQuery.toLowerCase();
    return samples.filter((s) => (s.text || "").toLowerCase().includes(q));
  }, [samples, searchQuery]);

  // Lock screen for non-pro users
  if (!isUnlocked) {
    return (
      <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
        <header className="pt-2">
          <button
            onClick={() => navigate("/dashboard/ai-lab")}
            className="flex items-center gap-2 text-theme-muted hover:text-theme-primary transition mb-4"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to AI Lab</span>
          </button>
        </header>

        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mb-6">
            <Crown size={40} weight="duotone" className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-theme-primary mb-2">
            Pro Feature
          </h2>
          <p className="text-theme-muted max-w-md mb-6">
            Custom AI Training helps the AI learn your unique writing style for
            personalized responses.
          </p>
          <button
            onClick={() => navigate("/dashboard/ai-lab")}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium shadow-lg shadow-amber-500/25"
          >
            <Crown size={18} weight="fill" className="inline mr-2" />
            Upgrade to Pro
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[10000] px-4 py-3 rounded-full text-sm font-medium shadow-xl flex items-center gap-2 ${
              toast.type === "error"
                ? "bg-rose-500 text-white"
                : "bg-emerald-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <FiCheck size={16} />
            ) : (
              <FiX size={16} />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="pt-2">
        <button
          onClick={() => navigate("/dashboard/ai-lab")}
          className="flex items-center gap-2 text-theme-muted hover:text-theme-primary transition mb-4"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to AI Lab</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
            <Robot size={26} weight="duotone" className="text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-theme-primary">
              Custom AI Training
            </h1>
            <p className="text-theme-muted text-xs">
              Train AI to write in your unique style
            </p>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Samples"
          value={trainingStatus?.samplesCount ?? 0}
          icon={<FileText size={18} weight="duotone" />}
          color="indigo"
        />
        <StatCard
          label="Tokens"
          value={(trainingStatus?.tokensCount || 0).toLocaleString()}
          icon={<FiZap size={18} />}
          color="purple"
        />
        <StatCard
          label="Confidence"
          value={`${trainingStatus?.confidence ?? 0}%`}
          icon={<Gauge size={18} weight="duotone" />}
          color="emerald"
          progress={trainingStatus?.confidence ?? 0}
        />
        <StatCard
          label="Status"
          value={trainingStatus?.isReady ? "Ready" : "Training"}
          icon={
            trainingStatus?.isReady ? (
              <CheckCircle size={18} weight="fill" />
            ) : (
              <Lightning size={18} weight="fill" />
            )
          }
          color={trainingStatus?.isReady ? "emerald" : "amber"}
        />
      </div>

      {/* Low Confidence Banner */}
      {(trainingStatus?.confidence ?? 0) < 30 &&
        (trainingStatus?.confidence ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10"
          >
            <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Info size={18} className="text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                More training data needed
              </p>
              <p className="text-xs text-theme-muted">
                Add more writing samples to improve AI personalization
              </p>
            </div>
          </motion.div>
        )}

      {/* Tab Navigation */}
      <div
        className="flex gap-2 p-1.5 rounded-full overflow-x-auto"
        style={{ backgroundColor: "var(--bg-tertiary)" }}
      >
        {[
          { id: "overview", label: "Overview", icon: ChartBar },
          { id: "train", label: "Train", icon: Lightning },
          { id: "test", label: "Test", icon: MagicWand },
          { id: "samples", label: "Samples", icon: BookOpen },
          { id: "settings", label: "Settings", icon: Sliders },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                : "text-theme-muted hover:text-theme-primary"
            }`}
          >
            <tab.icon
              size={16}
              weight={activeTab === tab.id ? "fill" : "regular"}
            />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Tone Analysis */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <ChatCircleDots
                    size={16}
                    className="text-purple-500"
                    weight="duotone"
                  />
                </div>
                <h3 className="text-sm font-semibold text-theme-primary">
                  Tone Analysis
                </h3>
              </div>
              <div className="space-y-4">
                <ToneBar
                  label="Formality"
                  value={Math.round(profile?.metrics?.formalityScore || 0)}
                  color="indigo"
                  icon={<Target size={14} />}
                />
                <ToneBar
                  label="Brevity"
                  value={Math.round(profile?.metrics?.brevityScore || 0)}
                  color="sky"
                  icon={<Gauge size={14} />}
                />
                <ToneBar
                  label="Bullet usage"
                  value={Math.round((profile?.metrics?.bulletRate || 0) * 100)}
                  color="amber"
                  icon={<ListBullets size={14} />}
                />
                <ToneBar
                  label="Emoji usage"
                  value={Math.round((profile?.metrics?.emojiRate || 0) * 100)}
                  color="rose"
                  icon={<Smiley size={14} />}
                />
              </div>
            </GlassCard>

            {/* Writing Structure */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <TreeStructure
                    size={16}
                    className="text-indigo-500"
                    weight="duotone"
                  />
                </div>
                <h3 className="text-sm font-semibold text-theme-primary">
                  Writing Structure
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Avg Sentence"
                  value={`${Math.round(
                    profile?.metrics?.avgWordsPerSentence || 0
                  )} words`}
                  icon={<FiEdit3 size={14} />}
                />
                <MetricCard
                  label="Avg Paragraph"
                  value={`~${Math.round(
                    (profile?.metrics?.avgWordsPerSample || 0) /
                      (profile?.metrics?.avgWordsPerSentence || 14)
                  )} sentences`}
                  icon={<TextAa size={14} />}
                />
                <MetricCard
                  label="Bullet Usage"
                  value={`${Math.round(
                    (profile?.metrics?.bulletRate || 0) * 100
                  )}%`}
                  icon={<ListBullets size={14} />}
                />
                <MetricCard
                  label="Header Usage"
                  value={`${Math.round(
                    (profile?.metrics?.punctuationRate || 0) * 100
                  )}%`}
                  icon={<TreeStructure size={14} />}
                />
              </div>
            </GlassCard>

            {/* Vocabulary */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <TextAa
                    size={16}
                    className="text-emerald-500"
                    weight="duotone"
                  />
                </div>
                <h3 className="text-sm font-semibold text-theme-primary">
                  Vocabulary
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    profile?.vocabulary?.complexity === "advanced"
                      ? "bg-purple-500/20 text-purple-500"
                      : profile?.vocabulary?.complexity === "simple"
                      ? "bg-sky-500/20 text-sky-500"
                      : "bg-amber-500/20 text-amber-500"
                  }`}
                >
                  {profile?.vocabulary?.complexity || "moderate"}
                </span>
              </div>

              {profile?.vocabulary?.commonWords?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-theme-muted mb-2">Common Words</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.vocabulary.commonWords.slice(0, 12).map((word, i) => (
                      <span
                        key={`${word}-${i}`}
                        className="text-xs px-3 py-1.5 rounded-full border text-theme-secondary"
                        style={{
                          backgroundColor: "var(--bg-tertiary)",
                          borderColor: "var(--border-secondary)",
                        }}
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile?.vocabulary?.industryTerms?.length > 0 && (
                <div>
                  <p className="text-xs text-theme-muted mb-2">Industry Terms</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.vocabulary.industryTerms
                      .slice(0, 10)
                      .map((term, i) => (
                        <span
                          key={`${term}-${i}`}
                          className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30"
                        >
                          {term}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {!profile?.vocabulary?.commonWords?.length &&
                !profile?.vocabulary?.industryTerms?.length && (
                  <p className="text-sm text-theme-muted text-center py-4">
                    Add writing samples to analyze your vocabulary
                  </p>
                )}
            </GlassCard>

            {/* Generated Prompt */}
            {stylePrompt && (
              <GlassCard>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                      <Sparkle
                        size={16}
                        className="text-rose-500"
                        weight="fill"
                      />
                    </div>
                    <h3 className="text-sm font-semibold text-theme-primary">
                      AI Style Prompt
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(stylePrompt);
                      showToast("Copied!");
                    }}
                    className="p-2 rounded-lg hover:bg-theme-tertiary transition text-theme-muted"
                  >
                    <FiCopy size={16} />
                  </button>
                </div>
                <pre
                  className="text-xs text-theme-secondary whitespace-pre-wrap p-3 rounded-xl border overflow-x-auto"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border-secondary)",
                  }}
                >
                  {stylePrompt}
                </pre>
                <p className="text-[11px] text-theme-muted mt-2">
                  This prompt is automatically applied when generating AI content
                </p>
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* TRAIN */}
        {activeTab === "train" && (
          <motion.div
            key="train"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ActionCard
                title="Train from Notes"
                description="Analyze all your existing notes"
                icon={<FiBookOpen size={22} />}
                color="indigo"
                onClick={handleTrainFromNotes}
                loading={isTraining}
              />
              <ActionCard
                title="Import Profile"
                description="Load a previously exported profile"
                icon={<FiUpload size={22} />}
                color="purple"
                onClick={() => setShowImportModal(true)}
                loading={false}
              />
            </div>

            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Lightning
                    size={16}
                    className="text-amber-500"
                    weight="fill"
                  />
                </div>
                <h3 className="text-sm font-semibold text-theme-primary">
                  Add Writing Sample
                </h3>
              </div>
              <p className="text-xs text-theme-muted mb-3">
                Paste your writing to help the AI learn your style - emails,
                documents, notes, etc.
              </p>
              <textarea
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                placeholder="Paste your writing here..."
                rows={6}
                className="w-full rounded-xl px-4 py-3 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-amber-500/50 border resize-none"
                style={{
                  backgroundColor: "var(--bg-input)",
                  borderColor: "var(--border-secondary)",
                }}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-theme-muted">
                  {sampleText.split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  onClick={handleAddSample}
                  disabled={isTraining || !sampleText.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 text-white text-sm font-medium hover:bg-amber-400 transition disabled:opacity-50 shadow-lg shadow-amber-500/25"
                >
                  {isTraining ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Training...
                    </>
                  ) : (
                    <>
                      <Play size={16} weight="fill" />
                      Analyze &amp; Train
                    </>
                  )}
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* TEST (MOCK-FRIENDLY) */}
        {activeTab === "test" && (
          <motion.div
            key="test"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Mock banner */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-purple-500/25 bg-purple-500/10">
              <div className="h-9 w-9 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Info size={18} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-theme-primary">
                  Test is in mock mode
                </p>
                <p className="text-xs text-theme-muted">
                  This simulates output using your profile signals. Wire your real AI call later.
                </p>
              </div>
            </div>

            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <MagicWand
                    size={16}
                    className="text-purple-500"
                    weight="duotone"
                  />
                </div>
                <h3 className="text-sm font-semibold text-theme-primary">
                  Test Your Style
                </h3>
              </div>

              <p className="text-xs text-theme-muted mb-3">
                Pick a preset or type your own prompt.
              </p>

              {/* Presets */}
              <div className="flex flex-wrap gap-2 mb-4">
                {mockPresets.map((p) => (
                  <button
                    key={p}
                    onClick={() => setTestPrompt(p)}
                    className="text-xs px-3 py-1.5 rounded-full border hover:bg-white/5 transition"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      borderColor: "var(--border-secondary)",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    placeholder="e.g., Write a meeting summary about project deadlines"
                    className="w-full rounded-full px-5 py-3.5 pr-28 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-purple-500/50 border"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      borderColor: "var(--border-secondary)",
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleTestGeneration()}
                  />
                  <button
                    onClick={handleTestGeneration}
                    disabled={isGenerating || !testPrompt.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-full bg-purple-500 text-white text-sm font-medium hover:bg-purple-400 transition disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkle size={16} weight="fill" />
                    )}
                  </button>
                </div>

                {/* Always-visible output */}
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    borderColor: "var(--border-secondary)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle
                        size={16}
                        weight="fill"
                        className="text-emerald-500"
                      />
                      <span className="text-xs font-medium text-emerald-500">
                        {testResult ? "Generated with your style (mock)" : "Output (mock preview)"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setTestPrompt("");
                          setTestResult("");
                        }}
                        className="text-xs text-theme-muted hover:text-theme-primary transition"
                      >
                        Clear
                      </button>

                      <button
                        onClick={() => {
                          if (!testResult) return;
                          navigator.clipboard.writeText(testResult);
                          showToast("Copied!");
                        }}
                        disabled={!testResult}
                        className="text-xs text-purple-500 hover:text-purple-400 flex items-center gap-1 disabled:opacity-40"
                      >
                        <FiCopy size={12} /> Copy
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-wrap">
                    {testResult ||
                      "Type a prompt above and click the wand. This will show a mock response influenced by your current profile signals."}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Current style badges (safe access) */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-3">
                <Info size={16} className="text-theme-muted" />
                <h4 className="text-sm font-medium text-theme-secondary">
                  Current Style Applied
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {(profile?.tone?.formal || 0) > 35 && (
                  <StyleBadge label="Formal" color="indigo" />
                )}
                {(profile?.tone?.casual || 0) > 35 && (
                  <StyleBadge label="Casual" color="sky" />
                )}
                {(profile?.tone?.friendly || 0) > 35 && (
                  <StyleBadge label="Friendly" color="rose" />
                )}
                {(profile?.tone?.professional || 0) > 35 && (
                  <StyleBadge label="Professional" color="emerald" />
                )}
                {(profile?.structure?.bulletListUsage || 0) > 40 && (
                  <StyleBadge label="Uses Bullets" color="amber" />
                )}
                {!!profile?.preferences?.useEmojis && (
                  <StyleBadge label="Uses Emojis" color="purple" />
                )}
                {!profile && <StyleBadge label="Default" color="indigo" />}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* SAMPLES */}
        {activeTab === "samples" && (
          <motion.div
            key="samples"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="relative">
              <FiSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search samples..."
                className="w-full rounded-full pl-11 pr-4 py-3 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border"
                style={{
                  backgroundColor: "var(--bg-input)",
                  borderColor: "var(--border-secondary)",
                }}
              />
            </div>

            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-theme-primary">
                  Writing Samples ({filteredSamples.length})
                </h3>
                {samples.length > 0 && (
                  <button
                    onClick={() => runFullTraining()}
                    disabled={isTraining}
                    className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"
                  >
                    <FiRefreshCw
                      size={12}
                      className={isTraining ? "animate-spin" : ""}
                    />
                    Retrain All
                  </button>
                )}
              </div>

              {filteredSamples.length === 0 ? (
                <div className="text-center py-8">
                  <div className="h-14 w-14 rounded-full bg-theme-tertiary flex items-center justify-center mx-auto mb-3">
                    <BookOpen size={24} className="text-theme-muted" />
                  </div>
                  <p className="text-theme-muted text-sm">No samples yet</p>
                  <p className="text-theme-muted text-xs">
                    Add writing samples to train your AI
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredSamples.map((sample) => (
                    <motion.div
                      key={sample.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-xl p-3 border group hover:border-indigo-500/30 transition"
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        borderColor: "var(--border-secondary)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-theme-secondary line-clamp-2 flex-1">
                          {sample.text}
                        </p>
                        <button
                          onClick={() => deleteSample(sample.id)}
                          className="text-theme-muted hover:text-rose-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-tertiary text-theme-muted capitalize">
                          {sample.source}
                        </span>
                        <span className="text-[10px] text-theme-muted">
                          {sample.wordCount} words
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* SETTINGS */}
        {activeTab === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Sliders size={16} className="text-indigo-500" />
                </div>
                <h3 className="text-sm font-semibold text-theme-primary">
                  Preferences
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-theme-muted mb-2 block">
                    Preferred Tone
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["formal", "casual", "friendly", "professional"].map(
                      (tone) => (
                        <button
                          key={tone}
                          onClick={() =>
                            updateOverrides({
                              preferredTone:
                                profile?.userOverrides?.preferredTone === tone
                                  ? null
                                  : tone,
                            })
                          }
                          className={`px-4 py-2 rounded-full text-sm font-medium transition capitalize ${
                            profile?.userOverrides?.preferredTone === tone
                              ? "bg-indigo-600 text-white"
                              : "text-theme-secondary hover:bg-theme-tertiary border"
                          }`}
                          style={
                            profile?.userOverrides?.preferredTone !== tone
                              ? { borderColor: "var(--border-secondary)" }
                              : {}
                          }
                        >
                          {tone}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-theme-muted mb-2 block">
                    Custom Instructions
                  </label>
                  <textarea
                    value={profile?.userOverrides?.customInstructions || ""}
                    onChange={(e) =>
                      updateOverrides({ customInstructions: e.target.value })
                    }
                    placeholder="Add any specific instructions for the AI..."
                    rows={3}
                    className="w-full rounded-xl px-4 py-3 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border resize-none"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      borderColor: "var(--border-secondary)",
                    }}
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Export size={16} className="text-emerald-500" />
                </div>
                <h3 className="text-sm font-semibold text-theme-primary">
                  Data Management
                </h3>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleExport}
                  className="w-full flex items-center justify-between p-3 rounded-xl border hover:border-emerald-500/40 transition"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    borderColor: "var(--border-secondary)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <FiDownload className="text-emerald-500" size={18} />
                    <div className="text-left">
                      <p className="text-sm font-medium text-theme-primary">
                        Export Profile
                      </p>
                      <p className="text-xs text-theme-muted">Download as JSON</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border hover:border-purple-500/40 transition"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    borderColor: "var(--border-secondary)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Upload className="text-purple-500" size={18} />
                    <div className="text-left">
                      <p className="text-sm font-medium text-theme-primary">
                        Import Profile
                      </p>
                      <p className="text-xs text-theme-muted">Load from JSON</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border hover:border-rose-500/40 transition"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    borderColor: "var(--border-secondary)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Trash className="text-rose-500" size={18} />
                    <div className="text-left">
                      <p className="text-sm font-medium text-theme-primary">
                        Reset Profile
                      </p>
                      <p className="text-xs text-theme-muted">
                        Clear all training data
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </GlassCard>

            {trainingStatus?.lastTrainedAt && (
              <div className="text-xs text-theme-muted text-center">
                Last trained:{" "}
                {new Date(trainingStatus.lastTrainedAt).toLocaleString()}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <Modal onClose={() => setShowResetConfirm(false)}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <WarningCircle size={24} className="text-rose-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-theme-primary">
                  Reset Profile?
                </h3>
                <p className="text-sm text-theme-muted">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-theme-secondary mb-6">
              All training data and samples will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 rounded-full border text-theme-secondary font-medium hover:bg-white/5 transition"
                style={{ borderColor: "var(--border-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-full bg-rose-500 text-white font-medium hover:bg-rose-400 transition"
              >
                Reset
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <Modal onClose={() => setShowImportModal(false)}>
            <h3 className="text-lg font-semibold text-theme-primary mb-4">
              Import Profile
            </h3>
            <p className="text-sm text-theme-muted mb-4">
              Paste the JSON from an exported profile.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{"profile": {...}, "samples": [...]}'
              rows={8}
              className="w-full rounded-xl px-4 py-3 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-purple-500/50 border resize-none font-mono"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-secondary)",
              }}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 py-3 rounded-full border text-theme-secondary font-medium hover:bg-white/5 transition"
                style={{ borderColor: "var(--border-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="flex-1 py-3 rounded-full bg-purple-500 text-white font-medium hover:bg-purple-400 transition disabled:opacity-50"
              >
                Import
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============ COMPONENTS ============ */

function StatCard({ label, value, icon, color, progress }) {
  const colorClasses = {
    indigo:
      "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-500",
    purple:
      "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-500",
    emerald:
      "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-500",
    amber:
      "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-500",
  };
  const colors = colorClasses[color] || colorClasses.indigo;

  return (
    <div
      className="rounded-xl px-4 py-3 border"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-secondary)",
      }}
    >
      <div
        className={`h-8 w-8 rounded-lg bg-gradient-to-br ${colors} border flex items-center justify-center mb-2`}
      >
        {icon}
      </div>
      <p className="text-xl font-bold text-theme-primary">{value}</p>
      <p className="text-[10px] text-theme-muted">{label}</p>
      {progress !== undefined && (
        <div
          className="mt-2 h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--bg-tertiary)" }}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function ToneBar({ label, value, color, icon }) {
  const colorMap = {
    indigo: "from-indigo-500 to-indigo-400",
    sky: "from-sky-500 to-sky-400",
    rose: "from-rose-500 to-rose-400",
    emerald: "from-emerald-500 to-emerald-400",
    amber: "from-amber-500 to-amber-400",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-theme-muted">{icon}</span>
          <span className="text-xs font-medium text-theme-secondary">
            {label}
          </span>
        </div>
        <span className="text-xs font-semibold text-theme-primary">{value}%</span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--bg-tertiary)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`h-full rounded-full bg-gradient-to-r ${
            colorMap[color] || colorMap.indigo
          }`}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <div
      className="rounded-xl p-3 border text-center"
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--border-secondary)",
      }}
    >
      <div className="text-theme-muted mb-1">{icon}</div>
      <p className="text-sm font-semibold text-theme-primary">{value}</p>
      <p className="text-[10px] text-theme-muted">{label}</p>
    </div>
  );
}

function ActionCard({ title, description, icon, color, onClick, loading }) {
  const borderMap = {
    indigo: "border-indigo-500/30 hover:border-indigo-500/50",
    purple: "border-purple-500/30 hover:border-purple-500/50",
  };

  // IMPORTANT: avoid Tailwind dynamic class strings like `bg-${color}-...`
  // Use explicit mappings so Tailwind picks them up.
  const iconWrapMap = {
    indigo: "bg-indigo-500/20 border-indigo-500/30 text-indigo-500",
    purple: "bg-purple-500/20 border-purple-500/30 text-purple-500",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className={`p-4 rounded-xl border text-left transition disabled:opacity-50 ${
        borderMap[color] || borderMap.indigo
      }`}
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-secondary)",
      }}
    >
      <div
        className={`h-10 w-10 rounded-xl border flex items-center justify-center mb-3 ${
          iconWrapMap[color] || iconWrapMap.indigo
        }`}
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          icon
        )}
      </div>
      <h4 className="text-sm font-semibold text-theme-primary mb-1">{title}</h4>
      <p className="text-xs text-theme-muted">{description}</p>
    </motion.button>
  );
}

function StyleBadge({ label, color }) {
  const colorMap = {
    indigo:
      "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    sky: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
    rose: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    emerald:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    amber:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    purple:
      "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  };

  return (
    <span
      className={`text-xs px-3 py-1 rounded-full border ${
        colorMap[color] || colorMap.indigo
      }`}
    >
      {label}
    </span>
  );
}

function Modal({ children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-6 border"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-secondary)",
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

