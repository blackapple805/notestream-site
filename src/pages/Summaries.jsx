// src/pages/Summaries.jsx - "Insight Explorer"
// Fixes:
// 1) No “double search bar” glitch while typing:
//    - Suggestions only show after MIN_SUGGEST_CHARS
//    - Suggestions UI is a compact dropdown list (does not look like a second bar)
//    - Input disables browser UI that often looks like a second bar (autoComplete/spellcheck/etc)
// 2) **bold** (and *italic*) render properly without showing *** characters:
//    - Simple inline formatter that converts **text** -> <strong>, *text* -> <em>

import { useEffect, useMemo, useRef, useState } from "react";
import { FiSend, FiFile, FiSearch, FiZap, FiTrash2, FiX, FiChevronDown } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";

const MIN_SUGGEST_CHARS = 2;

// Mock workspace files for context
const workspaceFiles = [
  { id: 1, name: "Meeting_summary_jan.pdf", type: "pdf" },
  { id: 2, name: "Project_roadmap.docx", type: "doc" },
  { id: 3, name: "Lecture_05_recording.mp4", type: "video" },
  { id: 4, name: "Research_notes.md", type: "note" },
  { id: 5, name: "Q1_Budget.xlsx", type: "spreadsheet" },
];

// Example prompts
const exampleQuestions = [
  "What were the key action items from last week's meeting?",
  "Summarize the main points from my research notes",
  "What deadlines are mentioned across my documents?",
  "Find all mentions of budget or costs",
];

const typeLabel = (t) => {
  switch (t) {
    case "pdf":
      return "PDF";
    case "doc":
      return "Doc";
    case "video":
      return "Video";
    case "note":
      return "Note";
    case "spreadsheet":
      return "Sheet";
    default:
      return "File";
  }
};

/**
 * Minimal inline formatter:
 * - **bold**
 * - *italic*
 * Keeps \n line breaks.
 * No HTML injection. No markdown links.
 */
