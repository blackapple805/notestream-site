// src/components/Sidebar.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  House,
  Note,
  MagnifyingGlass,
  Brain,
  Activity,
  BezierCurve,
  Gear,
  Plugs,
  SignOut,
  List as MenuIcon,
  DotsNine,
  Microphone,
  UploadSimple,
  Plus,
} from "phosphor-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { showMobileNav } from "../ui/layoutState";
import {
  FiArrowRight,
  FiSearch,
  FiEdit3,
  FiFolder,
  FiZap,
  FiActivity,
  FiCpu,
  FiMic,
  FiCloud,
  FiUsers,
  FiSettings,
  FiLink,
  FiHelpCircle,
  FiMessageCircle,
  FiBookOpen,
  FiGrid,
  FiFileText,
  FiX,
  FiMenu,
  FiChevronRight,
} from "react-icons/fi";
import { Sparkle } from "phosphor-react";

const DESKTOP_HEADER_H = 64;
const MOBILE_HEADER_H = 56;
const SIDEBAR_W_COLLAPSED = 72;

/* ─────────────────────────────────────────────
   Searchable index
   ───────────────────────────────────────────── */
const SEARCH_INDEX = [
  { id: "dashboard", title: "Dashboard", description: "Workspace overview", path: "/dashboard", category: "Pages", icon: <FiGrid size={15} />, keywords: ["home", "overview", "main", "dashboard", "start", "hub"] },
  { id: "notes", title: "Notes", description: "Create & manage notes", path: "/dashboard/notes", category: "Pages", icon: <FiEdit3 size={15} />, keywords: ["notes", "write", "create", "edit", "text", "draft", "memo", "new note"] },
  { id: "documents", title: "Research Synthesizer", description: "Upload docs & generate briefs", path: "/dashboard/documents", category: "Pages", icon: <FiFolder size={15} />, keywords: ["documents", "files", "upload", "pdf", "docx", "research", "synthesize", "brief", "doc"] },
  { id: "summaries", title: "Insight Explorer", description: "AI-powered workspace search", path: "/dashboard/summaries", category: "Pages", icon: <FiZap size={15} />, keywords: ["summaries", "insights", "explore", "ai search", "ask", "query", "find"] },
  { id: "activity", title: "Activity", description: "Recent activity & usage", path: "/dashboard/activity", category: "Pages", icon: <FiActivity size={15} />, keywords: ["activity", "history", "timeline", "recent", "log", "usage"] },
  { id: "ai-lab", title: "AI Lab", description: "Advanced AI tools", path: "/dashboard/ai-lab", category: "AI Tools", icon: <FiCpu size={15} />, keywords: ["ai", "lab", "tools", "experiments", "advanced"] },
  { id: "custom-training", title: "Custom AI Training", description: "Train AI on your style", path: "/dashboard/ai-lab/training", category: "AI Tools", icon: <FiCpu size={15} />, keywords: ["training", "custom", "style", "writing", "personalize", "pro"] },
  { id: "voice-notes", title: "Voice Notes", description: "Record & transcribe", path: "/dashboard/ai-lab/voice-notes", category: "AI Tools", icon: <FiMic size={15} />, keywords: ["voice", "record", "audio", "transcribe", "speech", "dictate"] },
  { id: "cloud-sync", title: "Cloud Sync", description: "Sync across devices", path: "/dashboard/ai-lab/cloud-sync", category: "AI Tools", icon: <FiCloud size={15} />, keywords: ["cloud", "sync", "backup", "devices"] },
  { id: "team-collaboration", title: "Team Collaboration", description: "Collaborate in real time", path: "/dashboard/ai-lab/team-collaboration", category: "AI Tools", icon: <FiUsers size={15} />, keywords: ["team", "collaboration", "share", "invite"] },
  { id: "settings", title: "Settings", description: "Account, theme & preferences", path: "/dashboard/settings", category: "Settings", icon: <FiSettings size={15} />, keywords: ["settings", "preferences", "account", "theme", "dark mode", "light mode", "profile", "plan", "billing"] },
  { id: "integrations", title: "Integrations", description: "Connect third-party services", path: "/dashboard/integrations", category: "Settings", icon: <FiLink size={15} />, keywords: ["integrations", "connect", "apps", "google", "slack", "notion", "api"] },
  { id: "help-center", title: "Help Center", description: "Guides & FAQs", path: "/dashboard/help-center", category: "Support", icon: <FiHelpCircle size={15} />, keywords: ["help", "support", "faq", "guide", "tutorial", "how to"] },
  { id: "contact-support", title: "Contact Support", description: "Get help from our team", path: "/dashboard/contact-support", category: "Support", icon: <FiMessageCircle size={15} />, keywords: ["contact", "support", "email", "bug", "report", "feedback"] },
  { id: "integration-docs", title: "Integration Docs", description: "API docs & guides", path: "/dashboard/integration-docs", category: "Support", icon: <FiBookOpen size={15} />, keywords: ["api", "docs", "documentation", "developer"] },
  { id: "action-new-note", title: "Create New Note", description: "Start writing now", path: "/dashboard/notes", category: "Quick Actions", icon: <FiEdit3 size={15} />, keywords: ["new", "create", "write", "start", "blank", "note"] },
  { id: "action-upload", title: "Upload a Document", description: "PDF, DOCX, or spreadsheet", path: "/dashboard/documents", category: "Quick Actions", icon: <FiFolder size={15} />, keywords: ["upload", "import", "add", "file"] },
  { id: "action-record", title: "Record Voice Note", description: "Start a voice recording", path: "/dashboard/ai-lab/voice-notes", category: "Quick Actions", icon: <FiMic size={15} />, keywords: ["record", "voice", "audio"] },
];

