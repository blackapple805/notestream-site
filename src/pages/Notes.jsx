// src/pages/Notes.jsx
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
} from "react-icons/fi";
import { Note, FilePlus, Camera, UploadSimple, Crown } from "phosphor-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import NoteCard from "../components/NoteCard";
import NoteView from "./NoteView";
import { useSubscription } from "../hooks/useSubscription";

const PIN_KEY = "ns-note-pin";

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

export default function Notes() {
  const navigate = useNavigate();
  
  // Subscription source of truth
  const { subscription, isFeatureUnlocked, isLoading } = useSubscription();
  const isPro = !!subscription?.plan && subscription.plan !== "free";
  const canUseVoice = typeof isFeatureUnlocked === "function" ? isFeatureUnlocked("voice") : isPro;
  const canUseExport = typeof isFeatureUnlocked === "function" ? isFeatureUnlocked("export") : isPro;
  
  // Toast when plan flips free -> pro
  const [planToast, setPlanToast] = useState(false);
  const prevPlanRef = useRef(subscription?.plan);
  useEffect(() => {
    const prev = prevPlanRef.current;
    const next = subscription?.plan;

    if (prev === "free" && next && next !== "free") {
      setPlanToast(true);
      window.setTimeout(() => setPlanToast(false), 2500);
    }
    prevPlanRef.current = next;
  }, [subscription?.plan]);

  const [uploading, setUploading] = useState(false);
  const cameraInputRef = useRef(null);
  const filePickerRef = useRef(null);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const [selectedNote, setSelectedNote] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [gridView, setGridView] = useState(true);
  const [notes, setNotes] = useState(initialNotes);
  const [query, setQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", body: "" });

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinMode, setPinMode] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [pendingNoteId, setPendingNoteId] = useState(null);

  // Pro gating UI
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Voice recorder UI
  const [recOpen, setRecOpen] = useState(false);
  const [recState, setRecState] = useState("idle");
  const [recError, setRecError] = useState("");
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);

  const updateSelectedNote = (id, updates) => {
    setSelectedNote((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
  };

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
      setNotes((prev) => prev.map((n) => (n.id === pendingNoteId ? { ...n, locked: true } : n)));
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
      setNotes((prev) => prev.map((n) => (n.id === pendingNoteId ? { ...n, locked: false } : n)));
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

  const handleDelete = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
    if (activeMenuId === id) setActiveMenuId(null);
  };

  const handleFavorite = (id, fromView = false) => {
    const current = notes.find((n) => n.id === id);
    const newFavorite = !current.favorite;

    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, favorite: newFavorite } : n)));

    if (fromView) updateSelectedNote(id, { favorite: newFavorite });
    if (activeMenuId === id) setActiveMenuId(null);
  };

  const onEditSave = (id, newTitle, newBody, updated) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, title: newTitle, body: newBody, updated } : n))
    );

    setSelectedNote((prev) =>
      prev && prev.id === id ? { ...prev, title: newTitle, body: newBody, updated } : prev
    );
  };

  const handleLockToggle = (id, fromView = false) => {
    const stored = localStorage.getItem(PIN_KEY);
    const target = notes.find((n) => n.id === id);

    if (!target.locked) {
      if (!stored) return openSetPinForNote(id);

      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, locked: true } : n)));
      if (fromView) updateSelectedNote(id, { locked: true });
    } else {
      if (!stored) {
        setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, locked: false } : n)));
        if (fromView) updateSelectedNote(id, { locked: false });
        return;
      }
      openUnlockForNote(id, fromView);
      return;
    }

    if (activeMenuId === id) setActiveMenuId(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const isPDF = file.type.includes("pdf");
    const objectUrl = URL.createObjectURL(file);

    await new Promise((r) => setTimeout(r, 1200));

    const newNoteItem = {
      id: Date.now(),
      title: file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
      body: "",
      tag: isPDF ? "PDF" : "Photo",
      updated: new Date().toISOString(),
      favorite: false,
      locked: false,
      analyzing: false,
      fileType: isPDF ? "pdf" : "image",
      pdfUrl: isPDF ? objectUrl : null,
      imageUrl: !isPDF ? objectUrl : null,
    };

    setNotes((prev) => [newNoteItem, ...prev]);
    setUploading(false);
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
      pdfUrl: null,
      imageUrl: objectUrl,
    };

    setNotes((prev) => [newNoteItem, ...prev]);
    setUploading(false);
  };

  // Active filter state
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Apply filter
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

    // Apply search query
    if (query) {
      filtered = filtered.filter((n) =>
        n.title.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Sort favorites first
    return filtered.sort((a, b) => b.favorite - a.favorite);
  }, [query, notes, activeFilter]);

  const createNote = () => {
    const item = {
      id: Date.now(),
      title: newNote.title || "Untitled",
      body: newNote.body || "",
      tag: "Note",
      updated: new Date().toISOString(),
      favorite: false,
      locked: false,
    };
    setNotes((prev) => [item, ...prev]);
    setNewNote({ title: "", body: "" });
    setEditorOpen(false);
  };

  const tryOpenNote = (note) => {
    const stored = localStorage.getItem(PIN_KEY);

    if (!note.locked) return setSelectedNote(note);

    if (!stored) return openSetPinForNote(note.id);
    openUnlockForNote(note.id, true);
  };

  useEffect(() => {
    if (!cameraInputRef.current) return;
    cameraInputRef.current.onchange = handleScanCapture;
  }, []);

  useEffect(() => {
    if (!filePickerRef.current) return;
    filePickerRef.current.onchange = handleFileUpload;
  }, []);

  useEffect(() => {
    const closeMenuOnOutsideClick = (e) => {
      if (!showAddMenu) return;
      const isFab = e.target.closest(".fab-btn");
      const isMenu = e.target.closest(".action-btn");
      if (!isFab && !isMenu) setShowAddMenu(false);
    };

    document.addEventListener("click", closeMenuOnOutsideClick);
    return () => document.removeEventListener("click", closeMenuOnOutsideClick);
  }, [showAddMenu]);

  const stopTracks = useCallback(() => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } catch {}
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
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

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (evt) => {
        if (evt.data && evt.data.size > 0) chunksRef.current.push(evt.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
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
          audioMime: "audio/webm",
        };

        setNotes((prev) => [newVoiceNote, ...prev]);
        setRecState("stopped");
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
      r.start();
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
    stopTracks();
    setRecState("stopped");
  };

  const closeRecorder = () => {
    stopTracks();
    setRecOpen(false);
    setRecState("idle");
    setRecError("");
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (selectedNote) {
    return (
      <>
        <AnimatePresence>
          {planToast && (
            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-[999] px-4 py-2.5 rounded-xl border shadow-xl backdrop-blur-md"
              style={{
                backgroundColor: "rgba(16,185,129,0.12)",
                borderColor: "rgba(16,185,129,0.25)",
                color: "rgba(167,243,208,1)",
              }}
            >
              Pro unlocked. Notes features updated.
            </motion.div>
          )}
        </AnimatePresence>

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
      </>
    );
  }

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+110px)] relative animate-fadeIn">
      {/* Pro unlock toast */}
      <AnimatePresence>
        {planToast && (
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[999] px-4 py-2.5 rounded-xl border shadow-xl backdrop-blur-md"
            style={{
              backgroundColor: "rgba(16,185,129,0.12)",
              borderColor: "rgba(16,185,129,0.25)",
              color: "rgba(167,243,208,1)",
            }}
          >
            Pro unlocked. Notes features updated.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - Updated to match other pages */}
      <header className="pt-2 px-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
            <Note className="text-indigo-400" size={18} weight="duotone" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-theme-primary">My Notes</h1>
            <p className="text-theme-muted text-sm">Organized. Searchable. Intelligent.</p>
          </div>
        </div>
      </header>

      {/* Search Bar - Fancy Rounded Design */}
      <div className="relative group">
        <div 
          className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300"
        />
        <div 
          className="relative flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 group-focus-within:border-indigo-500/50 group-focus-within:shadow-lg group-focus-within:shadow-indigo-500/10"
          style={{ 
            backgroundColor: "var(--bg-surface)", 
            borderColor: "var(--border-secondary)" 
          }}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <FiSearch className="text-indigo-400" size={16} />
          </div>
          <input
            type="text"
            placeholder="Search your notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-theme-tertiary text-theme-muted hover:text-theme-primary hover:bg-rose-500/10 hover:text-rose-400 transition-all"
            >
              <FiX size={14} />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l" style={{ borderColor: "var(--border-secondary)" }}>
            <span className="text-[10px] text-theme-muted px-2 py-1 rounded-md bg-theme-tertiary">
              {filteredNotes.length}
            </span>
            <span className="text-[10px] text-theme-muted">
              {filteredNotes.length === 1 ? "note" : "notes"}
            </span>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-theme-muted sm:hidden">
          {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}
        </p>
        <div className="flex gap-1 bg-theme-input border border-theme-secondary rounded-xl p-1 ml-auto">
          <button
            onClick={() => setGridView(true)}
            className={`p-2 rounded-lg transition ${
              gridView 
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" 
                : "text-theme-muted hover:text-theme-secondary"
            }`}
          >
            <FiGrid size={16} />
          </button>
          <button
            onClick={() => setGridView(false)}
            className={`p-2 rounded-lg transition ${
              !gridView 
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" 
                : "text-theme-muted hover:text-theme-secondary"
            }`}
          >
            <FiList size={16} />
          </button>
        </div>
      </div>

      {/* Filter Tabs - Functional */}
      <div className="flex gap-2 overflow-x-auto pb-1 px-1 -mx-1 scrollbar-hide">
        {[
          { id: "all", label: "All", count: notes.length, icon: null },
          { id: "favorites", label: "Favorites", count: notes.filter(n => n.favorite).length, icon: FiHeart },
          { id: "locked", label: "Locked", count: notes.filter(n => n.locked).length, icon: FiLock },
          { id: "voice", label: "Voice", count: notes.filter(n => n.tag === "Voice").length, icon: FiMic },
        ].map((filter) => {
          const isActive = activeFilter === filter.id;
          const IconComponent = filter.icon;
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-500/10"
                  : "bg-theme-surface border border-theme-secondary text-theme-muted hover:text-theme-secondary hover:border-indigo-500/20 hover:bg-indigo-500/5"
              }`}
              style={!isActive ? { backgroundColor: "var(--bg-surface)" } : {}}
            >
              {IconComponent && (
                <IconComponent 
                  size={14} 
                  className={isActive ? "text-indigo-400" : "text-theme-muted"} 
                />
              )}
              {filter.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                isActive 
                  ? "bg-indigo-500/25 text-indigo-300" 
                  : "bg-theme-tertiary text-theme-muted"
              }`}>
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notes Grid/List */}
      <div className={`grid gap-4 transition-all ${gridView ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {filteredNotes.length === 0 ? (
          <div className="col-span-2">
            <GlassCard className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                {activeFilter === "favorites" ? (
                  <FiHeart size={32} className="text-indigo-400/60" />
                ) : activeFilter === "locked" ? (
                  <FiLock size={32} className="text-indigo-400/60" />
                ) : activeFilter === "voice" ? (
                  <FiMic size={32} className="text-indigo-400/60" />
                ) : (
                  <Note size={32} weight="duotone" className="text-indigo-400/60" />
                )}
              </div>
              <h3 className="text-lg font-medium text-theme-primary mb-1">
                {query 
                  ? "No notes found" 
                  : activeFilter === "favorites" 
                    ? "No favorite notes" 
                    : activeFilter === "locked" 
                      ? "No locked notes"
                      : activeFilter === "voice"
                        ? "No voice notes"
                        : "No notes yet"
                }
              </h3>
              <p className="text-theme-muted text-sm mb-4">
                {query 
                  ? "Try a different search term" 
                  : activeFilter === "favorites" 
                    ? "Mark notes as favorites to see them here"
                    : activeFilter === "locked"
                      ? "Lock notes to keep them private"
                      : activeFilter === "voice"
                        ? "Record voice notes to see them here"
                        : "Create your first note to get started!"
                }
              </p>
              {!query && activeFilter === "all" && (
                <button
                  onClick={() => setEditorOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium transition hover:opacity-90 active:scale-[0.98]"
                >
                  <FiPlus size={16} />
                  New Note
                </button>
              )}
              {!query && activeFilter === "voice" && canUseVoice && (
                <button
                  onClick={() => openVoiceRecorder()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium transition hover:opacity-90 active:scale-[0.98]"
                >
                  <FiMic size={16} />
                  Record Voice Note
                </button>
              )}
              {activeFilter !== "all" && (
                <button
                  onClick={() => setActiveFilter("all")}
                  className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition"
                >
                  ← View all notes
                </button>
              )}
            </GlassCard>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onMenu={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.min(rect.right - 180, window.innerWidth - 200);
                const y = rect.bottom + 8;
                setMenuPos({ x, y });
                setActiveMenuId(note.id);
              }}
              onOpen={() => tryOpenNote(note)}
            />
          ))
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
              style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
              onClick={() => setActiveMenuId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed rounded-2xl border shadow-xl z-[200] min-w-[200px] overflow-hidden"
              style={{ 
                top: menuPos.y, 
                left: menuPos.x,
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-secondary)"
              }}
            >
              <div className="p-2">
                <MenuButton
                  icon={<FiEdit2 size={16} />}
                  label="Open"
                  onClick={() => {
                    tryOpenNote(notes.find((n) => n.id === activeMenuId));
                    setActiveMenuId(null);
                  }}
                />
                <MenuButton
                  icon={
                    <FiHeart
                      size={16}
                      className={notes.find((n) => n.id === activeMenuId)?.favorite ? "text-rose-400 fill-rose-400" : ""}
                    />
                  }
                  label={notes.find((n) => n.id === activeMenuId)?.favorite ? "Unfavorite" : "Favorite"}
                  onClick={() => {
                    handleFavorite(activeMenuId);
                    setActiveMenuId(null);
                  }}
                />
                <MenuButton
                  icon={<FiLock size={16} />}
                  label={notes.find((n) => n.id === activeMenuId)?.locked ? "Unlock" : "Lock"}
                  onClick={() => {
                    handleLockToggle(activeMenuId);
                    setActiveMenuId(null);
                  }}
                />
                <div className="h-px my-1" style={{ backgroundColor: "var(--border-secondary)" }} />
                <MenuButton
                  icon={<FiTrash2 size={16} />}
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

      {/* FAB Menu */}
      <AnimatePresence>
        {showAddMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+var(--mobile-nav-height)+90px)] right-5 flex flex-col gap-3 z-[150]"
          >
            <FABAction
              icon={<FiEdit2 size={18} />}
              label="New Note"
              onClick={() => {
                setEditorOpen(true);
                setShowAddMenu(false);
              }}
              delay={0}
            />
            <FABAction
              icon={<FiMic size={18} />}
              label={canUseVoice ? "Voice Note" : "Voice Note"}
              onClick={() => {
                openVoiceRecorder();
                setShowAddMenu(false);
              }}
              delay={0.03}
              proHint={!canUseVoice}
            />
            {isMobileDevice && (
              <FABAction
                icon={<Camera size={20} weight="duotone" />}
                label="Scan"
                onClick={() => {
                  if (cameraInputRef.current) {
                    cameraInputRef.current.value = null;
                    cameraInputRef.current.click();
                  }
                  setShowAddMenu(false);
                }}
                delay={0.06}
              />
            )}
            <FABAction
              icon={<UploadSimple size={20} weight="duotone" />}
              label="Upload"
              onClick={() => {
                if (filePickerRef.current) {
                  filePickerRef.current.value = null;
                  filePickerRef.current.click();
                }
                setShowAddMenu(false);
              }}
              delay={0.09}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAddMenu(!showAddMenu)}
        className={`fab-btn fixed bottom-[calc(env(safe-area-inset-bottom)+var(--mobile-nav-height)+16px)] right-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center z-[140] transition-all duration-200 ${
          showAddMenu ? "rotate-45 shadow-indigo-500/50" : "hover:shadow-indigo-500/40"
        }`}
      >
        <FiPlus size={26} strokeWidth={2.5} />
      </motion.button>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgrade && (
          <UpgradeModal
            onClose={() => setShowUpgrade(false)}
            title="Pro Feature"
            body="Voice Notes and Advanced Export are available on Pro. Upgrade to unlock these powerful features."
            onUpgrade={() => navigate("/dashboard/ai-lab")}
          />
        )}
      </AnimatePresence>

      {/* Voice Recorder Modal */}
      <AnimatePresence>
        {recOpen && (
          <VoiceRecorderModal
            onClose={closeRecorder}
            state={recState}
            error={recError}
            onStart={startRecording}
            onStop={stopRecording}
          />
        )}
      </AnimatePresence>

      {/* New Note Modal */}
      <AnimatePresence>
        {editorOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200]"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
              onClick={() => setEditorOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 rounded-2xl border shadow-xl z-[201] max-w-md mx-auto overflow-hidden"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
            >
              {/* Header */}
              <div className="p-5 border-b" style={{ borderColor: "var(--border-secondary)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                      <FilePlus size={20} weight="duotone" className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-theme-primary">New Note</h3>
                      <p className="text-xs text-theme-muted">Create a new note</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditorOpen(false)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-theme-muted hover:text-theme-primary transition"
                    style={{ backgroundColor: "var(--bg-tertiary)" }}
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-theme-muted mb-2 block">Title</label>
                  <input
                    className="w-full border rounded-xl px-4 py-3 text-theme-primary text-base font-medium placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition"
                    style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)" }}
                    placeholder="Note title..."
                    maxLength={80}
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-theme-muted mb-2 block">Content</label>
                  <textarea
                    className="w-full border rounded-xl px-4 py-3 text-theme-secondary text-sm placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 resize-none transition"
                    style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)" }}
                    placeholder="Start writing..."
                    rows={5}
                    value={newNote.body}
                    onChange={(e) => setNewNote({ ...newNote, body: e.target.value })}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-tertiary)" }}>
                <button
                  onClick={createNote}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium transition hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <FiPlus size={18} />
                  Create Note
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PIN Modal */}
      <AnimatePresence>
        {pinModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200]"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
              onClick={() => {
                setPinModalOpen(false);
                setPinInput("");
                setPinMode(null);
                setPendingNoteId(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 rounded-2xl border shadow-xl z-[201] max-w-sm mx-auto overflow-hidden"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
            >
              {/* Header */}
              <div className="p-5 border-b" style={{ borderColor: "var(--border-secondary)" }}>
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      pinMode === "set"
                        ? "bg-indigo-500/20 border border-indigo-500/30"
                        : "bg-amber-500/20 border border-amber-500/30"
                    }`}
                  >
                    <FiLock size={18} className={pinMode === "set" ? "text-indigo-400" : "text-amber-400"} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-theme-primary">
                      {pinMode === "set" ? "Set PIN" : "Enter PIN"}
                    </h3>
                    <p className="text-xs text-theme-muted">
                      {pinMode === "set" ? "Create a 4-digit PIN to lock notes" : "Enter your PIN to unlock"}
                    </p>
                  </div>
                </div>
              </div>

              {/* PIN Input */}
              <div className="p-5">
                <input
                  className="w-full border rounded-xl px-4 py-4 text-center tracking-[0.5em] text-xl text-theme-primary font-mono placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition"
                  style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)" }}
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  autoFocus
                />
              </div>

              {/* Footer */}
              <div className="p-5 border-t" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-tertiary)" }}>
                <button
                  onClick={handlePinSubmit}
                  className={`w-full py-3 rounded-xl font-medium transition hover:opacity-90 active:scale-[0.98] ${
                    pinMode === "set"
                      ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white"
                      : "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                  }`}
                >
                  {pinMode === "set" ? "Save PIN" : "Unlock"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      <input type="file" accept="image/*,application/pdf" style={{ display: "none" }} ref={filePickerRef} />
      <input
        type="file"
        accept="image/*"
        capture={isIOS ? "camera" : "environment"}
        style={{ display: "none" }}
        ref={cameraInputRef}
      />

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
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-6">
              <UploadSimple size={32} weight="duotone" className="text-indigo-400 animate-bounce" />
            </div>
            <div className="w-48 h-1.5 bg-theme-tertiary rounded-full overflow-hidden mb-4">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-full w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
              />
            </div>
            <p className="text-base text-theme-primary font-medium">Uploading...</p>
            <p className="text-sm text-theme-muted mt-1">Please wait a moment</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -----------------------------------------
   Menu Button Component
----------------------------------------- */
const MenuButton = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left w-full ${
      danger
        ? "text-rose-400 hover:bg-rose-500/10"
        : "text-theme-secondary hover:bg-white/5 hover:text-theme-primary"
    }`}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

/* -----------------------------------------
   FAB Action Button
----------------------------------------- */
const FABAction = ({ icon, label, onClick, delay = 0, proHint }) => (
  <motion.button
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ delay }}
    onClick={onClick}
    className="action-btn flex items-center gap-3 px-4 py-3 rounded-xl text-theme-primary transition active:scale-95 border shadow-lg"
    style={{ 
      backgroundColor: "var(--bg-surface)", 
      borderColor: "var(--border-secondary)" 
    }}
  >
    <span className="text-indigo-400">{icon}</span>
    <span className="text-sm font-medium flex items-center gap-2">
      {label}
      {proHint && (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 font-medium">
          PRO
        </span>
      )}
    </span>
  </motion.button>
);

/* -----------------------------------------
   Upgrade Modal Component
----------------------------------------- */
const UpgradeModal = ({ onClose, title, body, onUpgrade }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[999] flex items-center justify-center px-4"
    style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-[400px] rounded-2xl border shadow-xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
    >
      {/* Header */}
      <div className="p-6 border-b" style={{ borderColor: "var(--border-secondary)" }}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
            <Crown size={24} weight="fill" className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-theme-primary">{title}</h3>
            <p className="text-xs text-theme-muted">Upgrade to unlock</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <p className="text-theme-secondary text-sm leading-relaxed">{body}</p>
        
        <div className="mt-4 p-3 rounded-xl border" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}>
          <p className="text-xs text-theme-muted mb-2">Pro includes:</p>
          <ul className="space-y-1.5">
            {["Voice notes & transcription", "Advanced export options", "Unlimited AI features", "Cloud sync"].map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-theme-secondary">
                <span className="w-1 h-1 rounded-full bg-indigo-400" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t flex gap-3" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-tertiary)" }}>
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-xl text-theme-secondary font-medium transition border hover:bg-white/5"
          style={{ borderColor: "var(--border-secondary)" }}
        >
          Not now
        </button>
        <button
          onClick={() => {
            onClose();
            onUpgrade?.();
          }}
          className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium transition hover:opacity-95 flex items-center justify-center gap-2"
        >
          <Crown size={16} weight="fill" />
          Upgrade
        </button>
      </div>
    </motion.div>
  </motion.div>
);

/* -----------------------------------------
   Voice Recorder Modal Component
----------------------------------------- */
const VoiceRecorderModal = ({ onClose, state, error, onStart, onStop }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[999] flex items-center justify-center px-4"
    style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-[420px] rounded-2xl border shadow-xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
    >
      {/* Header */}
      <div className="p-5 border-b" style={{ borderColor: "var(--border-secondary)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              state === "recording" 
                ? "bg-rose-500/20 border border-rose-500/30" 
                : "bg-indigo-500/20 border border-indigo-500/30"
            }`}>
              <FiMic className={state === "recording" ? "text-rose-400" : "text-indigo-400"} size={18} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-theme-primary">Voice Note</h3>
              <p className="text-xs text-theme-muted">Record and save as a new note</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-theme-muted hover:text-theme-primary transition"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
          >
            <FiX size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {error ? (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Display */}
            <div
              className="p-4 rounded-xl border text-center"
              style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-input)" }}
            >
              {state === "recording" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-rose-400 rounded-full"
                        animate={{ height: [8, 24, 8] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                  <p className="text-rose-400 text-sm font-medium flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                    Recording...
                  </p>
                </div>
              ) : state === "stopped" ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <FiMic className="text-emerald-400" size={20} />
                  </div>
                  <p className="text-emerald-400 text-sm font-medium">Recording saved!</p>
                  <p className="text-xs text-theme-muted">A new "Voice Note" was added to your notes.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <FiMic className="text-indigo-400" size={20} />
                  </div>
                  <p className="text-theme-secondary text-sm">Ready to record</p>
                  <p className="text-xs text-theme-muted">Tap Start to begin recording</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <button
                onClick={onStart}
                disabled={state === "recording" || state === "stopped"}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                  state === "recording" || state === "stopped"
                    ? "opacity-50 cursor-not-allowed bg-theme-tertiary text-theme-muted"
                    : "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:opacity-95"
                }`}
              >
                <FiMic size={16} />
                Start
              </button>
              <button
                onClick={onStop}
                disabled={state !== "recording"}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                  state !== "recording"
                    ? "opacity-50 cursor-not-allowed bg-theme-tertiary text-theme-muted"
                    : "bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:opacity-95"
                }`}
              >
                <FiX size={16} />
                Stop
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {state === "stopped" && (
        <div className="p-5 border-t" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-tertiary)" }}>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-medium transition border hover:bg-white/5 text-theme-secondary"
            style={{ borderColor: "var(--border-secondary)" }}
          >
            Done
          </button>
        </div>
      )}
    </motion.div>
  </motion.div>
);

