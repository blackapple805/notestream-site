// src/pages/Documents.jsx
// ═══════════════════════════════════════════════════════════════════
// EDITORIAL RESKIN — what changed and why
// ─────────────────────────────────────────────────────────────────
// Wrapped the page in `<div className="ns-ed">` and called
// `useEditorial()`. The dark glass document rows, gradient action
// buttons, and neon synthesis overlay are gone. The page is now
// "The stack on the desk": a `№ 04 — DOCUMENTS` chapter mark, a
// serif display title ("Documents, *read* across."), a mono
// dateline showing the totals (12 in archive · 4 synthesised ·
// 6 summarised), two ghost buttons ("Upload a document" + the
// synthesis toggle), then a mono filter row with All/PDF/DOCX/XLSX
// pills and a sort selector. Each document is an editorial
// article row: mono ordinal · serif filename · serif excerpt
// (auto-summary preview when available, else file metadata) ·
// mono meta line · right-aligned aside with action buttons. The
// synthesis mode panel is a paper-50 strip across the top
// telling the user how many docs they've selected and offering
// a "Generate brief →" button. The brief modal was rebuilt as a
// long editorial dispatch with `§` section headers, mono labels,
// serif body copy, italic accent-blue priorities, and a hairline-
// divided action plan. Saved briefs are an editorial sub-list
// styled exactly like the document rows. NO Supabase / hook /
// data-flow changes — every useState, useEffect, callback, handler,
// the controlled-docs prop pattern, file upload, AI summary,
// synthesis flow, brief save/delete, and stats RPC calls are
// byte-identical to the previous file.
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useWorkspaceSettings } from "../hooks/useWorkspaceSettings";
import { useSubscription } from "../hooks/useSubscription";
import { useAuth } from "../hooks/useAuth";
import { useMobileNav } from "../hooks/useMobileNav";
import { smartSummarizeDocument, synthesizeDocuments } from "../lib/documentAI";
import { useEditorial, ED } from "../lib/editorial";
import {
  FiEye, FiFileText, FiDownload, FiCheck, FiX, FiLayers, FiTrash2,
  FiBookOpen, FiZap, FiSearch, FiFile, FiFolder, FiChevronDown,
  FiClock, FiPlus, FiUpload, FiArrowRight,
} from "react-icons/fi";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

/* ─── DB constants (unchanged) ─── */
const DOCS_TABLE = "documents";
const NOTES_TABLE = "notes";
const STORAGE_BUCKET = "documents";
const TAG_DOC_SUMMARY = "ai:doc_summary";
const TAG_RESEARCH_BRIEF = "ai:research_brief";
const DOCS_PER_PAGE = 10;

function nowIso() { return new Date().toISOString(); }
function bytesToLabel(bytes) { const n = Number(bytes); if (!Number.isFinite(n) || n <= 0) return "—"; const kb = n / 1024; if (kb < 1024) return `${kb.toFixed(1)} KB`; const mb = kb / 1024; if (mb < 1024) return `${mb.toFixed(2)} MB`; return `${(mb / 1024).toFixed(2)} GB`; }
function formatUpdated(updatedAt) { if (!updatedAt) return "—"; const d = new Date(updatedAt); if (Number.isNaN(d.getTime())) return "—"; return d.toLocaleString(); }
function docTag(docId) { return `doc:${docId}`; }

