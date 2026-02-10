// src/pages/VoiceNotes.jsx
// ✅ Real Web Speech API for live speech-to-text
// ✅ AI processing via transcribe-voice edge function (voiceAI.js)
// ✅ Saves recordings to Supabase voice_recordings table
// ✅ No mock data — starts empty, loads from DB

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import { createSpeechRecognizer, processTranscription } from "../lib/voiceAI";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
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
  Warning,
} from "phosphor-react";
import { FiX, FiCheck, FiTrash2, FiCopy } from "react-icons/fi";
import { useSubscription } from "../hooks/useSubscription";

const RECORDINGS_TABLE = "voice_recordings";

export default function VoiceNotes() {
  const navigate = useNavigate();
  const { subscription, isFeatureUnlocked, incrementUsage } = useSubscription();

  const isPro = subscription.plan !== "free";
  const isUnlocked = isFeatureUnlocked("voice");

  const supabaseReady =
    typeof isSupabaseConfigured === "function"
      ? isSupabaseConfigured()
      : !!isSupabaseConfigured;

  // Redirect non-Pro users
  useEffect(() => {
    if (!isPro || !isUnlocked) {
      navigate("/dashboard/ai-lab");
    }
  }, [isPro, isUnlocked, navigate]);

  // ─── Recording state ────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformBars, setWaveformBars] = useState(Array(40).fill(0.15));
  const [liveText, setLiveText] = useState("");

  // ─── Transcription state ────────────────────────────────────
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [editedTranscription, setEditedTranscription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [aiPayload, setAiPayload] = useState(null);

  // ─── Saved recordings (from DB) ─────────────────────────────
  const [recordings, setRecordings] = useState([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);

  // ─── Save modal ─────────────────────────────────────────────
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // ─── Browser support ────────────────────────────────────────
  const [browserSupported, setBrowserSupported] = useState(true);

  // ─── Refs ───────────────────────────────────────────────────
  const timerRef = useRef(null);
  const waveformRef = useRef(null);
  const recognizerRef = useRef(null);
  const aliveRef = useRef(true);

  // ─── Format helpers ─────────────────────────────────────────
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatRelativeTime = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000 / 60);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString();
  };

  // ─── Auth helper ────────────────────────────────────────────
  const getUser = useCallback(async () => {
    if (!supabaseReady || !supabase) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    } catch {
      return null;
    }
  }, [supabaseReady]);

  // ─── Load recordings from DB ────────────────────────────────
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!supabaseReady || !supabase) {
        if (alive) {
          setRecordings([]);
          setRecordingsLoading(false);
        }
        return;
      }

      const user = await getUser();
      if (!user || !alive) {
        if (alive) setRecordingsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from(RECORDINGS_TABLE)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!alive) return;

      if (error) {
        console.error("Load recordings error:", error);
        setRecordings([]);
      } else {
        setRecordings(
          (data || []).map((r) => ({
            id: r.id,
            title: r.title,
            duration: r.duration,
            transcription: r.transcription,
            createdAt: r.created_at,
            status: r.status,
            aiPayload: r.ai_payload,
          }))
        );
      }

      setRecordingsLoading(false);
    })();

    return () => { alive = false; };
  }, [supabaseReady, getUser]);

  // ─── Check browser support ──────────────────────────────────
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) setBrowserSupported(false);
  }, []);

  // ─── Cleanup on unmount ─────────────────────────────────────
  const clearIntervals = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (waveformRef.current) { clearInterval(waveformRef.current); waveformRef.current = null; }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      clearIntervals();
      if (recognizerRef.current) {
        try { recognizerRef.current.abort(); } catch {}
        recognizerRef.current = null;
      }
    };
  }, [clearIntervals]);

  // ─── Start recording (Web Speech API) ──────────────────────
  const startRecording = () => {
    clearIntervals();

    setIsRecording(true);
    setIsPaused(false);
    setRecordingTime(0);
    setTranscription("");
    setEditedTranscription("");
    setIsEditing(false);
    setLiveText("");
    setAiPayload(null);

    // Timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    // Waveform animation
    waveformRef.current = setInterval(() => {
      setWaveformBars((prev) => prev.map(() => Math.random() * 0.85 + 0.15));
    }, 100);

    // Speech recognition
    const recognizer = createSpeechRecognizer();
    if (!recognizer) {
      setBrowserSupported(false);
      setIsRecording(false);
      clearIntervals();
      return;
    }

    recognizerRef.current = recognizer;

    recognizer.onResult(({ combined }) => {
      setLiveText(combined);
    });

    recognizer.onError((err) => {
      console.warn("Speech recognition error:", err);
    });

    recognizer.start();
  };

  // ─── Pause recording ───────────────────────────────────────
  const pauseRecording = () => {
    setIsPaused(true);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (waveformRef.current) { clearInterval(waveformRef.current); waveformRef.current = null; }
    setWaveformBars((prev) => prev.map((v) => v * 0.3));

    // Stop recognition (will be restarted on resume)
    if (recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch {}
    }
  };

  // ─── Resume recording ──────────────────────────────────────
  const resumeRecording = () => {
    setIsPaused(false);

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    waveformRef.current = setInterval(() => {
      setWaveformBars((prev) => prev.map(() => Math.random() * 0.85 + 0.15));
    }, 100);

    // Restart recognition
    const recognizer = createSpeechRecognizer();
    if (recognizer) {
      recognizerRef.current = recognizer;
      recognizer.onResult(({ combined }) => {
        setLiveText((prev) => {
          // Append new text to what we had before pause
          const existing = prev ? prev + " " : "";
          return existing + combined;
        });
      });
      recognizer.start();
    }
  };

  // ─── Stop recording → AI transcription ─────────────────────
  const stopRecording = async () => {
    setIsRecording(false);
    setIsPaused(false);
    clearIntervals();
    setWaveformBars(Array(40).fill(0.15));

    // Get final text from speech recognizer
    let finalText = liveText || "";

    if (recognizerRef.current) {
      try {
        const recFinal = recognizerRef.current.getFinalTranscript();
        if (recFinal && recFinal.length > finalText.length) {
          finalText = recFinal;
        }
        recognizerRef.current.stop();
      } catch {}
      recognizerRef.current = null;
    }

    if (!finalText.trim()) {
      setTranscription("");
      setEditedTranscription("");
      return;
    }

    // Process through AI
    setIsTranscribing(true);

    try {
      const result = await processTranscription(finalText);

      if (!aliveRef.current) return;

      const cleaned = result?.cleanedText || finalText;
      setTranscription(cleaned);
      setEditedTranscription(cleaned);
      setAiPayload(result);

      // Set title suggestion from AI
      if (result?.title && result.title !== "Voice Note") {
        setNoteTitle(result.title);
      }

      // Track usage
      try { await incrementUsage("voiceTranscriptions"); } catch {}
    } catch (err) {
      console.warn("AI processing failed, using raw text:", err);
      if (!aliveRef.current) return;
      setTranscription(finalText);
      setEditedTranscription(finalText);
    } finally {
      if (aliveRef.current) setIsTranscribing(false);
    }
  };

  // ─── Cancel recording ──────────────────────────────────────
  const cancelRecording = () => {
    clearIntervals();
    if (recognizerRef.current) {
      try { recognizerRef.current.abort(); } catch {}
      recognizerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setLiveText("");
    setWaveformBars(Array(40).fill(0.15));
  };

  // ─── Save to Supabase ──────────────────────────────────────
  const saveAsNote = async () => {
    if (!editedTranscription.trim()) return;

    const user = await getUser();

    const newRecording = {
      title: noteTitle || `Voice Note - ${new Date().toLocaleString()}`,
      duration: recordingTime,
      transcription: editedTranscription,
      status: "transcribed",
      aiPayload: aiPayload || {},
      createdAt: new Date().toISOString(),
    };

    // Save to DB
    if (user && supabaseReady && supabase) {
      const { data, error } = await supabase
        .from(RECORDINGS_TABLE)
        .insert({
          user_id: user.id,
          title: newRecording.title,
          duration: newRecording.duration,
          transcription: newRecording.transcription,
          status: newRecording.status,
          ai_payload: newRecording.aiPayload,
          ai_model: aiPayload?.model || null,
        })
        .select("id, created_at")
        .single();

      if (!error && data) {
        newRecording.id = data.id;
        newRecording.createdAt = data.created_at;
      } else {
        console.error("Save recording error:", error);
        newRecording.id = `local-${Date.now()}`;
      }
    } else {
      newRecording.id = `local-${Date.now()}`;
    }

    setRecordings((prev) => [newRecording, ...prev]);
    setShowSaveModal(false);
    setNoteTitle("");
    setTranscription("");
    setEditedTranscription("");
    setRecordingTime(0);
    setIsEditing(false);
    setLiveText("");
    setAiPayload(null);
  };

  // ─── Delete recording ──────────────────────────────────────
  const deleteRecording = async (id) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));

    if (supabaseReady && supabase && typeof id === "string" && !id.startsWith("local-")) {
      const user = await getUser();
      if (user) {
        await supabase
          .from(RECORDINGS_TABLE)
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);
      }
    }
  };

  // ─── Copy transcription ────────────────────────────────────
  const copyTranscription = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── Guards ─────────────────────────────────────────────────
  if (!isPro || !isUnlocked) return null;

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

      {/* Browser Support Warning */}
      {!browserSupported && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <Warning size={20} className="text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-500">
              Speech recognition not supported
            </p>
            <p className="text-xs text-theme-muted">
              Try Chrome, Edge, or Safari for the best experience.
            </p>
          </div>
        </div>
      )}

      {/* Recording Section */}
      <GlassCard className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <div className="flex flex-col items-center py-6">
          {/* Waveform */}
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
          <div className="text-4xl font-mono font-light text-theme-primary mb-2">
            {formatTime(recordingTime)}
          </div>

          {/* Live Text Preview (while recording) */}
          {isRecording && liveText && (
            <div
              className="w-full max-w-md mb-4 p-3 rounded-xl text-sm text-theme-secondary max-h-24 overflow-y-auto"
              style={{ backgroundColor: "var(--bg-input)" }}
            >
              <p className="text-xs text-purple-400 mb-1 font-medium">Live transcription:</p>
              <p className="text-theme-secondary text-xs leading-relaxed">{liveText}</p>
            </div>
          )}

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
                Processing with AI...
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
                disabled={!browserSupported}
                className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

          {!isRecording && !transcription && !isTranscribing && browserSupported && (
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

            {/* AI Insights (if available) */}
            {aiPayload?.actionItems?.length > 0 && (
              <div className="mt-3 p-3 rounded-xl border" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-tertiary)" }}>
                <p className="text-xs font-medium text-theme-secondary mb-2">
                  Action Items Detected:
                </p>
                <ul className="space-y-1">
                  {aiPayload.actionItems.map((item, i) => (
                    <li key={i} className="text-xs text-theme-muted flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiPayload?.summary && (
              <div className="mt-2 p-3 rounded-xl border" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-tertiary)" }}>
                <p className="text-xs font-medium text-theme-secondary mb-1">AI Summary:</p>
                <p className="text-xs text-theme-muted">{aiPayload.summary}</p>
              </div>
            )}

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => {
                  setTranscription("");
                  setEditedTranscription("");
                  setRecordingTime(0);
                  setIsEditing(false);
                  setLiveText("");
                  setAiPayload(null);
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
              {formatTime(recordings.reduce((acc, r) => acc + (r.duration || 0), 0))}
            </p>
            <p className="text-xs text-theme-muted">Total Time</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-theme-primary">
              {recordings.reduce(
                (acc, r) => acc + (r.transcription || "").split(" ").filter(Boolean).length,
                0
              )}
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

        {recordingsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recordings.length === 0 ? (
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
                        <span>{formatTime(recording.duration || 0)}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(recording.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        copyTranscription(recording.transcription, recording.id)
                      }
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
            style={{
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
            }}
            onClick={() => setShowSaveModal(false)}
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-theme-primary">
                  Save Voice Note
                </h2>
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
                  {aiPayload?.category && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{aiPayload.category}</span>
                    </>
                  )}
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
