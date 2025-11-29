// src/pages/Documents.jsx - "Research Synthesizer"
import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import { 
  FiEye, 
  FiFileText, 
  FiDownload, 
  FiCheck,
  FiX,
  FiLayers,
  FiTrash2,
  FiBookOpen
} from "react-icons/fi";
import { Brain, Sparkle, FilePlus } from "phosphor-react";

export default function Documents({ docs = [], setDocs }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [showUploader, setShowUploader] = useState(false);
  const fileInputRef = useRef(null);
  
  const [synthesizeMode, setSynthesizeMode] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState(null);
  
  // Saved briefs state
  const [savedBriefs, setSavedBriefs] = useState([]);
  const [viewingBrief, setViewingBrief] = useState(null);
  
  // Toast state
  const [toast, setToast] = useState(null);

  // Show toast helper
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const createLocalBlob = (doc) => {
    const blob = new Blob([`Mock contents for ${doc.name}`], { type: "text/plain" });
    return URL.createObjectURL(blob);
  };

  const buildSmartSummary = (doc) => {
    const baseTitle = doc.name.replace(/\.[^/.]+$/, "");
    return {
      summaryText: `High-level summary for "${baseTitle}".`,
      keyInsights: ["Main objective.", "Notable constraints.", "Timeline impacts."],
      actionPlan: [
        { priority: "High", title: "Confirm milestone", ownerHint: "Project lead", effort: "2h", dueHint: "1–2 days" },
        { priority: "Medium", title: "Clarify blockers", ownerHint: "Engineering", effort: "1–3h", dueHint: "This week" },
      ],
      risks: ["Timeline slippage.", "Missing assets."],
      meta: { generatedAt: new Date().toISOString(), sourceDocId: doc.id },
    };
  };

  const handlePreview = (doc) => navigate(`/dashboard/documents/view/${doc.id}`);

  const runSmartSummary = async (doc) => {
    const summary = buildSmartSummary(doc);
    setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, smartSummary: summary } : d));
  };

  const handleSummarize = async (doc) => {
    await runSmartSummary(doc);
    navigate(`/dashboard/documents/view/${doc.id}`, { state: { scrollToSummary: true } });
  };

  const handleDownload = (doc) => {
    const url = doc.fileUrl || createLocalBlob(doc);
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.name;
    link.click();
  };

  const handleUploadButton = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const extension = file.name.split(".").pop()?.toUpperCase() || "FILE";
    const type = ["PDF", "DOCX", "XLSX"].includes(extension) ? extension : "FILE";
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: file.name,
      type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      updated: "Just now",
      fileUrl: URL.createObjectURL(file),
    };
    setDocs((prev) => [newDoc, ...prev]);
    setShowUploader(false);
    showToast(`Uploaded: ${file.name}`, "success");
  };

  const toggleDocSelection = (doc) => {
    setSelectedDocs((prev) =>
      prev.find((d) => d.id === doc.id) ? prev.filter((d) => d.id !== doc.id) : [...prev, doc]
    );
  };

  const startSynthesizeMode = () => {
    setSynthesizeMode(true);
    setSelectedDocs([]);
    setSynthesisResult(null);
  };

  const cancelSynthesizeMode = () => {
    setSynthesizeMode(false);
    setSelectedDocs([]);
  };

  const runSynthesis = async () => {
    if (selectedDocs.length < 2) {
      showToast("Please select at least 2 documents", "error");
      return;
    }
    setIsSynthesizing(true);
    await new Promise((r) => setTimeout(r, 2500 + Math.random() * 1500));
    const result = generateSynthesisResult(selectedDocs);
    setSynthesisResult(result);
    setIsSynthesizing(false);
    setSynthesizeMode(false);
    
    // Mark documents as synthesized
    const docIds = selectedDocs.map(d => d.id);
    setDocs((prev) => prev.map((d) => 
      docIds.includes(d.id) ? { ...d, synthesized: true, synthesizedAt: new Date().toISOString() } : d
    ));
    
    setSelectedDocs([]);
  };

  const generateSynthesisResult = (docs) => {
    const docNames = docs.map((d) => d.name.replace(/\.[^/.]+$/, ""));
    return {
      id: `brief-${Date.now()}`,
      title: `Research Brief: ${docNames.slice(0, 2).join(" & ")}${docs.length > 2 ? ` +${docs.length - 2} more` : ""}`,
      generatedAt: new Date().toISOString(),
      sourceCount: docs.length,
      sources: docs.map((d) => d.name),
      sourceIds: docs.map((d) => d.id),
      executiveSummary: `This synthesized brief combines insights from ${docs.length} documents to provide a unified view of the research findings, key themes, and recommended actions.`,
      keyThemes: [
        { theme: "Timeline & Delivery Pressure", frequency: "High", insight: "Multiple documents reference urgent deadlines." },
        { theme: "Cross-Team Dependencies", frequency: "Medium", insight: "Several handoffs between teams are potential bottlenecks." },
        { theme: "Resource Constraints", frequency: "Medium", insight: "Budget and staffing limitations mentioned." }
      ],
      consolidatedInsights: [
        "Primary focus should be on resolving blockers before next milestone.",
        "Communication gaps exist between technical and business teams.",
        "Client expectations may need to be reset based on current constraints.",
        "Quick wins are available if resource allocation is optimized."
      ],
      unifiedActionPlan: [
        { priority: "Critical", action: "Align all stakeholders on revised timeline", owners: "Project Lead + Client Success", deadline: "Within 48 hours", effort: "2-3 hours" },
        { priority: "High", action: "Resolve technical blockers", owners: "Engineering Lead", deadline: "This week", effort: "1-2 days" },
        { priority: "Medium", action: "Update resource allocation", owners: "Operations Manager", deadline: "Next week", effort: "Half day" }
      ],
      contradictions: [
        { topic: "Budget estimates", conflict: "Document A suggests $45K while Document B references $52K allocation.", recommendation: "Clarify with finance team before proceeding." }
      ],
      gaps: [
        "No clear escalation path defined for critical issues.",
        "Missing sign-off requirements for final deliverables.",
        "Risk mitigation strategies not fully documented."
      ]
    };
  };

  const closeSynthesisResult = () => setSynthesisResult(null);

  const saveBrief = () => {
    if (!synthesisResult) return;
    setSavedBriefs((prev) => [synthesisResult, ...prev]);
    showToast("Research brief saved successfully!", "success");
    closeSynthesisResult();
  };

  const deleteBrief = (briefId) => {
    setSavedBriefs((prev) => prev.filter((b) => b.id !== briefId));
    showToast("Brief deleted", "success");
  };

  const viewBrief = (brief) => {
    setViewingBrief(brief);
  };

  const filteredDocs = useMemo(
    () => docs.filter((d) => {
      const matchesType = filterType === "ALL" || d.type === filterType;
      const matchesQuery = d.name.toLowerCase().includes(query.toLowerCase());
      return matchesType && matchesQuery;
    }),
    [query, filterType, docs]
  );

  // Get synthesized docs
  const synthesizedDocs = docs.filter(d => d.synthesized);

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[10000] px-4 py-3 rounded-xl text-sm font-medium shadow-xl backdrop-blur-md ${
              toast.type === "error"
                ? "bg-rose-900/80 text-rose-200 border border-rose-500/40"
                : "bg-emerald-900/80 text-emerald-200 border border-emerald-500/40"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="pt-2 px-1">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Research Synthesizer</h1>
          <Brain className="text-indigo-400" size={24} weight="duotone" />
        </div>
        <p className="text-gray-400 text-sm mt-1 mb-5">Merge multiple documents into one clean, actionable brief.</p>

        <div className="flex flex-col sm:flex-row gap-3 mt-1 mb-2">
          <button
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium shadow-lg flex-1 py-3 rounded-full"
            onClick={() => { setShowUploader(true); handleUploadButton(); }}
          >
            <FilePlus size={20} weight="bold" />
            Upload Document
          </button>

          <button
            className={`flex items-center justify-center gap-2 font-medium shadow-lg flex-1 py-3 rounded-full transition-all ${
              synthesizeMode ? "bg-rose-600 hover:bg-rose-500 text-white" : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
            }`}
            onClick={synthesizeMode ? cancelSynthesizeMode : startSynthesizeMode}
          >
            {synthesizeMode ? <><FiX size={18} /> Cancel Selection</> : <><Sparkle size={20} weight="fill" /> Synthesize Documents</>}
          </button>
        </div>

        <AnimatePresence>
          {synthesizeMode && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <FiLayers className="text-purple-400" size={18} />
                  <span className="text-sm text-purple-200">
                    Select {selectedDocs.length < 2 ? `at least 2 documents` : `${selectedDocs.length} selected`}
                  </span>
                </div>
                {selectedDocs.length >= 2 && (
                  <button onClick={runSynthesis} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded-full transition">
                    <Sparkle size={16} weight="fill" /> Generate Brief
                  </button>
                )}
              </div>
              {selectedDocs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedDocs.map((doc) => (
                    <span key={doc.id} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full border border-purple-500/30 flex items-center gap-1">
                      {doc.name}
                      <button onClick={() => toggleDocSelection(doc)} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Saved Briefs Section */}
      {savedBriefs.length > 0 && (
        <GlassCard className="border-purple-500/30">
          <div className="flex items-center gap-2 mb-4">
            <FiBookOpen className="text-purple-400" size={18} />
            <h2 className="text-sm font-semibold text-purple-300">Saved Research Briefs</h2>
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{savedBriefs.length}</span>
          </div>
          <div className="space-y-2">
            {savedBriefs.map((brief) => (
              <div
                key={brief.id}
                className="flex items-center justify-between bg-[#101016] border border-purple-500/20 rounded-xl px-4 py-3 hover:border-purple-500/40 transition"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <Brain size={16} weight="duotone" className="text-purple-400 flex-shrink-0" />
                    <p className="text-gray-100 text-sm font-medium truncate">{brief.title}</p>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {brief.sourceCount} sources • {new Date(brief.generatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => viewBrief(brief)}
                    className="text-purple-400 hover:text-purple-300 p-2 transition"
                    title="View Brief"
                  >
                    <FiEye size={18} />
                  </button>
                  <button
                    onClick={() => deleteBrief(brief.id)}
                    className="text-gray-500 hover:text-rose-400 p-2 transition"
                    title="Delete"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Documents List */}
      <GlassCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <input
            type="text"
            placeholder="Search documents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-80 bg-[#101016] border border-[#26262c] rounded-xl px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:border-indigo-500/70 focus:outline-none"
          />
          <div className="flex gap-2 text-xs">
            {["ALL", "PDF", "DOCX", "XLSX"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-[6px] rounded-full border transition ${
                  filterType === t ? "bg-indigo-500/25 text-indigo-200 border-indigo-500/40" : "bg-transparent text-gray-500 border-gray-700 hover:text-white"
                }`}
              >
                {t === "ALL" ? "All" : t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {filteredDocs.length === 0 && <p className="text-gray-500 text-xs text-center py-4">No matching documents</p>}
          {filteredDocs.map((doc) => {
            const isSelected = selectedDocs.find((d) => d.id === doc.id);
            return (
              <div
                key={doc.id}
                onClick={synthesizeMode ? () => toggleDocSelection(doc) : undefined}
                className={`flex items-center justify-between bg-[#101016] border rounded-xl px-4 py-3 transition cursor-pointer ${
                  synthesizeMode
                    ? isSelected ? "border-purple-500/60 bg-purple-500/10" : "border-[#26262c] hover:border-purple-500/40"
                    : "border-[#26262c] hover:border-indigo-500/40"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 pr-6 min-w-0">
                  {synthesizeMode && (
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${isSelected ? "bg-purple-500 border-purple-500" : "border-gray-600"}`}>
                      {isSelected && <FiCheck size={14} className="text-white" />}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-gray-100 text-[14px] font-medium truncate">{doc.name}</p>
                      {doc.synthesized && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-500/30 flex-shrink-0">
                          Synthesized
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">{doc.type} · {doc.size} · Updated {doc.updated}</p>
                  </div>
                </div>
                {!synthesizeMode && (
                  <div className="flex gap-3 items-center">
                    <button className="text-gray-400 hover:text-indigo-300 active:scale-95 transition" onClick={(e) => { e.stopPropagation(); handlePreview(doc); }} title="Preview"><FiEye size={22} /></button>
                    <button className="text-gray-400 hover:text-indigo-300 active:scale-95 transition" onClick={(e) => { e.stopPropagation(); handleSummarize(doc); }} title="AI Summary"><FiFileText size={22} /></button>
                    <button className="text-gray-400 hover:text-rose-300 active:scale-95 transition" onClick={(e) => { e.stopPropagation(); handleDownload(doc); }} title="Download"><FiDownload size={22} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelected} />
      {showUploader && <div className="fixed inset-0 z-[9998] bg-black/40" onClick={() => setShowUploader(false)} />}

      {/* Synthesizing Overlay */}
      <AnimatePresence>
        {isSynthesizing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Sparkle size={32} weight="fill" className="text-purple-400 animate-pulse" />
              </div>
              <h3 className="text-lg text-white mb-2">Synthesizing Documents...</h3>
              <p className="text-sm text-gray-400">Analyzing {selectedDocs.length} documents</p>
              <div className="w-48 h-1.5 bg-[#1c1c24] rounded-full overflow-hidden mt-4 mx-auto">
                <div className="h-full w-full bg-purple-500 animate-[loadbar_1.2s_infinite]" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Synthesis Result Modal / Viewing Brief Modal */}
      <AnimatePresence>
        {(synthesisResult || viewingBrief) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/90 overflow-y-auto"
          >
            <div className="min-h-full px-4 py-6">
              <div className="max-w-3xl mx-auto">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => { closeSynthesisResult(); setViewingBrief(null); }}
                    className="text-gray-400 hover:text-white p-2 bg-[#1c1c24] rounded-full"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                {(() => {
                  const brief = synthesisResult || viewingBrief;
                  return (
                    <>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                          <Brain size={28} weight="duotone" className="text-purple-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-white">{brief.title}</h2>
                          <p className="text-xs text-gray-500">Synthesized from {brief.sourceCount} documents • {new Date(brief.generatedAt).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <GlassCard className="p-4">
                          <h3 className="text-sm font-semibold text-indigo-300 mb-2">Sources Analyzed</h3>
                          <div className="flex flex-wrap gap-2">
                            {brief.sources.map((source, i) => (
                              <span key={i} className="text-xs bg-[#101016] text-gray-400 px-2 py-1 rounded border border-[#26262c]">{source}</span>
                            ))}
                          </div>
                        </GlassCard>

                        <GlassCard className="p-4">
                          <h3 className="text-sm font-semibold text-indigo-300 mb-2">Executive Summary</h3>
                          <p className="text-sm text-gray-300 leading-relaxed">{brief.executiveSummary}</p>
                        </GlassCard>

                        <GlassCard className="p-4">
                          <h3 className="text-sm font-semibold text-indigo-300 mb-3">Key Themes Identified</h3>
                          <div className="space-y-3">
                            {brief.keyThemes.map((theme, i) => (
                              <div key={i} className="bg-[#101016] border border-[#26262c] rounded-xl p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-white">{theme.theme}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${theme.frequency === "High" ? "bg-rose-900/40 text-rose-300" : "bg-amber-900/40 text-amber-300"}`}>
                                    {theme.frequency}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400">{theme.insight}</p>
                              </div>
                            ))}
                          </div>
                        </GlassCard>

                        <GlassCard className="p-4">
                          <h3 className="text-sm font-semibold text-indigo-300 mb-2">Consolidated Insights</h3>
                          <ul className="space-y-1 text-sm text-gray-300 list-disc list-inside">
                            {brief.consolidatedInsights.map((insight, i) => <li key={i}>{insight}</li>)}
                          </ul>
                        </GlassCard>

                        <GlassCard className="p-4">
                          <h3 className="text-sm font-semibold text-indigo-300 mb-3">Unified Action Plan</h3>
                          <div className="space-y-3">
                            {brief.unifiedActionPlan.map((action, i) => (
                              <div key={i} className="bg-[#101016] border border-[#26262c] rounded-xl p-3">
                                <p className="text-sm font-medium text-white mb-2">{action.action}</p>
                                <div className="flex flex-wrap gap-2 text-[10px]">
                                  <span className={`px-2 py-0.5 rounded-full ${action.priority === "Critical" ? "bg-rose-900/40 text-rose-300" : action.priority === "High" ? "bg-orange-900/40 text-orange-300" : "bg-indigo-900/40 text-indigo-300"}`}>{action.priority}</span>
                                  <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full">{action.owners}</span>
                                  <span className="px-2 py-0.5 bg-purple-900/40 text-purple-300 rounded-full">{action.deadline}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </GlassCard>

                        {brief.contradictions.length > 0 && (
                          <GlassCard className="p-4 border-amber-500/30">
                            <h3 className="text-sm font-semibold text-amber-300 mb-2">⚠️ Contradictions Found</h3>
                            {brief.contradictions.map((c, i) => (
                              <div key={i} className="bg-amber-900/10 border border-amber-500/20 rounded-lg p-3 text-sm">
                                <p className="text-amber-200 font-medium">{c.topic}</p>
                                <p className="text-gray-400 text-xs mt-1">{c.conflict}</p>
                                <p className="text-amber-300 text-xs mt-1">→ {c.recommendation}</p>
                              </div>
                            ))}
                          </GlassCard>
                        )}

                        <GlassCard className="p-4">
                          <h3 className="text-sm font-semibold text-rose-300 mb-2">📋 Information Gaps</h3>
                          <ul className="space-y-1 text-sm text-gray-400 list-disc list-inside">
                            {brief.gaps.map((gap, i) => <li key={i}>{gap}</li>)}
                          </ul>
                        </GlassCard>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 pb-24">
                          <button
                            onClick={() => { closeSynthesisResult(); setViewingBrief(null); }}
                            className="flex-1 py-4 rounded-full bg-[#1c1c24] text-gray-300 hover:bg-[#262631] transition font-medium text-base"
                          >
                            Close
                          </button>
                          {synthesisResult && !viewingBrief && (
                            <button
                              onClick={saveBrief}
                              className="flex-1 py-4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white transition font-medium text-base"
                            >
                              Save Brief
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
