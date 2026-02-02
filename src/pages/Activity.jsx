// src/pages/Activity.jsx
// ✅ Uses get_daily_activity for charts
// ✅ Timeline uses get_activity_timeline which returns day_date (date grouping correctness)
// ✅ Filters out deleted notes/docs (server does; client also safety-checks)
// ✅ Dedupe (server does; client also safety-checks)

import { useState, useMemo, useEffect, useCallback } from "react";
import GlassCard from "../components/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  FiFileText,
  FiUploadCloud,
  FiActivity,
  FiZap,
  FiEdit3,
  FiClipboard,
  FiTrendingUp,
  FiCalendar,
  FiChevronDown,
  FiRefreshCw,
  FiLayers,
  FiLink,
  FiAlertCircle,
} from "react-icons/fi";
import {
  ChartLine,
  Fire,
  NotePencil,
  FileArrowUp,
  Brain,
  Lightning,
} from "phosphor-react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

/* -----------------------------------------
   Utility Functions
----------------------------------------- */
function formatTimeAgo(dateStr) {
  if (!dateStr) return "Just now";

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;

  if (isNaN(diffMs)) return "Recently";

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffSecs < 30) return "Just now";
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function safeJson(val) {
  if (!val) return {};
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return {};
  }
}

// Convert an event into a local YYYY-MM-DD key for grouping.
function localDayKeyFromEvent(event) {
  // Prefer day_date returned from RPC (UTC date).
  // But UI should group by *local* day, so we still derive from created_at for accuracy.
  const d = new Date(event?.created_at || Date.now());
  if (Number.isNaN(d.getTime())) return "unknown";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function labelForDayKey(dayKey) {
  if (!dayKey || dayKey === "unknown") return "Unknown";

  const [yy, mm, dd] = dayKey.split("-").map((x) => Number(x));
  const date = new Date(yy, (mm || 1) - 1, dd || 1);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.floor((today - that) / 86400000);

  if (diffDays === 0) return "TODAY";
  if (diffDays === 1) return "YESTERDAY";

  // within last 7 days -> weekday
  if (diffDays > 1 && diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase();
  }

  // older -> full date
  return date
    .toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}

// Get display title from event - handles all possible sources
function getEventTitle(event, noteMap, docMap) {
  if (!event) return "Activity";

  if (event.title && String(event.title).trim() && event.title !== "null") {
    return String(event.title).trim();
  }

  const md = event.metadata || {};
  if (md.title && String(md.title).trim()) return String(md.title).trim();
  if (md.name && String(md.name).trim()) return String(md.name).trim();
  if (md.note_title && String(md.note_title).trim()) return String(md.note_title).trim();
  if (md.doc_name && String(md.doc_name).trim()) return String(md.doc_name).trim();
  if (md.file_name && String(md.file_name).trim()) return String(md.file_name).trim();

  const entityId = event.entity_id;
  if (entityId) {
    if (noteMap && noteMap.has(entityId)) {
      const note = noteMap.get(entityId);
      if (note.title && String(note.title).trim()) return String(note.title).trim();
    }
    if (docMap && docMap.has(entityId)) {
      const doc = docMap.get(entityId);
      if (doc.name && String(doc.name).trim()) return String(doc.name).trim();
      if (doc.file_name && String(doc.file_name).trim()) return String(doc.file_name).trim();
    }
  }

  const type = event.event_type || "activity";
  const typeDefaults = {
    doc_uploaded: "Document uploaded",
    note_created: "New note created",
    note_updated: "Note updated",
    ai_summary: "AI summary generated",
    ai_used: "AI assistant used",
    synthesis: "Document synthesis",
    integration_sync: "Integration synced",
  };

  return (
    typeDefaults[type] ||
    String(type).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function getEventSubtitle(event) {
  if (!event) return null;
  const md = event.metadata || {};
  const type = event.event_type;

  if (type === "doc_uploaded") {
    if (md.type) return `${String(md.type).toUpperCase()} file`;
    if (md.file_type) return `${String(md.file_type).toUpperCase()} file`;
  }
  if (type === "ai_summary" && md.word_count) return `${md.word_count} words summarized`;
  if (type === "note_updated" && md.changes) return `${md.changes} changes made`;
  if (md.source) return `From ${md.source}`;

  return null;
}

/* -----------------------------------------
   Filters / Icons / Styles
----------------------------------------- */
const typeFilters = [
  { label: "All", value: "all" },
  { label: "Uploads", value: "doc_uploaded" },
  { label: "Summaries", value: "ai_summary" },
  { label: "Notes", value: "notes" },
  { label: "Updates", value: "updates" },
  { label: "Integration", value: "integration_sync" },
];

const eventIcons = {
  note_created: NotePencil,
  note_updated: FiEdit3,
  doc_uploaded: FileArrowUp,
  ai_summary: Brain,
  synthesis: FiLayers,
  integration_sync: FiLink,
  ai_used: Lightning,
};

const actionStyles = {
  ai_summary: {
    bg: "rgba(99,102,241,0.14)",
    border: "rgba(99,102,241,0.28)",
    icon: "var(--accent-indigo)",
    glow: "rgba(99,102,241,0.18)",
  },
  doc_uploaded: {
    bg: "rgba(16,185,129,0.14)",
    border: "rgba(16,185,129,0.28)",
    icon: "var(--accent-emerald)",
    glow: "rgba(16,185,129,0.16)",
  },
  note_created: {
    bg: "rgba(168,85,247,0.14)",
    border: "rgba(168,85,247,0.28)",
    icon: "var(--accent-purple)",
    glow: "rgba(168,85,247,0.16)",
  },
  note_updated: {
    bg: "rgba(245,158,11,0.14)",
    border: "rgba(245,158,11,0.28)",
    icon: "rgba(245,158,11,1)",
    glow: "rgba(245,158,11,0.16)",
  },
  integration_sync: {
    bg: "rgba(56,189,248,0.14)",
    border: "rgba(56,189,248,0.28)",
    icon: "rgba(56,189,248,1)",
    glow: "rgba(56,189,248,0.14)",
  },
  synthesis: {
    bg: "rgba(99,102,241,0.14)",
    border: "rgba(99,102,241,0.28)",
    icon: "var(--accent-indigo)",
    glow: "rgba(99,102,241,0.18)",
  },
  ai_used: {
    bg: "rgba(236,72,153,0.14)",
    border: "rgba(236,72,153,0.28)",
    icon: "rgba(236,72,153,1)",
    glow: "rgba(236,72,153,0.16)",
  },
};

/* -----------------------------------------
   Default/fallback data
----------------------------------------- */
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
  { day: "Mon", active: false },
  { day: "Tue", active: false },
  { day: "Wed", active: false },
  { day: "Thu", active: false },
  { day: "Fri", active: false },
  { day: "Sat", active: false },
  { day: "Sun", active: false },
];

/* -----------------------------------------
   Animated Dot for Charts
----------------------------------------- */
const AnimatedDot = (props) => {
  const { cx, cy } = props;
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={5}
      fill="#fff"
      stroke="var(--accent-indigo, #6366f1)"
      strokeWidth={2}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    />
  );
};

/* -----------------------------------------
   Custom Tooltip
----------------------------------------- */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl px-3 py-2.5 shadow-xl border backdrop-blur-sm"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border-secondary)",
        }}
      >
        <p className="text-xs font-medium text-theme-primary mb-1.5">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <p className="text-xs text-theme-secondary">
              {entry.name}:{" "}
              <span className="font-semibold text-theme-primary">{entry.value}</span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/* -----------------------------------------
   Timeline Row Component
----------------------------------------- */
const TimelineRow = ({ event, index, isLast, noteMap, docMap }) => {
  const Icon = eventIcons[event.event_type] || FiActivity;
  const s = actionStyles[event.event_type] || actionStyles.note_created;
  const title = getEventTitle(event, noteMap, docMap);
  const subtitle = getEventSubtitle(event);
  const isPhosphor = typeof Icon !== "function" || Icon.$$typeof;

  return (
    <motion.li
      className="relative pl-12"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {!isLast && (
        <div
          className="absolute left-[18px] top-[44px] bottom-[-12px] w-[2px]"
          style={{ background: `linear-gradient(to bottom, ${s.border}, transparent)` }}
          aria-hidden="true"
        />
      )}

      <motion.div
        className="absolute left-0 top-2 h-9 w-9 rounded-xl border flex items-center justify-center"
        style={{
          backgroundColor: s.bg,
          borderColor: s.border,
          boxShadow: `0 8px 24px ${s.glow}`,
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: index * 0.05 + 0.1, duration: 0.2 }}
        whileHover={{ scale: 1.1 }}
      >
        {isPhosphor ? (
          <Icon size={16} weight="duotone" style={{ color: s.icon }} />
        ) : (
          <Icon size={16} style={{ color: s.icon }} />
        )}
      </motion.div>

      <motion.div
        className="rounded-2xl border px-4 py-3.5 transition-all hover:border-opacity-60"
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          borderColor: "var(--border-secondary)",
        }}
        whileHover={{
          backgroundColor: "rgba(255,255,255,0.05)",
          boxShadow: `0 4px 20px ${s.glow}`,
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-theme-primary truncate">{title}</p>
            {subtitle && <p className="text-[11px] text-theme-muted mt-0.5 truncate">{subtitle}</p>}
          </div>

          <motion.span
            className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "var(--border-secondary)",
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.15 }}
          >
            {formatTimeAgo(event.created_at)}
          </motion.span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span
            className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: s.bg,
              color: s.icon,
              border: `1px solid ${s.border}`,
            }}
          >
            {(event.event_type || "activity").replace(/_/g, " ")}
          </span>
        </div>
      </motion.div>
    </motion.li>
  );
};

