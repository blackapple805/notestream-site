// src/pages/Dashboard.jsx
// Updated: Liquid glass card styling + theme-aware number colors (white in dark, black in light)
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

/**
 * Insert-only seed for user_engagement_stats.
 * Uses upsert + ignoreDuplicates so it will NOT overwrite existing rows.
 * IMPORTANT: include initial defaults so new users don't start at 0/NULL.
 */
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

const computeHighlights = (notes, limit = 5) => {
  const list = (notes || [])
    .filter((n) => n?.is_highlight || n?.is_favorite)
    .sort((a, b) => {
      const au = a?.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bu = b?.updated_at ? new Date(b.updated_at).getTime() : 0;
      return bu - au;
    })
    .slice(0, limit)
    .map((n) => ({
      id: n.id,
      title: n.title || "Untitled note",
    }));
  return list;
};

const useBodyScrollLock = (locked) => {
  useEffect(() => {
    if (!locked) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [locked]);
};

const safeCloneIcon = (el, inject = {}) => {
  if (!el || typeof el !== "object" || !("props" in el)) return el;

  const nextProps = { ...inject };
  if (!("weight" in el.props) && "weight" in nextProps) delete nextProps.weight;

  return cloneElement(el, nextProps);
};

const NotificationIcon = ({ iconType = "default" }) => {
  const iconConfig = {
    calendar: {
      Icon: Calendar,
      colorClass: "text-indigo-400",
      bg: "rgba(99,102,241,0.15)",
      border: "rgba(99,102,241,0.3)",
    },
    warning: {
      Icon: Warning,
      colorClass: "text-amber-400",
      bg: "rgba(245,158,11,0.15)",
      border: "rgba(245,158,11,0.3)",
    },
    task: {
      Icon: CheckSquare,
      colorClass: "text-emerald-400",
      bg: "rgba(16,185,129,0.15)",
      border: "rgba(16,185,129,0.3)",
    },
    bell: {
      Icon: Bell,
      colorClass: "text-amber-400",
      bg: "rgba(245,158,11,0.15)",
      border: "rgba(245,158,11,0.3)",
    },
    meeting: {
      Icon: Phone,
      colorClass: "text-purple-400",
      bg: "rgba(168,85,247,0.15)",
      border: "rgba(168,85,247,0.3)",
    },
    default: {
      Icon: Flag,
      colorClass: "text-indigo-400",
      bg: "rgba(99,102,241,0.15)",
      border: "rgba(99,102,241,0.3)",
    },
  };

  const config = iconConfig[iconType] || iconConfig.default;
  const { Icon, colorClass, bg, border } = config;

  return (
    <div
      className={`relative h-12 w-12 rounded-xl border flex items-center justify-center ${colorClass}`}
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        backdropFilter: "blur(6px) saturate(160%)",
        WebkitBackdropFilter: "blur(6px) saturate(160%)",
      }}
    >
      {/* subtle inner sheen */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.25), transparent 60%)",
          opacity: 0.35,
        }}
      />

      {/* Phosphor icon */}
      <Icon size={18} weight="fill" className="relative z-10" />
    </div>
  );
};

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
      style={{ backgroundColor: t.bg, borderColor: t.border }}
    >
      {children}
    </div>
  );
};

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

  const productivity = useMemo(() => {
    return activeDays >= 5 ? "High" : activeDays >= 3 ? "Medium" : "Low";
  }, [activeDays]);

  /* -----------------------------------------
    STATS: fetch user_engagement_stats
    ✅ Insert-only seed + safe daily increment
  ----------------------------------------- */
  useEffect(() => {
    if (!supabaseReady || !supabase) {
      setStatsLoading(false);
      return;
    }

    let alive = true;

    (async () => {
      setStatsLoading(true);

      const { data: sessRes, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) console.error("getSession error:", sessErr);

      const user = sessRes?.session?.user;
      if (!user?.id) {
        if (alive) {
          setStatsLoading(false);
          navigate("/login");
        }
        return;
      }

      const fallbackName =
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        (user.email ? user.email.split("@")[0] : null);

      // ✅ Seed row if missing (insert-only; will NOT overwrite)
      await ensureUserStatsRow(user.id, fallbackName);

      // Fetch row
      const { data: rowMaybe, error: fetchErr } = await supabase
        .from(USER_STATS_TABLE)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchErr) {
        console.error("Stats fetch error:", fetchErr);
        if (alive) setStatsLoading(false);
        return;
      }

      if (!rowMaybe) {
        // If RLS prevented insert or row truly missing, don't crash UI.
        if (alive) {
          setStats(EMPTY_STATS);
          setStatsLoading(false);
        }
        return;
      }

      // Normalize nulls -> 0
      const base = {
        ...EMPTY_STATS,
        ...rowMaybe,
        notes_created: Number(rowMaybe?.notes_created ?? 0),
        ai_uses: Number(rowMaybe?.ai_uses ?? 0),
        active_days: Number(rowMaybe?.active_days ?? 0),
        streak_days: Number(rowMaybe?.streak_days ?? 0),
      };

      const today = toLocalYMD();

      // Increment only if not already counted today
      if (base.last_active_date !== today) {
        const diff = base.last_active_date
          ? diffDaysLocal(base.last_active_date, today)
          : null;

        const nextActiveDays = (base.active_days || 0) + 1;
        const nextStreak = diff === 1 ? (base.streak_days || 0) + 1 : 1;

        const { data: updatedRow, error: upErr } = await supabase
          .from(USER_STATS_TABLE)
          .update({
            active_days: nextActiveDays,
            streak_days: nextStreak,
            last_active_date: today,
            ...(base.display_name ? {} : { display_name: fallbackName ?? null }),
          })
          .eq("user_id", user.id)
          .select("*")
          .single();

        if (upErr) {
          console.error("Stats update error:", upErr);
        } else {
          Object.assign(base, updatedRow, {
            active_days: Number(updatedRow?.active_days ?? nextActiveDays),
            streak_days: Number(updatedRow?.streak_days ?? nextStreak),
          });
        }
      }

      if (!alive) return;
      setStats(base);
      setStatsLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [navigate, supabaseReady]);

      /* -----------------------------------------
      AI USED: fetch daily_usage (today)
      ✅ DB-only, resets daily
    ----------------------------------------- */
  useEffect(() => {
    if (!supabaseReady || !supabase) return;

    let alive = true;

    const fetchTodayUsage = async () => {
      setAiUsesLoading(true);

      const { data: sessRes } = await supabase.auth.getSession();
      const user = sessRes?.session?.user;
      if (!user?.id) {
        setAiUsesLoading(false);
        return;
      }

      const today = toLocalYMD();

      const { data, error } = await supabase
        .from("daily_usage")
        .select("ai_summaries,document_synth,insight_queries,voice_transcriptions")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .maybeSingle();

      if (!alive) return;

      if (error || !data) {
        setAiUses(0);
        setAiUsesLoading(false);
        return;
      }

      const total =
        Number(data.ai_summaries || 0) +
        Number(data.document_synth || 0) +
        Number(data.insight_queries || 0) +
        Number(data.voice_transcriptions || 0);

      setAiUses(total);
      setAiUsesLoading(false);
    };


    fetchTodayUsage();

    const onUsageChanged = () => fetchTodayUsage();
    window.addEventListener("notestream:daily_usage_changed", onUsageChanged);

    return () => {
      alive = false;
      window.removeEventListener("notestream:daily_usage_changed", onUsageChanged);
    };
  }, [supabaseReady]);



  /* -----------------------------------------
    DATA: fetch notes + docs (last 7 days)
  ----------------------------------------- */
  useEffect(() => {
    if (!supabaseReady || !supabase) {
      setNotes([]);
      setDocs([]);
      setDataLoading(false);
      return;
    }

    let alive = true;

    (async () => {
      setDataLoading(true);

      const { data: sessRes } = await supabase.auth.getSession();
      const user = sessRes?.session?.user;

      if (!user?.id) {
        if (alive) {
          setDataLoading(false);
          navigate("/login");
        }
        return;
      }

      const since = new Date();
      since.setDate(since.getDate() - 7);
      const sinceIso = since.toISOString();

      const [notesRes, docsRes] = await Promise.all([
        supabase
          .from(NOTES_TABLE)
          .select(
            "id,title,body,tags,is_favorite,is_highlight,ai_payload,ai_generated_at,created_at,updated_at"
          )
          .eq("user_id", user.id)
          .gte("updated_at", sinceIso)
          .order("updated_at", { ascending: false }),

        supabase
          .from(DOCS_TABLE)
          .select("id,user_id,name,type,status,created_at,updated_at")
          .eq("user_id", user.id)
          .gte("updated_at", sinceIso)
          .order("updated_at", { ascending: false }),
      ]);


      if (!alive) return;

      setNotes(!notesRes?.error ? notesRes.data || [] : []);
      setDocs(!docsRes?.error ? docsRes.data || [] : []);
      setDataLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [navigate, supabaseReady]);

  // Smart notifications parse (from DB notes)
  useEffect(() => {
    if (!settings.smartNotifications) return;

    const notesForNotif = (notes || []).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      updated: n.updated_at,
      favorite: !!n.is_favorite,
      tag: Array.isArray(n.tags) && n.tags.length ? n.tags[0] : "",
    }));

    parseNotificationsFromNotes(notesForNotif);
  }, [settings.smartNotifications, parseNotificationsFromNotes, notes]);

  // Weekly digest generation (from DB notes+docs)
  useEffect(() => {
    if (!settings.weeklyDigest) {
      setDigest(null);
      return;
    }

    const { start, end } = getLast7DaysRange();

    const topTags = computeTopTags(notes, 6);
    const highlights = computeHighlights(notes, 6);
    const synthesizedDocs7d = (docs || []).filter(
    (d) => (d?.status || "") === "synthesized").length;

    const synthesizedBriefs7d = (notes || []).filter((n) => {
    const tags = Array.isArray(n?.tags) ? n.tags : [];
    return tags.includes(TAG_RESEARCH_BRIEF);
  }).length;


    setDigest({
      period: {
        start: formatShortDate(start),
        end: formatShortDate(end),
      },
      stats: {
        notesCreated,
        docsUploaded,
        favoritedNotes,
        synthesizedDocs: synthesizedDocs7d,
        totalItems: Number(notes.length) + Number(docs.length),
      },
      insights: {
        mostActiveDay: stats?.last_active_date || "—",
        productivity,
        topTags,
      },
      highlights,
    });
  }, [
    settings.weeklyDigest,
    notes,
    docs,
    notesCreated,
    docsUploaded,
    favoritedNotes,
    productivity,
    stats?.last_active_date,
  ]);

  const recentNotes = useMemo(() => {
    return (notes || []).slice(0, 3).map((n) => ({
      id: n.id,
      title: n.title || "Untitled note",
      updated: safeLocalDateTime(n.updated_at),
      hasAI: !!n.ai_generated_at || !!n.ai_payload?.summary,
    }));
  }, [notes]);

  const recentDocs = useMemo(() => {
    return (docs || []).slice(0, 3);
  }, [docs]);

  const fadeSlide = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const isDashboardLoading = statsLoading || dataLoading;
    
    if (isDashboardLoading) {
        return (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        );
      }

    return (
      <div className="w-full space-y-6 pb-[calc(var(--mobile-nav-height)+24px)]">
        <motion.header
          variants={fadeSlide}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4 }}
          className="pt-2"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="page-header-icon flex-shrink-0">
                <House size={20} weight="duotone" />
              </div>
              <div className="min-w-0">
                <h1 className="page-header-title">
                  {getGreeting()}
                  {displayName ? `, ${displayName}` : ""}
                </h1>
                <p
                  className="page-header-subtitle truncate"
                  style={{
                    opacity: statsLoading ? 0.7 : 1,
                    transition: "opacity 180ms ease",
                  }}
                >
                  Welcome back — {streakDays} day streak • {notesCreated} notes •{" "}
                  {aiUses} AI uses
                </p>
              </div>
            </div>

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

        {/* ═══════════════════════════════════════════════════════════
            QUICK STATS — Liquid Glass Style
        ═══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <QuickStat
            loading={statsLoading}
            icon={<Note size={16} weight="duotone" />}
            label="Notes"
            value={notesCreated}
            suffix="created"
            color="indigo"
          />
          <QuickStat
            loading={statsLoading}
            icon={<Fire size={16} weight="fill" />}
            label="Active"
            value={activeDays}
            suffix="days"
            color="amber"
          />
          <QuickStat
            loading={statsLoading}
            icon={<Lightning size={16} weight="fill" />}
            label="AI Used"
            value={aiUses}
            suffix="times"
            color="emerald"
          />
        </div>
      </motion.header>

      {/* ═══════════════════════════════════════════════════════════
          WEEKLY DIGEST — Liquid Glass Style
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {settings.weeklyDigest && digest && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <LiquidGlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.1))",
                      border: "1px solid rgba(139,92,246,0.3)",
                    }}
                  >
                    <ChartLineUp
                      size={20}
                      weight="duotone"
                      className="text-purple-400"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      Weekly Digest
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {digest.period.start} - {digest.period.end}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDigest(true)}
                  className="text-xs transition font-medium px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0"
                  style={{ color: "var(--accent-purple)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(168, 85, 247, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Full report →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <DigestStatCard
                  icon={<Note size={18} weight="duotone" />}
                  value={notes.length}
                  label="Notes (7d)"
                  color="indigo"
                />
                <DigestStatCard
                  icon={<FileText size={18} weight="duotone" />}
                  value={docs.length}
                  label="Docs (7d)"
                  color="purple"
                />
                <DigestStatCard
                  icon={<Brain size={18} weight="duotone" />}
                  value={digest.stats.synthesizedDocs}
                  label="Synthesized (7d)"
                  color="emerald"
                />
                <DigestStatCard
                  icon={<Target size={18} weight="duotone" />}
                  value={digest.insights.productivity}
                  label="Activity"
                  color="emerald"
                  isText={true}
                />
              </div>

              {dataLoading && (
                <p className="text-[11px] mt-3 px-1" style={{ color: "var(--text-muted)" }}>
                  Syncing data…
                </p>
              )}
            </LiquidGlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => navigate("/dashboard/notes")}
          className="relative w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-medium text-sm transition-all overflow-hidden"
          style={{
            background: "var(--sidebar-glass-bg)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1px solid var(--sidebar-glass-border)",
            boxShadow: "var(--sidebar-glass-shadow)",
            color: "var(--text-primary)",
          }}
        >
          {/* liquid sheen */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "var(--glass-sheen)",
              opacity: 0.35,
            }}
          />

          <FiPlus size={18} className="icon-muted" />
          <span>New Note / Upload</span>
        </motion.button>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          QUICK ACCESS — Liquid Glass Style
      ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className="text-sm font-semibold mb-3 px-1" style={{ color: "var(--text-secondary)" }}>
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
          RECENT NOTES — Liquid Glass Style
      ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <LiquidGlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <IconTile tone="indigo" size="sm">
                <FiClock size={16} />
              </IconTile>
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Recent Notes
              </h3>
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
                className="
                    group w-full text-left
                    px-4 py-3
                    rounded-2xl
                    soft-liquid-glass
                    transition-all
                    flex items-center justify-between gap-3
                  "

                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-secondary)",
                }}
              >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Icon (bigger + consistent) */}
                <div
                  className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: "rgba(99,102,241,0.12)",
                    borderColor: "rgba(99,102,241,0.22)",
                  }}
                >
                  <FiFileText size={18} className="text-indigo-400" />
                </div>

                {/* Text (clamped, no overflow) */}
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-semibold leading-snug"
                    style={{
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                      overflow: "hidden",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {note.title}
                  </p>

                  <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {note.updated}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {note.hasAI && <StatusTag type="success">AI Ready</StatusTag>}
                <FiChevronRight
                  className="text-theme-muted group-hover:text-indigo-400 transition"
                  size={16}
                />
              </div>
              </motion.button>
            ))}

            {!dataLoading && recentNotes.length === 0 && (
              <p className="text-[11px] px-1 py-2" style={{ color: "var(--text-muted)" }}>
                No notes in the last 7 days.
              </p>
            )}
          </div>
        </LiquidGlassCard>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          RECENT DOCS + AI TOOLS — Liquid Glass Style
      ═══════════════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeSlide}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid grid-cols-1 xl:grid-cols-2 gap-4"
      >
        <LiquidGlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <IconTile tone="purple" size="sm">
                <FiFolder size={16} />
              </IconTile>
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Recent Documents
              </h3>
            </div>

            <button
              onClick={() => navigate("/dashboard/documents")}
              className="text-xs text-purple-400 hover:text-purple-300 transition font-medium"
            >
              View all →
            </button>
          </div>

          <div className="space-y-2">
            {recentDocs.map((doc) => (
              <DocumentRow
                key={doc.id}
                doc={{ id: doc.id, name: doc.name, status: doc.status, type: doc.type }}
                onClick={() => navigate(`/dashboard/documents/${doc.id}`)}
              />
            ))}

            {!dataLoading && recentDocs.length === 0 && (
              <p className="text-[11px] px-1 py-2" style={{ color: "var(--text-muted)" }}>
                No documents in the last 7 days.
              </p>
            )}
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard>
          <div className="flex items-center gap-3 mb-4">
            <IconTile tone="amber" size="sm">
              <Sparkle size={18} weight="fill" />
            </IconTile>
            <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              AI Tools
            </h3>
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
        </LiquidGlassCard>
      </motion.div>

      {/* NOTIFICATIONS MODAL */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto"
            style={{
              backgroundColor: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
            onMouseDown={(e) => {
              // close only when clicking backdrop (not dragging inside)
              if (e.target === e.currentTarget) setShowNotifications(false);
            }}
          >
            <div className="w-full min-h-full flex items-center justify-center p-4">
             <motion.div
                initial={{ scale: 0.98, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.98, opacity: 0, y: 16 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl border my-auto"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-secondary)",
                  boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  className="p-4 border-b flex items-center justify-between"
                  style={{ borderColor: "var(--border-secondary)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(249,115,22,0.1))",
                        border: "1px solid rgba(245,158,11,0.3)",
                      }}
                    >
                      <Bell
                        size={18}
                        weight="duotone"
                        className="text-amber-400"
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                        Smart Notifications
                      </h2>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
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
                      backgroundColor: "rgba(244,63,94,0.1)",
                      border: "1px solid rgba(244,63,94,0.2)",
                    }}
                  >
                    <FiX size={16} className="text-rose-400" />
                  </motion.button>
                </div>

                <div className="p-4 overflow-y-auto max-h-[55vh] space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell
                        size={40}
                        weight="duotone"
                        className="mx-auto mb-3 opacity-50"
                        style={{ color: "var(--text-muted)" }}
                      />
                      <p style={{ color: "var(--text-muted)" }}>No notifications</p>
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

                      {/* ✅ Text column: clamp + no spill */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium"
                          style={{
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                            overflow: "hidden",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {notif.message}
                        </p>

                        <p
                          className="text-[11px] mt-1"
                          style={{
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                            overflow: "hidden",
                            wordBreak: "break-word",
                            color: "var(--text-muted)",
                          }}
                        >
                          <span>From: </span>
                          <span style={{ color: "var(--text-secondary)" }}>{notif.noteTitle}</span>
                        </p>
                      </div>

                      {/* ✅ Right column: don't force wrapping */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
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
                          className="text-[10px] hover:text-rose-400 transition opacity-0 group-hover:opacity-100"
                          style={{ color: "var(--text-muted)" }}
                          type="button"
                        >
                          Dismiss
                        </button>
                      </div>                    
                      </motion.div>
                    ))
                  )}
                </div>

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
                      className="w-full py-3 rounded-xl text-sm font-medium transition"
                      style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}
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

      {/* WEEKLY DIGEST MODAL */}
   
      <AnimatePresence>
        {showDigest && !!digest && (
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
           onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowDigest(false);
            }}
          >
            <div className="w-full min-h-full flex items-center justify-center p-4 py-8">
              <motion.div
                initial={{ scale: 0.98, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.98, opacity: 0, y: 16 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl border my-auto overflow-hidden"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-secondary)",
                  boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
                }}
              >
                {/* Header */}
                <div className="p-5 border-b" style={{ borderColor: "var(--border-secondary)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* fixed-size icon tile */}
                      <div
                        className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.1))",
                          border: "1px solid rgba(139,92,246,0.3)",
                        }}
                      >
                        <ChartLineUp size={22} weight="duotone" className="text-purple-400" />
                      </div>

                      {/* allow truncation */}
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          Weekly Digest
                        </h2>
                        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                          {digest?.period?.start} - {digest?.period?.end}
                        </p>
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setShowDigest(false)}
                      className="h-9 w-9 rounded-xl flex items-center justify-center transition shrink-0"
                      style={{
                        backgroundColor: "rgba(244,63,94,0.1)",
                        border: "1px solid rgba(244,63,94,0.2)",
                      }}
                      aria-label="Close digest"
                    >
                      <FiX size={16} className="text-rose-400" />
                    </motion.button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    <ModalStatCard
                      icon={<Note size={20} weight="duotone" />}
                      value={notes.length}
                      label="Notes (7d)"
                      color="indigo"
                    />
                    <ModalStatCard
                      icon={<FileText size={20} weight="duotone" />}
                      value={Number(docs?.length || 0)}
                      label="Docs (7d)"
                      color="purple"
                    />
                    <ModalStatCard
                      icon={<Star size={20} weight="fill" />}
                      value={favoritedNotes}
                      label="Favorites/Highlights (7d)"
                      subLabel={`From: ${displayName || "You"}`}
                      color="rose"
                    />
                    <ModalStatCard
                      icon={<Brain size={20} weight="duotone" />}
                      value={Number(digest?.stats?.synthesizedDocs || 0)}
                      label="Synthesized"
                      color="emerald"
                    />
                  </div>

                  <div
                    className="rounded-xl p-4 border"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      borderColor: "var(--border-secondary)",
                    }}
                  >
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                      <Target size={16} weight="duotone" className="text-purple-400" />
                      Insights
                    </h3>

                    <div className="space-y-3">
                      <InsightRow label="Most Active Day" value={digest?.insights?.mostActiveDay || "—"} />
                      <InsightRow
                        label="Productivity Level"
                        value={digest?.insights?.productivity || "—"}
                        valueColor={
                          digest?.insights?.productivity === "High"
                            ? "text-emerald-400"
                            : digest?.insights?.productivity === "Medium"
                            ? "text-amber-400"
                            : "text-theme-secondary"
                        }
                      />
                      <InsightRow label="Total Items" value={Number(digest?.stats?.totalItems || 0)} />
                    </div>
                  </div>

                  {!!digest?.insights?.topTags?.length && (
                    <div
                      className="rounded-xl p-4 border"
                      style={{
                        backgroundColor: "var(--bg-tertiary)",
                        borderColor: "var(--border-secondary)",
                      }}
                    >
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <FiFileText size={16} className="text-indigo-400" />
                        Top Tags
                      </h3>

                      <div className="flex flex-wrap gap-2">
                        {digest.insights.topTags.map((tag, i) => (
                          <span
                            key={`${tag.tag}-${i}`}
                            className="text-xs px-3 py-1.5 rounded-lg border"
                            style={{
                              backgroundColor: "var(--bg-input)",
                              borderColor: "var(--border-secondary)",
                            }}
                          >
                            <span style={{ color: "var(--text-secondary)" }}>{tag.tag}</span>
                            <span className="ml-1.5" style={{ color: "var(--text-muted)" }}>({tag.count})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!!digest?.highlights?.length && (
                    <div
                      className="rounded-xl p-4 border"
                      style={{
                        backgroundColor: "var(--bg-tertiary)",
                        borderColor: "var(--border-secondary)",
                      }}
                    >
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <Star size={16} weight="fill" className="text-amber-400" />
                        Highlights
                      </h3>

                      <div className="space-y-2">
                        {digest.highlights.map((h) => (
                          <div
                            key={h.id}
                            className="flex items-center gap-2 text-sm min-w-0"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <span className="text-amber-400 shrink-0">•</span>
                            <span className="truncate min-w-0">{h.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t" style={{ borderColor: "var(--border-secondary)" }}>
                  <button
                    type="button"
                    onClick={() => setShowDigest(false)}
                    className="w-full py-3 rounded-xl font-medium transition border"
                    style={{
                      borderColor: "var(--border-secondary)",
                      color: "var(--text-secondary)",
                      backgroundColor: "var(--bg-tertiary)",
                    }}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

/* -----------------------------------------
   LIQUID GLASS CARD COMPONENT
----------------------------------------- */
const LiquidGlassCard = ({ children, className = "" }) => {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: "var(--card-glass-bg, var(--bg-surface))",
        backdropFilter: "blur(42px) saturate(185%)",
        WebkitBackdropFilter: "blur(42px) saturate(185%)",
        border: "1px solid var(--card-glass-border, var(--border-secondary))",
        boxShadow: "var(--card-glass-shadow, 0 10px 30px rgba(0,0,0,0.18))",
      }}
    >
      {/* soft gradient fog */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(1200px 400px at 20% 0%, rgba(255,255,255,0.06), transparent 55%)," +
            "radial-gradient(800px 300px at 90% 30%, rgba(139,92,246,0.07), transparent 60%)," +
            "linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01) 45%, rgba(0,0,0,0.02))",
          opacity: 1,
        }}
      />

      {/* specular line */}
      <div
        className="absolute inset-x-6 top-0 h-[1px] pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.20) 50%, transparent 100%)",
          opacity: 0.8,
        }}
      />

      {/* subtle inner ring */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      />

      <div className="relative z-10 p-4">{children}</div>
    </div>
  );
};


/* -----------------------------------------
   HELPER COMPONENTS
----------------------------------------- */

// ✅ PATCH 4 — improve QuickStat (better hierarchy + loading skeleton + theme-safe number color)
// Drop-in replace QuickStat component
const QuickStat = ({ icon, label, value, suffix, color, loading = false }) => {
  const colorMap = {
    indigo: "text-indigo-400",
    amber: "text-amber-400",
    emerald: "text-emerald-400",
  };

  const safeValue = typeof value === "number" ? value : Number(value ?? 0) || 0;

  return (
    <div
      className="relative rounded-xl px-3 py-3 soft-liquid-glass overflow-hidden"
      style={{ opacity: loading ? 0.95 : 1 }}
    >
      {/* shimmer when loading */}
      {loading && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
            transform: "translateX(-60%)",
            animation: "notestream-shimmer 1.1s ease-in-out infinite",
          }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className={colorMap[color] ?? colorMap.indigo}>{icon}</span>
          <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            {label}
          </p>
        </div>

        <div className="flex items-baseline gap-1.5">
          <p className="text-[22px] leading-none font-extrabold" style={{ color: "var(--text-primary)" }}>
            {safeValue}
          </p>
          {suffix && (
            <span className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
              {suffix}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Add this once in your global CSS (or a CSS module imported on Dashboard)
// @keyframes notestream-shimmer { 0%{transform:translateX(-60%)} 100%{transform:translateX(60%)} }


const DigestStatCard = ({ icon, value, label, color, isText = false }) => {
  const colorMap = {
    indigo: "text-indigo-400",
    purple: "text-purple-400",
    emerald: "text-emerald-400",
    rose: "text-rose-400",
  };

  return (
    <div className="relative p-3 rounded-xl text-center soft-liquid-glass">
      <div className="relative z-10">
        <div className={`${colorMap[color]} mb-1 flex justify-center`}>
          {icon}
        </div>

        <p
          className={`${isText ? "text-base" : "text-xl"} font-bold text-theme-primary`}
        >
          {value}
        </p>

        <p className="text-[10px] text-theme-muted">{label}</p>
      </div>
    </div>
  );
};


const ModalStatCard = ({ icon, value, label, subLabel = null, color = "indigo" }) => {
  const colorMap = {
    indigo: { text: "text-indigo-400", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)" },
    purple: { text: "text-purple-400", bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.25)" },
    rose: { text: "text-rose-400", bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.25)" },
    emerald:{ text: "text-emerald-400", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
  };

  const c = colorMap[color] ?? colorMap.indigo;

  return (
    <div className="p-4 rounded-xl text-center soft-liquid-glass">
      <div
        className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${c.text}`}
        style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}
      >
        {icon}
      </div>

      <p className="text-2xl font-bold text-theme-primary">{value}</p>
      <p className="text-[11px] text-theme-muted mt-1 truncate">{label}</p>

      {subLabel && (
        <p className="text-[11px] text-theme-muted truncate">{subLabel}</p>
      )}
    </div>
  );
};



const InsightRow = ({ label, value, valueColor = "" }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
    <span className={`text-xs font-medium ${valueColor}`} style={!valueColor ? { color: "var(--text-secondary)" } : {}}>
      {value}
    </span>
  </div>
);

const QuickAction = ({
  icon,
  label,
  desc,
  onClick,
  color = "indigo",
  pro = false,
}) => {
  const colorMap = {
    indigo: "text-indigo-400 border-indigo-500/25",
    purple: "text-purple-400 border-purple-500/25",
    pink: "text-pink-400 border-pink-500/25",
    emerald: "text-emerald-400 border-emerald-500/25",
    amber: "text-amber-400 border-amber-500/25",
    cyan: "text-cyan-400 border-cyan-500/25",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-2 py-5 rounded-xl soft-liquid-glass transition-all"
    >
      {/* PRO */}
      {pro && (
        <span
          className="
            absolute top-2 right-2
            text-[9px] font-semibold
            px-2 py-0.5
            rounded-full
            border
          "
          style={{
            background: "rgba(245,158,11,0.14)",
            borderColor: "rgba(245,158,11,0.28)",
            color: "#fbbf24",
            backdropFilter: "blur(6px) saturate(160%)",
            WebkitBackdropFilter: "blur(6px) saturate(160%)",
          }}
        >
          PRO
        </span>
      )}

      {/* ICON */}
      <div
        className={`h-12 w-12 rounded-xl border flex items-center justify-center ${colorMap[color]}`}
        style={{
          backdropFilter: "blur(10px) saturate(160%)",
          WebkitBackdropFilter: "blur(10px) saturate(160%)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {safeCloneIcon(icon, { size: 18, weight: "fill" })}
      </div>



      <div className="text-center">
        <span className="text-sm font-medium text-theme-secondary block">
          {label}
        </span>
        {desc && (
          <span className="text-[10px] text-theme-muted">{desc}</span>
        )}
      </div>
    </motion.button>
  );
};



const StatusTag = ({ children, type = "success" }) => {
  const typeStyles = {
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    error: "bg-rose-500/15 text-rose-400 border-rose-500/25",
    info: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  };

  return (
    <span
      className={`
        inline-flex items-center
        text-[10px] font-semibold
        px-2.5 py-1
        rounded-full
        border
        ${typeStyles[type]}
      `}
      style={{
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {children}
    </span>
  );
};


const DocumentRow = ({ doc, onClick }) => (
  <motion.button
    onClick={onClick}
    className="group w-full text-left px-4 py-3 rounded-2xl soft-liquid-glass flex items-center justify-between gap-3"
  >
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="h-10 w-10 rounded-xl border border-purple-500/25 bg-purple-500/10 flex items-center justify-center">
        <FiFileText className="text-purple-400" size={16} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate text-theme-secondary">
          {doc.name}
        </p>
        <p className="text-[11px] truncate text-theme-muted mt-0.5">
          {doc.status || "—"}
        </p>
      </div>
    </div>
    <span
      className="
        shrink-0
        text-[10px] font-medium
        px-3 py-1
        rounded-full
        border
        inline-flex items-center
      "
      style={{
        background: "var(--card-glass-bg)",
        borderColor: "var(--card-glass-border)",
        color: "var(--text-muted)",
        backdropFilter: "blur(12px) saturate(160%)",
        WebkitBackdropFilter: "blur(12px) saturate(160%)",
      }}
    >
      {String(doc.type || "FILE").toUpperCase()}
    </span>
  </motion.button>
);



const ToolButton = ({ icon, label, desc, onClick, tone = "indigo" }) => {
  const toneMap = {
    indigo: "text-indigo-400 border-indigo-500/25",
    purple: "text-purple-400 border-purple-500/25",
    pink: "text-pink-400 border-pink-500/25",
    emerald: "text-emerald-400 border-emerald-500/25",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group w-full flex items-center justify-between px-4 py-3 rounded-xl soft-liquid-glass"
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-xl border flex items-center justify-center ${toneMap[tone]}`}
        >
          {icon}
        </div>

        <div className="text-left">
          <p className="text-sm font-medium text-theme-secondary">{label}</p>
          <p className="text-[11px] text-theme-muted">{desc}</p>
        </div>
      </div>

      <FiChevronRight className="text-theme-muted group-hover:text-indigo-400 transition" size={16} />
    </motion.button>
  );
};






