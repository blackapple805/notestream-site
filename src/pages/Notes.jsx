// src/pages/Notes.jsx
// Fixed black-screen crash + cleaned dependencies + prettier category tag mapping
// Key fixes:
// - ✅ add missing newCategory state
// - ✅ make getAuthedUser stable via useCallback
// - ✅ map DB tags[] to a pretty category label (cat:meeting -> "Meeting")
// - ✅ ensure tag counts load in both modes and after DB load
// - ✅ incrementUsage for voice transcriptions

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
} from "react-icons/fi";
import { Note, FilePlus, Crown } from "phosphor-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import NoteCard from "../components/NoteCard";
import NoteRow from "../components/NoteRow";
import NoteView from "./NoteView";
import { useSubscription } from "../hooks/useSubscription";

import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const PIN_KEY = "ns-note-pin";
const USER_STATS_TABLE = "user_engagement_stats";
const NOTES_TABLE = "notes";

const initialNotes = [
  {
    id: 1,
    title: "Team Sync – Feb 12",
    body: "Tasks for this week and planning for next sprint...",
    tag: "Work",
    updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    favorite: false,
    locked: false,
  },
  {
    id: 2,
    title: "Thesis: Chapter 3",
    body: "Need to refine chapter summary and add diagrams...",
    tag: "Study",
    updated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    favorite: true,
    locked: true,
  },
  {
    id: 3,
    title: "Product ideas",
    body: "Smart scan input, AI suggestions, cloud sync...",
    tag: "Ideas",
    updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    favorite: false,
    locked: false,
  },
];

const FILTERS = [
  { id: "all", label: "All Notes", icon: Note },
  { id: "favorites", label: "Favorites", icon: FiHeart },
  { id: "locked", label: "Private", icon: FiLock },
  { id: "voice", label: "Voice", icon: FiMic },
];

