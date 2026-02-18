// src/pages/VoiceNotes.jsx
// ═══════════════════════════════════════════════════════════════════
// ✅ REAL audio capture via MediaRecorder + getUserMedia
// ✅ Real waveform from Web Audio AnalyserNode
// ✅ Audio saved to Supabase Storage (voice-recordings bucket)
// ✅ audio_url persisted in voice_recordings table
// ✅ Playback for saved recordings
// ✅ Web Speech API live speech-to-text
// ✅ AI processing via transcribe-voice edge function
// ✅ FIX: mic permission race condition resolved
// ✅ FIX: removed non-existent Phosphor export (Waveform/WaveformSlash)
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
const STORAGE_BUCKET = "voice-recordings";

/* ─── Scoped styles ───────────────────────────────────────── */
const VN_STYLES = `
@keyframes ns-vn-pulse { 0%,100% { opacity:.6; } 50% { opacity:1; } }
@keyframes ns-vn-float {
  0%,100% { transform: translateY(0) scale(1); }
  50%     { transform: translateY(-8px) scale(1.05); }
}
@keyframes ns-vn-ring {
  0%   { box-shadow: 0 0 0 0 rgba(168,85,247,0.4); }
  70%  { box-shadow: 0 0 0 16px rgba(168,85,247,0); }
  100% { box-shadow: 0 0 0 0 rgba(168,85,247,0); }
}
.ns-vn-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: var(--card-glass-bg, var(--bg-surface));
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--card-glass-border, var(--border-secondary));
  box-shadow: var(--card-glass-shadow, 0 8px 32px rgba(0,0,0,0.12));
}
.ns-vn-card::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%);
  pointer-events: none; z-index: 1;
}
.ns-vn-card::after {
  content: '';
  position: absolute;
  left: 24px; right: 24px; top: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
  pointer-events: none; z-index: 2;
}
.ns-vn-rec-btn {
  animation: ns-vn-float 3s ease-in-out infinite;
}
.ns-vn-rec-btn:hover { animation: none; }
.ns-vn-recording-ring { animation: ns-vn-ring 1.5s ease-out infinite; }
.ns-vn-stagger > * {
  animation: ns-vn-fadeUp 0.4s cubic-bezier(.22,1,.36,1) both;
}
@keyframes ns-vn-fadeUp {
  0%   { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
.ns-vn-stagger > *:nth-child(1) { animation-delay: 0.02s; }
.ns-vn-stagger > *:nth-child(2) { animation-delay: 0.06s; }
.ns-vn-stagger > *:nth-child(3) { animation-delay: 0.10s; }
.ns-vn-stagger > *:nth-child(4) { animation-delay: 0.14s; }
.ns-vn-stagger > *:nth-child(5) { animation-delay: 0.18s; }
`;