const CATEGORY_COLORS = {
  "Pages": { color: "#6366f1", bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.25)" },
  "AI Tools": { color: "#a855f7", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.25)" },
  "Settings": { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
  "Support": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  "Quick Actions": { color: "#f43f5e", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.25)" },
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
   Mobile nav item config (used in drawer)
   ───────────────────────────────────────────── */
const MOBILE_NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { label: "Home", icon: House, to: "/dashboard" },
      { label: "My Notes", icon: Note, to: "/dashboard/notes" },
      { label: "Insights", icon: MagnifyingGlass, to: "/dashboard/summaries" },
      { label: "Research", icon: Brain, to: "/dashboard/documents" },
      { label: "Activity", icon: Activity, to: "/dashboard/activity" },
    ],
  },
  {
    label: "AI & Pro",
    items: [
      { label: "AI Lab", icon: BezierCurve, to: "/dashboard/ai-lab", pro: true },
      { label: "Integrations", icon: Plugs, to: "/dashboard/integrations" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Settings", icon: Gear, to: "/dashboard/settings" },
    ],
  },
];


export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);

  // Desktop sidebar state
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [desktopOverlayOpen, setDesktopOverlayOpen] = useState(false);

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const mobileDrawerRef = useRef(null);
  const mobileHamburgerRef = useRef(null);

  // Quick Create
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const searchWrapperRef = useRef(null);

  const searchResults = useMemo(() => scoreSearch(searchQuery).slice(0, 7), [searchQuery]);

  const collapsed = true;

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

  /* ── Mobile drawer helpers ── */
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

  /* ── Search helpers ── */
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

  /* ── Close mobile drawer on route change ── */
  useEffect(() => {
    closeMobileDrawer();
  }, [location.pathname, closeMobileDrawer]);

  /* ── Close mobile drawer on outside click ── */
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

  /* ── Escape closes everything ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setShowQuickCreate(false); closeMobileDrawer(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeMobileDrawer]);

  /* ── Desktop sidebar close on route change ── */
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

  /* ── NAV CONFIG ── */
  const navItems = useMemo(() => [
    { label: "Home", icon: House, to: "/dashboard" },
    { label: "My Notes", icon: Note, to: "/dashboard/notes" },
    { label: "Insights", icon: MagnifyingGlass, to: "/dashboard/summaries" },
    { label: "Research", icon: Brain, to: "/dashboard/documents" },
    { label: "Activity", icon: Activity, to: "/dashboard/activity" },
    { label: "Integrations", icon: Plugs, to: "/dashboard/integrations" },
    { label: "AI Lab", icon: BezierCurve, to: "/dashboard/ai-lab", pro: true },
    { label: "Settings", icon: Gear, to: "/dashboard/settings" },
  ], []);

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

  /* ── LOGOUT ── */
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

  /* ── CSS vars ── */
  useEffect(() => {
    const root = document.documentElement;
    if (isDesktop()) {
      root.style.setProperty("--ns-desktop-header-h", `${DESKTOP_HEADER_H}px`);
    }
    // Always set mobile header height so pages can pad correctly
    root.style.setProperty("--mobile-nav-height", `${MOBILE_HEADER_H}px`);
    root.style.setProperty("--ns-mobile-header-h", `${MOBILE_HEADER_H}px`);
    return () => {
      root.style.removeProperty("--ns-desktop-header-h");
      root.style.removeProperty("--mobile-nav-height");
      root.style.removeProperty("--ns-mobile-header-h");
    };
  }, []);

  const TOPBAR_BG = "var(--bg-surface, rgba(10,10,14,0.75))";
  const TOPBAR_BORDER = "var(--border-secondary, rgba(255,255,255,0.06))";
  const BTN_BG = "var(--bg-tertiary, rgba(255,255,255,0.04))";
  const BTN_BORDER = "var(--border-secondary, rgba(255,255,255,0.08))";
  const ICON = "var(--text-primary, rgba(255,255,255,0.9))";
  const ICON_MUTED = "var(--text-muted, rgba(255,255,255,0.65))";

  /* ── Get current page title for mobile header ── */
  const currentPageTitle = useMemo(() => {
    const allItems = MOBILE_NAV_SECTIONS.flatMap((s) => s.items);
    const match = allItems.find((item) => isActive(item.to));
    return match?.label || "NoteStream";
  }, [isActive]);

  return (
    <>
      {/* ==========================================================
          DESKTOP TOP HEADER (unchanged)
      ========================================================== */}
      <header
        className="hidden md:flex fixed top-0 left-0 right-0 z-[95] items-center"
        style={{
          height: `${DESKTOP_HEADER_H}px`,
          background: TOPBAR_BG,
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          borderBottom: `1px solid ${TOPBAR_BORDER}`,
        }}
      >
        <div className="w-full px-4 flex items-center gap-3">
          {/* Left: Brand — matches mobile */}
          <Link to="/dashboard" className="flex items-center gap-2.5 min-w-[150px]" onClick={onNavClick}>
            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--accent-indigo, #6366f1), var(--accent-purple, #a855f7))",
                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.35)",
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 7H17M7 12H17M7 17H12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">
              <span style={{ color: "var(--text-primary, rgba(255,255,255,0.92))" }}>Note</span>
              <span style={{ color: "var(--accent-indigo, #6366f1)" }}>Stream</span>
            </span>
          </Link>

          {/* Center: Search */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-[760px] relative" ref={searchWrapperRef}>
              <div className="h-11 rounded-full flex items-center gap-2 px-4 transition-all duration-200"
                style={{ background: BTN_BG, border: `1px solid ${searchOpen ? "rgba(99,102,241,0.3)" : BTN_BORDER}`, boxShadow: searchOpen ? "0 4px 16px rgba(0,0,0,0.15), 0 0 8px rgba(99,102,241,0.06)" : "none" }}>
                <MagnifyingGlass size={18} weight="bold" style={{ color: ICON_MUTED }} />
                <input ref={searchInputRef} type="text" placeholder="Search pages, tools, actions…" className="w-full bg-transparent outline-none text-[13px]"
                  style={{ color: "var(--text-primary, rgba(255,255,255,0.9))" }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearchKeyDown}
                  onFocus={() => { if (searchQuery.trim().length > 0 && searchResults.length > 0) setSearchOpen(true); }} autoComplete="off" autoCorrect="off" spellCheck={false} />
                {searchQuery && (
                  <button type="button" onClick={() => { setSearchQuery(""); closeSearch(); searchInputRef.current?.focus(); }} className="p-1 rounded-full transition flex-shrink-0" style={{ color: ICON_MUTED }} aria-label="Clear search">
                    <FiX size={14} />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {searchOpen && searchResults.length > 0 && (
                  <motion.div ref={searchDropdownRef} initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 right-0 top-full mt-2 z-[200] rounded-xl border shadow-2xl overflow-hidden"
                    style={{ backgroundColor: "var(--bg-surface, rgba(15,15,20,0.95))", borderColor: "var(--border-secondary)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 20px rgba(99,102,241,0.06)" }}>
                    <div className="px-3.5 py-2 border-b flex items-center justify-between" style={{ borderColor: "var(--border-secondary)" }}>
                      <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{searchResults.length} suggestion{searchResults.length !== 1 ? "s" : ""}</span>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>↑↓ navigate · ↵ go · tab complete</span>
                    </div>
                    <div className="py-1 max-h-[360px] overflow-y-auto">
                      {searchResults.map((item, idx) => {
                        const meta = CATEGORY_COLORS[item.category] || CATEGORY_COLORS["Pages"];
                        const isHighlighted = idx === highlightIdx;
                        return (
                          <button key={item.id} type="button" onClick={() => handleSearchNavigate(item)} onMouseEnter={() => setHighlightIdx(idx)}
                            className="w-full text-left flex items-center gap-3 px-3.5 py-2.5 transition-colors"
                            style={{ backgroundColor: isHighlighted ? meta.bg : "transparent", borderLeft: isHighlighted ? `2px solid ${meta.color}` : "2px solid transparent" }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                              style={{ backgroundColor: isHighlighted ? meta.bg : "var(--bg-tertiary, rgba(255,255,255,0.04))", color: isHighlighted ? meta.color : "var(--text-muted)" }}>
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium truncate" style={{ color: isHighlighted ? "var(--text-primary)" : "var(--text-secondary)" }}>{item.title}</p>
                              <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{item.description}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md border" style={{ color: meta.color, backgroundColor: meta.bg, borderColor: meta.border }}>{item.category}</span>
                              <FiArrowRight size={12} style={{ color: meta.color, opacity: isHighlighted ? 1 : 0, transition: "opacity 0.15s ease" }} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="px-3.5 py-2 border-t flex items-center justify-center gap-1.5" style={{ borderColor: "var(--border-secondary)" }}>
                      <FiSearch size={10} style={{ color: "var(--text-muted)" }} />
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Press Enter to go · Esc to close</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Quick Create + Hamburger */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button type="button" aria-label="Quick Create" aria-expanded={showQuickCreate} onClick={() => setShowQuickCreate((v) => !v)}
                className="h-10 w-10 flex items-center justify-center transition"
                style={{ background: "transparent" }}>
                <DotsNine size={22} weight="bold" style={{ color: showQuickCreate ? "var(--accent-indigo, #6366f1)" : ICON }} />
              </button>
              <AnimatePresence>
                {showQuickCreate && (
                  <>
                    <motion.div className="fixed inset-0 z-[110] hidden md:block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeQuickCreate} style={{ background: "transparent" }} />
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute right-0 top-12 z-[120] w-[240px] rounded-2xl border shadow-xl overflow-hidden"
                      style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-secondary)", backdropFilter: "blur(16px)" }}>
                      <div className="p-2">
                        <QuickCreateItem icon={<Plus size={16} weight="bold" />} label="New Note" sub="Write a text note" onClick={() => goQuickCreate("note")} />
                        <QuickCreateItem icon={<Microphone size={16} weight="bold" />} label="New Voice Note" sub="Record & transcribe" onClick={() => goQuickCreate("voice")} />
                        <QuickCreateItem icon={<UploadSimple size={16} weight="bold" />} label="Upload File" sub="PDF / image / doc" onClick={() => goQuickCreate("upload")} />
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <button type="button" aria-label="Toggle sidebar" aria-expanded={desktopOpen}
              onClick={() => { setShowQuickCreate(false); if (desktopOpen) closeDesktopSidebar(); else openDesktopSidebarFromHamburger(); }}
              className="h-10 w-10 flex items-center justify-center transition"
              style={{ background: "transparent" }}>
              <MenuIcon size={22} weight="bold" style={{ color: desktopOpen ? "var(--accent-indigo, #6366f1)" : ICON }} />
            </button>
          </div>
        </div>
      </header>

      {/* ==========================================================
          MOBILE TOP HEADER
      ========================================================== */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-[95] flex items-center"
        style={{
          height: `${MOBILE_HEADER_H}px`,
          paddingTop: "env(safe-area-inset-top, 0px)",
          background: "var(--bg-surface, rgba(10,10,14,0.85))",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          borderBottom: `1px solid ${TOPBAR_BORDER}`,
        }}
      >
        <div className="w-full px-4 flex items-center justify-between">
          {/* Left: Brand — matches Navbar.jsx exactly */}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--accent-indigo, #6366f1), var(--accent-purple, #a855f7))",
                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.35)",
              }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 7H17M7 12H17M7 17H12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">
              <span style={{ color: "var(--text-primary)" }}>Note</span>
              <span style={{ color: "var(--accent-indigo, #6366f1)" }}>Stream</span>
            </span>
          </Link>

          {/* Right: Hamburger */}
          <button
            ref={mobileHamburgerRef}
            type="button"
            onClick={() => { if (mobileDrawerOpen) closeMobileDrawer(); else openMobileDrawer(); }}
            className="h-10 w-10 flex items-center justify-center transition"
            style={{ background: "transparent" }}
            aria-label={mobileDrawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileDrawerOpen}
          >
            {mobileDrawerOpen
              ? <FiX size={22} style={{ color: "var(--accent-indigo, #6366f1)" }} />
              : <FiMenu size={22} style={{ color: ICON }} />
            }
          </button>
        </div>
      </header>

      {/* ==========================================================
          MOBILE SLIDE-OUT DRAWER
      ========================================================== */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] md:hidden"
              style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
              onClick={closeMobileDrawer}
            />

            {/* Drawer panel — slides from right */}
            <motion.div
              ref={mobileDrawerRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="fixed top-0 right-0 z-[110] md:hidden flex flex-col"
              style={{
                width: "min(300px, 82vw)",
                height: "100dvh",
                paddingTop: "env(safe-area-inset-top, 0px)",
                background: "var(--bg-surface)",
                borderLeft: "1px solid var(--border-secondary)",
                boxShadow: "-10px 0 50px rgba(0,0,0,0.35)",
                willChange: "transform",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              role="dialog"
              aria-modal="true"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5" style={{ height: `${MOBILE_HEADER_H}px`, borderBottom: "1px solid var(--border-secondary)" }}>
                <span className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Menu</span>
                <button type="button" onClick={closeMobileDrawer} className="h-8 w-8 rounded-xl flex items-center justify-center transition"
                  style={{ background: BTN_BG, border: `1px solid ${BTN_BORDER}` }} aria-label="Close menu">
                  <FiX size={16} style={{ color: "var(--text-muted)" }} />
                </button>
              </div>

              {/* Drawer nav sections */}
              <div className="flex-1 overflow-y-auto px-3 py-4" style={{ WebkitOverflowScrolling: "touch" }}>
                {MOBILE_NAV_SECTIONS.map((section, si) => (
                  <div key={section.label} className={si > 0 ? "mt-4" : ""}>
                    <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5" style={{ color: "var(--text-muted)" }}>{section.label}</p>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const active = isActive(item.to);
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.to}
                            type="button"
                            onClick={() => handleMobileNavigate(item.to)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                            style={{
                              backgroundColor: active ? "var(--sidebar-item-active, rgba(99,102,241,0.08))" : "transparent",
                            }}
                          >
                            <Icon size={22} weight={active ? "fill" : "duotone"} style={{ color: active ? "var(--sidebar-icon-color-active, #818cf8)" : "var(--text-muted)", flexShrink: 0 }} />
                            <span className="text-[14px] font-medium flex-1 text-left" style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}>
                              {item.label}
                            </span>
                            {item.pro && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "#fbbf24" }}>PRO</span>
                            )}
                            {active && (
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent-indigo, #6366f1)" }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Drawer footer: Logout */}
              <div className="px-3 pb-4 pt-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)", borderTop: "1px solid var(--border-secondary)" }}>
                <button type="button" onClick={handleLogout} disabled={loggingOut}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition disabled:opacity-50"
                  style={{ backgroundColor: "rgba(244,63,94,0.06)" }}>
                  <SignOut size={22} weight="duotone" style={{ color: "#fb7185", flexShrink: 0 }} />
                  <span className="text-[14px] font-medium" style={{ color: "#fb7185" }}>
                    {loggingOut ? "Logging out…" : "Logout"}
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==========================================================
          DESKTOP OVERLAY
      ========================================================== */}
      <AnimatePresence>
        {desktopOverlayOpen && desktopOpen && (
          <motion.div className="hidden md:block fixed inset-0 z-[89]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0" onClick={closeDesktopSidebar} style={{ background: "var(--bg-overlay, rgba(0,0,0,0.35))" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================================
          DESKTOP SIDEBAR — RIGHT SIDE ICONS ONLY
      ========================================================== */}
      <motion.aside
        className="hidden md:flex fixed right-0 z-[90] overflow-hidden liquid-glass-sidebar"
        style={{
          top: `${DESKTOP_HEADER_H}px`,
          height: `calc(100vh - ${DESKTOP_HEADER_H}px)`,
          width: `${SIDEBAR_W_COLLAPSED}px`,
          transform: desktopOpen ? "translate3d(0,0,0)" : "translate3d(110%,0,0)",
          transition: "transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.02) 100%)" }} />
        <div className="absolute left-0 top-0 bottom-0 w-[1px] pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent 100%)" }} />

        <div className="relative flex flex-col h-full w-full py-4">
          <nav className="flex-1 px-2 space-y-0.5 pt-2">
            {navItems.map((item, i) => {
              const active = isActive(item.to);
              const Icon = item.icon;
              return (
                <Link key={i} to={item.to}
                  className="group relative flex items-center justify-center rounded-xl transition-all duration-200"
                  style={{ padding: "10px", backgroundColor: active ? "var(--sidebar-item-active)" : "transparent" }}
                  onClick={onNavClick}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "var(--sidebar-item-hover)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
                  aria-label={item.label} title={item.label}>
                  <Icon size={22} weight={active ? "fill" : "duotone"} style={{ color: active ? "var(--sidebar-icon-color-active)" : "var(--sidebar-icon-color)", transition: "color 0.2s ease" }} />
                  <div className="absolute right-full mr-2 px-3 py-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50"
                    style={{ backgroundColor: "var(--sidebar-tooltip-bg)", border: "1px solid var(--sidebar-tooltip-border)", color: "var(--sidebar-tooltip-text)", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}>
                    <span className="text-[12px] font-medium whitespace-nowrap" style={{ color: "var(--text-primary, rgba(255,255,255,0.85))" }}>
                      {item.label}
                      {item.pro && <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#fbbf24" }}>PRO</span>}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="px-2 pt-3 mt-auto">
            <div className="h-px w-full mb-3 mx-auto" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)" }} />
            <button type="button" onClick={handleLogout} disabled={loggingOut}
              className="group relative flex items-center justify-center rounded-xl transition-all duration-200 w-full disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ padding: "10px" }} aria-label="Logout" title="Logout">
              <SignOut size={22} weight="duotone" style={{ color: "#fb7185" }} />
              <div className="absolute right-full mr-2 px-3 py-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50"
                style={{ backgroundColor: "var(--sidebar-tooltip-bg)", border: "1px solid var(--sidebar-tooltip-border)", color: "var(--sidebar-tooltip-text)", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}>
                <span className="text-[12px] font-medium whitespace-nowrap" style={{ color: "var(--text-primary, rgba(255,255,255,0.85))" }}>{loggingOut ? "Logging out…" : "Logout"}</span>
              </div>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Styles */}
      <style>{`
        .liquid-glass-sidebar {
          background: var(--sidebar-glass-bg);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border-left: 1px solid var(--sidebar-glass-border);
          box-shadow: var(--sidebar-glass-shadow);
        }
        .liquid-glass-sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: var(--glass-sheen);
          opacity: 0;
          animation: liquid-shimmer 8s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes liquid-shimmer {
          0%, 100% { opacity: 0; transform: translateX(-100%); }
          50% { opacity: 0.6; }
          100% { transform: translateX(100%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .liquid-glass-sidebar::before { animation: none; }
        }
      `}</style>
    </>
  );
}

/* Quick Create Item */
const QuickCreateItem = ({ icon, label, sub, onClick }) => (
  <button type="button" onClick={onClick}
    className="w-full text-left px-3 py-2.5 rounded-xl transition flex items-start gap-3"
    style={{ color: "var(--text-secondary)" }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
    <span className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-primary)" }}>
      {icon}
    </span>
    <span className="flex-1">
      <div className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{label}</div>
      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{sub}</div>
    </span>
  </button>
);