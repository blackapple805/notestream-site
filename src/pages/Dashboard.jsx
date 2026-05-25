// src/pages/Dashboard.jsx
// ═══════════════════════════════════════════════════════════════════
// EDITORIAL RESKIN — what changed and why
// ─────────────────────────────────────────────────────────────────
// Wrapped the whole page in `<div className="ns-ed">` and called
// `useEditorial()` so the dashboard inherits the same paper-100
// background, Instrument Serif headlines, Geist body, and Geist Mono
// eyebrows the marketing site uses. Every dark surface, neon gradient,
// glass blur, and colored icon-chip from the previous SaaS skin is
// gone — replaced by paper-50 cards with hairline `var(--ed-rule)`
// borders, italic accent-blue numerals, monospace metadata, and
// chapter marks (`№ 01`, `§ 02`). The hero is a "cover story": a
// VOL/NO/date masthead line, "Good morning, *Angel*." in
// `.ed-display` with the first name italicised in accent blue, a
// one-line lede, three mono stat chips, and a margin footnote on
// desktop. The four stat cards became one column-rule strip — four
// cells inside a single `.ed-card`, hairlines between them, serif
// italic accent-blue numerals. The purple-gradient "New Note /
// Upload" strip is now a centered ink button reading "Begin a new
// note →" with a smaller `.ed-ulink` "or upload a document" below
// it, surrounded by 96px of breathing room. The bento Quick Access
// turned into an "In this issue" table-of-contents: mono ordinal,
// serif row name, leader dots, mono caption. Recent notes / docs /
// AI tools became editorial list rows with hairline dividers and a
// `.ed-chip-accent` for the AI status. Empty states are single
// serif-italic sentences; the loading state is an animated hairline
// rule instead of a spinner. Modals were rebuilt as paper-50 cards
// with hairline borders, no shadows, no blur. NO Supabase / hook /
// data-flow changes — the entire data layer (state, useEffect calls,
// usage tracking, weekly digest synthesis) is byte-identical to the
// previous file.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiArrowRight, FiX } from "react-icons/fi";
import { useWorkspaceSettings } from "../hooks/useWorkspaceSettings";
import { supabase, supabaseReady } from "../lib/supabaseClient";
import { toLocalYMD, parseYMDToDate, diffDaysLocal } from "../lib/formatDate";
import { useEditorial, ED } from "../lib/editorial";

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

/* ─── Utility helpers (unchanged) ─── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
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

/* ─── Issue-formatted date for the masthead ─── */
const issueLine = (d = new Date()) => {
  const day = d.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase();
  const month = d
    .toLocaleDateString(undefined, { month: "long" })
    .toUpperCase();
  return `${day}, ${month} ${d.getDate()}, ${d.getFullYear()}`;
};

