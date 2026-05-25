// src/components/Demo.jsx
// ───────────────────────────────────────────────────────────────
// NoteStream — Editorial Demo (Vite drop-in)
// Self-contained: shares tokens + CSS with Hero via editorial.js.
// ───────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useEditorial, ED } from "../lib/editorial";
import {
  FiArrowRight, FiArrowUpRight, FiSearch, FiMic, FiFileText,
} from "react-icons/fi";
import {
  SparkleIcon as Sparkle,
  BrainIcon as Brain,
  QuotesIcon as Quotes,
} from "@phosphor-icons/react";

export default function Demo() {
  useEditorial();
  const [active, setActive] = useState(0);

  const flows = [
    {
      num: "I", id: "capture", label: "Capture",
      title: "A thought, before it gets away.",
      blurb: "Hold the button. Speak. NoteStream transcribes, tags, and files it where it belongs — without you opening another app.",
      aside: "Voice notes are transcribed locally first, then cleaned by the model — so even your fillers are gone before anyone sees them.",
    },
    {
      num: "II", id: "find", label: "Find",
      title: "Ask, instead of digging.",
      blurb: "Search by meaning, not keywords. Your archive becomes a conversation — a librarian who has actually read every note.",
      aside: "Every answer cites its sources. You can press through to the original note, exactly as you wrote it.",
    },
    {
      num: "III", id: "reason", label: "Reason",
      title: "Argue with your own archive.",
      blurb: "Cross-reference a year of meetings, memos and voice notes. Surface the contradictions, the patterns, the one thing that mattered.",
      aside: "Reasoning runs across spaces, dates and document types. Your week-old voice memo can support a paragraph in today's brief.",
    },
  ];

  return (
    <section id="demo" className="ns-ed" style={{ padding: "88px 0 96px" }}>
      <div className="ed-page">
        {/* Section title */}
        <div className="sec-head" style={{
          display: "grid", gridTemplateColumns: "1fr 2fr", gap: 64,
          alignItems: "end", marginBottom: 56,
        }}>
          <div>
            <div className="ed-chapter" style={{ marginBottom: 18 }}>
              <span className="num">№ 02</span>
              <span>A Demonstration</span>
            </div>
            <h2 className="ed-display" style={{ fontSize: "clamp(40px, 5.4vw, 78px)", margin: 0 }}>
              In three<br />
              <span className="ed-italic" style={{ color: ED.accent }}>movements.</span>
            </h2>
          </div>
          <p className="ed-lede" style={{ maxWidth: 540, margin: 0 }}>
            Capture is the easy part. The trick is what happens after — when
            a year of half-thoughts needs to behave like a single mind.
            What follows is how NoteStream does it.
          </p>
        </div>

        <hr className="ed-rule" style={{ marginBottom: 40 }} />

        {/* Tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
          {flows.map((f, i) => {
            const isActive = active === i;
            return (
              <button
                key={f.id}
                onClick={() => setActive(i)}
                style={{
                  textAlign: "left", border: 0, background: "transparent",
                  padding: "20px 22px",
                  borderTop: `1px solid ${ED.ink}`,
                  borderBottom: isActive ? `2px solid ${ED.ink}` : `1px solid ${ED.ruleSoft}`,
                  cursor: "pointer", transition: "all .25s ease",
                  fontFamily: ED.sans,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span className="ed-serif ed-italic" style={{
                    fontSize: 26, color: isActive ? ED.accent : ED.inkFaint, minWidth: 28,
                  }}>{f.num}.</span>
                  <div>
                    <div className="ed-serif" style={{
                      fontSize: 22, color: isActive ? ED.ink : ED.inkMute,
                      letterSpacing: "-0.01em",
                    }}>{f.label}</div>
                    <div className="ed-mono" style={{
                      fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                      color: ED.inkFaint, marginTop: 4,
                    }}>Movement {f.num}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content split */}
        <div className="demo-body" style={{
          display: "grid", gridTemplateColumns: "5fr 7fr", gap: 56,
          marginTop: 48, alignItems: "start",
        }}>
          {/* Copy */}
          <div key={"copy-" + active} className="ed-reveal">
            <h3 className="ed-display" style={{
              fontSize: "clamp(28px, 3.4vw, 44px)", margin: 0, color: ED.ink,
            }}>
              {flows[active].title.split(" ").map((w, i, arr) => (
                <span key={i}>
                  {i === arr.length - 1
                    ? <span className="ed-italic" style={{ color: ED.accent }}>{w}</span>
                    : w}
                  {i < arr.length - 1 ? " " : ""}
                </span>
              ))}
            </h3>

            <p style={{ marginTop: 22, fontSize: 17, lineHeight: 1.6, color: ED.inkSoft, maxWidth: 460 }}>
              {flows[active].blurb}
            </p>

            <a href="#" className="ed-ulink" style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginTop: 26,
              fontFamily: ED.sans, fontSize: 14, color: ED.accent, fontWeight: 500,
            }}>
              Read more on {flows[active].label.toLowerCase()}
              <FiArrowRight size={13} />
            </a>

            <div style={{ marginTop: 40, paddingTop: 22, borderTop: `1px dotted ${ED.rule}` }}>
              <div className="ed-eyebrow" style={{ marginBottom: 8 }}>Aside</div>
              <p className="ed-serif ed-italic" style={{
                fontSize: 15, color: ED.inkMute, margin: 0, lineHeight: 1.55,
              }}>
                {flows[active].aside}
              </p>
            </div>
          </div>

          {/* Visual */}
          <div className="ed-card" key={"vis-" + active} style={{ padding: 0, minHeight: 460, overflow: "hidden" }}>
            {active === 0 && <CaptureView />}
            {active === 1 && <FindView />}
            {active === 2 && <ReasonView />}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─ Movement I — Capture ─ */
