import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiHeart,
  FiLock,
  FiGrid,
  FiList,
  FiX,
  FiSearch,
  FiMic,
  FiUpload,
  FiCamera,
  FiChevronRight,
  FiZap,
  FiFilter,
} from "react-icons/fi";
import { createPortal } from "react-dom";
import { Note, FilePlus, Crown, Fire, Lightning } from "phosphor-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import NoteCard from "../components/NoteCard";
import NoteRow from "../components/NoteRow";
import NoteView from "./NoteView";
import { useSubscription } from "../hooks/useSubscription";
import { useMobileNav } from "../hooks/useMobileNav";

import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
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
  { id: "all", label: "All", icon: Note },
  { id: "favorites", label: "Favorites", icon: FiHeart },
  { id: "locked", label: "Private", icon: FiLock },
  { id: "voice", label: "Voice", icon: FiMic },
];

/* ─── scoped styles ─── */
const NOTES_STYLES = `
@keyframes ns-notes-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes ns-notes-fade-up {
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}
.ns-notes-stagger > * {
  animation: ns-notes-fade-up 0.4s cubic-bezier(.22,1,.36,1) both;
}
.ns-notes-stagger > *:nth-child(1) { animation-delay: 0.03s; }
.ns-notes-stagger > *:nth-child(2) { animation-delay: 0.06s; }
.ns-notes-stagger > *:nth-child(3) { animation-delay: 0.09s; }
.ns-notes-stagger > *:nth-child(4) { animation-delay: 0.12s; }
.ns-notes-stagger > *:nth-child(5) { animation-delay: 0.15s; }
.ns-notes-stagger > *:nth-child(6) { animation-delay: 0.18s; }
.ns-notes-stagger > *:nth-child(7) { animation-delay: 0.21s; }
.ns-notes-stagger > *:nth-child(8) { animation-delay: 0.24s; }

.ns-notes-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: var(--card-glass-bg, var(--bg-surface));
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--card-glass-border, var(--border-secondary));
  box-shadow: var(--card-glass-shadow, 0 8px 32px rgba(0,0,0,0.12));
  transition: transform 0.25s cubic-bezier(.22,1,.36,1), box-shadow 0.25s ease;
}
.ns-notes-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--card-glass-shadow, 0 12px 40px rgba(0,0,0,0.18));
}
.ns-notes-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%);
  pointer-events: none;
  z-index: 1;
}
.ns-notes-card::after {
  content: '';
  position: absolute;
  left: 24px; right: 24px; top: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
  pointer-events: none;
  z-index: 2;
}

.ns-search-glow:focus-within {
  border-color: rgba(99,102,241,0.4) !important;
  box-shadow: 0 0 20px rgba(99,102,241,0.08), 0 4px 16px rgba(0,0,0,0.1) !important;
}
`;

