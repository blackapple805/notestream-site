// src/pages/NoteView.jsx
// ═══════════════════════════════════════════════════════════════════
// EDITORIAL — single note reader/editor (magazine spread)
// ─────────────────────────────────────────────────────────────────
// Layout:
//   ≥1200  [meta rail 220] [article 1fr max 720] [tools rail 260]
//   900–1199  [article 1fr max 720] [tools rail 260]   (meta moves
//                                                      to a top band)
//   640–899   single column max 640
//   <640      single column, sticky bottom action bar
//
// Features wired:
//   · Inline editable title
//   · Drop cap on first paragraph (only if paragraph >80 chars)
//   · Block quote + H2 with mono kicker
//   · Save status floating pill (bottom-right)
//   · Reading mode toggle (hides rails, adds scroll-progress bar)
//   · Keyboard: ⌘S save, ⌘Enter publish, e edit, Esc exit reading
//
// REPLACE: the NOTE_STUB with your real fetch from id route param,
// the save/publish handlers with your actual backend calls, the
// LINKED/RELATED arrays with real queries.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEditorial, ED } from "../lib/editorial";
// ✅ Static import (was previously a dynamic `await import()` inside an
// effect). The build warning was "module is statically imported by 25
// files AND dynamically imported by this one — dynamic import won't
// move it into another chunk." Since NoteView itself is already lazy-
// loaded by App.jsx's route splitting, loading supabaseClient lazily
// inside it added zero benefit and only triggered the warning. Static
// import here both silences the warning and saves one micro-await on
// every direct-link note fetch.
import { supabase, supabaseReady } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { analyzeNote } from "../lib/noteAI";
import {
  FiArrowLeft, FiSave, FiCheck, FiCopy, FiArchive, FiTrash2, FiShare2,
  FiDownload, FiZap, FiEdit, FiBookOpen, FiX, FiMoreHorizontal,
  FiTool, FiClock, FiLink, FiTag, FiAlertCircle, FiLoader,
} from "react-icons/fi";

/* ─── STUB ─── replace with real fetch by params.id */
const NOTE_STUB = {
  id: "n42",
  number: "042",
  status: "draft",            // "draft" | "published"
  title: "On the discipline of writing a single sentence each morning",
  dek: "A small daily bargain, and what it does to the architecture of a week.",
  author: "M. CHEN",
  writtenAt: "MAY 25, 2026",
  updatedAt: "12 MIN AGO",
  words: 487,
  readMins: 3,
  tags: ["craft", "habits", "essays"],
  blocks: [
    { type: "p", text: "There is a peculiar virtue in promising yourself only one sentence. The bargain is small enough to keep, even on days that contain very little. And one sentence almost always becomes more — not because you tricked yourself into it, but because writing is a kind of warmth, and warmth tends to spread once it starts." },
    { type: "h2", text: "The shape of the bargain" },
    { type: "p", text: "What I keep noticing is that the bargain works on the scale of weeks, not days. Any single morning's sentence is forgettable. But after a week the page has become a small structure, and the structure exerts its own pull." },
    { type: "quote", text: "Discipline is just memory in a different posture." },
    { type: "p", text: "I'm not sure who said that, or if anyone did, but I keep writing it down in different notebooks like a refrain." },
    { type: "h2", text: "What it is not" },
    { type: "p", text: "It is not productivity. It is not a system. It does not scale and it does not need to. It is closer to the practice of lighting a candle in the same place every evening — not because the room requires more light, but because the gesture is itself the point." },
  ],
};

const LINKED_STUB  = [
  { id: "n40", title: "Walking thoughts on attention" },
  { id: "n38", title: "Reading log — May" },
];

const HISTORY_STUB = [
  { v: 14, at: "12 MIN AGO" },
  { v: 13, at: "1 H AGO" },
  { v: 12, at: "YESTERDAY · 18:42" },
];

const RELATED_STUB = [
  { id: "n38", number: "038", title: "Reading log — May",                    preview: "Started Calvino's Six Memos and have been chewing on the chapter on lightness…" },
  { id: "n34", number: "034", title: "On rituals that don't scale",          preview: "The most reliable habits in my life are the ones I can't justify in a meeting." },
  { id: "n29", number: "029", title: "Notebook fragments — winter",          preview: "Three months of marginalia, collected here without much editing." },
];

/* ─── Helpers for converting DB-shaped notes into the editorial viewer
   shape. The viewer renders `blocks: [{type, text}]`, but we store a
   plain `body` string in Supabase. Split on double-newlines and treat
   lines starting with `# ` as h2, `> ` as quote, everything else as p. */
function bodyToBlocks(body) {
  if (!body || typeof body !== "string") return [];
  const chunks = body.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  return chunks.map((chunk) => {
    if (chunk.startsWith("## ")) return { type: "h2", text: chunk.slice(3).trim() };
    if (chunk.startsWith("# "))  return { type: "h2", text: chunk.slice(2).trim() };
    if (chunk.startsWith("> "))  return { type: "quote", text: chunk.slice(2).trim() };
    return { type: "p", text: chunk };
  });
}

function hydrateForViewer(note) {
  if (!note) return null;
  const body = note.body || note._body || "";
  const blocks = note.blocks?.length ? note.blocks : bodyToBlocks(body);
  return {
    ...note,
    body,
    blocks,
    number: note.number || (note.id ? String(note.id).slice(-3).toUpperCase() : "—"),
    status: note.status || (note.ai_payload ? "published" : "draft"),
    author: note.author || "YOU",
    dek: note.dek || (note.ai_payload?.summary ? String(note.ai_payload.summary).slice(0, 180) : ""),
    writtenAt: note.writtenAt || (note.createdAt ? new Date(note.createdAt).toLocaleDateString().toUpperCase() : ""),
    readMins: note.readMins || Math.max(1, Math.round((note.words || 0) / 200)),
  };
}

