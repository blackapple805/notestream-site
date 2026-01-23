
// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
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
  FiX,
  FiBell,
  FiTrendingUp,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import {
  House,
  MagnifyingGlass,
  Brain,
  Sparkle,
  Note,
  Bell,
  CalendarBlank,
} from "phosphor-react";
import GlassCard from "../components/GlassCard";
import { useWorkspaceSettings } from "../hooks/useWorkspaceSettings";

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
   Sample Data (would come from props/context in real app)
----------------------------------------- */
const sampleNotes = [
  {
    id: 1,
    title: "Team Meeting Notes",
    body: "Discuss deadline for Q2 deliverables. Remind John about the budget review. TODO: send meeting recap.",
    updated: new Date().toISOString(),
    favorite: true,
    tag: "Work",
  },
  {
    id: 2,
    title: "Project Roadmap Ideas",
    body: "Urgent: finalize feature list before Friday",
    updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    favorite: false,
    tag: "Ideas",
  },
  {
    id: 3,
    title: "Research Summary",
    body: "Meeting with design team tomorrow. Action item: prepare wireframes",
    updated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    favorite: true,
    tag: "Study",
  },
  {
    id: 4,
    title: "Client Call Prep",
    body: "Remember to follow up on proposal. Due date: next Monday",
    updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    favorite: false,
    tag: "Work",
  },
];

const recentDocs = [
  { name: "Meeting_summary_jan.pdf", status: "AI summary ready", type: "PDF" },
  { name: "Ideas_For_Mobile_App.txt", status: "Drafting", type: "TXT" },
  { name: "Budget_Forecast.xlsx", status: "Uploaded", type: "XLSX" },
];

/* -----------------------------------------
   Small UI Helpers (SQUIRCLE ICON TILE)
   Matches screenshot: rounded-square tile, NOT round.
----------------------------------------- */
const IconTile = ({ children, tone = "indigo", size = "md" }) => {
  const sizes = {
    sm: "h-10 w-10",
    md: "h-11 w-11",
    lg: "h-12 w-12",
  };

  // Slightly tighter rounding like screenshot
  const rounding = "rounded-[18px]";

  const toneMap = {
    indigo: {
      bg: "rgba(99,102,241,0.12)",
      border: "rgba(99,102,241,0.22)",
      text: "text-indigo-400",
    },
    purple: {
      bg: "rgba(168,85,247,0.12)",
      border: "rgba(168,85,247,0.22)",
      text: "text-purple-400",
    },
    emerald: {
      bg: "rgba(16,185,129,0.12)",
      border: "rgba(16,185,129,0.22)",
      text: "text-emerald-400",
    },
    amber: {
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.22)",
      text: "text-amber-400",
    },
    rose: {
      bg: "rgba(244,63,94,0.12)",
      border: "rgba(244,63,94,0.22)",
      text: "text-rose-400",
    },
    pink: {
      bg: "rgba(236,72,153,0.12)",
      border: "rgba(236,72,153,0.22)",
      text: "text-pink-400",
    },
  };

  const t = toneMap[tone] ?? toneMap.indigo;

  return (
    <div
      className={`${sizes[size]} ${rounding} border flex items-center justify-center ${t.text} shadow-[0_10px_28px_rgba(0,0,0,0.25)]`}
      style={{
        backgroundColor: t.bg,
        borderColor: t.border,
      }}
    >
      {children}
    </div>
  );
};