function RichText({ text, className = "" }) {
  const parts = useMemo(() => {
    if (!text) return [];

    // Split into lines first so we can keep \n as <br/>
    const lines = String(text).split("\n");

    const parseInline = (line) => {
      // Tokenize by **bold** and *italic*
      // Order matters: handle bold first.
      const tokens = [];
      let remaining = line;

      const pushText = (s) => {
        if (s) tokens.push({ type: "text", value: s });
      };

      while (remaining.length) {
        const boldIdx = remaining.indexOf("**");
        const italIdx = remaining.indexOf("*");

        // No markers
        if (boldIdx === -1 && italIdx === -1) {
          pushText(remaining);
          break;
        }

        // Prefer bold when it appears before italic marker
        const useBold = boldIdx !== -1 && (italIdx === -1 || boldIdx <= italIdx);

        if (useBold) {
          // Need **open** ... **close**
          const start = boldIdx;
          const end = remaining.indexOf("**", start + 2);
          if (end === -1) {
            // Unclosed, treat as text
            pushText(remaining);
            break;
          }
          pushText(remaining.slice(0, start));
          const content = remaining.slice(start + 2, end);
          tokens.push({ type: "bold", value: content });
          remaining = remaining.slice(end + 2);
        } else {
          // italic: single * ... *
          const start = italIdx;
          // ignore if it's actually "**"
          if (remaining.slice(start, start + 2) === "**") continue;

          const end = remaining.indexOf("*", start + 1);
          if (end === -1) {
            pushText(remaining);
            break;
          }
          pushText(remaining.slice(0, start));
          const content = remaining.slice(start + 1, end);
          tokens.push({ type: "italic", value: content });
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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showFileSelector, setShowFileSelector] = useState(false);

  // Search UX
  const [isFocused, setIsFocused] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const inputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, isSearching]);

  // Keyboard shortcuts: "/" focuses, "esc" blurs
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const isTypingField =
        tag === "input" || tag === "textarea" || e.target?.isContentEditable;

      if (!isTypingField && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setIsFocused(false);
        setActiveSuggestion(-1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const contextLabel = useMemo(() => {
    if (selectedFiles.length === 0) return "All workspace files";
    if (selectedFiles.length === 1) return selectedFiles[0].name;
    return `${selectedFiles.length} files selected`;
  }, [selectedFiles]);

  const fileIdSet = useMemo(() => new Set(selectedFiles.map((f) => f.id)), [selectedFiles]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < MIN_SUGGEST_CHARS) return [];

    const promptHits = exampleQuestions
      .filter((p) => p.toLowerCase().includes(q))
      .slice(0, 3);

    const fileHits = workspaceFiles
      .filter((f) => f.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map((f) => `Search in: ${f.name}`);

    const operators = [
      `deadlines in ${contextLabel.toLowerCase()}`,
      `budget mentions in ${contextLabel.toLowerCase()}`,
      `action items in ${contextLabel.toLowerCase()}`,
    ]
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, 2);

    return [...promptHits, ...fileHits, ...operators].slice(0, 6);
  }, [query, contextLabel]);

  const showSuggestions = isFocused && !isSearching && suggestions.length > 0;

  const toggleFileSelection = (file) => {
    setSelectedFiles((prev) =>
      prev.find((f) => f.id === file.id)
        ? prev.filter((f) => f.id !== file.id)
        : [...prev, file]
    );
  };

  const clearConversation = () => setConversations([]);

  const handleExampleClick = (question) => {
    setQuery(question);
    setActiveSuggestion(-1);
    inputRef.current?.focus();
  };

  const generateMockResponse = (q, files) => {
    const lowerQuery = q.toLowerCase();

    if (lowerQuery.includes("meeting") || lowerQuery.includes("action")) {
      return {
        answer:
          "Based on your meeting notes, here are the key action items:\n\n• **Complete UI mockups** - Due Friday\n• **Review budget proposal** - Pending Sarah's input\n• **Schedule follow-up** with design team\n• **Update project timeline** in shared doc",
        sources: ["Meeting_summary_jan.pdf", "Project_roadmap.docx"],
      };
    }

    if (lowerQuery.includes("deadline") || lowerQuery.includes("due")) {
      return {
        answer:
          "I found the following deadlines across your workspace:\n\n• **Jan 15** - Q1 Budget review\n• **Jan 20** - UI mockups delivery\n• **Feb 01** - Project milestone 1\n• **Feb 15** - Research presentation",
        sources: ["Project_roadmap.docx", "Q1_Budget.xlsx"],
      };
    }

    if (lowerQuery.includes("budget") || lowerQuery.includes("cost")) {
      return {
        answer:
          "Here's a summary of budget-related information:\n\n• **Total Q1 Budget**: $45,000\n• **Spent to date**: $12,500 (28%)\n• **Largest expense**: Software licenses ($5,200)\n• **Pending approvals**: $3,800",
        sources: ["Q1_Budget.xlsx", "Meeting_summary_jan.pdf"],
      };
    }

    if (lowerQuery.includes("research") || lowerQuery.includes("notes")) {
      return {
        answer:
          "From your research notes, the main points are:\n\n• **Key finding**: User engagement increased 40% with new UI\n• **Recommendation**: Implement progressive onboarding\n• **Next steps**: A/B testing scheduled for next sprint\n• **Resources needed**: 2 additional developers",
        sources: ["Research_notes.md", "Lecture_05_recording.mp4"],
      };
    }

    return {
      answer:
        "I searched across your workspace and found relevant information.\n\n• Your query relates to multiple documents\n• I found **3 relevant mentions** across your files\n• Tell me which file you want to drill into, or ask for a tighter summary",
      sources: files.length > 0 ? files.map((f) => f.name) : ["Multiple files"],
    };
  };

  const runSearch = async (userQuery) => {
    if (!userQuery.trim()) return;

    setIsSearching(true);

    setConversations((prev) => [
      ...prev,
      { type: "user", content: userQuery, timestamp: new Date() },
    ]);

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

    setIsSearching(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (isSearching) return;

    const userQuery = query.trim();
    if (!userQuery) return;

    setQuery("");
    setActiveSuggestion(-1);
    await runSearch(userQuery);
  };

  const applySuggestion = async (text) => {
    setQuery("");
    setActiveSuggestion(-1);
    await runSearch(text);
  };

  const handleKeyDown = (e) => {
    if (isSearching) {
      if (e.key === "Enter") e.preventDefault();
      return;
    }

    if (showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((v) => Math.min(v + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((v) => Math.max(v - 1, -1));
        return;
      }
      if (e.key === "Tab" && activeSuggestion >= 0) {
        e.preventDefault();
        setQuery(suggestions[activeSuggestion]);
        setActiveSuggestion(-1);
        return;
      }
      if (e.key === "Enter" && activeSuggestion >= 0) {
        e.preventDefault();
        applySuggestion(suggestions[activeSuggestion]);
        return;
      }
    }
    // Do not run search here. Let form onSubmit handle Enter.
  };

  return (
    <div className="space-y-6 pb-44">
      {/* Header */}
      <header className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <FiZap className="text-indigo-400" size={16} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-theme-primary">Insight Explorer</h1>
              <p className="text-theme-muted text-sm mt-1">
                Ask questions across your workspace. AI-powered search and analysis.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-theme-muted">
            <span className="px-2 py-1 rounded-full border border-theme-secondary bg-theme-input">
              Press <span className="text-theme-secondary">/</span> to search
            </span>
          </div>
        </div>
      </header>

      {/* Context */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <FiFile className="text-indigo-400" size={16} />
            <span className="text-sm text-theme-secondary">Search context</span>
            <span className="text-[11px] text-theme-muted px-2 py-1 rounded-full border border-theme-secondary bg-theme-input">
              {contextLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedFiles.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-xs text-theme-muted hover:text-theme-secondary px-2 py-1 rounded-full border border-theme-secondary bg-theme-input
                           focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none"
              >
                Clear context
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFileSelector((s) => !s)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2 py-1 rounded-full border border-indigo-500/25 bg-indigo-500/10
                         focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none"
            >
              Select files{" "}
              <FiChevronDown size={12} className={`${showFileSelector ? "rotate-180" : ""} transition`} />
            </button>
          </div>
        </div>

        {/* Selected file pills */}
        {selectedFiles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedFiles.map((file) => (
              <span
                key={file.id}
                className="text-xs bg-indigo-500/15 text-indigo-200 px-3 py-1.5 rounded-full border border-indigo-500/25 flex items-center gap-2"
              >
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-indigo-500/25 bg-indigo-500/10">
                  {typeLabel(file.type)}
                </span>
                <span className="truncate max-w-[220px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => toggleFileSelection(file)}
                  className="hover:text-white focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none"
                  aria-label={`Remove ${file.name}`}
                >
                  <FiX size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* File selector */}
        <AnimatePresence>
          {showFileSelector && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-theme-secondary overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {workspaceFiles.map((file) => {
                  const selected = fileIdSet.has(file.id);
                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => toggleFileSelection(file)}
                      className={[
                        "text-left px-3 py-3 rounded-2xl border transition",
                        "flex items-center justify-between gap-3",
                        selected
                          ? "bg-indigo-500/15 border-indigo-500/35"
                          : "bg-theme-input border-theme-secondary hover:border-indigo-500/25",
                        "focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none",
                      ].join(" ")}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-theme-secondary bg-theme-tertiary text-theme-secondary">
                            {typeLabel(file.type)}
                          </span>
                          <span className="text-sm text-theme-primary truncate">{file.name}</span>
                        </div>
                        <p className="text-[11px] text-theme-muted mt-1">
                          {selected ? "Included in search context" : "Click to include"}
                        </p>
                      </div>
                      <div
                        className={[
                          "w-5 h-5 rounded-full border flex items-center justify-center",
                          selected
                            ? "border-indigo-500/40 bg-indigo-500/20"
                            : "border-theme-secondary bg-theme-tertiary",
                        ].join(" ")}
                      >
                        {selected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Conversation Area */}
      <div className="min-h-[320px]">
        {conversations.length === 0 ? (
          <GlassCard className="p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 rounded-3xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center mb-3">
                <FiSearch className="text-indigo-400" size={22} />
              </div>
              <h3 className="text-lg text-theme-primary mb-2">Ask anything about your workspace</h3>
              <p className="text-sm text-theme-muted">
                Search across documents, notes, and files. Summaries include sources.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {["Action items", "Deadlines", "Budget", "Risks"].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleExampleClick(`Find ${chip.toLowerCase()} across my documents`)}
                  className="text-xs px-3 py-1.5 rounded-full border border-theme-secondary bg-theme-input text-theme-secondary hover:border-indigo-500/30 hover:bg-theme-elevated transition
                             focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none"
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
                  className="w-full text-left text-sm text-theme-secondary bg-theme-input hover:bg-theme-elevated border border-theme-secondary hover:border-indigo-500/35 rounded-2xl px-4 py-3 transition
                             focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none"
                >
                  “{q}”
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
                className="text-xs text-theme-muted hover:text-theme-secondary flex items-center gap-1
                           focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none"
              >
                <FiTrash2 size={12} />
                Clear conversation
              </button>
            </div>

            {conversations.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {msg.type === "user" ? (
                  <div className="flex justify-end">
                    <div className="bg-indigo-500/15 border border-indigo-500/25 rounded-[24px] rounded-tr-md px-4 py-3 max-w-[88%]">
                      <RichText
                        text={msg.content}
                        className="text-sm text-theme-primary whitespace-pre-wrap"
                      />
                      <p className="text-[10px] text-theme-muted mt-1 text-right">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <GlassCard className="p-4 max-w-[95%]">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
                        <FiZap className="text-indigo-400" size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <RichText
                          text={msg.content}
                          className="text-sm text-theme-primary leading-relaxed"
                        />

                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-theme-secondary">
                            <p className="text-[10px] text-theme-muted mb-2">Sources</p>
                            <div className="flex flex-wrap gap-1">
                              {msg.sources.map((source, j) => (
                                <span
                                  key={j}
                                  className="text-[10px] bg-theme-tertiary text-theme-secondary px-2 py-1 rounded-full border border-theme-secondary"
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

            {isSearching && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GlassCard className="p-4 max-w-[220px]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                      <FiZap className="text-indigo-400 animate-pulse" size={14} />
                    </div>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* SINGLE Bubble Input Area - fixed bottom */}
      <div className="no-animate fixed bottom-[90px] md:bottom-6 left-0 right-0 md:left-[220px] px-4 md:px-8 z-50">
        <div className="max-w-[1200px] mx-auto">
          <form onSubmit={handleSearch}>
            <div className="relative">
              {/* Bubble bar */}
              <div
                className={[
                  "no-animate flex items-center gap-2 px-3 py-3 border shadow-lg",
                  "rounded-[28px] backdrop-blur-md",
                  isFocused ? "ring-2 ring-indigo-500/30" : "",
                ].join(" ")}
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                <div className="flex items-center gap-2 px-2">
                  <FiSearch className="text-theme-muted flex-shrink-0" size={18} />
                </div>

                <button
                  type="button"
                  onClick={() => setShowFileSelector((s) => !s)}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition
                             focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none"
                  style={{
                    borderColor: "var(--border-secondary)",
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                  }}
                  title="Toggle file context"
                >
                  <FiFile size={12} className="text-indigo-400" />
                  <span className="truncate max-w-[220px]">{contextLabel}</span>
                  <FiChevronDown size={12} className={`${showFileSelector ? "rotate-180" : ""} transition`} />
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveSuggestion(-1);
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      setIsFocused(false);
                      setActiveSuggestion(-1);
                    }, 120);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your workspace. Try “deadlines”, “budget”, “action items”…"
                  className="flex-1 bg-transparent text-sm text-theme-primary placeholder:text-theme-muted min-w-0
                             focus:outline-none focus:ring-0 focus:ring-offset-0 ring-0 ring-offset-0"
                  disabled={isSearching}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  inputMode="text"
                />

                {query.trim().length > 0 && !isSearching && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setActiveSuggestion(-1);
                      inputRef.current?.focus();
                    }}
                    className="p-2 rounded-full hover:bg-theme-tertiary transition
                               focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none"
                    aria-label="Clear"
                  >
                    <FiX className="text-theme-muted" size={16} />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!query.trim() || isSearching}
                  className={[
                    "p-3 rounded-full transition-colors flex-shrink-0",
                    "focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none",
                    query.trim() && !isSearching
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : "bg-theme-button text-theme-muted",
                  ].join(" ")}
                  aria-label="Send"
                >
                  <FiSend size={16} />
                </button>
              </div>

              {/* Suggestions dropdown (compact list, not bar-shaped) */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute left-0 right-0 mt-2 z-50"
                  >
                    <div
                      className="rounded-2xl border shadow-xl overflow-hidden"
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        borderColor: "var(--border-secondary)",
                      }}
                    >
                      <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border-secondary)" }}>
                        <p className="text-[11px] text-theme-muted">
                          Suggestions (↑ ↓ to navigate, Enter to pick)
                        </p>
                      </div>

                      <div className="p-2">
                        {suggestions.map((s, idx) => (
                          <button
                            key={s + idx}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applySuggestion(s)}
                            className={[
                              "w-full text-left px-3 py-2 rounded-xl transition",
                              "focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none",
                              idx === activeSuggestion
                                ? "bg-indigo-500/15 border border-indigo-500/25"
                                : "hover:bg-theme-tertiary",
                            ].join(" ")}
                          >
                            <span className="text-xs text-theme-primary">{s}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile helper row */}
              <div className="sm:hidden mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowFileSelector((s) => !s)}
                  className="text-xs text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 flex items-center gap-2
                             focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none"
                >
                  <FiFile size={12} />
                  <span className="truncate max-w-[220px]">{contextLabel}</span>
                  <FiChevronDown size={12} className={`${showFileSelector ? "rotate-180" : ""} transition`} />
                </button>

                <p className="text-[11px] text-theme-muted">Enter to send</p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}





