// src/pages/Summaries.jsx — "Insight Explorer"
// ═══════════════════════════════════════════════════════════════════
// REDESIGNED: Matching bento-glass visual system from Dashboard/Notes.
// All Supabase / AI / conversation logic is UNCHANGED.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  FiSend,
  FiFile,
  FiSearch,
  FiTrash2,
  FiX,
  FiChevronDown,
  FiZap,
  FiMessageCircle,
  FiCpu,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightning,
  MagnifyingGlass,
  Sparkle,
  FileText,
  Note,
  Brain,
} from "phosphor-react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { consumeAiUsage } from "../lib/usage";
import { queryInsight } from "../lib/insightAI";

const DOCS_TABLE = "documents";
const NOTES_TABLE = "notes";
const EVENTS_TABLE = "activity_events";

const exampleQuestions = [
  "What were the key action items from last week's meeting?",
  "Summarize the main points from my research notes",
  "What deadlines are mentioned across my documents?",
  "Find all mentions of budget or costs",
];

const quickChips = [
  { label: "Action items", icon: <Lightning size={12} weight="fill" /> },
  { label: "Deadlines", icon: <Sparkle size={12} weight="fill" /> },
  { label: "Budget", icon: <FileText size={12} weight="duotone" /> },
  { label: "Key risks", icon: <Brain size={12} weight="duotone" /> },
];

const typeLabel = (t) => {
  switch (String(t || "").toLowerCase()) {
    case "pdf": return "PDF";
    case "doc": case "docx": return "Doc";
    case "video": case "mp4": return "Video";
    case "note": return "Note";
    case "spreadsheet": case "xls": case "xlsx": return "Sheet";
    default: return "File";
  }
};

/* ─── scoped styles ─── */
const INSIGHT_STYLES = `
@keyframes ns-insight-fade-up {
  0%   { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes ns-insight-pulse {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 1; }
}
@keyframes ns-typing-dot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}

.ns-insight-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: var(--card-glass-bg, var(--bg-surface));
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--card-glass-border, var(--border-secondary));
  box-shadow: var(--card-glass-shadow, 0 8px 32px rgba(0,0,0,0.12));
}
.ns-insight-card::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%);
  pointer-events: none; z-index: 1;
}
.ns-insight-card::after {
  content: '';
  position: absolute;
  left: 24px; right: 24px; top: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
  pointer-events: none; z-index: 2;
}

.ns-search-bar-glow:focus-within {
  border-color: rgba(99,102,241,0.5) !important;
  box-shadow: 0 0 24px rgba(99,102,241,0.12), 0 8px 32px rgba(0,0,0,0.15) !important;
}

.ns-msg-enter {
  animation: ns-insight-fade-up 0.35s cubic-bezier(.22,1,.36,1) both;
}

.ns-typing-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(99,102,241,0.6);
  animation: ns-typing-dot 1.4s ease-in-out infinite;
}
.ns-typing-dot:nth-child(2) { animation-delay: 0.2s; }
.ns-typing-dot:nth-child(3) { animation-delay: 0.4s; }

.ns-scroll::-webkit-scrollbar { width: 4px; }
.ns-scroll::-webkit-scrollbar-track { background: transparent; }
.ns-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }

.ns-example-btn {
  transition: all 0.2s ease;
}
.ns-example-btn:hover {
  border-color: rgba(99,102,241,0.35) !important;
  background-color: rgba(99,102,241,0.06) !important;
  transform: translateX(4px);
}
`;

