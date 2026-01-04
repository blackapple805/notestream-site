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
    { label: "Home", icon: House, to: "/dashboard" },
    { label: "My Notes", icon: Note, to: "/dashboard/notes" },
    { label: "Insights", icon: MagnifyingGlass, to: "/dashboard/summaries" },
    { label: "Research", icon: Brain, to: "/dashboard/documents" },
    { label: "Activity", icon: Activity, to: "/dashboard/activity" },
    { label: "AI Lab (Pro)", icon: BezierCurve, to: "/dashboard/ai-lab", pro: true },
    { label: "Settings", icon: Gear, to: "/dashboard/settings" },
  ];

  return (
    <>
      {/* MOBILE BOTTOM NAV */}
      <aside
        className="fixed left-0 right-0 h-[75px] z-[90] md:hidden backdrop-blur-lg flex justify-between items-center px-4 pb-[env(safe-area-inset-bottom)]"
        style={{
          bottom: "env(safe-area-inset-bottom, 12px)",
          transform: "translate3d(0, 0, 0)",
          WebkitOverflowScrolling: "touch",
          touchAction: "manipulation",
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-secondary)',
          boxShadow: '0 -4px 25px rgba(0,0,0,0.1)'
        }}
      >
        {navItems.map((item, i) => {
          const active = location.pathname === item.to;
          const short = item.label.split(" ")[0];
          const Icon = item.icon;

          return (
            <Link
              key={i}
              to={item.to}
              className="flex flex-col items-center justify-center flex-1 py-2"
            >
              <Icon 
                size={22} 
                weight={active ? "fill" : "duotone"} 
                className={`transition ${active ? "text-indigo-500" : "text-theme-muted"}`}
              />
              <span className={`text-[10px] mt-1 transition truncate ${active ? "text-indigo-500 font-medium" : "text-theme-muted"}`}>
                {short}
              </span>
            </Link>
          );
        })}
      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside
        className="hidden md:flex fixed top-0 left-0 h-screen z-[80] backdrop-blur-xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          width: collapsed ? "72px" : "220px",
          transform: "translate3d(0, 0, 0)",
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-secondary)',
          boxShadow: '4px 0 25px rgba(0,0,0,0.05)'
        }}
      >
        <div className="flex flex-col h-full py-6 px-3">
          <nav className="flex flex-col gap-1 mt-2">
            {navItems.map((item, i) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;

              return (
                <Link
                  key={i}
                  to={item.to}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${active 
                      ? "bg-indigo-500/15 border border-indigo-500/30" 
                      : "border border-transparent hover:border-indigo-500/20"
                    }
                  `}
                  style={{
                    backgroundColor: active ? 'rgba(99, 102, 241, 0.12)' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon 
                    size={22} 
                    weight={active ? "fill" : "duotone"} 
                    className={`transition-colors ${active ? "text-indigo-500" : "text-theme-muted group-hover:text-indigo-500"}`}
                  />
                  <span
                    className={`
                      text-[0.92rem] whitespace-nowrap flex items-center gap-1.5
                      transition-all duration-500
                      ${collapsed ? "opacity-0 w-0 translate-x-2 overflow-hidden" : "opacity-100 w-auto translate-x-0"}
                      ${active ? "text-indigo-500 font-medium" : "text-theme-secondary group-hover:text-theme-primary"}
                    `}
                  >
                    {item.label}
                    {item.pro && (
                      <Crown 
                        size={14} 
                        weight="fill"
                        className="text-amber-500" 
                      />
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-2">
            <div 
              className="h-[1px] w-full mb-3"
              style={{ backgroundColor: 'var(--border-secondary)' }}
            ></div>
            <p className={`text-theme-muted text-xs transition-all duration-500 ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}`}>
              v0.1 • Early Access
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
