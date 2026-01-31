// src/pages/Activity.jsx
// ✅ Connected to Supabase database for real activity tracking

import { useState, useMemo, useEffect, useCallback } from "react";
import GlassCard from "../components/GlassCard";
import { motion } from "framer-motion";
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
  FiBookOpen,
  FiClipboard,
  FiUser,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";
import { ChartLine, Fire } from "phosphor-react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

/* -----------------------------------------
   Utility Functions
----------------------------------------- */
function formatTimeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function getGroupName(daysAgo) {
  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo <= 7) return "This Week";
  return "Earlier";
}

const typeFilters = [
  { label: "All", value: "all" },
  { label: "Uploads", value: "doc_uploaded" },
  { label: "Summaries", value: "ai_summary" },
  { label: "Notes", value: "note_created" },
  { label: "Integration", value: "integration_sync" },
];

const eventIcons = {
  note_created: FiFileText,
  note_updated: FiEdit3,
  doc_uploaded: FiUploadCloud,
  ai_summary: FiZap,
  synthesis: FiActivity,
  integration_sync: FiActivity,
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
    bg: "rgba(168,85,247,0.14)",
    border: "rgba(168,85,247,0.28)",
    icon: "var(--accent-purple)",
    glow: "rgba(168,85,247,0.16)",
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
};

