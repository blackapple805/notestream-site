// src/pages/Search.jsx
// ───────────────────────────────────────────────────────────────
// NoteStream — Editorial Search page (Vite drop-in)
// Replaces src/pages/Search.jsx
// Requires: src/lib/editorial.js
//
// This is the PUBLIC marketing /search page — a "search the library
// of help articles & docs" surface. (The in-app archive search is
// inside the dashboard and isn't affected by this file.)
// ───────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useEditorial, ED } from "../lib/editorial";
import { FiSearch, FiArrowUpRight } from "react-icons/fi";

// Searchable items — help articles + key marketing pages.
const INDEX = [
  // Getting started
  { t: "Capturing your first voice note", c: "Help · Getting started", to: "#" },
  { t: "Importing notes from Notion or Apple Notes", c: "Help · Getting started", to: "#" },
  { t: "Understanding spaces, tags, and the archive", c: "Help · Getting started", to: "#" },
  { t: "Asking your first reasoning question", c: "Help · Getting started", to: "#" },
  // Voice
  { t: "How transcription works (and what it ignores)", c: "Help · Voice & capture", to: "#" },
  { t: "Working with the verbatim vs edited transcript", c: "Help · Voice & capture", to: "#" },
  { t: "Recording in noisy environments", c: "Help · Voice & capture", to: "#" },
  // AI
  { t: "When to use Search vs Reasoning", c: "Help · AI & reasoning", to: "#" },
  { t: "Reading the citations panel", c: "Help · AI & reasoning", to: "#" },
  { t: "Generating briefs from many notes", c: "Help · AI & reasoning", to: "#" },
  // Team
  { t: "Creating a shared space", c: "Help · Team & sharing", to: "#" },
  { t: "Permissioned reasoning", c: "Help · Team & sharing", to: "#" },
  // Billing
  { t: "Switching from monthly to annual", c: "Help · Settings & billing", to: "#" },
  { t: "Education and journalism discounts", c: "Help · Settings & billing", to: "#" },
  { t: "Closing your account", c: "Help · Settings & billing", to: "#" },
  // Privacy
  { t: "What we collect, what we don't", c: "Help · Privacy & security", to: "/privacy" },
  { t: "On-device transcription explained", c: "Help · Privacy & security", to: "#" },
  { t: "Reporting a security issue", c: "Help · Privacy & security", to: "/support" },
  // Marketing pages
  { t: "How NoteStream works", c: "Pages", to: "/how-it-works" },
  { t: "Pricing & plans", c: "Pages", to: "/pricing" },
  { t: "Voice notes — the product", c: "Pages", to: "/voice-notes" },
  { t: "Smart notes — the product", c: "Pages", to: "/smart-notes" },
  { t: "AI summaries — the product", c: "Pages", to: "/ai-summary" },
  { t: "Integrations", c: "Pages", to: "/integrations-landing" },
  { t: "Field notes (changelog)", c: "Pages", to: "/updates" },
  { t: "Status board", c: "Pages", to: "/status" },
  { t: "Terms of service", c: "Pages", to: "/terms" },
];

const POPULAR = [
  "voice notes",
  "import from notion",
  "ai briefs",
  "education discount",
  "privacy",
  "cancel subscription",
  "shared spaces",
];