/* -----------------------------------------
   Dashboard Component
----------------------------------------- */
export default function Dashboard() {
  const navigate = useNavigate();
  const {
    settings,
    notifications,
    parseNotificationsFromNotes,
    dismissNotification,
    clearAllNotifications,
    generateDigest,
  } = useWorkspaceSettings();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showDigest, setShowDigest] = useState(false);
  const [digest, setDigest] = useState(null);

  useEffect(() => {
    if (settings.smartNotifications) {
      parseNotificationsFromNotes(sampleNotes);
    }
  }, [settings.smartNotifications, parseNotificationsFromNotes]);

  useEffect(() => {
    if (settings.weeklyDigest) {
      const digestData = generateDigest(sampleNotes, recentDocs);
      setDigest(digestData);
    }
  }, [settings.weeklyDigest, generateDigest]);

  const recentNotes = sampleNotes.slice(0, 3).map((note) => ({
    id: note.id,
    title: note.title,
    updated: note.id === 1 ? "Just now" : note.id === 2 ? "2h ago" : "Yesterday",
    hasAI: note.id !== 2,
  }));

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
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* SQUIRCLE icon tile like screenshot */}
            <IconTile tone="indigo" size="md">
              <House size={20} weight="duotone" />
            </IconTile>

            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-theme-primary leading-tight">
                {getGreeting()}
              </h1>
              <p className="text-theme-tertiary text-xs sm:text-sm mt-1">
                Welcome back — ready to continue where you left off?
              </p>
            </div>
          </div>

          {/* Notification Bell */}
          {settings.smartNotifications && notifications.length > 0 && (
            <button
              onClick={() => setShowNotifications(true)}
              className="relative transition active:scale-[0.98]"
              aria-label="Open notifications"
            >
              <IconTile tone="indigo" size="md">
                <Bell size={20} weight="duotone" />
              </IconTile>

              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {notifications.length}
              </span>
            </button>
          )}
        </div>

        {/* Quick Stats Row */}
        <div className="flex gap-3 mt-4">
          <QuickStat label="Today" value="3" suffix="notes" />
          <QuickStat label="Streak" value="11" suffix="days" highlight="indigo" />
          <QuickStat label="AI Used" value="54" suffix="times" highlight="emerald" />
        </div>
      </motion.div>

      {/* Smart Notifications Banner */}
      <AnimatePresence>
        {settings.smartNotifications && notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconTile tone="amber" size="md">
                    <FiBell size={18} />
                  </IconTile>

                  <div>
                    <h3 className="text-sm font-semibold text-theme-primary">
                      Smart Notifications
                    </h3>
                    <p className="text-xs text-theme-muted">
                      {notifications.length} item{notifications.length !== 1 ? "s" : ""} detected in your notes
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowNotifications(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 transition font-medium"
                >
                  View all →
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {notifications.slice(0, 2).map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-2xl border"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      borderColor: "var(--border-secondary)",
                    }}
                  >
                    <span className="text-lg">{notif.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-theme-secondary truncate">{notif.message}</p>
                      <p className="text-[10px] text-theme-muted">From: {notif.noteTitle}</p>
                    </div>
                    <span
                      className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${
                        notif.priority === "high"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {notif.priority}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly Digest Card */}
      <AnimatePresence>
        {settings.weeklyDigest && digest && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-indigo-500/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <IconTile tone="purple" size="md">
                    <CalendarBlank size={18} weight="duotone" />
                  </IconTile>

                  <div>
                    <h3 className="text-sm font-semibold text-theme-primary">Weekly Digest</h3>
                    <p className="text-xs text-theme-muted">
                      {digest.period.start} - {digest.period.end}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDigest(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition font-medium"
                >
                  Full report →
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div
                  className="p-3 rounded-2xl border text-center"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border-secondary)",
                  }}
                >
                  <p className="text-lg font-bold text-indigo-400">{digest.stats.notesCreated}</p>
                  <p className="text-[10px] text-theme-muted">Notes</p>
                </div>
                <div
                  className="p-3 rounded-2xl border text-center"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border-secondary)",
                  }}
                >
                  <p className="text-lg font-bold text-purple-400">{digest.stats.docsUploaded}</p>
                  <p className="text-[10px] text-theme-muted">Docs</p>
                </div>
                <div
                  className="p-3 rounded-2xl border text-center"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border-secondary)",
                  }}
                >
                  <p className="text-lg font-bold text-emerald-400">{digest.insights.productivity}</p>
                  <p className="text-[10px] text-theme-muted">Activity</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

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
          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-white/10">
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
        <h3 className="text-sm font-semibold text-theme-secondary mb-3 px-1">
          Quick Actions
        </h3>

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
              <IconTile tone="indigo" size="sm">
                <FiClock size={16} />
              </IconTile>

              <h3 className="text-base font-semibold text-theme-primary">Recent Notes</h3>
            </div>

            <button
              onClick={() => navigate("/dashboard/notes")}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition font-medium"
            >
              View all →
            </button>
          </div>

          <div className="space-y-2">
            {recentNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => navigate(`/dashboard/notes/${note.id}`)}
                className="group w-full text-left px-4 py-3 rounded-2xl border transition-all flex items-center justify-between active:scale-[0.995]"
                style={{
                  backgroundColor: "var(--bg-input)",
                  borderColor: "var(--border-primary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-card-hover)";
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-input)";
                  e.currentTarget.style.borderColor = "var(--border-primary)";
                }}
              >
                <div className="flex items-center gap-3">
                  <IconTile tone="indigo" size="sm">
                    <FiFileText size={16} />
                  </IconTile>

                  <div>
                    <p className="text-sm text-theme-secondary font-medium group-hover:text-theme-primary transition">
                      {note.title}
                    </p>
                    <p className="text-[11px] text-theme-muted">{note.updated}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {note.hasAI && <StatusTag type="success">AI Ready</StatusTag>}
                  <FiChevronRight
                    className="text-theme-muted group-hover:text-indigo-400 transition"
                    size={16}
                  />
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
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <IconTile tone="purple" size="sm">
                <FiFolder size={16} />
              </IconTile>

              <h3 className="text-base font-semibold text-theme-primary">Recent Documents</h3>
            </div>

            <button
              onClick={() => navigate("/dashboard/documents")}
              className="text-xs text-purple-400 hover:text-purple-300 transition font-medium"
            >
              View all →
            </button>
          </div>

          <div className="space-y-2">
            {recentDocs.map((doc, i) => (
              <DocumentRow
                key={i}
                doc={doc}
                onClick={() => navigate("/dashboard/documents")}
              />
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-3">
            <IconTile tone="amber" size="sm">
              <Sparkle size={18} weight="fill" />
            </IconTile>

            <h3 className="text-base font-semibold text-theme-primary">AI Tools</h3>
          </div>

          <div className="space-y-2">
            <ToolButton
              icon={<FiZap />}
              label="Generate Summary"
              desc="AI-powered note summaries"
              onClick={() => navigate("/dashboard/summaries")}
              tone="indigo"
            />
            <ToolButton
              icon={<FiCpu />}
              label="Ask AI Assistant"
              desc="Chat with your workspace"
              onClick={() => navigate("/dashboard/summaries")}
              tone="purple"
            />
            <ToolButton
              icon={<Brain size={18} weight="duotone" />}
              label="Research Synthesizer"
              desc="Merge documents into briefs"
              onClick={() => navigate("/dashboard/documents")}
              tone="pink"
            />
            <ToolButton
              icon={<FiSettings />}
              label="Settings"
              desc="Configure your workspace"
              onClick={() => navigate("/dashboard/settings")}
              tone="emerald"
            />
          </div>
        </GlassCard>
      </motion.div>

      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
            }}
            onClick={() => setShowNotifications(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl border"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-secondary)",
              }}
            >
              <div
                className="p-4 border-b flex items-center justify-between"
                style={{ borderColor: "var(--border-secondary)" }}
              >
                <div className="flex items-center gap-2">
                  <IconTile tone="amber" size="sm">
                    <FiBell size={18} />
                  </IconTile>

                  <div>
                    <h2 className="text-lg font-semibold text-theme-primary leading-tight">
                      Smart Notifications
                    </h2>
                    <p className="text-[11px] text-theme-muted">
                      {notifications.length} total
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowNotifications(false)}
                  className="transition active:scale-[0.98]"
                  aria-label="Close notifications"
                >
                  <IconTile tone="rose" size="sm">
                    <FiX size={16} />
                  </IconTile>
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[60vh] space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-center text-theme-muted py-8">No notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 p-3 rounded-2xl border group"
                      style={{
                        backgroundColor: "var(--bg-input)",
                        borderColor: "var(--border-secondary)",
                      }}
                    >
                      <span className="text-xl mt-0.5">{notif.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-theme-secondary">{notif.message}</p>
                        <p className="text-[11px] text-theme-muted mt-1">
                          From: {notif.noteTitle}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${
                            notif.priority === "high"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {notif.priority}
                        </span>

                        <button
                          onClick={() => dismissNotification(notif.id)}
                          className="text-[10px] text-theme-muted hover:text-rose-400 transition opacity-0 group-hover:opacity-100"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div
                  className="p-4 border-t"
                  style={{ borderColor: "var(--border-secondary)" }}
                >
                  <button
                    onClick={() => {
                      clearAllNotifications();
                      setShowNotifications(false);
                    }}
                    className="w-full py-2.5 rounded-xl text-sm font-medium text-theme-muted hover:text-theme-primary transition"
                    style={{ backgroundColor: "var(--bg-tertiary)" }}
                  >
                    Clear all notifications
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly Digest Modal */}
      <AnimatePresence>
        {showDigest && digest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
            }}
            onClick={() => setShowDigest(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-secondary)",
              }}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <IconTile tone="purple" size="md">
                      <FiTrendingUp size={18} />
                    </IconTile>

                    <div>
                      <h2 className="text-lg font-semibold text-theme-primary">Weekly Digest</h2>
                      <p className="text-xs text-theme-muted">
                        {digest.period.start} - {digest.period.end}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowDigest(false)}
                    className="transition active:scale-[0.98]"
                    aria-label="Close digest"
                  >
                    <IconTile tone="rose" size="md">
                      <FiX size={16} />
                    </IconTile>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <StatCard label="Notes Created" value={digest.stats.notesCreated} color="indigo" />
                  <StatCard label="Docs Uploaded" value={digest.stats.docsUploaded} color="purple" />
                  <StatCard label="Favorites" value={digest.stats.favoritedNotes} color="rose" />
                  <StatCard label="Synthesized" value={digest.stats.synthesizedDocs} color="emerald" />
                </div>

                <div
                  className="rounded-2xl p-4 mb-4 border"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border-secondary)",
                  }}
                >
                  <h3 className="text-sm font-semibold text-theme-primary mb-3">Insights</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-theme-muted">Most Active Day</span>
                      <span className="text-xs text-theme-secondary font-medium">
                        {digest.insights.mostActiveDay}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-theme-muted">Productivity Level</span>
                      <span
                        className={`text-xs font-medium ${
                          digest.insights.productivity === "High"
                            ? "text-emerald-400"
                            : digest.insights.productivity === "Medium"
                            ? "text-amber-400"
                            : "text-theme-secondary"
                        }`}
                      >
                        {digest.insights.productivity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-theme-muted">Total Items</span>
                      <span className="text-xs text-theme-secondary font-medium">
                        {digest.stats.totalItems}
                      </span>
                    </div>
                  </div>
                </div>

                {digest.insights.topTags.length > 0 && (
                  <div
                    className="rounded-2xl p-4 mb-4 border"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      borderColor: "var(--border-secondary)",
                    }}
                  >
                    <h3 className="text-sm font-semibold text-theme-primary mb-3">Top Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {digest.insights.topTags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs px-3 py-1.5 rounded-full border"
                          style={{
                            backgroundColor: "var(--bg-tertiary)",
                            borderColor: "var(--border-secondary)",
                          }}
                        >
                          <span className="text-theme-secondary">{tag.tag}</span>
                          <span className="text-theme-muted ml-1">({tag.count})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {digest.highlights.length > 0 && (
                  <div
                    className="rounded-2xl p-4 border"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      borderColor: "var(--border-secondary)",
                    }}
                  >
                    <h3 className="text-sm font-semibold text-theme-primary mb-3">⭐ Highlights</h3>
                    <div className="space-y-2">
                      {digest.highlights.map((h) => (
                        <div key={h.id} className="flex items-center gap-2 text-sm text-theme-secondary">
                          <span className="text-amber-400">•</span>
                          {h.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowDigest(false)}
                  className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium text-sm transition hover:opacity-90"
                >
                  Close Digest
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -----------------------------------------
   Stat Card for Digest
----------------------------------------- */
const StatCard = ({ label, value, color }) => {
  const colorMap = {
    indigo: "text-indigo-400",
    purple: "text-purple-400",
    rose: "text-rose-400",
    emerald: "text-emerald-400",
  };

  return (
    <div
      className="p-4 rounded-2xl border text-center"
      style={{
        backgroundColor: "var(--bg-input)",
        borderColor: "var(--border-secondary)",
      }}
    >
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
      <p className="text-[11px] text-theme-muted mt-1">{label}</p>
    </div>
  );
};

/* -----------------------------------------
   Quick Stat - Theme Aware
----------------------------------------- */
const QuickStat = ({ label, value, suffix, highlight }) => {
  const valueColor =
    highlight === "indigo"
      ? "text-indigo-400"
      : highlight === "emerald"
      ? "text-emerald-400"
      : "text-theme-primary";

  return (
    <div
      className="flex-1 rounded-2xl px-3 py-2.5 border"
      style={{
        backgroundColor: "var(--bg-elevated)",
        borderColor: "var(--border-secondary)",
      }}
    >
      <p className="text-[10px] text-theme-muted uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-semibold ${valueColor}`}>
        {value} <span className="text-sm font-normal text-theme-tertiary">{suffix}</span>
      </p>
    </div>
  );
};

/* -----------------------------------------
   Quick Action Button (UPDATED: SQUIRCLE ICON TILE)
----------------------------------------- */
const QuickAction = ({ icon, label, onClick, color = "indigo" }) => {
  const colorMap = {
    indigo: { bg: "from-indigo-500/10 to-indigo-600/5", icon: "text-indigo-400" },
    purple: { bg: "from-purple-500/10 to-purple-600/5", icon: "text-purple-400" },
    pink: { bg: "from-pink-500/10 to-pink-600/5", icon: "text-pink-400" },
    emerald: { bg: "from-emerald-500/10 to-emerald-600/5", icon: "text-emerald-400" },
  };
  const c = colorMap[color] ?? colorMap.indigo;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-br ${c.bg} border transition-all active:scale-[0.98]`}
      style={{ borderColor: "var(--border-secondary)" }}
    >
      <div
        className="h-12 w-12 rounded-[18px] border flex items-center justify-center shadow-[0_10px_28px_rgba(0,0,0,0.25)]"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          borderColor: "var(--border-secondary)",
        }}
      >
        <span className={c.icon}>{icon}</span>
      </div>
      <span className="text-xs text-theme-secondary">{label}</span>
    </button>
  );
};

/* -----------------------------------------
   Status Tag - Theme Aware
----------------------------------------- */
const StatusTag = ({ children, type = "success" }) => {
  const typeStyles = {
    success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
    error: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25",
    info: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
  };

  return (
    <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full border ${typeStyles[type]}`}>
      {children}
    </span>
  );
};

/* -----------------------------------------
   Document Row (UPDATED: SQUIRCLE ICON TILE)
----------------------------------------- */
const DocumentRow = ({ doc, onClick }) => (
  <button
    onClick={onClick}
    className="group w-full text-left px-4 py-3 rounded-2xl border transition-all flex items-center justify-between active:scale-[0.995]"
    style={{
      backgroundColor: "var(--bg-input)",
      borderColor: "var(--border-primary)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = "var(--bg-card-hover)";
      e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.3)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = "var(--bg-input)";
      e.currentTarget.style.borderColor = "var(--border-primary)";
    }}
  >
    <div className="flex items-center gap-3">
      <div
        className="h-11 w-11 rounded-[18px] border flex items-center justify-center shadow-[0_10px_28px_rgba(0,0,0,0.25)]"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          borderColor: "var(--border-secondary)",
        }}
      >
        <FiFileText className="text-purple-400" size={16} />
      </div>

      <div>
        <p className="text-sm text-theme-secondary font-medium truncate max-w-[180px]">{doc.name}</p>
        <p className="text-[11px] text-theme-muted">{doc.status}</p>
      </div>
    </div>

    <span
      className="text-[10px] text-theme-tertiary px-2 py-0.5 rounded-full border"
      style={{
        backgroundColor: "var(--bg-tertiary)",
        borderColor: "var(--border-secondary)",
      }}
    >
      {doc.type}
    </span>
  </button>
);

