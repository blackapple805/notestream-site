// src/pages/Settings.jsx — "The Composing Room"
// ═══════════════════════════════════════════════════════════════════
// EDITORIAL RESKIN — what changed and why
// ─────────────────────────────────────────────────────────────────
// Wrapped the page in `<div className="ns-ed">` and called
// `useEditorial()`. The dark bento-glass settings panels are now
// editorial chapters: each section (Profile, Appearance, Workspace
// AI, Security, Support, Danger zone) sits beneath a `§ NN —` mono
// chapter mark, separated by hairline rules. Profile inputs are
// paper-50 fields with hairline borders. Theme picker is three pill
// buttons, ink-fill when active. Toggles are ink/paper pill switches.
// Settings links are full-width article rows.
// All Supabase / theme / workspace-settings / RPC delete / export /
// PIN modal logic is UNCHANGED — only the JSX shell and CSS were
// touched.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useWorkspaceSettings } from "../hooks/useWorkspaceSettings";
import { useAuth } from "../hooks/useAuth";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { useEditorial, ED } from "../lib/editorial";
import {
  FiLock, FiMoon, FiSun, FiMonitor, FiTrash2, FiLogOut,
  FiChevronRight, FiCheck, FiHelpCircle, FiZap, FiEdit2, FiX,
  FiDownload, FiUser,
} from "react-icons/fi";

const USER_STATS_TABLE = "user_engagement_stats";

function formatDateShort(d) {
  try { return new Intl.DateTimeFormat(undefined, { month: "numeric", day: "numeric", year: "numeric" }).format(d); }
  catch { return d.toLocaleDateString(); }
}
function getLast7DaysRange() {
  const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 7); return { start, end };
}

