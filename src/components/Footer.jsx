// src/components/Footer.jsx
// ───────────────────────────────────────────────────────────────
// NoteStream — Editorial Footer / Colophon (Vite drop-in)
// Drop into src/components/Footer.jsx (overwrite existing).
// Requires: src/lib/editorial.js
// ───────────────────────────────────────────────────────────────

import { Link, useLocation } from "react-router-dom";
import { useEditorial, ED } from "../lib/editorial";
import { FiArrowRight } from "react-icons/fi";

export default function Footer() {
  useEditorial();
  const location = useLocation();

  // Defensive: don't show footer on dashboard routes
  if (location.pathname.startsWith("/dashboard")) return null;

  /* The footer is intentionally an "inverted band" — dark stripe with
     cream type, an editorial colophon convention. In dark mode the
     editorial tokens flip, which would make var(--ed-ink) cream and
     var(--ed-paper-100) ink — that produced the cream-footer bug.
     The fix is to use literal hex values (matching the light-mode
     resolved values for ink and paper-100) so the band stays dark in
     BOTH themes. Pure-black is avoided in favour of the warm near-
     black ink tone so it still feels like ink on paper. */
  const FOOTER_BG   = "#131008"; // light-mode --ed-ink
  const FOOTER_TYPE = "#f6f1e3"; // light-mode --ed-paper-100

  const today = (() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  })();

  return (
    <footer id="colophon" className="ns-ed" style={{
      paddingTop: 96, paddingBottom: 48,
      background: FOOTER_BG, color: FOOTER_TYPE,
      position: "relative",
    }}>
      <div className="ed-page">
        {/* CTA — the final pitch */}
        <div className="cta-grid" style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56,
          paddingBottom: 64, borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div>
            <div className="ed-mono" style={{
              fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)", marginBottom: 18,
            }}>
              The last page
            </div>
            <h2 className="ed-display" style={{
              fontSize: "clamp(40px, 5.6vw, 84px)", margin: 0, color: "#fff", lineHeight: 1,
            }}>
              Start the<br />
              <span className="ed-italic" style={{ color: ED.accent }}>archive.</span>
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <p className="ed-serif" style={{
              fontSize: 21, lineHeight: 1.45, color: "rgba(255,255,255,0.78)", margin: 0,
              maxWidth: 460,
            }}>
              Bring fifteen years of voice notes, twelve open browser tabs and a
              shoebox of PDFs. NoteStream will read them all, and answer when
              you ask.
            </p>
            <div style={{ marginTop: 26, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link to="/signup" className="ed-btn" style={{
                background: ED.accent, color: "#fff", borderColor: ED.accent,
              }}>
                Start free <FiArrowRight size={14} />
              </Link>
              <Link to="/support" className="ed-btn ed-btn-ghost" style={{
                color: "#fff", borderColor: "rgba(255,255,255,0.2)",
              }}>
                Talk to a human
              </Link>
            </div>
          </div>
        </div>

        {/* Sitemap-style columns */}
        <div className="footer-cols" style={{
          display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", gap: 32,
          padding: "48px 0",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
              <span className="ed-serif" style={{ fontSize: 26, color: "#fff", letterSpacing: "-0.02em" }}>
                Notestream
              </span>
              <span className="ed-serif ed-italic" style={{ fontSize: 14, color: ED.accent }}>&</span>
              <span className="ed-mono" style={{
                fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
              }}>
                Co.
              </span>
            </div>
            <p style={{
              fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,0.55)",
              maxWidth: 280, margin: 0,
            }}>
              An archive that reasons. Made for thinkers, writers, and operators
              who keep more notes than they can read.
            </p>
            <div style={{ marginTop: 22, display: "flex", gap: 14 }}>
              {["X", "GitHub", "RSS"].map((s) => (
                <a key={s} href="#" className="ed-ulink" style={{
                  fontFamily: ED.mono, fontSize: 11, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.55)",
                }}>{s}</a>
              ))}
            </div>
          </div>

          {[
            { h: "Product", items: [
              { l: "Smart notes",     to: "/smart-notes" },
              { l: "AI summaries",    to: "/ai-summary" },
              { l: "Voice notes",     to: "/voice-notes" },
              { l: "Integrations",    to: "/integrations-landing" },
            ]},
            { h: "Reading", items: [
              { l: "Field notes",     to: "/updates" },
              { l: "How it works",    to: "/how-it-works" },
              { l: "Pricing",         to: "/pricing" },
              { l: "Status",          to: "/status" },
            ]},
            { h: "Company", items: [
              { l: "Support",         to: "/support" },
              { l: "FAQ",             to: "/faq" },
              { l: "Search",          to: "/search" },
            ]},
            { h: "Small print", items: [
              { l: "Privacy",         to: "/privacy" },
              { l: "Terms",           to: "/terms" },
            ]},
          ].map((col) => (
            <div key={col.h}>
              <div className="ed-mono" style={{
                fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)", marginBottom: 14,
              }}>
                {col.h}
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                {col.items.map((it) => (
                  <li key={it.l}>
                    <Link to={it.to} className="ed-ulink" style={{
                      fontFamily: ED.serif, fontSize: 15, color: "rgba(255,255,255,0.78)",
                    }}>
                      {it.l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr style={{ border: 0, height: 1, background: "rgba(255,255,255,0.08)", margin: 0 }} />

        {/* Actual colophon */}
        <div className="colophon-bar" style={{
          display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 32,
          paddingTop: 28,
          fontFamily: ED.mono, fontSize: 10.5, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.4)",
        }}>
          <span>© 2026 · Notestream Co.</span>
          <span style={{ textAlign: "center" }}>
            Set in <span style={{
              color: "rgba(255,255,255,0.78)", fontFamily: ED.serif,
              textTransform: "none", letterSpacing: 0, fontStyle: "italic",
            }}>Instrument Serif</span>{" "}
            & <span style={{
              color: "rgba(255,255,255,0.78)", textTransform: "none", letterSpacing: 0,
            }}>Geist</span>{" "}
            · Printed monthly · {today} issue
          </span>
          <span style={{
            textAlign: "right", display: "flex", justifyContent: "flex-end",
            alignItems: "center", gap: 8,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%", background: ED.accent,
              animation: "ed-pulse 2.4s ease-in-out infinite",
            }} />
            All systems quiet
          </span>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .ns-ed .cta-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .ns-ed .footer-cols { grid-template-columns: 1fr 1fr !important; }
          .ns-ed .colophon-bar { grid-template-columns: 1fr !important; text-align: left !important; }
          .ns-ed .colophon-bar > span { text-align: left !important; justify-content: flex-start !important; }
        }
      `}</style>
    </footer>
  );
}
