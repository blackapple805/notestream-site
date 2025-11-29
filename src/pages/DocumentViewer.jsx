// src/pages/DocumentViewer.jsx
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft, FiDownload, FiFileText, FiAlertTriangle } from "react-icons/fi";
import { FaMagic } from "react-icons/fa";
import { useState, useEffect } from "react";

// Shared Utils
import {
  downloadDocument,
  applySmartSummary,
  createLocalBlob,
} from "../utils/documentActions";

export default function DocumentViewer({ docs, setDocs }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const foundDoc = docs.find((d) => d.id === id);
  const [currentDoc, setCurrentDoc] = useState(foundDoc);

  // Keep currentDoc in sync if docs array changes
  useEffect(() => {
    const refreshed = docs.find((d) => d.id === id);
    if (refreshed) setCurrentDoc(refreshed);
  }, [docs, id]);

  if (!currentDoc) {
    return (
      <div className="p-6 text-gray-400">
        Document not found.
        <button
          className="block mt-4 text-indigo-400"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }

  // Base file URL (uploaded or mock)
  const fileUrl = currentDoc.fileUrl || createLocalBlob(currentDoc);

  // For DOCX/XLSX, wrap in Google Docs viewer. For PDF, use raw URL.
  const isOffice =
    currentDoc.type === "DOCX" || currentDoc.type === "XLSX";

  const viewerUrl = isOffice
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(
        fileUrl
      )}&embedded=true`
    : fileUrl;

  const scrollToSummary = () => {
    const el = document.getElementById("smart-summary-panel");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ✅ This function was missing before (was causing the crash)
  const handleSummarizeViewer = () => {
    applySmartSummary(currentDoc, setDocs);
    scrollToSummary();
  };

  const hasSummary = !!currentDoc.smartSummary;

  return (
    <div className="animate-fadeIn min-h-screen w-full py-12 px-5 text-gray-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          className="text-gray-400 hover:text-white"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft size={22} />
        </button>

        <div className="flex gap-5">
          <button
            className="text-gray-400 hover:text-rose-300 active:scale-95"
            onClick={() => downloadDocument(currentDoc)}
            title="Download"
          >
            <FiDownload size={22} />
          </button>

          <button
            className="text-gray-400 hover:text-yellow-300 active:scale-95"
            onClick={() =>
              navigate(`/dashboard/documents/rewrite/${currentDoc.id}`)
            }
            title="Rewrite with AI"
          >
            <FaMagic size={20} />
          </button>

          <button
            className="text-gray-400 hover:text-indigo-300 active:scale-95"
            onClick={handleSummarizeViewer}
            title="AI Summary & Action Plan"
          >
            <FiFileText size={22} />
          </button>
        </div>
      </div>

      {/* File Name */}
      <h1 className="text-xl font-semibold mb-4 truncate">
        {currentDoc.name}
      </h1>

      {/* Preview */}
      {currentDoc.type === "PDF" ? (
        // Native PDF preview from blob or URL
        <iframe
          src={viewerUrl}
          title={currentDoc.name}
          className="w-full h-[60vh] rounded-xl border border-[#26262c] bg-black"
        />
      ) : isOffice ? (
        // Google Docs viewer for DOCX/XLSX
        <iframe
          src={viewerUrl}
          title={currentDoc.name}
          className="w-full h-[60vh] rounded-xl border border-[#26262c] bg-black"
        />
      ) : (
        <div className="bg-[#1b1b22] border border-[#26262c] p-8 rounded-xl text-center">
          Preview not supported for this file type
        </div>
      )}

      {/* Summary Panel */}
      <div
        id="smart-summary-panel"
        className="mt-8 bg-[#101016] border border-[#26262c] rounded-2xl p-6 space-y-6"
      >
        {!hasSummary ? (
          <p className="text-[13px] text-gray-400">
            Click{" "}
            <span className="inline-flex items-center gap-1 text-indigo-300">
              <FiFileText size={13} /> AI Summary
            </span>{" "}
            to generate insights from this document.
          </p>
        ) : (
          <>
            {/* Takeaway */}
            <div className="border-l-4 border-indigo-400 pl-3 text-sm text-indigo-200 font-semibold">
              {currentDoc.smartSummary.highlightTakeaway}
            </div>

            {/* Summary */}
            <p className="text-[13px] text-gray-200 leading-relaxed">
              {currentDoc.smartSummary.summaryText}
            </p>

            {/* Insights */}
            <section>
              <h2 className="text-sm font-semibold text-indigo-300 mb-2">
                Key Insights
              </h2>
              <ul className="space-y-1 text-[12px] text-gray-300 list-disc list-inside">
                {currentDoc.smartSummary.keyInsights.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>

            {/* Action Plan */}
            <section>
              <h2 className="text-sm font-semibold text-indigo-300 mb-2">
                Action Plan
              </h2>
              <div className="space-y-3">
                {currentDoc.smartSummary.actionPlan.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2.5 rounded-xl bg-[#15151d] border border-[#26262c]"
                  >
                    <p className="text-[13px] text-gray-100 font-medium">
                      {item.title}
                    </p>
                    <div className="flex gap-3 text-[11px] mt-1">
                      <span className="px-2 py-[1px] bg-rose-900/40 text-rose-200 rounded-full">
                        {item.priority}
                      </span>
                      <span className="px-2 py-[1px] bg-gray-700 text-gray-200 rounded-full">
                        {item.effort}
                      </span>
                      <span className="px-2 py-[1px] bg-indigo-900/40 text-indigo-200 rounded-full">
                        {item.dueHint}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Risks */}
            {currentDoc.smartSummary.risks.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-rose-300 mb-2 flex items-center gap-1">
                  <FiAlertTriangle size={14} /> Risks
                </h2>
                <ul className="space-y-1 text-[12px] text-gray-300 list-disc list-inside">
                  {currentDoc.smartSummary.risks.map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

