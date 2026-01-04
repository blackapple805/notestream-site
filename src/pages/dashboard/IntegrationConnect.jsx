// src/pages/dashboard/IntegrationConnect.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  FiShield,
  FiArrowLeft,
  FiLock,
  FiUser,
  FiFolder,
  FiEdit3,
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
  blue: { bg: "bg-blue-500", light: "bg-blue-500/20", text: "text-blue-500" },
  purple: { bg: "bg-purple-500", light: "bg-purple-500/20", text: "text-purple-500" },
  slate: { bg: "bg-slate-600", light: "bg-slate-500/20", text: "text-slate-500" },
  orange: { bg: "bg-orange-500", light: "bg-orange-500/20", text: "text-orange-500" },
  gray: { bg: "bg-gray-600", light: "bg-gray-500/20", text: "text-gray-500" },
  rose: { bg: "bg-rose-500", light: "bg-rose-500/20", text: "text-rose-500" },
};

// Permission descriptions per integration
const permissionsByIntegration = {
  "google-drive": [
    { icon: FiFolder, text: "Access your Google Drive files" },
    { icon: FiEdit3, text: "Create and edit files in NoteStream folder" },
    { icon: FiUser, text: "View your basic profile info" },
  ],
  slack: [
    { icon: FiMessageSquare, text: "Read messages in connected channels" },
    { icon: FiEdit3, text: "Post summaries to channels" },
    { icon: FiUser, text: "View your workspace profile" },
  ],
  notion: [
    { icon: FiFolder, text: "Access selected Notion pages" },
    { icon: FiEdit3, text: "Create and update pages" },
    { icon: FiDatabase, text: "Read and write to databases" },
  ],
  zapier: [
    { icon: FiZap, text: "Trigger automations from NoteStream" },
    { icon: FiLink2, text: "Connect with your Zaps" },
    { icon: FiFolder, text: "Access workflow data" },
  ],
};

