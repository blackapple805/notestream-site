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
import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../hooks/useSubscription";

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

  const [showToast, setShowToast] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ✅ keep local UI in sync immediately (fixes lock button lag)
  const [isLocked, setIsLocked] = useState(!!note.locked);
  const [isFav, setIsFav] = useState(!!note.favorite);

  const [title, setTitle] = useState(note.title);
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
  });

  // If parent swaps to a different note, resync local state
  useEffect(() => {
    setIsLocked(!!note.locked);
    setIsFav(!!note.favorite);
    setTitle(note.title);
    setBody(note.body ?? "");
    setSmartData({
      summary: note.summary || null,
      SmartTasks: note.SmartTasks || null,
      SmartHighlights: note.SmartHighlights || null,
      SmartSchedule: note.SmartSchedule || null,
    });
    setIsEditing(false);
    setShowExportMenu(false);
  }, [note?.id]); // intentionally only when note changes

  const textareaRef = useRef(null);

  const hasSmartData =
    smartData.SmartTasks ||
    smartData.SmartHighlights ||
    smartData.SmartSchedule ||
    smartData.summary;

  const formatRelative = (date) => {
    const diffMs = Date.now() - new Date(date);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMins < 1) return "Just now";
    if (diffHrs < 1) return `${diffMins}m ago`;
    if (diffDays < 1) return `${diffHrs}h ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const formatDate = (date) => {
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

  const handleEditToggle = () => {
    if (isLocked) return;
    if (isEditing) {
      onEditSave(note.id, title, body, new Date().toISOString());
    }
    setIsEditing(!isEditing);
  };

  const fakeSmartNotes = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const newSmartData = {
        summary:
          "Quick focus: UI components must be completed before the meeting tomorrow at 3 PM.",
        SmartTasks: ["Finish UI components", "Request updated Figma from Sarah"],
        SmartHighlights: ["Dashboard layout is highest priority"],
        SmartSchedule: ["Meeting tomorrow at 3 PM"],
      };
      setSmartData(newSmartData);
      setIsAnalyzing(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      onEditSave(note.id, title, body, new Date().toISOString());
    }, 2000);
  };

  // ✅ Lock toggle: update UI instantly + call parent for persistence
  const handleLockToggle = () => {
    const next = !isLocked;

    // Optional: auto-exit edit mode when locking
    if (next && isEditing) {
      onEditSave(note.id, title, body, new Date().toISOString());
      setIsEditing(false);
    }

    setIsLocked(next); // instant UI update
    onLockToggle(note.id, next); // persist to parent/store
  };

  const handleFavoriteToggle = () => {
    const next = !isFav;
    setIsFav(next);
    onFavoriteToggle(note.id, next);
  };

  // =============== EXPORT FUNCTIONS ===============
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
    const safeTitle =
      (title || "note").replace(/[^\w\s-]/g, "").trim() || "note";

    let smartContent = "";
    if (hasSmartData) {
      smartContent += "\n\n-----------------------------------\n";
      smartContent += "AI SMART NOTES ANALYSIS\n";
      smartContent += "-----------------------------------\n\n";

      if (smartData.summary) {
        smartContent += "AI Summary:\n" + smartData.summary + "\n\n";
      }
      if (smartData.SmartTasks?.length > 0) {
        smartContent +=
          "Tasks:\n" +
          smartData.SmartTasks
            .map((t, i) => `  ${i + 1}. ${t}`)
            .join("\n") +
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
    const safeTitle =
      (title || "note").replace(/[^\w\s-]/g, "").trim() || "note";

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

      let smartHtml = "";
      if (hasSmartData) {
        smartHtml = `
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #6366f1;">
            <h2 style="color: #6366f1; margin-bottom: 20px;">📊 AI Smart Notes Analysis</h2>
            ${smartData.summary ? `
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <h3 style="color: #4f46e5; margin: 0 0 8px 0;">💡 AI Summary</h3>
                <p style="margin: 0; color: #374151;">${escapeHtml(
                  smartData.summary
                )}</p>
              </div>
            ` : ""}
          </div>
        `;
      }

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
      return;
    }

    // (keep your other export formats as-is)
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
    } else {
      setVoiceToast(true);
      setTimeout(() => setVoiceToast(false), 3000);
    }
  };

  const noteBadge = useMemo(() => {
    if (note.tag === "Voice") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] text-purple-400 font-medium px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
          <FiMic size={10} />
          Voice
        </span>
      );
    }
    if (hasSmartData) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] text-indigo-400 font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
          <Sparkle size={12} weight="fill" />
          Smart
        </span>
      );
    }
    return null;
  }, [note.tag, hasSmartData]);

  return (
    <div className="min-h-full w-full pb-[calc(var(--mobile-nav-height)+24px)]">
      {/* HEADER: no background color, just the bottom line */}
      <div className="sticky top-0 z-50">
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 w-screen h-full pointer-events-none"
          style={{
            backgroundColor: "transparent",
            backdropFilter: "none",
          }}
        />
        <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <ActionButton icon={<FiArrowLeft size={18} />} onClick={onBack} title="Back" />

              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-[11px] text-theme-muted">
                    {note.updated ? formatDate(note.updated) : ""}
                    {note.updated ? ` • ${formatRelative(note.updated)}` : ""}
                  </p>
                  {noteBadge}
                  {isLocked && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-amber-400 font-medium px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                      <FiLock size={10} />
                      Locked
                    </span>
                  )}
                </div>

                <p className="text-sm text-theme-primary font-semibold truncate max-w-[56vw]">
                  {title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 relative">
              <ActionButton
                icon={<FiMic size={16} />}
                onClick={handleVoiceClick}
                disabled={isAnalyzing}
                title={canUseVoice ? "Voice Notes" : "Voice Notes (Pro)"}
                active={canUseVoice}
                activeColor="text-purple-400"
              />

              <div className="relative">
                <ActionButton
                  icon={<FiDownload size={16} />}
                  onClick={handleExportClick}
                  disabled={isAnalyzing}
                  title={canUseExport ? "Advanced Export" : "Advanced Export (Pro)"}
                  active={showExportMenu}
                  activeColor="text-indigo-400"
                />
                {/* export dropdown unchanged */}
              </div>

              <ActionButton
                icon={<FiHeart size={16} />}
                active={isFav}
                activeColor="text-rose-400"
                onClick={handleFavoriteToggle}
                disabled={isAnalyzing}
                title="Favorite"
              />

              <ActionButton
                icon={<FiZap size={16} />}
                active={isAnalyzing}
                activeColor="text-indigo-400"
                onClick={fakeSmartNotes}
                disabled={isAnalyzing}
                title="AI Analysis"
                pulse={isAnalyzing}
              />

              {/* ✅ uses local isLocked state + instant toggle */}
              <ActionButton
                icon={<FiLock size={16} />}
                active={isLocked}
                activeColor="text-amber-400"
                onClick={handleLockToggle}
                disabled={isAnalyzing}
                title={isLocked ? "Unlock" : "Lock"}
              />

              <ActionButton
                icon={<FiTrash2 size={16} />}
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isAnalyzing}
                hoverColor="hover:text-rose-400"
                title="Delete"
              />

              <ActionButton
                icon={isEditing ? <FiCheck size={16} /> : <FiEdit2 size={16} />}
                active={isEditing}
                activeColor="text-emerald-400"
                onClick={handleEditToggle}
                disabled={isAnalyzing || isLocked} // ✅ prevent editing when locked
                title={isLocked ? "Locked" : isEditing ? "Save" : "Edit"}
              />
            </div>
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
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] bg-emerald-900/90 border border-emerald-500/40 text-emerald-200 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2"
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
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] bg-purple-900/90 border border-purple-500/40 text-purple-200 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2"
          >
            <FiMic size={16} />
            Voice Notes can be created from the Notes page using the + button
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
            className="fixed top-[64px] left-1/2 -translate-x-1/2 z-[300] w-[min(520px,92vw)] rounded-2xl border px-4 py-4 flex items-center gap-4"
            style={{
              backgroundColor: "rgba(12,12,16,0.65)",
              borderColor: "rgba(99,102,241,0.22)",
              backdropFilter: "blur(14px)",
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.25)]"
            >
              <Lightning size={22} weight="fill" className="text-indigo-400" />
            </motion.div>

            <div className="flex-1">
              <p className="text-sm text-theme-primary font-semibold">
                Analyzing note with AI…
              </p>
              <div
                className="w-full h-1.5 rounded-full overflow-hidden mt-2"
                style={{ backgroundColor: "var(--bg-tertiary)" }}
              >
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                  className="h-full w-1/3 bg-indigo-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENT (centered, better structure) */}
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* MAIN */}
          <div className="lg:col-span-7 space-y-5">
            {/* Attachments */}
            {note.audioUrl && (
              <div
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: "var(--bg-input)",
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
                    <FiMic className="text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-theme-primary font-medium">
                      Voice Recording
                    </p>
                    <p className="text-[11px] text-theme-muted">Tap play to listen</p>
                  </div>
                </div>
                <audio controls className="w-full" style={{ height: "40px" }}>
                  <source
                    src={note.audioUrl}
                    type={note.audioMime || "audio/webm"}
                  />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {note.imageUrl && (
              <div
                className="rounded-2xl overflow-hidden border"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                <img
                  src={note.imageUrl}
                  alt="Note upload"
                  className="w-full max-h-[52vh] object-contain"
                />
              </div>
            )}

            {note.pdfUrl && (
              <div
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: "var(--bg-input)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: "var(--bg-tertiary)" }}
                  >
                    <FiFileText size={22} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-theme-primary font-medium">
                      PDF Document
                    </p>
                    <p className="text-[11px] text-theme-muted truncate">
                      Tap to view full document
                    </p>
                  </div>
                  <a
                    href={note.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-300 hover:bg-indigo-500/20 transition"
                    title="Open PDF"
                  >
                    <FiExternalLink size={16} />
                  </a>
                </div>
              </div>
            )}

            {/* NOTE SURFACE */}
            <div className="px-0 sm:px-0">
              {isEditing ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={140}
                className="w-full bg-transparent text-theme-primary text-2xl sm:text-3xl font-bold placeholder:text-theme-muted
                          outline-none ring-0 focus:ring-0 focus:outline-none
                          border border-transparent focus:border-transparent
                          focus-visible:outline-none focus-visible:ring-0"
                placeholder="Title"
              />
              ) : (
                <h1 className="text-2xl sm:text-3xl font-bold text-theme-primary leading-tight">
                  {title}
                </h1>
              )}

              <div className="mt-4">
                {isEditing ? (
               <textarea
                ref={textareaRef}
                rows={10}
                className="w-full bg-transparent text-theme-secondary text-[15px] sm:text-[16px] resize-none leading-relaxed whitespace-pre-wrap break-words placeholder:text-theme-muted mt-4
                          outline-none ring-0 focus:ring-0 focus:outline-none
                          border border-transparent focus:border-transparent
                          focus-visible:outline-none focus-visible:ring-0"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Start writing..."
              />
                ) : body ? (
                  <div className="text-[15px] text-theme-secondary leading-relaxed whitespace-pre-wrap break-words">
                    {body}
                  </div>
                ) : (
                  <p className="text-theme-muted text-sm">
                    This note is empty. Click edit to start writing.
                  </p>
                )}
              </div>
            </div>

            {/* Extracted Text */}
            {!isEditing && note.extractedText && (
              <div
                className="p-4 rounded-2xl border"
                style={{
                  backgroundColor: "var(--bg-input)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="h-8 w-8 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: "var(--bg-tertiary)" }}
                  >
                    <FiFileText size={14} className="text-theme-muted" />
                  </div>
                  <h3 className="font-semibold text-sm text-theme-primary">
                    Extracted Text
                  </h3>
                </div>
                <p className="text-theme-muted text-[13px] whitespace-pre-wrap leading-relaxed">
                  {note.extractedText}
                </p>
              </div>
            )}
          </div>

          {/* SMART PANEL (RIGHT) */}
          <div className="lg:col-span-5 space-y-4">
            {!isEditing && hasSmartData ? (
              <>
                {smartData.summary && (
                  <SmartCard
                    icon={<Sparkle size={16} weight="fill" />}
                    title="AI Summary"
                    color="indigo"
                    delay={0}
                  >
                    <p className="text-theme-secondary text-[13px] leading-relaxed">
                      {smartData.summary}
                    </p>
                  </SmartCard>
                )}

                {smartData.SmartTasks?.length > 0 && (
                  <SmartCard
                    icon={<FiCheck size={14} />}
                    title="Tasks"
                    color="emerald"
                    delay={0.04}
                  >
                    <ul className="space-y-2">
                      {smartData.SmartTasks.map((task, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-theme-secondary text-[13px]"
                        >
                          <div className="h-5 w-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FiCheck size={10} className="text-emerald-400" />
                          </div>
                          {task}
                        </li>
                      ))}
                    </ul>
                  </SmartCard>
                )}

                {smartData.SmartHighlights?.length > 0 && (
                  <SmartCard
                    icon={<FiStar size={14} />}
                    title="Highlights"
                    color="amber"
                    delay={0.08}
                  >
                    <ul className="space-y-2">
                      {smartData.SmartHighlights.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-theme-secondary text-[13px]"
                        >
                          <div className="h-5 w-5 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FiStar size={10} className="text-amber-400" />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </SmartCard>
                )}

                {smartData.SmartSchedule?.length > 0 && (
                  <SmartCard
                    icon={<FiCalendar size={14} />}
                    title="Schedule"
                    color="purple"
                    delay={0.12}
                  >
                    <ul className="space-y-2">
                      {smartData.SmartSchedule.map((date, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-theme-secondary text-[13px]"
                        >
                          <div className="h-5 w-5 rounded-lg border border-purple-500/30 bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FiCalendar size={10} className="text-purple-400" />
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
                    backgroundColor: "var(--bg-input)",
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
                      <Sparkle size={16} weight="fill" className="text-indigo-400" />
                    </div>
                    <p className="text-sm text-theme-primary font-semibold">
                      Smart Notes
                    </p>
                  </div>
                  <p className="text-[13px] text-theme-muted leading-relaxed">
                    Run AI Analysis to generate a summary, tasks, highlights, and schedule.
                  </p>
                  <button
                    onClick={fakeSmartNotes}
                    disabled={isAnalyzing}
                    className="mt-3 w-full py-2.5 rounded-xl text-sm font-medium transition active:scale-[0.99]"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(99,102,241,0.9), rgba(79,70,229,0.9))",
                      color: "white",
                      opacity: isAnalyzing ? 0.6 : 1,
                    }}
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
            style={{
              backgroundColor: "var(--bg-overlay)",
              backdropFilter: "blur(8px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[360px] p-6 rounded-2xl border shadow-xl"
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderColor: "var(--border-secondary)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                  <FiTrash2 size={18} className="text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-theme-primary">
                  Delete Note?
                </h3>
              </div>
              <p className="text-theme-muted text-sm mb-6">
                This action cannot be undone. Are you sure you want to delete this
                note?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl text-theme-primary font-medium transition"
                  style={{ backgroundColor: "var(--bg-button)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete(note.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition font-medium"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -----------------------------------------
   Action Button Component (squircle style)
----------------------------------------- */
const ActionButton = ({
  icon,
  active,
  activeColor = "text-indigo-400",
  onClick,
  disabled,
  title,
  hoverColor = "hover:text-theme-primary",
  pulse,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={[
      "h-10 w-10 rounded-2xl flex items-center justify-center transition active:scale-95",
      active ? activeColor : `text-theme-muted ${hoverColor}`,
      disabled ? "opacity-50 cursor-not-allowed" : "",
      pulse ? "animate-pulse" : "",
    ].join(" ")}
    style={{
      backgroundColor: "var(--bg-tertiary)",
      border: `1px solid ${active ? "currentColor" : "var(--border-secondary)"}`,
    }}
  >
    {icon}
  </button>
);

/* -----------------------------------------
   Menu Item Component
----------------------------------------- */
const MenuItem = ({ icon, label, onClick, subtle, highlight }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
      highlight
        ? "text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20"
        : subtle
        ? "text-theme-muted hover:text-theme-primary hover:bg-white/5"
        : "text-theme-primary hover:bg-white/5"
    }`}
  >
    <span className="text-indigo-400">{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </button>
);

