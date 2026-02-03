
// src/pages/Summaries.jsx — "Insight Explorer"
// ✅ Fixes + cleanup

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  FiSend,
  FiFile,
  FiSearch,
  FiTrash2,
  FiX,
  FiChevronDown,
  FiZap,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { consumeAiUsage } from "../lib/usage";

const DOCS_TABLE = "documents";
const NOTES_TABLE = "notes";
const EVENTS_TABLE = "activity_events";

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
          // Skip "**" being misread as italics
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
    typeof isSupabaseConfigured === "function"
      ? isSupabaseConfigured()
      : !!isSupabaseConfigured;

  // Scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, isSearching]);

  // Keyboard shortcut: "/" focuses search
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const isTypingField =
        tag === "input" || tag === "textarea" || e.target?.isContentEditable;
      if (!isTypingField && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Session-gated auth user helper (avoids null user edge cases)
  const getAuthedUser = useCallback(async () => {
    if (!supabaseReady || !supabase) return null;

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;
    return session?.user ?? null;
  }, [supabaseReady]);

  // Optional activity log (uses your schema: event_type + metadata)
  const logActivity = useCallback(
    async (userId, metadata = {}) => {
      if (!supabaseReady || !supabase || !userId) return;

      // If your table/RLS is not enabled this should not break UX
      try {
        await supabase.from(EVENTS_TABLE).insert({
          user_id: userId,
          event_type: "ai_used",
          entity_id: null,
          metadata,
          title: "Insight Explorer query",
        });
      } catch {
        // silent fail
      }
    },
    [supabaseReady]
  );

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

        const merged = [...docs, ...notes];
        setWorkspaceFiles(merged);
        setFilesLoading(false);

        // Safety: if selected files no longer exist, drop them
        setSelectedFiles((prev) => prev.filter((sf) => merged.some((f) => f.id === sf.id)));
      } catch (err) {
        if (!alive) return;
        setFilesError(err?.message || "Failed to load workspace files");
        setWorkspaceFiles([]);
        setFilesLoading(false);
        setShowFileSelector(false);
      }
    };

    loadWorkspace();
    return () => {
      alive = false;
    };
  }, [supabaseReady, getAuthedUser]);

  const contextLabel = useMemo(() => {
    if (selectedFiles.length === 0) return "All workspace files";
    if (selectedFiles.length === 1) return selectedFiles[0].name;
    return `${selectedFiles.length} files selected`;
  }, [selectedFiles]);

  const fileIdSet = useMemo(() => new Set(selectedFiles.map((f) => f.id)), [selectedFiles]);

  const toggleFileSelection = useCallback((file) => {
    setSelectedFiles((prev) => {
      const exists = prev.some((f) => f.id === file.id);
      return exists ? prev.filter((f) => f.id !== file.id) : [...prev, file];
    });
  }, []);

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

  const runSearch = async (userQuery) => {
    if (!userQuery.trim()) return;

    setIsSearching(true);
    setConversations((prev) => [
      ...prev,
      { type: "user", content: userQuery, timestamp: new Date() },
    ]);

    let user = null;

    try {
      // ✅ CHARGE RIGHT BEFORE AI WORK (DB-enforced)
      user = await getAuthedUser();

      if (user?.id) {
        const usageRes = await consumeAiUsage(user.id, "insight_queries", 1);

        if (!usageRes?.success) {
          setConversations((prev) => [
            ...prev,
            {
              type: "ai",
              content:
                "Daily AI limit reached for your plan. Try again tomorrow or upgrade to Pro.",
              sources: [],
              timestamp: new Date(),
            },
          ]);
          return;
        }
      }

      // mock latency (represents real AI call time)
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));

      const aiResponse = generateMockResponse(userQuery, selectedFiles);

      setConversations((prev) => [
        ...prev,
        {
          type: "ai",
          content: aiResponse.answer,
          sources: aiResponse.sources,
          timestamp: new Date(),
        },
      ]);

      // Optional event log
      if (user?.id) {
        await logActivity(user.id, { feature: "insight_explorer" });
      }
    } catch (err) {
      console.error("Insight Explorer error:", err);
      setConversations((prev) => [
        ...prev,
        {
          type: "ai",
          content: "Something went wrong while processing your request. Please try again.",
          sources: [],
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (isSearching || !query.trim()) return;

    const userQuery = query.trim();
    setQuery("");
    await runSearch(userQuery);
  };

  // Loader
  if (filesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-[calc(var(--mobile-nav-height)+140px)] animate-fadeIn">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "var(--page-header-icon-bg)",
            border: `var(--page-header-icon-border-width) solid var(--page-header-icon-border)`,
          }}
        >
          <FiZap style={{ color: "var(--tag-info-text)" }} size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Insight Explorer
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            AI-powered search across your workspace
          </p>
        </div>
      </header>

      {/* File Context */}
      <div
        className="rounded-2xl p-4 border"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-secondary)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FiFile style={{ color: "var(--tag-info-text)" }} className="flex-shrink-0" size={14} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Context:
            </span>
            <span
              className="text-xs px-2.5 py-1 rounded-full border truncate"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderColor: "var(--border-secondary)",
                color: "var(--text-secondary)",
              }}
            >
              {contextLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {selectedFiles.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-xs transition"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowFileSelector((s) => !s)}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition disabled:opacity-60"
              style={{
                color: "var(--tag-info-text)",
                backgroundColor: "rgba(99, 102, 241, 0.08)",
                borderColor: "rgba(99, 102, 241, 0.2)",
              }}
              disabled={filesLoading}
            >
              Select
              <FiChevronDown
                size={12}
                className={`${showFileSelector ? "rotate-180" : ""} transition-transform`}
              />
            </button>
          </div>
        </div>

        {filesError && (
          <p className="text-[11px] mt-2" style={{ color: "var(--tag-error-text)" }}>
            {filesError}
          </p>
        )}

        {/* Selected file pills */}
        {selectedFiles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {selectedFiles.map((file) => (
              <span
                key={file.id}
                className="text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5"
                style={{
                  backgroundColor: "rgba(99, 102, 241, 0.08)",
                  borderColor: "rgba(99, 102, 241, 0.2)",
                  color: "var(--text-secondary)",
                }}
              >
                <span className="truncate max-w-[140px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => toggleFileSelection(file)}
                  className="transition"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  aria-label="Remove file"
                >
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
              transition={{ duration: 0.2 }}
              className="mt-3 pt-3 border-t overflow-hidden"
              style={{ borderColor: "var(--border-secondary)" }}
            >
              {(workspaceFiles || []).length === 0 ? (
                <div
                  className="text-xs rounded-xl border p-3 text-center"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border-secondary)",
                    color: "var(--text-muted)",
                  }}
                >
                  No files yet. Upload a document or create a note.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1.5 max-h-[200px] overflow-y-auto">
                  {(workspaceFiles || []).map((file) => {
                    const selected = fileIdSet.has(file.id);

                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => toggleFileSelection(file)}
                        className="text-left px-3 py-2.5 rounded-xl border transition flex items-center justify-between gap-2"
                        style={{
                          backgroundColor: selected
                            ? "rgba(99, 102, 241, 0.1)"
                            : "var(--bg-input)",
                          borderColor: selected
                            ? "rgba(99, 102, 241, 0.3)"
                            : "var(--border-secondary)",
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0"
                            style={{
                              backgroundColor: "var(--bg-tertiary)",
                              borderColor: "var(--border-secondary)",
                              color: "var(--text-muted)",
                            }}
                          >
                            {typeLabel(file.type)}
                          </span>
                          <span
                            className="text-sm truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {file.name}
                          </span>
                        </div>

                        <div
                          className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0"
                          style={{
                            borderColor: selected
                              ? "rgba(99, 102, 241, 0.5)"
                              : "var(--border-secondary)",
                            backgroundColor: selected
                              ? "rgba(99, 102, 241, 0.2)"
                              : "transparent",
                          }}
                        >
                          {selected && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: "var(--accent-indigo)" }}
                            />
                          )}
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

      {/* Conversation Area */}
      <div className="min-h-[280px]">
        {conversations.length === 0 ? (
          <div
            className="rounded-2xl p-5 border"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-secondary)",
            }}
          >
            <div className="text-center mb-5">
              <div
                className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{
                  backgroundColor: "rgba(99, 102, 241, 0.12)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                }}
              >
                <FiSearch style={{ color: "var(--tag-info-text)" }} size={20} />
              </div>

              <h3 className="text-base font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Ask anything about your workspace
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Search documents, notes, and files with AI
              </p>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 justify-center mb-5">
              {["Action items", "Deadlines", "Budget", "Risks"].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() =>
                    handleExampleClick(`Find ${chip.toLowerCase()} across my documents`)
                  }
                  className="text-xs px-3 py-1.5 rounded-full border transition"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    borderColor: "var(--border-secondary)",
                    color: "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.35)";
                    e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-secondary)";
                    e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Example questions */}
            <div className="space-y-1.5">
              <p className="text-[11px] mb-2" style={{ color: "var(--text-muted)" }}>
                Try asking:
              </p>
              {exampleQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleExampleClick(q)}
                  className="w-full text-left text-sm border rounded-xl px-4 py-2.5 transition"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border-secondary)",
                    color: "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.30)";
                    e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-secondary)";
                    e.currentTarget.style.backgroundColor = "var(--bg-input)";
                  }}
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearConversation}
                className="text-xs flex items-center gap-1 transition"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                <FiTrash2 size={11} />
                Clear
              </button>
            </div>

            {conversations.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {msg.type === "user" ? (
                  <div className="flex justify-end">
                    <div
                      className="rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[85%]"
                      style={{
                        backgroundColor: "rgba(99, 102, 241, 0.12)",
                        border: "1px solid rgba(99, 102, 241, 0.2)",
                      }}
                    >
                      <RichText
                        text={msg.content}
                        className="text-sm whitespace-pre-wrap"
                        // keep your theme classes if you have them; inline fallback is safe
                      />
                      <p
                        className="text-[10px] mt-1 text-right opacity-70"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-2xl p-4 border max-w-[95%]"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-secondary)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: "rgba(99, 102, 241, 0.12)",
                          border: "1px solid rgba(99, 102, 241, 0.2)",
                        }}
                      >
                        <FiZap style={{ color: "var(--tag-info-text)" }} size={14} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <RichText
                          text={msg.content}
                          className="text-sm leading-relaxed"
                        />

                        {msg.sources && msg.sources.length > 0 && (
                          <div
                            className="mt-3 pt-2.5 border-t"
                            style={{ borderColor: "var(--border-secondary)" }}
                          >
                            <p className="text-[10px] mb-1.5" style={{ color: "var(--text-muted)" }}>
                              Sources
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {msg.sources.map((source, j) => (
                                <span
                                  key={j}
                                  className="text-[10px] px-2 py-0.5 rounded-full border"
                                  style={{
                                    backgroundColor: "var(--bg-tertiary)",
                                    borderColor: "var(--border-secondary)",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {source}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-[10px] mt-2 opacity-70" style={{ color: "var(--text-muted)" }}>
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="fixed bottom-[calc(var(--mobile-nav-height)+12px)] left-0 right-0 px-4 z-40 md:left-[220px] md:bottom-5">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSearch}>
            <div
              className="flex items-center w-full rounded-2xl px-4 py-2.5 transition-all duration-200 border"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: query ? "rgba(99, 102, 241, 0.6)" : "var(--border-secondary)",
                backdropFilter: "blur(16px)",
                boxShadow: query
                  ? "0 0 20px rgba(99,102,241,0.15)"
                  : "var(--shadow-lg)",
              }}
            >
              <FiSearch style={{ color: "var(--text-muted)" }} className="w-5 h-5 mr-3 flex-shrink-0" />

              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about your workspace..."
                className="flex-1 bg-transparent outline-none min-w-0"
                style={{
                  color: "var(--text-primary)",
                  fontSize: "16px", // prevents iOS zoom
                  lineHeight: "1.5",
                }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isSearching}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />

              {query.trim() && !isSearching && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="p-1.5 rounded-full transition mr-1"
                  style={{ backgroundColor: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  aria-label="Clear query"
                >
                  <FiX style={{ color: "var(--text-muted)" }} size={16} />
                </button>
              )}

              <button
                type="submit"
                disabled={!query.trim() || isSearching}
                className="p-2 rounded-xl transition-all flex-shrink-0 disabled:opacity-60"
                style={{
                  backgroundColor:
                    query.trim() && !isSearching ? "var(--accent-indigo)" : "rgba(255,255,255,0.06)",
                  color: query.trim() && !isSearching ? "#fff" : "var(--text-muted)",
                  boxShadow:
                    query.trim() && !isSearching
                      ? "0 10px 24px rgba(99,102,241,0.18)"
                      : "none",
                }}
                aria-label="Send"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FiSend size={16} />
                )}
              </button>
            </div>

            <p className="text-center text-[10px] mt-1.5 hidden md:block opacity-60" style={{ color: "var(--text-muted)" }}>
              Press{" "}
              <kbd
                className="px-1.5 py-0.5 rounded border"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-secondary)",
                  color: "var(--text-secondary)",
                }}
              >
                /
              </kbd>{" "}
              to focus
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}












