// src/pages/Notes.jsx
import { FiPlus, FiEdit2, FiCamera, FiUpload, FiTrash2, FiStar } from "react-icons/fi";
import { useState, useMemo } from "react";
import GlassCard from "../components/GlassCard";
import NoteCard from "../components/NoteCard";

const initialNotes = [
  { id: 1, title: "Team Sync – Feb 12", tag: "Work", updated: "2h ago" },
  { id: 2, title: "Thesis: Chapter 3", tag: "Study", updated: "Yesterday" },
  { id: 3, title: "Product ideas", tag: "Ideas", updated: "3 days ago" }
];

export default function Notes() {
  const [notes, setNotes] = useState(initialNotes);
  const [query, setQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", body: "" });

  const filteredNotes = useMemo(() => {
    return notes.filter((n) =>
      n.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, notes]);

  const createNote = () => {
    const item = {
      id: Date.now(),
      title: newNote.title || "Untitled",
      tag: "Ideas",
      updated: "Just now"
    };
    setNotes([item, ...notes]);
    setNewNote({ title: "", body: "" });
    setEditorOpen(false);
  };

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+110px)] relative animate-fadeIn">

      {/* Page Header */}
      <header>
        <h1 className="text-2xl font-semibold text-white">My Notes</h1>
        <p className="text-gray-400 text-sm">Organized. Searchable.</p>
      </header>

      {/* Search */}
      <GlassCard className="p-4">
        <input
          type="text"
          placeholder="Search notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#101016] border border-[#26262c] rounded-xl px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-indigo-500"
        />
      </GlassCard>

      {/* Notes list */}
      <div className="grid gap-3">
        {filteredNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onMenu={() => setActiveMenuId(note.id)}
            onOpen={() => alert("View note soon")}
          />
        ))}
      </div>

      {/* Action sheet menu */}
      {activeMenuId && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[90]"
            onClick={() => setActiveMenuId(null)}
          />

          <div
            className="absolute right-5 bottom-[140px] z-[200]
            bg-[#1b1b22] p-2 rounded-2xl border border-[#2d2d32]
            shadow-[0_6px_24px_rgba(0,0,0,0.45)]
            flex flex-col animate-ns-slideDown gap-1"
          >
            <button className="menu-icon-btn">
              <FiEdit2 /> Edit
            </button>
            <button className="menu-icon-btn">
              <FiStar className="text-indigo-300" /> Favorite
            </button>
            <button className="menu-icon-btn text-rose-400">
              <FiTrash2 /> Delete
            </button>
            <button className="menu-cancel" onClick={() => setActiveMenuId(null)}>
              Cancel
            </button>
          </div>
        </>
      )}

      {/* Expandable FAB options */}
      {showAddMenu && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+var(--mobile-nav-height)+82px)] right-5 flex flex-col gap-3 z-[150]">
          <button
            className="action-btn"
            onClick={() => {
              setEditorOpen(true);
              setShowAddMenu(false);
            }}
          >
            <FiEdit2 /> New
          </button>

          <button className="action-btn" onClick={() => alert("Scan coming soon")}>
            <FiCamera /> Scan
          </button>

          <button className="action-btn" onClick={() => alert("Upload coming soon")}>
            <FiUpload /> Upload
          </button>
        </div>
      )}

      {/* Main floating action button */}
      <button
        className="fab-btn"
        onClick={() => setShowAddMenu(!showAddMenu)}
      >
        <FiPlus size={30} strokeWidth={3} />
      </button>

      {/* Editor modal */}
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
    </div>
  );
}
