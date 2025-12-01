// src/components/Sidebar.jsx
import { useState, useEffect } from "react";
import {
  House,
  Note,
  MagnifyingGlass,
  Brain,
  Activity,
  BezierCurve,
  Gear,
  Crown,
} from "phosphor-react";
import { Link, useLocation } from "react-router-dom";

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

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { label: "Home", icon: <House size={22} weight="duotone" />, to: "/dashboard" },
    { label: "My Notes", icon: <Note size={22} weight="duotone" />, to: "/dashboard/notes" },
    { label: "Insights", icon: <MagnifyingGlass size={22} weight="duotone" />, to: "/dashboard/summaries" },
    { label: "Research", icon: <Brain size={22} weight="duotone" />, to: "/dashboard/documents" },
    { label: "Activity", icon: <Activity size={22} weight="duotone" />, to: "/dashboard/activity" },
    { label: "AI Lab (Pro)", icon: <BezierCurve size={22} weight="duotone" />, to: "/dashboard/ai-lab", pro: true },
    { label: "Settings", icon: <Gear size={22} weight="duotone" />, to: "/dashboard/settings" },
  ];

  return (
    <>
      {/* MOBILE BOTTOM NAV */}
      <aside
        className="
          fixed left-0 right-0 h-[75px] z-[90]
          md:hidden
          bg-theme-elevated backdrop-blur-lg
          border-t border-indigo-500/10
          shadow-[0_-4px_25px_rgba(0,0,0,0.35)]
          flex justify-between items-center px-4
          pb-[env(safe-area-inset-bottom)]
        "
        style={{
          bottom: "env(safe-area-inset-bottom, 12px)",
          transform: "translate3d(0, 0, 0)",
          WebkitOverflowScrolling: "touch",
          touchAction: "manipulation",
        }}
      >
        {navItems.map((item, i) => {
          const active = location.pathname === item.to;
          const short = item.label.split(" ")[0];

          return (
            <Link
              key={i}
              to={item.to}
              className="flex flex-col items-center justify-center flex-1 py-2"
            >
              <span className={`${active ? "text-indigo-400" : "text-theme-tertiary"} transition`}>
                {item.icon}
              </span>
              <span className={`text-[10px] mt-1 transition truncate ${active ? "text-indigo-400" : "text-theme-muted"}`}>
                {short}
              </span>
            </Link>
          );
        })}
      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`
          hidden md:flex fixed top-0 left-0 h-screen z-[80]
          bg-theme-primary backdrop-blur-xl
          border-r border-indigo-500/10
          shadow-[0_0_30px_rgba(99,102,241,0.25)]
          overflow-hidden
          transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        `}
        style={{
          width: collapsed ? "72px" : "220px",
          transform: "translate3d(0, 0, 0)",
        }}
      >
        <div className="flex flex-col h-full py-6 px-3">
          <nav className="flex flex-col gap-2 mt-2">
            {navItems.map((item, i) => {
              const active = location.pathname === item.to;

              return (
                <Link
                  key={i}
                  to={item.to}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all
                    hover:bg-indigo-500/15 border border-transparent hover:border-indigo-500/30
                    ${active ? "bg-indigo-500/20 border-indigo-500/40" : ""}
                  `}
                >
                  <span className="text-accent-indigo">{item.icon}</span>
                  <span
                    className={`
                      text-[var(--text-secondary)] text-[0.92rem] whitespace-nowrap flex items-center gap-1
                      transition-all duration-500
                      ${collapsed ? "opacity-0 w-0 translate-x-2 overflow-hidden" : "opacity-100 w-auto translate-x-0"}
                    `}
                  >
                    {item.label}
                    {item.pro && <Crown size={14} className="text-indigo-400 opacity-80" />}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-2">
            <div className="h-[1px] w-full bg-indigo-500/10 mb-3"></div>
            <p className={`text-theme-muted text-xs transition-all duration-500 ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
              v0.1 • Early Access
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
