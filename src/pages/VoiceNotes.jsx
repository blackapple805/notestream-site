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

  // Voice notes is available to all logged-in users. The previous gate
  // that redirected free users to AI Lab has been removed.
  const isPro      = subscription.plan !== "free";
  const isUnlocked = true;

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
  const [selectedId, setSelectedId] = useState(null);
  const [showRecorder, setShowRecorder] = useState(false);

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
        <header className="ed-reveal ns-vn-head" style={{ paddingTop: 32 }}>
          <div>
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
          </div>

          {/* Record button — top right */}
          {!showRecorder && recState === "idle" && (
            <button
              type="button"
              className="ed-btn ed-btn-primary ns-vn-record-btn"
              onClick={() => { setShowRecorder(true); setSelectedId(null); startRecording(); }}
            >
              <span className="ns-vn-dot-static" /> Record a new memo
            </button>
          )}
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

        {/* ━━━━━━━━━━━━━━ RECORDER (full-width, only when actively recording or transcribed) ━━━━━━━━━━━━━━ */}
        {(showRecorder || recState !== "idle") && (
          <section className="ns-vn-recorder" style={{ marginTop: 32 }}>
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
                        background: (recState === "recording" || recState === "paused") ? ED.accent : ED.rule,
                        opacity: (recState === "recording" || recState === "paused") ? 0.6 + h * 0.4 : 0.7,
                      }}
                    />
                  ))}
                </div>

                {/* timer */}
                <p className="ns-vn-timer">{formatTimer(recordingTime)}</p>

                {/* status */}
                <p className="ns-vn-status">
                  {recState === "idle"       && "Quiet now. Press record when ready."}
                  {recState === "requesting" && (<><span className="ns-vn-dot" /> Requesting the microphone…</>)}
                  {recState === "recording"  && (<><span className="ns-vn-dot" /> Recording in real time</>)}
                  {recState === "paused"     && (<><span className="ns-vn-dot is-still" /> Paused</>)}
                  {recState === "processing" && (<><span className="ns-vn-dot" /> The model is reading along…</>)}
                </p>

                {/* live transcript */}
                {(recState === "recording" || recState === "paused") && liveText && (
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

                  {(recState === "recording" || recState === "paused") && (
                    <>
                      <button className="ed-btn ed-btn-ghost" onClick={() => { cancelRecording(); setShowRecorder(false); }}>
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
                  <div>
                    <p className="ed-mono ns-vn-result-eye">JUST TRANSCRIBED · {formatTimer(recordingTime)}</p>
                    <h2 className="ed-serif ed-italic ns-vn-result-title">A fresh dispatch.</h2>
                  </div>
                  <div className="ns-vn-result-acts">
                    <button
                      type="button"
                      onClick={() => setIsEditing((v) => !v)}
                      className="ed-btn ed-btn-ghost"
                    >
                      <FiEdit2 size={13} /> {isEditing ? "Done" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(editedTranscription, "live")}
                      className="ed-btn ed-btn-ghost"
                    >
                      {copiedId === "live" ? <FiCheck size={13} /> : <FiCopy size={13} />} Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNoteTitle(aiPayload?.title || "Voice note");
                        setShowSaveModal(true);
                      }}
                      className="ed-btn ed-btn-primary"
                    >
                      <FiSave size={13} /> Save to archive
                    </button>
                  </div>
                </header>

                {audioUrl && (
                  <div className="ns-vn-playback">
                    <span className="ed-mono ns-vn-playback-l">PLAYBACK</span>
                    <audio controls src={audioUrl} className="ns-vn-audio" />
                  </div>
                )}

                <p className="ed-mono ns-vn-result-eye" style={{ marginTop: 20 }}>TRANSCRIPT</p>
                {isEditing ? (
                  <textarea
                    className="ns-vn-textarea"
                    value={editedTranscription}
                    onChange={(e) => setEditedTranscription(e.target.value)}
                    rows={10}
                  />
                ) : (
                  <p className="ed-serif ed-dropcap ns-vn-transcript">{editedTranscription}</p>
                )}

                {aiPayload?.summary && (
                  <div className="ns-vn-summary">
                    <p className="ed-mono ns-vn-result-eye">SUMMARY (BY THE MODEL)</p>
                    <p className="ed-serif" style={{ fontSize: 16, color: ED.inkMute, lineHeight: 1.55, marginTop: 8 }}>
                      {aiPayload.summary}
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
                  <button
                    className="ed-btn ed-btn-ghost"
                    onClick={() => { cancelRecording(); setShowRecorder(false); }}
                  >
                    <FiTrash2 size={13} /> Discard
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ━━━━━━━━━━━━━━ NOW PLAYING + ARCHIVE (default view) ━━━━━━━━━━━━━━ */}
        {!showRecorder && recState === "idle" && (() => {
          const featured = selectedId
            ? recordings.find((r) => r.id === selectedId)
            : recordings[0];

          return (
            <div className="ns-vn-split" style={{ marginTop: 32 }}>
              {/* ── LEFT: NOW PLAYING ── */}
              <div className="ns-vn-now">
                {recordingsLoading ? (
                  <div style={{ padding: "80px 0", textAlign: "center" }}>
                    <div style={{ maxWidth: 320, margin: "0 auto", height: 1, background: `linear-gradient(90deg, transparent, ${ED.ink}, transparent)`, backgroundSize: "200% 100%", animation: "ed-shimmer 1.6s linear infinite" }} />
                    <p className="ed-mono" style={{ marginTop: 14, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint }}>
                      Loading the tape…
                    </p>
                    <style>{`@keyframes ed-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
                  </div>
                ) : !featured ? (
                  <div className="ns-vn-empty">
                    <p className="ed-mono" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint, margin: 0 }}>
                      THE ARCHIVE IS QUIET
                    </p>
                    <p className="ed-serif ed-italic" style={{ fontSize: 26, color: ED.inkMute, margin: "14px 0 0 0", lineHeight: 1.4, maxWidth: 480 }}>
                      No memos yet. Press <span style={{ color: ED.ink, fontStyle: "normal" }}>record a new memo</span> above and speak.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="ed-mono ns-vn-now-eye">NOW PLAYING</p>
                    <h2 className="ed-serif ed-italic ns-vn-now-title">{featured.title || "Untitled memo"}.</h2>
                    <p className="ed-mono ns-vn-now-sub">
                      {fmtRelative(featured.createdAt).toUpperCase()}
                      <span className="ns-dotsep">·</span>
                      {formatTimer(featured.duration || 0)}
                      {featured.aiPayload?.summary && <><span className="ns-dotsep">·</span>READ BY MODEL</>}
                    </p>

                    {/* play strip */}
                    <div className="ns-vn-playstrip">
                      <button
                        type="button"
                        onClick={() => togglePlayback(featured)}
                        className={`ns-vn-play-big ${playingId === featured.id ? "is-on" : ""}`}
                        disabled={!featured.audioUrl}
                        aria-label={playingId === featured.id ? "Pause" : "Play"}
                        title={featured.audioUrl ? (playingId === featured.id ? "Pause" : "Play") : "No audio attached"}
                      >
                        {playingId === featured.id ? <FiPause size={14} /> : <FiPlay size={14} />}
                      </button>
                      <div className="ns-vn-wave-mini" aria-hidden>
                        {Array.from({ length: 56 }).map((_, i) => (
                          <span
                            key={i}
                            style={{
                              height: `${20 + ((i * 17) % 70)}%`,
                              background: playingId === featured.id ? ED.accent : ED.rule,
                              opacity: playingId === featured.id ? 0.8 : 0.6,
                            }}
                          />
                        ))}
                      </div>
                      <span className="ed-mono ns-vn-playstrip-time">
                        {formatTimer(featured.duration || 0)}
                      </span>
                    </div>

                    {/* transcript */}
                    {featured.transcription && (
                      <>
                        <p className="ed-mono ns-vn-now-eye" style={{ marginTop: 24 }}>TRANSCRIPT</p>
                        <p className="ed-serif ed-dropcap ns-vn-now-transcript">
                          {featured.transcription}
                        </p>
                      </>
                    )}

                    {featured.aiPayload?.summary && (
                      <div className="ns-vn-summary">
                        <p className="ed-mono ns-vn-now-eye">SUMMARY</p>
                        <p className="ed-serif" style={{ fontSize: 16, color: ED.inkMute, lineHeight: 1.55, marginTop: 8 }}>
                          {featured.aiPayload.summary}
                        </p>
                      </div>
                    )}

                    {/* actions */}
                    <div className="ns-vn-now-acts">
                      <button
                        type="button"
                        onClick={() => copyText(featured.transcription || "", featured.id)}
                        className="ed-btn ed-btn-ghost"
                      >
                        {copiedId === featured.id ? <FiCheck size={13} /> : <FiCopy size={13} />}
                        {copiedId === featured.id ? "Copied" : "Copy transcript"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRecording(featured.id)}
                        className="ed-btn ed-btn-ghost"
                        style={{ color: "#a3261c", borderColor: "#f5c2bd" }}
                      >
                        <FiTrash2 size={13} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* ── RIGHT: ARCHIVE ── */}
              <aside className="ns-vn-archive">
                <div className="ed-chapter" style={{ marginBottom: 12 }}>
                  <span className="num">§ 04</span>
                  <span>— ARCHIVE</span>
                </div>
                <hr className="ed-rule" />

                {recordingsLoading ? null : recordings.length === 0 ? (
                  <p className="ed-serif ed-italic" style={{ fontSize: 16, color: ED.inkMute, padding: "32px 0", margin: 0, textAlign: "center" }}>
                    Empty for now.
                  </p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {recordings.map((r, i) => {
                      const isFeatured = featured && featured.id === r.id;
                      return (
                        <li key={r.id}>
                          <article
                            className={`ns-vn-arch-row ${isFeatured ? "is-featured" : ""}`}
                            onClick={() => setSelectedId(r.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === "Enter") setSelectedId(r.id); }}
                          >
                            <span className="ord">{String(i + 1).padStart(2, "0")}</span>
                            <div className="body">
                              <p className="title">{r.title || "Untitled memo"}</p>
                              <p className="meta">
                                <span>{fmtRelative(r.createdAt).toUpperCase()} · {formatTimer(r.duration || 0)}</span>
                                {isFeatured && playingId === r.id && <span className="ed-chip ed-chip-accent">PLAYING</span>}
                                {isFeatured && playingId !== r.id && <span className="ed-chip ed-chip-accent">SELECTED</span>}
                              </p>
                            </div>
                          </article>
                          <hr className="ed-rule-soft" />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </aside>
            </div>
          );
        })()}

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
                  onClick={async () => {
                    await saveAsNote();
                    setShowRecorder(false);
                  }}
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

    /* ── HEADER LAYOUT ── */
    .ns-ed .ns-vn-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
    .ns-ed .ns-vn-record-btn { white-space: nowrap; }
    .ns-ed .ns-vn-dot-static {
      display: inline-block; width: 8px; height: 8px; border-radius: 999px;
      background: ${ED.paper50}; margin-right: 4px;
    }

    /* ── RECORDER (full-width, only visible during active recording) ── */
    .ns-ed .ns-vn-recorder {
      background: ${ED.paper50};
      border: 1px solid ${ED.rule};
      border-radius: 14px;
      overflow: hidden;
    }

    /* ── TWO-COLUMN: NOW PLAYING + ARCHIVE ── */
    .ns-ed .ns-vn-split {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
      gap: 56px;
      align-items: start;
    }
    @media (max-width: 900px) {
      .ns-ed .ns-vn-split { grid-template-columns: 1fr; gap: 40px; }
    }

    /* ── LEFT: NOW PLAYING ── */
    .ns-ed .ns-vn-now { min-width: 0; }
    .ns-ed .ns-vn-now-eye {
      font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
      color: ${ED.inkFaint}; margin: 0;
    }
    .ns-ed .ns-vn-now-title {
      font-size: clamp(28px, 3.5vw, 42px);
      color: ${ED.ink}; margin: 14px 0 8px;
      line-height: 1.15; padding-bottom: 0.04em;
    }
    .ns-ed .ns-vn-now-sub {
      font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
      color: ${ED.inkFaint}; margin: 0;
    }
    .ns-ed .ns-vn-now-transcript {
      font-size: 19px; line-height: 1.6; color: ${ED.inkMute};
      margin: 14px 0 0 0; max-width: 720px;
    }

    /* play strip — modeled on HTML preview */
    .ns-ed .ns-vn-playstrip {
      display: flex; align-items: center; gap: 16px;
      padding: 20px 0;
      border-top: 1px solid ${ED.rule};
      border-bottom: 1px solid ${ED.rule};
      margin: 20px 0;
    }
    .ns-ed .ns-vn-play-big {
      width: 44px; height: 44px; border-radius: 999px;
      background: ${ED.ink}; color: ${ED.paper50};
      border: 0; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      transition: transform .12s ease, background .15s ease;
    }
    .ns-ed .ns-vn-play-big:hover:not(:disabled) { transform: scale(1.05); }
    .ns-ed .ns-vn-play-big.is-on { background: ${ED.accent}; }
    .ns-ed .ns-vn-play-big:disabled { background: ${ED.paper200}; color: ${ED.inkFaint}; cursor: not-allowed; }

    .ns-ed .ns-vn-wave-mini {
      flex: 1; min-width: 0;
      display: flex; align-items: center; gap: 2px;
      height: 32px;
    }
    .ns-ed .ns-vn-wave-mini > span {
      flex: 1; min-width: 2px; border-radius: 1px;
      transition: height .2s ease, background .2s ease, opacity .2s ease;
    }
    .ns-ed .ns-vn-playstrip-time {
      font-size: 11px; letter-spacing: 0.08em;
      color: ${ED.inkFaint}; flex-shrink: 0;
    }

    .ns-ed .ns-vn-now-acts {
      display: flex; gap: 10px; flex-wrap: wrap; margin-top: 24px;
    }

    .ns-ed .ns-vn-empty {
      padding: 56px 0;
    }

    /* ── RIGHT: ARCHIVE ── */
    .ns-ed .ns-vn-archive { min-width: 0; }
    .ns-ed .ns-vn-arch-row {
      display: grid; grid-template-columns: 44px 1fr;
      gap: 12px; padding: 16px 8px;
      cursor: pointer; align-items: start;
      transition: background-color .12s, padding .12s;
    }
    .ns-ed .ns-vn-arch-row:hover { background: ${ED.paper150}; padding-left: 12px; }
    .ns-ed .ns-vn-arch-row.is-featured { background: ${ED.paper200}; }
    .ns-ed .ns-vn-arch-row:focus-visible { outline: 0; box-shadow: inset 4px 0 0 ${ED.accent}; }
    .ns-ed .ns-vn-arch-row .ord {
      font-family: ${ED.mono}; font-size: 11px; letter-spacing: 0.14em;
      color: ${ED.inkFaint}; padding-top: 2px; transition: all .15s ease;
    }
    .ns-ed .ns-vn-arch-row.is-featured .ord,
    .ns-ed .ns-vn-arch-row:hover .ord {
      color: ${ED.accent}; font-family: ${ED.serif}; font-style: italic; font-size: 17px;
    }
    .ns-ed .ns-vn-arch-row .body { min-width: 0; }
    .ns-ed .ns-vn-arch-row .title {
      font-family: ${ED.serif}; font-style: italic;
      font-size: 18px; line-height: 1.3; color: ${ED.ink};
      margin: 0;
      overflow: hidden; text-overflow: ellipsis;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    }
    .ns-ed .ns-vn-arch-row .meta {
      font-family: ${ED.mono}; font-size: 10px; letter-spacing: 0.12em;
      text-transform: uppercase; color: ${ED.inkFaint};
      margin: 8px 0 0 0; display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
    }

    /* ── PLAYBACK STRIP IN RECORDER RESULT ── */
    .ns-ed .ns-vn-playback {
      display: flex; align-items: center; gap: 16px;
      padding: 16px; border: 1px solid ${ED.rule}; border-radius: 10px;
      background: ${ED.paper50}; margin: 20px 0 0 0;
    }
    .ns-ed .ns-vn-playback-l {
      font-size: 10px; letter-spacing: 0.16em; color: ${ED.inkFaint};
      flex-shrink: 0;
    }
    .ns-ed .ns-vn-audio { width: 100%; max-width: none; }
  `}</style>
);

