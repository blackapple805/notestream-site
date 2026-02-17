// src/pages/Activity.jsx
// ═══════════════════════════════════════════════════════════════════
// REDESIGNED: Matching bento-glass visual system.
// All Supabase RPCs, timeline logic, chart data, trends — UNCHANGED.
// Charts improved: better gradients, fixed heights, cleaner axes.
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";
import {
  FiFileText, FiUploadCloud, FiActivity, FiZap, FiEdit3, FiClipboard,
  FiTrendingUp, FiCalendar, FiChevronDown, FiRefreshCw, FiLayers, FiLink,
  FiAlertCircle,
} from "react-icons/fi";
import { ChartLine, Fire, NotePencil, FileArrowUp, Brain, Lightning } from "phosphor-react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

/* ─── Scoped styles ─── */
const ACT_STYLES = `
@keyframes ns-act-fade-up {
  0%   { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
.ns-act-stagger > * {
  animation: ns-act-fade-up 0.4s cubic-bezier(.22,1,.36,1) both;
}
.ns-act-stagger > *:nth-child(1)  { animation-delay: 0.02s; }
.ns-act-stagger > *:nth-child(2)  { animation-delay: 0.05s; }
.ns-act-stagger > *:nth-child(3)  { animation-delay: 0.08s; }
.ns-act-stagger > *:nth-child(4)  { animation-delay: 0.11s; }
.ns-act-stagger > *:nth-child(5)  { animation-delay: 0.14s; }
.ns-act-stagger > *:nth-child(6)  { animation-delay: 0.17s; }
.ns-act-stagger > *:nth-child(7)  { animation-delay: 0.20s; }
.ns-act-stagger > *:nth-child(8)  { animation-delay: 0.23s; }
.ns-act-stagger > *:nth-child(9)  { animation-delay: 0.26s; }
.ns-act-stagger > *:nth-child(10) { animation-delay: 0.29s; }

.ns-act-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: var(--card-glass-bg, var(--bg-surface));
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--card-glass-border, var(--border-secondary));
  box-shadow: var(--card-glass-shadow, 0 8px 32px rgba(0,0,0,0.12));
}
.ns-act-card::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%);
  pointer-events: none; z-index: 1;
}
.ns-act-card::after {
  content: '';
  position: absolute;
  left: 24px; right: 24px; top: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  pointer-events: none; z-index: 2;
}

.ns-act-stat {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-secondary);
  background: var(--bg-surface);
  transition: all 0.25s cubic-bezier(.22,1,.36,1);
}
.ns-act-stat:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  border-color: rgba(99,102,241,0.25);
}

.recharts-cartesian-axis-tick-value {
  fill: var(--text-muted) !important;
  font-size: 10px !important;
}
.recharts-tooltip-wrapper {
  outline: none !important;
}
`;

/* ─── Tones (used across charts, icons, badges) ─── */
const TONES = {
  indigo:  { accent: "#6366f1", rgb: "99,102,241" },
  purple:  { accent: "#8b5cf6", rgb: "168,85,247" },
  emerald: { accent: "#10b981", rgb: "16,185,129" },
  cyan:    { accent: "#06b6d4", rgb: "6,182,212" },
  amber:   { accent: "#f59e0b", rgb: "245,158,11" },
  orange:  { accent: "#f97316", rgb: "249,115,22" },
  rose:    { accent: "#f43f5e", rgb: "244,63,94" },
  sky:     { accent: "#38bdf8", rgb: "56,189,248" },
  pink:    { accent: "#ec4899", rgb: "236,72,153" },
};

