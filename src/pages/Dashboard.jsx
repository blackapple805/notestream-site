// src/pages/Dashboard.jsx
// ═══════════════════════════════════════════════════════════════════
// REDESIGNED: Bold bento-grid dashboard with orbital accents,
// mesh-gradient hero, and cinematic card reveals.
// All Supabase / DB logic is UNCHANGED — only the UI shell changed.
// ═══════════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo, cloneElement } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiFileText,
  FiZap,
  FiCpu,
  FiSettings,
  FiChevronRight,
  FiPlus,
  FiClock,
  FiFolder,
  FiX,
  FiArrowUpRight,
  FiTrendingUp,
} from "react-icons/fi";
import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import {
  House,
  Brain,
  Sparkle,
  Note,
  Bell,
  Activity,
  Plugs,
  BezierCurve,
  Lightning,
  FileText,
  ChartLineUp,
  Star,
  Target,
  Fire,
  Calendar,
  Warning,
  CheckSquare,
  Phone,
  Flag,
} from "phosphor-react";
import { useWorkspaceSettings } from "../hooks/useWorkspaceSettings";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

/* ─── DB constants (unchanged) ─── */
const TAG_RESEARCH_BRIEF = "ai:research_brief";
const USER_STATS_TABLE = "user_engagement_stats";
const NOTES_TABLE = "notes";
const DOCS_TABLE = "documents";

const EMPTY_STATS = {
  user_id: null,
  display_name: null,
  notes_created: 0,
  ai_uses: 0,
  active_days: 0,
  streak_days: 0,
  last_active_date: null,
  created_at: null,
  updated_at: null,
};

const supabaseReady =
  typeof isSupabaseConfigured === "function"
    ? isSupabaseConfigured()
    : !!isSupabaseConfigured;

