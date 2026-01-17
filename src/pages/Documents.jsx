// src/pages/Documents.jsx - "Research Synthesizer"
import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import { useWorkspaceSettings } from "../hooks/useWorkspaceSettings";
import { 
  FiEye, 
  FiFileText, 
  FiDownload, 
  FiCheck,
  FiX,
  FiLayers,
  FiTrash2,
  FiBookOpen,
  FiZap
} from "react-icons/fi";
import { Brain, Sparkle, FilePlus } from "phosphor-react";

/* -----------------------------------------
   Priority Tag Component - Theme Aware
----------------------------------------- */
function PriorityTag({ priority, children }) {
  const baseClasses = "text-[10px] font-semibold px-2.5 py-1 rounded-full border";
  
  const styles = {
    critical: "bg-rose-500/20 text-rose-600 border-rose-500/40 dark:text-rose-400",
    high: "bg-rose-500/20 text-rose-600 border-rose-500/40 dark:text-rose-400",
    medium: "bg-amber-500/20 text-amber-600 border-amber-500/40 dark:text-amber-400",
    low: "bg-emerald-500/20 text-emerald-600 border-emerald-500/40 dark:text-emerald-400",
    info: "bg-purple-500/20 text-purple-600 border-purple-500/40 dark:text-purple-400",
  };

  const priorityKey = priority?.toLowerCase() || "medium";
  const style = styles[priorityKey] || styles.medium;

  return (
    <span className={`${baseClasses} ${style}`}>
      {children}
    </span>
  );
}