export default function IntegrationConnect() {
  const { integrationId } = useParams();
  const navigate = useNavigate();
  const { INTEGRATIONS_DATA, connect, isConnected } = useIntegrations();
  const hasCheckedRef = useRef(false);

  const [step, setStep] = useState("intro"); // intro, authorizing, permissions, connecting, success
  const [mockEmail, setMockEmail] = useState("");
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const integration = INTEGRATIONS_DATA?.[integrationId];

  // Check validity only once on mount
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    if (!integration) {
      setShouldRedirect(true);
      return;
    }
    if (integration.status === "coming-soon") {
      setShouldRedirect(true);
      return;
    }
    // Don't redirect if already connected - let them see success or go back manually
  }, [integration]);

  // Handle redirect
  useEffect(() => {
    if (shouldRedirect) {
      navigate("/dashboard/integrations", { replace: true });
    }
  }, [shouldRedirect, navigate]);

  // If no integration data yet, show loading
  if (!integration) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const Icon = IconMap[integration.icon] || FiLink2;
  const colors = colorMap[integration.color] || colorMap.blue;
  const permissions = permissionsByIntegration[integrationId] || [];

  const handleStartAuth = () => {
    setStep("authorizing");
    // Simulate OAuth redirect delay
    setTimeout(() => {
      setStep("permissions");
    }, 2000);
  };

  const handleAuthorize = () => {
    setStep("connecting");
    // Simulate connection delay
    setTimeout(() => {
      connect(integrationId, {
        email: mockEmail || `user@${integration.title.toLowerCase().replace(/\s+/g, '')}.com`,
        name: "Connected Account",
      });
      setStep("success");
    }, 1500);
  };

  const handleFinish = () => {
    navigate("/dashboard/integrations", { replace: true });
  };

  const handleBack = () => {
    navigate("/dashboard/integrations");
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="w-full max-w-md">
        
        {/* Back Button */}
        {step === "intro" && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleBack}
            className="flex items-center gap-2 text-theme-muted hover:text-theme-primary mb-6 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Integrations
          </motion.button>
        )}

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-8 border"
          style={{ 
            backgroundColor: 'var(--bg-surface)', 
            borderColor: 'var(--border-secondary)',
            boxShadow: '0 0 50px rgba(99,102,241,0.1)'
          }}
        >
          <AnimatePresence mode="wait">
            
            {/* Step 1: Intro */}
            {step === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className={`w-20 h-20 rounded-2xl ${colors.light} flex items-center justify-center mx-auto mb-6`}>
                  <Icon className={`w-10 h-10 ${colors.text}`} />
                </div>
                
                <h1 className="text-2xl font-bold text-theme-primary mb-2">
                  Connect {integration.title}
                </h1>
                <p className="text-theme-muted mb-8">
                  {integration.desc}
                </p>

                {/* Features Preview */}
                <div 
                  className="rounded-xl p-4 mb-8 text-left"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <p className="text-xs font-semibold text-theme-muted mb-3">WHAT YOU'LL GET</p>
                  <ul className="space-y-2">
                    {integration.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-theme-secondary">
                        <FiCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={handleStartAuth}
                  className={`w-full py-3.5 rounded-xl font-semibold text-white ${colors.bg}
                             hover:opacity-90 transition-all flex items-center justify-center gap-2`}
                >
                  Continue with {integration.title}
                </button>

                <p className="text-xs text-theme-muted mt-4 flex items-center justify-center gap-1">
                  <FiShield className="w-3 h-3" />
                  Your data is encrypted and secure
                </p>
              </motion.div>
            )}

            {/* Step 2: Authorizing (Simulated OAuth) */}
            {step === "authorizing" && (
              <motion.div
                key="authorizing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className={`w-20 h-20 rounded-2xl ${colors.light} flex items-center justify-center`}>
                    <Icon className={`w-10 h-10 ${colors.text}`} />
                  </div>
                  <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500 animate-ping opacity-50" />
                </div>
                
                <h2 className="text-xl font-bold text-theme-primary mb-2">
                  Connecting to {integration.title}...
                </h2>
                <p className="text-theme-muted text-sm">
                  Redirecting to authorization page
                </p>

                <div className="flex justify-center mt-6">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              </motion.div>
            )}

            {/* Step 3: Permissions */}
            {step === "permissions" && (
              <motion.div
                key="permissions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-xl ${colors.light} flex items-center justify-center`}>
                    <Icon className={`w-7 h-7 ${colors.text}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-theme-primary">
                      Authorize NoteStream
                    </h2>
                    <p className="text-sm text-theme-muted">
                      to access your {integration.title}
                    </p>
                  </div>
                </div>

                {/* Mock Email Input */}
                <div className="mb-6">
                  <label className="text-xs font-medium text-theme-muted mb-2 block">
                    Signed in as (simulated)
                  </label>
                  <input
                    type="email"
                    value={mockEmail}
                    onChange={(e) => setMockEmail(e.target.value)}
                    placeholder={`you@${integration.title.toLowerCase().replace(/\s+/g, '')}.com`}
                    className="w-full px-4 py-3 rounded-xl border text-theme-primary placeholder:text-theme-muted outline-none
                               focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-secondary)' }}
                  />
                </div>

                {/* Permissions List */}
                <div 
                  className="rounded-xl p-4 mb-6"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <p className="text-xs font-semibold text-theme-muted mb-3">
                    NOTESTREAM WILL BE ABLE TO:
                  </p>
                  <ul className="space-y-3">
                    {permissions.map((perm, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-theme-secondary">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                          <perm.icon className="w-4 h-4 text-indigo-500" />
                        </div>
                        {perm.text}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleBack}
                    className="flex-1 py-3 rounded-xl font-medium border text-theme-secondary
                               hover:bg-white/5 transition-all"
                    style={{ borderColor: 'var(--border-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAuthorize}
                    className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 
                               text-white hover:opacity-90 transition-all"
                  >
                    Authorize
                  </button>
                </div>

                <p className="text-xs text-theme-muted text-center mt-4 flex items-center justify-center gap-1">
                  <FiLock className="w-3 h-3" />
                  You can revoke access anytime
                </p>
              </motion.div>
            )}

            {/* Step 3.5: Connecting */}
            {step === "connecting" && (
              <motion.div
                key="connecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className={`w-20 h-20 rounded-2xl ${colors.light} flex items-center justify-center`}>
                    <Icon className={`w-10 h-10 ${colors.text}`} />
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-theme-primary mb-2">
                  Setting up connection...
                </h2>
                <p className="text-theme-muted text-sm">
                  Configuring your integration
                </p>

                <div className="flex justify-center mt-6">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
                >
                  <FiCheck className="w-10 h-10 text-emerald-500" />
                </motion.div>
                
                <h2 className="text-2xl font-bold text-theme-primary mb-2">
                  Connected!
                </h2>
                <p className="text-theme-muted mb-8">
                  {integration.title} is now connected to NoteStream. Your data will start syncing automatically.
                </p>

                {/* Quick Stats Preview */}
                <div 
                  className="rounded-xl p-4 mb-8 text-left"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg ${colors.light} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div>
                      <p className="font-medium text-theme-primary">{integration.title}</p>
                      <p className="text-xs text-emerald-500">Active</p>
                    </div>
                  </div>
                  <p className="text-xs text-theme-muted">
                    Connected as {mockEmail || `user@${integration.title.toLowerCase().replace(/\s+/g, '')}.com`}
                  </p>
                </div>

                <button
                  onClick={handleFinish}
                  className="w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 
                             text-white hover:opacity-90 transition-all"
                >
                  Go to Integrations
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}