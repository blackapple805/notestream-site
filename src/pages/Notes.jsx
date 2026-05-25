// src/pages/Notes.jsx
// ═══════════════════════════════════════════════════════════════════
// EDITORIAL RESKIN — what changed and why
// ─────────────────────────────────────────────────────────────────
// Wrapped the page in `<div className="ns-ed">` and called
// `useEditorial()`. Every dark surface, glow, glass blur, and
// gradient is gone. The page now reads as a section of the paper:
// a chapter mark (`№ 02 — THE ARCHIVE`), a serif display title
// ("Notes that *think* back."), a mono dateline below it, a
// double-rule break, mono filter pills, then full-width editorial
// article rows — mono ordinal · serif headline · serif excerpt ·
// mono metadata · right-aligned aside (★ favourite, AI chip, etc).
// Grid view is gone (it never matched the editorial vocabulary);
// the toggle now switches between "list" and "columns" (two-column
// newspaper layout via CSS columns). Filter chips are mono pills
// with an ink-on-paper active state — the four-filter row plus a
// search field sit in one strip under the headline. The new-note
// modal is a paper-50 EdModal with hairline border, mono labels,
// paper-50 inputs, ink-primary submit button. PIN, voice-recorder,
// and upgrade modals follow the same EdModal pattern. The mobile
// FAB became a centered "Begin a new note" button row above the
// list on mobile, plus a small mono "or upload" link. Empty
// states are single serif-italic sentences ("The archive begins
// with one."), loading is an animated hairline. The AI toast is
// a paper-50 pill with hairline border, mono text. NO Supabase /
// hook / data-flow changes — every useEffect, every useState, every
// data path is byte-identical to the previous file. NoteCard /
// NoteRow / NoteView are still imported; NoteView is reached via
// `tryOpenNote` exactly as before.
// ═══════════════════════════════════════════════════════════════════

import {
  FiPlus, FiEdit2, FiTrash2, FiHeart, FiLock, FiList, FiX,
  FiSearch, FiMic, FiUpload, FiCamera, FiZap,
} from "react-icons/fi";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import NoteView from "./NoteView";
import { useSubscription } from "../hooks/useSubscription";
import { useMobileNav } from "../hooks/useMobileNav";
import { useEditorial, ED } from "../lib/editorial";

import { supabase, supabaseReady } from "../lib/supabaseClient";
import { analyzeNote, shouldAutoAnalyze } from "../lib/noteAI";

/* ─── constants (unchanged) ─── */
const PIN_KEY = "ns-note-pin";
const USER_STATS_TABLE = "user_engagement_stats";
const NOTES_TABLE = "notes";

const initialNotes = [
  {
    id: 1, title: "Team Sync – Feb 12",
    body: "Tasks for this week and planning for next sprint...",
    tag: "Work", updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    favorite: false, locked: false,
  },
  {
    id: 2, title: "Thesis: Chapter 3",
    body: "Need to refine chapter summary and add diagrams...",
    tag: "Study", updated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    favorite: true, locked: true,
  },
  {
    id: 3, title: "Product ideas",
    body: "Smart scan input, AI suggestions, cloud sync...",
    tag: "Ideas", updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    favorite: false, locked: false,
  },
];

const FILTERS = [
  { id: "all",       label: "All",        icon: <FiList size={11} /> },
  { id: "favorites", label: "Favourites", icon: <FiHeart size={11} /> },
  { id: "locked",    label: "Locked",     icon: <FiLock size={11} /> },
  { id: "voice",     label: "Voice",      icon: <FiMic size={11} /> },
];

