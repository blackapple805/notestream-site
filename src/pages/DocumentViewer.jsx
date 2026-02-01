// src/pages/DocumentViewer.jsx
// Update: Adds incrementUsage(...) calls after successful feature usage
// - ✅ AI Summary: incrementUsage("aiSummaries") after summary succeeds
// - ✅ Rewrite: incrementUsage("insightQueries") after rewrite succeeds (using "insightQueries" as the closest bucket)
// Notes: Always call incrementUsage with camelCase keys (mapping handled in hook)

import { useState, useEffect, useMemo, useCallback } from "react";
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
import {
  Sparkle,
  PencilSimple,
  Lightning,
  FileDoc,
  FilePdf,
  FileXls,
} from "phosphor-react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { useSubscription } from "../hooks/useSubscription";

const DOCS_TABLE = "documents";
const NOTES_TABLE = "notes";
const STORAGE_BUCKET = "documents";

const TAG_DOC_SUMMARY = "ai:doc_summary";
const docTag = (docId) => `doc:${docId}`;

function nowIso() {
  return new Date().toISOString();
}

function formatUpdated(updatedAt) {
  if (!updatedAt) return "—";
  const d = new Date(updatedAt);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

/* File Type Icon */
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

function buildSmartSummary(doc) {
  const baseTitle = (doc?.name || "Document").replace(/\.[^/.]+$/, "");
  return {
    summaryText: `High-level summary for "${baseTitle}".`,
    keyInsights: ["Main objective.", "Notable constraints.", "Timeline impacts."],
    actionPlan: [
      {
        priority: "High",
        title: "Confirm milestone",
        ownerHint: "Project lead",
        effort: "2h",
        dueHint: "1–2 days",
      },
      {
        priority: "Medium",
        title: "Clarify blockers",
        ownerHint: "Engineering",
        effort: "1–3h",
        dueHint: "This week",
      },
    ],
    risks: ["Timeline slippage.", "Missing assets."],
    meta: { generatedAt: nowIso(), sourceDocId: doc?.id },
  };
}

function DbLoaderOverlay({
  open,
  title = "Loading Notes From DB",
  subtitle = "Preparing your workspace…",
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm"
          style={{ backgroundColor: "var(--bg-overlay)" }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="w-full max-w-sm mx-4 rounded-2xl border shadow-2xl p-6"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-secondary)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="h-12 w-12 rounded-2xl border flex items-center justify-center"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-theme-primary">
                  {title}
                </p>
                <p className="text-xs text-theme-muted mt-0.5">{subtitle}</p>
              </div>
            </div>

            <div
              className="mt-4 h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 1.6,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function DocumentViewer({ docs = [] }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Subscription usage tracker
  const { incrementUsage } = useSubscription();

  const docFromProps = useMemo(
    () => docs.find((d) => d.id === id) || null,
    [docs, id]
  );
  const [doc, setDoc] = useState(docFromProps);

  const [docLoading, setDocLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);

  // ✅ NEW: loader pattern you requested (notesLoading)
  const [notesLoading, setNotesLoading] = useState(false);

  const [showSummary, setShowSummary] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [aiSummary, setAiSummary] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [showPageList, setShowPageList] = useState(false);

  // Rewrite feature
  const [showRewrite, setShowRewrite] = useState(false);
  const [rewriteStyle, setRewriteStyle] = useState(null);
  const [rewrittenText, setRewrittenText] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);

  const getAuthedUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data?.user || null;
  }, []);

  // Keep doc in sync when parent provides docs later
  useEffect(() => {
    if (docFromProps) setDoc(docFromProps);
  }, [docFromProps]);

  // If refreshed / direct entry, fetch doc from Supabase
  useEffect(() => {
    if (docFromProps) return;

    if (!isSupabaseConfigured || !supabase) {
      setDoc(null);
      return;
    }

    let alive = true;

    (async () => {
      setDocLoading(true);

      const user = await getAuthedUser();
      if (!user) {
        if (alive) setDocLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from(DOCS_TABLE)
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!alive) return;

      if (error || !data) {
        setDoc(null);
        setDocLoading(false);
        return;
      }

      setDoc({
        id: data.id,
        user_id: data.user_id || user.id,
        name: data.name,
        type: (data.type || "FILE").toUpperCase(),
        status: data.status || "ready",
        updated_at: data.updated_at,
        updated: formatUpdated(data.updated_at),
        size: data.size || "—",
      });

      setDocLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [docFromProps, getAuthedUser, id]);

  // Open summary panel if requested
  useEffect(() => {
    if (location.state?.scrollToSummary) setShowSummary(true);
  }, [location.state]);

  // ✅ Load saved AI summary note for this document
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAiSummary(null);
      setNotesLoading(false);
      return;
    }

    let alive = true;

    (async () => {
      setNotesLoading(true);

      const user = await getAuthedUser();
      if (!user) {
        if (alive) setNotesLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from(NOTES_TABLE)
        .select("id,title,body,tags,created_at,updated_at")
        .eq("user_id", user.id)
        .contains("tags", [TAG_DOC_SUMMARY, docTag(id)])
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!alive) return;

      if (error) {
        console.error("Load notes error:", error);
        setAiSummary(null);
        setNotesLoading(false);
        return;
      }

      const note = data?.[0];
      if (!note?.body) {
        setAiSummary(null);
        setNotesLoading(false);
        return;
      }

      try {
        setAiSummary(JSON.parse(note.body));
      } catch {
        setAiSummary(null);
      }

      setNotesLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [id, navigate, getAuthedUser]);

  // Load Storage signed URL for preview
  useEffect(() => {
    if (!doc) return;

    if (!isSupabaseConfigured || !supabase) {
      setFileUrl(null);
      return;
    }

    let alive = true;

    (async () => {
      setFileLoading(true);
      try {
        const storagePath = `${doc.user_id}/${doc.id}/${doc.name}`;
        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(storagePath, 60 * 60);

        if (!alive) return;

        if (error) {
          setFileUrl(null);
          setFileLoading(false);
          return;
        }

        setFileUrl(data?.signedUrl || null);
        setFileLoading(false);
      } catch {
        if (!alive) return;
        setFileUrl(null);
        setFileLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [doc]);

  // Pages (optional: replace with real page_count later)
  useEffect(() => {
    if (!doc) return;
    const pages = doc.type === "PDF" ? 1 : 1;
    setTotalPages(pages);
    setCurrentPage(1);
  }, [doc]);

  const hasSummary = !!aiSummary;

  if (!doc && !docLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-theme-tertiary flex items-center justify-center mxA mx-auto mb-4">
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

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!doc) return;

    if (!isSupabaseConfigured || !supabase) {
      if (fileUrl) window.open(fileUrl, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      const storagePath = `${doc.user_id}/${doc.id}/${doc.name}`;
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(storagePath);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      if (fileUrl) window.open(fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleGenerateSummary = async () => {
    if (hasSummary) {
      setShowSummary(true);
      return;
    }

    setIsGenerating(true);

    try {
      // Mock generation
      await new Promise((r) => setTimeout(r, 1200));

      const summary = buildSmartSummary(doc);
      setAiSummary(summary);

      // ✅ IMPORTANT: count only after success
      await incrementUsage("aiSummaries");

      setShowSummary(true);
    } catch (e) {
      console.error("Generate summary failed:", e);
      // do not increment
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRewrite = async (style) => {
    setRewriteStyle(style);
    setIsRewriting(true);
    setRewrittenText("");

    try {
      // Mock rewrite
      await new Promise((r) => setTimeout(r, 1500));

      const mockRewriteResults = {
        Professional:
          "This document presents a comprehensive analysis of the subject matter. The key findings indicate significant developments that warrant careful consideration. Our recommendations are based on thorough research and industry best practices.",
        Shorter:
          "Key points: Document analyzed. Main findings noted. Action items identified. Follow-up recommended.",
        Friendly:
          "Hey there! 👋 So here's the deal with this document - it's got some really interesting stuff in it! The main takeaway is that things are looking good, and we've got some cool next steps to explore together.",
      };

      const result =
        mockRewriteResults[style] || "Rewritten content will appear here.";

      setRewrittenText(result);

      // ✅ Count only after success
      // No dedicated "rewrite" bucket exists in your limits; use insightQueries as the closest AI text action.
      await incrementUsage("insightQueries");
    } catch (e) {
      console.error("Rewrite failed:", e);
      // do not increment
    } finally {
      setIsRewriting(false);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setShowPageList(false);
    }
  };

  return (
    <div className="space-y-4 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
      <DbLoaderOverlay
        open={notesLoading}
        title="Load Notes From DB"
        subtitle="Restoring your saved AI summary…"
      />

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
            style={{
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "var(--border-secondary)",
            }}
            title="Download"
          >
            <FiDownload size={18} />
          </button>
          <button
            onClick={() => setShowRewrite(true)}
            className="p-2.5 rounded-xl text-theme-muted hover:text-purple-500 transition border hover:border-purple-500/30 hover:bg-purple-500/10"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "var(--border-secondary)",
            }}
            title="Rewrite with AI"
          >
            <PencilSimple size={18} weight="duotone" />
          </button>
          <button
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            className="p-2.5 rounded-xl text-theme-muted hover:text-indigo-500 transition border hover:border-indigo-500/30 hover:bg-indigo-500/10 disabled:opacity-50"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "var(--border-secondary)",
            }}
            title="AI Summary"
          >
            <FiFileText size={18} />
          </button>
        </div>
      </div>

      {/* Document Title Card */}
      <div
        className="rounded-xl p-4 border flex items-center gap-3"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-secondary)",
        }}
      >
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center border"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            borderColor: "var(--border-secondary)",
          }}
        >
          <FileTypeIcon type={doc?.type} size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-theme-primary truncate">
            {doc?.name}
          </h1>
          <p className="text-xs text-theme-muted">
            {doc?.type} · {doc?.size || "—"} · Updated {doc?.updated || "—"}
          </p>
        </div>
        {hasSummary && (
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <FiCheck size={10} /> AI Summary
          </span>
        )}
      </div>

      {/* Document Viewer */}
      <div
        className="rounded-2xl overflow-hidden border"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-secondary)",
        }}
      >
        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            borderColor: "var(--border-secondary)",
          }}
        >
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPageList(!showPageList)}
              className={`p-2 rounded-lg transition ${
                showPageList
                  ? "text-indigo-500 bg-indigo-500/10"
                  : "text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary"
              }`}
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
                style={{
                  backgroundColor: "var(--bg-input)",
                  borderColor: "var(--border-secondary)",
                }}
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

          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              className="p-2 rounded-lg text-theme-muted hover:text-theme-primary transition hover:bg-theme-tertiary"
              title="Zoom out"
            >
              <FiZoomOut size={16} />
            </button>
            <span className="text-xs text-theme-muted w-10 text-center font-medium">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="p-2 rounded-lg text-theme-muted hover:text-theme-primary transition hover:bg-theme-tertiary"
              title="Zoom in"
            >
              <FiZoomIn size={16} />
            </button>
            <div
              className="w-px h-5 mx-1"
              style={{ backgroundColor: "var(--border-secondary)" }}
            />
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
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-secondary)",
              }}
            >
              <div className="p-4">
                <p className="text-xs text-theme-muted mb-3 font-medium">
                  Jump to page
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition border ${
                          currentPage === page
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25"
                            : "text-theme-secondary hover:border-indigo-500/50"
                        }`}
                        style={
                          currentPage !== page
                            ? {
                                backgroundColor: "var(--bg-input)",
                                borderColor: "var(--border-secondary)",
                              }
                            : {}
                        }
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Document Content */}
        <div
          className="min-h-[60vh] flex items-center justify-center p-6"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          {fileLoading ? (
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-theme-muted">Loading preview…</p>
            </div>
          ) : fileUrl ? (
            doc.type === "PDF" ? (
              <iframe
                src={fileUrl}
                className="w-full h-[70vh] rounded-xl border shadow-lg"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center",
                  borderColor: "var(--border-secondary)",
                }}
              />
            ) : (
              <div className="text-center">
                <div
                  className="h-20 w-20 rounded-2xl bg-theme-tertiary flex items-center justify-center mx-auto mb-4 border"
                  style={{ borderColor: "var(--border-secondary)" }}
                >
                  <FileTypeIcon type={doc.type} size={48} />
                </div>
                <p className="text-theme-muted mb-4">
                  Preview not available for {doc.type} files
                </p>
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
              <div
                className="h-20 w-20 rounded-2xl bg-theme-tertiary flex items-center justify-center mx-auto mb-4 border"
                style={{ borderColor: "var(--border-secondary)" }}
              >
                <FiFile className="text-theme-muted" size={40} />
              </div>
              <p className="text-theme-muted">No preview available</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Summary Prompt */}
      {!showSummary && !hasSummary && !notesLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 border flex items-center gap-3"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-secondary)",
          }}
        >
          <div className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
            <Sparkle size={20} weight="fill" className="text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-theme-primary">
              Generate AI Summary
            </p>
            <p className="text-xs text-theme-muted">
              Click the summary button above to extract key insights
            </p>
          </div>
        </motion.div>
      )}

      {/* Generating State */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Lightning
                    size={24}
                    weight="fill"
                    className="text-indigo-500 animate-pulse"
                  />
                </div>
                <div>
                  <p className="text-theme-primary font-semibold">
                    Generating AI Summary...
                  </p>
                  <p className="text-xs text-theme-muted">
                    Analyzing document content
                  </p>
                </div>
              </div>
              <div
                className="mt-4 h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--bg-tertiary)" }}
              >
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
        {(showSummary || hasSummary) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <Sparkle
                      size={20}
                      weight="fill"
                      className="text-indigo-500"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-theme-primary">
                      AI Summary
                    </h3>
                    <p className="text-[11px] text-theme-muted">
                      Loaded from your notes
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(aiSummary?.summaryText || "")}
                  className="text-theme-muted hover:text-theme-primary p-2 rounded-lg hover:bg-theme-tertiary transition"
                  disabled={!aiSummary?.summaryText}
                >
                  {copied ? (
                    <FiCheck size={18} className="text-emerald-500" />
                  ) : (
                    <FiCopy size={18} />
                  )}
                </button>
              </div>

              <p className="text-sm text-theme-secondary leading-relaxed mb-5">
                {aiSummary?.summaryText ||
                  "No saved summary for this document yet. Click the AI Summary button to generate one."}
              </p>

              {/* Key Insights */}
              <div className="mb-5">
                <h4 className="text-xs font-semibold text-theme-muted mb-3 uppercase tracking-wide">
                  Key Insights
                </h4>
                <ul className="space-y-2">
                  {(aiSummary?.keyInsights || [
                    "Main objective identified",
                    "Notable constraints found",
                    "Timeline impacts noted",
                  ]).map((insight, i) => (
                    <li
                      key={i}
                      className="text-sm text-theme-secondary flex items-start gap-3"
                    >
                      <span className="h-5 w-5 rounded-full bg-indigo-500/15 text-indigo-500 flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                        {i + 1}
                      </span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Plan */}
              {aiSummary?.actionPlan && (
                <div>
                  <h4 className="text-xs font-semibold text-theme-muted mb-3 uppercase tracking-wide">
                    Action Items
                  </h4>
                  <div className="space-y-2">
                    {aiSummary.actionPlan.map((action, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-4 border"
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          borderColor: "var(--border-secondary)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-theme-primary font-medium">
                            {action.title}
                          </span>
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
                        <p className="text-xs text-theme-muted">
                          {action.ownerHint} · {action.effort}
                        </p>
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
            style={{ backgroundColor: "var(--bg-overlay)" }}
            onClick={() => setShowRewrite(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl p-6 border relative mb-12 shadow-2xl"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-secondary)",
              }}
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
                    <PencilSimple
                      size={20}
                      weight="duotone"
                      className="text-purple-500"
                    />
                  </div>
                  <h2 className="text-xl font-semibold text-theme-primary">
                    Rewrite with AI
                  </h2>
                </div>
                <p className="text-theme-muted text-sm mb-6 ml-[52px]">
                  {doc?.name}
                </p>

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
                      style={
                        rewriteStyle !== style
                          ? {
                              backgroundColor: "var(--bg-button)",
                              borderColor: "var(--border-secondary)",
                            }
                          : {}
                      }
                    >
                      {style}
                    </button>
                  ))}
                </div>

                <div
                  className="rounded-xl p-4 min-h-[200px] border"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border-secondary)",
                  }}
                >
                  {isRewriting ? (
                    <div className="flex items-center justify-center h-[180px]">
                      <div className="text-center">
                        <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm text-theme-muted">
                          Rewriting as {rewriteStyle}...
                        </p>
                      </div>
                    </div>
                  ) : rewrittenText ? (
                    <div>
                      <p className="text-sm text-theme-secondary leading-relaxed">
                        {rewrittenText}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleCopy(rewrittenText)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-theme-secondary hover:text-theme-primary transition border hover:border-indigo-500/50"
                          style={{
                            backgroundColor: "var(--bg-tertiary)",
                            borderColor: "var(--border-secondary)",
                          }}
                        >
                          {copied ? (
                            <FiCheck
                              size={14}
                              className="text-emerald-500"
                            />
                          ) : (
                            <FiCopy size={14} />
                          )}
                          Copy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[180px]">
                      <p className="text-theme-muted text-sm">
                        Select a style to generate rewritten text
                      </p>
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