/**
 * Minimal inline formatter for **bold** and *italic*
 */
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

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function Summaries() {
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

  const supabaseReady = typeof isSupabaseConfigured === "function" ? isSupabaseConfigured() : !!isSupabaseConfigured;

  // Scroll to latest
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, isSearching]);

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
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session?.user ?? null;
  }, [supabaseReady]);

  const logActivity = useCallback(async (userId, metadata = {}) => {
    if (!supabaseReady || !supabase || !userId) return;
    try { await supabase.from(EVENTS_TABLE).insert({ user_id: userId, event_type: "ai_used", entity_id: null, metadata, title: "Insight Explorer query" }); } catch {}
  }, [supabaseReady]);

  // Load workspace files
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
  }, [supabaseReady, getAuthedUser]);

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
      <>
        <style>{INSIGHT_STYLES}</style>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full" style={{ border: "2.5px solid transparent", borderTopColor: "rgba(99,102,241,0.8)", borderRightColor: "rgba(168,85,247,0.4)", animation: "spin 0.8s linear infinite" }} />
            <div className="absolute inset-2 rounded-full" style={{ border: "2px solid transparent", borderBottomColor: "rgba(6,182,212,0.6)", animation: "spin 1.2s linear infinite reverse" }} />
            <FiZap size={18} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading workspace…</p>
        </div>
      </>
    );
  }

  const hasConversation = conversations.length > 0;

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <>
      <style>{INSIGHT_STYLES}</style>

      <div className="space-y-5 pb-[calc(var(--mobile-nav-height)+100px)] md:pb-[120px]">

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            HEADER
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(6,182,212,0.12))",
                border: "1px solid rgba(99,102,241,0.28)",
              }}
            >
              <FiZap size={20} className="text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Insight Explorer
              </h1>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                AI-powered search across your workspace
              </p>
            </div>
          </div>

          {/* Conversation count + clear */}
          {hasConversation && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearConversation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition"
              style={{
                background: "rgba(244,63,94,0.08)",
                border: "1px solid rgba(244,63,94,0.2)",
                color: "#f43f5e",
              }}
            >
              <FiTrash2 size={12} />
              Clear
            </motion.button>
          )}
        </motion.header>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            FILE CONTEXT SELECTOR
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <div className="ns-insight-card">
            <div className="relative z-10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}
                  >
                    <FiFile size={14} />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>Context:</span>
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg truncate"
                      style={{
                        background: selectedFiles.length > 0 ? "rgba(99,102,241,0.1)" : "var(--bg-tertiary)",
                        border: `1px solid ${selectedFiles.length > 0 ? "rgba(99,102,241,0.25)" : "var(--border-secondary)"}`,
                        color: selectedFiles.length > 0 ? "#818cf8" : "var(--text-secondary)",
                      }}
                    >
                      {contextLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedFiles.length > 0 && (
                    <button type="button" onClick={() => setSelectedFiles([])}
                      className="text-[11px] font-medium transition" style={{ color: "var(--text-muted)" }}>
                      Clear
                    </button>
                  )}
                  <button type="button" onClick={() => setShowFileSelector((s) => !s)}
                    className="text-[11px] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition disabled:opacity-60"
                    style={{ color: "#818cf8", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
                    disabled={filesLoading}>
                    Select
                    <FiChevronDown size={12} className={`${showFileSelector ? "rotate-180" : ""} transition-transform`} />
                  </button>
                </div>
              </div>

              {filesError && (
                <p className="text-[11px] mt-2" style={{ color: "#f43f5e" }}>{filesError}</p>
              )}

              {/* Selected file pills */}
              {selectedFiles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedFiles.map((file) => (
                    <span key={file.id}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                      style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "var(--text-secondary)" }}>
                      <span className="truncate max-w-[130px]">{file.name}</span>
                      <button type="button" onClick={() => toggleFileSelection(file)}
                        className="transition" style={{ color: "var(--text-muted)" }} aria-label="Remove file">
                        <FiX size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* File selector dropdown */}
              <AnimatePresence>
                {showFileSelector && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 pt-3 border-t overflow-hidden"
                    style={{ borderColor: "var(--border-secondary)" }}
                  >
                    {(workspaceFiles || []).length === 0 ? (
                      <div className="text-[12px] rounded-xl border p-4 text-center"
                        style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)", color: "var(--text-muted)" }}>
                        No files yet. Upload a document or create a note.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-1.5 max-h-[200px] overflow-y-auto ns-scroll">
                        {(workspaceFiles || []).map((file) => {
                          const selected = fileIdSet.has(file.id);
                          return (
                            <button key={file.id} type="button" onClick={() => toggleFileSelection(file)}
                              className="text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between gap-2"
                              style={{
                                background: selected ? "rgba(99,102,241,0.1)" : "var(--bg-input)",
                                border: `1px solid ${selected ? "rgba(99,102,241,0.3)" : "var(--border-secondary)"}`,
                              }}>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md tracking-wide"
                                  style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-muted)" }}>
                                  {typeLabel(file.type)}
                                </span>
                                <span className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{file.name}</span>
                              </div>
                              <div className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0"
                                style={{ borderColor: selected ? "rgba(99,102,241,0.5)" : "var(--border-secondary)", background: selected ? "rgba(99,102,241,0.2)" : "transparent" }}>
                                {selected && <div className="w-2 h-2 rounded-full" style={{ background: "#818cf8" }} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            CONVERSATION / EMPTY STATE
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="min-h-[280px]"
        >
          {!hasConversation ? (
            /* ── Empty state ── */
            <div className="ns-insight-card">
              <div className="relative z-10 p-6">
                {/* Hero */}
                <div className="text-center mb-6">
                  <div
                    className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))",
                      border: "1px solid rgba(99,102,241,0.25)",
                      boxShadow: "0 0 20px rgba(99,102,241,0.1)",
                    }}
                  >
                    <MagnifyingGlass size={24} weight="duotone" className="text-indigo-400" />
                  </div>
                  <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                    Ask anything about your workspace
                  </h3>
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                    Search documents, notes, and files with AI
                  </p>
                </div>

                {/* Quick chips */}
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {quickChips.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleExampleClick(`Find ${chip.label.toLowerCase()} across my documents`)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold px-3.5 py-2 rounded-xl transition"
                      style={{
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-secondary)",
                        color: "var(--text-secondary)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)"; e.currentTarget.style.background = "rgba(99,102,241,0.06)"; e.currentTarget.style.color = "#818cf8"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; e.currentTarget.style.background = "var(--bg-tertiary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                    >
                      {chip.icon}
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Example questions */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "var(--text-muted)" }}>
                    Try asking
                  </p>
                  <div className="space-y-1.5">
                    {exampleQuestions.map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleExampleClick(q)}
                        className="ns-example-btn w-full text-left text-[13px] rounded-xl px-4 py-3 flex items-center gap-3"
                        style={{
                          background: "var(--bg-input)",
                          border: "1px solid var(--border-secondary)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <FiMessageCircle size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        <span className="truncate">"{q}"</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── Conversation ── */
            <div className="space-y-3">
              {conversations.map((msg, i) => (
                <div key={i} className="ns-msg-enter" style={{ animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}>
                  {msg.type === "user" ? (
                    <UserBubble msg={msg} />
                  ) : (
                    <AIBubble msg={msg} />
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isSearching && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="ns-insight-card max-w-[90%]"
                >
                  <div className="relative z-10 p-4 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(99,102,241,0.12)" }}>
                      <FiCpu size={14} className="text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="ns-typing-dot" />
                      <div className="ns-typing-dot" />
                      <div className="ns-typing-dot" />
                    </div>
                    <span className="text-[11px] ml-1" style={{ color: "var(--text-muted)" }}>Thinking…</span>
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SEARCH BAR (fixed bottom, mobile-aware)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div
          className="fixed inset-x-0 z-40 md:bottom-4"
          style={{
            bottom: "var(--mobile-nav-height, 0px)",
          }}
        >
          {/* Gradient fade backdrop — blends chat into the bar */}
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: "80px",
              background: "linear-gradient(to top, var(--bg-primary, #0a0a0e) 40%, transparent)",
            }}
          />

          <div className="relative max-w-2xl w-full mx-auto px-4 pb-3 pt-2 md:pb-0 md:pt-0">
            <form onSubmit={handleSearch}>
              <div
                className="ns-search-bar-glow flex items-center w-full rounded-2xl px-4 py-3 transition-all duration-200"
                style={{
                  background: "var(--card-glass-bg, var(--bg-surface))",
                  backdropFilter: "blur(40px) saturate(180%)",
                  WebkitBackdropFilter: "blur(40px) saturate(180%)",
                  border: `1px solid ${query ? "rgba(99,102,241,0.5)" : "var(--card-glass-border, var(--border-secondary))"}`,
                  boxShadow: query
                    ? "0 0 24px rgba(99,102,241,0.12), 0 -4px 24px rgba(0,0,0,0.2)"
                    : "0 -4px 24px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.15)",
                }}
              >
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
                  style={{
                    background: query ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)",
                    transition: "background 0.2s ease",
                  }}
                >
                  <FiSearch
                    size={16}
                    style={{ color: query ? "#818cf8" : "var(--text-muted)", transition: "color 0.2s ease" }}
                  />
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about your workspace..."
                  className="flex-1 bg-transparent outline-none min-w-0"
                  style={{ color: "var(--text-primary)", fontSize: "15px", lineHeight: "1.5" }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isSearching}
                  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                />

                {query.trim() && !isSearching && (
                  <button type="button"
                    onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                    className="p-1.5 rounded-full transition mr-1.5" style={{ color: "var(--text-muted)" }}
                    aria-label="Clear query">
                    <FiX size={15} />
                  </button>
                )}

                <button type="submit" disabled={!query.trim() || isSearching}
                  className="h-9 w-9 rounded-xl transition-all flex-shrink-0 flex items-center justify-center disabled:opacity-40"
                  style={{
                    background: query.trim() && !isSearching
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "rgba(255,255,255,0.04)",
                    border: query.trim() && !isSearching
                      ? "1px solid rgba(99,102,241,0.4)"
                      : "1px solid var(--border-secondary)",
                    color: query.trim() && !isSearching ? "#fff" : "var(--text-muted)",
                    boxShadow: query.trim() && !isSearching ? "0 4px 16px rgba(99,102,241,0.3)" : "none",
                  }}
                  aria-label="Send">
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiSend size={14} />
                  )}
                </button>
              </div>

              <p className="text-center text-[10px] mt-1.5 hidden md:block" style={{ color: "var(--text-muted)", opacity: 0.4 }}>
                Press{" "}
                <kbd className="px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                  style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-secondary)" }}>
                  /
                </kbd>{" "}
                to focus
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}


/* ═══════════════════════════════════════════════════════
   MESSAGE BUBBLES
═══════════════════════════════════════════════════════ */

const UserBubble = ({ msg }) => (
  <div className="flex justify-end">
    <div
      className="rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%]"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.08))",
        border: "1px solid rgba(99,102,241,0.25)",
      }}
    >
      <RichText
        text={msg.content}
        className="text-[13px] leading-relaxed whitespace-pre-wrap"
        style={{ color: "var(--text-primary)" }}
      />
      <p className="text-[10px] mt-1.5 text-right" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  </div>
);

const AIBubble = ({ msg }) => (
  <div className="ns-insight-card max-w-[95%]">
    <div className="relative z-10 p-4">
      <div className="flex items-start gap-3">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))",
            border: "1px solid rgba(99,102,241,0.25)",
          }}
        >
          <FiZap size={14} className="text-indigo-400" />
        </div>

        <div className="flex-1 min-w-0">
          <RichText
            text={msg.content}
            className="text-[13px] leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          />

          {/* Sources */}
          {msg.sources && msg.sources.length > 0 && (
            <div className="mt-3 pt-2.5 border-t" style={{ borderColor: "var(--border-secondary)" }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                Sources
              </p>
              <div className="flex flex-wrap gap-1.5">
                {msg.sources.map((source, j) => (
                  <span key={j}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-lg"
                    style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-muted)" }}>
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] mt-2" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </div>
  </div>
);











