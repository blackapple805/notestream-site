
// src/pages/Activity.jsx
import { useState, useMemo, useEffect } from "react";
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

/* -----------------------------------------
   Activity Data
----------------------------------------- */
const insightsData = [
  { name: "Mon", notes: 5, summaries: 2, uploads: 1 },
  { name: "Tue", notes: 7, summaries: 3, uploads: 2 },
  { name: "Wed", notes: 6, summaries: 4, uploads: 0 },
  { name: "Thu", notes: 9, summaries: 5, uploads: 3 },
  { name: "Fri", notes: 8, summaries: 6, uploads: 1 },
  { name: "Sat", notes: 4, summaries: 2, uploads: 0 },
  { name: "Sun", notes: 3, summaries: 1, uploads: 1 },
];

const monthlyData = [
  { name: "Week 1", notes: 18, summaries: 8 },
  { name: "Week 2", notes: 24, summaries: 12 },
  { name: "Week 3", notes: 21, summaries: 15 },
  { name: "Week 4", notes: 28, summaries: 18 },
];

const usageBreakdown = [
  { label: "Meeting Notes", value: 42, icon: FiEdit3, tone: "indigo" },
  { label: "Study / Research", value: 31, icon: FiBookOpen, tone: "purple" },
  { label: "Projects & Tasks", value: 19, icon: FiClipboard, tone: "cyan" },
  { label: "Personal", value: 8, icon: FiUser, tone: "emerald" },
];

const allEvents = [
  { action: "summary", time: "Just now", text: "Generated summary for Team Meeting Notes", icon: FiZap, daysAgo: 0 },
  { action: "upload", time: "1h ago", text: "Uploaded file projectRoadmap.pdf", icon: FiUploadCloud, daysAgo: 0 },
  { action: "note", time: "Yesterday", text: "Created 3 new notes", icon: FiFileText, daysAgo: 1 },
  { action: "integration", time: "2 days ago", text: "Synced workspace with Notion", icon: FiActivity, daysAgo: 2 },
  { action: "note", time: "5 days ago", text: "Edited outline draft", icon: FiFileText, daysAgo: 5 },
  { action: "upload", time: "10 days ago", text: "Uploaded assets for pitch deck", icon: FiUploadCloud, daysAgo: 10 },
];

const typeFilters = [
  { label: "All", value: "all" },
  { label: "Uploads", value: "upload" },
  { label: "Summaries", value: "summary" },
  { label: "Notes", value: "note" },
  { label: "Integration", value: "integration" },
];

function getGroupName(daysAgo) {
  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo <= 7) return "This Week";
  return "Earlier";
}

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
   Custom Tooltip - Theme Aware
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

const actionStyles = {
  summary: {
    bg: "rgba(99,102,241,0.14)",
    border: "rgba(99,102,241,0.28)",
    icon: "var(--accent-indigo)",
    glow: "rgba(99,102,241,0.18)",
  },
  upload: {
    bg: "rgba(16,185,129,0.14)",
    border: "rgba(16,185,129,0.28)",
    icon: "var(--accent-emerald)",
    glow: "rgba(16,185,129,0.16)",
  },
  note: {
    bg: "rgba(168,85,247,0.14)",
    border: "rgba(168,85,247,0.28)",
    icon: "var(--accent-purple)",
    glow: "rgba(168,85,247,0.16)",
  },
  integration: {
    bg: "rgba(56,189,248,0.14)",
    border: "rgba(56,189,248,0.28)",
    icon: "rgba(56,189,248,1)",
    glow: "rgba(56,189,248,0.14)",
  },
};

const TimelineRow = ({ e, i }) => {
  const Icon = e.icon;
  const s = actionStyles[e.action] || actionStyles.note;

  return (
    <motion.li
      className="relative pl-10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
    >
      {/* connector line segment */}
      <div
        className="absolute left-[14px] top-[18px] bottom-[-18px] w-[2px]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(255,255,255,0.00))",
        }}
        aria-hidden="true"
      />

      {/* square icon marker (NOT round) */}
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
          style={{
            backgroundColor: s.bg,
            borderColor: s.border,
            color: s.icon,
          }}
        >
          <Icon size={14} />
        </div>
      </div>

      {/* content card */}
      <div
        className="rounded-2xl border px-4 py-3.5 transition"
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          borderColor: "var(--border-secondary)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-theme-primary">{e.text}</p>

          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-full border"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "var(--border-secondary)",
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {e.time}
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
   Activity Component
