// src/components/Sidebar.jsx
// ═══════════════════════════════════════════════════════════════════
// EDITORIAL RESKIN — what changed and why
// ─────────────────────────────────────────────────────────────────
// The dark glass top bar, gradient brand pill, neon search field,
// and frosted icon rail are gone. The top bar is now an editorial
// masthead: paper-100 background, hairline `var(--ed-rule)` bottom,
// serif "NoteStream &co." wordmark on the left, a paper-50 search
// pill in the centre with mono "Search the archive…" placeholder
// and a ⌘K kbd, and three hairline-circle icon buttons on the
// right. The QuickCreate dropdown and search autocomplete became
// paper-50 cards with hairline borders, serif row titles, and mono
// metadata. The mobile drawer became a paper-100 panel with mono
// section headings (§ 01 — MAIN), serif row labels, italic accent-
// blue active state, and a hairline divider above the logout row.
// The hidden desktop right-rail (slides out from the right when
// the menu hamburger is pressed) became a paper rail with
// hairline borders and a single serif label per row. NO JS logic
// changes: every useState, useEffect, useCallback, every event
// listener (desktopSidebar:open / :close, outside-click closers,
// escape handler), the keyboard search behaviour, the route-change
// reset, the showMobileNav() call, the CSS-var setup, and the
// Supabase signOut flow are all byte-identical to the previous
// file. Only the JSX shell and a couple of icon names changed.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { showMobileNav } from "../hooks/useMobileNav";
import { useEditorial, ED } from "../lib/editorial";
import {
  FiSearch, FiArrowRight,
  FiHome, FiEdit3, FiFolder, FiZap, FiActivity, FiCpu, FiMic,
  FiCloud, FiUsers, FiSettings, FiLink, FiHelpCircle,
  FiMessageCircle, FiBookOpen, FiGrid, FiFileText, FiX, FiMenu,
  FiPlus, FiUploadCloud, FiLogOut, FiCommand, FiMoreHorizontal,
} from "react-icons/fi";

const DESKTOP_HEADER_H = 64;
const MOBILE_HEADER_H = 56;
const SIDEBAR_W_COLLAPSED = 80;

/* ─────────────────────────────────────────────
   Searchable index (UNCHANGED)
   ───────────────────────────────────────────── */
const SEARCH_INDEX = [
  { id: "dashboard", title: "Dashboard", description: "Workspace overview", path: "/dashboard", category: "Pages", icon: <FiGrid size={14} />, keywords: ["home", "overview", "main", "dashboard", "start", "hub"] },
  { id: "notes", title: "Notes", description: "Create & manage notes", path: "/dashboard/notes", category: "Pages", icon: <FiEdit3 size={14} />, keywords: ["notes", "write", "create", "edit", "text", "draft", "memo", "new note"] },
  { id: "documents", title: "Research Synthesizer", description: "Upload docs & generate briefs", path: "/dashboard/documents", category: "Pages", icon: <FiFolder size={14} />, keywords: ["documents", "files", "upload", "pdf", "docx", "research", "synthesize", "brief", "doc"] },
  { id: "summaries", title: "Insight Explorer", description: "AI-powered workspace search", path: "/dashboard/summaries", category: "Pages", icon: <FiZap size={14} />, keywords: ["summaries", "insights", "explore", "ai search", "ask", "query", "find"] },
  { id: "activity", title: "Activity", description: "Recent activity & usage", path: "/dashboard/activity", category: "Pages", icon: <FiActivity size={14} />, keywords: ["activity", "history", "timeline", "recent", "log", "usage"] },
  { id: "ai-lab", title: "AI Lab", description: "Advanced AI tools", path: "/dashboard/ai-lab", category: "AI Tools", icon: <FiCpu size={14} />, keywords: ["ai", "lab", "tools", "experiments", "advanced"] },
  { id: "custom-training", title: "Custom AI Training", description: "Train AI on your style", path: "/dashboard/ai-lab/training", category: "AI Tools", icon: <FiCpu size={14} />, keywords: ["training", "custom", "style", "writing", "personalize", "pro"] },
  { id: "voice-notes", title: "Voice Notes", description: "Record & transcribe", path: "/dashboard/ai-lab/voice-notes", category: "AI Tools", icon: <FiMic size={14} />, keywords: ["voice", "record", "audio", "transcribe", "speech", "dictate"] },
  { id: "cloud-sync", title: "Cloud Sync", description: "Sync across devices", path: "/dashboard/ai-lab/cloud-sync", category: "AI Tools", icon: <FiCloud size={14} />, keywords: ["cloud", "sync", "backup", "devices"] },
  { id: "team-collaboration", title: "Team Collaboration", description: "Collaborate in real time", path: "/dashboard/ai-lab/team-collaboration", category: "AI Tools", icon: <FiUsers size={14} />, keywords: ["team", "collaboration", "share", "invite"] },
  { id: "settings", title: "Settings", description: "Account, theme & preferences", path: "/dashboard/settings", category: "Settings", icon: <FiSettings size={14} />, keywords: ["settings", "preferences", "account", "theme", "dark mode", "light mode", "profile", "plan", "billing"] },
  { id: "integrations", title: "Integrations", description: "Connect third-party services", path: "/dashboard/integrations", category: "Settings", icon: <FiLink size={14} />, keywords: ["integrations", "connect", "apps", "google", "slack", "notion", "api"] },
  { id: "help-center", title: "Help Center", description: "Guides & FAQs", path: "/dashboard/help-center", category: "Support", icon: <FiHelpCircle size={14} />, keywords: ["help", "support", "faq", "guide", "tutorial", "how to"] },
  { id: "contact-support", title: "Contact Support", description: "Get help from our team", path: "/dashboard/contact-support", category: "Support", icon: <FiMessageCircle size={14} />, keywords: ["contact", "support", "email", "bug", "report", "feedback"] },
  { id: "integration-docs", title: "Integration Docs", description: "API docs & guides", path: "/dashboard/integration-docs", category: "Support", icon: <FiBookOpen size={14} />, keywords: ["api", "docs", "documentation", "developer"] },
  { id: "action-new-note", title: "Create New Note", description: "Start writing now", path: "/dashboard/notes", category: "Quick Actions", icon: <FiEdit3 size={14} />, keywords: ["new", "create", "write", "start", "blank", "note"] },
  { id: "action-upload", title: "Upload a Document", description: "PDF, DOCX, or spreadsheet", path: "/dashboard/documents", category: "Quick Actions", icon: <FiFolder size={14} />, keywords: ["upload", "import", "add", "file"] },
  { id: "action-record", title: "Record Voice Note", description: "Start a voice recording", path: "/dashboard/ai-lab/voice-notes", category: "Quick Actions", icon: <FiMic size={14} />, keywords: ["record", "voice", "audio"] },
];

