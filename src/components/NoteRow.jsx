// src/components/NoteRow.jsx
import { useRef, useState, useMemo, useEffect } from "react";
import {
  FiArchive,
  FiTrash2,
  FiClipboard,
  FiBookOpen,
  FiZap,
  FiFileText,
  FiHeart,
  FiLock,
  FiImage,
  FiMic,
  FiMoreVertical,
} from "react-icons/fi";

/* -------------------- Utils -------------------- */

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

const getNoteType = (note) => {
  if (note.fileType === "pdf")
    return { label: "PDF", icon: FiFileText, tone: "rose" };
  if (note.tag === "Voice" || note.audioUrl)
    return { label: "Voice", icon: FiMic, tone: "purple" };
  if (note.imageUrl)
    return { label: "Photo", icon: FiImage, tone: "emerald" };
  return { label: "Text", icon: FiFileText, tone: "indigo" };
};

const getTagIcon = (tag) => {
  if (tag === "Work") return FiClipboard;
  if (tag === "Study") return FiBookOpen;
  if (tag === "Ideas") return FiZap;
  return FiFileText;
};

// Truncate long titles intelligently
const truncateTitle = (title, maxLength = 50) => {
  if (!title) return "Untitled";
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength) + "…";
};

/* -------------------- Icons -------------------- */

function IconGlyph({ icon: Icon, ariaLabel, tone = "neutral", filled = false }) {
  const colors = {
    neutral: "var(--text-muted)",
    indigo: "var(--accent-indigo)",
    amber: "var(--accent-amber)",
    rose: "var(--accent-rose)",
    emerald: "var(--accent-emerald)",
    purple: "var(--accent-purple)",
  };
  const color = colors[tone] || colors.neutral;

  return (
    <span
      className="inline-flex items-center justify-center shrink-0"
      style={{ color, fontSize: "var(--icon-size)" }}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {Icon ? (
        <Icon size="1em" style={filled ? { fill: color } : undefined} />
      ) : null}
    </span>
  );
}

function IconRail({ note, type, TagIconComp }) {
  return (
    <div
      className="flex items-center gap-[var(--icon-gap)]"
      aria-label="Note metadata"
      title="Note metadata"
    >
      <IconGlyph icon={type.icon} ariaLabel={type.label} tone={type.tone} />
      {note.locked && (
        <IconGlyph icon={FiLock} ariaLabel="Locked" tone="amber" />
      )}
      {note.favorite && (
        <IconGlyph
          icon={FiHeart}
          ariaLabel="Favorite"
          tone="rose"
          filled
        />
      )}
    </div>
  );
}

/* -------------------- Component -------------------- */

export default function NoteRow({
  note,
  onArchive,
  onDelete,
  onOpen,
  onLongPress,
  onMenu,
}) {
  const [translateX, setTranslateX] = useState(0);
  const [actionW, setActionW] = useState(0);

  const startXRef = useRef(null);
  const longPressTimer = useRef(null);
  const actionTrayRef = useRef(null);

  const type = useMemo(() => getNoteType(note), [note]);
  const TagIconComp = useMemo(() => getTagIcon(note.tag), [note.tag]);

  // Measure swipe-action tray width
  useEffect(() => {
    if (!actionTrayRef.current) return;

    const el = actionTrayRef.current;
    const measure = () => {
      const w = el.getBoundingClientRect().width || 0;
      setActionW(w);
      setTranslateX((prev) => (prev < 0 ? Math.max(prev, -w) : prev));
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const clampLeft = (x) => {
    const maxLeft = actionW > 0 ? -actionW : 0;
    return Math.max(x, maxLeft);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    startXRef.current = touch.clientX;

    if (typeof onLongPress === "function") {
      longPressTimer.current = setTimeout(() => onLongPress(note), 500);
    }
  };

  const handleTouchMove = (e) => {
    if (startXRef.current == null) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startXRef.current;

    if (Math.abs(deltaX) > 6 && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (deltaX < 0) setTranslateX(clampLeft(deltaX));
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const snapPoint = actionW * 0.5;
    setTranslateX((prev) => (Math.abs(prev) >= snapPoint ? -actionW : 0));
    startXRef.current = null;
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        ["--icon-size"]: "clamp(13px, 3.2vw, 14px)",
        ["--icon-gap"]: "clamp(8px, 2vw, 12px)",
      }}
    >
      {/* Swipe actions behind the row - only visible when swiping */}
      <div
        ref={actionTrayRef}
        className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2 transition-opacity duration-150"
        style={{
          opacity: translateX < 0 ? 1 : 0,
          pointerEvents: translateX < 0 ? "auto" : "none",
        }}
        aria-hidden={translateX >= 0}
      >
        <button
          type="button"
          className="aspect-square h-10 rounded-lg active:scale-95 transition border flex items-center justify-center"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "rgba(99, 102, 241, 0.25)",
            color: "var(--accent-indigo)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onArchive?.(note);
          }}
          aria-label="Archive"
          title="Archive"
        >
          <FiArchive size={18} />
        </button>

        <button
          type="button"
          className="aspect-square h-10 rounded-lg active:scale-95 transition border flex items-center justify-center"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "rgba(244, 63, 94, 0.25)",
            color: "var(--accent-rose)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(note);
          }}
          aria-label="Delete"
          title="Delete"
        >
          <FiTrash2 size={18} />
        </button>
      </div>

      {/* Foreground row - Use div instead of button to allow nested menu button */}
      <div
        role="button"
        tabIndex={0}
        className="w-full px-3 sm:px-4 py-3 text-left flex items-center gap-3 rounded-xl transition-all duration-200 active:scale-[0.99] min-w-0 relative overflow-hidden cursor-pointer"
        style={{
          transform: `translateX(${translateX}px)`,
          background: "var(--card-glass-bg, var(--bg-surface))",
          border: "1px solid var(--card-glass-border, var(--border-secondary))",
          boxShadow: "var(--card-glass-shadow, none)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
        onClick={() => onOpen?.(note)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen?.(note);
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--card-glass-bg-hover, var(--bg-hover))";
          e.currentTarget.style.borderColor = "var(--card-glass-border-hover, rgba(99, 102, 241, 0.3))";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--card-glass-bg, var(--bg-surface))";
          e.currentTarget.style.borderColor = "var(--card-glass-border, var(--border-secondary))";
        }}
      >
        {/* Inner glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: "var(--card-glass-inner-glow, radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 60%))",
            opacity: 0.5,
          }}
        />

        {/* Content wrapper */}
        <div className="relative z-10 flex items-center gap-3 w-full min-w-0">
          {/* Left icon */}
          <div
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: "rgba(99, 102, 241, 0.10)",
              border: "1px solid rgba(99, 102, 241, 0.18)",
            }}
          >
            <TagIconComp size={16} style={{ color: "var(--accent-indigo)" }} />
          </div>

          {/* Main text - with proper truncation */}
          <div className="min-w-0 flex-1 overflow-hidden">
            <span
              className="text-[14px] font-semibold block truncate"
              style={{ color: "var(--text-primary)" }}
              title={note.title}
            >
              {truncateTitle(note.title, 45)}
            </span>

            <span
              className="text-[11px] block mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {formatRelative(note.updated)}
            </span>
          </div>

          {/* Right rail: icons + menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <IconRail note={note} type={type} TagIconComp={TagIconComp} />

            <button
              type="button"
              className="p-1.5 rounded-lg transition shrink-0"
              style={{ color: "var(--text-muted)" }}
              onClick={(e) => {
                e.stopPropagation();
                onMenu?.(e);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              aria-label="Open note actions"
              title="Actions"
            >
              <FiMoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}