function CaptureView() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s + 1) % 180), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="ed-reveal" style={{ padding: 28 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        paddingBottom: 14, borderBottom: `1px solid ${ED.ruleSoft}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", background: "#e63b1e",
            animation: "ed-pulse 1.6s ease-in-out infinite",
          }} />
          <span className="ed-mono" style={{
            fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkMute,
          }}>Recording</span>
          <span className="ed-mono" style={{
            fontSize: 13, color: ED.ink, fontVariantNumeric: "tabular-nums",
          }}>00:{mm}:{ss}</span>
        </div>
        <span className="ed-mono" style={{ fontSize: 11, color: ED.inkFaint }}>
          iPhone 16 · Bobber garage
        </span>
      </div>

      <div style={{
        marginTop: 22, padding: "26px 6px", height: 130, background: ED.paper150,
        borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
      }}>
        {Array.from({ length: 56 }).map((_, i) => {
          const h = 12 + Math.abs(Math.sin(i * 0.7 + seconds * 0.4)) * 70;
          return (
            <span key={i} style={{
              width: 3, height: `${h}px`,
              background: i % 8 === 0 ? ED.accent : ED.ink,
              borderRadius: 2, transition: "height .25s ease",
              opacity: i > 50 - (seconds % 50) ? 0.3 : 1,
            }} />
          );
        })}
      </div>

      <div style={{ marginTop: 22 }}>
        <div className="ed-eyebrow" style={{ marginBottom: 10 }}>Live transcript</div>
        <p className="ed-serif" style={{ fontSize: 19, lineHeight: 1.5, color: ED.ink, margin: 0 }}>
          "Reminder for tomorrow — call back the mechanic about the Suzuki
          carburetor, and pick up rear shock bushings before three.{" "}
          <span style={{ color: ED.accent }}>
            Also: ask Maya if she's free for coffee Thursday.
          </span>
          <span style={{
            display: "inline-block", width: 2, height: 18, background: ED.accent,
            verticalAlign: "middle", marginLeft: 3, animation: "ed-blink 1s steps(2) infinite",
          }} />"
        </p>
      </div>

      <div style={{
        marginTop: 22, paddingTop: 16, borderTop: `1px dashed ${ED.rule}`,
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
      }}>
        <span className="ed-mono" style={{
          fontSize: 10.5, color: ED.inkFaint, letterSpacing: "0.12em", textTransform: "uppercase",
        }}>NoteStream filed →</span>
        <span className="ed-chip">#garage</span>
        <span className="ed-chip">#bobber-build</span>
        <span className="ed-chip">#thursday</span>
        <span className="ed-chip ed-chip-accent">→ 2 tasks created</span>
      </div>
    </div>
  );
}

/* ─ Movement II — Find ─ */
function FindView() {
  const [typed, setTyped] = useState("");
  const query = "what did we decide about pricing tiers?";

  useEffect(() => {
    let i = 0;
    setTyped("");
    const id = setInterval(() => {
      i++;
      setTyped(query.slice(0, i));
      if (i >= query.length) clearInterval(id);
    }, 38);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="ed-reveal" style={{ padding: 28 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
        background: ED.paper100, borderRadius: 10, border: `1px solid ${ED.rule}`,
      }}>
        <FiSearch size={16} style={{ color: ED.inkMute }} />
        <span className="ed-serif" style={{ fontSize: 18, color: ED.ink, flex: 1 }}>
          {typed}
          <span style={{
            display: "inline-block", width: 2, height: 18, marginLeft: 2,
            background: ED.accent, verticalAlign: "middle",
            animation: "ed-blink 1s steps(2) infinite",
          }} />
        </span>
        <span className="ed-mono" style={{
          fontSize: 10, color: ED.inkFaint, padding: "3px 8px",
          background: ED.paper200, borderRadius: 4,
        }}>⌘K</span>
      </div>

      <div style={{
        marginTop: 18, padding: 22, position: "relative",
        background: ED.ink, color: ED.paper50, borderRadius: 10,
      }}>
        <div style={{
          position: "absolute", top: -1, left: 22, right: 22, height: 2,
          background: ED.accent,
        }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Sparkle size={12} weight="fill" style={{ color: ED.accent }} />
          <span className="ed-mono" style={{
            fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "#c8b988",
          }}>The answer · synthesized in 1.2s</span>
        </div>
        <p className="ed-serif" style={{ fontSize: 17, lineHeight: 1.55, margin: 0, color: ED.paper50 }}>
          Three tiers, settled on Aug 14:{" "}
          <span style={{ color: "#fff", fontWeight: 500 }}>Free</span> (5 notes/day),{" "}
          <span style={{ color: "#fff", fontWeight: 500 }}>Pro $12/mo</span> (unlimited + voice),{" "}
          <span style={{ color: "#fff", fontWeight: 500 }}>Team $24/seat</span> (workspace + SSO).
          Maya pushed for $14 Pro; the room landed on $12 to sit below Notion AI.
        </p>
      </div>

      <div style={{ marginTop: 22 }}>
        <div className="ed-eyebrow" style={{ marginBottom: 12 }}>Cited from</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { icon: <FiFileText size={14} />, t: "Pricing review — full notes", d: "Aug 14, 4:12 pm" },
            { icon: <FiMic size={14} />, t: "Maya, voice memo on pricing", d: "Aug 14, 2:48 pm" },
            { icon: <Quotes size={14} />, t: "Slack: #pricing-discussion", d: "Aug 12" },
          ].map((s, i) => (
            <a key={i} href="#" className="ed-ulink" style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
              borderRadius: 8, color: ED.inkSoft, transition: "background .15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = ED.paper150)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <span style={{ color: ED.inkMute }}>{s.icon}</span>
              <span style={{ flex: 1, fontSize: 14 }}>{s.t}</span>
              <span className="ed-mono" style={{ fontSize: 11, color: ED.inkFaint }}>{s.d}</span>
              <FiArrowUpRight size={12} style={{ color: ED.inkFaint }} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─ Movement III — Reason ─ */
function ReasonView() {
  return (
    <div className="ed-reveal" style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="ed-chip">
          <Brain size={11} /> Cross-archive brief
        </span>
        <span className="ed-mono" style={{ fontSize: 11, color: ED.inkFaint }}>
          47 notes · 12 docs · 6 weeks
        </span>
      </div>

      <h4 className="ed-serif" style={{
        fontSize: 28, marginTop: 16, marginBottom: 4, color: ED.ink, letterSpacing: "-0.01em",
      }}>
        Why is mid-market churning?
      </h4>
      <div className="ed-mono" style={{
        fontSize: 11, color: ED.inkFaint, letterSpacing: "0.12em",
        textTransform: "uppercase", marginBottom: 18,
      }}>
        Asked Oct 8 · synthesized from your archive
      </div>

      <div style={{
        padding: "16px 0 16px 22px", borderLeft: `3px solid ${ED.accent}`, marginBottom: 18,
      }}>
        <p className="ed-serif ed-italic" style={{
          fontSize: 21, lineHeight: 1.4, color: ED.ink, margin: 0,
        }}>
          Three signals, all pointing the same direction: onboarding length,
          a missing analytics view, and price perception against{" "}
          <span className="ed-hi">two competitors who launched in July.</span>
        </p>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {[
          ["§ 1", "Onboarding length", "12 of 18 churned accounts cited setup > 2 hrs (calls, weeks 34–40)."],
          ["§ 2", "Missing analytics", "5 customer-success memos reference 'no team-level view' (Q3 sync, Sep 22 doc)."],
          ["§ 3", "Price perception", "Bramble launched at $9 in July; 4 mentions in lost-deal voice notes."],
        ].map(([num, h, b], i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "44px 1fr", gap: 14,
            padding: "12px 0", borderTop: i > 0 ? `1px dotted ${ED.rule}` : "none",
          }}>
            <div className="ed-serif ed-italic" style={{ fontSize: 18, color: ED.accent }}>{num}</div>
            <div>
              <div className="ed-serif" style={{ fontSize: 16, color: ED.ink, marginBottom: 3 }}>{h}</div>
              <div style={{ fontSize: 13, color: ED.inkMute, lineHeight: 1.5 }}>{b}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 22, paddingTop: 16, borderTop: `1px solid ${ED.ruleSoft}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span className="ed-mono" style={{
          fontSize: 10.5, color: ED.inkFaint, letterSpacing: "0.12em", textTransform: "uppercase",
        }}>Synthesized · sources cited · saved to archive</span>
        <a href="#" className="ed-ulink ed-mono" style={{
          fontSize: 11, color: ED.accent, letterSpacing: "0.06em",
        }}>Open full brief →</a>
      </div>
    </div>
  );
}