----------------------------------------- */
export default function Activity() {
  const [range, setRange] = useState(7);
  const [typeFilter, setTypeFilter] = useState("all");
  const [chartTab, setChartTab] = useState("notes");
  const [chartRange, setChartRange] = useState("week");
  const [chartsReady, setChartsReady] = useState(false);

  // Delay chart rendering to prevent -1 width/height warnings
  useEffect(() => {
    const timer = setTimeout(() => setChartsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(
      (e) => e.daysAgo <= range && (typeFilter === "all" ? true : e.action === typeFilter)
    );
  }, [range, typeFilter]);

  const grouped = useMemo(() => {
    const result = {};
    filteredEvents.forEach((e) => {
      const group = getGroupName(e.daysAgo);
      if (!result[group]) result[group] = [];
      result[group].push(e);
    });
    return result;
  }, [filteredEvents]);

  const chartData = chartRange === "week" ? insightsData : monthlyData;

  // Calculate stats
  const totalNotes = insightsData.reduce((acc, d) => acc + d.notes, 0);
  const totalSummaries = insightsData.reduce((acc, d) => acc + d.summaries, 0);

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

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <StatCard
          title="Notes This Week"
          value={totalNotes}
          icon={<FiFileText size={18} />}
          iconColor="indigo"
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="AI Summaries"
          value={totalSummaries}
          icon={<FiZap size={18} />}
          iconColor="amber"
          trend="+8%"
          trendUp={true}
        />
        <StatCard
          title="Day Streak"
          value="11"
          sub="Keep it going!"
          icon={<Fire size={18} weight="fill" />}
          iconColor="orange"
        />
        <StatCard
          title="Uploads"
          value="8"
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
          <StreakDots />
        </GlassCard>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Area Chart (now with same neon wash treatment) */}
        <GlassCard className="relative overflow-hidden">
          {/* neon wash */}
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
                  <ToggleButton
                    key={tab}
                    active={chartTab === tab}
                    onClick={() => setChartTab(tab)}
                  >
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
                          <stop offset="0%" stopColor="var(--accent-indigo, #6366f1)" stopOpacity={0.30} />
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
          {/* neon wash */}
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
                          <Icon size={16} />
                        </div>
                        <span className="text-sm text-theme-secondary font-medium">{item.label}</span>
                      </div>

                      <span className="text-sm font-semibold text-theme-primary">{item.value}%</span>
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
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 0.9, delay: i * 0.08, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${t.solid}, rgba(255,255,255,0.55))`,
                          boxShadow: `0 0 18px ${t.soft}`,
                        }}
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
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-secondary)",
                  color: "var(--text-muted)",
                }}
              >
                7d
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
                    <BarChart data={insightsData} barGap={6}>
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

      {/* Activity Timeline */}
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
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-10">
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
          </div>
        ) : (
          <div className="space-y-7">
            {Object.entries(grouped).map(([group, items]) => (
              <section key={group}>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      borderColor: "var(--border-secondary)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {group}
                  </span>

                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {items.length} event{items.length === 1 ? "" : "s"}
                  </span>
                </div>

                <ol className="relative space-y-3">
                  {/* left rail (subtle) */}
                  <div
                    className="absolute left-[14px] top-0 bottom-0 w-[2px]"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(99,102,241,0.18), rgba(168,85,247,0.10), rgba(255,255,255,0.00))",
                    }}
                    aria-hidden="true"
                  />

                  {items.map((e, i) => (
                    <TimelineRow key={`${group}-${i}`} e={e} i={i} />
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
   Toggle Button Component - THEME AWARE
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
   Stat Card Component - ENHANCED
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
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-secondary)",
      }}
      whileHover={{
        boxShadow: "0 8px 30px rgba(99, 102, 241, 0.15)",
        borderColor: "rgba(99, 102, 241, 0.3)",
      }}
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
   Mini Stat - ENHANCED with colors
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
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <p className="text-xl font-bold text-theme-primary">{value}</p>
      <p className="text-[10px] text-theme-muted mt-0.5">{label}</p>
    </div>
  );
};

/* -----------------------------------------
   Activity Streak Dots - ENHANCED
----------------------------------------- */
const StreakDots = () => {
  const days = [
    { day: "Mon", active: true },
    { day: "Tue", active: true },
    { day: "Wed", active: true },
    { day: "Thu", active: true },
    { day: "Fri", active: true },
    { day: "Sat", active: false },
    { day: "Sun", active: true },
  ];

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
            style={
              !d.active
                ? { backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-tertiary)" }
                : {}
            }
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
   Clarity Ring (Donut Chart) - ENHANCED
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