/* ─── Utility functions (unchanged) ─── */
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
function safeJson(val) { if (!val) return {}; if (typeof val === "object") return val; try { return JSON.parse(val); } catch { return {}; } }
function toNum(v) { if (v === null || v === undefined) return null; const n = Number(v); return Number.isFinite(n) ? n : null; }
function localDayKeyFromEvent(event) {
  const d = new Date(event?.created_at || Date.now()); if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function labelForDayKey(dayKey) {
  if (!dayKey || dayKey === "unknown") return "Unknown";
  const [yy, mm, dd] = dayKey.split("-").map(Number); const date = new Date(yy, (mm || 1) - 1, dd || 1);
  const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((today - new Date(date.getFullYear(), date.getMonth(), date.getDate())) / 86400000);
  if (diffDays === 0) return "TODAY"; if (diffDays === 1) return "YESTERDAY";
  if (diffDays > 1 && diffDays < 7) return date.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase();
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
}
function getEventTitle(event, noteMap, docMap) {
  if (!event) return "Activity";
  if (event.title?.trim() && event.title !== "null") return event.title.trim();
  const md = event.metadata || {};
  for (const k of ["title", "name", "note_title", "doc_name", "file_name"]) { if (md[k]?.trim()) return md[k].trim(); }
  const entityId = event.entity_id;
  if (entityId) { if (noteMap?.has(entityId)) { const n = noteMap.get(entityId); if (n?.title?.trim()) return n.title.trim(); } if (docMap?.has(entityId)) { const d = docMap.get(entityId); if (d?.name?.trim()) return d.name.trim(); if (d?.file_name?.trim()) return d.file_name.trim(); } }
  const typeDefaults = { doc_uploaded: "Document uploaded", note_created: "New note created", note_updated: "Note updated", ai_summary: "AI summary generated", ai_used: "AI assistant used", synthesis: "Document synthesis", integration_sync: "Integration synced" };
  return typeDefaults[event.event_type] || String(event.event_type || "activity").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function getEventSubtitle(event) {
  if (!event) return null; const md = event.metadata || {}; const type = event.event_type;
  if (type === "doc_uploaded" && (md.type || md.file_type)) return `${(md.type || md.file_type).toUpperCase()} file`;
  if (type === "ai_summary" && md.word_count) return `${md.word_count} words summarized`;
  if (type === "note_updated" && md.changes) return `${md.changes} changes made`;
  if (md.source) return `From ${md.source}`; return null;
}

/* ─── Constants (unchanged) ─── */
const typeFilters = [
  { label: "All", value: "all" }, { label: "Uploads", value: "doc_uploaded" }, { label: "Summaries", value: "ai_summary" },
  { label: "Notes", value: "notes" }, { label: "Updates", value: "updates" }, { label: "Integration", value: "integration_sync" },
];
const eventIcons = { note_created: NotePencil, note_updated: FiEdit3, doc_uploaded: FileArrowUp, ai_summary: Brain, synthesis: FiLayers, integration_sync: FiLink, ai_used: Lightning };
const actionColors = {
  ai_summary:        { rgb: "99,102,241"  },
  doc_uploaded:      { rgb: "16,185,129"  },
  note_created:      { rgb: "168,85,247"  },
  note_updated:      { rgb: "245,158,11"  },
  integration_sync:  { rgb: "56,189,248"  },
  synthesis:         { rgb: "99,102,241"  },
  ai_used:           { rgb: "236,72,153"  },
};
const defaultChartData = [
  { name: "Mon", notes: 0, summaries: 0, uploads: 0 }, { name: "Tue", notes: 0, summaries: 0, uploads: 0 },
  { name: "Wed", notes: 0, summaries: 0, uploads: 0 }, { name: "Thu", notes: 0, summaries: 0, uploads: 0 },
  { name: "Fri", notes: 0, summaries: 0, uploads: 0 }, { name: "Sat", notes: 0, summaries: 0, uploads: 0 },
  { name: "Sun", notes: 0, summaries: 0, uploads: 0 },
];
const defaultStreakDays = [ { day: "Mon", active: false }, { day: "Tue", active: false }, { day: "Wed", active: false }, { day: "Thu", active: false }, { day: "Fri", active: false }, { day: "Sat", active: false }, { day: "Sun", active: false } ];
const TIMELINE_ALLOWED_TYPES = new Set(["note_created", "note_updated", "doc_uploaded", "ai_summary", "ai_used", "integration_sync", "synthesis"]);

/* ─── Chart helpers ─── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 shadow-xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-secondary)", backdropFilter: "blur(12px)" }}>
      <p className="text-[11px] font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
          <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{e.name}: <span className="font-bold" style={{ color: "var(--text-primary)" }}>{e.value}</span></p>
        </div>
      ))}
    </div>
  );
};
const AnimatedDot = (props) => (
  <motion.circle cx={props.cx} cy={props.cy} r={5} fill="#fff" stroke="#6366f1" strokeWidth={2.5}
    initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }} />
);

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT — all RPC logic unchanged
═══════════════════════════════════════════════════════ */
export default function Activity() {
  const supabaseReady = typeof isSupabaseConfigured === "function" ? isSupabaseConfigured() : !!isSupabaseConfigured;

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

  /* ── Load stats + charts (follows chartRange) ── */
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
  }, [getUser, supabaseReady, statDays, chartDays]);

  /* ── Load timeline (follows timelineRange + typeFilter) ── */
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
  }, [getUser, supabaseReady, timelineRange, typeFilter]);

  const handleRefresh = useCallback(() => { loadActivityData(); loadTimeline(); }, [loadActivityData, loadTimeline]);
  useEffect(() => { loadActivityData(); }, [loadActivityData]);
  useEffect(() => { loadTimeline(); }, [loadTimeline]);

  const groupedEvents = useMemo(() => {
    const byDay = new Map();
    for (const e of timelineEvents) { const k = e.day_key || localDayKeyFromEvent(e); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(e); }
    return Array.from(byDay.keys()).sort((a, b) => (a < b ? 1 : -1)).map((k) => ({ dayKey: k, label: labelForDayKey(k), items: (byDay.get(k) || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) }));
  }, [timelineEvents]);

  useEffect(() => { if (!groupedEvents.length) return; setOpenGroups((prev) => { const next = { ...prev }; for (const g of groupedEvents) { if (next[g.dayKey] === undefined) next[g.dayKey] = g.label === "TODAY" || g.label === "YESTERDAY"; } return next; }); }, [groupedEvents]);

  const chartData = dailyData;

  /* ── Loading state ── */
  if (loading) {
    return (
      <>
        <style>{ACT_STYLES}</style>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full" style={{ border: "2.5px solid transparent", borderTopColor: "rgba(99,102,241,0.8)", borderRightColor: "rgba(168,85,247,0.4)", animation: "spin 0.8s linear infinite" }} />
            <div className="absolute inset-2 rounded-full" style={{ border: "2px solid transparent", borderBottomColor: "rgba(6,182,212,0.6)", animation: "spin 1.2s linear infinite reverse" }} />
            <ChartLine size={20} weight="duotone" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading activity…</p>
        </div>
      </>
    );
  }

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <>
      <style>{ACT_STYLES}</style>

      <div className="space-y-5 pb-[calc(var(--mobile-nav-height)+24px)] ns-act-stagger">

        {/* ── HEADER ── */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.12))", border: "1px solid rgba(99,102,241,0.28)" }}>
              <ChartLine weight="duotone" size={22} className="text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Activity</h1>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Track your productivity patterns</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg flex-shrink-0"
            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </header>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard title={`Notes (${statDays}d)`} value={stats.notes_count} icon={<FiFileText size={17} />} tone="indigo" trend={fmtPct(trends.notes_pct)} up={isUp(trends.notes_pct)} />
          <StatCard title={`AI Activity (${statDays}d)`} value={stats.ai_activity_count} icon={<FiZap size={17} />} tone="amber" trend={fmtPct(trends.ai_activity_pct)} up={isUp(trends.ai_activity_pct)} />
          <StatCard title="Day Streak" value={stats.streak_days} sub="Keep it going!" icon={<Fire size={17} weight="fill" />} tone="orange" />
          <StatCard title={`Uploads (${statDays}d)`} value={stats.uploads_count} icon={<FiUploadCloud size={17} />} tone="emerald" trend={fmtPct(trends.uploads_pct)} up={isUp(trends.uploads_pct)} />
        </div>

        {/* ── STREAK ── */}
        <div className="ns-act-card">
          <div className="relative z-10 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <ToneTile tone="orange" size={32}><Fire size={15} weight="fill" /></ToneTile>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Weekly Activity</h3>
              </div>
              <Badge>7-day view</Badge>
            </div>
            <StreakDots days={streakDays} />
          </div>
        </div>

        {/* ── CHARTS ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">

          {/* Main Area Chart */}
          <div className="ns-act-card">
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(600px 200px at 15% -10%, rgba(99,102,241,0.12), transparent 60%)" }} />
            <div className="relative z-10 p-4 flex flex-col h-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <ToneTile tone="indigo" size={36}><FiTrendingUp size={16} /></ToneTile>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Insights Over Time</h3>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Productivity trends</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {["notes", "summaries"].map((tab) => <Pill key={tab} active={chartTab === tab} onClick={() => setChartTab(tab)}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Pill>)}
                </div>
              </div>
              <div className="flex gap-1.5 mb-3">
                {["week", "month"].map((r) => <Pill key={r} active={chartRange === r} onClick={() => setChartRange(r)} small>{r === "week" ? "This Week" : "This Month"}</Pill>)}
              </div>

              {/* Chart container */}
              <div className="rounded-2xl p-2 flex-1" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)" }}>
                <div style={{ width: "100%", height: "100%", minHeight: chartRange === "month" ? 220 : 200 }}>
                  {chartsReady ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={200}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="areaStroke" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="60%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#a78bfa" />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 10 }} width={28} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey={chartTab} stroke="url(#areaStroke)" strokeWidth={2.5} fill="url(#areaFill)"
                          dot={(p) => p.index === chartData.length - 1 ? <AnimatedDot {...p} /> : null}
                          activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center"><div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}
                </div>
              </div>

              {/* Mini sparkline */}
              <div className="mt-3 rounded-2xl p-3" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ToneTile tone="emerald" size={28}><FiUploadCloud size={12} /></ToneTile>
                    <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>Uploads</p>
                  </div>
                  <Badge>sparkline</Badge>
                </div>
                <div style={{ width: "100%", height: 72 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.length ? chartData : defaultChartData}>
                      <defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.03} /></linearGradient></defs>
                      <XAxis dataKey="name" hide /> <YAxis hide />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="uploads" stroke="#10b981" strokeWidth={2} fill="url(#sparkFill)" dot={false} activeDot={{ r: 3, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} name="Uploads" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Breakdown */}
          <div className="ns-act-card">
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(600px 200px at 85% -10%, rgba(6,182,212,0.1), transparent 60%)" }} />
            <div className="relative z-10 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ToneTile tone="cyan" size={36}><FiClipboard size={16} /></ToneTile>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Usage Breakdown</h3>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>How you use NoteStream</p>
                  </div>
                </div>
                <Badge>Last {statDays}d</Badge>
              </div>
              <div className="space-y-3">
                {usageBreakdown.length === 0 ? (
                  <p className="text-[12px] py-6 text-center" style={{ color: "var(--text-muted)" }}>No category data yet</p>
                ) : usageBreakdown.map((item, i) => {
                  const label = String(item.label || "").toLowerCase();
                  const tone = label.includes("meeting") ? "indigo" : label.includes("study") ? "purple" : label.includes("task") ? "cyan" : label.includes("personal") ? "emerald" : "indigo";
                  const t = TONES[tone]; const val = Number(item.value) || 0;
                  return (
                    <div key={`${item.label}-${i}`} className="rounded-2xl p-3" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <ToneTile tone={tone} size={32}><FiClipboard size={13} /></ToneTile>
                          <span className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                        </div>
                        <span className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>{val}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-input)", border: "1px solid var(--border-secondary)" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 0.8, delay: i * 0.08 }}
                          className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${t.accent}, rgba(255,255,255,0.4))`, boxShadow: `0 0 12px rgba(${t.rgb},0.2)` }} />
                      </div>
                      <p className="mt-1.5 text-[10px]" style={{ color: "var(--text-muted)" }}>{Number(item.count) || 0} note{Number(item.count) === 1 ? "" : "s"}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── CLARITY + BAR CHART ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Clarity Score */}
          <div className="ns-act-card">
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(500px 200px at 10% -10%, rgba(99,102,241,0.12), transparent 60%)" }} />
            <div className="relative z-10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ToneTile tone="indigo" size={36}><FiZap size={16} /></ToneTile>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Clarity Score</h3>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>AI-assessed note quality</p>
                  </div>
                </div>
                <ClarityRing value={clarity.total_score} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <ClarityMini label="Readability" value={clarity.readability} tone="indigo" />
                <ClarityMini label="Structure" value={clarity.structure} tone="purple" />
                <ClarityMini label="Completeness" value={clarity.completeness} tone="emerald" />
              </div>
            </div>
          </div>

          {/* Daily Bar Chart */}
          <div className="ns-act-card">
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(500px 200px at 85% -10%, rgba(168,85,247,0.1), transparent 60%)" }} />
            <div className="relative z-10 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <ToneTile tone="purple" size={36}><FiActivity size={16} /></ToneTile>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Daily Breakdown</h3>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Notes vs Summaries</p>
                  </div>
                </div>
                <Badge>{chartDays}d</Badge>
              </div>
              <div className="rounded-2xl p-2" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)" }}>
                <div style={{ width: "100%", height: 152 }}>
                  {chartsReady ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={200}>
                      <BarChart data={chartData} barGap={4}>
                        <defs>
                          <linearGradient id="barN" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0.2} /></linearGradient>
                          <linearGradient id="barS" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.85} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.18} /></linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="notes" fill="url(#barN)" radius={[5, 5, 0, 0]} name="Notes" />
                        <Bar dataKey="summaries" fill="url(#barS)" radius={[5, 5, 0, 0]} name="Summaries" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center"><div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTIVITY TIMELINE ── */}
        <div className="ns-act-card">
          <div className="relative z-10 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <ToneTile tone="sky" size={32}><FiCalendar size={14} /></ToneTile>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Activity Timeline</h3>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {timelineEvents.length} event{timelineEvents.length === 1 ? "" : "s"}
                    {timelineRange > 0 ? ` · last ${timelineRange}d` : " · all time"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <motion.button onClick={handleRefresh} disabled={timelineLoading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="h-8 w-8 rounded-xl flex items-center justify-center transition disabled:opacity-40"
                  style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-muted)" }}>
                  <motion.div animate={{ rotate: timelineLoading ? 360 : 0 }} transition={{ duration: 1, repeat: timelineLoading ? Infinity : 0, ease: "linear" }}><FiRefreshCw size={13} /></motion.div>
                </motion.button>
                {[7, 30, 0].map((n) => <Pill key={n} active={timelineRange === n} onClick={() => setTimelineRange(n)}>{n === 0 ? "All" : `${n}d`}</Pill>)}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {typeFilters.map((f) => <Pill key={f.value} active={typeFilter === f.value} onClick={() => setTypeFilter(f.value)}>{f.label}</Pill>)}
            </div>

            {timelineError && (
              <div className="mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
                <FiAlertCircle size={15} style={{ color: "#f43f5e" }} />
                <p className="text-[12px]" style={{ color: "#f43f5e" }}>{timelineError}</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {timelineLoading ? (
                <motion.div key="tl-load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Loading timeline…</p>
                </motion.div>
              ) : groupedEvents.length === 0 ? (
                <motion.div key="tl-empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center py-10">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)" }}>
                    <FiActivity size={18} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No activity in this view</p>
                  <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>Start creating notes or uploading documents!</p>
                </motion.div>
              ) : (
                <motion.div key="tl-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                  {groupedEvents.map((group, gi) => (
                    <motion.section key={group.dayKey} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.06 }}
                      className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-secondary)" }}>
                      <button type="button" onClick={() => setOpenGroups((p) => ({ ...p, [group.dayKey]: !p[group.dayKey] }))}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 transition" aria-expanded={!!openGroups[group.dayKey]}
                        style={{ background: "transparent" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Badge>{group.label}</Badge>
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{group.items.length} event{group.items.length === 1 ? "" : "s"}</span>
                        </div>
                        <motion.div animate={{ rotate: openGroups[group.dayKey] ? 180 : 0 }} transition={{ duration: 0.2 }}
                          className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-muted)" }}>
                          <FiChevronDown size={14} />
                        </motion.div>
                      </button>
                      <AnimatePresence initial={false}>
                        {!!openGroups[group.dayKey] && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                            <div className="px-4 pb-4">
                              <ol className="relative space-y-2.5 pt-2">
                                {group.items.map((event, i) => <TimelineRow key={`${event.event_type}-${event.id}-${event.created_at}`} event={event} index={i} isLast={i === group.items.length - 1} noteMap={noteMap} docMap={docMap} />)}
                              </ol>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.section>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════ */

/* ── Tone Tile (icon container) ── */
function ToneTile({ tone = "indigo", size = 36, children }) {
  const t = TONES[tone] || TONES.indigo;
  return (
    <div className="rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, background: `rgba(${t.rgb},0.1)`, border: `1px solid rgba(${t.rgb},0.25)`, color: t.accent, boxShadow: `0 6px 20px rgba(${t.rgb},0.12)` }}>
      {children}
    </div>
  );
}

/* ── Badge ── */
function Badge({ children }) {
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-muted)" }}>{children}</span>;
}

/* ── Pill (toggle button) ── */
function Pill({ children, active, onClick, small }) {
  return (
    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClick} type="button"
      className={`rounded-lg font-bold transition ${small ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-[11px]"}`}
      style={active
        ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", boxShadow: "0 2px 10px rgba(99,102,241,0.25)" }
        : { background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-muted)" }}>
      {children}
    </motion.button>
  );
}

/* ── Stat Card ── */
function StatCard({ title, value, sub, icon, tone = "indigo", trend, up }) {
  const t = TONES[tone] || TONES.indigo;
  return (
    <div className="ns-act-stat p-4">
      <div className="flex items-center justify-between mb-2.5">
        <ToneTile tone={tone} size={34}>{icon}</ToneTile>
        {trend && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1"
            style={up ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" } : { background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", color: "#f43f5e" }}>
            <FiTrendingUp size={9} className={!up ? "rotate-180" : ""} /> {trend}
          </span>
        )}
      </div>
      <h2 className="text-2xl font-extrabold" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{value}</h2>
      <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>{title}</p>
      {sub && <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.6 }}>{sub}</p>}
    </div>
  );
}

