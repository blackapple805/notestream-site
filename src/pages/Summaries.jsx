// src/pages/Summaries.jsx - "Insight Explorer"

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiSend,
  FiFile,
  FiSearch,
  FiZap,
  FiTrash2,
  FiX,
  FiChevronDown,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const DOCS_TABLE = "documents";
const NOTES_TABLE = "notes";
const USER_STATS_TABLE = "user_engagement_stats";
const EVENTS_TABLE = "activity_events";

const nowIso = () => new Date().toISOString();

// Example prompts
const exampleQuestions = [
  "What were the key action items from last week's meeting?",
  "Summarize the main points from my research notes",
  "What deadlines are mentioned across my documents?",
  "Find all mentions of budget or costs",
];

const typeLabel = (t) => {
  switch (String(t || "").toLowerCase()) {
    case "pdf":
      return "PDF";
    case "doc":
    case "docx":
      return "Doc";
    case "video":
    case "mp4":
      return "Video";
    case "note":
      return "Note";
    case "spreadsheet":
    case "xls":
    case "xlsx":
      return "Sheet";
    default:
      return "File";
  }
};

// Local day helpers
const toLocalYMD = (d = new Date()) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const parseYMDToDate = (ymd) => {
  const [y, m, d] = String(ymd || "").split("-").map((n) => Number(n));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const diffDaysLocal = (aYmd, bYmd) => {
  const a = parseYMDToDate(aYmd);
  const b = parseYMDToDate(bYmd);
  if (!a || !b) return null;
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
};

/**
 * Minimal inline formatter for **bold** and *italic*
 */
function RichText({ text, className = "" }) {
  const parts = useMemo(() => {
    if (!text) return [];
    const lines = String(text).split("\n");

    const parseInline = (line) => {
      const tokens = [];
      let remaining = line;

      const pushText = (s) => {
        if (s) tokens.push({ type: "text", value: s });
      };

      while (remaining.length) {
        const boldIdx = remaining.indexOf("**");
        const italIdx = remaining.indexOf("*");

        if (boldIdx === -1 && italIdx === -1) {
          pushText(remaining);
          break;
        }

        const useBold = boldIdx !== -1 && (italIdx === -1 || boldIdx <= italIdx);

        if (useBold) {
          const start = boldIdx;
          const end = remaining.indexOf("**", start + 2);
          if (end === -1) {
            pushText(remaining);
            break;
          }
          pushText(remaining.slice(0, start));
          tokens.push({ type: "bold", value: remaining.slice(start + 2, end) });
          remaining = remaining.slice(end + 2);
        } else {
          const start = italIdx;
          if (remaining.slice(start, start + 2) === "**") {
            remaining = remaining.slice(start + 2);
            continue;
          }
          const end = remaining.indexOf("*", start + 1);
          if (end === -1) {
            pushText(remaining);
            break;
          }
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
    <p className={className}>
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

  const supabaseReady =
    typeof isSupabaseConfigured === "function" ? isSupabaseConfigured() : !!isSupabaseConfigured;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, isSearching]);

  // Keyboard shortcut: "/" focuses search
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const isTypingField = tag === "input" || tag === "textarea" || e.target?.isContentEditable;
      if (!isTypingField && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const getAuthedUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data?.user ?? null;
  };

  // Ensures a stats row exists WITHOUT overwriting existing counts.
  // Your table has NOT NULL columns (notes_created, created_at, updated_at), so we must include them on insert.
  const ensureUserStatsRow = async (userId) => {
    const { data: existing, error: selErr } = await supabase
      .from(USER_STATS_TABLE)
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (selErr) throw selErr;
    if (existing?.user_id) return;

    const { error: insErr } = await supabase.from(USER_STATS_TABLE).insert({
      user_id: userId,
      display_name: null,
      notes_created: 0,
      ai_uses: 0,
      active_days: 0,
      streak_days: 0,
      last_active_date: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    });

    // If two tabs race and one inserts first, ignore conflict.
    if (insErr && !String(insErr.message || "").toLowerCase().includes("duplicate")) {
      throw insErr;
    }
  };

  // Load workspace context from Supabase (documents + optional notes)
  useEffect(() => {
    let alive = true;

    const loadWorkspace = async () => {
      setFilesLoading(true);
      setFilesError(null);

      try {
        if (!supabaseReady || !supabase) {
          if (!alive) return;
          setWorkspaceFiles([]);
          setFilesLoading(false);
          return;
        }

        const user = await getAuthedUser();

        if (!user?.id) {
          if (!alive) return;
          setWorkspaceFiles([]);
          setFilesLoading(false);
          return;
        }

        const docsRes = await supabase
          .from(DOCS_TABLE)
          .select("id,user_id,name,type,status,created_at,updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (docsRes.error) throw docsRes.error;

        const docs = (docsRes.data || []).map((d) => ({
          id: `doc:${d.id}`,
          raw_id: d.id,
          user_id: d.user_id,
          name: d.name,
          type: d.type,
          status: d.status,
          source: "documents",
          created_at: d.created_at,
          updated_at: d.updated_at,
        }));

        // Optional notes as context items (only user-owned)
        let notes = [];
        const notesRes = await supabase
          .from(NOTES_TABLE)
          .select("id,user_id,title,created_at,updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (!notesRes.error && Array.isArray(notesRes.data)) {
          notes = notesRes.data.map((n) => ({
            id: `note:${n.id}`,
            raw_id: n.id,
            user_id: n.user_id,
            name: n.title || "Untitled note",
            type: "note",
            source: "notes",
            created_at: n.created_at,
            updated_at: n.updated_at,
          }));
        }

        if (!alive) return;
        setWorkspaceFiles([...docs, ...notes]);
        setFilesLoading(false);
      } catch (err) {
        if (!alive) return;
        setFilesError(err?.message || "Failed to load workspace files");
        setWorkspaceFiles([]);
        setFilesLoading(false);
      }
    };

    loadWorkspace();
    return () => {
      alive = false;
    };
  }, [supabaseReady]); // intentional: keep simple + stable

  const contextLabel = useMemo(() => {
    if (selectedFiles.length === 0) return "All workspace files";
    if (selectedFiles.length === 1) return selectedFiles[0].name;
    return `${selectedFiles.length} files selected`;
  }, [selectedFiles]);

  const fileIdSet = useMemo(() => new Set(selectedFiles.map((f) => f.id)), [selectedFiles]);

  const toggleFileSelection = (file) => {
    setSelectedFiles((prev) =>
      prev.find((f) => f.id === file.id) ? prev.filter((f) => f.id !== file.id) : [...prev, file]
    );
  };

  const clearConversation = () => setConversations([]);

  const handleExampleClick = (question) => {
    setQuery(question);
    inputRef.current?.focus();
  };

  const generateMockResponse = (q, files) => {
    const lowerQuery = q.toLowerCase();
    const pickedSources = files?.length > 0 ? files.map((f) => f.name) : ["Multiple files"];

    if (lowerQuery.includes("meeting") || lowerQuery.includes("action")) {
      return {
        answer:
          "Based on your workspace, here are the key action items:\n\n• **Complete UI mockups** - Due Friday\n• **Review budget proposal** - Pending Sarah's input\n• **Schedule follow-up** with design team\n• **Update project timeline** in shared doc",
        sources: pickedSources.slice(0, 2),
      };
    }

    if (lowerQuery.includes("deadline") || lowerQuery.includes("due")) {
      return {
        answer:
          "I found the following deadlines across your workspace:\n\n• **Jan 15** - Q1 Budget review\n• **Jan 20** - UI mockups delivery\n• **Feb 01** - Project milestone 1\n• **Feb 15** - Research presentation",
        sources: pickedSources.slice(0, 2),
      };
    }

    if (lowerQuery.includes("budget") || lowerQuery.includes("cost")) {
      return {
        answer:
          "Here's a summary of budget-related information:\n\n• **Total Q1 Budget**: $45,000\n• **Spent to date**: $12,500 (28%)\n• **Largest expense**: Software licenses ($5,200)\n• **Pending approvals**: $3,800",
        sources: pickedSources.slice(0, 2),
      };
    }

    if (lowerQuery.includes("research") || lowerQuery.includes("notes")) {
      return {
        answer:
          "From your workspace notes, the main points are:\n\n• **Key finding**: User engagement increased 40% with new UI\n• **Recommendation**: Implement progressive onboarding\n• **Next steps**: A/B testing scheduled for next sprint\n• **Resources needed**: 2 additional developers",
        sources: pickedSources.slice(0, 2),
      };
    }

    return {
      answer:
        "I searched across your workspace and found relevant information.\n\n• Your query relates to multiple items\n• I found **3 relevant mentions** across your workspace\n• Tell me which file you want to drill into, or ask for a tighter summary",
      sources: pickedSources,
    };
  };

  const trackAiUse = async () => {
    if (!supabaseReady || !supabase) return;

    try {
      const user = await getAuthedUser();
      if (!user?.id) return;

      // Ensure stats row exists (prevents insert failures on NOT NULL columns)
      await ensureUserStatsRow(user.id);

      // Optional activity event (safe if table missing / RLS blocks it)
      try {
        await supabase.from(EVENTS_TABLE).insert({
          user_id: user.id,
          type: "ai_used",
          entity_id: null,
          meta: { feature: "insight_explorer" },
        });
      } catch {}

      const today = toLocalYMD();

      const { data: row, error: rowErr } = await supabase
        .from(USER_STATS_TABLE)
        .select("user_id,ai_uses,active_days,streak_days,last_active_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (rowErr || !row) return;

      const prevYmd = row.last_active_date;
      const delta = prevYmd ? diffDaysLocal(prevYmd, today) : null;

      const nextAiUses = Number(row.ai_uses ?? 0) + 1;

      const nextActiveDays =
        delta === null
          ? Number(row.active_days ?? 0) + 1
          : delta >= 1
          ? Number(row.active_days ?? 0) + 1
          : Number(row.active_days ?? 0);

      const nextStreak =
        delta === 0
          ? Number(row.streak_days ?? 0)
          : delta === 1
          ? Number(row.streak_days ?? 0) + 1
          : 1;

      await supabase
        .from(USER_STATS_TABLE)
        .update({
          ai_uses: nextAiUses,
          active_days: nextActiveDays,
          streak_days: nextStreak,
          last_active_date: today,
          updated_at: nowIso(),
        })
        .eq("user_id", user.id);

      // DB-only (no localStorage). Keep this if other UI listens for it.
      try {
        window.dispatchEvent(
          new CustomEvent("notestream:ai_uses_updated", {
            detail: { aiUses: nextAiUses },
          })
        );
      } catch {}
    } catch {
      // silent fail
    }
  };

  const runSearch = async (userQuery) => {
    if (!userQuery.trim()) return;

    setIsSearching(true);
    setConversations((prev) => [...prev, { type: "user", content: userQuery, timestamp: new Date() }]);

    await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));

    const aiResponse = generateMockResponse(userQuery, selectedFiles);

    setConversations((prev) => [
      ...prev,
      { type: "ai", content: aiResponse.answer, sources: aiResponse.sources, timestamp: new Date() },
    ]);

    await trackAiUse();
    setIsSearching(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (isSearching || !query.trim()) return;

    const userQuery = query.trim();
    setQuery("");
    await runSearch(userQuery);
  };

  // ✅ Reuse the exact same loader used in Notes.jsx (page-open load)
  if (filesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+140px)] animate-fadeIn">
      {/* Header */}
      <header className="page-header">
        <div className="page-header-content">
          <div className="page-header-icon">
            <FiZap />
          </div>
          <div>
            <h1 className="page-header-title">Insight Explorer</h1>
            <p className="page-header-subtitle">Ask questions across your workspace. AI-powered search and analysis.</p>
          </div>
        </div>
      </header>

      {/* File Context Card */}
      <GlassCard>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <FiFile className="text-indigo-400" size={16} />
            <span className="text-sm text-theme-secondary">Search context:</span>
            <span
              className="text-xs px-2 py-1 rounded-full border"
              style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
            >
              {contextLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedFiles.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-xs text-theme-muted hover:text-theme-secondary px-2 py-1 rounded-full border transition"
                style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFileSelector((s) => !s)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-3 py-1.5 rounded-full border transition"
              style={{ backgroundColor: "rgba(99, 102, 241, 0.1)", borderColor: "rgba(99, 102, 241, 0.25)" }}
              disabled={filesLoading}
              title={filesLoading ? "Loading…" : "Select files"}
            >
              Select files
              <FiChevronDown size={12} className={`${showFileSelector ? "rotate-180" : ""} transition`} />
            </button>
          </div>
        </div>

        {filesError && (
          <p className="text-[11px] mt-3" style={{ color: "var(--text-muted)" }}>
            {filesError}
          </p>
        )}

        {/* Selected file pills */}
        {selectedFiles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedFiles.map((file) => (
              <span
                key={file.id}
                className="text-xs px-3 py-1.5 rounded-full border flex items-center gap-2"
                style={{
                  backgroundColor: "rgba(99, 102, 241, 0.1)",
                  borderColor: "rgba(99, 102, 241, 0.25)",
                  color: "rgb(165, 180, 252)",
                }}
              >
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full border"
                  style={{ backgroundColor: "rgba(99, 102, 241, 0.15)", borderColor: "rgba(99, 102, 241, 0.3)" }}
                >
                  {typeLabel(file.type)}
                </span>
                <span className="truncate max-w-[180px]">{file.name}</span>
                <button type="button" onClick={() => toggleFileSelection(file)} className="hover:text-white">
                  <FiX size={12} />
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
              className="mt-4 pt-4 border-t overflow-hidden"
              style={{ borderColor: "var(--border-secondary)" }}
            >
              {(workspaceFiles || []).length === 0 ? (
                <div
                  className="text-xs rounded-xl border p-3"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border-secondary)",
                    color: "var(--text-muted)",
                  }}
                >
                  No files found yet. Upload a document or create a note to see it here.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(workspaceFiles || []).map((file) => {
                    const selected = fileIdSet.has(file.id);
                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => toggleFileSelection(file)}
                        className="text-left px-3 py-3 rounded-xl border transition flex items-center justify-between gap-3"
                        style={{
                          backgroundColor: selected ? "rgba(99, 102, 241, 0.1)" : "var(--bg-input)",
                          borderColor: selected ? "rgba(99, 102, 241, 0.3)" : "var(--border-secondary)",
                        }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full border"
                              style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
                            >
                              {typeLabel(file.type)}
                            </span>
                            <span className="text-sm text-theme-primary truncate">{file.name}</span>
                          </div>
                          {file.source && (
                            <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                              {file.source === "documents" ? "Document" : "Note"}
                            </p>
                          )}
                        </div>
                        <div
                          className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0"
                          style={{
                            borderColor: selected ? "rgba(99, 102, 241, 0.4)" : "var(--border-secondary)",
                            backgroundColor: selected ? "rgba(99, 102, 241, 0.2)" : "var(--bg-tertiary)",
                          }}
                        >
                          {selected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Conversation Area */}
      <div className="min-h-[300px]">
        {conversations.length === 0 ? (
          <GlassCard>
            <div className="text-center mb-6">
              <div
                className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.25)" }}
              >
                <FiSearch className="text-indigo-400" size={22} />
              </div>
              <h3 className="text-lg text-theme-primary mb-2">Ask anything about your workspace</h3>
              <p className="text-sm text-theme-muted">Search across documents, notes, and files. Summaries include sources.</p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {["Action items", "Deadlines", "Budget", "Risks"].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleExampleClick(`Find ${chip.toLowerCase()} across my documents`)}
                  className="text-xs px-3 py-1.5 rounded-full border text-theme-secondary hover:border-indigo-500/30 transition"
                  style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-theme-muted mb-2">Try asking:</p>
              {exampleQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleExampleClick(q)}
                  className="w-full text-left text-sm text-theme-secondary border rounded-xl px-4 py-3 transition hover:border-indigo-500/30"
                  style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)" }}
                >
                  "{q}"
                </button>
              ))}
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearConversation}
                className="text-xs text-theme-muted hover:text-theme-secondary flex items-center gap-1"
              >
                <FiTrash2 size={12} />
                Clear conversation
              </button>
            </div>

            {conversations.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                {msg.type === "user" ? (
                  <div className="flex justify-end">
                    <div
                      className="rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%]"
                      style={{ backgroundColor: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.25)" }}
                    >
                      <RichText text={msg.content} className="text-sm text-theme-primary whitespace-pre-wrap" />
                      <p className="text-[10px] text-theme-muted mt-1 text-right">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <GlassCard className="max-w-[95%]">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.25)" }}
                      >
                        <FiZap className="text-indigo-400" size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <RichText text={msg.content} className="text-sm text-theme-primary leading-relaxed" />

                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border-secondary)" }}>
                            <p className="text-[10px] text-theme-muted mb-2">Sources</p>
                            <div className="flex flex-wrap gap-1">
                              {msg.sources.map((source, j) => (
                                <span
                                  key={j}
                                  className="text-[10px] px-2 py-1 rounded-full border"
                                  style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
                                >
                                  {source}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-[10px] text-theme-muted mt-2">
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            ))}

            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="fixed bottom-[calc(var(--mobile-nav-height)+16px)] left-0 right-0 px-4 z-40 md:left-[220px] md:bottom-6">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSearch}>
            <div
              className={`flex items-center w-full rounded-full px-4 py-3 transition-all duration-300 border shadow-lg ${
                query ? "border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.2)]" : ""
              }`}
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: query ? "rgb(99, 102, 241)" : "var(--border-secondary)",
                backdropFilter: "blur(12px)",
              }}
            >
              <FiSearch className="text-theme-muted w-5 h-5 mr-3 flex-shrink-0" />

              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about your workspace..."
                className="flex-1 bg-transparent text-theme-primary placeholder:text-theme-muted text-sm outline-none min-w-0"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isSearching}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />

              {query.trim() && !isSearching && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="p-1.5 rounded-full hover:bg-white/10 transition mr-2"
                >
                  <FiX className="text-theme-muted" size={16} />
                </button>
              )}

              <button
                type="submit"
                disabled={!query.trim() || isSearching}
                className={`p-2.5 rounded-full transition-all flex-shrink-0 ${
                  query.trim() && !isSearching
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                    : "bg-white/5 text-theme-muted"
                }`}
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiSend size={16} />
                )}
              </button>
            </div>

            <p className="text-center text-[11px] text-theme-muted mt-2 hidden md:block">
              Press{" "}
              <span
                className="px-1.5 py-0.5 rounded border text-theme-secondary"
                style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
              >
                /
              </span>{" "}
              to focus
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}