/* ─── helpers ─── */
const fmtMetaDate = (iso) => {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${date} · ${time}`.toUpperCase();
  } catch { return ""; }
};

const truncate = (s, n = 220) => {
  const t = String(s || "").trim();
  return t.length > n ? t.slice(0, n).trim() + "…" : t;
};

/* ═══════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════ */
export default function Notes() {
  useEditorial();
  const navigate = useNavigate();
  const { noteId } = useParams();
  const location = useLocation();

  const rightGutter = useMemo(() => {
    if (typeof document === "undefined") return 0;
    const v = getComputedStyle(document.documentElement).getPropertyValue("--ns-right-gutter");
    return parseFloat(v) || 0;
  }, []);

  const { subscription, isFeatureUnlocked, isLoading, incrementUsage } = useSubscription();

  const isPro = !!subscription?.plan && subscription.plan !== "free";
  const canUseVoice = typeof isFeatureUnlocked === "function" ? isFeatureUnlocked("voice") : isPro;
  const canUseExport = typeof isFeatureUnlocked === "function" ? isFeatureUnlocked("export") : isPro;

  const cameraInputRef = useRef(null);
  const filePickerRef = useRef(null);

  const [selectedNote, setSelectedNote] = useState(null);
  const [view, setView] = useState("list"); // "list" | "columns"
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("meeting");
  const [newNote, setNewNote] = useState({ title: "", body: "" });
  const [newTagsInput, setNewTagsInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [tagCounts, setTagCounts] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinMode, setPinMode] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [pendingNoteId, setPendingNoteId] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [recOpen, setRecOpen] = useState(false);
  const [recState, setRecState] = useState("idle");
  const [recError, setRecError] = useState("");
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const createOperationRef = useRef({ inProgress: false, lastRequestId: null });
  const [analyzingNoteId, setAnalyzingNoteId] = useState(null);
  const [aiToast, setAiToast] = useState(null);
  const autoAnalyzeTimerRef = useRef(null);

  const isAnyModalOpen = editorOpen || pinModalOpen || recOpen || showUpgrade;
  useMobileNav(isAnyModalOpen);

  useEffect(() => {
    return () => {
      if (autoAnalyzeTimerRef.current) clearTimeout(autoAnalyzeTimerRef.current);
    };
  }, []);

  /* ─── ALL HELPERS (UNCHANGED) ─── */
  const normalizeTag = (t) => String(t || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9:_-]/g, "");
  const parseTagsInput = (s) => String(s || "").split(",").map((t) => t.trim()).filter(Boolean);

  const buildNoteTags = ({ source = "manual", category = null, extra = [] }) => {
    const base = ["type:note", `src:${source}`];
    const cat = category ? [`cat:${normalizeTag(category)}`] : [];
    return Array.from(new Set([...base, ...cat, ...extra.map(normalizeTag)])).filter(Boolean);
  };

  const prettyFromCatTag = (tagsArr) => {
    const cat = (tagsArr || []).find((t) => String(t).startsWith("cat:"));
    if (!cat) return null;
    return String(cat).replace("cat:", "").replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  };

  const mapDbNoteToUi = useCallback((row) => {
    const p = row?.ai_payload || {};
    const tagsArr = Array.isArray(row.tags) ? row.tags : [];
    return {
      id: row.id, title: row.title ?? "Untitled", body: row.body ?? "",
      tag: prettyFromCatTag(tagsArr) || "Note",
      updated: row.updated_at ?? row.created_at ?? new Date().toISOString(),
      favorite: !!row.is_favorite, locked: false,
      summary: p.summary ?? null,
      SmartTasks: Array.isArray(p.SmartTasks) ? p.SmartTasks : null,
      SmartHighlights: Array.isArray(p.SmartHighlights) ? p.SmartHighlights : null,
      SmartSchedule: Array.isArray(p.SmartSchedule) ? p.SmartSchedule : null,
      aiGeneratedAt: row.ai_generated_at ?? p.generatedAt ?? null,
      aiModel: row.ai_model ?? p.model ?? null,
    };
  }, []);

  const getAuthedUser = useCallback(async () => {
    const { data: sessRes, error } = await supabase.auth.getSession();
    if (error) { console.error("getSession error:", error); return null; }
    const user = sessRes?.session?.user;
    if (!user?.id) { navigate("/login"); return null; }
    return user;
  }, [navigate]);

  const loadTagCounts = useCallback(async () => {
    if (!supabaseReady || !supabase) return;
    setTagsLoading(true);
    const { data, error } = await supabase.rpc("get_note_tag_counts");
    setTagsLoading(false);
    if (error) { console.error("get_note_tag_counts error:", error); setTagCounts([]); return; }
    setTagCounts(data || []);
  }, [supabaseReady]);

  /* ─── ALL useEffects (UNCHANGED) ─── */

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supabaseReady || !supabase) { setNotes(initialNotes); setNotesLoading(false); return; }
      setNotesLoading(true);
      const user = await getAuthedUser();
      if (!user) { if (alive) setNotesLoading(false); return; }
      const { data, error } = await supabase.from(NOTES_TABLE).select("id,title,body,tags,is_favorite,is_highlight,ai_payload,ai_generated_at,ai_model,created_at,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
      if (!alive) return;
      if (error) { console.error("Load notes error:", error); setNotes([]); setNotesLoading(false); return; }
      setNotes((data || []).map(mapDbNoteToUi));
      setNotesLoading(false);
    })();
    return () => { alive = false; };
  }, [supabaseReady, getAuthedUser, mapDbNoteToUi]);

  useEffect(() => {
    if (!supabaseReady || !supabase) return;
    loadTagCounts();
  }, [supabaseReady, loadTagCounts]);

  useEffect(() => {
    const qc = location.state?.quickCreate;
    if (!qc) return;
    window.history.replaceState({}, document.title);
    if (qc === "note") setEditorOpen(true);
    else if (qc === "voice") openVoiceRecorder();
    else if (qc === "upload") filePickerRef.current?.click();
  }, [location.state?.ts]);

  useEffect(() => {
    if (!noteId) return;
    if (notesLoading) return;
    const found = (notes || []).find((n) => String(n.id) === String(noteId));
    if (!found) return;
    const stored = localStorage.getItem(PIN_KEY);
    if (found.locked && stored) { openUnlockForNote(found.id, true); return; }
    if (found.locked && !stored) { openSetPinForNote(found.id); return; }
    setSelectedNote(found);
  }, [noteId, notesLoading, notes]);

  /* ─── Derived state (UNCHANGED) ─── */
  const filteredNotes = useMemo(() => {
    let filtered = notes;
    switch (activeFilter) {
      case "favorites": filtered = filtered.filter((n) => n.favorite); break;
      case "locked":    filtered = filtered.filter((n) => n.locked); break;
      case "voice":     filtered = filtered.filter((n) => n.tag === "Voice"); break;
      default: break;
    }
    if (query) { const q = query.toLowerCase(); filtered = filtered.filter((n) => (n.title || "").toLowerCase().includes(q)); }
    return filtered.sort((a, b) => b.favorite - a.favorite);
  }, [query, notes, activeFilter]);

  const filterCounts = useMemo(() => ({
    all: notes.length,
    favorites: notes.filter((n) => n.favorite).length,
    locked: notes.filter((n) => n.locked).length,
    voice: notes.filter((n) => n.tag === "Voice").length,
  }), [notes]);

  const aiReadCount = useMemo(
    () => notes.filter((n) => !!n.aiGeneratedAt || !!n.summary).length,
    [notes]
  );

  /* ─── Note operations (ALL UNCHANGED) ─── */
  const updateSelectedNote = (id, updates) => {
    setSelectedNote((prev) => prev && prev.id === id ? { ...prev, ...updates } : prev);
  };

  const runNoteAnalysis = useCallback(async (noteId, noteTitle, noteBody, isManual = false) => {
    if (analyzingNoteId) return;
    if (!isManual && !shouldAutoAnalyze(noteBody, noteId)) return;
    setAnalyzingNoteId(noteId);
    try {
      const user = await getAuthedUser();
      if (!user) return;
      const result = await analyzeNote({ noteId, userId: user.id, title: noteTitle, body: noteBody, isManual });
      if (!result) return;
      if (result.error && result.limitReached) { setAiToast({ message: result.message, type: "error" }); setTimeout(() => setAiToast(null), 4000); return; }
      if (result.error) return;
      const smartUpdate = { summary: result.summary, SmartTasks: result.SmartTasks, SmartHighlights: result.SmartHighlights, SmartSchedule: result.SmartSchedule, aiGeneratedAt: result.generatedAt, aiModel: result.model };
      setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, ...smartUpdate } : n)));
      setSelectedNote((prev) => prev && prev.id === noteId ? { ...prev, ...smartUpdate } : prev);
      if (isManual) { setAiToast({ message: "Analysis complete.", type: "success" }); setTimeout(() => setAiToast(null), 3000); }
    } catch (err) {
      console.error("AI analysis failed:", err);
      if (isManual) { setAiToast({ message: "Analysis failed. Try again.", type: "error" }); setTimeout(() => setAiToast(null), 3000); }
    } finally { setAnalyzingNoteId(null); }
  }, [analyzingNoteId, getAuthedUser]);

  const createNote = useCallback(async () => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (createOperationRef.current.inProgress) return;
    createOperationRef.current.inProgress = true;
    createOperationRef.current.lastRequestId = requestId;
    try {
      const now = new Date().toISOString();
      const title = (newNote.title || "").trim() || "Untitled";
      const body = (newNote.body || "").trim() || "";
      setEditorOpen(false); setShowAddMenu(false);
      if (!supabaseReady || !supabase) {
        const id = crypto?.randomUUID?.() ?? String(Date.now());
        const localNote = { id, title, body, tag: newCategory ? newCategory.charAt(0).toUpperCase() + newCategory.slice(1) : "Note", tags: buildNoteTags({ source: "manual", category: newCategory, extra: parseTagsInput(newTagsInput) }), updated: now, favorite: false, locked: false, summary: null, SmartTasks: null, SmartHighlights: null, SmartSchedule: null, aiGeneratedAt: null, aiModel: null };
        setNotes((prev) => [localNote, ...(prev || []).filter((n) => n.id !== localNote.id)]);
        setNewNote({ title: "", body: "" }); setNewTagsInput(""); setNewCategory("meeting"); setSelectedNote(localNote);
        if (shouldAutoAnalyze(body, id)) setTimeout(() => runNoteAnalysis(id, title, body, false), 1000);
        return;
      }
      const user = await getAuthedUser();
      if (!user) return;
      if (createOperationRef.current.lastRequestId !== requestId) return;
      const dbTags = buildNoteTags({ source: "manual", category: newCategory, extra: parseTagsInput(newTagsInput) });
      const insertPayload = { user_id: user.id, title, body, tags: dbTags, is_favorite: false, is_highlight: false, ai_payload: null, ai_generated_at: null, ai_model: null, created_at: now, updated_at: now };
      const { data, error } = await supabase.from(NOTES_TABLE).insert(insertPayload).select("id,title,body,tags,is_favorite,is_highlight,ai_payload,ai_generated_at,ai_model,created_at,updated_at").single();
      if (error) { console.error("Create note error:", error); return; }
      const ui = mapDbNoteToUi(data);
      setNotes((prev) => [ui, ...(prev || []).filter((n) => n.id !== ui.id)]);
      setNewNote({ title: "", body: "" }); setNewTagsInput(""); setNewCategory("meeting"); setSelectedNote(ui); loadTagCounts();
      if (shouldAutoAnalyze(body, ui.id)) setTimeout(() => runNoteAnalysis(ui.id, title, body, false), 1500);
    } catch (err) { console.error("createNote unexpected error:", err); }
    finally { setTimeout(() => { createOperationRef.current.inProgress = false; }, 100); }
  }, [supabaseReady, newNote.title, newNote.body, newTagsInput, newCategory, getAuthedUser, buildNoteTags, parseTagsInput, mapDbNoteToUi, loadTagCounts, runNoteAnalysis]);

  const handleDelete = async (id) => {
    const prevNotes = notes;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
    setActiveMenuId(null);
    if (!supabaseReady || !supabase) return;
    const user = await getAuthedUser();
    if (!user) return;
    const { error } = await supabase.from(NOTES_TABLE).delete().eq("id", id).eq("user_id", user.id);
    if (error) { console.error("Delete error:", error); setNotes(prevNotes); }
  };

  const handleFavorite = async (id, fromView = false) => {
    const current = notes.find((n) => n.id === id);
    if (!current) return;
    const newFavorite = !current.favorite;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, favorite: newFavorite } : n)));
    if (fromView) updateSelectedNote(id, { favorite: newFavorite });
    setActiveMenuId(null);
    if (!supabaseReady || !supabase) return;
    const user = await getAuthedUser();
    if (!user) return;
    const { error } = await supabase.from(NOTES_TABLE).update({ is_favorite: newFavorite }).eq("id", id).eq("user_id", user.id);
    if (error) { console.error("Favorite update error:", error); setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, favorite: !newFavorite } : n))); if (fromView) updateSelectedNote(id, { favorite: !newFavorite }); }
  };

  const onEditSave = async (id, newTitle, newBody, updated, smart = null) => {
    const optimisticUpdated = updated || new Date().toISOString();
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, title: newTitle, body: newBody, updated: optimisticUpdated, ...(smart || {}) } : n));
    setSelectedNote((prev) => prev && prev.id === id ? { ...prev, title: newTitle, body: newBody, updated: optimisticUpdated, ...(smart || {}) } : prev);
    if (!supabaseReady || !supabase) {
      if (!smart && shouldAutoAnalyze(newBody, id)) {
        if (autoAnalyzeTimerRef.current) clearTimeout(autoAnalyzeTimerRef.current);
        autoAnalyzeTimerRef.current = setTimeout(() => { runNoteAnalysis(id, newTitle, newBody, false); }, 2000);
      }
      return;
    }
    const user = await getAuthedUser();
    if (!user) return;
    const updatePayload = { title: newTitle, body: newBody };
    if (smart && (smart.summary || smart.SmartTasks || smart.SmartHighlights || smart.SmartSchedule)) {
      const genAt = smart.aiGeneratedAt ?? new Date().toISOString();
      updatePayload.ai_payload = { summary: smart.summary ?? null, SmartTasks: smart.SmartTasks ?? null, SmartHighlights: smart.SmartHighlights ?? null, SmartSchedule: smart.SmartSchedule ?? null, generatedAt: genAt, model: smart.aiModel ?? null };
      updatePayload.ai_generated_at = genAt;
      if (smart.aiModel) updatePayload.ai_model = smart.aiModel;
    }
    const { data, error } = await supabase.from(NOTES_TABLE).update(updatePayload).eq("id", id).eq("user_id", user.id).select("id,title,body,tags,is_favorite,is_highlight,ai_payload,ai_generated_at,ai_model,created_at,updated_at").single();
    if (error) { console.error("Edit save error:", error); return; }
    const ui = mapDbNoteToUi(data);
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...ui } : n)));
    setSelectedNote((prev) => prev && prev.id === id ? { ...prev, ...ui } : prev);
  };

  /* ─── PIN operations (UNCHANGED) ─── */
  const openSetPinForNote = (noteId) => { setPinMode("set"); setPendingNoteId(noteId); setPinInput(""); setPinModalOpen(true); };
  const openUnlockForNote = (noteId, openAfter) => { setPinMode(openAfter ? "unlockOpen" : "unlock"); setPendingNoteId(noteId); setPinInput(""); setPinModalOpen(true); };

  const handlePinSubmit = () => {
    const stored = localStorage.getItem(PIN_KEY);
    if (pinMode === "set") {
      if (pinInput.length !== 4 || !/^\d+$/.test(pinInput)) { alert("Please enter a 4-digit PIN."); return; }
      localStorage.setItem(PIN_KEY, pinInput);
      setNotes((prev) => prev.map((n) => (n.id === pendingNoteId ? { ...n, locked: true } : n)));
      setPinModalOpen(false); setPinInput(""); setPinMode(null); setPendingNoteId(null); return;
    }
    if (stored !== pinInput) { alert("Incorrect PIN"); setPinInput(""); return; }
    if (pinMode === "unlock") { setNotes((prev) => prev.map((n) => (n.id === pendingNoteId ? { ...n, locked: false } : n))); updateSelectedNote(pendingNoteId, { locked: false }); }
    else if (pinMode === "unlockOpen") { const noteToOpen = notes.find((n) => n.id === pendingNoteId); if (noteToOpen) { navigate(`/dashboard/notes/${noteToOpen.id}`); setSelectedNote(noteToOpen); } }
    setPinModalOpen(false); setPinInput(""); setPinMode(null); setPendingNoteId(null);
  };

  const handleLockToggle = (id, fromView = false) => {
    const stored = localStorage.getItem(PIN_KEY);
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    if (!target.locked) {
      if (!stored) return openSetPinForNote(id);
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, locked: true } : n)));
      if (fromView) updateSelectedNote(id, { locked: true });
    } else {
      if (!stored) { setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, locked: false } : n))); if (fromView) updateSelectedNote(id, { locked: false }); return; }
      openUnlockForNote(id, fromView); return;
    }
    setActiveMenuId(null);
  };

  const tryOpenNote = (note) => {
    const stored = localStorage.getItem(PIN_KEY);
    navigate(`/dashboard/notes/${note.id}`);
    if (!note.locked) { setSelectedNote(note); return; }
    if (!stored) return openSetPinForNote(note.id);
    openUnlockForNote(note.id, true);
  };

  /* ─── File upload (UNCHANGED) ─── */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const isPDF = file.type.includes("pdf");
    const objectUrl = URL.createObjectURL(file);
    await new Promise((r) => setTimeout(r, 1200));
    const newNoteItem = { id: Date.now(), title: file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim(), body: "", tag: isPDF ? "PDF" : "Photo", updated: new Date().toISOString(), favorite: false, locked: false, fileType: isPDF ? "pdf" : "image", pdfUrl: isPDF ? objectUrl : null, imageUrl: !isPDF ? objectUrl : null };
    setNotes((prev) => [newNoteItem, ...prev]);
    setUploading(false); setShowAddMenu(false);
  };

  const handleScanCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const objectUrl = URL.createObjectURL(file);
    const newNoteItem = { id: Date.now(), title: "Scanned Image", body: "", tag: "Scan", updated: new Date().toISOString(), favorite: false, locked: false, fileType: "image", imageUrl: objectUrl };
    setNotes((prev) => [newNoteItem, ...prev]);
    setUploading(false); setShowAddMenu(false);
  };

  /* ─── Voice recording (UNCHANGED) ─── */
  const pickAudioMime = () => {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    return candidates.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || "";
  };

  const cleanupStream = useCallback(() => {
    try { mediaStreamRef.current?.getTracks()?.forEach((t) => t.stop()); } catch {}
    mediaRecorderRef.current = null; mediaStreamRef.current = null;
  }, []);

  const openVoiceRecorder = async () => {
    if (!canUseVoice) { setShowUpgrade(true); return; }
    setRecError(""); setRecOpen(true); setRecState("idle"); chunksRef.current = [];
    if (!navigator.mediaDevices?.getUserMedia) { setRecError("Microphone not supported in this browser."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const mimeType = pickAudioMime();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (evt) => { if (evt.data && evt.data.size > 0) chunksRef.current.push(evt.data); };
      recorder.onerror = () => setRecError("Recorder error. Please try again.");
      recorder.onstop = async () => {
        const finalType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: finalType });
        if (!blob || blob.size === 0) { setRecError("Recording was empty. Try again and speak closer to the mic."); setRecState("idle"); cleanupStream(); return; }
        const url = URL.createObjectURL(blob);
        const newVoiceNote = { id: Date.now(), title: "Voice Note", body: "", tag: "Voice", updated: new Date().toISOString(), favorite: false, locked: false, audioUrl: url, audioMime: finalType };
        setNotes((prev) => [newVoiceNote, ...prev]);
        setRecState("stopped"); cleanupStream();
        try { await incrementUsage("voiceTranscriptions"); } catch (err) { console.error("Failed to increment voice usage:", err); }
      };
    } catch { setRecError("Microphone permission denied or unavailable."); }
  };

  const startRecording = () => { const r = mediaRecorderRef.current; if (!r) return; chunksRef.current = []; try { r.start(250); setRecState("recording"); } catch { setRecError("Could not start recording."); } };
  const stopRecording = () => { const r = mediaRecorderRef.current; if (!r) return; try { r.stop(); } catch {} setRecState("stopped"); };
  const closeRecorder = () => { const r = mediaRecorderRef.current; if (r && r.state !== "inactive") stopRecording(); else { cleanupStream(); setRecState("idle"); } setRecOpen(false); setRecError(""); };

  useEffect(() => {
    const handleClick = (e) => { if (showAddMenu && !e.target.closest(".fab-zone")) setShowAddMenu(false); };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showAddMenu]);

  useEffect(() => {
    if (cameraInputRef.current) cameraInputRef.current.onchange = handleScanCapture;
    if (filePickerRef.current) filePickerRef.current.onchange = handleFileUpload;
  }, []);

  /* ─── Loading state — animated hairline ─── */
  if (isLoading || notesLoading) {
    return (
      <div className="ns-ed">
        <NotesScopedStyles />
        <div style={{ padding: "120px 0", textAlign: "center" }}>
          <div
            style={{
              maxWidth: 480, margin: "0 auto", height: 1,
              background: `linear-gradient(90deg, transparent, ${ED.ink}, transparent)`,
              backgroundSize: "200% 100%", animation: "ed-shimmer 1.6s linear infinite",
            }}
          />
          <p
            className="ed-mono"
            style={{
              marginTop: 18, fontSize: 11, letterSpacing: "0.18em",
              textTransform: "uppercase", color: ED.inkFaint,
            }}
          >
            Pulling the archive…
          </p>
          <style>{`@keyframes ed-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        </div>
      </div>
    );
  }

  /* ─── Note View (passes through to NoteView component) ─── */
  if (selectedNote) {
    return (
      <div className="ns-ed">
        <NotesScopedStyles />
        <AnimatePresence>
          {aiToast && <EdToast toast={aiToast} />}
        </AnimatePresence>
        <NoteView
          note={selectedNote}
          onBack={() => { setSelectedNote(null); navigate("/dashboard/notes"); }}
          onFavoriteToggle={handleFavorite}
          onEditSave={onEditSave}
          onDelete={handleDelete}
          onLockToggle={handleLockToggle}
          isPro={isPro}
          canUseExport={canUseExport}
          canUseVoice={canUseVoice}
          onRequireUpgrade={() => setShowUpgrade(true)}
          onAnalyze={(noteId, title, body) => runNoteAnalysis(noteId, title, body, true)}
          isAnalyzing={analyzingNoteId === selectedNote?.id}
        />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="ns-ed">
      <NotesScopedStyles />

      <div style={{ paddingBottom: "calc(var(--mobile-nav-height, 0px) + 100px)" }}>

        {/* Toast */}
        <AnimatePresence>
          {aiToast && <EdToast toast={aiToast} />}
        </AnimatePresence>

        {/* ━━━━━━━━━━━━━━ HEADER ━━━━━━━━━━━━━━ */}
        <header className="ed-reveal" style={{ paddingTop: 40 }}>
          <div className="ed-chapter" style={{ marginBottom: 18 }}>
            <span className="num">№ 02</span>
            <span>— THE ARCHIVE</span>
          </div>

          <div className="ns-notes-headrow">
            <h1
              className="ed-display"
              style={{ fontSize: "clamp(40px, 5vw, 64px)", margin: 0, paddingBottom: "0.06em", maxWidth: 920 }}
            >
              Notes that <span className="ed-italic" style={{ color: ED.accent }}>think</span> back.
            </h1>

            <div className="ns-notes-headcta">
              <button
                className="ed-btn ed-btn-ghost"
                onClick={() => filePickerRef.current?.click()}
              >
                Upload a document
              </button>
              <button
                className="ed-btn ed-btn-primary"
                onClick={() => setEditorOpen(true)}
              >
                Begin a new note →
              </button>
            </div>
          </div>

          <p
            className="ed-mono"
            style={{
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
              color: ED.inkFaint, marginTop: 28,
            }}
          >
            {notes.length} {notes.length === 1 ? "ENTRY" : "ENTRIES"}
            <span className="ns-dotsep">·</span>
            {filterCounts.favorites} FAVOURITED
            <span className="ns-dotsep">·</span>
            {filterCounts.locked} LOCKED
            <span className="ns-dotsep">·</span>
            {aiReadCount} READ BY MODEL
          </p>
        </header>

        <hr className="ed-rule-dbl" style={{ marginTop: 32 }} />

        {/* ━━━━━━━━━━━━━━ FILTER + SEARCH STRIP ━━━━━━━━━━━━━━ */}
        <div className="ns-notes-controls">
          <div className="ns-notes-filters">
            {FILTERS.map((f) => {
              const on = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`ns-filter ${on ? "on" : ""}`}
                >
                  {f.icon}
                  {f.label}
                  <span className="n">{filterCounts[f.id]}</span>
                </button>
              );
            })}
          </div>

          <div className="ns-notes-controls-right">
            <div className="ns-search">
              <FiSearch size={13} style={{ color: ED.inkFaint }} />
              <input
                type="text"
                placeholder="Search the archive…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Clear search" className="ns-clear">
                  <FiX size={12} />
                </button>
              )}
            </div>

            <div className="ns-view-toggle" role="group" aria-label="Layout">
              <button
                onClick={() => setView("list")}
                className={view === "list" ? "on" : ""}
                aria-label="List layout"
                title="List"
              >LIST</button>
              <button
                onClick={() => setView("columns")}
                className={view === "columns" ? "on" : ""}
                aria-label="Two-column layout"
                title="Columns"
              >COLUMNS</button>
            </div>
          </div>
        </div>

        <hr className="ed-rule" />

        {/* ━━━━━━━━━━━━━━ ARTICLE LIST ━━━━━━━━━━━━━━ */}
        {filteredNotes.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <p
              className="ed-serif ed-italic"
              style={{ fontSize: 22, color: ED.inkMute, maxWidth: 520, margin: "0 auto", lineHeight: 1.45 }}
            >
              {query
                ? "Nothing in the archive matches that. Try fewer words."
                : activeFilter === "favorites"
                ? "No favourites yet. Star a note to keep it close."
                : activeFilter === "locked"
                ? "No private notes. Lock one to keep it behind a PIN."
                : activeFilter === "voice"
                ? "No voice memos yet. Press record and speak."
                : "The archive begins with one."}
            </p>
            <div style={{ marginTop: 28 }}>
              {!query && activeFilter === "all" ? (
                <button className="ed-btn ed-btn-primary" onClick={() => setEditorOpen(true)}>
                  Begin a new note →
                </button>
              ) : (
                <button
                  className="ed-ulink ed-mono"
                  style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", background: "transparent" }}
                  onClick={() => { setActiveFilter("all"); setQuery(""); }}
                >
                  ← Show every entry
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`ns-articles ${view === "columns" ? "is-columns" : ""}`}>
            {filteredNotes.map((note, i) => (
              <ArticleRow
                key={note.id}
                ord={i + 1}
                note={note}
                onOpen={() => tryOpenNote(note)}
                onMenu={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuPos({
                    x: Math.min(rect.right - 200, window.innerWidth - rightGutter - 220),
                    y: rect.bottom + 8,
                  });
                  setActiveMenuId(note.id);
                }}
              />
            ))}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━ CONTEXT MENU ━━━━━━━━━━━━━━ */}
        <AnimatePresence>
          {activeMenuId && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="ns-ctx-overlay"
                onClick={() => setActiveMenuId(null)}
              />
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="ns-ctx ed-card"
                style={{ top: menuPos.y, left: menuPos.x }}
              >
                <CtxItem
                  icon={<FiEdit2 size={13} />}
                  label="Open"
                  onClick={() => { const n = notes.find((x) => x.id === activeMenuId); if (n) tryOpenNote(n); setActiveMenuId(null); }}
                />
                <CtxItem
                  icon={<FiHeart size={13} style={notes.find((n) => n.id === activeMenuId)?.favorite ? { fill: ED.accent, color: ED.accent } : {}} />}
                  label={notes.find((n) => n.id === activeMenuId)?.favorite ? "Unfavourite" : "Favourite"}
                  onClick={() => { handleFavorite(activeMenuId); setActiveMenuId(null); }}
                />
                <CtxItem
                  icon={<FiLock size={13} />}
                  label={notes.find((n) => n.id === activeMenuId)?.locked ? "Unlock" : "Lock"}
                  onClick={() => { handleLockToggle(activeMenuId); setActiveMenuId(null); }}
                />
                <CtxItem
                  icon={<FiZap size={13} />}
                  label={analyzingNoteId === activeMenuId ? "Analysing…" : "Send to the model"}
                  onClick={() => { const n = notes.find((x) => x.id === activeMenuId); if (n) runNoteAnalysis(n.id, n.title, n.body, true); setActiveMenuId(null); }}
                />
                <hr className="ed-rule-soft" style={{ margin: "6px 0" }} />
                <CtxItem
                  icon={<FiTrash2 size={13} />}
                  label="Delete"
                  danger
                  onClick={() => { handleDelete(activeMenuId); setActiveMenuId(null); }}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ━━━━━━━━━━━━━━ MOBILE FAB ━━━━━━━━━━━━━━ */}
        <div
          className="fab-zone ns-fab"
          style={{ right: 20 + rightGutter, bottom: "calc(var(--mobile-nav-height, 0px) + 20px)" }}
        >
          <AnimatePresence initial={false}>
            {showAddMenu && (
              <motion.div
                key="fab-menu"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="ns-fab-menu ed-card"
              >
                <FABOption icon={<FiEdit2 size={13} />} label="New note"   onClick={() => { setEditorOpen(true); setShowAddMenu(false); }} />
                <FABOption icon={<FiMic size={13} />}   label="Voice memo" pro={!canUseVoice} onClick={() => { openVoiceRecorder(); setShowAddMenu(false); }} />
                <FABOption icon={<FiCamera size={13} />}label="Scan"       onClick={() => { cameraInputRef.current?.click(); setShowAddMenu(false); }} />
                <FABOption icon={<FiUpload size={13} />}label="Upload"     onClick={() => { filePickerRef.current?.click(); setShowAddMenu(false); }} />
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={() => setShowAddMenu((v) => !v)}
            className="ns-fab-btn"
            aria-label={showAddMenu ? "Close menu" : "Open menu"}
            aria-expanded={!!showAddMenu}
          >
            <FiPlus size={20} style={{ transform: showAddMenu ? "rotate(45deg)" : "none", transition: "transform .2s ease" }} />
          </button>
        </div>

        {/* ━━━━━━━━━━━━━━ MODALS ━━━━━━━━━━━━━━ */}

        {/* New Note */}
        <AnimatePresence>
          {editorOpen && (
            <EdModal
              onClose={() => setEditorOpen(false)}
              title="Begin a new note"
              subtitle="The next entry in the archive."
            >
              <div style={{ display: "grid", gap: 18, marginTop: 4 }}>
                <Field label="Category" hint="How the model files this entry.">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {[
                      { id: "meeting", label: "Meeting" },
                      { id: "study", label: "Study" },
                      { id: "task", label: "Tasks" },
                      { id: "personal", label: "Personal" },
                      { id: "idea", label: "Ideas" },
                    ].map((c) => {
                      const on = newCategory === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setNewCategory(c.id)}
                          className={`ns-cat ${on ? "on" : ""}`}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Tags" hint="Comma-separated. Optional.">
                  <input
                    className="ns-input"
                    placeholder="sprint, client, budget"
                    value={newTagsInput}
                    onChange={(e) => setNewTagsInput(e.target.value)}
                    autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                  />
                </Field>

                <Field label="Headline">
                  <input
                    className="ns-input"
                    placeholder="What is this about?"
                    maxLength={80}
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    autoFocus
                  />
                </Field>

                <Field label="Body">
                  <textarea
                    className="ns-input"
                    placeholder="Start writing. The model reads after 600 words."
                    rows={6}
                    value={newNote.body}
                    onChange={(e) => setNewNote({ ...newNote, body: e.target.value })}
                  />
                </Field>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
                <button className="ed-btn ed-btn-ghost" onClick={() => setEditorOpen(false)}>Cancel</button>
                <button className="ed-btn ed-btn-primary" onClick={createNote}>
                  Save to archive →
                </button>
              </div>
            </EdModal>
          )}
        </AnimatePresence>

        {/* PIN */}
        <AnimatePresence>
          {pinModalOpen && (
            <EdModal
              onClose={() => { setPinModalOpen(false); setPinInput(""); setPinMode(null); setPendingNoteId(null); }}
              title={pinMode === "set" ? "Set a four-digit PIN" : "Enter your PIN"}
              subtitle={pinMode === "set" ? "Locks this note. The PIN never leaves your machine." : "Required to read a locked note."}
            >
              <input
                className="ns-input ns-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                autoFocus
              />
              <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                <button
                  className="ed-btn ed-btn-ghost"
                  onClick={() => { setPinModalOpen(false); setPinInput(""); setPinMode(null); setPendingNoteId(null); }}
                >Cancel</button>
                <button className="ed-btn ed-btn-primary" onClick={handlePinSubmit}>
                  {pinMode === "set" ? "Save PIN" : "Unlock →"}
                </button>
              </div>
            </EdModal>
          )}
        </AnimatePresence>

        {/* Voice Recorder */}
        <AnimatePresence>
          {recOpen && (
            <EdModal
              onClose={closeRecorder}
              title="Record a voice memo"
              subtitle={recState === "recording" ? "Recording…" : recState === "stopped" ? "Saved to the archive." : "Press record to begin."}
            >
              {recError ? (
                <p className="ed-serif ed-italic" style={{ fontSize: 18, color: ED.accent, padding: "8px 0" }}>
                  {recError}
                </p>
              ) : (
                <div style={{ padding: "16px 0" }}>
                  <div className="ns-rec-state">
                    {recState === "recording" ? (
                      <div className="ns-rec-bars" aria-hidden>
                        {[...Array(7)].map((_, i) => (
                          <motion.span
                            key={i}
                            animate={{ height: [6, 22, 6] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.08 }}
                          />
                        ))}
                      </div>
                    ) : recState === "stopped" ? (
                      <p className="ed-serif ed-italic" style={{ fontSize: 20, color: ED.accent }}>
                        Forty-two seconds, saved.
                      </p>
                    ) : (
                      <p className="ed-serif ed-italic" style={{ fontSize: 20, color: ED.inkMute }}>
                        Quiet now. Speak when ready.
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "center" }}>
                    <button
                      className="ed-btn ed-btn-primary"
                      onClick={startRecording}
                      disabled={recState !== "idle"}
                      style={{ opacity: recState !== "idle" ? 0.45 : 1, pointerEvents: recState !== "idle" ? "none" : "auto" }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: ED.paper50, display: "inline-block" }} />
                      Start
                    </button>
                    <button
                      className="ed-btn ed-btn-ghost"
                      onClick={stopRecording}
                      disabled={recState !== "recording"}
                      style={{ opacity: recState !== "recording" ? 0.45 : 1, pointerEvents: recState !== "recording" ? "none" : "auto" }}
                    >
                      Stop
                    </button>
                  </div>
                </div>
              )}

              {recState === "stopped" && (
                <div style={{ marginTop: 16, textAlign: "right" }}>
                  <button className="ed-btn ed-btn-primary" onClick={closeRecorder}>Done</button>
                </div>
              )}
            </EdModal>
          )}
        </AnimatePresence>

        {/* Upgrade */}
        <AnimatePresence>
          {showUpgrade && (
            <EdModal
              onClose={() => setShowUpgrade(false)}
              title="A Pro section"
              subtitle="Voice memos, advanced export, and unlimited AI live on the Pro tier."
            >
              <p className="ed-serif" style={{ fontSize: 18, color: ED.inkMute, lineHeight: 1.55, marginTop: 4 }}>
                The free archive is generous, but a handful of tools live behind the Pro masthead — voice transcription,
                bulk export, and the model on demand. <span className="ed-italic" style={{ color: ED.accent }}>$12 a month.</span>
              </p>

              <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", display: "grid", gap: 8 }}>
                {["Voice memos & transcription", "Bulk export to PDF and Markdown", "Unlimited AI synthesis", "Cloud sync across devices"].map((f, i) => (
                  <li key={i} className="ed-serif" style={{ fontSize: 17, color: ED.inkSoft, display: "flex", gap: 12 }}>
                    <span className="ed-mono" style={{ color: ED.accent, fontFamily: ED.serif, fontStyle: "italic", fontSize: 19, width: 24 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
                <button className="ed-btn ed-btn-ghost" onClick={() => setShowUpgrade(false)}>Not now</button>
                <button
                  className="ed-btn ed-btn-primary"
                  onClick={() => { setShowUpgrade(false); navigate("/dashboard/ai-lab"); }}
                >
                  See the Pro masthead →
                </button>
              </div>
            </EdModal>
          )}
        </AnimatePresence>

        {/* Upload Loader */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="ns-upload-overlay"
            >
              <div style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
                <p
                  className="ed-mono"
                  style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint, marginBottom: 14 }}
                >
                  Filing it into the archive…
                </p>
                <div className="ns-upload-rule" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file inputs */}
        <input type="file" accept="image/*,application/pdf" style={{ display: "none" }} ref={filePickerRef} />
        <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} ref={cameraInputRef} />
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════ */

/* ─── Article row: mono ord · serif headline · serif excerpt · mono meta · aside ─── */
const ArticleRow = ({ ord, note, onOpen, onMenu }) => {
  const hasAI = !!note.aiGeneratedAt || !!note.summary;
  const hasBody = String(note.body || "").trim().length > 0;
  const excerpt = note.summary || note.body;

  return (
    <article className="ns-article" onClick={onOpen} onContextMenu={(e) => { e.preventDefault(); onMenu(e); }}>
      <span className="ord">{String(ord).padStart(2, "0")}</span>
      <div className="body">
        <h3 className={`title ${!hasBody && !note.tag ? "ed-italic" : ""}`}>
          {note.title || <span className="ed-italic" style={{ color: ED.inkMute }}>Untitled</span>}
        </h3>
        {excerpt && (
          <p className="excerpt">{truncate(excerpt, 220)}</p>
        )}
        <div className="meta">
          <span>{fmtMetaDate(note.updated)}</span>
          {note.tag && <span>{String(note.tag).toUpperCase()}</span>}
          {hasAI && <span className="ed-chip-accent ed-chip">READ BY MODEL</span>}
          {note.locked && <span className="ed-chip">LOCKED</span>}
        </div>
      </div>
      <div className="aside">
        {note.favorite && <span className="ed-mono">★ FAVOURITED</span>}
        <button
          className="ns-menu-btn"
          onClick={(e) => { e.stopPropagation(); onMenu(e); }}
          aria-label="More"
          title="More"
        >
          ⋯
        </button>
      </div>
    </article>
  );
};

/* ─── EdModal — paper-50 card, hairline border, no shadows ─── */
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
              {subtitle && (
                <p className="ed-serif ed-italic" style={{ fontSize: 16, color: ED.inkMute, marginTop: 4, lineHeight: 1.4 }}>
                  {subtitle}
                </p>
              )}
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

/* ─── Field — label / hint / input slot ─── */
const Field = ({ label, hint, children }) => (
  <label className="ns-field">
    <span className="ns-field-label">
      <span className="ed-serif" style={{ fontSize: 17, color: ED.ink }}>{label}</span>
      {hint && (
        <span className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: ED.inkFaint, marginLeft: 10 }}>
          {hint}
        </span>
      )}
    </span>
    {children}
  </label>
);

/* ─── CtxItem ─── */
const CtxItem = ({ icon, label, onClick, danger }) => (
  <button
    type="button"
    onClick={onClick}
    className={`ns-ctx-item ${danger ? "is-danger" : ""}`}
  >
    <span className="ic">{icon}</span>
    <span className="lb">{label}</span>
  </button>
);

/* ─── FABOption ─── */
const FABOption = ({ icon, label, onClick, pro }) => (
  <button type="button" onClick={onClick} className="ns-fab-option">
    <span className="ic">{icon}</span>
    <span className="lb">{label}</span>
    {pro && <span className="ed-chip-ink ed-chip" style={{ fontSize: 9 }}>PRO</span>}
  </button>
);

/* ─── Editorial toast ─── */
const EdToast = ({ toast }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    className="ns-toast ed-card"
  >
    <span
      className="ed-mono"
      style={{
        color: toast.type === "error" ? "#a8201f" : ED.accent,
        fontFamily: ED.serif, fontStyle: "italic", fontSize: 15, marginRight: 8,
      }}
    >
      {toast.type === "error" ? "!" : "✓"}
    </span>
    <span className="ed-serif" style={{ fontSize: 16, color: ED.ink }}>{toast.message}</span>
  </motion.div>
);

/* ═══════════════════════════════════════════════════════
   SCOPED CSS
═══════════════════════════════════════════════════════ */
const NotesScopedStyles = () => (
  <style>{`
    .ns-ed .ns-notes-headrow {
      display: flex; justify-content: space-between; align-items: flex-end;
      gap: 24px; flex-wrap: wrap;
    }
    .ns-ed .ns-notes-headcta { display: flex; gap: 10px; }
    .ns-ed .ns-dotsep { padding: 0 8px; color: ${ED.rule}; }

    /* ── controls ── */
    .ns-ed .ns-notes-controls {
      display: flex; justify-content: space-between; align-items: center;
      gap: 24px; padding: 18px 0; flex-wrap: wrap;
    }
    .ns-ed .ns-notes-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .ns-ed .ns-notes-controls-right { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }

    .ns-ed .ns-filter {
      display: inline-flex; align-items: center; gap: 6px;
      font-family: ${ED.mono}; font-size: 11px; letter-spacing: 0.12em;
      text-transform: uppercase; color: ${ED.inkMute};
      padding: 7px 12px; border-radius: 999px;
      border: 1px solid ${ED.rule}; background: transparent;
      cursor: pointer; transition: all .15s ease;
    }
    .ns-ed .ns-filter:hover { border-color: ${ED.ink}; color: ${ED.ink}; }
    .ns-ed .ns-filter.on { background: ${ED.ink}; color: ${ED.paper50}; border-color: ${ED.ink}; }
    .ns-ed .ns-filter .n { opacity: 0.7; margin-left: 4px; font-size: 10.5px; }

    .ns-ed .ns-search {
      display: inline-flex; align-items: center; gap: 8px;
      background: ${ED.paper50}; border: 1px solid ${ED.rule};
      border-radius: 999px; padding: 8px 14px; min-width: 260px;
      transition: border-color .15s ease;
    }
    .ns-ed .ns-search:focus-within { border-color: ${ED.ink}; }
    .ns-ed .ns-search input {
      background: transparent; border: 0; outline: 0; flex: 1;
      font-family: ${ED.mono}; font-size: 12px; letter-spacing: 0.06em; color: ${ED.inkSoft};
    }
    .ns-ed .ns-search input::placeholder { color: ${ED.inkFaint}; }
    .ns-ed .ns-clear {
      width: 18px; height: 18px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      background: transparent; color: ${ED.inkFaint}; border: 0; cursor: pointer;
    }
    .ns-ed .ns-clear:hover { color: ${ED.ink}; }

    .ns-ed .ns-view-toggle {
      display: inline-flex; border: 1px solid ${ED.rule}; border-radius: 999px;
      overflow: hidden;
    }
    .ns-ed .ns-view-toggle button {
      font-family: ${ED.mono}; font-size: 10.5px; letter-spacing: 0.14em;
      text-transform: uppercase; padding: 8px 14px; color: ${ED.inkMute};
      background: transparent; border: 0; cursor: pointer;
      transition: all .15s ease;
    }
    .ns-ed .ns-view-toggle button:hover { color: ${ED.ink}; }
    .ns-ed .ns-view-toggle button.on { background: ${ED.ink}; color: ${ED.paper50}; }
    .ns-ed .ns-view-toggle button + button { border-left: 1px solid ${ED.rule}; }
    .ns-ed .ns-view-toggle button.on + button,
    .ns-ed .ns-view-toggle button + button.on { border-left-color: ${ED.ink}; }

    /* ── article list ── */
    .ns-ed .ns-articles { padding: 8px 0 24px; }
    .ns-ed .ns-articles.is-columns {
      columns: 2; column-gap: 56px;
      column-rule: 1px solid ${ED.rule};
    }
    .ns-ed .ns-articles.is-columns .ns-article {
      break-inside: avoid;
      -webkit-column-break-inside: avoid;
    }

    .ns-ed .ns-article {
      display: grid;
      grid-template-columns: 56px minmax(0, 1fr) minmax(0, 140px);
      gap: 18px;
      padding: 22px 14px;
      border-bottom: 1px solid ${ED.ruleSoft};
      cursor: pointer; transition: background-color .12s ease, padding .12s ease;
      align-items: start;
    }
    .ns-ed .ns-article:hover { background: ${ED.paper150}; padding-left: 18px; }
    .ns-ed .ns-article .ord {
      font-family: ${ED.mono}; font-size: 11px; letter-spacing: 0.14em;
      color: ${ED.inkFaint}; padding-top: 6px; transition: all .15s ease;
    }
    .ns-ed .ns-article:hover .ord {
      color: ${ED.accent}; font-family: ${ED.serif}; font-style: italic; font-size: 17px;
    }
    .ns-ed .ns-article .body { min-width: 0; max-width: 760px; }
    .ns-ed .ns-article .title {
      font-family: ${ED.serif}; font-size: clamp(20px, 1.8vw, 26px);
      line-height: 1.22; color: ${ED.ink}; margin: 0; padding-bottom: 0.04em;
      transition: color .15s ease;
    }
    .ns-ed .ns-article:hover .title { color: ${ED.accent}; }
    .ns-ed .ns-article .excerpt {
      font-family: ${ED.serif}; font-size: 16px; line-height: 1.5;
      color: ${ED.inkMute}; margin: 8px 0 0 0;
      display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
      overflow: hidden;
    }
    .ns-ed .ns-article .meta {
      font-family: ${ED.mono}; font-size: 10.5px; letter-spacing: 0.14em;
      text-transform: uppercase; color: ${ED.inkFaint};
      margin-top: 12px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    }
    .ns-ed .ns-article .aside {
      font-family: ${ED.mono}; font-size: 10.5px; letter-spacing: 0.14em;
      text-transform: uppercase; color: ${ED.inkFaint};
      padding-top: 8px; min-width: 0; text-align: right;
      display: flex; gap: 12px; align-items: center; justify-content: flex-end;
    }
    .ns-ed .ns-menu-btn {
      width: 28px; height: 28px; border-radius: 999px; border: 1px solid transparent;
      background: transparent; color: ${ED.inkFaint}; cursor: pointer;
      font-size: 16px; line-height: 1; letter-spacing: 1px;
      transition: all .15s ease;
    }
    .ns-ed .ns-menu-btn:hover { border-color: ${ED.rule}; color: ${ED.ink}; background: ${ED.paper50}; }

    /* ── columns layout: collapse aside ── */
    .ns-ed .ns-articles.is-columns .ns-article {
      grid-template-columns: 44px 1fr;
      padding: 16px 8px;
    }
    .ns-ed .ns-articles.is-columns .ns-article .aside { display: none; }
    .ns-ed .ns-articles.is-columns .ns-article .title { font-size: 20px; }

    /* ── mobile narrow: collapse aside, smaller row ── */
    @media (max-width: 720px) {
      .ns-ed .ns-article {
        grid-template-columns: 36px 1fr;
        padding: 16px 6px;
      }
      .ns-ed .ns-article .aside { display: none; }
      .ns-ed .ns-article .title { font-size: 19px; }
      .ns-ed .ns-articles.is-columns { columns: 1; }
    }

    /* ── ctx menu ── */
    .ns-ed .ns-ctx-overlay {
      position: fixed; inset: 0; z-index: 90;
      background: rgba(19,16,8,0.16);
    }
    .ns-ed .ns-ctx {
      position: fixed; z-index: 200;
      min-width: 200px; padding: 6px;
      background: ${ED.paper50};
    }
    .ns-ed .ns-ctx-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; width: 100%; text-align: left;
      border: 0; background: transparent; cursor: pointer;
      color: ${ED.ink}; border-radius: 6px;
      transition: background-color .12s ease;
    }
    .ns-ed .ns-ctx-item:hover { background: ${ED.paper150}; }
    .ns-ed .ns-ctx-item .ic { color: ${ED.inkFaint}; }
    .ns-ed .ns-ctx-item .lb { font-family: ${ED.serif}; font-size: 16px; }
    .ns-ed .ns-ctx-item.is-danger .lb { color: #a8201f; }
    .ns-ed .ns-ctx-item.is-danger .ic { color: #a8201f; }

    /* ── modal ── */
    .ns-ed .ns-modal-bg {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(19,16,8,0.32);
    }
    .ns-ed .ns-modal-wrap {
      position: fixed; inset: 0; z-index: 201;
      display: flex; align-items: center; justify-content: center;
      padding: 20px; pointer-events: none;
      overflow-y: auto;
    }
    .ns-ed .ns-modal {
      width: 100%; max-width: 560px; padding: 28px;
      max-height: calc(100dvh - 40px); overflow-y: auto;
      pointer-events: auto;
    }
    .ns-ed .ns-modal-close {
      width: 32px; height: 32px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid ${ED.rule}; color: ${ED.inkSoft};
      background: transparent; cursor: pointer;
      transition: all .15s ease;
    }
    .ns-ed .ns-modal-close:hover { border-color: ${ED.ink}; color: ${ED.ink}; }

    /* ── form fields ── */
    .ns-ed .ns-field { display: block; }
    .ns-ed .ns-field-label {
      display: flex; align-items: baseline; gap: 8px;
      margin-bottom: 8px; flex-wrap: wrap;
    }
    .ns-ed .ns-input {
      width: 100%;
      padding: 11px 14px;
      background: ${ED.paper50};
      border: 1px solid ${ED.rule};
      border-radius: 8px;
      font-family: ${ED.sans}; font-size: 14px; color: ${ED.ink};
      transition: border-color .15s ease;
      resize: vertical;
    }
    .ns-ed .ns-input:focus { outline: 0; border-color: ${ED.ink}; }
    .ns-ed .ns-input::placeholder { color: ${ED.inkFaint}; }
    .ns-ed .ns-input.ns-pin {
      text-align: center; letter-spacing: 0.6em; font-size: 22px;
      padding: 16px 14px; font-family: ${ED.mono};
    }
    .ns-ed .ns-cat {
      font-family: ${ED.mono}; font-size: 10.5px; letter-spacing: 0.14em;
      text-transform: uppercase; padding: 7px 12px; border-radius: 999px;
      border: 1px solid ${ED.rule}; color: ${ED.inkMute};
      background: transparent; cursor: pointer; transition: all .15s ease;
    }
    .ns-ed .ns-cat:hover { border-color: ${ED.ink}; color: ${ED.ink}; }
    .ns-ed .ns-cat.on { background: ${ED.ink}; color: ${ED.paper50}; border-color: ${ED.ink}; }

    /* ── recorder ── */
    .ns-ed .ns-rec-state {
      min-height: 48px; display: flex; align-items: center; justify-content: center;
      padding: 12px 0;
    }
    .ns-ed .ns-rec-bars {
      display: flex; align-items: center; gap: 4px; height: 28px;
    }
    .ns-ed .ns-rec-bars span {
      display: block; width: 3px; border-radius: 1px;
      background: ${ED.accent};
    }

    /* ── upload overlay ── */
    .ns-ed .ns-upload-overlay {
      position: fixed; inset: 0; z-index: 300;
      display: flex; align-items: center; justify-content: center;
      background: rgba(246,241,227,0.92);
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
    }
    .ns-ed .ns-upload-rule {
      height: 1px;
      background: linear-gradient(90deg, transparent, ${ED.ink}, transparent);
      background-size: 200% 100%;
      animation: ns-upload-shimmer 1.6s linear infinite;
    }
    @keyframes ns-upload-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ── toast ── */
    .ns-ed .ns-toast {
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      z-index: 10000;
      display: inline-flex; align-items: center;
      padding: 11px 18px;
      background: ${ED.paper50};
    }

    /* ── mobile FAB ── */
    .ns-ed .ns-fab {
      position: fixed; z-index: 140;
      display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
    }
    @media (min-width: 768px) { .ns-ed .ns-fab { display: none; } }
    .ns-ed .ns-fab-btn {
      width: 52px; height: 52px; border-radius: 999px;
      background: ${ED.ink}; color: ${ED.paper50};
      border: 0; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(19,16,8,0.18);
      transition: background-color .15s ease;
    }
    .ns-ed .ns-fab-btn:hover { background: ${ED.inkSoft}; }
    .ns-ed .ns-fab-menu {
      padding: 6px; display: flex; flex-direction: column; gap: 2px;
      background: ${ED.paper50}; min-width: 180px;
    }
    .ns-ed .ns-fab-option {
      display: flex; align-items: center; gap: 12px;
      padding: 9px 12px; border-radius: 6px;
      border: 0; background: transparent; cursor: pointer;
      color: ${ED.ink}; transition: background-color .12s ease;
      text-align: left;
    }
    .ns-ed .ns-fab-option:hover { background: ${ED.paper150}; }
    .ns-ed .ns-fab-option .ic { color: ${ED.inkFaint}; }
    .ns-ed .ns-fab-option .lb { font-family: ${ED.serif}; font-size: 15px; flex: 1; }

    @media (max-width: 720px) {
      .ns-ed .ns-notes-headrow { flex-direction: column; align-items: flex-start; gap: 16px; }
      .ns-ed .ns-notes-headcta { width: 100%; flex-direction: column; }
      .ns-ed .ns-notes-headcta .ed-btn { width: 100%; justify-content: center; }
      .ns-ed .ns-notes-controls { flex-direction: column; align-items: stretch; gap: 12px; }
      .ns-ed .ns-search { min-width: 0; }
      .ns-ed .ns-notes-controls-right { flex-direction: column; align-items: stretch; }
    }
  `}</style>
);
