// src/pages/Settings.jsx
// ═══════════════════════════════════════════════════════════════════
// REDESIGNED: Matching bento-glass visual system.
// + Page loading skeleton on initial load
// + Full account deletion (data + auth user via RPC)
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useWorkspaceSettings } from "../hooks/useWorkspaceSettings";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import {
  FiUser, FiLock, FiMoon, FiSun, FiMonitor, FiTrash2, FiLogOut,
  FiChevronRight, FiCheck, FiHelpCircle, FiZap, FiEdit2, FiX,
} from "react-icons/fi";
import {
  Gear, UserCircle, PaintBrush, Robot, ShieldCheck, Warning, Crown,
  Export, Question, ChatCircle, Fire, Lightning, Calendar, Sparkle,
} from "phosphor-react";

const USER_STATS_TABLE = "user_engagement_stats";

/* ─── Scoped styles ─── */
const SETTINGS_STYLES = `
@keyframes ns-set-fade-up {
  0%   { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
.ns-set-stagger > * {
  animation: ns-set-fade-up 0.4s cubic-bezier(.22,1,.36,1) both;
}
.ns-set-stagger > *:nth-child(1) { animation-delay: 0.02s; }
.ns-set-stagger > *:nth-child(2) { animation-delay: 0.05s; }
.ns-set-stagger > *:nth-child(3) { animation-delay: 0.08s; }
.ns-set-stagger > *:nth-child(4) { animation-delay: 0.11s; }
.ns-set-stagger > *:nth-child(5) { animation-delay: 0.14s; }
.ns-set-stagger > *:nth-child(6) { animation-delay: 0.17s; }
.ns-set-stagger > *:nth-child(7) { animation-delay: 0.20s; }
.ns-set-stagger > *:nth-child(8) { animation-delay: 0.23s; }

.ns-set-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: var(--card-glass-bg, var(--bg-surface));
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--card-glass-border, var(--border-secondary));
  box-shadow: var(--card-glass-shadow, 0 8px 32px rgba(0,0,0,0.12));
}
.ns-set-card::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%);
  pointer-events: none; z-index: 1;
}
.ns-set-card::after {
  content: '';
  position: absolute;
  left: 24px; right: 24px; top: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  pointer-events: none; z-index: 2;
}

.ns-set-row {
  border-radius: 14px;
  border: 1px solid var(--border-secondary);
  background: var(--bg-input, var(--bg-tertiary));
  transition: all 0.2s ease;
}
.ns-set-row:hover {
  border-color: rgba(99,102,241,0.2);
}

@keyframes ns-skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.15; }
}
.ns-skeleton {
  border-radius: 10px;
  background: var(--border-secondary);
  animation: ns-skeleton-pulse 1.8s ease-in-out infinite;
}
`;

function formatDateShort(d) {
  try { return new Intl.DateTimeFormat(undefined, { month: "numeric", day: "numeric", year: "numeric" }).format(d); }
  catch { return d.toLocaleDateString(); }
}
function getLast7DaysRange() {
  const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 7); return { start, end };
}