/* ── Streak Dots ── */
function StreakDots({ days }) {
  return (
    <div className="flex items-center justify-between gap-1">
      {days.map((d, i) => (
        <motion.div key={i} className="flex flex-col items-center gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
          <motion.div whileHover={{ scale: 1.1 }}
            className="h-10 w-10 rounded-full flex items-center justify-center transition"
            style={d.active
              ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)", color: "#fff" }
              : { background: "var(--bg-tertiary)", border: "2px dashed var(--border-secondary)" }}>
            {d.active && <Fire size={15} weight="fill" />}
          </motion.div>
          <span className="text-[10px] font-medium" style={{ color: d.active ? "var(--text-secondary)" : "var(--text-muted)" }}>{d.day}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Clarity Ring ── */
function ClarityRing({ value }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const C = 2 * Math.PI * 36; const offset = C - (v / 100) * C;
  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" stroke="var(--bg-tertiary)" strokeWidth="6" fill="none" />
        <defs><linearGradient id="clarGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
        <motion.circle cx="40" cy="40" r="36" stroke="url(#clarGrad)" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>{v}%</span>
      </div>
    </div>
  );
}

/* ── Clarity Mini Stat ── */
function ClarityMini({ label, value, tone = "indigo" }) {
  const t = TONES[tone] || TONES.indigo;
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl p-3 text-center"
      style={{ background: `rgba(${t.rgb},0.08)`, border: `1px solid rgba(${t.rgb},0.2)` }}>
      <p className="text-xl font-extrabold" style={{ color: "var(--text-primary)" }}>{value || 0}%</p>
      <p className="text-[10px] font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
    </motion.div>
  );
}

/* ── Timeline Row ── */
function TimelineRow({ event, index, isLast, noteMap, docMap }) {
  const Icon = eventIcons[event.event_type] || FiActivity;
  const ac = actionColors[event.event_type] || actionColors.note_created;
  const rgb = ac.rgb;
  const title = getEventTitle(event, noteMap, docMap);
  const subtitle = getEventSubtitle(event);
  const isPhosphor = Icon === NotePencil || Icon === FileArrowUp || Icon === Brain || Icon === Lightning;

  return (
    <motion.li className="relative pl-12" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: index * 0.04 }}>
      {!isLast && <div className="absolute left-[18px] top-[42px] bottom-[-8px] w-[2px]" style={{ background: `linear-gradient(to bottom, rgba(${rgb},0.25), transparent)` }} />}
      <motion.div className="absolute left-0 top-2 h-9 w-9 rounded-xl flex items-center justify-center"
        style={{ background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.25)`, boxShadow: `0 4px 16px rgba(${rgb},0.12)` }}
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: index * 0.04 + 0.1 }} whileHover={{ scale: 1.1 }}>
        {isPhosphor ? <Icon size={15} weight="duotone" style={{ color: `rgb(${rgb})` }} /> : <Icon size={15} style={{ color: `rgb(${rgb})` }} />}
      </motion.div>
      <div className="rounded-2xl px-4 py-3 transition" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-secondary)" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.boxShadow = `0 4px 16px rgba(${rgb},0.08)`; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.boxShadow = "none"; }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{title}</p>
            {subtitle && <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
          </div>
          <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-lg" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {formatTimeAgo(event.created_at)}
          </span>
        </div>
        <div className="mt-2">
          <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-lg"
            style={{ background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.2)`, color: `rgb(${rgb})` }}>
            {(event.event_type || "activity").replace(/_/g, " ")}
          </span>
        </div>
      </div>
    </motion.li>
  );
}