function rowToViewerNote(row) {
  const body = row.body || "";
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  return {
    id: row.id,
    title: row.title || "Untitled entry",
    body,
    tags: Array.isArray(row.tags) ? row.tags : [],
    pinned: Boolean(row.is_favorite),
    is_favorite: Boolean(row.is_favorite),
    // ✅ Carry status through from the DB row. hydrateForViewer below
    // falls back to ai_payload-derived status only when this is absent
    // (pre-migration rows). Without this line, direct-URL note loads
    // would always show "draft" regardless of what's in Supabase.
    status: row.status || null,
    words,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    ai_payload: row.ai_payload || null,
    ai_generated_at: row.ai_generated_at || null,
    ai_model: row.ai_model || null,
  };
}

export default function NoteView({ notes = [], updateNote, deleteNote } = {}) {
  useEditorial();
  const { id } = useParams();
  const navigate = useNavigate();
  // ✅ Shared auth state — needed by analyzeNote() for user_id + usage tracking.
  const { user: authUser } = useAuth();

  /* ✅ Real fetch: try the parent-supplied list first (fastest, already
     loaded), then fall back to a Supabase round-trip via lazy import so
     deep-linking to /dashboard/notes/<uuid> still works on hard refresh.
     The hardcoded NOTE_STUB now only renders if the id genuinely cannot
     be resolved (offline / not signed in / wrong workspace). */
  const [note, setNote] = useState(() => {
    if (id) {
      const found = notes.find((n) => n.id === id);
      if (found) return hydrateForViewer(found);
    }
    return null; // null until we attempt a fetch
  });
  const [notFound, setNotFound] = useState(false);

  // Re-resolve whenever the URL id or the parent notes list changes
  useEffect(() => {
    if (!id) return;
    const fromList = notes.find((n) => n.id === id);
    if (fromList) {
      setNote(hydrateForViewer(fromList));
      setNotFound(false);
      return;
    }

    // If the URL id isn't a real Supabase uuid (e.g. someone bookmarked
    // an old local `n_xxx` placeholder), there's nothing to fetch.
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        String(id),
      );
    if (!isUuid) {
      setNotFound(true);
      setNote(null);
      return;
    }

    // Fall back to direct Supabase fetch — handles hard refresh on a deep link
    let cancelled = false;
    (async () => {
      try {
        if (!supabaseReady || !supabase) {
          // Only show the editorial demo stub if Supabase isn't configured
          // at all (e.g. dev preview with no env vars). With Supabase wired
          // up, missing notes get a real "not found" state instead of the
          // confusing M. Chen essay.
          if (!cancelled) setNote(NOTE_STUB);
          return;
        }
        const { data, error } = await supabase
          .from("notes")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (cancelled) return;
        if (error || !data) {
          setNotFound(true);
          setNote(null);
        } else {
          setNote(hydrateForViewer(rowToViewerNote(data)));
          setNotFound(false);
        }
      } catch (err) {
        console.error("[NoteView] fetch failed:", err);
        if (!cancelled) {
          setNotFound(true);
          setNote(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, notes]);

  const [editing, setEditing]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [savedAt, setSavedAt]         = useState("12 MIN AGO");
  const [readingMode, setReadingMode] = useState(false);
  const [showActions, setShowActions] = useState(false); // mobile actions sheet
  const [progress, setProgress]       = useState(0);

  // ─── AI state ─────────────────────────────────────────────────
  // `aiLoading` is the in-flight indicator for Summarize/Rewrite/Expand.
  // `aiError` shows any error returned by the edge function (rate limit,
  //   provider down, etc). Auto-clears when a new request starts.
  // `aiBanner` controls whether the result banner is collapsed/expanded.
  //   Starts open after a fresh summarize so the user sees the result; can
  //   be re-opened from the AI tools menu anytime if a payload exists.
  // `comingSoonToast` is a tiny ephemeral message for the unbuilt Rewrite
  //   and Expand actions — replaces the old no-op buttons with explicit
  //   feedback so users know the click registered.
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiBanner, setAiBanner] = useState(true);
  const [comingSoonToast, setComingSoonToast] = useState(null);

  const titleRef = useRef(null);

  /* Scroll progress for reading mode */
  useEffect(() => {
    if (!readingMode) return;
    const onScroll = () => {
      const h = document.documentElement;
      const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      setProgress(Number.isFinite(pct) ? pct : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [readingMode]);

  /* ✅ Save now persists to Supabase via the updateNote prop. Reconstructs
     a body string from the blocks the editor mutates, so what gets written
     back to the DB matches what the user sees. */
  const save = useCallback(async () => {
    // Skip the DB round-trip if we don't have a real Supabase UUID. The
    // QuickCreateModal generates local placeholder ids like `n_mpoyc8gw`
    // that aren't valid uuids — trying to PATCH with one throws Postgres
    // error 22P02. The created note's real uuid is what we want; if we
    // somehow ended up with a placeholder, just no-op the save instead
    // of crashing.
    const looksLikeUuid =
      typeof note?.id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(note.id);

    if (!looksLikeUuid || !updateNote) {
      setSaving(true);
      await new Promise((r) => setTimeout(r, 400));
      setSaving(false);
      setSavedAt("just now");
      return;
    }
    setSaving(true);
    try {
      const bodyStr = Array.isArray(note.blocks)
        ? note.blocks
            .map((b) =>
              b.type === "h2"
                ? `## ${b.text}`
                : b.type === "quote"
                ? `> ${b.text}`
                : b.text,
            )
            .join("\n\n")
        : note.body || "";
      await updateNote(note.id, {
        title: note.title,
        body: bodyStr,
        tags: note.tags,
        pinned: Boolean(note.pinned || note.is_favorite),
      });
      setSavedAt("just now");
    } catch (err) {
      console.error("[NoteView] save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [note, updateNote]);

  /* ✅ Publish now actually persists the status flip to Supabase. Before
     this fix `publish()` only mutated local component state — the next
     refetch from useNotes() would re-derive status from `ai_payload`
     (which was the old approximation of "published") and the note would
     snap back to draft. With the new `status` column in place, we PATCH
     it directly and only update local state after the write succeeds.

     We still call save() first so the latest title/body/tags go up in
     the same round-trip context, then patch status. (Two requests, but
     small ones — and it keeps the save path unchanged for ⌘S.) */
  const publish = useCallback(async () => {
    await save();

    const looksLikeUuid =
      typeof note?.id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(note.id);

    if (looksLikeUuid && typeof updateNote === "function") {
      try {
        await updateNote(note.id, { status: "published" });
      } catch (err) {
        console.error("[NoteView] publish failed:", err);
        return; // keep the badge as draft so the user knows it didn't stick
      }
    }
    setNote((n) => (n ? { ...n, status: "published" } : n));
  }, [save, note, updateNote]);

  // ─── AI: Summarize ──────────────────────────────────────────────
  // Calls the `analyze-note` edge function via lib/noteAI.js. That helper
  // already handles usage limits (consumeAiUsage), invokes the edge
  // function with title+body, persists the resulting ai_payload to the
  // notes row, and falls back to a local heuristic if the LLM is down.
  // We just need to surface its result in the UI and refresh local state
  // so the banner shows the new summary without a page reload.
  const handleSummarize = useCallback(async () => {
    if (aiLoading) return;
    if (!note?.id || !authUser?.id) {
      setAiError("Sign in required to use AI features.");
      return;
    }
    // Don't try to summarize content we know is too short — lib/noteAI.js
    // would reject this anyway, but checking here avoids the round-trip
    // and gives a clearer error message.
    const bodyText = Array.isArray(note.blocks)
      ? note.blocks.map((b) => b.text || "").join(" ")
      : note.body || "";
    if (!bodyText || bodyText.trim().length < 20) {
      setAiError("Add at least 20 characters of content before summarizing.");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    try {
      const payload = await analyzeNote({
        noteId: note.id,
        userId: authUser.id,
        title: note.title,
        body: bodyText,
        isManual: true,
      });

      if (!payload) {
        setAiError("Couldn't generate a summary right now.");
        return;
      }
      if (payload.error) {
        setAiError(payload.message || "AI summary failed.");
        return;
      }

      // Update local note state so the banner reflects the new summary
      // without waiting for the parent useNotes refetch. Mirror the same
      // shape rowToNote produces so the dek/preview helpers stay happy.
      setNote((n) =>
        n
          ? {
              ...n,
              ai_payload: payload,
              ai_generated_at: payload.generatedAt,
              ai_model: payload.model,
              dek: payload.summary
                ? String(payload.summary).slice(0, 180)
                : n.dek,
            }
          : n,
      );
      setAiBanner(true); // make sure the banner is open after a fresh summary
    } catch (err) {
      console.error("[NoteView] summarize failed:", err);
      setAiError(err?.message || "AI summary failed.");
    } finally {
      setAiLoading(false);
    }
  }, [aiLoading, note, authUser]);

  // ─── AI: Rewrite & Expand (coming soon) ─────────────────────────
  // The frontend buttons fire, but the backing edge functions
  // (rewrite-note / expand-note) don't exist yet. Show a small toast so
  // users get explicit feedback instead of clicking a dead button. When
  // the edge functions ship, replace this with a real call.
  const showComingSoon = useCallback((label) => {
    setComingSoonToast(`${label} is coming soon — we're building it now.`);
    setTimeout(() => setComingSoonToast(null), 2800);
  }, []);

  const handleRewrite = useCallback(() => showComingSoon("Rewrite"), [showComingSoon]);
  const handleExpand = useCallback(() => showComingSoon("Expand"), [showComingSoon]);


  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); publish(); return; }
      if (e.key === "Escape" && readingMode) { setReadingMode(false); return; }
      // 'e' to edit — only when not already focused in an input
      if (e.key === "e" && !editing) {
        const inField = document.activeElement && /input|textarea/i.test(document.activeElement.tagName);
        if (!inField) { setEditing(true); setTimeout(() => titleRef.current?.focus(), 30); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, publish, editing, readingMode]);

  /* ✅ Loading guard — note is null until the fetch resolves. Without this
     the next line (`note.blocks.find`) crashes on every fresh page load
     before the in-memory cache catches up. */
  if (!note) {
    return (
      <div className="ns-ed ns-nv" style={{ padding: "4rem 2rem", textAlign: "center", opacity: 0.6 }}>
        <span className="ed-mono">{notFound ? "NOTE NOT FOUND" : "LOADING…"}</span>
      </div>
    );
  }

  /* Should the first paragraph get a drop cap? */
  const firstP = (note.blocks || []).find(b => b.type === "p");
  const useDropCap = firstP && firstP.text.length >= 80;

  return (
    <div className={`ns-ed ns-nv ${readingMode ? "is-reading" : ""}`}>
      <NoteViewScopedStyles />

      {/* Reading-mode progress bar */}
      {readingMode && (
        <div className="nv-progress" style={{ width: `${progress}%` }} />
      )}

      {/* ═══ TOP BAND (mobile / narrow-desktop, replaces left rail) ═══ */}
      {!readingMode && (
        <div className="nv-band">
          <button onClick={() => navigate(-1)} className="nv-back">
            <FiArrowLeft size={13} />
            <span className="ed-mono">BACK</span>
          </button>
          <span className="ed-mono nv-band-mid">
            § NOTES · {note.status === "draft" ? "DRAFT" : "PUBLISHED"} · № {note.number}
          </span>
          <button
            type="button"
            onClick={() => setReadingMode(true)}
            className="nv-reading-toggle"
            title="Reading mode"
            aria-label="Enter reading mode"
          >
            <FiBookOpen size={13} />
          </button>
        </div>
      )}

      {/* Exit-reading affordance */}
      {readingMode && (
        <button
          type="button"
          onClick={() => setReadingMode(false)}
          className="nv-exit-reading"
          aria-label="Exit reading mode"
        >
          <FiX size={14} />
          <span className="ed-mono">EXIT READING</span>
        </button>
      )}

      <div className="nv-shell">
        {/* ═══ LEFT META RAIL (≥1200) ═══ */}
        {!readingMode && (
          <aside className="nv-meta">
            <section>
              <p className="ed-mono nv-meta-h">§ STATUS</p>
              <p className="nv-meta-status">
                <span className={`nv-status-dot ${note.status}`} />
                <em>{note.status === "draft" ? "Draft" : "Published"}</em>
              </p>
            </section>
            <hr className="ed-rule-soft" />
            <section>
              <p className="ed-mono nv-meta-h">§ TAGS</p>
              <ul className="nv-meta-tags">
                {note.tags.map((t) => (
                  <li key={t}>
                    <span className="ed-mono nv-meta-tag"><FiTag size={9} /> {t}</span>
                  </li>
                ))}
              </ul>
            </section>
            <hr className="ed-rule-soft" />
            <section>
              <p className="ed-mono nv-meta-h">§ LINKED</p>
              <ul className="nv-meta-linked">
                {LINKED_STUB.map((l, i) => (
                  <li key={l.id}>
                    <Link to={`/dashboard/notes/${l.id}`} className="nv-meta-link">
                      <span className="ed-mono ord">{String(i + 1).padStart(2, "0")}</span>
                      <span className="title">{l.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
            <hr className="ed-rule-soft" />
            <section>
              <p className="ed-mono nv-meta-h">§ HISTORY</p>
              <ul className="nv-meta-history">
                {HISTORY_STUB.map((h) => (
                  <li key={h.v}>
                    <span className="ed-mono v">v{h.v}</span>
                    <span className="ed-mono at">{h.at}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        )}

        {/* ═══ ARTICLE ═══ */}
        <article className="nv-article">
          {/* Headline block */}
          <header className="nv-head">
            <p className="ed-mono nv-kicker">
              § NOTES · <span className={`nv-kicker-status ${note.status}`}>{note.status === "draft" ? "DRAFT" : "PUBLISHED"}</span> · № {note.number}
            </p>

            {editing ? (
              <input
                ref={titleRef}
                className="nv-title nv-title-input"
                value={note.title}
                onChange={(e) => setNote(n => ({ ...n, title: e.target.value }))}
                onBlur={() => setEditing(false)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setEditing(false); save(); } }}
              />
            ) : (
              <h1
                className={`nv-title ${note.status === "draft" ? "is-draft" : ""}`}
                onClick={() => { setEditing(true); setTimeout(() => titleRef.current?.focus(), 30); }}
                title="Click to edit (or press e)"
              >
                {note.title}
              </h1>
            )}

            {note.dek && (
              <p className="nv-dek">{note.dek}</p>
            )}

            <p className="ed-mono nv-byline">
              BY {note.author} · WRITTEN {note.writtenAt} · UPDATED {note.updatedAt} · {note.words} WORDS · {note.readMins} MIN READ
            </p>

            <hr className="nv-rule-thick" />
            <hr className="nv-rule-thin" />
          </header>

          {/* ─── AI summary banner ──────────────────────────────
              Renders when a note has an ai_payload (from a successful
              Summarize). Collapsible so the reader can fold it away.
              Also surfaces error messages and the "coming soon" toast
              for Rewrite/Expand inline rather than as a floating popup. */}
          {(note.ai_payload || aiError || comingSoonToast) && (
            <div className="nv-ai-banner" role="region" aria-label="AI summary">
              {/* Coming-soon and error rows take priority — they're
                  ephemeral and matter most right now. */}
              {comingSoonToast && (
                <div className="nv-ai-toast nv-ai-toast--info">
                  <FiAlertCircle size={13} />
                  <span>{comingSoonToast}</span>
                </div>
              )}
              {aiError && (
                <div className="nv-ai-toast nv-ai-toast--error">
                  <FiAlertCircle size={13} />
                  <span>{aiError}</span>
                  <button
                    type="button"
                    onClick={() => setAiError(null)}
                    className="nv-ai-dismiss"
                    aria-label="Dismiss"
                  >
                    <FiX size={11} />
                  </button>
                </div>
              )}

              {note.ai_payload && (
                <>
                  <div className="nv-ai-banner-head">
                    <p className="ed-mono nv-ai-eyebrow">
                      <FiZap size={11} /> AI SUMMARY
                      {note.ai_model && (
                        <span className="nv-ai-model">· {note.ai_model}</span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => setAiBanner((v) => !v)}
                      className="nv-ai-toggle"
                      aria-expanded={aiBanner}
                    >
                      {aiBanner ? "Hide" : "Show"}
                    </button>
                  </div>

                  {aiBanner && (
                    <div className="nv-ai-content">
                      {note.ai_payload.summary && (
                        <p className="nv-ai-summary">{note.ai_payload.summary}</p>
                      )}

                      {Array.isArray(note.ai_payload.keyPoints) &&
                        note.ai_payload.keyPoints.length > 0 && (
                          <div className="nv-ai-block">
                            <p className="ed-mono nv-ai-sub">KEY POINTS</p>
                            <ul className="nv-ai-list">
                              {note.ai_payload.keyPoints.slice(0, 5).map((p, i) => (
                                <li key={`kp-${i}`}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {Array.isArray(note.ai_payload.actionItems) &&
                        note.ai_payload.actionItems.length > 0 && (
                          <div className="nv-ai-block">
                            <p className="ed-mono nv-ai-sub">ACTION ITEMS</p>
                            <ul className="nv-ai-list nv-ai-list--checks">
                              {note.ai_payload.actionItems.slice(0, 5).map((p, i) => (
                                <li key={`ai-${i}`}>{typeof p === "string" ? p : p?.text}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {Array.isArray(note.ai_payload.topics) &&
                        note.ai_payload.topics.length > 0 && (
                          <div className="nv-ai-tags">
                            {note.ai_payload.topics.slice(0, 6).map((t, i) => (
                              <span key={`t-${i}`} className="nv-ai-tag">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Body */}
          <div className="nv-body">
            {note.blocks.map((b, i) => {
              if (b.type === "h2") {
                return (
                  <div key={i} className="nv-h2-wrap">
                    <p className="ed-mono nv-h2-kicker">§ {String(i).padStart(2, "0")}</p>
                    <h2 className="nv-h2">{b.text}</h2>
                  </div>
                );
              }
              if (b.type === "quote") {
                return (
                  <blockquote key={i} className="nv-quote">
                    {b.text}
                  </blockquote>
                );
              }
              // paragraph
              const isFirstP = b === firstP;
              if (isFirstP && useDropCap) {
                const first = b.text.charAt(0);
                const rest  = b.text.slice(1);
                return (
                  <p key={i} className="nv-p nv-p-first">
                    <span className="nv-dropcap">{first}</span>{rest}
                  </p>
                );
              }
              return <p key={i} className="nv-p">{b.text}</p>;
            })}
          </div>

          {/* End ornament */}
          <div className="nv-end">
            <p className="ed-mono nv-end-line">END OF ENTRY № {note.number}</p>
            <p className="nv-end-orn">❦</p>
          </div>

          {/* Related */}
          {!readingMode && (
            <section className="nv-related">
              <p className="ed-mono nv-related-h">§ ALSO IN THIS NOTEBOOK</p>
              <hr className="ed-rule" />
              <div className="nv-related-grid">
                {RELATED_STUB.map((r) => (
                  <Link key={r.id} to={`/dashboard/notes/${r.id}`} className="nv-related-card">
                    <p className="ed-mono">№ {r.number}</p>
                    <h3>{r.title}</h3>
                    <p className="prev">{r.preview}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* ═══ RIGHT TOOLS RAIL (≥900) ═══ */}
        {!readingMode && (
          <aside className="nv-tools">
            <section className="nv-tools-section">
              <p className="ed-mono nv-tools-h">§ ACTIONS</p>
              <button onClick={save} className="nv-tool-row primary" disabled={saving}>
                <FiSave size={13} />
                <span className="lb">{saving ? "Saving…" : "Save"}</span>
                <span className="ed-mono kbd">⌘S</span>
              </button>
              <button onClick={publish} className="nv-tool-row">
                <FiCheck size={13} />
                <span className="lb">Publish</span>
                <span className="ed-mono kbd">⌘↵</span>
              </button>
              <button className="nv-tool-row">
                <FiCopy size={13} />
                <span className="lb">Duplicate</span>
              </button>
              <button className="nv-tool-row">
                <FiArchive size={13} />
                <span className="lb">Archive</span>
              </button>
              <button className="nv-tool-row danger">
                <FiTrash2 size={13} />
                <span className="lb">Delete</span>
              </button>
            </section>

            <section className="nv-tools-section">
              <p className="ed-mono nv-tools-h">§ AI</p>
              <button
                type="button"
                onClick={handleSummarize}
                disabled={aiLoading}
                className="nv-tool-row"
              >
                {aiLoading ? (
                  <FiLoader size={13} className="nv-spin" />
                ) : (
                  <FiZap size={13} />
                )}
                <span className="lb">
                  {aiLoading ? "Summarizing…" : "Summarize"}
                </span>
                <span className="sub">Generate a brief abstract</span>
              </button>
              <button
                type="button"
                onClick={handleRewrite}
                className="nv-tool-row"
              >
                <FiEdit size={13} />
                <span className="lb">Rewrite</span>
                <span className="sub">Improve flow &amp; clarity</span>
              </button>
              <button
                type="button"
                onClick={handleExpand}
                className="nv-tool-row"
              >
                <FiTool size={13} />
                <span className="lb">Expand</span>
                <span className="sub">Develop a section further</span>
              </button>
            </section>

            <section className="nv-tools-section">
              <p className="ed-mono nv-tools-h">§ EXPORT</p>
              <button className="nv-tool-row">
                <FiDownload size={13} />
                <span className="lb">PDF · Markdown · DOCX</span>
              </button>
              <button className="nv-tool-row">
                <FiShare2 size={13} />
                <span className="lb">Share link</span>
              </button>
            </section>
          </aside>
        )}
      </div>

      {/* ═══ Floating save status (desktop) ═══ */}
      {!readingMode && (
        <div className="nv-saved">
          <span className={`nv-saved-dot ${saving ? "saving" : "ok"}`} />
          <span className="ed-mono">
            {saving ? "SAVING…" : `SAVED · ${note.words} WORDS`}
          </span>
        </div>
      )}

      {/* ═══ Mobile floating actions ═══ */}
      {!readingMode && (
        <>
          <button
            type="button"
            className="nv-fab"
            onClick={() => setShowActions(true)}
            aria-label="Open actions"
          >
            <FiMoreHorizontal size={16} />
          </button>

          <AnimatePresence>
            {showActions && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="nv-sheet-scrim"
                  onClick={() => setShowActions(false)}
                />
                <motion.div
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                  transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                  className="nv-sheet"
                  role="dialog" aria-modal="true"
                >
                  <header className="nv-sheet-head">
                    <p className="ed-mono">§ ACTIONS</p>
                    <button onClick={() => setShowActions(false)} aria-label="Close"><FiX size={14} /></button>
                  </header>
                  <hr className="ed-rule-soft" />
                  <button onClick={() => { save(); setShowActions(false); }} className="nv-tool-row primary">
                    <FiSave size={13} /><span className="lb">Save</span>
                  </button>
                  <button onClick={() => { publish(); setShowActions(false); }} className="nv-tool-row">
                    <FiCheck size={13} /><span className="lb">Publish</span>
                  </button>
                  <button className="nv-tool-row"><FiZap size={13} /><span className="lb">AI tools</span></button>
                  <button className="nv-tool-row"><FiDownload size={13} /><span className="lb">Export</span></button>
                  <button className="nv-tool-row"><FiArchive size={13} /><span className="lb">Archive</span></button>
                  <button className="nv-tool-row danger"><FiTrash2 size={13} /><span className="lb">Delete</span></button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Scoped CSS
═══════════════════════════════════════════════════════ */
const NoteViewScopedStyles = () => (
  <style>{`
    .ns-ed.ns-nv {
      width: 100%;
      min-height: 100dvh;
      position: relative;
    }
    /* Reading mode no longer needs to override padding — DashboardLayout
       handles the offset and reading mode just hides chrome via .is-reading
       on inner elements. */

    /* Top band (back / kicker / reading toggle) */
    .ns-ed .nv-band {
      padding: clamp(14px, 2vw, 22px) 0;
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px;
    }
    .ns-ed .nv-back, .ns-ed .nv-reading-toggle {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px; border: 1px solid ${ED.rule};
      border-radius: 999px; background: transparent;
      color: ${ED.inkSoft}; cursor: pointer;
      font-size: 10px; letter-spacing: 0.14em;
    }
    .ns-ed .nv-back:hover, .ns-ed .nv-reading-toggle:hover {
      border-color: ${ED.ink}; color: ${ED.ink};
    }
    .ns-ed .nv-reading-toggle { padding: 6px; }
    .ns-ed .nv-band-mid {
      font-size: 10px; letter-spacing: 0.16em; color: ${ED.inkFaint};
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    @media (max-width: 540px) {
      .ns-ed .nv-band-mid { display: none; }
    }

    /* Shell grid */
    .ns-ed .nv-shell {
      padding: 0 0 120px;
      display: grid; gap: clamp(20px, 3vw, 40px);
      grid-template-columns: 220px minmax(0, 1fr) 260px;
      justify-content: center;
    }
    @media (max-width: 1199px) {
      .ns-ed .nv-shell {
        grid-template-columns: minmax(0, 1fr) 260px;
      }
      .ns-ed .nv-meta { display: none; }
    }
    @media (max-width: 899px) {
      .ns-ed .nv-shell {
        grid-template-columns: minmax(0, 1fr);
      }
      .ns-ed .nv-tools { display: none; }
    }
    .ns-ed.ns-nv.is-reading .nv-shell {
      grid-template-columns: minmax(0, 680px);
    }

    /* ── Left meta rail ── */
    .ns-ed .nv-meta {
      position: sticky; top: calc(var(--app-content-top, 64px) + 80px);
      align-self: start; padding-top: 80px;
    }
    .ns-ed .nv-meta section { margin: 14px 0; }
    .ns-ed .nv-meta-h {
      font-size: 9.5px; letter-spacing: 0.18em; color: ${ED.inkFaint};
      margin: 0 0 8px;
    }
    .ns-ed .nv-meta-status {
      font-family: ${ED.serif}; font-size: 17px; color: ${ED.ink};
      margin: 0; display: inline-flex; align-items: center; gap: 8px;
    }
    .ns-ed .nv-meta-status em {
      font-style: italic; color: ${ED.accent};
    }
    .ns-ed .nv-status-dot {
      width: 8px; height: 8px; border-radius: 999px; background: ${ED.accent};
    }
    .ns-ed .nv-status-dot.published { background: #2a8f4f; }

    .ns-ed .nv-meta-tags {
      list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 5px;
    }
    .ns-ed .nv-meta-tag {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase;
      color: ${ED.inkFaint}; padding: 3px 8px;
      border: 1px solid ${ED.rule}; border-radius: 999px;
    }

    .ns-ed .nv-meta-linked, .ns-ed .nv-meta-history {
      list-style: none; padding: 0; margin: 0;
    }
    .ns-ed .nv-meta-link {
      display: grid; grid-template-columns: 24px 1fr; gap: 8px;
      padding: 4px 0; align-items: baseline;
      text-decoration: none; color: ${ED.inkSoft};
      transition: color .12s ease;
    }
    .ns-ed .nv-meta-link:hover { color: ${ED.accent}; }
    .ns-ed .nv-meta-link:hover .title { font-style: italic; }
    .ns-ed .nv-meta-link .ord {
      font-size: 9.5px; letter-spacing: 0.14em; color: ${ED.inkFaint};
    }
    .ns-ed .nv-meta-link .title {
      font-family: ${ED.serif}; font-size: 14px;
      transition: font-style .12s ease;
    }
    .ns-ed .nv-meta-history li {
      display: flex; justify-content: space-between;
      font-size: 10px; letter-spacing: 0.14em; color: ${ED.inkFaint};
      padding: 3px 0;
    }
    .ns-ed .nv-meta-history .v { color: ${ED.ink}; }

    /* ── Article ── */
    /* padding-top here mirrors .nv-meta and .nv-tools (80px) so that on
       desktop the three section starts — § NOTES kicker, § STATUS, and
       § ACTIONS — align on the same baseline. Reading mode and mobile
       reset this below since the rails are hidden there. */
    .ns-ed .nv-article {
      min-width: 0;
      max-width: 720px;
      padding-top: 80px;
    }
    @media (max-width: 899px) {
      .ns-ed .nv-article { padding-top: clamp(10px, 2vw, 24px); }
    }
    .ns-ed .nv-kicker {
      font-size: 10.5px; letter-spacing: 0.18em; color: ${ED.inkFaint};
      margin: 0 0 18px;
    }
    .ns-ed .nv-kicker-status.draft     { color: ${ED.accent}; }
    .ns-ed .nv-kicker-status.published { color: #2a8f4f; }

    .ns-ed .nv-title {
      font-family: ${ED.serif}; font-weight: 400;
      font-size: clamp(32px, 5vw, 56px); line-height: 1.05;
      letter-spacing: -0.02em; color: ${ED.ink};
      margin: 0 0 16px; cursor: text;
      transition: opacity .15s ease;
    }
    .ns-ed .nv-title.is-draft { font-style: italic; }
    .ns-ed .nv-title:hover { opacity: 0.7; }
    .ns-ed .nv-title-input {
      width: 100%; background: transparent; border: 0;
      border-bottom: 1px dashed ${ED.accent}; outline: 0;
      padding: 0 0 4px; cursor: text;
    }

    .ns-ed .nv-dek {
      font-family: ${ED.serif}; font-style: italic;
      font-size: clamp(18px, 2vw, 22px); line-height: 1.45;
      color: ${ED.inkSoft}; margin: 0 0 20px;
    }
    .ns-ed .nv-byline {
      font-size: 10px; letter-spacing: 0.16em; color: ${ED.inkFaint};
      margin: 0 0 18px;
    }
    @media (max-width: 760px) {
      .ns-ed .nv-byline { line-height: 1.7; }
    }
    .ns-ed .nv-rule-thick { border: 0; height: 1px; background: ${ED.ink}; margin: 0; }
    .ns-ed .nv-rule-thin  { border: 0; height: 1px; background: ${ED.rule}; margin: 4px 0 0; }

    /* ─── AI summary banner ──────────────────────────────────────
       Paper-50 card with accent-blue eyebrow and editorial typography
       so it reads as part of the article rather than a popup overlay. */
    .ns-ed .nv-ai-banner {
      margin: clamp(18px, 2.5vw, 28px) 0 0;
      padding: 14px 18px 16px;
      background: ${ED.paper50};
      border: 1px solid ${ED.rule};
      border-radius: 8px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .ns-ed .nv-ai-banner-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px;
    }
    .ns-ed .nv-ai-eyebrow {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 10.5px; letter-spacing: 0.18em; color: ${ED.accent};
      margin: 0;
    }
    .ns-ed .nv-ai-model {
      color: ${ED.inkFaint}; letter-spacing: 0.12em; font-size: 10px;
      text-transform: none;
    }
    .ns-ed .nv-ai-toggle {
      font-family: ${ED.mono};
      font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
      color: ${ED.inkSoft};
      background: transparent; border: 0; padding: 4px 8px; cursor: pointer;
      border-radius: 999px;
      transition: color .12s ease, background-color .12s ease;
    }
    .ns-ed .nv-ai-toggle:hover {
      color: ${ED.ink}; background: ${ED.paper100};
    }
    .ns-ed .nv-ai-content {
      display: flex; flex-direction: column; gap: 14px;
    }
    .ns-ed .nv-ai-summary {
      font-family: ${ED.serif}; font-size: 16px; line-height: 1.6;
      color: ${ED.ink}; margin: 0;
      font-style: italic;
    }
    .ns-ed .nv-ai-block { display: flex; flex-direction: column; gap: 6px; }
    .ns-ed .nv-ai-sub {
      font-size: 9.5px; letter-spacing: 0.18em; color: ${ED.inkFaint};
      margin: 0;
    }
    .ns-ed .nv-ai-list {
      list-style: none; padding: 0; margin: 0;
      display: flex; flex-direction: column; gap: 4px;
    }
    .ns-ed .nv-ai-list li {
      font-family: ${ED.serif}; font-size: 14.5px; line-height: 1.55;
      color: ${ED.ink}; padding-left: 14px; position: relative;
    }
    .ns-ed .nv-ai-list li::before {
      content: "·"; color: ${ED.accent};
      position: absolute; left: 4px; top: -1px;
      font-size: 18px; line-height: 1;
    }
    .ns-ed .nv-ai-list--checks li::before { content: "□"; font-size: 12px; top: 2px; }
    .ns-ed .nv-ai-tags { display: inline-flex; flex-wrap: wrap; gap: 5px; }
    .ns-ed .nv-ai-tag {
      font-family: ${ED.mono}; font-size: 9.5px; letter-spacing: 0.14em;
      text-transform: uppercase; color: ${ED.inkFaint};
      padding: 2px 7px; border: 1px solid ${ED.rule}; border-radius: 999px;
    }

    /* AI inline toasts (errors + coming-soon notices) */
    .ns-ed .nv-ai-toast {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 12px; border-radius: 6px;
      font-family: ${ED.sans}; font-size: 13px; line-height: 1.4;
      border: 1px solid ${ED.rule}; background: ${ED.paper100};
      color: ${ED.ink};
    }
    .ns-ed .nv-ai-toast--info { color: ${ED.inkSoft}; }
    .ns-ed .nv-ai-toast--error {
      border-color: #e6c2bd; background: #fdf0ee; color: #8a2a1f;
    }
    .ns-ed .nv-ai-dismiss {
      margin-left: auto;
      background: transparent; border: 0; cursor: pointer;
      color: inherit; opacity: 0.6; padding: 2px;
      display: inline-flex; align-items: center;
    }
    .ns-ed .nv-ai-dismiss:hover { opacity: 1; }

    /* Spinner used inside the Summarize button while in flight */
    .ns-ed .nv-spin {
      animation: nv-spin 0.9s linear infinite;
    }
    @keyframes nv-spin {
      to { transform: rotate(360deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      .ns-ed .nv-spin { animation: none; }
    }

    /* Body */
    .ns-ed .nv-body { padding-top: clamp(20px, 3vw, 36px); }
    .ns-ed .nv-p {
      font-family: ${ED.serif}; font-size: 18px; line-height: 1.7;
      color: ${ED.ink}; margin: 0 0 1.2em;
    }
    .ns-ed .nv-p-first { margin-top: 0; }

    /* Drop cap */
    .ns-ed .nv-dropcap {
      float: left; font-family: ${ED.serif}; font-style: italic;
      color: ${ED.accent};
      font-size: clamp(56px, 7vw, 84px);
      line-height: 0.85; padding: 6px 8px 0 0;
      margin: 4px 4px 0 0;
    }

    /* H2 with kicker */
    .ns-ed .nv-h2-wrap { margin: 1.8em 0 0.6em; }
    .ns-ed .nv-h2-kicker {
      font-size: 10px; letter-spacing: 0.18em; color: ${ED.accent};
      font-family: ${ED.serif} !important; font-style: italic;
      margin: 0 0 4px;
    }
    .ns-ed .nv-h2 {
      font-family: ${ED.serif}; font-style: italic; font-weight: 400;
      font-size: clamp(22px, 2.6vw, 30px); line-height: 1.2;
      color: ${ED.ink}; margin: 0;
    }

    /* Block quote */
    .ns-ed .nv-quote {
      font-family: ${ED.serif}; font-style: italic;
      font-size: clamp(20px, 2.2vw, 26px); line-height: 1.4;
      color: ${ED.inkSoft};
      border-left: 3px solid ${ED.accent};
      padding-left: clamp(16px, 2vw, 24px);
      margin: 1.4em 0 1.4em clamp(-16px, -2vw, -24px);
    }
    @media (max-width: 760px) {
      .ns-ed .nv-quote { margin-left: 0; }
    }

    /* End ornament */
    .ns-ed .nv-end {
      text-align: center; padding: 40px 0 20px;
    }
    .ns-ed .nv-end-line {
      font-size: 10px; letter-spacing: 0.2em; color: ${ED.inkFaint};
      margin: 0 0 8px;
    }
    .ns-ed .nv-end-orn {
      font-family: ${ED.serif}; font-style: italic; color: ${ED.accent};
      font-size: 22px; margin: 0;
    }

    /* Related */
    .ns-ed .nv-related { padding-top: 30px; }
    .ns-ed .nv-related-h {
      font-size: 9.5px; letter-spacing: 0.18em; color: ${ED.inkFaint};
      margin: 0 0 12px;
    }
    .ns-ed .nv-related-grid {
      display: grid; gap: 16px; margin-top: 18px;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    @media (max-width: 760px) {
      .ns-ed .nv-related-grid { grid-template-columns: 1fr; }
    }
    .ns-ed .nv-related-card {
      display: block; padding: 16px;
      background: ${ED.paper50}; border: 1px solid ${ED.rule};
      border-radius: 4px; text-decoration: none; color: ${ED.ink};
      transition: border-color .15s ease;
    }
    .ns-ed .nv-related-card:hover { border-color: ${ED.ink}; }
    .ns-ed .nv-related-card:hover h3 { font-style: italic; color: ${ED.accent}; }
    .ns-ed .nv-related-card p:first-child {
      font-size: 9.5px; letter-spacing: 0.14em; color: ${ED.inkFaint};
      margin: 0 0 6px;
    }
    .ns-ed .nv-related-card h3 {
      font-family: ${ED.serif}; font-weight: 400; font-size: 17px;
      margin: 0 0 8px; transition: color .15s ease, font-style .15s ease;
    }
    .ns-ed .nv-related-card .prev {
      font-family: ${ED.serif}; font-size: 13.5px; color: ${ED.inkSoft};
      margin: 0; line-height: 1.5;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* ── Right tools rail ── */
    .ns-ed .nv-tools {
      position: sticky; top: calc(var(--app-content-top, 64px) + 80px);
      align-self: start; padding-top: 80px;
    }
    .ns-ed .nv-tools-section { margin-bottom: 20px; }
    .ns-ed .nv-tools-h {
      font-size: 9.5px; letter-spacing: 0.18em; color: ${ED.inkFaint};
      margin: 0 0 8px;
    }
    .ns-ed .nv-tool-row {
      display: grid;
      grid-template-columns: 18px 1fr auto;
      gap: 10px; align-items: center;
      width: 100%; padding: 9px 10px;
      border: 0; background: transparent; border-radius: 4px;
      text-align: left; cursor: pointer;
      color: ${ED.ink};
      transition: background-color .12s ease;
    }
    .ns-ed .nv-tool-row:hover { background: ${ED.paper50}; }
    .ns-ed .nv-tool-row .lb {
      font-family: ${ED.serif}; font-size: 15px;
    }
    .ns-ed .nv-tool-row .sub {
      grid-column: 2 / 4; font-family: ${ED.mono}; font-size: 9.5px;
      letter-spacing: 0.12em; text-transform: uppercase; color: ${ED.inkFaint};
      margin-top: 2px;
    }
    .ns-ed .nv-tool-row .kbd {
      font-size: 9px; letter-spacing: 0.06em; color: ${ED.inkFaint};
      padding: 1px 5px; border: 1px solid ${ED.rule};
      border-radius: 3px; background: ${ED.paper50};
    }
    .ns-ed .nv-tool-row.primary .lb {
      font-style: italic; color: ${ED.accent};
    }
    .ns-ed .nv-tool-row.danger .lb { color: #8a3a3a; }
    .ns-ed .nv-tool-row.danger:hover { background: rgba(138, 58, 58, 0.06); }

    /* ── Floating save status ── */
    .ns-ed .nv-saved {
      position: fixed; bottom: 18px;
      right: 24px;
      z-index: 60;
      display: inline-flex; align-items: center; gap: 8px;
      padding: 7px 14px; border-radius: 999px;
      background: ${ED.paper50}; border: 1px solid ${ED.rule};
      font-size: 10px; letter-spacing: 0.16em; color: ${ED.inkFaint};
    }
    .ns-ed .nv-saved-dot {
      width: 6px; height: 6px; border-radius: 999px; background: #2a8f4f;
    }
    .ns-ed .nv-saved-dot.saving {
      background: ${ED.accent};
      animation: nv-pulse 1.2s ease-in-out infinite;
    }
    @keyframes nv-pulse {
      0%,100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    @media (max-width: 639px) {
      .ns-ed .nv-saved { bottom: 80px; right: 16px; }
    }

    /* ── Mobile FAB + sheet ── */
    .ns-ed .nv-fab {
      display: none;
      position: fixed; bottom: 18px; right: 18px; z-index: 70;
      width: 48px; height: 48px; border-radius: 999px;
      background: ${ED.ink}; color: ${ED.paper50};
      border: 0; cursor: pointer; box-shadow: none;
      align-items: center; justify-content: center;
    }
    @media (max-width: 899px) { .ns-ed .nv-fab { display: inline-flex; } }

    .ns-ed .nv-sheet-scrim {
      position: fixed; inset: 0; z-index: 80;
      background: rgba(19,16,8,0.32);
    }
    .ns-ed .nv-sheet {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 90;
      background: ${ED.paper100}; border-top: 1px solid ${ED.rule};
      border-radius: 12px 12px 0 0;
      padding: 16px 16px max(env(safe-area-inset-bottom, 16px), 16px);
      max-height: 80dvh; overflow-y: auto;
    }
    .ns-ed .nv-sheet-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: 4px 4px 10px;
    }
    .ns-ed .nv-sheet-head p {
      font-size: 10.5px; letter-spacing: 0.18em; color: ${ED.inkFaint}; margin: 0;
    }
    .ns-ed .nv-sheet-head button {
      width: 30px; height: 30px; border-radius: 999px;
      border: 1px solid ${ED.rule}; background: transparent;
      color: ${ED.inkSoft}; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
    }

    /* ── Reading mode ── */
    .ns-ed .nv-progress {
      position: fixed; top: 0; left: 0; height: 2px;
      background: ${ED.accent}; z-index: 200;
      transition: width .08s linear;
    }
    .ns-ed .nv-exit-reading {
      position: fixed; top: 16px; right: 20px; z-index: 70;
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 999px;
      background: ${ED.paper50}; border: 1px solid ${ED.rule};
      color: ${ED.inkSoft}; cursor: pointer;
      font-size: 10px; letter-spacing: 0.16em;
    }
    .ns-ed .nv-exit-reading:hover { border-color: ${ED.ink}; color: ${ED.ink}; }

    .ns-ed.ns-nv.is-reading {
      background: ${ED.paper100};
    }
    .ns-ed.ns-nv.is-reading .nv-article {
      max-width: 680px; margin: 0 auto;
      padding-top: clamp(10px, 2vw, 24px);
    }
  `}</style>
);
