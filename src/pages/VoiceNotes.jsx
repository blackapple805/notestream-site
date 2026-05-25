// src/pages/VoiceNotes.jsx
// ═══════════════════════════════════════════════════════════════════
// EDITORIAL RESKIN — what changed and why
// ─────────────────────────────────────────────────────────────────
// Wrapped the page in `<div className="ns-ed">` and called
// `useEditorial()`. The dark glass recording card, neon waveform,
// gradient gradient circular buttons, and frosted save modal are
// gone. The page is now "Dispatches in your own voice":
//
//   • Header — `№ 03 — DISPATCHES IN YOUR OWN VOICE` chapter
//     mark, serif display title ("Spoken first, *read* later."),
//     mono dateline with totals (n recordings · total time · total
//     words), and an upper-right "Back to AI Lab" mono link.
//
//   • Recorder — a single paper-50 card holding a slim hairline
//     waveform that paints from a Web Audio AnalyserNode (kept
//     entirely intact — same `startWaveformLoop`), a huge serif
//     italic accent-blue tabular timer, an italic-serif live
//     transcript line, and three editorial control buttons (start
//     is an `.ed-btn-primary`, pause/cancel/stop are `.ed-btn-ghost`
//     with hairline circles). Recording state pulses a single ink
//     dot, not a neon glow.
//
//   • Transcription result — when recState === "done" the same
//     card flips into a reading view: an `§` section header
//     ("§ Reading"), the transcript in serif body type with
//     drop-cap, an italic-accent-blue AI summary block, a list
//     of mono-prefixed action items, and Discard / Save buttons.
//     Edit mode swaps the body for a serif textarea.
//
//   • Archive — `§ 02 — THE TAPE LIBRARY` chapter mark, then full
//     editorial article rows: a play/pause toggle as the row's
//     ord glyph, serif title, italic-serif transcript excerpt,
//     mono metadata (date · duration · ♪ when audio attached),
//     hairline-bordered copy/delete actions on hover.
//
//   • Save modal rebuilt as paper-50 EdModal with mono labels,
//     paper-50 inputs, ink-primary save button.
//
//   • Mic-error banner is a hairline strip with an italic-accent
//     `!` glyph, no neon.
//
// NO Supabase / hook / data-flow changes — every useState, useEffect,
// useRef, useCallback is byte-identical to the previous file:
// MediaRecorder pipeline, Web Speech API recognizer, audio upload to
// the voice-recordings Supabase bucket, transcription via
// processTranscription edge function, playback control, delete,
// AnalyserNode waveform loop, and the pro-gate redirect.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { createSpeechRecognizer, processTranscription } from "../lib/voiceAI";
import { supabase, supabaseReady } from "../lib/supabaseClient";
import { formatTimer } from "../lib/formatDate";
import { useEditorial, ED } from "../lib/editorial";
import {
  FiMic, FiSquare, FiPause, FiPlay, FiTrash2, FiSave,
  FiArrowLeft, FiClock, FiCheck, FiEdit2, FiCopy,
  FiVolume2, FiX, FiAlertTriangle, FiArrowRight,
} from "react-icons/fi";
import { useSubscription } from "../hooks/useSubscription";

const RECORDINGS_TABLE = "voice_recordings";
const STORAGE_BUCKET   = "voice-recordings";

