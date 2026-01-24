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

  // Full (desktop) navigation
  const navItems = useMemo(
    () => [
      { label: "Home", icon: House, to: "/dashboard" },
      { label: "My Notes", icon: Note, to: "/dashboard/notes" },
      { label: "Insights", icon: MagnifyingGlass, to: "/dashboard/summaries" },
      { label: "Research", icon: Brain, to: "/dashboard/documents" },
      { label: "Activity", icon: Activity, to: "/dashboard/activity" },
      { label: "Integrations", icon: Plugs, to: "/dashboard/integrations" },
      { label: "AI Lab (Pro)", icon: BezierCurve, to: "/dashboard/ai-lab", pro: true },
      { label: "Settings", icon: Gear, to: "/dashboard/settings" },
    ],
    []
  );

  // Mobile: only essentials, icons-only
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
      {/* MOBILE BOTTOM NAV (ICONS ONLY, NO TILES, TIGHTER SPACING) */}
      <aside
        className="fixed left-0 right-0 z-[90] md:hidden backdrop-blur-lg"
        style={{
          bottom: "env(safe-area-inset-bottom, 0px)",
          transform: "translate3d(0, 0, 0)",
          WebkitOverflowScrolling: "touch",
          touchAction: "manipulation",
          backgroundColor: "var(--bg-surface)",
          borderTop: "1px solid var(--border-secondary)",
          boxShadow: "0 -6px 28px rgba(0,0,0,0.12)",
        }}
      >
        <div
          className="h-[64px] px-2 pb-[env(safe-area-inset-bottom)] flex items-center justify-center"
          style={{ gap: 10 }}
        >
          {mobileNav.map((item, i) => {
            const active = isActive(item.to);
            const Icon = item.icon;

            return (
              <Link
                key={i}
                to={item.to}
                aria-label={item.label}
                className="flex items-center justify-center"
              >
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className="h-11 w-11 rounded-2xl flex items-center justify-center transition"
                  style={{
                    backgroundColor: active ? "rgba(99,102,241,0.12)" : "transparent",
                  }}
                >
                  <Icon
                    size={22}
                    weight={active ? "fill" : "duotone"}
                    className={active ? "text-indigo-400" : "text-theme-muted"}
                  />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* DESKTOP SIDEBAR (FULL NAV) */}
      <aside
        className="hidden md:flex fixed top-0 left-0 h-screen z-[80] backdrop-blur-xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          width: collapsed ? "76px" : "228px",
          transform: "translate3d(0, 0, 0)",
          backgroundColor: "var(--bg-surface)",
          borderRight: "1px solid var(--border-secondary)",
          boxShadow: "6px 0 30px rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex flex-col h-full py-6 px-3">
          <nav className="flex flex-col gap-1 mt-2">
            {navItems.map((item, i) => {
              const active = isActive(item.to);
              const Icon = item.icon;

              return (
                <Link
                  key={i}
                  to={item.to}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 border ${
                    active ? "border-indigo-500/25" : "border-transparent hover:border-indigo-500/15"
                  }`}
                  style={{
                    backgroundColor: active ? "rgba(99,102,241,0.10)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {/* Desktop keeps the squircle tile */}
                  <div
                    className="h-10 w-10 rounded-xl border flex items-center justify-center transition"
                    style={{
                      backgroundColor: active ? "rgba(99,102,241,0.12)" : "var(--bg-tertiary)",
                      borderColor: active ? "rgba(99,102,241,0.22)" : "var(--border-secondary)",
                    }}
                  >
                    <Icon
                      size={20}
                      weight={active ? "fill" : "duotone"}
                      className={
                        active ? "text-indigo-400" : "text-theme-muted group-hover:text-indigo-400"
                      }
                    />
                  </div>

                  <span
                    className={[
                      "text-[0.92rem] whitespace-nowrap flex items-center gap-1.5",
                      "transition-all duration-500",
                      collapsed
                        ? "opacity-0 w-0 translate-x-2 overflow-hidden"
                        : "opacity-100 w-auto translate-x-0",
                      active
                        ? "text-indigo-400 font-medium"
                        : "text-theme-secondary group-hover:text-theme-primary",
                    ].join(" ")}
                  >
                    {item.label}
                    {item.pro && <Crown size={14} weight="fill" className="text-amber-500" />}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-2">
            <div
              className="h-[1px] w-full mb-3"
              style={{ backgroundColor: "var(--border-secondary)" }}
            />
            <p
              className={`text-theme-muted text-xs transition-all duration-500 ${
                collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
              }`}
            >
              v0.1 • Early Access
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}


