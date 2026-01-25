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
  Crown,
  Plugs,
} from "phosphor-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

export default function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) return;

    let last = 0;
    const onScroll = () => {
      const curr = window.scrollY;
      setCollapsed(curr > last && curr > 60);
      last = curr;
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
            background: 'linear-gradient(to top, var(--bg-primary) 60%, transparent)',
          }}
        />
        
        {/* Nav container */}
        <div className="relative px-4 pb-2">
          <div
            className="mx-auto max-w-[320px] rounded-2xl px-1 py-2 flex items-center justify-between"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-secondary)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05) inset",
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
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    
                    <div className="relative z-10 h-10 w-10 flex items-center justify-center">
                      <Icon
                        size={22}
                        weight={active ? "fill" : "regular"}
                        style={{ 
                          color: active ? "var(--accent-indigo)" : "var(--text-muted)",
                          transition: "color 0.2s ease"
                        }}
                      />
                    </div>
                  </motion.div>
                  
                  {/* Active dot indicator */}
                  <motion.div
                    initial={false}
                    animate={{ 
                      scale: active ? 1 : 0,
                      opacity: active ? 1 : 0 
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
          DESKTOP SIDEBAR — Logo at bottom
      ═══════════════════════════════════════════════════════════ */}
      <aside
        className="hidden md:flex fixed top-0 left-0 h-screen z-[80] overflow-hidden"
        style={{
          width: collapsed ? "72px" : "220px",
          transform: "translate3d(0, 0, 0)",
          backgroundColor: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-secondary)",
          transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
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
                  className="group relative flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200"
                  style={{
                    backgroundColor: active ? "var(--bg-hover)" : "transparent",
                    paddingLeft: collapsed ? "12px" : "12px",
                    paddingRight: collapsed ? "12px" : "12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                  }}
                >
                  {/* Active indicator bar */}
                  <motion.div
                    initial={false}
                    animate={{
                      scaleY: active ? 1 : 0,
                      opacity: active ? 1 : 0,
                    }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                    style={{ 
                      backgroundColor: "var(--accent-indigo)",
                      display: collapsed ? "none" : "block",
                    }}
                    transition={{ duration: 0.2 }}
                  />

                  {/* Icon */}
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
                    style={{
                      backgroundColor: active 
                        ? "rgba(99, 102, 241, 0.15)" 
                        : "var(--bg-tertiary)",
                      border: `1px solid ${active ? "rgba(99, 102, 241, 0.3)" : "var(--border-secondary)"}`,
                      boxShadow: active ? "0 0 12px rgba(99, 102, 241, 0.25)" : "none",
                    }}
                  >
                    <Icon
                      size={18}
                      weight={active ? "fill" : "duotone"}
                      style={{
                        color: active ? "var(--accent-indigo)" : "var(--text-muted)",
                        transition: "color 0.2s ease",
                      }}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className="text-sm whitespace-nowrap flex items-center gap-2 transition-all duration-300"
                    style={{
                      opacity: collapsed ? 0 : 1,
                      width: collapsed ? 0 : "auto",
                      overflow: "hidden",
                      color: active ? "var(--accent-indigo)" : "var(--text-secondary)",
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    {item.label}
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
                  </span>

                  {/* Hover background */}
                  <div 
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"
                    style={{ backgroundColor: active ? "transparent" : "var(--bg-tertiary)" }}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Footer with Logo */}
          <div className="px-3 pt-4 mt-auto">
            <div 
              className="h-px w-full mb-4"
              style={{ backgroundColor: "var(--border-secondary)" }}
            />
            
            {/* Logo / Brand area - now at bottom */}
            <div 
              className="flex items-center gap-3 px-2 overflow-hidden transition-all duration-300"
              style={{ 
                justifyContent: collapsed ? "center" : "flex-start",
              }}
            >
              <div 
                className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))",
                  boxShadow: "0 0 12px rgba(99, 102, 241, 0.3)",
                }}
              >
                <Note size={18} weight="fill" color="white" />
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

      {/* Inline styles for smooth hover states */}
      <style>{`
        /* Desktop nav item hover effect */
        @media (min-width: 768px) {
          nav a:hover .icon-container {
            border-color: rgba(99, 102, 241, 0.2);
          }
          nav a:hover span:first-of-type {
            color: var(--text-primary);
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


