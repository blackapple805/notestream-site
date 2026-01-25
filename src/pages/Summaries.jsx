// src/pages/Summaries.jsx - "Insight Explorer"
// Rebuilt with cleaner search bar matching Search.jsx style
// Removed complex mobile handling that was causing visual glitches

import { useEffect, useMemo, useRef, useState } from "react";
import { FiSend, FiFile, FiSearch, FiZap, FiTrash2, FiX, FiChevronDown } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";

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
    case "pdf": return "PDF";
    case "doc": return "Doc";
    case "video": return "Video";
    case "note": return "Note";
    case "spreadsheet": return "Sheet";
    default: return "File";
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
          if (remaining.slice(start, start + 2) === "**") continue;
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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showFileSelector, setShowFileSelector] = useState(false);

  const inputRef = useRef(null);
  const chatEndRef = useRef(null);

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

  const contextLabel = useMemo(() => {
    if (selectedFiles.length === 0) return "All workspace files";
    if (selectedFiles.length === 1) return selectedFiles[0].name;
    return `${selectedFiles.length} files selected`;
  }, [selectedFiles]);

  const fileIdSet = useMemo(() => new Set(selectedFiles.map((f) => f.id)), [selectedFiles]);

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
    inputRef.current?.focus();
  };

  const generateMockResponse = (q, files) => {
    const lowerQuery = q.toLowerCase();

    if (lowerQuery.includes("meeting") || lowerQuery.includes("action")) {
      return {
        answer: "Based on your meeting notes, here are the key action items:\n\n• **Complete UI mockups** - Due Friday\n• **Review budget proposal** - Pending Sarah's input\n• **Schedule follow-up** with design team\n• **Update project timeline** in shared doc",
        sources: ["Meeting_summary_jan.pdf", "Project_roadmap.docx"],
      };
    }

    if (lowerQuery.includes("deadline") || lowerQuery.includes("due")) {
      return {
        answer: "I found the following deadlines across your workspace:\n\n• **Jan 15** - Q1 Budget review\n• **Jan 20** - UI mockups delivery\n• **Feb 01** - Project milestone 1\n• **Feb 15** - Research presentation",
        sources: ["Project_roadmap.docx", "Q1_Budget.xlsx"],
      };
    }

    if (lowerQuery.includes("budget") || lowerQuery.includes("cost")) {
      return {
        answer: "Here's a summary of budget-related information:\n\n• **Total Q1 Budget**: $45,000\n• **Spent to date**: $12,500 (28%)\n• **Largest expense**: Software licenses ($5,200)\n• **Pending approvals**: $3,800",
        sources: ["Q1_Budget.xlsx", "Meeting_summary_jan.pdf"],
      };
    }

    if (lowerQuery.includes("research") || lowerQuery.includes("notes")) {
      return {
        answer: "From your research notes, the main points are:\n\n• **Key finding**: User engagement increased 40% with new UI\n• **Recommendation**: Implement progressive onboarding\n• **Next steps**: A/B testing scheduled for next sprint\n• **Resources needed**: 2 additional developers",
        sources: ["Research_notes.md", "Lecture_05_recording.mp4"],
      };
    }

    return {
      answer: "I searched across your workspace and found relevant information.\n\n• Your query relates to multiple documents\n• I found **3 relevant mentions** across your files\n• Tell me which file you want to drill into, or ask for a tighter summary",
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
    if (isSearching || !query.trim()) return;

    const userQuery = query.trim();
    setQuery("");
    await runSearch(userQuery);
  };

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+140px)] animate-fadeIn">
      {/* Header */}
      <header className="pt-2 px-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
            <FiZap className="text-indigo-400" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-theme-primary">Insight Explorer</h1>
            <p className="text-theme-muted text-sm">Ask questions across your workspace. AI-powered search and analysis.</p>
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
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
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
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFileSelector((s) => !s)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-3 py-1.5 rounded-full border transition"
              style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.25)' }}
            >
              Select files
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
                className="text-xs px-3 py-1.5 rounded-full border flex items-center gap-2"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.25)', color: 'rgb(165, 180, 252)' }}
              >
                <span 
                  className="text-[10px] px-2 py-0.5 rounded-full border"
                  style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)' }}
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
              style={{ borderColor: 'var(--border-secondary)' }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {workspaceFiles.map((file) => {
                  const selected = fileIdSet.has(file.id);
                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => toggleFileSelection(file)}
                      className="text-left px-3 py-3 rounded-xl border transition flex items-center justify-between gap-3"
                      style={{
                        backgroundColor: selected ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-input)',
                        borderColor: selected ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-secondary)',
                      }}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span 
                            className="text-[10px] px-2 py-0.5 rounded-full border"
                            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
                          >
                            {typeLabel(file.type)}
                          </span>
                          <span className="text-sm text-theme-primary truncate">{file.name}</span>
                        </div>
                      </div>
                      <div
                        className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0"
                        style={{
                          borderColor: selected ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-secondary)',
                          backgroundColor: selected ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-tertiary)',
                        }}
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
      <div className="min-h-[300px]">
        {conversations.length === 0 ? (
          <GlassCard>
            <div className="text-center mb-6">
              <div 
                className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.25)' }}
              >
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
                  className="text-xs px-3 py-1.5 rounded-full border text-theme-secondary hover:border-indigo-500/30 transition"
                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
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
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-secondary)' }}
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
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {msg.type === "user" ? (
                  <div className="flex justify-end">
                    <div 
                      className="rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%]"
                      style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.25)' }}
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
                        style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.25)' }}
                      >
                        <FiZap className="text-indigo-400" size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <RichText text={msg.content} className="text-sm text-theme-primary leading-relaxed" />

                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                            <p className="text-[10px] text-theme-muted mb-2">Sources</p>
                            <div className="flex flex-wrap gap-1">
                              {msg.sources.map((source, j) => (
                                <span
                                  key={j}
                                  className="text-[10px] px-2 py-1 rounded-full border"
                                  style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
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
                <GlassCard className="max-w-[200px]">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.25)' }}
                    >
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

      {/* Search Bar - Clean style matching Search.jsx */}
      <div className="fixed bottom-[calc(var(--mobile-nav-height)+16px)] left-0 right-0 px-4 z-40 md:left-[220px] md:bottom-6">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSearch}>
            <div
              className={`flex items-center w-full rounded-full px-4 py-3 transition-all duration-300 border shadow-lg ${
                query ? "border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.2)]" : ""
              }`}
              style={{ 
                backgroundColor: 'var(--bg-surface)', 
                borderColor: query ? 'rgb(99, 102, 241)' : 'var(--border-secondary)',
                backdropFilter: 'blur(12px)',
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

            {/* Keyboard hint */}
            <p className="text-center text-[11px] text-theme-muted mt-2 hidden md:block">
              Press <span className="px-1.5 py-0.5 rounded border text-theme-secondary" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}>/</span> to focus
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}