export default function VoiceNotes() {
  useEditorial();

  const navigate = useNavigate();
  const { subscription, isFeatureUnlocked, incrementUsage } = useSubscription();

  const isPro      = subscription.plan !== "free";
  const isUnlocked = isFeatureUnlocked("voice");
  useEffect(() => {
    if (!isPro || !isUnlocked) navigate("/dashboard/ai-lab");
  }, [isPro, isUnlocked, navigate]);

  /* ─── State (UNCHANGED) ─── */
  const [recState, setRecState] = useState("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformBars, setWaveformBars] = useState(Array(48).fill(0.08));
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

  /* ─── Refs (UNCHANGED) ─── */
  const timerRef          = useRef(null);
  const waveformRef       = useRef(null);
  const recognizerRef     = useRef(null);
  const aliveRef          = useRef(true);
  const cancelledRef      = useRef(false);
  const mediaRecorderRef  = useRef(null);
  const audioChunksRef    = useRef([]);
  const mediaStreamRef    = useRef(null);
  const analyserRef       = useRef(null);
  const audioContextRef   = useRef(null);
  const audioElRef        = useRef(null);

  /* ─── Helpers (UNCHANGED) ─── */
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
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    } catch { return null; }
  }, [supabaseReady]);

  /* ─── Load recordings (UNCHANGED) ─── */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supabaseReady || !supabase) { if (alive) { setRecordings([]); setRecordingsLoading(false); } return; }
      const user = await getUser();
      if (!user || !alive) { if (alive) setRecordingsLoading(false); return; }
      const { data, error } = await supabase.from(RECORDINGS_TABLE).select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
      if (!alive) return;
      if (error) { console.error("Load error:", error); setRecordings([]); }
      else {
        setRecordings((data || []).map((r) => ({
          id: r.id, title: r.title, duration: r.duration, transcription: r.transcription,
          createdAt: r.created_at, status: r.status, aiPayload: r.ai_payload,
          audioUrl: r.audio_url || null,
        })));
      }
      setRecordingsLoading(false);
    })();
    return () => { alive = false; };
  }, [supabaseReady, getUser]);

  /* ─── Cleanup (UNCHANGED) ─── */
  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (waveformRef.current) { cancelAnimationFrame(waveformRef.current); waveformRef.current = null; }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach((t) => t.stop()); mediaStreamRef.current = null; }
    if (audioContextRef.current) { try { audioContextRef.current.close(); } catch {} audioContextRef.current = null; analyserRef.current = null; }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      clearTimers();
      if (recognizerRef.current) { try { recognizerRef.current.abort(); } catch {} }
      cleanupAudio();
    };
  }, [clearTimers, cleanupAudio]);

  /* ─── Waveform loop (UNCHANGED) ─── */
  const startWaveformLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const step = Math.floor(buf.length / 48);
    const loop = () => {
      if (!analyserRef.current) return;
      analyser.getByteFrequencyData(buf);
      const bars = [];
      for (let i = 0; i < 48; i++) bars.push(Math.max(0.06, buf[i * step] / 255));
      setWaveformBars(bars);
      waveformRef.current = requestAnimationFrame(loop);
    };
    waveformRef.current = requestAnimationFrame(loop);
  }, []);

  /* ─── Recording handlers (UNCHANGED) ─── */
  const startRecording = async () => {
    setRecState("requesting");
    setMicError(null); setRecordingTime(0); setTranscription(""); setEditedTranscription("");
    setIsEditing(false); setLiveText(""); setAiPayload(null); setAudioBlob(null);
    cancelledRef.current = false;
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    audioChunksRef.current = [];

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
    } catch (err) {
      console.error("Mic denied:", err);
      setRecState("idle");
      setMicError(err?.name === "NotAllowedError" ? "Microphone access denied. Allow it in browser settings." : "Could not access microphone.");
      return;
    }

    if (!aliveRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }

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
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      mediaRecorderRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data?.size > 0) audioChunksRef.current.push(e.data); };
      rec.onstop = () => {
        if (!cancelledRef.current && audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: rec.mimeType || "audio/webm" });
          setAudioBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
        }
      };
      rec.start(1000);
    } catch (err) { console.warn("MediaRecorder failed:", err); }

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
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (waveformRef.current) { cancelAnimationFrame(waveformRef.current); waveformRef.current = null; }
    setWaveformBars((p) => p.map((v) => v * 0.25));
    if (mediaRecorderRef.current?.state === "recording") { try { mediaRecorderRef.current.pause(); } catch {} }
    if (recognizerRef.current) { try { recognizerRef.current.stop(); } catch {} }
  };

  const resumeRecording = () => {
    setRecState("recording");
    timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    startWaveformLoop();
    if (mediaRecorderRef.current?.state === "paused") { try { mediaRecorderRef.current.resume(); } catch {} }
    try {
      const r = createSpeechRecognizer();
      if (r) {
        recognizerRef.current = r;
        r.onResult(({ combined }) => setLiveText((p) => (p ? p + " " : "") + combined));
        r.onError(() => {});
        r.start();
      }
    } catch {}
  };

  const stopRecording = async () => {
    clearTimers();
    setWaveformBars(Array(48).fill(0.08));

    if (mediaRecorderRef.current?.state !== "inactive") { try { mediaRecorderRef.current.stop(); } catch {} }
    if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach((t) => t.stop()); mediaStreamRef.current = null; }
    if (audioContextRef.current) { try { audioContextRef.current.close(); } catch {} audioContextRef.current = null; analyserRef.current = null; }

    let finalText = liveText || "";
    if (recognizerRef.current) {
      try { const t = recognizerRef.current.getFinalTranscript(); if (t && t.length > finalText.length) finalText = t; recognizerRef.current.stop(); } catch {}
      recognizerRef.current = null;
    }

    if (!finalText.trim()) { setRecState("idle"); return; }

    setRecState("processing");
    try {
      const result = await processTranscription(finalText);
      if (!aliveRef.current) return;
      const cleaned = result?.cleanedText || finalText;
      setTranscription(cleaned);
      setEditedTranscription(cleaned);
      setAiPayload(result);
      if (result?.title && result.title !== "Voice Note") setNoteTitle(result.title);
      try { await incrementUsage("voiceTranscriptions"); } catch {}
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
    if (recognizerRef.current) { try { recognizerRef.current.abort(); } catch {} recognizerRef.current = null; }
    audioChunksRef.current = [];
    cleanupAudio();
    setRecState("idle");
    setRecordingTime(0);
    setLiveText("");
    setWaveformBars(Array(48).fill(0.08));
    setAudioBlob(null);
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
  };

  const uploadAudio = async (blob, userId) => {
    if (!blob || !userId || !supabaseReady || !supabase) return null;
    try {
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(`${userId}/${Date.now()}.${ext}`, blob, { contentType: blob.type || "audio/webm", upsert: false });
      if (error) return null;
      const { data: u } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
      return u?.publicUrl || null;
    } catch { return null; }
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
      const { data, error } = await supabase.from(RECORDINGS_TABLE).insert({
        user_id: user.id, title: rec.title, duration: rec.duration,
        transcription: rec.transcription, status: rec.status,
        ai_payload: rec.aiPayload, ai_model: aiPayload?.model || null,
        audio_url: url,
      }).select("id, created_at").single();

      if (!error && data) { rec.id = data.id; rec.createdAt = data.created_at; }
      else rec.id = `local-${Date.now()}`;
    } else rec.id = `local-${Date.now()}`;

    setRecordings((p) => [rec, ...p]);
    setShowSaveModal(false); setNoteTitle(""); setTranscription(""); setEditedTranscription("");
    setRecordingTime(0); setIsEditing(false); setLiveText(""); setAiPayload(null);
    setIsUploading(false); setAudioBlob(null); setRecState("idle");
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
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
    if (playingId === r.id) { if (audioElRef.current) audioElRef.current.pause(); audioElRef.current = null; setPlayingId(null); return; }
    if (audioElRef.current) audioElRef.current.pause();
    const a = new Audio(r.audioUrl);
    audioElRef.current = a;
    setPlayingId(r.id);
    a.onended = () => { setPlayingId(null); audioElRef.current = null; };
    a.onerror = () => { setPlayingId(null); audioElRef.current = null; };
    a.play().catch(() => { setPlayingId(null); audioElRef.current = null; });
  };

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const discardResult = () => {
    setTranscription(""); setEditedTranscription(""); setRecordingTime(0);
    setIsEditing(false); setLiveText(""); setAiPayload(null);
    setAudioBlob(null); setRecState("idle");
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
  };

  if (!isPro || !isUnlocked) return null;

  const isActive = recState === "recording" || recState === "paused";
  const totalDuration = recordings.reduce((a, r) => a + (r.duration || 0), 0);
  const totalWords    = recordings.reduce((a, r) => a + (r.transcription || "").split(" ").filter(Boolean).length, 0);

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="ns-ed">
      <VNScopedStyles />

      <div style={{ paddingBottom: "calc(var(--mobile-nav-height, 0px) + 100px)" }}>

        {/* ━━━━━━━━━━━━━━ HEADER ━━━━━━━━━━━━━━ */}
        <header className="ed-reveal" style={{ paddingTop: 32 }}>
          <button
            type="button"
            onClick={() => navigate("/dashboard/ai-lab")}
            className="ed-ulink ed-mono"
            style={{
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
              color: ED.inkMute, background: "transparent", border: 0, cursor: "pointer",
              padding: 0, marginBottom: 18, display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            <FiArrowLeft size={12} /> BACK TO AI LAB
          </button>

          <div className="ed-chapter" style={{ marginBottom: 18 }}>
            <span className="num">№ 03</span>
            <span>— DISPATCHES IN YOUR OWN VOICE</span>
          </div>

          <h1
            className="ed-display"
            style={{ fontSize: "clamp(40px, 5vw, 64px)", margin: 0, paddingBottom: "0.06em", maxWidth: 920 }}
          >
            Spoken first, <span className="ed-italic" style={{ color: ED.accent }}>read</span> later.
          </h1>

          <p
            className="ed-mono"
            style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint, marginTop: 28 }}
          >
            {recordings.length} {recordings.length === 1 ? "RECORDING" : "RECORDINGS"}
            <span className="ns-dotsep">·</span>
            {formatTimer(totalDuration)} ON TAPE
            <span className="ns-dotsep">·</span>
            {totalWords.toLocaleString()} WORDS TRANSCRIBED
          </p>
        </header>

        <hr className="ed-rule-dbl" style={{ marginTop: 32 }} />

        {/* ━━━━━━━━━━━━━━ MIC ERROR ━━━━━━━━━━━━━━ */}
        {micError && (
          <div className="ns-vn-err">
            <span className="ed-mono" style={{ color: ED.accent, fontFamily: ED.serif, fontStyle: "italic", fontSize: 18, marginRight: 10 }}>!</span>
            <div style={{ flex: 1 }}>
              <p className="ed-mono ns-vn-err-eyebrow">MICROPHONE</p>
              <p className="ed-serif" style={{ fontSize: 17, color: ED.ink, marginTop: 4 }}>{micError}</p>
            </div>
            <button onClick={() => setMicError(null)} className="ns-icon-btn-sm" aria-label="Dismiss">
              <FiX size={13} />
            </button>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━ RECORDER CARD ━━━━━━━━━━━━━━ */}
        <section className="ns-vn-card ed-card" style={{ marginTop: 32 }}>
          {/* ── recorder body ── */}
          {(recState !== "done" || !transcription) && (
            <div className="ns-vn-body">
              {/* waveform */}
              <div className="ns-vn-wave" aria-hidden>
                {waveformBars.map((h, i) => (
                  <span
                    key={i}
                    style={{
                      height: `${Math.max(8, h * 100)}%`,
                      background: isActive ? ED.accent : ED.rule,
                      opacity: isActive ? 0.6 + h * 0.4 : 0.7,
                    }}
                  />
                ))}
              </div>

              {/* timer */}
              <p className="ns-vn-timer">{formatTimer(recordingTime)}</p>

              {/* status */}
              <p className="ns-vn-status">
                {recState === "idle" && "Quiet now. Press record when ready."}
                {recState === "requesting" && (<><span className="ns-vn-dot" /> Requesting the microphone…</>)}
                {recState === "recording" && (<><span className="ns-vn-dot" /> Recording in real time</>)}
                {recState === "paused" && (<><span className="ns-vn-dot is-still" /> Paused</>)}
                {recState === "processing" && (<><span className="ns-vn-dot" /> The model is reading along…</>)}
              </p>

              {/* live transcript */}
              {isActive && liveText && (
                <div className="ns-vn-live">
                  <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint, margin: 0 }}>LIVE</p>
                  <p className="ed-serif ed-italic" style={{ fontSize: 18, color: ED.inkMute, marginTop: 8, lineHeight: 1.55 }}>
                    "{liveText}"
                  </p>
                </div>
              )}

              {/* controls */}
              <div className="ns-vn-controls">
                {recState === "idle" && (
                  <button className="ed-btn ed-btn-primary" onClick={startRecording} style={{ padding: "13px 26px" }}>
                    <FiMic size={14} /> Start recording
                  </button>
                )}

                {recState === "requesting" && (
                  <button className="ed-btn ed-btn-primary" disabled style={{ padding: "13px 26px", opacity: 0.5, pointerEvents: "none" }}>
                    <FiMic size={14} /> Requesting…
                  </button>
                )}

                {isActive && (
                  <>
                    <button className="ed-btn ed-btn-ghost" onClick={cancelRecording}>
                      <FiTrash2 size={13} /> Cancel
                    </button>
                    <button className="ed-btn ed-btn-ghost" onClick={recState === "paused" ? resumeRecording : pauseRecording}>
                      {recState === "paused" ? <><FiPlay size={13} /> Resume</> : <><FiPause size={13} /> Pause</>}
                    </button>
                    <button className="ed-btn ed-btn-primary" onClick={stopRecording}>
                      <FiSquare size={13} /> Stop &amp; transcribe
                    </button>
                  </>
                )}

                {recState === "processing" && (
                  <button className="ed-btn ed-btn-primary" disabled style={{ padding: "13px 26px", opacity: 0.5, pointerEvents: "none" }}>
                    Reading…
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── transcription result ── */}
          {recState === "done" && transcription && (
            <div className="ns-vn-result">
              <header className="ns-vn-result-head">
                <p className="ed-chapter">
                  <span className="num">§ READING</span>
                  <span>— {fmtMetaTimer(recordingTime)} OF SPEECH</span>
                </p>
                <div className="ns-vn-result-acts">
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className={`ns-icon-btn-sm ${isEditing ? "is-on" : ""}`}
                    title="Edit transcript"
                    aria-label="Edit"
                  >
                    <FiEdit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(editedTranscription, "current")}
                    className="ns-icon-btn-sm"
                    title="Copy"
                    aria-label="Copy"
                  >
                    {copiedId === "current" ? <FiCheck size={13} /> : <FiCopy size={13} />}
                  </button>
                </div>
              </header>

              <hr className="ed-rule" style={{ margin: "16px 0 24px" }} />

              {audioUrl && (
                <div className="ns-vn-playback">
                  <span className="ed-mono ns-vn-playback-l">PLAYBACK</span>
                  <audio controls src={audioUrl} className="ns-vn-audio" />
                </div>
              )}

              {isEditing ? (
                <textarea
                  value={editedTranscription}
                  onChange={(e) => setEditedTranscription(e.target.value)}
                  className="ns-vn-textarea"
                  autoFocus
                />
              ) : (
                <p className="ed-serif ed-dropcap ns-vn-transcript">
                  {editedTranscription}
                </p>
              )}

              {aiPayload?.summary && (
                <div className="ns-vn-ai">
                  <p className="ed-mono ns-vn-ai-eyebrow">
                    <span style={{ color: ED.accent, fontFamily: ED.serif, fontStyle: "italic", fontSize: 13, marginRight: 6 }}>¹</span>
                    THE MODEL'S NOTE
                  </p>
                  <p className="ed-serif ed-italic" style={{ fontSize: 18, color: ED.inkMute, marginTop: 8, lineHeight: 1.5 }}>
                    {aiPayload.summary}
                  </p>
                </div>
              )}

              {!!(aiPayload?.actionItems?.length) && (
                <div className="ns-vn-ai">
                  <p className="ed-mono ns-vn-ai-eyebrow">
                    <span style={{ color: ED.accent, fontFamily: ED.serif, fontStyle: "italic", fontSize: 13, marginRight: 6 }}>²</span>
                    ACTION ITEMS
                  </p>
                  <ul className="ns-vn-actions">
                    {aiPayload.actionItems.map((item, i) => (
                      <li key={i}>
                        <span className="ed-mono ord">{String(i + 1).padStart(2, "0")}</span>
                        <span className="ed-serif">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <footer className="ns-vn-result-foot">
                <button className="ed-btn ed-btn-ghost" onClick={discardResult}>Discard</button>
                <button className="ed-btn ed-btn-primary" onClick={() => setShowSaveModal(true)}>
                  Save to archive <FiArrowRight size={13} />
                </button>
              </footer>
            </div>
          )}
        </section>

        {/* ━━━━━━━━━━━━━━ ARCHIVE LIST ━━━━━━━━━━━━━━ */}
        <section style={{ marginTop: 80 }}>
          <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div className="ed-chapter">
              <span className="num">§ 02</span>
              <span>— THE TAPE LIBRARY</span>
            </div>
            <p className="ed-mono" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint }}>
              {recordings.length} ON FILE
            </p>
          </header>

          <hr className="ed-rule" />

          {recordingsLoading ? (
            <div style={{ padding: "80px 0", textAlign: "center" }}>
              <div style={{ maxWidth: 320, margin: "0 auto", height: 1, background: `linear-gradient(90deg, transparent, ${ED.ink}, transparent)`, backgroundSize: "200% 100%", animation: "ed-shimmer 1.6s linear infinite" }} />
              <p className="ed-mono" style={{ marginTop: 14, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint }}>
                Loading the tape…
              </p>
              <style>{`@keyframes ed-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
            </div>
          ) : recordings.length === 0 ? (
            <p className="ed-serif ed-italic" style={{ fontSize: 22, color: ED.inkMute, padding: "64px 0", textAlign: "center", maxWidth: 520, margin: "0 auto", lineHeight: 1.45 }}>
              No memos yet. Press record above and speak.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {recordings.map((r, i) => {
                const playing = playingId === r.id;
                return (
                  <li key={r.id}>
                    <article className="ns-vn-row">
                      <button
                        type="button"
                        onClick={() => togglePlayback(r)}
                        className={`ns-vn-play ${playing ? "is-on" : ""} ${!r.audioUrl ? "is-mute" : ""}`}
                        aria-label={playing ? "Pause" : "Play"}
                        title={r.audioUrl ? (playing ? "Pause" : "Play") : "No audio"}
                        disabled={!r.audioUrl}
                      >
                        {playing
                          ? <FiPause size={12} />
                          : r.audioUrl
                          ? <FiPlay size={12} />
                          : <FiVolume2 size={12} />}
                      </button>

                      <div className="ns-vn-row-body">
                        <h3 className="ns-vn-row-title">{r.title}</h3>
                        {r.transcription && (
                          <p className="ns-vn-row-excerpt">"{truncate(r.transcription, 200)}"</p>
                        )}
                        <p className="ns-vn-row-meta">
                          <span>{fmtRelative(r.createdAt).toUpperCase()}</span>
                          <span>{formatTimer(r.duration || 0)}</span>
                          {r.audioUrl && <span className="ed-chip">AUDIO ATTACHED</span>}
                          {r.aiPayload?.summary && <span className="ed-chip ed-chip-accent">READ BY MODEL</span>}
                        </p>
                      </div>

                      <div className="ns-vn-row-aside">
                        <button
                          type="button"
                          onClick={() => copyText(r.transcription, r.id)}
                          className="ns-icon-btn-sm"
                          aria-label="Copy transcript"
                          title="Copy"
                        >
                          {copiedId === r.id ? <FiCheck size={12} /> : <FiCopy size={12} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRecording(r.id)}
                          className="ns-icon-btn-sm is-danger"
                          aria-label="Delete recording"
                          title="Delete"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    </article>
                    <hr className="ed-rule-soft" />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ━━━━━━━━━━━━━━ SAVE MODAL ━━━━━━━━━━━━━━ */}
        <AnimatePresence>
          {showSaveModal && (
            <EdModal
              onClose={() => setShowSaveModal(false)}
              title="Save to the archive"
              subtitle="Title it, then file."
            >
              <div style={{ display: "grid", gap: 18, marginTop: 4 }}>
                <label className="ns-vn-field">
                  <span className="ns-vn-field-label">
                    <span className="ed-serif" style={{ fontSize: 17, color: ED.ink }}>Title</span>
                  </span>
                  <input
                    className="ns-vn-input"
                    placeholder="What is this memo about?"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    autoFocus
                  />
                </label>

                <div className="ns-vn-field">
                  <span className="ns-vn-field-label">
                    <span className="ed-serif" style={{ fontSize: 17, color: ED.ink }}>Preview</span>
                  </span>
                  <p className="ed-serif ed-italic" style={{ background: ED.paper50, border: `1px solid ${ED.rule}`, borderRadius: 8, padding: "14px 16px", margin: 0, color: ED.inkMute, fontSize: 16, lineHeight: 1.5, maxHeight: 200, overflowY: "auto" }}>
                    "{editedTranscription}"
                  </p>
                </div>

                <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint, margin: 0, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <FiClock size={11} />
                  {formatTimer(recordingTime)}
                  {audioBlob && <><span>·</span><span>{(audioBlob.size / 1024).toFixed(0)} KB</span></>}
                  {aiPayload?.category && <><span>·</span><span>{aiPayload.category.toUpperCase()}</span></>}
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
                <button className="ed-btn ed-btn-ghost" disabled={isUploading} onClick={() => setShowSaveModal(false)}>Cancel</button>
                <button
                  className="ed-btn ed-btn-primary"
                  disabled={isUploading}
                  onClick={saveAsNote}
                >
                  {isUploading ? "Filing…" : <>Save to archive <FiArrowRight size={13} /></>}
                </button>
              </div>
            </EdModal>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   HELPERS / SUB-COMPONENTS
═══════════════════════════════════════════════════════ */

const truncate = (s, n = 220) => {
  const t = String(s || "").trim();
  return t.length > n ? t.slice(0, n).trim() + "…" : t;
};

const fmtMetaTimer = (secs) => {
  const s = formatTimer(secs);
  return s.toUpperCase();
};

const EdModal = ({ children, onClose, title, subtitle }) => {
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="ns-modal-bg"
        onClick={onClose}
      />
      <div className="ns-modal-wrap">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          className="ed-card ns-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
            <div>
              <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint, margin: 0 }}>
                <span style={{ color: ED.accent, fontFamily: ED.serif, fontStyle: "italic", fontSize: 13, marginRight: 6 }}>№</span>
                DISPATCH
              </p>
              <h2 className="ed-serif" style={{ fontSize: 28, margin: "6px 0 0", color: ED.ink, paddingBottom: "0.04em" }}>{title}</h2>
              {subtitle && <p className="ed-serif ed-italic" style={{ fontSize: 16, color: ED.inkMute, marginTop: 4, lineHeight: 1.4 }}>{subtitle}</p>}
            </div>
            <button onClick={onClose} className="ns-modal-close" aria-label="Close">
              <FiX size={13} />
            </button>
          </header>
          <hr className="ed-rule" />
          <div style={{ marginTop: 20 }}>{children}</div>
        </motion.div>
      </div>
    </>,
    document.body
  );
};

/* ═══════════════════════════════════════════════════════
   SCOPED CSS
═══════════════════════════════════════════════════════ */
const VNScopedStyles = () => (
  <style>{`
    .ns-ed .ns-dotsep { padding: 0 8px; color: ${ED.rule}; }

    /* ── mic error ── */
    .ns-ed .ns-vn-err {
      display: flex; align-items: center; gap: 14px;
      padding: 16px 20px; background: ${ED.paper50};
      border: 1px solid ${ED.accent}; border-radius: 12px;
      margin-top: 24px;
    }
    .ns-ed .ns-vn-err-eyebrow {
      font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
      color: ${ED.inkFaint}; margin: 0;
    }
    .ns-ed .ns-icon-btn-sm {
      width: 28px; height: 28px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid transparent; color: ${ED.inkFaint};
      background: transparent; cursor: pointer;
      transition: all .15s ease;
    }
    .ns-ed .ns-icon-btn-sm:hover { border-color: ${ED.rule}; color: ${ED.ink}; background: ${ED.paper50}; }
    .ns-ed .ns-icon-btn-sm.is-on { background: ${ED.ink}; color: ${ED.paper50}; border-color: ${ED.ink}; }
    .ns-ed .ns-icon-btn-sm.is-danger:hover { color: #a8201f; border-color: #a8201f; }
    .ns-ed .ns-icon-btn-sm:disabled { opacity: 0.35; cursor: not-allowed; }

    /* ── recorder card ── */
    .ns-ed .ns-vn-card { padding: 0; overflow: hidden; }
    .ns-ed .ns-vn-body { padding: 48px 36px 40px; text-align: center; }

    .ns-ed .ns-vn-wave {
      display: flex; align-items: center; justify-content: center;
      gap: 3px; height: 80px; max-width: 640px; margin: 0 auto 24px;
    }
    .ns-ed .ns-vn-wave span {
      flex: 1; max-width: 4px; min-height: 8px;
      border-radius: 1px;
      transition: height .08s ease, background-color .15s ease, opacity .15s ease;
    }

    .ns-ed .ns-vn-timer {
      font-family: ${ED.serif}; font-style: italic;
      font-size: clamp(56px, 7vw, 88px); line-height: 1;
      color: ${ED.accent};
      letter-spacing: -0.01em;
      font-variant-numeric: tabular-nums;
      margin: 8px 0 12px;
      padding-bottom: 0.06em;
    }

    .ns-ed .ns-vn-status {
      font-family: ${ED.mono}; font-size: 11px;
      letter-spacing: 0.16em; text-transform: uppercase;
      color: ${ED.inkFaint}; margin: 0 0 32px;
      display: inline-flex; align-items: center; gap: 8px;
    }
    @keyframes ns-vn-dot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.5); } }
    .ns-ed .ns-vn-dot {
      display: inline-block; width: 6px; height: 6px; border-radius: 999px;
      background: ${ED.accent};
      animation: ns-vn-dot 1.6s ease-in-out infinite;
    }
    .ns-ed .ns-vn-dot.is-still { animation: none; opacity: 0.5; }

    .ns-ed .ns-vn-live {
      background: ${ED.paper100};
      border: 1px solid ${ED.rule};
      border-radius: 10px;
      padding: 14px 18px;
      max-width: 640px;
      margin: 0 auto 24px;
      text-align: left;
    }

    .ns-ed .ns-vn-controls {
      display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
    }

    /* ── result ── */
    .ns-ed .ns-vn-result { padding: 28px 36px 32px; }
    .ns-ed .ns-vn-result-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; flex-wrap: wrap;
    }
    .ns-ed .ns-vn-result-acts { display: flex; gap: 6px; }

    .ns-ed .ns-vn-playback {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; background: ${ED.paper100};
      border: 1px solid ${ED.rule}; border-radius: 10px;
      margin-bottom: 20px;
    }
    .ns-ed .ns-vn-playback-l {
      font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
      color: ${ED.inkFaint};
    }
    .ns-ed .ns-vn-audio { flex: 1; height: 32px; }

    .ns-ed .ns-vn-transcript {
      font-family: ${ED.serif};
      font-size: clamp(18px, 1.6vw, 22px);
      line-height: 1.55;
      color: ${ED.inkSoft};
      margin: 0;
    }

    .ns-ed .ns-vn-textarea {
      width: 100%; min-height: 200px;
      padding: 16px;
      background: ${ED.paper100};
      border: 1px solid ${ED.ink};
      border-radius: 10px;
      font-family: ${ED.serif}; font-size: 19px; line-height: 1.55;
      color: ${ED.ink}; outline: 0;
      resize: vertical;
    }

    .ns-ed .ns-vn-ai {
      margin-top: 28px; padding-top: 24px;
      border-top: 1px solid ${ED.ruleSoft};
    }
    .ns-ed .ns-vn-ai-eyebrow {
      font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
      color: ${ED.inkFaint}; margin: 0;
    }
    .ns-ed .ns-vn-actions {
      list-style: none; padding: 0; margin: 12px 0 0;
    }
    .ns-ed .ns-vn-actions li {
      display: grid; grid-template-columns: 32px 1fr; gap: 14px;
      padding: 8px 0; align-items: baseline;
    }
    .ns-ed .ns-vn-actions .ord {
      font-family: ${ED.serif}; font-style: italic; font-size: 17px;
      color: ${ED.accent};
    }
    .ns-ed .ns-vn-actions .ed-serif { font-size: 17px; line-height: 1.5; color: ${ED.ink}; }

    .ns-ed .ns-vn-result-foot {
      display: flex; gap: 12px; justify-content: flex-end;
      margin-top: 32px; padding-top: 24px;
      border-top: 1px solid ${ED.ruleSoft};
    }

    /* ── archive row ── */
    .ns-ed .ns-vn-row {
      display: grid;
      grid-template-columns: 56px minmax(0, 1fr) auto;
      gap: 18px;
      padding: 22px 14px;
      align-items: start;
      transition: background-color .12s ease, padding .12s ease;
    }
    .ns-ed .ns-vn-row:hover { background: ${ED.paper150}; padding-left: 18px; }
    .ns-ed .ns-vn-play {
      width: 32px; height: 32px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid ${ED.rule}; color: ${ED.inkSoft};
      background: ${ED.paper50}; cursor: pointer;
      margin-top: 4px; transition: all .15s ease;
    }
    .ns-ed .ns-vn-play:hover { border-color: ${ED.ink}; color: ${ED.ink}; }
    .ns-ed .ns-vn-play.is-on { background: ${ED.ink}; color: ${ED.paper50}; border-color: ${ED.ink}; }
    .ns-ed .ns-vn-play.is-mute { opacity: 0.5; cursor: not-allowed; }

    .ns-ed .ns-vn-row-body { min-width: 0; max-width: 760px; }
    .ns-ed .ns-vn-row-title {
      font-family: ${ED.serif}; font-size: clamp(20px, 1.8vw, 26px);
      line-height: 1.22; color: ${ED.ink}; margin: 0; padding-bottom: 0.04em;
      transition: color .15s ease;
    }
    .ns-ed .ns-vn-row:hover .ns-vn-row-title { color: ${ED.accent}; }
    .ns-ed .ns-vn-row-excerpt {
      font-family: ${ED.serif}; font-style: italic; font-size: 16px;
      line-height: 1.5; color: ${ED.inkMute}; margin: 8px 0 0;
      display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
      overflow: hidden;
    }
    .ns-ed .ns-vn-row-meta {
      font-family: ${ED.mono}; font-size: 10.5px; letter-spacing: 0.14em;
      text-transform: uppercase; color: ${ED.inkFaint};
      margin: 12px 0 0; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    }
    .ns-ed .ns-vn-row-aside {
      display: flex; gap: 6px; align-items: center; padding-top: 6px;
    }

    /* ── modal ── */
    .ns-ed .ns-modal-bg {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(19,16,8,0.36);
    }
    .ns-ed .ns-modal-wrap {
      position: fixed; inset: 0; z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      padding: 20px; pointer-events: none;
      overflow-y: auto;
    }
    .ns-ed .ns-modal {
      width: 100%; max-width: 560px; padding: 28px;
      max-height: calc(100dvh - 40px); overflow-y: auto;
      pointer-events: auto;
      background: ${ED.paper50};
    }
    .ns-ed .ns-modal-close {
      width: 32px; height: 32px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid ${ED.rule}; color: ${ED.inkSoft};
      background: transparent; cursor: pointer;
      transition: all .15s ease;
    }
    .ns-ed .ns-modal-close:hover { border-color: ${ED.ink}; color: ${ED.ink}; }

    /* ── save modal fields ── */
    .ns-ed .ns-vn-field { display: block; }
    .ns-ed .ns-vn-field-label {
      display: flex; align-items: baseline; gap: 8px;
      margin-bottom: 8px;
    }
    .ns-ed .ns-vn-input {
      width: 100%;
      padding: 11px 14px;
      background: ${ED.paper50};
      border: 1px solid ${ED.rule};
      border-radius: 8px;
      font-family: ${ED.sans}; font-size: 14px; color: ${ED.ink};
      transition: border-color .15s ease;
    }
    .ns-ed .ns-vn-input:focus { outline: 0; border-color: ${ED.ink}; }
    .ns-ed .ns-vn-input::placeholder { color: ${ED.inkFaint}; }

    @media (max-width: 720px) {
      .ns-ed .ns-vn-body { padding: 32px 20px; }
      .ns-ed .ns-vn-result { padding: 24px 20px; }
      .ns-ed .ns-vn-row { grid-template-columns: 40px 1fr; padding: 16px 6px; }
      .ns-ed .ns-vn-row-aside { grid-column: 1 / -1; padding-top: 8px; justify-content: flex-end; }
      .ns-ed .ns-vn-controls .ed-btn { flex: 1; min-width: 0; justify-content: center; }
    }
  `}</style>
);
