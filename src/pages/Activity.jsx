// src/pages/Activity.jsx
import { useState, useMemo } from "react";
import GlassCard from "../components/GlassCard";
import {
  FiFileText,
  FiUploadCloud,
  FiActivity,
  FiZap,
} from "react-icons/fi";

// 📌 Added action-type + daysAgo
const allEvents = [
  { action: "summary", time: "Just now", text: "Generated summary for “Team Meeting Notes”", icon: FiZap, daysAgo: 0 },
  { action: "upload", time: "1h ago", text: "Uploaded file “projectRoadmap.pdf”", icon: FiUploadCloud, daysAgo: 0 },
  { action: "note", time: "Yesterday", text: "Created 3 new notes", icon: FiFileText, daysAgo: 1 },
  { action: "integration", time: "2 days ago", text: "Synced workspace with Notion", icon: FiActivity, daysAgo: 2 },
  { action: "note", time: "5 days ago", text: "Edited outline draft", icon: FiFileText, daysAgo: 5 },
  { action: "upload", time: "10 days ago", text: "Uploaded assets for pitch deck", icon: FiUploadCloud, daysAgo: 10 },
];

// Action type filter buttons
const typeFilters = [
  { label: "All", value: "all" },
  { label: "Uploads", value: "upload" },
  { label: "Summaries", value: "summary" },
  { label: "Notes", value: "note" },
  { label: "Integration", value: "integration" },
];

// Grouping rules
function getGroupName(daysAgo) {
  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo <= 7) return "This Week";
  return "Earlier";
}

export default function Activity() {
  const [range, setRange] = useState(7);
  const [typeFilter, setTypeFilter] = useState("all");

  // Filter events
  const filteredEvents = useMemo(() => {
    return allEvents.filter(
      (e) =>
        e.daysAgo <= range &&
        (typeFilter === "all" ? true : e.action === typeFilter)
    );
  }, [range, typeFilter]);

  // Group events by label
  const grouped = useMemo(() => {
    const result = {};
    filteredEvents.forEach((e) => {
      const group = getGroupName(e.daysAgo);
      if (!result[group]) result[group] = [];
      result[group].push(e);
    });
    return result;
  }, [filteredEvents]);

  return (
    <div className="space-y-8 pb-[calc(var(--mobile-nav-height)+24px)]">
      <header>
        <h1 className="text-2xl font-semibold text-white">Activity</h1>
        <p className="text-gray-400 text-sm mt-1">
          A timeline of everything you and NoteStream have done.
        </p>
      </header>

      <GlassCard className="pb-4">
        {/* Range Filters */}
        <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
          <span>Recent actions</span>

          <div className="flex gap-2">
            {[7, 30].map((n) => (
              <button
                key={n}
                className={`px-3 py-1 rounded-full border transition ${
                  range === n
                    ? "bg-indigo-600/20 text-indigo-200 border-indigo-500/40"
                    : "bg-transparent text-gray-400 border-gray-700 hover:text-white"
                }`}
                onClick={() => setRange(n)}
              >
                {n} days
              </button>
            ))}
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex gap-2 text-xs mb-4">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              className={`px-3 py-1 rounded-full border transition ${
                typeFilter === f.value
                  ? "bg-indigo-600/20 text-indigo-200 border-indigo-500/40"
                  : "bg-transparent text-gray-400 border-gray-700 hover:text-white"
              }`}
              onClick={() => setTypeFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        {Object.keys(grouped).length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-4">
            No activity in this view
          </p>
        ) : (
          <>
            {Object.entries(grouped).map(([group, items]) => (
              <section key={group} className="mb-6">
                <h3 className="text-[12px] uppercase tracking-wider text-gray-400 mb-3 ml-1">
                  {group}
                </h3>

                <ol className="relative border-l border-[#26262c] ml-4 space-y-5">
                  {items.map((e, i) => {
                    const Icon = e.icon;
                    return (
                      <li key={i} className="relative pl-6">
                        <div
                          className="
                            absolute -left-[14px] mt-1.5
                            w-7 h-7 rounded-full bg-[#1a1b27]
                            border border-indigo-500/40
                            flex items-center justify-center
                            shadow-[0_0_10px_rgba(99,102,241,0.25)]
                            transition hover:scale-105
                          "
                        >
                          <Icon size={15} className="text-indigo-300" />
                        </div>

                        <p className="text-gray-200 font-medium">{e.text}</p>
                        <p className="text-[11px] text-gray-500">{e.time}</p>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </>
        )}
      </GlassCard>
    </div>
  );
}
