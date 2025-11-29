// src/pages/Notes.jsx
import {
  FiPlus,
  FiEdit2,
  FiCamera,
  FiUpload,
  FiTrash2,
  FiHeart,
  FiLock,
} from "react-icons/fi";

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
    updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
    favorite: false,
    locked: false,
  },
  {
    id: 2,
    title: "Thesis: Chapter 3",
    body: "Need to refine chapter summary and add diagrams...",
    tag: "Study",
    updated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    favorite: true,
    locked: true,
  },
  {
    id: 3,
    title: "Product ideas",
    body: "Smart scan input, AI suggestions, cloud sync...",
    tag: "Ideas",
    updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
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
        prev.map((n) =>
          n.id === pendingNoteId ? { ...n, locked: true } : n
        )
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
        prev.map((n) =>
          n.id === pendingNoteId ? { ...n, locked: false } : n
        )
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
      prev.map((n) =>
        n.id === id ? { ...n, favorite: newFavorite } : n
      )
    );

    if (fromView) updateSelectedNote(id, { favorite: newFavorite });
    if (activeMenuId === id) setActiveMenuId(null);
  };

  const onEditSave = (id, newTitle, newBody, updated) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, title: newTitle, body: newBody, updated }
          : n
      )
    );

  setSelectedNote((prev) =>
    prev && prev.id === id
      ? { ...prev, title: newTitle, body: newBody, updated }
      : prev
  );

    setSelectedNote((prev) =>
      prev && prev.id === id
        ? { ...prev, title: newTitle, body: newBody }
        : prev
    );
  };

  const handleLockToggle = (id, fromView = false) => {
    const stored = localStorage.getItem(PIN_KEY);
    const target = notes.find((n) => n.id === id);

    if (!target.locked) {
      if (!stored) return openSetPinForNote(id);

      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, locked: true } : n
        )
      );
      if (fromView) updateSelectedNote(id, { locked: true });
    } else {
      if (!stored) {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, locked: false } : n
          )
        );
        if (fromView) updateSelectedNote(id, { locked: false });
        return;
      }

      openUnlockForNote(id, fromView);
      return;
    }

    if (activeMenuId === id) setActiveMenuId(null);
  };

  // Upload existing files
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const isPDF = file.type.includes("pdf");
    const objectUrl = URL.createObjectURL(file);

  // Simulated upload delay (can replace with backend later)
    await new Promise((r) => setTimeout(r, 1200));

  const newNote = {
    id: Date.now(),
    title: file.name
      .replace(/\.[^/.]+$/, "")  // remove extension
      .replace(/[_-]+/g, " ")    // replace _ and - with space
      .replace(/\s+/g, " ")      // normalize spaces
      .replace(/_/g, " ")
      .trim(),

    body: "",
    tag: isPDF ? "PDF" : "Photo",
    updated: new Date().toISOString(),
    favorite: false,
    locked: false,
    analyzing: false, // ensures UI doesn’t flash analyzing mode

    fileType: isPDF ? "pdf" : "image",
    pdfUrl: isPDF ? objectUrl : null,
    imageUrl: !isPDF ? objectUrl : null,
  };


    setNotes((prev) => [newNote, ...prev]);
    setUploading(false);
  };

