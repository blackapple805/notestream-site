// src/pages/VoiceNotes.jsx
// Adds daily_usage tracking via useSubscription.incrementUsage("voiceTranscriptions")
// Calls increment when a transcription completes (stopRecording -> after transcription finishes)

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import {
  Microphone,
  Stop,
  Pause,
  Play,
  Trash,
  FloppyDisk,
  ArrowLeft,
  Clock,
  CheckCircle,
  PencilSimple,
  Copy,
  SpeakerHigh,
} from "phosphor-react";
import { FiX, FiCheck, FiTrash2, FiCopy } from "react-icons/fi";
import { useSubscription } from "../hooks/useSubscription";

export default function VoiceNotes() {
  const navigate = useNavigate();
  const { subscription, isFeatureUnlocked, incrementUsage } = useSubscription();

  const isPro = subscription.plan !== "free";
  const isUnlocked = isFeatureUnlocked("voice");

  // Redirect non-Pro users
  useEffect(() => {
    if (!isPro || !isUnlocked) {
      navigate("/dashboard/ai-lab");
    }
  }, [isPro, isUnlocked, navigate]);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformBars, setWaveformBars] = useState(Array(40).fill(0.15));

  // Transcription state
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [editedTranscription, setEditedTranscription] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Saved recordings (demo/local)
  const [recordings, setRecordings] = useState([
    {
      id: 1,
      title: "Meeting Notes - Q4 Planning",
      duration: 245,
      transcription:
        "Discussed Q4 goals including increasing user engagement by 25%. Key action items: redesign onboarding flow, implement new analytics dashboard, and launch referral program by end of October.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: "transcribed",
    },
    {
      id: 2,
      title: "Product Ideas Brainstorm",
      duration: 180,
      transcription:
        "Voice command integration could be huge. Users want hands-free note taking while driving or cooking. Also consider real-time collaboration features and better mobile experience.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: "transcribed",
    },
    {
      id: 3,
      title: "Quick Reminder",
      duration: 32,
      transcription:
        "Remember to follow up with the design team about the new dashboard layout before Friday's review meeting.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      status: "transcribed",
    },
  ]);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Refs for intervals + async safety
  const timerRef = useRef(null);
  const waveformRef = useRef(null);
  const transcribeTimeoutRef = useRef(null);
  const aliveRef = useRef(true);

  // Sample transcriptions for demo
  const sampleTranscriptions = [
    "This is a test recording to demonstrate the voice notes feature. The AI will automatically transcribe your speech into text that you can edit and save as a note.",
    "Meeting notes: We discussed the new product roadmap and decided to prioritize mobile features. The team will focus on improving performance and adding offline support.",
    "Quick reminder to review the quarterly report before tomorrow's presentation. Also need to schedule a follow-up call with the marketing team.",
    "Ideas for the new feature: implement drag and drop functionality, add keyboard shortcuts, and create a quick capture widget for the desktop.",
  ];

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format relative time
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);

    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const clearIntervals = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (waveformRef.current) {
      clearInterval(waveformRef.current);
      waveformRef.current = null;
    }
    if (transcribeTimeoutRef.current) {
      clearTimeout(transcribeTimeoutRef.current);
      transcribeTimeoutRef.current = null;
    }
  }, []);

  // Start recording
  const startRecording = () => {
    clearIntervals();

    setIsRecording(true);
    setIsPaused(false);
    setRecordingTime(0);
    setTranscription("");
    setEditedTranscription("");
    setIsEditing(false);

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    // Animate waveform
    waveformRef.current = setInterval(() => {
      setWaveformBars((prev) => prev.map(() => Math.random() * 0.85 + 0.15));
    }, 100);
  };

  // Pause recording
  const pauseRecording = () => {
    setIsPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveformRef.current) clearInterval(waveformRef.current);
    timerRef.current = null;
    waveformRef.current = null;

    setWaveformBars((prev) => prev.map((v) => v * 0.3));
  };

  // Resume recording
  const resumeRecording = () => {
    setIsPaused(false);

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    waveformRef.current = setInterval(() => {
      setWaveformBars((prev) => prev.map(() => Math.random() * 0.85 + 0.15));
    }, 100);
  };

  // Stop recording and transcribe
  const stopRecording = async () => {
    setIsRecording(false);
    setIsPaused(false);

    if (timerRef.current) clearInterval(timerRef.current);
    if (waveformRef.current) clearInterval(waveformRef.current);
    timerRef.current = null;
    waveformRef.current = null;

    setWaveformBars(Array(40).fill(0.15));

    // Simulate transcription
    setIsTranscribing(true);

    transcribeTimeoutRef.current = setTimeout(async () => {
      if (!aliveRef.current) return;

      const randomTranscription =
        sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];

      setTranscription(randomTranscription);
      setEditedTranscription(randomTranscription);
      setIsTranscribing(false);

      // ✅ Track a "voice transcription" usage AFTER successful transcription
      try {
        await incrementUsage("voiceTranscriptions");
      } catch {
        // incrementUsage already handles fallback; keep silent
      }
    }, 2500);
  };

  // Cancel recording
  const cancelRecording = () => {
    clearIntervals();
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setWaveformBars(Array(40).fill(0.15));
  };

  // Save as note (demo/local)
  const saveAsNote = () => {
    if (!editedTranscription.trim()) return;

    const newRecording = {
      id: Date.now(),
      title: noteTitle || `Voice Note - ${new Date().toLocaleString()}`,
      duration: recordingTime,
      transcription: editedTranscription,
      createdAt: new Date(),
      status: "transcribed",
    };

    setRecordings((prev) => [newRecording, ...prev]);
    setShowSaveModal(false);
    setNoteTitle("");
    setTranscription("");
    setEditedTranscription("");
    setRecordingTime(0);
    setIsEditing(false);
  };

  // Delete recording
  const deleteRecording = (id) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  // Copy transcription
  const copyTranscription = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Cleanup on unmount
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      clearIntervals();
    };
  }, [clearIntervals]);

  if (!isPro || !isUnlocked) {
    return null;
  }

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
      {/* Header */}
      <header className="pt-2 px-1">
        <button
          onClick={() => navigate("/dashboard/ai-lab")}
          className="flex items-center gap-2 text-theme-muted hover:text-theme-primary transition mb-3"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back to AI Lab</span>
        </button>

        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Microphone size={22} weight="fill" className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-theme-primary">
              Voice Notes
            </h1>
            <p className="text-theme-muted text-sm">
              Record and transcribe voice memos with AI
            </p>
          </div>
        </div>
      </header>

      {/* Recording Section */}
      <GlassCard className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <div className="flex flex-col items-center py-6">
          {/* Waveform Visualization */}
          <div className="flex items-center justify-center gap-[3px] h-20 w-full max-w-md mb-6">
            {waveformBars.map((height, i) => (
              <motion.div
                key={i}
                className={`w-1.5 rounded-full ${
                  isRecording && !isPaused
                    ? "bg-gradient-to-t from-purple-500 to-pink-500"
                    : "bg-purple-500/30"
                }`}
                animate={{ height: `${height * 100}%` }}
                transition={{ duration: 0.1 }}
                style={{ minHeight: "8px", maxHeight: "80px" }}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-4xl font-mono font-light text-theme-primary mb-6">
            {formatTime(recordingTime)}
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPaused ? "bg-amber-500" : "bg-rose-500 animate-pulse"
                }`}
              />
              <span className="text-sm text-theme-muted">
                {isPaused ? "Paused" : "Recording..."}
              </span>
            </div>
          )}

          {isTranscribing && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-theme-muted">
                Transcribing with AI...
              </span>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center gap-4">
            {!isRecording && !transcription && !isTranscribing && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition"
              >
                <Microphone size={28} weight="fill" className="text-white" />
              </motion.button>
            )}

            {isRecording && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={cancelRecording}
                  className="h-12 w-12 rounded-full bg-slate-600/50 flex items-center justify-center hover:bg-slate-600 transition"
                >
                  <Trash size={20} className="text-white" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  className="h-14 w-14 rounded-full bg-amber-500/80 flex items-center justify-center hover:bg-amber-500 transition"
                >
                  {isPaused ? (
                    <Play size={24} weight="fill" className="text-white ml-1" />
                  ) : (
                    <Pause size={24} weight="fill" className="text-white" />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopRecording}
                  className="h-16 w-16 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition"
                >
                  <Stop size={28} weight="fill" className="text-white" />
                </motion.button>
              </>
            )}
          </div>

          {!isRecording && !transcription && !isTranscribing && (
            <p className="text-xs text-theme-muted mt-4">Tap to start recording</p>
          )}
        </div>

        {/* Transcription Result */}
        {transcription && !isTranscribing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t pt-6 mt-2"
            style={{ borderColor: "var(--border-secondary)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} weight="fill" className="text-emerald-500" />
                <span className="text-sm font-medium text-emerald-500">
                  Transcription Complete
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`p-2 rounded-lg transition ${
                    isEditing
                      ? "bg-purple-500/20 text-purple-400"
                      : "hover:bg-white/5 text-theme-muted"
                  }`}
                >
                  <PencilSimple size={16} />
                </button>

                <button
                  onClick={() => copyTranscription(editedTranscription, "current")}
                  className="p-2 rounded-lg hover:bg-white/5 text-theme-muted transition"
                >
                  {copiedId === "current" ? (
                    <FiCheck size={16} className="text-emerald-400" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={editedTranscription}
                onChange={(e) => setEditedTranscription(e.target.value)}
                className="w-full h-32 p-3 rounded-xl border text-sm text-theme-primary resize-none outline-none focus:ring-2 focus:ring-purple-500/50"
                style={{
                  backgroundColor: "var(--bg-input)",
                  borderColor: "var(--border-secondary)",
                }}
              />
            ) : (
              <p
                className="text-sm text-theme-secondary leading-relaxed p-3 rounded-xl"
                style={{ backgroundColor: "var(--bg-input)" }}
              >
                {editedTranscription}
              </p>
            )}

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => {
                  setTranscription("");
                  setEditedTranscription("");
                  setRecordingTime(0);
                  setIsEditing(false);
                }}
                className="flex-1 py-2.5 rounded-xl border text-theme-muted font-medium text-sm hover:bg-white/5 transition"
                style={{ borderColor: "var(--border-secondary)" }}
              >
                Discard
              </button>

              <button
                onClick={() => setShowSaveModal(true)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition"
              >
                <FloppyDisk size={16} />
                Save as Note
              </button>
            </div>
          </motion.div>
        )}
      </GlassCard>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-theme-primary">{recordings.length}</p>
            <p className="text-xs text-theme-muted">Recordings</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-theme-primary">
              {formatTime(recordings.reduce((acc, r) => acc + r.duration, 0))}
            </p>
            <p className="text-xs text-theme-muted">Total Time</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-theme-primary">
              {recordings.reduce((acc, r) => acc + r.transcription.split(" ").length, 0)}
            </p>
            <p className="text-xs text-theme-muted">Words</p>
          </div>
        </GlassCard>
      </div>

      {/* Saved Recordings */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-theme-primary">Recent Recordings</h3>
          <span className="text-xs text-theme-muted">{recordings.length} total</span>
        </div>

        {recordings.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center mx-auto mb-4">
              <Microphone size={28} className="text-purple-400" />
            </div>
            <p className="text-sm text-theme-muted">No recordings yet</p>
            <p className="text-xs text-theme-muted mt-1">
              Start recording to see your voice notes here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recordings.map((recording) => (
              <motion.div
                key={recording.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border transition hover:bg-white/[0.02]"
                style={{
                  borderColor: "var(--border-secondary)",
                  backgroundColor: "var(--bg-input)",
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center">
                      <SpeakerHigh size={18} className="text-purple-400" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-theme-primary">
                        {recording.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-theme-muted">
                        <span>{formatTime(recording.duration)}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(recording.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyTranscription(recording.transcription, recording.id)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-theme-muted hover:text-theme-primary hover:bg-white/5 transition"
                    >
                      {copiedId === recording.id ? (
                        <FiCheck size={14} className="text-emerald-400" />
                      ) : (
                        <FiCopy size={14} />
                      )}
                    </button>

                    <button
                      onClick={() => deleteRecording(recording.id)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-theme-muted hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-theme-muted line-clamp-2 pl-[52px]">
                  {recording.transcription}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Save Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6 border"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-theme-primary">Save Voice Note</h2>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-primary transition"
                  style={{ backgroundColor: "var(--bg-tertiary)" }}
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-theme-muted mb-2 block">
                    Title
                  </label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Enter a title for your note..."
                    className="w-full px-4 py-3 rounded-xl border text-theme-primary placeholder:text-theme-muted outline-none focus:ring-2 focus:ring-purple-500/50 transition"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      borderColor: "var(--border-secondary)",
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-theme-muted mb-2 block">
                    Preview
                  </label>
                  <div
                    className="p-3 rounded-xl border text-sm text-theme-secondary max-h-32 overflow-y-auto"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      borderColor: "var(--border-secondary)",
                    }}
                  >
                    {editedTranscription}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-theme-muted">
                  <Clock size={14} />
                  <span>Duration: {formatTime(recordingTime)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-3 rounded-xl border text-theme-secondary font-medium text-sm hover:bg-white/5 transition"
                  style={{ borderColor: "var(--border-secondary)" }}
                >
                  Cancel
                </button>

                <button
                  onClick={saveAsNote}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition"
                >
                  <FloppyDisk size={16} />
                  Save Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
