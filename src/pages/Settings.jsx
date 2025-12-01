// src/pages/Settings.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import { useTheme } from "../context/ThemeContext";
import {
  FiUser,
  FiLock,
  FiMoon,
  FiSun,
  FiMonitor,
  FiTrash2,
  FiLogOut,
  FiChevronRight,
  FiCheck,
  FiHelpCircle,
} from "react-icons/fi";
import {
  Gear,
  UserCircle,
  PaintBrush,
  Robot,
  ShieldCheck,
  Warning,
  Crown,
  Export,
  Question,
  ChatCircle,
} from "phosphor-react";

export default function Settings() {
  // Theme from context (persists to localStorage)
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Profile state
  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem("notestream-displayName") || "Eric Angel";
  });
  const [email, setEmail] = useState(() => {
    return localStorage.getItem("notestream-email") || "you@example.com";
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Workspace settings (persisted)
  const [autoSummarize, setAutoSummarize] = useState(() => {
    return localStorage.getItem("notestream-autoSummarize") !== "false";
  });
  const [weeklyDigest, setWeeklyDigest] = useState(() => {
    return localStorage.getItem("notestream-weeklyDigest") === "true";
  });
  const [smartNotifications, setSmartNotifications] = useState(() => {
    return localStorage.getItem("notestream-smartNotifications") !== "false";
  });

  // Security
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(() => {
    return localStorage.getItem("ns-note-pin") !== null;
  });

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = () => {
    localStorage.setItem("notestream-displayName", displayName);
    localStorage.setItem("notestream-email", email);
    setIsEditingProfile(false);
    showToast("Profile updated successfully!");
  };

  const handleExportData = () => {
    setShowExportModal(false);
    showToast("Data export started. Check your email!");
  };

  // Save workspace settings to localStorage
  const handleAutoSummarizeChange = (value) => {
    setAutoSummarize(value);
    localStorage.setItem("notestream-autoSummarize", value.toString());
  };

  const handleWeeklyDigestChange = (value) => {
    setWeeklyDigest(value);
    localStorage.setItem("notestream-weeklyDigest", value.toString());
  };

  const handleSmartNotificationsChange = (value) => {
    setSmartNotifications(value);
    localStorage.setItem("notestream-smartNotifications", value.toString());
  };

  const themeOptions = [
    { value: "dark", label: "Dark", icon: FiMoon },
    { value: "light", label: "Light", icon: FiSun },
    { value: "system", label: "System", icon: FiMonitor },
  ];

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-emerald-900/80 border border-emerald-500/40 text-emerald-200 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2"
          >
            <FiCheck size={16} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="pt-2 px-1">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-semibold tracking-tight text-theme-primary">Settings</h1>
          <Gear className="text-indigo-400" size={24} weight="duotone" />
        </div>
        <p className="text-theme-muted text-sm">Control how NoteStream behaves across your workspace.</p>
      </header>

      {/* Profile Section */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-500/25 flex items-center justify-center">
            <UserCircle size={18} weight="duotone" className="text-indigo-400" />
          </div>
          <h2 className="text-sm font-semibold text-accent-indigo">Profile</h2>
        </div>

        <div className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="text-xs text-theme-muted mb-1.5 block">Display name</label>
            {isEditingProfile ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-secondary)] rounded-xl px-4 py-2.5 text-theme-primary text-sm focus:outline-none focus:border-indigo-500/50"
              />
            ) : (
              <div className="flex items-center justify-between bg-[var(--bg-input)] border border-[var(--border-secondary)] rounded-xl px-4 py-2.5">
                <span className="text-theme-primary text-sm">{displayName}</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-xs text-theme-muted mb-1.5 block">Email</label>
            {isEditingProfile ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-secondary)] rounded-xl px-4 py-2.5 text-theme-primary text-sm focus:outline-none focus:border-indigo-500/50"
              />
            ) : (
              <div className="flex items-center justify-between bg-[var(--bg-input)] border border-[var(--border-secondary)] rounded-xl px-4 py-2.5">
                <span className="text-theme-primary text-sm">{email}</span>
              </div>
            )}
          </div>

          {/* Edit/Save Button */}
          {isEditingProfile ? (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-2.5 rounded-xl bg-theme-button text-theme-tertiary text-sm font-medium hover:bg-theme-button-hover transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-theme-primary text-sm font-medium hover:bg-indigo-500 transition"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="w-full py-2.5 rounded-xl bg-theme-button text-theme-tertiary text-sm font-medium hover:bg-theme-button-hover transition flex items-center justify-center gap-2"
            >
              <FiUser size={14} />
              Edit Profile
            </button>
          )}
        </div>
      </GlassCard>

      {/* Appearance Section */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <PaintBrush size={18} weight="duotone" className="text-purple-400" />
          </div>
          <h2 className="text-sm font-semibold text-purple-300">Appearance</h2>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-theme-muted">Theme</label>
            <span className="text-[10px] text-theme-muted px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)]">
              {resolvedTheme === "dark" ? "🌙 Dark" : "☀️ Light"}
            </span>
          </div>
          <div className="flex gap-2">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-500/20 border-indigo-500/40 text-accent-indigo"
                      : "bg-[var(--bg-input)] border-[var(--border-secondary)] text-theme-muted hover:text-theme-primary hover:border-theme-tertiary"
                  }`}
                >
                  <Icon size={14} />
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-theme-muted mt-2">
            {theme === "system" 
              ? "Theme will match your device settings" 
              : `${theme.charAt(0).toUpperCase() + theme.slice(1)} mode is active`}
          </p>
        </div>
      </GlassCard>

      {/* Workspace Section */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Robot size={18} weight="duotone" className="text-emerald-400" />
          </div>
          <h2 className="text-sm font-semibold text-emerald-300">Workspace</h2>
        </div>
        <p className="text-xs text-theme-muted mb-4">Configure how NoteStream uses AI across your workspace.</p>

        <div className="space-y-3">
          <ToggleSetting
            label="Auto-summarize new uploads"
            description="Automatically generate AI summaries for uploaded files"
            enabled={autoSummarize}
            onChange={handleAutoSummarizeChange}
          />
          <ToggleSetting
            label="Smart notifications"
            description="Get AI-powered reminders based on your notes"
            enabled={smartNotifications}
            onChange={handleSmartNotificationsChange}
          />
          <ToggleSetting
            label="Email me weekly digests"
            description="Receive a summary of your activity every Monday"
            enabled={weeklyDigest}
            onChange={handleWeeklyDigestChange}
          />
        </div>
      </GlassCard>

      {/* Security Section */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <ShieldCheck size={18} weight="duotone" className="text-amber-400" />
          </div>
          <h2 className="text-sm font-semibold text-amber-300">Security</h2>
        </div>

        <div className="space-y-3">
          <ToggleSetting
            label="App Lock PIN"
            description="Require PIN to open locked notes"
            enabled={pinEnabled}
            onChange={(v) => {
              if (v) {
                setShowPinModal(true);
              } else {
                localStorage.removeItem("ns-note-pin");
                setPinEnabled(false);
                showToast("PIN lock disabled");
              }
            }}
          />

          <button
            onClick={() => setShowExportModal(true)}
            className="w-full flex items-center justify-between bg-[var(--bg-input)] border border-[var(--border-secondary)] rounded-xl px-4 py-3 hover:border-theme-tertiary transition group"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
                <Export size={16} weight="duotone" className="text-sky-400" />
              </div>
              <div className="text-left">
                <p className="text-sm text-[var(--text-secondary)]">Export my data</p>
                <p className="text-[11px] text-theme-muted">Download all your notes and files</p>
              </div>
            </div>
            <FiChevronRight className="text-theme-muted group-hover:text-theme-tertiary transition" />
          </button>
        </div>
      </GlassCard>

      {/* Support Section */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
            <Question size={18} weight="duotone" className="text-sky-400" />
          </div>
          <h2 className="text-sm font-semibold text-sky-300">Support</h2>
        </div>

        <div className="space-y-2">
          <SupportLink
            icon={<FiHelpCircle size={16} />}
            label="Help Center"
            onClick={() => window.open("#", "_blank")}
          />
          <SupportLink
            icon={<ChatCircle size={16} weight="duotone" />}
            label="Contact Support"
            onClick={() => window.open("mailto:support@notestream.app", "_blank")}
          />
          <SupportLink
            icon={<Crown size={16} weight="duotone" />}
            label="Upgrade to Pro"
            badge="NEW"
            onClick={() => alert("Navigate to AI Lab")}
          />
        </div>
      </GlassCard>

      {/* Danger Zone */}
      <GlassCard className="border-rose-500/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
            <Warning size={18} weight="duotone" className="text-rose-400" />
          </div>
          <h2 className="text-sm font-semibold text-rose-300">Danger Zone</h2>
        </div>
        <p className="text-xs text-theme-muted mb-4">These actions are destructive and cannot be undone.</p>

        <div className="space-y-2">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 bg-[var(--bg-input)] border border-[var(--border-secondary)] rounded-xl px-4 py-3 hover:border-rose-500/30 transition text-left"
          >
            <div className="h-8 w-8 rounded-lg bg-gray-500/20 flex items-center justify-center">
              <FiLogOut size={16} className="text-theme-muted" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Log out</p>
              <p className="text-[11px] text-theme-muted">Sign out of your account</p>
            </div>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center gap-3 bg-rose-500/5 border border-rose-500/20 rounded-xl px-4 py-3 hover:bg-rose-500/10 hover:border-rose-500/30 transition text-left"
          >
            <div className="h-8 w-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
              <FiTrash2 size={16} className="text-rose-400" />
            </div>
            <div>
              <p className="text-sm text-rose-300">Delete account</p>
              <p className="text-[11px] text-theme-muted">Permanently delete all data</p>
            </div>
          </button>
        </div>
      </GlassCard>

      {/* App Version */}
      <div className="text-center py-4">
        <p className="text-xs text-theme-muted">NoteStream v1.0.0</p>
        <p className="text-[10px] text-theme-muted mt-1">Made with ❤️ for productivity</p>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <ConfirmModal
            title="Delete Account?"
            description="This will permanently delete all your notes, documents, and settings. This action cannot be undone."
            confirmLabel="Delete Forever"
            confirmColor="rose"
            icon={<FiTrash2 size={20} className="text-rose-400" />}
            onConfirm={() => {
              // Clear all localStorage
              localStorage.clear();
              setShowDeleteModal(false);
              showToast("Account deletion requested");
            }}
            onCancel={() => setShowDeleteModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <ConfirmModal
            title="Log Out?"
            description="You'll need to sign in again to access your notes."
            confirmLabel="Log Out"
            confirmColor="gray"
            icon={<FiLogOut size={20} className="text-theme-muted" />}
            onConfirm={() => {
              setShowLogoutModal(false);
              showToast("Logged out successfully");
            }}
            onCancel={() => setShowLogoutModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <ConfirmModal
            title="Export Your Data"
            description="We'll email you a download link with all your notes, documents, and settings in a ZIP file."
            confirmLabel="Request Export"
            confirmColor="indigo"
            icon={<Export size={20} weight="duotone" className="text-sky-400" />}
            onConfirm={handleExportData}
            onCancel={() => setShowExportModal(false)}
          />
        )}
      </AnimatePresence>

      {/* PIN Setup Modal */}
      <AnimatePresence>
        {showPinModal && (
          <PinModal
            onSave={(pin) => {
              localStorage.setItem("ns-note-pin", pin);
              setPinEnabled(true);
              setShowPinModal(false);
              showToast("PIN lock enabled!");
            }}
            onCancel={() => setShowPinModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* -----------------------------------------
   Toggle Setting Component
----------------------------------------- */
function ToggleSetting({ label, description, enabled, onChange }) {
  return (
    <div className="flex items-center justify-between bg-[var(--bg-input)] border border-[var(--border-secondary)] rounded-xl px-4 py-3">
      <div className="pr-4">
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        {description && <p className="text-[11px] text-theme-muted mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
         enabled ? "bg-indigo-600" : "bg-[var(--bg-button)]"
        }`}
      >
        <motion.div
          className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow"
          animate={{ x: enabled ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

/* -----------------------------------------
   Support Link Component
----------------------------------------- */
function SupportLink({ icon, label, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between bg-[var(--bg-input)] border border-[var(--border-secondary)] rounded-xl px-4 py-3 hover:border-theme-tertiary transition group"
    >
      <div className="flex items-center gap-3">
        <span className="text-theme-muted">{icon}</span>
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        {badge && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-accent-indigo">
            {badge}
          </span>
        )}
      </div>
      <FiChevronRight className="text-theme-muted group-hover:text-theme-tertiary transition" />
    </button>
  );
}

/* -----------------------------------------
   Confirm Modal Component
----------------------------------------- */
function ConfirmModal({ title, description, confirmLabel, confirmColor, icon, onConfirm, onCancel }) {
  const colorMap = {
    rose: "bg-rose-600 hover:bg-rose-500",
    indigo: "bg-indigo-600 hover:bg-indigo-500",
    gray: "bg-[#3a3a44] hover:bg-[#4a4a54]",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] bg-theme-elevated/60 backdrop-blur-md flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-theme-elevated border border-[var(--border-secondary)] rounded-2xl p-5 max-w-sm w-full"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-theme-button flex items-center justify-center">
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-theme-primary">{title}</h3>
        </div>
        <p className="text-sm text-theme-muted mb-5">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-theme-button text-theme-tertiary text-sm font-medium hover:bg-theme-button-hover transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-theme-primary text-sm font-medium transition ${colorMap[confirmColor]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* -----------------------------------------
   PIN Modal Component
----------------------------------------- */
function PinModal({ onSave, onCancel }) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleConfirm = () => {
    if (pin !== confirmPin) {
      setError("PINs don't match");
      setConfirmPin("");
      return;
    }
    onSave(pin);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] bg-theme-elevated/60 backdrop-blur-md flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-theme-elevated border border-[var(--border-secondary)] rounded-2xl p-5 max-w-sm w-full"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/25 flex items-center justify-center">
            <FiLock size={18} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-theme-primary">
              {step === 1 ? "Create PIN" : "Confirm PIN"}
            </h3>
            <p className="text-xs text-theme-muted">
              {step === 1 ? "Enter a 4-digit PIN" : "Re-enter your PIN"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <input
          type="password"
          maxLength={4}
          value={step === 1 ? pin : confirmPin}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            if (step === 1) {
              setPin(val);
            } else {
              setConfirmPin(val);
            }
            setError("");
          }}
          className="w-full bg-[var(--bg-input)] border border-[var(--border-secondary)] rounded-xl px-4 py-4 text-center tracking-[0.5em] text-xl text-theme-primary font-mono placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/50 mb-4"
          placeholder="••••"
          autoFocus
        />

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-theme-button text-theme-tertiary text-sm font-medium hover:bg-theme-button-hover transition"
          >
            Cancel
          </button>
          <button
            onClick={step === 1 ? handleNext : handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-theme-primary text-sm font-medium hover:bg-indigo-500 transition"
          >
            {step === 1 ? "Next" : "Save PIN"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}