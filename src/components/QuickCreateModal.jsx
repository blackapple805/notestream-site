// src/components/QuickCreateModal.jsx
// ═══════════════════════════════════════════════════════════════════
// QUICK-CREATE MODAL — the popup that all the "New note" / "+" /
// "Begin a new note" buttons across the app are supposed to open.
//
// Before this component existed, the buttons in Sidebar / Dashboard /
// Notes / NoteView all called navigate("/dashboard/notes", { state:
// { quickCreate: <type> } }) — but nothing was reading that state, so
// nothing ever popped up. This component is what reads it.
//
// Modes:
//   · "note"   — title + body + tags inline editor, "Save & open"
//                appends to the notes list (via the onCreate callback)
//                and routes to /dashboard/notes/:id
//   · "voice"  — routes to /dashboard/ai-lab/voice-notes (modal closes)
//   · "upload" — routes to /dashboard/documents          (modal closes)
//
// IMPORTANT — rendered through a body-level portal so it sits OUTSIDE
// the DashboardLayout's scroll container. That means:
//   · the scrim covers the entire viewport (sidebar + masthead too)
//   · the card centers on the true viewport, not on .ns-ed-main
//   · nothing in this file can affect the grid / sidebar / shell CSS
// ═══════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiEdit3, FiMic, FiUploadCloud, FiArrowRight, FiTag } from "react-icons/fi";
import { ED } from "../lib/editorial";

/**
 * @param {object}   props
 * @param {boolean}  props.open      — whether the modal is visible
 * @param {string}   props.type      — "note" | "voice" | "upload"
 * @param {function} props.onClose   — called to close the modal
 * @param {function} [props.onCreate]— called with the new note object when
 *                                     the user saves a text note. Should
 *                                     append to whatever list is being
 *                                     displayed. If omitted, navigation
 *                                     still works but no list update fires.
 */
