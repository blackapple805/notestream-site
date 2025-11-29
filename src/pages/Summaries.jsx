// src/pages/Summaries.jsx - Now "Insight Explorer"
import { useState, useRef, useEffect } from "react";
import { FiSend, FiFile, FiSearch, FiZap, FiClock, FiTrash2 } from "react-icons/fi";
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

// Example conversation history
const exampleQuestions = [
  "What were the key action items from last week's meeting?",
  "Summarize the main points from my research notes",
  "What deadlines are mentioned across my documents?",
  "Find all mentions of budget or costs",
];

export default function Summaries() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userQuery = query;
    setQuery("");
    setIsSearching(true);

    // Add user message
    setConversations((prev) => [
      ...prev,
      { type: "user", content: userQuery, timestamp: new Date() },
    ]);

    // Simulate AI response delay
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));

    // Generate mock AI response based on query
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

  const generateMockResponse = (query, files) => {
    const lowerQuery = query.toLowerCase();

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

    // Default response
    return {
      answer:
        "I searched across your workspace and found relevant information. Here's what I discovered:\n\n• Your query relates to multiple documents in your workspace\n• I found **3 relevant mentions** across your files\n• Would you like me to provide more specific details about any particular document?",
      sources: files.length > 0 ? files.map((f) => f.name) : ["Multiple files"],
    };
  };

  const toggleFileSelection = (file) => {
    setSelectedFiles((prev) =>
      prev.find((f) => f.id === file.id)
        ? prev.filter((f) => f.id !== file.id)
        : [...prev, file]
    );
  };

  const clearConversation = () => {
    setConversations([]);
  };

  const handleExampleClick = (question) => {
    setQuery(question);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <header>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-white">Insight Explorer</h1>
          <FiZap className="text-indigo-400" size={20} />
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Ask questions across your entire workspace. AI-powered search and analysis.
        </p>
      </header>

      {/* File Context Selector */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FiFile className="text-indigo-400" size={16} />
            <span className="text-sm text-gray-300">Search Context</span>
          </div>
          <button
            onClick={() => setShowFileSelector(!showFileSelector)}
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            {showFileSelector ? "Hide" : "Select Files"}
          </button>
        </div>

        {selectedFiles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file) => (
              <span
                key={file.id}
                className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full border border-indigo-500/30 flex items-center gap-1"
              >
                {file.name}
                <button
                  onClick={() => toggleFileSelection(file)}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Searching all workspace files. Click "Select Files" to narrow your search.
          </p>
        )}

        <AnimatePresence>
          {showFileSelector && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pt-3 border-t border-[#26262c] overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {workspaceFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => toggleFileSelection(file)}
                    className={`text-left text-sm px-3 py-2 rounded-lg border transition ${
                      selectedFiles.find((f) => f.id === file.id)
                        ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                        : "bg-[#101016] border-[#26262c] text-gray-400 hover:border-indigo-500/30"
                    }`}
                  >
                    {file.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Conversation Area */}
      <div className="min-h-[300px]">
        {conversations.length === 0 ? (
          <GlassCard className="p-6">
            <div className="text-center mb-6">
              <FiSearch className="mx-auto text-indigo-400 mb-3" size={32} />
              <h3 className="text-lg text-white mb-2">Ask anything about your workspace</h3>
              <p className="text-sm text-gray-500">
                I can search across all your documents, notes, and files to find answers.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">Try asking:</p>
              {exampleQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(q)}
                  className="w-full text-left text-sm text-gray-400 hover:text-indigo-300 bg-[#101016] hover:bg-[#15151d] border border-[#26262c] hover:border-indigo-500/30 rounded-lg px-4 py-3 transition"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {/* Clear button */}
            <div className="flex justify-end">
              <button
                onClick={clearConversation}
                className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
              >
                <FiTrash2 size={12} />
                Clear conversation
              </button>
            </div>

            {/* Messages */}
            {conversations.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {msg.type === "user" ? (
                  <div className="flex justify-end">
                    <div className="bg-indigo-600/30 border border-indigo-500/30 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                      <p className="text-sm text-gray-200">{msg.content}</p>
                      <p className="text-[10px] text-gray-500 mt-1 text-right">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <GlassCard className="p-4 max-w-[95%]">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                        <FiZap className="text-indigo-400" size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>

                        {/* Sources */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-[#26262c]">
                            <p className="text-[10px] text-gray-500 mb-2">Sources:</p>
                            <div className="flex flex-wrap gap-1">
                              {msg.sources.map((source, j) => (
                                <span
                                  key={j}
                                  className="text-[10px] bg-[#101016] text-gray-400 px-2 py-1 rounded border border-[#26262c]"
                                >
                                  {source}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-[10px] text-gray-500 mt-2">
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            ))}

            {/* Typing indicator */}
            {isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <GlassCard className="p-4 max-w-[200px]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
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

      {/* Input Area - Fixed at bottom */}
      <div className="fixed bottom-[90px] md:bottom-6 left-0 right-0 md:left-[220px] px-4 md:px-8 z-50">
        <div className="max-w-[1200px] mx-auto">
          <form onSubmit={handleSearch}>
            <div className="flex items-center gap-2 bg-[#0d0d12]/95 backdrop-blur-xl border border-[#26262c] rounded-2xl px-4 py-3 shadow-lg">
              <FiSearch className="text-gray-500" size={18} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about your workspace..."
                className="flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none"
                disabled={isSearching}
              />
              <button
                type="submit"
                disabled={!query.trim() || isSearching}
                className={`p-2 rounded-xl transition ${
                  query.trim() && !isSearching
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                    : "bg-[#1c1c24] text-gray-500"
                }`}
              >
                <FiSend size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
