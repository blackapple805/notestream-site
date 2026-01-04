// src/pages/dashboard/IntegrationSettings.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCloud,
  FiMessageSquare,
  FiDatabase,
  FiZap,
  FiGithub,
  FiMail,
  FiLink2,
  FiCheck,
  FiRefreshCw,
  FiTrash2,
  FiPlus,
  FiExternalLink,
  FiClock,
  FiX,
} from "react-icons/fi";
import { useIntegrations } from "../../hooks/useIntegrations";

// Icon mapping
const IconMap = {
  FiCloud: FiCloud,
  FiMessageSquare: FiMessageSquare,
  FiDatabase: FiDatabase,
  FiZap: FiZap,
  FiGithub: FiGithub,
  FiMail: FiMail,
};

// Color mapping
const colorMap = {
  blue: { bg: "bg-blue-500/20", text: "text-blue-500", border: "border-blue-500/30" },
  purple: { bg: "bg-purple-500/20", text: "text-purple-500", border: "border-purple-500/30" },
  slate: { bg: "bg-slate-500/20", text: "text-slate-500", border: "border-slate-500/30" },
  orange: { bg: "bg-orange-500/20", text: "text-orange-500", border: "border-orange-500/30" },
  gray: { bg: "bg-gray-500/20", text: "text-gray-500", border: "border-gray-500/30" },
  rose: { bg: "bg-rose-500/20", text: "text-rose-500", border: "border-rose-500/30" },
};