/* -----------------------------------------
   Neon Tone Styles + IconTile
----------------------------------------- */
const toneStyles = {
  indigo: {
    text: "text-indigo-400",
    bg: "rgba(99,102,241,0.12)",
    border: "rgba(99,102,241,0.22)",
    glow: "rgba(99,102,241,0.18)",
    solid: "var(--accent-indigo, #6366f1)",
    soft: "rgba(99,102,241,0.16)",
  },
  purple: {
    text: "text-purple-400",
    bg: "rgba(168,85,247,0.12)",
    border: "rgba(168,85,247,0.22)",
    glow: "rgba(168,85,247,0.16)",
    solid: "var(--accent-purple, #8b5cf6)",
    soft: "rgba(168,85,247,0.16)",
  },
  emerald: {
    text: "text-emerald-400",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.22)",
    glow: "rgba(16,185,129,0.14)",
    solid: "var(--accent-emerald, #10b981)",
    soft: "rgba(16,185,129,0.16)",
  },
  cyan: {
    text: "text-cyan-400",
    bg: "rgba(6,182,212,0.12)",
    border: "rgba(6,182,212,0.22)",
    glow: "rgba(6,182,212,0.14)",
    solid: "rgba(6,182,212,1)",
    soft: "rgba(6,182,212,0.16)",
  },
};

