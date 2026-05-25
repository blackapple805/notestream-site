// src/components/Hero.jsx
// ───────────────────────────────────────────────────────────────
// NoteStream — Editorial Hero (Vite drop-in)
// Self-contained: imports shared editorial module, uses your existing
// icon libraries, no external CSS required.
// ───────────────────────────────────────────────────────────────

import { useEditorial, ED } from "../lib/editorial";
import { FiArrowRight } from "react-icons/fi";

export default function Hero() {
  useEditorial();

  return (
    <section
      id="hero"
      className="ns-ed"
      style={{
        position: "relative",
        padding: "140px 0 80px",
        overflow: "hidden",
      }}
    >
      <div className="ed-page">
        {/* Top: chapter mark + tagline */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 56,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div className="ed-chapter">
            <span className="num">№ 01</span>
            <span>The Cover Story</span>
          </div>
          <div
            className="ed-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: ED.inkFaint,
            }}
          >
            For thinkers · For builders · For anyone with a memory worth keeping
          </div>
        </div>

        <hr className="ed-rule-dbl" style={{ marginBottom: 48 }} />

        {/* Headline grid: main + marginalia */}
        <div
          className="hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            gap: 64,
            alignItems: "start",
          }}
        >
          {/* main column */}
          <div>
            <h1
              className="ed-display ed-reveal"
              style={{
                fontSize: "clamp(56px, 9.2vw, 148px)",
                margin: 0,
                color: ED.ink,
              }}
            >
              Notes that{" "}
              <span style={{ fontStyle: "italic", color: ED.accent }}>think</span>
              <sup
                style={{
                  fontFamily: ED.mono,
                  fontSize: "0.22em",
                  fontStyle: "normal",
                  color: ED.accent,
                  verticalAlign: "super",
                  marginLeft: 4,
                  fontWeight: 500,
                }}
              >
                1
              </sup>
              <br />
              back.
            </h1>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 36,
              }}
            >
              <hr
                style={{
                  flex: "0 0 64px",
                  height: 1,
                  background: ED.ink,
                  border: 0,
                  margin: 0,
                }}
              />
              <span className="ed-eyebrow" style={{ color: ED.ink }}>
                An essay on remembering
              </span>
            </div>

            <p
              className="ed-lede ed-dropcap ed-reveal"
              style={{
                maxWidth: 600,
                marginTop: 28,
                animationDelay: "0.15s",
              }}
            >
              NoteStream is a private library for the way you actually think —
              voice memos at 6 a.m., a half-formed argument in the margin of a
              PDF, the meeting you'd rather not transcribe by hand. It reads
              everything you've kept, then{" "}
              <span className="ed-hi">answers when you ask.</span>
            </p>

            <div
              className="ed-reveal"
              style={{
                marginTop: 44,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                animationDelay: "0.3s",
              }}
            >
              <a href="/signup" className="ed-btn ed-btn-primary">
                Start free <FiArrowRight size={14} />
              </a>
              <a href="#demo" className="ed-btn ed-btn-ghost">
                Read the demonstration
              </a>
            </div>

            <div
              className="ed-reveal ed-mono"
              style={{
                marginTop: 18,
                fontSize: 11.5,
                color: ED.inkFaint,
                letterSpacing: "0.04em",
                animationDelay: "0.4s",
              }}
            >
              No card · 14-day pro trial · Yours alone, always
            </div>
          </div>

          {/* marginalia column */}
          <aside
            className="margin-col ed-reveal"
            style={{
              paddingTop: 36,
              animationDelay: "0.5s",
            }}
          >
            <div style={{ borderLeft: `1px solid ${ED.rule}`, paddingLeft: 20 }}>
              <div className="ed-chapter" style={{ marginBottom: 14 }}>
                <span className="num" style={{ fontSize: 16 }}>¹</span>
                <span>Footnote</span>
              </div>
              <p
                className="ed-serif ed-italic"
                style={{
                  fontSize: 18,
                  lineHeight: 1.45,
                  color: ED.inkSoft,
                  margin: 0,
                }}
              >
                Or: an archive that reasons. We keep your notes in their
                original form — and let a model{" "}
                <span style={{ color: ED.ink }}>read across all of them</span>{" "}
                whenever you ask a question.
              </p>

              <hr className="ed-rule-soft" style={{ margin: "22px 0" }} />

              <div
                className="ed-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  color: ED.inkFaint,
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                In this issue
              </div>
              <ol
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  fontFamily: ED.serif,
                  fontSize: 16,
                  color: ED.inkMute,
                  lineHeight: 1.6,
                }}
              >
                {[
                  ["A demonstration, in three flows", "#demo"],
                  ["How NoteStream reasons", "#reasoning"],
                  ["Six small kindnesses", "#features"],
                  ["The plans", "#pricing"],
                ].map(([t, h], i) => (
                  <li
                    key={t}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      padding: "3px 0",
                    }}
                  >
                    <span
                      className="ed-mono"
                      style={{
                        fontSize: 10,
                        color: ED.inkFaint,
                        letterSpacing: "0.08em",
                        minWidth: 18,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <a href={h} className="ed-ulink" style={{ flex: 1 }}>
                      {t}
                    </a>
                    <span
                      style={{
                        flex: "1 1 auto",
                        borderBottom: `1px dotted ${ED.rule}`,
                        transform: "translateY(-5px)",
                      }}
                    />
                    <span
                      className="ed-mono"
                      style={{ fontSize: 10, color: ED.inkFaint }}
                    >
                      p. {String((i + 1) * 3).padStart(2, "0")}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>

        {/* Trust strip */}
        <div style={{ marginTop: 96 }}>
          <hr className="ed-rule-soft" />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 0",
              flexWrap: "wrap",
              gap: 24,
            }}
          >
            <span className="ed-eyebrow">
              Read by 12,400 thinkers, writers and operators
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 36,
                flexWrap: "wrap",
                color: ED.inkFaint,
              }}
            >
              {[
                "Lattice & Co.",
                "Cortex Labs",
                "Inkwell",
                "Fieldnote Studio",
                "Quartz Press",
              ].map((n) => (
                <span
                  key={n}
                  className="ed-serif ed-italic"
                  style={{ fontSize: 19 }}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
          <hr className="ed-rule-soft" />
        </div>
      </div>
    </section>
  );
}