/* -----------------------------------------
   Tool Button (UPDATED: SQUIRCLE ICON TILE)
----------------------------------------- */
const ToolButton = ({ icon, label, desc, onClick, tone = "indigo" }) => {
  const toneMap = {
    indigo: "text-indigo-400",
    purple: "text-purple-400",
    pink: "text-pink-400",
    emerald: "text-emerald-400",
  };

  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all active:scale-[0.995]"
      style={{
        backgroundColor: "var(--bg-input)",
        borderColor: "var(--border-primary)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-card-hover)";
        e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bg-input)";
        e.currentTarget.style.borderColor = "var(--border-primary)";
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-11 w-11 rounded-[18px] border flex items-center justify-center shadow-[0_10px_28px_rgba(0,0,0,0.25)] ${
            toneMap[tone] ?? "text-indigo-400"
          }`}
          style={{
            backgroundColor: "var(--bg-tertiary)",
            borderColor: "var(--border-secondary)",
          }}
        >
          {icon}
        </div>

        <div className="text-left">
          <p className="text-sm text-theme-secondary font-medium">{label}</p>
          <p className="text-[11px] text-theme-muted">{desc}</p>
        </div>
      </div>

      <FiChevronRight className="text-theme-muted group-hover:text-indigo-400 transition" size={16} />
    </button>
  );
};