export default function Settings() {
  useEditorial();
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { settings, updateSetting } = useWorkspaceSettings();
  // ✅ Shared auth state — no more per-page getSession calls.
  const { user: authUser, ready: authReady } = useAuth();

  /* ── State (UNCHANGED) ── */
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
  // Reads from the shared AuthProvider instead of calling
  // supabase.auth.getSession() — eliminates one of the parallel
  // refresh-token attempts during dashboard mount.
  const getUser = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return null;
    if (!authReady) return null;
    return authUser ?? null;
  }, [authReady, authUser?.id]);

  const ensureStatsRow = useCallback(async (user) => {
    if (!user?.id) return;
    const nameFromAuth = user.user_metadata?.full_name ?? user.user_metadata?.name ?? (user.email ? user.email.split("@")[0] : null);
    try {
      const { error } = await supabase.rpc("ensure_user_stats_exists", { p_user_id: user.id, p_display_name: nameFromAuth });
      if (error) console.warn("ensure_user_stats_exists error:", error);
    } catch (err) { console.warn("ensureStatsRow error:", err); }
  }, []);

  const hydrateFromDb = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      // No Supabase configured — render the page in its empty/default
      // state instead of hanging on the loader forever. Without this,
      // the early return below bypasses the `finally` block (which is
      // where setPageLoading(false) lives), so locally or in any env
      // without Supabase env vars the loader sticks.
      setPageLoading(false);
      return;
    }
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

  // Refetch when auth becomes ready or the user changes. The
  // AuthProvider's single listener fires on SIGNED_IN, SIGNED_OUT and
  // TOKEN_REFRESHED — depending on authUser?.id gives us the same
  // behavior the old onAuthStateChange listener provided without a
  // duplicate auth subscription.
  useEffect(() => {
    if (!authReady) return;
    reqRef.current += 1;
    hydrateFromDb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, authUser?.id]);

  /* ── Profile save (UNCHANGED) ── */
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
      showToast("Profile updated."); reqRef.current += 1; savingRef.current = false; hydrateFromDb();
    } catch (err) { showToast(err?.message || "Save failed."); savingRef.current = false; reqRef.current += 1; hydrateFromDb(); }
  };

  /* ── Account deletion (UNCHANGED) ── */
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.rpc("delete_my_account");
        if (error) throw error;
        try { await supabase.auth.signOut({ scope: "local" }); } catch {}
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
    window.location.href = "/";
  };

  /* ── Export (UNCHANGED) ── */
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
      setShowExportModal(false); showToast("Data exported.");
    } catch (err) { setShowExportModal(false); showToast("Export failed."); }
  };

  /* ── Setting handlers (UNCHANGED) ── */
  const handleAutoSummarizeChange    = (v) => { updateSetting("autoSummarize", v);    showToast(v ? "Auto-summarise enabled" : "Auto-summarise disabled"); };
  const handleWeeklyDigestChange     = async (v) => { updateSetting("weeklyDigest", v); if (v && isSupabaseConfigured && supabase) { try { await hydrateFromDb(); } catch {} } showToast(v ? "Weekly digest enabled" : "Weekly digest disabled"); };
  const handleSmartNotificationsChange = (v) => { updateSetting("smartNotifications", v); showToast(v ? "Smart notifications enabled" : "Smart notifications disabled"); };

  const themeOptions = [
    { value: "light",  label: "Light",  icon: FiSun },
    { value: "dark",   label: "Dark",   icon: FiMoon },
    { value: "system", label: "Auto",   icon: FiMonitor },
  ];

  const range = getLast7DaysRange();
  const digestPeriodLabel = `${formatDateShort(range.start)} – ${formatDateShort(range.end)}`;
  const safeStats = useMemo(() => stats || { notes_created: 0, ai_uses: 0, active_days: 0, streak_days: 0, last_active_date: null }, [stats]);

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */

  if (pageLoading) {
    return (
      <div className="ns-ed">
        <style>{SETTINGS_STYLES}</style>
        <div style={{ padding: "80px 32px" }}>
          <p className="ed-mono" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint }}>
            Loading the composing room…
          </p>
          <hr style={{ width: 160, height: 1, background: ED.rule, border: 0, margin: "14px 0 0 0", animation: "ns-set-pulse 1.4s ease-in-out infinite" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="ns-ed">
      <style>{SETTINGS_STYLES}</style>

      <div style={{ paddingBottom: "calc(var(--mobile-nav-height, 0px) + 24px)" }}>

        {/* ── TOAST ── */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="ns-set-toast ed-mono"
            >
              <FiCheck size={13} /> {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HEADER ── */}
        <header style={{ paddingTop: 32 }}>
          <div className="ed-chapter" style={{ marginBottom: 18 }}>
            <span className="num">№ 09</span>
            <span>— THE COMPOSING ROOM</span>
          </div>
          <h1 className="ed-display" style={{ fontSize: "clamp(40px, 5vw, 64px)", margin: 0, paddingBottom: "0.06em" }}>
            How the paper{" "}
            <span className="ed-italic" style={{ color: ED.accent }}>reads.</span>
          </h1>
          <p className="ed-mono" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint, marginTop: 28 }}>
            PROFILE · APPEARANCE · WORKSPACE · SECURITY · SUPPORT
          </p>
        </header>

        <hr className="ed-rule-dbl" style={{ marginTop: 32 }} />

        {/* ━━━━━━━━━━━━━━ § 01 PROFILE ━━━━━━━━━━━━━━ */}
        <section className="ns-set-section">
          <div className="ns-set-section-head">
            <div className="ed-chapter">
              <span className="num">§ 01</span>
              <span>— PROFILE</span>
            </div>
            <p className="ed-mono ns-set-section-sub">YOUR NAME ON THE MASTHEAD</p>
          </div>
          <hr className="ed-rule" />

          <div className="ns-set-fieldset">
            <Field label="Display name">
              {isEditingProfile ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
                  className="ns-set-input"
                />
              ) : (
                <p className="ns-set-readout">{profileLoading ? "Loading…" : displayName || "—"}</p>
              )}
            </Field>

            <Field label="Email" hint="Used for sign-in. Change requires verification.">
              <p className="ns-set-readout">
                {email || "—"}
                <span className="ed-chip" style={{ marginLeft: 12 }}>READ ONLY</span>
              </p>
            </Field>

            <div className="ns-set-actions">
              {isEditingProfile ? (
                <>
                  <button
                    onClick={() => { setIsEditingProfile(false); reqRef.current += 1; hydrateFromDb(); }}
                    className="ed-btn ed-btn-ghost"
                  >
                    Cancel
                  </button>
                  <button onClick={handleSaveProfile} className="ed-btn ed-btn-primary">
                    Save changes
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditingProfile(true)} className="ed-btn ed-btn-ghost">
                  <FiEdit2 size={13} /> Edit profile
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━ § 02 APPEARANCE ━━━━━━━━━━━━━━ */}
        <section className="ns-set-section">
          <div className="ns-set-section-head">
            <div className="ed-chapter">
              <span className="num">§ 02</span>
              <span>— APPEARANCE</span>
            </div>
            <p className="ed-mono ns-set-section-sub">
              {theme === "system" ? "FOLLOWS YOUR DEVICE" : `${(theme || "").toUpperCase()} MODE ACTIVE`}
            </p>
          </div>
          <hr className="ed-rule" />

          <div className="ns-set-fieldset">
            <Field label="Theme" hint="The paper reads best in light. Dark and auto are available for reading at night.">
              <div className="ns-set-theme-row">
                {themeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={`ns-set-theme-btn ${isActive ? "is-on" : ""}`}
                    >
                      <Icon size={14} /> {opt.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━ § 03 WORKSPACE AI ━━━━━━━━━━━━━━ */}
        <section className="ns-set-section">
          <div className="ns-set-section-head">
            <div className="ed-chapter">
              <span className="num">§ 03</span>
              <span>— WORKSPACE AI</span>
            </div>
            <p className="ed-mono ns-set-section-sub">HOW THE MODEL READS YOUR ARCHIVE</p>
          </div>
          <hr className="ed-rule" />

          <div className="ns-set-toggles">
            <Toggle
              label="Auto-summarise uploads"
              description="The model writes a three-sentence summary for every new document."
              enabled={settings.autoSummarize}
              onChange={handleAutoSummarizeChange}
            />
            <Toggle
              label="Smart notifications"
              description="Reminders surfaced from your own notes when the moment is right."
              enabled={settings.smartNotifications}
              onChange={handleSmartNotificationsChange}
            />
            <Toggle
              label="Weekly digest"
              description="A summary card on your dashboard every Monday morning."
              enabled={settings.weeklyDigest}
              onChange={handleWeeklyDigestChange}
            />
          </div>

          {settings.weeklyDigest && (
            <div className="ns-set-digest">
              <div className="ns-set-digest-head">
                <p className="ed-mono ns-set-section-sub">DIGEST PREVIEW · {digestPeriodLabel.toUpperCase()}</p>
                <button
                  type="button"
                  onClick={() => { reqRef.current += 1; hydrateFromDb(); }}
                  disabled={statsLoading}
                  className="ed-mono ns-set-refresh"
                >
                  {statsLoading ? "LOADING…" : "↻ REFRESH"}
                </button>
              </div>
              {statsError ? (
                <p className="ed-serif ed-italic" style={{ color: "#a3261c", margin: 0, fontSize: 16 }}>{statsError}</p>
              ) : (
                <div className="ns-set-digest-grid">
                  <DigestStat label="AI uses"    value={safeStats.ai_uses} />
                  <DigestStat label="Streak"     value={`${safeStats.streak_days}d`} />
                  <DigestStat label="Active"     value={safeStats.active_days} />
                  <DigestStat label="Notes"      value={safeStats.notes_created} />
                </div>
              )}
              <p className="ed-mono ns-set-digest-foot">
                LAST ACTIVE: {safeStats.last_active_date ? String(safeStats.last_active_date).toUpperCase() : "—"}
              </p>
            </div>
          )}
        </section>

        {/* ━━━━━━━━━━━━━━ § 04 SECURITY ━━━━━━━━━━━━━━ */}
        <section className="ns-set-section">
          <div className="ns-set-section-head">
            <div className="ed-chapter">
              <span className="num">§ 04</span>
              <span>— SECURITY</span>
            </div>
            <p className="ed-mono ns-set-section-sub">KEEPING THE LOCK ON THE DESK DRAWER</p>
          </div>
          <hr className="ed-rule" />

          <div className="ns-set-toggles">
            <Toggle
              label="App lock PIN"
              description="A four-digit PIN required before opening locked notes."
              enabled={pinEnabled}
              onChange={(v) => {
                if (v) setShowPinModal(true);
                else { localStorage.removeItem("ns-note-pin"); setPinEnabled(false); showToast("PIN lock disabled"); }
              }}
            />
          </div>

          <LinkRow
            label="Export my data"
            sub="Download notes, documents, and settings as JSON."
            onClick={() => setShowExportModal(true)}
            ordinal="01"
          />
        </section>

        {/* ━━━━━━━━━━━━━━ § 05 SUPPORT ━━━━━━━━━━━━━━ */}
        <section className="ns-set-section">
          <div className="ns-set-section-head">
            <div className="ed-chapter">
              <span className="num">§ 05</span>
              <span>— SUPPORT</span>
            </div>
            <p className="ed-mono ns-set-section-sub">A REAL PERSON, A SLOW REPLY</p>
          </div>
          <hr className="ed-rule" />

          <LinkRow ordinal="01" label="Help center"     sub="The FAQ, the field guide, the email link." onClick={() => navigate("/dashboard/help-center")} />
          <LinkRow ordinal="02" label="Contact support" sub="Write a letter. We reply within a day."   onClick={() => navigate("/dashboard/contact-support")} />
          <LinkRow ordinal="03" label="Upgrade to Pro"  sub="The full field guide. Cancel anytime."   onClick={() => navigate("/dashboard/ai-lab")} badge="NEW" />
        </section>

        {/* ━━━━━━━━━━━━━━ § 06 DANGER ━━━━━━━━━━━━━━ */}
        <section className="ns-set-section">
          <div className="ns-set-section-head">
            <div className="ed-chapter">
              <span className="num">§ 06</span>
              <span style={{ color: "#a3261c" }}>— END OF FILE</span>
            </div>
            <p className="ed-mono ns-set-section-sub">ACTIONS THAT CANNOT BE UNDONE</p>
          </div>
          <hr className="ed-rule" />

          <div className="ns-set-danger">
            <button onClick={() => setShowLogoutModal(true)} className="ns-set-danger-row">
              <span className="ord">01</span>
              <div className="body">
                <p className="title">Log out.</p>
                <p className="meta">SIGN OUT OF YOUR ACCOUNT ON THIS DEVICE</p>
              </div>
              <span className="aside">SIGN OUT →</span>
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="ns-set-danger-row is-danger">
              <span className="ord">02</span>
              <div className="body">
                <p className="title">Close the file. Forever.</p>
                <p className="meta">PERMANENTLY DELETES ALL DATA AND THE LOGIN ACCOUNT</p>
              </div>
              <span className="aside">DELETE →</span>
            </button>
          </div>
        </section>

        {/* App Version */}
        <div style={{ textAlign: "center", padding: "32px 0 0 0" }}>
          <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint, margin: 0 }}>
            NOTESTREAM · VOL. II · V1.0.0
          </p>
        </div>

        {/* ━━━━━━━━━━━━━━ MODALS ━━━━━━━━━━━━━━ */}
        <AnimatePresence>
          {showDeleteModal && (
            <ConfirmModal
              title="Close the file. Forever."
              description="This permanently deletes your notes, documents, settings, and your login account. The file cannot be reopened."
              confirmLabel={deleteLoading ? "Closing…" : "Close it forever"}
              confirmDisabled={deleteLoading}
              dangerous
              onConfirm={handleDeleteAccount}
              onCancel={() => { if (!deleteLoading) setShowDeleteModal(false); }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLogoutModal && (
            <ConfirmModal
              title="Log out?"
              description="You'll need to sign in again to read the archive."
              confirmLabel="Log out"
              onConfirm={async () => {
                try { if (isSupabaseConfigured && supabase) await supabase.auth.signOut(); } catch {}
                setShowLogoutModal(false); showToast("Logged out."); setTimeout(() => navigate("/"), 300);
              }}
              onCancel={() => setShowLogoutModal(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showExportModal && (
            <ConfirmModal
              title="Export the archive."
              description="A JSON file with every note, document, stat, and setting. Downloads to your device."
              confirmLabel="Download export"
              onConfirm={handleExportData}
              onCancel={() => setShowExportModal(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showPinModal && (
            <PinModal
              onSave={(pin) => { localStorage.setItem("ns-note-pin", pin); setPinEnabled(true); setShowPinModal(false); showToast("PIN lock enabled."); }}
              onCancel={() => setShowPinModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════ */

function Field({ label, hint, children }) {
  return (
    <div className="ns-set-field">
      <label className="ed-mono ns-set-field-label">{label.toUpperCase()}</label>
      {children}
      {hint && <p className="ed-serif ed-italic ns-set-field-hint">{hint}</p>}
    </div>
  );
}

function Toggle({ label, description, enabled, onChange }) {
  return (
    <div className="ns-set-toggle">
      <div className="body">
        <p className="title">{label}</p>
        {description && <p className="desc">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`ns-set-switch ${enabled ? "is-on" : ""}`}
        aria-pressed={enabled}
      >
        <span className="thumb" />
      </button>
    </div>
  );
}

function LinkRow({ ordinal = "01", label, sub, badge, onClick }) {
  return (
    <button onClick={onClick} className="ns-set-linkrow">
      <span className="ord">{ordinal}</span>
      <div className="body">
        <p className="title">
          {label}.
          {badge && <span className="ed-chip ed-chip-accent" style={{ marginLeft: 12 }}>{badge}</span>}
        </p>
        {sub && <p className="meta">{sub}</p>}
      </div>
      <span className="aside">OPEN →</span>
    </button>
  );
}

function DigestStat({ label, value }) {
  return (
    <div className="ns-set-digest-stat">
      <p className="ed-mono ns-set-digest-stat-l">{label.toUpperCase()}</p>
      <p className="ed-serif ed-italic ns-set-digest-stat-v">{value}</p>
    </div>
  );
}

function ConfirmModal({ title, description, confirmLabel, confirmDisabled, dangerous, onConfirm, onCancel }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="ns-set-modal-bg"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="ns-set-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint, margin: 0 }}>
          <span style={{ color: ED.accent, fontFamily: ED.serif, fontStyle: "italic", fontSize: 13, marginRight: 6 }}>§</span>
          {dangerous ? "FINAL CALL" : "CONFIRM"}
        </p>
        <h2 className="ed-serif" style={{ fontSize: 28, margin: "6px 0 12px", color: ED.ink, letterSpacing: "-0.01em", paddingBottom: "0.04em" }}>{title}</h2>
        <p className="ed-serif" style={{ fontSize: 16, lineHeight: 1.55, color: ED.inkMute, margin: 0 }}>{description}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button onClick={onCancel} disabled={confirmDisabled} className="ed-btn ed-btn-ghost">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={dangerous ? "ed-btn" : "ed-btn ed-btn-primary"}
            style={dangerous ? { background: "#a3261c", color: "#fff", borderColor: "#a3261c" } : undefined}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </>
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
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="ns-set-modal-bg"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="ns-set-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint, margin: 0 }}>
          <span style={{ color: ED.accent, fontFamily: ED.serif, fontStyle: "italic", fontSize: 13, marginRight: 6 }}>§</span>
          {step === 1 ? "CREATE PIN" : "CONFIRM PIN"}
        </p>
        <h2 className="ed-serif" style={{ fontSize: 28, margin: "6px 0 12px", color: ED.ink, letterSpacing: "-0.01em", paddingBottom: "0.04em" }}>
          {step === 1 ? "Choose four digits." : "Once more for safekeeping."}
        </h2>

        {error && (
          <p className="ed-serif ed-italic" style={{ background: "#fdecea", color: "#a3261c", border: "1px solid #f5c2bd", borderRadius: 8, padding: "10px 12px", fontSize: 14, margin: "0 0 14px 0" }}>{error}</p>
        )}

        <input
          type="password"
          maxLength={4}
          value={step === 1 ? pin : confirmPin}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            if (step === 1) setPin(val); else setConfirmPin(val);
            setError("");
          }}
          className="ns-set-input"
          style={{ textAlign: "center", letterSpacing: "0.5em", fontSize: 24, fontFamily: ED.mono, padding: "14px 16px" }}
          placeholder="••••"
          autoFocus
        />

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onCancel} className="ed-btn ed-btn-ghost">Cancel</button>
          <button onClick={step === 1 ? handleNext : handleConfirm} className="ed-btn ed-btn-primary">
            {step === 1 ? "Next" : "Save PIN"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   SCOPED STYLES
═══════════════════════════════════════════════════════ */
const SETTINGS_STYLES = `
  @keyframes ns-set-pulse { 50% { background: var(--ed-accent); } }

  .ns-ed .ns-set-toast {
    position: fixed; top: calc(env(safe-area-inset-top, 0px) + 80px);
    left: 50%; transform: translateX(-50%);
    z-index: 9999;
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 16px;
    background: var(--ed-paper-50);
    border: 1px solid var(--ed-accent);
    border-radius: 999px;
    font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--ed-ink);
    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  }

  /* sections */
  .ns-ed .ns-set-section { margin-top: 56px; }
  .ns-ed .ns-set-section-head {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 24px; flex-wrap: wrap; margin-bottom: 14px;
  }
  .ns-ed .ns-set-section-sub {
    font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--ed-ink-faint); margin: 0;
  }
  .ns-ed .ns-set-fieldset { padding: 24px 0 8px; display: grid; gap: 28px; }
  .ns-ed .ns-set-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }

  /* field */
  .ns-ed .ns-set-field { display: grid; gap: 8px; }
  .ns-ed .ns-set-field-label {
    font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--ed-ink-faint);
  }
  .ns-ed .ns-set-field-hint {
    font-size: 14px; line-height: 1.5; color: var(--ed-ink-mute); margin: 4px 0 0 0;
    max-width: 560px;
  }
  .ns-ed .ns-set-readout {
    background: var(--ed-paper-50);
    border: 1px solid var(--ed-rule);
    border-radius: 10px;
    padding: 12px 16px;
    font-family: var(--ed-serif); font-size: 16px;
    color: var(--ed-ink); margin: 0;
    display: flex; align-items: center;
  }
  .ns-ed .ns-set-input {
    width: 100%;
    background: var(--ed-paper-50);
    border: 1px solid var(--ed-rule);
    border-radius: 10px;
    padding: 12px 16px;
    font-family: var(--ed-serif); font-size: 16px;
    color: var(--ed-ink); outline: 0;
    transition: border-color .15s ease;
  }
  .ns-ed .ns-set-input:focus { border-color: var(--ed-ink); }
  .ns-ed .ns-set-input::placeholder { color: var(--ed-ink-faint); font-style: italic; }

  /* theme picker */
  .ns-ed .ns-set-theme-row {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
    max-width: 560px;
  }
  .ns-ed .ns-set-theme-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 12px 16px; border-radius: 10px;
    background: var(--ed-paper-50);
    border: 1px solid var(--ed-rule);
    color: var(--ed-ink-mute);
    font-family: var(--ed-sans); font-size: 14px; font-weight: 500;
    cursor: pointer; transition: all .15s ease;
  }
  .ns-ed .ns-set-theme-btn:hover { border-color: var(--ed-ink); color: var(--ed-ink); }
  .ns-ed .ns-set-theme-btn.is-on {
    background: var(--ed-ink); color: var(--ed-paper-50); border-color: var(--ed-ink);
  }

  /* toggles */
  .ns-ed .ns-set-toggles { padding: 16px 0 0; display: grid; gap: 4px; }
  .ns-ed .ns-set-toggle {
    display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: center;
    padding: 18px 0; border-bottom: 1px solid var(--ed-rule-soft);
  }
  .ns-ed .ns-set-toggle:last-child { border-bottom: 0; }
  .ns-ed .ns-set-toggle .body { min-width: 0; }
  .ns-ed .ns-set-toggle .title {
    font-family: var(--ed-serif); font-size: 18px;
    color: var(--ed-ink); margin: 0; line-height: 1.3;
  }
  .ns-ed .ns-set-toggle .desc {
    font-family: var(--ed-serif); font-size: 14.5px; line-height: 1.5;
    color: var(--ed-ink-mute); margin: 6px 0 0 0; max-width: 560px;
  }

  .ns-ed .ns-set-switch {
    position: relative; width: 44px; height: 24px; border-radius: 999px;
    background: var(--ed-paper-200); border: 1px solid var(--ed-rule);
    cursor: pointer; transition: all .15s ease; flex-shrink: 0; padding: 0;
  }
  .ns-ed .ns-set-switch:hover { border-color: var(--ed-ink); }
  .ns-ed .ns-set-switch.is-on { background: var(--ed-ink); border-color: var(--ed-ink); }
  .ns-ed .ns-set-switch .thumb {
    position: absolute; top: 2px; left: 2px;
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--ed-paper-50);
    transition: transform .2s cubic-bezier(.22,1,.36,1);
  }
  .ns-ed .ns-set-switch.is-on .thumb { transform: translateX(20px); }

  /* digest */
  .ns-ed .ns-set-digest {
    margin-top: 32px; padding-top: 24px;
    border-top: 1px solid var(--ed-rule-soft);
  }
  .ns-ed .ns-set-digest-head {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 16px; flex-wrap: wrap; margin-bottom: 18px;
  }
  .ns-ed .ns-set-refresh {
    font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--ed-ink-faint); background: transparent; border: 0;
    cursor: pointer;
  }
  .ns-ed .ns-set-refresh:hover { color: var(--ed-ink); }
  .ns-ed .ns-set-refresh:disabled { opacity: 0.4; cursor: wait; }

  .ns-ed .ns-set-digest-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  }
  .ns-ed .ns-set-digest-stat {
    padding: 14px 16px;
    background: var(--ed-paper-50);
    border: 1px solid var(--ed-rule);
    border-radius: 10px;
  }
  .ns-ed .ns-set-digest-stat-l {
    font-size: 10px; letter-spacing: 0.14em; color: var(--ed-ink-faint); margin: 0;
  }
  .ns-ed .ns-set-digest-stat-v {
    font-size: 32px; color: var(--ed-accent); margin: 4px 0 0 0; line-height: 1;
  }
  .ns-ed .ns-set-digest-foot {
    font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--ed-ink-faint); margin: 14px 0 0 0;
  }

  /* link rows */
  .ns-ed .ns-set-linkrow {
    display: grid; grid-template-columns: 44px 1fr minmax(0, 100px);
    gap: 18px; padding: 18px 8px; width: 100%; text-align: left;
    background: transparent; border: 0;
    border-bottom: 1px solid var(--ed-rule-soft);
    cursor: pointer; transition: background-color .12s, padding .12s;
    align-items: start;
  }
  .ns-ed .ns-set-linkrow:hover { background: var(--ed-paper-150); padding-left: 12px; }
  .ns-ed .ns-set-linkrow .ord {
    font-family: var(--ed-mono); font-size: 11px; letter-spacing: 0.14em;
    color: var(--ed-ink-faint); padding-top: 4px; transition: all .15s ease;
  }
  .ns-ed .ns-set-linkrow:hover .ord { color: var(--ed-accent); font-family: var(--ed-serif); font-style: italic; font-size: 17px; }
  .ns-ed .ns-set-linkrow .title {
    font-family: var(--ed-serif); font-size: 19px;
    color: var(--ed-ink); margin: 0; line-height: 1.3;
    display: flex; align-items: center; flex-wrap: wrap;
  }
  .ns-ed .ns-set-linkrow .meta {
    font-family: var(--ed-serif); font-size: 14.5px; line-height: 1.5;
    color: var(--ed-ink-mute); margin: 4px 0 0 0;
  }
  .ns-ed .ns-set-linkrow .aside {
    font-family: var(--ed-mono); font-size: 10.5px; letter-spacing: 0.14em;
    color: var(--ed-ink-faint); padding-top: 8px; text-align: right;
  }

  /* danger zone */
  .ns-ed .ns-set-danger { padding: 8px 0 0; display: grid; gap: 0; }
  .ns-ed .ns-set-danger-row {
    display: grid; grid-template-columns: 44px 1fr minmax(0, 100px);
    gap: 18px; padding: 18px 8px; width: 100%; text-align: left;
    background: transparent; border: 0;
    border-bottom: 1px solid var(--ed-rule-soft);
    cursor: pointer; transition: background-color .12s, padding .12s;
    align-items: start;
  }
  .ns-ed .ns-set-danger-row:hover { background: var(--ed-paper-150); padding-left: 12px; }
  .ns-ed .ns-set-danger-row.is-danger:hover { background: #fdecea; }
  .ns-ed .ns-set-danger-row .ord {
    font-family: var(--ed-mono); font-size: 11px; letter-spacing: 0.14em;
    color: var(--ed-ink-faint); padding-top: 4px; transition: all .15s ease;
  }
  .ns-ed .ns-set-danger-row:hover .ord { color: var(--ed-accent); font-family: var(--ed-serif); font-style: italic; font-size: 17px; }
  .ns-ed .ns-set-danger-row.is-danger:hover .ord { color: #a3261c; }
  .ns-ed .ns-set-danger-row .title {
    font-family: var(--ed-serif); font-size: 19px;
    color: var(--ed-ink); margin: 0; line-height: 1.3;
  }
  .ns-ed .ns-set-danger-row.is-danger .title { color: #a3261c; }
  .ns-ed .ns-set-danger-row .meta {
    font-family: var(--ed-mono); font-size: 10.5px; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--ed-ink-faint); margin: 6px 0 0 0;
  }
  .ns-ed .ns-set-danger-row .aside {
    font-family: var(--ed-mono); font-size: 10.5px; letter-spacing: 0.14em;
    color: var(--ed-ink-faint); padding-top: 8px; text-align: right;
  }
  .ns-ed .ns-set-danger-row.is-danger .aside { color: #a3261c; }

  /* modal */
  .ns-ed .ns-set-modal-bg {
    position: fixed; inset: 0; z-index: 9998;
    background: rgba(35, 28, 14, 0.4);
    backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  }
  .ns-ed .ns-set-modal {
    position: fixed; inset: 0; margin: auto;
    z-index: 9999; max-width: 440px; width: calc(100% - 2rem);
    max-height: calc(100dvh - 3rem); height: fit-content;
    background: var(--ed-paper-50);
    border: 1px solid var(--ed-rule); border-radius: 14px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.12);
    padding: 28px;
  }

  @media (max-width: 720px) {
    .ns-ed .ns-set-digest-grid { grid-template-columns: repeat(2, 1fr); }
    .ns-ed .ns-set-theme-row { grid-template-columns: 1fr; }
    .ns-ed .ns-set-toggle { grid-template-columns: 1fr; }
    .ns-ed .ns-set-toggle .ns-set-switch { justify-self: start; }
    .ns-ed .ns-set-linkrow,
    .ns-ed .ns-set-danger-row { grid-template-columns: 32px 1fr; }
    .ns-ed .ns-set-linkrow .aside,
    .ns-ed .ns-set-danger-row .aside { display: none; }
  }
`;