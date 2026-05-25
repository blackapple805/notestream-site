// src/pages/Activity.jsx
// ═══════════════════════════════════════════════════════════════════
// EDITORIAL RESKIN — matches the NoteStream "& co." paper/serif theme.
//
// ❶  All Supabase RPCs, state shapes, useEffect / useCallback graphs,
//     timeline grouping, filter behaviour, and trend calculations are
//     IDENTICAL to the prior bento-glass version. Pure presentation swap.
//
// ❷  Visual system in this file uses only the design tokens declared in
//     NoteStream_preview.html:
//
//        --ed-paper-50/100/150/200/300   paper tones
//        --ed-ink / ink-soft / mute / faint
//        --ed-rule / rule-soft           hairline borders
//        --ed-accent (#1f3aa8)           single editorial blue
//        --ed-serif (Instrument Serif)   display + italic accents
//        --ed-mono  (Geist Mono)         labels / timestamps / ordinals
//        --ed-sans  (Geist)              body / chrome
//
//     If any consumer of this page hasn't declared those vars yet,
//     fallbacks are inlined so the page still reads as paper-cream.
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid,
} from "recharts";
import {
  FiChevronDown, FiRefreshCw, FiAlertCircle, FiDownload,
} from "react-icons/fi";
import { supabase, supabaseReady } from "../lib/supabaseClient";
import { useEditorial } from "../lib/editorial";

/* ═══════════════════════════════════════════════════════
   Editorial tokens (with safe fallbacks)
   These mirror NoteStream_preview.html exactly.
═══════════════════════════════════════════════════════ */
const ED = {
  paper50:  "var(--ed-paper-50, #fbf8f0)",
  paper100: "var(--ed-paper-100, #f6f1e3)",
  paper150: "var(--ed-paper-150, #efe9d8)",
  paper200: "var(--ed-paper-200, #e7e0cb)",
  paper300: "var(--ed-paper-300, #d6cdb2)",
  ink:      "var(--ed-ink, #131008)",
  inkSoft:  "var(--ed-ink-soft, #2a2519)",
  inkMute:  "var(--ed-ink-mute, #4b4534)",
  inkFaint: "var(--ed-ink-faint, #8a8472)",
  rule:     "var(--ed-rule, #d8cfb6)",
  ruleSoft: "var(--ed-rule-soft, #e5dec5)",
  accent:   "var(--ed-accent, #1f3aa8)",
  accentSoft: "var(--ed-accent-soft, #dbe1f3)",
  serif:    'var(--ed-serif, "Instrument Serif", Georgia, serif)',
  sans:     'var(--ed-sans, "Geist", -apple-system, system-ui, sans-serif)',
  mono:     'var(--ed-mono, "Geist Mono", ui-monospace, monospace)',
};

/* Raw hex for SVG / chart fills that can't take CSS vars */
const ACCENT_HEX = "#1f3aa8";
const INK_HEX = "#131008";
const INK_FAINT_HEX = "#8a8472";

/* ─── Scoped styles (no global leaks) ─── */
const ACT_STYLES = `
@keyframes ns-act-fade-up {
  0%   { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
.ns-act-stagger > * { animation: ns-act-fade-up 0.5s cubic-bezier(.22,1,.36,1) both; }
.ns-act-stagger > *:nth-child(1) { animation-delay: 0.02s; }
.ns-act-stagger > *:nth-child(2) { animation-delay: 0.06s; }
.ns-act-stagger > *:nth-child(3) { animation-delay: 0.10s; }
.ns-act-stagger > *:nth-child(4) { animation-delay: 0.14s; }
.ns-act-stagger > *:nth-child(5) { animation-delay: 0.18s; }
.ns-act-stagger > *:nth-child(6) { animation-delay: 0.22s; }
.ns-act-stagger > *:nth-child(7) { animation-delay: 0.26s; }

/* Recharts axis ticks should read like editorial mono labels */
.ns-act-scope .recharts-cartesian-axis-tick-value {
  fill: ${INK_FAINT_HEX} !important;
  font-family: var(--ed-mono, "Geist Mono", ui-monospace, monospace) !important;
  font-size: 10px !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase;
}
.ns-act-scope .recharts-tooltip-wrapper { outline: none !important; }
.ns-act-scope .recharts-cartesian-grid line { stroke: var(--ed-rule-soft, #e5dec5); }

/* Pulse dot from preview */
@keyframes ns-act-pulse { 0%,100% { transform: scale(1); opacity: 1;} 50% { transform: scale(1.4); opacity: 0.5; } }
.ns-act-pulse { animation: ns-act-pulse 2.4s ease-in-out infinite; }

/* Dotted leader for stat rows */
.ns-act-leader {
  flex: 1;
  border-bottom: 1px dotted var(--ed-rule, #d8cfb6);
  align-self: end;
  height: 14px;
  transform: translateY(-6px);
  margin: 0 12px;
}

/* Hover lift for the article-style timeline rows */
.ns-act-event-row {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 18px;
  padding: 12px 0;
  align-items: baseline;
  border-bottom: 1px solid var(--ed-rule-soft, #e5dec5);
  transition: padding-left 0.15s ease;
}
.ns-act-event-row:last-child { border-bottom: 0; }
.ns-act-event-row:hover { padding-left: 8px; }
.ns-act-event-row:hover .ns-act-event-em { color: var(--ed-accent, #1f3aa8); }

/* Filter chips in preview style */
.ns-act-filter {
  font-family: var(--ed-mono, "Geist Mono", ui-monospace, monospace);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ed-ink-mute, #4b4534);
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--ed-rule, #d8cfb6);
  background: transparent;
  cursor: pointer;
  transition: all .15s ease;
}
.ns-act-filter:hover { border-color: var(--ed-ink, #131008); color: var(--ed-ink, #131008); }
.ns-act-filter.on {
  background: var(--ed-ink, #131008);
  color: var(--ed-paper-50, #fbf8f0);
  border-color: var(--ed-ink, #131008);
}

/* Editorial card */
.ns-act-card {
  background: var(--ed-paper-50, #fbf8f0);
  border: 1px solid var(--ed-rule, #d8cfb6);
  border-radius: 14px;
}

/* Streak day cell */
.ns-act-streak-cell {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--ed-mono, "Geist Mono", ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.1em;
  transition: transform .15s ease;
}
.ns-act-streak-cell:hover { transform: translateY(-2px); }

/* Refresh button (icon style from preview) */
.ns-act-icon-btn {
  height: 34px; width: 34px; border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid var(--ed-rule, #d8cfb6);
  color: var(--ed-ink-soft, #2a2519);
  background: transparent; cursor: pointer;
  transition: color .18s ease, border-color .18s ease;
}
.ns-act-icon-btn:hover { color: var(--ed-ink, #131008); border-color: var(--ed-ink, #131008); }
.ns-act-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Double rule from preview */
.ns-act-rule-dbl {
  border: 0;
  border-top: 1px solid var(--ed-ink, #131008);
  border-bottom: 1px solid var(--ed-ink, #131008);
  height: 4px;
  margin: 0;
}
`;