export default function Documents({ docs = [], setDocs }) {
  const navigate = useNavigate();
  const { settings } = useWorkspaceSettings();
  
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [showUploader, setShowUploader] = useState(false);
  const fileInputRef = useRef(null);
  
  const [synthesizeMode, setSynthesizeMode] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState(null);
  
  // Auto-summarize state
  const [autoSummarizing, setAutoSummarizing] = useState(null); // doc id being summarized
  
  const [savedBriefs, setSavedBriefs] = useState([]);
  const [viewingBrief, setViewingBrief] = useState(null);
  const [toast, setToast] = useState(null);

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

  const runSmartSummary = async (doc, isAutomatic = false) => {
    if (isAutomatic) {
      setAutoSummarizing(doc.id);
    }
    
    // Simulate AI processing time
    await new Promise((r) => setTimeout(r, isAutomatic ? 1500 : 800));
    
    const summary = buildSmartSummary(doc);
    setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, smartSummary: summary } : d));
    
    if (isAutomatic) {
      setAutoSummarizing(null);
      showToast(`AI summary generated for "${doc.name}"`, "success");
    }
  };

  const handleSummarize = async (doc) => {
    await runSmartSummary(doc, false);
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

  const handleFileSelected = async (e) => {
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
    
    // ✅ Auto-summarize if setting is enabled
    if (settings.autoSummarize) {
      // Small delay to let the UI update first
      setTimeout(() => {
        runSmartSummary(newDoc, true);
      }, 500);
    }
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

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[10000] px-4 py-3 rounded-xl text-sm font-medium shadow-xl flex items-center gap-2 ${
              toast.type === "error"
                ? "bg-rose-500 text-white"
                : "bg-emerald-500 text-white"
            }`}
          >
            {toast.type === "success" && <FiCheck size={16} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="pt-2 px-1">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-semibold tracking-tight text-theme-primary">Research Synthesizer</h1>
          <Brain className="text-indigo-500" size={24} weight="duotone" />
        </div>
        <p className="text-theme-muted text-sm mt-1 mb-3">Merge multiple documents into one clean, actionable brief.</p>
        
        {/* Auto-summarize indicator */}
        {settings.autoSummarize && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
            <FiZap className="text-emerald-400" size={14} />
            <span className="text-xs text-emerald-400">Auto-summarize is enabled</span>
            <span className="text-xs text-theme-muted">• New uploads will be summarized automatically</span>
          </div>
        )}

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
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: "auto" }} 
              exit={{ opacity: 0, height: 0 }} 
              className="mt-4 p-4 rounded-xl border border-purple-500/30"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <FiLayers className="text-purple-500" size={18} />
                  <span className="text-sm text-theme-secondary">
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
                    <span key={doc.id} className="text-xs bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full border border-purple-500/30 flex items-center gap-1">
                      {doc.name}
                      <button onClick={() => toggleDocSelection(doc)} className="hover:text-purple-800 dark:hover:text-purple-200 ml-1">×</button>
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
            <FiBookOpen className="text-purple-500" size={18} />
            <h2 className="text-sm font-semibold text-purple-600 dark:text-purple-400">Saved Research Briefs</h2>
            <span className="text-xs bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">{savedBriefs.length}</span>
          </div>
          <div className="space-y-2">
            {savedBriefs.map((brief) => (
              <div
                key={brief.id}
                className="flex items-center justify-between rounded-xl px-4 py-3 border border-purple-500/20 hover:border-purple-500/40 transition"
                style={{ backgroundColor: 'var(--bg-elevated)' }}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <Brain size={16} weight="duotone" className="text-purple-500 flex-shrink-0" />
                    <p className="text-theme-secondary text-sm font-medium truncate">{brief.title}</p>
                  </div>
                  <p className="text-[11px] text-theme-muted mt-1">
                    {brief.sourceCount} sources • {new Date(brief.generatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => viewBrief(brief)} className="text-purple-500 hover:text-purple-600 dark:hover:text-purple-400 p-2 transition" title="View Brief">
                    <FiEye size={18} />
                  </button>
                  <button onClick={() => deleteBrief(brief.id)} className="text-theme-muted hover:text-rose-500 p-2 transition" title="Delete">
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
            className="w-full md:w-80 rounded-xl px-3 py-2 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-secondary)',
            }}
          />
          <div className="flex gap-2 text-xs">
            {["ALL", "PDF", "DOCX", "XLSX"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-[6px] rounded-full border transition font-medium ${
                  filterType === t 
                    ? "bg-indigo-600 text-white border-indigo-600" 
                    : "text-theme-muted hover:text-theme-primary border-gray-300 dark:border-gray-600"
                }`}
                style={filterType !== t ? { backgroundColor: 'var(--bg-button)' } : {}}
              >
                {t === "ALL" ? "All" : t}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {filteredDocs.length === 0 && <p className="text-theme-muted text-xs text-center py-4">No matching documents</p>}
          {filteredDocs.map((doc) => {
            const isSelected = selectedDocs.find((d) => d.id === doc.id);
            const isAutoSummarizing = autoSummarizing === doc.id;
            
            return (
              <div
                key={doc.id}
                onClick={synthesizeMode ? () => toggleDocSelection(doc) : undefined}
                className={`flex items-center justify-between rounded-xl px-4 py-3 transition cursor-pointer border ${
                  synthesizeMode && isSelected ? "border-purple-500/60" : "hover:border-indigo-500/40"
                }`}
                style={{ 
                  backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.1)' : 'var(--bg-elevated)',
                  borderColor: isSelected ? 'rgba(168, 85, 247, 0.6)' : 'var(--border-secondary)',
                }}
              >
                <div className="flex items-center gap-3 flex-1 pr-6 min-w-0">
                  {synthesizeMode && (
                    <div 
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                        isSelected ? "bg-purple-500 border-purple-500" : ""
                      }`}
                      style={!isSelected ? { borderColor: 'var(--text-muted)' } : {}}
                    >
                      {isSelected && <FiCheck size={14} className="text-white" />}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-theme-secondary text-[14px] font-medium truncate">{doc.name}</p>
                      {doc.synthesized && (
                        <PriorityTag priority="info">Synthesized</PriorityTag>
                      )}
                      {doc.smartSummary && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          AI Summary
                        </span>
                      )}
                      {isAutoSummarizing && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                          Summarizing...
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-theme-muted mt-0.5 truncate">{doc.type} · {doc.size} · Updated {doc.updated}</p>
                  </div>
                </div>
                {!synthesizeMode && (
                  <div className="flex gap-3 items-center">
                    <button className="text-theme-muted hover:text-indigo-500 active:scale-95 transition" onClick={(e) => { e.stopPropagation(); handlePreview(doc); }} title="Preview"><FiEye size={22} /></button>
                    <button 
                      className="text-theme-muted hover:text-indigo-500 active:scale-95 transition disabled:opacity-50" 
                      onClick={(e) => { e.stopPropagation(); handleSummarize(doc); }} 
                      title="AI Summary"
                      disabled={isAutoSummarizing}
                    >
                      <FiFileText size={22} />
                    </button>
                    <button className="text-theme-muted hover:text-rose-500 active:scale-95 transition" onClick={(e) => { e.stopPropagation(); handleDownload(doc); }} title="Download"><FiDownload size={22} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelected} />
      {showUploader && <div className="fixed inset-0 z-[9998]" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowUploader(false)} />}

      {/* Synthesizing Overlay */}
      <AnimatePresence>
        {isSynthesizing && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-overlay)' }}
          >
            <div 
              className="text-center p-8 rounded-2xl border shadow-2xl"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-secondary)' }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Sparkle size={32} weight="fill" className="text-purple-500 animate-pulse" />
              </div>
              <h3 className="text-lg text-theme-primary mb-2">Synthesizing Documents...</h3>
              <p className="text-sm text-theme-muted">Analyzing {selectedDocs.length} documents</p>
              <div 
                className="w-48 h-1.5 rounded-full overflow-hidden mt-4 mx-auto"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div className="h-full w-full bg-purple-500 animate-[loadbar_1.2s_infinite]" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Synthesis Result Modal / Viewing Brief Modal - SOLID BACKGROUND */}
      <AnimatePresence>
        {(synthesisResult || viewingBrief) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div className="min-h-full px-4 py-6">
              <div className="max-w-3xl mx-auto">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => { closeSynthesisResult(); setViewingBrief(null); }}
                    className="text-theme-muted hover:text-theme-primary p-2 rounded-full transition"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
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
                          <Brain size={28} weight="duotone" className="text-purple-500" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-theme-primary">{brief.title}</h2>
                          <p className="text-xs text-theme-muted">Synthesized from {brief.sourceCount} documents • {new Date(brief.generatedAt).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Sources Analyzed */}
                        <SectionCard title="Sources Analyzed" color="indigo">
                          <div className="flex flex-wrap gap-2">
                            {brief.sources.map((source, i) => (
                              <span 
                                key={i} 
                                className="text-xs text-theme-secondary px-3 py-1.5 rounded-lg border"
                                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
                              >
                                {source}
                              </span>
                            ))}
                          </div>
                        </SectionCard>

                        {/* Executive Summary */}
                        <SectionCard title="Executive Summary" color="indigo">
                          <p className="text-sm text-theme-secondary leading-relaxed">{brief.executiveSummary}</p>
                        </SectionCard>

                        {/* Key Themes */}
                        <SectionCard title="Key Themes Identified" color="indigo">
                          <div className="space-y-3">
                            {brief.keyThemes.map((theme, i) => (
                              <div 
                                key={i} 
                                className="rounded-xl p-4 border"
                                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-secondary)' }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-theme-primary">{theme.theme}</span>
                                  <PriorityTag priority={theme.frequency}>
                                    {theme.frequency}
                                  </PriorityTag>
                                </div>
                                <p className="text-xs text-theme-muted">{theme.insight}</p>
                              </div>
                            ))}
                          </div>
                        </SectionCard>

                        {/* Consolidated Insights */}
                        <SectionCard title="Consolidated Insights" color="indigo">
                          <ul className="space-y-2 text-sm text-theme-secondary">
                            {brief.consolidatedInsights.map((insight, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-indigo-500 mt-0.5">•</span>
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </SectionCard>

                        {/* Unified Action Plan */}
                        <SectionCard title="Unified Action Plan" color="indigo">
                          <div className="space-y-3">
                            {brief.unifiedActionPlan.map((action, i) => (
                              <div 
                                key={i} 
                                className="rounded-xl p-4 border"
                                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-secondary)' }}
                              >
                                <p className="text-sm font-medium text-theme-primary mb-3">{action.action}</p>
                                <div className="flex flex-wrap gap-2">
                                  <PriorityTag priority={action.priority}>
                                    {action.priority}
                                  </PriorityTag>
                                  <span 
                                    className="text-[10px] font-medium px-2.5 py-1 rounded-full text-theme-secondary border"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
                                  >
                                    {action.owners}
                                  </span>
                                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                    {action.deadline}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </SectionCard>

                        {/* Contradictions */}
                        {brief.contradictions.length > 0 && (
                          <SectionCard title="⚠️ Contradictions Found" color="amber">
                            {brief.contradictions.map((c, i) => (
                              <div 
                                key={i} 
                                className="rounded-xl p-4 text-sm border"
                                style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                              >
                                <p className="text-amber-600 dark:text-amber-400 font-semibold">{c.topic}</p>
                                <p className="text-theme-secondary text-xs mt-1">{c.conflict}</p>
                                <p className="text-amber-600 dark:text-amber-400 text-xs mt-2 font-medium">→ {c.recommendation}</p>
                              </div>
                            ))}
                          </SectionCard>
                        )}

                        {/* Information Gaps */}
                        <SectionCard title="📋 Information Gaps" color="rose">
                          <ul className="space-y-2 text-sm text-theme-muted">
                            {brief.gaps.map((gap, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-rose-500 mt-0.5">•</span>
                                {gap}
                              </li>
                            ))}
                          </ul>
                        </SectionCard>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 pb-24">
                          <button
                            onClick={() => { closeSynthesisResult(); setViewingBrief(null); }}
                            className="flex-1 py-4 rounded-full text-theme-secondary hover:text-theme-primary transition font-medium text-base border"
                            style={{ backgroundColor: 'var(--bg-button)', borderColor: 'var(--border-secondary)' }}
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

/* -----------------------------------------
   Section Card Component
----------------------------------------- */
function SectionCard({ title, color = "indigo", children }) {
  const colorMap = {
    indigo: "text-indigo-600 dark:text-indigo-400",
    purple: "text-purple-600 dark:text-purple-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
  };

  return (
    <div 
      className="rounded-2xl p-5 border"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
    >
      <h3 className={`text-sm font-semibold ${colorMap[color]} mb-3`}>{title}</h3>
      {children}
    </div>
  );
}