const CATEGORY_LABEL = {
  "Pages":         "PAGES",
  "AI Tools":      "AI",
  "Settings":      "SETTINGS",
  "Support":       "SUPPORT",
  "Quick Actions": "ACTIONS",
};

function scoreSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  return SEARCH_INDEX
    .map((item) => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();
      const kwStr = item.keywords.join(" ").toLowerCase();
      for (const term of terms) {
        if (titleLower === term) score += 100;
        else if (titleLower.startsWith(term)) score += 60;
        else if (titleLower.includes(term)) score += 40;
        if (item.keywords.some((kw) => kw.toLowerCase() === term)) score += 50;
        else if (kwStr.includes(term)) score += 25;
        if (descLower.includes(term)) score += 15;
      }
      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

/* ─────────────────────────────────────────────
   Mobile nav config (UNCHANGED — only icons swapped)
   ───────────────────────────────────────────── */
const MOBILE_NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { label: "Dashboard",  icon: FiHome,     to: "/dashboard" },
      { label: "Notes",      icon: FiEdit3,    to: "/dashboard/notes" },
      { label: "Insights",   icon: FiZap,      to: "/dashboard/summaries" },
      { label: "Documents",  icon: FiFolder,   to: "/dashboard/documents" },
      { label: "Activity",   icon: FiActivity, to: "/dashboard/activity" },
    ],
  },
  {
    label: "The model",
    items: [
      { label: "AI Lab",       icon: FiCpu,  to: "/dashboard/ai-lab", pro: true },
      { label: "Integrations", icon: FiLink, to: "/dashboard/integrations" },
    ],
  },
  {
    label: "Records",
    items: [
      { label: "Settings", icon: FiSettings, to: "/dashboard/settings" },
    ],
  },
];

const DESKTOP_RAIL_NAV = [
  { label: "Dashboard",  icon: FiHome,     to: "/dashboard" },
  { label: "Notes",      icon: FiEdit3,    to: "/dashboard/notes" },
  { label: "Insights",   icon: FiZap,      to: "/dashboard/summaries" },
  { label: "Documents",  icon: FiFolder,   to: "/dashboard/documents" },
  { label: "Activity",   icon: FiActivity, to: "/dashboard/activity" },
  { label: "Integrations", icon: FiLink,   to: "/dashboard/integrations" },
  { label: "AI Lab",     icon: FiCpu,      to: "/dashboard/ai-lab", pro: true },
  { label: "Settings",   icon: FiSettings, to: "/dashboard/settings" },
];