/* ─── Utility helpers (unchanged) ─── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const toLocalYMD = (d = new Date()) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const parseYMDToDate = (ymd) => {
  const [y, m, d] = String(ymd).split("-").map((n) => Number(n));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const diffDaysLocal = (aYmd, bYmd) => {
  const a = parseYMDToDate(aYmd);
  const b = parseYMDToDate(bYmd);
  if (!a || !b) return null;
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
};

const ensureUserStatsRow = async (userId, fallbackName = null) => {
  if (!supabase || !userId) return;
  const today = toLocalYMD();
  const payload = {
    user_id: userId,
    ...(fallbackName ? { display_name: fallbackName } : {}),
    notes_created: 0,
    ai_uses: 0,
    active_days: 1,
    streak_days: 1,
    last_active_date: today,
  };
  const { error } = await supabase
    .from(USER_STATS_TABLE)
    .upsert(payload, { onConflict: "user_id", ignoreDuplicates: true });
  if (error) console.warn("ensureUserStatsRow failed:", error);
};

const formatShortDate = (d) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
};

const getLast7DaysRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  return { start, end };
};

const safeLocalDateTime = (iso) => {
  try {
    return iso ? new Date(iso).toLocaleString() : "";
  } catch {
    return "";
  }
};

const computeTopTags = (notes, limit = 5) => {
  const counts = new Map();
  for (const n of notes || []) {
    const tags = Array.isArray(n?.tags) ? n.tags : [];
    for (const t of tags) {
      const tag = String(t || "").trim();
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
};

const computeHighlights = (notes, limit = 5) =>
  (notes || [])
    .filter((n) => n?.is_highlight || n?.is_favorite)
    .sort((a, b) => {
      const au = a?.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bu = b?.updated_at ? new Date(b.updated_at).getTime() : 0;
      return bu - au;
    })
    .slice(0, limit)
    .map((n) => ({ id: n.id, title: n.title || "Untitled note" }));

const useBodyScrollLock = (locked) => {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
};

const safeCloneIcon = (el, inject = {}) => {
  if (!el || typeof el !== "object" || !("props" in el)) return el;
  const nextProps = { ...inject };
  if (!("weight" in el.props) && "weight" in nextProps) delete nextProps.weight;
  return cloneElement(el, nextProps);
};

/* ═══════════════════════════════════════════════════════
   INLINE STYLES — injected once via <style> tag
   Scoped with .ns-dash prefix to avoid leaking
═══════════════════════════════════════════════════════ */
const DASH_STYLES = `
/* ── keyframes ── */
@keyframes ns-orbit {
  0%   { transform: rotate(0deg) translateX(120px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
}
@keyframes ns-pulse-ring {
  0%   { transform: scale(1); opacity: .45; }
  50%  { transform: scale(1.15); opacity: .18; }
  100% { transform: scale(1); opacity: .45; }
}
@keyframes ns-gradient-shift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes ns-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
@keyframes ns-shimmer-slide {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes ns-fade-in-up {
  0%   { opacity: 0; transform: translateY(16px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes ns-glow-pulse {
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
}

/* ── hero mesh gradient ── */
.ns-hero-mesh {
  background: 
    radial-gradient(ellipse 80% 60% at 20% 30%, rgba(99,102,241,0.18), transparent),
    radial-gradient(ellipse 60% 50% at 80% 20%, rgba(168,85,247,0.14), transparent),
    radial-gradient(ellipse 70% 40% at 50% 80%, rgba(6,182,212,0.10), transparent);
  background-size: 200% 200%;
  animation: ns-gradient-shift 12s ease infinite;
}

/* ── bento card base ── */
.ns-bento {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: var(--card-glass-bg, var(--bg-surface));
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--card-glass-border, var(--border-secondary));
  box-shadow: var(--card-glass-shadow, 0 8px 32px rgba(0,0,0,0.12));
  transition: transform 0.28s cubic-bezier(.22,1,.36,1), box-shadow 0.28s ease;
}
.ns-bento:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-glass-shadow, 0 12px 40px rgba(0,0,0,0.18));
}

/* ── bento card inner sheen ── */
.ns-bento::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%),
    radial-gradient(900px 300px at 25% 0%, rgba(255,255,255,0.04), transparent 55%);
  pointer-events: none;
  z-index: 1;
}
.ns-bento::after {
  content: '';
  position: absolute;
  inset: 6px;
  top: 0;
  height: 1px;
  left: 24px;
  right: 24px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  pointer-events: none;
  z-index: 2;
}

/* ── stat number emphasis ── */
.ns-stat-value {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
}

/* ── action card glow ring ── */
.ns-action-glow {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 0;
}
.ns-bento:hover .ns-action-glow { opacity: 1; }

/* ── floating dot accents ── */
.ns-dot {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  animation: ns-float 4s ease-in-out infinite;
}

/* ── new note CTA shimmer ── */
.ns-cta-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%);
  animation: ns-shimmer-slide 3s ease-in-out infinite;
  pointer-events: none;
}

/* ── notification badge pulse ── */
.ns-notif-badge::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: rgba(244,63,94,0.4);
  animation: ns-pulse-ring 2s ease-in-out infinite;
  z-index: -1;
}

/* ── staggered fade-in for children ── */
.ns-stagger > * {
  animation: ns-fade-in-up 0.5s cubic-bezier(.22,1,.36,1) both;
}
.ns-stagger > *:nth-child(1) { animation-delay: 0.04s; }
.ns-stagger > *:nth-child(2) { animation-delay: 0.09s; }
.ns-stagger > *:nth-child(3) { animation-delay: 0.14s; }
.ns-stagger > *:nth-child(4) { animation-delay: 0.19s; }
.ns-stagger > *:nth-child(5) { animation-delay: 0.24s; }
.ns-stagger > *:nth-child(6) { animation-delay: 0.29s; }

/* ── scrollbar for modals ── */
.ns-scroll::-webkit-scrollbar { width: 4px; }
.ns-scroll::-webkit-scrollbar-track { background: transparent; }
.ns-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

/* ── mini progress bar ── */
.ns-progress-track {
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.06);
  overflow: hidden;
}
.ns-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s cubic-bezier(.22,1,.36,1);
}
`;

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
═══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate();
  const {
    settings,
    notifications,
    parseNotificationsFromNotes,
    dismissNotification,
    clearAllNotifications,
  } = useWorkspaceSettings();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showDigest, setShowDigest] = useState(false);
  const [digest, setDigest] = useState(null);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [statsLoading, setStatsLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [docs, setDocs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [aiUses, setAiUses] = useState(0);
  const [aiUsesLoading, setAiUsesLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  useBodyScrollLock(showNotifications || (showDigest && !!digest));

  const notesCreated = Number(stats?.notes_created ?? 0);
  const activeDays = Number(stats?.active_days ?? 0);
  const streakDays = Number(stats?.streak_days ?? 0);

  const displayName = useMemo(() => {
    const raw = (stats?.display_name || "").trim();
    if (!raw) return "";
    return raw.split(" ")[0];
  }, [stats?.display_name]);

  const docsUploaded = docs.length;
  const favoritedNotes = useMemo(
    () => (notes || []).filter((n) => n?.is_favorite || n?.is_highlight).length,
    [notes]
  );
  const productivity = useMemo(
    () => (activeDays >= 5 ? "High" : activeDays >= 3 ? "Medium" : "Low"),
    [activeDays]
  );

  /* ── ALL DATA-FETCHING useEffects (UNCHANGED) ── */

  // STATS
  useEffect(() => {
    if (!supabaseReady || !supabase) { setStatsLoading(false); return; }
    let alive = true;
    (async () => {
      setStatsLoading(true);
      const { data: sessRes, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) console.error("getSession error:", sessErr);
      const user = sessRes?.session?.user;
      if (!user?.id) { if (alive) { setStatsLoading(false); navigate("/login"); } return; }
      const fallbackName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? (user.email ? user.email.split("@")[0] : null);
      await ensureUserStatsRow(user.id, fallbackName);
      const { data: rowMaybe, error: fetchErr } = await supabase.from(USER_STATS_TABLE).select("*").eq("user_id", user.id).maybeSingle();
      if (fetchErr) { console.error("Stats fetch error:", fetchErr); if (alive) setStatsLoading(false); return; }
      if (!rowMaybe) { if (alive) { setStats(EMPTY_STATS); setStatsLoading(false); } return; }
      const base = { ...EMPTY_STATS, ...rowMaybe, notes_created: Number(rowMaybe?.notes_created ?? 0), ai_uses: Number(rowMaybe?.ai_uses ?? 0), active_days: Number(rowMaybe?.active_days ?? 0), streak_days: Number(rowMaybe?.streak_days ?? 0) };
      const today = toLocalYMD();
      if (base.last_active_date !== today) {
        const diff = base.last_active_date ? diffDaysLocal(base.last_active_date, today) : null;
        const nextActiveDays = (base.active_days || 0) + 1;
        const nextStreak = diff === 1 ? (base.streak_days || 0) + 1 : 1;
        const { data: updatedRow, error: upErr } = await supabase.from(USER_STATS_TABLE).update({ active_days: nextActiveDays, streak_days: nextStreak, last_active_date: today, ...(base.display_name ? {} : { display_name: fallbackName ?? null }) }).eq("user_id", user.id).select("*").single();
        if (upErr) console.error("Stats update error:", upErr);
        else Object.assign(base, updatedRow, { active_days: Number(updatedRow?.active_days ?? nextActiveDays), streak_days: Number(updatedRow?.streak_days ?? nextStreak) });
      }
      if (!alive) return;
      setStats(base);
      setStatsLoading(false);
    })();
    return () => { alive = false; };
  }, [navigate, supabaseReady]);

  // AI USES
  useEffect(() => {
    if (!supabaseReady || !supabase) return;
    let alive = true;
    const fetchTodayUsage = async () => {
      setAiUsesLoading(true);
      const { data: sessRes } = await supabase.auth.getSession();
      const user = sessRes?.session?.user;
      if (!user?.id) { setAiUsesLoading(false); return; }
      const today = toLocalYMD();
      const { data, error } = await supabase.from("daily_usage").select("ai_summaries,document_synth,insight_queries,voice_transcriptions").eq("user_id", user.id).eq("usage_date", today).maybeSingle();
      if (!alive) return;
      if (error || !data) { setAiUses(0); setAiUsesLoading(false); return; }
      const total = Number(data.ai_summaries || 0) + Number(data.document_synth || 0) + Number(data.insight_queries || 0) + Number(data.voice_transcriptions || 0);
      setAiUses(total);
      setAiUsesLoading(false);
    };
    fetchTodayUsage();
    const onUsageChanged = () => fetchTodayUsage();
    window.addEventListener("notestream:daily_usage_changed", onUsageChanged);
    return () => { alive = false; window.removeEventListener("notestream:daily_usage_changed", onUsageChanged); };
  }, [supabaseReady]);

  // NOTES + DOCS
  useEffect(() => {
    if (!supabaseReady || !supabase) { setNotes([]); setDocs([]); setDataLoading(false); return; }
    let alive = true;
    (async () => {
      setDataLoading(true);
      const { data: sessRes } = await supabase.auth.getSession();
      const user = sessRes?.session?.user;
      if (!user?.id) { if (alive) { setDataLoading(false); navigate("/login"); } return; }
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const sinceIso = since.toISOString();
      const [notesRes, docsRes] = await Promise.all([
        supabase.from(NOTES_TABLE).select("id,title,body,tags,is_favorite,is_highlight,ai_payload,ai_generated_at,created_at,updated_at").eq("user_id", user.id).gte("updated_at", sinceIso).order("updated_at", { ascending: false }),
        supabase.from(DOCS_TABLE).select("id,user_id,name,type,status,created_at,updated_at").eq("user_id", user.id).gte("updated_at", sinceIso).order("updated_at", { ascending: false }),
      ]);
      if (!alive) return;
      setNotes(!notesRes?.error ? notesRes.data || [] : []);
      setDocs(!docsRes?.error ? docsRes.data || [] : []);
      setDataLoading(false);
    })();
    return () => { alive = false; };
  }, [navigate, supabaseReady]);

  // SMART NOTIFICATIONS
  useEffect(() => {
    if (!settings.smartNotifications) return;
    const notesForNotif = (notes || []).map((n) => ({
      id: n.id, title: n.title, body: n.body, updated: n.updated_at,
      favorite: !!n.is_favorite, tag: Array.isArray(n.tags) && n.tags.length ? n.tags[0] : "",
    }));
    parseNotificationsFromNotes(notesForNotif);
  }, [settings.smartNotifications, parseNotificationsFromNotes, notes]);

  // WEEKLY DIGEST
  useEffect(() => {
    if (!settings.weeklyDigest) { setDigest(null); return; }
    const { start, end } = getLast7DaysRange();
    const topTags = computeTopTags(notes, 6);
    const highlights = computeHighlights(notes, 6);
    const synthesizedDocs7d = (docs || []).filter((d) => (d?.status || "") === "synthesized").length;
    const synthesizedBriefs7d = (notes || []).filter((n) => { const tags = Array.isArray(n?.tags) ? n.tags : []; return tags.includes(TAG_RESEARCH_BRIEF); }).length;
    setDigest({
      period: { start: formatShortDate(start), end: formatShortDate(end) },
      stats: { notesCreated, docsUploaded, favoritedNotes, synthesizedDocs: synthesizedDocs7d, totalItems: Number(notes.length) + Number(docs.length) },
      insights: { mostActiveDay: stats?.last_active_date || "—", productivity, topTags },
      highlights,
    });
  }, [settings.weeklyDigest, notes, docs, notesCreated, docsUploaded, favoritedNotes, productivity, stats?.last_active_date]);

  /* ── derived display data ── */
  const recentNotes = useMemo(() =>
    (notes || []).slice(0, 4).map((n) => ({
      id: n.id,
      title: n.title || "Untitled note",
      updated: safeLocalDateTime(n.updated_at),
      hasAI: !!n.ai_generated_at || !!n.ai_payload?.summary,
    })), [notes]);

  const recentDocs = useMemo(() => (docs || []).slice(0, 3), [docs]);

  const isDashboardLoading = statsLoading || dataLoading;

  /* ── LOADING STATE ── */
  if (isDashboardLoading) {
    return (
      <>
        <style>{DASH_STYLES}</style>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="relative h-14 w-14">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: "2.5px solid transparent",
                borderTopColor: "rgba(99,102,241,0.8)",
                borderRightColor: "rgba(168,85,247,0.4)",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <div
              className="absolute inset-2 rounded-full"
              style={{
                border: "2px solid transparent",
                borderBottomColor: "rgba(6,182,212,0.6)",
                animation: "spin 1.2s linear infinite reverse",
              }}
            />
            <Lightning
              size={20}
              weight="fill"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400"
            />
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loading your workspace…
          </p>
        </div>
      </>
    );
  }

  const streakPercent = Math.min((streakDays / 30) * 100, 100);
  const notifCount = notifications?.length || 0;

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <>
      <style>{DASH_STYLES}</style>

      <div className="w-full pb-[calc(var(--mobile-nav-height)+32px)]">

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            HERO SECTION — mesh gradient with orbital accents
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative ns-hero-mesh rounded-3xl overflow-hidden mb-6 mt-1"
          style={{
            border: "1px solid var(--card-glass-border, var(--border-secondary))",
          }}
        >
          {/* orbital dot accents */}
          {!shouldReduceMotion && (
            <>
              <div className="ns-dot" style={{ width: 6, height: 6, background: "rgba(99,102,241,0.5)", top: "20%", left: "10%", animationDelay: "0s" }} />
              <div className="ns-dot" style={{ width: 4, height: 4, background: "rgba(168,85,247,0.4)", top: "60%", right: "15%", animationDelay: "1.5s" }} />
              <div className="ns-dot" style={{ width: 5, height: 5, background: "rgba(6,182,212,0.4)", bottom: "25%", left: "40%", animationDelay: "0.8s" }} />
            </>
          )}

          <div className="relative z-10 px-5 py-6 sm:px-7 sm:py-8">
            {/* top row: greeting + notification */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-1.5" style={{ color: "var(--text-muted)" }}>
                  {getGreeting()}
                </p>
                <h1
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {displayName ? `${displayName}'s` : "Your"}{" "}
                  <span
                    style={{
                      background: "linear-gradient(135deg, #818cf8, #a78bfa, #22d3ee)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Workspace
                  </span>
                </h1>
              </motion.div>

              {/* notification bell */}
              {settings.smartNotifications && notifCount > 0 && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.3 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setShowNotifications(true)}
                  className="relative flex-shrink-0 h-11 w-11 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    backdropFilter: "blur(12px)",
                  }}
                  aria-label="Open notifications"
                >
                  <Bell size={20} weight="duotone" className="text-amber-400" />
                  <span
                    className="ns-notif-badge absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center"
                  >
                    {notifCount}
                  </span>
                </motion.button>
              )}
            </div>

            {/* streak + stat pills */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-wrap items-center gap-2"
            >
              <StatPill icon={<Fire size={13} weight="fill" />} color="#f59e0b" label={`${streakDays}d streak`} />
              <StatPill icon={<Note size={13} weight="duotone" />} color="#818cf8" label={`${notesCreated} notes`} />
              <StatPill icon={<Lightning size={13} weight="fill" />} color="#22d3ee" label={`${aiUses} AI today`} />
            </motion.div>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            BENTO GRID — stats + CTA + quick actions
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 ns-stagger">
          <BentoStat
            icon={<Note size={22} weight="duotone" />}
            value={notesCreated}
            label="Total Notes"
            accent="#818cf8"
          />
          <BentoStat
            icon={<Fire size={22} weight="fill" />}
            value={activeDays}
            label="Active Days"
            accent="#f59e0b"
          />
          <BentoStat
            icon={<Lightning size={22} weight="fill" />}
            value={aiUses}
            label="AI Used Today"
            accent="#22d3ee"
          />
          <BentoStat
            icon={<Star size={22} weight="fill" />}
            value={favoritedNotes}
            label="Favorites"
            accent="#f43f5e"
          />
        </div>

        {/* ── New Note CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.988 }}
            onClick={() => navigate("/dashboard/notes")}
            className="ns-cta-shimmer relative w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-sm overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1), rgba(6,182,212,0.08))",
              border: "1px solid rgba(99,102,241,0.25)",
              color: "var(--text-primary)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}
            >
              <FiPlus size={16} className="text-indigo-400" />
            </div>
            <span>New Note / Upload</span>
            <FiArrowUpRight size={16} style={{ color: "var(--text-muted)" }} />
          </motion.button>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            WEEKLY DIGEST (if enabled)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <AnimatePresence>
          {settings.weeklyDigest && digest && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <div className="ns-bento p-5">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <GlowIcon icon={<ChartLineUp size={18} weight="duotone" />} color="#a78bfa" />
                      <div>
                        <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Weekly Digest</h3>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{digest.period.start} – {digest.period.end}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDigest(true)}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-xl transition"
                      style={{
                        color: "#a78bfa",
                        background: "rgba(168,85,247,0.08)",
                        border: "1px solid rgba(168,85,247,0.18)",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(168,85,247,0.15)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(168,85,247,0.08)"; }}
                    >
                      Full report →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <MiniStat value={notes.length} label="Notes" accent="#818cf8" />
                    <MiniStat value={docs.length} label="Docs" accent="#a78bfa" />
                    <MiniStat value={digest.stats.synthesizedDocs} label="Synthesized" accent="#10b981" />
                    <MiniStat value={digest.insights.productivity} label="Activity" accent="#22d3ee" isText />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            QUICK ACCESS — 2×2 action grid
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-6"
        >
          <SectionLabel>Quick Access</SectionLabel>
          <div className="grid grid-cols-2 gap-3 ns-stagger">
            <ActionCard
              icon={<Activity size={24} weight="duotone" />}
              label="Activity"
              desc="Your history"
              accent="#06b6d4"
              onClick={() => navigate("/dashboard/activity")}
            />
            <ActionCard
              icon={<Plugs size={24} weight="duotone" />}
              label="Integrations"
              desc="Connect apps"
              accent="#a78bfa"
              onClick={() => navigate("/dashboard/integrations")}
            />
            <ActionCard
              icon={<BezierCurve size={24} weight="duotone" />}
              label="AI Lab"
              desc="Advanced tools"
              accent="#f59e0b"
              pro
              onClick={() => navigate("/dashboard/ai-lab")}
            />
            <ActionCard
              icon={<Note size={24} weight="duotone" />}
              label="New Note"
              desc="Start writing"
              accent="#10b981"
              onClick={() => navigate("/dashboard/notes")}
            />
          </div>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            RECENT NOTES
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-6"
        >
          <div className="ns-bento">
            <div className="relative z-10 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <GlowIcon icon={<FiClock size={16} />} color="#818cf8" />
                  <h3 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>Recent Notes</h3>
                </div>
                <button
                  onClick={() => navigate("/dashboard/notes")}
                  className="text-[11px] font-semibold transition"
                  style={{ color: "#818cf8" }}
                >
                  View all →
                </button>
              </div>

              <div className="space-y-2 ns-stagger">
                {recentNotes.map((note) => (
                  <NoteRow key={note.id} note={note} onClick={() => navigate(`/dashboard/notes/${note.id}`)} />
                ))}
                {!dataLoading && recentNotes.length === 0 && (
                  <EmptyState message="No notes in the last 7 days" />
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            DOCS + AI TOOLS — side by side on xl
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="grid grid-cols-1 xl:grid-cols-2 gap-4"
        >
          {/* Documents */}
          <div className="ns-bento">
            <div className="relative z-10 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <GlowIcon icon={<FiFolder size={16} />} color="#a78bfa" />
                  <h3 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>Recent Documents</h3>
                </div>
                <button
                  onClick={() => navigate("/dashboard/documents")}
                  className="text-[11px] font-semibold transition"
                  style={{ color: "#a78bfa" }}
                >
                  View all →
                </button>
              </div>

              <div className="space-y-2 ns-stagger">
                {recentDocs.map((doc) => (
                  <DocRow key={doc.id} doc={doc} onClick={() => navigate(`/dashboard/documents/${doc.id}`)} />
                ))}
                {!dataLoading && recentDocs.length === 0 && (
                  <EmptyState message="No documents in the last 7 days" />
                )}
              </div>
            </div>
          </div>

          {/* AI Tools */}
          <div className="ns-bento">
            <div className="relative z-10 p-5">
              <div className="flex items-center gap-3 mb-4">
                <GlowIcon icon={<Sparkle size={16} weight="fill" />} color="#f59e0b" />
                <h3 className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>AI Tools</h3>
              </div>

              <div className="space-y-2 ns-stagger">
                <ToolRow icon={<FiZap />} label="Generate Summary" desc="AI-powered note summaries" accent="#818cf8" onClick={() => navigate("/dashboard/summaries")} />
                <ToolRow icon={<FiCpu />} label="Ask AI Assistant" desc="Chat with your workspace" accent="#a78bfa" onClick={() => navigate("/dashboard/summaries")} />
                <ToolRow icon={<Brain size={18} weight="duotone" />} label="Research Synthesizer" desc="Merge documents into briefs" accent="#ec4899" onClick={() => navigate("/dashboard/documents")} />
                <ToolRow icon={<FiSettings />} label="Settings" desc="Configure workspace" accent="#10b981" onClick={() => navigate("/dashboard/settings")} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MODALS (Notifications + Digest)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

        {/* NOTIFICATIONS MODAL */}
        <AnimatePresence>
          {showNotifications && (
            <ModalOverlay onClose={() => setShowNotifications(false)}>
              <ModalCard onClose={() => setShowNotifications(false)} width="max-w-md">
                <ModalHeader
                  icon={<Bell size={18} weight="duotone" className="text-amber-400" />}
                  iconBg="rgba(245,158,11,0.15)"
                  iconBorder="rgba(245,158,11,0.3)"
                  title="Smart Notifications"
                  subtitle={`${notifications.length} total`}
                  onClose={() => setShowNotifications(false)}
                />

                <div className="p-4 overflow-y-auto max-h-[55vh] space-y-2 ns-scroll">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell size={36} weight="duotone" className="mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>All caught up</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <NotifItem key={notif.id} notif={notif} onDismiss={() => dismissNotification(notif.id)} />
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-4 border-t" style={{ borderColor: "var(--border-secondary)" }}>
                    <button
                      onClick={() => { clearAllNotifications(); setShowNotifications(false); }}
                      className="w-full py-3 rounded-xl text-sm font-medium transition"
                      style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </ModalCard>
            </ModalOverlay>
          )}
        </AnimatePresence>

        {/* WEEKLY DIGEST MODAL */}
        <AnimatePresence>
          {showDigest && !!digest && (
            <ModalOverlay onClose={() => setShowDigest(false)}>
              <ModalCard onClose={() => setShowDigest(false)} width="max-w-lg">
                <ModalHeader
                  icon={<ChartLineUp size={20} weight="duotone" className="text-purple-400" />}
                  iconBg="rgba(139,92,246,0.15)"
                  iconBorder="rgba(139,92,246,0.3)"
                  title="Weekly Digest"
                  subtitle={`${digest?.period?.start} – ${digest?.period?.end}`}
                  onClose={() => setShowDigest(false)}
                />

                <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto ns-scroll">
                  <div className="grid grid-cols-2 gap-3">
                    <DigestCard icon={<Note size={20} weight="duotone" />} value={notes.length} label="Notes (7d)" accent="#818cf8" />
                    <DigestCard icon={<FileText size={20} weight="duotone" />} value={docs.length} label="Docs (7d)" accent="#a78bfa" />
                    <DigestCard icon={<Star size={20} weight="fill" />} value={favoritedNotes} label="Favorites" accent="#f43f5e" />
                    <DigestCard icon={<Brain size={20} weight="duotone" />} value={digest?.stats?.synthesizedDocs || 0} label="Synthesized" accent="#10b981" />
                  </div>

                  {/* Insights */}
                  <div className="rounded-2xl p-4 border" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}>
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                      <Target size={15} weight="duotone" className="text-purple-400" /> Insights
                    </h3>
                    <div className="space-y-2.5">
                      <InsightLine label="Most Active Day" value={digest?.insights?.mostActiveDay || "—"} />
                      <InsightLine label="Productivity" value={digest?.insights?.productivity || "—"} valueColor={
                        digest?.insights?.productivity === "High" ? "#10b981" : digest?.insights?.productivity === "Medium" ? "#f59e0b" : undefined
                      } />
                      <InsightLine label="Total Items" value={digest?.stats?.totalItems || 0} />
                      {/* streak mini-bar */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span style={{ color: "var(--text-muted)" }}>Streak Progress</span>
                          <span style={{ color: "#f59e0b" }}>{streakDays}/30</span>
                        </div>
                        <div className="ns-progress-track">
                          <div className="ns-progress-fill" style={{ width: `${streakPercent}%`, background: "linear-gradient(90deg, #f59e0b, #f97316)" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Tags */}
                  {!!digest?.insights?.topTags?.length && (
                    <div className="rounded-2xl p-4 border" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}>
                      <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Top Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {digest.insights.topTags.map((t, i) => (
                          <span key={`${t.tag}-${i}`} className="text-[11px] px-3 py-1.5 rounded-xl font-medium" style={{
                            background: "rgba(99,102,241,0.08)",
                            border: "1px solid rgba(99,102,241,0.18)",
                            color: "var(--text-secondary)",
                          }}>
                            {t.tag} <span style={{ color: "var(--text-muted)" }}>({t.count})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Highlights */}
                  {!!digest?.highlights?.length && (
                    <div className="rounded-2xl p-4 border" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}>
                      <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <Star size={15} weight="fill" className="text-amber-400" /> Highlights
                      </h3>
                      <div className="space-y-1.5">
                        {digest.highlights.map((h) => (
                          <div key={h.id} className="flex items-center gap-2 text-sm min-w-0" style={{ color: "var(--text-secondary)" }}>
                            <span style={{ color: "#f59e0b" }}>•</span>
                            <span className="truncate">{h.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 border-t" style={{ borderColor: "var(--border-secondary)" }}>
                  <button
                    onClick={() => setShowDigest(false)}
                    className="w-full py-3 rounded-xl font-medium transition border"
                    style={{ borderColor: "var(--border-secondary)", color: "var(--text-secondary)", backgroundColor: "var(--bg-tertiary)" }}
                  >
                    Close
                  </button>
                </div>
              </ModalCard>
            </ModalOverlay>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}


/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════ */

/* ── Stat pill (hero area) ── */
const StatPill = ({ icon, color, label }) => (
  <span
    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
    style={{
      background: `${color}12`,
      border: `1px solid ${color}28`,
      color,
      backdropFilter: "blur(8px)",
    }}
  >
    {icon}
    {label}
  </span>
);

/* ── Section label ── */
const SectionLabel = ({ children }) => (
  <p
    className="text-[11px] font-bold uppercase tracking-[0.14em] mb-3 px-0.5"
    style={{ color: "var(--text-muted)" }}
  >
    {children}
  </p>
);

/* ── Glow Icon (used in card headers) ── */
const GlowIcon = ({ icon, color }) => (
  <div
    className="h-9 w-9 rounded-xl flex items-center justify-center"
    style={{
      background: `${color}18`,
      border: `1px solid ${color}30`,
      color,
      boxShadow: `0 0 12px ${color}15`,
    }}
  >
    {icon}
  </div>
);

/* ── Bento Stat Card ── */
const BentoStat = ({ icon, value, label, accent }) => (
  <div className="ns-bento">
    <div className="relative z-10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}15`, color: accent }}
        >
          {safeCloneIcon(icon, { size: 16 })}
        </div>
      </div>
      <p
        className="ns-stat-value text-[28px] leading-none font-extrabold mb-0.5"
        style={{ color: "var(--text-primary)" }}
      >
        {typeof value === "number" ? value : Number(value ?? 0) || 0}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
    </div>
  </div>
);

/* ── Mini Stat (digest inline) ── */
const MiniStat = ({ value, label, accent, isText = false }) => (
  <div
    className="rounded-xl px-3 py-2.5 text-center"
    style={{ background: `${accent}08`, border: `1px solid ${accent}18` }}
  >
    <p className={`${isText ? "text-sm" : "text-lg"} font-bold ns-stat-value`} style={{ color: accent }}>{value}</p>
    <p className="text-[9px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
  </div>
);

/* ── Action Card (Quick Access) ── */
const ActionCard = ({ icon, label, desc, accent, onClick, pro = false }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="ns-bento text-left"
  >
    {/* glow ring on hover */}
    <div className="ns-action-glow" style={{ background: `${accent}08`, border: `1px solid ${accent}20` }} />

    <div className="relative z-10 p-4">
      {pro && (
        <span
          className="absolute top-3 right-3 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wide"
          style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24" }}
        >
          Pro
        </span>
      )}

      <div
        className="h-11 w-11 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${accent}12`, border: `1px solid ${accent}22`, color: accent }}
      >
        {safeCloneIcon(icon, { size: 20 })}
      </div>

      <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>{label}</p>
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{desc}</p>
    </div>
  </motion.button>
);

/* ── Note Row ── */
const NoteRow = ({ note, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.008 }}
    whileTap={{ scale: 0.995 }}
    onClick={onClick}
    className="group w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between gap-3 transition-all"
    style={{
      background: "var(--bg-tertiary)",
      border: "1px solid var(--border-secondary)",
    }}
  >
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
      >
        <FiFileText size={16} className="text-indigo-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug" style={{
          display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden",
          color: "var(--text-secondary)",
        }}>{note.title}</p>
        <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{note.updated}</p>
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {note.hasAI && <StatusChip>AI</StatusChip>}
      <FiChevronRight size={15} style={{ color: "var(--text-muted)" }} className="group-hover:text-indigo-400 transition" />
    </div>
  </motion.button>
);

/* ── Doc Row ── */
const DocRow = ({ doc, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.008 }}
    whileTap={{ scale: 0.995 }}
    onClick={onClick}
    className="group w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between gap-3 transition-all"
    style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)" }}
  >
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
        <FiFileText size={16} className="text-purple-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-secondary)" }}>{doc.name}</p>
        <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{doc.status || "—"}</p>
      </div>
    </div>
    <span className="shrink-0 text-[9px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wide" style={{
      background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-muted)",
    }}>
      {String(doc.type || "FILE").toUpperCase()}
    </span>
  </motion.button>
);

/* ── Tool Row ── */
const ToolRow = ({ icon, label, desc, accent, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.008 }}
    whileTap={{ scale: 0.995 }}
    onClick={onClick}
    className="group w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all"
    style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)" }}
  >
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}12`, border: `1px solid ${accent}22`, color: accent }}>
        {icon}
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</p>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{desc}</p>
      </div>
    </div>
    <FiChevronRight size={15} style={{ color: "var(--text-muted)" }} className="group-hover:text-indigo-400 transition" />
  </motion.button>
);

/* ── Status Chip ── */
const StatusChip = ({ children }) => (
  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wide" style={{
    background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981",
  }}>
    {children}
  </span>
);

/* ── Empty State ── */
const EmptyState = ({ message }) => (
  <div className="text-center py-8">
    <div className="h-10 w-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: "rgba(99,102,241,0.08)" }}>
      <Note size={18} weight="duotone" style={{ color: "var(--text-muted)", opacity: 0.5 }} />
    </div>
    <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{message}</p>
  </div>
);

/* ── Notification Item ── */
const NotifItem = ({ notif, onDismiss }) => {
  const iconMap = {
    calendar: { Icon: Calendar, color: "#818cf8" },
    warning: { Icon: Warning, color: "#f59e0b" },
    task: { Icon: CheckSquare, color: "#10b981" },
    bell: { Icon: Bell, color: "#f59e0b" },
    meeting: { Icon: Phone, color: "#a78bfa" },
    default: { Icon: Flag, color: "#818cf8" },
  };
  const cfg = iconMap[notif.iconType] || iconMap.default;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-xl border group transition-all"
      style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
    >
      <GlowIcon icon={<cfg.Icon size={16} weight="fill" />} color={cfg.color} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{
          display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden",
          color: "var(--text-secondary)",
        }}>{notif.message}</p>
        <p className="text-[11px] mt-1 truncate" style={{ color: "var(--text-muted)" }}>
          From: <span style={{ color: "var(--text-secondary)" }}>{notif.noteTitle}</span>
        </p>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wide ${
          notif.priority === "high" ? "" : ""
        }`} style={{
          background: notif.priority === "high" ? "rgba(244,63,94,0.15)" : "rgba(245,158,11,0.15)",
          border: `1px solid ${notif.priority === "high" ? "rgba(244,63,94,0.3)" : "rgba(245,158,11,0.3)"}`,
          color: notif.priority === "high" ? "#f43f5e" : "#f59e0b",
        }}>{notif.priority}</span>
        <button onClick={onDismiss} className="text-[10px] transition opacity-0 group-hover:opacity-100" style={{ color: "var(--text-muted)" }}>Dismiss</button>
      </div>
    </motion.div>
  );
};

/* ── Digest Card (modal) ── */
const DigestCard = ({ icon, value, label, accent }) => (
  <div className="p-4 rounded-2xl text-center" style={{ background: `${accent}08`, border: `1px solid ${accent}18` }}>
    <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: `${accent}15`, color: accent }}>
      {icon}
    </div>
    <p className="text-2xl font-extrabold ns-stat-value" style={{ color: "var(--text-primary)" }}>{value}</p>
    <p className="text-[10px] font-semibold uppercase tracking-wide mt-1" style={{ color: "var(--text-muted)" }}>{label}</p>
  </div>
);

