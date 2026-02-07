// src/pages/Documents.jsx - "Research Synthesizer"
// ✅ FIXED: Uses RPC functions for atomic stat updates
// ✅ UPDATED: Also writes to daily_usage via useSubscription.incrementUsage
//    - AI doc summary => incrementUsage("aiSummaries")
//    - Document synthesis => incrementUsage("documentSynth")

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import { useWorkspaceSettings } from "../hooks/useWorkspaceSettings";
import { useSubscription } from "../hooks/useSubscription";
import { useMobileNav } from "../hooks/useMobileNav";
import { smartSummarizeDocument, synthesizeDocuments } from "../lib/documentAI";
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
  FiChevronDown,
  FiClock,
} from "react-icons/fi";
import { Brain, Sparkle, FilePlus, FileDoc, FilePdf, FileXls } from "phosphor-react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const DOCS_TABLE = "documents";
const NOTES_TABLE = "notes";
const STORAGE_BUCKET = "documents";

const TAG_DOC_SUMMARY = "ai:doc_summary";
const TAG_RESEARCH_BRIEF = "ai:research_brief";

const DOCS_PER_PAGE = 10;

function nowIso() {
  return new Date().toISOString();
}

function bytesToLabel(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

function formatUpdated(updatedAt) {
  if (!updatedAt) return "—";
  const d = new Date(updatedAt);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function docTag(docId) {
  return `doc:${docId}`;
}
const liquidGlassNeutral = `
  relative overflow-hidden
  backdrop-blur-xl
  rounded-2xl
  border
  transition-all duration-300
  shadow-lg
  active:scale-[0.98]
  before:absolute before:inset-0
  before:rounded-2xl
  before:bg-gradient-to-b
  before:from-white/20
  before:to-white/5
  before:opacity-60
  before:pointer-events-none
`;


/* -----------------------------------------
   Priority Tag Component (Theme-safe)
----------------------------------------- */
function PriorityTag({ priority = "medium", children }) {
  const key = String(priority).toLowerCase();

  const allowed = ["critical", "high", "medium", "low", "info"];
  const cls = allowed.includes(key) ? key : "medium";

  return (
    <span className={`priority-${cls} text-[10px] font-semibold px-2.5 py-1 rounded-full`}>
      {children}
    </span>
  );
}


/* -----------------------------------------
   File Type Icon Component
----------------------------------------- */
function FileTypeIcon({ type, size = 20 }) {
  const iconProps = { size, weight: "duotone" };
  const t = (type || "").toUpperCase();

  const styles = {
    PDF: { color: "var(--accent-rose)" },
    DOCX: { color: "var(--accent-indigo)" },
    DOC: { color: "var(--accent-indigo)" },
    XLSX: { color: "var(--accent-emerald)" },
    XLS: { color: "var(--accent-emerald)" },
    FILE: { color: "var(--text-secondary)" },
  };

  switch (t) {
    case "PDF":
      return <FilePdf {...iconProps} style={styles.PDF} />;
    case "DOCX":
    case "DOC":
      return <FileDoc {...iconProps} style={styles.DOCX} />;
    case "XLSX":
    case "XLS":
      return <FileXls {...iconProps} style={styles.XLSX} />;
    default:
      return <FiFile size={size} style={styles.FILE} />;
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
      style={!active ? { backgroundColor: "var(--bg-button)" } : {}}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

/* -----------------------------------------
   Sort Dropdown Component
----------------------------------------- */
function SortDropdown({ sortOrder, setSortOrder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const options = [
    { value: "newest", label: "Newest First", icon: <FiClock size={13} /> },
    { value: "oldest", label: "Oldest First", icon: <FiClock size={13} /> },
    { value: "name-az", label: "Name A→Z", icon: <FiFileText size={13} /> },
    { value: "name-za", label: "Name Z→A", icon: <FiFileText size={13} /> },
  ];

  const current = options.find((o) => o.value === sortOrder) || options[0];

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition"
        style={{
          backgroundColor: "var(--bg-button)",
          borderColor: "var(--border-secondary)",
          color: "var(--text-secondary)",
        }}
      >
        {current.icon}
        <span className="hidden sm:inline">{current.label}</span>
        <FiChevronDown
          size={12}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 z-50 min-w-[160px] rounded-xl border shadow-xl overflow-hidden"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-secondary)",
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setSortOrder(opt.value);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs transition text-left"
                style={{
                  backgroundColor:
                    sortOrder === opt.value ? "rgba(99,102,241,0.1)" : "transparent",
                  color:
                    sortOrder === opt.value
                      ? "var(--accent-indigo)"
                      : "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (sortOrder !== opt.value)
                    e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                }}
                onMouseLeave={(e) => {
                  if (sortOrder !== opt.value)
                    e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {opt.icon}
                <span className="font-medium">{opt.label}</span>
                {sortOrder === opt.value && (
                  <FiCheck size={13} className="ml-auto" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Documents({ docs: docsProp = null, setDocs: setDocsProp }) {
  const navigate = useNavigate();
  const { settings } = useWorkspaceSettings();
  const { incrementUsage } = useSubscription();

  const [localDocs, setLocalDocs] = useState([]);
  const docs = docsProp ?? localDocs;
  const setDocs = setDocsProp ?? setLocalDocs;

  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(DOCS_PER_PAGE);
  const fileInputRef = useRef(null);

  const [synthesizeMode, setSynthesizeMode] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState(null);
  const [autoSummarizing, setAutoSummarizing] = useState(null);

  const [savedBriefs, setSavedBriefs] = useState([]);
  const [viewingBrief, setViewingBrief] = useState(null);

  const [toast, setToast] = useState(null);

  const [filesLoading, setFilesLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // docId -> { noteId }
  const [summaryIndex, setSummaryIndex] = useState({});

  const isAnyModalOpen =
  !!viewingBrief ||
  !!synthesisResult ||
  isSynthesizing ||
  isUploading;

useMobileNav(isAnyModalOpen);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(DOCS_PER_PAGE);
  }, [query, filterType, sortOrder]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const requireSupabase = () => {
    if (!isSupabaseConfigured) {
      showToast("Supabase is not configured (missing env vars).", "error");
      return false;
    }
    return true;
  };

  const getUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data?.user) throw new Error("Not authenticated");
    return data.user;
  }, []);

  // ✅ FIXED: Use RPC function instead of problematic upsert
  const ensureUserStatsRow = useCallback(async (user) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase.rpc("ensure_user_stats_exists", {
        p_user_id: user.id,
        p_display_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      });

      if (error) {
        console.warn("ensure_user_stats_exists RPC failed, trying fallback:", error);

        const { data: existing } = await supabase
          .from("user_engagement_stats")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existing) {
          await supabase.from("user_engagement_stats").insert({
            user_id: user.id,
            display_name: user.user_metadata?.full_name || null,
            notes_created: 0,
            ai_uses: 0,
            active_days: 1,
            streak_days: 1,
            last_active_date: new Date().toISOString().split("T")[0],
          });
        }
      }
    } catch (err) {
      console.warn("ensureUserStatsRow error (non-blocking):", err);
    }
  }, []);

  // ✅ FIXED: Use RPC function for atomic increment
  const incrementAiUses = useCallback(
    async (user, amount = 1) => {
      if (!user?.id) return;

      try {
        const { error } = await supabase.rpc("increment_ai_uses", {
          p_user_id: user.id,
          p_amount: amount,
        });

        if (error) {
          console.warn("increment_ai_uses RPC failed, trying fallback:", error);

          await ensureUserStatsRow(user);

          const { data: row } = await supabase
            .from("user_engagement_stats")
            .select("ai_uses")
            .eq("user_id", user.id)
            .single();

          const current = Number(row?.ai_uses ?? 0);

          await supabase
            .from("user_engagement_stats")
            .update({
              ai_uses: current + amount,
              updated_at: nowIso(),
            })
            .eq("user_id", user.id);
        }

        window.dispatchEvent(
          new CustomEvent("notestream:ai_uses_updated", {
            detail: { increment: amount },
          })
        );
      } catch (err) {
        console.warn("incrementAiUses error (non-blocking):", err);
      }
    },
    [ensureUserStatsRow]
  );

  const mapDocRowToUi = useCallback((row) => {
    const type = (row?.type || "FILE").toUpperCase();
    const status = row?.status || "ready";
    const size = row?.size_bytes ? bytesToLabel(row.size_bytes) : "—";

    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      type,
      status,
      size,
      updated: formatUpdated(row.updated_at),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }, []);

  const loadDocsAndAiArtifacts = useCallback(async () => {
    setFilesLoading(true);

    if (!requireSupabase()) {
      setFilesLoading(false);
      return;
    }

    try {
      const user = await getUser();

      await ensureUserStatsRow(user);

      const { data: docRows, error: docErr } = await supabase
        .from(DOCS_TABLE)
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (docErr) throw docErr;
      setDocs((docRows || []).map(mapDocRowToUi));

      const { data: summaryNotes, error: sumErr } = await supabase
        .from(NOTES_TABLE)
        .select("id, tags")
        .eq("user_id", user.id)
        .contains("tags", [TAG_DOC_SUMMARY])
        .order("updated_at", { ascending: false });

      if (sumErr) throw sumErr;

      const nextSummaryIndex = {};
      for (const n of summaryNotes || []) {
        const tags = n.tags || [];
        const docIdTag = tags.find((t) => typeof t === "string" && t.startsWith("doc:"));
        const docId = docIdTag?.slice(4);
        if (docId) nextSummaryIndex[docId] = { noteId: n.id };
      }
      setSummaryIndex(nextSummaryIndex);

      const { data: briefNotes, error: briefErr } = await supabase
        .from(NOTES_TABLE)
        .select("id, title, body, updated_at, created_at, tags")
        .eq("user_id", user.id)
        .contains("tags", [TAG_RESEARCH_BRIEF])
        .order("updated_at", { ascending: false });

      if (briefErr) throw briefErr;

      const briefs = (briefNotes || []).map((n) => {
        try {
          const parsed = JSON.parse(n.body || "{}");
          return { ...parsed, noteId: n.id };
        } catch {
          return {
            noteId: n.id,
            id: n.id,
            title: n.title || "Research Brief",
            generatedAt: n.updated_at || n.created_at || nowIso(),
            sourceCount: 0,
            sources: [],
            executiveSummary: n.body || "",
            keyThemes: [],
            consolidatedInsights: [],
            unifiedActionPlan: [],
            contradictions: [],
            gaps: [],
          };
        }
      });

      setSavedBriefs(briefs);
    } catch (e) {
      showToast(e?.message || "Failed to load documents", "error");
      setDocs([]);
    } finally {
      setFilesLoading(false);
    }
  }, [ensureUserStatsRow, getUser, mapDocRowToUi, setDocs]);

  useEffect(() => {
    loadDocsAndAiArtifacts();
  }, [loadDocsAndAiArtifacts]);


  const handlePreview = (doc) => navigate(`/dashboard/documents/view/${doc.id}`);

  const handleUploadButton = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!requireSupabase()) return;

    setIsUploading(true);

    try {
      const user = await getUser();

      const extension = file.name.split(".").pop()?.toUpperCase() || "FILE";
      const type = ["PDF", "DOCX", "XLSX"].includes(extension) ? extension : "FILE";

      if (!globalThis.crypto?.randomUUID) {
        throw new Error("This browser cannot generate UUIDs (crypto.randomUUID missing).");
      }
      const docId = globalThis.crypto.randomUUID();

      const storagePath = `${user.id}/${docId}/${file.name}`;

      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, { upsert: false, contentType: file.type || "application/octet-stream" });

      if (upErr) throw upErr;

      const insertPayload = {
        id: docId,
        user_id: user.id,
        name: file.name,
        type,
        status: "ready",
        created_at: nowIso(),
        updated_at: nowIso(),
      };

      const { data: inserted, error: insErr } = await supabase
        .from(DOCS_TABLE)
        .insert(insertPayload)
        .select("*")
        .single();

      if (insErr) throw insErr;

      const uiDoc = {
        ...mapDocRowToUi(inserted),
        size: bytesToLabel(file.size),
        updated: "Just now",
      };

      setDocs((prev) => [uiDoc, ...(prev || [])]);
      showToast(`Uploaded: ${file.name}`, "success");

      if (settings.autoSummarize) {
        setTimeout(() => runSmartSummary(uiDoc, true), 300);
      }
    } catch (err) {
      showToast(err?.message || "Upload failed", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadDoc = async (doc) => {
    if (!requireSupabase()) return;

    try {
      const storagePath = `${doc.user_id}/${doc.id}/${doc.name}`;

      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(storagePath);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err?.message || "Download failed", "error");
    }
  };

  const findExistingSummaryNoteId = async (userId, docId) => {
    const cached = summaryIndex?.[docId]?.noteId;
    if (cached) return cached;

    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .select("id, tags")
      .eq("user_id", userId)
      .contains("tags", [TAG_DOC_SUMMARY, docTag(docId)])
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0]?.id ?? null;
  };

  const runSmartSummary = async (doc, isAutomatic = false) => {
    if (!requireSupabase()) return;

    try {
      const user = await getUser();

      if (isAutomatic) setAutoSummarizing(doc.id);

      const summary = await smartSummarizeDocument(doc);

      const existingId = await findExistingSummaryNoteId(user.id, doc.id);

      const notePayload = {
        user_id: user.id,
        title: `AI Summary: ${doc.name.replace(/\.[^/.]+$/, "")}`,
        body: JSON.stringify(summary),
        tags: [TAG_DOC_SUMMARY, docTag(doc.id)],
        is_favorite: false,
        is_highlight: false,
        updated_at: nowIso(),
        created_at: nowIso(),
      };

      if (existingId) {
        const { error } = await supabase
          .from(NOTES_TABLE)
          .update({ ...notePayload, created_at: undefined })
          .eq("id", existingId)
          .eq("user_id", user.id);

        if (error) throw error;

        setSummaryIndex((prev) => ({ ...(prev || {}), [doc.id]: { noteId: existingId } }));
      } else {
        const { data: inserted, error } = await supabase
          .from(NOTES_TABLE)
          .insert(notePayload)
          .select("id")
          .single();

        if (error) throw error;

        setSummaryIndex((prev) => ({ ...(prev || {}), [doc.id]: { noteId: inserted.id } }));
      }

      await incrementAiUses(user, 1);

      try {
        await incrementUsage("aiSummaries");
      } catch {
        // non-blocking
      }

      try {
        await supabase.rpc("log_activity_event", {
          p_user_id: user.id,
          p_event_type: "ai_summary",
          p_title: `Generated summary for ${doc.name.replace(/\.[^/.]+$/, "")}`,
          p_metadata: { doc_id: doc.id, doc_name: doc.name },
        });
      } catch (logErr) {
        console.warn("Activity log failed (non-blocking):", logErr);
      }

      if (isAutomatic) {
        setAutoSummarizing(null);
        showToast(`AI summary generated for "${doc.name}"`, "success");
      }
    } catch (err) {
      setAutoSummarizing(null);
      showToast(err?.message || "AI summary failed", "error");
    }
  };

  const handleSummarize = async (doc) => {
    await runSmartSummary(doc, false);
    navigate(`/dashboard/documents/view/${doc.id}`, { state: { scrollToSummary: true } });
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
    if (!requireSupabase()) return;

    setIsSynthesizing(true);

    try {
      const user = await getUser();

      const result = await synthesizeDocuments(selectedDocs);

      setSynthesisResult(result);

      const docIds = selectedDocs.map((d) => d.id);
      result.id = `brief-${Date.now()}`;
      result.title = `Research Brief: ${selectedDocs.map(d => d.name.replace(/\.[^/.]+$/, "")).slice(0, 2).join(" & ")}${selectedDocs.length > 2 ? ` +${selectedDocs.length - 2} more` : ""}`;
      result.generatedAt = result.meta?.generatedAt || new Date().toISOString();
      result.sourceCount = selectedDocs.length;
      result.sources = selectedDocs.map(d => d.name);
      result.docIds = selectedDocs.map(d => d.id);

      const { error: updErr } = await supabase
        .from(DOCS_TABLE)
        .update({ status: "synthesized", updated_at: nowIso() })
        .in("id", docIds)
        .eq("user_id", user.id);

      if (updErr) throw updErr;

      setDocs((prev) =>
        (prev || []).map((d) => (docIds.includes(d.id) ? { ...d, status: "synthesized", updated: "Just now" } : d))
      );

      await incrementAiUses(user, 1);

      try {
        await incrementUsage("documentSynth");
      } catch {
        // non-blocking
      }

      try {
        await supabase.rpc("log_activity_event", {
          p_user_id: user.id,
          p_event_type: "synthesis",
          p_title: `Synthesized ${selectedDocs.length} documents into research brief`,
          p_metadata: { doc_count: selectedDocs.length, doc_ids: docIds },
        });
      } catch (logErr) {
        console.warn("Activity log failed (non-blocking):", logErr);
      }

      setIsSynthesizing(false);
      setSynthesizeMode(false);
      setSelectedDocs([]);
    } catch (err) {
      setIsSynthesizing(false);
      showToast(err?.message || "Synthesis failed", "error");
    }
  };

  const closeSynthesisResult = () => setSynthesisResult(null);

  const saveBrief = async () => {
    if (!synthesisResult) return;
    if (!requireSupabase()) return;

    try {
      const user = await getUser();

      const payload = {
        user_id: user.id,
        title: synthesisResult.title,
        body: JSON.stringify(synthesisResult),
        tags: [TAG_RESEARCH_BRIEF],
        is_favorite: false,
        is_highlight: false,
        created_at: nowIso(),
        updated_at: nowIso(),
      };

      const { data: inserted, error } = await supabase.from(NOTES_TABLE).insert(payload).select("id").single();
      if (error) throw error;

      setSavedBriefs((prev) => [{ ...synthesisResult, noteId: inserted.id }, ...(prev || [])]);
      showToast("Research brief saved!", "success");
      closeSynthesisResult();
    } catch (err) {
      showToast(err?.message || "Failed to save brief", "error");
    }
  };

  const deleteBrief = async (noteId) => {
    if (!requireSupabase()) return;

    try {
      const user = await getUser();
      const { error } = await supabase.from(NOTES_TABLE).delete().eq("id", noteId).eq("user_id", user.id);
      if (error) throw error;

      setSavedBriefs((prev) => (prev || []).filter((b) => b.noteId !== noteId));
      showToast("Brief deleted", "success");
    } catch (err) {
      showToast(err?.message || "Failed to delete brief", "error");
    }
  };

  const viewBrief = (brief) => setViewingBrief(brief);

  // ✅ Filtered + sorted docs with pagination
  const filteredDocs = useMemo(() => {
    let result = (docs || []).filter((d) => {
      const matchesType = filterType === "ALL" || d.type === filterType;
      const matchesQuery = d.name.toLowerCase().includes(query.toLowerCase());
      return matchesType && matchesQuery;
    });

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortOrder) {
        case "oldest": {
          const da = new Date(a.created_at || a.updated_at || 0).getTime();
          const db = new Date(b.created_at || b.updated_at || 0).getTime();
          return da - db;
        }
        case "name-az":
          return (a.name || "").localeCompare(b.name || "");
        case "name-za":
          return (b.name || "").localeCompare(a.name || "");
        case "newest":
        default: {
          const da = new Date(a.created_at || a.updated_at || 0).getTime();
          const db = new Date(b.created_at || b.updated_at || 0).getTime();
          return db - da;
        }
      }
    });

    return result;
  }, [query, filterType, sortOrder, docs]);

  const visibleDocs = useMemo(
    () => filteredDocs.slice(0, visibleCount),
    [filteredDocs, visibleCount]
  );

  const hasMore = visibleCount < filteredDocs.length;

  const totalDocs = (docs || []).length;
  const synthesizedCount = (docs || []).filter((d) => (d.status || "") === "synthesized").length;
  const summarizedCount = (docs || []).filter((d) => !!summaryIndex?.[d.id]).length;

  // Loading state
  if (filesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
     <div className="w-full max-w-3xl mx-auto space-y-5 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
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

      {/* Upload Overlay */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: "var(--bg-overlay)" }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-center p-8 rounded-2xl border shadow-2xl max-w-sm mx-4"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
            >
              <div className="w-12 h-12 mx-auto mb-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <h3 className="text-lg font-semibold text-theme-primary mb-2">Uploading Document</h3>
              <p className="text-sm text-theme-muted">Please wait...</p>
            </motion.div>
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
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10"
          >
            <div className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <FiZap size={14} className="text-emerald-400" />
            </div>

            <span className="text-xs font-semibold text-emerald-400">
              Auto-summarize enabled
            </span>
            <span className="text-xs text-theme-muted">
              • New uploads summarized automatically
            </span>
          </motion.div>
        )}


          {/* ✅ Action Buttons - always side by side */}
          <div className="flex flex-row gap-3">
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUploadButton}
              type="button"
              className="
                liquid-glass-button
                flex-1 py-4 rounded-2xl
                text-theme-primary
                hover:bg-theme-tertiary
                transition
                min-w-0
              "
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                <FilePlus size={18} className="icon-muted flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base truncate">Upload</span>
                <span className="font-medium text-sm sm:text-base hidden sm:inline">Document</span>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={synthesizeMode ? cancelSynthesizeMode : startSynthesizeMode}
              type="button"
              className="
                liquid-glass-button
                flex-1 py-4 rounded-2xl
                text-theme-primary
                hover:bg-theme-tertiary
                transition
                min-w-0
              "
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                <Sparkle size={18} className="icon-muted flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base truncate">
                  {synthesizeMode ? "Cancel" : "Synthesize"}
                </span>
                <span className="font-medium text-sm sm:text-base hidden sm:inline">
                  {synthesizeMode ? "" : "Docs"}
                </span>
              </div>
            </motion.button>
          </div>


      {/* Synthesize Mode Panel */}
      <AnimatePresence>
        {synthesizeMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-purple-500/30 overflow-hidden"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
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
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={runSynthesis}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-purple-500/25"
                    type="button"
                  >
                    <Sparkle size={16} weight="fill" /> Generate Brief
                  </motion.button>
                )}
              </div>
              {selectedDocs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t" style={{ borderColor: "var(--border-secondary)" }}>
                  {selectedDocs.map((doc) => (
                    <span
                      key={doc.id}
                      className="text-xs bg-purple-500/15 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-full border border-purple-500/30 flex items-center gap-2"
                    >
                      <FileTypeIcon type={doc.type} size={14} />
                      {doc.name}
                      <button onClick={() => toggleDocSelection(doc)} className="hover:text-purple-200 ml-1" type="button">
                        ×
                      </button>
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
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              {savedBriefs.length}
            </span>
          </div>
          <div className="space-y-2">
            {savedBriefs.map((brief) => (
              <motion.div
                key={brief.noteId || brief.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => viewBrief(brief)}
                className="flex items-center justify-between rounded-xl px-4 py-3 border border-purple-500/20 hover:border-purple-500/40 transition cursor-pointer"
                style={{ backgroundColor: "var(--bg-elevated)" }}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <Brain size={16} weight="duotone" className="text-purple-500 flex-shrink-0" />
                    <p className="text-theme-primary text-sm font-medium truncate">{brief.title}</p>
                  </div>
                  <p className="text-[11px] text-theme-muted mt-1">
                    {brief.sourceCount || 0} sources • {new Date(brief.generatedAt || nowIso()).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      viewBrief(brief);
                    }}
                    type="button"
                    title="View brief"
                    className="
                      h-8 w-8 rounded-lg border
                      flex items-center justify-center
                      transition-all
                      hover:bg-theme-tertiary
                      hover:text-theme-primary
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                    style={{
                      borderColor: "var(--border-secondary)",
                      color: "var(--text-secondary)",
                      backgroundColor: "transparent",
                    }}
                  >
                    <FiEye size={16} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBrief(brief.noteId);
                    }}
                    type="button"
                    title="Delete brief"
                    className="
                      h-8 w-8 rounded-lg border
                      flex items-center justify-center
                      transition-all
                      hover:text-rose-400
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                    style={{
                      borderColor: "var(--border-secondary)",
                      color: "var(--text-secondary)",
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(244, 63, 94, 0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Documents List */}
      <GlassCard>
        {/* ✅ Search + Filters + Sort row */}
        <div className="flex flex-col gap-3 mb-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={16} />
            <input
              type="text"
              placeholder="Search documents…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border transition"
              style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)" }}
            />
          </div>

          {/* Filters + Sort in one row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5 flex-wrap">
              {["ALL", "PDF", "DOCX", "XLSX"].map((t) => (
                <ToggleButton key={t} active={filterType === t} onClick={() => setFilterType(t)}>
                  {t === "ALL" ? "All" : t}
                </ToggleButton>
              ))}
            </div>

            <SortDropdown sortOrder={sortOrder} setSortOrder={setSortOrder} />
          </div>
        </div>

        {/* Doc count label */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] text-theme-muted">
            Showing {Math.min(visibleCount, filteredDocs.length)} of {filteredDocs.length} documents
          </p>
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

          {/* ✅ Only render visible slice */}
          {visibleDocs.map((doc, index) => {
            const isSelected = selectedDocs.find((d) => d.id === doc.id);
            const isAutoSummarizing = autoSummarizing === doc.id;
            const hasSummary = !!summaryIndex?.[doc.id];
            const isSynthesized = (doc.status || "") === "synthesized";

            return (
             <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.015 }}
                onClick={synthesizeMode ? () => toggleDocSelection(doc) : undefined}
                className={`rounded-2xl border transition cursor-pointer ${
                  isSelected ? "border-purple-500/60" : "hover:border-indigo-500/40"
                }`}
                style={{
                  backgroundColor: isSelected ? "rgba(168, 85, 247, 0.08)" : "var(--bg-elevated)",
                  borderColor: isSelected ? "rgba(168, 85, 247, 0.5)" : "var(--border-secondary)",
                }}
              >
                <div className="px-3 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Left */}
                    {synthesizeMode ? (
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-purple-500 border-purple-500" : ""
                        }`}
                        style={!isSelected ? { borderColor: "var(--text-muted)" } : {}}
                      >
                        {isSelected && <FiCheck size={12} className="text-white" />}
                      </div>
                    ) : (
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border relative"
                        style={{
                          backgroundColor: settings.autoSummarize
                            ? "rgba(99,102,241,0.08)"
                            : "var(--bg-tertiary)",
                          borderColor: settings.autoSummarize
                            ? "rgba(99,102,241,0.25)"
                            : "var(--border-secondary)",
                        }}
                        title={
                          settings.autoSummarize
                            ? "AI summaries are enabled automatically"
                            : "Document"
                        }
                      >
                        <FileTypeIcon type={doc.type} size={18} />

                        {settings.autoSummarize && (
                          <span
                            className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: "rgba(99,102,241,0.18)",
                              border: "1px solid rgba(99,102,241,0.35)",
                            }}
                          >
                            <Sparkle size={10} className="text-indigo-400 opacity-70" />
                          </span>
                        )}
                      </div>
                    )}

                    {/* Middle */}
                    <div className="min-w-0 flex-1">
                      <p className="text-theme-primary text-sm font-semibold truncate" title={doc.name}>
                        {doc.name}
                      </p>

                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        {isSynthesized && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25">
                            Synthesized
                          </span>
                        )}

                      {hasSummary && !isAutoSummarizing && (
                        <span className="tag-success text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FiCheck size={10} />
                          AI Summary
                        </span>
                      )}

                      {isAutoSummarizing && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/12 text-indigo-300 border border-indigo-500/25 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                          Summarizing…
                        </span>
                      )}
                      </div>

                      <p className="text-[11px] text-theme-muted mt-1 truncate">
                        {doc.type} · {doc.size} · Updated {doc.updated}
                      </p>
                    </div>

                    {/* Right actions */}
                    {!synthesizeMode && (
                        <div className="shrink-0 flex items-center gap-1">
                        <button
                          className="h-8 w-8 rounded-lg border flex items-center justify-center transition"
                          style={{ borderColor: "var(--border-secondary)", color: "var(--text-secondary)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(doc);
                          }}
                          title="Preview"
                          type="button"
                        >
                          <FiEye size={15} />
                        </button>

                        <button
                          className="h-8 w-8 rounded-lg border flex items-center justify-center transition disabled:opacity-50"
                          style={{ borderColor: "var(--border-secondary)", color: "var(--text-secondary)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSummarize(doc);
                          }}
                          title="AI Summary"
                          disabled={isAutoSummarizing}
                          type="button"
                        >
                          <FiFileText size={15} />
                        </button>

                        <button
                          className="h-8 w-8 rounded-lg border flex items-center justify-center transition"
                          style={{ borderColor: "var(--border-secondary)", color: "var(--text-secondary)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadDoc(doc);
                          }}
                          title="Download"
                          type="button"
                        >
                          <FiDownload size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* ✅ Load More button */}
          {hasMore && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setVisibleCount((prev) => prev + DOCS_PER_PAGE)}
              type="button"
              className="w-full py-3 mt-2 rounded-xl border text-sm font-medium transition flex items-center justify-center gap-2"
              style={{
                backgroundColor: "var(--bg-button)",
                borderColor: "var(--border-secondary)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                e.currentTarget.style.backgroundColor = "rgba(99,102,241,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-secondary)";
                e.currentTarget.style.backgroundColor = "var(--bg-button)";
              }}
            >
              <FiChevronDown size={16} />
              Show More ({filteredDocs.length - visibleCount} remaining)
            </motion.button>
          )}
        </div>
      </GlassCard>

      <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelected} />

      {/* Synthesizing Overlay */}
      <AnimatePresence>
        {isSynthesizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: "var(--bg-overlay)" }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-center p-8 rounded-2xl border shadow-2xl max-w-sm mx-4"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center">
                <Sparkle size={32} weight="fill" className="text-purple-500 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-theme-primary mb-2">Synthesizing Documents</h3>
              <p className="text-sm text-theme-muted mb-4">Analyzing {selectedDocs.length} documents...</p>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brief Modal */}
      <AnimatePresence>
        {(synthesisResult || viewingBrief) && (
          <ModalShell
            onClose={() => {
              closeSynthesisResult();
              setViewingBrief(null);
            }}
            maxWidthClass="sm:max-w-xl" 
          >
            {(() => {
              const brief = synthesisResult || viewingBrief;

              return (
                <div className="p-4 sm:p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="shrink-0 h-11 w-11 rounded-2xl border flex items-center justify-center"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(168,85,247,0.16), rgba(99,102,241,0.10))",
                          borderColor: "rgba(168,85,247,0.28)",
                          boxShadow: "0 14px 34px rgba(168,85,247,0.16)",
                        }}
                      >
                        <Brain size={22} weight="duotone" className="text-purple-400" />
                      </div>

                      <div className="min-w-0">
                        <h2
                          className="text-[15px] sm:text-lg font-semibold text-theme-primary leading-snug"
                          style={{
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                            overflow: "hidden",
                          }}
                          title={brief?.title}
                        >
                          {brief?.title}
                        </h2>

                        {!!brief?.generatedAt && (
                          <p className="text-[11px] text-theme-muted mt-1 truncate">
                            {(brief?.sourceCount ?? 0)} documents •{" "}
                            {new Date(brief.generatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeSynthesisResult();
                        setViewingBrief(null);
                      }}
                      className="h-9 w-9 rounded-xl border flex items-center justify-center transition shrink-0"
                      style={{
                        borderColor: "var(--border-secondary)",
                        backgroundColor: "var(--bg-tertiary)",
                        color: "var(--text-secondary)",
                      }}
                      type="button"
                      title="Close"
                    >
                      <FiX size={18} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <SectionCard title="Sources Analyzed" icon={<FiFolder size={16} />} color="indigo">
                      <div className="flex flex-wrap gap-2">
                        {(brief?.sources || []).length === 0 ? (
                          <span
                            className="text-xs text-theme-muted px-3 py-1.5 rounded-lg border"
                            style={{
                              backgroundColor: "var(--bg-tertiary)",
                              borderColor: "var(--border-secondary)",
                            }}
                          >
                            No sources attached
                          </span>
                        ) : (
                          (brief.sources || []).map((source, i) => (
                            <span
                              key={`${source}-${i}`}
                              className="inline-flex items-center gap-2 text-xs text-theme-secondary px-3 py-1.5 rounded-lg border min-w-0"
                              style={{
                                backgroundColor: "var(--bg-tertiary)",
                                borderColor: "var(--border-secondary)",
                                maxWidth: "100%",
                              }}
                              title={source}
                            >
                              <span className="shrink-0">
                                <FileTypeIcon type={String(source).split(".").pop()} size={14} />
                              </span>
                              <span className="min-w-0 flex-1 truncate">{source}</span>
                            </span>
                          ))
                        )}
                      </div>
                    </SectionCard>

                    <SectionCard title="Executive Summary" icon={<FiFileText size={16} />} color="indigo">
                      <p className="text-sm text-theme-secondary leading-relaxed">
                        {brief?.executiveSummary}
                      </p>
                    </SectionCard>

                    <SectionCard title="Key Themes" icon={<FiLayers size={16} />} color="purple">
                      <div className="space-y-3">
                        {(brief?.keyThemes || []).map((theme, i) => (
                          <div
                            key={i}
                            className="rounded-xl p-4 border"
                            style={{
                              backgroundColor: "var(--bg-elevated)",
                              borderColor: "var(--border-secondary)",
                            }}
                          >
                            <div className="flex items-center justify-between mb-2 gap-2">
                              <span className="text-sm font-medium text-theme-primary">
                                {theme.theme}
                              </span>
                              <PriorityTag priority={theme.frequency}>{theme.frequency}</PriorityTag>
                            </div>
                            <p className="text-xs text-theme-muted">{theme.insight}</p>
                          </div>
                        ))}
                      </div>
                    </SectionCard>

                    <SectionCard title="Consolidated Insights" icon={<FiZap size={16} />} color="emerald">
                      <ul className="space-y-2 text-sm text-theme-secondary">
                        {(brief?.consolidatedInsights || []).map((insight, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 text-xs font-semibold">
                              {i + 1}
                            </span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </SectionCard>

                    <SectionCard title="Action Plan" icon={<FiCheck size={16} />} color="indigo">
                      <div className="space-y-3">
                        {(brief?.unifiedActionPlan || []).map((action, i) => (
                          <div
                            key={i}
                            className="rounded-xl p-4 border"
                            style={{
                              backgroundColor: "var(--bg-elevated)",
                              borderColor: "var(--border-secondary)",
                            }}
                          >
                            <p className="text-sm font-medium text-theme-primary mb-3">
                              {action.action}
                            </p>

                            <div className="flex flex-wrap gap-2">
                              <PriorityTag priority={action.priority}>{action.priority}</PriorityTag>

                              <span
                                className="text-[10px] font-medium px-2.5 py-1 rounded-full text-theme-secondary border"
                                style={{
                                  backgroundColor: "var(--bg-tertiary)",
                                  borderColor: "var(--border-secondary)",
                                }}
                              >
                                {action.owners}
                              </span>

                              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                                {action.deadline}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SectionCard>

                    {(brief?.contradictions || []).length > 0 && (
                      <SectionCard title="⚠️ Contradictions" color="amber">
                        {(brief.contradictions || []).map((c, i) => (
                          <div
                            key={i}
                            className="rounded-xl p-4 text-sm border"
                            style={{
                              backgroundColor: "rgba(245, 158, 11, 0.08)",
                              borderColor: "rgba(245, 158, 11, 0.3)",
                            }}
                          >
                            <p className="text-amber-600 dark:text-amber-400 font-semibold">
                              {c.topic}
                            </p>
                            <p className="text-theme-secondary text-xs mt-1">{c.conflict}</p>
                            <p className="text-amber-600 dark:text-amber-400 text-xs mt-2 font-medium">
                              → {c.recommendation}
                            </p>
                          </div>
                        ))}
                      </SectionCard>
                    )}

                    <SectionCard title="📋 Information Gaps" color="rose">
                      <ul className="space-y-2 text-sm text-theme-muted">
                        {(brief?.gaps || []).map((gap, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-rose-500 mt-0.5">•</span>
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </SectionCard>

                    {/* Footer buttons */}
                    <div
                      className="sticky bottom-0 pt-4 mt-2"
                      style={{
                        background:
                          "linear-gradient(to top, var(--bg-surface) 70%, rgba(0,0,0,0))",
                        paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
                      }}
                    >
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            closeSynthesisResult();
                            setViewingBrief(null);
                          }}
                          className="flex-1 py-3.5 rounded-xl text-theme-secondary hover:text-theme-primary transition font-medium border"
                          style={{
                            backgroundColor: "var(--bg-button)",
                            borderColor: "var(--border-secondary)",
                          }}
                          type="button"
                        >
                          Close
                        </button>

                        {synthesisResult && !viewingBrief && (
                          <button
                            onClick={saveBrief}
                            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-purple-500/25"
                            type="button"
                          >
                            Save Brief
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </ModalShell>
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
    <div
      className="rounded-xl px-4 py-3 border"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-secondary)" }}
    >
      <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${colors} border flex items-center justify-center mb-1`}>
        {icon}
      </div>
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
    <div
      className="rounded-2xl p-5 border"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-secondary)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className={colorMap[color]}>{icon}</span>}
        <h3 className={`text-sm font-semibold ${colorMap[color]}`}>{title}</h3>
      </div>
      {children}
    </div>
  );
}


const ModalShell = ({
  children,
  onClose,
  maxWidthClass = "sm:max-w-2xl",
}) => (
  <>
    {/* Overlay */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[9999] w-[100dvw] h-[100dvh]"
      style={{
        minHeight: "100vh", 
        backgroundColor: "var(--bg-overlay)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    />

    {/* Centering container */}
    <div
      className="
        fixed inset-0 z-[10000]
        flex items-end sm:items-center justify-center
        pointer-events-none
        px-0 sm:px-4
        pb-[env(safe-area-inset-bottom)]
        pt-[env(safe-area-inset-top)]
      "
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`
          pointer-events-auto overflow-hidden shadow-2xl border
          rounded-t-3xl sm:rounded-2xl
          border-b-0 sm:border-b
          w-full sm:w-[92vw]
          ${maxWidthClass}
        `}
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-secondary)",
          maxHeight: "calc(100dvh - 24px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: "var(--border-secondary)" }}
          />
        </div>

        {/* Scroll area */}
        <div
          className="overflow-y-auto"
          style={{
            maxHeight: "calc(100dvh - 24px)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  </>
);

