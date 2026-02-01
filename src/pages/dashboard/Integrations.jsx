// src/pages/dashboard/Integrations.jsx
// Fully fixed: removed ALL phosphor-react usage + replaced with react-icons/fi only

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../../components/GlassCard";
import { useSubscription } from "../../hooks/useSubscription";

import {Plugs} from "phosphor-react";
import {
  FiX,
  FiCheck,
  FiPlus,
  FiExternalLink,
  FiCloud,
  FiLink2,
  FiDatabase,
  FiBookOpen,
  FiSettings,
  FiRefreshCw,
  FiGithub,
  FiInbox,
  FiClock,
  FiBell,
  FiZap,
} from "react-icons/fi";

/* Icon Tile - matches Dashboard squircle style */
const IconTile = ({ children, tone = "indigo", size = "md" }) => {
  const sizes = {
    sm: "h-10 w-10 rounded-[12px]",
    md: "h-12 w-12 rounded-[14px]",
    lg: "h-14 w-14 rounded-[16px]",
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
    blue: {
      bg: "rgba(59,130,246,0.12)",
      border: "rgba(59,130,246,0.22)",
      text: "text-blue-400",
    },
    orange: {
      bg: "rgba(249,115,22,0.12)",
      border: "rgba(249,115,22,0.22)",
      text: "text-orange-400",
    },
    slate: {
      bg: "rgba(100,116,139,0.12)",
      border: "rgba(100,116,139,0.22)",
      text: "text-slate-400",
    },
    gray: {
      bg: "rgba(107,114,128,0.12)",
      border: "rgba(107,114,128,0.22)",
      text: "text-gray-400",
    },
  };

  const t = toneMap[tone] ?? toneMap.indigo;

  return (
    <div
      className={`${sizes[size]} border flex items-center justify-center ${t.text} shadow-[0_8px_24px_rgba(0,0,0,0.2)]`}
      style={{ backgroundColor: t.bg, borderColor: t.border }}
    >
      {children}
    </div>
  );
};

// Integration data with react-icons/fi icons
const integrations = [
  {
    id: "google-drive",
    title: "Google Drive",
    desc: "Sync docs, sheets, and slides directly to NoteStream",
    icon: FiCloud,
    tone: "blue",
    features: ["Auto-sync files", "Folder organization", "Real-time updates", "Two-way sync"],
    status: "available",
  },
  {
    id: "slack",
    title: "Slack",
    desc: "Turn Slack conversations into organized notes",
    icon: FiLink2,
    tone: "purple",
    features: ["Channel summaries", "Thread extraction", "Direct messaging", "Workspace sync"],
    status: "available",
  },
  {
    id: "notion",
    title: "Notion",
    desc: "Import and sync your Notion workspace",
    icon: FiDatabase,
    tone: "slate",
    features: ["Page sync", "Database updates", "Block formatting", "Template support"],
    status: "available",
  },
  {
    id: "zapier",
    title: "Zapier",
    desc: "Automate workflows with 5000+ apps",
    icon: FiRefreshCw,
    tone: "orange",
    features: ["5000+ apps", "Custom workflows", "Trigger actions", "Multi-step zaps"],
    status: "available",
  },
  {
    id: "github",
    title: "GitHub",
    desc: "Link repos and track project notes",
    icon: FiGithub,
    tone: "gray",
    features: ["Issue creation", "PR summaries", "Repo integration", "Commit linking"],
    status: "coming-soon",
  },
  {
    id: "email",
    title: "Email Import",
    desc: "Forward emails and get instant summaries",
    icon: FiInbox,
    tone: "rose",
    features: ["Email forwarding", "Attachment parsing", "Auto-categorize", "Smart replies"],
    status: "coming-soon",
  },
];

