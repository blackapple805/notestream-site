// src/pages/Activity.jsx
import { useState, useMemo } from "react";
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
import { Activity as ActivityIcon, ChartLine, Fire } from "phosphor-react";

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
  { label: "Meeting Notes", value: 42, icon: <FiEdit3 className="h-4 w-4" /> },
  { label: "Study / Research", value: 31, icon: <FiBookOpen className="h-4 w-4" /> },
  { label: "Projects & Tasks", value: 19, icon: <FiClipboard className="h-4 w-4" /> },
  { label: "Personal", value: 8, icon: <FiUser className="h-4 w-4" /> },
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
      r={4}
      fill="#fff"
      stroke="#a5b4fc"
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
        className="rounded-lg px-3 py-2 shadow-xl border"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-secondary)',
        }}
      >
        <p className="text-xs text-theme-muted mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* -----------------------------------------
   Activity Component
----------------------------------------- */
export default function Activity() {
  const [range, setRange] = useState(7);
  const [typeFilter, setTypeFilter] = useState("all");
  const [chartTab, setChartTab] = useState("notes");
  const [chartRange, setChartRange] = useState("week");

  const filteredEvents = useMemo(() => {
    return allEvents.filter(
      (e) =>
        e.daysAgo <= range &&
        (typeFilter === "all" ? true : e.action === typeFilter)
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
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <ChartLine size={28} weight="duotone" className="text-indigo-400" />
          <h1 className="text-xl font-semibold text-theme-primary">Activity</h1>
        </div>
        <span className="text-xs text-theme-muted">
          {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </motion.div>

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
          icon={<FiFileText className="text-indigo-400" size={16} />}
          trend="+12%"
          trendUp={true}
        />
        <StatCard 
          title="AI Summaries" 
          value={totalSummaries} 
          icon={<FiZap className="text-amber-400" size={16} />}
          trend="+8%"
          trendUp={true}
        />
        <StatCard 
          title="Day Streak" 
          value="11"
          sub="Keep it going!"
          icon={<Fire className="text-orange-400" size={16} weight="fill" />}
          isStreak
        />
        <StatCard 
          title="Uploads" 
          value="8" 
          icon={<FiUploadCloud className="text-emerald-400" size={16} />}
        />
      </motion.div>

      {/* Streak Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Fire className="text-orange-400" size={18} weight="fill" />
              <h3 className="font-semibold text-sm text-theme-primary">Weekly Activity</h3>
            </div>
            <span className="text-xs text-theme-muted">7-day view</span>
          </div>
          <StreakDots />
        </GlassCard>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Area Chart */}
        <GlassCard>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-base text-theme-primary">Insights Over Time</h3>
              <p className="text-[11px] text-theme-muted">Track your productivity trends</p>
            </div>
            <div className="flex gap-2">
              {/* Chart Type Tabs */}
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

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="activityStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#c4b5fd" />
                    <stop offset="100%" stopColor="#f9a8d4" />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={chartTab}
                  stroke="url(#activityStroke)"
                  strokeWidth={2.3}
                  fill="url(#activityFill)"
                  dot={(props) => {
                    const isLast = props.index === chartData.length - 1;
                    return isLast ? <AnimatedDot {...props} /> : null;
                  }}
                  activeDot={{ r: 6, fill: "#a5b4fc", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Usage Breakdown */}
        <GlassCard>
          <h3 className="font-semibold text-base text-theme-primary mb-1">Usage Breakdown</h3>
          <p className="text-[11px] text-theme-muted mb-4">How you use NoteStream</p>

          <div className="space-y-3">
            {usageBreakdown.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-indigo-400"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    >
                      {item.icon}
                    </div>
                    <span className="text-sm text-theme-secondary">{item.label}</span>
                  </div>
                  <span className="text-sm text-theme-muted">{item.value}%</span>
                </div>
                <div 
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, #6366f1 0%, #a5b4fc ${item.value}%)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Clarity Score + Bar Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Clarity Score */}
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base text-theme-primary mb-1">Clarity Score</h3>
              <p className="text-[11px] text-theme-muted">AI-assessed note quality</p>
            </div>
            <ClarityRing value={92} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <MiniStat label="Readability" value="94%" />
            <MiniStat label="Structure" value="89%" />
            <MiniStat label="Completeness" value="93%" />
          </div>
        </GlassCard>

        {/* Daily Activity Bar Chart */}
        <GlassCard>
          <h3 className="font-semibold text-base text-theme-primary mb-1">Daily Breakdown</h3>
          <p className="text-[11px] text-theme-muted mb-4">Notes vs Summaries</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insightsData} barGap={2}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="notes" fill="#6366f1" radius={[4, 4, 0, 0]} name="Notes" />
                <Bar dataKey="summaries" fill="#a5b4fc" radius={[4, 4, 0, 0]} name="Summaries" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Activity Timeline */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-indigo-400" size={18} />
            <h3 className="font-semibold text-base text-theme-primary">Activity Timeline</h3>
          </div>

          <div className="flex gap-2">
            {[7, 30].map((n) => (
              <ToggleButton
                key={n}
                active={range === n}
                onClick={() => setRange(n)}
              >
                {n} days
              </ToggleButton>
            ))}
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex flex-wrap gap-2 text-xs mb-4">
          {typeFilters.map((f) => (
            <ToggleButton
              key={f.value}
              active={typeFilter === f.value}
              onClick={() => setTypeFilter(f.value)}
            >
              {f.label}
            </ToggleButton>
          ))}
        </div>

        {/* Timeline */}
        {Object.keys(grouped).length === 0 ? (
          <p className="text-theme-muted text-xs text-center py-4">No activity in this view</p>
        ) : (
          <>
            {Object.entries(grouped).map(([group, items]) => (
              <section key={group} className="mb-6">
                <h3 className="text-[12px] uppercase tracking-wider text-theme-muted mb-3 ml-1">{group}</h3>
                <ol 
                  className="relative ml-4 space-y-5"
                  style={{ borderLeft: '1px solid var(--border-secondary)' }}
                >
                  {items.map((e, i) => {
                    const Icon = e.icon;
                    return (
                      <li key={i} className="relative pl-6">
                        <div 
                          className="absolute -left-[14px] mt-1.5 w-7 h-7 rounded-full border border-indigo-500/40 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.25)] transition hover:scale-105"
                          style={{ backgroundColor: 'var(--bg-elevated)' }}
                        >
                          <Icon size={15} className="text-indigo-400" />
                        </div>
                        <p className="text-theme-secondary font-medium text-sm">{e.text}</p>
                        <p className="text-[11px] text-theme-muted">{e.time}</p>
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

/* -----------------------------------------
   Toggle Button Component - THEME AWARE
----------------------------------------- */
const ToggleButton = ({ children, active, onClick, size = "md" }) => {
  const sizeClasses = size === "sm" ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs";
  
  return (
    <button
      className={`rounded-full border font-medium transition-all ${sizeClasses} ${
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "text-theme-muted border-theme-secondary hover:text-theme-primary hover:border-theme-tertiary"
      }`}
      style={!active ? { backgroundColor: 'var(--bg-button)' } : {}}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

/* -----------------------------------------
   Stat Card Component - THEME AWARE
----------------------------------------- */
const StatCard = ({ title, value, sub, icon, trend, trendUp, isStreak }) => (
  <div 
    className="rounded-2xl px-3.5 py-3 border"
    style={{
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--border-secondary)',
      boxShadow: 'var(--shadow-lg)',
    }}
  >
    <div className="flex items-center justify-between mb-2">
      <div 
        className="h-8 w-8 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      >
        {icon}
      </div>
      {trend && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium ${
          trendUp ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"
        }`}>
          <FiTrendingUp size={10} className={!trendUp ? "rotate-180" : ""} />
          {trend}
        </span>
      )}
    </div>
    <h2 className="text-xl font-semibold text-theme-primary">{value}</h2>
    <p className="text-[11px] text-theme-muted">{title}</p>
    {sub && <p className="text-[10px] text-theme-muted mt-0.5">{sub}</p>}
  </div>
);

/* -----------------------------------------
   Mini Stat - THEME AWARE (Clarity Score boxes)
----------------------------------------- */
const MiniStat = ({ label, value }) => (
  <div 
    className="rounded-xl px-3 py-3 text-center"
    style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)' }}
  >
    <p className="text-lg font-bold text-theme-primary">{value}</p>
    <p className="text-[10px] text-theme-muted">{label}</p>
  </div>
);

/* -----------------------------------------
   Activity Streak Dots
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
        <div key={i} className="flex flex-col items-center gap-1.5">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center transition ${
              d.active
                ? "bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                : ""
            }`}
            style={!d.active ? { backgroundColor: 'var(--bg-tertiary)' } : {}}
          >
            {d.active && <Fire size={14} weight="fill" />}
          </div>
          <span className="text-[9px] text-theme-muted">{d.day}</span>
        </div>
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
        <circle
          cx="40"
          cy="40"
          r="36"
          stroke="var(--bg-tertiary)"
          strokeWidth="6"
          fill="none"
        />
        <motion.circle
          cx="40"
          cy="40"
          r="36"
          stroke="#6366f1"
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