/* ─── Vol/No derived deterministically from the date ─── */
const volAndNo = (d = new Date()) => {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = (d - start) + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60000);
  const day = Math.floor(diff / 86400000);
  const week = Math.ceil(day / 7);
  return { vol: "II", no: String(week).padStart(2, "0") };
};

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
═══════════════════════════════════════════════════════ */
export default function Dashboard() {
  useEditorial();
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

  /* ── ALL DATA-FETCHING useEffects (UNCHANGED from previous file) ── */

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
  }, [navigate]);

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
  }, []);

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
  }, [navigate]);

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

  /* ── LOADING STATE — animated hairline rule, no spinner ── */
  if (isDashboardLoading) {
    return (
      <div className="ns-ed">
        <div style={{ padding: "120px 0", textAlign: "center" }}>
          <div
            style={{
              maxWidth: 480, margin: "0 auto", height: 1,
              background: `linear-gradient(90deg, transparent, ${ED.ink}, transparent)`,
              backgroundSize: "200% 100%", animation: "ed-shimmer 1.6s linear infinite",
            }}
          />
          <p
            className="ed-mono"
            style={{
              marginTop: 18, fontSize: 11, letterSpacing: "0.18em",
              textTransform: "uppercase", color: ED.inkFaint,
            }}
          >
            Setting the type…
          </p>
          <style>{`@keyframes ed-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        </div>
      </div>
    );
  }

  const { vol, no } = volAndNo();
  const notifCount = notifications?.length || 0;
  const reader = displayName || "Reader";

  /* ─── In-this-issue table of contents ─── */
  const issueIndex = [
    { id: "notes",        n: "01", name: "Notes",         caption: `${notes.length} this week`,         to: "/dashboard/notes" },
    { id: "voice",        n: "02", name: "Voice notes",   caption: "Transcribe & search",                to: "/dashboard/voice-notes" },
    { id: "documents",    n: "03", name: "Documents",     caption: `${docs.length} in archive`,          to: "/dashboard/documents" },
    { id: "ai-lab",       n: "04", name: "AI Lab",        caption: "Pro tools",                          to: "/dashboard/ai-lab" },
    { id: "activity",     n: "05", name: "Activity",      caption: "Your history",                       to: "/dashboard/activity" },
    { id: "integrations", n: "06", name: "Integrations",  caption: "Connect apps",                       to: "/dashboard/integrations" },
    { id: "settings",     n: "07", name: "Settings",      caption: "Configure workspace",                to: "/dashboard/settings" },
  ];

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="ns-ed">
      <DashScopedStyles />

      <div style={{ paddingBottom: "calc(var(--mobile-nav-height, 0px) + 64px)" }}>

        {/* ━━━━━━━━━━━━━━ DATELINE — page-level, sits under the
            global Sidebar masthead and acts as the dashboard's
            own issue marker. ━━━━━━━━━━━━━━ */}
        <div className="ed-dateline" style={{ paddingTop: 18 }}>
          <span className="ed-mono">VOL. {vol} · NO. {no}</span>
          <span className="ed-mono">{issueLine()}</span>
          <span className="ed-mono">
            <span className="ed-status-dot" /> ALL SYSTEMS QUIET
          </span>
        </div>

        <hr className="ed-rule" />

        {/* ━━━━━━━━━━━━━━ COVER STORY ━━━━━━━━━━━━━━ */}
        <section className="ed-cover ed-reveal">
          <div className="ed-cover-body">
            <div className="ed-chapter">
              <span className="num">№ 01</span>
              <span>— THE COVER STORY</span>
            </div>

            <h1
              className="ed-display"
              style={{ fontSize: "clamp(48px, 6vw, 88px)", marginTop: 28, marginBottom: 0, paddingBottom: "0.06em" }}
            >
              {getGreeting()},{" "}
              <span className="ed-italic" style={{ color: ED.accent }}>
                {reader}
              </span>
              .
            </h1>

            <p className="ed-lede" style={{ marginTop: 36, maxWidth: 760 }}>
              <CoverLede
                notesCount={notes.length}
                docsCount={docs.length}
                favCount={favoritedNotes}
                aiToday={aiUses}
              />
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 28 }}>
              <span className="ed-chip">{streakDays}D STREAK</span>
              <span className="ed-chip">{notesCreated} NOTES</span>
              <span className="ed-chip">{aiUses} AI TODAY</span>
              {favoritedNotes > 0 && (
                <span className="ed-chip-accent ed-chip">{favoritedNotes} FAVOURITES</span>
              )}
            </div>
          </div>

          <aside className="ed-cover-margin">
            <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint, marginBottom: 14 }}>
              <span style={{ color: ED.accent, fontFamily: ED.serif, fontStyle: "italic", fontSize: 13, marginRight: 6 }}>¹</span>
              FOOTNOTE
            </p>
            <p className="ed-serif" style={{ fontStyle: "italic", fontSize: 15, lineHeight: 1.55, color: ED.inkMute }}>
              The dashboard reads your archive every morning — notes from the
              past week, voice memos waiting to be transcribed, and any
              question you've asked of the model — so you can pick up exactly
              where the thinking trailed off.
            </p>
          </aside>
        </section>

        {/* ━━━━━━━━━━━━━━ STAT STRIP ━━━━━━━━━━━━━━ */}
        <section style={{ marginTop: 56 }}>
          <div className="ed-stat-strip ed-card">
            <StatCell eyebrow="TOTAL NOTES"     value={notesCreated}    sub={notes.length > 0 ? `+${notes.length} this week` : "—"} />
            <StatCell eyebrow="ACTIVE DAYS"     value={activeDays}      sub={`STREAK: ${streakDays}D`} />
            <StatCell eyebrow="AI USED TODAY"   value={aiUses}          sub={aiUsesLoading ? "syncing…" : "calls"} />
            <StatCell eyebrow="FAVOURITES"      value={favoritedNotes}  sub={favoritedNotes > 0 ? "in this issue" : "none yet"} last />
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━ BEGIN-A-NEW-NOTE CTA ━━━━━━━━━━━━━━ */}
        <section style={{ margin: "96px 0", textAlign: "center" }}>
          <button
            className="ed-btn ed-btn-primary"
            onClick={() => navigate("/dashboard/notes")}
            style={{ fontSize: 15, padding: "13px 24px" }}
          >
            Begin a new note <FiArrowRight size={15} />
          </button>
          <div style={{ marginTop: 18 }}>
            <button
              className="ed-ulink ed-serif ed-italic"
              onClick={() => navigate("/dashboard/documents")}
              style={{ fontSize: 16, color: ED.inkMute, background: "transparent" }}
            >
              or upload a document
            </button>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━ IN THIS ISSUE — TABLE OF CONTENTS ━━━━━━━━━━━━━━ */}
        <section style={{ marginTop: 96 }}>
          <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div className="ed-chapter">
              <span className="num">§ 02</span>
              <span>— IN THIS ISSUE</span>
            </div>
            <p className="ed-mono" style={{ fontSize: 11, color: ED.inkFaint, letterSpacing: "0.14em", textTransform: "uppercase" }}>
              SEVEN SECTIONS · {issueIndex.length * 1} ROUTES
            </p>
          </header>

          <hr className="ed-rule-dbl" />

          <ul className="ed-toc">
            {issueIndex.map((row) => (
              <li key={row.id}>
                <Link to={row.to} className="ed-toc-row">
                  <span className="ed-mono ed-toc-ord">{row.n}</span>
                  <span className="ed-serif ed-toc-name">{row.name}</span>
                  <span className="ed-toc-leader" aria-hidden />
                  <span className="ed-mono ed-toc-cap">{row.caption}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ━━━━━━━━━━━━━━ RECENT NOTES + DOCS ━━━━━━━━━━━━━━ */}
        <section style={{ marginTop: 96, display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", gap: 56 }} className="ed-two-col">
          {/* Recent notes */}
          <div>
            <div className="ed-chapter" style={{ marginBottom: 18 }}>
              <span className="num">§ 03</span>
              <span>— RECENT DISPATCHES</span>
            </div>
            <hr className="ed-rule" />
            {recentNotes.length === 0 ? (
              <p className="ed-serif ed-italic" style={{ padding: "32px 0", color: ED.inkMute, fontSize: 18 }}>
                No notes this week. The archive begins with one.
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {recentNotes.map((note, i) => (
                  <li key={note.id}>
                    <button
                      onClick={() => navigate(`/dashboard/notes/${note.id}`)}
                      className="ed-dispatch"
                    >
                      <span className="ed-mono ed-dispatch-ord">{String(i + 1).padStart(2, "0")}</span>
                      <div className="ed-dispatch-body">
                        <p className="ed-serif ed-dispatch-title">{note.title}</p>
                        <p className="ed-mono ed-dispatch-meta">
                          {note.updated}
                          {note.hasAI && <span className="ed-chip-accent ed-chip" style={{ marginLeft: 10 }}>READ BY MODEL</span>}
                        </p>
                      </div>
                    </button>
                    <hr className="ed-rule-soft" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent documents */}
          <div>
            <div className="ed-chapter" style={{ marginBottom: 18 }}>
              <span className="num">§ 04</span>
              <span>— DOCUMENTS</span>
            </div>
            <hr className="ed-rule" />
            {recentDocs.length === 0 ? (
              <p className="ed-serif ed-italic" style={{ padding: "32px 0", color: ED.inkMute, fontSize: 18 }}>
                No documents yet. The archive begins with one.
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {recentDocs.map((doc, i) => (
                  <li key={doc.id}>
                    <button
                      onClick={() => navigate(`/dashboard/documents/${doc.id}`)}
                      className="ed-dispatch"
                    >
                      <span className="ed-mono ed-dispatch-ord">{String(i + 1).padStart(2, "0")}</span>
                      <div className="ed-dispatch-body">
                        <p className="ed-serif ed-dispatch-title">{doc.name || "Untitled document"}</p>
                        <p className="ed-mono ed-dispatch-meta">
                          {(doc.type || "FILE").toString().toUpperCase()} · {doc.status || "—"}
                        </p>
                      </div>
                    </button>
                    <hr className="ed-rule-soft" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━ WEEKLY DIGEST INLINE ━━━━━━━━━━━━━━ */}
        {settings.weeklyDigest && digest && (
          <section style={{ marginTop: 96 }}>
            <div className="ed-chapter" style={{ marginBottom: 18 }}>
              <span className="num">§ 05</span>
              <span>— THE WEEKLY DIGEST</span>
            </div>
            <hr className="ed-rule-dbl" />

            <div className="ed-digest">
              <div className="ed-digest-left">
                <p className="ed-mono" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint }}>
                  {digest.period.start} — {digest.period.end}
                </p>
                <h2 className="ed-display ed-dropcap" style={{ fontSize: "clamp(28px, 3vw, 40px)", marginTop: 18, paddingBottom: "0.06em" }}>
                  Seven days of thinking, laid out.
                </h2>
                <p className="ed-serif" style={{ fontSize: 17, color: ED.inkMute, marginTop: 28, lineHeight: 1.55 }}>
                  {notes.length} notes, {docs.length} documents, {digest.stats.synthesizedDocs} pieces
                  synthesised by the model. Productivity reads{" "}
                  <span className="ed-italic" style={{ color: ED.accent }}>
                    {String(digest.insights.productivity).toLowerCase()}
                  </span>
                  .
                </p>
                <button
                  className="ed-ulink"
                  style={{ marginTop: 22, fontFamily: ED.mono, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: ED.ink, background: "transparent" }}
                  onClick={() => setShowDigest(true)}
                >
                  Open the full report →
                </button>
              </div>

              <div className="ed-digest-right">
                <DigestRow label="Notes (7d)"     value={notes.length} />
                <DigestRow label="Documents (7d)" value={docs.length} />
                <DigestRow label="Favourites"     value={favoritedNotes} />
                <DigestRow label="Synthesised"    value={digest.stats.synthesizedDocs} />
                <DigestRow label="Most active"    value={digest.insights.mostActiveDay} mono last />
              </div>
            </div>
          </section>
        )}

        {/* ━━━━━━━━━━━━━━ COLOPHON ━━━━━━━━━━━━━━ */}
        <footer style={{ marginTop: 120, paddingBottom: 24 }}>
          <hr className="ed-rule" />
          <div className="ed-colophon">
            <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint }}>
              Set in Instrument Serif &amp; Geist · Printed daily for one reader
            </p>
            <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint }}>
              NOTESTREAM · VOL. {vol} · NO. {no}
            </p>
          </div>
        </footer>

        {/* ━━━━━━━━━━━━━━ MODALS ━━━━━━━━━━━━━━ */}

        {/* NOTIFICATIONS */}
        {showNotifications && (
          <EdModal onClose={() => setShowNotifications(false)} title="Smart notifications" subtitle={`${notifications.length} total`}>
            {notifications.length === 0 ? (
              <p className="ed-serif ed-italic" style={{ padding: "40px 4px", textAlign: "center", color: ED.inkMute, fontSize: 18 }}>
                All caught up. Nothing waits.
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {notifications.map((notif, i) => (
                  <li key={notif.id}>
                    <div className="ed-notif">
                      <span className="ed-mono ed-notif-ord">{String(i + 1).padStart(2, "0")}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="ed-serif" style={{ fontSize: 17, lineHeight: 1.4, color: ED.ink }}>
                          {notif.message}
                        </p>
                        <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: ED.inkFaint, marginTop: 6 }}>
                          From: {notif.noteTitle} · {notif.priority}
                        </p>
                      </div>
                      <button onClick={() => dismissNotification(notif.id)} className="ed-mono" style={{ fontSize: 10.5, color: ED.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent" }}>
                        Dismiss
                      </button>
                    </div>
                    <hr className="ed-rule-soft" />
                  </li>
                ))}
              </ul>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => { clearAllNotifications(); setShowNotifications(false); }}
                className="ed-btn ed-btn-ghost"
                style={{ width: "100%", marginTop: 24, justifyContent: "center" }}
              >
                Clear all
              </button>
            )}
          </EdModal>
        )}

        {/* WEEKLY DIGEST FULL */}
        {showDigest && !!digest && (
          <EdModal onClose={() => setShowDigest(false)} title="The weekly digest" subtitle={`${digest.period.start} — ${digest.period.end}`}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 0 }}>
              <DigestRow label="Notes (7d)"     value={notes.length} />
              <DigestRow label="Documents (7d)" value={docs.length} />
              <DigestRow label="Favourites"     value={favoritedNotes} />
              <DigestRow label="Synthesised"    value={digest.stats.synthesizedDocs} />
            </div>

            <hr className="ed-rule" style={{ margin: "24px 0" }} />

            <p className="ed-mono" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint, marginBottom: 10 }}>
              INSIGHTS
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <DigestRow label="Most active day" value={digest.insights.mostActiveDay || "—"} mono />
              <DigestRow label="Productivity"    value={digest.insights.productivity || "—"} accent={digest.insights.productivity === "High"} />
              <DigestRow label="Total items"     value={digest.stats.totalItems || 0} />
              <DigestRow label="Streak"          value={`${streakDays} / 30`} mono last />
            </ul>

            {!!digest.insights.topTags?.length && (
              <>
                <hr className="ed-rule" style={{ margin: "24px 0" }} />
                <p className="ed-mono" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint, marginBottom: 12 }}>
                  TOP TAGS
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {digest.insights.topTags.map((t, i) => (
                    <span key={`${t.tag}-${i}`} className="ed-chip">
                      {t.tag} <span style={{ color: ED.inkFaint, marginLeft: 4 }}>({t.count})</span>
                    </span>
                  ))}
                </div>
              </>
            )}

            {!!digest.highlights?.length && (
              <>
                <hr className="ed-rule" style={{ margin: "24px 0" }} />
                <p className="ed-mono" style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint, marginBottom: 12 }}>
                  HIGHLIGHTS
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {digest.highlights.map((h, i) => (
                    <li key={h.id} className="ed-serif" style={{ display: "flex", gap: 12, padding: "6px 0", fontSize: 16, color: ED.inkSoft }}>
                      <span className="ed-mono" style={{ color: ED.accent, fontStyle: "italic", fontFamily: ED.serif, fontSize: 18, width: 28 }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{h.title}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <button
              onClick={() => setShowDigest(false)}
              className="ed-btn ed-btn-ghost"
              style={{ width: "100%", marginTop: 28, justifyContent: "center" }}
            >
              Close
            </button>
          </EdModal>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════ */

/* ─── Cover-story lede sentence — composed from real data ─── */
const CoverLede = ({ notesCount, docsCount, favCount, aiToday }) => {
  if (notesCount === 0 && docsCount === 0) {
    return (
      <>
        A quiet archive today.{" "}
        <span className="ed-italic">Start where the thinking last trailed off.</span>
      </>
    );
  }
  const noteBit = notesCount > 0 ? `${notesCount} ${notesCount === 1 ? "note" : "notes"} from the week,` : "";
  const docBit  = docsCount > 0  ? ` ${docsCount} ${docsCount === 1 ? "document" : "documents"} on the desk,` : "";
  const favBit  = favCount > 0   ? ` ${favCount} marked for keeping,` : "";
  const aiBit   = aiToday > 0    ? ` and the model has been asked ${aiToday} ${aiToday === 1 ? "question" : "questions"} so far today.` : " and a clean morning ahead of the model.";
  return <>{noteBit}{docBit}{favBit}{aiBit}</>;
};

/* ─── Stat strip cell ─── */
const StatCell = ({ eyebrow, value, sub, last = false }) => (
  <div className={`ed-stat-cell ${last ? "is-last" : ""}`}>
    <p className="ed-mono ed-stat-eyebrow">{eyebrow}</p>
    <p className="ed-display ed-italic ed-stat-value">
      {typeof value === "number" ? value : Number(value ?? 0) || 0}
    </p>
    {sub && <p className="ed-mono ed-stat-sub">{sub}</p>}
  </div>
);

/* ─── Digest row (label / dotted / value) ─── */
const DigestRow = ({ label, value, mono = false, accent = false, last = false }) => (
  <div className={`ed-digest-row ${last ? "is-last" : ""}`}>
    <span className="ed-mono ed-digest-label">{label}</span>
    <span className="ed-digest-leader" aria-hidden />
    <span
      className={mono ? "ed-mono" : "ed-serif ed-italic"}
      style={{
        fontSize: mono ? 12 : 22,
        color: accent ? ED.accent : ED.ink,
        letterSpacing: mono ? "0.06em" : 0,
      }}
    >
      {value}
    </span>
  </div>
);

/* ─── Editorial modal ─── */
const EdModal = ({ children, title, subtitle, onClose }) => (
  <div
    role="dialog"
    aria-modal="true"
    style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(19,16,8,0.32)", padding: 20, overflowY: "auto",
    }}
    onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div className="ed-card" style={{ width: "100%", maxWidth: 580, padding: 28 }}>
      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
        <div>
          <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint }}>
            <span style={{ color: ED.accent, fontFamily: ED.serif, fontStyle: "italic", fontSize: 13, marginRight: 6 }}>№</span>
            DISPATCH
          </p>
          <h2 className="ed-serif" style={{ fontSize: 28, marginTop: 4, color: ED.ink }}>{title}</h2>
          {subtitle && <p className="ed-mono" style={{ fontSize: 11, color: ED.inkFaint, marginTop: 4, letterSpacing: "0.06em" }}>{subtitle}</p>}
        </div>
        <button onClick={onClose} className="ed-icon-btn" aria-label="Close">
          <FiX size={14} />
        </button>
      </header>
      <hr className="ed-rule" />
      <div style={{ marginTop: 20, maxHeight: "70vh", overflowY: "auto" }}>{children}</div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
   SCOPED CSS for editorial dashboard chrome
═══════════════════════════════════════════════════════ */
const DashScopedStyles = () => (
  <style>{`
    .ns-ed .ed-masthead {
      display: grid;
      grid-template-columns: 1fr minmax(280px, 520px) 1fr;
      align-items: center;
      gap: 24px;
      padding: 18px 0 16px 0;
    }
    .ns-ed .ed-masthead-left  { display: flex; align-items: baseline; }
    .ns-ed .ed-masthead-right { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
    .ns-ed .ed-wordmark { display: inline-flex; align-items: baseline; color: ${ED.ink}; }

    .ns-ed .ed-search {
      display: flex; align-items: center; gap: 10px;
      background: ${ED.paper50};
      border: 1px solid ${ED.rule};
      border-radius: 999px;
      padding: 9px 14px;
      transition: border-color .2s ease;
    }
    .ns-ed .ed-search:focus-within { border-color: ${ED.ink}; }
    .ns-ed .ed-kbd {
      font-size: 10px; padding: 2px 6px; border: 1px solid ${ED.rule};
      border-radius: 4px; color: ${ED.inkFaint}; background: ${ED.paper100};
    }

    .ns-ed .ed-icon-btn {
      position: relative;
      height: 36px; width: 36px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid ${ED.rule}; color: ${ED.inkSoft};
      background: transparent;
      transition: color .18s ease, border-color .18s ease;
    }
    .ns-ed .ed-icon-btn:hover { color: ${ED.ink}; border-color: ${ED.ink}; }
    .ns-ed .ed-icon-dot {
      position: absolute; top: 6px; right: 6px;
      width: 6px; height: 6px; border-radius: 999px; background: ${ED.accent};
    }

    .ns-ed .ed-dateline {
      display: flex; align-items: center; justify-content: space-between;
      padding: 11px 0;
      font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
      color: ${ED.inkFaint};
      gap: 16px; flex-wrap: wrap;
    }
    .ns-ed .ed-status-dot {
      display: inline-block; width: 6px; height: 6px; border-radius: 999px;
      background: ${ED.accent}; margin-right: 8px;
      animation: ed-pulse 2.4s ease-in-out infinite;
    }

    /* ── Cover story grid ── */
    .ns-ed .ed-cover {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 280px;
      gap: 64px;
      padding: 56px 0 8px 0;
    }
    .ns-ed .ed-cover-margin {
      border-left: 1px solid ${ED.rule};
      padding-left: 24px;
    }
    @media (max-width: 960px) {
      .ns-ed .ed-cover { grid-template-columns: 1fr; gap: 32px; }
      .ns-ed .ed-cover-margin { border-left: 0; border-top: 1px solid ${ED.rule}; padding-left: 0; padding-top: 20px; }
    }

    /* ── Stat strip ── */
    .ns-ed .ed-stat-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      padding: 0;
    }
    .ns-ed .ed-stat-cell {
      padding: 28px 24px;
      border-right: 1px solid ${ED.rule};
    }
    .ns-ed .ed-stat-cell.is-last { border-right: 0; }
    .ns-ed .ed-stat-eyebrow {
      font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
      color: ${ED.inkFaint}; font-weight: 500;
    }
    .ns-ed .ed-stat-value {
      font-size: clamp(40px, 4.5vw, 64px);
      line-height: 1;
      color: ${ED.accent};
      margin-top: 12px;
      font-variant-numeric: oldstyle-nums;
    }
    .ns-ed .ed-stat-sub {
      font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase;
      color: ${ED.inkFaint}; margin-top: 10px;
    }
    @media (max-width: 760px) {
      .ns-ed .ed-stat-strip { grid-template-columns: repeat(2, 1fr); }
      .ns-ed .ed-stat-cell:nth-child(2) { border-right: 0; }
      .ns-ed .ed-stat-cell:nth-child(1),
      .ns-ed .ed-stat-cell:nth-child(2) { border-bottom: 1px solid ${ED.rule}; }
    }

    /* ── In this issue (TOC) ── */
    .ns-ed .ed-toc { list-style: none; padding: 0; margin: 0; }
    .ns-ed .ed-toc-row {
      display: grid;
      grid-template-columns: 44px minmax(0, auto) 1fr auto;
      align-items: baseline;
      gap: 16px;
      padding: 16px 12px;
      color: ${ED.ink};
      border-bottom: 1px solid ${ED.ruleSoft};
      transition: background-color .15s ease, padding .15s ease;
    }
    .ns-ed .ed-toc-row:hover {
      background: ${ED.paper150};
      padding-left: 18px;
    }
    .ns-ed .ed-toc-row:hover .ed-toc-ord {
      color: ${ED.accent};
      font-style: italic;
      font-family: ${ED.serif};
      font-size: 17px;
    }
    .ns-ed .ed-toc-ord {
      font-size: 11px; letter-spacing: 0.14em; color: ${ED.inkFaint};
      transition: all .15s ease;
    }
    .ns-ed .ed-toc-name { font-size: clamp(22px, 2.2vw, 30px); color: ${ED.ink}; }
    .ns-ed .ed-toc-leader {
      border-bottom: 1px dotted ${ED.rule};
      align-self: end;
      height: 14px;
      transform: translateY(-5px);
    }
    .ns-ed .ed-toc-cap {
      font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
      color: ${ED.inkFaint};
    }

    /* ── Dispatch rows (recent notes / docs) ── */
    .ns-ed .ed-dispatch {
      display: grid;
      grid-template-columns: 44px 1fr;
      gap: 16px;
      width: 100%;
      text-align: left;
      padding: 16px 0;
      align-items: baseline;
      background: transparent;
      transition: padding-left .15s ease;
    }
    .ns-ed .ed-dispatch:hover { padding-left: 4px; }
    .ns-ed .ed-dispatch-ord {
      font-size: 11px; letter-spacing: 0.14em; color: ${ED.inkFaint};
    }
    .ns-ed .ed-dispatch:hover .ed-dispatch-ord {
      color: ${ED.accent}; font-family: ${ED.serif}; font-style: italic; font-size: 17px;
    }
    .ns-ed .ed-dispatch-body { min-width: 0; }
    .ns-ed .ed-dispatch-title {
      font-size: clamp(18px, 1.6vw, 22px);
      line-height: 1.25;
      color: ${ED.ink};
      margin: 0;
      transition: color .15s ease;
    }
    .ns-ed .ed-dispatch:hover .ed-dispatch-title { color: ${ED.accent}; }
    .ns-ed .ed-dispatch-meta {
      font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase;
      color: ${ED.inkFaint}; margin-top: 6px;
    }

    /* ── Two-column section collapse ── */
    @media (max-width: 960px) {
      .ns-ed .ed-two-col { grid-template-columns: 1fr !important; gap: 56px !important; }
    }

    /* ── Weekly digest grid ── */
    .ns-ed .ed-digest {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
      gap: 48px;
      padding-top: 36px;
    }
    @media (max-width: 960px) {
      .ns-ed .ed-digest { grid-template-columns: 1fr; gap: 32px; }
    }

    .ns-ed .ed-digest-row {
      display: grid;
      grid-template-columns: minmax(0, auto) 1fr minmax(0, auto);
      align-items: baseline;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid ${ED.ruleSoft};
    }
    .ns-ed .ed-digest-row.is-last { border-bottom: 0; }
    .ns-ed .ed-digest-label {
      font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase;
      color: ${ED.inkFaint};
    }
    .ns-ed .ed-digest-leader {
      border-bottom: 1px dotted ${ED.rule};
      align-self: end;
      height: 12px;
      transform: translateY(-4px);
    }

    /* ── Notification list rows ── */
    .ns-ed .ed-notif {
      display: grid;
      grid-template-columns: 36px 1fr auto;
      gap: 14px;
      padding: 14px 0;
      align-items: baseline;
    }
    .ns-ed .ed-notif-ord {
      font-size: 11px; letter-spacing: 0.14em; color: ${ED.accent};
      font-family: ${ED.serif}; font-style: italic; font-size: 15px;
    }

    /* ── Colophon ── */
    .ns-ed .ed-colophon {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px 0 0 0; gap: 16px; flex-wrap: wrap;
    }

    /* ── Mobile masthead collapse ── */
    @media (max-width: 720px) {
      .ns-ed .ed-masthead {
        grid-template-columns: 1fr auto;
        gap: 12px;
      }
      .ns-ed .ed-masthead-center { grid-column: 1 / -1; order: 3; }
    }
  `}</style>
);
