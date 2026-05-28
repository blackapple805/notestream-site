// src/pages/Notes.jsx
// ═══════════════════════════════════════════════════════════════════
// EDITORIAL — Notes index / front page
// ─────────────────────────────────────────────────────────────────
// Layout:
//   · Masthead hero (huge italic serif rule line + double-rule
//     dateline with VOL/NO/date/entries/last-written)
//   · Sticky filter bar (chips + sort + view toggle + CTA)
//   · Grid (3/2/2/1 col) or List view of notes
//   · Pinned first, with ★ ornament
//
// Responsive:
//   · ≥1200  3 col grid
//   · 900–1199  2 col
//   · 640–899   2 col (tighter)
//   · <640      1 col
//
// REPLACE the stub data sources (NOTES_STUB) and the navigate("…/:id")
// behaviour with your real query / router wiring. Everything else is
// pure presentation and respects --ns-layout-sidebar-w from Sidebar.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEditorial, ED } from "../lib/editorial";
import {
  FiPlus, FiGrid, FiList, FiChevronDown, FiStar, FiArrowRight,
  FiEdit3, FiMic, FiFileText, FiArchive,
} from "react-icons/fi";
import QuickCreateModal from "../components/QuickCreateModal";
import { supabaseReady } from "../lib/supabaseClient";

/* ─── STUB DATA — replace with real query ───
   Each note: { id, title, preview, type, words, updatedAt, tags, pinned, status }
   type: "note" | "voice" | "doc"
   status: "draft" | "published"  */
const NOTES_STUB = [
  { id: "n42", title: "On the discipline of writing a single sentence each morning",
    preview: "There is a peculiar virtue in promising yourself only one sentence — the bargain is small enough to keep, and one sentence almost always becomes more.",
    type: "note", words: 487, updatedAt: "12 MIN AGO", tags: ["craft", "habits"], pinned: true,  status: "draft" },
  { id: "n41", title: "Field notes from the Q2 strategy offsite",
    preview: "Three themes emerged across the two days — distribution as the bottleneck, the cost of context-switching, and what it means to ship slower on purpose.",
    type: "note", words: 1240, updatedAt: "2 H AGO",   tags: ["work", "strategy"], pinned: true,  status: "published" },
  { id: "n40", title: "Voice memo — walking thoughts on attention",
    preview: "The argument I keep returning to is that attention is a kind of currency we spend without ever auditing the receipts.",
    type: "voice", words: 612, updatedAt: "YESTERDAY", tags: ["essays"], pinned: false, status: "draft" },
  { id: "n39", title: "Things I want to remember about the trip to Lisbon",
    preview: "The light at six in the evening, the tile floors in the hostel kitchen, the man at the café who refused to let us pay.",
    type: "note", words: 980, updatedAt: "MAY 22",      tags: ["travel"], pinned: false, status: "published" },
  { id: "n38", title: "Reading log — May",
    preview: "Started Calvino's Six Memos and have been chewing on the chapter on lightness for three days running.",
    type: "note", words: 320, updatedAt: "MAY 20",      tags: ["reading"], pinned: false, status: "draft" },
  { id: "n37", title: "Onboarding doc — design system handover",
    preview: "Everything a new designer needs in the first week, plus the things we wish someone had told us when we joined.",
    type: "doc",  words: 2150, updatedAt: "MAY 18",     tags: ["work", "docs"], pinned: false, status: "published" },
];

const FILTERS = [
  { id: "all",       label: "All" },
  { id: "drafts",    label: "Drafts" },
  { id: "published", label: "Published" },
  { id: "voice",     label: "Voice" },
  { id: "pinned",    label: "Pinned" },
  { id: "archive",   label: "Archive" },
];

const SORTS = [
  { id: "newest",  label: "Latest → Oldest" },
  { id: "oldest",  label: "Oldest → Latest" },
  { id: "az",      label: "Title A → Z" },
  { id: "words",   label: "Longest first" },
];

const TYPE_ICON = { note: FiEdit3, voice: FiMic, doc: FiFileText };
const TYPE_LABEL = { note: "NOTE", voice: "VOICE", doc: "DOC" };

