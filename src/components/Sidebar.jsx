// src/components/Sidebar.jsx
// ═══════════════════════════════════════════════════════════════════
// EDITORIAL RESKIN v3 — fully adaptive left column + top strip
// ─────────────────────────────────────────────────────────────────
// Responsive strategy (smooth, not stepped):
//
//   WIDE DESKTOP (≥1200px)
//     · Full 260px left column with serif row labels
//     · Top strip: full dateline · search pill · notif · quick-create · CTA
//
//   NARROW DESKTOP (900–1199px)
//     · Same 260px left column
//     · Top strip: condensed dateline (VOL/NO only) · search · icons · CTA
//
//   TABLET (640–899px)
//     · Left column collapses to 64px ICON RAIL (icons + ordinals only,
//       labels appear in a tooltip-style flyout on hover)
//     · Top strip: pulse-dot only · search (flex-grow) · notif · CTA (icon)
//
//   MOBILE (<640px)
//     · Left column hidden; masthead carries wordmark + search-toggle +
//       hamburger. Tapping search expands an inline full-width input
//       that pushes the wordmark/hamburger out (animated). Drawer
//       unchanged.
//
// All JS preserved — every useState/useEffect/useCallback, every
// keyboard handler (Arrow ↑↓, Tab, Enter, Esc, ⌘K), desktopSidebar
// listeners (no-ops), outside-click closers, Supabase signOut, body
// paint, --ns-layout-sidebar-w exposure. Only the JSX layout and CSS
// were touched; one tiny piece of state (`mobileSearchOpen`) was
// added to drive the mobile search expand.
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { showMobileNav } from "../hooks/useMobileNav";
import { useEditorial, ED } from "../lib/editorial";
import QuickCreateModal from "./QuickCreateModal";
import { useNotes } from "../hooks/useNotes";
import {
  FiSearch, FiArrowRight,
  FiHome, FiEdit3, FiFolder, FiZap, FiActivity, FiCpu, FiMic,
  FiCloud, FiUsers, FiSettings, FiLink, FiHelpCircle,
  FiMessageCircle, FiBookOpen, FiGrid, FiFileText, FiX, FiMenu,
  FiPlus, FiUploadCloud, FiLogOut, FiBell,
  FiStar, FiClock, FiChevronDown,           
} from "react-icons/fi";

const DESKTOP_HEADER_H = 64;
const MOBILE_HEADER_H  = 56;
const LEFT_COL_W       = 260;   // wide desktop
const LEFT_RAIL_W      = 64;    // tablet (icon-only)

/* ─── live dateline helpers ─── */
const volAndNo = (d = new Date()) => {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff  = (d - start) + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60000);
  const day   = Math.floor(diff / 86400000);
  const week  = Math.ceil(day / 7);
  return { vol: "II", no: String(week).padStart(2, "0") };
};
const issueLine = (d = new Date()) => {
  const day = d.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase();
  const mo  = d.toLocaleDateString(undefined, { month: "long"   }).toUpperCase();
  return `${day}, ${mo} ${d.getDate()}, ${d.getFullYear()}`;
};

/* ─────────────────────────────────────────────
   Search index (UNCHANGED)
   ───────────────────────────────────────────── */
