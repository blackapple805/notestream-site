// src/pages/Summaries.jsx — "The Synthesis Desk"
// ═══════════════════════════════════════════════════════════════════
// EDITORIAL RESKIN — what changed and why
// ─────────────────────────────────────────────────────────────────
// Wrapped the page in `<div className="ns-ed">` and called
// `useEditorial()`. The bento-glass insight explorer is now a
// magazine column: chapter mark (`№ 06 — THE SYNTHESIS DESK`), a
// serif display title ("What does the archive say?") with "say?"
// in italic accent blue, a mono dateline (open inquiries / answered
// this week / citations enabled), a double-rule break, then the
// composer rendered as a `letter being typed` (paper-50 card,
// hairline border, mono "ASK THE ARCHIVE" eyebrow, serif italic
// placeholder, mono context picker dropdown, primary "Ask →"
// button). Empty state lists three suggested prompts as
// editorial article-rows in italic serif with quote marks.
// Conversation bubbles become magazine responses: user message =
// paper-50 card with serif italic in quotes; AI answer = drop-cap
// serif paragraph + `§ 02 — CITATIONS` block listing sources as
// article-rows.
// All Supabase loadWorkspace, file-selector, query/consumeAiUsage,
// queryInsight, logActivityEvent, and runSearch / handleSearch
// logic is UNCHANGED. RichText markdown formatter is preserved
// exactly. The "/" keyboard shortcut is preserved.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  FiSend,
  FiFile,
  FiSearch,
  FiTrash2,
  FiX,
  FiChevronDown,
  FiArrowRight,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, supabaseReady } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { consumeAiUsage } from "../lib/usage";
import { queryInsight } from "../lib/insightAI";
import { logActivityEvent } from "../lib/activityEvents";
import { useEditorial, ED } from "../lib/editorial";

const DOCS_TABLE = "documents";
const NOTES_TABLE = "notes";

const exampleQuestions = [
  "What did I decide about the rebrand timeline?",
  "Summarise everything I've written about latency.",
  "Which notes mention Karl?",
];

const quickChips = [
  { label: "Action items" },
  { label: "Deadlines" },
  { label: "Budget" },
  { label: "Key risks" },
];

const typeLabel = (t) => {
  switch (String(t || "").toLowerCase()) {
    case "pdf": return "PDF";
    case "doc": case "docx": return "DOC";
    case "video": case "mp4": return "VIDEO";
    case "note": return "NOTE";
    case "spreadsheet": case "xls": case "xlsx": return "SHEET";
    default: return "FILE";
  }
};

/* Minimal inline formatter for **bold** and *italic* (UNCHANGED) */
function RichText({ text, className = "", style = {} }) {
  const parts = useMemo(() => {
    if (!text) return [];
    const lines = String(text).split("\n");
    const parseInline = (line) => {
      const tokens = [];
      let remaining = line;
      const pushText = (s) => { if (s) tokens.push({ type: "text", value: s }); };
      while (remaining.length) {
        const boldIdx = remaining.indexOf("**");
        const italIdx = remaining.indexOf("*");
        if (boldIdx === -1 && italIdx === -1) { pushText(remaining); break; }
        const useBold = boldIdx !== -1 && (italIdx === -1 || boldIdx <= italIdx);
        if (useBold) {
          const start = boldIdx;
          const end = remaining.indexOf("**", start + 2);
          if (end === -1) { pushText(remaining); break; }
          pushText(remaining.slice(0, start));
          tokens.push({ type: "bold", value: remaining.slice(start + 2, end) });
          remaining = remaining.slice(end + 2);
        } else {
          const start = italIdx;
          if (remaining.slice(start, start + 2) === "**") { remaining = remaining.slice(start + 2); continue; }
          const end = remaining.indexOf("*", start + 1);
          if (end === -1) { pushText(remaining); break; }
          pushText(remaining.slice(0, start));
          tokens.push({ type: "italic", value: remaining.slice(start + 1, end) });
          remaining = remaining.slice(end + 1);
        }
      }
      return tokens;
    };
    return lines.map((line) => parseInline(line));
  }, [text]);

  return (
    <p className={className} style={style}>
      {parts.map((lineTokens, i) => (
        <span key={i}>
          {lineTokens.map((t, idx) => {
            if (t.type === "bold") return <strong key={idx}>{t.value}</strong>;
            if (t.type === "italic") return <em key={idx}>{t.value}</em>;
            return <span key={idx}>{t.value}</span>;
          })}
          {i < parts.length - 1 && <br />}
        </span>
      ))}
    </p>
  );
}

