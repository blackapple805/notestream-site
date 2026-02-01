// src/pages/NoteView.jsx
import {
  FiArrowLeft,
  FiHeart,
  FiLock,
  FiTrash2,
  FiEdit2,
  FiZap,
  FiCheck,
  FiCalendar,
  FiStar,
  FiFileText,
  FiExternalLink,
  FiDownload,
  FiMic,
} from "react-icons/fi";
import { Sparkle, Lightning } from "phosphor-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../hooks/useSubscription";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { logActivityEvent } from "../lib/activityEvents";

const USER_STATS_TABLE = "user_engagement_stats";
const EVENTS_TABLE = "activity_events";

const AI_USES_KEY = "notestream-aiUses";
const SMART_KEY_PREFIX = "ns-note-smart:";


function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function bumpAiUses() {
  const current = Number(localStorage.getItem(AI_USES_KEY) || 0) || 0;
  const next = current + 1;
  localStorage.setItem(AI_USES_KEY, String(next));

  // Optional: if you also keep a bundled engagement object locally, update it too.
  // (Safe no-op if you don’t use it.)
  const engagement = safeJsonParse(localStorage.getItem("notestream-engagement") || "{}") || {};
  localStorage.setItem(
    "notestream-engagement",
    JSON.stringify({
      ...engagement,
      ai_uses: next,
      last_active_date: new Date().toISOString().slice(0, 10),
    })
  );

  // Allow dashboard to live-update without refresh
  window.dispatchEvent(
    new CustomEvent("notestream:ai_uses_updated", { detail: { aiUses: next } })
  );

  return next;
}