const SEARCH_INDEX = [
  { id: "dashboard",          title: "Dashboard",            description: "Workspace overview",            path: "/dashboard",                              category: "Pages",         icon: <FiGrid size={14} />,        keywords: ["home", "overview", "main", "dashboard", "start", "hub"] },
  { id: "notes",              title: "Notes",                description: "Create & manage notes",         path: "/dashboard/notes",                        category: "Pages",         icon: <FiEdit3 size={14} />,       keywords: ["notes", "write", "create", "edit", "text", "draft", "memo", "new note"] },
  { id: "documents",          title: "Research Synthesizer", description: "Upload docs & generate briefs", path: "/dashboard/documents",                    category: "Pages",         icon: <FiFolder size={14} />,      keywords: ["documents", "files", "upload", "pdf", "docx", "research", "synthesize", "brief", "doc"] },
  { id: "summaries",          title: "Insight Explorer",     description: "AI-powered workspace search",   path: "/dashboard/summaries",                    category: "Pages",         icon: <FiZap size={14} />,         keywords: ["summaries", "insights", "explore", "ai search", "ask", "query", "find"] },
  { id: "activity",           title: "Activity",             description: "Recent activity & usage",       path: "/dashboard/activity",                     category: "Pages",         icon: <FiActivity size={14} />,    keywords: ["activity", "history", "timeline", "recent", "log", "usage"] },
  { id: "ai-lab",             title: "AI Lab",               description: "Advanced AI tools",             path: "/dashboard/ai-lab",                       category: "AI Tools",      icon: <FiCpu size={14} />,         keywords: ["ai", "lab", "tools", "experiments", "advanced"] },
  { id: "custom-training",    title: "Custom AI Training",   description: "Train AI on your style",        path: "/dashboard/ai-lab/training",              category: "AI Tools",      icon: <FiCpu size={14} />,         keywords: ["training", "custom", "style", "writing", "personalize", "pro"] },
  { id: "voice-notes",        title: "Voice Notes",          description: "Record & transcribe",           path: "/dashboard/ai-lab/voice-notes",           category: "AI Tools",      icon: <FiMic size={14} />,         keywords: ["voice", "record", "audio", "transcribe", "speech", "dictate"] },
  { id: "cloud-sync",         title: "Cloud Sync",           description: "Sync across devices",           path: "/dashboard/ai-lab/cloud-sync",            category: "AI Tools",      icon: <FiCloud size={14} />,       keywords: ["cloud", "sync", "backup", "devices"] },
  { id: "team-collaboration", title: "Team Collaboration",   description: "Collaborate in real time",      path: "/dashboard/ai-lab/team-collaboration",    category: "AI Tools",      icon: <FiUsers size={14} />,       keywords: ["team", "collaboration", "share", "invite"] },
  { id: "settings",           title: "Settings",             description: "Account, theme & preferences",  path: "/dashboard/settings",                     category: "Settings",      icon: <FiSettings size={14} />,    keywords: ["settings", "preferences", "account", "theme", "dark mode", "light mode", "profile", "plan", "billing"] },
  { id: "integrations",       title: "Integrations",         description: "Connect third-party services",  path: "/dashboard/integrations",                 category: "Settings",      icon: <FiLink size={14} />,        keywords: ["integrations", "connect", "apps", "google", "slack", "notion", "api"] },
  { id: "help-center",        title: "Help Center",          description: "Guides & FAQs",                 path: "/dashboard/help-center",                  category: "Support",       icon: <FiHelpCircle size={14} />,  keywords: ["help", "support", "faq", "guide", "tutorial", "how to"] },
  { id: "contact-support",    title: "Contact Support",      description: "Get help from our team",        path: "/dashboard/contact-support",              category: "Support",       icon: <FiMessageCircle size={14} />, keywords: ["contact", "support", "email", "bug", "report", "feedback"] },
  { id: "integration-docs",   title: "Integration Docs",     description: "API docs & guides",             path: "/dashboard/integration-docs",             category: "Support",       icon: <FiBookOpen size={14} />,    keywords: ["api", "docs", "documentation", "developer"] },
  { id: "action-new-note",    title: "Create New Note",      description: "Start writing now",             path: "/dashboard/notes",                        category: "Quick Actions", icon: <FiEdit3 size={14} />,       keywords: ["new", "create", "write", "start", "blank", "note"] },
  { id: "action-upload",      title: "Upload a Document",    description: "PDF, DOCX, or spreadsheet",     path: "/dashboard/documents",                    category: "Quick Actions", icon: <FiFolder size={14} />,      keywords: ["upload", "import", "add", "file"] },
  { id: "action-record",      title: "Record Voice Note",    description: "Start a voice recording",       path: "/dashboard/ai-lab/voice-notes",           category: "Quick Actions", icon: <FiMic size={14} />,         keywords: ["record", "voice", "audio"] },
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
      const descLower  = item.description.toLowerCase();
      const kwStr      = item.keywords.join(" ").toLowerCase();
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

/* ─── Nav sections (editorial, three groups) ─── */
const NAV_SECTIONS = [
  {
    label: "The desk",
    items: [
      { label: "Dashboard",   icon: FiHome,   to: "/dashboard" },
      { label: "Notes",       icon: FiEdit3,  to: "/dashboard/notes" },
      { label: "Voice notes", icon: FiMic,    to: "/dashboard/ai-lab/voice-notes" },
      { label: "Documents",   icon: FiFolder, to: "/dashboard/documents" },
    ],
  },
  {
    label: "The model",
    items: [
      { label: "AI Lab",       icon: FiCpu,  to: "/dashboard/ai-lab", pro: true },
      { label: "Summaries",    icon: FiZap,  to: "/dashboard/summaries" },
      { label: "Integrations", icon: FiLink, to: "/dashboard/integrations" },
    ],
  },
  {
    label: "Records",
    items: [
      { label: "Activity", icon: FiActivity, to: "/dashboard/activity" },
      { label: "Settings", icon: FiSettings, to: "/dashboard/settings" },
    ],
  },
];

/* ─── Workspace switcher (replace with real data when ready) ─── */
const WORKSPACES = [
  { id: "personal", label: "Personal desk",  initial: "P" },
  { id: "team",     label: "Team workspace", initial: "T" },
];

/* ─── Keyboard shortcuts for top-level nav ─── */
const NAV_SHORTCUTS = {
  "/dashboard":            "⌘1",
  "/dashboard/notes":      "⌘2",
  "/dashboard/documents":  "⌘3",
  "/dashboard/ai-lab":     "⌘4",
  "/dashboard/activity":   "⌘5",
};

/* ─── Stub data — replace with real queries (Supabase / context) ─── */
const PINNED_STUB  = [
  // { id, title, updatedAt }
];
const RECENTS_STUB = [
  // { id, title, openedAt }
];
const USAGE_STUB = { usedGb: 2.4, totalGb: 10, plan: "Pro" };

export default function Sidebar() {
  useEditorial();

  const location = useLocation();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);
  const [showWsMenu, setShowWsMenu] = useState(false);
  const [activeWs, setActiveWs]     = useState(WORKSPACES[0]);

  /* Mobile drawer */
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const mobileDrawerRef    = useRef(null);
  const mobileHamburgerRef = useRef(null);

  /* Mobile inline search expand (new) */
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef(null);

  /* Quick Create */
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  /* Quick-create modal — mounted globally here in the Sidebar so the
     + button works the same way on every page. Previously goQuickCreate
     navigated to /dashboard/notes for ALL types, which yanked the user
     away from wherever they were (VoiceNotes, Documents, etc.). Now
     the modal opens in place; only voice / upload navigate (and the
     modal itself handles those redirects). */
  const [qcModalOpen, setQcModalOpen] = useState(false);
  const [qcModalType, setQcModalType] = useState("note");

  /* ✅ Notes CRUD — provides onCreate to the QuickCreateModal so the
     + button actually persists to Supabase. Returns the real created
     note so the modal can navigate to the real UUID (not the local
     `n_xxx` placeholder it generated optimistically). */
  const { createNote } = useNotes();
  const handleQuickCreate = useCallback(
    async (draftNote) => {
      try {
        const created = await createNote({
          title: draftNote.title,
          body: draftNote._body || draftNote.body || "",
          tags: draftNote.tags || [],
          pinned: Boolean(draftNote.pinned),
        });
        return created; // QuickCreateModal uses .id to navigate
      } catch (err) {
        console.error("[Sidebar] createNote failed:", err);
        return null;
      }
    },
    [createNote],
  );

  /* Search */
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen]   = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const searchInputRef    = useRef(null);
  const searchWrapperRef  = useRef(null);

  const searchResults = useMemo(() => scoreSearch(searchQuery).slice(0, 7), [searchQuery]);

  const isDesktop = () =>
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(min-width: 640px)").matches;

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

  /* Quick Create */
  const closeQuickCreate = useCallback(() => setShowQuickCreate(false), []);
  const goQuickCreate = useCallback(
    (type) => {
      // Close the dropdown first, then open the modal locally.
      // No navigation here — the modal is portaled to body and
      // handles its own routing on save (notes) or immediately
      // (voice / upload).
      setShowQuickCreate(false);
      setQcModalType(type);
      setQcModalOpen(true);
    },
    []
  );

  /* Search helpers (UNCHANGED) */
  const closeSearch = useCallback(() => { setSearchOpen(false); setHighlightIdx(-1); }, []);
  const handleSearchNavigate = useCallback((item) => {
    closeSearch(); setSearchQuery(""); navigate(item.path);
    setMobileSearchOpen(false);
  }, [navigate, closeSearch]);

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

  useEffect(() => { closeSearch(); setSearchQuery(""); setMobileSearchOpen(false); }, [location.pathname, closeSearch]);

  const handleSearchKeyDown = (e) => {
    if (searchOpen && searchResults.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx((p) => p < searchResults.length - 1 ? p + 1 : 0); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setHighlightIdx((p) => p > 0 ? p - 1 : searchResults.length - 1); return; }
      if (e.key === "Tab")       { e.preventDefault(); const t = highlightIdx >= 0 ? searchResults[highlightIdx] : searchResults[0]; if (t) setSearchQuery(t.title); return; }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchOpen && highlightIdx >= 0 && searchResults[highlightIdx]) handleSearchNavigate(searchResults[highlightIdx]);
      else if (searchResults.length > 0) handleSearchNavigate(searchResults[0]);
      else if (searchQuery.trim()) { closeSearch(); navigate("/search"); }
      return;
    }
    if (e.key === "Escape") {
      if (searchOpen) closeSearch();
      else if (mobileSearchOpen) { setMobileSearchOpen(false); setSearchQuery(""); }
      else { setSearchQuery(""); searchInputRef.current?.blur(); mobileSearchInputRef.current?.blur(); }
    }
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

  /* Escape closes everything */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowQuickCreate(false);
        closeMobileDrawer();
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeMobileDrawer]);

  /* desktopSidebar:open/:close listeners — no-ops (kept for Notes.jsx) */
  useEffect(() => {
    const onOpen = () => {};
    const onClose = () => {};
    window.addEventListener("desktopSidebar:open", onOpen);
    window.addEventListener("desktopSidebar:close", onClose);
    return () => { window.removeEventListener("desktopSidebar:open", onOpen); window.removeEventListener("desktopSidebar:close", onClose); };
  }, []);

  /* Cmd/Ctrl-K focuses search */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        // Focus whichever search input is visible
        const isMobile = window.matchMedia("(max-width: 639px)").matches;
        if (isMobile) {
          setMobileSearchOpen(true);
          setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
        } else {
          searchInputRef.current?.focus();
          searchInputRef.current?.select?.();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

   /* ⌘1–⌘5 jump to top-level nav */
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const map = {
        "1": "/dashboard",
        "2": "/dashboard/notes",
        "3": "/dashboard/documents",
        "4": "/dashboard/ai-lab",
        "5": "/dashboard/activity",
      };
      const target = map[e.key];
      if (target) {
        e.preventDefault();
        navigate(target);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  /* Focus mobile search input when it opens */
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
    }
  }, [mobileSearchOpen]);

  const isActive = useCallback((to) => {
    const p = location.pathname;
    if (to === "/dashboard") return p === "/dashboard";
    return p === to || p.startsWith(to + "/");
  }, [location.pathname]);

  /* LOGOUT (UNCHANGED) */
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      closeMobileDrawer();
      if (!isDesktop()) showMobileNav();
      setShowQuickCreate(false);
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) console.warn("Supabase signOut error:", error.message);
      }
    } finally {
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  /* CSS vars + body paint
     Now reactive to three states: mobile / tablet rail / wide column.
     Exposes the *current* sidebar width as --ns-layout-sidebar-w so
     DashboardLayout can offset content correctly at every breakpoint. */
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const mqTablet = window.matchMedia("(min-width: 640px) and (max-width: 899px)");
    const mqDesk   = window.matchMedia("(min-width: 900px)");

    const applyVars = () => {
      const isDesk   = mqDesk.matches;
      const isTablet = mqTablet.matches;
      const hasSideUI = isDesk || isTablet;

      root.style.setProperty("--ns-desktop-header-h", `${DESKTOP_HEADER_H}px`);
      root.style.setProperty("--mobile-nav-height",   `${MOBILE_HEADER_H}px`);
      root.style.setProperty("--ns-mobile-header-h",  `${MOBILE_HEADER_H}px`);
      root.style.setProperty("--app-content-top",     `${hasSideUI ? DESKTOP_HEADER_H : MOBILE_HEADER_H}px`);
      root.style.setProperty(
        "--ns-layout-sidebar-w",
        isDesk ? `${LEFT_COL_W}px` : isTablet ? `${LEFT_RAIL_W}px` : "0px"
      );
    };
    applyVars();

    const onChange = () => applyVars();
    if (mqTablet.addEventListener) {
      mqTablet.addEventListener("change", onChange);
      mqDesk.addEventListener("change", onChange);
    } else {
      mqTablet.addListener(onChange);
      mqDesk.addListener(onChange);
    }

    const prev = {
      htmlBg: root.style.backgroundColor,
      bodyBg: body.style.backgroundColor,
      bodyColor: body.style.color,
    };
    // Read the live editorial tokens so we follow the active theme.
    // In light mode these resolve to #f6f1e3 / #131008; in dark mode
    // ThemeContext flips them to #13100a / #f3eedd via the CSS variables
    // defined in editorial.js. Previously these were hardcoded to the
    // light values, which forced light-mode chrome onto every dashboard
    // page regardless of the user's theme choice.
    const applyThemeColors = () => {
      const cs = getComputedStyle(root);
      const paperBg = cs.getPropertyValue("--ed-paper-100").trim() || "#f6f1e3";
      const inkFg   = cs.getPropertyValue("--ed-ink").trim()       || "#131008";
      root.style.backgroundColor = paperBg;
      body.style.backgroundColor = paperBg;
      body.style.color = inkFg;
    };
    applyThemeColors();

    // Re-apply when ThemeContext toggles `data-theme` (or the `dark` class)
    // on <html>. Without this the inline styles stay frozen at whatever the
    // theme was when Sidebar mounted, so toggling theme mid-session leaves
    // a stale background behind.
    const themeObserver = new MutationObserver(applyThemeColors);
    themeObserver.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => {
      if (mqTablet.removeEventListener) {
        mqTablet.removeEventListener("change", onChange);
        mqDesk.removeEventListener("change", onChange);
      } else {
        mqTablet.removeListener(onChange);
        mqDesk.removeListener(onChange);
      }
      themeObserver.disconnect();
      root.style.removeProperty("--ns-desktop-header-h");
      root.style.removeProperty("--mobile-nav-height");
      root.style.removeProperty("--ns-mobile-header-h");
      root.style.removeProperty("--app-content-top");
      root.style.removeProperty("--ns-layout-sidebar-w");
      root.style.backgroundColor = prev.htmlBg;
      body.style.backgroundColor = prev.bodyBg;
      body.style.color = prev.bodyColor;
    };
  }, []);

  const { vol, no } = volAndNo();

  return (
    <div className="ns-ed ns-ed-sidebar">
      <SidebarScopedStyles
        desktopH={DESKTOP_HEADER_H}
        mobileH={MOBILE_HEADER_H}
        leftW={LEFT_COL_W}
        railW={LEFT_RAIL_W}
      />

      {/* ═══ LEFT COLUMN (wide desktop ≥900) / RAIL (tablet 640–899) ═══ */}
      <aside className="ns-left" aria-label="Primary navigation">
      {/* Workspace switcher */}
              <div className="ns-ws-anchor">
                <button
                  type="button"
                  className="ns-ws"
                  onClick={() => setShowWsMenu((v) => !v)}
                  aria-expanded={showWsMenu}
                  data-tip={activeWs.label}
                >
                  <span className="ns-ws-mark">{activeWs.initial}</span>
                  <span className="ns-ws-body">
                    <span className="ns-ws-eyebrow ed-mono">WORKSPACE</span>
                    <span className="ns-ws-name">{activeWs.label}</span>
                  </span>
                  <FiChevronDown size={12} className="ns-ws-chev" />
                  <span className="ns-tip" aria-hidden>{activeWs.label}</span>
                </button>

                <AnimatePresence>
                  {showWsMenu && (
                    <>
                      <div className="ns-ws-scrim" onClick={() => setShowWsMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="ed-card ns-ws-menu"
                      >
                        <p className="ed-mono ns-ws-menu-h">SWITCH WORKSPACE</p>
                        <ul>
                          {WORKSPACES.map((w) => (
                            <li key={w.id}>
                              <button
                                type="button"
                                className={`ns-ws-menu-row ${w.id === activeWs.id ? "is-on" : ""}`}
                                onClick={() => { setActiveWs(w); setShowWsMenu(false); }}
                              >
                                <span className="ns-ws-mark sm">{w.initial}</span>
                                <span className="lb">{w.label}</span>
                                {w.id === activeWs.id && <span className="ed-mono on">CURRENT</span>}
                              </button>
                            </li>
                          ))}
                        </ul>
                        <hr className="ed-rule-soft" />
                        <button type="button" className="ns-ws-create">
                          <FiPlus size={12} /> <span>Create workspace</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

        {/* Wordmark stays below */}
        <Link to="/dashboard" className="ns-wordmark ns-left-wm">
          <span className="ns-wordmark-name">NoteStream</span>
          <span className="ns-wordmark-co">&amp; co.</span>
          <span className="ns-wordmark-mark" aria-hidden>N<span className="amp">&amp;</span></span>
        </Link>

        <nav className="ns-left-nav">
          {NAV_SECTIONS.map((section, si) => (
            <section key={section.label} className="ns-left-sec">
              <p className="ns-left-sec-h">
                <span className="num">§ {String(si + 1).padStart(2, "0")}</span>
                <span className="lbl">— {section.label.toUpperCase()}</span>
              </p>
              <ul>
                {section.items.map((item, ii) => {
                  const active = isActive(item.to);
                  const Icon = item.icon;
                  const ord = String(ii + 1).padStart(2, "0");
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === "/dashboard"}
                        className={`ns-left-row ${active ? "is-on" : ""}`}
                        data-tip={item.label}
                      >
                        <span className="ord">{ord}</span>
                        <Icon size={14} className="ic" />
                        <span className="lb">{item.label}</span>
                        {item.pro && <span className="ed-chip ed-chip-ink ns-pro">PRO</span>}
                        {NAV_SHORTCUTS[item.to] && !item.pro && (
                          <span className="ns-kbd-hint ed-mono">{NAV_SHORTCUTS[item.to]}</span>
                        )}
                        <span className="ns-tip" aria-hidden>
                          {item.label}
                          {item.pro && <em className="ns-tip-pro">PRO</em>}
                        </span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>

        {/* Pinned notes */}
          <section className="ns-left-extra">
            <p className="ns-left-sec-h">
              <span className="num">§ 04</span>
              <span className="lbl">— PINNED</span>
            </p>
            {PINNED_STUB.length === 0 ? (
              <p className="ns-empty">
                <span>No pins yet — </span>
                <em>star a note to pin it here.</em>
              </p>
            ) : (
              <ul className="ns-mini-list">
                {PINNED_STUB.slice(0, 5).map((n, i) => (
                  <li key={n.id}>
                    <Link to={`/dashboard/notes/${n.id}`} className="ns-mini-row">
                      <FiStar size={10} className="ic" />
                      <span className="title">{n.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

        {/* Recents */}
          {RECENTS_STUB.length > 0 && (
            <section className="ns-left-extra">
              <p className="ns-left-sec-h">
                <span className="num">§ 05</span>
                <span className="lbl">— RECENT</span>
              </p>
              <ul className="ns-mini-list">
                {RECENTS_STUB.slice(0, 3).map((n) => (
                  <li key={n.id}>
                    <Link to={`/dashboard/notes/${n.id}`} className="ns-mini-row">
                      <FiClock size={10} className="ic" />
                      <span className="title">{n.title}</span>
                      <span className="ts ed-mono">{n.openedAt}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

        {/* Storage / plan */}
          <div className="ns-usage">
            <div className="ns-usage-head">
              <span className="ed-mono">{USAGE_STUB.usedGb} / {USAGE_STUB.totalGb} GB</span>
              <span className="ns-usage-plan">Plan: <em>{USAGE_STUB.plan}</em></span>
            </div>
            <div className="ns-usage-bar">
              <div
                className="ns-usage-fill"
                style={{ width: `${Math.min(100, (USAGE_STUB.usedGb / USAGE_STUB.totalGb) * 100)}%` }}
              />
            </div>
          </div>

        <footer className="ns-left-foot">
          <hr className="ed-rule-soft" />
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="ns-left-logout"
            data-tip="Sign out"
          >
            <FiLogOut size={13} />
            <span className="lb">{loggingOut ? "Signing out…" : "Sign out"}</span>
            <span className="ns-tip" aria-hidden>Sign out</span>
          </button>
        </footer>
      </aside>

      {/* ═══ DESKTOP / TABLET TOP STRIP ═══ */}
      <header className="ns-mh ns-mh--desktop">
        <div className="ns-mh-left">
          <span className="ed-mono ns-dateline">
            <span className="ns-dot" />
            <span className="ns-dateline-full">VOL. {vol} · NO. {no} · {issueLine()}</span>
            <span className="ns-dateline-mid">VOL. {vol} · NO. {no}</span>
          </span>
        </div>

        <div className="ns-mh-center">
          <div className="ns-search-wrap" ref={searchWrapperRef}>
            <div className={`ns-search ${searchOpen ? "is-open" : ""}`}>
              <FiSearch size={13} style={{ color: ED.inkFaint, flexShrink: 0 }} />
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
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="ed-card ns-search-pop"
                >
                  <div className="ns-search-pop-head">
                    <span className="ed-mono">{searchResults.length} {searchResults.length === 1 ? "match" : "matches"}</span>
                    <span className="ed-mono ns-search-pop-hint">↑↓ NAV · ↵ GO · ⇥ COMPLETE</span>
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
                              {on
                                ? <span style={{ fontFamily: ED.serif, fontStyle: "italic", color: ED.accent, fontSize: 15 }}>{String(idx + 1).padStart(2, "0")}</span>
                                : String(idx + 1).padStart(2, "0")}
                            </span>
                            <span className="ns-search-row-icon">{item.icon}</span>
                            <span className="ns-search-row-body">
                              <span className="ns-search-row-title">{item.title}</span>
                              <span className="ns-search-row-desc">{item.description}</span>
                            </span>
                            <span className="ns-search-row-cat">{CATEGORY_LABEL[item.category] || item.category.toUpperCase()}</span>
                            <FiArrowRight size={12} className="ns-search-row-arrow" style={{ color: on ? ED.accent : "transparent" }} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="ns-search-pop-foot">
                    <span className="ed-mono">ENTER TO GO · ESC TO CLOSE</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="ns-mh-right">
          <button className="ns-icon-btn ns-icon-btn--notif" aria-label="Notifications" title="Notifications">
            <FiBell size={14} />
          </button>

          <div className="ns-qc-anchor">
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
                    <QuickCreateItem icon={<FiEdit3 size={14} />}      label="New note"        sub="Write a text note"      ord="01" onClick={() => goQuickCreate("note")} />
                    <QuickCreateItem icon={<FiMic size={14} />}        label="Voice memo"      sub="Record & transcribe"    ord="02" onClick={() => goQuickCreate("voice")} />
                    <QuickCreateItem icon={<FiUploadCloud size={14}/>} label="Upload document" sub="PDF · image · markdown" ord="03" onClick={() => goQuickCreate("upload")} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* The "Begin a new note →" CTA used to live here, but it
              duplicated the + quick-create button to its left, so it
              was removed for a cleaner masthead. The + button still
              opens the same creator modal. */}
        </div>
      </header>

      {/* ═══ MOBILE MASTHEAD (<640px) ═══ */}
      <header className="ns-mh ns-mh--mobile">
        {/* Default state: wordmark + search btn + hamburger */}
        <div className={`ns-mh-mobile-row ${mobileSearchOpen ? "is-hidden" : ""}`}>
          <Link to="/dashboard" className="ns-wordmark">
            <span className="ns-wordmark-name">NoteStream</span>
            <span className="ns-wordmark-co">&amp; co.</span>
          </Link>
          <div className="ns-mh-mobile-actions">
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              className="ns-icon-btn"
              aria-label="Open search"
            >
              <FiSearch size={14} />
            </button>
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
          </div>
        </div>

        {/* Expanded state: full-width search input */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              className="ns-mh-mobile-search"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              ref={searchWrapperRef}
            >
              <div className={`ns-search ns-search--mobile ${searchOpen ? "is-open" : ""}`}>
                <FiSearch size={13} style={{ color: ED.inkFaint, flexShrink: 0 }} />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  placeholder="Search the archive…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  autoComplete="off" autoCorrect="off" spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setMobileSearchOpen(false); closeSearch(); }}
                  className="ns-search-clear"
                  aria-label="Close search"
                >
                  <FiX size={14} />
                </button>
              </div>

              <AnimatePresence>
                {searchOpen && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="ed-card ns-search-pop ns-search-pop--mobile"
                  >
                    <div className="ns-search-pop-head">
                      <span className="ed-mono">{searchResults.length} {searchResults.length === 1 ? "match" : "matches"}</span>
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
                              <span className="ns-search-row-ord">{String(idx + 1).padStart(2, "0")}</span>
                              <span className="ns-search-row-icon">{item.icon}</span>
                              <span className="ns-search-row-body">
                                <span className="ns-search-row-title">{item.title}</span>
                                <span className="ns-search-row-desc">{item.description}</span>
                              </span>
                              <FiArrowRight size={12} className="ns-search-row-arrow" style={{ color: on ? ED.accent : ED.inkFaint }} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
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
                <button type="button" onClick={closeMobileDrawer} className="ns-icon-btn" aria-label="Close menu">
                  <FiX size={14} />
                </button>
              </header>
              <hr className="ed-rule" />

              <nav className="ns-md-body">
                {NAV_SECTIONS.map((section, si) => (
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
                <button type="button" onClick={handleLogout} disabled={loggingOut} className="ns-md-logout">
                  <FiLogOut size={14} />
                  <span>{loggingOut ? "Signing out…" : "Sign out"}</span>
                </button>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global quick-create modal. Sidebar is rendered on every dashboard
          page (via DashboardLayout), so this means the + button works
          identically everywhere — no navigation roundtrip just to open
          the creator. */}
      <QuickCreateModal
        open={qcModalOpen}
        type={qcModalType}
        onClose={() => setQcModalOpen(false)}
        onCreate={handleQuickCreate}
      />
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
   Scoped CSS — fully adaptive
   Breakpoints:
     · ≥1200  wide desktop (full dateline + full CTA label)
     · 900–1199  narrow desktop (mid dateline + icon CTA)
     · 640–899   tablet (icon rail + dot-only dateline + icon CTA)
     · <640      mobile (masthead w/ inline search expand)
═══════════════════════════════════════════════════════ */
const SidebarScopedStyles = ({ desktopH, mobileH, leftW, railW }) => (
  <style>{`
    /* ── GLOBAL paper paint (unscoped) ──
       Painted on html/body and on the legacy theme variables that
       pre-editorial components still read from. Light values are the
       default; the [data-theme="dark"] block below mirrors every value
       into the dark palette. */
    html, body {
      background-color: #f6f1e3 !important;
      color: #131008;
    }
    :root {
      --bg-primary:    #f6f1e3 !important;
      --bg-secondary:  #f6f1e3 !important;
      --bg-surface:    #fbf8f0 !important;
      --bg-elevated:   #fbf8f0 !important;
      --bg-tertiary:   #efe9d8 !important;
      --bg-input:      #fbf8f0 !important;
      --bg-hover:      #efe9d8 !important;
      --bg-overlay:    rgba(19,16,8,0.32) !important;
      --text-primary:    #131008 !important;
      --text-secondary:  #2a2519 !important;
      --text-muted:      #8a8472 !important;
      --border-primary:   #d8cfb6 !important;
      --border-secondary: #d8cfb6 !important;
      --accent-indigo: #1f3aa8 !important;
      --accent-purple: #1f3aa8 !important;
      --accent-rose:   #1f3aa8 !important;
    }
    .bg-theme-primary, .bg-theme-secondary, .bg-theme-tertiary {
      background-color: #f6f1e3 !important;
    }
    .text-theme-primary   { color: #131008 !important; }
    .text-theme-secondary { color: #2a2519 !important; }
    .text-theme-muted     { color: #8a8472 !important; }

    /* Dark mode — mirrors every light value above. Kept in one place
       so it's obvious how the two palettes correspond. Tokens match
       the editorial palette defined in src/lib/editorial.js so anything
       reading either set stays in sync. */
    html[data-theme="dark"], html.dark { background-color: #13100a !important; color: #f3eedd; }
    html[data-theme="dark"] body, html.dark body {
      background-color: #13100a !important; color: #f3eedd;
    }
    /* Note: :root === <html>, so the dark variables go directly on the
       html selectors below — NOT on "html[data-theme='dark'] :root"
       which would require html to be a descendant of itself (matches
       nothing). */
    html[data-theme="dark"],
    html.dark {
      --bg-primary:    #13100a !important;
      --bg-secondary:  #13100a !important;
      --bg-surface:    #1c1812 !important;
      --bg-elevated:   #1c1812 !important;
      --bg-tertiary:   #241f17 !important;
      --bg-input:      #1c1812 !important;
      --bg-hover:      #241f17 !important;
      --bg-overlay:    rgba(0,0,0,0.55) !important;
      --text-primary:    #f3eedd !important;
      --text-secondary:  #d8d1bc !important;
      --text-muted:      #6e6855 !important;
      --border-primary:   #3a3322 !important;
      --border-secondary: #3a3322 !important;
      --accent-indigo: #7d92d8 !important;
      --accent-purple: #7d92d8 !important;
      --accent-rose:   #7d92d8 !important;
    }
    html[data-theme="dark"] .bg-theme-primary,
    html[data-theme="dark"] .bg-theme-secondary,
    html[data-theme="dark"] .bg-theme-tertiary,
    html.dark .bg-theme-primary,
    html.dark .bg-theme-secondary,
    html.dark .bg-theme-tertiary {
      background-color: #13100a !important;
    }
    html[data-theme="dark"] .text-theme-primary,
    html.dark .text-theme-primary   { color: #f3eedd !important; }
    html[data-theme="dark"] .text-theme-secondary,
    html.dark .text-theme-secondary { color: #d8d1bc !important; }
    html[data-theme="dark"] .text-theme-muted,
    html.dark .text-theme-muted     { color: #6e6855 !important; }

    .ns-ed-sidebar { display: contents; }

    /* ═════════════════════════════════════════════════
       LEFT COLUMN / RAIL
       ═════════════════════════════════════════════════ */
    .ns-ed .ns-left {
      position: fixed; top: 0; left: 0; bottom: 0;
      z-index: 96;
      background: ${ED.paper100};
      border-right: 1px solid ${ED.rule};
      display: none; flex-direction: column;
      padding: 24px 0 16px;
      width: ${leftW}px;
      transition: width .25s cubic-bezier(.32,.72,0,1);
    }
    /* Tablet rail */
    @media (min-width: 640px) and (max-width: 899px) {
      .ns-ed .ns-left { display: flex; width: ${railW}px; padding: 18px 0 14px; }
    }
    /* Wide desktop full column */
    @media (min-width: 900px) { .ns-ed .ns-left { display: flex; } }

    /* Wordmark: full text on desktop, compact mark on rail */
    .ns-ed .ns-left-wm { padding: 0 22px 24px; }
    .ns-ed .ns-wordmark-mark {
      display: none;
      font-family: ${ED.serif}; font-size: 26px; color: ${ED.ink};
      line-height: 1;
    }
    .ns-ed .ns-wordmark-mark .amp {
      font-style: italic; color: ${ED.accent}; margin-left: 2px;
    }
    @media (min-width: 640px) and (max-width: 899px) {
      .ns-ed .ns-left-wm {
        padding: 0 0 18px;
        justify-content: center; width: 100%;
      }
      .ns-ed .ns-left-wm .ns-wordmark-name,
      .ns-ed .ns-left-wm .ns-wordmark-co { display: none; }
      .ns-ed .ns-left-wm .ns-wordmark-mark { display: inline-flex; }
    }

    .ns-ed .ns-left-nav { flex: 1; overflow-y: auto; padding: 4px 12px 16px; }
    .ns-ed .ns-left-sec + .ns-left-sec { margin-top: 18px; }
    .ns-ed .ns-left-sec-h {
      display: inline-flex; align-items: baseline; gap: 8px;
      font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase;
      color: ${ED.inkFaint}; padding: 0 12px 8px;
      margin: 0;
    }
    .ns-ed .ns-left-sec-h .num {
      font-family: ${ED.serif}; font-style: italic; font-size: 16px;
      letter-spacing: 0; color: ${ED.accent};
    }
    .ns-ed .ns-left-sec ul { list-style: none; padding: 0; margin: 0; }

    .ns-ed .ns-left-row {
      position: relative;
      display: grid; grid-template-columns: 28px 18px 1fr auto;
      align-items: center; gap: 12px;
      padding: 9px 12px; border-radius: 6px;
      text-decoration: none; color: ${ED.ink};
      transition: background-color .12s ease;
    }
    .ns-ed .ns-left-row:hover { background: ${ED.paper150}; }
    .ns-ed .ns-left-row.is-on { background: ${ED.paper150}; }
    .ns-ed .ns-left-row .ord {
      font-family: ${ED.mono}; font-size: 10.5px; letter-spacing: 0.12em;
      color: ${ED.inkFaint};
    }
    .ns-ed .ns-left-row.is-on .ord {
      color: ${ED.accent}; font-family: ${ED.serif}; font-style: italic; font-size: 14px;
    }
    .ns-ed .ns-left-row .ic { color: ${ED.inkFaint}; display: inline-flex; }
    .ns-ed .ns-left-row.is-on .ic { color: ${ED.ink}; }
    .ns-ed .ns-left-row .lb { font-family: ${ED.serif}; font-size: 17px; }
    .ns-ed .ns-left-row.is-on .lb { color: ${ED.accent}; font-style: italic; }
    .ns-ed .ns-left-row .ns-pro { font-size: 9px; padding: 2px 6px; }

    /* Tooltip used in rail mode */
    .ns-ed .ns-tip {
      position: absolute; left: calc(100% + 12px); top: 50%;
      transform: translateY(-50%);
      background: ${ED.ink}; color: ${ED.paper50};
      font-family: ${ED.sans}; font-size: 12px;
      padding: 6px 10px; border-radius: 4px;
      white-space: nowrap; pointer-events: none;
      opacity: 0; transition: opacity .12s ease;
      z-index: 200; display: none;
    }
    .ns-ed .ns-tip-pro {
      font-family: ${ED.mono}; font-size: 9px; letter-spacing: 0.14em;
      margin-left: 8px; padding: 1px 5px; border: 1px solid ${ED.paper50};
      border-radius: 3px; font-style: normal;
    }

    /* Rail mode: hide labels/ords/pro, collapse grid, show tooltips */
    @media (min-width: 640px) and (max-width: 899px) {
      .ns-ed .ns-left-nav { padding: 4px 8px 12px; }
      .ns-ed .ns-left-sec-h { display: none; }
      .ns-ed .ns-left-sec + .ns-left-sec {
        margin-top: 14px; padding-top: 14px;
        border-top: 1px solid ${ED.rule};
      }
      .ns-ed .ns-left-row {
        grid-template-columns: 1fr;
        justify-items: center; padding: 11px 4px;
      }
      .ns-ed .ns-left-row .ord,
      .ns-ed .ns-left-row .lb,
      .ns-ed .ns-left-row .ns-pro { display: none; }
      .ns-ed .ns-left-row .ic { width: 100%; justify-content: center; }
      .ns-ed .ns-left-row .ic svg { width: 18px; height: 18px; }
      .ns-ed .ns-left-row.is-on .ic { color: ${ED.accent}; }
      .ns-ed .ns-left-row.is-on::before {
        content: ""; position: absolute; left: 0; top: 8px; bottom: 8px;
        width: 2px; background: ${ED.accent}; border-radius: 0 2px 2px 0;
      }
      .ns-ed .ns-tip { display: block; }
      .ns-ed .ns-left-row:hover .ns-tip,
      .ns-ed .ns-left-row:focus-visible .ns-tip { opacity: 1; }
    }

    .ns-ed .ns-left-foot { padding: 0 12px; }
    @media (min-width: 640px) and (max-width: 899px) {
      .ns-ed .ns-left-foot { padding: 0 8px; }
    }
    .ns-ed .ns-left-logout {
      position: relative;
      display: inline-flex; align-items: center; gap: 10px;
      padding: 9px 14px; border-radius: 999px;
      border: 1px solid ${ED.rule}; background: transparent; cursor: pointer;
      color: ${ED.ink}; font-family: ${ED.sans}; font-size: 13px;
      transition: border-color .15s ease;
      margin: 12px 0 0;
    }
    .ns-ed .ns-left-logout:hover { border-color: ${ED.ink}; }
    .ns-ed .ns-left-logout:disabled { opacity: 0.5; cursor: not-allowed; }
    @media (min-width: 640px) and (max-width: 899px) {
      .ns-ed .ns-left-logout {
        width: 40px; height: 40px; padding: 0;
        justify-content: center; gap: 0; margin: 12px auto 0;
      }
      .ns-ed .ns-left-logout .lb { display: none; }
      .ns-ed .ns-left-logout:hover .ns-tip { opacity: 1; }
    }
    @media (min-width: 900px) {
      .ns-ed .ns-left-logout .ns-tip { display: none !important; }
    }

    /* ═════════════════════════════════════════════════
       TOP STRIP (DESKTOP + TABLET)
       ═════════════════════════════════════════════════ */
    .ns-ed .ns-mh {
      position: fixed; top: 0; right: 0; z-index: 95;
      background: ${ED.paper100};
      border-bottom: 1px solid ${ED.rule};
      display: flex; align-items: center;
    }

    .ns-ed .ns-mh--desktop {
      left: ${leftW}px;
      height: ${desktopH}px;
      display: none;
      grid-template-columns: minmax(0, 1fr) minmax(180px, 560px) minmax(0, 1fr);
      align-items: center;
      gap: clamp(8px, 1.5vw, 20px);
      padding: 0 clamp(12px, 2vw, 24px);
      transition: left .25s cubic-bezier(.32,.72,0,1);
    }
    @media (min-width: 640px) { .ns-ed .ns-mh--desktop { display: grid; } }
    @media (min-width: 640px) and (max-width: 899px) {
      .ns-ed .ns-mh--desktop { left: ${railW}px; }
    }

    .ns-ed .ns-mh--mobile {
      left: 0; right: 0;
      height: ${mobileH}px;
      padding: 0 16px;
      padding-top: env(safe-area-inset-top, 0px);
      flex-direction: column;
      display: flex;
    }
    @media (min-width: 640px) { .ns-ed .ns-mh--mobile { display: none; } }

    /* ── Mobile masthead inner ── */
    .ns-ed .ns-mh-mobile-row {
      width: 100%; height: ${mobileH}px;
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px;
      transition: opacity .15s ease;
    }
    .ns-ed .ns-mh-mobile-row.is-hidden {
      opacity: 0; pointer-events: none;
      position: absolute; left: 16px; right: 16px;
    }
    .ns-ed .ns-mh-mobile-actions {
      display: flex; align-items: center; gap: 8px;
    }
    .ns-ed .ns-mh-mobile-search {
      position: absolute; top: env(safe-area-inset-top, 0px);
      left: 12px; right: 12px;
      height: ${mobileH}px;
      display: flex; align-items: center;
    }
    .ns-ed .ns-mh-mobile-search .ns-search { flex: 1; }
    .ns-ed .ns-search--mobile { padding: 9px 14px; }
    .ns-ed .ns-search--mobile input { font-size: 13px; }

    /* ── Dateline (adaptive) ── */
    .ns-ed .ns-mh-left { display: flex; align-items: center; min-width: 0; }
    .ns-ed .ns-dateline {
      font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase;
      color: ${ED.inkFaint}; display: inline-flex; align-items: center;
      white-space: nowrap; overflow: hidden;
    }
    .ns-ed .ns-dateline-full,
    .ns-ed .ns-dateline-mid { display: none; }
    /* ≥1200: show full date string */
    @media (min-width: 1200px) {
      .ns-ed .ns-dateline-full { display: inline; }
    }
    /* 900–1199: show only VOL/NO */
    @media (min-width: 900px) and (max-width: 1199px) {
      .ns-ed .ns-dateline-mid { display: inline; }
    }
    /* 640–899: dot only (no text) */

    .ns-ed .ns-dot {
      display: inline-block; width: 6px; height: 6px; border-radius: 999px;
      background: ${ED.accent}; margin-right: 10px; flex-shrink: 0;
      animation: ns-dot-pulse 2.4s ease-in-out infinite;
    }
    @media (max-width: 899px) {
      .ns-ed .ns-dot { margin-right: 0; }
    }
    @keyframes ns-dot-pulse { 0%,100% { transform: scale(1); opacity: 1;} 50% { transform: scale(1.4); opacity: 0.5; } }

    /* ── Wordmark ── */
    .ns-ed .ns-wordmark {
      display: inline-flex; align-items: baseline;
      color: ${ED.ink}; text-decoration: none; min-width: 0;
    }
    .ns-ed .ns-wordmark-name {
      font-family: ${ED.serif}; font-size: clamp(22px, 3.5vw, 26px);
      letter-spacing: -0.01em; color: ${ED.ink}; line-height: 1;
    }
    .ns-ed .ns-wordmark-co {
      font-family: ${ED.serif}; font-style: italic;
      font-size: clamp(13px, 2vw, 16px);
      color: ${ED.inkFaint}; margin-left: 5px;
    }

    /* ── Search (top strip) ── */
    .ns-ed .ns-mh-center { display: flex; justify-content: center; min-width: 0; }
    .ns-ed .ns-search-wrap { position: relative; width: 100%; max-width: 560px; }
    .ns-ed .ns-search {
      display: flex; align-items: center; gap: 10px;
      background: ${ED.paper50}; border: 1px solid ${ED.rule};
      border-radius: 999px; padding: 9px 16px;
      transition: border-color .18s ease;
      min-width: 0;
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
      background: ${ED.paper100}; flex-shrink: 0;
    }
    /* Hide ⌘K hint when very tight */
    @media (max-width: 899px) {
      .ns-ed .ns-mh--desktop .ns-kbd { display: none; }
    }
    .ns-ed .ns-search-clear {
      width: 18px; height: 18px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      color: ${ED.inkFaint}; background: transparent; border: 0; cursor: pointer;
      flex-shrink: 0;
    }
    .ns-ed .ns-search-clear:hover { color: ${ED.ink}; }

    /* ── Right side: icons + CTA ── */
    .ns-ed .ns-mh-right {
      display: flex; align-items: center; gap: clamp(6px, 1vw, 10px);
      justify-content: flex-end; min-width: 0;
    }
    .ns-ed .ns-icon-btn {
      position: relative; flex-shrink: 0;
      height: 34px; width: 34px; border-radius: 999px;
      display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid ${ED.rule}; color: ${ED.inkSoft};
      background: transparent; cursor: pointer;
      transition: color .18s ease, border-color .18s ease, background-color .18s ease;
    }
    .ns-ed .ns-icon-btn:hover { color: ${ED.ink}; border-color: ${ED.ink}; }
    .ns-ed .ns-icon-btn.is-on { background: ${ED.ink}; color: ${ED.paper50}; border-color: ${ED.ink}; }

    /* Hide notif button at very tight tablet widths to keep priorities */
    @media (max-width: 899px) {
      .ns-ed .ns-icon-btn--notif { display: none; }
    }

    .ns-ed .ns-qc-anchor { position: relative; }

    /* Tighten dateline column space when narrow */
    @media (max-width: 1099px) {
      .ns-ed .ns-mh--desktop {
        grid-template-columns: auto minmax(0, 1fr) auto;
      }
    }

    /* ── quick-create dropdown ── */
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
    .ns-ed .ns-qc-row .ord { font-family: ${ED.mono}; font-size: 11px; letter-spacing: 0.14em; color: ${ED.inkFaint}; }
    .ns-ed .ns-qc-row:hover .ord { color: ${ED.accent}; font-family: ${ED.serif}; font-style: italic; font-size: 14px; }
    .ns-ed .ns-qc-row .ic { color: ${ED.inkFaint}; display: inline-flex; }
    .ns-ed .ns-qc-row:hover .ic { color: ${ED.ink}; }
    .ns-ed .ns-qc-row .body { display: flex; flex-direction: column; min-width: 0; }
    .ns-ed .ns-qc-row .title { font-family: ${ED.serif}; font-size: 17px; color: ${ED.ink}; }
    .ns-ed .ns-qc-row .sub { font-family: ${ED.mono}; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: ${ED.inkFaint}; }
    .ns-ed .ns-qc-row .go { color: ${ED.inkFaint}; }
    .ns-ed .ns-qc-row:hover .go { color: ${ED.accent}; }

    /* ── Search dropdown ── */
    .ns-ed .ns-search-pop {
      position: absolute; left: 0; right: 0; top: calc(100% + 6px);
      z-index: 200; padding: 0; background: ${ED.paper50};
      overflow: hidden;
    }
    .ns-ed .ns-search-pop--mobile { top: calc(100% + 4px); }
    .ns-ed .ns-search-pop-head,
    .ns-ed .ns-search-pop-foot {
      display: flex; justify-content: space-between; align-items: center;
      padding: 9px 16px; gap: 8px;
      font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
      color: ${ED.inkFaint}; background: ${ED.paper100};
    }
    .ns-ed .ns-search-pop-head { border-bottom: 1px solid ${ED.rule}; }
    .ns-ed .ns-search-pop-foot { border-top: 1px solid ${ED.rule}; }
    @media (max-width: 640px) {
      .ns-ed .ns-search-pop-hint, .ns-ed .ns-search-pop-foot { display: none; }
    }
    .ns-ed .ns-search-pop-list {
      list-style: none; padding: 4px 0; margin: 0;
      max-height: 360px; overflow-y: auto;
    }
    .ns-ed .ns-search-row {
      display: grid; grid-template-columns: 36px 22px 1fr auto 14px;
      align-items: center; gap: 10px;
      padding: 9px 16px; width: 100%; text-align: left;
      border: 0; background: transparent; cursor: pointer;
      transition: background-color .12s ease;
    }
    .ns-ed .ns-search-row:hover,
    .ns-ed .ns-search-row.is-on { background: ${ED.paper150}; }
    .ns-ed .ns-search-row-ord {
      font-family: ${ED.mono}; font-size: 11px; letter-spacing: 0.14em; color: ${ED.inkFaint};
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
    .ns-ed .ns-search-row-arrow { transition: color .15s ease; }
    /* Hide category chip on tight tablets / mobile */
    @media (max-width: 760px) {
      .ns-ed .ns-search-row { grid-template-columns: 28px 22px 1fr 14px; }
      .ns-ed .ns-search-row-cat { display: none; }
    }

    /* ═════════════════════════════════════════════════
       MOBILE DRAWER
       ═════════════════════════════════════════════════ */
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
    .ns-ed .ns-md-row:hover, .ns-ed .ns-md-row.is-on { background: ${ED.paper150}; }
    .ns-ed .ns-md-row .ord {
      font-family: ${ED.mono}; font-size: 10.5px; letter-spacing: 0.14em; color: ${ED.inkFaint};
    }
    .ns-ed .ns-md-row.is-on .ord {
      color: ${ED.accent}; font-family: ${ED.serif}; font-style: italic; font-size: 14px;
    }
    .ns-ed .ns-md-row .ic { color: ${ED.inkFaint}; display: inline-flex; }
    .ns-ed .ns-md-row.is-on .ic { color: ${ED.ink}; }
    .ns-ed .ns-md-row .lb { font-family: ${ED.serif}; font-size: 17px; }
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
      transition: border-color .15s ease;
      margin: 12px 12px 0;
    }
    .ns-ed .ns-md-logout:hover { border-color: ${ED.ink}; }
    .ns-ed .ns-md-logout:disabled { opacity: 0.5; cursor: not-allowed; }
        /* ═════════════════════════════════════════════════
       WORKSPACE SWITCHER
       ═════════════════════════════════════════════════ */
    .ns-ed .ns-ws-anchor { position: relative; padding: 0 14px 14px; }
    .ns-ed .ns-ws {
      position: relative;
      display: grid; grid-template-columns: 32px 1fr 12px;
      gap: 10px; align-items: center; width: 100%;
      padding: 8px 12px; border-radius: 6px;
      background: transparent; border: 1px solid ${ED.rule};
      cursor: pointer; text-align: left; color: ${ED.ink};
      transition: border-color .15s ease, background-color .15s ease;
    }
    .ns-ed .ns-ws:hover { border-color: ${ED.ink}; background: ${ED.paper150}; }
    .ns-ed .ns-ws-mark {
      width: 32px; height: 32px; border-radius: 4px;
      background: ${ED.ink}; color: ${ED.paper50};
      font-family: ${ED.serif}; font-style: italic; font-size: 18px;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .ns-ed .ns-ws-mark.sm { width: 22px; height: 22px; font-size: 13px; border-radius: 3px; }
    .ns-ed .ns-ws-body { display: flex; flex-direction: column; min-width: 0; }
    .ns-ed .ns-ws-eyebrow {
      font-size: 9px; letter-spacing: 0.18em; color: ${ED.inkFaint};
    }
    .ns-ed .ns-ws-name {
      font-family: ${ED.serif}; font-size: 15px; color: ${ED.ink};
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ns-ed .ns-ws-chev { color: ${ED.inkFaint}; }

    .ns-ed .ns-ws-scrim { position: fixed; inset: 0; z-index: 110; }
    .ns-ed .ns-ws-menu {
      position: absolute; top: 100%; left: 14px; right: 14px;
      z-index: 120; padding: 10px; margin-top: 4px;
      background: ${ED.paper50};
    }
    .ns-ed .ns-ws-menu-h {
      font-size: 9px; letter-spacing: 0.18em; color: ${ED.inkFaint};
      margin: 0 0 6px 4px;
    }
    .ns-ed .ns-ws-menu ul { list-style: none; margin: 0; padding: 0; }
    .ns-ed .ns-ws-menu-row {
      display: grid; grid-template-columns: 22px 1fr auto; gap: 10px;
      align-items: center; width: 100%; padding: 7px 6px;
      border: 0; background: transparent; border-radius: 4px;
      cursor: pointer; text-align: left;
      transition: background-color .12s ease;
    }
    .ns-ed .ns-ws-menu-row:hover { background: ${ED.paper150}; }
    .ns-ed .ns-ws-menu-row .lb { font-family: ${ED.serif}; font-size: 15px; color: ${ED.ink}; }
    .ns-ed .ns-ws-menu-row.is-on .lb { color: ${ED.accent}; font-style: italic; }
    .ns-ed .ns-ws-menu-row .on {
      font-size: 9px; letter-spacing: 0.16em; color: ${ED.accent};
    }
    .ns-ed .ns-ws-create {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 8px 2px; background: transparent; border: 0;
      color: ${ED.inkSoft}; font-family: ${ED.sans}; font-size: 13px;
      cursor: pointer; width: 100%;
    }
    .ns-ed .ns-ws-create:hover { color: ${ED.accent}; }

    /* Workspace switcher in tablet rail */
    @media (min-width: 640px) and (max-width: 899px) {
      .ns-ed .ns-ws-anchor { padding: 0 12px 12px; }
      .ns-ed .ns-ws {
        grid-template-columns: 1fr;
        justify-items: center; padding: 6px;
      }
      .ns-ed .ns-ws-body, .ns-ed .ns-ws-chev { display: none; }
      .ns-ed .ns-ws-menu { left: calc(100% + 8px); right: auto; width: 220px; top: 0; }
    }

    /* ═════════════════════════════════════════════════
       ACTIVE-STATE LEFT BAR + HOVER CARET
       ═════════════════════════════════════════════════ */
    @media (min-width: 900px) {
      .ns-ed .ns-left-row { padding-left: 14px; }
      .ns-ed .ns-left-row.is-on::before {
        content: ""; position: absolute; left: 2px; top: 8px; bottom: 8px;
        width: 2px; background: ${ED.accent}; border-radius: 0 2px 2px 0;
      }
      .ns-ed .ns-left-row::after {
        content: "›"; position: absolute; right: 10px;
        font-family: ${ED.serif}; font-style: italic; color: ${ED.accent};
        opacity: 0; transform: translateX(-4px);
        transition: opacity .15s ease, transform .15s ease;
        font-size: 18px; top: 50%; margin-top: -12px;
      }
      .ns-ed .ns-left-row:hover::after { opacity: 1; transform: translateX(0); }
      .ns-ed .ns-left-row.is-on::after { opacity: 0; }  /* don't show caret on active */
    }

    /* ═════════════════════════════════════════════════
       NAV ROW KEYBOARD-SHORTCUT HINTS
       ═════════════════════════════════════════════════ */
    .ns-ed .ns-kbd-hint {
      font-size: 9.5px; letter-spacing: 0.08em; color: ${ED.inkFaint};
      padding: 1px 5px; border: 1px solid ${ED.rule}; border-radius: 3px;
      background: ${ED.paper50};
    }
    .ns-ed .ns-left-row:hover .ns-kbd-hint { color: ${ED.inkSoft}; }
    @media (max-width: 899px) {
      .ns-ed .ns-kbd-hint { display: none; }
    }

    /* ═════════════════════════════════════════════════
       PINNED + RECENT MINI-LISTS
       ═════════════════════════════════════════════════ */
    .ns-ed .ns-left-extra {
      padding: 0 12px; margin-top: 18px;
    }
    .ns-ed .ns-empty {
      font-family: ${ED.serif}; font-size: 13px; color: ${ED.inkFaint};
      padding: 4px 12px; margin: 0;
    }
    .ns-ed .ns-empty em { color: ${ED.inkSoft}; }
    .ns-ed .ns-mini-list { list-style: none; padding: 0; margin: 0; }
    .ns-ed .ns-mini-row {
      display: grid; grid-template-columns: 14px 1fr auto;
      gap: 8px; align-items: center;
      padding: 5px 12px; border-radius: 4px;
      text-decoration: none; color: ${ED.inkSoft};
      transition: background-color .12s ease, color .12s ease;
    }
    .ns-ed .ns-mini-row:hover { background: ${ED.paper150}; color: ${ED.ink}; }
    .ns-ed .ns-mini-row .ic { color: ${ED.inkFaint}; }
    .ns-ed .ns-mini-row:hover .ic { color: ${ED.accent}; }
    .ns-ed .ns-mini-row .title {
      font-family: ${ED.serif}; font-size: 14px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ns-ed .ns-mini-row .ts {
      font-size: 9.5px; letter-spacing: 0.1em; color: ${ED.inkFaint};
    }
    @media (max-width: 899px) {
      .ns-ed .ns-left-extra { display: none; }
    }

    /* ═════════════════════════════════════════════════
       USAGE / PLAN FOOTER
       ═════════════════════════════════════════════════ */
    .ns-ed .ns-usage {
      padding: 14px 14px 8px; margin-top: 14px;
      border-top: 1px solid ${ED.rule};
    }
    .ns-ed .ns-usage-head {
      display: flex; justify-content: space-between; align-items: baseline;
      font-size: 10px; letter-spacing: 0.14em; color: ${ED.inkFaint};
      margin-bottom: 6px;
    }
    .ns-ed .ns-usage-plan {
      font-family: ${ED.serif}; font-style: normal; font-size: 12px;
      letter-spacing: 0; color: ${ED.inkSoft}; text-transform: none;
    }
    .ns-ed .ns-usage-plan em {
      font-style: italic; color: ${ED.accent};
    }
    .ns-ed .ns-usage-bar {
      height: 2px; background: ${ED.paper150}; border-radius: 999px;
      overflow: hidden;
    }
    .ns-ed .ns-usage-fill {
      height: 100%; background: ${ED.accent};
      transition: width .3s ease;
    }
    @media (max-width: 899px) {
      .ns-ed .ns-usage { display: none; }
    }
  `}</style>
);