export default function IntegrationSettings() {
  const navigate = useNavigate();
  const { 
    getAllIntegrations, 
    getConnectedIntegrations,
    disconnect,
    syncIntegration,
    isLoading 
  } = useIntegrations();

  const [syncing, setSyncing] = useState({});
  const [disconnectModal, setDisconnectModal] = useState(null);

  const integrations = getAllIntegrations();
  const connectedIntegrations = getConnectedIntegrations();
  const connectedCount = connectedIntegrations.length;
  const availableIntegrations = integrations.filter(i => !i.isConnected);

  const handleSync = async (integrationId) => {
    setSyncing((prev) => ({ ...prev, [integrationId]: true }));
    await syncIntegration(integrationId);
    setSyncing((prev) => ({ ...prev, [integrationId]: false }));
  };

  const handleDisconnect = (integration) => {
    setDisconnectModal(integration);
  };

  const confirmDisconnect = () => {
    if (disconnectModal) {
      disconnect(disconnectModal.id);
      setDisconnectModal(null);
    }
  };

  const handleConnect = (integration) => {
    navigate(`/dashboard/integrations/connect/${integration.id}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen px-4 md:px-8 py-10 md:py-16"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <FiLink2 className="w-8 h-8 text-indigo-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-theme-primary">
              Integrations
            </h1>
          </div>
          <p className="text-theme-muted">
            Connect your favorite tools to supercharge your workflow.{" "}
            {connectedCount > 0 && (
              <span className="text-indigo-500 font-medium">{connectedCount} connected</span>
            )}
          </p>
        </motion.div>

        {/* Connected Integrations */}
        {connectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
              <FiCheck className="text-emerald-500" />
              Connected
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedIntegrations.map((integration) => {
                const Icon = IconMap[integration.icon] || FiLink2;
                const colors = colorMap[integration.color] || colorMap.blue;
                
                return (
                  <motion.div
                    key={integration.id}
                    layout
                    className="rounded-xl p-5 border"
                    style={{ 
                      backgroundColor: 'var(--bg-card)', 
                      borderColor: 'var(--border-secondary)' 
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${colors.text}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-theme-primary">{integration.title}</h3>
                          <p className="text-xs text-emerald-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Connected
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Connection Stats */}
                    {integration.connection && (
                      <div 
                        className="rounded-lg p-3 mb-4 text-sm"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                      >
                        <p className="text-theme-muted text-xs mb-2">
                          {integration.connection.accountEmail}
                        </p>
                        <div className="flex items-center gap-1 text-theme-muted">
                          <FiClock className="w-3 h-3" />
                          <span className="text-xs">Last sync: {integration.connection.lastSync}</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSync(integration.id)}
                        disabled={syncing[integration.id]}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold
                                   bg-indigo-500 text-white transition-all hover:bg-indigo-600 disabled:opacity-70"
                      >
                        <FiRefreshCw className={`w-4 h-4 ${syncing[integration.id] ? 'animate-spin' : ''}`} />
                        {syncing[integration.id] ? 'Syncing...' : 'Sync Now'}
                      </button>
                      <button
                        onClick={() => handleDisconnect(integration)}
                        className="p-2 rounded-lg text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Available Integrations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
            <FiPlus className="text-indigo-500" />
            Available Integrations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableIntegrations.map((integration) => {
              const Icon = IconMap[integration.icon] || FiLink2;
              const colors = colorMap[integration.color] || colorMap.blue;
              const isComingSoon = integration.status === "coming-soon";
              
              return (
                <motion.div
                  key={integration.id}
                  layout
                  whileHover={{ y: isComingSoon ? 0 : -4 }}
                  className={`rounded-xl p-5 border transition-all ${
                    isComingSoon ? 'opacity-60' : 'cursor-pointer'
                  }`}
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-secondary)' 
                  }}
                  onClick={() => !isComingSoon && handleConnect(integration)}
                  onMouseEnter={(e) => {
                    if (!isComingSoon) {
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-secondary)';
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-theme-primary">{integration.title}</h3>
                        {isComingSoon && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-theme-muted text-sm mb-4 line-clamp-2">
                    {integration.desc}
                  </p>

                  {!isComingSoon ? (
                    <button
                      className="w-full py-2.5 rounded-lg text-sm font-semibold
                                 bg-gradient-to-r from-indigo-500 to-purple-500 text-white
                                 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      Connect
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-lg text-sm font-medium border
                                 text-theme-muted cursor-not-allowed"
                      style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                    >
                      Notify Me
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 rounded-xl p-6 border text-center"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-secondary)' 
          }}
        >
          <h3 className="text-lg font-semibold text-theme-primary mb-2">
            Need help with integrations?
          </h3>
          <p className="text-theme-muted text-sm mb-4">
            Check out our documentation or contact support for assistance.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/support")}
              className="px-4 py-2 rounded-lg text-sm font-medium text-indigo-500 border
                         hover:bg-indigo-500/10 transition-all flex items-center gap-2"
              style={{ borderColor: 'var(--border-secondary)' }}
            >
              <FiExternalLink className="w-4 h-4" />
              View Docs
            </button>
          </div>
        </motion.div>
      </div>

      {/* Disconnect Confirmation Modal */}
      <AnimatePresence>
        {disconnectModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={() => setDisconnectModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed z-[1000] w-[calc(100%-2rem)] max-w-sm rounded-2xl p-6 border"
              style={{ 
                backgroundColor: 'var(--bg-surface)', 
                borderColor: 'var(--border-secondary)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                top: '20%',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <button
                onClick={() => setDisconnectModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-theme-muted hover:text-theme-primary transition"
              >
                <FiX className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
                  <FiTrash2 className="w-7 h-7 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-theme-primary mb-2">
                  Disconnect {disconnectModal.title}?
                </h3>
                <p className="text-theme-muted text-sm mb-6">
                  This will remove the connection and stop syncing data. You can reconnect anytime.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDisconnectModal(null)}
                    className="flex-1 py-2.5 rounded-xl font-medium border text-theme-secondary
                               hover:bg-white/5 transition-all"
                    style={{ borderColor: 'var(--border-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDisconnect}
                    className="flex-1 py-2.5 rounded-xl font-medium bg-rose-500 text-white
                               hover:bg-rose-600 transition-all"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}