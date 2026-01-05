// src/components/ExportModal.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Export,
  FilePdf,
  FileDoc,
  FileText,
  Copy,
  Check,
  Crown,
  Spinner,
} from "phosphor-react";
import { FiX, FiDownload, FiCheck } from "react-icons/fi";
import { useSubscription } from "../hooks/useSubscription";

// For PDF generation
const generatePDF = async (content, title) => {
  // Using jsPDF via CDN (you'd normally npm install jspdf)
  // For now, we'll create a printable HTML and trigger print dialog
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: 'Georgia', serif;
          max-width: 800px;
          margin: 40px auto;
          padding: 20px;
          line-height: 1.6;
          color: #1a1a1a;
        }
        h1 {
          font-size: 28px;
          margin-bottom: 20px;
          border-bottom: 2px solid #6366f1;
          padding-bottom: 10px;
        }
        .meta {
          color: #666;
          font-size: 14px;
          margin-bottom: 30px;
        }
        .content {
          white-space: pre-wrap;
        }
        @media print {
          body { margin: 0; padding: 20px; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">
        Exported from NoteStream • ${new Date().toLocaleDateString()}
      </div>
      <div class="content">${content}</div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

// For DOCX generation (simplified - creates downloadable HTML that Word can open)
const generateDOCX = (content, title) => {
  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: Calibri, sans-serif; font-size: 11pt; line-height: 1.5; }
        h1 { font-size: 18pt; color: #6366f1; }
        .content { white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p style="color: #666; font-size: 10pt;">Exported from NoteStream • ${new Date().toLocaleDateString()}</p>
      <hr>
      <div class="content">${content}</div>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// For Markdown export
const generateMarkdown = (content, title) => {
  const mdContent = `# ${title}\n\n*Exported from NoteStream • ${new Date().toLocaleDateString()}*\n\n---\n\n${content}`;
  
  const blob = new Blob([mdContent], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// For plain text export
const generateTXT = (content, title) => {
  const txtContent = `${title}\n${'='.repeat(title.length)}\n\nExported from NoteStream • ${new Date().toLocaleDateString()}\n\n${content}`;
  
  const blob = new Blob([txtContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const exportFormats = [
  {
    id: 'pdf',
    name: 'PDF Document',
    desc: 'Best for sharing and printing',
    icon: FilePdf,
    color: 'rose',
    pro: true,
  },
  {
    id: 'docx',
    name: 'Word Document',
    desc: 'Editable in Microsoft Word',
    icon: FileDoc,
    color: 'blue',
    pro: true,
  },
  {
    id: 'markdown',
    name: 'Markdown',
    desc: 'Perfect for developers',
    icon: FileText,
    color: 'slate',
    pro: false,
  },
  {
    id: 'txt',
    name: 'Plain Text',
    desc: 'Universal compatibility',
    icon: FileText,
    color: 'gray',
    pro: false,
  },
];

const colorMap = {
  rose: 'bg-rose-500/20 text-rose-500',
  blue: 'bg-blue-500/20 text-blue-500',
  slate: 'bg-slate-500/20 text-slate-500',
  gray: 'bg-gray-500/20 text-gray-500',
};

export default function ExportModal({ isOpen, onClose, note }) {
  const { isFeatureUnlocked } = useSubscription();
  const isProUser = isFeatureUnlocked("export");

  const [exporting, setExporting] = useState(null);
  const [exported, setExported] = useState([]);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !note) return null;

  const handleExport = async (format) => {
    if (format.pro && !isProUser) return;

    setExporting(format.id);

    try {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      switch (format.id) {
        case 'pdf':
          await generatePDF(note.content, note.title);
          break;
        case 'docx':
          generateDOCX(note.content, note.title);
          break;
        case 'markdown':
          generateMarkdown(note.content, note.title);
          break;
        case 'txt':
          generateTXT(note.content, note.title);
          break;
      }

      setExported((prev) => [...prev, format.id]);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(null);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(note.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-secondary)',
            }}
          >
            {/* Header */}
            <div 
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border-secondary)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                  <Export size={20} weight="duotone" className="text-rose-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-theme-primary">Export Note</h3>
                  <p className="text-xs text-theme-muted truncate max-w-[200px]">{note.title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-theme-muted hover:text-theme-primary transition"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Export Formats */}
              <div className="space-y-3 mb-6">
                {exportFormats.map((format) => {
                  const Icon = format.icon;
                  const isLocked = format.pro && !isProUser;
                  const isExported = exported.includes(format.id);
                  const isExporting = exporting === format.id;

                  return (
                    <button
                      key={format.id}
                      onClick={() => handleExport(format)}
                      disabled={isLocked || isExporting}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition ${
                        isLocked
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:border-indigo-500/40 cursor-pointer'
                      }`}
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: isExported ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-secondary)',
                      }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[format.color]}`}>
                        <Icon size={20} weight="duotone" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-theme-primary">{format.name}</span>
                          {format.pro && !isProUser && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 flex items-center gap-0.5">
                              <Crown size={10} weight="fill" />
                              PRO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-theme-muted">{format.desc}</p>
                      </div>
                      <div className="w-8 h-8 flex items-center justify-center">
                        {isExporting ? (
                          <Spinner size={20} className="text-indigo-500 animate-spin" />
                        ) : isExported ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <FiCheck size={14} className="text-emerald-500" />
                          </div>
                        ) : (
                          <FiDownload size={18} className="text-theme-muted" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick Copy */}
              <div 
                className="rounded-xl p-4 border"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-theme-secondary">Quick Copy</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    style={{ backgroundColor: 'var(--bg-input)' }}
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="text-theme-muted" />
                        <span className="text-theme-secondary">Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-theme-muted line-clamp-2">
                  {note.content?.substring(0, 150)}...
                </p>
              </div>

              {/* Pro Upsell */}
              {!isProUser && (
                <div 
                  className="mt-4 rounded-xl p-4 border border-indigo-500/30 bg-indigo-500/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Crown size={16} weight="fill" className="text-amber-500" />
                    <span className="text-sm font-semibold text-theme-primary">Upgrade for More Formats</span>
                  </div>
                  <p className="text-xs text-theme-muted">
                    Pro users can export to PDF and Word documents with beautiful formatting.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}