export default function Notes() {
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

  const supabaseReady = typeof isSupabaseConfigured === "function" ? isSupabaseConfigured() : !!isSupabaseConfigured;

  const [selectedNote, setSelectedNote] = useState(null);
  const [gridView, setGridView] = useState(true);
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

  /* ─── ALL HELPERS (unchanged) ─── */
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

  /* ─── ALL useEffects (unchanged) ─── */

  // Load notes
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

  // Quick Create from Sidebar
  useEffect(() => {
    const qc = location.state?.quickCreate;
    if (!qc) return;
    window.history.replaceState({}, document.title);
    if (qc === "note") setEditorOpen(true);
    else if (qc === "voice") openVoiceRecorder();
    else if (qc === "upload") filePickerRef.current?.click();
  }, [location.state?.ts]);

  // URL-based note selection
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

  /* ─── Derived state ─── */
  const filteredNotes = useMemo(() => {
    let filtered = notes;
    switch (activeFilter) {
      case "favorites": filtered = filtered.filter((n) => n.favorite); break;
      case "locked": filtered = filtered.filter((n) => n.locked); break;
      case "voice": filtered = filtered.filter((n) => n.tag === "Voice"); break;
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

  /* ─── Note operations (all unchanged) ─── */
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
      if (isManual) { setAiToast({ message: "AI analysis complete ✨", type: "success" }); setTimeout(() => setAiToast(null), 3000); }
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

  /* ─── PIN operations (unchanged) ─── */
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

  /* ─── File upload (unchanged) ─── */
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

  /* ─── Voice recording (unchanged) ─── */
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

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e) => { if (showAddMenu && !e.target.closest(".fab-zone")) setShowAddMenu(false); };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showAddMenu]);

  useEffect(() => {
    if (cameraInputRef.current) cameraInputRef.current.onchange = handleScanCapture;
    if (filePickerRef.current) filePickerRef.current.onchange = handleFileUpload;
  }, []);

  /* ─── Loading state ─── */
  if (isLoading || notesLoading) {
    return (
      <>
        <style>{NOTES_STYLES}</style>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full" style={{ border: "2.5px solid transparent", borderTopColor: "rgba(99,102,241,0.8)", borderRightColor: "rgba(168,85,247,0.4)", animation: "spin 0.8s linear infinite" }} />
            <div className="absolute inset-2 rounded-full" style={{ border: "2px solid transparent", borderBottomColor: "rgba(6,182,212,0.6)", animation: "spin 1.2s linear infinite reverse" }} />
            <Note size={20} weight="duotone" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading notes…</p>
        </div>
      </>
    );
  }

  /* ─── Note View ─── */
  if (selectedNote) {
    return (
      <>
        <style>{NOTES_STYLES}</style>
        <AnimatePresence>
          {aiToast && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 left-1/2 -translate-x-1/2 z-[10000] px-4 py-3 rounded-xl text-sm font-medium shadow-xl flex items-center gap-2 ${aiToast.type === "error" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"}`}
            >{aiToast.type === "success" ? "✨" : "⚠️"} {aiToast.message}</motion.div>
          )}
        </AnimatePresence>
        <NoteView note={selectedNote} onBack={() => { setSelectedNote(null); navigate("/dashboard/notes"); }} onFavoriteToggle={handleFavorite} onEditSave={onEditSave} onDelete={handleDelete} onLockToggle={handleLockToggle} isPro={isPro} canUseExport={canUseExport} canUseVoice={canUseVoice} onRequireUpgrade={() => setShowUpgrade(true)} onAnalyze={(noteId, title, body) => runNoteAnalysis(noteId, title, body, true)} isAnalyzing={analyzingNoteId === selectedNote?.id} />
      </>
    );
  }

  /* ═══════════════════════════════════════════════════════
     REDESIGNED RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <>
      <style>{NOTES_STYLES}</style>

      <div className="space-y-5 pb-[calc(var(--mobile-nav-height)+100px)]">
        {/* AI Toast */}
        <AnimatePresence>
          {aiToast && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 left-1/2 -translate-x-1/2 z-[10000] px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl flex items-center gap-2 ${aiToast.type === "error" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"}`}
            >{aiToast.type === "success" ? "✨" : "⚠️"} {aiToast.message}</motion.div>
          )}
        </AnimatePresence>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            HEADER — gradient accent line + stats
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.12))", border: "1px solid rgba(99,102,241,0.28)" }}>
                <Note weight="duotone" size={22} className="text-indigo-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>My Notes</h1>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {notes.length} notes • {filterCounts.favorites} favorites
                </p>
              </div>
            </div>

            {/* Desktop: New Note button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setEditorOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
              }}
            >
              <FiPlus size={16} />
              New Note
            </motion.button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2.5">
            <StatMini value={notes.length} label="Total" accent="#818cf8" icon={<Note size={14} weight="duotone" />} />
            <StatMini value={filterCounts.favorites} label="Favorites" accent="#f43f5e" icon={<FiHeart size={13} />} />
            <StatMini value={filterCounts.locked} label="Private" accent="#f59e0b" icon={<FiLock size={13} />} />
          </div>
        </motion.header>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SEARCH + VIEW TOGGLE
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <div
            className="ns-search-glow flex items-center w-full rounded-2xl px-4 py-2.5 transition-all duration-200 border"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: query ? "rgba(99,102,241,0.4)" : "var(--border-secondary)",
              boxShadow: query ? "0 0 20px rgba(99,102,241,0.08)" : "none",
            }}
          >
            <FiSearch className="w-5 h-5 mr-3 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search notes..."
              className="flex-1 bg-transparent outline-none min-w-0"
              style={{ color: "var(--text-primary)", fontSize: "15px" }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
            />
            {query && (
              <button onClick={() => setQuery("")} className="p-1.5 rounded-full transition ml-2" style={{ color: "var(--text-muted)" }}>
                <FiX size={16} />
              </button>
            )}
            <div className="flex items-center gap-1 ml-3 pl-3 border-l" style={{ borderColor: "var(--border-secondary)" }}>
              <button onClick={() => setGridView(true)} className="p-2 rounded-lg transition"
                style={{ backgroundColor: gridView ? "rgba(99,102,241,0.12)" : "transparent", color: gridView ? "#818cf8" : "var(--text-muted)" }}>
                <FiGrid size={15} />
              </button>
              <button onClick={() => setGridView(false)} className="p-2 rounded-lg transition"
                style={{ backgroundColor: !gridView ? "rgba(99,102,241,0.12)" : "transparent", color: !gridView ? "#818cf8" : "var(--text-muted)" }}>
                <FiList size={15} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            FILTER PILLS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        >
          {FILTERS.map((filter) => {
            const isAct = activeFilter === filter.id;
            const count = filterCounts[filter.id];
            const IconComp = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all"
                style={{
                  background: isAct ? "rgba(99,102,241,0.12)" : "transparent",
                  border: `1px solid ${isAct ? "rgba(99,102,241,0.28)" : "transparent"}`,
                  color: isAct ? "#818cf8" : "var(--text-secondary)",
                }}
              >
                <IconComp size={13} weight={filter.id === "all" ? "duotone" : undefined} />
                {filter.label}
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold"
                  style={{ background: isAct ? "rgba(99,102,241,0.15)" : "var(--bg-tertiary)", color: isAct ? "#818cf8" : "var(--text-muted)" }}>
                  {count}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            NOTES GRID
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className={`ns-notes-stagger grid ${gridView ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3" : "grid-cols-1 gap-2"}`}>
            {filteredNotes.length === 0 ? (
              <div className={gridView ? "col-span-2 sm:col-span-2 md:col-span-3 xl:col-span-4" : "col-span-1"}>
                <div className="ns-notes-card">
                  <div className="relative z-10 py-16 text-center px-6">
                    <div className="h-16 w-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)" }}>
                      {activeFilter === "favorites" ? <FiHeart size={28} className="text-indigo-400" /> :
                       activeFilter === "locked" ? <FiLock size={28} className="text-indigo-400" /> :
                       activeFilter === "voice" ? <FiMic size={28} className="text-indigo-400" /> :
                       <Note size={28} weight="duotone" className="text-indigo-400" />}
                    </div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                      {query ? "No notes found" : `No ${activeFilter === "all" ? "" : activeFilter + " "}notes yet`}
                    </h3>
                    <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: "var(--text-muted)" }}>
                      {query ? "Try a different search term" : activeFilter === "favorites" ? "Mark notes as favorites to see them here" : activeFilter === "locked" ? "Lock notes to keep them private" : activeFilter === "voice" ? "Record voice notes to see them here" : "Create your first note to get started"}
                    </p>
                    {!query && activeFilter === "all" && (
                      <button onClick={() => setEditorOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
                        <FiPlus size={16} /> Create Note
                      </button>
                    )}
                    {activeFilter !== "all" && (
                      <button onClick={() => setActiveFilter("all")} className="text-xs font-medium transition" style={{ color: "#818cf8" }}>← View all notes</button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              filteredNotes.map((note) =>
                gridView ? (
                  <NoteCard key={note.id} note={note}
                    onMenu={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); setMenuPos({ x: Math.min(rect.right - 180, window.innerWidth - rightGutter - 200), y: rect.bottom + 8 }); setActiveMenuId(note.id); }}
                    onOpen={() => tryOpenNote(note)} />
                ) : (
                  <NoteRow key={note.id} note={note}
                    onOpen={() => tryOpenNote(note)}
                    onLongPress={() => {}} onArchive={() => {}}
                    onDelete={() => handleDelete(note.id)}
                    onMenu={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); setMenuPos({ x: Math.min(rect.right - 180, window.innerWidth - 200 - rightGutter), y: rect.bottom + 8 }); setActiveMenuId(note.id); }} />
                )
              )
            )}
          </div>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            CONTEXT MENU
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <AnimatePresence>
          {activeMenuId && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90]" style={{ backgroundColor: "var(--bg-overlay)", backdropFilter: "blur(4px)" }}
                onClick={() => setActiveMenuId(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="fixed rounded-2xl border shadow-xl z-[200] min-w-[180px] overflow-hidden"
                style={{ top: menuPos.y, left: menuPos.x, backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)", boxShadow: "0 16px 48px rgba(0,0,0,0.3)" }}>
                <div className="p-2">
                  <CtxItem icon={<FiEdit2 size={15} />} label="Open" onClick={() => { const n = notes.find((x) => x.id === activeMenuId); if (n) tryOpenNote(n); setActiveMenuId(null); }} />
                  <CtxItem icon={<FiHeart size={15} style={notes.find((n) => n.id === activeMenuId)?.favorite ? { color: "var(--accent-rose)", fill: "var(--accent-rose)" } : {}} />}
                    label={notes.find((n) => n.id === activeMenuId)?.favorite ? "Unfavorite" : "Favorite"}
                    onClick={() => { handleFavorite(activeMenuId); setActiveMenuId(null); }} />
                  <CtxItem icon={<FiLock size={15} />} label={notes.find((n) => n.id === activeMenuId)?.locked ? "Unlock" : "Lock"}
                    onClick={() => { handleLockToggle(activeMenuId); setActiveMenuId(null); }} />
                  <CtxItem icon={<FiZap size={15} />} label={analyzingNoteId === activeMenuId ? "Analyzing..." : "Analyze"}
                    onClick={() => { const n = notes.find((x) => x.id === activeMenuId); if (n) runNoteAnalysis(n.id, n.title, n.body, true); setActiveMenuId(null); }} />
                  <div className="h-px my-1" style={{ backgroundColor: "var(--border-secondary)" }} />
                  <CtxItem icon={<FiTrash2 size={15} />} label="Delete" danger onClick={() => { handleDelete(activeMenuId); setActiveMenuId(null); }} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            FAB (Mobile)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="fab-zone fixed bottom-[calc(var(--mobile-nav-height)+16px)] z-[140] md:hidden" style={{ right: 16 + rightGutter, willChange: "transform" }}>
          <AnimatePresence initial={false} mode="wait">
            {showAddMenu && (
              <motion.div key="fab-menu" initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96, transition: { duration: 0.14, ease: "easeOut" } }}
                transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.7 }}
                className="absolute bottom-14 right-0 flex flex-col gap-1.5 min-w-[140px]"
                style={{ transformOrigin: "bottom right", willChange: "transform, opacity", pointerEvents: showAddMenu ? "auto" : "none" }}>
                <FABOption icon={<FiEdit2 size={15} />} label="New Note" onClick={() => { setEditorOpen(true); setShowAddMenu(false); }} />
                <FABOption icon={<FiMic size={15} />} label="Voice Note" pro={!canUseVoice} onClick={() => { openVoiceRecorder(); setShowAddMenu(false); }} />
                <FABOption icon={<FiCamera size={15} />} label="Scan" onClick={() => { cameraInputRef.current?.click(); setShowAddMenu(false); }} />
                <FABOption icon={<FiUpload size={15} />} label="Upload" onClick={() => { filePickerRef.current?.click(); setShowAddMenu(false); }} />
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button type="button" onClick={() => setShowAddMenu((v) => !v)}
            className="fab-glass-button w-12 h-12 rounded-[14px] flex items-center justify-center relative"
            aria-label={showAddMenu ? "Close menu" : "Open menu"} aria-expanded={!!showAddMenu}
            animate={{ rotate: showAddMenu ? 45 : 0 }} whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.8 }}
            style={{ transformOrigin: "50% 50%", willChange: "transform" }}>
            <div className="absolute inset-0 rounded-[14px] pointer-events-none" style={{ background: "var(--fab-inner-glow)" }} />
            <div className="absolute inset-x-2 top-0 h-[1px] pointer-events-none" style={{ background: "var(--fab-specular)" }} />
            <FiPlus size={22} strokeWidth={2.5} className="relative z-10" style={{ color: "var(--fab-icon)" }} />
          </motion.button>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MODALS (all use shared Modal component)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

        {/* New Note */}
        <AnimatePresence>
          {editorOpen && (
            <Modal onClose={() => setEditorOpen(false)}>
              <ModalHead icon={<FilePlus size={20} weight="duotone" className="text-indigo-400" />} iconBg="rgba(99,102,241,0.15)" iconBorder="rgba(99,102,241,0.25)" title="New Note" sub="Create a new note" onClose={() => setEditorOpen(false)} />
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold mb-2 block" style={{ color: "var(--text-muted)" }}>Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[{ id: "meeting", label: "Meeting" }, { id: "study", label: "Study" }, { id: "task", label: "Tasks" }, { id: "personal", label: "Personal" }, { id: "idea", label: "Ideas" }].map((c) => {
                      const active = newCategory === c.id;
                      return (
                        <button key={c.id} type="button" onClick={() => setNewCategory(c.id)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold transition"
                          style={{ background: active ? "rgba(99,102,241,0.12)" : "var(--bg-input)", border: `1px solid ${active ? "rgba(99,102,241,0.3)" : "var(--border-secondary)"}`, color: active ? "#818cf8" : "var(--text-secondary)" }}>
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold mb-2 block" style={{ color: "var(--text-muted)" }}>Tags (optional)</label>
                  <input className="w-full border rounded-xl px-4 py-3 focus:outline-none transition" style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)", color: "var(--text-primary)", fontSize: "15px" }}
                    placeholder="e.g. sprint, client, budget" value={newTagsInput} onChange={(e) => setNewTagsInput(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold mb-2 block" style={{ color: "var(--text-muted)" }}>Title</label>
                  <input className="w-full border rounded-xl px-4 py-3 focus:outline-none transition" style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)", color: "var(--text-primary)", fontSize: "15px" }}
                    placeholder="Note title..." maxLength={80} value={newNote.title} onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} autoFocus />
                </div>
                <div>
                  <label className="text-[11px] font-semibold mb-2 block" style={{ color: "var(--text-muted)" }}>Content</label>
                  <textarea className="w-full border rounded-xl px-4 py-3 focus:outline-none resize-none transition" style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)", color: "var(--text-secondary)", fontSize: "15px" }}
                    placeholder="Start writing..." rows={4} value={newNote.body} onChange={(e) => setNewNote({ ...newNote, body: e.target.value })} />
                </div>
              </div>
              <div className="p-4 border-t" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-tertiary)" }}>
                <button type="button" onClick={createNote}
                  className="w-full py-3 rounded-xl font-semibold transition hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 text-white"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
                  <FiPlus size={18} /> Create Note
                </button>
              </div>
            </Modal>
          )}
        </AnimatePresence>

        {/* PIN Modal */}
        <AnimatePresence>
          {pinModalOpen && (
            <Modal onClose={() => { setPinModalOpen(false); setPinInput(""); setPinMode(null); setPendingNoteId(null); }}>
              <ModalHead icon={<FiLock size={18} style={{ color: pinMode === "set" ? "#818cf8" : "#f59e0b" }} />}
                iconBg={pinMode === "set" ? "rgba(99,102,241,0.15)" : "rgba(245,158,11,0.15)"}
                iconBorder={pinMode === "set" ? "rgba(99,102,241,0.25)" : "rgba(245,158,11,0.25)"}
                title={pinMode === "set" ? "Set PIN" : "Enter PIN"} sub={pinMode === "set" ? "Create a 4-digit PIN" : "Enter your PIN to unlock"} />
              <div className="p-5">
                <input className="w-full border rounded-xl px-4 py-4 text-center tracking-[0.5em] text-xl font-mono focus:outline-none transition"
                  style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)", color: "var(--text-primary)", fontSize: "20px" }}
                  type="password" inputMode="numeric" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))} placeholder="••••" autoFocus />
              </div>
              <div className="p-4 border-t" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-tertiary)" }}>
                <button onClick={handlePinSubmit} className="w-full py-3 rounded-xl font-semibold transition hover:opacity-90 active:scale-[0.98] text-white"
                  style={{ background: pinMode === "set" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "linear-gradient(135deg, #f59e0b, #f97316)" }}>
                  {pinMode === "set" ? "Save PIN" : "Unlock"}
                </button>
              </div>
            </Modal>
          )}
        </AnimatePresence>

        {/* Voice Recorder Modal */}
        <AnimatePresence>
          {recOpen && (
            <Modal onClose={closeRecorder}>
              <ModalHead icon={<FiMic size={18} style={{ color: recState === "recording" ? "#f43f5e" : "#818cf8" }} />}
                iconBg={recState === "recording" ? "rgba(244,63,94,0.15)" : "rgba(99,102,241,0.15)"}
                iconBorder={recState === "recording" ? "rgba(244,63,94,0.25)" : "rgba(99,102,241,0.25)"}
                title="Voice Note" sub="Record and save" onClose={closeRecorder} />
              <div className="p-5">
                {recError ? (
                  <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", color: "#f43f5e" }}>{recError}</div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-6 rounded-xl border text-center" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-input)" }}>
                      {recState === "recording" ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <motion.div key={i} className="w-1 rounded-full" style={{ backgroundColor: "#f43f5e" }}
                                animate={{ height: [8, 24, 8] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }} />
                            ))}
                          </div>
                          <p className="text-sm font-semibold flex items-center justify-center gap-2" style={{ color: "#f43f5e" }}>
                            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#f43f5e" }} /> Recording...
                          </p>
                        </div>
                      ) : recState === "stopped" ? (
                        <div className="space-y-2">
                          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
                            <FiMic style={{ color: "#10b981" }} size={20} />
                          </div>
                          <p className="text-sm font-semibold" style={{ color: "#10b981" }}>Saved!</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)" }}>
                            <FiMic style={{ color: "#818cf8" }} size={20} />
                          </div>
                          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Ready to record</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={startRecording} disabled={recState !== "idle"}
                        className="flex-1 px-4 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                        style={{ opacity: recState !== "idle" ? 0.5 : 1, cursor: recState !== "idle" ? "not-allowed" : "pointer", background: recState !== "idle" ? "var(--bg-tertiary)" : "linear-gradient(135deg, #6366f1, #8b5cf6)", color: recState !== "idle" ? "var(--text-muted)" : "white" }}>
                        <FiMic size={16} /> Start
                      </button>
                      <button onClick={stopRecording} disabled={recState !== "recording"}
                        className="flex-1 px-4 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                        style={{ opacity: recState !== "recording" ? 0.5 : 1, cursor: recState !== "recording" ? "not-allowed" : "pointer", background: recState !== "recording" ? "var(--bg-tertiary)" : "linear-gradient(135deg, #f43f5e, #e11d48)", color: recState !== "recording" ? "var(--text-muted)" : "white" }}>
                        <FiX size={16} /> Stop
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {recState === "stopped" && (
                <div className="p-4 border-t" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-tertiary)" }}>
                  <button onClick={closeRecorder} className="w-full py-3 rounded-xl font-medium transition border" style={{ borderColor: "var(--border-secondary)", color: "var(--text-secondary)" }}>Done</button>
                </div>
              )}
            </Modal>
          )}
        </AnimatePresence>

        {/* Upgrade Modal */}
        <AnimatePresence>
          {showUpgrade && (
            <Modal onClose={() => setShowUpgrade(false)}>
              <ModalHead icon={<Crown size={22} weight="fill" style={{ color: "#f59e0b" }} />}
                iconBg="rgba(245,158,11,0.15)" iconBorder="rgba(245,158,11,0.25)" title="Pro Feature" sub="Upgrade to unlock" />
              <div className="p-5">
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                  Voice Notes and Advanced Export are available on Pro. Upgrade to unlock these powerful features.
                </p>
                <div className="p-3 rounded-xl border" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}>
                  <p className="text-[10px] mb-2 font-semibold" style={{ color: "var(--text-muted)" }}>Pro includes:</p>
                  <ul className="space-y-1.5">
                    {["Voice notes & transcription", "Advanced export", "Unlimited AI", "Cloud sync"].map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "#818cf8" }} /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="p-4 border-t flex gap-3" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-tertiary)" }}>
                <button onClick={() => setShowUpgrade(false)} className="flex-1 px-4 py-3 rounded-xl font-medium border transition" style={{ borderColor: "var(--border-secondary)", color: "var(--text-secondary)" }}>Not now</button>
                <button onClick={() => { setShowUpgrade(false); navigate("/dashboard/ai-lab"); }}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition text-white"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
                  <Crown size={16} weight="fill" /> Upgrade
                </button>
              </div>
            </Modal>
          )}
        </AnimatePresence>

        {/* Upload Loader */}
        <AnimatePresence>
          {uploading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}>
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}>
                <FiUpload size={32} className="animate-bounce text-indigo-400" />
              </div>
              <div className="w-48 h-1.5 rounded-full overflow-hidden mb-4" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-full w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
              </div>
              <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>Uploading...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file inputs */}
        <input type="file" accept="image/*,application/pdf" style={{ display: "none" }} ref={filePickerRef} />
        <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} ref={cameraInputRef} />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════ */