export default function Search() {
  useEditorial();
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return INDEX.filter((r) =>
      r.t.toLowerCase().includes(needle) || r.c.toLowerCase().includes(needle)
    ).slice(0, 12);
  }, [q]);

  return (
    <div className="ns-ed" style={{ minHeight: "100vh" }}>
      {/* ── Hero ─────────────────────────── */}
      <section style={{ paddingTop: 140, paddingBottom: 56 }}>
        <div className="ed-page">
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            marginBottom: 48, flexWrap: "wrap", gap: 16,
          }}>
            <div className="ed-chapter">
              <span className="num">§</span>
              <span>The Search</span>
            </div>
            <div className="ed-mono" style={{
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint,
            }}>
              {INDEX.length} articles & pages indexed
            </div>
          </div>
          <hr className="ed-rule-dbl" style={{ marginBottom: 48 }} />

          <h1 className="ed-display" style={{
            fontSize: "clamp(48px, 7.4vw, 120px)", margin: 0, color: ED.ink,
          }}>
            Search the<br />
            <span className="ed-italic" style={{ color: ED.accent }}>library.</span>
          </h1>
          <p className="ed-lede" style={{ marginTop: 28, maxWidth: 620 }}>
            Help articles, product pages, the privacy policy, the changelog —
            all in one place. Type a few words.
          </p>

          {/* Search bar */}
          <div style={{
            marginTop: 36, display: "flex", alignItems: "center", gap: 14,
            padding: "18px 24px", background: ED.paper50,
            border: `2px solid ${ED.ink}`, borderRadius: 16, maxWidth: 720,
          }}>
            <FiSearch size={22} style={{ color: ED.ink }} />
            <input
              autoFocus value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="What are you looking for?"
              style={{
                flex: 1, border: 0, background: "transparent", outline: "none",
                fontFamily: ED.serif, fontSize: 22, color: ED.ink,
              }}
            />
            {q && (
              <button onClick={() => setQ("")} className="ed-mono" style={{
                fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase",
                color: ED.inkFaint, padding: "4px 10px",
                background: ED.paper200, borderRadius: 6,
              }}>
                Clear
              </button>
            )}
          </div>

          {/* Popular searches */}
          {!q && (
            <div style={{ marginTop: 28 }}>
              <div className="ed-mono" style={{
                fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                color: ED.inkFaint, marginBottom: 12,
              }}>
                Popular this week
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {POPULAR.map((p) => (
                  <button key={p} onClick={() => setQ(p)} className="ed-chip" style={{
                    cursor: "pointer", transition: "border-color .15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = ED.ink}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = ED.rule}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Results ──────────────────────── */}
      <section style={{ padding: "0 0 96px" }}>
        <div className="ed-page">
          {q && (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
              marginBottom: 16, flexWrap: "wrap", gap: 12,
            }}>
              <div className="ed-chapter">
                <span className="num">§</span>
                <span>Results</span>
              </div>
              <div className="ed-mono" style={{
                fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint,
              }}>
                {results.length} {results.length === 1 ? "match" : "matches"} for "{q}"
              </div>
            </div>
          )}

          {q && results.length === 0 && (
            <div style={{
              padding: "64px 32px", textAlign: "center",
              border: `1px solid ${ED.rule}`, borderRadius: 14, background: ED.paper50,
            }}>
              <h2 className="ed-display" style={{
                fontSize: 44, margin: 0, color: ED.ink,
              }}>
                Nothing <span className="ed-italic" style={{ color: ED.accent }}>matches.</span>
              </h2>
              <p style={{ fontSize: 17, lineHeight: 1.6, color: ED.inkMute, marginTop: 14, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
                Try a broader phrase, or write to{" "}
                <a href="mailto:help@notestream.co" className="ed-ulink" style={{ color: ED.accent }}>
                  help@notestream.co
                </a>{" "}— we'll find it for you and probably add it to the library.
              </p>
              <div style={{ marginTop: 22, display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                <Link to="/help-center" className="ed-btn ed-btn-ghost">Browse all articles</Link>
                <Link to="/faq" className="ed-btn ed-btn-ghost">FAQ</Link>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div style={{ border: `1px solid ${ED.rule}`, borderRadius: 0 }}>
              {results.map((r, i) => (
                <Link key={i} to={r.to} style={{
                  display: "grid", gridTemplateColumns: "auto 1fr auto auto",
                  alignItems: "center", gap: 18,
                  padding: "18px 22px",
                  borderBottom: i < results.length - 1 ? `1px solid ${ED.rule}` : "none",
                  background: "transparent", transition: "background .15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = ED.paper50}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <span className="ed-mono" style={{
                    fontSize: 10, color: ED.inkFaint, letterSpacing: "0.08em",
                    minWidth: 24,
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="ed-serif" style={{
                    fontSize: 18, color: ED.ink, letterSpacing: "-0.005em",
                  }}>
                    <Highlight text={r.t} q={q} />
                  </span>
                  <span className="ed-mono" style={{
                    fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: ED.inkFaint,
                  }}>
                    {r.c}
                  </span>
                  <FiArrowUpRight size={14} style={{ color: ED.inkFaint }} />
                </Link>
              ))}
            </div>
          )}

          {/* Empty state — no query yet */}
          {!q && (
            <div className="search-empty" style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24,
            }}>
              {[
                { h: "Browse the library", d: "168 articles, sorted into 6 collections", to: "/help-center", cta: "Open the help centre" },
                { h: "Frequently asked", d: "12 of the most common questions", to: "/faq", cta: "Read the FAQ" },
              ].map((b) => (
                <Link key={b.h} to={b.to} style={{
                  display: "block", padding: "28px 32px",
                  background: ED.paper50, border: `1px solid ${ED.rule}`,
                  borderRadius: 14, transition: "border-color .18s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = ED.ink}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = ED.rule}>
                  <div className="ed-mono" style={{
                    fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                    color: ED.inkFaint, marginBottom: 10,
                  }}>
                    Or browse
                  </div>
                  <h3 className="ed-serif" style={{
                    fontSize: 26, margin: 0, marginBottom: 8, color: ED.ink, letterSpacing: "-0.01em",
                  }}>
                    {b.h}
                  </h3>
                  <p style={{ fontSize: 14.5, lineHeight: 1.6, color: ED.inkMute, margin: 0 }}>
                    {b.d}
                  </p>
                  <div className="ed-mono" style={{
                    marginTop: 16, fontSize: 10.5, letterSpacing: "0.12em",
                    textTransform: "uppercase", color: ED.accent,
                  }}>
                    {b.cta} →
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .search-empty { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 700px) {
            .ns-ed .search-empty + section { padding: 0 !important; }
          }
        `}</style>
      </section>
    </div>
  );
}

// Highlight the matched substring in results
function Highlight({ text, q }) {
  if (!q) return text;
  const needle = q.toLowerCase();
  const i = text.toLowerCase().indexOf(needle);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="ed-hi" style={{ color: ED.ink }}>{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}
