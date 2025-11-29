// src/pages/Dashboard.jsx
import { useState } from "react";
import {
  FiFileText,
  FiZap,
  FiCpu,
  FiBarChart2,
  FiSettings,
  FiChevronRight,
  FiPlus,
  FiEdit3,
  FiBookOpen,
  FiClipboard,
  FiUser,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

/* -----------------------------------------
   Greeting Logic
----------------------------------------- */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

/* -----------------------------------------
   Dashboard Data
----------------------------------------- */
const simpleTrend = Array.from({ length: 8 }, () =>
  Math.floor(Math.random() * 10) + 5
);
const clarityData = [{ score: 92 }];

const insightsData = [
  { name: "Mon", notes: 5, summaries: 2 },
  { name: "Tue", notes: 7, summaries: 3 },
  { name: "Wed", notes: 6, summaries: 4 },
  { name: "Thu", notes: 9, summaries: 5 },
  { name: "Fri", notes: 8, summaries: 6 },
  { name: "Sat", notes: 4, summaries: 2 },
  { name: "Sun", notes: 3, summaries: 1 },
];

const usageBreakdown = [
  { label: "Meeting Notes", value: "42%", icon: <FiEdit3 className="h-4 w-4" /> },
  { label: "Study / Research", value: "31%", icon: <FiBookOpen className="h-4 w-4" /> },
  { label: "Projects & Tasks", value: "19%", icon: <FiClipboard className="h-4 w-4" /> },
  { label: "Personal", value: "8%", icon: <FiUser className="h-4 w-4" /> },
];

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
   Dashboard Component
----------------------------------------- */
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("notes");

  const fadeSlide = {
    hidden: { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="w-full space-y-8 sm:space-y-10 md:space-y-12 pb-[0px] sm:pb-14 md:pb-20">
      {/* Greeting */}
      <motion.div
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.45 }}
        className="pt-2 px-1 sm:px-0"
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              {getGreeting()}
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Welcome back — ready to continue where you left off?
            </p>
          </div>

          <div className="hidden sm:flex flex-col justify-center items-end px-3 py-2 rounded-2xl bg-[#15151c] border border-[#262632] text-[11px] text-gray-300">
            <span className="text-[11px] text-gray-500">Today</span>
            <span className="font-medium text-indigo-300">3 active notes</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-1 flex justify-center w-full">
          <button
            className="
              flex items-center justify-center gap-2
              bg-gradient-to-r from-indigo-500 to-indigo-600
              text-white font-medium
              shadow-[0_18px_40px_rgba(15,23,42,0.55)]
              active:opacity-90 transition-all

              w-full py-3 rounded-[999px] text-sm
              sm:w-[80%]
              md:w-[50%] md:py-3.5 md:text-base
              lg:w-[45%]
              xl:w-[38%]
            "
          >
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/10">
              <FiPlus className="text-[15px]" />
            </span>
            New Note / Upload
          </button>
        </div>
      </motion.div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 auto-rows-fr">
        <StatCard title="Total Notes" value="28" sub="This week">
          <MiniLine data={simpleTrend} color="#a5b4fc" />
        </StatCard>

        <StatCard title="AI Summaries" value="54" sub="Auto-generated">
          <MiniLine data={simpleTrend} color="#6ee7b7" />
        </StatCard>

        <StatCard title="Activity Streak" value="11 days" sub="On a roll">
          <StreakDots />
        </StatCard>

        <StatCard title="Clarity Score" value="92%" sub="Last 7 days">
          <ClarityRing value={clarityData[0].score} />
        </StatCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {/* Overview Chart */}
        <GlassCard className="xl:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-base sm:text-lg text-white">
                Workspace Overview
              </h3>
              <p className="text-[11px] text-gray-500">Last 7 days</p>
            </div>

            <div className="flex gap-2 text-[11px] sm:text-xs bg-[#101018] rounded-full p-1">
              {["notes", "summaries"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    px-3 py-1 rounded-full transition-colors
                    ${
                      activeTab === tab
                        ? "bg-[#1d1d26] text-white"
                        : "text-gray-400"
                    }
                  `}
                >
                  {tab === "notes" ? "Notes" : "Summaries"}
                </button>
              ))}
            </div>
          </div>

          <div className="h-40 sm:h-48 md:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={insightsData}>
                <defs>
                  <linearGradient id="overviewFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="#a5b4fc"
                      stopOpacity="0.28"
                    />
                    <stop
                      offset="100%"
                      stopColor="#a5b4fc"
                      stopOpacity="0"
                    />
                  </linearGradient>

                  <linearGradient
                    id="overviewStroke"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#a5b4fc" />
                    <stop offset="50%" stopColor="#c4b5fd" />
                    <stop offset="100%" stopColor="#f9a8d4" />
                  </linearGradient>
                </defs>

              <Area
                type="monotone"
                dataKey={activeTab}
                stroke="url(#overviewStroke)"
                strokeWidth={2.3}
                fill="url(#overviewFill)"
                dot={(props) => {
                  const isLast = props.index === insightsData.length - 1;
                  return isLast ? <AnimatedDot {...props} /> : null;
                }}
                activeDot={false}
              />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Usage Breakdown */}
        <GlassCard>
          <h3 className="font-semibold text-base sm:text-lg text-white mb-1">
            Usage Breakdown
          </h3>
          <p className="text-[11px] text-gray-500 mb-4">Last 30 days</p>

          <div className="space-y-2.5">
            {usageBreakdown.map((item, i) => (
              <div
                key={i}
                className="
                  flex items-center justify-between
                  bg-[#101018] px-3 py-2.5 rounded-2xl
                  border border-[#1f1f27] text-xs
                "
              >
                <div className="flex items-center gap-3">
                  {/* Icon container — matches AI Tools icons */}
                  <div
                    className="
                      h-8 w-8 rounded-xl
                      bg-[#181822]
                      flex items-center justify-center
                      text-indigo-300
                    "
                  >
                    {item.icon}
                  </div>

                  <div>
                    <p className="text-gray-100 text-[13px]">{item.label}</p>
                    <p className="text-[11px] text-gray-500">Category</p>
                  </div>
                </div>

                <span className="text-gray-100 text-[13px]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Documents + Tools */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <GlassCard className="xl:col-span-2">
          <SectionHeader title="Your Documents" />
          <div className="space-y-2.5 mt-3">
            {[
              { name: "Meeting_summary_jan.pdf", status: "AI summary ready" },
              { name: "Ideas_For_Mobile_App.txt", status: "Drafting" },
              { name: "Budget_Forecast.xlsx", status: "Uploaded" },
            ].map((doc, i) => (
              <DocumentRow key={i} doc={doc} />
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionHeader title="AI Tools" />
          <div className="mt-3 space-y-1.5">
            {[
              { label: "Generate summary", icon: <FiZap /> },
              { label: "Ask AI assistant", icon: <FiCpu /> },
              { label: "Analyze activity", icon: <FiBarChart2 /> },
              { label: "Settings", icon: <FiSettings /> },
            ].map((tool, i) => (
              <ToolButton key={i} tool={tool} />
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/* -----------------------------------------
   Reusable Components
----------------------------------------- */

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`
      relative
      bg-[#101018] border border-[#262632] rounded-2xl
      p-3.5 sm:p-4 md:p-5
      shadow-[0_12px_28px_rgba(0,0,0,0.65)]
      overflow-visible
      ${className}
    `}
  >
    {children}
  </div>
);

const StatCard = ({ title, value, sub, children }) => (
  <div
    className="
      relative
      bg-[#101018] border border-[#262632]
      rounded-2xl px-3.5 py-3 sm:px-4 sm:py-3.5
      shadow-[0_12px_26px_rgba(0,0,0,0.65)]
      flex flex-col justify-between
      min-h-[96px]
      overflow-visible
    "
  >
    <div>
      <p className="text-[11px] text-gray-400">{title}</p>
      <h2 className="text-xl sm:text-2xl font-semibold text-white mt-0.5">
        {value}
      </h2>
      {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
    </div>

    <div className="mt-2 h-10 sm:h-14 md:h-16 overflow-visible">
      {children}
    </div>
  </div>
);

const SectionHeader = ({ title }) => (
  <h3 className="text-base sm:text-lg font-semibold text-white">{title}</h3>
);

/* -----------------------------------------
   Document Row (Clickable + Glow A2)
----------------------------------------- */

const DocumentRow = ({ doc }) => (
  <button
    className="
      group relative w-full text-left
      bg-[#111118] 
      px-4 py-3 sm:px-4 sm:py-3 
      rounded-2xl border border-[#262632]
      flex items-center justify-between
      transition-all duration-200
      overflow-visible
      active:scale-[0.99]
    "
    onClick={() => console.log("Open document:", doc.name)}
  >
    {/* Glow layer */}
    <div
      className="
        absolute inset-0 rounded-2xl pointer-events-none
        opacity-0
        ring-1 ring-indigo-500/0
        shadow-[0_0_0px_rgba(99,102,241,0)]
        transition-all duration-200
        group-hover:opacity-100 group-hover:ring-indigo-500/40 group-hover:shadow-[0_0_22px_rgba(99,102,241,0.28)]
        group-active:opacity-100 group-active:ring-indigo-500/50 group-active:shadow-[0_0_24px_rgba(129,140,248,0.35)]
      "
    />

    <div className="flex items-center gap-3 relative z-10">
      <span
        className="
          h-10 w-10 rounded-xl bg-[#181822]
          flex items-center justify-center text-indigo-300
        "
      >
        <FiFileText />
      </span>

      <div>
        <p className="text-gray-100 text-[14px] font-medium leading-tight">
          {doc.name}
        </p>
        <p className="text-[11px] text-gray-500">{doc.status}</p>
      </div>
    </div>
  </button>
);

/* -----------------------------------------
   Tool Button (Clickable + Glow A2)
----------------------------------------- */

const ToolButton = ({ tool }) => (
  <button
    className="
      group relative w-full
      flex items-center justify-between
      bg-[#111118]
      px-4 py-3 sm:px-4 sm:py-3
      rounded-2xl border border-[#262632]
      transition-all duration-200
      overflow-visible
      active:scale-[0.99]
    "
    onClick={() => console.log("Clicked tool:", tool.label)}
  >
    {/* Glow layer */}
    <div
      className="
        absolute inset-0 rounded-2xl pointer-events-none
        opacity-0
        ring-1 ring-indigo-500/0
        shadow-[0_0_0px_rgba(99,102,241,0)]
        transition-all duration-200
        group-hover:opacity-100 group-hover:ring-indigo-500/40 group-hover:shadow-[0_0_22px_rgba(99,102,241,0.28)]
        group-active:opacity-100 group-active:ring-indigo-500/50 group-active:shadow-[0_0_24px_rgba(129,140,248,0.35)]
      "
    />

    <div className="flex items-center gap-3 relative z-10">
      <span
        className="
          h-10 w-10 rounded-xl bg-[#181822]
          flex items-center justify-center text-indigo-300
        "
      >
        {tool.icon}
      </span>

      <span className="text-gray-200 text-[14px]">
        {tool.label}
      </span>
    </div>

    <FiChevronRight className="text-gray-500 relative z-10" />
  </button>
);

/* -----------------------------------------
   Charts
----------------------------------------- */

/* -----------------------------------------
   Mini Sparkline Chart (Clean + Fixed)
----------------------------------------- */

const MiniLine = ({ data, color }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data.map((d, i) => ({ index: i, value: d }))}>
      <defs>
        <linearGradient id={`miniFill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.55} />
          <stop offset="80%" stopColor={color} stopOpacity={0.12} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      <Area
        type="monotone"
        dataKey="value"
        stroke={color}
        strokeWidth={1.9}
        fill={`url(#miniFill-${color})`}
        dot={false}
        activeDot={false}
      />
    </AreaChart>
  </ResponsiveContainer>
);


/* -----------------------------------------
   Activity Streak – 7 dots
----------------------------------------- */

const StreakDots = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex flex-wrap gap-2 mt-1 justify-start sm:justify-center">
      {days.map((day) => (
        <div key={day} className="flex flex-col items-center">
          <div
            className="
              flex items-center justify-center rounded-full
              w-3.5 h-3.5 sm:w-6 sm:h-6
              bg-[#635bff]
              shadow-[0_0_8px_rgba(99,91,255,0.35)]
              sm:shadow-[0_0_10px_rgba(99,91,255,0.45)]
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-[9px] sm:text-[10px] text-gray-500 mt-1">
            {day}
          </span>
        </div>
      ))}
    </div>
  );
};

/* -----------------------------------------
   Clarity Ring
----------------------------------------- */

const ClarityRing = ({ value }) => {
  const circumferenceOuter = 2 * Math.PI * 50;
  const circumferenceInner = 2 * Math.PI * 40;

  return (
    <div className="w-full flex items-center justify-end -mt-10 mb-3 sm:justify-center sm:-mt-10 sm:mb-3">
      <div className="relative">
        <svg width="82" height="82" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="outerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b28bff" />
              <stop offset="100%" stopColor="#f7c6ff" />
            </linearGradient>
            <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8e71ff" />
              <stop offset="100%" stopColor="#d7b3ff" />
            </linearGradient>
          </defs>

          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="url(#outerGradient)"
            strokeWidth="10"
            fill="none"
            opacity="0.35"
          />

          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="url(#outerGradient)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * circumferenceOuter} ${circumferenceOuter}`}
            transform="rotate(-90 60 60)"
            style={{ filter: "drop-shadow(0 0 3px rgba(178,139,255,0.3))" }}
          />

          <circle
            cx="60"
            cy="60"
            r="40"
            stroke="#ffffff10"
            strokeWidth="8"
            fill="none"
          />

          <circle
            cx="60"
            cy="60"
            r="40"
            stroke="url(#innerGradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * circumferenceInner} ${circumferenceInner}`}
            transform="rotate(-90 60 60)"
          />
        </svg>
      </div>
    </div>
  );
};




