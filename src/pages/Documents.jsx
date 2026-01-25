// src/pages/Documents.jsx - "Research Synthesizer"
import { useState, useMemo, useRef } from "react";
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
  FiZap,
  FiSearch,
  FiFile,
  FiFolder,
} from "react-icons/fi";
import { Brain, Sparkle, FilePlus, FileDoc, FilePdf, FileXls } from "phosphor-react";

/* -----------------------------------------
   Priority Tag Component
----------------------------------------- */
function PriorityTag({ priority, children }) {
  const baseClasses = "text-[10px] font-semibold px-2.5 py-1 rounded-full border";
  
  const styles = {
    critical: "bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-400",
    high: "bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-400",
    medium: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
    low: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
    info: "bg-purple-500/15 text-purple-600 border-purple-500/30 dark:text-purple-400",
  };

  const priorityKey = priority?.toLowerCase() || "medium";
  const style = styles[priorityKey] || styles.medium;

  return <span className={`${baseClasses} ${style}`}>{children}</span>;
}

/* -----------------------------------------
   File Type Icon Component
----------------------------------------- */
function FileTypeIcon({ type, size = 20 }) {
  const iconProps = { size, weight: "duotone" };
  
  switch (type?.toUpperCase()) {
    case "PDF":
      return <FilePdf {...iconProps} className="text-rose-500" />;
    case "DOCX":
    case "DOC":
      return <FileDoc {...iconProps} className="text-blue-500" />;
    case "XLSX":
    case "XLS":
      return <FileXls {...iconProps} className="text-emerald-500" />;
    default:
      return <FiFile size={size} className="text-theme-muted" />;
  }
}