const IconTile = ({ children, tone = "indigo", size = "md" }) => {
  const sizes = { sm: "h-10 w-10 rounded-xl", md: "h-11 w-11 rounded-xl" };
  const t = toneStyles[tone] || toneStyles.indigo;

  return (
    <div
      className={`${sizes[size]} border flex items-center justify-center ${t.text}`}
      style={{
        backgroundColor: t.bg,
        borderColor: t.border,
        boxShadow: `0 10px 30px ${t.glow}`,
      }}
    >
      {children}
    </div>
  );
};

/* -----------------------------------------
   Activity Component (MAIN)
----------------------------------------- */
export default function Activity() {
  const supabaseReady =
    typeof isSupabaseConfigured === "function"
      ? isSupabaseConfigured()
      : !!isSupabaseConfigured;

  const [range, setRange] = useState(7);
  const [typeFilter, setTypeFilter] = useState("all");
  const [chartTab, setChartTab] = useState("notes");
  const [chartRange, setChartRange] = useState("week");
  const [chartsReady, setChartsReady] = useState(false);

  const [usageBreakdown, setUsageBreakdown] = useState([]);
  const [clarity, setClarity] = useState({
    total_score: 0,
    readability: 0,
    structure: 0,
    completeness: 0,
  });

  const [openGroups, setOpenGroups] = useState({});

  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState(null);

  const [stats, setStats] = useState({
    notes_count: 0,
    ai_summaries_count: 0,
    uploads_count: 0,
    streak_days: 0,
    active_days_count: 0,
  });

  const [dailyData, setDailyData] = useState(defaultChartData);
  const [streakDays, setStreakDays] = useState(defaultStreakDays);
  const [timelineEvents, setTimelineEvents] = useState([]);

  const [noteMap, setNoteMap] = useState(new Map());
  const [docMap, setDocMap] = useState(new Map());

  useEffect(() => {
    const timer = setTimeout(() => setChartsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const chartDays = chartRange === "month" ? 30 : 7;

  const getUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data?.user) throw new Error("Not authenticated");
    return data.user;
  }, []);

  const firstRow = (data) => (Array.isArray(data) ? data[0] : data);

  // ✅ SECTION 1: loadActivityData (only changes: stats coercion + deps include chartRange)
  const loadActivityData = useCallback(async () => {
    if (!supabaseReady || !supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const user = await getUser();

      const { data: statsData, error: statsError } = await supabase.rpc("get_activity_stats", {
        p_user_id: user.id,
        p_days: range,
      });
      if (statsError) console.error("Stats error:", statsError);
      const statsRow = firstRow(statsData);

      // ✅ FIX: force numbers (RPC returns bigint -> can arrive as string)
      setStats({
        notes_count: Number(statsRow?.notes_count) || 0,
        ai_summaries_count: Number(statsRow?.ai_summaries_count) || 0,
        uploads_count: Number(statsRow?.uploads_count) || 0,
        streak_days: Number(statsRow?.streak_days) || 0,
        active_days_count: Number(statsRow?.active_days_count) || 0,
      });

      const { data: dailyDataResult, error: dailyError } = await supabase.rpc("get_daily_activity", {
        p_user_id: user.id,
        p_days: chartDays,
      });
      if (dailyError) console.error("Daily activity error:", dailyError);
      if (dailyDataResult && dailyDataResult.length > 0) {
        setDailyData(
          dailyDataResult.map((d) => ({
            name: d.day_name,
            notes: Number(d.notes_count) || 0,
            summaries: Number(d.summaries_count) || 0,
            uploads: Number(d.uploads_count) || 0,
          }))
        );
      }

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles";
      const { data: streakData, error: streakError } = await supabase.rpc("get_weekly_streak", {
        p_user_id: user.id,
        p_tz: tz,
      });
      if (streakError) console.error("Streak error:", streakError);
      if (streakData && streakData.length > 0) {
        setStreakDays(
          streakData.map((d) => ({
            day: d.day_name,
            active: !!d.was_active,
          }))
        );
      }

      const { data: usageData, error: usageErr } = await supabase.rpc("get_usage_breakdown", {
        p_user_id: user.id,
        p_days: range,
      });
      if (usageErr) console.error("Usage breakdown error:", usageErr);
      setUsageBreakdown(usageData || []);

      const { data: clarityData, error: clarityErr } = await supabase.rpc("get_clarity_score", {
        p_user_id: user.id,
        p_days: range,
      });
      if (clarityErr) console.error("Clarity score error:", clarityErr);
      const clarityRow = firstRow(clarityData);
      setClarity({
        total_score: Number(clarityRow?.total_score) || 0,
        readability: Number(clarityRow?.readability) || 0,
        structure: Number(clarityRow?.structure) || 0,
        completeness: Number(clarityRow?.completeness) || 0,
      });
    } catch (err) {
      console.error("Failed to load activity data:", err);
    } finally {
      setLoading(false);
    }
  }, [getUser, range, chartDays, chartRange, supabaseReady]);

  const loadTimeline = useCallback(async () => {
    if (!supabaseReady || !supabase) return;

    const TIMELINE_ALLOWED_TYPES = new Set([
      "note_created",
      "note_updated",
      "doc_uploaded",
      "ai_summary",
      "ai_used",
      "integration_sync",
      "synthesis",
    ]);

    try {
      setTimelineLoading(true);
      setTimelineError(null);

      const user = await getUser();

      // Load notes/docs to enrich titles and to help orphan filtering client-side.
      const [{ data: docsData, error: docsError }, { data: notesData, error: notesError }] =
        await Promise.all([
          supabase
            .from("documents")
            .select("id, name, type, file_name, created_at, updated_at")
            .eq("user_id", user.id),
          supabase
            .from("notes")
            .select("id, title, created_at, updated_at")
            .eq("user_id", user.id),
        ]);

      const newDocMap = new Map();
      const newNoteMap = new Map();
      if (!docsError && docsData) docsData.forEach((d) => newDocMap.set(d.id, d));
      if (!notesError && notesData) notesData.forEach((n) => newNoteMap.set(n.id, n));
      setDocMap(newDocMap);
      setNoteMap(newNoteMap);

      // UI filter -> RPC event_type (keep null for composite filters)
      const rpcEventType =
        typeFilter === "all" || typeFilter === "notes" || typeFilter === "updates"
          ? null
          : typeFilter;

      // range 0 => all time; keep bounded to 365 for sanity
      const daysForRpc = range > 0 ? range : 365;

      // RPC first
      let timelineData = null;
      let rpcError = null;

      try {
        const rpcResult = await supabase.rpc("get_activity_timeline", {
          p_user_id: user.id,
          p_days: daysForRpc,
          p_event_type: rpcEventType,
          p_limit: 250,
        });
        timelineData = rpcResult.data;
        rpcError = rpcResult.error;
      } catch (err) {
        rpcError = err;
      }

      // Fallback to direct query if RPC fails
      if (rpcError) {
        console.error("Timeline RPC error:", rpcError);
        let q = supabase
          .from("activity_events")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(250);

        // apply range
        if (range > 0) {
          const since = new Date();
          since.setDate(since.getDate() - range);
          q = q.gte("created_at", since.toISOString());
        }

        if (rpcEventType) q = q.eq("event_type", rpcEventType);

        const { data: directData, error: directError } = await q;
        if (directError) {
          console.error("Direct timeline query failed:", directError);
          setTimelineError("Failed to load activity timeline");
          setTimelineEvents([]);
          return;
        }
        timelineData = directData || [];
      }

      // Normalize + filter + client dedupe
      const normalized = (timelineData || [])
        .map((e) => ({
          ...e,
          metadata: safeJson(e.metadata),
          day_key: localDayKeyFromEvent(e),
        }))
        .filter((e) => TIMELINE_ALLOWED_TYPES.has(e?.event_type))
        .filter((e) => {
          // UI composite filters
          if (typeFilter === "notes") return e.event_type === "note_created" || e.event_type === "note_updated";
          if (typeFilter === "updates") return e.event_type === "note_updated";
          return true;
        })
        .filter((e) => {
          // Client orphan safety-check (server already excludes, but keep safe for fallback path)
          const entityId = e.entity_id;
          if (!entityId) return true;

          if (e.event_type === "note_created" || e.event_type === "note_updated") {
            return newNoteMap.size === 0 ? true : newNoteMap.has(entityId);
          }
          if (e.event_type === "doc_uploaded") {
            return newDocMap.size === 0 ? true : newDocMap.has(entityId);
          }
          return true;
        });

      // Dedupe: keep latest per (event_type, entity_id) for entity events
      const seen = new Map(); // key -> event
      for (const e of normalized) {
        const isEntityEvent =
          (e.event_type === "note_created" ||
            e.event_type === "note_updated" ||
            e.event_type === "doc_uploaded") &&
          !!e.entity_id;

        const key = isEntityEvent ? `${e.event_type}:${e.entity_id}` : `${e.event_type}:${e.id}`;
        const prev = seen.get(key);

        if (!prev) {
          seen.set(key, e);
        } else {
          const prevTime = new Date(prev.created_at).getTime();
          const curTime = new Date(e.created_at).getTime();
          if (curTime > prevTime) seen.set(key, e);
        }
      }

      const processedEvents = Array.from(seen.values()).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setTimelineEvents(processedEvents);
    } catch (err) {
      console.error("Failed to load timeline:", err);
      setTimelineError(err.message || "Failed to load timeline");
      setTimelineEvents([]);
    } finally {
      setTimelineLoading(false);
    }
  }, [getUser, range, typeFilter, supabaseReady]);

  const handleRefreshTimeline = useCallback(() => {
    loadActivityData();
    loadTimeline();
  }, [loadActivityData, loadTimeline]);

  useEffect(() => {
    loadActivityData();
  }, [loadActivityData]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  // Group events by calendar day (correct “sections”)
  const groupedEvents = useMemo(() => {
    const byDay = new Map(); // dayKey -> events[]
    for (const e of timelineEvents) {
      const k = e.day_key || localDayKeyFromEvent(e);
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k).push(e);
    }

    const sortedKeys = Array.from(byDay.keys()).sort((a, b) => (a < b ? 1 : -1));
    const out = [];
    for (const k of sortedKeys) {
      out.push({
        dayKey: k,
        label: labelForDayKey(k),
        items: (byDay.get(k) || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      });
    }
    return out;
  }, [timelineEvents]);

  // Ensure openGroups has defaults for new groups
  useEffect(() => {
    if (!groupedEvents.length) return;
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const g of groupedEvents) {
        if (next[g.dayKey] === undefined) {
          // open Today/Yesterday by default, collapse older
          next[g.dayKey] = g.label === "TODAY" || g.label === "YESTERDAY";
        }
      }
      return next;
    });
  }, [groupedEvents]);

  const chartData = dailyData;

  const notesTrend =
    stats.notes_count > 0
      ? `+${Math.round((stats.notes_count / Math.max(range || 7, 1)) * 1000) / 10}%`
      : null;

  const summariesTrend =
    stats.ai_summaries_count > 0
      ? `+${Math.round((stats.ai_summaries_count / Math.max(range || 7, 1)) * 1000) / 10}%`
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5 pb-[calc(var(--mobile-nav-height)+24px)]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div className="page-header-content flex items-center gap-3 min-w-0">
          <div className="page-header-icon flex-shrink-0">
            <ChartLine weight="duotone" />
          </div>

          <div className="min-w-0">
            <h1 className="page-header-title truncate">Activity</h1>
            <p className="page-header-subtitle truncate">Track your productivity and usage patterns</p>
          </div>
        </div>

        <span
          className="self-start sm:self-auto shrink-0 text-[11px] sm:text-xs px-3 py-1.5 rounded-full border leading-none"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            borderColor: "var(--border-secondary)",
            color: "var(--text-muted)",
            whiteSpace: "nowrap",
          }}
        >
          {new Date().toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </motion.header>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <StatCard
          title={`Notes (${range > 0 ? `last ${range}d` : "all time"})`}
          value={stats.notes_count}
          icon={<FiFileText size={18} />}
          iconColor="indigo"
          trend={notesTrend}
          trendUp={true}
        />
        <StatCard
          title={`AI Activity (${range > 0 ? `last ${range}d` : "all time"})`}
          value={stats.ai_summaries_count}
          icon={<FiZap size={18} />}
          iconColor="amber"
          trend={summariesTrend}
          trendUp={true}
        />
        <StatCard
          title="Day Streak"
          value={stats.streak_days}
          sub="Keep it going!"
          icon={<Fire size={18} weight="fill" />}
          iconColor="orange"
        />
        <StatCard
          title={`Uploads (${range > 0 ? `last ${range}d` : "all time"})`}
          value={stats.uploads_count}
          icon={<FiUploadCloud size={18} />}
          iconColor="emerald"
        />
      </motion.div>

      {/* Streak Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center">
                <Fire className="text-orange-400" size={16} weight="fill" />
              </div>
              <h3 className="font-semibold text-sm text-theme-primary">Weekly Activity</h3>
            </div>
            <span className="text-[10px] text-theme-muted px-2 py-1 rounded-full bg-theme-tertiary">
              7-day view
            </span>
          </div>
          <StreakDots days={streakDays} />
        </GlassCard>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Area Chart */}
        <GlassCard className="relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(700px 240px at 15% -10%, rgba(99,102,241,0.18), transparent 60%)," +
                "radial-gradient(700px 260px at 85% 0%, rgba(168,85,247,0.14), transparent 55%)",
            }}
          />

          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <IconTile tone="indigo" size="sm">
                  <FiTrendingUp size={16} />
                </IconTile>
                <div>
                  <h3 className="font-semibold text-base text-theme-primary">Insights Over Time</h3>
                  <p className="text-[11px] text-theme-muted">Track your productivity trends</p>
                </div>
              </div>

              <div className="flex gap-2">
                {["notes", "summaries"].map((tab) => (
                  <ToggleButton key={tab} active={chartTab === tab} onClick={() => setChartTab(tab)}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </ToggleButton>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              {["week", "month"].map((r) => (
                <ToggleButton
                  key={r}
                  active={chartRange === r}
                  onClick={() => setChartRange(r)}
                  size="sm"
                >
                  {r === "week" ? "This Week" : "This Month"}
                </ToggleButton>
              ))}
            </div>

            <div
              className="rounded-2xl border p-2"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderColor: "var(--border-secondary)",
                boxShadow: "0 18px 50px rgba(99,102,241,0.10)",
              }}
            >
              <div style={{ width: "100%", height: 176, minHeight: 176 }}>
                {chartsReady ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={200}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent-indigo, #6366f1)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="var(--accent-indigo, #6366f1)" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="activityStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="var(--accent-indigo, #6366f1)" />
                          <stop offset="50%" stopColor="var(--accent-purple, #8b5cf6)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0.65)" />
                        </linearGradient>
                      </defs>

                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                        width={30}
                      />
                      <Tooltip content={<CustomTooltip />} />

                      <Area
                        type="monotone"
                        dataKey={chartTab}
                        stroke="url(#activityStroke)"
                        strokeWidth={2.6}
                        fill="url(#activityFill)"
                        dot={(props) => {
                          const isLast = props.index === chartData.length - 1;
                          return isLast ? <AnimatedDot {...props} /> : null;
                        }}
                        activeDot={{
                          r: 6,
                          fill: "var(--accent-indigo, #6366f1)",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Usage Breakdown */}
        <GlassCard className="relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(700px 220px at 15% -10%, rgba(99,102,241,0.18), transparent 60%)," +
                "radial-gradient(700px 260px at 85% 0%, rgba(168,85,247,0.14), transparent 55%)",
            }}
          />

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <IconTile tone="cyan" size="sm">
                  <FiTrendingUp size={16} />
                </IconTile>
                <div>
                  <h3 className="font-semibold text-base text-theme-primary">Usage Breakdown</h3>
                  <p className="text-[11px] text-theme-muted">How you use NoteStream</p>
                </div>
              </div>

              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-secondary)",
                  color: "var(--text-muted)",
                }}
              >
                {range > 0 ? `Last ${range}d` : "All time"}
              </span>
            </div>

            <div className="space-y-4">
              {usageBreakdown.length === 0 ? (
                <div className="text-sm text-theme-muted">No category data yet.</div>
              ) : (
                usageBreakdown.map((item, i) => {
                  const label = String(item.label || "").toLowerCase();
                  const tone = label.includes("meeting")
                    ? "indigo"
                    : label.includes("study")
                    ? "purple"
                    : label.includes("task")
                    ? "cyan"
                    : label.includes("personal")
                    ? "emerald"
                    : "indigo";

                  const t = toneStyles[tone] || toneStyles.indigo;

                  return (
                    <div
                      key={`${item.label}-${i}`}
                      className="rounded-2xl border p-4"
                      style={{
                        backgroundColor: "var(--bg-tertiary)",
                        borderColor: "var(--border-secondary)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-xl border flex items-center justify-center ${t.text}`}
                            style={{
                              backgroundColor: t.bg,
                              borderColor: t.border,
                              boxShadow: `0 10px 26px ${t.glow}`,
                            }}
                          >
                            <FiClipboard size={16} />
                          </div>
                          <span className="text-sm text-theme-secondary font-medium">{item.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-theme-primary">
                          {Number(item.value) || 0}%
                        </span>
                      </div>

                      <div
                        className="h-2.5 rounded-full overflow-hidden border"
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          borderColor: "var(--border-secondary)",
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Number(item.value) || 0}%` }}
                          transition={{ duration: 0.9, delay: i * 0.08, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${t.solid}, rgba(255,255,255,0.55))`,
                            boxShadow: `0 0 18px ${t.soft}`,
                          }}
                        />
                      </div>

                      <div className="mt-2 text-[11px] text-theme-muted">
                        {Number(item.count) || 0} note{Number(item.count) === 1 ? "" : "s"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Clarity Score + Bar Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Clarity Score */}
        <GlassCard className="relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(700px 260px at 10% -10%, rgba(99,102,241,0.18), transparent 60%)," +
                "radial-gradient(700px 260px at 90% 10%, rgba(16,185,129,0.10), transparent 55%)",
            }}
          />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconTile tone="indigo" size="sm">
                  <FiZap size={16} />
                </IconTile>
                <div>
                  <h3 className="font-semibold text-base text-theme-primary mb-1">Clarity Score</h3>
                  <p className="text-[11px] text-theme-muted">AI-assessed note quality</p>
                </div>
              </div>
              <ClarityRing value={clarity.total_score || 0} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <MiniStat label="Readability" value={`${clarity.readability || 0}%`} color="indigo" />
              <MiniStat label="Structure" value={`${clarity.structure || 0}%`} color="purple" />
              <MiniStat label="Completeness" value={`${clarity.completeness || 0}%`} color="emerald" />
            </div>
          </div>
        </GlassCard>

        {/* Daily Activity Bar Chart */}
        <GlassCard className="relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(700px 260px at 15% -10%, rgba(168,85,247,0.16), transparent 60%)," +
                "radial-gradient(700px 260px at 85% 10%, rgba(99,102,241,0.12), transparent 55%)",
            }}
          />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <IconTile tone="purple" size="sm">
                  <FiActivity size={16} />
                </IconTile>
                <div>
                  <h3 className="font-semibold text-base text-theme-primary mb-1">Daily Breakdown</h3>
                  <p className="text-[11px] text-theme-muted">Notes vs Summaries</p>
                </div>
              </div>

              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-secondary)",
                  color: "var(--text-muted)",
                }}
              >
                {chartDays}d
              </span>
            </div>

            <div
              className="rounded-2xl border p-2"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderColor: "var(--border-secondary)",
                boxShadow: "0 18px 50px rgba(168,85,247,0.08)",
              }}
            >
              <div style={{ width: "100%", height: 144, minHeight: 144 }}>
                {chartsReady ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={200}>
                    <BarChart data={chartData} barGap={6}>
                      <defs>
                        <linearGradient id="barNotes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent-indigo, #6366f1)" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="var(--accent-indigo, #6366f1)" stopOpacity={0.25} />
                        </linearGradient>
                        <linearGradient id="barSummaries" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent-purple, #8b5cf6)" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="var(--accent-purple, #8b5cf6)" stopOpacity={0.22} />
                        </linearGradient>
                      </defs>

                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="notes" fill="url(#barNotes)" radius={[6, 6, 0, 0]} name="Notes" />
                      <Bar
                        dataKey="summaries"
                        fill="url(#barSummaries)"
                        radius={[6, 6, 0, 0]}
                        name="Summaries"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Activity Timeline */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-sky-500/20 border border-indigo-500/30 flex items-center justify-center">
              <FiCalendar className="text-indigo-400" size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-base text-theme-primary">Activity Timeline</h3>
              <p className="text-[10px] text-theme-muted">
                {timelineEvents.length} event{timelineEvents.length === 1 ? "" : "s"}
                {range > 0 ? ` in the last ${range} days` : " (all time)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleRefreshTimeline}
              disabled={timelineLoading}
              className="h-8 w-8 rounded-lg border flex items-center justify-center text-theme-muted hover:text-theme-primary hover:bg-white/5 transition-all disabled:opacity-50"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderColor: "var(--border-secondary)",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: timelineLoading ? 360 : 0 }}
                transition={{ duration: 1, repeat: timelineLoading ? Infinity : 0, ease: "linear" }}
              >
                <FiRefreshCw size={14} />
              </motion.div>
            </motion.button>

            {[7, 30, 0].map((n) => (
              <ToggleButton key={n} active={range === n} onClick={() => setRange(n)}>
                {n === 0 ? "All time" : `${n} days`}
              </ToggleButton>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs mb-5">
          {typeFilters.map((f) => (
            <ToggleButton key={f.value} active={typeFilter === f.value} onClick={() => setTypeFilter(f.value)}>
              {f.label}
            </ToggleButton>
          ))}
        </div>

        {timelineError && (
          <div className="mb-4 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-center gap-2">
            <FiAlertCircle className="text-rose-400 shrink-0" size={16} />
            <p className="text-sm text-rose-400">{timelineError}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {timelineLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-12"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-theme-muted">Loading timeline...</p>
              </div>
            </motion.div>
          ) : groupedEvents.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-10"
            >
              <div
                className="h-12 w-12 rounded-2xl border flex items-center justify-center mx-auto mb-3"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                <FiActivity className="text-theme-muted" size={20} />
              </div>
              <p className="text-theme-muted text-sm">No activity in this view</p>
              <p className="text-theme-muted text-xs mt-1">Start creating notes or uploading documents!</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {groupedEvents.map((group, groupIndex) => (
                <motion.section
                  key={group.dayKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.1, duration: 0.3 }}
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.02)",
                    borderColor: "var(--border-secondary)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenGroups((prev) => ({ ...prev, [group.dayKey]: !prev[group.dayKey] }))}
                    className="w-full flex items-center justify-between gap-3 px-3 sm:px-4 py-3 hover:bg-white/[0.02] transition-colors"
                    aria-expanded={!!openGroups[group.dayKey]}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border shrink-0"
                        style={{
                          backgroundColor: "var(--bg-tertiary)",
                          borderColor: "var(--border-secondary)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {group.label}
                      </span>
                      <span className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                        {group.items.length} event{group.items.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <motion.div
                      animate={{ rotate: openGroups[group.dayKey] ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="h-8 w-8 rounded-xl border flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: "var(--bg-tertiary)",
                        borderColor: "var(--border-secondary)",
                        color: "var(--text-muted)",
                      }}
                    >
                      <FiChevronDown size={16} />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {!!openGroups[group.dayKey] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 sm:px-4 pb-4">
                          <ol className="relative space-y-3 pt-2">
                            {group.items.map((event, i) => (
                              <TimelineRow
                                key={`${event.event_type}-${event.id}-${event.created_at}`}
                                event={event}
                                index={i}
                                isLast={i === group.items.length - 1}
                                noteMap={noteMap}
                                docMap={docMap}
                              />
                            ))}
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
      </GlassCard>
    </div>
  );
}

/* -----------------------------------------
   Toggle Button Component
----------------------------------------- */
const ToggleButton = ({ children, active, onClick, size = "md" }) => {
  const sizeClasses = size === "sm" ? "px-3 py-1.5 text-[11px]" : "px-3.5 py-1.5 text-xs";

  return (
    <motion.button
      className={`rounded-full border font-medium transition-all ${sizeClasses} ${
        active
          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25"
          : "text-theme-muted border-theme-secondary hover:text-theme-primary hover:border-theme-tertiary hover:bg-theme-tertiary"
      }`}
      style={!active ? { backgroundColor: "var(--bg-button)" } : {}}
      onClick={onClick}
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
};

/* -----------------------------------------
   Stat Card Component
----------------------------------------- */
const StatCard = ({ title, value, sub, icon, iconColor, trend, trendUp }) => {
  const colorClasses = {
    indigo: {
      bg: "from-indigo-500/20 to-indigo-600/10",
      border: "border-indigo-500/30",
      text: "text-indigo-400",
    },
    amber: {
      bg: "from-amber-500/20 to-amber-600/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
    },
    orange: {
      bg: "from-orange-500/20 to-orange-600/10",
      border: "border-orange-500/30",
      text: "text-orange-400",
    },
    emerald: {
      bg: "from-emerald-500/20 to-emerald-600/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
    },
  };

  const colors = colorClasses[iconColor] || colorClasses.indigo;

  return (
    <motion.div
      className="rounded-2xl px-4 py-3.5 border transition-all"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-secondary)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.02,
        boxShadow: "0 8px 30px rgba(99, 102, 241, 0.15)",
        borderColor: "rgba(99, 102, 241, 0.3)",
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div
          className={`h-9 w-9 rounded-xl bg-gradient-to-br ${colors.bg} ${colors.border} border flex items-center justify-center ${colors.text}`}
        >
          {icon}
        </div>

        {trend && (
          <span
            className={`text-[10px] px-2 py-1 rounded-full flex items-center gap-1 font-semibold ${
              trendUp
                ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/25"
                : "bg-rose-500/15 text-rose-500 border border-rose-500/25"
            }`}
          >
            <FiTrendingUp size={10} className={!trendUp ? "rotate-180" : ""} />
            {trend}
          </span>
        )}
      </div>

      <h2 className="text-2xl font-bold text-theme-primary">{value}</h2>
      <p className="text-[11px] text-theme-muted mt-0.5">{title}</p>
      {sub && <p className="text-[10px] text-theme-muted mt-0.5 opacity-75">{sub}</p>}
    </motion.div>
  );
};

/* -----------------------------------------
   Mini Stat
----------------------------------------- */
const MiniStat = ({ label, value, color }) => {
  const colorStyles = {
    indigo: { bg: "rgba(99, 102, 241, 0.15)", border: "rgba(99, 102, 241, 0.25)" },
    purple: { bg: "rgba(139, 92, 246, 0.15)", border: "rgba(139, 92, 246, 0.25)" },
    emerald: { bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.25)" },
  };

  const colors = colorStyles[color] || colorStyles.indigo;

  return (
    <motion.div
      className="rounded-xl px-3 py-3.5 text-center border transition-all"
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
      whileHover={{ scale: 1.02 }}
    >
      <p className="text-xl font-bold text-theme-primary">{value}</p>
      <p className="text-[10px] text-theme-muted mt-0.5">{label}</p>
    </motion.div>
  );
};

/* -----------------------------------------
   Streak Dots
----------------------------------------- */
const StreakDots = ({ days }) => {
  return (
    <div className="flex items-center justify-between gap-1">
      {days.map((d, i) => (
        <motion.div
          key={i}
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <motion.div
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
              d.active
                ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                : "border-2 border-dashed"
            }`}
            style={
              !d.active ? { backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-tertiary)" } : {}
            }
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            {d.active && <Fire size={16} weight="fill" />}
          </motion.div>
          <span className={`text-[10px] font-medium ${d.active ? "text-theme-secondary" : "text-theme-muted"}`}>
            {d.day}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

/* -----------------------------------------
   Clarity Ring (Donut Chart)
----------------------------------------- */
const ClarityRing = ({ value }) => {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (v / 100) * circumference;

  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" stroke="var(--bg-tertiary)" strokeWidth="6" fill="none" />
        <defs>
          <linearGradient id="clarityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-indigo, #6366f1)" />
            <stop offset="100%" stopColor="var(--accent-purple, #8b5cf6)" />
          </linearGradient>
        </defs>
        <motion.circle
          cx="40"
          cy="40"
          r="36"
          stroke="url(#clarityGradient)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-theme-primary">{v}%</span>
      </div>
    </div>
  );
};