/* ── Insight Line ── */
const InsightLine = ({ label, value, valueColor }) => (
  <div className="flex items-center justify-between">
    <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>{label}</span>
    <span className="text-[12px] font-semibold" style={{ color: valueColor || "var(--text-secondary)" }}>{value}</span>
  </div>
);

/* ── Modal infrastructure ── */
const ModalOverlay = ({ children, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.18 }}
    className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto"
    style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
    onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div className="w-full min-h-full flex items-center justify-center p-4">{children}</div>
  </motion.div>
);

const ModalCard = ({ children, onClose, width = "max-w-md" }) => (
  <motion.div
    initial={{ scale: 0.97, opacity: 0, y: 16 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    exit={{ scale: 0.97, opacity: 0, y: 16 }}
    transition={{ duration: 0.22, ease: "easeOut" }}
    onClick={(e) => e.stopPropagation()}
    className={`w-full ${width} rounded-2xl border my-auto overflow-hidden`}
    style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)", boxShadow: "0 25px 60px rgba(0,0,0,0.45)" }}
  >
    {children}
  </motion.div>
);

const ModalHeader = ({ icon, iconBg, iconBorder, title, subtitle, onClose }) => (
  <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border-secondary)" }}>
    <div className="flex items-center gap-3 min-w-0">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg, border: `1px solid ${iconBorder}` }}>
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-bold truncate" style={{ color: "var(--text-primary)" }}>{title}</h2>
        {subtitle && <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
      </div>
    </div>
    <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={onClose}
      className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition"
      style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)" }}
      aria-label="Close"
    >
      <FiX size={15} className="text-rose-400" />
    </motion.button>
  </div>
);



