// src/pages/HelpCenter.jsx
import { useState } from "react";
import { useEditorial, ED } from "../lib/editorial";
import { FiSearch, FiArrowRight, FiArrowUpRight } from "react-icons/fi";

export default function HelpCenter() {
  useEditorial();
  const [q, setQ] = useState("");

  const collections = [
    {
      h: "Getting started",
      desc: "First-week essentials",
      articles: [
        "Capturing your first voice note",
        "Importing notes from Notion or Apple Notes",
        "Understanding spaces, tags, and the archive",
        "Asking your first reasoning question",
        "Setting up sync across devices",
      ],
    },
    {
      h: "Voice & capture",
      desc: "Speaking to NoteStream",
      articles: [
        "How transcription works (and what it ignores)",
        "Working with the verbatim vs edited transcript",
        "Recording in noisy environments",
        "Multiple speakers in one note",
        "Pausing and resuming a recording",
      ],
    },
    {
      h: "AI & reasoning",
      desc: "Asking the archive",
      articles: [
        "When to use Search vs Reasoning",
        "Writing prompts that get better answers",
        "Reading the citations panel",
        "Generating briefs from many notes",
        "Reasoning across private vs shared spaces",
      ],
    },
    {
      h: "Team & sharing",
      desc: "Editor plan workflows",
      articles: [
        "Creating a shared space",
        "Private notes inside a team workspace",
        "Permissioned reasoning",
        "Inviting guest readers",
        "Audit log and access reports",
      ],
    },
    {
      h: "Settings & billing",
      desc: "Plans, billing, account",
      articles: [
        "Switching from monthly to annual",
        "Education and journalism discounts",
        "Pausing your subscription",
        "Exporting everything before you leave",
        "Closing your account",
      ],
    },
    {
      h: "Privacy & security",
      desc: "How your archive is kept",
      articles: [
        "What we collect, what we don't",
        "On-device transcription explained",
        "Encryption at rest, in transit",
        "Granting and revoking model access",
        "Reporting a security issue",
      ],
    },
  ];

  return (
    <div className="ns-ed" style={{ minHeight: "100vh" }}>
      <section style={{ paddingTop: 140, paddingBottom: 56 }}>
        <div className="ed-page">
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            marginBottom: 48, flexWrap: "wrap", gap: 16,
          }}>
            <div className="ed-chapter">
              <span className="num">№ 01</span>
              <span>The Help Centre</span>
            </div>
            <div className="ed-mono" style={{
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint,
            }}>
              168 articles · Updated weekly
            </div>
          </div>
          <hr className="ed-rule-dbl" style={{ marginBottom: 48 }} />

          <h1 className="ed-display" style={{
            fontSize: "clamp(48px, 7.4vw, 120px)", margin: 0, color: ED.ink,
          }}>
            A small<br />
            <span className="ed-italic" style={{ color: ED.accent }}>library</span> of answers.
          </h1>
          <p className="ed-lede" style={{ marginTop: 28, maxWidth: 620 }}>
            Articles written by the team that builds NoteStream. Short where
            possible, long when something deserves it. Search below, or browse
            by collection.
          </p>

          {/* Search bar */}
          <div style={{
            marginTop: 36, display: "flex", alignItems: "center", gap: 14,
            padding: "16px 22px", background: ED.paper50,
            border: `1px solid ${ED.rule}`, borderRadius: 14, maxWidth: 560,
          }}>
            <FiSearch size={18} style={{ color: ED.inkMute }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the help centre…"
              style={{
                flex: 1, border: 0, background: "transparent", outline: "none",
                fontFamily: ED.serif, fontSize: 18, color: ED.ink,
              }}
            />
            <span className="ed-mono" style={{
              fontSize: 10.5, letterSpacing: "0.08em",
              color: ED.inkFaint, padding: "3px 9px",
              background: ED.paper200, borderRadius: 4,
            }}>⌘K</span>
          </div>
        </div>
      </section>

      <section style={{ padding: "0 0 96px" }}>
        <div className="ed-page">
          <div className="hc-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0,
            border: `1px solid ${ED.rule}`,
          }}>
            {collections.map((c, i) => {
              const col = i % 3;
              const row = Math.floor(i / 3);
              return (
                <article key={c.h} style={{
                  padding: "32px 28px 28px",
                  borderRight: col < 2 ? `1px solid ${ED.rule}` : "none",
                  borderBottom: row === 0 ? `1px solid ${ED.rule}` : "none",
                  transition: "background .25s ease",
                  cursor: "pointer",
                }}
                className="hc-cell"
                onMouseEnter={(e) => e.currentTarget.style.background = ED.paper50}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div className="ed-serif ed-italic" style={{
                    fontSize: 24, color: ED.accent, marginBottom: 4,
                  }}>
                    {String(i + 1).padStart(2, "0")}.
                  </div>
                  <h3 className="ed-serif" style={{
                    fontSize: 24, margin: 0, marginBottom: 4, color: ED.ink,
                    letterSpacing: "-0.01em",
                  }}>
                    {c.h}
                  </h3>
                  <div className="ed-mono" style={{
                    fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                    color: ED.inkFaint, marginBottom: 18,
                  }}>
                    {c.desc}
                  </div>

                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 7 }}>
                    {c.articles.map((a, j) => (
                      <li key={j}>
                        <a href="#" className="ed-ulink" style={{
                          display: "flex", alignItems: "baseline", gap: 8,
                          fontFamily: ED.serif, fontSize: 14.5, color: ED.inkSoft,
                          lineHeight: 1.4,
                        }}>
                          <span className="ed-mono" style={{
                            fontSize: 10, color: ED.inkFaint, minWidth: 16,
                          }}>{String(j + 1).padStart(2, "0")}</span>
                          {a}
                        </a>
                      </li>
                    ))}
                  </ul>

                  <a href="#" className="ed-mono" style={{
                    display: "inline-flex", alignItems: "center", gap: 6, marginTop: 20,
                    fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: ED.accent,
                  }}>
                    Open collection <FiArrowRight size={11} />
                  </a>
                </article>
              );
            })}
          </div>

          {/* Bottom row */}
          <div style={{
            marginTop: 48, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24,
          }} className="hc-bottom">
            <div style={{
              padding: 28, background: ED.paper50,
              border: `1px solid ${ED.rule}`, borderRadius: 14,
            }}>
              <div className="ed-mono" style={{
                fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                color: ED.inkFaint, marginBottom: 10,
              }}>Frequently asked</div>
              <h3 className="ed-serif" style={{
                fontSize: 24, margin: 0, marginBottom: 12, color: ED.ink, letterSpacing: "-0.01em",
              }}>
                12 most common questions
              </h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: ED.inkMute, margin: 0 }}>
                If your question is on most people's lips, it's on the FAQ page — sorted by topic, answered plainly.
              </p>
              <a href="/faq" className="ed-btn ed-btn-ghost" style={{ marginTop: 18 }}>
                Read the FAQ <FiArrowRight size={13} />
              </a>
            </div>

            <div style={{
              padding: 28, background: ED.ink, color: ED.paper50,
              borderRadius: 14, position: "relative",
            }}>
              <div style={{
                position: "absolute", top: -1, left: 28, right: 28, height: 2,
                background: ED.accent,
              }} />
              <div className="ed-mono" style={{
                fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.45)", marginBottom: 10,
              }}>Need a person</div>
              <h3 className="ed-serif" style={{
                fontSize: 24, margin: 0, marginBottom: 12, color: "#fff", letterSpacing: "-0.01em",
              }}>
                Write to a human
              </h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "rgba(255,255,255,0.7)", margin: 0 }}>
                Our support is small but careful. Real people, replying within a day.
              </p>
              <a href="/support" className="ed-btn" style={{
                marginTop: 18, background: ED.accent, color: "#fff", borderColor: ED.accent,
              }}>
                Contact support <FiArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 1000px) {
            .ns-ed .hc-grid { grid-template-columns: 1fr 1fr !important; }
            .ns-ed .hc-cell:nth-child(odd) { border-right: 1px solid ${ED.rule} !important; }
            .ns-ed .hc-cell:nth-child(even) { border-right: none !important; }
          }
          @media (max-width: 700px) {
            .ns-ed .hc-grid { grid-template-columns: 1fr !important; }
            .ns-ed .hc-cell { border-right: none !important; border-bottom: 1px solid ${ED.rule} !important; }
            .ns-ed .hc-cell:last-child { border-bottom: none !important; }
            .ns-ed .hc-bottom { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>
    </div>
  );
}
