// src/pages/Settings.jsx
// ✅ DB-first profile (no localStorage for displayName/email)
// ✅ Race-safe hydration (prevents “revert” from stale async responses)
// ✅ Save flow: optimistic UI -> DB update -> verify -> optional auth metadata sync
// Keeps ThemeContext + WorkspaceSettings as-is (they may use localStorage internally)

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import { useTheme } from "../context/ThemeContext";
import { useWorkspaceSettings } from "../hooks/useWorkspaceSettings";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
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
  FiZap,
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
  Fire,
  Lightning,
  Calendar,
} from "phosphor-react";

const USER_STATS_TABLE = "user_engagement_stats";

function formatDateShort(d) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

function getLast7DaysRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  return { start, end };
}

export default function Settings() {
  const navigate = useNavigate();

  // Theme from context (persists to localStorage inside ThemeContext)
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Workspace settings from shared context (may persist internally; not changed here)
  const { settings, updateSetting } = useWorkspaceSettings();

  // ✅ Profile state (DB/Auth is source of truth)
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Security (PIN still local-only unless you add a DB table for it)
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

  // Supabase stats preview (for weekly digest + user info)
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  // --- Race-control refs (prevents “revert” caused by stale async calls) ---
  const reqRef = useRef(0); // increments for each hydrate; older responses ignored
  const savingRef = useRef(false); // if true, hydration won't overwrite displayName

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const getUser = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data?.session?.user ?? null;
  }, []);

  // ✅ Insert row if missing (does NOT overwrite because ON CONFLICT DO NOTHING)
  const ensureStatsRow = useCallback(async (user) => {
    if (!user?.id) return;

    const nameFromAuth =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      (user.email ? user.email.split("@")[0] : null);

    try {
      const { error } = await supabase.rpc("ensure_user_stats_exists", {
        p_user_id: user.id,
        // Only used on first insert; won't overwrite existing row.
        p_display_name: nameFromAuth,
      });
      if (error) console.warn("ensure_user_stats_exists error:", error);
    } catch (err) {
      console.warn("ensureStatsRow error (non-blocking):", err);
    }
  }, []);

  // ✅ One hydration path for BOTH profile + stats (single source of truth, race-safe)
  const hydrateFromDb = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;

    const myReq = ++reqRef.current;

    setProfileLoading(true);
    setStatsLoading(true);
    setStatsError("");

    try {
      const user = await getUser();

      // If a newer hydrate started, ignore this one
      if (myReq !== reqRef.current) return;

      if (!user?.id) {
        if (!savingRef.current) {
          setDisplayName("");
          setEmail("");
        }
        setStats(null);
        return;
      }

      setEmail(user.email || "");

      // Ensure stats row exists (first time users)
      await ensureStatsRow(user);

      // If a newer hydrate started, ignore this one
      if (myReq !== reqRef.current) return;

      // Fetch both display_name + stats in one query
      const { data, error } = await supabase
        .from(USER_STATS_TABLE)
        .select("display_name, notes_created, ai_uses, active_days, streak_days, last_active_date")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      // Only overwrite displayName if we're NOT in the middle of saving
      if (!savingRef.current) {
        setDisplayName(data?.display_name || "");
      }

      setStats(
        data
          ? {
              notes_created: data.notes_created ?? 0,
              ai_uses: data.ai_uses ?? 0,
              active_days: data.active_days ?? 0,
              streak_days: data.streak_days ?? 0,
              last_active_date: data.last_active_date ?? null,
            }
          : null
      );
    } catch (e) {
      // Only show stats error; keep profile UI usable
      setStats(null);
      setStatsError(e?.message || "Failed to load user stats.");
      console.warn("hydrateFromDb failed:", e);
    } finally {
      if (myReq === reqRef.current) {
        setProfileLoading(false);
        setStatsLoading(false);
      }
    }
  }, [ensureStatsRow, getUser]);

  useEffect(() => {
    hydrateFromDb();

    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // Cancel any in-flight responses and re-hydrate
      reqRef.current += 1;
      hydrateFromDb();
    });

    return () => sub?.subscription?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Save profile to DB only. Prevent “revert” by blocking hydration overwrite while saving.
  const handleSaveProfile = async () => {
    const cleanName = (displayName || "").trim();
    if (!cleanName) return showToast("Display name cannot be empty.");

    setIsEditingProfile(false);

    // Optimistic UI + lock
    savingRef.current = true;
    setDisplayName(cleanName);

    try {
      if (!isSupabaseConfigured || !supabase) throw new Error("Supabase not configured.");

      const user = await getUser();
      if (!user?.id) throw new Error("Not signed in.");

      await ensureStatsRow(user);

      // Update DB
      const { data, error } = await supabase
        .from(USER_STATS_TABLE)
        .update({ display_name: cleanName })
        .eq("user_id", user.id)
        .select("display_name");

      if (error) throw error;

      // If RLS blocked update, data will be []
      if (!data || data.length === 0) {
        throw new Error("Update blocked (RLS) or no row matched user_id.");
      }

      // Optional: keep auth metadata consistent (best-effort)
      // This prevents other parts of the app (using user_metadata) from “re-seeding” names.
      try {
        await supabase.auth.updateUser({
          data: { full_name: cleanName, name: cleanName },
        });
      } catch (metaErr) {
        // non-blocking
        console.warn("auth.updateUser metadata sync failed:", metaErr);
      }

      showToast("Profile updated successfully!");

      // Verify by re-hydrating from DB (new request id cancels older ones)
      reqRef.current += 1;
      savingRef.current = false;
      hydrateFromDb();
    } catch (err) {
      console.warn("Profile save failed:", err);
      showToast(err?.message || "Save failed.");

      // Unlock and revert to DB truth
      savingRef.current = false;
      reqRef.current += 1;
      hydrateFromDb();
    }
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        version: "1.0.0",
        profile: {
          displayName: displayName || "Unknown",
          email: email || "Unknown",
        },
        settings: {
          theme: theme || "dark",
          autoSummarize: !!settings.autoSummarize,
          smartNotifications: !!settings.smartNotifications,
          weeklyDigest: !!settings.weeklyDigest,
          pinEnabled: localStorage.getItem("ns-note-pin") !== null,
        },
        stats: stats || {},
        notes: [],
        documents: [],
        activity: [],
      };

      if (isSupabaseConfigured && supabase) {
        const user = await getUser();

        if (user?.id) {
          const { data: notesData } = await supabase
            .from("notes")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (notesData) exportData.notes = notesData;

          const { data: docsData } = await supabase
            .from("documents")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (docsData) exportData.documents = docsData;

          const { data: activityData } = await supabase
            .from("activity_events")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(500);

          if (activityData) exportData.activity = activityData;
        }
      }

      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `notestream-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShowExportModal(false);
      showToast("Data exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      setShowExportModal(false);
      showToast("Export failed. Please try again.");
    }
  };

  // Workspace settings handlers
  const handleAutoSummarizeChange = (value) => {
    updateSetting("autoSummarize", value);
    showToast(value ? "Auto-summarize enabled" : "Auto-summarize disabled");
  };

  const handleWeeklyDigestChange = async (value) => {
    updateSetting("weeklyDigest", value);

    if (value && isSupabaseConfigured && supabase) {
      try {
        await hydrateFromDb();
      } catch {
        // ignore
      }
    }

    showToast(value ? "Weekly digest enabled" : "Weekly digest disabled");
  };

  const handleSmartNotificationsChange = (value) => {
    updateSetting("smartNotifications", value);
    showToast(value ? "Smart notifications enabled" : "Smart notifications disabled");
  };

  const themeOptions = [
    { value: "dark", label: "Dark", icon: FiMoon },
    { value: "light", label: "Light", icon: FiSun },
    { value: "system", label: "System", icon: FiMonitor },
  ];

  const range = getLast7DaysRange();
  const digestPeriodLabel = `${formatDateShort(range.start)} - ${formatDateShort(range.end)}`;

  const safeStats = useMemo(
    () =>
      stats || {
        notes_created: 0,
        ai_uses: 0,
        active_days: 0,
        streak_days: 0,
        last_active_date: null,
      },
    [stats]
  );

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
      <header className="page-header">
        <div className="page-header-content">
          <div className="page-header-icon">
            <Gear weight="duotone" />
          </div>
          <div>
            <h1 className="page-header-title">Settings</h1>
            <p className="page-header-subtitle">Control how NoteStream behaves across your workspace.</p>
          </div>
        </div>
      </header>

      {/* Profile Section */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <UserCircle size={18} weight="duotone" className="text-indigo-400" />
          </div>
          <h2 className="text-sm font-semibold text-indigo-300">Profile</h2>
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
                className="w-full bg-theme-input border border-theme-secondary rounded-xl px-4 py-2.5 text-theme-primary text-sm focus:outline-none focus:border-indigo-500/50"
              />
            ) : (
              <div className="flex items-center justify-between bg-theme-input border border-theme-secondary rounded-xl px-4 py-2.5">
                <span className="text-theme-primary text-sm">
                  {profileLoading ? "Loading..." : displayName || "—"}
                </span>
              </div>
            )}
          </div>

          {/* Email (read-only from auth unless you implement auth.updateUser email) */}
          <div>
            <label className="text-xs text-theme-muted mb-1.5 block">Email</label>
            <div className="flex items-center justify-between bg-theme-input border border-theme-secondary rounded-xl px-4 py-2.5">
              <span className="text-theme-primary text-sm">{email || "—"}</span>
            </div>
          </div>

          {/* Edit/Save Button */}
          {isEditingProfile ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditingProfile(false);
                  // Discard edits: re-hydrate from DB
                  reqRef.current += 1;
                  hydrateFromDb();
                }}
                className="flex-1 py-2.5 rounded-xl bg-theme-button text-theme-tertiary text-sm font-medium hover:bg-theme-button-hover transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition"
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
            <span className="text-[10px] text-theme-muted px-2 py-0.5 rounded-full bg-theme-tertiary">
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
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-theme-input border-theme-secondary text-theme-muted hover:text-theme-primary hover:border-theme-tertiary"
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
            enabled={settings.autoSummarize}
            onChange={handleAutoSummarizeChange}
          />
          <ToggleSetting
            label="Smart notifications"
            description="Get AI-powered reminders based on your notes"
            enabled={settings.smartNotifications}
            onChange={handleSmartNotificationsChange}
          />
          <ToggleSetting
            label="Show weekly digest"
            description="Show a weekly summary card on your dashboard"
            enabled={settings.weeklyDigest}
            onChange={handleWeeklyDigestChange}
          />
        </div>

        {/* Weekly Digest Preview (real user stats) */}
        {settings.weeklyDigest && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border-secondary)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-theme-muted">Weekly digest preview</p>
              <span className="text-[10px] text-theme-muted px-2 py-0.5 rounded-full bg-theme-tertiary flex items-center gap-1">
                <Calendar size={12} weight="duotone" />
                {digestPeriodLabel}
              </span>
            </div>

            {statsError ? (
              <div className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                {statsError}
              </div>
            ) : (
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${statsLoading ? "opacity-80" : ""}`}>
                <MiniStat icon={<FiZap size={12} />} label="AI uses" value={safeStats.ai_uses ?? 0} />
                <MiniStat icon={<Fire size={12} weight="fill" />} label="Streak" value={`${safeStats.streak_days ?? 0}d`} />
                <MiniStat icon={<Lightning size={12} weight="fill" />} label="Active days" value={safeStats.active_days ?? 0} />
                <MiniStat icon={<FiUser size={12} />} label="Notes" value={safeStats.notes_created ?? 0} />
              </div>
            )}

            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  reqRef.current += 1;
                  hydrateFromDb();
                }}
                disabled={statsLoading}
                className="text-[11px] text-theme-muted hover:text-theme-primary transition disabled:opacity-50"
              >
                {statsLoading ? "Loading..." : "Refresh stats"}
              </button>
              <span className="text-[10px] text-theme-muted">
                {safeStats.last_active_date ? `Last active: ${safeStats.last_active_date}` : "Last active: —"}
              </span>
            </div>
          </div>
        )}

        {/* Settings status indicator */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border-secondary)" }}>
          <p className="text-[11px] text-theme-muted mb-2">Active features:</p>
          <div className="flex flex-wrap gap-2">
            {settings.autoSummarize && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <FiZap size={10} /> Auto-summarize
              </span>
            )}
            {settings.smartNotifications && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <FiZap size={10} /> Smart notifications
              </span>
            )}
            {settings.weeklyDigest && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                <FiZap size={10} /> Weekly digest
              </span>
            )}
            {!settings.autoSummarize && !settings.smartNotifications && !settings.weeklyDigest && (
              <span className="text-[10px] text-theme-muted">No AI features enabled</span>
            )}
          </div>
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
            className="w-full flex items-center justify-between bg-theme-input border border-theme-secondary rounded-xl px-4 py-3 hover:border-theme-tertiary transition group"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
                <Export size={16} weight="duotone" className="text-sky-400" />
              </div>
              <div className="text-left">
                <p className="text-sm text-theme-secondary">Export my data</p>
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
          <SupportLink icon={<FiHelpCircle size={16} />} label="Help Center" onClick={() => navigate("/dashboard/help-center")} />
          <SupportLink icon={<ChatCircle size={16} weight="duotone" />} label="Contact Support" onClick={() => navigate("/dashboard/contact-support")} />
          <SupportLink icon={<Crown size={16} weight="duotone" />} label="Upgrade to Pro" badge="NEW" onClick={() => navigate("/dashboard/ai-lab")} />
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
            className="w-full flex items-center gap-3 bg-theme-input border border-theme-secondary rounded-xl px-4 py-3 hover:border-rose-500/30 transition text-left"
          >
            <div className="h-8 w-8 rounded-lg bg-gray-500/20 flex items-center justify-center">
              <FiLogOut size={16} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-theme-secondary">Log out</p>
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
            onConfirm={async () => {
              try {
                if (isSupabaseConfigured && supabase) {
                  const user = await getUser();
                  if (user?.id) {
                    await supabase.from("activity_events").delete().eq("user_id", user.id);
                    await supabase.from("notes").delete().eq("user_id", user.id);
                    await supabase.from("documents").delete().eq("user_id", user.id);
                    await supabase.from(USER_STATS_TABLE).delete().eq("user_id", user.id);
                    await supabase.auth.signOut();
                  }
                }
              } catch (err) {
                console.error("Delete account error:", err);
              }
              localStorage.clear();
              setShowDeleteModal(false);
              showToast("Account deleted");
              setTimeout(() => navigate("/"), 300);
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
            icon={<FiLogOut size={20} className="text-gray-400" />}
            onConfirm={async () => {
              try {
                if (isSupabaseConfigured && supabase) {
                  await supabase.auth.signOut();
                }
              } catch {
                // ignore
              }
              setShowLogoutModal(false);
              showToast("Logged out successfully");
              setTimeout(() => navigate("/"), 300);
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
            description="Download all your notes, documents, stats, and settings as a JSON file. This includes data from your cloud account."
            confirmLabel="Download Export"
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
   Small stat pill for digest preview
----------------------------------------- */
function MiniStat({ icon, label, value }) {
  return (
    <div className="rounded-xl bg-theme-input border border-theme-secondary px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-theme-muted">{icon}</span>
        <span className="text-[11px] text-theme-muted">{label}</span>
      </div>
      <div className="mt-1 text-sm font-semibold text-theme-primary">{value}</div>
    </div>
  );
}

/* -----------------------------------------
   Toggle Setting Component
----------------------------------------- */
function ToggleSetting({ label, description, enabled, onChange }) {
  return (
    <div className="flex items-center justify-between bg-theme-input border border-theme-secondary rounded-xl px-4 py-3">
      <div className="pr-4">
        <p className="text-sm text-theme-secondary">{label}</p>
        {description && <p className="text-[10px] text-theme-muted mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-indigo-600" : "bg-[#2a2a34]"}`}
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
      className="w-full flex items-center justify-between bg-theme-input border border-theme-secondary rounded-xl px-4 py-3 hover:border-theme-tertiary transition group"
    >
      <div className="flex items-center gap-3">
        <span className="text-theme-muted">{icon}</span>
        <span className="text-sm text-theme-secondary">{label}</span>
        {badge && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
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
      className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-md flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-theme-card border border-theme-secondary rounded-2xl p-5 max-w-sm w-full"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-theme-button flex items-center justify-center">{icon}</div>
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
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition ${colorMap[confirmColor]}`}
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
      className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-md flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-theme-card border border-theme-secondary rounded-2xl p-5 max-w-sm w-full"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <FiLock size={18} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-theme-primary">{step === 1 ? "Create PIN" : "Confirm PIN"}</h3>
            <p className="text-xs text-theme-muted">{step === 1 ? "Enter a 4-digit PIN" : "Re-enter your PIN"}</p>
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
            if (step === 1) setPin(val);
            else setConfirmPin(val);
            setError("");
          }}
          className="w-full bg-theme-input border border-theme-secondary rounded-xl px-4 py-4 text-center tracking-[0.5em] text-xl text-theme-primary font-mono placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/50 mb-4"
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
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition"
          >
            {step === 1 ? "Next" : "Save PIN"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}


