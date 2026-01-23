// src/pages/dashboard/Integrations.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../../components/GlassCard";
import { useSubscription } from "../../hooks/useSubscription";
import {
  FiLink2,
  FiCloud,
  FiDatabase,
  FiGlobe,
  FiMail,
  FiGithub,
  FiX,
  FiCheck,
  FiPlus,
  FiExternalLink,
  FiBell,
  FiBookOpen,
  FiSettings,
  FiRefreshCw,
} from "react-icons/fi";
import {
  Lightning,
  CheckCircle,
  Clock,
  Bell,
  Plugs,
  BookOpen,
  Gear,
} from "phosphor-react";

// Integration data
const integrations = [
  {
    id: "google-drive",
    title: "Google Drive",
    desc: "Sync notes, PDFs, and screenshots directly from your Drive workspace.",
    icon: FiCloud,
    iconBg: "bg-blue-500/15",
    iconBorder: "border-blue-500/25",
    iconColor: "text-blue-400",
    buttonGradient: "from-blue-500 to-blue-600",
    features: ["Auto-sync files", "Folder organization", "Real-time updates", "Two-way sync"],
    status: "available",
    connected: false,
  },
  {
    id: "slack",
    title: "Slack",
    desc: "Turn message threads into AI summaries and actionable insights.",
    icon: FiLink2,
    iconBg: "bg-purple-500/15",
    iconBorder: "border-purple-500/25",
    iconColor: "text-purple-400",
    buttonGradient: "from-purple-500 to-purple-600",
    features: ["Channel summaries", "Thread extraction", "Direct messaging", "Workspace sync"],
    status: "available",
    connected: false,
  },
  {
    id: "notion",
    title: "Notion",
    desc: "Send Smart Notes to any Notion page with perfect formatting.",
    icon: FiDatabase,
    iconBg: "bg-slate-500/15",
    iconBorder: "border-slate-500/25",
    iconColor: "text-slate-400",
    buttonGradient: "from-slate-500 to-slate-600",
    features: ["Page sync", "Database updates", "Block formatting", "Template support"],
    status: "available",
    connected: false,
  },
  {
    id: "zapier",
    title: "Zapier",
    desc: "Automate everything — from new notes to CRM updates and reminders.",
    icon: FiGlobe,
    iconBg: "bg-orange-500/15",
    iconBorder: "border-orange-500/25",
    iconColor: "text-orange-400",
    buttonGradient: "from-orange-500 to-orange-600",
    features: ["5000+ apps", "Custom workflows", "Trigger actions", "Multi-step zaps"],
    status: "available",
    connected: false,
  },
  {
    id: "github",
    title: "GitHub Issues",
    desc: "Automatically extract tasks from meeting notes and push them into issues.",
    icon: FiGithub,
    iconBg: "bg-gray-500/15",
    iconBorder: "border-gray-500/25",
    iconColor: "text-gray-400",
    buttonGradient: "from-gray-500 to-gray-600",
    features: ["Issue creation", "PR summaries", "Repo integration", "Commit linking"],
    status: "coming-soon",
    connected: false,
  },
  {
    id: "email",
    title: "Email Import",
    desc: "Forward emails and get instant summaries and action items.",
    icon: FiMail,
    iconBg: "bg-rose-500/15",
    iconBorder: "border-rose-500/25",
    iconColor: "text-rose-400",
    buttonGradient: "from-rose-500 to-rose-600",
    features: ["Email forwarding", "Attachment parsing", "Auto-categorize", "Smart replies"],
    status: "coming-soon",
    connected: false,
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
    // Simulate connection
    setConnectedIntegrations(prev => ({ ...prev, [integrationId]: true }));
    setSelectedIntegration(null);
    displayToast(`${integrations.find(i => i.id === integrationId)?.title} connected successfully!`);
  };

  const handleDisconnect = (integrationId) => {
    setConnectedIntegrations(prev => {
      const updated = { ...prev };
      delete updated[integrationId];
      return updated;
    });
    displayToast(`Integration disconnected`, "info");
  };

  const handleJoinWaitlist = (integrationId) => {
    setWaitlist(prev => ({ ...prev, [integrationId]: true }));
    setSelectedIntegration(null);
    displayToast(`You're on the waitlist! We'll notify you when it's ready.`);
  };

  const availableIntegrations = integrations.filter(i => i.status === "available");
  const comingSoonIntegrations = integrations.filter(i => i.status === "coming-soon");
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
      <header className="pt-2 px-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
            <Plugs size={18} weight="duotone" className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-theme-primary">Integrations</h1>
            <p className="text-theme-muted text-sm">Connect your favorite tools to supercharge your workflow.</p>
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div 
          className="p-4 rounded-2xl border text-center"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
        >
          <p className="text-2xl font-bold text-indigo-400">{connectedCount}</p>
          <p className="text-xs text-theme-muted">Connected</p>
        </div>
        <div 
          className="p-4 rounded-2xl border text-center"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
        >
          <p className="text-2xl font-bold text-emerald-400">{availableIntegrations.length}</p>
          <p className="text-xs text-theme-muted">Available</p>
        </div>
        <div 
          className="p-4 rounded-2xl border text-center"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
        >
          <p className="text-2xl font-bold text-amber-400">{comingSoonIntegrations.length}</p>
          <p className="text-xs text-theme-muted">Coming Soon</p>
        </div>
      </div>

      {/* Available Integrations */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-1">
          <FiPlus size={14} className="text-emerald-400" />
          <h2 className="text-sm font-semibold text-theme-secondary">Available Integrations</h2>
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
                  borderColor: isConnected ? "rgba(16,185,129,0.3)" : "var(--border-secondary)" 
                }}
                onClick={() => setSelectedIntegration(integration)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${integration.iconBg} border ${integration.iconBorder} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <IconComponent size={22} className={integration.iconColor} />
                  </div>
                  {isConnected && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                      <CheckCircle size={12} weight="fill" className="text-emerald-400" />
                      <span className="text-[10px] font-medium text-emerald-400">Connected</span>
                    </div>
                  )}
                </div>
                
                <h3 className="text-base font-semibold text-theme-primary mb-1.5 group-hover:text-indigo-400 transition-colors">
                  {integration.title}
                </h3>
                <p className="text-sm text-theme-muted leading-relaxed mb-4">
                  {integration.desc}
                </p>
                
                {isConnected ? (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open settings
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium text-theme-secondary hover:bg-white/5 transition"
                      style={{ borderColor: "var(--border-secondary)" }}
                    >
                      <Gear size={14} />
                      Settings
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDisconnect(integration.id);
                      }}
                      className="px-4 py-2.5 rounded-xl border text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition"
                      style={{ borderColor: "var(--border-secondary)" }}
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
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r ${integration.buttonGradient} hover:opacity-90 transition shadow-lg`}
                    style={{ boxShadow: `0 4px 14px rgba(99,102,241,0.25)` }}
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
          <Clock size={14} weight="duotone" className="text-amber-400" />
          <h2 className="text-sm font-semibold text-theme-secondary">Coming Soon</h2>
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
                style={{ 
                  backgroundColor: "var(--bg-surface)", 
                  borderColor: "var(--border-secondary)" 
                }}
                onClick={() => setSelectedIntegration(integration)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${integration.iconBg} border ${integration.iconBorder} flex items-center justify-center`}>
                    <IconComponent size={22} className={integration.iconColor} />
                  </div>
                  <div className="px-2 py-1 rounded-full bg-amber-500/15 border border-amber-500/25">
                    <span className="text-[10px] font-semibold text-amber-400">COMING SOON</span>
                  </div>
                </div>
                
                <h3 className="text-base font-semibold text-theme-primary mb-1.5">
                  {integration.title}
                </h3>
                <p className="text-sm text-theme-muted leading-relaxed mb-4">
                  {integration.desc}
                </p>
                
                {isOnWaitlist ? (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
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
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border text-theme-secondary hover:bg-white/5 hover:border-indigo-500/30 transition"
                    style={{ borderColor: "var(--border-secondary)" }}
                  >
                    <Bell size={14} />
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
          <div className="w-14 h-14 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
            <BookOpen size={24} weight="duotone" className="text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-theme-primary mb-1">Need help with integrations?</h3>
            <p className="text-sm text-theme-muted">Check out our documentation or contact support for assistance.</p>
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium text-theme-secondary hover:bg-white/5 transition"
              style={{ borderColor: "var(--border-secondary)" }}
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
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
              onClick={() => setSelectedIntegration(null)}
            />
            
            {/* Modal */}
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
                    <div className={`w-14 h-14 rounded-xl ${selectedIntegration.iconBg} border ${selectedIntegration.iconBorder} flex items-center justify-center`}>
                      <selectedIntegration.icon size={26} className={selectedIntegration.iconColor} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-theme-primary">{selectedIntegration.title}</h3>
                      {selectedIntegration.status === "coming-soon" ? (
                        <span className="text-sm text-amber-400 flex items-center gap-1">
                          <Clock size={12} weight="fill" />
                          Coming Soon
                        </span>
                      ) : connectedIntegrations[selectedIntegration.id] ? (
                        <span className="text-sm text-emerald-400 flex items-center gap-1">
                          <CheckCircle size={12} weight="fill" />
                          Connected
                        </span>
                      ) : (
                        <span className="text-sm text-theme-muted">Available</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedIntegration(null)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-theme-muted hover:text-theme-primary transition"
                    style={{ backgroundColor: "var(--bg-tertiary)" }}
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-theme-muted mb-6">{selectedIntegration.desc}</p>

                {/* Features */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-theme-secondary mb-3 uppercase tracking-wide">Features included</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedIntegration.features.map((feature, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-2 p-2.5 rounded-xl border"
                        style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
                      >
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                          <FiCheck size={10} className="text-indigo-400" />
                        </div>
                        <span className="text-xs text-theme-secondary">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro Badge for some integrations */}
                {!isPro && selectedIntegration.status === "available" && (
                  <div 
                    className="mb-6 p-3 rounded-xl border flex items-center gap-3"
                    style={{ backgroundColor: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.25)" }}
                  >
                    <Lightning size={20} weight="fill" className="text-amber-400" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-amber-400">Pro Feature</p>
                      <p className="text-[11px] text-theme-muted">Some features require a Pro subscription</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-tertiary)" }}>
                {selectedIntegration.status === "coming-soon" ? (
                  waitlist[selectedIntegration.id] ? (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-emerald-500/15 border border-emerald-500/25 text-emerald-400"
                    >
                      <FiCheck size={16} />
                      You're on the waitlist!
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinWaitlist(selectedIntegration.id)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 transition"
                    >
                      <Bell size={16} weight="fill" />
                      Join Waitlist
                    </button>
                  )
                ) : connectedIntegrations[selectedIntegration.id] ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedIntegration(null)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border text-theme-secondary hover:bg-white/5 transition"
                      style={{ borderColor: "var(--border-secondary)" }}
                    >
                      <Gear size={16} />
                      Manage Settings
                    </button>
                    <button
                      onClick={() => handleDisconnect(selectedIntegration.id)}
                      className="px-5 py-3 rounded-xl text-sm font-medium bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 transition"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(selectedIntegration.id)}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r ${selectedIntegration.buttonGradient} hover:opacity-90 transition shadow-lg`}
                  >
                    <FiPlus size={16} />
                    Connect {selectedIntegration.title}
                  </button>
                )}
                
                <p className="text-[11px] text-theme-muted text-center mt-3">
                  {selectedIntegration.status === "coming-soon" 
                    ? "We'll email you when this integration launches"
                    : "You can disconnect anytime from settings"
                  }
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}