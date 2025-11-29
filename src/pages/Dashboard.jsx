// src/pages/Dashboard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiFileText,
  FiZap,
  FiCpu,
  FiSettings,
  FiChevronRight,
  FiPlus,
  FiClock,
  FiUploadCloud,
  FiFolder,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { House, MagnifyingGlass, Brain, Sparkle, Note } from "phosphor-react";
import GlassCard from "../components/GlassCard";

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
   Recent Items Data
----------------------------------------- */
const recentNotes = [
  { id: 1, title: "Team Meeting Notes", updated: "Just now", hasAI: true },
  { id: 2, title: "Project Roadmap Ideas", updated: "2h ago", hasAI: false },
  { id: 3, title: "Research Summary", updated: "Yesterday", hasAI: true },
];

const recentDocs = [
  { name: "Meeting_summary_jan.pdf", status: "AI summary ready", type: "PDF" },
  { name: "Ideas_For_Mobile_App.txt", status: "Drafting", type: "TXT" },
  { name: "Budget_Forecast.xlsx", status: "Uploaded", type: "XLSX" },
];

/* -----------------------------------------
   Dashboard Component
----------------------------------------- */
export default function Dashboard() {
  const navigate = useNavigate();

  const fadeSlide = {
    hidden: { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-[calc(var(--mobile-nav-height)+24px)]">
      {/* Greeting */}
      <motion.div
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.45 }}
        className="pt-2 px-1 sm:px-0"
      >
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            {getGreeting()}
          </h1>
          <House className="text-indigo-400" size={28} weight="duotone" />
        </div>
        <p className="text-gray-400 text-xs sm:text-sm mt-1">
          Welcome back — ready to continue where you left off?
        </p>

        {/* Quick Stats Row */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-[#15151c] border border-[#262632] rounded-xl px-3 py-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Today</p>
            <p className="text-lg font-semibold text-white">3 <span className="text-sm font-normal text-gray-400">notes</span></p>
          </div>
          <div className="flex-1 bg-[#15151c] border border-[#262632] rounded-xl px-3 py-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Streak</p>
            <p className="text-lg font-semibold text-indigo-400">11 <span className="text-sm font-normal text-gray-400">days</span></p>
          </div>
          <div className="flex-1 bg-[#15151c] border border-[#262632] rounded-xl px-3 py-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">AI Used</p>
            <p className="text-lg font-semibold text-emerald-400">54 <span className="text-sm font-normal text-gray-400">times</span></p>
          </div>
        </div>
      </motion.div>

      {/* Main CTA Button */}
      <motion.div
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.45, delay: 0.1 }}
        className="flex justify-center w-full"
      >
        <button
          onClick={() => navigate("/dashboard/notes")}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium shadow-[0_18px_40px_rgba(15,23,42,0.55)] active:opacity-90 transition-all w-full py-3.5 rounded-full text-sm sm:w-[80%] md:w-[60%]"
        >
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/10">
            <FiPlus className="text-[15px]" />
          </span>
          New Note / Upload
        </button>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.45, delay: 0.15 }}
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-3 px-1">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction
            icon={<Note size={22} weight="duotone" />}
            label="My Notes"
            onClick={() => navigate("/dashboard/notes")}
            color="indigo"
          />
          <QuickAction
            icon={<MagnifyingGlass size={22} weight="duotone" />}
            label="Insights"
            onClick={() => navigate("/dashboard/summaries")}
            color="purple"
          />
          <QuickAction
            icon={<Brain size={22} weight="duotone" />}
            label="Research"
            onClick={() => navigate("/dashboard/documents")}
            color="pink"
          />
          <QuickAction
            icon={<FiUploadCloud size={20} />}
            label="Upload"
            onClick={() => navigate("/dashboard/documents")}
            color="emerald"
          />
        </div>
      </motion.div>

      {/* Recent Notes */}
      <motion.div
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.45, delay: 0.2 }}
      >
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FiClock className="text-indigo-400" size={16} />
              <h3 className="text-base font-semibold text-white">Recent Notes</h3>
            </div>
            <button 
              onClick={() => navigate("/dashboard/notes")}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition"
            >
              View all →
            </button>
          </div>

          <div className="space-y-2">
            {recentNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => navigate(`/dashboard/notes/${note.id}`)}
                className="group w-full text-left bg-[#0d0d14] hover:bg-[#131320] px-4 py-3 rounded-xl border border-[#1f1f27] hover:border-indigo-500/30 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-[#181822] flex items-center justify-center">
                    <FiFileText className="text-indigo-300" size={16} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-100 font-medium group-hover:text-white transition">
                      {note.title}
                    </p>
                    <p className="text-[11px] text-gray-500">{note.updated}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {note.hasAI && (
                    <span className="text-[9px] bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded-full">
                      AI Ready
                    </span>
                  )}
                  <FiChevronRight className="text-gray-500 group-hover:text-indigo-400 transition" size={16} />
                </div>
              </button>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Documents + AI Tools */}
      <motion.div
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.45, delay: 0.25 }}
        className="grid grid-cols-1 xl:grid-cols-2 gap-4"
      >
        {/* Recent Documents */}
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FiFolder className="text-purple-400" size={16} />
              <h3 className="text-base font-semibold text-white">Recent Documents</h3>
            </div>
            <button 
              onClick={() => navigate("/dashboard/documents")}
              className="text-xs text-purple-400 hover:text-purple-300 transition"
            >
              View all →
            </button>
          </div>

          <div className="space-y-2">
            {recentDocs.map((doc, i) => (
              <DocumentRow key={i} doc={doc} onClick={() => navigate("/dashboard/documents")} />
            ))}
          </div>
        </GlassCard>

        {/* AI Tools */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <Sparkle className="text-amber-400" size={18} weight="fill" />
            <h3 className="text-base font-semibold text-white">AI Tools</h3>
          </div>

          <div className="space-y-2">
            <ToolButton 
              icon={<FiZap />} 
              label="Generate Summary" 
              desc="AI-powered note summaries"
              onClick={() => navigate("/dashboard/summaries")}
            />
            <ToolButton 
              icon={<FiCpu />} 
              label="Ask AI Assistant" 
              desc="Chat with your workspace"
              onClick={() => navigate("/dashboard/summaries")}
            />
            <ToolButton 
              icon={<Brain size={18} weight="duotone" />} 
              label="Research Synthesizer" 
              desc="Merge documents into briefs"
              onClick={() => navigate("/dashboard/documents")}
            />
            <ToolButton 
              icon={<FiSettings />} 
              label="Settings" 
              desc="Configure your workspace"
              onClick={() => navigate("/dashboard/settings")}
            />
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

/* -----------------------------------------
   Quick Action Button
----------------------------------------- */
const QuickAction = ({ icon, label, onClick, color = "indigo" }) => {
  const colorMap = {
    indigo: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 hover:border-indigo-500/50",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50",
    pink: "from-pink-500/20 to-pink-600/10 border-pink-500/30 hover:border-pink-500/50",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-500/50",
  };

  const iconColorMap = {
    indigo: "text-indigo-400",
    purple: "text-purple-400",
    pink: "text-pink-400",
    emerald: "text-emerald-400",
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-br ${colorMap[color]} border transition-all active:scale-[0.98]`}
    >
      <span className={iconColorMap[color]}>{icon}</span>
      <span className="text-xs text-gray-300">{label}</span>
    </button>
  );
};

/* -----------------------------------------
   Document Row
----------------------------------------- */
const DocumentRow = ({ doc, onClick }) => (
  <button
    onClick={onClick}
    className="group w-full text-left bg-[#0d0d14] hover:bg-[#131320] px-4 py-3 rounded-xl border border-[#1f1f27] hover:border-purple-500/30 transition-all flex items-center justify-between"
  >
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-[#181822] flex items-center justify-center">
        <FiFileText className="text-purple-300" size={16} />
      </div>
      <div>
        <p className="text-sm text-gray-100 font-medium truncate max-w-[180px]">{doc.name}</p>
        <p className="text-[11px] text-gray-500">{doc.status}</p>
      </div>
    </div>
    <span className="text-[10px] bg-[#1a1a24] text-gray-400 px-2 py-0.5 rounded">{doc.type}</span>
  </button>
);

/* -----------------------------------------
   Tool Button
----------------------------------------- */
const ToolButton = ({ icon, label, desc, onClick }) => (
  <button
    onClick={onClick}
    className="group w-full flex items-center justify-between bg-[#0d0d14] hover:bg-[#131320] px-4 py-3 rounded-xl border border-[#1f1f27] hover:border-indigo-500/30 transition-all"
  >
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-[#181822] flex items-center justify-center text-indigo-300">
        {icon}
      </div>
      <div className="text-left">
        <p className="text-sm text-gray-100 font-medium">{label}</p>
        <p className="text-[11px] text-gray-500">{desc}</p>
      </div>
    </div>
    <FiChevronRight className="text-gray-500 group-hover:text-indigo-400 transition" size={16} />
  </button>
);
