// src/pages/VoiceNotesMarketing.jsx
// ───────────────────────────────────────────────────────────────
// NoteStream — Editorial Voice Notes marketing page (Vite drop-in)
// Drop into src/pages/VoiceNotesMarketing.jsx (NEW file).
// Requires: src/lib/editorial.js
//
// This is a SEPARATE file from src/pages/VoiceNotes.jsx (the
// dashboard feature) so the two don't collide.
//
// You also need to update src/App.jsx — see App.jsx-diff.md.
// ───────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useEditorial, ED } from "../lib/editorial";
import {
  FiArrowRight, FiCheck,
} from "react-icons/fi";

export default function VoiceNotesMarketing() {
  useEditorial();

  const examples = [
    {
      who: "The morning walker",
      when: "6:14 am, walking",
      transcript: "Reminder for tomorrow — call back the mechanic about the Suzuki carburetor, pick up rear shock bushings before three. Also ask Maya if she's free for coffee Thursday.",
      output: { type: "Tasks", items: ["Call mechanic re: Suzuki carb", "Pick up shock bushings (by 3pm Tue)", "Text Maya about Thursday coffee"] },
      tags: ["#garage", "#thursday"],
    },
    {
      who: "The pacing thinker",
      when: "10:48 pm, hotel room",
      transcript: "I think the framing we keep returning to — quote-unquote second brain — is wrong. It's not about storage. It's about having a reader. Someone, or something, that has actually read every note I keep, and can argue back.",
      output: { type: "Linked thought", items: ["Connected to: 'reading room' (Mar 3, voice memo)", "Connected to: Q4 essay draft", "Suggested tag: #second-reader"] },
      tags: ["#essay-q4", "#manifesto"],
    },
    {
      who: "The post-meeting brain dump",
      when: "2:24 pm, after standup",
      transcript: "OK so Maya is firm on Nov 4. Eng is comfortable with that if we cut the analytics view from scope. Action items: I owe Marcus the partner brief, Maya is locking the launch site copy, and we all sync Wednesday before noon.",
      output: { type: "Meeting brief", items: ["Ship Nov 4 · scope: minus analytics view", "OWE: partner brief → Marcus", "Maya: launch copy locked", "Sync Wed before 12pm"] },
      tags: ["#atlas-launch", "#decisions"],
    },
  ];

  return (
    <div className="ns-ed" style={{ minHeight: "100vh" }}>
      {/* ── Hero ──────────────────────────── */}
      <section style={{ paddingTop: 140, paddingBottom: 64 }}>
        <div className="ed-page">
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            marginBottom: 48, flexWrap: "wrap", gap: 16,
          }}>
            <div className="ed-chapter">
              <span className="num">№ 01</span>
              <span>The Product</span>
            </div>
            <div className="ed-mono" style={{
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
              color: ED.inkFaint,
            }}>
              A long look at voice notes
            </div>
          </div>
          <hr className="ed-rule-dbl" style={{ marginBottom: 48 }} />

          <div className="vn-hero" style={{
            display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 56, alignItems: "end",
          }}>
            <div>
              <h1 className="ed-display" style={{
                fontSize: "clamp(54px, 8.8vw, 140px)", margin: 0, color: ED.ink,
              }}>
                Think out<br />
                <span className="ed-italic" style={{ color: ED.accent }}>loud.</span>
              </h1>

              <p className="ed-lede" style={{ marginTop: 32, maxWidth: 540 }}>
                Most of your good ideas don't arrive at a desk. They show up
                on walks, after meetings, halfway through reading a paragraph
                — and they vanish if you don't catch them. Voice notes in
                NoteStream are built to catch them.
              </p>

              <div style={{ marginTop: 30, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="/signup" className="ed-btn ed-btn-primary">Get the app <FiArrowRight size={14} /></a>
                <a href="#examples" className="ed-btn ed-btn-ghost">See three real notes</a>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <PhoneMock />
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 960px) {
            .ns-ed .vn-hero { grid-template-columns: 1fr !important; gap: 32px !important; }
          }
        `}</style>
      </section>

      {/* ── Three-pane flow ───────────────── */}
      <section style={{ padding: "64px 0 96px", borderTop: `1px solid ${ED.rule}` }}>
        <div className="ed-page">
          <div style={{
            marginBottom: 48, display: "grid", gridTemplateColumns: "1fr 2fr",
            gap: 56, alignItems: "end",
          }} className="vn-sec-head">
            <div>
              <div className="ed-chapter" style={{ marginBottom: 18 }}>
                <span className="num">№ 02</span>
                <span>The shape of a voice note</span>
              </div>
              <h2 className="ed-display" style={{
                fontSize: "clamp(36px, 5vw, 64px)", margin: 0, color: ED.ink,
              }}>
                Hold,<br />
                <span className="ed-italic" style={{ color: ED.accent }}>speak,</span><br />
                let go.
              </h2>
            </div>
            <p className="ed-lede" style={{ maxWidth: 540, margin: 0 }}>
              Three steps the app does for you, in the seconds between you
              putting the phone down and reaching for your coffee. No editing
              screen, no fields to fill in.
            </p>
          </div>

          <hr className="ed-rule-dbl" />

          <div className="vn-flow" style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0,
          }}>
            {[
              { n: "I",   t: "Catch",
                b: "On-device transcription kicks in the moment you start talking. The audio never leaves the phone unless you ask it to.",
                detail: "On-device · 200ms latency" },
              { n: "II",  t: "Clean",
                b: "A small editing pass collapses the false starts and 'umm's. Original audio is preserved alongside, always.",
                detail: "Lossy in text, lossless in audio" },
              { n: "III", t: "File",
                b: "We extract structure — people, projects, dates, tasks — and slot the note into the right space. You don't tag a thing.",
                detail: "Soft tags, no taxonomy" },
            ].map((s, i) => (
              <article key={s.n} style={{
                padding: "40px 32px",
                borderRight: i < 2 ? `1px solid ${ED.rule}` : "none",
              }} className="vn-step">
                <div className="ed-serif ed-italic" style={{
                  fontSize: 40, color: ED.accent, lineHeight: 1,
                }}>{s.n}.</div>
                <h3 className="ed-serif" style={{
                  fontSize: 30, margin: 0, marginTop: 12, color: ED.ink,
                  letterSpacing: "-0.01em",
                }}>{s.t}</h3>
                <p style={{
                  marginTop: 14, fontSize: 15.5, lineHeight: 1.65, color: ED.inkMute,
                }}>{s.b}</p>
                <div className="ed-mono" style={{
                  marginTop: 20, fontSize: 10.5, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: ED.inkFaint,
                }}>
                  {s.detail}
                </div>
              </article>
            ))}
          </div>
          <hr className="ed-rule-dbl" />
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .vn-sec-head { grid-template-columns: 1fr !important; gap: 24px !important; }
            .ns-ed .vn-flow { grid-template-columns: 1fr !important; }
            .ns-ed .vn-step { border-right: none !important; border-bottom: 1px solid ${ED.rule} !important; }
            .ns-ed .vn-step:last-child { border-bottom: none !important; }
          }
        `}</style>
      </section>

      {/* ── Examples reel ─────────────────── */}
      <section id="examples" style={{
        padding: "96px 0", background: ED.paper50,
        borderTop: `1px solid ${ED.rule}`, borderBottom: `1px solid ${ED.rule}`,
      }}>
        <div className="ed-page">
          <div className="ed-chapter" style={{ marginBottom: 18 }}>
            <span className="num">№ 03</span>
            <span>Three real notes</span>
          </div>
          <h2 className="ed-display" style={{
            fontSize: "clamp(36px, 5vw, 64px)", margin: 0, marginBottom: 12, color: ED.ink,
          }}>
            Caught in the<br />
            <span className="ed-italic" style={{ color: ED.accent }}>wild.</span>
          </h2>
          <p className="ed-serif" style={{
            fontSize: 19, lineHeight: 1.5, color: ED.inkMute, maxWidth: 640, marginTop: 18,
          }}>
            Anonymized voice notes from real NoteStream users (with permission).
            On the left: what they said. On the right: what NoteStream did with it.
          </p>

          <div style={{ marginTop: 56, display: "grid", gap: 0 }}>
            {examples.map((ex, i) => (
              <article key={i} style={{
                display: "grid", gridTemplateColumns: "240px 1fr 1fr", gap: 0,
                borderTop: `1px solid ${ED.rule}`,
                borderBottom: i === examples.length - 1 ? `1px solid ${ED.rule}` : "none",
                padding: "32px 0",
              }} className="ex-row">
                <div style={{ paddingRight: 32 }} className="ex-meta">
                  <div className="ed-serif ed-italic" style={{ fontSize: 22, color: ED.ink }}>
                    {ex.who}
                  </div>
                  <div className="ed-mono" style={{
                    fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                    color: ED.inkFaint, marginTop: 6,
                  }}>
                    {ex.when}
                  </div>
                  <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {ex.tags.map((t) => (
                      <span key={t} className="ed-chip">{t}</span>
                    ))}
                  </div>
                </div>

                <div style={{
                  paddingRight: 32, paddingLeft: 24,
                  borderLeft: `1px solid ${ED.rule}`,
                }} className="ex-trans">
                  <div className="ed-mono" style={{
                    fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                    color: ED.inkFaint, marginBottom: 10,
                  }}>What they said</div>
                  <p className="ed-serif" style={{
                    fontSize: 17, lineHeight: 1.55, color: ED.ink, margin: 0,
                  }}>"{ex.transcript}"</p>
                </div>

                <div style={{
                  paddingLeft: 24, borderLeft: `1px solid ${ED.rule}`,
                }} className="ex-out">
                  <div className="ed-mono" style={{
                    fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                    color: ED.accent, marginBottom: 10,
                  }}>→ {ex.output.type}</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
                    {ex.output.items.map((it, j) => (
                      <li key={j} style={{
                        display: "grid", gridTemplateColumns: "auto 1fr", gap: 10,
                        alignItems: "baseline",
                      }}>
                        <span style={{
                          width: 16, height: 16, borderRadius: "50%",
                          border: `1px solid ${ED.rule}`, color: ED.inkMute,
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <FiCheck size={10} />
                        </span>
                        <span style={{
                          fontSize: 14.5, lineHeight: 1.55, color: ED.inkSoft,
                        }}>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 1000px) {
            .ns-ed .ex-row { grid-template-columns: 1fr !important; gap: 18px !important; }
            .ns-ed .ex-meta, .ns-ed .ex-trans, .ns-ed .ex-out { padding: 0 !important; border-left: none !important; }
            .ns-ed .ex-trans, .ns-ed .ex-out { padding-top: 14px !important; border-top: 1px dotted ${ED.rule} !important; }
          }
        `}</style>
      </section>

      {/* ── Anatomy ─────────────────────── */}
      <section style={{ padding: "96px 0" }}>
        <div className="ed-page">
          <div style={{ marginBottom: 48 }}>
            <div className="ed-chapter" style={{ marginBottom: 18 }}>
              <span className="num">№ 04</span>
              <span>Anatomy of a voice note</span>
            </div>
            <h2 className="ed-display" style={{
              fontSize: "clamp(36px, 5vw, 64px)", margin: 0, color: ED.ink,
            }}>
              What you get,<br />
              <span className="ed-italic" style={{ color: ED.accent }}>per note.</span>
            </h2>
          </div>

          <div className="anatomy" style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
            border: `1px solid ${ED.rule}`,
          }}>
            {[
              ["Original audio", "Preserved, lossless. Played back at any speed."],
              ["Verbatim transcript", "Every word, every 'um'. Available when you want it."],
              ["Edited transcript", "Cleaned, the version the index reads."],
              ["Structured extract", "People, dates, tasks, decisions — pulled out, tagged."],
            ].map(([t, b], i) => (
              <div key={t} style={{
                padding: "32px 24px",
                borderRight: i < 3 ? `1px solid ${ED.rule}` : "none",
              }} className="anatomy-cell">
                <div className="ed-serif ed-italic" style={{
                  fontSize: 22, color: ED.accent, marginBottom: 8,
                }}>
                  {String(i + 1).padStart(2, "0")}.
                </div>
                <div className="ed-serif" style={{
                  fontSize: 20, color: ED.ink, letterSpacing: "-0.01em", marginBottom: 8,
                }}>{t}</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.55, color: ED.inkMute, margin: 0 }}>{b}</p>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .anatomy { grid-template-columns: 1fr 1fr !important; }
            .ns-ed .anatomy-cell:nth-child(2) { border-right: none !important; }
            .ns-ed .anatomy-cell:nth-child(1),
            .ns-ed .anatomy-cell:nth-child(2) { border-bottom: 1px solid ${ED.rule} !important; }
          }
          @media (max-width: 500px) {
            .ns-ed .anatomy { grid-template-columns: 1fr !important; }
            .ns-ed .anatomy-cell { border-right: none !important; border-bottom: 1px solid ${ED.rule} !important; }
            .ns-ed .anatomy-cell:last-child { border-bottom: none !important; }
          }
        `}</style>
      </section>

      {/* ── Privacy on voice — intentional dark mood band. Pinned to literal
          hex so it stays dark in both themes; if it used ED.ink it would
          flip to cream in dark mode and the child #fff text would vanish. */}
      <section style={{ padding: "96px 0", background: "#131008", color: "#f6f1e3" }}>
        <div className="ed-page">
          <div className="vn-priv-grid" style={{
            display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 64, alignItems: "start",
          }}>
            <div>
              <div className="ed-mono" style={{
                fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)", marginBottom: 18,
              }}>
                № 05 · On privacy
              </div>
              <h2 className="ed-display" style={{
                fontSize: "clamp(36px, 5vw, 64px)", margin: 0, color: "#fff", lineHeight: 1,
              }}>
                Your voice,<br />
                <span className="ed-italic" style={{ color: ED.accent }}>your archive.</span>
              </h2>
            </div>
            <div>
              <p className="ed-serif" style={{
                fontSize: 21, lineHeight: 1.5, color: "rgba(255,255,255,0.85)",
                margin: 0, maxWidth: 600,
              }}>
                Voice is the most intimate input. We treat it accordingly. Audio is
                captured on the device; transcription runs locally on supported
                hardware; everything is encrypted at rest. Your archive is never
                used to train a model — ours, or anyone else's.
              </p>

              <div style={{ marginTop: 36, display: "grid", gap: 0 }}>
                {[
                  ["On-device first", "Voice is transcribed on your iPhone or Mac before anything is uploaded."],
                  ["Encrypted at rest", "AES-256 on every byte we store, on every plan."],
                  ["Never used for training", "Not by us. Not by our model providers. Not by anyone."],
                  ["Export everything", "Original audio files, full transcripts, structured data — yours to take."],
                ].map(([t, b], i) => (
                  <div key={t} style={{
                    display: "grid", gridTemplateColumns: "32px 1fr",
                    gap: 16, padding: "16px 0", alignItems: "baseline",
                    borderTop: i === 0 ? "1px solid rgba(255,255,255,0.12)" : "1px dotted rgba(255,255,255,0.12)",
                    borderBottom: i === 3 ? "1px solid rgba(255,255,255,0.12)" : "none",
                  }}>
                    <span className="ed-serif ed-italic" style={{ color: ED.accent, fontSize: 20 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="ed-serif" style={{
                        fontSize: 19, color: "#fff", letterSpacing: "-0.005em",
                      }}>{t}</div>
                      <div style={{
                        fontSize: 14.5, color: "rgba(255,255,255,0.6)",
                        marginTop: 4, lineHeight: 1.5,
                      }}>{b}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .vn-priv-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          }
        `}</style>
      </section>

      {/* ── Closing ────────────────────────── */}
      <section style={{ padding: "96px 0" }}>
        <div className="ed-page" style={{ textAlign: "center" }}>
          <h2 className="ed-display" style={{
            fontSize: "clamp(40px, 6vw, 84px)", margin: "0 auto", maxWidth: 880, color: ED.ink,
          }}>
            Try it on the next<br />
            <span className="ed-italic" style={{ color: ED.accent }}>walk you take.</span>
          </h2>
          <div style={{ marginTop: 30, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <a href="/signup" className="ed-btn ed-btn-primary">Get NoteStream <FiArrowRight size={14} /></a>
            <a href="/how-it-works" className="ed-btn ed-btn-ghost">How it works</a>
          </div>
          <p className="ed-mono" style={{
            fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
            color: ED.inkFaint, marginTop: 18,
          }}>
            iOS · Mac · Web · No card required
          </p>
        </div>
      </section>
    </div>
  );
}

/* ── Animated phone mock ──
   This is a frozen marketing illustration: an iPhone with a NoteStream
   screen on it. It must look identical in light and dark mode (a phone
   frame is always near-black; the on-screen content is always the
   light-mode editorial UI). To pin it, we copy the editorial tokens to
   literal hex inside the component. Don't swap these back to ED.* unless
   you also want the phone frame to flip to cream in dark mode. */
const PHONE = {
  paper50:  "#fbf8f0",
  ink:      "#131008",
  inkSoft:  "#2a2519",
  inkFaint: "#8a8472",
  accent:   "#1f3aa8",
  accentSoft: "#dbe1f3",
};
function PhoneMock() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 130);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{
      width: 280, height: 480,
      background: PHONE.ink, borderRadius: 38, padding: 8,
      boxShadow: "0 30px 60px -20px rgba(19,16,8,0.4), 0 0 0 8px rgba(0,0,0,0.05)",
      position: "relative",
    }}>
      <div style={{
        background: PHONE.paper50, height: "100%", borderRadius: 30,
        overflow: "hidden", display: "flex", flexDirection: "column",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
          width: 90, height: 24, background: PHONE.ink, borderRadius: 14, zIndex: 2,
        }} />

        <div style={{
          display: "flex", justifyContent: "space-between", padding: "14px 22px 0",
          fontFamily: ED.mono, fontSize: 11, color: PHONE.ink, letterSpacing: 0.02,
        }}>
          <span>6:14</span>
          <span>5G</span>
        </div>

        <div style={{ flex: 1, padding: "44px 22px 22px", display: "flex", flexDirection: "column" }}>
          <div className="ed-mono" style={{
            fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase",
            color: PHONE.inkFaint, marginBottom: 8,
          }}>
            Voice note · capturing
          </div>
          <div className="ed-serif" style={{
            fontSize: 24, lineHeight: 1.15, color: PHONE.ink, letterSpacing: "-0.01em",
            marginBottom: 18,
          }}>
            Morning walk,<br />
            <span className="ed-italic" style={{ color: PHONE.accent }}>thinking aloud.</span>
          </div>

          <p className="ed-serif" style={{
            fontSize: 13, lineHeight: 1.5, color: PHONE.inkSoft, margin: 0, marginBottom: "auto",
          }}>
            "...also ask Maya if she's free for coffee Thursday
            <span style={{
              display: "inline-block", width: 1.5, height: 12, background: PHONE.accent,
              verticalAlign: "middle", marginLeft: 2, animation: "ed-blink 1s steps(2) infinite",
            }} />"
          </p>

          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 2.5,
            height: 80, marginTop: 18,
          }}>
            {Array.from({ length: 38 }).map((_, i) => {
              const h = 8 + Math.abs(Math.sin(i * 0.6 + t * 0.32)) * 50;
              return (
                <span key={i} style={{
                  width: 2.5, height: `${h}px`,
                  background: i % 7 === 0 ? PHONE.accent : PHONE.ink,
                  borderRadius: 2, transition: "height .15s",
                }} />
              );
            })}
          </div>

          <div style={{
            marginTop: 22, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: PHONE.accent, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 0 4px ${PHONE.accentSoft}`,
              position: "relative",
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: 4, background: "#fff",
              }} />
            </div>
            <div className="ed-mono" style={{
              fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase",
              color: PHONE.inkFaint,
            }}>
              Release to file
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
