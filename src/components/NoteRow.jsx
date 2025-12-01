// src/components/NoteRow.jsx
import { useRef, useState } from "react";
import {
  FiArchive,
  FiTrash2,
  FiClipboard,
  FiBookOpen,
  FiZap,
  FiFileText,
} from "react-icons/fi";

export default function NoteRow({ note, onArchive, onDelete, onOpen, onLongPress }) {
  const [translateX, setTranslateX] = useState(0);
  const [swipedOpen, setSwipedOpen] = useState(false);
  const startXRef = useRef(null);
  const longPressTimer = useRef(null);

  const tagIcon = {
    Work: <FiClipboard className="text-accent-indigo" />,
    Study: <FiBookOpen className="text-accent-indigo" />,
    Ideas: <FiZap className="text-accent-indigo" />,
  }[note.tag] || <FiFileText className="text-accent-indigo" />;

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    longPressTimer.current = setTimeout(() => onLongPress(note), 500);
  };

  const handleTouchMove = (e) => {
    if (startXRef.current == null) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startXRef.current;

    if (Math.abs(deltaX) > 6 && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (deltaX < 0) {
      setTranslateX(Math.max(deltaX, -96));
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (translateX <= -50) {
      setTranslateX(-96);
      setSwipedOpen(true);
    } else {
      setTranslateX(0);
      setSwipedOpen(false);
    }
    startXRef.current = null;
  };

  return (
    <div className="relative overflow-visible">
      {/* Swipe Actions */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-[2px] pr-2">
        <button
          className="w-10 h-10 bg-[#1e2233] text-accent-indigo border border-indigo-500/40 rounded-lg active:scale-95 transition"
          onClick={(e) => {
            e.stopPropagation();
            onArchive(note);
          }}
        >
          <FiArchive size={18} />
        </button>

        <button
          className="w-10 h-10 bg-[#331d21] text-rose-300 border border-rose-500/40 rounded-lg active:scale-95 transition"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note);
          }}
        >
          <FiTrash2 size={18} />
        </button>
      </div>

      {/* Row Content */}
      <button
        className="w-full px-4 py-3 text-left flex items-center gap-3 bg-theme-input border border-theme-secondary0 rounded-xl hover:bg-theme-elevated hover:border-indigo-500/40 transition active:scale-[0.99]"
        style={{ transform: `translateX(${translateX}px)` }}
        onClick={() => onOpen(note)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Icon column – matching Dashboard */}
        <div className="h-10 w-10 rounded-xl bg-[var(--bg-secondary)]/10 flex items-center justify-center">
          {tagIcon}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <span className="text-[var(--text-secondary)] text-[14px] font-medium block truncate">{note.title}</span>
          <span className="text-[11px] text-theme-muted block truncate">Last updated {note.updated}</span>
        </div>
      </button>
    </div>
  );
}