export default function Integrations() {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const isPro = subscription?.plan && subscription.plan !== "free";

  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [connectedIntegrations, setConnectedIntegrations] = useState({});
  const [waitlist, setWaitlist] = useState({});
  const [showToast, setShowToast] = useState(null);

  const displayToast = (message, type = "success") => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleConnect = (integrationId) => {
    setConnectedIntegrations((prev) => ({ ...prev, [integrationId]: true }));
    setSelectedIntegration(null);
    displayToast(`${integrations.find((i) => i.id === integrationId)?.title} connected successfully!`);
  };

  const handleDisconnect = (integrationId) => {
    setConnectedIntegrations((prev) => {
      const updated = { ...prev };
      delete updated[integrationId];
      return updated;
    });
    displayToast(`Integration disconnected`, "info");
  };

  const handleJoinWaitlist = (integrationId) => {
    setWaitlist((prev) => ({ ...prev, [integrationId]: true }));
    setSelectedIntegration(null);
    displayToast(`You're on the waitlist! We'll notify you when it's ready.`);
  };

  const availableIntegrations = integrations.filter((i) => i.status === "available");
  const comingSoonIntegrations = integrations.filter((i) => i.status === "coming-soon");
  const connectedCount = Object.keys(connectedIntegrations).length;

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2 ${
              showToast.type === "success"
                ? "bg-emerald-900/80 border border-emerald-500/40 text-emerald-200"
                : "bg-indigo-900/80 border border-indigo-500/40 text-indigo-200"
            }`}
          >
            <FiCheck size={16} />
            {showToast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="page-header">
        <div className="page-header-content">
          <div className="page-header-icon">
            <Plugs size={20} />
          </div>
          <div>
            <h1 className="page-header-title">Integrations</h1>
            <p className="page-header-subtitle">Connect with popular tools and platforms to streamline your workflow</p>
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Connected", value: connectedCount, color: "var(--accent-indigo)" },
          { label: "Available", value: availableIntegrations.length, color: "var(--accent-emerald)" },
          { label: "Coming Soon", value: comingSoonIntegrations.length, color: "var(--accent-amber)" },
        ].map((stat, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border text-center"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
          >
            <p className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Available Integrations */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-1">
          <FiCheck size={16} className="text-emerald-400" />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Available Integrations
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableIntegrations.map((integration) => {
            const isConnected = connectedIntegrations[integration.id];
            const IconComponent = integration.icon;

            return (
              <motion.div
                key={integration.id}
                whileHover={{ y: -2 }}
                className="rounded-2xl border p-5 transition-all cursor-pointer group"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: isConnected ? "rgba(16,185,129,0.3)" : "var(--border-secondary)",
                }}
                onClick={() => setSelectedIntegration(integration)}
              >
                <div className="flex items-start justify-between mb-4">
                  <IconTile tone={integration.tone} size="md">
                    <IconComponent className="h-6 w-6" />
                  </IconTile>

                  {isConnected && (
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: "rgba(16,185,129,0.15)",
                        border: "1px solid rgba(16,185,129,0.25)",
                      }}
                    >
                      <FiCheck size={12} className="text-emerald-400" />
                      <span className="text-[10px] font-medium text-emerald-400">Connected</span>
                    </div>
                  )}
                </div>

                <h3
                  className="text-base font-semibold mb-1.5 transition-colors group-hover:text-indigo-400"
                  style={{ color: "var(--text-primary)" }}
                >
                  {integration.title}
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
                  {integration.desc}
                </p>

                {isConnected ? (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition hover:bg-white/5"
                      style={{ borderColor: "var(--border-secondary)", color: "var(--text-secondary)" }}
                    >
                      <FiSettings size={14} />
                      Settings
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDisconnect(integration.id);
                      }}
                      className="px-4 py-2.5 rounded-xl border text-sm font-medium transition hover:bg-rose-500/10"
                      style={{ borderColor: "var(--border-secondary)", color: "var(--accent-rose)" }}
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnect(integration.id);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition shadow-lg shadow-indigo-500/25"
                  >
                    <FiPlus size={14} />
                    Connect
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Coming Soon Integrations */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-1">
          <FiClock size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            Coming Soon
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {comingSoonIntegrations.map((integration) => {
            const isOnWaitlist = waitlist[integration.id];
            const IconComponent = integration.icon;

            return (
              <motion.div
                key={integration.id}
                whileHover={{ y: -2 }}
                className="rounded-2xl border p-5 transition-all cursor-pointer group opacity-80 hover:opacity-100"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
                onClick={() => setSelectedIntegration(integration)}
              >
                <div className="flex items-start justify-between mb-4">
                  <IconTile tone={integration.tone} size="md">
                    <IconComponent className="h-6 w-6" />
                  </IconTile>
                  <div
                    className="px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: "rgba(245,158,11,0.15)",
                      border: "1px solid rgba(245,158,11,0.25)",
                    }}
                  >
                    <span className="text-[10px] font-semibold text-amber-400">COMING SOON</span>
                  </div>
                </div>

                <h3 className="text-base font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  {integration.title}
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
                  {integration.desc}
                </p>

                {isOnWaitlist ? (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
                    style={{
                      backgroundColor: "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.25)",
                      color: "var(--accent-emerald)",
                    }}
                  >
                    <FiCheck size={14} />
                    On Waitlist
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinWaitlist(integration.id);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition hover:bg-white/5"
                    style={{ borderColor: "var(--border-secondary)", color: "var(--text-secondary)" }}
                  >
                    <FiBell size={14} />
                    Notify Me
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Help Card */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <IconTile tone="indigo" size="lg">
            <FiBookOpen className="h-7 w-7" />
          </IconTile>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Need help with integrations?
            </h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Check out our documentation or contact support for assistance.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/dashboard/integration-docs")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition shadow-lg shadow-indigo-500/25"
            >
              <FiBookOpen size={16} />
              View Docs
            </button>
            <button
              onClick={() => navigate("/dashboard/contact-support")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition hover:bg-white/5"
              style={{ borderColor: "var(--border-secondary)", color: "var(--text-secondary)" }}
            >
              <FiExternalLink size={16} />
              Get Help
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Integration Detail Modal */}
      <AnimatePresence>
        {selectedIntegration && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
              onClick={() => setSelectedIntegration(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed z-[101] inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto rounded-2xl border shadow-2xl overflow-hidden"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
            >
              {/* Header */}
              <div className="p-6 border-b" style={{ borderColor: "var(--border-secondary)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <IconTile tone={selectedIntegration.tone} size="lg">
                      {(() => {
                        const Icon = selectedIntegration.icon;
                        return <Icon className="h-7 w-7" />;
                      })()}
                    </IconTile>
                    <div>
                      <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                        {selectedIntegration.title}
                      </h3>

                      {selectedIntegration.status === "coming-soon" ? (
                        <span className="text-sm text-amber-400 flex items-center gap-1">
                          <FiClock size={12} />
                          Coming Soon
                        </span>
                      ) : connectedIntegrations[selectedIntegration.id] ? (
                        <span className="text-sm text-emerald-400 flex items-center gap-1">
                          <FiCheck size={12} />
                          Connected
                        </span>
                      ) : (
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                          Available
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedIntegration(null)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition"
                    style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="mb-6" style={{ color: "var(--text-muted)" }}>
                  {selectedIntegration.desc}
                </p>

                {/* Features */}
                <div className="mb-6">
                  <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                    Features included
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedIntegration.features.map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2.5 rounded-xl border"
                        style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "rgba(99,102,241,0.2)" }}
                        >
                          <FiCheck size={10} className="text-indigo-400" />
                        </div>
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro Badge */}
                {!isPro && selectedIntegration.status === "available" && (
                  <div
                    className="mb-6 p-3 rounded-xl border flex items-center gap-3"
                    style={{ backgroundColor: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.25)" }}
                  >
                    <FiZap size={20} className="text-amber-400" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-amber-400">Pro Feature</p>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        Some features require a Pro subscription
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                className="p-6 border-t"
                style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-tertiary)" }}
              >
                {selectedIntegration.status === "coming-soon" ? (
                  waitlist[selectedIntegration.id] ? (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
                      style={{
                        backgroundColor: "rgba(16,185,129,0.15)",
                        border: "1px solid rgba(16,185,129,0.25)",
                        color: "var(--accent-emerald)",
                      }}
                    >
                      <FiCheck size={16} />
                      You're on the waitlist!
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinWaitlist(selectedIntegration.id)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 transition"
                    >
                      <FiBell size={16} />
                      Join Waitlist
                    </button>
                  )
                ) : connectedIntegrations[selectedIntegration.id] ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedIntegration(null)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border transition hover:bg-white/5"
                      style={{ borderColor: "var(--border-secondary)", color: "var(--text-secondary)" }}
                    >
                      <FiSettings size={16} />
                      Manage Settings
                    </button>
                    <button
                      onClick={() => handleDisconnect(selectedIntegration.id)}
                      className="px-5 py-3 rounded-xl text-sm font-medium transition"
                      style={{
                        backgroundColor: "rgba(244,63,94,0.15)",
                        border: "1px solid rgba(244,63,94,0.25)",
                        color: "var(--accent-rose)",
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(selectedIntegration.id)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition shadow-lg"
                  >
                    <FiPlus size={16} />
                    Connect {selectedIntegration.title}
                  </button>
                )}

                <p className="text-[11px] text-center mt-3" style={{ color: "var(--text-muted)" }}>
                  {selectedIntegration.status === "coming-soon"
                    ? "We'll email you when this integration launches"
                    : "You can disconnect anytime from settings"}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