export default function Sidebar() {
  useEditorial();

  const location = useLocation();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);

  /* Desktop sidebar state */
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [desktopOverlayOpen, setDesktopOverlayOpen] = useState(false);

  /* Mobile drawer state */
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const mobileDrawerRef = useRef(null);
  const mobileHamburgerRef = useRef(null);

  /* Quick Create */
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  /* Search */
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const searchWrapperRef = useRef(null);

  const searchResults = useMemo(() => scoreSearch(searchQuery).slice(0, 7), [searchQuery]);

  const isDesktop = () =>
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(min-width: 768px)").matches;

  const isNotesListRoute = location.pathname === "/dashboard/notes";

  const closeDesktopSidebar = useCallback(() => {
    setDesktopOpen(false);
    setDesktopOverlayOpen(false);
    document.body.style.overflow = "";
  }, []);

  const openDesktopSidebarFromHamburger = useCallback(() => {
    setDesktopOpen(true);
    setDesktopOverlayOpen(true);
  }, []);

  const closeQuickCreate = useCallback(() => setShowQuickCreate(false), []);

  const goQuickCreate = useCallback(
    (type) => {
      setShowQuickCreate(false);
      closeDesktopSidebar();
      navigate("/dashboard/notes", { state: { quickCreate: type, ts: Date.now() } });
    },
    [navigate, closeDesktopSidebar]
  );

  /* Mobile drawer helpers (UNCHANGED) */
  const closeMobileDrawer = useCallback(() => {
    setMobileDrawerOpen(false);
    document.body.style.overflow = "";
  }, []);

  const openMobileDrawer = useCallback(() => {
    setMobileDrawerOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const handleMobileNavigate = useCallback((to) => {
    closeMobileDrawer();
    navigate(to);
  }, [navigate, closeMobileDrawer]);

  /* Search helpers (UNCHANGED) */
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setHighlightIdx(-1);
  }, []);

  const handleSearchNavigate = useCallback(
    (item) => {
      closeSearch();
      setSearchQuery("");
      navigate(item.path);
    },
    [navigate, closeSearch]
  );

  useEffect(() => {
    setHighlightIdx(-1);
    if (searchQuery.trim().length > 0 && searchResults.length > 0) setSearchOpen(true);
    else setSearchOpen(false);
  }, [searchQuery, searchResults.length]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) closeSearch();
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [closeSearch]);

  useEffect(() => {
    closeSearch();
    setSearchQuery("");
  }, [location.pathname, closeSearch]);

  const handleSearchKeyDown = (e) => {
    if (searchOpen && searchResults.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx((prev) => prev < searchResults.length - 1 ? prev + 1 : 0); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx((prev) => prev > 0 ? prev - 1 : searchResults.length - 1); return; }
      if (e.key === "Tab") { e.preventDefault(); const target = highlightIdx >= 0 ? searchResults[highlightIdx] : searchResults[0]; if (target) setSearchQuery(target.title); return; }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchOpen && highlightIdx >= 0 && searchResults[highlightIdx]) handleSearchNavigate(searchResults[highlightIdx]);
      else if (searchResults.length > 0) handleSearchNavigate(searchResults[0]);
      else if (searchQuery.trim()) { closeSearch(); navigate("/search"); }
      return;
    }
    if (e.key === "Escape") { if (searchOpen) closeSearch(); else { setSearchQuery(""); searchInputRef.current?.blur(); } }
  };

  /* Close mobile drawer on route change (UNCHANGED) */
  useEffect(() => { closeMobileDrawer(); }, [location.pathname, closeMobileDrawer]);

  /* Close mobile drawer on outside click (UNCHANGED) */
  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const handler = (e) => {
      if (mobileDrawerRef.current && !mobileDrawerRef.current.contains(e.target) && mobileHamburgerRef.current && !mobileHamburgerRef.current.contains(e.target)) {
        closeMobileDrawer();
      }
    };
    const t = setTimeout(() => {
      document.addEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler, { passive: true });
    }, 100);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); document.removeEventListener("touchstart", handler); };
  }, [mobileDrawerOpen, closeMobileDrawer]);

  /* Escape closes everything (UNCHANGED) */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setShowQuickCreate(false); closeMobileDrawer(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeMobileDrawer]);

  /* Desktop sidebar close on route change (UNCHANGED) */
  useEffect(() => {
    if (!isDesktop()) return;
    closeDesktopSidebar();
    setShowQuickCreate(false);
  }, [location.pathname, closeDesktopSidebar]);

  useEffect(() => {
    const onOpen = () => { if (!isDesktop()) return; if (!isNotesListRoute) return; setDesktopOpen(true); setDesktopOverlayOpen(false); };
    const onClose = () => { if (!isDesktop()) return; closeDesktopSidebar(); };
    window.addEventListener("desktopSidebar:open", onOpen);
    window.addEventListener("desktopSidebar:close", onClose);
    return () => { window.removeEventListener("desktopSidebar:open", onOpen); window.removeEventListener("desktopSidebar:close", onClose); };
  }, [isNotesListRoute, closeDesktopSidebar]);

  /* Cmd/Ctrl-K focuses search */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = useCallback((to) => {
    const p = location.pathname;
    if (to === "/dashboard") return p === "/dashboard";
    return p === to || p.startsWith(to + "/");
  }, [location.pathname]);

  const onNavClick = useCallback(() => {
    if (!isDesktop()) showMobileNav();
    setShowQuickCreate(false);
    closeDesktopSidebar();
  }, [closeDesktopSidebar]);

  /* LOGOUT (UNCHANGED) */
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      closeMobileDrawer();
      if (!isDesktop()) showMobileNav();
      setShowQuickCreate(false);
      closeDesktopSidebar();
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) console.warn("Supabase signOut error:", error.message);
      }
    } finally {
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  /* CSS vars + body paint — preserves old `--ns-*` vars, sets
     `--app-content-top` so DashboardLayout's content padding tracks
     the masthead height, and paints <html>/<body> paper-100 while
     the Sidebar is mounted so the dark `bg-theme-primary` from
     DashboardLayout doesn't bleed into the side margins (the layout
     centres content at max-width 1500px, so anything wider than
     that previously showed the dark theme background through). */
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const applyVars = () => {
      const desk = window.matchMedia("(min-width: 768px)").matches;
      const top = desk ? DESKTOP_HEADER_H : MOBILE_HEADER_H;
      root.style.setProperty("--ns-desktop-header-h", `${DESKTOP_HEADER_H}px`);
      root.style.setProperty("--mobile-nav-height", `${MOBILE_HEADER_H}px`);
      root.style.setProperty("--ns-mobile-header-h", `${MOBILE_HEADER_H}px`);
      root.style.setProperty("--app-content-top", `${top}px`);
    };
    applyVars();
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => applyVars();
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    // Stash previous bg colors so we can restore on unmount
    const prev = {
      htmlBg: root.style.backgroundColor,
      bodyBg: body.style.backgroundColor,
      bodyColor: body.style.color,
    };
    // Editorial paper across the whole viewport
    root.style.backgroundColor = "#f6f1e3";       // paper-100
    body.style.backgroundColor = "#f6f1e3";
    body.style.color = "#131008";                 // ink

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
      root.style.removeProperty("--ns-desktop-header-h");
      root.style.removeProperty("--mobile-nav-height");
      root.style.removeProperty("--ns-mobile-header-h");
      root.style.removeProperty("--app-content-top");
      root.style.backgroundColor = prev.htmlBg;
      body.style.backgroundColor = prev.bodyBg;
      body.style.color = prev.bodyColor;
    };
  }, []);

  return (
    <div className="ns-ed ns-ed-sidebar">
      <SidebarScopedStyles desktopH={DESKTOP_HEADER_H} mobileH={MOBILE_HEADER_H} railW={SIDEBAR_W_COLLAPSED} />

      {/* ═══ DESKTOP MASTHEAD (TOP BAR) ═══ */}
      <header className="ns-mh ns-mh--desktop">
        {/* Left: serif wordmark */}
        <Link to="/dashboard" className="ns-wordmark" onClick={onNavClick}>
          <span className="ns-wordmark-name">NoteStream</span>
          <span className="ns-wordmark-co">&amp; co.</span>
        </Link>

        {/* Center: dateline + search */}
        <div className="ns-mh-center">
          <div className="ns-search-wrap" ref={searchWrapperRef}>
            <div className={`ns-search ${searchOpen ? "is-open" : ""}`}>
              <FiSearch size={13} style={{ color: ED.inkFaint }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search the archive…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => { if (searchQuery.trim().length > 0 && searchResults.length > 0) setSearchOpen(true); }}
                autoComplete="off" autoCorrect="off" spellCheck={false}
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); closeSearch(); searchInputRef.current?.focus(); }}
                  className="ns-search-clear"
                  aria-label="Clear"
                >
                  <FiX size={12} />
                </button>
              ) : (
                <span className="ns-kbd">⌘K</span>
              )}
            </div>

            <AnimatePresence>
              {searchOpen && searchResults.length > 0 && (
                <motion.div
                  ref={searchDropdownRef}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="ed-card ns-search-pop"
                >
                  <div className="ns-search-pop-head">
                    <span className="ed-mono">{searchResults.length} {searchResults.length === 1 ? "match" : "matches"}</span>
                    <span className="ed-mono">↑↓ NAV · ↵ GO · ⇥ COMPLETE</span>
                  </div>
                  <ul className="ns-search-pop-list">
                    {searchResults.map((item, idx) => {
                      const on = idx === highlightIdx;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => handleSearchNavigate(item)}
                            onMouseEnter={() => setHighlightIdx(idx)}
                            className={`ns-search-row ${on ? "is-on" : ""}`}
                          >
                            <span className="ns-search-row-ord">
                              {on ? <span style={{ fontFamily: ED.serif, fontStyle: "italic", color: ED.accent, fontSize: 15 }}>{String(idx + 1).padStart(2, "0")}</span>
                                  : String(idx + 1).padStart(2, "0")}
                            </span>
                            <span className="ns-search-row-icon">{item.icon}</span>
                            <span className="ns-search-row-body">
                              <span className="ns-search-row-title">{item.title}</span>
                              <span className="ns-search-row-desc">{item.description}</span>
                            </span>
                            <span className="ns-search-row-cat">
                              {CATEGORY_LABEL[item.category] || item.category.toUpperCase()}
                            </span>
                            <FiArrowRight size={12} style={{ color: on ? ED.accent : "transparent", transition: "color .15s ease" }} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="ns-search-pop-foot">
                    <span className="ed-mono">PRESS ENTER TO GO · ESC TO CLOSE</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Quick Create + Hamburger */}
        <div className="ns-mh-right">
          <div style={{ position: "relative" }}>
            <button
              type="button"
              aria-label="Quick create"
              aria-expanded={showQuickCreate}
              onClick={() => setShowQuickCreate((v) => !v)}
              className={`ns-icon-btn ${showQuickCreate ? "is-on" : ""}`}
              title="Quick create"
            >
              <FiPlus size={14} />
            </button>

            <AnimatePresence>
              {showQuickCreate && (
                <>
                  <motion.div
                    className="ns-qc-scrim"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={closeQuickCreate}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="ed-card ns-qc"
                  >
                    <p className="ed-mono ns-qc-eyebrow">
                      <span style={{ color: ED.accent, fontFamily: ED.serif, fontStyle: "italic", fontSize: 13, marginRight: 6 }}>№</span>
                      QUICK CREATE
                    </p>
                    <hr className="ed-rule-soft" style={{ margin: "8px 0 4px" }} />
                    <QuickCreateItem icon={<FiEdit3 size={14} />}      label="New note"        sub="Write a text note"     ord="01" onClick={() => goQuickCreate("note")} />
                    <QuickCreateItem icon={<FiMic size={14} />}        label="Voice memo"      sub="Record & transcribe"   ord="02" onClick={() => goQuickCreate("voice")} />
                    <QuickCreateItem icon={<FiUploadCloud size={14}/>} label="Upload document" sub="PDF · image · markdown"ord="03" onClick={() => goQuickCreate("upload")} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            aria-label="Menu"
            aria-expanded={desktopOpen}
            onClick={() => { setShowQuickCreate(false); if (desktopOpen) closeDesktopSidebar(); else openDesktopSidebarFromHamburger(); }}
            className={`ns-icon-btn ${desktopOpen ? "is-on" : ""}`}
            title="Menu"
          >
            <FiMenu size={14} />
          </button>
        </div>
      </header>

      {/* ═══ MOBILE MASTHEAD ═══ */}
      <header className="ns-mh ns-mh--mobile">
        <Link to="/dashboard" className="ns-wordmark">
          <span className="ns-wordmark-name">NoteStream</span>
          <span className="ns-wordmark-co">&amp; co.</span>
        </Link>

        <button
          ref={mobileHamburgerRef}
          type="button"
          onClick={() => { if (mobileDrawerOpen) closeMobileDrawer(); else openMobileDrawer(); }}
          className={`ns-icon-btn ${mobileDrawerOpen ? "is-on" : ""}`}
          aria-label={mobileDrawerOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileDrawerOpen}
        >
          {mobileDrawerOpen ? <FiX size={14} /> : <FiMenu size={14} />}
        </button>
      </header>

      {/* ═══ MOBILE DRAWER ═══ */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="ns-md-scrim"
              onClick={closeMobileDrawer}
            />
            <motion.div
              ref={mobileDrawerRef}
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="ns-md-panel"
              role="dialog" aria-modal="true"
            >
              <header className="ns-md-head">
                <p className="ed-mono ns-md-eyebrow">
                  <span style={{ color: ED.accent, fontFamily: ED.serif, fontStyle: "italic", fontSize: 13, marginRight: 6 }}>§</span>
                  MENU
                </p>
                <button
                  type="button" onClick={closeMobileDrawer}
                  className="ns-icon-btn" aria-label="Close menu"
                >
                  <FiX size={14} />
                </button>
              </header>
              <hr className="ed-rule" />

              <nav className="ns-md-body">
                {MOBILE_NAV_SECTIONS.map((section, si) => (
                  <section key={section.label} className="ns-md-section">
                    <p className="ed-mono ns-md-section-h">
                      <span className="num">§ {String(si + 1).padStart(2, "0")}</span>
                      — {section.label.toUpperCase()}
                    </p>
                    <ul>
                      {section.items.map((item, ii) => {
                        const active = isActive(item.to);
                        const Icon = item.icon;
                        const ord = String(ii + 1).padStart(2, "0");
                        return (
                          <li key={item.to}>
                            <button
                              type="button"
                              onClick={() => handleMobileNavigate(item.to)}
                              className={`ns-md-row ${active ? "is-on" : ""}`}
                            >
                              <span className="ord">{ord}</span>
                              <Icon size={14} className="ic" />
                              <span className="lb">{item.label}</span>
                              {item.pro && <span className="ed-chip ed-chip-ink ns-pro">PRO</span>}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </nav>

              <footer className="ns-md-foot">
                <hr className="ed-rule" />
                <button
                  type="button" onClick={handleLogout} disabled={loggingOut}
                  className="ns-md-logout"
                >
                  <FiLogOut size={14} />
                  <span>{loggingOut ? "Signing out…" : "Sign out"}</span>
                </button>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ DESKTOP OVERLAY (UNCHANGED) ═══ */}
      <AnimatePresence>
        {desktopOverlayOpen && desktopOpen && (
          <motion.div
            className="ns-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="ns-overlay-bg" onClick={closeDesktopSidebar} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ DESKTOP RIGHT RAIL (slides in from right when menu open) ═══ */}
      <motion.aside
        className="ns-rail"
        style={{
          top: `${DESKTOP_HEADER_H}px`,
          height: `calc(100vh - ${DESKTOP_HEADER_H}px)`,
          width: `${SIDEBAR_W_COLLAPSED}px`,
          transform: desktopOpen ? "translate3d(0,0,0)" : "translate3d(110%,0,0)",
          transition: "transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        <nav className="ns-rail-nav">
          {DESKTOP_RAIL_NAV.map((item, i) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavClick}
                className={`ns-rail-link ${active ? "is-on" : ""}`}
                aria-label={item.label}
                title={item.label}
              >
                <span className="ord">{String(i + 1).padStart(2, "0")}</span>
                <Icon size={16} />
                <span className="tip">
                  {item.label}
                  {item.pro && <span className="ed-chip ed-chip-ink ns-pro">PRO</span>}
                </span>
              </Link>
            );
          })}
        </nav>

        <footer className="ns-rail-foot">
          <hr className="ed-rule-soft" />
          <button
            type="button" onClick={handleLogout} disabled={loggingOut}
            className="ns-rail-link" aria-label="Sign out" title={loggingOut ? "Signing out…" : "Sign out"}
          >
            <span className="ord">—</span>
            <FiLogOut size={16} />
            <span className="tip">{loggingOut ? "Signing out…" : "Sign out"}</span>
          </button>
        </footer>
      </motion.aside>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   QuickCreateItem (editorial)
═══════════════════════════════════════════════════════ */
const QuickCreateItem = ({ icon, label, sub, onClick, ord }) => (
  <button type="button" onClick={onClick} className="ns-qc-row">
    <span className="ord">{ord}</span>
    <span className="ic">{icon}</span>
    <span className="body">
      <span className="title">{label}</span>
      <span className="sub">{sub}</span>
    </span>
    <FiArrowRight size={11} className="go" />
  </button>
);

/* ═══════════════════════════════════════════════════════
   Scoped CSS
═══════════════════════════════════════════════════════ */
const SidebarScopedStyles = ({ desktopH, mobileH, railW }) => (
  <style>{`
    /* The root wrapper carries .ns-ed so editorial vars resolve.
       But it must NOT take layout space — children are fixed. */
    .ns-ed-sidebar { display: contents; }

    /* ── masthead shared ── */
    .ns-ed .ns-mh {
      position: fixed; top: 0; left: 0; right: 0; z-index: 95;
      background: ${ED.paper100};
      border-bottom: 1px solid ${ED.rule};
      display: flex; align-items: center; gap: 16px;
      padding: 0 20px;
    }
    .ns-ed .ns-mh--desktop { display: none; height: ${desktopH}px; }
    .ns-ed .ns-mh--mobile  { display: flex; height: ${mobileH}px; padding-top: env(safe-area-inset-top, 0px); justify-content: space-between; }
    @media (min-width: 768px) {
      .ns-ed .ns-mh--desktop { display: grid; grid-template-columns: 1fr minmax(280px, 560px) 1fr; }
      .ns-ed .ns-mh--mobile  { display: none; }
    }

    /* ── wordmark ── */
    .ns-ed .ns-wordmark {
      display: inline-flex; align-items: baseline;
      color: ${ED.ink}; text-decoration: none;
      min-width: 0;
    }
    .ns-ed .ns-wordmark-name {
      font-family: ${ED.serif}; font-size: 22px; letter-spacing: -0.01em;
      color: ${ED.ink};
    }
    .ns-ed .ns-wordmark-co {
      font-family: ${ED.serif}; font-style: italic; font-size: 14px;
      color: ${ED.inkFaint}; margin-left: 5px;
    }

    /* ── search ── */
    .ns-ed .ns-mh-center { display: flex; justify-content: center; }
    .ns-ed .ns-search-wrap { position: relative; width: 100%; max-width: 560px; }
    .ns-ed .ns-search {
      display: flex; align-items: center; gap: 10px;
      background: ${ED.paper50}; border: 1px solid ${ED.rule};
      border-radius: 999px; padding: 9px 16px;
      transition: border-color .18s ease;
    }
    .ns-ed .ns-search.is-open,
    .ns-ed .ns-search:focus-within { border-color: ${ED.ink}; }
    .ns-ed .ns-search input {
      background: transparent; border: 0; outline: 0; flex: 1; min-width: 0;
      font-family: ${ED.mono}; font-size: 12px; letter-spacing: 0.06em; color: ${ED.inkSoft};
    }
    .ns-ed .ns-search input::placeholder { color: ${ED.inkFaint}; }
    .ns-ed .ns-kbd {
      font-family: ${ED.mono}; font-size: 10px;
      padding: 2px 6px; border: 1px solid ${ED.rule};
      border-radius: 4px; color: ${ED.inkFaint};
      background: ${ED.paper100};
    }
    .ns-ed .ns-search-clear {
      width: 18px; height: 18px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      color: ${ED.inkFaint}; background: transparent; border: 0; cursor: pointer;
    }
    .ns-ed .ns-search-clear:hover { color: ${ED.ink}; }

    /* ── icon buttons (top-right) ── */
    .ns-ed .ns-mh-right { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
    .ns-ed .ns-icon-btn {
      position: relative;
      height: 34px; width: 34px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid ${ED.rule}; color: ${ED.inkSoft};
      background: transparent; cursor: pointer;
      transition: color .18s ease, border-color .18s ease, background-color .18s ease;
    }
    .ns-ed .ns-icon-btn:hover { color: ${ED.ink}; border-color: ${ED.ink}; }
    .ns-ed .ns-icon-btn.is-on { background: ${ED.ink}; color: ${ED.paper50}; border-color: ${ED.ink}; }

    /* ── Quick create dropdown ── */
    .ns-ed .ns-qc-scrim { position: fixed; inset: 0; z-index: 110; background: transparent; }
    .ns-ed .ns-qc {
      position: absolute; top: 44px; right: 0; z-index: 120;
      width: 280px; padding: 14px; background: ${ED.paper50};
    }
    .ns-ed .ns-qc-eyebrow {
      font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
      color: ${ED.inkFaint}; margin: 0 4px 4px;
    }
    .ns-ed .ns-qc-row {
      display: grid; grid-template-columns: 28px 22px 1fr auto;
      align-items: center; gap: 10px; padding: 9px 6px;
      border: 0; background: transparent; cursor: pointer;
      width: 100%; text-align: left; border-radius: 6px;
      transition: background-color .12s ease;
    }
    .ns-ed .ns-qc-row:hover { background: ${ED.paper150}; }
    .ns-ed .ns-qc-row .ord {
      font-family: ${ED.mono}; font-size: 11px; letter-spacing: 0.14em;
      color: ${ED.inkFaint};
    }
    .ns-ed .ns-qc-row:hover .ord {
      color: ${ED.accent}; font-family: ${ED.serif}; font-style: italic; font-size: 14px;
    }
    .ns-ed .ns-qc-row .ic { color: ${ED.inkFaint}; display: inline-flex; }
    .ns-ed .ns-qc-row:hover .ic { color: ${ED.ink}; }
    .ns-ed .ns-qc-row .body { display: flex; flex-direction: column; min-width: 0; }
    .ns-ed .ns-qc-row .title { font-family: ${ED.serif}; font-size: 17px; color: ${ED.ink}; }
    .ns-ed .ns-qc-row .sub {
      font-family: ${ED.mono}; font-size: 10.5px; letter-spacing: 0.12em;
      text-transform: uppercase; color: ${ED.inkFaint};
    }
    .ns-ed .ns-qc-row .go { color: ${ED.inkFaint}; }
    .ns-ed .ns-qc-row:hover .go { color: ${ED.accent}; }

    /* ── search dropdown ── */
    .ns-ed .ns-search-pop {
      position: absolute; left: 0; right: 0; top: calc(100% + 6px);
      z-index: 200; padding: 0; background: ${ED.paper50};
      overflow: hidden;
    }
    .ns-ed .ns-search-pop-head,
    .ns-ed .ns-search-pop-foot {
      display: flex; justify-content: space-between; align-items: center;
      padding: 9px 16px; gap: 8px;
      font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
      color: ${ED.inkFaint}; background: ${ED.paper100};
    }
    .ns-ed .ns-search-pop-head { border-bottom: 1px solid ${ED.rule}; }
    .ns-ed .ns-search-pop-foot { border-top: 1px solid ${ED.rule}; }
    .ns-ed .ns-search-pop-list {
      list-style: none; padding: 4px 0; margin: 0;
      max-height: 360px; overflow-y: auto;
    }
    .ns-ed .ns-search-row {
      display: grid;
      grid-template-columns: 36px 22px 1fr auto 14px;
      align-items: center; gap: 10px;
      padding: 9px 16px; width: 100%; text-align: left;
      border: 0; background: transparent; cursor: pointer;
      transition: background-color .12s ease;
    }
    .ns-ed .ns-search-row:hover,
    .ns-ed .ns-search-row.is-on { background: ${ED.paper150}; }
    .ns-ed .ns-search-row-ord {
      font-family: ${ED.mono}; font-size: 11px; letter-spacing: 0.14em;
      color: ${ED.inkFaint};
    }
    .ns-ed .ns-search-row-icon { color: ${ED.inkFaint}; display: inline-flex; }
    .ns-ed .ns-search-row.is-on .ns-search-row-icon { color: ${ED.ink}; }
    .ns-ed .ns-search-row-body { display: flex; flex-direction: column; min-width: 0; }
    .ns-ed .ns-search-row-title {
      font-family: ${ED.serif}; font-size: 16px; color: ${ED.ink};
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ns-ed .ns-search-row.is-on .ns-search-row-title { color: ${ED.accent}; }
    .ns-ed .ns-search-row-desc {
      font-family: ${ED.mono}; font-size: 10.5px; letter-spacing: 0.06em;
      color: ${ED.inkFaint}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ns-ed .ns-search-row-cat {
      font-family: ${ED.mono}; font-size: 10px; letter-spacing: 0.16em;
      text-transform: uppercase; color: ${ED.inkFaint};
      padding: 2px 8px; border: 1px solid ${ED.rule}; border-radius: 999px;
    }

    /* ── mobile drawer ── */
    .ns-ed .ns-md-scrim {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(19,16,8,0.32);
    }
    .ns-ed .ns-md-panel {
      position: fixed; top: 0; right: 0; z-index: 110;
      width: min(320px, 86vw); height: 100dvh;
      padding-top: env(safe-area-inset-top, 0px);
      background: ${ED.paper100};
      border-left: 1px solid ${ED.rule};
      display: flex; flex-direction: column;
    }
    .ns-ed .ns-md-head {
      height: ${mobileH}px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px;
    }
    .ns-ed .ns-md-eyebrow {
      font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
      color: ${ED.inkFaint}; margin: 0;
    }
    .ns-ed .ns-md-body {
      flex: 1; overflow-y: auto;
      padding: 18px 8px 12px;
      -webkit-overflow-scrolling: touch;
    }
    .ns-ed .ns-md-section + .ns-md-section { margin-top: 20px; }
    .ns-ed .ns-md-section-h {
      display: inline-flex; align-items: baseline; gap: 8px;
      font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase;
      color: ${ED.inkFaint}; padding: 0 12px 8px;
    }
    .ns-ed .ns-md-section-h .num {
      font-family: ${ED.serif}; font-style: italic; font-size: 16px;
      letter-spacing: 0; color: ${ED.accent};
    }
    .ns-ed .ns-md-section ul { list-style: none; padding: 0; margin: 0; }
    .ns-ed .ns-md-row {
      display: grid; grid-template-columns: 28px 18px 1fr auto;
      align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 6px;
      width: 100%; text-align: left;
      background: transparent; border: 0; cursor: pointer; color: ${ED.ink};
      transition: background-color .12s ease;
    }
    .ns-ed .ns-md-row:hover { background: ${ED.paper150}; }
    .ns-ed .ns-md-row.is-on { background: ${ED.paper150}; }
    .ns-ed .ns-md-row .ord {
      font-family: ${ED.mono}; font-size: 10.5px; letter-spacing: 0.14em;
      color: ${ED.inkFaint};
    }
    .ns-ed .ns-md-row.is-on .ord {
      color: ${ED.accent}; font-family: ${ED.serif}; font-style: italic; font-size: 14px;
    }
    .ns-ed .ns-md-row .ic { color: ${ED.inkFaint}; display: inline-flex; }
    .ns-ed .ns-md-row.is-on .ic { color: ${ED.ink}; }
    .ns-ed .ns-md-row .lb {
      font-family: ${ED.serif}; font-size: 17px;
    }
    .ns-ed .ns-md-row.is-on .lb { color: ${ED.accent}; font-style: italic; }
    .ns-ed .ns-md-row .ns-pro { font-size: 9px; padding: 2px 6px; }

    .ns-ed .ns-md-foot {
      padding: 12px 8px;
      padding-bottom: max(env(safe-area-inset-bottom, 16px), 16px);
    }
    .ns-ed .ns-md-logout {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 10px 14px; border: 1px solid ${ED.rule};
      border-radius: 999px; background: transparent; cursor: pointer;
      color: ${ED.ink}; font-family: ${ED.sans}; font-size: 14px;
      transition: all .15s ease;
      margin: 12px 12px 0;
    }
    .ns-ed .ns-md-logout:hover { border-color: ${ED.ink}; }
    .ns-ed .ns-md-logout:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ── desktop overlay scrim ── */
    .ns-ed .ns-overlay { position: fixed; inset: 0; z-index: 89; display: none; }
    @media (min-width: 768px) { .ns-ed .ns-overlay { display: block; } }
    .ns-ed .ns-overlay-bg { position: absolute; inset: 0; background: rgba(19,16,8,0.18); }

    /* ── desktop right rail ── */
    .ns-ed .ns-rail {
      position: fixed; right: 0; z-index: 90;
      display: none;
      background: ${ED.paper50};
      border-left: 1px solid ${ED.rule};
      flex-direction: column;
      padding: 12px 0;
    }
    @media (min-width: 768px) { .ns-ed .ns-rail { display: flex; } }
    .ns-ed .ns-rail-nav { flex: 1; display: flex; flex-direction: column; gap: 2px; padding: 4px 8px; }
    .ns-ed .ns-rail-foot { padding: 4px 8px; }
    .ns-ed .ns-rail-link {
      position: relative;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      height: 44px; padding: 0 8px;
      border-radius: 6px; text-decoration: none;
      background: transparent; border: 0; cursor: pointer;
      color: ${ED.inkSoft};
      transition: background-color .12s ease, color .12s ease;
    }
    .ns-ed .ns-rail-link:hover { background: ${ED.paper150}; color: ${ED.ink}; }
    .ns-ed .ns-rail-link.is-on { background: ${ED.paper150}; color: ${ED.accent}; }
    .ns-ed .ns-rail-link .ord {
      font-family: ${ED.mono}; font-size: 10px; letter-spacing: 0.12em;
      color: ${ED.inkFaint}; display: none;
    }
    .ns-ed .ns-rail-link .tip {
      position: absolute; right: calc(100% + 8px); top: 50%; transform: translateY(-50%);
      background: ${ED.paper50}; border: 1px solid ${ED.rule};
      border-radius: 6px; padding: 6px 10px;
      font-family: ${ED.serif}; font-size: 14px; color: ${ED.ink};
      white-space: nowrap;
      opacity: 0; pointer-events: none; transition: opacity .15s ease;
    }
    .ns-ed .ns-rail-link:hover .tip,
    .ns-ed .ns-rail-link:focus-visible .tip { opacity: 1; }
    .ns-ed .ns-rail-link .ns-pro { margin-left: 8px; font-size: 9px; padding: 1px 6px; }

    /* ── content offset ── */
    /* Layout already pads via --app-content-top; we leave that to the layout file. */
  `}</style>
);
