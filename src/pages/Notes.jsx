// src/pages/Notes.jsx
import {
  FiPlus,
  FiEdit2,
  FiCamera,
  FiUpload,
  FiTrash2,
  FiHeart,
  FiLock,
  FiGrid,
  FiList,
  FiX,
  FiSearch,
} from "react-icons/fi";
import { Note, FilePlus, Camera, UploadSimple, X } from "phosphor-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useRef, useEffect } from "react";
import GlassCard from "../components/GlassCard";
import NoteCard from "../components/NoteCard";
import NoteView from "./NoteView";

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
  const [uploading, setUploading] = useState(false);
  const cameraInputRef = useRef(null);
  const filePickerRef = useRef(null);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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

  const updateSelectedNote = (id, updates) => {
    setSelectedNote((prev) =>
      prev && prev.id === id ? { ...prev, ...updates } : prev
    );
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

  const handleDelete = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
    if (activeMenuId === id) setActiveMenuId(null);
  };

  const handleFavorite = (id, fromView = false) => {
    const current = notes.find((n) => n.id === id);
    const newFavorite = !current.favorite;

    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, favorite: newFavorite } : n))
    );

    if (fromView) updateSelectedNote(id, { favorite: newFavorite });
    if (activeMenuId === id) setActiveMenuId(null);
  };

  const onEditSave = (id, newTitle, newBody, updated) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, title: newTitle, body: newBody, updated } : n
      )
    );

    setSelectedNote((prev) =>
      prev && prev.id === id
        ? { ...prev, title: newTitle, body: newBody, updated }
        : prev
    );
  };

  const handleLockToggle = (id, fromView = false) => {
    const stored = localStorage.getItem(PIN_KEY);
    const target = notes.find((n) => n.id === id);

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

    if (activeMenuId === id) setActiveMenuId(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const isPDF = file.type.includes("pdf");
    const objectUrl = URL.createObjectURL(file);

    await new Promise((r) => setTimeout(r, 1200));

    const newNote = {
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

    setNotes((prev) => [newNote, ...prev]);
    setUploading(false);
  };

  const handleScanCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    await new Promise((r) => setTimeout(r, 1200));

    const objectUrl = URL.createObjectURL(file);

    const newNote = {
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

    setNotes((prev) => [newNote, ...prev]);
    setUploading(false);
  };

  const generateSummary = (id) => {
    const note = notes.find((n) => n.id === id);
    if (note) alert(`AI summary (placeholder):\n\n${note.title}`);
  };

  const filteredNotes = useMemo(
    () =>
      notes
        .filter((n) => n.title.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => b.favorite - a.favorite),
    [query, notes]
  );

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
      if (!isFab && !isMenu) {
        setShowAddMenu(false);
      }
    };

    document.addEventListener("click", closeMenuOnOutsideClick);
    return () => document.removeEventListener("click", closeMenuOnOutsideClick);
  }, [showAddMenu]);

  if (selectedNote) {
    return (
      <NoteView
        note={selectedNote}
        onBack={() => setSelectedNote(null)}
        onFavoriteToggle={handleFavorite}
        onEditSave={onEditSave}
        onDelete={handleDelete}
        onLockToggle={handleLockToggle}
        generateSummary={generateSummary}
      />
    );
  }

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+110px)] relative animate-fadeIn">
      {/* Header */}
      <header className="pt-2 px-1">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-semibold tracking-tight text-theme-primary">My Notes</h1>
          <Note className="text-indigo-400" size={24} weight="duotone" />
        </div>
        <p className="text-theme-muted text-sm">Organized. Searchable. Intelligent.</p>
      </header>

      {/* Search Bar */}
      <GlassCard className="p-3">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={16} />
          <input
            type="text"
            placeholder="Search notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-theme-input border border-theme-secondary rounded-xl pl-10 pr-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/50 transition"
          />
        </div>
      </GlassCard>

      {/* View Toggle & Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-theme-muted">
          {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-1 bg-theme-input border border-theme-secondary rounded-xl p-1">
          <button
            onClick={() => setGridView(true)}
            className={`p-2 rounded-lg transition ${gridView
              ? "bg-theme-button text-theme-primary"
              : "text-theme-muted hover:text-[var(--text-secondary)]"
              }`}
          >
            <FiGrid size={16} />
          </button>
          <button
            onClick={() => setGridView(false)}
            className={`p-2 rounded-lg transition ${!gridView
              ? "bg-theme-button text-theme-primary"
              : "text-theme-muted hover:text-[var(--text-secondary)]"
              }`}
          >
            <FiList size={16} />
          </button>
        </div>
      </div>

      {/* Notes Grid/List */}
      <div
        className={`grid gap-4 transition-all ${gridView ? "grid-cols-2" : "grid-cols-1"
          }`}
      >
        {filteredNotes.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-secondary)]/10 border border-[var(--border-secondary)]/20 flex items-center justify-center">
              <Note size={32} weight="duotone" className="text-theme-muted" />
            </div>
            <p className="text-theme-muted text-sm">No notes found</p>
            <p className="text-theme-muted text-xs mt-1">Create your first note!</p>
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
              className="fixed inset-0 bg-theme-elevated/40 backdrop-blur-sm z-[90]"
              onClick={() => setActiveMenuId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed bg-theme-elevated p-2 rounded-2xl border border-[var(--border-secondary)] shadow-lg flex flex-col gap-1 z-[200] min-w-[180px]"
              style={{ top: menuPos.y, left: menuPos.x }}
            >
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
                    className={
                      notes.find((n) => n.id === activeMenuId)?.favorite
                        ? "text-rose-400"
                        : ""
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
              <MenuButton
                icon={<FiLock size={16} />}
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
              <div className="h-px bg-[#2a2a32] my-1" />
              <MenuButton
                icon={<FiTrash2 size={16} />}
                label="Delete"
                danger
                onClick={() => {
                  handleDelete(activeMenuId);
                  setActiveMenuId(null);
                }}
              />
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
                delay={0.05}
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
              delay={0.1}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAddMenu(!showAddMenu)}
        className={`fab-btn fixed bottom-[calc(env(safe-area-inset-bottom)+var(--mobile-nav-height)+16px)] right-5 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-theme-primary shadow-[0_8px_24px_rgba(99,102,241,0.4)] flex items-center justify-center z-[140] transition-transform ${showAddMenu ? "rotate-45" : ""
          }`}
      >
        <FiPlus size={26} strokeWidth={2.5} />
      </motion.button>

      {/* New Note Modal */}
      <AnimatePresence>
        {editorOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-theme-elevated/60 backdrop-blur-md z-[200]"
              onClick={() => setEditorOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-theme-elevated border border-[var(--border-secondary)] rounded-2xl p-5 shadow-xl z-[201] max-w-md mx-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <FilePlus size={20} weight="duotone" className="text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-theme-primary">New Note</h3>
                </div>
                <button
                  onClick={() => setEditorOpen(false)}
                  className="h-8 w-8 rounded-lgbg-theme-button flex items-center justify-center text-theme-muted hover:text-theme-primary transition"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* Form */}
              <input
                className="w-full bg-theme-input border border-theme-secondary rounded-xl px-4 py-3 text-theme-primary text-base font-medium placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/50 mb-3"
                placeholder="Note title..."
                maxLength={80}
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                autoFocus
              />
              <textarea
                className="w-full bg-theme-input border border-theme-secondary rounded-xl px-4 py-3 text-[var(--text-secondary)] text-sm placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/50 resize-none mb-4"
                placeholder="Start writing..."
                rows={5}
                value={newNote.body}
                onChange={(e) => setNewNote({ ...newNote, body: e.target.value })}
              />
              <button
                onClick={createNote}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-theme-primary font-medium transition hover:opacity-90 active:scale-[0.98]"
              >
                Create Note
              </button>
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
              className="fixed inset-0 bg-theme-elevated/60 backdrop-blur-md z-[200]"
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
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-theme-elevated border border-[var(--border-secondary)] rounded-2xl p-5 shadow-xl z-[201] max-w-sm mx-auto"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center ${pinMode === "set"
                    ? "bg-indigo-500/20 border border-indigo-500/30"
                    : "bg-amber-500/20 border border-amber-500/30"
                    }`}
                >
                  <FiLock
                    size={18}
                    className={pinMode === "set" ? "text-indigo-400" : "text-amber-400"}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-theme-primary">
                    {pinMode === "set" ? "Set PIN" : "Enter PIN"}
                  </h3>
                  <p className="text-xs text-theme-muted">
                    {pinMode === "set"
                      ? "Create a 4-digit PIN to lock notes"
                      : "Enter your PIN to unlock"}
                  </p>
                </div>
              </div>

              {/* PIN Input */}
              <input
                className="w-full bg-theme-input border border-theme-secondary rounded-xl px-4 py-4 text-center tracking-[0.5em] text-xl text-theme-primary font-mono placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/50 mb-4"
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                autoFocus
              />
              <button
                onClick={handlePinSubmit}
                className={`w-full py-3 rounded-xl font-medium transition hover:opacity-90 active:scale-[0.98] ${pinMode === "set"
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-theme-primary"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-theme-primary"
                  }`}
              >
                {pinMode === "set" ? "Save PIN" : "Unlock"}
              </button>
            </motion.div>
          </>
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
        capture={isIOS ? "camera" : "environment"}
        style={{ display: "none" }}
        ref={cameraInputRef}
      />

      {/* Upload Loader */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-[300] bg-gradient-to-b from-[#0d0d10]/95 to-[#0d0d10]/80 backdrop-blur-xl border-b border-indigo-500/20 flex flex-col items-center justify-center py-5"
          >
            <div className="w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-4">
              <UploadSimple
                size={28}
                weight="duotone"
                className="text-indigo-400 animate-bounce"
              />
            </div>
            <div className="w-48 h-1.5bg-theme-button rounded-full overflow-hidden mb-3">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-full w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
              />
            </div>
            <p className="text-sm text-accent-indigo font-medium">Uploading...</p>
            <p className="text-xs text-theme-muted mt-1">Please wait a moment</p>
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
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left w-full ${danger
      ? "text-rose-400 hover:bg-rose-500/10"
      : "text-[var(--text-secondary)] hover:bg-theme-button hover:text-theme-primary"
      }`}
  >
    <span className="flex-shrink-0">{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

/* -----------------------------------------
   FAB Action Button
----------------------------------------- */
const FABAction = ({ icon, label, onClick, delay = 0 }) => (
  <motion.button
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ delay }}
    onClick={onClick}
    className="
    action-btn flex items-center gap-3
    bg-theme-button border border-[var(--border-secondary)]
    px-4 py-3 rounded-xl text-theme-primary
    hover:bg-theme-button-hover hover:border-indigo-500/30
    transition active:scale-95
    "
  >
    <span className="text-indigo-400">{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </motion.button>
);