export default function VoiceNotes() {
  const navigate = useNavigate();
  const { subscription, isFeatureUnlocked, incrementUsage } = useSubscription();

  const isPro = subscription.plan !== "free";
  const isUnlocked = isFeatureUnlocked("voice");
  const supabaseReady =
    typeof isSupabaseConfigured === "function"
      ? isSupabaseConfigured()
      : !!isSupabaseConfigured;

  useEffect(() => {
    if (!isPro || !isUnlocked) navigate("/dashboard/ai-lab");
  }, [isPro, isUnlocked, navigate]);

  // ─── State machine ─────────────────────────────────────────
  // "idle" | "requesting" | "recording" | "paused" | "processing" | "done"
  const [recState, setRecState] = useState("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformBars, setWaveformBars] = useState(Array(40).fill(0.08));
  const [liveText, setLiveText] = useState("");

  const [transcription, setTranscription] = useState("");
  const [editedTranscription, setEditedTranscription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [aiPayload, setAiPayload] = useState(null);

  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [recordings, setRecordings] = useState([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [micError, setMicError] = useState(null);

  // ─── Refs ───────────────────────────────────────────────────
  const timerRef = useRef(null);
  const waveformRef = useRef(null);
  const recognizerRef = useRef(null);
  const aliveRef = useRef(true);
  const cancelledRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioElRef = useRef(null);

  // ─── Helpers ────────────────────────────────────────────────
  const fmt = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const fmtRelative = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    const diff = Math.floor((Date.now() - d) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString();
  };

  const getUser = useCallback(async () => {
    if (!supabaseReady || !supabase) return null;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.user || null;
    } catch {
      return null;
    }
  }, [supabaseReady]);

  // ─── Load recordings ───────────────────────────────────────
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
        console.error("Load error:", error);
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
            audioUrl: r.audio_url || null,
          }))
        );
      }
      setRecordingsLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [supabaseReady, getUser]);

  // ─── Cleanup helpers ───────────────────────────────────────
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (waveformRef.current) {
      cancelAnimationFrame(waveformRef.current);
      waveformRef.current = null;
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
      analyserRef.current = null;
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      clearTimers();
      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort();
        } catch {}
      }
      cleanupAudio();
    };
  }, [clearTimers, cleanupAudio]);

  // ─── Waveform loop ─────────────────────────────────────────
  const startWaveformLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const step = Math.floor(buf.length / 40);
    const loop = () => {
      if (!analyserRef.current) return;
      analyser.getByteFrequencyData(buf);
      const bars = [];
      for (let i = 0; i < 40; i++) bars.push(Math.max(0.06, buf[i * step] / 255));
      setWaveformBars(bars);
      waveformRef.current = requestAnimationFrame(loop);
    };
    waveformRef.current = requestAnimationFrame(loop);
  }, []);

  // ═══════════════════════════════════════════════════════════
  //  START — fixes the race condition
  // ═══════════════════════════════════════════════════════════
  const startRecording = async () => {
    setRecState("requesting");
    setMicError(null);
    setRecordingTime(0);
    setTranscription("");
    setEditedTranscription("");
    setIsEditing(false);
    setLiveText("");
    setAiPayload(null);
    setAudioBlob(null);
    cancelledRef.current = false;
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    audioChunksRef.current = [];

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
    } catch (err) {
      console.error("Mic denied:", err);
      setRecState("idle");
      setMicError(
        err?.name === "NotAllowedError"
          ? "Microphone access denied. Allow it in browser settings."
          : "Could not access microphone."
      );
      return;
    }

    if (!aliveRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    setRecState("recording");

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyserRef.current = analyser;
      startWaveformLoop();
    } catch {}

    try {
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      mediaRecorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data?.size > 0) audioChunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        if (!cancelledRef.current && audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, {
            type: rec.mimeType || "audio/webm",
          });
          setAudioBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
        }
      };
      rec.start(1000);
    } catch (err) {
      console.warn("MediaRecorder failed:", err);
    }

    timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);

    try {
      const r = createSpeechRecognizer();
      if (r) {
        recognizerRef.current = r;
        r.onResult(({ combined }) => setLiveText(combined));
        r.onError(() => {});
        r.start();
      }
    } catch {}
  };

  const pauseRecording = () => {
    setRecState("paused");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (waveformRef.current) {
      cancelAnimationFrame(waveformRef.current);
      waveformRef.current = null;
    }
    setWaveformBars((p) => p.map((v) => v * 0.25));
    if (mediaRecorderRef.current?.state === "recording") {
      try {
        mediaRecorderRef.current.pause();
      } catch {}
    }
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch {}
    }
  };

  const resumeRecording = () => {
    setRecState("recording");
    timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    startWaveformLoop();
    if (mediaRecorderRef.current?.state === "paused") {
      try {
        mediaRecorderRef.current.resume();
      } catch {}
    }
    try {
      const r = createSpeechRecognizer();
      if (r) {
        recognizerRef.current = r;
        r.onResult(({ combined }) =>
          setLiveText((p) => (p ? p + " " : "") + combined)
        );
        r.onError(() => {});
        r.start();
      }
    } catch {}
  };

  const stopRecording = async () => {
    clearTimers();
    setWaveformBars(Array(40).fill(0.08));

    if (mediaRecorderRef.current?.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    let finalText = liveText || "";
    if (recognizerRef.current) {
      try {
        const t = recognizerRef.current.getFinalTranscript();
        if (t && t.length > finalText.length) finalText = t;
        recognizerRef.current.stop();
      } catch {}
      recognizerRef.current = null;
    }

    if (!finalText.trim()) {
      setRecState("idle");
      return;
    }

    setRecState("processing");
    try {
      const result = await processTranscription(finalText);
      if (!aliveRef.current) return;
      const cleaned = result?.cleanedText || finalText;
      setTranscription(cleaned);
      setEditedTranscription(cleaned);
      setAiPayload(result);
      if (result?.title && result.title !== "Voice Note") setNoteTitle(result.title);
      try {
        await incrementUsage("voiceTranscriptions");
      } catch {}
    } catch {
      if (!aliveRef.current) return;
      setTranscription(finalText);
      setEditedTranscription(finalText);
    }
    if (aliveRef.current) setRecState("done");
  };

  const cancelRecording = () => {
    cancelledRef.current = true;
    clearTimers();
    if (recognizerRef.current) {
      try {
        recognizerRef.current.abort();
      } catch {}
      recognizerRef.current = null;
    }
    audioChunksRef.current = [];
    cleanupAudio();
    setRecState("idle");
    setRecordingTime(0);
    setLiveText("");
    setWaveformBars(Array(40).fill(0.08));
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const uploadAudio = async (blob, userId) => {
    if (!blob || !userId || !supabaseReady || !supabase) return null;
    try {
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(`${userId}/${Date.now()}.${ext}`, blob, {
          contentType: blob.type || "audio/webm",
          upsert: false,
        });
      if (error) return null;
      const { data: u } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
      return u?.publicUrl || null;
    } catch {
      return null;
    }
  };

  const saveAsNote = async () => {
    if (!editedTranscription.trim()) return;
    setIsUploading(true);
    const user = await getUser();
    let url = null;
    if (audioBlob && user) url = await uploadAudio(audioBlob, user.id);

    const rec = {
      title: noteTitle || `Voice Note - ${new Date().toLocaleString()}`,
      duration: recordingTime,
      transcription: editedTranscription,
      status: "transcribed",
      aiPayload: aiPayload || {},
      audioUrl: url,
      createdAt: new Date().toISOString(),
    };

    if (user && supabaseReady && supabase) {
      const { data, error } = await supabase
        .from(RECORDINGS_TABLE)
        .insert({
          user_id: user.id,
          title: rec.title,
          duration: rec.duration,
          transcription: rec.transcription,
          status: rec.status,
          ai_payload: rec.aiPayload,
          ai_model: aiPayload?.model || null,
          audio_url: url,
        })
        .select("id, created_at")
        .single();

      if (!error && data) {
        rec.id = data.id;
        rec.createdAt = data.created_at;
      } else rec.id = `local-${Date.now()}`;
    } else rec.id = `local-${Date.now()}`;

    setRecordings((p) => [rec, ...p]);
    setShowSaveModal(false);
    setNoteTitle("");
    setTranscription("");
    setEditedTranscription("");
    setRecordingTime(0);
    setIsEditing(false);
    setLiveText("");
    setAiPayload(null);
    setIsUploading(false);
    setAudioBlob(null);
    setRecState("idle");
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const deleteRecording = async (id) => {
    const r = recordings.find((x) => x.id === id);
    setRecordings((p) => p.filter((x) => x.id !== id));

    if (supabaseReady && supabase && typeof id === "string" && !id.startsWith("local-")) {
      const user = await getUser();
      if (user) {
        await supabase.from(RECORDINGS_TABLE).delete().eq("id", id).eq("user_id", user.id);
        if (r?.audioUrl) {
          try {
            const parts = new URL(r.audioUrl).pathname.split(`/${STORAGE_BUCKET}/`);
            if (parts[1]) await supabase.storage.from(STORAGE_BUCKET).remove([parts[1]]);
          } catch {}
        }
      }
    }

    if (playingId === id) {
      if (audioElRef.current) audioElRef.current.pause();
      audioElRef.current = null;
      setPlayingId(null);
    }
  };

  const togglePlayback = (r) => {
    if (!r.audioUrl) return;
    if (playingId === r.id) {
      if (audioElRef.current) audioElRef.current.pause();
      audioElRef.current = null;
      setPlayingId(null);
      return;
    }
    if (audioElRef.current) audioElRef.current.pause();
    const a = new Audio(r.audioUrl);
    audioElRef.current = a;
    setPlayingId(r.id);
    a.onended = () => {
      setPlayingId(null);
      audioElRef.current = null;
    };
    a.onerror = () => {
      setPlayingId(null);
      audioElRef.current = null;
    };
    a.play().catch(() => {
      setPlayingId(null);
      audioElRef.current = null;
    });
  };

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const discardResult = () => {
    setTranscription("");
    setEditedTranscription("");
    setRecordingTime(0);
    setIsEditing(false);
    setLiveText("");
    setAiPayload(null);
    setAudioBlob(null);
    setRecState("idle");
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  if (!isPro || !isUnlocked) return null;

  const isActive = recState === "recording" || recState === "paused";

  return (
    <>
      <style>{VN_STYLES}</style>
      <div className="space-y-5 pb-[calc(var(--mobile-nav-height)+24px)] ns-vn-stagger">
        {/* Header */}
        <header className="pt-1 px-1">
          <button
            onClick={() => navigate("/dashboard/ai-lab")}
            className="flex items-center gap-2 mb-3 transition"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={16} />
            <span className="text-[12px] font-medium">Back to AI Lab</span>
          </button>
          <div className="flex items-center gap-3">
            <div
              className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(236,72,153,0.12))",
                border: "1px solid rgba(168,85,247,0.28)",
              }}
            >
              <Microphone weight="duotone" size={22} className="text-purple-400" />
            </div>
            <div>
              <h1
                className="text-xl font-extrabold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Voice Notes
              </h1>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Record, transcribe & save with AI
              </p>
            </div>
          </div>
        </header>

        {/* Mic error */}
        {micError && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
              background: "rgba(244,63,94,0.06)",
              border: "1px solid rgba(244,63,94,0.2)",
            }}
          >
            <Warning size={18} weight="fill" style={{ color: "#f43f5e" }} />
            <div>
              <p className="text-[12px] font-semibold" style={{ color: "#f43f5e" }}>
                Microphone Error
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {micError}
              </p>
            </div>
            <button
              onClick={() => setMicError(null)}
              className="ml-auto"
              style={{ color: "var(--text-muted)" }}
            >
              <FiX size={14} />
            </button>
          </div>
        )}

        {/* ════ RECORDING CARD ════ */}
        <div
          className="ns-vn-card"
          style={{ borderColor: isActive ? "rgba(168,85,247,0.35)" : undefined }}
        >
          <div className="relative z-10 p-5 sm:p-6">
            <div className="flex flex-col items-center">
              {/* Waveform bars */}
              <div className="flex items-center justify-center gap-[3px] h-20 w-full max-w-md mb-5">
                {waveformBars.map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 rounded-full"
                    animate={{ height: `${h * 100}%` }}
                    transition={{ duration: 0.08 }}
                    style={{
                      minHeight: "6px",
                      maxHeight: "80px",
                      background: isActive
                        ? `linear-gradient(to top, rgba(168,85,247,${0.4 + h * 0.6}), rgba(236,72,153,${0.3 + h * 0.7}))`
                        : "rgba(168,85,247,0.18)",
                    }}
                  />
                ))}
              </div>

              {/* Timer */}
              <div
                className="text-4xl font-mono font-light mb-1 tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {fmt(recordingTime)}
              </div>

              {/* Live text */}
              {isActive && liveText && (
                <div
                  className="w-full max-w-md mt-3 mb-3 p-3 rounded-xl text-[11px] max-h-20 overflow-y-auto"
                  style={{
                    background: "var(--bg-input, var(--bg-tertiary))",
                    border: "1px solid var(--border-secondary)",
                  }}
                >
                  <p className="font-semibold mb-1" style={{ color: "#a855f7" }}>
                    Live:
                  </p>
                  <p style={{ color: "var(--text-secondary)" }}>{liveText}</p>
                </div>
              )}

              {/* Status */}
              {isActive && (
                <div className="flex items-center gap-2 mb-4 mt-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: recState === "paused" ? "#f59e0b" : "#f43f5e",
                      animation:
                        recState === "paused"
                          ? "none"
                          : "ns-vn-pulse 1.2s ease-in-out infinite",
                    }}
                  />
                  <span className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
                    {recState === "paused" ? "Paused" : "Recording…"}
                  </span>
                </div>
              )}
              {recState === "requesting" && (
                <div className="flex items-center gap-2 mb-4 mt-2">
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                    Requesting microphone…
                  </span>
                </div>
              )}
              {recState === "processing" && (
                <div className="flex items-center gap-2 mb-4 mt-2">
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                    AI is processing…
                  </span>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-4 mt-1">
                {recState === "idle" && !transcription && (
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={startRecording}
                    className="ns-vn-rec-btn h-[72px] w-[72px] rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #a855f7, #ec4899)",
                      boxShadow: "0 6px 24px rgba(168,85,247,0.35)",
                    }}
                  >
                    <Microphone size={30} weight="fill" className="text-white" />
                  </motion.button>
                )}

                {recState === "requesting" && (
                  <div
                    className="h-[72px] w-[72px] rounded-full flex items-center justify-center opacity-60"
                    style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}
                  >
                    <div className="w-7 h-7 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}

                {isActive && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={cancelRecording}
                      className="h-12 w-12 rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid var(--border-secondary)",
                      }}
                    >
                      <Trash size={18} style={{ color: "var(--text-muted)" }} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={recState === "paused" ? resumeRecording : pauseRecording}
                      className="h-14 w-14 rounded-full flex items-center justify-center"
                      style={{
                        background:
                          recState === "paused"
                            ? "linear-gradient(135deg, #a855f7, #8b5cf6)"
                            : "rgba(245,158,11,0.15)",
                        border: recState === "paused" ? "none" : "1px solid rgba(245,158,11,0.3)",
                      }}
                    >
                      {recState === "paused" ? (
                        <Play size={22} weight="fill" className="text-white ml-0.5" />
                      ) : (
                        <Pause size={22} weight="fill" style={{ color: "#f59e0b" }} />
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={stopRecording}
                      className="ns-vn-recording-ring h-16 w-16 rounded-full flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #f43f5e, #e11d48)",
                        boxShadow: "0 6px 24px rgba(244,63,94,0.35)",
                      }}
                    >
                      <Stop size={26} weight="fill" className="text-white" />
                    </motion.button>
                  </>
                )}
              </div>

              {recState === "idle" && !transcription && (
                <p className="text-[11px] mt-4" style={{ color: "var(--text-muted)" }}>
                  Tap to start recording
                </p>
              )}
            </div>

            {/* Audio preview */}
            {audioUrl && recState === "done" && transcription && (
              <div
                className="mt-4 p-3 rounded-xl flex items-center gap-3"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border-secondary)" }}
              >
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(168,85,247,0.12)",
                    border: "1px solid rgba(168,85,247,0.25)",
                  }}
                >
                  <SpeakerHigh size={14} className="text-purple-400" />
                </div>
                <audio controls src={audioUrl} className="flex-1 h-8" style={{ maxWidth: "100%" }} />
              </div>
            )}

            {/* Transcription result */}
            {transcription && recState === "done" && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 pt-5"
                style={{ borderTop: "1px solid var(--border-secondary)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={15} weight="fill" style={{ color: "#10b981" }} />
                    <span className="text-[12px] font-bold" style={{ color: "#10b981" }}>
                      Transcription Complete
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center transition"
                      style={{
                        background: isEditing ? "rgba(168,85,247,0.15)" : "transparent",
                        border: isEditing ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
                        color: isEditing ? "#a855f7" : "var(--text-muted)",
                      }}
                    >
                      <PencilSimple size={14} />
                    </button>
                    <button
                      onClick={() => copyText(editedTranscription, "current")}
                      className="h-7 w-7 rounded-lg flex items-center justify-center"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {copiedId === "current" ? (
                        <FiCheck size={14} style={{ color: "#10b981" }} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    value={editedTranscription}
                    onChange={(e) => setEditedTranscription(e.target.value)}
                    className="w-full h-28 p-3 rounded-xl text-[13px] resize-none outline-none"
                    style={{
                      background: "var(--bg-input)",
                      color: "var(--text-primary)",
                      border: "1px solid rgba(168,85,247,0.3)",
                    }}
                  />
                ) : (
                  <p
                    className="text-[13px] leading-relaxed p-3 rounded-xl"
                    style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}
                  >
                    {editedTranscription}
                  </p>
                )}

                {aiPayload?.actionItems?.length > 0 && (
                  <div
                    className="mt-3 p-3 rounded-xl"
                    style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)" }}
                  >
                    <p className="text-[11px] font-bold mb-2" style={{ color: "var(--text-secondary)" }}>
                      Action Items:
                    </p>
                    <ul className="space-y-1">
                      {aiPayload.actionItems.map((item, i) => (
                        <li
                          key={i}
                          className="text-[11px] flex items-start gap-2"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <span className="text-purple-400 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiPayload?.summary && (
                  <div
                    className="mt-2 p-3 rounded-xl"
                    style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)" }}
                  >
                    <p className="text-[11px] font-bold mb-1" style={{ color: "var(--text-secondary)" }}>
                      AI Summary:
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {aiPayload.summary}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={discardResult}
                    className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition"
                    style={{
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold text-white flex items-center justify-center gap-2 transition"
                    style={{
                      background: "linear-gradient(135deg, #a855f7, #ec4899)",
                      boxShadow: "0 4px 16px rgba(168,85,247,0.25)",
                    }}
                  >
                    <FloppyDisk size={14} /> Save Note
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Recordings", value: recordings.length },
            {
              label: "Total Time",
              value: fmt(recordings.reduce((a, r) => a + (r.duration || 0), 0)),
            },
            {
              label: "Words",
              value: recordings.reduce(
                (a, r) => a + (r.transcription || "").split(" ").filter(Boolean).length,
                0
              ),
            },
          ].map(({ label, value }) => (
            <div key={label} className="ns-vn-card">
              <div className="relative z-10 p-3 text-center">
                <p className="text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                  {value}
                </p>
                <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Saved recordings */}
        <div className="ns-vn-card">
          <div className="relative z-10 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
                Recent Recordings
              </h3>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-lg"
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border-secondary)",
                  color: "var(--text-muted)",
                }}
              >
                {recordings.length} total
              </span>
            </div>

            {recordingsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recordings.length === 0 ? (
              <div className="text-center py-10">
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{
                    background: "rgba(168,85,247,0.08)",
                    border: "1px solid rgba(168,85,247,0.2)",
                  }}
                >
                  {/* FIX: use an icon that definitely exists in your Phosphor set */}
                  <SpeakerHigh size={24} weight="duotone" className="text-purple-400" />
                </div>
                <p className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
                  No recordings yet
                </p>
                <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                  Record your first voice note above
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recordings.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl transition"
                    style={{
                      background: "var(--bg-input, var(--bg-tertiary))",
                      border: "1px solid var(--border-secondary)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {r.audioUrl ? (
                          <button
                            onClick={() => togglePlayback(r)}
                            className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition"
                            style={{
                              background: playingId === r.id ? "rgba(168,85,247,0.2)" : "rgba(168,85,247,0.08)",
                              border: `1px solid rgba(168,85,247,${playingId === r.id ? "0.4" : "0.2"})`,
                            }}
                          >
                            {playingId === r.id ? (
                              <Pause size={16} weight="fill" className="text-purple-400" />
                            ) : (
                              <Play size={16} weight="fill" className="text-purple-400 ml-0.5" />
                            )}
                          </button>
                        ) : (
                          <div
                            className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: "rgba(168,85,247,0.08)",
                              border: "1px solid rgba(168,85,247,0.2)",
                            }}
                          >
                            <SpeakerHigh size={16} className="text-purple-400" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                            {r.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                            <span>{fmt(r.duration || 0)}</span>
                            <span>·</span>
                            <span>{fmtRelative(r.createdAt)}</span>
                            {r.audioUrl && (
                              <>
                                <span>·</span>
                                <span style={{ color: "#a855f7" }}>♪</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => copyText(r.transcription, r.id)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {copiedId === r.id ? (
                            <FiCheck size={13} style={{ color: "#10b981" }} />
                          ) : (
                            <FiCopy size={13} />
                          )}
                        </button>
                        <button
                          onClick={() => deleteRecording(r.id)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {r.transcription && (
                      <p className="text-[11px] line-clamp-2 mt-2 pl-12" style={{ color: "var(--text-muted)" }}>
                        {r.transcription}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ════ SAVE MODAL ════ */}
        <AnimatePresence>
          {showSaveModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
              style={{
                backgroundColor: "var(--bg-overlay, rgba(0,0,0,0.6))",
                backdropFilter: "blur(12px)",
              }}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setShowSaveModal(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md ns-vn-card mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative z-10 p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                      Save Voice Note
                    </h2>
                    <button
                      onClick={() => setShowSaveModal(false)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center"
                      style={{
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-secondary)",
                        color: "var(--text-muted)",
                      }}
                    >
                      <FiX size={14} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label
                        className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Title
                      </label>
                      <input
                        type="text"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="Enter a title…"
                        className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                        style={{
                          background: "var(--bg-input)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-secondary)",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Preview
                      </label>
                      <div
                        className="p-3 rounded-xl text-[12px] max-h-28 overflow-y-auto"
                        style={{
                          background: "var(--bg-input)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-secondary)",
                        }}
                      >
                        {editedTranscription}
                      </div>
                    </div>

                    {audioBlob && (
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: "#a855f7" }}>
                        <SpeakerHigh size={13} />
                        <span>Audio attached ({(audioBlob.size / 1024).toFixed(0)} KB)</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      <Clock size={13} />
                      <span>{fmt(recordingTime)}</span>
                      {aiPayload?.category && (
                        <>
                          <span>·</span>
                          <span className="capitalize">{aiPayload.category}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-5">
                    <button
                      onClick={() => setShowSaveModal(false)}
                      disabled={isUploading}
                      className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition disabled:opacity-50"
                      style={{
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-secondary)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      onClick={saveAsNote}
                      disabled={isUploading}
                      className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold text-white flex items-center justify-center gap-2 transition disabled:opacity-60"
                      style={{
                        background: "linear-gradient(135deg, #a855f7, #ec4899)",
                        boxShadow: "0 4px 16px rgba(168,85,247,0.25)",
                      }}
                    >
                      {isUploading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                          Saving…
                        </>
                      ) : (
                        <>
                          <FloppyDisk size={14} /> Save Note
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