export default function QuickCreateModal({ open, type = "note", onClose, onCreate }) {
  const navigate = useNavigate();
  const titleRef = useRef(null);

  const [title, setTitle]   = useState("");
  const [body, setBody]     = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags]     = useState([]);
  const [saving, setSaving] = useState(false);

  /* Reset state every time the modal opens */
  useEffect(() => {
    if (!open) return;
    setTitle("");
    setBody("");
    setTagInput("");
    setTags([]);
    setSaving(false);
  }, [open]);

  /* For voice / upload, redirect immediately and close */
  useEffect(() => {
    if (!open) return;
    if (type === "voice") {
      onClose?.();
      navigate("/dashboard/ai-lab/voice-notes");
    } else if (type === "upload") {
      onClose?.();
      navigate("/dashboard/documents");
    }
  }, [open, type, navigate, onClose]);

  /* Focus the title field when opening in "note" mode */
  useEffect(() => {
    if (open && type === "note") {
      const id = setTimeout(() => titleRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [open, type]);

  /* Lock body scroll while open */
  useEffect(() => {
    if (!open || type !== "note") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, type]);

  /* Escape closes */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onClose?.(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, title, body, tags]);

  const commitTag = useCallback(() => {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    if (tags.includes(t)) { setTagInput(""); return; }
    if (tags.length >= 5) { setTagInput(""); return; }
    setTags((prev) => [...prev, t]);
    setTagInput("");
  }, [tagInput, tags]);

  const removeTag = useCallback((t) => {
    setTags((prev) => prev.filter((x) => x !== t));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (saving) return;
    const cleanTitle = title.trim() || "Untitled entry";
    setSaving(true);

    // Build a note that matches the shape Notes.jsx expects. The `id`
    // here is a local placeholder used only if the parent's onCreate
    // doesn't return a real one (offline / not wired up).
    const now = new Date();
    const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
    const localId = `n_${now.getTime().toString(36)}`;
    const newNote = {
      id: localId,
      title: cleanTitle,
      preview: body.trim().slice(0, 180) || "—",
      type: "note",
      words: wordCount,
      updatedAt: "JUST NOW",
      tags,
      pinned: false,
      status: "draft",
      // Keep the full body around for the viewer when wiring real storage.
      _body: body,
      body,
    };

    // ✅ Capture whatever onCreate returns so we can navigate to the REAL
    // (Supabase UUID) id instead of the local `n_xxx` placeholder. If the
    // parent isn't wired up yet, this just falls back to localId — same
    // behavior as before.
    let createdId = localId;
    try {
      const maybePromise = onCreate?.(newNote);
      const result =
        maybePromise && typeof maybePromise.then === "function"
          ? await maybePromise
          : maybePromise;
      if (result && typeof result === "object" && typeof result.id === "string") {
        createdId = result.id;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[QuickCreateModal] onCreate failed:", err);
    }

    onClose?.();
    navigate(`/dashboard/notes/${createdId}`);
  }, [saving, title, body, tags, onCreate, onClose, navigate]);

  if (!open) return null;
  // For voice / upload, the effect above already navigated — render nothing.
  if (type !== "note") return null;
  // SSR safety — only portal once we have a document.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="ns-ed qcm-root">
      <QuickCreateStyles />

      <AnimatePresence>
        <motion.div
          key="qcm-scrim"
          className="qcm-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
        />
        <motion.div
          key="qcm-card"
          className="qcm-card-wrap"
          initial={{ opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.985 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="qcm-title"
          onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        >
          <div className="qcm-card">
            {/* Head */}
            <header className="qcm-head">
              <div className="qcm-head-left">
                <span className="qcm-orn">№</span>
                <p className="ed-mono qcm-eyebrow">QUICK CREATE · NEW NOTE</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="qcm-close"
                aria-label="Close"
              >
                <FiX size={14} />
              </button>
            </header>
            <hr className="ed-rule-soft" />

            {/* Type strip — informational, with the active type highlighted */}
            <div className="qcm-types">
              <TypePill icon={<FiEdit3 size={12} />}      label="Note"     active />
              <TypePill icon={<FiMic size={12} />}        label="Voice"    onClick={() => { onClose?.(); navigate("/dashboard/ai-lab/voice-notes"); }} />
              <TypePill icon={<FiUploadCloud size={12} />} label="Upload"  onClick={() => { onClose?.(); navigate("/dashboard/documents"); }} />
            </div>

            {/* Title */}
            <label className="qcm-field">
              <span className="ed-mono qcm-label">§ TITLE</span>
              <input
                ref={titleRef}
                type="text"
                className="qcm-title-input"
                placeholder="An honest working title…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={140}
              />
            </label>

            {/* Body */}
            <label className="qcm-field">
              <span className="ed-mono qcm-label">§ BODY</span>
              <textarea
                className="qcm-body-input"
                placeholder="Start with a single sentence. Warmth tends to spread once it starts."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
              />
            </label>

            {/* Tags */}
            <div className="qcm-field">
              <span className="ed-mono qcm-label">§ TAGS</span>
              <div className="qcm-tags-row">
                {tags.map((t) => (
                  <span key={t} className="ed-mono qcm-tag">
                    <FiTag size={9} /> {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      aria-label={`Remove ${t}`}
                      className="qcm-tag-x"
                    >
                      <FiX size={9} />
                    </button>
                  </span>
                ))}
                {tags.length < 5 && (
                  <input
                    type="text"
                    className="qcm-tag-input"
                    placeholder={tags.length === 0 ? "add a tag, press Enter…" : "another?"}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        commitTag();
                      } else if (e.key === "Backspace" && tagInput === "" && tags.length) {
                        removeTag(tags[tags.length - 1]);
                      }
                    }}
                    onBlur={commitTag}
                    maxLength={24}
                  />
                )}
              </div>
            </div>

            <hr className="ed-rule-soft" />

            {/* Footer */}
            <footer className="qcm-foot">
              <p className="ed-mono qcm-hint">⌘↵ TO SAVE · ESC TO CLOSE</p>
              <div className="qcm-foot-actions">
                <button type="button" className="ed-btn ed-btn-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="ed-btn ed-btn-primary"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? "Saving…" : (<>Save &amp; open <FiArrowRight size={13} /></>)}
                </button>
              </div>
            </footer>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
}

/* ────────────────────────────────────────────────────────── */
function TypePill({ icon, label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`qcm-type ${active ? "is-on" : ""}`}
      disabled={active}
      aria-pressed={active}
    >
      {icon}
      <span className="ed-mono">{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   Scoped CSS — fixed-position overlay only. No grid /
   sidebar / shell rules. Cannot affect DashboardLayout.
═══════════════════════════════════════════════════════ */
const QuickCreateStyles = () => (
  <style>{`
    /* The portal root — a fixed full-viewport flex container so we
       can center the card honestly against the true viewport (not the
       offset content area inside DashboardLayout). Pointer events pass
       through here so the scrim and card own their own hit testing. */
    .qcm-root {
      position: fixed; inset: 0;
      z-index: 9000;
      pointer-events: none;
    }
    .qcm-root .qcm-scrim,
    .qcm-root .qcm-card-wrap { pointer-events: auto; }

    /* Editorial scrim — warm paper-ink instead of harsh near-black,
       lifted by a generous blur so the page reads as a soft backdrop
       rather than a curtain. Two stacked layers give it depth: a tint
       on the bottom, a vignette at the edges. */
    .qcm-scrim {
      position: fixed; inset: 0;
      background:
        radial-gradient(120% 80% at 50% 30%,
          rgba(42, 37, 25, 0.08) 0%,
          rgba(42, 37, 25, 0.22) 60%,
          rgba(19, 16, 8, 0.34) 100%);
      backdrop-filter: blur(6px) saturate(115%);
      -webkit-backdrop-filter: blur(6px) saturate(115%);
    }
    /* Dark-mode scrim — a darker tint than the page so the modal still
       reads as lifted. Pure-black at the edges, with a slight clearing
       toward the modal's center. */
    html[data-theme="dark"] .qcm-scrim,
    html.dark .qcm-scrim {
      background:
        radial-gradient(120% 80% at 50% 30%,
          rgba(0, 0, 0, 0.30) 0%,
          rgba(0, 0, 0, 0.55) 60%,
          rgba(0, 0, 0, 0.72) 100%);
    }

    /* Card wrap — flex-centered against the true viewport. The slight
       padding-top bias places the modal a touch above geometric center,
       which is where the eye expects the optical center to be. */
    .qcm-card-wrap {
      position: fixed; inset: 0;
      display: flex; align-items: center; justify-content: center;
      padding: max(24px, 4vh) 16px max(48px, 8vh);
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    /* Card itself — paper background with a soft shadow that reads as
       letterpress rather than dropshadow. The thin double-rule top edge
       echoes the masthead. */
    .ns-ed .qcm-card {
      width: min(560px, 100%);
      max-height: 100%;
      overflow-y: auto;
      padding: 22px 26px 20px;
      background: ${ED.paper50};
      border: 1px solid ${ED.rule};
      border-radius: 10px;
      box-shadow:
        0 1px 0 ${ED.rule},
        0 22px 60px -20px rgba(19, 16, 8, 0.28),
        0 8px 24px -12px rgba(19, 16, 8, 0.14);
      position: relative;
    }
    /* Top accent rule — subtle editorial flourish */
    .ns-ed .qcm-card::before {
      content: "";
      position: absolute;
      left: 26px; right: 26px; top: 0;
      height: 2px;
      background: ${ED.ink};
      border-radius: 2px;
    }

    /* Head */
    .qcm-head {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; padding: 6px 0 12px;
    }
    .qcm-head-left { display: inline-flex; align-items: baseline; gap: 10px; }
    .qcm-orn {
      color: ${ED.accent};
      font-family: ${ED.serif}; font-style: italic;
      font-size: 19px; line-height: 1;
    }
    .qcm-eyebrow {
      font-size: 10.5px; letter-spacing: 0.2em; color: ${ED.inkSoft};
      margin: 0; font-weight: 500;
    }
    .qcm-close {
      width: 30px; height: 30px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      background: transparent; color: ${ED.inkSoft};
      border: 1px solid ${ED.rule}; cursor: pointer;
      transition: border-color .12s ease, color .12s ease, background-color .12s ease;
    }
    .qcm-close:hover {
      border-color: ${ED.ink}; color: ${ED.ink};
      background: ${ED.paper100};
    }

    /* Type strip */
    .qcm-types {
      display: flex; gap: 6px; padding: 12px 0 4px;
    }
    .qcm-type {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 11px; border-radius: 999px;
      background: transparent; cursor: pointer;
      border: 1px solid ${ED.rule}; color: ${ED.inkFaint};
      font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase;
      transition: border-color .12s ease, color .12s ease, background-color .12s ease;
    }
    .qcm-type:hover:not(:disabled) { border-color: ${ED.ink}; color: ${ED.ink}; }
    .qcm-type.is-on {
      background: ${ED.ink}; color: ${ED.paper50}; border-color: ${ED.ink};
      cursor: default;
    }

    /* Fields */
    .qcm-field { display: block; padding: 10px 0; }
    .qcm-label {
      display: block;
      font-size: 9.5px; letter-spacing: 0.18em; color: ${ED.inkFaint};
      margin: 0 0 6px;
    }
    .qcm-title-input {
      width: 100%; background: transparent;
      border: 0; border-bottom: 1px solid ${ED.rule};
      padding: 6px 0 8px; outline: none;
      font-family: ${ED.serif}; font-size: 22px; line-height: 1.25;
      color: ${ED.ink};
      transition: border-color .15s ease;
    }
    .qcm-title-input::placeholder {
      color: ${ED.inkFaint}; font-style: italic;
    }
    .qcm-title-input:focus { border-bottom-color: ${ED.accent}; }

    .qcm-body-input {
      width: 100%; resize: vertical; min-height: 110px;
      background: ${ED.paper100};
      border: 1px solid ${ED.rule}; border-radius: 6px;
      padding: 12px 14px; outline: none;
      font-family: ${ED.serif}; font-size: 15.5px; line-height: 1.6;
      color: ${ED.ink};
      transition: border-color .15s ease, background-color .15s ease;
    }
    .qcm-body-input::placeholder { color: ${ED.inkFaint}; font-style: italic; }
    .qcm-body-input:focus {
      border-color: ${ED.accent};
      background: ${ED.paper50};
    }

    .qcm-tags-row {
      display: flex; flex-wrap: wrap; gap: 6px;
      align-items: center;
      padding: 4px 0;
    }
    .qcm-tag {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase;
      color: ${ED.inkSoft};
      padding: 3px 4px 3px 9px; border: 1px solid ${ED.rule};
      border-radius: 999px;
    }
    .qcm-tag-x {
      width: 16px; height: 16px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      background: transparent; border: 0; cursor: pointer;
      color: ${ED.inkFaint};
    }
    .qcm-tag-x:hover { color: ${ED.ink}; }
    .qcm-tag-input {
      flex: 1; min-width: 120px;
      background: transparent; border: 0; outline: none;
      font-family: ${ED.mono}; font-size: 11px; letter-spacing: 0.04em;
      color: ${ED.inkSoft}; padding: 4px 2px;
    }
    .qcm-tag-input::placeholder { color: ${ED.inkFaint}; }

    /* Footer */
    .qcm-foot {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; padding: 12px 0 0;
    }
    .qcm-hint {
      font-size: 9.5px; letter-spacing: 0.16em; color: ${ED.inkFaint};
      margin: 0;
    }
    .qcm-foot-actions { display: inline-flex; gap: 8px; align-items: center; }

    @media (max-width: 480px) {
      .qcm-foot { flex-direction: column-reverse; align-items: stretch; }
      .qcm-foot-actions { width: 100%; }
      .qcm-foot-actions .ed-btn { flex: 1; justify-content: center; }
      .qcm-hint { text-align: center; }
    }
  `}</style>
);