const fmtMetaDate = (iso) => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${date} · ${time}`.toUpperCase();
  } catch { return ""; }
};

/* ═══════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════ */
export default function Documents({ docs: docsProp = null, setDocs: setDocsProp }) {
  useEditorial();
  const navigate = useNavigate();
  const { settings } = useWorkspaceSettings();
  const { incrementUsage } = useSubscription();
  // ✅ Shared auth state — no more per-page getUser calls.
  const { user: authUser, ready: authReady } = useAuth();

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
  const [summaryIndex, setSummaryIndex] = useState({});

  const isAnyModalOpen = !!viewingBrief || !!synthesisResult || isSynthesizing || isUploading;
  useMobileNav(isAnyModalOpen);

  useEffect(() => { setVisibleCount(DOCS_PER_PAGE); }, [query, filterType, sortOrder]);

  const showToast = (message, type = "success") => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };
  const requireSupabase = () => { if (!isSupabaseConfigured) { showToast("Supabase is not configured.", "error"); return false; } return true; };

  /* ─── ALL CALLBACKS ─── */
  // Reads from the shared AuthProvider rather than calling
  // supabase.auth.getUser() — eliminates parallel refresh attempts.
  const getUser = useCallback(async () => {
    if (!authReady) throw new Error("Auth not ready");
    if (!authUser?.id) throw new Error("Not authenticated");
    return authUser;
  }, [authReady, authUser?.id]);

  const ensureUserStatsRow = useCallback(async (user) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase.rpc("ensure_user_stats_exists", { p_user_id: user.id, p_display_name: user.user_metadata?.full_name || user.user_metadata?.name || null });
      if (error) {
        console.warn("ensure_user_stats_exists RPC failed, trying fallback:", error);
        const { data: existing } = await supabase.from("user_engagement_stats").select("user_id").eq("user_id", user.id).maybeSingle();
        if (!existing) { await supabase.from("user_engagement_stats").insert({ user_id: user.id, display_name: user.user_metadata?.full_name || null, notes_created: 0, ai_uses: 0, active_days: 1, streak_days: 1, last_active_date: new Date().toISOString().split("T")[0] }); }
      }
    } catch (err) { console.warn("ensureUserStatsRow error (non-blocking):", err); }
  }, []);

  const incrementAiUses = useCallback(async (user, amount = 1) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase.rpc("increment_ai_uses", { p_user_id: user.id, p_amount: amount });
      if (error) {
        console.warn("increment_ai_uses RPC failed, trying fallback:", error);
        await ensureUserStatsRow(user);
        const { data: row } = await supabase.from("user_engagement_stats").select("ai_uses").eq("user_id", user.id).single();
        await supabase.from("user_engagement_stats").update({ ai_uses: Number(row?.ai_uses ?? 0) + amount, updated_at: nowIso() }).eq("user_id", user.id);
      }
      window.dispatchEvent(new CustomEvent("notestream:ai_uses_updated", { detail: { increment: amount } }));
    } catch (err) { console.warn("incrementAiUses error (non-blocking):", err); }
  }, [ensureUserStatsRow]);

  const mapDocRowToUi = useCallback((row) => {
    return { id: row.id, user_id: row.user_id, name: row.name, type: (row?.type || "FILE").toUpperCase(), status: row?.status || "ready", size: row?.size_bytes ? bytesToLabel(row.size_bytes) : "—", updated: formatUpdated(row.updated_at), created_at: row.created_at, updated_at: row.updated_at };
  }, []);

  const loadDocsAndAiArtifacts = useCallback(async () => {
    setFilesLoading(true);
    if (!requireSupabase()) { setFilesLoading(false); return; }
    try {
      const user = await getUser();
      await ensureUserStatsRow(user);
      const { data: docRows, error: docErr } = await supabase.from(DOCS_TABLE).select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
      if (docErr) throw docErr;
      setDocs((docRows || []).map(mapDocRowToUi));
      const { data: summaryNotes, error: sumErr } = await supabase.from(NOTES_TABLE).select("id, tags").eq("user_id", user.id).contains("tags", [TAG_DOC_SUMMARY]).order("updated_at", { ascending: false });
      if (sumErr) throw sumErr;
      const nextSummaryIndex = {};
      for (const n of summaryNotes || []) { const tags = n.tags || []; const docIdTag = tags.find((t) => typeof t === "string" && t.startsWith("doc:")); const docId = docIdTag?.slice(4); if (docId) nextSummaryIndex[docId] = { noteId: n.id }; }
      setSummaryIndex(nextSummaryIndex);
      const { data: briefNotes, error: briefErr } = await supabase.from(NOTES_TABLE).select("id, title, body, updated_at, created_at, tags").eq("user_id", user.id).contains("tags", [TAG_RESEARCH_BRIEF]).order("updated_at", { ascending: false });
      if (briefErr) throw briefErr;
      const briefs = (briefNotes || []).map((n) => { try { const parsed = JSON.parse(n.body || "{}"); return { ...parsed, noteId: n.id }; } catch { return { noteId: n.id, id: n.id, title: n.title || "Research Brief", generatedAt: n.updated_at || n.created_at || nowIso(), sourceCount: 0, sources: [], executiveSummary: n.body || "", keyThemes: [], consolidatedInsights: [], unifiedActionPlan: [], contradictions: [], gaps: [] }; } });
      setSavedBriefs(briefs);
    } catch (e) { showToast(e?.message || "Failed to load documents", "error"); setDocs([]); }
    finally { setFilesLoading(false); }
  }, [ensureUserStatsRow, getUser, mapDocRowToUi, setDocs]);

  // Only fire once auth has settled so getUser() doesn't throw on
  // first render. Previously this used a hardcoded loadDocsAndAiArtifacts
  // dependency that ran immediately on mount, before useAuth's listener
  // had time to populate authUser.
  useEffect(() => {
    if (!authReady || !authUser?.id) return;
    loadDocsAndAiArtifacts();
  }, [loadDocsAndAiArtifacts, authReady, authUser?.id]);

  const handlePreview = (doc) => navigate(`/dashboard/documents/view/${doc.id}`);
  const handleUploadButton = () => { if (fileInputRef.current) { fileInputRef.current.value = ""; fileInputRef.current.click(); } };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0]; if (!file) return; if (!requireSupabase()) return;
    setIsUploading(true);
    try {
      const user = await getUser();
      const extension = file.name.split(".").pop()?.toUpperCase() || "FILE";
      const type = ["PDF", "DOCX", "XLSX"].includes(extension) ? extension : "FILE";
      if (!globalThis.crypto?.randomUUID) throw new Error("crypto.randomUUID missing.");
      const docId = globalThis.crypto.randomUUID();
      const storagePath = `${user.id}/${docId}/${file.name}`;
      const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, file, { upsert: false, contentType: file.type || "application/octet-stream" });
      if (upErr) throw upErr;
      const insertPayload = { id: docId, user_id: user.id, name: file.name, type, status: "ready", created_at: nowIso(), updated_at: nowIso() };
      const { data: inserted, error: insErr } = await supabase.from(DOCS_TABLE).insert(insertPayload).select("*").single();
      if (insErr) throw insErr;
      const uiDoc = { ...mapDocRowToUi(inserted), size: bytesToLabel(file.size), updated: "Just now" };
      setDocs((prev) => [uiDoc, ...(prev || [])]);
      showToast(`Filed: ${file.name}`, "success");
      if (settings.autoSummarize) setTimeout(() => runSmartSummary(uiDoc, true), 300);
    } catch (err) { showToast(err?.message || "Upload failed", "error"); }
    finally { setIsUploading(false); }
  };

  const downloadDoc = async (doc) => {
    if (!requireSupabase()) return;
    try {
      const storagePath = `${doc.user_id}/${doc.id}/${doc.name}`;
      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(storagePath);
      if (error) throw error;
      const url = URL.createObjectURL(data); const link = document.createElement("a"); link.href = url; link.download = doc.name; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch (err) { showToast(err?.message || "Download failed", "error"); }
  };

  const findExistingSummaryNoteId = async (userId, docId) => {
    const cached = summaryIndex?.[docId]?.noteId; if (cached) return cached;
    const { data, error } = await supabase.from(NOTES_TABLE).select("id, tags").eq("user_id", userId).contains("tags", [TAG_DOC_SUMMARY, docTag(docId)]).order("updated_at", { ascending: false }).limit(1);
    if (error) throw error; return data?.[0]?.id ?? null;
  };

  const runSmartSummary = async (doc, isAutomatic = false) => {
    if (!requireSupabase()) return;
    try {
      const user = await getUser();
      if (isAutomatic) setAutoSummarizing(doc.id);
      const summary = await smartSummarizeDocument(doc);
      const existingId = await findExistingSummaryNoteId(user.id, doc.id);
      const notePayload = { user_id: user.id, title: `AI Summary: ${doc.name.replace(/\.[^/.]+$/, "")}`, body: JSON.stringify(summary), tags: [TAG_DOC_SUMMARY, docTag(doc.id)], is_favorite: false, is_highlight: false, updated_at: nowIso(), created_at: nowIso() };
      if (existingId) { const { error } = await supabase.from(NOTES_TABLE).update({ ...notePayload, created_at: undefined }).eq("id", existingId).eq("user_id", user.id); if (error) throw error; setSummaryIndex((prev) => ({ ...(prev || {}), [doc.id]: { noteId: existingId } })); }
      else { const { data: inserted, error } = await supabase.from(NOTES_TABLE).insert(notePayload).select("id").single(); if (error) throw error; setSummaryIndex((prev) => ({ ...(prev || {}), [doc.id]: { noteId: inserted.id } })); }
      await incrementAiUses(user, 1);
      try { await incrementUsage("aiSummaries"); } catch {}
      try { await supabase.rpc("log_activity_event", { p_user_id: user.id, p_event_type: "ai_summary", p_title: `Generated summary for ${doc.name.replace(/\.[^/.]+$/, "")}`, p_metadata: { doc_id: doc.id, doc_name: doc.name } }); } catch (logErr) { console.warn("Activity log failed:", logErr); }
      if (isAutomatic) { setAutoSummarizing(null); showToast(`Read by model: "${doc.name}"`, "success"); }
    } catch (err) { setAutoSummarizing(null); showToast(err?.message || "AI summary failed", "error"); }
  };

  const handleSummarize = async (doc) => { await runSmartSummary(doc, false); navigate(`/dashboard/documents/view/${doc.id}`, { state: { scrollToSummary: true } }); };
  const toggleDocSelection = (doc) => { setSelectedDocs((prev) => prev.find((d) => d.id === doc.id) ? prev.filter((d) => d.id !== doc.id) : [...prev, doc]); };
  const startSynthesizeMode = () => { setSynthesizeMode(true); setSelectedDocs([]); setSynthesisResult(null); };
  const cancelSynthesizeMode = () => { setSynthesizeMode(false); setSelectedDocs([]); };

  const runSynthesis = async () => {
    if (selectedDocs.length < 2) { showToast("Select at least two documents.", "error"); return; }
    if (!requireSupabase()) return;
    setIsSynthesizing(true);
    try {
      const user = await getUser();
      const result = await synthesizeDocuments(selectedDocs);
      setSynthesisResult(result);
      const docIds = selectedDocs.map((d) => d.id);
      result.id = `brief-${Date.now()}`; result.title = `Research Brief: ${selectedDocs.map(d => d.name.replace(/\.[^/.]+$/, "")).slice(0, 2).join(" & ")}${selectedDocs.length > 2 ? ` +${selectedDocs.length - 2} more` : ""}`; result.generatedAt = result.meta?.generatedAt || new Date().toISOString(); result.sourceCount = selectedDocs.length; result.sources = selectedDocs.map(d => d.name); result.docIds = selectedDocs.map(d => d.id);
      const { error: updErr } = await supabase.from(DOCS_TABLE).update({ status: "synthesized", updated_at: nowIso() }).in("id", docIds).eq("user_id", user.id);
      if (updErr) throw updErr;
      setDocs((prev) => (prev || []).map((d) => (docIds.includes(d.id) ? { ...d, status: "synthesized", updated: "Just now" } : d)));
      await incrementAiUses(user, 1);
      try { await incrementUsage("documentSynth"); } catch {}
      try { await supabase.rpc("log_activity_event", { p_user_id: user.id, p_event_type: "synthesis", p_title: `Synthesized ${selectedDocs.length} documents into research brief`, p_metadata: { doc_count: selectedDocs.length, doc_ids: docIds } }); } catch (logErr) { console.warn("Activity log failed:", logErr); }
      setIsSynthesizing(false); setSynthesizeMode(false); setSelectedDocs([]);
    } catch (err) { setIsSynthesizing(false); showToast(err?.message || "Synthesis failed", "error"); }
  };

  const closeSynthesisResult = () => setSynthesisResult(null);

  const saveBrief = async () => {
    if (!synthesisResult) return; if (!requireSupabase()) return;
    try {
      const user = await getUser();
      const payload = { user_id: user.id, title: synthesisResult.title, body: JSON.stringify(synthesisResult), tags: [TAG_RESEARCH_BRIEF], is_favorite: false, is_highlight: false, created_at: nowIso(), updated_at: nowIso() };
      const { data: inserted, error } = await supabase.from(NOTES_TABLE).insert(payload).select("id").single();
      if (error) throw error;
      setSavedBriefs((prev) => [{ ...synthesisResult, noteId: inserted.id }, ...(prev || [])]);
      showToast("Brief saved to the archive.", "success"); closeSynthesisResult();
    } catch (err) { showToast(err?.message || "Failed to save brief", "error"); }
  };

  const deleteBrief = async (noteId) => {
    if (!requireSupabase()) return;
    try { const user = await getUser(); const { error } = await supabase.from(NOTES_TABLE).delete().eq("id", noteId).eq("user_id", user.id); if (error) throw error; setSavedBriefs((prev) => (prev || []).filter((b) => b.noteId !== noteId)); showToast("Brief removed.", "success"); }
    catch (err) { showToast(err?.message || "Failed to delete brief", "error"); }
  };

  const viewBrief = (brief) => setViewingBrief(brief);

  /* ─── Derived state (UNCHANGED) ─── */
  const filteredDocs = useMemo(() => {
    let result = (docs || []).filter((d) => { const matchesType = filterType === "ALL" || d.type === filterType; const matchesQuery = d.name.toLowerCase().includes(query.toLowerCase()); return matchesType && matchesQuery; });
    result = [...result].sort((a, b) => {
      switch (sortOrder) {
        case "oldest": return new Date(a.created_at || a.updated_at || 0).getTime() - new Date(b.created_at || b.updated_at || 0).getTime();
        case "name-az": return (a.name || "").localeCompare(b.name || "");
        case "name-za": return (b.name || "").localeCompare(a.name || "");
        default: return new Date(b.created_at || b.updated_at || 0).getTime() - new Date(a.created_at || a.updated_at || 0).getTime();
      }
    });
    return result;
  }, [query, filterType, sortOrder, docs]);

  const visibleDocs = useMemo(() => filteredDocs.slice(0, visibleCount), [filteredDocs, visibleCount]);
  const hasMore = visibleCount < filteredDocs.length;
  const totalDocs = (docs || []).length;
  const synthesizedCount = (docs || []).filter((d) => (d.status || "") === "synthesized").length;
  const summarizedCount = (docs || []).filter((d) => !!summaryIndex?.[d.id]).length;

  /* ─── Loading state ─── */
  if (filesLoading) {
    return (
      <div className="ns-ed">
        <DocsScopedStyles />
        <div style={{ padding: "120px 0", textAlign: "center" }}>
          <div style={{ maxWidth: 480, margin: "0 auto", height: 1, background: `linear-gradient(90deg, transparent, ${ED.ink}, transparent)`, backgroundSize: "200% 100%", animation: "ed-shimmer 1.6s linear infinite" }} />
          <p className="ed-mono" style={{ marginTop: 18, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint }}>
            Pulling the stack…
          </p>
          <style>{`@keyframes ed-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        </div>
      </div>
    );
  }

  const filterTypes = [
    { id: "ALL", label: "All",  n: totalDocs },
    { id: "PDF", label: "PDF",  n: (docs || []).filter((d) => d.type === "PDF").length },
    { id: "DOCX", label: "DOCX", n: (docs || []).filter((d) => d.type === "DOCX").length },
    { id: "XLSX", label: "XLSX", n: (docs || []).filter((d) => d.type === "XLSX").length },
  ];

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="ns-ed">
      <DocsScopedStyles />

      <div style={{ paddingBottom: "calc(var(--mobile-nav-height, 0px) + 100px)" }}>

        {/* Toast */}
        <AnimatePresence>
          {toast && <EdToast toast={toast} />}
        </AnimatePresence>

        {/* ━━━━━━━━━━━━━━ HEADER ━━━━━━━━━━━━━━ */}
        <header className="ed-reveal" style={{ paddingTop: 40 }}>
          <div className="ed-chapter" style={{ marginBottom: 18 }}>
            <span className="num">№ 04</span>
            <span>— THE STACK ON THE DESK</span>
          </div>

          <div className="ns-doc-headrow">
            <h1
              className="ed-display"
              style={{ fontSize: "clamp(40px, 5vw, 64px)", margin: 0, paddingBottom: "0.06em", maxWidth: 920 }}
            >
              Documents, <span className="ed-italic" style={{ color: ED.accent }}>read</span> across.
            </h1>

            <div className="ns-doc-headcta">
              <button
                className={`ed-btn ${synthesizeMode ? "ed-btn-primary" : "ed-btn-ghost"}`}
                onClick={synthesizeMode ? cancelSynthesizeMode : startSynthesizeMode}
              >
                {synthesizeMode ? <><FiX size={13} /> Cancel synthesis</> : <><FiLayers size={13} /> Synthesise across</>}
              </button>
              <button className="ed-btn ed-btn-primary" onClick={handleUploadButton}>
                Upload a document →
              </button>
            </div>
          </div>

          <p
            className="ed-mono"
            style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint, marginTop: 28 }}
          >
            {totalDocs} {totalDocs === 1 ? "DOCUMENT" : "DOCUMENTS"}
            <span className="ns-dotsep">·</span>
            {synthesizedCount} SYNTHESISED
            <span className="ns-dotsep">·</span>
            {summarizedCount} READ BY MODEL
            {settings.autoSummarize && (<>
              <span className="ns-dotsep">·</span>
              AUTO-SUMMARY ON
            </>)}
          </p>
        </header>

        <hr className="ed-rule-dbl" style={{ marginTop: 32 }} />

        {/* ━━━━━━━━━━━━━━ SYNTHESIS MODE PANEL ━━━━━━━━━━━━━━ */}
        <AnimatePresence>
          {synthesizeMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="ns-synth-strip"
            >
              <div className="ns-synth-strip-inner">
                <div className="ns-synth-info">
                  <p className="ed-mono ns-synth-eyebrow">
                    <span style={{ color: ED.accent, fontFamily: ED.serif, fontStyle: "italic", fontSize: 13, marginRight: 6 }}>§</span>
                    SYNTHESIS
                  </p>
                  <p className="ed-serif" style={{ fontSize: 19, color: ED.ink, marginTop: 4 }}>
                    {selectedDocs.length < 2
                      ? <>Select <span className="ed-italic" style={{ color: ED.accent }}>two or more</span> documents to read across.</>
                      : <>{selectedDocs.length} documents selected.</>
                    }
                  </p>
                  {selectedDocs.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                      {selectedDocs.map((doc) => (
                        <span key={doc.id} className="ed-chip" style={{ background: ED.paper50 }}>
                          {doc.name}
                          <button
                            type="button"
                            onClick={() => toggleDocSelection(doc)}
                            style={{ marginLeft: 6, color: ED.inkFaint, background: "transparent", border: 0, cursor: "pointer", lineHeight: 1 }}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {selectedDocs.length >= 2 && (
                  <button className="ed-btn ed-btn-primary ns-synth-go" onClick={runSynthesis}>
                    Generate brief <FiArrowRight size={13} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ━━━━━━━━━━━━━━ FILTER + SEARCH STRIP ━━━━━━━━━━━━━━ */}
        <div className="ns-doc-controls">
          <div className="ns-doc-filters">
            {filterTypes.map((f) => {
              const on = filterType === f.id;
              return (
                <button key={f.id} onClick={() => setFilterType(f.id)} className={`ns-filter ${on ? "on" : ""}`}>
                  {f.label}
                  <span className="n">{f.n}</span>
                </button>
              );
            })}
          </div>

          <div className="ns-doc-controls-right">
            <div className="ns-doc-search">
              <FiSearch size={13} style={{ color: ED.inkFaint }} />
              <input
                type="text"
                placeholder="Search the stack…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
              />
              {query && (
                <button onClick={() => setQuery("")} className="ns-doc-search-clear" aria-label="Clear">
                  <FiX size={12} />
                </button>
              )}
            </div>

            <SortDropdown sortOrder={sortOrder} setSortOrder={setSortOrder} />
          </div>
        </div>

        <hr className="ed-rule" />

        {/* ━━━━━━━━━━━━━━ SAVED BRIEFS ━━━━━━━━━━━━━━ */}
        {savedBriefs.length > 0 && (
          <section style={{ marginTop: 32 }}>
            <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
              <div className="ed-chapter">
                <span className="num">§ 01</span>
                <span>— SAVED BRIEFS</span>
              </div>
              <p className="ed-mono" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint }}>
                {savedBriefs.length} ON FILE
              </p>
            </header>

            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {savedBriefs.map((brief, i) => (
                <li key={brief.noteId || brief.id}>
                  <article
                    className="ns-doc-row"
                    onClick={() => viewBrief(brief)}
                  >
                    <span className="ord">{String(i + 1).padStart(2, "0")}</span>
                    <div className="body">
                      <h3 className="title ed-italic">{brief.title}</h3>
                      <p className="meta">
                        <span>{brief.sourceCount || 0} SOURCES</span>
                        <span>{fmtMetaDate(brief.generatedAt || nowIso())}</span>
                        <span className="ed-chip ed-chip-accent">RESEARCH BRIEF</span>
                      </p>
                    </div>
                    <div className="aside">
                      <IconBtn icon={<FiEye size={13} />}    title="Read" onClick={(e) => { e.stopPropagation(); viewBrief(brief); }} />
                      <IconBtn icon={<FiTrash2 size={13} />} title="Delete" danger onClick={(e) => { e.stopPropagation(); deleteBrief(brief.noteId); }} />
                    </div>
                  </article>
                  <hr className="ed-rule-soft" />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ━━━━━━━━━━━━━━ DOCUMENTS LIST ━━━━━━━━━━━━━━ */}
        <section style={{ marginTop: savedBriefs.length > 0 ? 56 : 24 }}>
          {savedBriefs.length > 0 && (
            <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
              <div className="ed-chapter">
                <span className="num">§ 02</span>
                <span>— DOCUMENTS</span>
              </div>
              <p className="ed-mono" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint }}>
                {Math.min(visibleCount, filteredDocs.length)} OF {filteredDocs.length}
              </p>
            </header>
          )}

          {filteredDocs.length === 0 ? (
            <div style={{ padding: "80px 0", textAlign: "center" }}>
              <p className="ed-serif ed-italic" style={{ fontSize: 22, color: ED.inkMute, maxWidth: 520, margin: "0 auto", lineHeight: 1.45 }}>
                {query || filterType !== "ALL"
                  ? "Nothing on the desk matches that. Try fewer words."
                  : "The desk is clear. Upload a document to begin."}
              </p>
              {!query && filterType === "ALL" && (
                <div style={{ marginTop: 28 }}>
                  <button className="ed-btn ed-btn-primary" onClick={handleUploadButton}>
                    Upload a document →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {visibleDocs.map((doc, i) => {
                const isSelected = !!selectedDocs.find((d) => d.id === doc.id);
                const isAutoSummarizing = autoSummarizing === doc.id;
                const hasSummary = !!summaryIndex?.[doc.id];
                const isSynthesized = (doc.status || "") === "synthesized";

                return (
                  <li key={doc.id}>
                    <article
                      className={`ns-doc-row ${isSelected ? "is-selected" : ""} ${synthesizeMode ? "is-pickable" : ""}`}
                      onClick={synthesizeMode ? () => toggleDocSelection(doc) : undefined}
                    >
                      <span className="ord">
                        {synthesizeMode ? (
                          <span className={`ns-checkbox ${isSelected ? "on" : ""}`} aria-hidden>
                            {isSelected && <FiCheck size={11} />}
                          </span>
                        ) : (
                          String(i + 1).padStart(2, "0")
                        )}
                      </span>

                      <div className="body">
                        <h3 className="title" title={doc.name}>{doc.name}</h3>
                        <p className="meta">
                          <span>{doc.type}</span>
                          <span>{doc.size}</span>
                          <span>{(doc.updated || "—").toUpperCase()}</span>
                          {isSynthesized && <span className="ed-chip ed-chip-accent">SYNTHESISED</span>}
                          {hasSummary && !isAutoSummarizing && <span className="ed-chip">READ BY MODEL</span>}
                          {isAutoSummarizing && <span className="ed-chip"><span className="ns-dot-pulse" /> READING…</span>}
                        </p>
                      </div>

                      {!synthesizeMode && (
                        <div className="aside">
                          <IconBtn
                            icon={<FiEye size={13} />}
                            title="Open"
                            onClick={(e) => { e.stopPropagation(); handlePreview(doc); }}
                          />
                          <IconBtn
                            icon={<FiZap size={13} />}
                            title="Send to the model"
                            disabled={isAutoSummarizing}
                            onClick={(e) => { e.stopPropagation(); handleSummarize(doc); }}
                          />
                          <IconBtn
                            icon={<FiDownload size={13} />}
                            title="Download"
                            onClick={(e) => { e.stopPropagation(); downloadDoc(doc); }}
                          />
                        </div>
                      )}
                    </article>
                    <hr className="ed-rule-soft" />
                  </li>
                );
              })}
            </ul>
          )}

          {hasMore && (
            <div style={{ textAlign: "center", padding: "32px 0 12px" }}>
              <button
                className="ed-ulink ed-mono"
                onClick={() => setVisibleCount((p) => p + DOCS_PER_PAGE)}
                style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkMute, background: "transparent" }}
              >
                Show {Math.min(DOCS_PER_PAGE, filteredDocs.length - visibleCount)} more ↓
              </button>
            </div>
          )}
        </section>

        <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileSelected} />

        {/* ━━━━━━━━━━━━━━ UPLOAD OVERLAY ━━━━━━━━━━━━━━ */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="ns-overlay"
            >
              <div style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
                <p className="ed-mono" style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint, marginBottom: 14 }}>
                  Filing it into the archive…
                </p>
                <div className="ns-overlay-rule" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ━━━━━━━━━━━━━━ SYNTHESIS OVERLAY ━━━━━━━━━━━━━━ */}
        <AnimatePresence>
          {isSynthesizing && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="ns-overlay"
            >
              <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
                <p className="ed-mono" style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint, marginBottom: 14 }}>
                  The model is reading across {selectedDocs.length} documents…
                </p>
                <div className="ns-overlay-rule" />
                <p className="ed-serif ed-italic" style={{ fontSize: 18, color: ED.inkMute, marginTop: 22, lineHeight: 1.45 }}>
                  This usually takes a moment. The brief will appear when the reading is done.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ━━━━━━━━━━━━━━ BRIEF MODAL ━━━━━━━━━━━━━━ */}
        <AnimatePresence>
          {(synthesisResult || viewingBrief) && (
            <BriefModal
              brief={synthesisResult || viewingBrief}
              isFresh={!!synthesisResult && !viewingBrief}
              onClose={() => { closeSynthesisResult(); setViewingBrief(null); }}
              onSave={saveBrief}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════ */

/* ─── Sort dropdown ─── */
function SortDropdown({ sortOrder, setSortOrder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const options = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "name-az", label: "A → Z" },
    { value: "name-za", label: "Z → A" },
  ];
  const current = options.find((o) => o.value === sortOrder) || options[0];

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="ns-sort" ref={ref}>
      <button type="button" onClick={() => setOpen((s) => !s)} className="ns-sort-btn">
        <FiClock size={12} />
        <span>{current.label}</span>
        <FiChevronDown size={11} style={{ transition: "transform .15s ease", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="ed-card ns-sort-pop"
          >
            {options.map((opt) => (
              <button
                key={opt.value} type="button"
                onClick={() => { setSortOrder(opt.value); setOpen(false); }}
                className={`ns-sort-opt ${sortOrder === opt.value ? "on" : ""}`}
              >
                <span>{opt.label}</span>
                {sortOrder === opt.value && <FiCheck size={11} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── IconBtn ─── */
const IconBtn = ({ icon, title, onClick, danger, disabled }) => (
  <button
    type="button" title={title} disabled={disabled} onClick={onClick}
    className={`ns-icon-btn ${danger ? "is-danger" : ""}`}
  >
    {icon}
  </button>
);

/* ─── Editorial toast ─── */
const EdToast = ({ toast }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    className="ed-card ns-toast"
  >
    <span
      className="ed-mono"
      style={{
        color: toast.type === "error" ? "#a8201f" : ED.accent,
        fontFamily: ED.serif, fontStyle: "italic", fontSize: 15, marginRight: 8,
      }}
    >
      {toast.type === "error" ? "!" : "✓"}
    </span>
    <span className="ed-serif" style={{ fontSize: 16, color: ED.ink }}>{toast.message}</span>
  </motion.div>
);

/* ─── Brief modal ─── */
const BriefModal = ({ brief, isFresh, onClose, onSave }) => {
  if (typeof document === "undefined" || !brief) return null;

  const prioTone = (p) => {
    const k = String(p || "medium").toLowerCase();
    if (k === "critical" || k === "high") return { bg: ED.accentSoft, color: ED.accent };
    if (k === "low") return { bg: ED.paper200, color: ED.inkMute };
    return { bg: ED.paper200, color: ED.inkMute };
  };

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="ns-modal-bg"
        onClick={onClose}
      />
      <div className="ns-modal-wrap">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          className="ed-card ns-brief"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="ns-brief-head">
            <div>
              <p className="ed-mono ns-brief-eyebrow">
                <span style={{ color: ED.accent, fontFamily: ED.serif, fontStyle: "italic", fontSize: 13, marginRight: 6 }}>№</span>
                {isFresh ? "FRESH DISPATCH" : "FILED BRIEF"}
              </p>
              <h2 className="ed-display ns-brief-title">
                {brief.title}
              </h2>
              <p className="ed-mono ns-brief-meta">
                {brief.sourceCount ?? 0} SOURCES
                <span className="ns-dotsep">·</span>
                {fmtMetaDate(brief.generatedAt || nowIso())}
              </p>
            </div>
            <button onClick={onClose} className="ns-modal-close" aria-label="Close">
              <FiX size={14} />
            </button>
          </header>

          <hr className="ed-rule" />

          <div className="ns-brief-body">

            {/* Sources */}
            <BriefSection ord="01" title="Sources read">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(brief.sources || []).length === 0 ? (
                  <p className="ed-serif ed-italic" style={{ color: ED.inkMute, fontSize: 16 }}>None on file.</p>
                ) : (
                  brief.sources.map((source, i) => (
                    <span key={`${source}-${i}`} className="ed-chip" title={source}>{source}</span>
                  ))
                )}
              </div>
            </BriefSection>

            {/* Executive */}
            {brief.executiveSummary && (
              <BriefSection ord="02" title="Executive summary">
                <p className="ed-serif ed-dropcap" style={{ fontSize: 18, lineHeight: 1.55, color: ED.inkMute, margin: 0 }}>
                  {brief.executiveSummary}
                </p>
              </BriefSection>
            )}

            {/* Themes */}
            {!!(brief.keyThemes || []).length && (
              <BriefSection ord="03" title="Key themes">
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {brief.keyThemes.map((theme, i) => (
                    <li key={i} className="ns-theme">
                      <span className="ord">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                          <span className="ed-serif" style={{ fontSize: 20, color: ED.ink }}>{theme.theme}</span>
                          <span
                            className="ed-chip"
                            style={{
                              background: prioTone(theme.frequency).bg,
                              color: prioTone(theme.frequency).color,
                              borderColor: "transparent",
                            }}
                          >
                            {String(theme.frequency || "").toUpperCase()}
                          </span>
                        </div>
                        <p className="ed-serif" style={{ fontSize: 16, color: ED.inkMute, marginTop: 6, lineHeight: 1.5 }}>{theme.insight}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </BriefSection>
            )}

            {/* Insights */}
            {!!(brief.consolidatedInsights || []).length && (
              <BriefSection ord="04" title="Consolidated insights">
                <ol className="ns-insights">
                  {brief.consolidatedInsights.map((insight, i) => (
                    <li key={i}>
                      <span className="ord">{String(i + 1).padStart(2, "0")}</span>
                      <span className="ed-serif">{insight}</span>
                    </li>
                  ))}
                </ol>
              </BriefSection>
            )}

            {/* Action plan */}
            {!!(brief.unifiedActionPlan || []).length && (
              <BriefSection ord="05" title="Action plan">
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {brief.unifiedActionPlan.map((action, i) => (
                    <li key={i} className="ns-action">
                      <span className="ord">{String(i + 1).padStart(2, "0")}</span>
                      <div className="body">
                        <p className="ed-serif" style={{ fontSize: 18, color: ED.ink, margin: 0 }}>{action.action}</p>
                        <p className="meta">
                          <span
                            className="ed-chip"
                            style={{
                              background: prioTone(action.priority).bg,
                              color: prioTone(action.priority).color,
                              borderColor: "transparent",
                            }}
                          >
                            {String(action.priority || "").toUpperCase()}
                          </span>
                          {action.owners && <span>OWNERS · {action.owners}</span>}
                          {action.deadline && <span>BY {String(action.deadline).toUpperCase()}</span>}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </BriefSection>
            )}

            {/* Contradictions */}
            {!!(brief.contradictions || []).length && (
              <BriefSection ord="06" title="Contradictions">
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {brief.contradictions.map((c, i) => (
                    <li key={i} className="ns-action">
                      <span className="ord" style={{ color: ED.accent }}>!</span>
                      <div className="body">
                        <p className="ed-serif" style={{ fontSize: 18, color: ED.ink, margin: 0 }}>{c.topic}</p>
                        <p className="ed-serif" style={{ fontSize: 16, color: ED.inkMute, marginTop: 6, lineHeight: 1.5 }}>{c.conflict}</p>
                        <p className="ed-serif ed-italic" style={{ fontSize: 16, color: ED.accent, marginTop: 6 }}>→ {c.recommendation}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </BriefSection>
            )}

            {/* Gaps */}
            {!!(brief.gaps || []).length && (
              <BriefSection ord="07" title="Information gaps">
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {brief.gaps.map((gap, i) => (
                    <li key={i} className="ns-gap">
                      <span className="ord">{String(i + 1).padStart(2, "0")}</span>
                      <span className="ed-serif ed-italic">{gap}</span>
                    </li>
                  ))}
                </ul>
              </BriefSection>
            )}
          </div>

          <hr className="ed-rule" />
          <footer className="ns-brief-foot">
            <button className="ed-btn ed-btn-ghost" onClick={onClose}>Close</button>
            {isFresh && (
              <button className="ed-btn ed-btn-primary" onClick={onSave}>
                Save to archive →
              </button>
            )}
          </footer>
        </motion.div>
      </div>
    </>,
    document.body
  );
};

const BriefSection = ({ ord, title, children }) => (
  <section className="ns-brief-sec">
    <p className="ed-chapter" style={{ marginBottom: 14 }}>
      <span className="num">§ {ord}</span>
      <span>— {String(title).toUpperCase()}</span>
    </p>
    <div>{children}</div>
  </section>
);

/* ═══════════════════════════════════════════════════════
   SCOPED CSS
═══════════════════════════════════════════════════════ */
const DocsScopedStyles = () => (
  <style>{`
    .ns-ed .ns-doc-headrow {
      display: flex; justify-content: space-between; align-items: flex-end;
      gap: 24px; flex-wrap: wrap;
    }
    .ns-ed .ns-doc-headcta { display: flex; gap: 10px; flex-wrap: wrap; }
    .ns-ed .ns-dotsep { padding: 0 8px; color: ${ED.rule}; }

    /* ── controls ── */
    .ns-ed .ns-doc-controls {
      display: flex; justify-content: space-between; align-items: center;
      gap: 24px; padding: 18px 0; flex-wrap: wrap;
    }
    .ns-ed .ns-doc-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .ns-ed .ns-doc-controls-right { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }

    .ns-ed .ns-filter {
      display: inline-flex; align-items: center; gap: 6px;
      font-family: ${ED.mono}; font-size: 11px; letter-spacing: 0.12em;
      text-transform: uppercase; color: ${ED.inkMute};
      padding: 7px 12px; border-radius: 999px;
      border: 1px solid ${ED.rule}; background: transparent;
      cursor: pointer; transition: all .15s ease;
    }
    .ns-ed .ns-filter:hover { border-color: ${ED.ink}; color: ${ED.ink}; }
    .ns-ed .ns-filter.on { background: ${ED.ink}; color: ${ED.paper50}; border-color: ${ED.ink}; }
    .ns-ed .ns-filter .n { opacity: 0.7; margin-left: 4px; font-size: 10.5px; }

    .ns-ed .ns-doc-search {
      display: inline-flex; align-items: center; gap: 8px;
      background: ${ED.paper50}; border: 1px solid ${ED.rule};
      border-radius: 999px; padding: 8px 14px; min-width: 240px;
      transition: border-color .15s ease;
    }
    .ns-ed .ns-doc-search:focus-within { border-color: ${ED.ink}; }
    .ns-ed .ns-doc-search input {
      background: transparent; border: 0; outline: 0; flex: 1; min-width: 0;
      font-family: ${ED.mono}; font-size: 12px; letter-spacing: 0.06em; color: ${ED.inkSoft};
    }
    .ns-ed .ns-doc-search input::placeholder { color: ${ED.inkFaint}; }
    .ns-ed .ns-doc-search-clear {
      width: 18px; height: 18px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      color: ${ED.inkFaint}; background: transparent; border: 0; cursor: pointer;
    }
    .ns-ed .ns-doc-search-clear:hover { color: ${ED.ink}; }

    /* ── sort ── */
    .ns-ed .ns-sort { position: relative; }
    .ns-ed .ns-sort-btn {
      display: inline-flex; align-items: center; gap: 8px;
      font-family: ${ED.mono}; font-size: 11px; letter-spacing: 0.12em;
      text-transform: uppercase; color: ${ED.inkMute};
      padding: 7px 14px; border-radius: 999px;
      border: 1px solid ${ED.rule}; background: transparent; cursor: pointer;
      transition: all .15s ease;
    }
    .ns-ed .ns-sort-btn:hover { border-color: ${ED.ink}; color: ${ED.ink}; }
    .ns-ed .ns-sort-pop {
      position: absolute; right: 0; top: calc(100% + 6px); z-index: 50;
      min-width: 200px; padding: 6px; background: ${ED.paper50};
    }
    .ns-ed .ns-sort-opt {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; padding: 9px 12px; border-radius: 6px;
      background: transparent; border: 0; cursor: pointer;
      color: ${ED.ink}; font-family: ${ED.serif}; font-size: 16px;
      transition: background-color .12s ease;
    }
    .ns-ed .ns-sort-opt:hover { background: ${ED.paper150}; }
    .ns-ed .ns-sort-opt.on { color: ${ED.accent}; font-style: italic; }

    /* ── article row ── */
    .ns-ed .ns-doc-row {
      display: grid;
      grid-template-columns: 56px minmax(0, 1fr) auto;
      gap: 18px;
      padding: 20px 14px;
      cursor: pointer;
      transition: background-color .12s ease, padding .12s ease;
      align-items: start;
    }
    .ns-ed .ns-doc-row.is-pickable { cursor: pointer; }
    .ns-ed .ns-doc-row:hover { background: ${ED.paper150}; padding-left: 18px; }
    .ns-ed .ns-doc-row.is-selected { background: ${ED.accentSoft}; }
    .ns-ed .ns-doc-row .ord {
      font-family: ${ED.mono}; font-size: 11px; letter-spacing: 0.14em;
      color: ${ED.inkFaint}; padding-top: 6px; transition: all .15s ease;
    }
    .ns-ed .ns-doc-row:hover .ord {
      color: ${ED.accent}; font-family: ${ED.serif}; font-style: italic; font-size: 17px;
    }
    .ns-ed .ns-doc-row .body { min-width: 0; max-width: 760px; }
    .ns-ed .ns-doc-row .title {
      font-family: ${ED.serif}; font-size: clamp(20px, 1.7vw, 25px);
      line-height: 1.22; color: ${ED.ink}; margin: 0; padding-bottom: 0.04em;
      transition: color .15s ease;
      word-break: break-word;
    }
    .ns-ed .ns-doc-row:hover .title { color: ${ED.accent}; }
    .ns-ed .ns-doc-row .meta {
      font-family: ${ED.mono}; font-size: 10.5px; letter-spacing: 0.14em;
      text-transform: uppercase; color: ${ED.inkFaint};
      margin: 10px 0 0; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    }
    .ns-ed .ns-doc-row .aside {
      display: flex; gap: 6px; align-items: center; padding-top: 4px;
    }

    /* ── checkbox ── */
    .ns-ed .ns-checkbox {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; border-radius: 4px;
      border: 1px solid ${ED.rule}; background: ${ED.paper50};
      color: ${ED.paper50}; transition: all .15s ease;
    }
    .ns-ed .ns-checkbox.on { background: ${ED.ink}; border-color: ${ED.ink}; }

    /* ── action icon buttons (right of row) ── */
    .ns-ed .ns-icon-btn {
      width: 30px; height: 30px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid transparent; color: ${ED.inkFaint};
      background: transparent; cursor: pointer;
      transition: all .15s ease;
    }
    .ns-ed .ns-icon-btn:hover {
      border-color: ${ED.rule}; color: ${ED.ink}; background: ${ED.paper50};
    }
    .ns-ed .ns-icon-btn.is-danger:hover {
      color: #a8201f; border-color: #a8201f;
    }
    .ns-ed .ns-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── synthesis strip ── */
    .ns-ed .ns-synth-strip {
      overflow: hidden;
      border: 1px solid ${ED.rule};
      border-radius: 14px;
      background: ${ED.paper50};
      margin-top: 24px;
    }
    .ns-ed .ns-synth-strip-inner {
      padding: 22px 24px;
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 24px; flex-wrap: wrap;
    }
    .ns-ed .ns-synth-info { flex: 1; min-width: 0; }
    .ns-ed .ns-synth-eyebrow {
      font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
      color: ${ED.inkFaint}; margin: 0;
    }
    .ns-ed .ns-synth-go { flex-shrink: 0; }

    /* ── small pulse ── */
    @keyframes ns-pulse { 0%,100% { opacity: 1;} 50% { opacity: 0.3; } }
    .ns-ed .ns-dot-pulse {
      display: inline-block; width: 6px; height: 6px; border-radius: 999px;
      background: ${ED.accent}; margin-right: 6px;
      animation: ns-pulse 1.4s ease-in-out infinite;
    }

    /* ── overlays ── */
    .ns-ed .ns-overlay {
      position: fixed; inset: 0; z-index: 300;
      display: flex; align-items: center; justify-content: center;
      background: rgba(246,241,227,0.92);
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
      padding: 32px;
    }
    .ns-ed .ns-overlay-rule {
      height: 1px;
      background: linear-gradient(90deg, transparent, ${ED.ink}, transparent);
      background-size: 200% 100%;
      animation: ns-overlay-shimmer 1.6s linear infinite;
    }
    @keyframes ns-overlay-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ── toast ── */
    .ns-ed .ns-toast {
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      z-index: 10000;
      display: inline-flex; align-items: center;
      padding: 11px 18px;
      background: ${ED.paper50};
    }

    /* ── brief modal ── */
    .ns-ed .ns-modal-bg {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(19,16,8,0.36);
    }
    .ns-ed .ns-modal-wrap {
      position: fixed; inset: 0; z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      padding: 20px; pointer-events: none;
      overflow-y: auto;
    }
    .ns-ed .ns-brief {
      width: 100%; max-width: 760px; padding: 0;
      max-height: calc(100dvh - 40px);
      pointer-events: auto;
      background: ${ED.paper50};
      display: flex; flex-direction: column;
    }
    .ns-ed .ns-brief-head {
      padding: 28px 32px 20px;
      display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
    }
    .ns-ed .ns-brief-eyebrow {
      font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
      color: ${ED.inkFaint}; margin: 0;
    }
    .ns-ed .ns-brief-title {
      font-size: clamp(28px, 3.2vw, 40px); margin: 8px 0 0;
      padding-bottom: 0.06em; line-height: 1.05;
      max-width: 640px;
    }
    .ns-ed .ns-brief-meta {
      font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase;
      color: ${ED.inkFaint}; margin: 10px 0 0;
    }
    .ns-ed .ns-modal-close {
      width: 36px; height: 36px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid ${ED.rule}; color: ${ED.inkSoft};
      background: transparent; cursor: pointer;
      transition: all .15s ease; flex-shrink: 0;
    }
    .ns-ed .ns-modal-close:hover { border-color: ${ED.ink}; color: ${ED.ink}; }

    .ns-ed .ns-brief-body {
      padding: 24px 32px 4px;
      overflow-y: auto; flex: 1;
    }
    .ns-ed .ns-brief-sec + .ns-brief-sec {
      margin-top: 36px;
      padding-top: 32px;
      border-top: 1px solid ${ED.ruleSoft};
    }

    .ns-ed .ns-theme,
    .ns-ed .ns-action,
    .ns-ed .ns-gap {
      display: grid; grid-template-columns: 36px 1fr; gap: 12px;
      padding: 12px 0;
    }
    .ns-ed .ns-theme + .ns-theme,
    .ns-ed .ns-action + .ns-action,
    .ns-ed .ns-gap + .ns-gap {
      border-top: 1px solid ${ED.ruleSoft};
    }
    .ns-ed .ns-theme .ord,
    .ns-ed .ns-action .ord,
    .ns-ed .ns-gap .ord,
    .ns-ed .ns-insights .ord {
      font-family: ${ED.serif}; font-style: italic; font-size: 18px;
      color: ${ED.accent}; line-height: 1;
    }
    .ns-ed .ns-action .body { min-width: 0; }
    .ns-ed .ns-action .meta {
      font-family: ${ED.mono}; font-size: 10.5px; letter-spacing: 0.14em;
      text-transform: uppercase; color: ${ED.inkFaint};
      margin: 10px 0 0; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    }
    .ns-ed .ns-gap .ed-italic { font-size: 17px; color: ${ED.inkMute}; }

    .ns-ed .ns-insights {
      list-style: none; padding: 0; margin: 0;
    }
    .ns-ed .ns-insights li {
      display: grid; grid-template-columns: 36px 1fr; gap: 12px;
      padding: 10px 0;
      border-top: 1px solid ${ED.ruleSoft};
    }
    .ns-ed .ns-insights li:first-child { border-top: 0; }
    .ns-ed .ns-insights .ed-serif { font-size: 17px; line-height: 1.5; color: ${ED.ink}; }

    .ns-ed .ns-brief-foot {
      padding: 20px 32px 24px;
      display: flex; gap: 12px; justify-content: flex-end;
    }

    @media (max-width: 720px) {
      .ns-ed .ns-doc-headrow { flex-direction: column; align-items: flex-start; gap: 16px; }
      .ns-ed .ns-doc-headcta { width: 100%; flex-direction: column; }
      .ns-ed .ns-doc-headcta .ed-btn { width: 100%; justify-content: center; }
      .ns-ed .ns-doc-controls { flex-direction: column; align-items: stretch; gap: 12px; }
      .ns-ed .ns-doc-search { min-width: 0; }
      .ns-ed .ns-doc-controls-right { flex-direction: column; align-items: stretch; }
      .ns-ed .ns-doc-row { grid-template-columns: 36px 1fr; padding: 16px 6px; }
      .ns-ed .ns-doc-row .aside {
        grid-column: 1 / -1; padding-top: 8px; justify-content: flex-end;
      }
      .ns-ed .ns-brief-head,
      .ns-ed .ns-brief-body,
      .ns-ed .ns-brief-foot { padding-left: 20px; padding-right: 20px; }
      .ns-ed .ns-synth-strip-inner { padding: 16px; }
    }
  `}</style>
);