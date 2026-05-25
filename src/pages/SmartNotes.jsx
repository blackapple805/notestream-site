// src/pages/SmartNotes.jsx
import { useEditorial, ED } from "../lib/editorial";
import { FiArrowRight, FiCheck } from "react-icons/fi";

export default function SmartNotes() {
  useEditorial();

  return (
    <div className="ns-ed" style={{ minHeight: "100vh" }}>
      {/* Hero */}
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
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint,
            }}>
              On smart notes
            </div>
          </div>
          <hr className="ed-rule-dbl" style={{ marginBottom: 48 }} />

          <div className="sn-hero" style={{
            display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 56, alignItems: "end",
          }}>
            <div>
              <h1 className="ed-display" style={{
                fontSize: "clamp(54px, 8.8vw, 140px)", margin: 0, color: ED.ink,
              }}>
                Notes that<br />
                <span className="ed-italic" style={{ color: ED.accent }}>file themselves.</span>
              </h1>
              <p className="ed-lede" style={{ marginTop: 32, maxWidth: 540 }}>
                Type a paragraph, paste a wall of text, drop in a PDF — and NoteStream
                quietly does the librarian's work. People, dates, decisions, tasks:
                pulled out, tagged, slotted into the right space. You write. We file.
              </p>
              <div style={{ marginTop: 30, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="/signup" className="ed-btn ed-btn-primary">Start free <FiArrowRight size={14} /></a>
                <a href="/how-it-works" className="ed-btn ed-btn-ghost">How it works</a>
              </div>
            </div>

            <NoteMock />
          </div>
        </div>

        <style>{`
          @media (max-width: 960px) {
            .ns-ed .sn-hero { grid-template-columns: 1fr !important; gap: 32px !important; }
          }
        `}</style>
      </section>

      {/* Flow */}
      <section style={{ padding: "64px 0 96px", borderTop: `1px solid ${ED.rule}` }}>
        <div className="ed-page">
          <div className="sec-head" style={{
            display: "grid", gridTemplateColumns: "1fr 2fr", gap: 56, alignItems: "end",
            marginBottom: 48,
          }}>
            <div>
              <div className="ed-chapter" style={{ marginBottom: 18 }}>
                <span className="num">№ 02</span>
                <span>How smart notes work</span>
              </div>
              <h2 className="ed-display" style={{
                fontSize: "clamp(36px, 5vw, 64px)", margin: 0, color: ED.ink,
              }}>
                Write,<br />
                <span className="ed-italic" style={{ color: ED.accent }}>once.</span>
              </h2>
            </div>
            <p className="ed-lede" style={{ maxWidth: 540, margin: 0 }}>
              Three things happen the moment you finish a note. None of them
              require you to think about folders, tags, or filing systems.
              That's the whole point.
            </p>
          </div>

          <hr className="ed-rule-dbl" />

          <div className="sn-flow" style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0,
          }}>
            {[
              { n: "I", t: "Read", b: "We parse what you wrote — paragraphs, bullets, attached PDFs. Plain text in, structure out.", detail: "Mixed inputs welcome" },
              { n: "II", t: "Extract", b: "People, projects, places, dates, money, decisions, open questions. Tagged automatically.", detail: "Soft tags, no taxonomy" },
              { n: "III", t: "File", b: "Slotted into the right space, linked to related notes, surfaced when you ask the archive a question.", detail: "Connected, quietly" },
            ].map((s, i) => (
              <article key={s.n} style={{
                padding: "40px 32px",
                borderRight: i < 2 ? `1px solid ${ED.rule}` : "none",
              }} className="sn-step">
                <div className="ed-serif ed-italic" style={{ fontSize: 40, color: ED.accent, lineHeight: 1 }}>{s.n}.</div>
                <h3 className="ed-serif" style={{ fontSize: 30, margin: "12px 0 0", color: ED.ink, letterSpacing: "-0.01em" }}>{s.t}</h3>
                <p style={{ marginTop: 14, fontSize: 15.5, lineHeight: 1.65, color: ED.inkMute }}>{s.b}</p>
                <div className="ed-mono" style={{
                  marginTop: 20, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase",
                  color: ED.inkFaint,
                }}>{s.detail}</div>
              </article>
            ))}
          </div>
          <hr className="ed-rule-dbl" />
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .sec-head { grid-template-columns: 1fr !important; gap: 24px !important; }
            .ns-ed .sn-flow { grid-template-columns: 1fr !important; }
            .ns-ed .sn-step { border-right: none !important; border-bottom: 1px solid ${ED.rule} !important; }
            .ns-ed .sn-step:last-child { border-bottom: none !important; }
          }
        `}</style>
      </section>

      {/* The trouble */}
      <section style={{
        padding: "96px 0", background: ED.paper50,
        borderTop: `1px solid ${ED.rule}`, borderBottom: `1px solid ${ED.rule}`,
      }}>
        <div className="ed-page">
          <div className="ed-chapter" style={{ marginBottom: 18 }}>
            <span className="num">§</span>
            <span>An aside on tagging</span>
          </div>
          <h2 className="ed-display" style={{
            fontSize: "clamp(32px, 4.4vw, 56px)", margin: 0, marginBottom: 36, color: ED.ink, maxWidth: 900,
          }}>
            You don't need a <span className="ed-italic" style={{ color: ED.accent }}>tagging system.</span> You need a tool that doesn't make you tag.
          </h2>

          <div className="trouble-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, border: `1px solid ${ED.rule}`,
          }}>
            {[
              ["What other apps ask", "Maintain folders. Choose tags. Backlink notes. Build a taxonomy. Read methodology articles."],
              ["What NoteStream does", "Reads the note. Extracts people, dates, projects. Suggests connections. Stays out of your way."],
              ["What you do", "Write. Read back later. That's it."],
            ].map(([t, b], i) => (
              <div key={t} style={{
                padding: "30px 28px",
                borderRight: i < 2 ? `1px solid ${ED.rule}` : "none",
              }} className="trouble-cell">
                <div className="ed-mono" style={{
                  fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                  color: i === 1 ? ED.accent : ED.inkFaint, marginBottom: 12,
                }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="ed-serif" style={{
                  fontSize: 22, margin: 0, marginBottom: 10, color: ED.ink, letterSpacing: "-0.01em",
                }}>{t}</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, color: ED.inkMute, margin: 0 }}>{b}</p>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .trouble-grid { grid-template-columns: 1fr !important; }
            .ns-ed .trouble-cell { border-right: none !important; border-bottom: 1px solid ${ED.rule} !important; }
            .ns-ed .trouble-cell:last-child { border-bottom: none !important; }
          }
        `}</style>
      </section>

      {/* Closing */}
      <section style={{ padding: "96px 0" }}>
        <div className="ed-page" style={{ textAlign: "center" }}>
          <h2 className="ed-display" style={{
            fontSize: "clamp(40px, 6vw, 84px)", margin: "0 auto", maxWidth: 880, color: ED.ink,
          }}>
            Stop being the<br />
            <span className="ed-italic" style={{ color: ED.accent }}>librarian.</span>
          </h2>
          <div style={{ marginTop: 30, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <a href="/signup" className="ed-btn ed-btn-primary">Start free <FiArrowRight size={14} /></a>
            <a href="/pricing" className="ed-btn ed-btn-ghost">See the plans</a>
          </div>
        </div>
      </section>
    </div>
  );
}

