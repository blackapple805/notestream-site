// src/components/AuthShell.jsx
// ───────────────────────────────────────────────────────────────
// NoteStream — Shared editorial chrome for auth pages.
// Used by Signup, Login, ResetPassword, UpdatePassword.
// ───────────────────────────────────────────────────────────────

import { Link } from "react-router-dom";
import { useEditorial, ED } from "../lib/editorial";

export default function AuthShell({
  chapter,         // e.g. "Sign Up"
  title,           // string or JSX
  italicWord,      // optional — auto-styles last word italic + accent
  lede,            // body copy under title
  quote,           // marginalia quote { text, attr }
  footerText,      // text below form
  footerLinkLabel, // string
  footerLinkTo,    // route
  children,        // the form
}) {
  useEditorial();

  return (
    <div className="ns-ed" style={{ minHeight: "100vh" }}>
      <section style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="ed-page">
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            marginBottom: 32, flexWrap: "wrap", gap: 16,
          }}>
            <div className="ed-chapter">
              <span className="num">§</span>
              <span>{chapter}</span>
            </div>
            <Link to="/" className="ed-ulink ed-mono" style={{
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
              color: ED.inkFaint,
            }}>
              ← Back to the front page
            </Link>
          </div>
          <hr className="ed-rule-dbl" style={{ marginBottom: 56 }} />

          <div className="auth-grid" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start",
          }}>
            {/* Left: editorial column */}
            <div>
              <h1 className="ed-display" style={{
                fontSize: "clamp(44px, 6vw, 92px)", margin: 0, color: ED.ink,
                lineHeight: 0.98,
              }}>
                {italicWord ? (
                  <>
                    {title}{" "}
                    <span className="ed-italic" style={{ color: ED.accent }}>{italicWord}</span>
                  </>
                ) : title}
              </h1>

              {lede && (
                <p className="ed-lede" style={{ marginTop: 28, maxWidth: 460 }}>
                  {lede}
                </p>
              )}

              {quote && (
                <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${ED.rule}` }}>
                  <div className="ed-chapter" style={{ marginBottom: 14 }}>
                    <span className="num">¶</span>
                    <span>From a field note</span>
                  </div>
                  <blockquote className="ed-serif ed-italic" style={{
                    fontSize: 22, lineHeight: 1.4, color: ED.ink, margin: 0,
                    letterSpacing: "-0.005em",
                  }}>
                    "{quote.text}"
                  </blockquote>
                  <div className="ed-mono" style={{
                    fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                    color: ED.inkFaint, marginTop: 12,
                  }}>
                    — {quote.attr}
                  </div>
                </div>
              )}
            </div>

            {/* Right: form column */}
            <div className="ed-card" style={{ padding: 36, position: "sticky", top: 120 }}>
              {children}

              {(footerText || footerLinkLabel) && (
                <div style={{
                  marginTop: 28, paddingTop: 20, borderTop: `1px solid ${ED.ruleSoft}`,
                  display: "flex", justifyContent: "space-between", alignItems: "baseline",
                  flexWrap: "wrap", gap: 10,
                }}>
                  {footerText && (
                    <span style={{ fontSize: 14, color: ED.inkMute }}>{footerText}</span>
                  )}
                  {footerLinkLabel && footerLinkTo && (
                    <Link to={footerLinkTo} className="ed-ulink" style={{
                      color: ED.accent, fontFamily: ED.sans, fontSize: 14, fontWeight: 500,
                    }}>
                      {footerLinkLabel}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .auth-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
            .ns-ed .auth-grid > div:last-child { position: static !important; }
          }
        `}</style>
      </section>
    </div>
  );
}

// Shared input style + Field helper (used by all auth pages)
export const authInputStyle = {
  width: "100%", padding: "12px 14px",
  border: `1px solid ${ED.rule}`, borderRadius: 10,
  background: ED.paper100, color: ED.ink,
  fontFamily: ED.sans, fontSize: 15,
  outline: "none",
};

export function AuthField({ label, hint, children }) {
  return (
    <label style={{ display: "block", marginBottom: 18 }}>
      <span className="ed-mono" style={{
        display: "block", fontSize: 10.5, letterSpacing: "0.14em",
        textTransform: "uppercase", color: ED.inkFaint, marginBottom: 8,
      }}>
        {label}
      </span>
      {children}
      {hint && (
        <span style={{
          display: "block", marginTop: 6, fontSize: 12.5,
          color: ED.inkFaint, lineHeight: 1.5,
        }}>
          {hint}
        </span>
      )}
    </label>
  );
}