export default function NoteView({
  note,
  onBack,
  onFavoriteToggle,
  onEditSave,
  onDelete,
  onLockToggle,
}) {
  const navigate = useNavigate();

  const { subscription, isFeatureUnlocked } = useSubscription();
  const isPro = !!subscription?.plan && subscription.plan !== "free";
  const canUseVoice =
    typeof isFeatureUnlocked === "function" ? isFeatureUnlocked("voice") : isPro;
  const canUseExport =
    typeof isFeatureUnlocked === "function" ? isFeatureUnlocked("export") : isPro;

  const supabaseReady =
    typeof isSupabaseConfigured === "function"
      ? isSupabaseConfigured()
      : !!isSupabaseConfigured;

  const isUuid = (v) =>
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

  const toLocalYMD = (d = new Date()) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseYMDToDate = (ymd) => {
    const [y, m, d] = String(ymd || "").split("-").map((n) => Number(n));
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const diffDaysLocal = (aYmd, bYmd) => {
    const a = parseYMDToDate(aYmd);
    const b = parseYMDToDate(bYmd);
    if (!a || !b) return null;
    const ms = b.getTime() - a.getTime();
    return Math.floor(ms / (24 * 60 * 60 * 1000));
  };

  const trackAiUseDb = async () => {
    if (!supabaseReady || !supabase) return;

    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user?.id) return;

      // Log event (safe: entity_id can be null if note.id isn't a uuid)
      await logActivityEvent({
        userId: user.id,
        eventType: "ai_used",
        entityId: isUuid(note?.id) ? note.id : null,
        metadata: { feature: "note_ai", note_id: note?.id ?? null },
        title: "AI used on note",
      });

            const today = toLocalYMD();

      const { data: row, error: rowErr } = await supabase
        .from(USER_STATS_TABLE)
        .select("user_id,ai_uses,active_days,streak_days,last_active_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (rowErr) return;

      if (!row) {
        // IMPORTANT: your table doesn't have updated_at in the screenshot
        await supabase.from(USER_STATS_TABLE).insert({
          user_id: user.id,
          ai_uses: 1,
          active_days: 1,
          streak_days: 1,
          last_active_date: today,
        });
        return;
      }

      const prevYmd = row.last_active_date;
      const delta = prevYmd ? diffDaysLocal(prevYmd, today) : null;

      const nextAiUses = Number(row.ai_uses ?? 0) + 1;

      const nextActiveDays =
        delta === null
          ? Number(row.active_days ?? 0) + 1
          : delta >= 1
          ? Number(row.active_days ?? 0) + 1
          : Number(row.active_days ?? 0);

      const nextStreak =
        delta === 0
          ? Number(row.streak_days ?? 0)
          : delta === 1
          ? Number(row.streak_days ?? 0) + 1
          : 1;

      await supabase
        .from(USER_STATS_TABLE)
        .update({
          ai_uses: nextAiUses,
          active_days: nextActiveDays,
          streak_days: nextStreak,
          last_active_date: today,
        })
        .eq("user_id", user.id);
    } catch {
      // silent fail
    }
  };

  if (!note) return null;

  const isVoiceNote = !!note?.audioUrl || note?.tag === "Voice";

  // Derive from note (prevents desync with parent / PIN flows)
  const isLocked = !!note.locked;
  const isFav = !!note.favorite;

  const [showToast, setShowToast] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [title, setTitle] = useState(note.title || "Untitled");
  const [body, setBody] = useState(note.body ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [voiceToast, setVoiceToast] = useState(false);

  const [smartData, setSmartData] = useState({
    summary: note.summary || null,
    SmartTasks: note.SmartTasks || null,
    SmartHighlights: note.SmartHighlights || null,
    SmartSchedule: note.SmartSchedule || null,
    generatedAt: note.aiGeneratedAt || null,
  });

  const textareaRef = useRef(null);

  // Load persisted Smart Notes for this note (so it remains after leaving/reopening)
  useEffect(() => {
    setTitle(note.title || "Untitled");
    setBody(note.body ?? "");
    setIsEditing(false);
    setShowExportMenu(false);
    setShowDeleteConfirm(false);

    const key = `${SMART_KEY_PREFIX}${note.id}`;
    const stored = safeJsonParse(localStorage.getItem(key) || "null");

    // Priority: note fields -> localStorage -> empty
    const nextSmart = {
      summary: note.summary || stored?.summary || null,
      SmartTasks: note.SmartTasks || stored?.SmartTasks || null,
      SmartHighlights: note.SmartHighlights || stored?.SmartHighlights || null,
      SmartSchedule: note.SmartSchedule || stored?.SmartSchedule || null,
      generatedAt: note.aiGeneratedAt || stored?.generatedAt || null,
    };

    setSmartData(nextSmart);
  }, [note?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasSmartData =
    !!smartData?.summary ||
    (Array.isArray(smartData?.SmartTasks) && smartData.SmartTasks.length > 0) ||
    (Array.isArray(smartData?.SmartHighlights) && smartData.SmartHighlights.length > 0) ||
    (Array.isArray(smartData?.SmartSchedule) && smartData.SmartSchedule.length > 0);

  const formatRelative = (date) => {
    const ts = new Date(date).getTime();
    if (!ts) return "";
    const diffMs = Date.now() - ts;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) return "Just now";
    if (diffHrs < 1) return `${diffMins}m ago`;
    if (diffDays < 1) return `${diffHrs}h ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const formatDate = (date) => {
    const ts = new Date(date).getTime();
    if (!ts) return "";
    return new Date(date).toLocaleDateString(navigator.language || "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const autoResize = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  };

  useEffect(() => {
    if (isEditing) autoResize();
  }, [body, isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    const t = setTimeout(() => textareaRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [isEditing]);

  const handleEditToggle = () => {
    if (isLocked || isVoiceNote) return;

    if (isEditing) {
      onEditSave?.(note.id, title, body, new Date().toISOString());
    }
    setIsEditing((v) => !v);
  };

  const persistSmart = (payload) => {
    const key = `${SMART_KEY_PREFIX}${note.id}`;
    const enriched = { ...payload, generatedAt: new Date().toISOString() };

    setSmartData(enriched);
    localStorage.setItem(key, JSON.stringify(enriched));

    // Optional: if parent supports saving extra fields, pass them (won’t break if ignored)
    onEditSave?.(note.id, title, body, new Date().toISOString(), {
      summary: enriched.summary,
      SmartTasks: enriched.SmartTasks,
      SmartHighlights: enriched.SmartHighlights,
      SmartSchedule: enriched.SmartSchedule,
      aiGeneratedAt: enriched.generatedAt,
    });
  };

  // Demo AI analyze (client-side). Persist + count AI use.
  const fakeSmartNotes = () => {
    if (isVoiceNote) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      const newSmartData = {
        summary:
          "Quick focus: UI components must be completed before the meeting tomorrow at 3 PM.",
        SmartTasks: ["Finish UI components", "Request updated Figma from Sarah"],
        SmartHighlights: ["Dashboard layout is highest priority"],
        SmartSchedule: ["Meeting tomorrow at 3 PM"],
      };

      persistSmart(newSmartData);
      bumpAiUses();
      trackAiUseDb();
      
      setIsAnalyzing(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 2000);
  };

  // Parent toggles internally (PIN flow etc)
  const handleLockToggle = () => {
    if (isEditing) {
      onEditSave?.(note.id, title, body, new Date().toISOString());
      setIsEditing(false);
    }
    onLockToggle?.(note.id, true);
  };

  const handleFavoriteToggle = () => {
    onFavoriteToggle?.(note.id, true);
  };

  const downloadBlob = (filename, mime, content) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const escapeHtml = (str) => {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const exportBasic = () => {
    const safeTitle = (title || "note").replace(/[^\w\s-]/g, "").trim() || "note";

    let smartContent = "";
    if (hasSmartData) {
      smartContent += "\n\n-----------------------------------\n";
      smartContent += "AI SMART NOTES ANALYSIS\n";
      smartContent += "-----------------------------------\n\n";
      if (smartData.summary) smartContent += "AI Summary:\n" + smartData.summary + "\n\n";
      if (smartData.SmartTasks?.length > 0) {
        smartContent +=
          "Tasks:\n" +
          smartData.SmartTasks.map((t, i) => `  ${i + 1}. ${t}`).join("\n") +
          "\n\n";
      }
      if (smartData.SmartHighlights?.length > 0) {
        smartContent +=
          "Key Highlights:\n" +
          smartData.SmartHighlights.map((h) => `  • ${h}`).join("\n") +
          "\n\n";
      }
      if (smartData.SmartSchedule?.length > 0) {
        smartContent +=
          "Schedule:\n" +
          smartData.SmartSchedule.map((s) => `  • ${s}`).join("\n") +
          "\n\n";
      }
    }

    const content = `${title}\n\n${body || ""}${smartContent}\n---\nExported from NoteStream on ${new Date().toLocaleString()}\n`;
    downloadBlob(`${safeTitle}.txt`, "text/plain;charset=utf-8", content);
    setShowExportMenu(false);
  };

  const exportAdvanced = (format) => {
    const safeTitle = (title || "note").replace(/[^\w\s-]/g, "").trim() || "note";

    if (format === "pdf") {
      let iframe = document.getElementById("print-frame");
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = "print-frame";
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "none";
        document.body.appendChild(iframe);
      }

      const smartHtml = hasSmartData
        ? `
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #6366f1;">
            <h2 style="color: #6366f1; margin-bottom: 20px;">📊 AI Smart Notes Analysis</h2>
            ${
              smartData.summary
                ? `<div style="background: #f3f4f6; padding: 16px; border-radius: 8px;">
                    <h3 style="color: #4f46e5; margin: 0 0 8px 0;">💡 AI Summary</h3>
                    <p style="margin: 0; color: #374151;">${escapeHtml(smartData.summary)}</p>
                  </div>`
                : ""
            }
          </div>
        `
        : "";

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${safeTitle}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1 { color: #1f2937; border-bottom: 2px solid #6366f1; padding-bottom: 12px; }
              .content { white-space: pre-wrap; line-height: 1.8; color: #374151; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
              @media print { body { padding: 20px; } }
            </style>
          </head>
          <body>
            <h1>${escapeHtml(title)}</h1>
            <div class="content">${escapeHtml(body || "")}</div>
            ${smartHtml}
            <div class="footer">Exported from NoteStream on ${new Date().toLocaleString()}</div>
          </body>
        </html>
      `;

      const iframeDoc = iframe.contentWindow || iframe.contentDocument;
      const doc = iframeDoc.document || iframeDoc;
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }, 250);

      setShowExportMenu(false);
    }
  };

  const handleExportClick = () => {
    if (!canUseExport) {
      setShowUpgrade(true);
      return;
    }
    setShowExportMenu((v) => !v);
  };

  const handleVoiceClick = () => {
    if (!canUseVoice) {
      setShowUpgrade(true);
      return;
    }
    if (isVoiceNote) {
      const el = document.getElementById("voice-player");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setVoiceToast(true);
    setTimeout(() => setVoiceToast(false), 3000);
  };

  const noteBadge = useMemo(() => {
    if (note.tag === "Voice") {
      return (
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full"
          style={{
            color: "var(--accent-purple)",
            backgroundColor: "rgba(168, 85, 247, 0.1)",
            border: "1px solid rgba(168, 85, 247, 0.2)",
          }}
        >
          <FiMic size={10} />
          Voice
        </span>
      );
    }
    if (hasSmartData) {
      return (
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full"
          style={{
            color: "var(--accent-indigo)",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
          }}
        >
          <Sparkle size={12} weight="fill" />
          Smart
        </span>
      );
    }
    return null;
  }, [note.tag, hasSmartData]);

  return (
    <div className="min-h-full w-full pb-[calc(var(--mobile-nav-height)+24px)]">
      {/* HEADER */}
      <div className="sticky top-0 z-50">
        <div className="relative mx-auto w-full max-w-5xl px-3 sm:px-6 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-shrink">
              <ActionButton icon={<FiArrowLeft size={18} />} onClick={onBack} title="Back" />
              <div className="min-w-0 hidden sm:block">
                <div className="flex items-center gap-2">
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {note.updated ? formatDate(note.updated) : ""}
                    {note.updated ? ` • ${formatRelative(note.updated)}` : ""}
                  </p>
                  {noteBadge}
                </div>
                <p className="text-sm font-semibold truncate max-w-[200px]" style={{ color: "var(--text-primary)" }}>
                  {title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
              <ActionButton
                icon={<FiMic size={16} />}
                onClick={handleVoiceClick}
                disabled={isAnalyzing}
                title={canUseVoice ? "Voice Notes" : "Voice Notes (Pro)"}
                active={isVoiceNote}
                activeColor="var(--accent-purple)"
              />

              <div className="relative">
                <ActionButton
                  icon={<FiDownload size={16} />}
                  onClick={handleExportClick}
                  disabled={isAnalyzing}
                  title={canUseExport ? "Export" : "Export (Pro)"}
                  active={showExportMenu}
                  activeColor="var(--accent-indigo)"
                />

                <AnimatePresence>
                  {showExportMenu && canUseExport && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120]"
                        onClick={() => setShowExportMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        className="absolute right-0 top-12 z-[200] w-[200px] rounded-2xl border shadow-xl p-2"
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          borderColor: "var(--border-secondary)",
                        }}
                      >
                        <MenuItem icon={<FiFileText size={14} />} label="Export PDF" onClick={() => exportAdvanced("pdf")} />
                        <MenuItem icon={<FiDownload size={14} />} label="Basic (TXT)" onClick={exportBasic} subtle />
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <ActionButton
                icon={<FiHeart size={16} />}
                active={isFav}
                activeColor="var(--accent-rose)"
                onClick={handleFavoriteToggle}
                disabled={isAnalyzing}
                title="Favorite"
                filled={isFav}
              />

              <ActionButton
                icon={<FiZap size={16} />}
                active={isAnalyzing}
                activeColor="var(--accent-indigo)"
                onClick={fakeSmartNotes}
                disabled={isAnalyzing || isVoiceNote}
                title={isVoiceNote ? "AI Analysis (not for voice notes)" : "AI Analysis"}
                pulse={isAnalyzing}
              />

              <ActionButton
                icon={<FiLock size={16} />}
                active={isLocked}
                activeColor="var(--accent-amber)"
                onClick={handleLockToggle}
                disabled={isAnalyzing}
                title={isLocked ? "Unlock" : "Lock"}
              />

              <ActionButton
                icon={<FiTrash2 size={16} />}
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isAnalyzing}
                title="Delete"
              />

              <ActionButton
                icon={isEditing ? <FiCheck size={16} /> : <FiEdit2 size={16} />}
                active={isEditing}
                activeColor="var(--accent-emerald)"
                onClick={handleEditToggle}
                disabled={isAnalyzing || isLocked || isVoiceNote}
                title={isVoiceNote ? "Voice note" : isLocked ? "Locked" : isEditing ? "Save" : "Edit"}
              />
            </div>
          </div>

          <div className="sm:hidden mt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {note.updated ? formatDate(note.updated) : ""}
                {note.updated ? ` • ${formatRelative(note.updated)}` : ""}
              </p>
              {noteBadge}
              {isLocked && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    color: "var(--accent-amber)",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                  }}
                >
                  <FiLock size={9} />
                  Locked
                </span>
              )}
            </div>
            <p className="text-base font-semibold mt-1 truncate" style={{ color: "var(--text-primary)" }}>
              {title}
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgrade && (
          <UpgradeModal
            onClose={() => setShowUpgrade(false)}
            title="Pro feature"
            body="Voice Notes and Advanced Export are available on Pro."
            onUpgrade={() => navigate("/dashboard/ai-lab")}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2"
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.9)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              color: "white",
            }}
          >
            <Sparkle size={16} weight="fill" />
            Smart Notes analysis complete!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Toast */}
      <AnimatePresence>
        {voiceToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2"
            style={{
              backgroundColor: "rgba(168, 85, 247, 0.9)",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              color: "white",
            }}
          >
            <FiMic size={16} />
            Voice Notes can be created from the Notes page
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyzing Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-[80px] left-1/2 -translate-x-1/2 z-[300] w-[min(480px,90vw)] rounded-2xl border px-4 py-4 flex items-center gap-4"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-secondary)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
              }}
            >
              <Lightning size={22} weight="fill" style={{ color: "var(--accent-indigo)" }} />
            </motion.div>

            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Analyzing note with AI…
              </p>
              <div className="w-full h-1.5 rounded-full overflow-hidden mt-2" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                  className="h-full w-1/3"
                  style={{ backgroundColor: "var(--accent-indigo)" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row lg:gap-6">
          {/* MAIN */}
          <div className="flex-1 lg:flex-[7] space-y-4">
            {note.audioUrl && (
              <div
                id="voice-player"
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="h-10 w-10 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: "rgba(168, 85, 247, 0.18)",
                      border: "1px solid rgba(168, 85, 247, 0.28)",
                    }}
                  >
                    <FiMic style={{ color: "var(--accent-purple)" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      Voice Recording
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      Tap play to listen
                    </p>
                  </div>
                </div>
                <audio controls className="w-full" style={{ height: "40px" }}>
                  <source src={note.audioUrl} type={note.audioMime || "audio/webm"} />
                </audio>
              </div>
            )}

            {note.imageUrl && (
              <div
                className="rounded-2xl overflow-hidden border"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                <img src={note.imageUrl} alt="Note upload" className="w-full max-h-[52vh] object-contain" />
              </div>
            )}

            {note.pdfUrl && (
              <div
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                    <FiFileText size={22} style={{ color: "var(--accent-indigo)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      PDF Document
                    </p>
                    <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                      Tap to view full document
                    </p>
                  </div>
                  <a
                    href={note.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-2xl flex items-center justify-center transition"
                    style={{
                      backgroundColor: "rgba(99, 102, 241, 0.15)",
                      border: "1px solid rgba(99, 102, 241, 0.25)",
                      color: "var(--accent-indigo)",
                    }}
                    title="Open PDF"
                  >
                    <FiExternalLink size={16} />
                  </a>
                </div>
              </div>
            )}

            <div
              className="rounded-2xl p-4 sm:p-5"
              style={{
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-secondary)",
              }}
            >
              {isEditing ? (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={140}
                  className="note-input w-full bg-transparent text-xl sm:text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                  placeholder="Title"
                  disabled={isLocked}
                />
              ) : (
                <h1 className="text-xl sm:text-2xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                  {title}
                </h1>
              )}

              <div className="mt-3">
                {isEditing ? (
                  <textarea
                    ref={textareaRef}
                    rows={10}
                    className="note-input w-full bg-transparent text-[15px] resize-none leading-relaxed whitespace-pre-wrap"
                    style={{ color: "var(--text-secondary)" }}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={isLocked ? "This note is locked." : "Start writing…"}
                    disabled={isLocked}
                  />
                ) : body ? (
                  <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: "var(--text-secondary)" }}>
                    {body}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    This note is empty. Tap edit to start writing.
                  </p>
                )}
              </div>
            </div>

            {!isEditing && note.extractedText && (
              <div
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                    <FiFileText size={14} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    Extracted Text
                  </h3>
                </div>
                <p className="text-[13px] whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {note.extractedText}
                </p>
              </div>
            )}
          </div>

          {/* SMART PANEL */}
          <div className="lg:flex-[5] mt-4 lg:mt-0 space-y-4">
            {!isEditing && hasSmartData ? (
              <>
                {smartData.summary && (
                  <SmartCard icon={<Sparkle size={16} weight="fill" />} title="AI Summary" color="indigo" delay={0}>
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {smartData.summary}
                    </p>
                  </SmartCard>
                )}

                {smartData.SmartTasks?.length > 0 && (
                  <SmartCard icon={<FiCheck size={14} />} title="Tasks" color="emerald" delay={0.04}>
                    <ul className="space-y-2">
                      {smartData.SmartTasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                          <div
                            className="h-5 w-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                              backgroundColor: "rgba(16, 185, 129, 0.1)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                            }}
                          >
                            <FiCheck size={10} style={{ color: "var(--accent-emerald)" }} />
                          </div>
                          {task}
                        </li>
                      ))}
                    </ul>
                  </SmartCard>
                )}

                {smartData.SmartHighlights?.length > 0 && (
                  <SmartCard icon={<FiStar size={14} />} title="Highlights" color="amber" delay={0.08}>
                    <ul className="space-y-2">
                      {smartData.SmartHighlights.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                          <div
                            className="h-5 w-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                              backgroundColor: "rgba(245, 158, 11, 0.1)",
                              border: "1px solid rgba(245, 158, 11, 0.3)",
                            }}
                          >
                            <FiStar size={10} style={{ color: "var(--accent-amber)" }} />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </SmartCard>
                )}

                {smartData.SmartSchedule?.length > 0 && (
                  <SmartCard icon={<FiCalendar size={14} />} title="Schedule" color="purple" delay={0.12}>
                    <ul className="space-y-2">
                      {smartData.SmartSchedule.map((date, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                          <div
                            className="h-5 w-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                              backgroundColor: "rgba(168, 85, 247, 0.1)",
                              border: "1px solid rgba(168, 85, 247, 0.3)",
                            }}
                          >
                            <FiCalendar size={10} style={{ color: "var(--accent-purple)" }} />
                          </div>
                          {date}
                        </li>
                      ))}
                    </ul>
                  </SmartCard>
                )}
              </>
            ) : (
              !isEditing && (
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-secondary)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="h-9 w-9 rounded-2xl flex items-center justify-center"
                      style={{
                        backgroundColor: "rgba(99,102,241,0.12)",
                        border: "1px solid rgba(99,102,241,0.22)",
                      }}
                    >
                      <Sparkle size={16} weight="fill" style={{ color: "var(--accent-indigo)" }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      Smart Notes
                    </p>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    Run AI Analysis to generate a summary, tasks, highlights, and schedule.
                  </p>
                  <button
                    onClick={fakeSmartNotes}
                    disabled={isAnalyzing || isVoiceNote}
                    className="mt-3 w-full py-2.5 rounded-xl text-sm font-medium transition active:scale-[0.99]"
                    style={{
                      background: "linear-gradient(90deg, var(--accent-indigo), #4f46e5)",
                      color: "white",
                      opacity: isAnalyzing || isVoiceNote ? 0.6 : 1,
                    }}
                    title={isVoiceNote ? "AI analysis not available for voice notes" : "Run AI Analysis"}
                  >
                    {isAnalyzing ? "Analyzing…" : "Run AI Analysis"}
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center px-6"
            style={{ backgroundColor: "var(--bg-overlay)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[360px] p-6 rounded-2xl border shadow-xl"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="h-10 w-10 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(244, 63, 94, 0.2)", border: "1px solid rgba(244, 63, 94, 0.3)" }}
                >
                  <FiTrash2 size={18} style={{ color: "var(--accent-rose)" }} />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  Delete Note?
                </h3>
              </div>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                This action cannot be undone. Are you sure you want to delete this note?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-medium transition"
                  style={{ backgroundColor: "var(--bg-button)", color: "var(--text-primary)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete?.(note.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl text-white font-medium transition"
                  style={{ backgroundColor: "var(--accent-rose)" }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .note-input {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
          caret-color: var(--accent-indigo);
        }
        .note-input:focus {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .note-input::placeholder {
          color: var(--text-muted);
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

/* -----------------------------------------
   Action Button Component
----------------------------------------- */
const ActionButton = ({
  icon,
  active,
  activeColor = "var(--accent-indigo)",
  onClick,
  disabled,
  title,
  pulse,
  filled,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition active:scale-95 flex-shrink-0 ${
      disabled ? "opacity-50 cursor-not-allowed" : ""
    } ${pulse ? "animate-pulse" : ""}`}
    style={{
      backgroundColor: "var(--bg-tertiary)",
      border: `1px solid ${active ? activeColor : "var(--border-secondary)"}`,
      color: active ? activeColor : "var(--text-muted)",
    }}
  >
    {filled && active ? <FiHeart size={16} fill="currentColor" /> : icon}
  </button>
);

/* -----------------------------------------
   Menu Item Component
----------------------------------------- */
const MenuItem = ({ icon, label, onClick, subtle }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition"
    style={{ color: subtle ? "var(--text-muted)" : "var(--text-primary)" }}
  >
    <span style={{ color: "var(--accent-indigo)" }}>{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

/* -----------------------------------------
   Smart Card Component
----------------------------------------- */
const SmartCard = ({ icon, title, color, children, delay = 0 }) => {
  const colorMap = {
    indigo: { bg: "rgba(99, 102, 241, 0.05)", border: "rgba(99, 102, 241, 0.2)", accent: "var(--accent-indigo)" },
    emerald: { bg: "rgba(16, 185, 129, 0.05)", border: "rgba(16, 185, 129, 0.2)", accent: "var(--accent-emerald)" },
    amber: { bg: "rgba(245, 158, 11, 0.05)", border: "rgba(245, 158, 11, 0.2)", accent: "var(--accent-amber)" },
    purple: { bg: "rgba(168, 85, 247, 0.05)", border: "rgba(168, 85, 247, 0.2)", accent: "var(--accent-purple)" },
  };

  const c = colorMap[color] || colorMap.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="rounded-2xl p-4"
      style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.accent }}>
          {icon}
        </div>
        <h3 className="font-semibold text-sm" style={{ color: c.accent }}>
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
};

/* -----------------------------------------
   Upgrade Modal Component
----------------------------------------- */
const UpgradeModal = ({ onClose, title, body, onUpgrade }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[999] flex items-center justify-center px-6"
    style={{ backgroundColor: "var(--bg-overlay)", backdropFilter: "blur(8px)" }}
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.96, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-[380px] p-6 rounded-2xl border shadow-xl"
      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(245, 158, 11, 0.2)", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
          <FiLock style={{ color: "var(--accent-amber)" }} />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
      </div>
      <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
        {body}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-xl font-medium transition"
          style={{ backgroundColor: "var(--bg-button)", color: "var(--text-primary)" }}
        >
          Not now
        </button>
        <button
          onClick={() => {
            onClose();
            onUpgrade?.();
          }}
          className="flex-1 px-4 py-3 rounded-xl text-white font-medium transition"
          style={{ background: "linear-gradient(90deg, var(--accent-indigo), #4f46e5)" }}
        >
          Upgrade
        </button>
      </div>
    </motion.div>
  </motion.div>
);