export default function Summaries() {
  useEditorial();
  // ✅ Shared auth state — replaces the local getAuthedUser that
  // called supabase.auth.getSession() on its own.
  const { user: authUser, ready: authReady } = useAuth();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [workspaceFiles, setWorkspaceFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showFileSelector, setShowFileSelector] = useState(false);

  const inputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Scroll to latest
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversations, isSearching]);

  // "/" shortcut
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const isTypingField = tag === "input" || tag === "textarea" || e.target?.isContentEditable;
      if (!isTypingField && e.key === "/") { e.preventDefault(); inputRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const getAuthedUser = useCallback(async () => {
    if (!supabaseReady || !supabase) return null;
    if (!authReady) return null;
    return authUser ?? null;
  }, [authReady, authUser?.id]);

  const logActivity = useCallback(async (userId, metadata = {}) => {
    if (!userId) return;
    await logActivityEvent({ userId, eventType: "ai_used", metadata, title: "Insight Explorer query" });
  }, []);

  // Load workspace files (UNCHANGED)
  useEffect(() => {
    let alive = true;
    const loadWorkspace = async () => {
      setFilesLoading(true); setFilesError(null);
      try {
        if (!supabaseReady || !supabase) { if (!alive) return; setWorkspaceFiles([]); setFilesLoading(false); return; }
        const user = await getAuthedUser();
        if (!user?.id) { if (!alive) return; setWorkspaceFiles([]); setFilesLoading(false); return; }
        const docsRes = await supabase.from(DOCS_TABLE).select("id,user_id,name,type,status,created_at,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
        if (docsRes.error) throw docsRes.error;
        const docs = (docsRes.data || []).map((d) => ({ id: `doc:${d.id}`, raw_id: d.id, user_id: d.user_id, name: d.name, type: d.type, status: d.status, source: "documents", created_at: d.created_at, updated_at: d.updated_at }));
        let notes = [];
        const notesRes = await supabase.from(NOTES_TABLE).select("id,user_id,title,created_at,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
        if (!notesRes.error && Array.isArray(notesRes.data)) {
          notes = notesRes.data.map((n) => ({ id: `note:${n.id}`, raw_id: n.id, user_id: n.user_id, name: n.title || "Untitled note", type: "note", source: "notes", created_at: n.created_at, updated_at: n.updated_at }));
        }
        if (!alive) return;
        const merged = [...docs, ...notes];
        setWorkspaceFiles(merged); setFilesLoading(false);
        setSelectedFiles((prev) => prev.filter((sf) => merged.some((f) => f.id === sf.id)));
      } catch (err) {
        if (!alive) return;
        setFilesError(err?.message || "Failed to load workspace files");
        setWorkspaceFiles([]); setFilesLoading(false); setShowFileSelector(false);
      }
    };
    loadWorkspace();
    return () => { alive = false; };
  }, [getAuthedUser]);

  const contextLabel = useMemo(() => {
    if (selectedFiles.length === 0) return "All workspace";
    if (selectedFiles.length === 1) return selectedFiles[0].name;
    return `${selectedFiles.length} files`;
  }, [selectedFiles]);

  const fileIdSet = useMemo(() => new Set(selectedFiles.map((f) => f.id)), [selectedFiles]);
  const toggleFileSelection = useCallback((file) => {
    setSelectedFiles((prev) => { const exists = prev.some((f) => f.id === file.id); return exists ? prev.filter((f) => f.id !== file.id) : [...prev, file]; });
  }, []);
  const clearConversation = () => setConversations([]);
  const handleExampleClick = (question) => { setQuery(question); inputRef.current?.focus(); };

  const runSearch = async (userQuery) => {
    if (!userQuery.trim()) return;
    setIsSearching(true);
    setConversations((prev) => [...prev, { type: "user", content: userQuery, timestamp: new Date() }]);
    let user = null;
    try {
      user = await getAuthedUser();
      if (user?.id) {
        const usageRes = await consumeAiUsage(user.id, "insight_queries", 1);
        if (!usageRes?.success) {
          setConversations((prev) => [...prev, { type: "ai", content: "Daily AI limit reached for your plan. Try again tomorrow or upgrade to Pro.", sources: [], timestamp: new Date() }]);
          return;
        }
      }
      const aiResponse = await queryInsight(userQuery, selectedFiles, conversations);
      setConversations((prev) => [...prev, { type: "ai", content: aiResponse.answer, sources: aiResponse.sources, timestamp: new Date() }]);
      if (user?.id) await logActivity(user.id, { feature: "insight_explorer" });
    } catch (err) {
      console.error("Insight Explorer error:", err);
      setConversations((prev) => [...prev, { type: "ai", content: "Something went wrong while processing your request. Please try again.", sources: [], timestamp: new Date() }]);
    } finally { setIsSearching(false); }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (isSearching || !query.trim()) return;
    const userQuery = query.trim();
    setQuery("");
    await runSearch(userQuery);
  };

  /* ─── Loading ─── */
  if (filesLoading) {
    return (
      <div className="ns-ed">
        <style>{INSIGHT_STYLES}</style>
        <div className="ed-page ns-ins-loading">
          <p className="ed-mono" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint }}>
            Loading the workspace…
          </p>
          <hr className="ns-ins-loading-bar" />
        </div>
      </div>
    );
  }

  const hasConversation = conversations.length > 0;
  const answeredCount = conversations.filter((m) => m.type === "ai").length;

  return (
    <div className="ns-ed">
      <style>{INSIGHT_STYLES}</style>

      <div className="ed-page ns-ins-wrap">

        {/* ── HEADER ── */}
        <header className="ns-ins-head">
          <div>
            <div className="ed-chapter" style={{ marginBottom: 18 }}>
              <span className="num">№ 06</span>
              <span>— The synthesis desk</span>
            </div>
            <h1 className="ed-display ns-ins-title">
              What does the archive{" "}
              <span className="ed-italic" style={{ color: ED.accent }}>say?</span>
            </h1>
            <p className="ed-mono ns-ins-sub">
              {hasConversation ? `${conversations.length / 2 | 0} OPEN INQUIRY${(conversations.length / 2 | 0) === 1 ? "" : "IES"}` : "0 OPEN INQUIRIES"} · {answeredCount} ANSWERED THIS SESSION · CITATIONS ENABLED
            </p>
          </div>
          {hasConversation && (
            <button onClick={clearConversation} className="ed-btn ed-btn-ghost">
              Clear desk <FiTrash2 size={12} />
            </button>
          )}
        </header>

        <hr className="ed-rule-dbl" />

        {/* ── COMPOSER ── */}
        <section className="ns-ins-composer">
          <p className="ed-mono ns-ins-composer-eyebrow">ASK THE ARCHIVE</p>

          <form onSubmit={handleSearch}>
            <input
              ref={inputRef}
              type="text"
              className="ns-ins-composer-input"
              placeholder="What did we decide about the loading rule?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isSearching}
              autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
            />

            <div className="ns-ins-composer-foot">
              {/* Context picker */}
              <div className="ns-ins-context">
                <button
                  type="button"
                  onClick={() => setShowFileSelector((s) => !s)}
                  className="ns-ins-context-btn"
                  disabled={filesLoading}
                >
                  <FiFile size={12} />
                  <span className="ed-mono ns-ins-context-label">CONTEXT:</span>
                  <span className="ns-ins-context-value">{contextLabel}</span>
                  <FiChevronDown size={11} style={{ transform: showFileSelector ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
                </button>

                {selectedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="ns-ins-context-clear ed-mono"
                  >
                    CLEAR
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={!query.trim() || isSearching}
                className="ed-btn ed-btn-primary"
                style={{ opacity: !query.trim() || isSearching ? 0.5 : 1, cursor: !query.trim() || isSearching ? "not-allowed" : "pointer" }}
              >
                {isSearching ? "Asking…" : "Ask"} <FiArrowRight size={13} />
              </button>
            </div>

            {filesError && (
              <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#a3261c", marginTop: 12 }}>
                {filesError}
              </p>
            )}

            {/* Selected file pills */}
            {selectedFiles.length > 0 && (
              <div className="ns-ins-pills">
                {selectedFiles.map((file) => (
                  <span key={file.id} className="ns-ins-pill">
                    <span className="ed-mono ns-ins-pill-type">{typeLabel(file.type)}</span>
                    <span className="ns-ins-pill-name">{file.name}</span>
                    <button type="button" onClick={() => toggleFileSelection(file)} className="ns-ins-pill-close" aria-label="Remove">
                      <FiX size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* File picker */}
            <AnimatePresence>
              {showFileSelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="ns-ins-filepick-wrap"
                >
                  <div className="ns-ins-filepick">
                    {(workspaceFiles || []).length === 0 ? (
                      <p className="ed-serif ed-italic" style={{ padding: 24, textAlign: "center", color: ED.inkMute, fontSize: 16, margin: 0 }}>
                        No files yet. Upload a document or create a note.
                      </p>
                    ) : (
                      <div className="ns-ins-filelist">
                        {(workspaceFiles || []).map((file) => {
                          const selected = fileIdSet.has(file.id);
                          return (
                            <button
                              key={file.id} type="button"
                              onClick={() => toggleFileSelection(file)}
                              className={`ns-ins-fileitem ${selected ? "is-on" : ""}`}
                            >
                              <span className="ed-mono ns-ins-pill-type">{typeLabel(file.type)}</span>
                              <span className="ns-ins-fileitem-name">{file.name}</span>
                              <span className={`ns-ins-fileitem-tick ${selected ? "is-on" : ""}`}>
                                {selected ? "ON" : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </section>

        {/* ── ANSWER / EMPTY ── */}
        <section className="ns-ins-results">
          {!hasConversation ? (
            <div className="ns-ins-empty">
              <div className="ed-chapter" style={{ marginBottom: 16 }}>
                <span className="num">§ 01</span>
                <span>— Try asking</span>
              </div>
              <hr className="ed-rule" />
              {exampleQuestions.map((q, i) => (
                <article
                  key={i}
                  className="ns-ins-suggest"
                  onClick={() => handleExampleClick(q)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") handleExampleClick(q); }}
                >
                  <span className="ord">{String(i + 1).padStart(2, "0")}</span>
                  <p className="title ed-italic">"{q}"</p>
                  <span className="aside">USE →</span>
                </article>
              ))}

              <div className="ns-ins-quickchips">
                <p className="ed-mono ns-ins-quickchips-eye">OR REACH FOR A FAMILIAR ONE</p>
                <div className="ns-ins-quickchips-row">
                  {quickChips.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleExampleClick(`Find ${chip.label.toLowerCase()} across my documents.`)}
                      className="ed-chip ns-ins-quickchip"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="ns-ins-thread">
              {conversations.map((msg, i) => (
                <div key={i} className="ns-ins-msg">
                  {msg.type === "user" ? (
                    <UserMsg msg={msg} />
                  ) : (
                    <AIMsg msg={msg} index={i} />
                  )}
                </div>
              ))}

              {isSearching && (
                <div className="ns-ins-typing">
                  <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint, margin: 0 }}>
                    THE ARCHIVE IS READING…
                  </p>
                  <hr className="ns-ins-typing-bar" />
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MESSAGE BUBBLES — editorial vocabulary
═══════════════════════════════════════════════════════ */

const UserMsg = ({ msg }) => (
  <div className="ns-ins-user">
    <div className="ed-chapter" style={{ marginBottom: 10 }}>
      <span className="num">§</span>
      <span>— YOU ASKED</span>
    </div>
    <RichText
      text={msg.content}
      className="ed-serif ed-italic ns-ins-user-text"
    />
    <p className="ed-mono ns-ins-msg-time">
      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </p>
  </div>
);

const AIMsg = ({ msg, index }) => (
  <div className="ns-ins-ai">
    <div className="ed-chapter" style={{ marginBottom: 10 }}>
      <span className="num">§ {String(index + 1).padStart(2, "0")}</span>
      <span>— THE ANSWER</span>
    </div>

    <RichText
      text={msg.content}
      className="ed-serif ed-dropcap ns-ins-ai-text"
    />

    {msg.sources && msg.sources.length > 0 && (
      <div className="ns-ins-cites">
        <p className="ed-mono ns-ins-cites-eye">CITATIONS</p>
        <hr className="ed-rule" />
        <div className="ns-ins-cites-list">
          {msg.sources.map((source, j) => (
            <div key={j} className="ns-ins-cite">
              <span className="ord">{String(j + 1).padStart(2, "0")}</span>
              <span className="ns-ins-cite-name">{source}</span>
              <span className="aside">OPEN →</span>
            </div>
          ))}
        </div>
      </div>
    )}

    <p className="ed-mono ns-ins-msg-time">
      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </p>
  </div>
);

/* ═══════════════════════════════════════════════════════
   SCOPED STYLES
═══════════════════════════════════════════════════════ */
const INSIGHT_STYLES = `
  .ns-ed .ns-ins-wrap { padding-top: 40px; padding-bottom: 96px; }
  .ns-ed .ns-ins-loading { padding: 80px 32px; display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
  .ns-ed .ns-ins-loading-bar { width: 160px; height: 1px; background: var(--ed-rule); border: 0; margin: 0; animation: ns-ins-pulse 1.4s ease-in-out infinite; }
  @keyframes ns-ins-pulse { 50% { background: var(--ed-accent); } }

  .ns-ed .ns-ins-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 32px; flex-wrap: wrap; }
  .ns-ed .ns-ins-title { font-size: clamp(40px, 5vw, 64px); margin: 0; padding-bottom: 0.06em; }
  .ns-ed .ns-ins-sub { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ed-ink-faint); margin-top: 28px; }

  /* ── COMPOSER ── */
  .ns-ed .ns-ins-composer {
    margin-top: 36px;
    background: var(--ed-paper-50); border: 1px solid var(--ed-rule);
    border-radius: 14px; padding: 28px;
  }
  .ns-ed .ns-ins-composer-eyebrow {
    font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--ed-ink-faint); margin: 0 0 14px 0;
  }
  .ns-ed .ns-ins-composer-input {
    width: 100%; background: transparent; border: 0; outline: 0;
    font-family: var(--ed-serif); font-size: 21px; line-height: 1.5;
    color: var(--ed-ink); padding: 6px 0;
  }
  .ns-ed .ns-ins-composer-input::placeholder {
    color: var(--ed-ink-faint); font-style: italic;
  }
  .ns-ed .ns-ins-composer-foot {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; margin-top: 18px;
    padding-top: 18px; border-top: 1px solid var(--ed-rule-soft);
    flex-wrap: wrap;
  }

  .ns-ed .ns-ins-context { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .ns-ed .ns-ins-context-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 12px; background: transparent;
    border: 1px solid var(--ed-rule); border-radius: 999px;
    color: var(--ed-ink-mute); cursor: pointer;
    font-family: var(--ed-sans); font-size: 13px;
    transition: all .15s ease;
  }
  .ns-ed .ns-ins-context-btn:hover { border-color: var(--ed-ink); color: var(--ed-ink); }
  .ns-ed .ns-ins-context-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ns-ed .ns-ins-context-label { font-size: 10px; letter-spacing: 0.14em; color: var(--ed-ink-faint); }
  .ns-ed .ns-ins-context-value { font-family: var(--ed-serif); font-style: italic; font-size: 14px; color: var(--ed-accent); }
  .ns-ed .ns-ins-context-clear {
    font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase;
    background: transparent; border: 0; color: var(--ed-ink-faint); cursor: pointer;
  }
  .ns-ed .ns-ins-context-clear:hover { color: var(--ed-ink); }

  /* file picker */
  .ns-ed .ns-ins-filepick-wrap { overflow: hidden; }
  .ns-ed .ns-ins-filepick { margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--ed-rule-soft); }
  .ns-ed .ns-ins-filelist {
    display: grid; gap: 4px; max-height: 240px; overflow-y: auto;
    padding-right: 4px;
  }
  .ns-ed .ns-ins-fileitem {
    display: grid; grid-template-columns: 60px 1fr 56px;
    gap: 12px; align-items: center; padding: 10px 12px;
    background: transparent; border: 1px solid transparent; border-radius: 8px;
    cursor: pointer; transition: all .12s ease; text-align: left;
  }
  .ns-ed .ns-ins-fileitem:hover { background: var(--ed-paper-100); border-color: var(--ed-rule); }
  .ns-ed .ns-ins-fileitem.is-on { background: var(--ed-paper-150); border-color: var(--ed-ink); }
  .ns-ed .ns-ins-fileitem-name {
    font-family: var(--ed-serif); font-size: 16px; color: var(--ed-ink);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ns-ed .ns-ins-fileitem-tick {
    font-family: var(--ed-mono); font-size: 10px; letter-spacing: 0.14em;
    color: var(--ed-accent); text-align: right;
  }

  /* selected pills */
  .ns-ed .ns-ins-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
  .ns-ed .ns-ins-pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 4px 4px 4px 10px; border-radius: 999px;
    border: 1px solid var(--ed-rule); background: var(--ed-paper-100);
    font-family: var(--ed-sans); font-size: 12px; color: var(--ed-ink);
    max-width: 240px;
  }
  .ns-ed .ns-ins-pill-type {
    font-size: 9.5px; letter-spacing: 0.14em; color: var(--ed-ink-faint);
  }
  .ns-ed .ns-ins-pill-name {
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ns-ed .ns-ins-pill-close {
    width: 18px; height: 18px; border-radius: 999px;
    background: transparent; border: 0; color: var(--ed-ink-faint);
    cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  }
  .ns-ed .ns-ins-pill-close:hover { color: var(--ed-ink); background: var(--ed-paper-200); }

  /* ── RESULTS ── */
  .ns-ed .ns-ins-results { margin-top: 56px; }
  .ns-ed .ns-ins-empty { padding: 0; }
  .ns-ed .ns-ins-suggest {
    display: grid; grid-template-columns: 56px 1fr minmax(0, 80px);
    gap: 18px; padding: 22px 14px; border-bottom: 1px solid var(--ed-rule-soft);
    align-items: center; cursor: pointer; transition: background-color .12s, padding .12s;
  }
  .ns-ed .ns-ins-suggest:hover { background: var(--ed-paper-150); padding-left: 18px; }
  .ns-ed .ns-ins-suggest .ord {
    font-family: var(--ed-mono); font-size: 11px; letter-spacing: 0.14em;
    color: var(--ed-ink-faint); transition: all .15s ease;
  }
  .ns-ed .ns-ins-suggest:hover .ord { color: var(--ed-accent); font-family: var(--ed-serif); font-style: italic; font-size: 17px; }
  .ns-ed .ns-ins-suggest .title {
    font-family: var(--ed-serif); font-size: clamp(18px, 1.5vw, 22px);
    color: var(--ed-ink); margin: 0; line-height: 1.3;
  }
  .ns-ed .ns-ins-suggest .aside {
    font-family: var(--ed-mono); font-size: 10.5px; letter-spacing: 0.14em;
    color: var(--ed-ink-faint); text-align: right;
  }

  .ns-ed .ns-ins-quickchips { margin-top: 48px; }
  .ns-ed .ns-ins-quickchips-eye {
    font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--ed-ink-faint); margin: 0 0 14px 0;
  }
  .ns-ed .ns-ins-quickchips-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .ns-ed .ns-ins-quickchip {
    cursor: pointer; transition: all .15s ease;
  }
  .ns-ed .ns-ins-quickchip:hover {
    background: var(--ed-ink); color: var(--ed-paper-50); border-color: var(--ed-ink);
  }

  /* ── THREAD ── */
  .ns-ed .ns-ins-thread { display: flex; flex-direction: column; gap: 48px; }
  .ns-ed .ns-ins-msg { animation: ns-ins-fadeup 0.4s cubic-bezier(.22,1,.36,1) both; }
  @keyframes ns-ins-fadeup { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

  .ns-ed .ns-ins-user {
    padding: 24px; border-left: 3px solid var(--ed-accent);
    background: var(--ed-paper-50); border-radius: 0 14px 14px 0;
  }
  .ns-ed .ns-ins-user-text {
    font-size: 20px; line-height: 1.45; color: var(--ed-ink-soft);
    margin: 0; max-width: 720px;
  }
  .ns-ed .ns-ins-msg-time {
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--ed-ink-faint); margin: 14px 0 0 0;
  }

  .ns-ed .ns-ins-ai { padding: 0 4px; }
  .ns-ed .ns-ins-ai-text {
    font-size: 18px; line-height: 1.6; color: var(--ed-ink);
    margin: 0; max-width: 720px;
  }

  .ns-ed .ns-ins-cites { margin-top: 28px; }
  .ns-ed .ns-ins-cites-eye {
    font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--ed-ink-faint); margin: 0 0 8px 0;
  }
  .ns-ed .ns-ins-cites-list { margin-top: 8px; }
  .ns-ed .ns-ins-cite {
    display: grid; grid-template-columns: 40px 1fr minmax(0, 80px);
    gap: 12px; align-items: baseline; padding: 12px 0;
    border-bottom: 1px solid var(--ed-rule-soft);
  }
  .ns-ed .ns-ins-cite .ord {
    font-family: var(--ed-mono); font-size: 10.5px; letter-spacing: 0.14em;
    color: var(--ed-ink-faint);
  }
  .ns-ed .ns-ins-cite-name {
    font-family: var(--ed-serif); font-size: 16px; color: var(--ed-ink-soft);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ns-ed .ns-ins-cite .aside {
    font-family: var(--ed-mono); font-size: 10px; letter-spacing: 0.14em;
    color: var(--ed-ink-faint); text-align: right;
  }

  .ns-ed .ns-ins-typing { padding: 16px 0; }
  .ns-ed .ns-ins-typing-bar {
    width: 220px; height: 1px; background: var(--ed-rule); border: 0; margin: 12px 0 0 0;
    animation: ns-ins-pulse 1.2s ease-in-out infinite;
  }

  @media (max-width: 720px) {
    .ns-ed .ns-ins-composer { padding: 20px; }
    .ns-ed .ns-ins-composer-input { font-size: 18px; }
    .ns-ed .ns-ins-composer-foot { flex-direction: column; align-items: stretch; }
    .ns-ed .ns-ins-suggest { grid-template-columns: 32px 1fr; padding: 14px 8px; }
    .ns-ed .ns-ins-suggest .aside { display: none; }
    .ns-ed .ns-ins-cite { grid-template-columns: 32px 1fr; }
    .ns-ed .ns-ins-cite .aside { display: none; }
  }
`;