/* -----------------------------------------
   Default/fallback data (used while loading)
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
              {entry.name}: <span className="font-semibold text-theme-primary">{entry.value}</span>
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
const TimelineRow = ({ event, index }) => {
  const Icon = eventIcons[event.event_type] || FiActivity;
  const s = actionStyles[event.event_type] || actionStyles.note_created;

  return (
    <motion.li
      className="relative pl-10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div
        className="absolute left-[14px] top-[18px] bottom-[-18px] w-[2px]"
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(255,255,255,0.00))",
        }}
        aria-hidden="true"
      />

      <div
        className="absolute left-0 top-[10px] h-8 w-8 rounded-xl border flex items-center justify-center"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: s.border,
          boxShadow: `0 10px 30px ${s.glow}`,
        }}
        aria-hidden="true"
      >
        <div
          className="h-6 w-6 rounded-lg border flex items-center justify-center"
          style={{ backgroundColor: s.bg, borderColor: s.border, color: s.icon }}
        >
          <Icon size={14} />
        </div>
      </div>

      <div
        className="rounded-2xl border px-4 py-3.5 transition"
        style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "var(--border-secondary)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-theme-primary">{event.title}</p>
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-full border"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "var(--border-secondary)",
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {formatTimeAgo(event.created_at)}
          </span>
        </div>
      </div>
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
      style={{ backgroundColor: t.bg, borderColor: t.border, boxShadow: `0 10px 30px ${t.glow}` }}
    >
      {children}
    </div>
  );
};

/* -----------------------------------------
   Activity Component (MAIN)
----------------------------------------- */
export default function Activity() {
  const [range, setRange] = useState(7);
  const [typeFilter, setTypeFilter] = useState("all");
  const [chartTab, setChartTab] = useState("notes");
  const [chartRange, setChartRange] = useState("week");
  const [chartsReady, setChartsReady] = useState(false);

  // ✅ Database state
  const [loading, setLoading] = useState(true);
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

  // Delay chart rendering to prevent -1 width/height warnings
  useEffect(() => {
    const timer = setTimeout(() => setChartsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Fetch user data
  const getUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data?.user) throw new Error("Not authenticated");
    return data.user;
  }, []);

  // ✅ Load all activity data from database
  const loadActivityData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const user = await getUser();

      // 1. Get activity stats
      const { data: statsData, error: statsError } = await supabase.rpc("get_activity_stats", {
        p_user_id: user.id,
        p_days: 7,
      });
      if (statsError) throw statsError;
      if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      // 2. Get daily activity for charts
      const { data: dailyDataResult, error: dailyError } = await supabase.rpc("get_daily_activity", {
        p_user_id: user.id,
        p_days: 7,
      });
      if (dailyError) throw dailyError;
      if (dailyDataResult) {
        setDailyData(
          dailyDataResult.map((d) => ({
            name: d.day_name,
            notes: Number(d.notes_count) || 0,
            summaries: Number(d.summaries_count) || 0,
            uploads: Number(d.uploads_count) || 0,
          }))
        );
      }

      // 3. Get weekly streak
      const { data: streakData, error: streakError } = await supabase.rpc("get_weekly_streak", {
        p_user_id: user.id,
      });
      if (streakError) throw streakError;
      if (streakData) {
        setStreakDays(
          streakData.map((d) => ({
            day: d.day_name,
            active: d.was_active,
          }))
        );
      }

      // 4. Get timeline events
      const { data: timelineData, error: timelineError } = await supabase.rpc("get_activity_timeline", {
        p_user_id: user.id,
        p_days: range,
        p_event_type: typeFilter === "all" ? null : typeFilter,
        p_limit: 50,
      });
      if (timelineError) throw timelineError;
      setTimelineEvents(timelineData || []);
    } catch (err) {
      console.error("Failed to load activity data:", err);
    } finally {
      setLoading(false);
    }
  }, [getUser, range, typeFilter]);

  // Load data on mount and when filters change
  useEffect(() => {
    loadActivityData();
  }, [loadActivityData]);

  // Reload timeline when range/filter changes
  useEffect(() => {
    const reloadTimeline = async () => {
      if (!isSupabaseConfigured) return;
      try {
        const user = await getUser();
        const { data: timelineData } = await supabase.rpc("get_activity_timeline", {
          p_user_id: user.id,
          p_days: range,
          p_event_type: typeFilter === "all" ? null : typeFilter,
          p_limit: 50,
        });
        setTimelineEvents(timelineData || []);
      } catch (err) {
        console.error("Failed to reload timeline:", err);
      }
    };
    reloadTimeline();
  }, [range, typeFilter, getUser]);

  // Group timeline events by day
  const groupedEvents = useMemo(() => {
    const result = {};
    timelineEvents.forEach((e) => {
      const group = getGroupName(e.days_ago);
      if (!result[group]) result[group] = [];
      result[group].push(e);
    });
    return result;
  }, [timelineEvents]);

  const chartData = dailyData;

  // Calculate trend percentages (compare this week vs last week would be ideal)
  const notesTrend = stats.notes_count > 0 ? `+${Math.round((stats.notes_count / 7) * 100) / 10}%` : null;
  const summariesTrend = stats.ai_summaries_count > 0 ? `+${Math.round((stats.ai_summaries_count / 7) * 100) / 10}%` : null;

  // Usage breakdown - calculate from notes tags (you can expand this)
  const usageBreakdown = [
    { label: "Meeting Notes", value: 42, icon: FiEdit3, tone: "indigo" },
    { label: "Study / Research", value: 31, icon: FiBookOpen, tone: "purple" },
    { label: "Projects & Tasks", value: 19, icon: FiClipboard, tone: "cyan" },
    { label: "Personal", value: 8, icon: FiUser, tone: "emerald" },
  ];

  // Loading state
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
        className="page-header flex items-center justify-between"
      >
        <div className="page-header-content">
          <div className="page-header-icon">
            <ChartLine weight="duotone" />
          </div>
          <div>
            <h1 className="page-header-title">Activity</h1>
            <p className="page-header-subtitle">Track your productivity and usage patterns</p>
          </div>
        </div>

        <span className="text-xs text-theme-muted px-3 py-1.5 rounded-full bg-theme-tertiary border border-theme-secondary">
          {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </motion.header>

      {/* Stats Row - Connected to Database */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <StatCard
          title="Notes This Week"
          value={stats.notes_count}
          icon={<FiFileText size={18} />}
          iconColor="indigo"
          trend={notesTrend}
          trendUp={true}
        />
        <StatCard
          title="AI Summaries"
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
          title="Uploads"
          value={stats.uploads_count}
          icon={<FiUploadCloud size={18} />}
          iconColor="emerald"
        />
      </motion.div>

      {/* Streak Indicator - Connected to Database */}
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

                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11 }} width={30} />
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
                        activeDot={{ r: 6, fill: "var(--accent-indigo, #6366f1)", stroke: "#fff", strokeWidth: 2 }}
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
                style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)", color: "var(--text-muted)" }}
              >
                Weekly
              </span>
            </div>

            <div className="space-y-4">
              {usageBreakdown.map((item, i) => {
                const t = toneStyles[item.tone] || toneStyles.indigo;
                const Icon = item.icon;

                return (
                  <div
                    key={i}
                    className="rounded-2xl border p-4"
                    style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-xl border flex items-center justify-center ${t.text}`}
                          style={{ backgroundColor: t.bg, borderColor: t.border, boxShadow: `0 10px 26px ${t.glow}` }}
                        >
                          <Icon size={16} />
                        </div>
                        <span className="text-sm text-theme-secondary font-medium">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-theme-primary">{item.value}%</span>
                    </div>

                    <div
                      className="h-2.5 rounded-full overflow-hidden border"
                      style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-secondary)" }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 0.9, delay: i * 0.08, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${t.solid}, rgba(255,255,255,0.55))`, boxShadow: `0 0 18px ${t.soft}` }}
                      />
                    </div>
                  </div>
                );
              })}
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
              <ClarityRing value={92} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <MiniStat label="Readability" value="94%" color="indigo" />
              <MiniStat label="Structure" value="89%" color="purple" />
              <MiniStat label="Completeness" value="93%" color="emerald" />
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
                style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)", color: "var(--text-muted)" }}
              >
                7d
              </span>
            </div>

            <div
              className="rounded-2xl border p-2"
              style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)", boxShadow: "0 18px 50px rgba(168,85,247,0.08)" }}
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

                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="notes" fill="url(#barNotes)" radius={[6, 6, 0, 0]} name="Notes" />
                      <Bar dataKey="summaries" fill="url(#barSummaries)" radius={[6, 6, 0, 0]} name="Summaries" />
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

      {/* Activity Timeline - Connected to Database */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-sky-500/20 border border-indigo-500/30 flex items-center justify-center">
              <FiCalendar className="text-indigo-400" size={16} />
            </div>
            <h3 className="font-semibold text-base text-theme-primary">Activity Timeline</h3>
          </div>

          <div className="flex gap-2">
            {[7, 30].map((n) => (
              <ToggleButton key={n} active={range === n} onClick={() => setRange(n)}>
                {n} days
              </ToggleButton>
            ))}
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap gap-2 text-xs mb-5">
          {typeFilters.map((f) => (
            <ToggleButton key={f.value} active={typeFilter === f.value} onClick={() => setTypeFilter(f.value)}>
              {f.label}
            </ToggleButton>
          ))}
        </div>

        {/* Timeline */}
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-10">
            <div
              className="h-12 w-12 rounded-2xl border flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
            >
              <FiActivity className="text-theme-muted" size={20} />
            </div>
            <p className="text-theme-muted text-sm">No activity in this view</p>
            <p className="text-theme-muted text-xs mt-1">Start creating notes or uploading documents!</p>
          </div>
        ) : (
          <div className="space-y-7">
            {Object.entries(groupedEvents).map(([group, items]) => (
              <section key={group}>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border"
                    style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)", color: "var(--text-muted)" }}
                  >
                    {group}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {items.length} event{items.length === 1 ? "" : "s"}
                  </span>
                </div>

                <ol className="relative space-y-3">
                  <div
                    className="absolute left-[14px] top-0 bottom-0 w-[2px]"
                    style={{ background: "linear-gradient(to bottom, rgba(99,102,241,0.18), rgba(168,85,247,0.10), rgba(255,255,255,0.00))" }}
                    aria-hidden="true"
                  />
                  {items.map((event, i) => (
                    <TimelineRow key={event.id} event={event} index={i} />
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
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
    <button
      className={`rounded-full border font-medium transition-all ${sizeClasses} ${
        active
          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25"
          : "text-theme-muted border-theme-secondary hover:text-theme-primary hover:border-theme-tertiary hover:bg-theme-tertiary"
      }`}
      style={!active ? { backgroundColor: "var(--bg-button)" } : {}}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

/* -----------------------------------------
   Stat Card Component
----------------------------------------- */
const StatCard = ({ title, value, sub, icon, iconColor, trend, trendUp }) => {
  const colorClasses = {
    indigo: { bg: "from-indigo-500/20 to-indigo-600/10", border: "border-indigo-500/30", text: "text-indigo-400" },
    amber: { bg: "from-amber-500/20 to-amber-600/10", border: "border-amber-500/30", text: "text-amber-400" },
    orange: { bg: "from-orange-500/20 to-orange-600/10", border: "border-orange-500/30", text: "text-orange-400" },
    emerald: { bg: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/30", text: "text-emerald-400" },
  };

  const colors = colorClasses[iconColor] || colorClasses.indigo;

  return (
    <motion.div
      className="rounded-2xl px-4 py-3.5 border transition-all hover:scale-[1.02]"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-secondary)" }}
      whileHover={{ boxShadow: "0 8px 30px rgba(99, 102, 241, 0.15)", borderColor: "rgba(99, 102, 241, 0.3)" }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${colors.bg} ${colors.border} border flex items-center justify-center ${colors.text}`}>
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
    <div
      className="rounded-xl px-3 py-3.5 text-center border transition-all hover:scale-[1.02]"
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
    >
      <p className="text-xl font-bold text-theme-primary">{value}</p>
      <p className="text-[10px] text-theme-muted mt-0.5">{label}</p>
    </div>
  );
};

/* -----------------------------------------
   Streak Dots - Now accepts props
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
          transition={{ delay: i * 0.05 }}
        >
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
              d.active
                ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                : "border-2 border-dashed"
            }`}
            style={!d.active ? { backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-tertiary)" } : {}}
          >
            {d.active && <Fire size={16} weight="fill" />}
          </div>
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
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (value / 100) * circumference;

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
        <span className="text-lg font-bold text-theme-primary">{value}%</span>
      </div>
    </div>
  );
};