/* ═══════════════════════════════════════════════════════
   Utility functions  (UNCHANGED from prior file)
═══════════════════════════════════════════════════════ */
function formatTimeAgo(dateStr) {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr); const now = new Date(); const diffMs = now - date;
  if (isNaN(diffMs)) return "Recently";
  const diffSecs = Math.floor(diffMs / 1000); const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000); const diffDays = Math.floor(diffMs / 86400000);
  if (diffSecs < 30) return "Just now"; if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`; if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday"; if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function formatClock(dateStr) {
  if (!dateStr) return "--:--";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}
function safeJson(val) { if (!val) return {}; if (typeof val === "object") return val; try { return JSON.parse(val); } catch { return {}; } }
function toNum(v) { if (v === null || v === undefined) return null; const n = Number(v); return Number.isFinite(n) ? n : null; }
function localDayKeyFromEvent(event) {
  const d = new Date(event?.created_at || Date.now()); if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function labelForDayKey(dayKey) {
  if (!dayKey || dayKey === "unknown") return { weekday: "—", date: "Unknown" };
  const [yy, mm, dd] = dayKey.split("-").map(Number);
  const date = new Date(yy, (mm || 1) - 1, dd || 1);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((today - new Date(date.getFullYear(), date.getMonth(), date.getDate())) / 86400000);
  const dateLabel = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (diffDays === 0) return { weekday: "TODAY", date: dateLabel };
  if (diffDays === 1) return { weekday: "YESTERDAY", date: dateLabel };
  return {
    weekday: date.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase(),
    date: dateLabel,
  };
}
function getEventTitle(event, noteMap, docMap) {
  if (!event) return "Activity";
  if (event.title?.trim() && event.title !== "null") return event.title.trim();
  const md = event.metadata || {};
  for (const k of ["title", "name", "note_title", "doc_name", "file_name"]) { if (md[k]?.trim()) return md[k].trim(); }
  const entityId = event.entity_id;
  if (entityId) { if (noteMap?.has(entityId)) { const n = noteMap.get(entityId); if (n?.title?.trim()) return n.title.trim(); } if (docMap?.has(entityId)) { const d = docMap.get(entityId); if (d?.name?.trim()) return d.name.trim(); if (d?.file_name?.trim()) return d.file_name.trim(); } }
  const typeDefaults = { doc_uploaded: "Document uploaded", note_created: "New note", note_updated: "Note updated", ai_summary: "AI summary generated", ai_used: "AI assistant used", synthesis: "Document synthesis", integration_sync: "Integration synced" };
  return typeDefaults[event.event_type] || String(event.event_type || "activity").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function getEventSubtitle(event) {
  if (!event) return null; const md = event.metadata || {}; const type = event.event_type;
  if (type === "doc_uploaded" && (md.type || md.file_type)) return `${(md.type || md.file_type).toUpperCase()} file`;
  if (type === "ai_summary" && md.word_count) return `${md.word_count} words summarized`;
  if (type === "note_updated" && md.changes) return `${md.changes} changes`;
  if (md.source) return `from ${md.source}`; return null;
}

/* ═══════════════════════════════════════════════════════
   Editorial copy for event types
═══════════════════════════════════════════════════════ */
const EVENT_KIND_LABEL = {
  note_created:     "NOTE",
  note_updated:     "NOTE · EDIT",
  doc_uploaded:     "UPLOAD",
  ai_summary:       "AI · SUMMARY",
  ai_used:          "AI · CALL",
  synthesis:        "AI · SYNTHESIS",
  integration_sync: "INTEGRATION",
};

const EVENT_VERB = {
  note_created:     "Created",
  note_updated:     "Edited",
  doc_uploaded:     "Uploaded",
  ai_summary:       "Summarised",
  ai_used:          "Asked the model about",
  synthesis:        "Synthesised",
  integration_sync: "Synced",
};

/* ═══════════════════════════════════════════════════════
   Constants (logic UNCHANGED)
═══════════════════════════════════════════════════════ */
const typeFilters = [
  { label: "All", value: "all" },
  { label: "Uploads", value: "doc_uploaded" },
  { label: "Summaries", value: "ai_summary" },
  { label: "Notes", value: "notes" },
  { label: "Edits", value: "updates" },
  { label: "Integrations", value: "integration_sync" },
];

const defaultChartData = [
  { name: "Mon", notes: 0, summaries: 0, uploads: 0 },
  { name: "Tue", notes: 0, summaries: 0, uploads: 0 },
  { name: "Wed", notes: 0, summaries: 0, uploads: 0 },
  { name: "Thu", notes: 0, summaries: 0, uploads: 0 },
  { name: "Fri", notes: 0, summaries: 0, uploads: 0 },
  { name: "Sat", notes: 0, summaries: 0, uploads: 0 },
  { name: "Sun", notes: 0, summaries: 0, uploads: 0 },
];
const defaultStreakDays = [
  { day: "Mon", active: false }, { day: "Tue", active: false },
  { day: "Wed", active: false }, { day: "Thu", active: false },
  { day: "Fri", active: false }, { day: "Sat", active: false },
  { day: "Sun", active: false },
];
const TIMELINE_ALLOWED_TYPES = new Set([
  "note_created", "note_updated", "doc_uploaded",
  "ai_summary", "ai_used", "integration_sync", "synthesis",
]);

/* ═══════════════════════════════════════════════════════
   Chart tooltip — paper-card with mono labels
═══════════════════════════════════════════════════════ */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: ED.paper50,
        border: `1px solid ${ED.rule}`,
        borderRadius: 8,
        padding: "10px 12px",
        boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
      }}
    >
      <p style={{
        fontFamily: ED.mono, fontSize: 10, letterSpacing: "0.14em",
        textTransform: "uppercase", color: ED.inkFaint, margin: 0, marginBottom: 6,
      }}>
        {label}
      </p>
      {payload.map((e, i) => (
        <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: i === 0 ? 0 : 4 }}>
          <span style={{
            display: "inline-block", width: 8, height: 8, borderRadius: 2,
            background: e.color, marginRight: 2,
          }} />
          <span style={{ fontFamily: ED.mono, fontSize: 10.5, color: ED.inkMute }}>
            {e.name}
          </span>
          <span style={{
            fontFamily: ED.serif, fontStyle: "italic", fontSize: 18,
            color: ED.accent, marginLeft: "auto", lineHeight: 1,
          }}>
            {e.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT — all RPC logic UNCHANGED
═══════════════════════════════════════════════════════ */
export default function Activity() {
  // Ensure editorial fonts + shared scoped CSS (including mobile rules) load
  // even if the user lands directly on this page without going through the
  // Sidebar first. No-op if already loaded.
  useEditorial();

  const [timelineRange, setTimelineRange] = useState(7);
  const [chartRange, setChartRange] = useState("week");
  const chartDays = chartRange === "month" ? 30 : 7;
  const statDays = chartDays;
  const [typeFilter, setTypeFilter] = useState("all");
  const [chartTab, setChartTab] = useState("notes");
  const [chartsReady, setChartsReady] = useState(false);
  const [usageBreakdown, setUsageBreakdown] = useState([]);
  const [clarity, setClarity] = useState({ total_score: 0, readability: 0, structure: 0, completeness: 0 });
  const [trends, setTrends] = useState({ notes_delta: 0, notes_pct: null, ai_activity_delta: 0, ai_activity_pct: null, uploads_delta: 0, uploads_pct: null, active_days_delta: 0, active_days_pct: null });
  const [openGroups, setOpenGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState(null);
  const [stats, setStats] = useState({ notes_count: 0, ai_summaries_count: 0, ai_activity_count: 0, uploads_count: 0, streak_days: 0, active_days_count: 0 });
  const [dailyData, setDailyData] = useState(defaultChartData);
  const [streakDays, setStreakDays] = useState(defaultStreakDays);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [noteMap, setNoteMap] = useState(new Map());
  const [docMap, setDocMap] = useState(new Map());

  useEffect(() => { const t = setTimeout(() => setChartsReady(true), 100); return () => clearTimeout(t); }, []);

  const getUser = useCallback(async () => { const { data, error } = await supabase.auth.getUser(); if (error) throw error; if (!data?.user) throw new Error("Not authenticated"); return data.user; }, []);
  const firstRow = (data) => (Array.isArray(data) ? data[0] : data);
  const fmtPct = useCallback((pct) => { const n = toNum(pct); if (n === null) return null; return `${n > 0 ? "+" : ""}${Math.round(n)}%`; }, []);
  const isUp = useCallback((pct) => { const n = toNum(pct); return n === null ? true : n >= 0; }, []);

  /* ── Load stats + charts ── */
  const loadActivityData = useCallback(async () => {
    if (!supabaseReady || !supabase) { setLoading(false); return; }
    try {
      setLoading(true); const user = await getUser();
      const { data: statsData, error: statsError } = await supabase.rpc("get_activity_stats_v2", { p_user_id: user.id, p_days: statDays });
      if (statsError) console.error("Stats error:", statsError);
      const sr = firstRow(statsData);
      setStats({ notes_count: Number(sr?.notes_count) || 0, ai_summaries_count: Number(sr?.ai_summaries_count) || 0, ai_activity_count: Number(sr?.ai_activity_count) || 0, uploads_count: Number(sr?.uploads_count) || 0, streak_days: Number(sr?.streak_days) || 0, active_days_count: Number(sr?.active_days_count) || 0 });

      const { data: trendsData, error: trendsError } = await supabase.rpc("get_activity_trends_v1", { p_user_id: user.id, p_days: statDays });
      if (trendsError) console.error("Trends error:", trendsError);
      const tr = firstRow(trendsData);
      setTrends({ notes_delta: Number(tr?.notes_delta) || 0, notes_pct: toNum(tr?.notes_pct), ai_activity_delta: Number(tr?.ai_activity_delta) || 0, ai_activity_pct: toNum(tr?.ai_activity_pct), uploads_delta: Number(tr?.uploads_delta) || 0, uploads_pct: toNum(tr?.uploads_pct), active_days_delta: Number(tr?.active_days_delta) || 0, active_days_pct: toNum(tr?.active_days_pct) });

      const { data: dailyResult, error: dailyError } = await supabase.rpc("get_daily_activity", { p_user_id: user.id, p_days: chartDays });
      if (dailyError) console.error("Daily error:", dailyError);
      setDailyData(dailyResult?.length ? dailyResult.map((d) => ({ name: d.day_name, notes: Number(d.notes_count) || 0, summaries: Number(d.summaries_count) || 0, uploads: Number(d.uploads_count) || 0 })) : defaultChartData);

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles";
      const { data: streakData, error: streakError } = await supabase.rpc("get_weekly_streak", { p_user_id: user.id, p_tz: tz });
      if (streakError) console.error("Streak error:", streakError);
      setStreakDays(streakData?.length ? streakData.map((d) => ({ day: d.day_name, active: !!d.was_active })) : defaultStreakDays);

      const { data: usageData, error: usageErr } = await supabase.rpc("get_usage_breakdown", { p_user_id: user.id, p_days: statDays });
      if (usageErr) console.error("Usage error:", usageErr);
      setUsageBreakdown(usageData || []);

      const { data: clarityData, error: clarityErr } = await supabase.rpc("get_clarity_score", { p_user_id: user.id, p_days: statDays });
      if (clarityErr) console.error("Clarity error:", clarityErr);
      const cr = firstRow(clarityData);
      setClarity({ total_score: Number(cr?.total_score) || 0, readability: Number(cr?.readability) || 0, structure: Number(cr?.structure) || 0, completeness: Number(cr?.completeness) || 0 });
    } catch (err) { console.error("Failed to load activity data:", err); }
    finally { setLoading(false); }
  }, [getUser, statDays, chartDays]);

  /* ── Load timeline ── */
  const loadTimeline = useCallback(async () => {
    if (!supabaseReady || !supabase) return;
    try {
      setTimelineLoading(true); setTimelineError(null); const user = await getUser();
      const [{ data: docsData, error: docsErr }, { data: notesData, error: notesErr }] = await Promise.all([
        supabase.from("documents").select("id, name, type, file_name, created_at, updated_at").eq("user_id", user.id),
        supabase.from("notes").select("id, title, created_at, updated_at").eq("user_id", user.id),
      ]);
      const newDocMap = new Map(); const newNoteMap = new Map();
      if (!docsErr && docsData) docsData.forEach((d) => newDocMap.set(d.id, d));
      if (!notesErr && notesData) notesData.forEach((n) => newNoteMap.set(n.id, n));
      setDocMap(newDocMap); setNoteMap(newNoteMap);

      const rpcEventType = typeFilter === "all" || typeFilter === "notes" || typeFilter === "updates" ? null : typeFilter;
      const daysForRpc = timelineRange > 0 ? timelineRange : 365;
      let timelineData = null; let rpcError = null;
      try { const r = await supabase.rpc("get_activity_timeline", { p_user_id: user.id, p_days: daysForRpc, p_event_type: rpcEventType, p_limit: 250 }); timelineData = r.data; rpcError = r.error; } catch (err) { rpcError = err; }

      if (rpcError) {
        console.error("Timeline RPC error:", rpcError);
        let q = supabase.from("activity_events").select("*").eq("user_id", user.id).in("event_type", Array.from(TIMELINE_ALLOWED_TYPES)).order("created_at", { ascending: false }).limit(250);
        if (timelineRange > 0) { const since = new Date(); since.setDate(since.getDate() - timelineRange); q = q.gte("created_at", since.toISOString()); }
        if (rpcEventType) q = q.eq("event_type", rpcEventType);
        const { data: directData, error: directError } = await q;
        if (directError) { setTimelineError("Failed to load timeline"); setTimelineEvents([]); return; }
        timelineData = directData || [];
      }

      const normalized = (timelineData || []).map((e) => ({ ...e, metadata: safeJson(e.metadata), day_key: localDayKeyFromEvent(e) }))
        .filter((e) => TIMELINE_ALLOWED_TYPES.has(e?.event_type))
        .filter((e) => { if (typeFilter === "notes") return e.event_type === "note_created" || e.event_type === "note_updated"; if (typeFilter === "updates") return e.event_type === "note_updated"; return true; })
        .filter((e) => { const eid = e.entity_id; if (!eid) return true; if (e.event_type === "note_created" || e.event_type === "note_updated") return newNoteMap.size === 0 || newNoteMap.has(eid); if (e.event_type === "doc_uploaded") return newDocMap.size === 0 || newDocMap.has(eid); return true; });

      const seen = new Map();
      for (const e of normalized) { const isEntity = (e.event_type === "note_created" || e.event_type === "note_updated" || e.event_type === "doc_uploaded") && !!e.entity_id; const key = isEntity ? `${e.event_type}:${e.entity_id}` : `${e.event_type}:${e.id}`; const prev = seen.get(key); if (!prev) { seen.set(key, e); } else { if (new Date(e.created_at) > new Date(prev.created_at)) seen.set(key, e); } }
      setTimelineEvents(Array.from(seen.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) { console.error("Failed to load timeline:", err); setTimelineError(err.message || "Failed"); setTimelineEvents([]); }
    finally { setTimelineLoading(false); }
  }, [getUser, timelineRange, typeFilter]);

  const handleRefresh = useCallback(() => { loadActivityData(); loadTimeline(); }, [loadActivityData, loadTimeline]);
  useEffect(() => { loadActivityData(); }, [loadActivityData]);
  useEffect(() => { loadTimeline(); }, [loadTimeline]);

  const groupedEvents = useMemo(() => {
    const byDay = new Map();
    for (const e of timelineEvents) { const k = e.day_key || localDayKeyFromEvent(e); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(e); }
    return Array.from(byDay.keys()).sort((a, b) => (a < b ? 1 : -1)).map((k) => ({ dayKey: k, ...labelForDayKey(k), items: (byDay.get(k) || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) }));
  }, [timelineEvents]);

  useEffect(() => {
    if (!groupedEvents.length) return;
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const g of groupedEvents) {
        if (next[g.dayKey] === undefined) next[g.dayKey] = true; // open all by default in editorial layout
      }
      return next;
    });
  }, [groupedEvents]);

  const chartData = dailyData;

  /* Display strings for the page sub-line */
  const totalEvents = timelineEvents.length;
  const rangeLabel = timelineRange === 0 ? "ALL TIME" : `LAST ${timelineRange} DAYS`;
  const sessionsLabel = `${groupedEvents.length} ${groupedEvents.length === 1 ? "SESSION" : "SESSIONS"}`;

  /* ── Loading state ── */
  if (loading) {
    return (
      <>
        <style>{ACT_STYLES}</style>
        <div
          className="ns-ed ns-act-scope"
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", minHeight: "60vh", gap: 18,
            padding: 40,
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            border: `1px solid ${ED.rule}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: ED.paper50,
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              border: `2px solid ${ED.rule}`,
              borderTopColor: ACCENT_HEX,
              animation: "spin 0.9s linear infinite",
            }} />
          </div>
          <p style={{
            fontFamily: ED.mono, fontSize: 10.5, letterSpacing: "0.16em",
            textTransform: "uppercase", color: ED.inkFaint, margin: 0,
          }}>
            Setting the type…
          </p>
        </div>
      </>
    );
  }

  /* ═══════════════════════════════════════════════════════
     RENDER — editorial layout
  ═══════════════════════════════════════════════════════ */
  return (
    <>
      <style>{ACT_STYLES}</style>

      <div
        className="ns-ed ns-act-scope ns-act-stagger"
        style={{
          fontFamily: ED.sans,
          color: ED.ink,
          background: "transparent", // page background comes from app shell (paper-100)
          padding: 0,
        }}
      >
        {/* ═══ HEADER — chapter, title, subline, controls ═══ */}
        <header
          className="ed-section-head"
          style={{
            display: "flex", alignItems: "baseline", justifyContent: "space-between",
            gap: 24, flexWrap: "wrap", marginBottom: 28,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{
              display: "inline-flex", alignItems: "baseline", gap: 10,
              fontFamily: ED.mono, fontSize: 11, letterSpacing: "0.16em",
              textTransform: "uppercase", color: ED.inkFaint, marginBottom: 18,
            }}>
              <span style={{
                fontFamily: ED.serif, fontStyle: "italic", fontSize: 22,
                letterSpacing: 0, color: ED.accent,
              }}>
                № 06
              </span>
              <span>— THE RECORD</span>
            </div>
            <h1 style={{
              fontFamily: ED.serif, fontWeight: 400, lineHeight: 0.95,
              letterSpacing: "-0.025em",
              fontSize: "clamp(40px, 5vw, 64px)",
              margin: 0, paddingBottom: "0.06em", color: ED.ink,
            }}>
              Every <span style={{ fontStyle: "italic", color: ED.accent }}>edit</span>, dated.
            </h1>
            <p style={{
              fontFamily: ED.mono, fontSize: 11, letterSpacing: "0.14em",
              textTransform: "uppercase", color: ED.inkFaint, marginTop: 28,
            }}>
              <span style={{
                display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                background: ED.accent, marginRight: 10,
              }} className="ns-act-pulse" />
              {totalEvents} {totalEvents === 1 ? "EVENT" : "EVENTS"} · {rangeLabel} · {sessionsLabel}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={timelineLoading}
              className="ns-act-icon-btn"
              aria-label="Refresh"
              title="Refresh"
            >
              <motion.div
                animate={{ rotate: timelineLoading ? 360 : 0 }}
                transition={{ duration: 1, repeat: timelineLoading ? Infinity : 0, ease: "linear" }}
                style={{ display: "flex" }}
              >
                <FiRefreshCw size={14} />
              </motion.div>
            </button>

            <EdGhostButton onClick={() => setTimelineRange(timelineRange === 7 ? 30 : timelineRange === 30 ? 0 : 7)}>
              {timelineRange === 0 ? "All time" : `Last ${timelineRange} days`} ▾
            </EdGhostButton>

            <EdGhostButton>
              <FiDownload size={13} style={{ marginRight: 6 }} />
              Export →
            </EdGhostButton>
          </div>
        </header>

        <hr className="ns-act-rule-dbl" />

        {/* ═══ STAT STRIP — newspaper-style numbers in italic serif ═══ */}
        <section
          className="ed-stat-strip"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            marginTop: 0,
            borderBottom: `1px solid ${ED.rule}`,
          }}
        >
          <EdStat
            label={`Notes · ${statDays}d`}
            value={stats.notes_count}
            footnote={fmtPct(trends.notes_pct)}
            up={isUp(trends.notes_pct)}
            withRight
          />
          <EdStat
            label={`AI activity · ${statDays}d`}
            value={stats.ai_activity_count}
            footnote={fmtPct(trends.ai_activity_pct)}
            up={isUp(trends.ai_activity_pct)}
            withRight
          />
          <EdStat
            label="Day streak"
            value={stats.streak_days}
            footnote={stats.streak_days > 0 ? "KEEP IT GOING" : "BEGIN TODAY"}
            withRight
          />
          <EdStat
            label={`Uploads · ${statDays}d`}
            value={stats.uploads_count}
            footnote={fmtPct(trends.uploads_pct)}
            up={isUp(trends.uploads_pct)}
          />
        </section>

        {/* ═══ MIDDLE — Insights chart + Weekly Activity ═══ */}
        <section style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
          gap: 40,
          marginTop: 48,
        }}>
          {/* Insights over time */}
          <div>
            <SectionHeader
              chapter="§ A"
              kicker="— INSIGHTS OVER TIME"
              title="Productivity, by the day."
              right={
                <div style={{ display: "flex", gap: 6 }}>
                  {["notes", "summaries"].map((tab) => (
                    <button
                      key={tab}
                      className={`ns-act-filter ${chartTab === tab ? "on" : ""}`}
                      onClick={() => setChartTab(tab)}
                      type="button"
                    >
                      {tab}
                    </button>
                  ))}
                  <span style={{ width: 8 }} />
                  {["week", "month"].map((r) => (
                    <button
                      key={r}
                      className={`ns-act-filter ${chartRange === r ? "on" : ""}`}
                      onClick={() => setChartRange(r)}
                      type="button"
                    >
                      {r === "week" ? "Week" : "Month"}
                    </button>
                  ))}
                </div>
              }
            />
            <div className="ns-act-card" style={{ padding: 20, marginTop: 18 }}>
              <div style={{ width: "100%", height: chartRange === "month" ? 240 : 220 }}>
                {chartsReady ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 6, right: 10, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="edAreaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ACCENT_HEX} stopOpacity={0.18} />
                          <stop offset="100%" stopColor={ACCENT_HEX} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 4" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} width={28} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: ED.rule, strokeWidth: 1 }} />
                      <Area
                        type="monotone"
                        dataKey={chartTab}
                        name={chartTab.charAt(0).toUpperCase() + chartTab.slice(1)}
                        stroke={ACCENT_HEX}
                        strokeWidth={1.75}
                        fill="url(#edAreaFill)"
                        dot={{ r: 3, fill: ACCENT_HEX, stroke: "#fff", strokeWidth: 1.5 }}
                        activeDot={{ r: 5, fill: ACCENT_HEX, stroke: "#fff", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartSkeleton />
                )}
              </div>

              {/* Sparkline strip — Uploads */}
              <div style={{
                marginTop: 18, paddingTop: 16,
                borderTop: `1px solid ${ED.ruleSoft}`,
                display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "center",
              }}>
                <div>
                  <p style={{
                    fontFamily: ED.mono, fontSize: 10, letterSpacing: "0.16em",
                    textTransform: "uppercase", color: ED.inkFaint, margin: 0,
                  }}>
                    Uploads · sparkline
                  </p>
                  <p style={{
                    fontFamily: ED.serif, fontStyle: "italic", fontSize: 32,
                    color: ED.accent, margin: "6px 0 0", lineHeight: 1,
                  }}>
                    {stats.uploads_count}
                  </p>
                </div>
                <div style={{ width: "100%", height: 56 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="edSparkFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={INK_HEX} stopOpacity={0.18} />
                          <stop offset="100%" stopColor={INK_HEX} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" hide /><YAxis hide />
                      <Tooltip content={<ChartTooltip />} cursor={false} />
                      <Area
                        type="monotone" dataKey="uploads" name="Uploads"
                        stroke={INK_HEX} strokeWidth={1.5}
                        fill="url(#edSparkFill)" dot={false}
                        activeDot={{ r: 3, fill: INK_HEX, stroke: "#fff", strokeWidth: 1.5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly streak — paper card with day cells */}
          <div>
            <SectionHeader
              chapter="§ B"
              kicker="— THE WEEK"
              title="Days on the desk."
            />
            <div className="ns-act-card" style={{ padding: 20, marginTop: 18 }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 8,
              }}>
                {streakDays.map((d, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div
                      className="ns-act-streak-cell"
                      style={d.active
                        ? { background: ED.accent, color: ED.paper50, border: `1px solid ${ED.accent}` }
                        : { background: ED.paper100, color: ED.inkFaint, border: `1px dashed ${ED.rule}` }
                      }
                    >
                      {d.active ? "●" : "·"}
                    </div>
                    <span style={{
                      fontFamily: ED.mono, fontSize: 9.5, letterSpacing: "0.14em",
                      textTransform: "uppercase", color: ED.inkFaint,
                      textAlign: "center",
                    }}>
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>

              <hr style={{
                border: 0, borderTop: `1px solid ${ED.ruleSoft}`,
                margin: "20px 0 16px",
              }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div>
                  <p style={{
                    fontFamily: ED.mono, fontSize: 10, letterSpacing: "0.16em",
                    textTransform: "uppercase", color: ED.inkFaint, margin: 0,
                  }}>Current streak</p>
                  <p style={{
                    fontFamily: ED.serif, fontStyle: "italic", fontSize: 44,
                    color: ED.accent, margin: "4px 0 0", lineHeight: 1,
                  }}>
                    {stats.streak_days}
                    <span style={{ fontSize: 18, color: ED.inkMute, marginLeft: 6 }}>days</span>
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{
                    fontFamily: ED.mono, fontSize: 10, letterSpacing: "0.16em",
                    textTransform: "uppercase", color: ED.inkFaint, margin: 0,
                  }}>Active days</p>
                  <p style={{
                    fontFamily: ED.serif, fontStyle: "italic", fontSize: 44,
                    color: ED.ink, margin: "4px 0 0", lineHeight: 1,
                  }}>
                    {stats.active_days_count}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CLARITY + USAGE BREAKDOWN + DAILY BARS ═══ */}
        <section style={{ marginTop: 56 }}>
          <SectionHeader
            chapter="§ C"
            kicker="— THE READING"
            title="What the model thinks of your week."
          />

          {/* Changed: Removed inline style, added className */}
          <div className="clarity-grid">
            {/* Clarity */}
            <div className="ns-act-card" style={{ padding: 24 }}>
              <p style={{
                fontFamily: ED.mono, fontSize: 10, letterSpacing: "0.18em",
                textTransform: "uppercase", color: ED.inkFaint, margin: 0,
              }}>
                Clarity score
              </p>
              <div style={{
                display: "flex", alignItems: "baseline", gap: 12,
                marginTop: 8, marginBottom: 16,
              }}>
                <p style={{
                  fontFamily: ED.serif, fontStyle: "italic",
                  fontSize: "clamp(56px, 6vw, 80px)",
                  color: ED.accent, margin: 0, lineHeight: 0.9,
                }}>
                  {clarity.total_score || 0}
                </p>
                <span style={{
                  fontFamily: ED.serif, fontSize: 22, color: ED.inkFaint,
                }}>/ 100</span>
              </div>
              <div style={{
                height: 1, background: ED.ruleSoft, margin: "8px 0 14px",
              }} />
              <ClarityLine label="Readability" value={clarity.readability} />
              <ClarityLine label="Structure" value={clarity.structure} />
              <ClarityLine label="Completeness" value={clarity.completeness} last />
            </div>

            {/* Usage breakdown */}
            <div className="ns-act-card" style={{ padding: 24 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "baseline", marginBottom: 14,
              }}>
                <p style={{
                  fontFamily: ED.mono, fontSize: 10, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: ED.inkFaint, margin: 0,
                }}>
                  Usage breakdown
                </p>
                <span style={{
                  fontFamily: ED.mono, fontSize: 10, letterSpacing: "0.14em",
                  textTransform: "uppercase", color: ED.inkFaint,
                }}>
                  Last {statDays}d
                </span>
              </div>
              {usageBreakdown.length === 0 ? (
                <p style={{
                  fontFamily: ED.serif, fontStyle: "italic", fontSize: 17,
                  color: ED.inkFaint, margin: "32px 0", textAlign: "center",
                }}>
                  No categories yet — start writing.
                </p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {usageBreakdown.map((item, i) => {
                    const val = Number(item.value) || 0;
                    const count = Number(item.count) || 0;
                    return (
                      <li key={`${item.label}-${i}`} style={{
                        padding: "10px 0",
                        borderBottom: i === usageBreakdown.length - 1 ? "none" : `1px solid ${ED.ruleSoft}`,
                      }}>
                        <div style={{
                          display: "flex", alignItems: "baseline",
                          justifyContent: "space-between", gap: 8,
                        }}>
                          <span style={{
                            fontFamily: ED.serif, fontSize: 18, color: ED.ink,
                          }}>
                            {item.label}
                          </span>
                          <span className="ns-act-leader" />
                          <span style={{
                            fontFamily: ED.serif, fontStyle: "italic", fontSize: 22,
                            color: ED.accent,
                          }}>
                            {val}%
                          </span>
                        </div>
                        <div style={{
                          display: "flex", justifyContent: "space-between",
                          alignItems: "baseline", marginTop: 6,
                        }}>
                          <div style={{
                            flex: 1, height: 2, background: ED.paper200,
                            borderRadius: 1, overflow: "hidden", marginRight: 12,
                          }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, val)}%` }}
                              transition={{ duration: 0.8, delay: i * 0.06 }}
                              style={{ height: "100%", background: ED.accent }}
                            />
                          </div>
                          <span style={{
                            fontFamily: ED.mono, fontSize: 10, letterSpacing: "0.12em",
                            textTransform: "uppercase", color: ED.inkFaint,
                            whiteSpace: "nowrap",
                          }}>
                            {count} {count === 1 ? "note" : "notes"}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Daily breakdown — bar chart */}
            <div className="ns-act-card" style={{ padding: 24 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "baseline", marginBottom: 14,
              }}>
                <p style={{
                  fontFamily: ED.mono, fontSize: 10, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: ED.inkFaint, margin: 0,
                }}>
                  Daily breakdown
                </p>
                <span style={{
                  fontFamily: ED.mono, fontSize: 10, letterSpacing: "0.14em",
                  textTransform: "uppercase", color: ED.inkFaint,
                }}>
                  {chartDays}d
                </span>
              </div>
              <div style={{ width: "100%", height: 180 }}>
                {chartsReady ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={3} margin={{ top: 6, right: 0, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 4" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} width={28} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(31, 58, 168, 0.04)" }} />
                      <Bar dataKey="notes" fill={ACCENT_HEX} radius={[3, 3, 0, 0]} name="Notes" />
                      <Bar dataKey="summaries" fill={INK_HEX} radius={[3, 3, 0, 0]} name="Summaries" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartSkeleton />
                )}
              </div>
              <div style={{
                display: "flex", gap: 16, marginTop: 12,
                fontFamily: ED.mono, fontSize: 10, letterSpacing: "0.14em",
                textTransform: "uppercase", color: ED.inkFaint,
              }}>
                <LegendDot color={ACCENT_HEX} label="Notes" />
                <LegendDot color={INK_HEX} label="Summaries" />
              </div>
            </div>
          </div>
        </section>

        {/* ═══ TIMELINE — the newspaper "tl-day" pattern ═══ */}
        <section style={{ marginTop: 64 }}>
          <SectionHeader
            chapter="§ D"
            kicker="— THE TIMELINE"
            title="A diary of edits."
            right={
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {typeFilters.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    className={`ns-act-filter ${typeFilter === f.value ? "on" : ""}`}
                    onClick={() => setTypeFilter(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            }
          />

          <hr style={{ border: 0, borderTop: `1px solid ${ED.rule}`, marginTop: 24 }} />

          {timelineError && (
            <div style={{
              marginTop: 20, padding: "12px 16px",
              background: ED.paper50,
              border: `1px solid ${ED.rule}`,
              borderLeft: `3px solid ${ED.accent}`,
              borderRadius: 4,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <FiAlertCircle size={15} style={{ color: ED.accent }} />
              <span style={{
                fontFamily: ED.serif, fontSize: 16, color: ED.inkSoft,
              }}>{timelineError}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {timelineLoading ? (
              <motion.div
                key="tl-load"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", padding: "60px 0", gap: 14,
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  border: `2px solid ${ED.rule}`,
                  borderTopColor: ACCENT_HEX,
                  animation: "spin 0.9s linear infinite",
                }} />
                <p style={{
                  fontFamily: ED.mono, fontSize: 10.5, letterSpacing: "0.16em",
                  textTransform: "uppercase", color: ED.inkFaint, margin: 0,
                }}>
                  Setting the type…
                </p>
              </motion.div>
            ) : groupedEvents.length === 0 ? (
              <motion.div
                key="tl-empty"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  textAlign: "center", padding: "60px 20px",
                  borderTop: `1px solid ${ED.ruleSoft}`, marginTop: 24,
                }}
              >
                <p style={{
                  fontFamily: ED.serif, fontStyle: "italic",
                  fontSize: "clamp(24px, 2.5vw, 32px)",
                  color: ED.inkMute, margin: 0,
                }}>
                  The page is blank.
                </p>
                <p style={{
                  fontFamily: ED.mono, fontSize: 11, letterSpacing: "0.14em",
                  textTransform: "uppercase", color: ED.inkFaint, marginTop: 14,
                }}>
                  No entries in this view · begin a note or upload a document
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="tl-content"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ marginTop: 8 }}
              >
                {groupedEvents.map((group, gi) => {
                  const isOpen = !!openGroups[group.dayKey];
                  return (
                    <motion.section
                      key={group.dayKey}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(gi * 0.04, 0.4) }}
                      style={{
                        padding: "20px 0",
                        borderBottom: `1px solid ${ED.rule}`,
                      }}
                    >
                      {/* Day header — clickable for collapse */}
                      <button
                        type="button"
                        onClick={() => setOpenGroups((p) => ({ ...p, [group.dayKey]: !p[group.dayKey] }))}
                        aria-expanded={isOpen}
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: 0,
                          padding: 0,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          gap: 16,
                          textAlign: "left",
                        }}
                      >
                        <h3 style={{
                          fontFamily: ED.serif, fontSize: 28, margin: 0,
                          color: ED.ink, lineHeight: 1.1,
                        }}>
                          <span style={{
                            fontFamily: ED.mono, fontSize: 11, letterSpacing: "0.16em",
                            color: ED.inkFaint, marginRight: 14,
                          }}>
                            {group.weekday}
                          </span>
                          <span style={{ fontStyle: "italic", color: ED.accent, fontSize: 28 }}>
                            {group.date}
                          </span>
                        </h3>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                          <span style={{
                            fontFamily: ED.mono, fontSize: 10.5, letterSpacing: "0.14em",
                            textTransform: "uppercase", color: ED.inkFaint,
                          }}>
                            {group.items.length} {group.items.length === 1 ? "EVENT" : "EVENTS"}
                          </span>
                          <motion.span
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            style={{
                              display: "inline-flex", color: ED.inkFaint,
                            }}
                          >
                            <FiChevronDown size={14} />
                          </motion.span>
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            style={{ overflow: "hidden" }}
                          >
                            <div style={{ marginTop: 14 }}>
                              {group.items.map((event, i) => (
                                <EdTimelineEvent
                                  key={`${event.event_type}-${event.id}-${event.created_at}`}
                                  event={event}
                                  noteMap={noteMap}
                                  docMap={docMap}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.section>
                  );
                })}

                {/* Footer link, mirrors preview's "Earlier this week ↓" */}
                <div style={{ textAlign: "center", padding: "32px 0 0" }}>
                  <span style={{
                    fontFamily: ED.mono, fontSize: 11, letterSpacing: "0.14em",
                    textTransform: "uppercase", color: ED.inkFaint,
                  }}>
                    End of {rangeLabel.toLowerCase()} ·{" "}
                    {timelineRange !== 0 && (
                      <button
                        type="button"
                        onClick={() => setTimelineRange(timelineRange === 7 ? 30 : 0)}
                        style={{
                          background: "transparent", border: 0, padding: 0,
                          cursor: "pointer",
                          fontFamily: ED.mono, fontSize: 11, letterSpacing: "0.14em",
                          textTransform: "uppercase", color: ED.inkMute,
                          backgroundImage: `linear-gradient(${ED.inkMute}, ${ED.inkMute})`,
                          backgroundPosition: "0 100%",
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "100% 1px",
                        }}
                      >
                        Show {timelineRange === 7 ? "30 days" : "all"} ↓
                      </button>
                    )}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ═══ FOOTER MASTHEAD ═══ */}
        <footer style={{ marginTop: 80, padding: "24px 0" }}>
          <hr style={{ border: 0, borderTop: `1px solid ${ED.rule}`, margin: 0 }} />
          <div style={{
            padding: "20px 0", display: "flex",
            justifyContent: "space-between", gap: 16, flexWrap: "wrap",
            fontFamily: ED.mono, fontSize: 10.5, letterSpacing: "0.16em",
            textTransform: "uppercase", color: ED.inkFaint,
          }}>
            <span>The record, kept honestly · printed daily for one reader</span>
            <span>NOTESTREAM · § 06 · THE RECORD</span>
          </div>
        </footer>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS — editorial primitives
═══════════════════════════════════════════════════════ */

/* Ghost button matching .ed-btn-ghost in the preview */
function EdGhostButton({ children, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "9px 18px", borderRadius: 999,
        fontFamily: ED.sans, fontSize: 13, fontWeight: 500,
        border: `1px solid ${ED.rule}`,
        background: "transparent", color: ED.ink,
        cursor: "pointer", transition: "border-color .18s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = INK_HEX)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--ed-rule, #d8cfb6)")}
    >
      {children}
    </button>
  );
}

/* The 4-up newspaper stat strip cell */
function EdStat({ label, value, footnote, up = true, withRight }) {
  const arrow = footnote && footnote.startsWith("+") ? "↑" : footnote && footnote.startsWith("-") ? "↓" : null;
  const footColor = footnote && (footnote.includes("+") || up === true) && !footnote.startsWith("-")
    ? ED.accent : ED.inkFaint;
  return (
    <div
      className="ed-stat-cell"
      style={{
        padding: "28px 24px",
        borderRight: withRight ? `1px solid ${ED.rule}` : "none",
      }}
    >
      <p style={{
        fontFamily: ED.mono, fontSize: 10.5, letterSpacing: "0.18em",
        textTransform: "uppercase", color: ED.inkFaint, margin: 0,
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: ED.serif, fontStyle: "italic",
        fontSize: "clamp(40px, 4.5vw, 64px)",
        color: ED.accent, margin: "12px 0 10px", lineHeight: 1,
      }}>
        {value ?? 0}
      </p>
      {footnote ? (
        <p style={{
          fontFamily: ED.mono, fontSize: 10.5, letterSpacing: "0.14em",
          textTransform: "uppercase", color: footColor, margin: 0,
        }}>
          {arrow ? `${arrow} ` : ""}{footnote}
        </p>
      ) : (
        <p style={{
          fontFamily: ED.mono, fontSize: 10.5, letterSpacing: "0.14em",
          textTransform: "uppercase", color: ED.inkFaint, margin: 0,
        }}>—</p>
      )}
    </div>
  );
}

/* Section header used between blocks — chapter mark + title + optional controls */
function SectionHeader({ chapter, kicker, title, right }) {
  return (
    <div
      className="ed-section-head"
      style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        gap: 24, flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{
          display: "inline-flex", alignItems: "baseline", gap: 10,
          fontFamily: ED.mono, fontSize: 11, letterSpacing: "0.16em",
          textTransform: "uppercase", color: ED.inkFaint, marginBottom: 10,
        }}>
          <span style={{
            fontFamily: ED.serif, fontStyle: "italic", fontSize: 18,
            letterSpacing: 0, color: ED.accent,
          }}>
            {chapter}
          </span>
          <span>{kicker}</span>
        </div>
        <h2 style={{
          fontFamily: ED.serif, fontWeight: 400, lineHeight: 1.1,
          letterSpacing: "-0.015em",
          fontSize: "clamp(22px, 2.4vw, 32px)",
          margin: 0, color: ED.ink,
        }}>
          {title}
        </h2>
      </div>
      {right && <div style={{ minWidth: 0 }}>{right}</div>}
    </div>
  );
}

/* Clarity sub-row */
function ClarityLine({ label, value, last }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div style={{
      padding: "10px 0",
      borderBottom: last ? "none" : `1px solid ${ED.ruleSoft}`,
    }}>
      <div style={{
        display: "flex", alignItems: "baseline",
        justifyContent: "space-between", gap: 8,
      }}>
        <span style={{ fontFamily: ED.serif, fontSize: 17, color: ED.ink }}>
          {label}
        </span>
        <span className="ns-act-leader" />
        <span style={{
          fontFamily: ED.serif, fontStyle: "italic", fontSize: 20,
          color: ED.accent,
        }}>
          {v}
        </span>
        <span style={{
          fontFamily: ED.mono, fontSize: 10, color: ED.inkFaint, marginLeft: 4,
        }}>/100</span>
      </div>
      <div style={{
        height: 2, background: ED.paper200, borderRadius: 1, overflow: "hidden",
        marginTop: 6,
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.9 }}
          style={{ height: "100%", background: ED.accent }}
        />
      </div>
    </div>
  );
}

/* Legend dot for bar chart */
function LegendDot({ color, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{
        width: 8, height: 8, background: color, borderRadius: 2, display: "inline-block",
      }} />
      {label}
    </span>
  );
}

/* Chart skeleton */
function ChartSkeleton() {
  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        border: `2px solid ${ED.rule}`, borderTopColor: ACCENT_HEX,
        animation: "spin 0.9s linear infinite",
      }} />
    </div>
  );
}

/* Single timeline event row — matches .tl-event in preview */
function EdTimelineEvent({ event, noteMap, docMap }) {
  const title = getEventTitle(event, noteMap, docMap);
  const subtitle = getEventSubtitle(event);
  const kind = EVENT_KIND_LABEL[event.event_type] || (event.event_type || "ACTIVITY").toUpperCase().replace(/_/g, " ");
  const verb = EVENT_VERB[event.event_type] || "Recorded";

  return (
    <div className="ns-act-event-row">
      <span style={{
        fontFamily: ED.mono, fontSize: 10.5, letterSpacing: "0.12em",
        color: ED.inkFaint, paddingTop: 2,
      }}>
        {formatClock(event.created_at)}
        <span style={{ display: "block", marginTop: 2, fontSize: 9.5, color: ED.inkFaint, opacity: 0.7 }}>
          {formatTimeAgo(event.created_at).toUpperCase()}
        </span>
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{
          fontFamily: ED.serif, fontSize: 17, color: ED.ink, margin: 0,
          lineHeight: 1.5,
        }}>
          {verb}{" "}
          <em
            className="ns-act-event-em"
            style={{
              fontStyle: "italic", color: ED.inkSoft,
              transition: "color 0.15s ease",
            }}
          >
            {title}
          </em>
          {subtitle ? (
            <span style={{
              fontFamily: ED.sans, fontStyle: "normal", fontSize: 13,
              color: ED.inkFaint, marginLeft: 8,
            }}>
              — {subtitle}
            </span>
          ) : null}
          .
        </p>
      </div>
      <span style={{
        fontFamily: ED.mono, fontSize: 10.5, letterSpacing: "0.14em",
        textTransform: "uppercase", color: ED.inkFaint,
        whiteSpace: "nowrap", paddingTop: 4,
      }}>
        {kind}
      </span>
    </div>
  );
}