function NoteMock() {
  return (
    <div className="ed-card" style={{ padding: 22, maxWidth: 460, marginLeft: "auto" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", paddingBottom: 12,
        borderBottom: `1px solid ${ED.ruleSoft}`,
      }}>
        <span className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.14em", color: ED.inkFaint, textTransform: "uppercase" }}>
          Board prep — Q3
        </span>
        <span className="ed-mono" style={{ fontSize: 10.5, color: ED.inkFaint }}>9:14 am · 142 words</span>
      </div>
      <h3 className="ed-serif" style={{
        fontSize: 26, marginTop: 16, marginBottom: 10, color: ED.ink, letterSpacing: "-0.01em",
      }}>
        Q3 going to plan, except mid-market.
      </h3>
      <p style={{ fontSize: 14.5, lineHeight: 1.6, color: ED.inkSoft, margin: 0 }}>
        Revenue <span style={{ color: ED.ink, fontWeight: 500 }}>14% ahead of plan</span>.
        Mid-market churn is the one thing to flag —{" "}
        <span style={{ color: ED.ink, fontWeight: 500 }}>3 logos at risk, $340k ARR</span>.
        Maya owns the fix; Thursday board call.
      </p>
      <hr className="ed-rule-soft" style={{ margin: "16px 0" }} />
      <div className="ed-mono" style={{
        fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
        color: ED.inkFaint, marginBottom: 8,
      }}>
        NoteStream extracted →
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {["#board", "#q3-2025", "#mid-market", "#maya", "→ task: prep board deck"].map((t, i) => (
          <span key={t} className={i === 4 ? "ed-chip ed-chip-accent" : "ed-chip"}>{t}</span>
        ))}
      </div>
    </div>
  );
}
