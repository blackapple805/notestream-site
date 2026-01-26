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
  FiUpload,
  FiStar,
  FiCheckCircle,
  FiAlertCircle,
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
  Activity,
  Plugs,
  BezierCurve,
  Lightning,
  FileText,
  ChartLineUp,
  Star,
  Trophy,
  Target,
  Fire,
  Calendar,
  Warning,
  CheckSquare,
  Phone,
  Flag,
} from "phosphor-react";
import GlassCard from "../components/GlassCard";
import { useWorkspaceSettings } from "../hooks/useWorkspaceSettings";

/* -----------------------------------------
   Notification Icon Component - Neon styled icons
----------------------------------------- */
const NotificationIcon = ({ iconType }) => {
  // Map iconType to styled icon configuration
  const iconConfig = {
    calendar: { 
      icon: Calendar, 
      color: "text-indigo-400", 
      bg: "rgba(99,102,241,0.15)", 
      border: "rgba(99,102,241,0.3)" 
    },
    warning: { 
      icon: Warning, 
      color: "text-amber-400", 
      bg: "rgba(245,158,11,0.15)", 
      border: "rgba(245,158,11,0.3)" 
    },
    task: { 
      icon: CheckSquare, 
      color: "text-emerald-400", 
      bg: "rgba(16,185,129,0.15)", 
      border: "rgba(16,185,129,0.3)" 
    },
    bell: { 
      icon: Bell, 
      color: "text-amber-400", 
      bg: "rgba(245,158,11,0.15)", 
      border: "rgba(245,158,11,0.3)" 
    },
    meeting: { 
      icon: Phone, 
      color: "text-purple-400", 
      bg: "rgba(168,85,247,0.15)", 
      border: "rgba(168,85,247,0.3)" 
    },
    // Default fallback
    default: { 
      icon: Flag, 
      color: "text-indigo-400", 
      bg: "rgba(99,102,241,0.15)", 
      border: "rgba(99,102,241,0.3)" 
    },
  };

  const config = iconConfig[iconType] || iconConfig.default;
  const IconComponent = config.icon;

  return (
    <div 
      className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}
      style={{ 
        backgroundColor: config.bg, 
        border: `1px solid ${config.border}` 
      }}
    >
      <IconComponent size={18} weight="duotone" />
    </div>
  );
};

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
   Sample Data
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
];

const recentDocs = [
  { name: "Meeting_summary_jan.pdf", status: "AI summary ready", type: "PDF" },
  { name: "Ideas_For_Mobile_App.txt", status: "Drafting", type: "TXT" },
  { name: "Budget_Forecast.xlsx", status: "Uploaded", type: "XLSX" },
];

