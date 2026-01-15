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
import { useState, useRef, useEffect } from "react";
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
  
  // ✅ Use subscription hook - same source of truth as Notes.jsx and AiLab.jsx
  const { subscription, isFeatureUnlocked } = useSubscription();
  const isPro = !!subscription?.plan && subscription.plan !== "free";
  const canUseVoice = typeof isFeatureUnlocked === "function" ? isFeatureUnlocked("voice") : isPro;
  const canUseExport = typeof isFeatureUnlocked === "function" ? isFeatureUnlocked("export") : isPro;

  const [showToast, setShowToast] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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

  const textareaRef = useRef(null);

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

  const hasSmartData =
    smartData.SmartTasks || smartData.SmartHighlights || smartData.SmartSchedule;

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
    const safeTitle = (title || "note").replace(/[^\w\s-]/g, "").trim() || "note";
    
    let smartContent = "";
    if (hasSmartData) {
      smartContent += "\n\n-----------------------------------\n";
      smartContent += "AI SMART NOTES ANALYSIS\n";
      smartContent += "-----------------------------------\n\n";
      
      if (smartData.summary) {
        smartContent += "AI Summary:\n" + smartData.summary + "\n\n";
      }
      if (smartData.SmartTasks?.length > 0) {
        smartContent += "Tasks:\n" + smartData.SmartTasks.map((t, i) => `  ${i + 1}. ${t}`).join("\n") + "\n\n";
      }
      if (smartData.SmartHighlights?.length > 0) {
        smartContent += "Key Highlights:\n" + smartData.SmartHighlights.map(h => `  • ${h}`).join("\n") + "\n\n";
      }
      if (smartData.SmartSchedule?.length > 0) {
        smartContent += "Schedule:\n" + smartData.SmartSchedule.map(s => `  • ${s}`).join("\n") + "\n\n";
      }
    }
    
    const content = `${title}\n\n${body || ""}${smartContent}\n---\nExported from NoteStream on ${new Date().toLocaleString()}\n`;
    downloadBlob(`${safeTitle}.txt`, "text/plain;charset=utf-8", content);
    setShowExportMenu(false);
  };

  const exportAdvanced = (format) => {
    const safeTitle = (title || "note").replace(/[^\w\s-]/g, "").trim() || "note";
    
    // Build smart notes content if available
    let smartContent = "";
    if (hasSmartData) {
      smartContent += "\n\n═══════════════════════════════════════\n";
      smartContent += "📊 AI SMART NOTES ANALYSIS\n";
      smartContent += "═══════════════════════════════════════\n\n";
      
      if (smartData.summary) {
        smartContent += "💡 AI SUMMARY\n";
        smartContent += "───────────────────────────────────────\n";
        smartContent += smartData.summary + "\n\n";
      }
      
      if (smartData.SmartTasks?.length > 0) {
        smartContent += "✅ TASKS\n";
        smartContent += "───────────────────────────────────────\n";
        smartData.SmartTasks.forEach((task, i) => {
          smartContent += `  ${i + 1}. ${task}\n`;
        });
        smartContent += "\n";
      }
      
      if (smartData.SmartHighlights?.length > 0) {
        smartContent += "⭐ KEY HIGHLIGHTS\n";
        smartContent += "───────────────────────────────────────\n";
        smartData.SmartHighlights.forEach((item, i) => {
          smartContent += `  • ${item}\n`;
        });
        smartContent += "\n";
      }
      
      if (smartData.SmartSchedule?.length > 0) {
        smartContent += "📅 SCHEDULE\n";
        smartContent += "───────────────────────────────────────\n";
        smartData.SmartSchedule.forEach((date, i) => {
          smartContent += `  • ${date}\n`;
        });
        smartContent += "\n";
      }
    }

    if (format === "pdf") {
      // Use hidden iframe to avoid popup blockers
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
                <p style="margin: 0; color: #374151;">${escapeHtml(smartData.summary)}</p>
              </div>
            ` : ""}
            ${smartData.SmartTasks?.length > 0 ? `
              <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <h3 style="color: #059669; margin: 0 0 8px 0;">✅ Tasks</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  ${smartData.SmartTasks.map(t => `<li>${escapeHtml(t)}</li>`).join("")}
                </ul>
              </div>
            ` : ""}
            ${smartData.SmartHighlights?.length > 0 ? `
              <div style="background: #fffbeb; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <h3 style="color: #d97706; margin: 0 0 8px 0;">⭐ Key Highlights</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  ${smartData.SmartHighlights.map(h => `<li>${escapeHtml(h)}</li>`).join("")}
                </ul>
              </div>
            ` : ""}
            ${smartData.SmartSchedule?.length > 0 ? `
              <div style="background: #f5f3ff; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <h3 style="color: #7c3aed; margin: 0 0 8px 0;">📅 Schedule</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  ${smartData.SmartSchedule.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
                </ul>
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
      
      // Wait for content to load then print
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }, 250);
      
      setShowExportMenu(false);
      return;
    }

    if (format === "word") {
      let smartHtml = "";
      if (hasSmartData) {
        smartHtml = `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #6366f1;">
            <h2 style="color: #6366f1;">AI Smart Notes Analysis</h2>
            ${smartData.summary ? `<p><strong>AI Summary:</strong> ${escapeHtml(smartData.summary)}</p>` : ""}
            ${smartData.SmartTasks?.length > 0 ? `<p><strong>Tasks:</strong></p><ul>${smartData.SmartTasks.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>` : ""}
            ${smartData.SmartHighlights?.length > 0 ? `<p><strong>Key Highlights:</strong></p><ul>${smartData.SmartHighlights.map(h => `<li>${escapeHtml(h)}</li>`).join("")}</ul>` : ""}
            ${smartData.SmartSchedule?.length > 0 ? `<p><strong>Schedule:</strong></p><ul>${smartData.SmartSchedule.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul>` : ""}
          </div>
        `;
      }
      
      const doc = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head><meta charset="utf-8"><title>${safeTitle}</title></head>
        <body style="font-family: Calibri, sans-serif;">
          <h1 style="color: #1f2937;">${escapeHtml(title)}</h1>
          <p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(body || "")}</p>
          ${smartHtml}
          <hr style="margin-top: 40px; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 11px;">Exported from NoteStream on ${new Date().toLocaleString()}</p>
        </body></html>
      `;
      downloadBlob(`${safeTitle}.doc`, "application/msword", doc);
      setShowExportMenu(false);
      return;
    }

    if (format === "notion") {
      let smartMd = "";
      if (hasSmartData) {
        smartMd += "\n\n---\n\n## 📊 AI Smart Notes Analysis\n\n";
        if (smartData.summary) {
          smartMd += "### 💡 AI Summary\n" + smartData.summary + "\n\n";
        }
        if (smartData.SmartTasks?.length > 0) {
          smartMd += "### ✅ Tasks\n" + smartData.SmartTasks.map(t => `- [ ] ${t}`).join("\n") + "\n\n";
        }
        if (smartData.SmartHighlights?.length > 0) {
          smartMd += "### ⭐ Key Highlights\n" + smartData.SmartHighlights.map(h => `- ${h}`).join("\n") + "\n\n";
        }
        if (smartData.SmartSchedule?.length > 0) {
          smartMd += "### 📅 Schedule\n" + smartData.SmartSchedule.map(s => `- 📆 ${s}`).join("\n") + "\n\n";
        }
      }
      
      const md = `# ${title}\n\n${body || ""}${smartMd}\n---\n\n*Exported from NoteStream on ${new Date().toLocaleString()}*`;
      downloadBlob(`${safeTitle}.md`, "text/markdown;charset=utf-8", md);
      setShowExportMenu(false);
      return;
    }

    if (format === "html") {
      let smartHtml = "";
      if (hasSmartData) {
        smartHtml = `
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #6366f1;">
            <h2 style="color: #818cf8; margin-bottom: 20px;">📊 AI Smart Notes Analysis</h2>
            ${smartData.summary ? `
              <div style="background: rgba(99, 102, 241, 0.1); padding: 16px; border-radius: 12px; margin-bottom: 16px; border: 1px solid rgba(99, 102, 241, 0.2);">
                <h3 style="color: #818cf8; margin: 0 0 8px 0;">💡 AI Summary</h3>
                <p style="margin: 0; color: #d1d5db;">${escapeHtml(smartData.summary)}</p>
              </div>
            ` : ""}
            ${smartData.SmartTasks?.length > 0 ? `
              <div style="background: rgba(16, 185, 129, 0.1); padding: 16px; border-radius: 12px; margin-bottom: 16px; border: 1px solid rgba(16, 185, 129, 0.2);">
                <h3 style="color: #34d399; margin: 0 0 8px 0;">✅ Tasks</h3>
                <ul style="margin: 0; padding-left: 20px; color: #d1d5db;">
                  ${smartData.SmartTasks.map(t => `<li>${escapeHtml(t)}</li>`).join("")}
                </ul>
              </div>
            ` : ""}
            ${smartData.SmartHighlights?.length > 0 ? `
              <div style="background: rgba(245, 158, 11, 0.1); padding: 16px; border-radius: 12px; margin-bottom: 16px; border: 1px solid rgba(245, 158, 11, 0.2);">
                <h3 style="color: #fbbf24; margin: 0 0 8px 0;">⭐ Key Highlights</h3>
                <ul style="margin: 0; padding-left: 20px; color: #d1d5db;">
                  ${smartData.SmartHighlights.map(h => `<li>${escapeHtml(h)}</li>`).join("")}
                </ul>
              </div>
            ` : ""}
            ${smartData.SmartSchedule?.length > 0 ? `
              <div style="background: rgba(168, 85, 247, 0.1); padding: 16px; border-radius: 12px; margin-bottom: 16px; border: 1px solid rgba(168, 85, 247, 0.2);">
                <h3 style="color: #a78bfa; margin: 0 0 8px 0;">📅 Schedule</h3>
                <ul style="margin: 0; padding-left: 20px; color: #d1d5db;">
                  ${smartData.SmartSchedule.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
                </ul>
              </div>
            ` : ""}
          </div>
        `;
      }
      
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #0d0d10;
      color: #e5e5e5;
    }
    h1 {
      color: #818cf8;
      border-bottom: 2px solid #3730a3;
      padding-bottom: 12px;
    }
    .content {
      line-height: 1.8;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #27272a;
      color: #71717a;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="content">${escapeHtml(body || "")}</div>
  ${smartHtml}
  <div class="footer">Exported from NoteStream on ${new Date().toLocaleString()}</div>
</body>
</html>`;
      downloadBlob(`${safeTitle}.html`, "text/html;charset=utf-8", html);
      setShowExportMenu(false);
      return;
    }
  };

  const handleExportClick = () => {
    if (!canUseExport) {
      setShowUpgrade(true);
      return;
    }
    setShowExportMenu((v) => !v);
  };

  const exportSmartNotes = () => {
    const safeTitle = (title || "note").replace(/[^\w\s-]/g, "").trim() || "note";
    const data = {
      noteTitle: title,
      exportedAt: new Date().toISOString(),
      source: "NoteStream AI Analysis",
      smartNotes: {
        summary: smartData.summary || null,
        tasks: smartData.SmartTasks || [],
        highlights: smartData.SmartHighlights || [],
        schedule: smartData.SmartSchedule || [],
      },
    };
    downloadBlob(`${safeTitle}_smart_notes.json`, "application/json;charset=utf-8", JSON.stringify(data, null, 2));
    setShowExportMenu(false);
  };

  const handleVoiceClick = () => {
    if (!canUseVoice) {
      setShowUpgrade(true);
    } else {
      setVoiceToast(true);
      setTimeout(() => setVoiceToast(false), 3000);
    }
  };

  return (
    <div className="animate-fadeIn min-h-full w-full pb-[calc(var(--mobile-nav-height)+24px)]">
      {/* Header */}
      <div
        className="sticky top-0 z-50 px-4 py-3 border-b"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-secondary)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="h-10 w-10 rounded-xl flex items-center justify-center text-theme-muted hover:text-theme-primary transition active:scale-95"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-secondary)",
            }}
          >
            <FiArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2 relative">
            {/* Voice Button */}
            <ActionButton
              icon={<FiMic size={16} />}
              onClick={handleVoiceClick}
              disabled={isAnalyzing}
              title={canUseVoice ? "Voice Notes" : "Voice Notes (Pro)"}
              hoverColor={canUseVoice ? "hover:text-purple-400" : "hover:text-amber-400"}
              active={canUseVoice}
              activeColor="text-purple-400"
            />
            
            {/* Export Button with Dropdown */}
            <div className="relative">
              <ActionButton
                icon={<FiDownload size={16} />}
                onClick={handleExportClick}
                disabled={isAnalyzing}
                title={canUseExport ? "Advanced Export" : "Advanced Export (Pro)"}
                hoverColor={canUseExport ? "hover:text-indigo-400" : "hover:text-amber-400"}
                active={showExportMenu}
                activeColor="text-indigo-400"
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
                      className="absolute right-0 top-12 z-[200] w-[220px] rounded-2xl border shadow-xl p-2"
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        borderColor: "var(--border-secondary)",
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      <MenuItem
                        icon={<FiFileText size={14} />}
                        label="Export PDF"
                        onClick={() => exportAdvanced("pdf")}
                      />
                      <MenuItem
                        icon={<FiFileText size={14} />}
                        label="Export Word"
                        onClick={() => exportAdvanced("word")}
                      />
                      <MenuItem
                        icon={<FiExternalLink size={14} />}
                        label="Export Notion (MD)"
                        onClick={() => exportAdvanced("notion")}
                      />
                      <MenuItem
                        icon={<FiFileText size={14} />}
                        label="Export HTML"
                        onClick={() => exportAdvanced("html")}
                      />
                      {hasSmartData && (
                        <>
                          <div className="h-px my-2" style={{ backgroundColor: "var(--border-secondary)" }} />
                          <MenuItem
                            icon={<Sparkle size={14} weight="fill" />}
                            label="Export Smart Notes (JSON)"
                            onClick={() => exportSmartNotes()}
                            highlight
                          />
                        </>
                      )}
                      <div className="h-px my-2" style={{ backgroundColor: "var(--border-secondary)" }} />
                      <MenuItem
                        icon={<FiDownload size={14} />}
                        label="Basic export (TXT)"
                        onClick={exportBasic}
                        subtle
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <ActionButton
              icon={<FiHeart size={16} />}
              active={note.favorite}
              activeColor="text-rose-400"
              onClick={() => onFavoriteToggle(note.id, true)}
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
            <ActionButton
              icon={<FiLock size={16} />}
              active={note.locked}
              activeColor="text-amber-400"
              onClick={() => onLockToggle(note.id, true)}
              disabled={isAnalyzing}
              title={note.locked ? "Unlock" : "Lock"}
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
              disabled={isAnalyzing}
              title={isEditing ? "Save" : "Edit"}
            />
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
            className="fixed top-[60px] left-0 right-0 z-[300] flex flex-col items-center justify-center py-6 border-b"
            style={{
              background: "linear-gradient(to bottom, var(--bg-primary), transparent)",
              borderColor: "var(--border-secondary)",
              backdropFilter: "blur(12px)",
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="w-14 h-14 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.3)]"
            >
              <Lightning size={26} weight="fill" className="text-indigo-400" />
            </motion.div>
            <div
              className="w-40 h-1.5 rounded-full overflow-hidden mt-3"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                className="h-full w-1/3 bg-indigo-500"
              />
            </div>
            <p className="text-xs text-indigo-400 tracking-wide mt-2">
              Analyzing with AI…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="px-5 pt-6">
        {/* Date Info */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border-secondary)",
            }}
          >
            <FiCalendar size={14} className="text-theme-muted" />
          </div>
          <div>
            <p className="text-[11px] text-theme-muted">
              {note.updated ? formatDate(note.updated) : ""}
            </p>
            <p className="text-[10px] text-theme-muted">
              {note.updated ? formatRelative(note.updated) : ""}
            </p>
          </div>
          {/* Voice Note Badge */}
          {note.tag === "Voice" && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-purple-400 font-medium px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
              <FiMic size={10} />
              Voice Note
            </span>
          )}
          {hasSmartData && note.tag !== "Voice" && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-indigo-400 font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <Sparkle size={12} weight="fill" />
              Smart Notes
            </span>
          )}
        </div>

        {/* Audio Preview for Voice Notes */}
        {note.audioUrl && (
          <div
            className="mb-5 p-4 rounded-2xl border"
            style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(168, 85, 247, 0.2)", border: "1px solid rgba(168, 85, 247, 0.3)" }}
              >
                <FiMic className="text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-theme-primary font-medium">Voice Recording</p>
                <p className="text-[11px] text-theme-muted">Tap play to listen</p>
              </div>
            </div>
            <audio controls className="w-full" style={{ height: "40px" }}>
              <source src={note.audioUrl} type={note.audioMime || "audio/webm"} />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Image Preview */}
        {note.imageUrl && (
          <div
            className="mb-5 rounded-2xl overflow-hidden border"
            style={{
              backgroundColor: "var(--bg-elevated)",
              borderColor: "var(--border-secondary)",
            }}
          >
            <img
              src={note.imageUrl}
              alt="Note upload"
              className="w-full max-h-[50vh] object-contain"
            />
          </div>
        )}

        {/* PDF Preview */}
        {note.pdfUrl && (
          <div
            className="mb-5 p-4 rounded-2xl border"
            style={{
              backgroundColor: "var(--bg-input)",
              borderColor: "var(--border-secondary)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-tertiary)" }}
              >
                <FiFileText size={24} className="text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-theme-primary font-medium">PDF Document</p>
                <p className="text-[11px] text-theme-muted">Tap to view full document</p>
              </div>
              <a
                href={note.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/30 transition"
              >
                <FiExternalLink size={16} />
              </a>
            </div>
          </div>
        )}

        {/* Title */}
        {isEditing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={140}
            className="w-full rounded-xl text-theme-primary text-xl font-bold px-4 py-3 focus:outline-none focus:border-indigo-500/50 mb-4"
            style={{
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-secondary)",
            }}
            placeholder="Note title..."
          />
        ) : (
          <h1 className="text-2xl font-bold text-theme-primary mb-4">{title}</h1>
        )}

        {/* Body */}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            rows={6}
            className="w-full rounded-xl text-theme-secondary text-[15px] resize-none leading-relaxed px-4 py-3 focus:outline-none focus:border-indigo-500/50 whitespace-pre-wrap break-words"
            style={{
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-secondary)",
            }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Start writing..."
          />
        ) : (
          body && (
            <div className="text-[15px] text-theme-secondary leading-relaxed whitespace-pre-wrap break-words mb-6">
              {body}
            </div>
          )
        )}

        {/* Extracted Text */}
        {!isEditing && note.extractedText && (
          <div
            className="mb-6 p-4 rounded-2xl border"
            style={{
              backgroundColor: "var(--bg-input)",
              borderColor: "var(--border-secondary)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-tertiary)" }}
              >
                <FiFileText size={14} className="text-theme-muted" />
              </div>
              <h3 className="font-semibold text-sm text-theme-primary">Extracted Text</h3>
            </div>
            <p className="text-theme-muted text-[13px] whitespace-pre-wrap leading-relaxed">
              {note.extractedText}
            </p>
          </div>
        )}

        {/* Smart Notes Section */}
        {!isEditing && hasSmartData && (
          <>
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.8 }}
              className="h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent my-8"
            />
            <div className="space-y-4">
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
                <SmartCard icon={<FiCheck size={14} />} title="Tasks" color="emerald" delay={0.05}>
                  <ul className="space-y-2">
                    {smartData.SmartTasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-2 text-theme-secondary text-[13px]">
                        <div className="h-5 w-5 rounded-md border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FiCheck size={10} className="text-emerald-400" />
                        </div>
                        {task}
                      </li>
                    ))}
                  </ul>
                </SmartCard>
              )}
              {smartData.SmartHighlights?.length > 0 && (
                <SmartCard icon={<FiStar size={14} />} title="Key Highlights" color="amber" delay={0.1}>
                  <ul className="space-y-2">
                    {smartData.SmartHighlights.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-theme-secondary text-[13px]">
                        <div className="h-5 w-5 rounded-md border border-amber-500/30 bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FiStar size={10} className="text-amber-400" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </SmartCard>
              )}
              {smartData.SmartSchedule?.length > 0 && (
                <SmartCard icon={<FiCalendar size={14} />} title="Schedule" color="purple" delay={0.15}>
                  <ul className="space-y-2">
                    {smartData.SmartSchedule.map((date, i) => (
                      <li key={i} className="flex items-start gap-2 text-theme-secondary text-[13px]">
                        <div className="h-5 w-5 rounded-md border border-purple-500/30 bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FiCalendar size={10} className="text-purple-400" />
                        </div>
                        {date}
                      </li>
                    ))}
                  </ul>
                </SmartCard>
              )}
            </div>
          </>
        )}
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
              style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-secondary)" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                  <FiTrash2 size={18} className="text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-theme-primary">Delete Note?</h3>
              </div>
              <p className="text-theme-muted text-sm mb-6">
                This action cannot be undone. Are you sure you want to delete this note?
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
   Action Button Component
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
    className={`h-10 w-10 rounded-xl flex items-center justify-center transition active:scale-95 ${
      active ? activeColor : `text-theme-muted ${hoverColor}`
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${pulse ? "animate-pulse" : ""}`}
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
    <span className={highlight ? "text-indigo-400" : "text-indigo-400"}>{icon}</span>
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
      titleText: "text-indigo-400",
    },
    emerald: {
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
      iconBg: "bg-emerald-500/20",
      iconBorder: "border-emerald-500/30",
      iconText: "text-emerald-400",
      titleText: "text-emerald-400",
    },
    amber: {
      border: "border-amber-500/20",
      bg: "bg-amber-500/5",
      iconBg: "bg-amber-500/20",
      iconBorder: "border-amber-500/30",
      iconText: "text-amber-400",
      titleText: "text-amber-400",
    },
    purple: {
      border: "border-purple-500/20",
      bg: "bg-purple-500/5",
      iconBg: "bg-purple-500/20",
      iconBorder: "border-purple-500/30",
      iconText: "text-purple-400",
      titleText: "text-purple-400",
    },
  };

  const c = colorStyles[color] || colorStyles.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`${c.bg} border ${c.border} rounded-2xl p-4`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`h-7 w-7 rounded-lg ${c.iconBg} border ${c.iconBorder} flex items-center justify-center ${c.iconText}`}
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
      style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-secondary)" }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
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