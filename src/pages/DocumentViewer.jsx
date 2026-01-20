// src/pages/DocumentViewer.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import {
  FiArrowLeft,
  FiDownload,
  FiFileText,
  FiCopy,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiZoomIn,
  FiZoomOut,
  FiList,
  FiSearch,
  FiMoreHorizontal,
  FiFile,
} from "react-icons/fi";
import { Sparkle, PencilSimple, Lightning, FileDoc, FilePdf, FileXls } from "phosphor-react";

/* File Type Icon */
function FileTypeIcon({ type, size = 20 }) {
  const iconProps = { size, weight: "duotone" };
  switch (type?.toUpperCase()) {
    case "PDF": return <FilePdf {...iconProps} className="text-rose-500" />;
    case "DOCX": case "DOC": return <FileDoc {...iconProps} className="text-blue-500" />;
    case "XLSX": case "XLS": return <FileXls {...iconProps} className="text-emerald-500" />;
    default: return <FiFile size={size} className="text-theme-muted" />;
  }
}

export default function DocumentViewer({ docs = [] }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const doc = docs.find((d) => d.id === id);
  
  const [showSummary, setShowSummary] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [showPageList, setShowPageList] = useState(false);
  
  // Rewrite feature
  const [showRewrite, setShowRewrite] = useState(false);
  const [rewriteStyle, setRewriteStyle] = useState(null);
  const [rewrittenText, setRewrittenText] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);

  useEffect(() => {
    if (location.state?.scrollToSummary && doc?.smartSummary) {
      setShowSummary(true);
    }
  }, [location.state, doc]);

  useEffect(() => {
    if (doc) {
      const pages = doc.type === "PDF" ? Math.floor(Math.random() * 10) + 1 : 1;
      setTotalPages(pages);
    }
  }, [doc]);

  if (!doc) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-theme-tertiary flex items-center justify-center mx-auto mb-4">
            <FiFile className="text-theme-muted" size={28} />
          </div>
          <p className="text-theme-muted mb-4">Document not found</p>
          <button
            onClick={() => navigate("/dashboard/documents")}
            className="text-indigo-500 hover:text-indigo-400 font-medium"
          >
            ← Back to Documents
          </button>
        </div>
      </div>
    );
  }

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsGenerating(false);
    setShowSummary(true);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (doc.fileUrl) {
      const link = document.createElement("a");
      link.href = doc.fileUrl;
      link.download = doc.name;
      link.click();
    }
  };

  const handleRewrite = async (style) => {
    setRewriteStyle(style);
    setIsRewriting(true);
    setRewrittenText("");
    
    await new Promise((r) => setTimeout(r, 1500));
    
    const mockRewriteResults = {
      Professional: `This document presents a comprehensive analysis of the subject matter. The key findings indicate significant developments that warrant careful consideration. Our recommendations are based on thorough research and industry best practices.`,
      Shorter: `Key points: Document analyzed. Main findings noted. Action items identified. Follow-up recommended.`,
      Friendly: `Hey there! 👋 So here's the deal with this document - it's got some really interesting stuff in it! The main takeaway is that things are looking good, and we've got some cool next steps to explore together.`,
    };
    
    setRewrittenText(mockRewriteResults[style] || "Rewritten content will appear here.");
    setIsRewriting(false);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setShowPageList(false);
    }
  };

  return (
    <div className="space-y-4 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard/documents")}
          className="flex items-center gap-2 text-theme-muted hover:text-theme-primary transition"
        >
          <FiArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2.5 rounded-xl text-theme-muted hover:text-emerald-500 transition border hover:border-emerald-500/30 hover:bg-emerald-500/10"
            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
            title="Download"
          >
            <FiDownload size={18} />
          </button>
          <button
            onClick={() => setShowRewrite(true)}
            className="p-2.5 rounded-xl text-theme-muted hover:text-purple-500 transition border hover:border-purple-500/30 hover:bg-purple-500/10"
            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
            title="Rewrite with AI"
          >
            <PencilSimple size={18} weight="duotone" />
          </button>
          <button
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            className="p-2.5 rounded-xl text-theme-muted hover:text-indigo-500 transition border hover:border-indigo-500/30 hover:bg-indigo-500/10"
            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
            title="AI Summary"
          >
            <FiFileText size={18} />
          </button>
        </div>
      </div>

      {/* Document Title Card */}
      <div 
        className="rounded-xl p-4 border flex items-center gap-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
      >
        <div 
          className="h-12 w-12 rounded-xl flex items-center justify-center border"
          style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
        >
          <FileTypeIcon type={doc.type} size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-theme-primary truncate">{doc.name}</h1>
          <p className="text-xs text-theme-muted">{doc.type} · {doc.size} · Updated {doc.updated}</p>
        </div>
        {doc.smartSummary && (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <FiCheck size={10} /> AI Summary
          </span>
        )}
      </div>

      {/* Document Viewer */}
      <div 
        className="rounded-2xl overflow-hidden border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
      >
        {/* Toolbar */}
        <div 
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
        >
          {/* Page Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPageList(!showPageList)}
              className={`p-2 rounded-lg transition ${showPageList ? 'text-indigo-500 bg-indigo-500/10' : 'text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary'}`}
              title="Page list"
            >
              <FiList size={16} />
            </button>
            <button
              className="p-2 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary transition"
              title="More options"
            >
              <FiMoreHorizontal size={16} />
            </button>
          </div>

          {/* Page Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary disabled:opacity-30 transition hover:bg-theme-tertiary"
            >
              <FiChevronLeft size={18} />
            </button>
            
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-10 text-center text-sm rounded-lg py-1.5 text-theme-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-secondary)' }}
                min={1}
                max={totalPages}
              />
              <span className="text-theme-muted text-sm">of {totalPages}</span>
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary disabled:opacity-30 transition hover:bg-theme-tertiary"
            >
              <FiChevronRight size={18} />
            </button>
          </div>

          {/* Zoom & Search */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              className="p-2 rounded-lg text-theme-muted hover:text-theme-primary transition hover:bg-theme-tertiary"
              title="Zoom out"
            >
              <FiZoomOut size={16} />
            </button>
            <span className="text-xs text-theme-muted w-10 text-center font-medium">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="p-2 rounded-lg text-theme-muted hover:text-theme-primary transition hover:bg-theme-tertiary"
              title="Zoom in"
            >
              <FiZoomIn size={16} />
            </button>
            <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--border-secondary)' }} />
            <button
              className="p-2 rounded-lg text-theme-muted hover:text-theme-primary transition hover:bg-theme-tertiary"
              title="Search"
            >
              <FiSearch size={16} />
            </button>
          </div>
        </div>

        {/* Page List Dropdown */}
        <AnimatePresence>
          {showPageList && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b overflow-hidden"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-secondary)' }}
            >
              <div className="p-4">
                <p className="text-xs text-theme-muted mb-3 font-medium">Jump to page</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition border ${
                        currentPage === page
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25"
                          : "text-theme-secondary hover:border-indigo-500/50"
                      }`}
                      style={currentPage !== page ? { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-secondary)' } : {}}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document Content */}
        <div 
          className="min-h-[60vh] flex items-center justify-center p-6"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          {doc.fileUrl ? (
            doc.type === "PDF" ? (
              <iframe
                src={doc.fileUrl}
                className="w-full h-[70vh] rounded-xl border shadow-lg"
                style={{ 
                  transform: `scale(${zoom / 100})`, 
                  transformOrigin: 'top center',
                  borderColor: 'var(--border-secondary)'
                }}
              />
            ) : (
              <div className="text-center">
                <div className="h-20 w-20 rounded-2xl bg-theme-tertiary flex items-center justify-center mx-auto mb-4 border" style={{ borderColor: 'var(--border-secondary)' }}>
                  <FileTypeIcon type={doc.type} size={48} />
                </div>
                <p className="text-theme-muted mb-4">Preview not available for {doc.type} files</p>
                <button
                  onClick={handleDownload}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition font-medium shadow-lg shadow-indigo-500/25"
                >
                  Download to View
                </button>
              </div>
            )
          ) : (
            <div className="text-center">
              <div className="h-20 w-20 rounded-2xl bg-theme-tertiary flex items-center justify-center mx-auto mb-4 border" style={{ borderColor: 'var(--border-secondary)' }}>
                <FiFile className="text-theme-muted" size={40} />
              </div>
              <p className="text-theme-muted">No preview available</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Summary Prompt */}
      {!showSummary && !doc.smartSummary && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 border flex items-center gap-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
        >
          <div className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
            <Sparkle size={20} weight="fill" className="text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-theme-primary">Generate AI Summary</p>
            <p className="text-xs text-theme-muted">Click the summary button above to extract key insights</p>
          </div>
        </motion.div>
      )}

      {/* Generating State */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GlassCard>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Lightning size={24} weight="fill" className="text-indigo-500 animate-pulse" />
                </div>
                <div>
                  <p className="text-theme-primary font-semibold">Generating AI Summary...</p>
                  <p className="text-xs text-theme-muted">Analyzing document content</p>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Summary Panel */}
      <AnimatePresence>
        {(showSummary || doc.smartSummary) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <Sparkle size={20} weight="fill" className="text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-theme-primary">AI Summary</h3>
                    <p className="text-[11px] text-theme-muted">Generated from document content</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(doc.smartSummary?.summaryText || "Summary text")}
                  className="text-theme-muted hover:text-theme-primary p-2 rounded-lg hover:bg-theme-tertiary transition"
                >
                  {copied ? <FiCheck size={18} className="text-emerald-500" /> : <FiCopy size={18} />}
                </button>
              </div>

              <p className="text-sm text-theme-secondary leading-relaxed mb-5">
                {doc.smartSummary?.summaryText || "This document has been analyzed. Key insights and action items have been identified based on the content."}
              </p>

              {/* Key Insights */}
              <div className="mb-5">
                <h4 className="text-xs font-semibold text-theme-muted mb-3 uppercase tracking-wide">Key Insights</h4>
                <ul className="space-y-2">
                  {(doc.smartSummary?.keyInsights || ["Main objective identified", "Notable constraints found", "Timeline impacts noted"]).map((insight, i) => (
                    <li key={i} className="text-sm text-theme-secondary flex items-start gap-3">
                      <span className="h-5 w-5 rounded-full bg-indigo-500/15 text-indigo-500 flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                        {i + 1}
                      </span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Plan */}
              {doc.smartSummary?.actionPlan && (
                <div>
                  <h4 className="text-xs font-semibold text-theme-muted mb-3 uppercase tracking-wide">Action Items</h4>
                  <div className="space-y-2">
                    {doc.smartSummary.actionPlan.map((action, i) => (
                      <div 
                        key={i}
                        className="rounded-xl p-4 border"
                        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-secondary)' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-theme-primary font-medium">{action.title}</span>
                          <span 
                            className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${
                              action.priority === "High" 
                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30" 
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {action.priority}
                          </span>
                        </div>
                        <p className="text-xs text-theme-muted">{action.ownerHint} · {action.effort}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rewrite Modal */}
      <AnimatePresence>
        {showRewrite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-start justify-center pt-12 px-4 overflow-y-auto backdrop-blur-sm"
            style={{ backgroundColor: 'var(--bg-overlay)' }}
            onClick={() => setShowRewrite(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl p-6 border relative mb-12 shadow-2xl"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-secondary)' }}
            >
              <button
                onClick={() => setShowRewrite(false)}
                className="absolute top-4 left-4 text-theme-muted hover:text-theme-primary transition"
              >
                <FiArrowLeft size={20} />
              </button>

              <div className="mt-8">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center">
                    <PencilSimple size={20} weight="duotone" className="text-purple-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-theme-primary">Rewrite with AI</h2>
                </div>
                <p className="text-theme-muted text-sm mb-6 ml-[52px]">{doc.name}</p>

                {/* Style Buttons */}
                <div className="flex gap-3 mb-6">
                  {["Professional", "Shorter", "Friendly"].map((style) => (
                    <button
                      key={style}
                      onClick={() => handleRewrite(style)}
                      disabled={isRewriting}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition border ${
                        rewriteStyle === style && !isRewriting
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/25"
                          : "text-theme-secondary hover:text-theme-primary hover:border-indigo-500/50"
                      }`}
                      style={rewriteStyle !== style ? { backgroundColor: 'var(--bg-button)', borderColor: 'var(--border-secondary)' } : {}}
                    >
                      {style}
                    </button>
                  ))}
                </div>

                {/* Output Area */}
                <div 
                  className="rounded-xl p-4 min-h-[200px] border"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-secondary)' }}
                >
                  {isRewriting ? (
                    <div className="flex items-center justify-center h-[180px]">
                      <div className="text-center">
                        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm text-theme-muted">Rewriting as {rewriteStyle}...</p>
                      </div>
                    </div>
                  ) : rewrittenText ? (
                    <div>
                      <p className="text-sm text-theme-secondary leading-relaxed">{rewrittenText}</p>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleCopy(rewrittenText)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-theme-secondary hover:text-theme-primary transition border hover:border-indigo-500/50"
                          style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
                        >
                          {copied ? <FiCheck size={14} className="text-emerald-500" /> : <FiCopy size={14} />}
                          Copy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[180px]">
                      <p className="text-theme-muted text-sm">Select a style to generate rewritten text</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