export default function Notes() {
  const navigate = useNavigate();
  // ✅ Added incrementUsage to track voice transcription usage
  const { subscription, isFeatureUnlocked, isLoading, incrementUsage } = useSubscription();

  const isPro = !!subscription?.plan && subscription.plan !== "free";
  const canUseVoice =
    typeof isFeatureUnlocked === "function" ? isFeatureUnlocked("voice") : isPro;
  const canUseExport =
    typeof isFeatureUnlocked === "function" ? isFeatureUnlocked("export") : isPro;

  const cameraInputRef = useRef(null);
  const filePickerRef = useRef(null);

  const supabaseReady =
    typeof isSupabaseConfigured === "function"
      ? isSupabaseConfigured()
      : !!isSupabaseConfigured;

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
  const [newCategory, setNewCategory] = useState("meeting"); // ✅ FIX (missing -> black screen)
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

  const createOperationRef = useRef({
    inProgress: false,
    lastRequestId: null,
  });

  // ----------------------------
  // helpers
  // ----------------------------
  const normalizeTag = (t) =>
    String(t || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9:_-]/g, "");

  const parseTagsInput = (s) =>
    String(s || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

  const buildNoteTags = ({ source = "manual", category = null, extra = [] }) => {
    const base = ["type:note", `src:${source}`];
    const cat = category ? [`cat:${normalizeTag(category)}`] : [];
    const merged = Array.from(
      new Set([...base, ...cat, ...extra.map(normalizeTag)])
    );
    return merged.filter(Boolean);
  };

  const prettyFromCatTag = (tagsArr) => {
    const cat = (tagsArr || []).find((t) => String(t).startsWith("cat:"));
    if (!cat) return null;
    const raw = String(cat).replace("cat:", "");
    return raw
      .replace(/-/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  };

  const mapDbNoteToUi = useCallback((row) => {
    const p = row?.ai_payload || {};
    const tagsArr = Array.isArray(row.tags) ? row.tags : [];

    return {
      id: row.id,
      title: row.title ?? "Untitled",
      body: row.body ?? "",
      // ✅ Use cat:* tag as the UI label instead of "type:note"
      tag: prettyFromCatTag(tagsArr) || "Note",
      updated: row.updated_at ?? row.created_at ?? new Date().toISOString(),
      favorite: !!row.is_favorite,
      locked: false, // local-only unless you add a DB column

      // Smart Notes (NoteView.jsx)
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
    if (error) {
      console.error("getSession error:", error);
      return null;
    }
    const user = sessRes?.session?.user;
    if (!user?.id) {
      navigate("/login");
      return null;
    }
    return user;
  }, [navigate]);

  const loadTagCounts = useCallback(async () => {
    if (!supabaseReady || !supabase) return;

    setTagsLoading(true);
    const { data, error } = await supabase.rpc("get_note_tag_counts");
    setTagsLoading(false);

    if (error) {
      console.error("get_note_tag_counts error:", error);
      setTagCounts([]);
      return;
    }

    setTagCounts(data || []);
  }, [supabaseReady]);

  // Only needed if you do NOT have a DB trigger already.
  const incrementNotesCreatedStat = useCallback(
    async (userId) => {
      if (!supabaseReady || !supabase || !userId) return;

      try {
        const { data: current, error: fetchErr } = await supabase
          .from(USER_STATS_TABLE)
          .select("notes_created")
          .eq("user_id", userId)
          .single();

        if (fetchErr) {
          console.error("Failed to fetch current notes_created:", fetchErr);
          return;
        }

        const newCount = (Number(current?.notes_created) || 0) + 1;

        const { error: updateErr } = await supabase
          .from(USER_STATS_TABLE)
          .update({ notes_created: newCount })
          .eq("user_id", userId);

        if (updateErr) {
          console.error("Failed to update notes_created:", updateErr);
        }
      } catch (err) {
        console.error("incrementNotesCreatedStat error:", err);
      }
    },
    [supabaseReady]
  );

  // ----------------------------
  // Load notes from DB on page open
  // ----------------------------
  useEffect(() => {
    let alive = true;

    (async () => {
      // Local/demo fallback
      if (!supabaseReady || !supabase) {
        setNotes(initialNotes);
        setNotesLoading(false);
        return;
      }

      setNotesLoading(true);

      const user = await getAuthedUser();
      if (!user) {
        if (alive) setNotesLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from(NOTES_TABLE)
        .select(
          "id,title,body,tags,is_favorite,is_highlight,ai_payload,ai_generated_at,ai_model,created_at,updated_at"
        )
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (!alive) return;

      if (error) {
        console.error("Load notes error:", error);
        setNotes([]);
        setNotesLoading(false);
        return;
      }

      setNotes((data || []).map(mapDbNoteToUi));
      setNotesLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [supabaseReady, getAuthedUser, mapDbNoteToUi]);

  // Tag counts (best-effort) — run when ready and after initial notes load
  useEffect(() => {
    if (!supabaseReady || !supabase) return;
    loadTagCounts();
  }, [supabaseReady, loadTagCounts]);

  // ----------------------------
  // Derived state
  // ----------------------------
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    switch (activeFilter) {
      case "favorites":
        filtered = filtered.filter((n) => n.favorite);
        break;
      case "locked":
        filtered = filtered.filter((n) => n.locked);
        break;
      case "voice":
        filtered = filtered.filter((n) => n.tag === "Voice");
        break;
      default:
        break;
    }

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter((n) =>
        (n.title || "").toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => b.favorite - a.favorite);
  }, [query, notes, activeFilter]);

  const filterCounts = useMemo(
    () => ({
      all: notes.length,
      favorites: notes.filter((n) => n.favorite).length,
      locked: notes.filter((n) => n.locked).length,
      voice: notes.filter((n) => n.tag === "Voice").length,
    }),
    [notes]
  );

  // ----------------------------
  // Note operations
  // ----------------------------
  const updateSelectedNote = (id, updates) => {
    setSelectedNote((prev) =>
      prev && prev.id === id ? { ...prev, ...updates } : prev
    );
  };

  const createNote = useCallback(async () => {
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    if (createOperationRef.current.inProgress) return;

    createOperationRef.current.inProgress = true;
    createOperationRef.current.lastRequestId = requestId;

    try {
      const now = new Date().toISOString();
      const title = (newNote.title || "").trim() || "Untitled";
      const body = (newNote.body || "").trim() || "";

      setEditorOpen(false);
      setShowAddMenu(false);

      // Local/demo fallback
      if (!supabaseReady || !supabase) {
        const id = crypto?.randomUUID?.() ?? String(Date.now());

        const localNote = {
          id,
          title,
          body,
          tag: newCategory
            ? newCategory.charAt(0).toUpperCase() + newCategory.slice(1)
            : "Note",
          tags: buildNoteTags({
            source: "manual",
            category: newCategory,
            extra: parseTagsInput(newTagsInput),
          }),
          updated: now,
          favorite: false,
          locked: false,
          summary: null,
          SmartTasks: null,
          SmartHighlights: null,
          SmartSchedule: null,
          aiGeneratedAt: null,
          aiModel: null,
        };

        setNotes((prev) => [
          localNote,
          ...(prev || []).filter((n) => n.id !== localNote.id),
        ]);

        setNewNote({ title: "", body: "" });
        setNewTagsInput("");
        setNewCategory("meeting");
        setSelectedNote(localNote);
        return;
      }

      const user = await getAuthedUser();
      if (!user) return;

      if (createOperationRef.current.lastRequestId !== requestId) return;

      const dbTags = buildNoteTags({
        source: "manual",
        category: newCategory,
        extra: parseTagsInput(newTagsInput),
      });

      const insertPayload = {
        user_id: user.id,
        title,
        body,
        tags: dbTags,
        is_favorite: false,
        is_highlight: false,
        ai_payload: null,
        ai_generated_at: null,
        ai_model: null,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from(NOTES_TABLE)
        .insert(insertPayload)
        .select(
          "id,title,body,tags,is_favorite,is_highlight,ai_payload,ai_generated_at,ai_model,created_at,updated_at"
        )
        .single();

      if (error) {
        console.error("Create note error:", error);
        return;
      }

      // Comment out if you already have a trigger for notes_created
      await incrementNotesCreatedStat(user.id);

      const ui = mapDbNoteToUi(data);

      setNotes((prev) => [ui, ...(prev || []).filter((n) => n.id !== ui.id)]);
      setNewNote({ title: "", body: "" });
      setNewTagsInput("");
      setNewCategory("meeting");
      setSelectedNote(ui);

      loadTagCounts();
    } catch (err) {
      console.error("createNote unexpected error:", err);
    } finally {
      setTimeout(() => {
        createOperationRef.current.inProgress = false;
      }, 100);
    }
  }, [
    supabaseReady,
    newNote.title,
    newNote.body,
    newTagsInput,
    newCategory,
    getAuthedUser,
    buildNoteTags,
    parseTagsInput,
    incrementNotesCreatedStat,
    mapDbNoteToUi,
    loadTagCounts,
  ]);

  const handleDelete = async (id) => {
    const prevNotes = notes;

    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
    setActiveMenuId(null);

    if (!supabaseReady || !supabase) return;

    const user = await getAuthedUser();
    if (!user) return;

    const { error } = await supabase
      .from(NOTES_TABLE)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete error:", error);
      setNotes(prevNotes);
    }
  };

  const handleFavorite = async (id, fromView = false) => {
    const current = notes.find((n) => n.id === id);
    if (!current) return;

    const newFavorite = !current.favorite;

    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, favorite: newFavorite } : n))
    );
    if (fromView) updateSelectedNote(id, { favorite: newFavorite });
    setActiveMenuId(null);

    if (!supabaseReady || !supabase) return;

    const user = await getAuthedUser();
    if (!user) return;

    const { error } = await supabase
      .from(NOTES_TABLE)
      .update({ is_favorite: newFavorite })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Favorite update error:", error);
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, favorite: !newFavorite } : n))
      );
      if (fromView) updateSelectedNote(id, { favorite: !newFavorite });
    }
  };

  const onEditSave = async (id, newTitle, newBody, updated, smart = null) => {
    const optimisticUpdated = updated || new Date().toISOString();

    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              title: newTitle,
              body: newBody,
              updated: optimisticUpdated,
              ...(smart || {}),
            }
          : n
      )
    );

    setSelectedNote((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            title: newTitle,
            body: newBody,
            updated: optimisticUpdated,
            ...(smart || {}),
          }
        : prev
    );

    if (!supabaseReady || !supabase) return;

    const user = await getAuthedUser();
    if (!user) return;

    const updatePayload = {
      title: newTitle,
      body: newBody,
    };

    if (
      smart &&
      (smart.summary ||
        smart.SmartTasks ||
        smart.SmartHighlights ||
        smart.SmartSchedule)
    ) {
      const genAt = smart.aiGeneratedAt ?? new Date().toISOString();

      updatePayload.ai_payload = {
        summary: smart.summary ?? null,
        SmartTasks: smart.SmartTasks ?? null,
        SmartHighlights: smart.SmartHighlights ?? null,
        SmartSchedule: smart.SmartSchedule ?? null,
        generatedAt: genAt,
        model: smart.aiModel ?? null,
      };
      updatePayload.ai_generated_at = genAt;
      if (smart.aiModel) updatePayload.ai_model = smart.aiModel;
    }

    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(
        "id,title,body,tags,is_favorite,is_highlight,ai_payload,ai_generated_at,ai_model,created_at,updated_at"
      )
      .single();

    if (error) {
      console.error("Edit save error:", error);
      return;
    }

    const ui = mapDbNoteToUi(data);
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...ui } : n)));
    setSelectedNote((prev) =>
      prev && prev.id === id ? { ...prev, ...ui } : prev
    );
  };

  // ----------------------------
  // PIN operations (still local)
  // ----------------------------
  const openSetPinForNote = (noteId) => {
    setPinMode("set");
    setPendingNoteId(noteId);
    setPinInput("");
    setPinModalOpen(true);
  };

  const openUnlockForNote = (noteId, openAfter) => {
    setPinMode(openAfter ? "unlockOpen" : "unlock");
    setPendingNoteId(noteId);
    setPinInput("");
    setPinModalOpen(true);
  };

  const handlePinSubmit = () => {
    const stored = localStorage.getItem(PIN_KEY);

    if (pinMode === "set") {
      if (pinInput.length !== 4 || !/^\d+$/.test(pinInput)) {
        alert("Please enter a 4-digit PIN.");
        return;
      }
      localStorage.setItem(PIN_KEY, pinInput);
      setNotes((prev) =>
        prev.map((n) => (n.id === pendingNoteId ? { ...n, locked: true } : n))
      );
      setPinModalOpen(false);
      setPinInput("");
      setPinMode(null);
      setPendingNoteId(null);
      return;
    }

    if (stored !== pinInput) {
      alert("Incorrect PIN");
      setPinInput("");
      return;
    }

    if (pinMode === "unlock") {
      setNotes((prev) =>
        prev.map((n) => (n.id === pendingNoteId ? { ...n, locked: false } : n))
      );
      updateSelectedNote(pendingNoteId, { locked: false });
    } else if (pinMode === "unlockOpen") {
      const noteToOpen = notes.find((n) => n.id === pendingNoteId);
      if (noteToOpen) setSelectedNote(noteToOpen);
    }

    setPinModalOpen(false);
    setPinInput("");
    setPinMode(null);
    setPendingNoteId(null);
  };

  const handleLockToggle = (id, fromView = false) => {
    const stored = localStorage.getItem(PIN_KEY);
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    if (!target.locked) {
      if (!stored) return openSetPinForNote(id);
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, locked: true } : n))
      );
      if (fromView) updateSelectedNote(id, { locked: true });
    } else {
      if (!stored) {
        setNotes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, locked: false } : n))
        );
        if (fromView) updateSelectedNote(id, { locked: false });
        return;
      }
      openUnlockForNote(id, fromView);
      return;
    }
    setActiveMenuId(null);
  };

  const tryOpenNote = (note) => {
    const stored = localStorage.getItem(PIN_KEY);
    if (!note.locked) return setSelectedNote(note);
    if (!stored) return openSetPinForNote(note.id);
    openUnlockForNote(note.id, true);
  };

  // ----------------------------
  // File upload (still local)
  // ----------------------------
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const isPDF = file.type.includes("pdf");
    const objectUrl = URL.createObjectURL(file);

    await new Promise((r) => setTimeout(r, 1200));

    const newNoteItem = {
      id: Date.now(),
      title: file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim(),
      body: "",
      tag: isPDF ? "PDF" : "Photo",
      updated: new Date().toISOString(),
      favorite: false,
      locked: false,
      fileType: isPDF ? "pdf" : "image",
      pdfUrl: isPDF ? objectUrl : null,
      imageUrl: !isPDF ? objectUrl : null,
    };

    setNotes((prev) => [newNoteItem, ...prev]);
    setUploading(false);
    setShowAddMenu(false);
  };

  const handleScanCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    await new Promise((r) => setTimeout(r, 1200));

    const objectUrl = URL.createObjectURL(file);
    const newNoteItem = {
      id: Date.now(),
      title: "Scanned Image",
      body: "",
      tag: "Scan",
      updated: new Date().toISOString(),
      favorite: false,
      locked: false,
      fileType: "image",
      imageUrl: objectUrl,
    };

    setNotes((prev) => [newNoteItem, ...prev]);
    setUploading(false);
    setShowAddMenu(false);
  };

  // ----------------------------
  // Voice recording (still local)
  // ----------------------------
  const pickAudioMime = () => {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    return (
      candidates.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || ""
    );
  };

  const cleanupStream = useCallback(() => {
    try {
      mediaStreamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch {}
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
  }, []);

  const openVoiceRecorder = async () => {
    if (!canUseVoice) {
      setShowUpgrade(true);
      return;
    }

    setRecError("");
    setRecOpen(true);
    setRecState("idle");
    chunksRef.current = [];

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecError("Microphone not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = pickAudioMime();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (evt) => {
        if (evt.data && evt.data.size > 0) chunksRef.current.push(evt.data);
      };

      recorder.onerror = () => setRecError("Recorder error. Please try again.");

      recorder.onstop = async () => {
        const finalType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: finalType });

        if (!blob || blob.size === 0) {
          setRecError(
            "Recording was empty. Try again and speak closer to the mic."
          );
          setRecState("idle");
          cleanupStream();
          return;
        }

        const url = URL.createObjectURL(blob);

        const newVoiceNote = {
          id: Date.now(),
          title: "Voice Note",
          body: "",
          tag: "Voice",
          updated: new Date().toISOString(),
          favorite: false,
          locked: false,
          audioUrl: url,
          audioMime: finalType,
        };

        setNotes((prev) => [newVoiceNote, ...prev]);
        setRecState("stopped");
        cleanupStream();

        // ✅ Track voice transcription usage after successful recording
        try {
          await incrementUsage("voiceTranscriptions");
        } catch (err) {
          console.error("Failed to increment voice usage:", err);
        }
      };
    } catch {
      setRecError("Microphone permission denied or unavailable.");
    }
  };

  const startRecording = () => {
    const r = mediaRecorderRef.current;
    if (!r) return;

    chunksRef.current = [];
    try {
      r.start(250);
      setRecState("recording");
    } catch {
      setRecError("Could not start recording.");
    }
  };

  const stopRecording = () => {
    const r = mediaRecorderRef.current;
    if (!r) return;

    try {
      r.stop();
    } catch {}
    setRecState("stopped");
  };

  const closeRecorder = () => {
    const r = mediaRecorderRef.current;

    if (r && r.state !== "inactive") {
      stopRecording();
    } else {
      cleanupStream();
      setRecState("idle");
    }

    setRecOpen(false);
    setRecError("");
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (showAddMenu && !e.target.closest(".fab-zone")) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showAddMenu]);

  // File input handlers
  useEffect(() => {
    if (cameraInputRef.current)
      cameraInputRef.current.onchange = handleScanCapture;
    if (filePickerRef.current)
      filePickerRef.current.onchange = handleFileUpload;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading state
  if (isLoading || notesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Note view
  if (selectedNote) {
    return (
      <NoteView
        note={selectedNote}
        onBack={() => setSelectedNote(null)}
        onFavoriteToggle={handleFavorite}
        onEditSave={onEditSave}
        onDelete={handleDelete}
        onLockToggle={handleLockToggle}
        isPro={isPro}
        canUseExport={canUseExport}
        canUseVoice={canUseVoice}
        onRequireUpgrade={() => setShowUpgrade(true)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+100px)] animate-fadeIn">
      {/* Header */}
      <header className="page-header">
        <div className="page-header-content">
          <div className="page-header-icon">
            <Note weight="duotone" />
          </div>
          <div>
            <h1 className="page-header-title">My Notes</h1>
            <p className="page-header-subtitle">
              Capture ideas, organize thoughts, stay productive.
            </p>
          </div>
        </div>
      </header>

      {/* Stats Banner */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className="p-4 rounded-xl border text-center"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-secondary)",
          }}
        >
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {notes.length}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Total Notes
          </p>
        </div>
        <div
          className="p-4 rounded-xl border text-center"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-secondary)",
          }}
        >
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--accent-rose)" }}
          >
            {filterCounts.favorites}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Favorites
          </p>
        </div>
        <div
          className="p-4 rounded-xl border text-center"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-secondary)",
          }}
        >
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--accent-amber)" }}
          >
            {filterCounts.locked}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Private
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div
        className="flex items-center w-full rounded-full px-4 py-3 transition-all duration-300 border"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: query ? "var(--accent-indigo)" : "var(--border-secondary)",
          boxShadow: query ? "0 0 20px rgba(99,102,241,0.15)" : "none",
        }}
      >
        <FiSearch
          className="w-5 h-5 mr-3 flex-shrink-0"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          type="text"
          placeholder="Search notes..."
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
          style={{ color: "var(--text-primary)" }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="p-1.5 rounded-full transition ml-2"
            style={{ color: "var(--text-muted)" }}
          >
            <FiX size={16} />
          </button>
        )}
        <div
          className="flex items-center gap-2 ml-3 pl-3 border-l"
          style={{ borderColor: "var(--border-secondary)" }}
        >
          <button
            onClick={() => setGridView(true)}
            className="p-2 rounded-lg transition"
            style={{
              backgroundColor: gridView
                ? "rgba(99, 102, 241, 0.2)"
                : "transparent",
              color: gridView ? "var(--accent-indigo)" : "var(--text-muted)",
            }}
          >
            <FiGrid size={16} />
          </button>
          <button
            onClick={() => setGridView(false)}
            className="p-2 rounded-lg transition"
            style={{
              backgroundColor: !gridView
                ? "rgba(99, 102, 241, 0.2)"
                : "transparent",
              color: !gridView ? "var(--accent-indigo)" : "var(--text-muted)",
            }}
          >
            <FiList size={16} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.id;
          const count = filterCounts[filter.id];
          const IconComponent = filter.icon;

          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border"
              style={{
                backgroundColor: isActive
                  ? "rgba(99, 102, 241, 0.1)"
                  : "transparent",
                borderColor: isActive
                  ? "rgba(99, 102, 241, 0.3)"
                  : "transparent",
                color: isActive ? "var(--accent-indigo)" : "var(--text-secondary)",
              }}
            >
              <IconComponent
                size={14}
                weight={filter.id === "all" ? "duotone" : undefined}
              />
              <span>{filter.label}</span>
              <span
                className="px-1.5 py-0.5 rounded-md text-[10px]"
                style={{
                  backgroundColor: isActive
                    ? "rgba(99, 102, 241, 0.2)"
                    : "var(--bg-tertiary)",
                  color: isActive ? "var(--accent-indigo)" : "var(--text-muted)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notes Grid */}
      <div
        className={`grid ${
          gridView
            ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3"
            : "grid-cols-1 gap-2"
        }`}
      >
        {filteredNotes.length === 0 ? (
          <div className="col-span-2">
            <GlassCard>
              <div className="py-12 text-center">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                  }}
                >
                  {activeFilter === "favorites" ? (
                    <FiHeart size={28} style={{ color: "var(--accent-indigo)" }} />
                  ) : activeFilter === "locked" ? (
                    <FiLock size={28} style={{ color: "var(--accent-indigo)" }} />
                  ) : activeFilter === "voice" ? (
                    <FiMic size={28} style={{ color: "var(--accent-indigo)" }} />
                  ) : (
                    <Note
                      size={28}
                      weight="duotone"
                      style={{ color: "var(--accent-indigo)" }}
                    />
                  )}
                </div>

                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {query
                    ? "No notes found"
                    : `No ${activeFilter === "all" ? "" : activeFilter + " "}notes yet`}
                </h3>

                <p
                  className="text-sm mb-6 max-w-xs mx-auto"
                  style={{ color: "var(--text-muted)" }}
                >
                  {query
                    ? "Try a different search term"
                    : activeFilter === "favorites"
                    ? "Mark notes as favorites to see them here"
                    : activeFilter === "locked"
                    ? "Lock notes to keep them private"
                    : activeFilter === "voice"
                    ? "Record voice notes to see them here"
                    : "Create your first note to get started"}
                </p>

                {!query && activeFilter === "all" && (
                  <button
                    onClick={() => setEditorOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition active:scale-95"
                  >
                    <FiPlus size={16} />
                    Create Note
                  </button>
                )}

                {activeFilter !== "all" && (
                  <button
                    onClick={() => setActiveFilter("all")}
                    className="text-xs transition"
                    style={{ color: "var(--accent-indigo)" }}
                  >
                    ← View all notes
                  </button>
                )}
              </div>
            </GlassCard>
          </div>
        ) : (
          filteredNotes.map((note) =>
            gridView ? (
              <NoteCard
                key={note.id}
                note={note}
                onMenu={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuPos({
                    x: Math.min(rect.right - 180, window.innerWidth - 200),
                    y: rect.bottom + 8,
                  });
                  setActiveMenuId(note.id);
                }}
                onOpen={() => tryOpenNote(note)}
              />
            ) : (
              <NoteRow
                key={note.id}
                note={note}
                onOpen={() => tryOpenNote(note)}
                onLongPress={() => {}}
                onArchive={() => {}}
                onDelete={() => handleDelete(note.id)}
                onMenu={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuPos({
                    x: Math.min(rect.right - 180, window.innerWidth - 200),
                    y: rect.bottom + 8,
                  });
                  setActiveMenuId(note.id);
                }}
              />
            )
          )
        )}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {activeMenuId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90]"
              style={{
                backgroundColor: "var(--bg-overlay)",
                backdropFilter: "blur(4px)",
              }}
              onClick={() => setActiveMenuId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed rounded-2xl border shadow-xl z-[200] min-w-[180px] overflow-hidden"
              style={{
                top: menuPos.y,
                left: menuPos.x,
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-secondary)",
              }}
            >
              <div className="p-2">
                <ContextMenuItem
                  icon={<FiEdit2 size={15} />}
                  label="Open"
                  onClick={() => {
                    const n = notes.find((x) => x.id === activeMenuId);
                    if (n) tryOpenNote(n);
                    setActiveMenuId(null);
                  }}
                />
                <ContextMenuItem
                  icon={
                    <FiHeart
                      size={15}
                      style={
                        notes.find((n) => n.id === activeMenuId)?.favorite
                          ? { color: "var(--accent-rose)", fill: "var(--accent-rose)" }
                          : {}
                      }
                    />
                  }
                  label={
                    notes.find((n) => n.id === activeMenuId)?.favorite
                      ? "Unfavorite"
                      : "Favorite"
                  }
                  onClick={() => {
                    handleFavorite(activeMenuId);
                    setActiveMenuId(null);
                  }}
                />
                <ContextMenuItem
                  icon={<FiLock size={15} />}
                  label={
                    notes.find((n) => n.id === activeMenuId)?.locked
                      ? "Unlock"
                      : "Lock"
                  }
                  onClick={() => {
                    handleLockToggle(activeMenuId);
                    setActiveMenuId(null);
                  }}
                />
                <div
                  className="h-px my-1"
                  style={{ backgroundColor: "var(--border-secondary)" }}
                />
                <ContextMenuItem
                  icon={<FiTrash2 size={15} />}
                  label="Delete"
                  danger
                  onClick={() => {
                    handleDelete(activeMenuId);
                    setActiveMenuId(null);
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FAB Zone */}
      <div className="fab-zone fixed bottom-[calc(var(--mobile-nav-height)+16px)] right-4 z-[140]">
        <AnimatePresence>
          {showAddMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-16 right-0 flex flex-col gap-2 min-w-[160px]"
            >
              <FABOption
                icon={<FiEdit2 size={16} />}
                label="New Note"
                onClick={() => {
                  setEditorOpen(true);
                  setShowAddMenu(false);
                }}
              />
              <FABOption
                icon={<FiMic size={16} />}
                label="Voice Note"
                pro={!canUseVoice}
                onClick={() => {
                  openVoiceRecorder();
                  setShowAddMenu(false);
                }}
              />
              <FABOption
                icon={<FiCamera size={16} />}
                label="Scan"
                onClick={() => {
                  cameraInputRef.current?.click();
                }}
              />
              <FABOption
                icon={<FiUpload size={16} />}
                label="Upload"
                onClick={() => {
                  filePickerRef.current?.click();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddMenu(!showAddMenu)}
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-all ${
            showAddMenu ? "rotate-45 shadow-indigo-500/50" : "hover:shadow-indigo-500/40"
          }`}
        >
          <FiPlus size={24} strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* New Note Modal */}
      <AnimatePresence>
        {editorOpen && (
          <Modal onClose={() => setEditorOpen(false)}>
            <div className="p-5 border-b" style={{ borderColor: "var(--border-secondary)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: "rgba(99, 102, 241, 0.2)",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    <FilePlus
                      size={20}
                      weight="duotone"
                      style={{ color: "var(--accent-indigo)" }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                      New Note
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Create a new note
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setEditorOpen(false)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center transition"
                  style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Category */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
                  Category
                </label>

                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "meeting", label: "Meeting" },
                    { id: "study", label: "Study" },
                    { id: "task", label: "Tasks" },
                    { id: "personal", label: "Personal" },
                    { id: "idea", label: "Ideas" },
                  ].map((c) => {
                    const active = newCategory === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setNewCategory(c.id)}
                        className="px-3 py-2 rounded-full text-xs font-medium border transition"
                        style={{
                          backgroundColor: active ? "rgba(99,102,241,0.14)" : "var(--bg-input)",
                          borderColor: active ? "rgba(99,102,241,0.35)" : "var(--border-secondary)",
                          color: active ? "var(--accent-indigo)" : "var(--text-secondary)",
                        }}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>

                <p className="mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Used for the note's primary label and analytics grouping.
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
                  Tags (optional)
                </label>
                <input
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none transition"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border-secondary)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="e.g. sprint, client, budget"
                  value={newTagsInput}
                  onChange={(e) => setNewTagsInput(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Comma-separated. These become entries in <code>tags[]</code>.
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
                  Title
                </label>
                <input
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none transition"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border-secondary)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="Note title..."
                  maxLength={80}
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  autoFocus
                />
              </div>

              {/* Content */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
                  Content
                </label>
                <textarea
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none resize-none transition"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border-secondary)",
                    color: "var(--text-secondary)",
                  }}
                  placeholder="Start writing..."
                  rows={5}
                  value={newNote.body}
                  onChange={(e) => setNewNote({ ...newNote, body: e.target.value })}
                />
              </div>
            </div>

            <div
              className="p-5 border-t"
              style={{
                borderColor: "var(--border-secondary)",
                backgroundColor: "var(--bg-tertiary)",
              }}
            >
              <button
                type="button"
                onClick={createNote}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium transition hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <FiPlus size={18} />
                Create Note
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* PIN Modal */}
      <AnimatePresence>
        {pinModalOpen && (
          <Modal
            onClose={() => {
              setPinModalOpen(false);
              setPinInput("");
              setPinMode(null);
              setPendingNoteId(null);
            }}
          >
            <div className="p-5 border-b" style={{ borderColor: "var(--border-secondary)" }}>
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor:
                      pinMode === "set"
                        ? "rgba(99, 102, 241, 0.2)"
                        : "rgba(245, 158, 11, 0.2)",
                    border: `1px solid ${
                      pinMode === "set"
                        ? "rgba(99, 102, 241, 0.3)"
                        : "rgba(245, 158, 11, 0.3)"
                    }`,
                  }}
                >
                  <FiLock
                    size={18}
                    style={{
                      color: pinMode === "set" ? "var(--accent-indigo)" : "var(--accent-amber)",
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                    {pinMode === "set" ? "Set PIN" : "Enter PIN"}
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {pinMode === "set" ? "Create a 4-digit PIN" : "Enter your PIN to unlock"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <input
                className="w-full border rounded-xl px-4 py-4 text-center tracking-[0.5em] text-xl font-mono focus:outline-none transition"
                style={{
                  backgroundColor: "var(--bg-input)",
                  borderColor: "var(--border-secondary)",
                  color: "var(--text-primary)",
                }}
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                autoFocus
              />
            </div>

            <div
              className="p-5 border-t"
              style={{
                borderColor: "var(--border-secondary)",
                backgroundColor: "var(--bg-tertiary)",
              }}
            >
              <button
                onClick={handlePinSubmit}
                className="w-full py-3 rounded-xl font-medium transition hover:opacity-90 active:scale-[0.98] text-white"
                style={{
                  background:
                    pinMode === "set"
                      ? "linear-gradient(to right, #6366f1, #a855f7)"
                      : "linear-gradient(to right, #f59e0b, #f97316)",
                }}
              >
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
            <div className="p-5 border-b" style={{ borderColor: "var(--border-secondary)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor:
                        recState === "recording"
                          ? "rgba(244, 63, 94, 0.2)"
                          : "rgba(99, 102, 241, 0.2)",
                      border: `1px solid ${
                        recState === "recording"
                          ? "rgba(244, 63, 94, 0.3)"
                          : "rgba(99, 102, 241, 0.3)"
                      }`,
                    }}
                  >
                    <FiMic
                      style={{
                        color: recState === "recording" ? "var(--accent-rose)" : "var(--accent-indigo)",
                      }}
                      size={18}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                      Voice Note
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Record and save
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeRecorder}
                  className="h-8 w-8 rounded-lg flex items-center justify-center transition"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-muted)",
                  }}
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>

            <div className="p-5">
              {recError ? (
                <div
                  className="p-4 rounded-xl text-sm"
                  style={{
                    backgroundColor: "rgba(244, 63, 94, 0.1)",
                    border: "1px solid rgba(244, 63, 94, 0.3)",
                    color: "var(--accent-rose)",
                  }}
                >
                  {recError}
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className="p-6 rounded-xl border text-center"
                    style={{
                      borderColor: "var(--border-secondary)",
                      backgroundColor: "var(--bg-input)",
                    }}
                  >
                    {recState === "recording" ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-1 rounded-full"
                              style={{ backgroundColor: "var(--accent-rose)" }}
                              animate={{ height: [8, 24, 8] }}
                              transition={{
                                duration: 0.5,
                                repeat: Infinity,
                                delay: i * 0.1,
                              }}
                            />
                          ))}
                        </div>
                        <p
                          className="text-sm font-medium flex items-center justify-center gap-2"
                          style={{ color: "var(--accent-rose)" }}
                        >
                          <span
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: "var(--accent-rose)" }}
                          />
                          Recording...
                        </p>
                      </div>
                    ) : recState === "stopped" ? (
                      <div className="space-y-2">
                        <div
                          className="w-12 h-12 mx-auto rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "rgba(16, 185, 129, 0.2)" }}
                        >
                          <FiMic style={{ color: "var(--accent-emerald)" }} size={20} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: "var(--accent-emerald)" }}>
                          Saved!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div
                          className="w-12 h-12 mx-auto rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "rgba(99, 102, 241, 0.2)" }}
                        >
                          <FiMic style={{ color: "var(--accent-indigo)" }} size={20} />
                        </div>
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          Ready to record
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={startRecording}
                      disabled={recState !== "idle"}
                      className="flex-1 px-4 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
                      style={{
                        opacity: recState !== "idle" ? 0.5 : 1,
                        cursor: recState !== "idle" ? "not-allowed" : "pointer",
                        background:
                          recState !== "idle"
                            ? "var(--bg-tertiary)"
                            : "linear-gradient(to right, #6366f1, #a855f7)",
                        color: recState !== "idle" ? "var(--text-muted)" : "white",
                      }}
                    >
                      <FiMic size={16} /> Start
                    </button>
                    <button
                      onClick={stopRecording}
                      disabled={recState !== "recording"}
                      className="flex-1 px-4 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
                      style={{
                        opacity: recState !== "recording" ? 0.5 : 1,
                        cursor: recState !== "recording" ? "not-allowed" : "pointer",
                        background:
                          recState !== "recording"
                            ? "var(--bg-tertiary)"
                            : "linear-gradient(to right, #f43f5e, #e11d48)",
                        color: recState !== "recording" ? "var(--text-muted)" : "white",
                      }}
                    >
                      <FiX size={16} /> Stop
                    </button>
                  </div>
                </div>
              )}
            </div>

            {recState === "stopped" && (
              <div
                className="p-5 border-t"
                style={{
                  borderColor: "var(--border-secondary)",
                  backgroundColor: "var(--bg-tertiary)",
                }}
              >
                <button
                  onClick={closeRecorder}
                  className="w-full py-3 rounded-xl font-medium transition border"
                  style={{
                    borderColor: "var(--border-secondary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgrade && (
          <Modal onClose={() => setShowUpgrade(false)}>
            <div className="p-6 border-b" style={{ borderColor: "var(--border-secondary)" }}>
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(249, 115, 22, 0.2))",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                  }}
                >
                  <Crown size={24} weight="fill" style={{ color: "var(--accent-amber)" }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                    Pro Feature
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Upgrade to unlock
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                Voice Notes and Advanced Export are available on Pro. Upgrade to unlock these powerful features.
              </p>
              <div
                className="p-3 rounded-xl border"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                  Pro includes:
                </p>
                <ul className="space-y-1.5">
                  {["Voice notes & transcription", "Advanced export", "Unlimited AI", "Cloud sync"].map(
                    (f, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: "var(--accent-indigo)" }}
                        />{" "}
                        {f}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>

            <div
              className="p-6 border-t flex gap-3"
              style={{
                borderColor: "var(--border-secondary)",
                backgroundColor: "var(--bg-tertiary)",
              }}
            >
              <button
                onClick={() => setShowUpgrade(false)}
                className="flex-1 px-4 py-3 rounded-xl font-medium border transition"
                style={{
                  borderColor: "var(--border-secondary)",
                  color: "var(--text-secondary)",
                }}
              >
                Not now
              </button>
              <button
                onClick={() => {
                  setShowUpgrade(false);
                  navigate("/dashboard/ai-lab");
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium flex items-center justify-center gap-2 hover:opacity-95 transition"
              >
                <Crown size={16} weight="fill" /> Upgrade
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Upload Loader */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{
                backgroundColor: "rgba(99, 102, 241, 0.2)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
              }}
            >
              <FiUpload size={32} className="animate-bounce" style={{ color: "var(--accent-indigo)" }} />
            </div>
            <div
              className="w-48 h-1.5 rounded-full overflow-hidden mb-4"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-full w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
              />
            </div>
            <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
              Uploading...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      <input
        type="file"
        accept="image/*,application/pdf"
        style={{ display: "none" }}
        ref={filePickerRef}
      />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        ref={cameraInputRef}
      />
    </div>
  );
}

/* Helper Components */

const Modal = ({ children, onClose }) => (
  <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200]"
      style={{ backgroundColor: "var(--bg-overlay)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    />
    <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md rounded-2xl border shadow-xl overflow-hidden pointer-events-auto my-auto"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-secondary)",
          maxHeight: "calc(100vh - 32px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[calc(100vh-32px)] overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  </>
);

const ContextMenuItem = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left w-full"
    style={{
      color: danger ? "var(--accent-rose)" : "var(--text-secondary)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = danger
        ? "rgba(244, 63, 94, 0.1)"
        : "var(--bg-hover)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = "transparent";
    }}
  >
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const FABOption = ({ icon, label, onClick, pro }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition active:scale-95"
    style={{
      backgroundColor: "var(--bg-surface)",
      borderColor: "var(--border-secondary)",
    }}
  >
    <span style={{ color: "var(--accent-indigo)" }}>{icon}</span>
    <span
      className="text-sm font-medium flex items-center gap-2"
      style={{ color: "var(--text-primary)" }}
    >
      {label}
      {pro && (
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            color: "var(--accent-amber)",
          }}
        >
          PRO
        </span>
      )}
    </span>
  </button>
);