const StatMini = ({ value, label, accent, icon }) => (
  <div className="ns-notes-card">
    <div className="relative z-10 p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1" style={{ color: accent }}>{icon}</div>
      <p className="text-xl font-extrabold" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
    </div>
  </div>
);

const CtxItem = ({ icon, label, onClick, danger }) => (
  <button onClick={onClick} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left w-full"
    style={{ color: danger ? "#f43f5e" : "var(--text-secondary)" }}
    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = danger ? "rgba(244,63,94,0.1)" : "var(--bg-hover)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const Modal = ({ children, onClose }) => {
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200]" style={{ backgroundColor: "var(--bg-overlay)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
        onClick={onClose} />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
        style={{ paddingTop: "max(env(safe-area-inset-top), 16px)", paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}>
        <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="w-full max-w-md rounded-3xl border shadow-xl overflow-hidden pointer-events-auto"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)", maxHeight: "calc(100dvh - 32px)", boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}
          onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-secondary)" }} />
          </div>
          <div className="max-h-[calc(100dvh-32px)] overflow-y-auto">{children}</div>
        </motion.div>
      </div>
    </>,
    document.body
  );
};

const ModalHead = ({ icon, iconBg, iconBorder, title, sub, onClose }) => (
  <div className="p-4 border-b" style={{ borderColor: "var(--border-secondary)" }}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: iconBg, border: `1px solid ${iconBorder}` }}>{icon}</div>
        <div>
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{title}</h3>
          {sub && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{sub}</p>}
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center transition" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
          <FiX size={16} />
        </button>
      )}
    </div>
  </div>
);

const FABOption = ({ icon, label, onClick, pro }) => (
  <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onClick}
    className="fab-option-glass flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200">
    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: "var(--fab-opt-icon-bg)", border: "1px solid var(--fab-opt-icon-border)", boxShadow: "var(--fab-opt-icon-shadow)" }}>
      <span style={{ color: "var(--fab-opt-icon-color)" }}>{icon}</span>
    </div>
    <span className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: "var(--fab-opt-text)" }}>
      {label}
      {pro && <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: "var(--pro-badge-bg)", border: "1px solid var(--pro-badge-border)", color: "var(--pro-badge-text)" }}>PRO</span>}
    </span>
  </motion.button>
);
