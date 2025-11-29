// src/pages/Documents.jsx
import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import { FiEye, FiFileText, FiDownload, FiPlus } from "react-icons/fi";

export default function Documents({ docs = [], setDocs }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [showUploader, setShowUploader] = useState(false);
  const fileInputRef = useRef(null);

  // ---------- Helpers ---------- //

  const createLocalBlob = (doc) => {
    const blob = new Blob([`Mock contents for ${doc.name}`], {
      type: "text/plain",
    });
    return URL.createObjectURL(blob);
  };

  // AI summary + action-planner generator (placeholder logic)
  const buildSmartSummary = (doc) => {
    const baseTitle = doc.name.replace(/\.[^/.]+$/, "");
    return {
      summaryText: `High-level summary for “${baseTitle}”. Key topics identified and prioritized for follow-up.`,
      keyInsights: [
        "Main objective and outcome of the document.",
        "Notable constraints, decisions, or open questions.",
        "Items that directly affect timelines or stakeholders.",
      ],
      actionPlan: [
        {
          priority: "High",
          title: "Confirm next milestone / delivery",
          ownerHint: "Project lead / client owner",
          effort: "2h",
          dueHint: "Next 1–2 days",
          status: "Not started",
        },
        {
          priority: "Medium",
          title: "Clarify blockers or outstanding dependencies",
          ownerHint: "Engineering / Operations",
          effort: "1–3h",
          dueHint: "This week",
          status: "Not started",
        },
        {
          priority: "Low",
          title: "Capture lessons learned / notes for future cycles",
          ownerHint: "Any team member",
          effort: "30m",
          dueHint: "After delivery",
          status: "Planned",
        },
      ],
      risks: [
        "Timeline slippage could impact client expectations or renewal.",
        "Missing assets / specs may delay downstream tasks.",
      ],
      meta: {
        generatedAt: new Date().toISOString(),
        sourceDocId: doc.id,
      },
    };
  };

  const handlePreview = (doc) => {
    navigate(`/dashboard/documents/view/${doc.id}`);
  };

  // Create or refresh Smart Summary + Action Plan on the document
  const runSmartSummary = async (doc) => {
    const summary = buildSmartSummary(doc);
    const linkedNoteId =
      doc.linkedNoteId || `sum-${Math.random().toString(36).slice(2)}`;

    setDocs((prev) =>
      prev.map((d) =>
        d.id === doc.id ? { ...d, smartSummary: summary, linkedNoteId } : d
      )
    );

    return linkedNoteId;
  };

  const handleSummarize = async (doc) => {
    await runSmartSummary(doc);
    // go to viewer, no hash needed
    navigate(`/dashboard/documents/view/${doc.id}`, {
      state: { scrollToSummary: true }
    });
  };


  const handleDownload = (doc) => {
    const url = doc.fileUrl || createLocalBlob(doc);
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

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toUpperCase() || "FILE";
    const type = ["PDF", "DOCX", "XLSX"].includes(extension)
      ? extension
      : "FILE";

    const newDoc = {
      id: `doc-${Date.now()}`,
      name: file.name,
      type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      updated: "Just now",
      fileUrl: URL.createObjectURL(file),
    };

    setDocs((prev) => [newDoc, ...prev]);
    setShowUploader(false);
  };

  const filteredDocs = useMemo(
    () =>
      docs.filter((d) => {
        const matchesType = filterType === "ALL" || d.type === filterType;
        const matchesQuery = d.name
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesType && matchesQuery;
      }),
    [query, filterType, docs]
  );

  // ---------- UI ---------- //

  return (
    <div className="space-y-8 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
      <header className="pt-2 px-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Documents
        </h1>
        <p className="text-gray-400 text-sm mt-1 mb-5">
          Manage your files — ready for AI summaries and action plans anytime.
        </p>

        {/* CTA Button */}
        <div className="w-full flex justify-center mt-1 mb-2">
          <button
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600
              text-white font-medium shadow-[0_18px_40px_rgba(15,23,42,0.55)]
              w-full py-3 rounded-[999px] sm:w-[80%] md:w-[50%] lg:w-[45%]"
            onClick={() => {
              setShowUploader(true);
              handleUploadButton();
            }}
          >
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/10">
              <FiPlus className="text-[15px]" />
            </span>
            New Document / Upload
          </button>
        </div>
      </header>

      <GlassCard>
        {/* Search + Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <input
            type="text"
            placeholder="Search documents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full md:w-80 bg-[#101016] border border-[#26262c] rounded-xl px-3 py-2
              text-sm text-gray-200 placeholder:text-gray-500 focus:border-indigo-500/70 focus:outline-none"
          />

          <div className="flex gap-2 text-xs">
            {["ALL", "PDF", "DOCX", "XLSX"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-[6px] rounded-full border transition ${
                  filterType === t
                    ? "bg-indigo-500/25 text-indigo-200 border-indigo-500/40"
                    : "bg-transparent text-gray-500 border-gray-700 hover:text-white"
                }`}
              >
                {t === "ALL" ? "All" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-2 text-sm">
          {filteredDocs.length === 0 && (
            <p className="text-gray-500 text-xs text-center py-4">
              No matching documents
            </p>
          )}

          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between bg-[#101016] border border-[#26262c]
                rounded-xl px-4 py-3 hover:border-indigo-500/40 transition"
            >
              <div className="flex-1 pr-6 min-w-0">
                <p className="text-gray-100 text-[14px] font-medium truncate">
                  {doc.name}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  {doc.type} · {doc.size} · Updated {doc.updated}
                </p>
              </div>

              <div className="flex gap-3 items-center">
                {/* Preview */}
                <button
                  className="text-gray-400 hover:text-indigo-300 active:scale-95 transition"
                  onClick={() => handlePreview(doc)}
                  title="Preview"
                >
                  <FiEye size={22} />
                </button>

                {/* AI Summary + Action Plan */}
                <button
                  className="text-gray-400 hover:text-indigo-300 active:scale-95 transition"
                  onClick={() => handleSummarize(doc)}
                  title="AI Summary & Action Plan"
                >
                  <FiFileText size={22} />
                </button>

                {/* Download */}
                <button
                  className="text-gray-400 hover:text-rose-300 active:scale-95 transition"
                  onClick={() => handleDownload(doc)}
                  title="Download"
                >
                  <FiDownload size={22} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />

      {/* Simple overlay while uploader is “active” */}
      {showUploader && (
        <div
          className="fixed inset-0 z-[9998] bg-black/40"
          onClick={() => setShowUploader(false)}
        />
      )}
    </div>
  );
}