// Scan from camera (mobile only)
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
        .filter((n) =>
          n.title.toLowerCase().includes(query.toLowerCase())
        )
        .sort((a, b) => b.favorite - a.favorite),
    [query, notes]
  );

  const createNote = () => {
    const item = {
      id: Date.now(),
      title: newNote.title || "Untitled",
      body: newNote.body || "Note content coming soon...",
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

    // Bind hidden input actions to handlers
  useEffect(() => {
    if (!cameraInputRef.current) return;
    cameraInputRef.current.onchange = handleScanCapture;
  }, []);

  useEffect(() => {
    if (!filePickerRef.current) return;
    filePickerRef.current.onchange = handleFileUpload;
  }, []);

  // Close Add Menu when clicking outside
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

    return () =>
      document.removeEventListener("click", closeMenuOnOutsideClick);
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
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+110px)] relative animate-fadeIn pt-2">
      <header className="pt-2">
        <h1 className="text-2xl font-semibold text-white">My Notes</h1>
        <p className="text-gray-400 text-sm">Organized. Searchable.</p>
      </header>

      <GlassCard className="p-4">
        <input
          type="text"
          placeholder="Search notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#101016] border border-[#26262c] rounded-xl px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-indigo-500"
        />
      </GlassCard>

      <div className="flex justify-end -mt-2">
        <button
          className="text-xs text-gray-300 bg-[#1a1a20] border border-[#2a2a32]
          px-3 py-1 rounded-xl hover:border-indigo-500/40 transition"
          onClick={() => setGridView(!gridView)}
        >
          {gridView ? "List View" : "Grid View"}
        </button>
      </div>

      <div
        className={`grid gap-4 transition-all ${
          gridView ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        {filteredNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onMenu={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const x = rect.right - 160;
              const y = rect.bottom + 8;
              setMenuPos({ x, y });
              setActiveMenuId(note.id);
            }}
            onOpen={() => tryOpenNote(note)}
          />
        ))}
      </div>

      {activeMenuId && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[90]"
            onClick={() => setActiveMenuId(null)}
          />
          <div
            className="fixed bg-[#1b1b22] p-2 rounded-2xl border border-[#2d2d32]
            shadow-[0_6px_24px_rgba(0,0,0,0.45)] flex flex-col gap-1 z-[200]"
            style={{ top: menuPos.y, left: menuPos.x }}
          >
            <button className="menu-icon-btn" onClick={() => tryOpenNote(notes.find(n => n.id === activeMenuId))}>
              <FiEdit2 /> Open
            </button>

            <button className="menu-icon-btn" onClick={() => handleFavorite(activeMenuId)}>
              <FiHeart
                className={
                  notes.find((n) => n.id === activeMenuId)?.favorite
                    ? "text-rose-400"
                    : "text-gray-300"
                }
              />
              Favorite
            </button>

            <button className="menu-icon-btn" onClick={() => handleLockToggle(activeMenuId)}>
              <FiLock />
              {notes.find((n) => n.id === activeMenuId)?.locked ? "Unlock" : "Lock"}
            </button>

            <button className="menu-icon-btn text-rose-400" onClick={() => handleDelete(activeMenuId)}>
              <FiTrash2 /> Delete
            </button>

            <button className="menu-cancel" onClick={() => setActiveMenuId(null)}>
              Cancel
            </button>
          </div>
        </>
      )}

      {showAddMenu && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+var(--mobile-nav-height)+82px)] right-5 flex flex-col gap-3 z-[150]">
          <button className="action-btn" onClick={() => { setEditorOpen(true); setShowAddMenu(false); }}>
            <FiEdit2 /> New
          </button>

        {isMobileDevice && (
          <button
            className="action-btn"
            onClick={() => {
              if (cameraInputRef.current) {
                cameraInputRef.current.value = null; // reset previous selection
                cameraInputRef.current.click();     // open camera
              }
            }}
          >
            <FiCamera /> Scan
          </button>
        )}

          <button
            className="action-btn"
            onClick={() => {
              if (filePickerRef.current) {
                filePickerRef.current.value = null; // reset previous selection
                filePickerRef.current.click();     // open file picker
              }
            }}
          >
            <FiUpload /> Upload
          </button>
        </div>
      )}

      <button className="fab-btn" onClick={() => setShowAddMenu(!showAddMenu)}>
        <FiPlus size={30} strokeWidth={3} />
      </button>

      {editorOpen && (
        <>
          <div className="modal-backdrop" onClick={() => setEditorOpen(false)} />
          <div className="modal zoom-in">
            <input
              className="modal-title"
              placeholder="Title"
              maxLength={80}
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            />
            <textarea
              className="modal-body"
              placeholder="Start writing..."
              rows={6}
              value={newNote.body}
              onChange={(e) => setNewNote({ ...newNote, body: e.target.value })}
            />
            <button className="modal-save" onClick={createNote}>
              Save
            </button>
          </div>
        </>
      )}

      {pinModalOpen && (
        <>
          <div
            className="modal-backdrop"
            onClick={() => {
              setPinModalOpen(false);
              setPinInput("");
              setPinMode(null);
              setPendingNoteId(null);
            }}
          />
          <div className="modal zoom-in">
            <h3 className="text-lg font-semibold mb-3 text-white">
              {pinMode === "set" ? "Set a 4-digit PIN" : "Enter PIN"}
            </h3>
            <input
              className="w-full mb-3 bg-[#101016] border border-[#26262c] rounded-xl px-3 py-2 text-center tracking-[0.4em] text-lg"
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
            />
            <button className="modal-save mt-1" onClick={handlePinSubmit}>
              {pinMode === "set" ? "Save PIN" : "Unlock"}
            </button>
          </div>
        </>
      )}
      {/* Hidden file inputs */}
        <input
          type="file"
          accept="image/*,application/pdf"
          capture="camera"
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

      {uploading && (
        <div className="
          fixed top-0 left-0 right-0 z-[300]
          bg-gradient-to-b from-[#0d0d10]/95 to-[#0d0d10]/70
          backdrop-blur-xl border-b border-indigo-500/20
          flex flex-col items-center justify-center
          py-4 animate-fadeIn
        ">
          {/* Smooth Loading Bar */}
          <div className="w-40 h-1.5 bg-[#1c1c24] rounded-full overflow-hidden mb-3">
            <div className="h-full w-full bg-indigo-500 animate-[loadbar_1.2s_infinite]" />
          </div>

          {/* Uploading Text */}
          <p className="text-xs text-indigo-300 tracking-wide">
            Uploading…
          </p>
        </div>
      )}
    </div>
  );
}
