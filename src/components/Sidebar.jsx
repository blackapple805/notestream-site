
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
import { motion } from "framer-motion";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  // Desktop navigation
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
          MOBILE BOTTOM NAV — Clean floating pill style
      ═══════════════════════════════════════════════════════════ */}
      <aside
        className="fixed left-0 right-0 z-[90] md:hidden"
        style={{
          bottom: 0,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          transform: "translate3d(0, 0, 0)",
          WebkitOverflowScrolling: "touch",
          touchAction: "manipulation",
        }}
      >
        {/* Gradient fade for content behind */}
        <div
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, var(--bg-primary) 60%, transparent)",
          }}
        />

        {/* Nav container */}
        <div className="relative px-4 pb-2">
          <div
            className="mx-auto max-w-[320px] rounded-2xl px-1 py-2 flex items-center justify-between"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-secondary)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05) inset",
            }}
          >
            {mobileNav.map((item, i) => {
              const active = isActive(item.to);
              const Icon = item.icon;

              return (
                <Link
                  key={i}
                  to={item.to}
                  aria-label={item.label}
                  className="relative flex flex-col items-center justify-center py-1.5 flex-1"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative flex items-center justify-center"
                  >
                    {/* Active background pill */}
                    {active && (
                      <motion.div
                        layoutId="mobile-nav-indicator"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          backgroundColor: "rgba(99, 102, 241, 0.15)",
                          border: "1px solid rgba(99, 102, 241, 0.25)",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}

                    <div className="relative z-10 h-10 w-10 flex items-center justify-center">
                      <Icon
                        size={22}
                        weight={active ? "fill" : "regular"}
                        style={{
                          color: active
                            ? "var(--accent-indigo)"
                            : "var(--text-muted)",
                          transition: "color 0.2s ease",
                        }}
                      />
                    </div>
                  </motion.div>

                  {/* Active dot indicator */}
                  <motion.div
                    initial={false}
                    animate={{
                      scale: active ? 1 : 0,
                      opacity: active ? 1 : 0,
                    }}
                    className="w-1 h-1 rounded-full mt-1"
                    style={{ backgroundColor: "var(--accent-indigo)" }}
                    transition={{ duration: 0.15 }}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════
          DESKTOP SIDEBAR — Clean professional design
      ═══════════════════════════════════════════════════════════ */}
      <aside
        className="hidden md:flex fixed top-0 left-0 h-screen z-[80] overflow-hidden"
        style={{
          width: collapsed ? "80px" : "220px",
          transform: "translate3d(0, 0, 0)",
          backgroundColor: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-secondary)",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="flex flex-col h-full w-full py-5">
          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1 pt-2">
            {navItems.map((item, i) => {
              const active = isActive(item.to);
              const Icon = item.icon;

              return (
                <Link
                  key={i}
                  to={item.to}
                  className="group relative flex items-center rounded-xl transition-all duration-200"
                  style={{
                    padding: collapsed ? "10px" : "10px 12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    gap: collapsed ? "0" : "12px",
                    backgroundColor: active
                      ? "rgba(99, 102, 241, 0.1)"
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor =
                        "var(--bg-tertiary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {/* Active indicator bar - only show when expanded */}
                  {!collapsed && (
                    <motion.div
                      initial={false}
                      animate={{
                        scaleY: active ? 1 : 0,
                        opacity: active ? 1 : 0,
                      }}
                      className="absolute left-0 top-[25%] -translate-y-1/2 w-[2.5px] h-8 rounded-r-full"
                      style={{ backgroundColor: "var(--accent-indigo)" }}
                      transition={{ duration: 0.2 }}
                    />
                  )}

                  {/* Icon container */}
                  <div
                    className="flex items-center justify-center flex-shrink-0 transition-all duration-200"
                    style={{
                      width: collapsed ? "40px" : "36px",
                      height: collapsed ? "40px" : "36px",
                      borderRadius: "10px",
                      backgroundColor: active
                        ? "rgba(99, 102, 241, 0.15)"
                        : "var(--bg-tertiary)",
                      border: `1px solid ${
                        active
                          ? "rgba(99, 102, 241, 0.25)"
                          : "var(--border-secondary)"
                      }`,
                    }}
                  >
                    <Icon
                      size={collapsed ? 20 : 18}
                      weight={active ? "fill" : "duotone"}
                      style={{
                        color: active
                          ? "var(--accent-indigo)"
                          : "var(--text-muted)",
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
                      className="text-sm transition-colors duration-200"
                      style={{
                        color: active
                          ? "var(--accent-indigo)"
                          : "var(--text-secondary)",
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      {item.label}
                    </span>
                    {item.pro && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                        style={{
                          backgroundColor: "rgba(245, 158, 11, 0.15)",
                          color: "var(--accent-amber)",
                          border: "1px solid rgba(245, 158, 11, 0.25)",
                        }}
                      >
                        PRO
                      </span>
                    )}
                  </div>

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div
                      className="absolute left-full ml-3 px-3 py-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50"
                      style={{
                        backgroundColor: "var(--bg-elevated)",
                        border: "1px solid var(--border-secondary)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      }}
                    >
                      <span
                        className="text-sm font-medium whitespace-nowrap flex items-center gap-2"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.label}
                        {item.pro && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor: "rgba(245, 158, 11, 0.15)",
                              color: "var(--accent-amber)",
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
          <div className="px-3 pt-4 mt-auto">
            <div
              className="h-px w-full mb-4"
              style={{ backgroundColor: "var(--border-secondary)" }}
            />

            {/* Logout (above the logo, below divider) */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="group relative flex items-center rounded-xl transition-all duration-200 w-full disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                padding: collapsed ? "10px" : "10px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? "0" : "12px",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              aria-label="Logout"
              title={collapsed ? "Logout" : undefined}
            >
              <div
                className="flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{
                  width: collapsed ? "40px" : "36px",
                  height: collapsed ? "40px" : "36px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(244, 63, 94, 0.12)",
                  border: "1px solid rgba(244, 63, 94, 0.22)",
                }}
              >
                <SignOut
                  size={collapsed ? 20 : 18}
                  weight="duotone"
                  style={{
                    color: "var(--accent-rose)",
                  }}
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
                <span
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {loggingOut ? "Logging out…" : "Logout"}
                </span>
              </div>

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div
                  className="absolute left-full ml-3 px-3 py-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-secondary)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  }}
                >
                  <span
                    className="text-sm font-medium whitespace-nowrap"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Logout
                  </span>
                </div>
              )}
            </button>

            {/* Spacer */}
            <div className="h-2" />

            {/* Logo / Brand area */}
            <div
              className="flex items-center overflow-hidden transition-all duration-300"
              style={{
                padding: collapsed ? "8px" : "8px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? "0" : "12px",
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{
                  width: collapsed ? "40px" : "36px",
                  height: collapsed ? "40px" : "36px",
                  borderRadius: "10px",
                  background:
                    "linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))",
                }}
              >
                <Note size={collapsed ? 20 : 18} weight="fill" color="white" />
              </div>
              <div
                className="transition-all duration-300 overflow-hidden"
                style={{
                  opacity: collapsed ? 0 : 1,
                  width: collapsed ? 0 : "auto",
                }}
              >
                <span
                  className="text-sm font-semibold whitespace-nowrap block"
                  style={{ color: "var(--text-primary)" }}
                >
                  NoteStream
                </span>
                <span
                  className="text-[10px] whitespace-nowrap block"
                  style={{ color: "var(--text-muted)" }}
                >
                  Early Access • v0.1
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Inline styles for smooth interactions */}
      <style>{`
        /* Smooth scrolling performance */
        @media (min-width: 768px) {
          aside {
            will-change: width;
          }
          nav a {
            will-change: background-color;
          }
        }

        /* Mobile nav smooth transitions */
        @media (max-width: 767px) {
          aside a {
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
    </>
  );
}



