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
   Custom Tooltip
----------------------------------------- */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1b27] border border-[#2a2a3a] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
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
  const totalUploads = insightsData.reduce((acc, d) => acc + d.uploads, 0);

  const fadeSlide = {
    hidden: { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
      {/* Header */}
      <motion.header
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.45 }}
        className="pt-2 px-1"
      >
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Activity</h1>
          <ActivityIcon className="text-indigo-400" size={24} weight="duotone" />
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Track your productivity and workspace activity over time.
        </p>
      </motion.header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard 
          title="Notes Created" 
          value={totalNotes} 
          sub="This week"
          icon={<FiFileText className="text-indigo-400" />}
          trend="+12%"
          trendUp={true}
        />
        <StatCard 
          title="AI Summaries" 
          value={totalSummaries} 
          sub="Generated"
          icon={<FiZap className="text-emerald-400" />}
          trend="+8%"
          trendUp={true}
        />
        <StatCard 
          title="Files Uploaded" 
          value={totalUploads} 
          sub="This week"
          icon={<FiUploadCloud className="text-purple-400" />}
          trend="+5%"
          trendUp={true}
        />
        <StatCard 
          title="Active Streak" 
          value="11 days" 
          sub="Keep it up!"
          icon={<Fire className="text-orange-400" weight="fill" />}
          isStreak={true}
        />
      </div>

      {/* Activity Streak Visual */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Fire className="text-orange-400" size={20} weight="fill" />
            <h3 className="font-semibold text-base text-white">Activity Streak</h3>
          </div>
          <span className="text-xs text-gray-500">Last 7 days</span>
        </div>
        <StreakDots />
      </GlassCard>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Main Chart */}
        <GlassCard className="xl:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <ChartLine className="text-indigo-400" size={20} weight="duotone" />
              <div>
                <h3 className="font-semibold text-base text-white">Workspace Overview</h3>
                <p className="text-[11px] text-gray-500">Your productivity trends</p>
              </div>
            </div>

            <div className="flex gap-2">
              {/* Time Range */}
              <div className="flex gap-1 text-[11px] bg-[#101018] rounded-full p-1">
                {[{ label: "Week", value: "week" }, { label: "Month", value: "month" }].map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setChartRange(r.value)}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      chartRange === r.value ? "bg-[#1d1d26] text-white" : "text-gray-400"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Data Type */}
              <div className="flex gap-1 text-[11px] bg-[#101018] rounded-full p-1">
                {["notes", "summaries"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setChartTab(tab)}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      chartTab === tab ? "bg-[#1d1d26] text-white" : "text-gray-400"
                    }`}
                  >
                    {tab === "notes" ? "Notes" : "Summaries"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="activityStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a5b4fc" />
                    <stop offset="50%" stopColor="#c4b5fd" />
                    <stop offset="100%" stopColor="#f9a8d4" />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 11 }}
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
          <h3 className="font-semibold text-base text-white mb-1">Usage Breakdown</h3>
          <p className="text-[11px] text-gray-500 mb-4">How you use NoteStream</p>

          <div className="space-y-3">
            {usageBreakdown.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#181822] flex items-center justify-center text-indigo-300">
                      {item.icon}
                    </div>
                    <span className="text-sm text-gray-200">{item.label}</span>
                  </div>
                  <span className="text-sm text-gray-400">{item.value}%</span>
                </div>
                <div className="h-1.5 bg-[#1a1a24] rounded-full overflow-hidden">
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
              <h3 className="font-semibold text-base text-white mb-1">Clarity Score</h3>
              <p className="text-[11px] text-gray-500">AI-assessed note quality</p>
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
          <h3 className="font-semibold text-base text-white mb-1">Daily Breakdown</h3>
          <p className="text-[11px] text-gray-500 mb-4">Notes vs Summaries</p>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insightsData} barGap={2}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 10 }}
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
            <h3 className="font-semibold text-base text-white">Activity Timeline</h3>
          </div>

          <div className="flex gap-2">
            {[7, 30].map((n) => (
              <button
                key={n}
                className={`px-3 py-1 rounded-full border text-xs transition ${
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
        <div className="flex flex-wrap gap-2 text-xs mb-4">
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
          <p className="text-gray-500 text-xs text-center py-4">No activity in this view</p>
        ) : (
          <>
            {Object.entries(grouped).map(([group, items]) => (
              <section key={group} className="mb-6">
                <h3 className="text-[12px] uppercase tracking-wider text-gray-400 mb-3 ml-1">{group}</h3>
                <ol className="relative border-l border-[#26262c] ml-4 space-y-5">
                  {items.map((e, i) => {
                    const Icon = e.icon;
                    return (
                      <li key={i} className="relative pl-6">
                        <div className="absolute -left-[14px] mt-1.5 w-7 h-7 rounded-full bg-[#1a1b27] border border-indigo-500/40 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.25)] transition hover:scale-105">
                          <Icon size={15} className="text-indigo-300" />
                        </div>
                        <p className="text-gray-200 font-medium text-sm">{e.text}</p>
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

/* -----------------------------------------
   Stat Card Component
----------------------------------------- */
const StatCard = ({ title, value, sub, icon, trend, trendUp, isStreak }) => (
  <div className="bg-[#101018] border border-[#262632] rounded-2xl px-3.5 py-3 shadow-[0_12px_26px_rgba(0,0,0,0.65)]">
    <div className="flex items-center justify-between mb-2">
      <div className="h-8 w-8 rounded-xl bg-[#181822] flex items-center justify-center">
        {icon}
      </div>
      {trend && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${
          trendUp ? "bg-emerald-900/30 text-emerald-400" : "bg-rose-900/30 text-rose-400"
        }`}>
          <FiTrendingUp size={10} className={!trendUp ? "rotate-180" : ""} />
          {trend}
        </span>
      )}
    </div>
    <h2 className="text-xl font-semibold text-white">{value}</h2>
    <p className="text-[11px] text-gray-500">{title}</p>
    {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
  </div>
);

/* -----------------------------------------
   Mini Stat
----------------------------------------- */
const MiniStat = ({ label, value }) => (
  <div className="bg-[#0d0d14] rounded-xl px-3 py-2 text-center">
    <p className="text-lg font-semibold text-white">{value}</p>
    <p className="text-[10px] text-gray-500">{label}</p>
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
    { day: "Sat", active: true },
    { day: "Sun", active: false },
  ];

  return (
    <div className="flex justify-between sm:justify-center sm:gap-6">
      {days.map((d, i) => (
        <motion.div
          key={d.day}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="flex flex-col items-center"
        >
          <div
            className={`flex items-center justify-center rounded-full w-8 h-8 sm:w-10 sm:h-10 transition-all ${
              d.active
                ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_12px_rgba(99,91,255,0.5)]"
                : "bg-[#1a1a24] border border-[#2a2a3a]"
            }`}
          >
            {d.active ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="text-gray-600 text-xs">—</span>
            )}
          </div>
          <span className="text-[10px] text-gray-500 mt-1.5">{d.day}</span>
        </motion.div>
      ))}
    </div>
  );
};

/* -----------------------------------------
   Clarity Ring
----------------------------------------- */
const ClarityRing = ({ value }) => {
  const circumferenceOuter = 2 * Math.PI * 40;

  return (
    <div className="relative">
      <svg width="90" height="90" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="clarityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a5b4fc" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="40" stroke="#1a1a24" strokeWidth="8" fill="none" />
        <motion.circle
          cx="50"
          cy="50"
          r="40"
          stroke="url(#clarityGradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumferenceOuter}` }}
          animate={{ strokeDasharray: `${(value / 100) * circumferenceOuter} ${circumferenceOuter}` }}
          transition={{ duration: 1, ease: "easeOut" }}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="50" textAnchor="middle" dy="0.35em" className="fill-white text-lg font-semibold">
          {value}%
        </text>
      </svg>
    </div>
  );
};