/* ─── Loading Skeleton ─── */
function SettingsSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="ns-skeleton h-11 w-11 rounded-2xl" />
        <div className="space-y-2">
          <div className="ns-skeleton h-5 w-24 rounded-lg" />
          <div className="ns-skeleton h-3 w-48 rounded-lg" />
        </div>
      </div>
      {/* Card skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="ns-set-card">
          <div className="relative z-10 p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="ns-skeleton h-8 w-8 rounded-lg" />
              <div className="ns-skeleton h-4 w-20 rounded-lg" />
            </div>
            <div className="ns-skeleton h-12 w-full rounded-xl" />
            <div className="ns-skeleton h-12 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { settings, updateSetting } = useWorkspaceSettings();

  /* ── State ── */
  const [pageLoading, setPageLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(() => localStorage.getItem("ns-note-pin") !== null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const reqRef = useRef(0);
  const savingRef = useRef(false);

  const showToast = (message) => { setToast(message); setTimeout(() => setToast(null), 3000); };

  /* ── Auth + DB helpers ── */
  const getUser = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data?.session?.user ?? null;
  }, []);

  const ensureStatsRow = useCallback(async (user) => {
    if (!user?.id) return;
    const nameFromAuth = user.user_metadata?.full_name ?? user.user_metadata?.name ?? (user.email ? user.email.split("@")[0] : null);
    try {
      const { error } = await supabase.rpc("ensure_user_stats_exists", { p_user_id: user.id, p_display_name: nameFromAuth });
      if (error) console.warn("ensure_user_stats_exists error:", error);
    } catch (err) { console.warn("ensureStatsRow error:", err); }
  }, []);

  const hydrateFromDb = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const myReq = ++reqRef.current;
    setProfileLoading(true); setStatsLoading(true); setStatsError("");
    try {
      const user = await getUser();
      if (myReq !== reqRef.current) return;
      if (!user?.id) { if (!savingRef.current) { setDisplayName(""); setEmail(""); } setStats(null); return; }
      setEmail(user.email || "");
      await ensureStatsRow(user);
      if (myReq !== reqRef.current) return;
      const { data, error } = await supabase.from(USER_STATS_TABLE).select("display_name, notes_created, ai_uses, active_days, streak_days, last_active_date").eq("user_id", user.id).single();
      if (error) throw error;
      if (!savingRef.current) setDisplayName(data?.display_name || "");
      setStats(data ? { notes_created: data.notes_created ?? 0, ai_uses: data.ai_uses ?? 0, active_days: data.active_days ?? 0, streak_days: data.streak_days ?? 0, last_active_date: data.last_active_date ?? null } : null);
    } catch (e) { setStats(null); setStatsError(e?.message || "Failed to load stats."); }
    finally { if (myReq === reqRef.current) { setProfileLoading(false); setStatsLoading(false); setPageLoading(false); } }
  }, [ensureStatsRow, getUser]);

  useEffect(() => {
    hydrateFromDb();
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(() => { reqRef.current += 1; hydrateFromDb(); });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  /* ── Profile save ── */
  const handleSaveProfile = async () => {
    const cleanName = (displayName || "").trim();
    if (!cleanName) return showToast("Display name cannot be empty.");
    setIsEditingProfile(false); savingRef.current = true; setDisplayName(cleanName);
    try {
      if (!isSupabaseConfigured || !supabase) throw new Error("Supabase not configured.");
      const user = await getUser(); if (!user?.id) throw new Error("Not signed in.");
      await ensureStatsRow(user);
      const { data, error } = await supabase.from(USER_STATS_TABLE).update({ display_name: cleanName }).eq("user_id", user.id).select("display_name");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Update blocked (RLS).");
      try { await supabase.auth.updateUser({ data: { full_name: cleanName, name: cleanName } }); } catch {}
      showToast("Profile updated!"); reqRef.current += 1; savingRef.current = false; hydrateFromDb();
    } catch (err) { showToast(err?.message || "Save failed."); savingRef.current = false; reqRef.current += 1; hydrateFromDb(); }
  };

  /* ── DELETE ACCOUNT (full removal via RPC) ── */
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.rpc("delete_my_account");
        if (error) throw error;
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Account deletion failed:", err);
      showToast("Failed to delete account: " + (err?.message || "Unknown error"));
      setDeleteLoading(false);
      setShowDeleteModal(false);
      return;
    }
    localStorage.clear();
    setDeleteLoading(false);
    setShowDeleteModal(false);
    showToast("Account deleted permanently");
    setTimeout(() => navigate("/"), 300);
  };

  /* ── Export ── */
  const handleExportData = async () => {
    try {
      const exportData = { exportDate: new Date().toISOString(), version: "1.0.0", profile: { displayName: displayName || "Unknown", email: email || "Unknown" }, settings: { theme: theme || "dark", autoSummarize: !!settings.autoSummarize, smartNotifications: !!settings.smartNotifications, weeklyDigest: !!settings.weeklyDigest, pinEnabled: localStorage.getItem("ns-note-pin") !== null }, stats: stats || {}, notes: [], documents: [], activity: [] };
      if (isSupabaseConfigured && supabase) {
        const user = await getUser();
        if (user?.id) {
          const { data: n } = await supabase.from("notes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }); if (n) exportData.notes = n;
          const { data: d } = await supabase.from("documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false }); if (d) exportData.documents = d;
          const { data: a } = await supabase.from("activity_events").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(500); if (a) exportData.activity = a;
        }
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = `notestream-export-${new Date().toISOString().split("T")[0]}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      setShowExportModal(false); showToast("Data exported!");
    } catch (err) { setShowExportModal(false); showToast("Export failed."); }
  };

  /* ── Setting handlers ── */
  const handleAutoSummarizeChange = (v) => { updateSetting("autoSummarize", v); showToast(v ? "Auto-summarize enabled" : "Auto-summarize disabled"); };
  const handleWeeklyDigestChange = async (v) => { updateSetting("weeklyDigest", v); if (v && isSupabaseConfigured && supabase) { try { await hydrateFromDb(); } catch {} } showToast(v ? "Weekly digest enabled" : "Weekly digest disabled"); };
  const handleSmartNotificationsChange = (v) => { updateSetting("smartNotifications", v); showToast(v ? "Smart notifications enabled" : "Smart notifications disabled"); };

  const themeOptions = [
    { value: "dark", label: "Dark", icon: FiMoon, accent: "#818cf8" },
    { value: "light", label: "Light", icon: FiSun, accent: "#f59e0b" },
    { value: "system", label: "Auto", icon: FiMonitor, accent: "#06b6d4" },
  ];

  const range = getLast7DaysRange();
  const digestPeriodLabel = `${formatDateShort(range.start)} – ${formatDateShort(range.end)}`;
  const safeStats = useMemo(() => stats || { notes_created: 0, ai_uses: 0, active_days: 0, streak_days: 0, last_active_date: null }, [stats]);

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */

  // Show skeleton while loading
  if (pageLoading) {
    return (
      <>
        <style>{SETTINGS_STYLES}</style>
        <SettingsSkeleton />
      </>
    );
  }

  return (
    <>
      <style>{SETTINGS_STYLES}</style>

      <div className="space-y-5 pb-[calc(var(--mobile-nav-height)+24px)] ns-set-stagger">

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl flex items-center gap-2 bg-emerald-500 text-white">
              <FiCheck size={16} /> {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HEADER ── */}
        <header className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.12))", border: "1px solid rgba(99,102,241,0.28)" }}>
            <Gear weight="duotone" size={22} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Settings</h1>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Control how NoteStream works for you</p>
          </div>
        </header>

        {/* ── PROFILE ── */}
        <div className="ns-set-card">
          <div className="relative z-10 p-4">
            <SectionHead icon={<UserCircle size={16} weight="duotone" />} label="Profile" accent="#818cf8" />
            <div className="space-y-3 mt-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>Display name</label>
                {isEditingProfile ? (
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoFocus
                    className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition"
                    style={{ background: "var(--bg-input)", border: "1px solid rgba(99,102,241,0.3)", color: "var(--text-primary)" }} />
                ) : (
                  <div className="ns-set-row flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>{profileLoading ? "Loading…" : displayName || "—"}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>Email</label>
                <div className="ns-set-row flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>{email || "—"}</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}>READ ONLY</span>
                </div>
              </div>
              {isEditingProfile ? (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setIsEditingProfile(false); reqRef.current += 1; hydrateFromDb(); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition"
                    style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-secondary)" }}>Cancel</button>
                  <button onClick={handleSaveProfile}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>Save Changes</button>
                </div>
              ) : (
                <button onClick={() => setIsEditingProfile(true)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                  style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-secondary)" }}>
                  <FiEdit2 size={13} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── APPEARANCE ── */}
        <div className="ns-set-card">
          <div className="relative z-10 p-4">
            <SectionHead icon={<PaintBrush size={16} weight="duotone" />} label="Appearance" accent="#a855f7" />
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Theme</label>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                  style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-muted)" }}>
                  {resolvedTheme === "dark" ? "🌙 Dark" : "☀️ Light"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = theme === opt.value;
                  const rgbMap = { "#818cf8": "99,102,241", "#f59e0b": "245,158,11", "#06b6d4": "6,182,212" };
                  const rgb = rgbMap[opt.accent] || "99,102,241";
                  return (
                    <button key={opt.value} onClick={() => setTheme(opt.value)}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-bold transition"
                      style={{
                        background: isActive ? `rgba(${rgb},0.12)` : "var(--bg-input)",
                        border: `1px solid ${isActive ? `rgba(${rgb},0.3)` : "var(--border-secondary)"}`,
                        color: isActive ? opt.accent : "var(--text-secondary)",
                        boxShadow: isActive ? `0 0 16px rgba(${rgb},0.08)` : "none",
                      }}>
                      <Icon size={14} /> {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
                {theme === "system" ? "Follows your device settings" : `${theme.charAt(0).toUpperCase() + theme.slice(1)} mode active`}
              </p>
            </div>
          </div>
        </div>

        {/* ── WORKSPACE AI ── */}
        <div className="ns-set-card">
          <div className="relative z-10 p-4">
            <SectionHead icon={<Robot size={16} weight="duotone" />} label="Workspace AI" accent="#10b981" />
            <p className="text-[11px] mt-1 mb-3" style={{ color: "var(--text-muted)" }}>Configure how NoteStream uses AI</p>
            <div className="space-y-2">
              <ToggleSetting label="Auto-summarize uploads" description="Generate AI summaries for new files" enabled={settings.autoSummarize} onChange={handleAutoSummarizeChange} />
              <ToggleSetting label="Smart notifications" description="AI-powered reminders from your notes" enabled={settings.smartNotifications} onChange={handleSmartNotificationsChange} />
              <ToggleSetting label="Weekly digest" description="Summary card on your dashboard" enabled={settings.weeklyDigest} onChange={handleWeeklyDigestChange} />
            </div>

            {settings.weeklyDigest && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border-secondary)" }}>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Digest preview</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1"
                    style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-muted)" }}>
                    <Calendar size={11} weight="duotone" /> {digestPeriodLabel}
                  </span>
                </div>
                {statsError ? (
                  <div className="text-[11px] rounded-xl px-3 py-2" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#f43f5e" }}>{statsError}</div>
                ) : (
                  <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${statsLoading ? "opacity-70" : ""}`}>
                    <DigestStat icon={<FiZap size={11} />} label="AI uses" value={safeStats.ai_uses} accent="#818cf8" />
                    <DigestStat icon={<Fire size={11} weight="fill" />} label="Streak" value={`${safeStats.streak_days}d`} accent="#f43f5e" />
                    <DigestStat icon={<Lightning size={11} weight="fill" />} label="Active" value={safeStats.active_days} accent="#f59e0b" />
                    <DigestStat icon={<FiUser size={11} />} label="Notes" value={safeStats.notes_created} accent="#10b981" />
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <button type="button" onClick={() => { reqRef.current += 1; hydrateFromDb(); }} disabled={statsLoading}
                    className="text-[11px] font-medium transition disabled:opacity-50" style={{ color: "var(--text-muted)" }}>
                    {statsLoading ? "Loading…" : "↻ Refresh"}
                  </button>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {safeStats.last_active_date ? `Last active: ${safeStats.last_active_date}` : "Last active: —"}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border-secondary)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Active features</p>
              <div className="flex flex-wrap gap-1.5">
                {settings.autoSummarize && <FeaturePill icon={<FiZap size={9} />} label="Auto-summarize" color="#10b981" />}
                {settings.smartNotifications && <FeaturePill icon={<Sparkle size={9} weight="fill" />} label="Smart notifs" color="#f59e0b" />}
                {settings.weeklyDigest && <FeaturePill icon={<Calendar size={9} weight="duotone" />} label="Digest" color="#a855f7" />}
                {!settings.autoSummarize && !settings.smartNotifications && !settings.weeklyDigest && (
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>No AI features enabled</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECURITY ── */}
        <div className="ns-set-card">
          <div className="relative z-10 p-4">
            <SectionHead icon={<ShieldCheck size={16} weight="duotone" />} label="Security" accent="#f59e0b" />
            <div className="space-y-2 mt-3">
              <ToggleSetting label="App Lock PIN" description="Require PIN for locked notes" enabled={pinEnabled}
                onChange={(v) => { if (v) setShowPinModal(true); else { localStorage.removeItem("ns-note-pin"); setPinEnabled(false); showToast("PIN lock disabled"); } }} />
              <SettingsLink icon={<Export size={15} weight="duotone" />} iconBg="rgba(14,165,233,0.12)" iconColor="#0ea5e9"
                label="Export my data" sub="Download notes, docs & settings" onClick={() => setShowExportModal(true)} />
            </div>
          </div>
        </div>

        {/* ── SUPPORT ── */}
        <div className="ns-set-card">
          <div className="relative z-10 p-4">
            <SectionHead icon={<Question size={16} weight="duotone" />} label="Support" accent="#0ea5e9" />
            <div className="space-y-2 mt-3">
              <SettingsLink icon={<FiHelpCircle size={15} />} iconBg="rgba(99,102,241,0.12)" iconColor="#818cf8" label="Help Center" onClick={() => navigate("/dashboard/help-center")} />
              <SettingsLink icon={<ChatCircle size={15} weight="duotone" />} iconBg="rgba(99,102,241,0.12)" iconColor="#818cf8" label="Contact Support" onClick={() => navigate("/dashboard/contact-support")} />
              <SettingsLink icon={<Crown size={15} weight="duotone" />} iconBg="rgba(245,158,11,0.12)" iconColor="#f59e0b" label="Upgrade to Pro" badge="NEW" onClick={() => navigate("/dashboard/ai-lab")} />
            </div>
          </div>
        </div>

        {/* ── DANGER ZONE ── */}
        <div className="ns-set-card" style={{ borderColor: "rgba(244,63,94,0.2)" }}>
          <div className="relative z-10 p-4">
            <SectionHead icon={<Warning size={16} weight="duotone" />} label="Danger Zone" accent="#f43f5e" />
            <p className="text-[11px] mt-1 mb-3" style={{ color: "var(--text-muted)" }}>These actions cannot be undone.</p>
            <div className="space-y-2">
              <button onClick={() => setShowLogoutModal(true)} className="w-full ns-set-row flex items-center gap-3 px-4 py-3 transition text-left">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <FiLogOut size={15} style={{ color: "var(--text-muted)" }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Log out</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Sign out of your account</p>
                </div>
              </button>
              <button onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center gap-3 rounded-[14px] px-4 py-3 transition text-left"
                style={{ background: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.2)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(244,63,94,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(244,63,94,0.04)"; }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(244,63,94,0.12)" }}>
                  <FiTrash2 size={15} style={{ color: "#f43f5e" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#f43f5e" }}>Delete account</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Permanently remove all data & auth account</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* App Version */}
        <div className="text-center py-3">
          <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>NoteStream v1.0.0</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.5 }}>Made with ❤️ for productivity</p>
        </div>

        {/* ── MODALS ── */}
        <AnimatePresence>
          {showDeleteModal && (
            <ConfirmModal title="Delete Account?" description="This will permanently delete all your notes, documents, settings, AND your login account. This cannot be undone."
              confirmLabel={deleteLoading ? "Deleting…" : "Delete Forever"} confirmDisabled={deleteLoading}
              confirmStyle={{ background: "linear-gradient(135deg, #e11d48, #f43f5e)" }}
              icon={deleteLoading
                ? <div className="w-5 h-5 border-2 border-rose-300/30 border-t-rose-400 rounded-full animate-spin" />
                : <FiTrash2 size={18} style={{ color: "#f43f5e" }} />
              }
              iconBg="rgba(244,63,94,0.12)" iconBorder="rgba(244,63,94,0.25)"
              onConfirm={handleDeleteAccount}
              onCancel={() => { if (!deleteLoading) setShowDeleteModal(false); }} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLogoutModal && (
            <ConfirmModal title="Log Out?" description="You'll need to sign in again to access your notes."
              confirmLabel="Log Out" confirmStyle={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-primary)" }}
              icon={<FiLogOut size={18} style={{ color: "var(--text-muted)" }} />} iconBg="rgba(255,255,255,0.04)" iconBorder="var(--border-secondary)"
              onConfirm={async () => {
                try { if (isSupabaseConfigured && supabase) await supabase.auth.signOut(); } catch {}
                setShowLogoutModal(false); showToast("Logged out"); setTimeout(() => navigate("/"), 300);
              }}
              onCancel={() => setShowLogoutModal(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showExportModal && (
            <ConfirmModal title="Export Your Data" description="Download all notes, documents, stats, and settings as JSON."
              confirmLabel="Download Export" confirmStyle={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              icon={<Export size={18} weight="duotone" style={{ color: "#0ea5e9" }} />} iconBg="rgba(14,165,233,0.12)" iconBorder="rgba(14,165,233,0.25)"
              onConfirm={handleExportData} onCancel={() => setShowExportModal(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showPinModal && (
            <PinModal
              onSave={(pin) => { localStorage.setItem("ns-note-pin", pin); setPinEnabled(true); setShowPinModal(false); showToast("PIN lock enabled!"); }}
              onCancel={() => setShowPinModal(false)} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}


/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════ */

function SectionHead({ icon, label, accent }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}1a`, border: `1px solid ${accent}33` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <h2 className="text-sm font-bold" style={{ color: accent }}>{label}</h2>
    </div>
  );
}

function ToggleSetting({ label, description, enabled, onChange }) {
  return (
    <div className="ns-set-row flex items-center justify-between px-4 py-3">
      <div className="pr-4">
        <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p>
        {description && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{description}</p>}
      </div>
      <button onClick={() => onChange(!enabled)}
        className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
        style={{ background: enabled ? "rgba(99,102,241,0.8)" : "rgba(255,255,255,0.08)" }}>
        <motion.div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md"
          animate={{ x: enabled ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
      </button>
    </div>
  );
}

function SettingsLink({ icon, iconBg, iconColor, label, sub, badge, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full ns-set-row flex items-center justify-between px-4 py-3 transition text-left group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>{label}</span>
            {badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8" }}>{badge}</span>}
          </div>
          {sub && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
        </div>
      </div>
      <FiChevronRight size={14} style={{ color: "var(--text-muted)" }} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

function DigestStat({ icon, label, value, accent }) {
  return (
    <div className="ns-set-row px-3 py-2.5">
      <div className="flex items-center justify-between mb-1">
        <span style={{ color: accent }}>{icon}</span>
        <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
      </div>
      <p className="text-lg font-extrabold" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{value}</p>
    </div>
  );
}

function FeaturePill({ icon, label, color }) {
  return (
    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
      style={{ background: `${color}1a`, border: `1px solid ${color}33`, color }}>
      {icon} {label}
    </span>
  );
}

function ConfirmModal({ title, description, confirmLabel, confirmStyle, confirmDisabled, icon, iconBg, iconBorder, onConfirm, onCancel }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-overlay, rgba(0,0,0,0.6))", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="ns-set-card max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-2xl flex items-center justify-center" style={{ background: iconBg, border: `1px solid ${iconBorder}` }}>{icon}</div>
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{title}</h3>
          </div>
          <p className="text-[13px] mb-5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{description}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={confirmDisabled} className="flex-1 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
              style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-secondary)" }}>Cancel</button>
            <button onClick={onConfirm} disabled={confirmDisabled} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition disabled:opacity-70"
              style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.2)", ...confirmStyle }}>{confirmLabel}</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PinModal({ onSave, onCancel }) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const handleNext = () => { if (pin.length !== 4) { setError("PIN must be 4 digits"); return; } setError(""); setStep(2); };
  const handleConfirm = () => { if (pin !== confirmPin) { setError("PINs don't match"); setConfirmPin(""); return; } onSave(pin); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-overlay, rgba(0,0,0,0.6))", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="ns-set-card max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
              <FiLock size={18} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{step === 1 ? "Create PIN" : "Confirm PIN"}</h3>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{step === 1 ? "Enter a 4-digit PIN" : "Re-enter your PIN"}</p>
            </div>
          </div>

          {error && (
            <div className="mb-3 px-3 py-2 rounded-xl text-[11px]"
              style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#f43f5e" }}>{error}</div>
          )}

          <input type="password" maxLength={4} value={step === 1 ? pin : confirmPin}
            onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); if (step === 1) setPin(val); else setConfirmPin(val); setError(""); }}
            className="w-full rounded-xl px-4 py-4 text-center tracking-[0.5em] text-xl font-mono mb-4 focus:outline-none transition"
            style={{ background: "var(--bg-input)", border: "1px solid rgba(99,102,241,0.3)", color: "var(--text-primary)" }}
            placeholder="••••" autoFocus />

          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-sm font-semibold transition"
              style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-secondary)" }}>Cancel</button>
            <button onClick={step === 1 ? handleNext : handleConfirm}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
              {step === 1 ? "Next" : "Save PIN"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

