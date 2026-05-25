// src/components/Navbar.jsx
// ───────────────────────────────────────────────────────────────
// NoteStream — Editorial Navbar / Masthead (Vite drop-in)
// Drop into src/components/Navbar.jsx (overwrite existing).
// Requires: src/lib/editorial.js
//
// Your App.jsx already wraps this in a fixed-position div with z-[100],
// so this component just renders the visual chrome (dateline + nav row).
// ───────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useEditorial, ED } from "../lib/editorial";
import { FiArrowRight } from "react-icons/fi";

const NAV_LINKS = [
  { to: "/voice-notes",  label: "Voice notes" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing",      label: "Pricing" },
  { to: "/updates",      label: "Field notes" },
];

export default function Navbar() {
  useEditorial();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const today = (() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  })();

  // Hide on dashboard routes (defensive — App.jsx also hides via its wrapper)
  if (location.pathname.startsWith("/dashboard")) return null;

  return (
    <header
      className="ns-ed"
      style={{
        background: scrolled ? "color-mix(in srgb, var(--ed-paper-100) 88%, transparent)" : ED.paper100,
        backdropFilter: scrolled ? "blur(14px) saturate(140%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(14px) saturate(140%)" : "none",
        borderBottom: scrolled ? `1px solid ${ED.rule}` : "1px solid transparent",
        transition: "all .25s ease",
      }}
    >
      {/* tiny dateline */}
      <div className="ed-page" style={{ paddingTop: 10, paddingBottom: 6 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          fontFamily: ED.mono, fontSize: 10.5, letterSpacing: "0.14em",
          textTransform: "uppercase", color: ED.inkFaint,
        }}>
          <span>Vol. II · No. 24</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }} className="dateline-mid">{today}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%", background: ED.accent,
              animation: "ed-pulse 2.4s ease-in-out infinite",
            }} />
            All systems quiet
          </span>
        </div>
      </div>

      <hr className="ed-rule-soft" />

      {/* main nav row */}
      <nav className="ed-page mast-nav" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 32px", height: 64,
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "baseline", gap: 8, textDecoration: "none" }}>
          <span style={{
            fontFamily: ED.serif, fontSize: 26, lineHeight: 1,
            letterSpacing: "-0.02em", color: ED.ink,
          }}>
            Notestream
          </span>
          <span style={{
            fontFamily: ED.serif, fontStyle: "italic", fontSize: 14, color: ED.accent,
          }}>
            &
          </span>
          <span style={{
            fontFamily: ED.mono, fontSize: 10, letterSpacing: "0.16em",
            textTransform: "uppercase", color: ED.inkFaint,
          }}>
            Co.
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 28 }} className="nav-links">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className="ed-ulink"
              style={({ isActive }) => ({
                fontFamily: ED.sans,
                fontSize: 13.5,
                color: isActive ? ED.ink : ED.inkSoft,
                letterSpacing: "-0.005em",
                padding: "6px 0",
                fontWeight: isActive ? 500 : 400,
                backgroundSize: isActive ? "100% 1px" : "0% 1px",
              })}
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link to="/login" className="ed-ulink" style={{
            fontFamily: ED.sans, fontSize: 13.5, color: ED.inkSoft, padding: "8px 4px",
          }}>
            Sign in
          </Link>
          <Link to="/signup" className="ed-btn ed-btn-primary">
            Start reading <FiArrowRight size={14} />
          </Link>
        </div>
      </nav>

      <style>{`
        @media (max-width: 900px) {
          .ns-ed .nav-links { display: none !important; }
          .ns-ed .dateline-mid { display: none; }
        }
      `}</style>
    </header>
  );
}