/* -----------------------------------------
   Toggle Button Component
----------------------------------------- */
function ToggleButton({ children, active, onClick }) {
  return (
    <button
      className={`px-3.5 py-2 rounded-xl border font-medium text-xs transition-all ${
        active
          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25"
          : "text-theme-muted border-theme-secondary hover:text-theme-primary hover:border-theme-tertiary"
      }`}
      style={!active ? { backgroundColor: 'var(--bg-button)' } : {}}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function Documents({ docs = [], setDocs }) {
  const navigate = useNavigate();
  const { settings } = useWorkspaceSettings();
  
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const fileInputRef = useRef(null);
  
  const [synthesizeMode, setSynthesizeMode] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState(null);
  const [autoSummarizing, setAutoSummarizing] = useState(null);
  
  const [savedBriefs, setSavedBriefs] = useState([]);
  const [viewingBrief, setViewingBrief] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
    if (isAutomatic) setAutoSummarizing(doc.id);
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
    const blob = new Blob([`Mock contents for ${doc.name}`], { type: "text/plain" });
    const url = doc.fileUrl || URL.createObjectURL(blob);
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
    showToast(`Uploaded: ${file.name}`, "success");
    
    if (settings.autoSummarize) {
      setTimeout(() => runSmartSummary(newDoc, true), 500);
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
      docIds.includes(d.id) ? { ...d, synthesized: true } : d
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
        { priority: "Critical", action: "Align all stakeholders on revised timeline", owners: "Project Lead + Client Success", deadline: "Within 48 hours" },
        { priority: "High", action: "Resolve technical blockers", owners: "Engineering Lead", deadline: "This week" },
        { priority: "Medium", action: "Update resource allocation", owners: "Operations Manager", deadline: "Next week" }
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
    showToast("Research brief saved!", "success");
    closeSynthesisResult();
  };

  const deleteBrief = (briefId) => {
    setSavedBriefs((prev) => prev.filter((b) => b.id !== briefId));
    showToast("Brief deleted", "success");
  };

  const viewBrief = (brief) => setViewingBrief(brief);

  const filteredDocs = useMemo(
    () => docs.filter((d) => {
      const matchesType = filterType === "ALL" || d.type === filterType;
      const matchesQuery = d.name.toLowerCase().includes(query.toLowerCase());
      return matchesType && matchesQuery;
    }),
    [query, filterType, docs]
  );

  const totalDocs = docs.length;
  const synthesizedCount = docs.filter(d => d.synthesized).length;
  const summarizedCount = docs.filter(d => d.smartSummary).length;

  return (
    <div className="space-y-5 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[10000] px-4 py-3 rounded-xl text-sm font-medium shadow-xl flex items-center gap-2 ${
              toast.type === "error" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
            }`}
          >
            {toast.type === "success" && <FiCheck size={16} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="page-header">
        <div className="page-header-content">
          <div className="page-header-icon">
            <Brain weight="duotone" />
          </div>
          <div>
            <h1 className="page-header-title">Research Synthesizer</h1>
            <p className="page-header-subtitle">Merge multiple documents into actionable briefs</p>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <QuickStat label="Total Docs" value={totalDocs} icon={<FiFolder size={16} />} color="indigo" />
        <QuickStat label="Synthesized" value={synthesizedCount} icon={<Sparkle size={16} weight="fill" />} color="purple" />
        <QuickStat label="AI Summaries" value={summarizedCount} icon={<FiZap size={16} />} color="emerald" />
      </div>

      {/* Auto-summarize indicator */}
      {settings.autoSummarize && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
          <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <FiZap className="text-emerald-400" size={12} />
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Auto-summarize enabled</span>
          <span className="text-xs text-theme-muted">• New uploads summarized automatically</span>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium shadow-lg shadow-indigo-500/25 flex-1 py-3.5 rounded-xl transition-all"
          onClick={handleUploadButton}
        >
          <FilePlus size={20} weight="bold" />
          Upload Document
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center justify-center gap-2.5 font-medium shadow-lg flex-1 py-3.5 rounded-xl transition-all ${
            synthesizeMode 
              ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/25" 
              : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25"
          }`}
          onClick={synthesizeMode ? cancelSynthesizeMode : startSynthesizeMode}
        >
          {synthesizeMode ? <><FiX size={18} /> Cancel</> : <><Sparkle size={20} weight="fill" /> Synthesize Documents</>}
        </motion.button>
      </div>

      {/* Synthesize Mode Panel */}
      <AnimatePresence>
        {synthesizeMode && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="rounded-xl border border-purple-500/30 overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <FiLayers className="text-purple-400" size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-theme-primary">
                      {selectedDocs.length < 2 ? "Select at least 2 documents" : `${selectedDocs.length} documents selected`}
                    </p>
                    <p className="text-[11px] text-theme-muted">Click documents below to select</p>
                  </div>
                </div>
                {selectedDocs.length >= 2 && (
                  <motion.button whileHover={{ scale: 1.02 }} onClick={runSynthesis} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-purple-500/25">
                    <Sparkle size={16} weight="fill" /> Generate Brief
                  </motion.button>
                )}
              </div>
              {selectedDocs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                  {selectedDocs.map((doc) => (
                    <span key={doc.id} className="text-xs bg-purple-500/15 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-full border border-purple-500/30 flex items-center gap-2">
                      <FileTypeIcon type={doc.type} size={14} />
                      {doc.name}
                      <button onClick={() => toggleDocSelection(doc)} className="hover:text-purple-200 ml-1">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved Briefs */}
      {savedBriefs.length > 0 && (
        <GlassCard className="border-purple-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <FiBookOpen className="text-purple-400" size={16} />
            </div>
            <h2 className="text-sm font-semibold text-theme-primary">Saved Research Briefs</h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">{savedBriefs.length}</span>
          </div>
          <div className="space-y-2">
            {savedBriefs.map((brief) => (
              <motion.div key={brief.id} whileHover={{ scale: 1.01 }} className="flex items-center justify-between rounded-xl px-4 py-3 border border-purple-500/20 hover:border-purple-500/40 transition cursor-pointer" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <Brain size={16} weight="duotone" className="text-purple-500 flex-shrink-0" />
                    <p className="text-theme-primary text-sm font-medium truncate">{brief.title}</p>
                  </div>
                  <p className="text-[11px] text-theme-muted mt-1">{brief.sourceCount} sources • {new Date(brief.generatedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => viewBrief(brief)} className="text-purple-500 hover:text-purple-400 p-2 rounded-lg hover:bg-purple-500/10 transition"><FiEye size={18} /></button>
                  <button onClick={() => deleteBrief(brief.id)} className="text-theme-muted hover:text-rose-500 p-2 rounded-lg hover:bg-rose-500/10 transition"><FiTrash2 size={18} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Documents List */}
      <GlassCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={16} />
            <input
              type="text"
              placeholder="Search documents…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border transition"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-secondary)' }}
            />
          </div>
          <div className="flex gap-2">
            {["ALL", "PDF", "DOCX", "XLSX"].map((t) => (
              <ToggleButton key={t} active={filterType === t} onClick={() => setFilterType(t)}>
                {t === "ALL" ? "All" : t}
              </ToggleButton>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filteredDocs.length === 0 && (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-theme-tertiary flex items-center justify-center mx-auto mb-4">
                <FiFolder className="text-theme-muted" size={28} />
              </div>
              <p className="text-theme-muted text-sm mb-1">No documents found</p>
              <p className="text-theme-muted text-xs">Upload a document to get started</p>
            </div>
          )}
          {filteredDocs.map((doc, index) => {
            const isSelected = selectedDocs.find((d) => d.id === doc.id);
            const isAutoSummarizing = autoSummarizing === doc.id;
            
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={synthesizeMode ? () => toggleDocSelection(doc) : undefined}
                className={`flex items-center justify-between rounded-xl px-4 py-3.5 transition cursor-pointer border group ${
                  isSelected ? "border-purple-500/60" : "hover:border-indigo-500/40"
                }`}
                style={{ 
                  backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.08)' : 'var(--bg-elevated)',
                  borderColor: isSelected ? 'rgba(168, 85, 247, 0.5)' : 'var(--border-secondary)',
                }}
              >
                <div className="flex items-center gap-3 flex-1 pr-4 min-w-0">
                  {synthesizeMode ? (
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition flex-shrink-0 ${isSelected ? "bg-purple-500 border-purple-500" : ""}`} style={!isSelected ? { borderColor: 'var(--text-muted)' } : {}}>
                      {isSelected && <FiCheck size={12} className="text-white" />}
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}>
                      <FileTypeIcon type={doc.type} size={22} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-theme-primary text-sm font-medium truncate">{doc.name}</p>
                      {doc.synthesized && <PriorityTag priority="info">Synthesized</PriorityTag>}
                      {doc.smartSummary && !isAutoSummarizing && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">AI Summary</span>
                      )}
                      {isAutoSummarizing && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />Summarizing...
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-theme-muted mt-0.5">{doc.type} · {doc.size} · Updated {doc.updated}</p>
                  </div>
                </div>
                {!synthesizeMode && (
                  <div className="flex gap-1 items-center opacity-60 group-hover:opacity-100 transition">
                    <button className="text-theme-muted hover:text-indigo-500 p-2 rounded-lg hover:bg-indigo-500/10 transition" onClick={(e) => { e.stopPropagation(); handlePreview(doc); }} title="Preview"><FiEye size={18} /></button>
                    <button className="text-theme-muted hover:text-indigo-500 p-2 rounded-lg hover:bg-indigo-500/10 transition disabled:opacity-50" onClick={(e) => { e.stopPropagation(); handleSummarize(doc); }} title="AI Summary" disabled={isAutoSummarizing}><FiFileText size={18} /></button>
                    <button className="text-theme-muted hover:text-emerald-500 p-2 rounded-lg hover:bg-emerald-500/10 transition" onClick={(e) => { e.stopPropagation(); handleDownload(doc); }} title="Download"><FiDownload size={18} /></button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </GlassCard>

      <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelected} />

      {/* Synthesizing Overlay */}
      <AnimatePresence>
        {isSynthesizing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'var(--bg-overlay)' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center p-8 rounded-2xl border shadow-2xl max-w-sm mx-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-secondary)' }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center">
                <Sparkle size={32} weight="fill" className="text-purple-500 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-theme-primary mb-2">Synthesizing Documents</h3>
              <p className="text-sm text-theme-muted mb-4">Analyzing {selectedDocs.length} documents...</p>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <motion.div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3, ease: "easeInOut" }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brief Modal */}
      <AnimatePresence>
        {(synthesisResult || viewingBrief) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="min-h-full px-4 py-6">
              <div className="max-w-3xl mx-auto">
                <div className="flex justify-end mb-4">
                  <button onClick={() => { closeSynthesisResult(); setViewingBrief(null); }} className="text-theme-muted hover:text-theme-primary p-2.5 rounded-xl transition" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <FiX size={20} />
                  </button>
                </div>

                {(() => {
                  const brief = synthesisResult || viewingBrief;
                  return (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center">
                          <Brain size={28} weight="duotone" className="text-purple-500" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-theme-primary">{brief.title}</h2>
                          <p className="text-xs text-theme-muted mt-1">{brief.sourceCount} documents • {new Date(brief.generatedAt).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <SectionCard title="Sources Analyzed" icon={<FiFolder size={16} />} color="indigo">
                          <div className="flex flex-wrap gap-2">
                            {brief.sources.map((source, i) => (
                              <span key={i} className="text-xs text-theme-secondary px-3 py-1.5 rounded-lg border flex items-center gap-2" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}>
                                <FileTypeIcon type={source.split('.').pop()} size={14} />{source}
                              </span>
                            ))}
                          </div>
                        </SectionCard>

                        <SectionCard title="Executive Summary" icon={<FiFileText size={16} />} color="indigo">
                          <p className="text-sm text-theme-secondary leading-relaxed">{brief.executiveSummary}</p>
                        </SectionCard>

                        <SectionCard title="Key Themes" icon={<FiLayers size={16} />} color="purple">
                          <div className="space-y-3">
                            {brief.keyThemes.map((theme, i) => (
                              <div key={i} className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-secondary)' }}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-theme-primary">{theme.theme}</span>
                                  <PriorityTag priority={theme.frequency}>{theme.frequency}</PriorityTag>
                                </div>
                                <p className="text-xs text-theme-muted">{theme.insight}</p>
                              </div>
                            ))}
                          </div>
                        </SectionCard>

                        <SectionCard title="Consolidated Insights" icon={<FiZap size={16} />} color="emerald">
                          <ul className="space-y-2 text-sm text-theme-secondary">
                            {brief.consolidatedInsights.map((insight, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <span className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center flex-shrink-0 text-xs font-semibold">{i + 1}</span>
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </SectionCard>

                        <SectionCard title="Action Plan" icon={<FiCheck size={16} />} color="indigo">
                          <div className="space-y-3">
                            {brief.unifiedActionPlan.map((action, i) => (
                              <div key={i} className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-secondary)' }}>
                                <p className="text-sm font-medium text-theme-primary mb-3">{action.action}</p>
                                <div className="flex flex-wrap gap-2">
                                  <PriorityTag priority={action.priority}>{action.priority}</PriorityTag>
                                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-full text-theme-secondary border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}>{action.owners}</span>
                                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">{action.deadline}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </SectionCard>

                        {brief.contradictions.length > 0 && (
                          <SectionCard title="⚠️ Contradictions" color="amber">
                            {brief.contradictions.map((c, i) => (
                              <div key={i} className="rounded-xl p-4 text-sm border" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                                <p className="text-amber-600 dark:text-amber-400 font-semibold">{c.topic}</p>
                                <p className="text-theme-secondary text-xs mt-1">{c.conflict}</p>
                                <p className="text-amber-600 dark:text-amber-400 text-xs mt-2 font-medium">→ {c.recommendation}</p>
                              </div>
                            ))}
                          </SectionCard>
                        )}

                        <SectionCard title="📋 Information Gaps" color="rose">
                          <ul className="space-y-2 text-sm text-theme-muted">
                            {brief.gaps.map((gap, i) => (
                              <li key={i} className="flex items-start gap-2"><span className="text-rose-500 mt-0.5">•</span>{gap}</li>
                            ))}
                          </ul>
                        </SectionCard>

                        <div className="flex gap-3 pt-4 pb-24">
                          <button onClick={() => { closeSynthesisResult(); setViewingBrief(null); }} className="flex-1 py-4 rounded-xl text-theme-secondary hover:text-theme-primary transition font-medium border" style={{ backgroundColor: 'var(--bg-button)', borderColor: 'var(--border-secondary)' }}>Close</button>
                          {synthesisResult && !viewingBrief && (
                            <button onClick={saveBrief} className="flex-1 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-purple-500/25">Save Brief</button>
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

/* Quick Stat */
function QuickStat({ label, value, icon, color }) {
  const colorClasses = {
    indigo: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-400",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400",
  };
  const colors = colorClasses[color] || colorClasses.indigo;
  return (
    <div className="rounded-xl px-4 py-3 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
      <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${colors} border flex items-center justify-center mb-1`}>{icon}</div>
      <p className="text-xl font-bold text-theme-primary">{value}</p>
      <p className="text-[10px] text-theme-muted">{label}</p>
    </div>
  );
}

/* Section Card */
function SectionCard({ title, icon, color = "indigo", children }) {
  const colorMap = {
    indigo: "text-indigo-600 dark:text-indigo-400",
    purple: "text-purple-600 dark:text-purple-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
  };
  return (
    <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}>
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className={colorMap[color]}>{icon}</span>}
        <h3 className={`text-sm font-semibold ${colorMap[color]}`}>{title}</h3>
      </div>
      {children}
    </div>
  );
}