/* -----------------------------------------
   Smart Card Component
----------------------------------------- */
const SmartCard = ({ icon, title, color, children, delay = 0 }) => {
  const colorStyles = {
    indigo: {
      border: "border-indigo-500/20",
      bg: "bg-indigo-500/5",
      iconBg: "bg-indigo-500/20",
      iconBorder: "border-indigo-500/30",
      iconText: "text-indigo-400",
      titleText: "text-indigo-300",
    },
    emerald: {
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
      iconBg: "bg-emerald-500/20",
      iconBorder: "border-emerald-500/30",
      iconText: "text-emerald-400",
      titleText: "text-emerald-300",
    },
    amber: {
      border: "border-amber-500/20",
      bg: "bg-amber-500/5",
      iconBg: "bg-amber-500/20",
      iconBorder: "border-amber-500/30",
      iconText: "text-amber-400",
      titleText: "text-amber-300",
    },
    purple: {
      border: "border-purple-500/20",
      bg: "bg-purple-500/5",
      iconBg: "bg-purple-500/20",
      iconBorder: "border-purple-500/30",
      iconText: "text-purple-400",
      titleText: "text-purple-300",
    },
  };

  const c = colorStyles[color] || colorStyles.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`${c.bg} border ${c.border} rounded-2xl p-4`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`h-8 w-8 rounded-2xl ${c.iconBg} border ${c.iconBorder} flex items-center justify-center ${c.iconText}`}
        >
          {icon}
        </div>
        <h3 className={`font-semibold text-sm ${c.titleText}`}>{title}</h3>
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
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--border-secondary)",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <FiLock className="text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-theme-primary">{title}</h3>
      </div>
      <p className="text-theme-muted text-sm mb-5">{body}</p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-xl text-theme-primary font-medium transition"
          style={{ backgroundColor: "var(--bg-button)" }}
        >
          Not now
        </button>
        <button
          onClick={() => {
            onClose();
            onUpgrade?.();
          }}
          className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium transition hover:opacity-95"
        >
          Upgrade
        </button>
      </div>
    </motion.div>
  </motion.div>
);