export default function Notes({ notes, setNotes } = {}) {
  useEditorial();
  const navigate = useNavigate();
  const location = useLocation();

  const [filter, setFilter]     = useState("all");
  const [sort, setSort]         = useState("newest");
  const [view, setView]         = useState("grid"); // "grid" | "list"
  const [showSort, setShowSort] = useState(false);
  const [loading, setLoading]   = useState(false);

  /* Quick-create modal — opened by every "new note" button across the
     app. Type is one of "note" | "voice" | "upload" (voice/upload
     redirect to their own pages from inside the modal). */
  const [qcOpen, setQcOpen]   = useState(false);
  const [qcType, setQcType]   = useState("note");

  /* ✅ Real notes from useNotes() come in as the `notes` prop. The
     NOTES_STUB demo data is ONLY used when Supabase isn't configured
     (e.g. a developer running the site without env vars). With Supabase
     active, an empty array is the truth — show the empty state instead
     of "demo notes" that would confuse the user about what's real.
     Previously the stubs replaced the user's actual data every time
     this page mounted before the async load finished. */
  const sourceNotes = supabaseReady
    ? (Array.isArray(notes) ? notes : [])
    : ((Array.isArray(notes) && notes.length > 0) ? notes : NOTES_STUB);

  /* Filter + sort */
  const filtered = useMemo(() => {
    let out = sourceNotes;
    if (filter === "drafts")    out = out.filter(n => n.status === "draft");
    if (filter === "published") out = out.filter(n => n.status === "published");
    if (filter === "voice")     out = out.filter(n => n.type === "voice");
    if (filter === "pinned")    out = out.filter(n => n.pinned);
    // archive — stub: empty
    if (filter === "archive")   out = [];

    // Pinned first (unless filter is pinned/archive)
    if (filter !== "pinned" && filter !== "archive") {
      out = [...out].sort((a, b) => Number(b.pinned) - Number(a.pinned));
    }
    return out;
  }, [filter, sourceNotes]);

  /* Dateline numbers */
  const today = new Date();
  const day  = today.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase();
  const mo   = today.toLocaleDateString(undefined, { month: "long"   }).toUpperCase();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff  = (today - start) + ((start.getTimezoneOffset() - today.getTimezoneOffset()) * 60000);
  const week  = Math.ceil(Math.floor(diff / 86400000) / 7);
  const dateLine = `VOL. II · NO. ${String(week).padStart(2,"0")} · ${day}, ${mo} ${today.getDate()}, ${today.getFullYear()} · ${sourceNotes.length} ENTRIES · LAST WRITTEN 12 MIN AGO`;

  /* Open the modal directly for inline "+ New entry" / empty-state
     clicks — no navigate-and-back roundtrip. */
  const goNew = () => { setQcType("note"); setQcOpen(true); };

  /* Listen for navigation state requesting a quick-create. This is what
     the Sidebar's quick-create menu, the Dashboard's "Begin a new note"
     CTA, and the Sidebar's big-black "Begin a new note →" CTA all push.
     Before this hook existed, that state was sent but never read, so
     none of those buttons ever surfaced a creator. */
  useEffect(() => {
    const qc = location.state?.quickCreate;
    if (!qc) return;
    setQcType(qc);
    setQcOpen(true);
    // Clear the state so a refresh / back-nav doesn't re-open the modal.
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  /* Persist a new note to the parent's in-memory list if it owns one. */
  const handleCreate = (newNote) => {
    if (typeof setNotes === "function") {
      setNotes((prev) => [newNote, ...(Array.isArray(prev) ? prev : [])]);
    }
  };

  return (
    <div className="ns-ed ns-notes">
      <NotesScopedStyles />

      {/* ═══ MASTHEAD HERO ═══ */}
      <header className="nx-hero">
        <p className="ed-mono nx-kicker">
          <span className="nx-kicker-orn">§</span> THE DESK · NOTES
        </p>
        <h1 className="nx-headline">
          The desk, <em>today.</em>
        </h1>
        <hr className="nx-rule-thick" />
        <hr className="nx-rule-thin" />
        <p className="ed-mono nx-dateline">{dateLine}</p>
      </header>

      {/* ═══ STICKY FILTER BAR ═══ */}
      <div className="nx-bar-wrap">
        <p className="ed-mono nx-bar-h">§ FILTER &amp; SORT</p>
        <div className="nx-bar">
          <div className="nx-chips" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`nx-chip ${filter === f.id ? "is-on" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="nx-bar-right">
            <div className="nx-sort-anchor">
              <button
                type="button"
                onClick={() => setShowSort(v => !v)}
                className="nx-sort-btn"
                aria-expanded={showSort}
              >
                <span className="ed-mono">SORT</span>
                <span className="nx-sort-cur">{SORTS.find(s => s.id === sort)?.label}</span>
                <FiChevronDown size={12} />
              </button>
              <AnimatePresence>
                {showSort && (
                  <>
                    <div className="nx-sort-scrim" onClick={() => setShowSort(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="ed-card nx-sort-menu"
                    >
                      {SORTS.map((s) => (
                        <button
                          key={s.id} type="button"
                          className={`nx-sort-row ${sort === s.id ? "is-on" : ""}`}
                          onClick={() => { setSort(s.id); setShowSort(false); }}
                        >
                          <span className="lb">{s.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="nx-view">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`nx-view-btn ${view === "grid" ? "is-on" : ""}`}
                aria-label="Grid view"
              >
                <FiGrid size={13} />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`nx-view-btn ${view === "list" ? "is-on" : ""}`}
                aria-label="List view"
              >
                <FiList size={13} />
              </button>
            </div>

            <button onClick={goNew} className="ed-btn ed-btn-primary nx-cta">
              <FiPlus size={12} />
              <span>New entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <main className="nx-main">
        {loading ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} onCreate={goNew} />
        ) : view === "grid" ? (
          <div className="nx-grid">
            {filtered.map((n, i) => (
              <NoteCard key={n.id} note={n} ord={i + 1} onOpen={() => navigate(`/dashboard/notes/${n.id}`)} />
            ))}
          </div>
        ) : (
          <ul className="nx-list">
            {filtered.map((n, i) => (
              <NoteListRow key={n.id} note={n} ord={i + 1} onOpen={() => navigate(`/dashboard/notes/${n.id}`)} />
            ))}
          </ul>
        )}
      </main>

      {/* The popup the "+ New entry", "Begin a new note", and Sidebar
          quick-create buttons all open. Lives outside .nx-main so it
          can't be clipped by the grid. */}
      <QuickCreateModal
        open={qcOpen}
        type={qcType}
        onClose={() => setQcOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   NoteCard (grid)
═══════════════════════════════════════════════════════ */
function NoteCard({ note, ord, onOpen }) {
  const Icon = TYPE_ICON[note.type] || FiEdit3;
  return (
    <button type="button" onClick={onOpen} className={`nx-card ${note.pinned ? "is-pinned" : ""}`}>
      <div className="nx-card-head">
        <span className="ed-mono nx-card-num">
          {note.pinned && <em className="nx-pin-orn">★</em>}
          № {String(ord).padStart(3, "0")} · <span className="nx-card-type">{TYPE_LABEL[note.type]}</span>
        </span>
        <Icon size={12} className="nx-card-typeic" />
      </div>
      <h3 className="nx-card-title">{note.title}</h3>
      <p className="nx-card-body">{note.preview}</p>
      <div className="nx-card-foot">
        <span className="ed-mono nx-card-meta">{note.updatedAt} · {note.words} W</span>
        <span className="nx-card-tags">
          {note.tags.slice(0, 2).map((t) => (
            <span key={t} className="ed-mono nx-tag">{t}</span>
          ))}
          {note.tags.length > 2 && <span className="ed-mono nx-tag">+{note.tags.length - 2}</span>}
        </span>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   NoteListRow (list view)
═══════════════════════════════════════════════════════ */
function NoteListRow({ note, ord, onOpen }) {
  return (
    <li>
      <button type="button" onClick={onOpen} className={`nx-row ${note.pinned ? "is-pinned" : ""}`}>
        <span className="ed-mono nx-row-ord">
          {note.pinned ? <em className="nx-pin-orn">★</em> : null}
          № {String(ord).padStart(3, "0")}
        </span>
        <span className="nx-row-title">{note.title}</span>
        <span className="nx-row-preview">{note.preview}</span>
        <span className="ed-mono nx-row-meta">{note.updatedAt}</span>
        <span className="nx-row-tags">
          {note.tags.slice(0, 2).map((t) => (
            <span key={t} className="ed-mono nx-tag">{t}</span>
          ))}
        </span>
        <FiArrowRight size={12} className="nx-row-arr" />
      </button>
    </li>
  );
}

/* ═══════════════════════════════════════════════════════
   Skeleton + Empty
═══════════════════════════════════════════════════════ */
function SkeletonGrid() {
  return (
    <>
      <p className="ed-mono nx-skel-caption">TYPESETTING…</p>
      <div className="nx-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="nx-card nx-card--skel">
            <div className="skel-line w-1of3" />
            <div className="skel-line w-full big" />
            <div className="skel-line w-full" />
            <div className="skel-line w-4of5" />
            <div className="skel-line w-2of5" />
          </div>
        ))}
      </div>
    </>
  );
}

function EmptyState({ filter, onCreate }) {
  const msg = {
    all:       "Nothing yet.",
    drafts:    "No drafts.",
    published: "Nothing published yet.",
    voice:     "No voice memos.",
    pinned:    "No pinned entries.",
    archive:   "The archive is empty.",
  }[filter] || "Nothing here.";
  return (
    <div className="nx-empty">
      <p className="nx-empty-title">
        <em>{msg}</em>
        <br />
        <span>The page is blank.</span>
      </p>
      <button onClick={onCreate} className="ed-btn ed-btn-primary nx-empty-cta">
        <FiPlus size={12} /> <span>Begin a new entry</span>
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Scoped CSS
═══════════════════════════════════════════════════════ */
const NotesScopedStyles = () => (
  <style>{`
    .ns-ed.ns-notes {
      /* DashboardLayout already offsets for the sidebar and applies
         a max-width wrapper, so this just needs to fill the parent. */
      width: 100%;
      min-height: 100dvh;
    }

    /* ── Hero ── */
    .ns-ed .nx-hero {
      padding: clamp(20px, 4vw, 40px) 0 0;
    }
    .ns-ed .nx-kicker {
      font-size: 11px; letter-spacing: 0.18em; color: ${ED.inkFaint};
      margin: 0 0 18px;
    }
    .ns-ed .nx-kicker-orn {
      font-family: ${ED.serif}; font-style: italic; color: ${ED.accent};
      font-size: 14px; margin-right: 6px;
    }
    .ns-ed .nx-headline {
      font-family: ${ED.serif}; font-weight: 400;
      font-size: clamp(36px, 5.5vw, 64px); line-height: 1.05;
      letter-spacing: -0.02em; color: ${ED.ink};
      margin: 0 0 24px;
    }
    .ns-ed .nx-headline em {
      font-style: italic; color: ${ED.accent};
    }
    .ns-ed .nx-rule-thick {
      border: 0; height: 1px; background: ${ED.ink}; margin: 0;
    }
    .ns-ed .nx-rule-thin {
      border: 0; height: 1px; background: ${ED.rule}; margin: 4px 0 0;
    }
    .ns-ed .nx-dateline {
      font-size: 10.5px; letter-spacing: 0.16em; color: ${ED.inkFaint};
      margin: 14px 0 0;
    }
    @media (max-width: 760px) {
      .ns-ed .nx-dateline {
        white-space: normal; line-height: 1.6;
      }
    }

    /* ── Sticky filter bar ── */
    .ns-ed .nx-bar-wrap {
      position: sticky; top: var(--app-content-top, 64px);
      z-index: 50; background: ${ED.paper100};
      padding: 18px 0 14px;
      border-bottom: 1px solid ${ED.rule};
    }
    .ns-ed .nx-bar-h {
      font-size: 9.5px; letter-spacing: 0.18em; color: ${ED.inkFaint};
      margin: 0 0 10px;
    }
    .ns-ed .nx-bar {
      display: flex; align-items: center; gap: clamp(8px, 1.5vw, 16px);
      justify-content: space-between; flex-wrap: wrap;
    }
    .ns-ed .nx-chips {
      display: flex; gap: 6px; flex-wrap: wrap; min-width: 0;
    }
    .ns-ed .nx-chip {
      padding: 6px 14px; border-radius: 999px;
      border: 1px solid ${ED.rule}; background: ${ED.paper50};
      cursor: pointer; color: ${ED.inkSoft};
      font-family: ${ED.sans}; font-size: 12.5px;
      transition: all .15s ease;
    }
    .ns-ed .nx-chip:hover { border-color: ${ED.ink}; color: ${ED.ink}; }
    .ns-ed .nx-chip.is-on {
      background: ${ED.ink}; color: ${ED.paper50}; border-color: ${ED.ink};
    }

    .ns-ed .nx-bar-right {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0;
    }

    /* Sort dropdown */
    .ns-ed .nx-sort-anchor { position: relative; }
    .ns-ed .nx-sort-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 7px 12px; border-radius: 999px;
      border: 1px solid ${ED.rule}; background: transparent;
      cursor: pointer; color: ${ED.inkSoft};
    }
    .ns-ed .nx-sort-btn:hover { border-color: ${ED.ink}; color: ${ED.ink}; }
    .ns-ed .nx-sort-btn .ed-mono {
      font-size: 10px; letter-spacing: 0.16em; color: ${ED.inkFaint};
    }
    .ns-ed .nx-sort-cur {
      font-family: ${ED.serif}; font-size: 14px; color: ${ED.ink};
    }
    @media (max-width: 760px) {
      .ns-ed .nx-sort-btn .nx-sort-cur { display: none; }
    }
    .ns-ed .nx-sort-scrim { position: fixed; inset: 0; z-index: 80; }
    .ns-ed .nx-sort-menu {
      position: absolute; top: calc(100% + 6px); right: 0;
      z-index: 90; min-width: 220px; padding: 6px;
      background: ${ED.paper50};
    }
    .ns-ed .nx-sort-row {
      display: block; width: 100%; padding: 8px 12px;
      border: 0; background: transparent; border-radius: 4px;
      text-align: left; cursor: pointer;
      font-family: ${ED.serif}; font-size: 15px; color: ${ED.ink};
      transition: background-color .12s ease;
    }
    .ns-ed .nx-sort-row:hover { background: ${ED.paper150}; }
    .ns-ed .nx-sort-row.is-on { color: ${ED.accent}; font-style: italic; }

    /* View toggle */
    .ns-ed .nx-view {
      display: inline-flex; border: 1px solid ${ED.rule}; border-radius: 999px;
      overflow: hidden;
    }
    .ns-ed .nx-view-btn {
      width: 32px; height: 32px; display: inline-flex;
      align-items: center; justify-content: center;
      border: 0; background: transparent; color: ${ED.inkFaint};
      cursor: pointer;
    }
    .ns-ed .nx-view-btn:hover { color: ${ED.ink}; }
    .ns-ed .nx-view-btn.is-on { background: ${ED.ink}; color: ${ED.paper50}; }

    .ns-ed .nx-cta {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 14px; font-size: 13px; text-decoration: none;
    }
    @media (max-width: 540px) {
      .ns-ed .nx-cta span { display: none; }
      .ns-ed .nx-cta { width: 34px; height: 34px; padding: 0; justify-content: center; }
    }

    /* ── Main content ── */
    .ns-ed .nx-main {
      padding: clamp(20px, 3vw, 32px) 0 80px;
    }

    /* ── Grid ── */
    .ns-ed .nx-grid {
      display: grid; gap: clamp(14px, 1.6vw, 22px);
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    @media (max-width: 1199px) {
      .ns-ed .nx-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 639px) {
      .ns-ed .nx-grid { grid-template-columns: 1fr; }
    }

    .ns-ed .nx-card {
      position: relative;
      display: flex; flex-direction: column; gap: 12px;
      padding: 22px 22px 18px; text-align: left;
      background: ${ED.paper50}; border: 1px solid ${ED.rule};
      border-radius: 4px; cursor: pointer;
      /* Base = hover-out timing (slightly longer so release feels graceful) */
      transition:
        border-color     .24s cubic-bezier(.22,1,.36,1),
        transform        .26s cubic-bezier(.22,1,.36,1),
        box-shadow       .26s cubic-bezier(.22,1,.36,1),
        background-color .24s cubic-bezier(.22,1,.36,1);
      overflow: hidden;
      will-change: transform;
    }
    .ns-ed .nx-card::before {
      content: ""; position: absolute; left: 0; top: 0; bottom: 0;
      width: 2px; background: ${ED.accent};
      transform: scaleY(0); transform-origin: top center;
      transition: transform .24s cubic-bezier(.22,1,.36,1);
    }
    .ns-ed .nx-card:hover {
      border-color: ${ED.ink};
      transform: translateY(-2px);
      box-shadow: 0 12px 28px -18px rgba(19, 16, 8, 0.22);
      /* Hover-in timing — quicker so the response feels immediate */
      transition-duration: .18s;
    }
    .ns-ed .nx-card:hover::before {
      transform: scaleY(1);
      transition-duration: .18s;
    }
    .ns-ed .nx-card:hover .nx-card-title { font-style: italic; color: ${ED.accent}; }
    .ns-ed .nx-card:hover .nx-card-num { color: ${ED.inkSoft}; }

    .ns-ed .nx-card-head {
      display: flex; align-items: center; justify-content: space-between;
    }
    .ns-ed .nx-card-num {
      font-size: 10px; letter-spacing: 0.14em; color: ${ED.inkFaint};
    }
    .ns-ed .nx-card-type { color: ${ED.inkSoft}; }
    .ns-ed .nx-card-typeic { color: ${ED.inkFaint}; }
    .ns-ed .nx-pin-orn {
      font-family: ${ED.serif}; font-style: italic; color: ${ED.accent};
      font-size: 13px; margin-right: 6px; letter-spacing: 0;
    }

    .ns-ed .nx-card-title {
      font-family: ${ED.serif}; font-weight: 400;
      font-size: clamp(20px, 1.8vw, 26px); line-height: 1.2;
      color: ${ED.ink}; margin: 0;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      overflow: hidden;
      /* font-style is a discrete property and cannot tween — listing it
         in the transition only stalls the flip to the midpoint of the
         duration, which is what made the italic feel "blocky" before.
         We now transition the animatable properties only (color) and
         let the italic flip happen cleanly at the start of the hover.
         The eye reads the smooth color shift as the animation; the
         glyph swap rides invisibly on top. */
      transition: color .24s cubic-bezier(.22,1,.36,1);
    }
    .ns-ed .nx-card:hover .nx-card-title {
      /* Snappier on the way in (.18s) than on the way out (.24s above).
         Reactive engagement should feel quick; the release can settle. */
      transition-duration: .18s;
    }
    .ns-ed .nx-card-num {
      transition: color .24s cubic-bezier(.22,1,.36,1);
    }
    .ns-ed .nx-card:hover .nx-card-num {
      transition-duration: .18s;
    }
    .ns-ed .nx-card-body {
      font-family: ${ED.serif}; font-size: 14.5px; line-height: 1.55;
      color: ${ED.inkSoft}; margin: 0;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .ns-ed .nx-card-foot {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: auto; padding-top: 8px; border-top: 1px solid ${ED.rule};
      gap: 10px;
    }
    .ns-ed .nx-card-meta {
      font-size: 9.5px; letter-spacing: 0.14em; color: ${ED.inkFaint};
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ns-ed .nx-card-tags {
      display: inline-flex; gap: 4px; flex-shrink: 0;
    }
    .ns-ed .nx-tag {
      font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
      color: ${ED.inkFaint}; padding: 2px 6px;
      border: 1px solid ${ED.rule}; border-radius: 999px;
    }

    /* ── List view ── */
    .ns-ed .nx-list { list-style: none; padding: 0; margin: 0; }
    .ns-ed .nx-row {
      display: grid; gap: 16px; align-items: baseline;
      grid-template-columns: 60px minmax(180px, 260px) 1fr 100px auto 14px;
      padding: 16px 8px; width: 100%; text-align: left;
      background: transparent; border: 0;
      border-bottom: 1px solid ${ED.rule}; cursor: pointer;
      transition:
        background-color .24s cubic-bezier(.22,1,.36,1),
        padding-left     .24s cubic-bezier(.22,1,.36,1);
    }
    .ns-ed .nx-row:hover {
      background: ${ED.paper100};
      padding-left: 18px;
      transition-duration: .18s;
    }
    .ns-ed .nx-row-ord {
      font-family: ${ED.mono};
      font-size: 10px; letter-spacing: 0.14em; color: ${ED.inkFaint};
      /* font-family / font-style / font-size are all discrete or
         awkward to tween (size between mono 10px and serif 16px
         would visually pop). Only color and letter-spacing actually
         animate — they're enough to carry the perceived motion while
         the font swap rides invisibly within it. */
      transition:
        color          .24s cubic-bezier(.22,1,.36,1),
        letter-spacing .24s cubic-bezier(.22,1,.36,1);
    }
    .ns-ed .nx-row:hover .nx-row-ord {
      color: ${ED.accent};
      font-family: ${ED.serif};
      font-style: italic;
      font-size: 16px;
      letter-spacing: 0;
      transition-duration: .18s;
    }
    .ns-ed .nx-row-title {
      font-family: ${ED.serif}; font-size: 18px; color: ${ED.ink};
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      transition: color .24s cubic-bezier(.22,1,.36,1);
    }
    .ns-ed .nx-row:hover .nx-row-title {
      font-style: italic; color: ${ED.accent};
      transition-duration: .18s;
    }
    .ns-ed .nx-row-preview {
      font-family: ${ED.serif}; font-style: italic; font-size: 14.5px;
      color: ${ED.inkFaint};
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ns-ed .nx-row-meta {
      font-size: 10px; letter-spacing: 0.14em; color: ${ED.inkFaint};
      white-space: nowrap;
    }
    .ns-ed .nx-row-tags { display: inline-flex; gap: 4px; }
    .ns-ed .nx-row-arr {
      color: ${ED.inkFaint};
      transition:
        color     .24s cubic-bezier(.22,1,.36,1),
        transform .24s cubic-bezier(.22,1,.36,1);
    }
    .ns-ed .nx-row:hover .nx-row-arr {
      color: ${ED.accent};
      transform: translateX(3px);
      transition-duration: .18s;
    }
    @media (max-width: 900px) {
      .ns-ed .nx-row {
        grid-template-columns: 50px 1fr auto 14px;
      }
      .ns-ed .nx-row-preview, .ns-ed .nx-row-tags { display: none; }
    }
    @media (max-width: 540px) {
      .ns-ed .nx-row { grid-template-columns: 1fr auto; gap: 6px; }
      .ns-ed .nx-row-ord { display: none; }
      .ns-ed .nx-row-arr { display: none; }
    }

    /* Honor users who prefer reduced motion — keep color cues but drop
       the translations and scale animations that can trigger motion
       sickness. */
    @media (prefers-reduced-motion: reduce) {
      .ns-ed .nx-card,
      .ns-ed .nx-card::before,
      .ns-ed .nx-row,
      .ns-ed .nx-row-arr,
      .ns-ed .nx-row-ord {
        transition-duration: .01ms !important;
      }
      .ns-ed .nx-card:hover { transform: none; }
      .ns-ed .nx-row:hover { padding-left: 8px; }
      .ns-ed .nx-row:hover .nx-row-arr { transform: none; }
    }

    /* ── Empty state ── */
    .ns-ed .nx-empty {
      display: flex; flex-direction: column; align-items: center;
      padding: 80px 20px;
    }
    .ns-ed .nx-empty-title {
      font-family: ${ED.serif}; font-size: clamp(24px, 3vw, 34px);
      color: ${ED.ink}; text-align: center; line-height: 1.3;
      margin: 0 0 24px;
    }
    .ns-ed .nx-empty-title em { color: ${ED.accent}; }
    .ns-ed .nx-empty-title span {
      font-style: italic; color: ${ED.inkFaint}; font-size: 0.7em;
    }
    .ns-ed .nx-empty-cta {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 20px; text-decoration: none;
    }

    /* ── Skeletons ── */
    .ns-ed .nx-skel-caption {
      font-size: 9.5px; letter-spacing: 0.2em; color: ${ED.inkFaint};
      margin: 0 0 14px;
    }
    .ns-ed .nx-card--skel {
      gap: 10px; cursor: default; pointer-events: none;
    }
    .ns-ed .nx-card--skel:hover { border-color: ${ED.rule}; }
    .ns-ed .nx-card--skel:hover::before { opacity: 0; }
    .ns-ed .skel-line {
      height: 10px; background: ${ED.paper150}; border-radius: 2px;
      animation: nx-skel-pulse 1.6s ease-in-out infinite;
    }
    .ns-ed .skel-line.big { height: 22px; }
    .ns-ed .skel-line.w-full  { width: 100%; }
    .ns-ed .skel-line.w-4of5  { width: 80%; }
    .ns-ed .skel-line.w-2of5  { width: 40%; }
    .ns-ed .skel-line.w-1of3  { width: 33%; }
    @keyframes nx-skel-pulse {
      0%, 100% { opacity: 0.6; }
      50%      { opacity: 1; }
    }
  `}</style>
);
