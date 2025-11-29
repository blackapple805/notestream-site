// src/pages/Documents.jsx
import { useState, useMemo } from "react";
import GlassCard from "../components/GlassCard";
import { FiEye, FiFileText, FiDownload } from "react-icons/fi";

const allDocs = [
  { name: "projectRoadmap.pdf", type: "PDF", size: "1.2 MB", updated: "2 days ago" },
  { name: "user_research_notes.docx", type: "DOCX", size: "860 KB", updated: "5 days ago" },
  { name: "sales-data-q1.xlsx", type: "XLSX", size: "640 KB", updated: "1 week ago" },
];

export default function Documents() {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  const filteredDocs = useMemo(() => {
    return allDocs.filter((d) => {
      const matchesQuery = d.name.toLowerCase().includes(query.toLowerCase());
      const matchesType = filterType === "ALL" || d.type.toUpperCase() === filterType;
      return matchesQuery && matchesType;
    });
  }, [query, filterType]);

  return (
    <div className="space-y-8 pb-[calc(var(--mobile-nav-height)+24px)]">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Documents</h1>
          <p className="text-gray-400 text-sm mt-1">
            All uploaded files, ready for AI analysis and summaries.
          </p>
        </div>

        <button
          className="
            px-4 py-2
            rounded-full
            bg-indigo-600/90 hover:bg-indigo-500
            text-sm text-white
          "
          onClick={() => alert('Open document uploader')}
        >
        +Update
        </button>
      </header>

      <GlassCard>
        {/* Search + Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <input
            type="text"
            placeholder="Search documents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="
              w-full md:w-80
              bg-[#101016]
              border border-[#26262c]
              rounded-xl px-3 py-2 text-sm
              text-gray-200 placeholder:text-gray-500
              focus:outline-none focus:border-indigo-500
            "
          />

          <div className="flex gap-2 text-xs">
            {["ALL", "PDF", "DOCX", "XLSX"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-full border transition ${
                  filterType === t
                    ? "bg-indigo-600/20 text-indigo-200 border-indigo-500/40"
                    : "bg-transparent text-gray-400 border-gray-700 hover:text-white"
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
            <p className="text-gray-500 text-xs text-center py-4">No matching documents</p>
          )}

          {filteredDocs.map((d, i) => (
            <div
              key={i}
              className="
                flex items-center justify-between
                bg-[#101016] border border-[#26262c]
                rounded-xl px-4 py-3
                hover:border-indigo-500/40 transition
              "
            >
              {/* Left side text */}
              <div className="flex-1 pr-6 min-w-0">
                <p className="text-gray-100 text-[14px] font-medium truncate">{d.name}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                  {d.type} · {d.size} · Updated {d.updated}
                </p>
              </div>

              {/* Action buttons — consistent with NoteRow */}
              <div className="flex gap-2 items-center">
                <button
                  className="
                    w-10 h-10 bg-[#181822]
                    rounded-xl border border-[#262632]
                    text-indigo-300
                    flex items-center justify-center
                    transition active:scale-[0.95]
                  "
                  onClick={() => alert(`Preview: ${d.name}`)}
                >
                  <FiEye size={18} />
                </button>
                <button
                  className="
                    w-10 h-10 bg-[#181822]
                    rounded-xl border border-[#262632]
                    text-blue-300
                    flex items-center justify-center
                    transition active:scale-[0.95]
                  "
                  onClick={() => alert(`Summarize: ${d.name}`)}
                >
                  <FiFileText size={18} />
                </button>
                <button
                  className="
                    w-10 h-10 bg-[#181822]
                    rounded-xl border border-[#262632]
                    text-rose-300
                    flex items-center justify-center
                    transition active:scale-[0.95]
                  "
                  onClick={() => alert(`Download: ${d.name}`)}
                >
                  <FiDownload size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
