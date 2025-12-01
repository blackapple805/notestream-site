// src/components/NoteCard.jsx
import { FiHeart, FiLock, FiFileText, FiImage } from "react-icons/fi";

// Localized Relative Time Formatting
const formatRelative = (date) => {
  if (!date) return "";

  const diffMs = Date.now() - new Date(date);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isFR = navigator.language?.startsWith("fr");

  if (diffMins < 1) return isFR ? "À l’instant" : "Just now";
  if (diffHrs < 1)
    return isFR ? `${diffMins} min` : `${diffMins}m ago`;
  if (diffDays < 1)
    return isFR ? `${diffHrs} h` : `${diffHrs}h ago`;

  if (diffDays < 7)
    return isFR
      ? `il y a ${diffDays} j`
      : `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return new Date(date).toLocaleDateString(
    navigator.language || "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
};

export default function NoteCard({ note, onMenu, onOpen }) {
  const isPDF = note.fileType === "pdf";
  const isLockedPhoto = note.locked && note.imageUrl && !isPDF;

  return (
    <div
      className="
        bg-theme-card border border-theme-secondary transition-colors
        rounded-2xl p-4 flex flex-col
        justify-between
        min-h-[220px]
        active:scale-[0.98] transition cursor-pointer
        backdrop-blur-sm hover:bg-theme-elevated hover:border-indigo-500/40
      "
      onClick={onOpen}
    >
      {/* Title + Icons */}
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-[15px] font-semibold text-theme-primary leading-snug line-clamp-2 w-[82%]">
          {note.title}
        </h3>

        <div className="flex items-center gap-2">
          {note.locked && <FiLock size={14} className="text-yellow-300" />}
          {note.favorite && (
            <FiHeart size={14} className="text-rose-400 fav-animate" />
          )}

          <button
            className="text-theme-muted hover:text-theme-primary px-1"
            onClick={(e) => {
              e.stopPropagation();
              onMenu(e);
            }}
          >
            …
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div
        className="
          relative w-full aspect-[5/3]
          rounded-lg border border-[var(--border-secondary)]/20
          border-[var(--border-secondary)]
          flex items-center justify-center
          mt-2 overflow-hidden
        "
      >
        {/* ----------- PDF NOTES ----------- */}
        {isPDF && (
          <FiFileText
            size={32}
            className="text-indigo-400 opacity-90"
          />
        )}

        {/* ----------- LOCKED PHOTO NOTES ----------- */}
        {isLockedPhoto && (
          <FiImage
            size={32}
            className="text-green-400 opacity-85"
          />
        )}

        {/* ----------- IMAGE NOTES (UNLOCKED) ----------- */}
        {!isPDF && note.imageUrl && !note.locked && (
          <img
            src={note.imageUrl}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* ----------- TEXT NOTES ----------- */}
        {!note.imageUrl && !isPDF && (
          <FiFileText
            size={32}
            className="text-theme-tertiary"
          />
        )}
      </div>

      {/* Footer Meta */}
      <div className="flex justify-between items-center mt-3">
        <p className="text-[11px] text-theme-tertiary">
          {note.tag} • {formatRelative(note.updated)}
        </p>

        <span className="text-[10px] px-2 py-[1px] rounded-md bg-indigo-500/20 text-accent-indigo">
          {isPDF ? "PDF" : note.imageUrl ? "Photo" : "Text"}
        </span>
      </div>
    </div>
  );
}
