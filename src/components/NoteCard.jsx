// src/components/NoteCard.jsx
import { FiHeart, FiLock, FiFileText, FiImage, FiMoreVertical, FiMic } from "react-icons/fi";
import { Note, FilePdf, Image, Microphone } from "phosphor-react";

// Localized Relative Time Formatting
const formatRelative = (date) => {
  if (!date) return "";

  const diffMs = Date.now() - new Date(date);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isFR = navigator.language?.startsWith("fr");

  if (diffMins < 1) return isFR ? "À l'instant" : "Just now";
  if (diffHrs < 1) return isFR ? `${diffMins} min` : `${diffMins}m ago`;
  if (diffDays < 1) return isFR ? `${diffHrs} h` : `${diffHrs}h ago`;
  if (diffDays < 7) return isFR ? `il y a ${diffDays} j` : `${diffDays}d ago`;

  return new Date(date).toLocaleDateString(navigator.language || "en-US", {
    month: "short",
    day: "numeric",
  });
};

// Get icon and color based on note type
const getNoteTypeConfig = (note) => {
  if (note.fileType === "pdf") {
    return { 
      icon: FilePdf, 
      label: "PDF", 
      color: "text-rose-400",
      bg: "rgba(244, 63, 94, 0.15)",
      border: "rgba(244, 63, 94, 0.25)"
    };
  }
  if (note.tag === "Voice" || note.audioUrl) {
    return { 
      icon: Microphone, 
      label: "Voice", 
      color: "text-purple-400",
      bg: "rgba(168, 85, 247, 0.15)",
      border: "rgba(168, 85, 247, 0.25)"
    };
  }
  if (note.imageUrl) {
    return { 
      icon: Image, 
      label: "Photo", 
      color: "text-emerald-400",
      bg: "rgba(16, 185, 129, 0.15)",
      border: "rgba(16, 185, 129, 0.25)"
    };
  }
  return { 
    icon: Note, 
    label: "Text", 
    color: "text-indigo-400",
    bg: "rgba(99, 102, 241, 0.15)",
    border: "rgba(99, 102, 241, 0.25)"
  };
};

export default function NoteCard({ note, onMenu, onOpen }) {
  const isPDF = note.fileType === "pdf";
  const isLockedPhoto = note.locked && note.imageUrl && !isPDF;
  const typeConfig = getNoteTypeConfig(note);
  const IconComponent = typeConfig.icon;

  return (
    <div
      className="group liquid-glass-card-sm p-2.5 sm:p-3 flex flex-col cursor-pointer active:scale-[0.98]"
      onClick={onOpen}
    >
      {/* Inner glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "var(--card-glass-inner-glow)",
          borderRadius: "inherit",
          opacity: 0.7,
        }}
      />
      
      {/* Specular highlight */}
      <div
        className="absolute inset-x-4 top-0 h-[1px] pointer-events-none"
        style={{ background: "var(--card-glass-specular)" }}
      />

      {/* Content wrapper - needs relative z-10 to sit above overlays */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Title Row + Menu */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 
            className="text-sm font-semibold leading-snug line-clamp-2 flex-1 overflow-hidden"
            style={{ 
              color: 'var(--text-primary)',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            }}
            title={note.title}
          >
            {note.title || "Untitled"}
          </h3>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {note.locked && (
              <FiLock size={12} style={{ color: 'var(--accent-amber)' }} />
            )}
            {note.favorite && (
              <FiHeart 
                size={12} 
                style={{ color: 'var(--accent-rose)', fill: 'var(--accent-rose)' }} 
              />
            )}
            <button
              type="button"
              className="
                p-1 rounded-md transition
                opacity-100
                sm:opacity-0 sm:group-hover:opacity-100
                focus:opacity-100 focus-visible:opacity-100
              "
              style={{ color: "var(--text-muted)" }}
              onClick={(e) => {
                e.stopPropagation();
                onMenu(e);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
              aria-label="Open note actions"
              title="Actions"
            >
              <FiMoreVertical size={14} />
            </button>
          </div>
        </div>

        {/* Preview Area - Compact */}
        <div
          className="relative w-full h-24 sm:h-28 md:h-32 rounded-lg flex items-center justify-center overflow-hidden mb-2"
          style={{
            backgroundColor: typeConfig.bg,
            border: `1px solid ${typeConfig.border}`,
          }}
        >
          {/* PDF Notes */}
          {isPDF && (
            <IconComponent size={28} weight="duotone" className={typeConfig.color} />
          )}

          {/* Locked Photo Notes */}
          {isLockedPhoto && (
            <div className="flex flex-col items-center gap-1">
              <FiLock size={20} style={{ color: 'var(--accent-amber)' }} />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Locked</span>
            </div>
          )}

          {/* Image Notes (Unlocked) */}
          {!isPDF && note.imageUrl && !note.locked && (
            <img
              src={note.imageUrl}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Voice Notes */}
          {note.tag === "Voice" && !note.imageUrl && !isPDF && (
            <IconComponent size={28} weight="duotone" className={typeConfig.color} />
          )}

          {/* Text Notes */}
          {!note.imageUrl && !isPDF && note.tag !== "Voice" && (
            <IconComponent size={28} weight="duotone" className={typeConfig.color} />
          )}
        </div>

        {/* Footer Meta - Compact */}
        <div className="flex justify-between items-center">
          <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
            {note.tag} • {formatRelative(note.updated)}
          </p>

          <span 
            className="text-[9px] font-medium px-1.5 py-0.5 rounded-md flex-shrink-0"
            style={{
              backgroundColor: typeConfig.bg,
              color: typeConfig.color.replace('text-', '').includes('indigo') 
                ? 'var(--accent-indigo)' 
                : typeConfig.color.replace('text-', '').includes('rose')
                ? 'var(--accent-rose)'
                : typeConfig.color.replace('text-', '').includes('emerald')
                ? 'var(--accent-emerald)'
                : 'var(--accent-purple)',
              border: `1px solid ${typeConfig.border}`,
            }}
          >
            {typeConfig.label}
          </span>
        </div>
      </div>
    </div>
  );
}