/* -----------------------------------------
   Icon Tile Component
----------------------------------------- */
const IconTile = ({ children, tone = "indigo", size = "md" }) => {
  const sizes = {
    sm: "h-10 w-10 rounded-xl",
    md: "h-11 w-11 rounded-xl",
    lg: "h-12 w-12 rounded-xl",
  };

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
    cyan: {
      bg: "rgba(6,182,212,0.12)",
      border: "rgba(6,182,212,0.22)",
      text: "text-cyan-400",
    },
  };

  const t = toneMap[tone] ?? toneMap.indigo;

  return (
    <div
      className={`${sizes[size]} border flex items-center justify-center ${t.text}`}
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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="w-full space-y-6 pb-[calc(var(--mobile-nav-height)+24px)]">
      {/* ═══════════════════════════════════════════════════════════
          HEADER SECTION - Fixed layout with bell on far right
      ═══════════════════════════════════════════════════════════ */}
      <motion.header
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4 }}
        className="pt-2"
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Icon + Text */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="page-header-icon flex-shrink-0">
              <House size={20} weight="duotone" />
            </div>
            <div className="min-w-0">
              <h1 className="page-header-title">{getGreeting()}</h1>
              <p className="page-header-subtitle truncate">
                Welcome back — ready to continue where you left off?
              </p>
            </div>
          </div>

          {/* Right side - Notification Bell */}
          {settings.smartNotifications && notifications.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(true)}
              className="relative flex-shrink-0"
              aria-label="Open notifications"
            >
              <IconTile tone="amber" size="md">
                <Bell size={20} weight="duotone" />
              </IconTile>
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[var(--bg-primary)]">
                {notifications.length}
              </span>
            </motion.button>
          )}
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <QuickStat 
            icon={<Note size={16} weight="duotone" />}
            label="Today" 
            value="3" 
            suffix="notes" 
            color="indigo"
          />
          <QuickStat 
            icon={<Fire size={16} weight="fill" />}
            label="Streak" 
            value="11" 
            suffix="days" 
            color="amber"
          />
          <QuickStat 
            icon={<Lightning size={16} weight="fill" />}
            label="AI Used" 
            value="54" 
            suffix="times" 
            color="emerald"
          />
        </div>
      </motion.header>



      {/* ═══════════════════════════════════════════════════════════
          WEEKLY DIGEST CARD
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {settings.weeklyDigest && digest && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <GlassCard className="border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.1))',
                      border: '1px solid rgba(139,92,246,0.3)',
                    }}
                  >
                    <ChartLineUp size={20} weight="duotone" className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-theme-primary">Weekly Digest</h3>
                    <p className="text-xs text-theme-muted">
                      {digest.period.start} - {digest.period.end}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDigest(true)}
                  className="text-xs transition font-medium px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0"
                  style={{
                    color: 'var(--accent-purple)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Full report →
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <DigestStatCard 
                  icon={<Note size={18} weight="duotone" />}
                  value={digest.stats.notesCreated} 
                  label="Notes" 
                  color="indigo" 
                />
                <DigestStatCard 
                  icon={<FileText size={18} weight="duotone" />}
                  value={digest.stats.docsUploaded} 
                  label="Docs" 
                  color="purple" 
                />
                <DigestStatCard 
                  icon={<Target size={18} weight="duotone" />}
                  value={digest.insights.productivity} 
                  label="Activity" 
                  color="emerald"
                  isText={true}
                />
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CTA BUTTON - Single Upload button
      ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(99, 102, 241, 0.3)" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/dashboard/notes")}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-medium text-sm text-white transition-all"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25)',
          }}
        >
          <FiPlus size={18} />
          <span>New Note / Upload</span>
        </motion.button>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          QUICK ACCESS GRID
      ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className="text-sm font-semibold text-theme-secondary mb-3 px-1">
          Quick Access
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            icon={<Activity size={22} weight="duotone" />}
            label="Activity"
            desc="View your history"
            onClick={() => navigate("/dashboard/activity")}
            color="cyan"
          />
          <QuickAction
            icon={<Plugs size={22} weight="duotone" />}
            label="Integrations"
            desc="Connect your apps"
            onClick={() => navigate("/dashboard/integrations")}
            color="purple"
          />
          <QuickAction
            icon={<BezierCurve size={22} weight="duotone" />}
            label="AI Lab"
            desc="Advanced AI tools"
            onClick={() => navigate("/dashboard/ai-lab")}
            color="amber"
            pro={true}
          />
          <QuickAction
            icon={<Note size={22} weight="duotone" />}
            label="New Note"
            desc="Start writing"
            onClick={() => navigate("/dashboard/notes")}
            color="emerald"
          />
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          RECENT NOTES
      ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
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
              <motion.button
                key={note.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(`/dashboard/notes/${note.id}`)}
                className="group w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ 
                      backgroundColor: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.2)',
                    }}
                  >
                    <FiFileText size={16} className="text-indigo-400" />
                  </div>
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
              </motion.button>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          DOCUMENTS + AI TOOLS GRID
      ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid grid-cols-1 xl:grid-cols-2 gap-4"
      >
        {/* Recent Documents */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
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

        {/* AI Tools */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
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

      {/* ═══════════════════════════════════════════════════════════
          NOTIFICATIONS MODAL - Fixed fullscreen blur
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto"
            style={{
              backgroundColor: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            onClick={() => setShowNotifications(false)}
          >
            {/* Inner container for proper centering with padding */}
            <div className="w-full min-h-full flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl border my-auto"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-secondary)",
                  boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
                }}
              >
                {/* Header */}
                <div
                  className="p-4 border-b flex items-center justify-between"
                  style={{ borderColor: "var(--border-secondary)" }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-10 w-10 rounded-xl flex items-center justify-center"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(249,115,22,0.1))',
                        border: '1px solid rgba(245,158,11,0.3)',
                      }}
                    >
                      <Bell size={18} weight="duotone" className="text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-theme-primary">
                        Smart Notifications
                      </h2>
                      <p className="text-xs text-theme-muted">
                        {notifications.length} total
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowNotifications(false)}
                    className="h-9 w-9 rounded-xl flex items-center justify-center transition"
                    style={{ 
                      backgroundColor: 'rgba(244,63,94,0.1)',
                      border: '1px solid rgba(244,63,94,0.2)',
                    }}
                  >
                    <FiX size={16} className="text-rose-400" />
                  </motion.button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[55vh] space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell size={40} weight="duotone" className="text-theme-muted mx-auto mb-3 opacity-50" />
                      <p className="text-theme-muted">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 p-3 rounded-xl border group transition-all hover:border-amber-500/30"
                        style={{
                          backgroundColor: "var(--bg-tertiary)",
                          borderColor: "var(--border-secondary)",
                        }}
                      >
                        <NotificationIcon iconType={notif.iconType} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-theme-secondary">{notif.message}</p>
                          <p className="text-[11px] text-theme-muted mt-1">
                            From: {notif.noteTitle}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${
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
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Footer */}
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
                      className="w-full py-3 rounded-xl text-sm font-medium text-theme-muted hover:text-theme-primary transition"
                      style={{ backgroundColor: "var(--bg-tertiary)" }}
                    >
                      Clear all notifications
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          WEEKLY DIGEST MODAL - Fixed fullscreen blur and scrolling
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDigest && digest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto"
            style={{
              backgroundColor: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            onClick={() => setShowDigest(false)}
          >
            {/* Inner container for proper centering with padding */}
            <div className="w-full min-h-full flex items-center justify-center p-4 py-8">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl border my-auto"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-secondary)",
                  boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
                }}
              >
                {/* Header */}
                <div className="p-5 border-b" style={{ borderColor: "var(--border-secondary)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-11 w-11 rounded-xl flex items-center justify-center"
                        style={{ 
                          background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.1))',
                          border: '1px solid rgba(139,92,246,0.3)',
                        }}
                      >
                        <ChartLineUp size={22} weight="duotone" className="text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-theme-primary">Weekly Digest</h2>
                        <p className="text-xs text-theme-muted">
                          {digest.period.start} - {digest.period.end}
                        </p>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowDigest(false)}
                      className="h-9 w-9 rounded-xl flex items-center justify-center transition"
                      style={{ 
                        backgroundColor: 'rgba(244,63,94,0.1)',
                        border: '1px solid rgba(244,63,94,0.2)',
                      }}
                    >
                      <FiX size={16} className="text-rose-400" />
                    </motion.button>
                  </div>
                </div>

                {/* Content - Scrollable */}
                <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Main Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <ModalStatCard 
                      icon={<Note size={20} weight="duotone" />}
                      value={digest.stats.notesCreated} 
                      label="Notes Created" 
                      color="indigo" 
                    />
                    <ModalStatCard 
                      icon={<FileText size={20} weight="duotone" />}
                      value={digest.stats.docsUploaded} 
                      label="Docs Uploaded" 
                      color="purple" 
                    />
                    <ModalStatCard 
                      icon={<Star size={20} weight="fill" />}
                      value={digest.stats.favoritedNotes} 
                      label="Favorites" 
                      color="rose" 
                    />
                    <ModalStatCard 
                      icon={<Brain size={20} weight="duotone" />}
                      value={digest.stats.synthesizedDocs} 
                      label="Synthesized" 
                      color="emerald" 
                    />
                  </div>

                  {/* Insights Section */}
                  <div
                    className="rounded-xl p-4 border"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      borderColor: "var(--border-secondary)",
                    }}
                  >
                    <h3 className="text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
                      <Target size={16} weight="duotone" className="text-purple-400" />
                      Insights
                    </h3>
                    <div className="space-y-3">
                      <InsightRow label="Most Active Day" value={digest.insights.mostActiveDay} />
                      <InsightRow 
                        label="Productivity Level" 
                        value={digest.insights.productivity}
                        valueColor={
                          digest.insights.productivity === "High" ? "text-emerald-400" :
                          digest.insights.productivity === "Medium" ? "text-amber-400" : "text-theme-secondary"
                        }
                      />
                      <InsightRow label="Total Items" value={digest.stats.totalItems} />
                    </div>
                  </div>

                  {/* Top Tags */}
                  {digest.insights.topTags.length > 0 && (
                    <div
                      className="rounded-xl p-4 border"
                      style={{
                        backgroundColor: "var(--bg-tertiary)",
                        borderColor: "var(--border-secondary)",
                      }}
                    >
                      <h3 className="text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
                        <FiFileText size={16} className="text-indigo-400" />
                        Top Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {digest.insights.topTags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs px-3 py-1.5 rounded-lg border"
                            style={{
                              backgroundColor: "var(--bg-input)",
                              borderColor: "var(--border-secondary)",
                            }}
                          >
                            <span className="text-theme-secondary">{tag.tag}</span>
                            <span className="text-theme-muted ml-1.5">({tag.count})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Highlights */}
                  {digest.highlights.length > 0 && (
                    <div
                      className="rounded-xl p-4 border"
                      style={{
                        backgroundColor: "var(--bg-tertiary)",
                        borderColor: "var(--border-secondary)",
                      }}
                    >
                      <h3 className="text-sm font-semibold text-theme-primary mb-3 flex items-center gap-2">
                        <Star size={16} weight="fill" className="text-amber-400" />
                        Highlights
                      </h3>
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
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HELPER COMPONENTS
═══════════════════════════════════════════════════════════ */

/* Quick Stat - Improved with icon */
const QuickStat = ({ icon, label, value, suffix, color }) => {
  const colorMap = {
    indigo: { text: "text-indigo-400", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)" },
    amber: { text: "text-amber-400", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" },
    emerald: { text: "text-emerald-400", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <div
      className="rounded-xl px-3 py-3 border"
      style={{
        backgroundColor: "var(--bg-tertiary)",
        borderColor: "var(--border-secondary)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={c.text}>{icon}</span>
        <p className="text-[10px] text-theme-muted uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-xl font-bold ${c.text}`}>
        {value} <span className="text-sm font-normal text-theme-muted">{suffix}</span>
      </p>
    </div>
  );
};

/* Digest Stat Card - For the banner */
const DigestStatCard = ({ icon, value, label, color, isText = false }) => {
  const colorMap = {
    indigo: "text-indigo-400",
    purple: "text-purple-400",
    emerald: "text-emerald-400",
    rose: "text-rose-400",
  };

  return (
    <div
      className="p-3 rounded-xl border text-center"
      style={{
        backgroundColor: "var(--bg-tertiary)",
        borderColor: "var(--border-secondary)",
      }}
    >
      <div className={`${colorMap[color]} mb-1 flex justify-center`}>{icon}</div>
      <p className={`${isText ? 'text-base' : 'text-xl'} font-bold ${colorMap[color]}`}>{value}</p>
      <p className="text-[10px] text-theme-muted">{label}</p>
    </div>
  );
};

/* Modal Stat Card - For the digest modal */
const ModalStatCard = ({ icon, value, label, color }) => {
  const colorMap = {
    indigo: { text: "text-indigo-400", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)" },
    purple: { text: "text-purple-400", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.2)" },
    rose: { text: "text-rose-400", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.2)" },
    emerald: { text: "text-emerald-400", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <div
      className="p-4 rounded-xl border text-center"
      style={{
        backgroundColor: "var(--bg-tertiary)",
        borderColor: "var(--border-secondary)",
      }}
    >
      <div 
        className={`${c.text} w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center`}
        style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}
      >
        {icon}
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      <p className="text-[11px] text-theme-muted mt-1">{label}</p>
    </div>
  );
};

/* Insight Row */
const InsightRow = ({ label, value, valueColor = "text-theme-secondary" }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-theme-muted">{label}</span>
    <span className={`text-xs font-medium ${valueColor}`}>{value}</span>
  </div>
);

/* Quick Action Button */
const QuickAction = ({ icon, label, desc, onClick, color = "indigo", pro = false }) => {
  const colorMap = {
    indigo: { bg: "from-indigo-500/10 to-indigo-600/5", icon: "text-indigo-400", border: "rgba(99,102,241,0.2)" },
    purple: { bg: "from-purple-500/10 to-purple-600/5", icon: "text-purple-400", border: "rgba(168,85,247,0.2)" },
    pink: { bg: "from-pink-500/10 to-pink-600/5", icon: "text-pink-400", border: "rgba(236,72,153,0.2)" },
    emerald: { bg: "from-emerald-500/10 to-emerald-600/5", icon: "text-emerald-400", border: "rgba(16,185,129,0.2)" },
    amber: { bg: "from-amber-500/10 to-amber-600/5", icon: "text-amber-400", border: "rgba(245,158,11,0.2)" },
    cyan: { bg: "from-cyan-500/10 to-cyan-600/5", icon: "text-cyan-400", border: "rgba(6,182,212,0.2)" },
  };
  const c = colorMap[color] ?? colorMap.indigo;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-2 py-5 rounded-xl bg-gradient-to-br ${c.bg} border transition-all`}
      style={{ borderColor: "var(--border-secondary)" }}
    >
      {pro && (
        <span 
          className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-md font-semibold"
          style={{
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            color: "#f59e0b",
            border: "1px solid rgba(245, 158, 11, 0.25)",
          }}
        >
          PRO
        </span>
      )}

      <div
        className="h-12 w-12 rounded-xl border flex items-center justify-center"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          borderColor: c.border,
        }}
      >
        <span className={c.icon}>{icon}</span>
      </div>
      <div className="text-center">
        <span className="text-sm font-medium text-theme-secondary block">{label}</span>
        {desc && <span className="text-[10px] text-theme-muted">{desc}</span>}
      </div>
    </motion.button>
  );
};

/* Status Tag */
const StatusTag = ({ children, type = "success" }) => {
  const typeStyles = {
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    error: "bg-rose-500/15 text-rose-400 border-rose-500/25",
    info: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  };

  return (
    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border ${typeStyles[type]}`}>
      {children}
    </span>
  );
};

/* Document Row */
const DocumentRow = ({ doc, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
    className="group w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between"
    style={{
      backgroundColor: "var(--bg-tertiary)",
      borderColor: "var(--border-secondary)",
    }}
  >
    <div className="flex items-center gap-3">
      <div
        className="h-10 w-10 rounded-xl border flex items-center justify-center"
        style={{
          backgroundColor: "rgba(168,85,247,0.1)",
          borderColor: "rgba(168,85,247,0.2)",
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
      className="text-[10px] text-theme-muted px-2 py-1 rounded-lg border"
      style={{
        backgroundColor: "var(--bg-input)",
        borderColor: "var(--border-secondary)",
      }}
    >
      {doc.type}
    </span>
  </motion.button>
);

/* Tool Button */
const ToolButton = ({ icon, label, desc, onClick, tone = "indigo" }) => {
  const toneMap = {
    indigo: { text: "text-indigo-400", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)" },
    purple: { text: "text-purple-400", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.2)" },
    pink: { text: "text-pink-400", bg: "rgba(236,72,153,0.1)", border: "rgba(236,72,153,0.2)" },
    emerald: { text: "text-emerald-400", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" },
  };
  const t = toneMap[tone] || toneMap.indigo;

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all"
      style={{
        backgroundColor: "var(--bg-tertiary)",
        borderColor: "var(--border-secondary)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-xl border flex items-center justify-center ${t.text}`}
          style={{
            backgroundColor: t.bg,
            borderColor: t.border,
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
    </motion.button>
  );
};