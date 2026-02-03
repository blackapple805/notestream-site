// src/components/Sidebar.jsx
import { useEffect, useMemo, useState } from "react";
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
} from "phosphor-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileNavHidden, setMobileNavHidden] = useState(false);

  // Listen for modal/overlay events to hide mobile nav
  useEffect(() => {
    const handleModalOpen = () => setMobileNavHidden(true);
    const handleModalClose = () => setMobileNavHidden(false);

    window.addEventListener("modal:open", handleModalOpen);
    window.addEventListener("modal:close", handleModalClose);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const hasModal = document.body.classList.contains("modal-open");
          setMobileNavHidden(hasModal);
        }
      });
    });

    observer.observe(document.body, { attributes: true });

    return () => {
      window.removeEventListener("modal:open", handleModalOpen);
      window.removeEventListener("modal:close", handleModalClose);
      observer.disconnect();
    };
  }, []);

  // Desktop scroll collapse behavior
  useEffect(() => {
    if (window.innerWidth < 768) return;

    let last = 0;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const curr = window.scrollY;
          setCollapsed(curr > last && curr > 60);
          last = curr;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = useMemo(
    () => [
      { label: "Home", icon: House, to: "/dashboard" },
      { label: "My Notes", icon: Note, to: "/dashboard/notes" },
      { label: "Insights", icon: MagnifyingGlass, to: "/dashboard/summaries" },
      { label: "Research", icon: Brain, to: "/dashboard/documents" },
      { label: "Activity", icon: Activity, to: "/dashboard/activity" },
      { label: "Integrations", icon: Plugs, to: "/dashboard/integrations" },
      { label: "AI Lab", icon: BezierCurve, to: "/dashboard/ai-lab", pro: true },
      { label: "Settings", icon: Gear, to: "/dashboard/settings" },
    ],
    []
  );

  // Mobile: essentials only
  const mobileNav = useMemo(
    () => [
      { label: "Home", icon: House, to: "/dashboard" },
      { label: "Notes", icon: Note, to: "/dashboard/notes" },
      { label: "Insights", icon: MagnifyingGlass, to: "/dashboard/summaries" },
      { label: "Research", icon: Brain, to: "/dashboard/documents" },
      { label: "Settings", icon: Gear, to: "/dashboard/settings" },
    ],
    []
  );

  const isActive = (to) => {
    const p = location.pathname;
    if (to === "/dashboard") return p === "/dashboard";
    return p === to || p.startsWith(to + "/");
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) console.warn("Supabase signOut error:", error.message);
      }
    } finally {
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          MOBILE BOTTOM NAV — Liquid Glass (Theme-aware)
      ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {!mobileNavHidden && (
          <motion.aside
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 35,
              mass: 0.8,
            }}
            className="fixed left-0 right-0 z-[90] md:hidden"
            style={{
              bottom: 0,
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
              transform: "translate3d(0, 0, 0)",
              WebkitOverflowScrolling: "touch",
              touchAction: "manipulation",
            }}
          >
            {/* Subtle gradient fade */}
            <div
              className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
              style={{ background: "var(--mobile-nav-fade)" }}
            />

            {/* Nav container - Liquid Glass */}
            <div className="relative px-4 pb-2">
              <div className="liquid-glass-nav mx-auto max-w-[260px] rounded-[18px] px-2 py-1.5 flex items-center justify-around">
                {/* Inner glow overlay */}
                <div
                  className="absolute inset-0 rounded-[18px] pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)",
                    opacity: 0.7,
                  }}
                />

                {/* Specular highlight */}
                <div
                  className="absolute inset-x-6 top-0 h-[1px] pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.20) 50%, transparent 100%)",
                  }}
                />

                {mobileNav.map((item, i) => {
                  const active = isActive(item.to);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={i}
                      to={item.to}
                      aria-label={item.label}
                      className="relative flex items-center justify-center"
                    >
                      <motion.div
                        whileTap={{ scale: 0.85 }}
                        transition={{ duration: 0.1 }}
                        className="relative flex items-center justify-center"
                      >
                        {/* Active background - liquid pill */}
                        <AnimatePresence>
                          {active && (
                            <motion.div
                              layoutId="mobile-nav-pill"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="absolute inset-0 rounded-xl"
                              style={{
                                background: "var(--mobile-pill-bg)",
                                boxShadow: "var(--mobile-pill-shadow)",
                                border: "1px solid var(--mobile-pill-border)",
                              }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 35,
                              }}
                            />
                          )}
                        </AnimatePresence>

                        <div className="relative z-10 h-10 w-10 flex items-center justify-center">
                          <Icon
                            size={active ? 22 : 20}
                            weight={active ? "fill" : "regular"}
                            style={{
                              color: active
                                ? "var(--mobile-icon-active)"
                                : "var(--mobile-icon)",
                              // keep this subtle glow; you can also make this a variable later
                              filter: active
                                ? "drop-shadow(0 0 6px rgba(99, 102, 241, 0.35))"
                                : "none",
                              transition: "all 0.2s ease",
                            }}
                          />
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════
          DESKTOP SIDEBAR — Liquid Glass (Theme-aware)
      ═══════════════════════════════════════════════════════════ */}
      <aside
        className="hidden md:flex fixed top-0 left-0 h-screen z-[80] overflow-hidden liquid-glass-sidebar"
        style={{
          width: collapsed ? "72px" : "200px",
          transform: "translate3d(0, 0, 0)",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Inner glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.02) 100%)",
          }}
        />

        {/* Right edge highlight */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[1px] pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent 100%)",
          }}
        />

        <div className="relative flex flex-col h-full w-full py-4">
          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-0.5 pt-2">
            {navItems.map((item, i) => {
              const active = isActive(item.to);
              const Icon = item.icon;

              return (
                <Link
                  key={i}
                  to={item.to}
                  className="group relative flex items-center rounded-xl transition-all duration-200"
                  style={{
                    padding: collapsed ? "10px" : "9px 12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    gap: collapsed ? "0" : "10px",
                    backgroundColor: active
                      ? "var(--sidebar-item-active)"
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor =
                        "var(--sidebar-item-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {/* Active indicator bar */}
                  {!collapsed && (
                    <motion.div
                      initial={false}
                      animate={{
                        scaleY: active ? 1 : 0,
                        opacity: active ? 1 : 0,
                      }}
                      className="absolute left-0 top-[20%] w-[2px] h-[60%] rounded-r-full"
                      style={{ backgroundColor: "var(--sidebar-text-active)" }}
                      transition={{ duration: 0.2 }}
                    />
                  )}

                  {/* Icon container */}
                  <div
                    className="flex items-center justify-center flex-shrink-0 transition-all duration-200 rounded-lg"
                    style={{
                      width: collapsed ? "40px" : "30px",
                      height: collapsed ? "40px" : "30px",
                      backgroundColor: active
                        ? "var(--sidebar-icon-bg-active)"
                        : "var(--sidebar-icon-bg)",
                      border: `1px solid ${
                        active
                          ? "var(--sidebar-icon-border-active)"
                          : "var(--sidebar-icon-border)"
                      }`,
                      boxShadow: active
                        ? "0 0 10px rgba(99, 102, 241, 0.18)"
                        : "none",
                    }}
                  >
                    <Icon
                      size={collapsed ? 18 : 15}
                      weight={active ? "fill" : "duotone"}
                      style={{
                        color: active
                          ? "var(--sidebar-icon-color-active)"
                          : "var(--sidebar-icon-color)",
                        transition: "color 0.2s ease",
                      }}
                    />
                  </div>

                  {/* Label - hidden when collapsed */}
                  <div
                    className="flex items-center gap-2 overflow-hidden transition-all duration-300"
                    style={{
                      opacity: collapsed ? 0 : 1,
                      width: collapsed ? 0 : "auto",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      className="text-[13px] transition-colors duration-200"
                      style={{
                        color: active
                          ? "var(--sidebar-text-active)"
                          : "var(--sidebar-text)",
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      {item.label}
                    </span>

                    {item.pro && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-md font-medium"
                        style={{
                          backgroundColor: "rgba(245, 158, 11, 0.12)",
                          color: "#fbbf24",
                          border: "1px solid rgba(245, 158, 11, 0.2)",
                        }}
                      >
                        PRO
                      </span>
                    )}
                  </div>

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div
                      className="absolute left-full ml-2 px-3 py-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50"
                      style={{
                        backgroundColor: "var(--sidebar-tooltip-bg)",
                        border: "1px solid var(--sidebar-tooltip-border)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      <span
                        className="text-[12px] font-medium whitespace-nowrap flex items-center gap-2"
                        style={{ color: "var(--sidebar-tooltip-text)" }}
                      >
                        {item.label}
                        {item.pro && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor: "rgba(245, 158, 11, 0.12)",
                              color: "#fbbf24",
                            }}
                          >
                            PRO
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer with Logout + Logo */}
          <div className="px-2 pt-3 mt-auto">
            <div
              className="h-px w-full mb-3 mx-auto"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
              }}
            />

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="group relative flex items-center rounded-xl transition-all duration-200 w-full disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                padding: collapsed ? "10px" : "9px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? "0" : "10px",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(244, 63, 94, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              aria-label="Logout"
              title={collapsed ? "Logout" : undefined}
            >
              <div
                className="flex items-center justify-center flex-shrink-0 transition-all duration-200 rounded-lg"
                style={{
                  width: collapsed ? "40px" : "30px",
                  height: collapsed ? "40px" : "30px",
                  backgroundColor: "rgba(244, 63, 94, 0.08)",
                  border: "1px solid rgba(244, 63, 94, 0.15)",
                }}
              >
                <SignOut
                  size={collapsed ? 18 : 15}
                  weight="duotone"
                  style={{ color: "#fb7185" }}
                />
              </div>

              <div
                className="transition-all duration-300 overflow-hidden"
                style={{
                  opacity: collapsed ? 0 : 1,
                  width: collapsed ? 0 : "auto",
                  whiteSpace: "nowrap",
                }}
              >
                <span className="text-[13px]" style={{ color: "var(--sidebar-text)" }}>
                  {loggingOut ? "Logging out…" : "Logout"}
                </span>
              </div>

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div
                  className="absolute left-full ml-2 px-3 py-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50"
                  style={{
                    backgroundColor: "var(--sidebar-tooltip-bg)",
                    border: "1px solid var(--sidebar-tooltip-border)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <span
                    className="text-[12px] font-medium whitespace-nowrap"
                    style={{ color: "var(--sidebar-tooltip-text)" }}
                  >
                    Logout
                  </span>
                </div>
              )}
            </button>

            {/* Spacer */}
            <div className="h-1.5" />

            {/* Logo / Brand area */}
            <div
              className="flex items-center overflow-hidden transition-all duration-300"
              style={{
                padding: collapsed ? "8px" : "8px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? "0" : "10px",
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0 transition-all duration-200 rounded-lg"
                style={{
                  width: collapsed ? "40px" : "30px",
                  height: collapsed ? "40px" : "30px",
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
                  boxShadow: "0 0 14px rgba(99, 102, 241, 0.25)",
                }}
              >
                <Note size={collapsed ? 18 : 15} weight="fill" color="white" />
              </div>

              <div
                className="transition-all duration-300 overflow-hidden"
                style={{
                  opacity: collapsed ? 0 : 1,
                  width: collapsed ? 0 : "auto",
                }}
              >
                <span
                  className="text-[13px] font-semibold whitespace-nowrap block"
                  style={{ color: "var(--sidebar-tooltip-text)" }}
                >
                  NoteStream
                </span>
                <span
                  className="text-[10px] whitespace-nowrap block"
                  style={{ color: "var(--text-muted)" }}
                >
                  v0.1 • Early Access
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Liquid Glass Styles (Theme-aware via CSS variables) */}
      <style>{`
        .liquid-glass-nav {
          background: var(--mobile-nav-glass-bg);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid var(--mobile-nav-glass-border);
          box-shadow: var(--mobile-nav-glass-shadow);
          position: relative;
          overflow: hidden;
        }

        .liquid-glass-sidebar {
          background: var(--sidebar-glass-bg);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border-right: 1px solid var(--sidebar-glass-border);
          box-shadow: var(--sidebar-glass-shadow);
        }

        .liquid-glass-nav::before,
        .liquid-glass-sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: var(--glass-sheen);
          opacity: 0;
          animation: liquid-shimmer 8s ease-in-out infinite;
        }

        @keyframes liquid-shimmer {
          0%, 100% { opacity: 0; transform: translateX(-100%); }
          50% { opacity: 1; }
          100% { transform: translateX(100%); }
        }

        @media (min-width: 768px) {
          .liquid-glass-sidebar { will-change: width; }
          .liquid-glass-sidebar nav a { will-change: background-color; }
        }

        @media (max-width: 767px) {
          .liquid-glass-nav a { -webkit-tap-highlight-color: transparent; }
        }

        @media (prefers-reduced-motion: reduce) {
          .liquid-glass-nav::before,
          .liquid-glass-sidebar::before { animation: none; }
        }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPER: Call these from your modal/form components
// ═══════════════════════════════════════════════════════════

export function hideMobileNav() {
  window.dispatchEvent(new CustomEvent("modal:open"));
  document.body.classList.add("modal-open");
}

export function showMobileNav() {
  window.dispatchEvent(new CustomEvent("modal:close"));
  document.body.classList.remove("modal-open");
}


