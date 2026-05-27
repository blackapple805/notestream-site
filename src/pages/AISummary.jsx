// src/pages/AISummary.jsx
import { useEditorial, ED } from "../lib/editorial";
import { FiArrowRight } from "react-icons/fi";

export default function AISummary() {
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
              On AI summaries
            </div>
          </div>
          <hr className="ed-rule-dbl" style={{ marginBottom: 48 }} />

          <div className="ai-hero" style={{
            display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 56, alignItems: "end",
          }}>
            <div>
              <h1 className="ed-display" style={{
                fontSize: "clamp(54px, 8.8vw, 140px)", margin: 0, color: ED.ink,
              }}>
                The one<br />
                <span className="ed-italic" style={{ color: ED.accent }}>thing</span> that mattered.
              </h1>
              <p className="ed-lede" style={{ marginTop: 32, maxWidth: 540 }}>
                A meeting becomes its decision. A 47-page transcript becomes
                the deadline that moved. A week of voice notes becomes the
                pattern you didn't see. Every summary cites the original —
                no hallucinations, no invented details.
              </p>
              <div style={{ marginTop: 30, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="/signup" className="ed-btn ed-btn-primary">Start free <FiArrowRight size={14} /></a>
                <a href="/how-it-works" className="ed-btn ed-btn-ghost">How it works</a>
              </div>
            </div>

            <SummaryMock />
          </div>
        </div>

        <style>{`
          @media (max-width: 960px) {
            .ns-ed .ai-hero { grid-template-columns: 1fr !important; gap: 32px !important; }
          }
        `}</style>
      </section>

      {/* Five kinds of summary */}
      <section style={{ padding: "64px 0 96px", borderTop: `1px solid ${ED.rule}` }}>
        <div className="ed-page">
          <div className="sec-head" style={{
            display: "grid", gridTemplateColumns: "1fr 2fr", gap: 56, alignItems: "end",
            marginBottom: 48,
          }}>
            <div>
              <div className="ed-chapter" style={{ marginBottom: 18 }}>
                <span className="num">№ 02</span>
                <span>What gets summarized</span>
              </div>
              <h2 className="ed-display" style={{
                fontSize: "clamp(36px, 5vw, 64px)", margin: 0, color: ED.ink,
              }}>
                Five<br />
                <span className="ed-italic" style={{ color: ED.accent }}>shapes.</span>
              </h2>
            </div>
            <p className="ed-lede" style={{ maxWidth: 540, margin: 0 }}>
              Different inputs deserve different outputs. NoteStream picks the
              right shape automatically — a one-liner for a quick voice memo,
              a multi-paragraph brief for a week of meetings.
            </p>
          </div>

          <hr className="ed-rule-dbl" style={{ marginBottom: 0 }} />

          <div className="shapes" style={{
            display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 0,
          }}>
            {[
              { n: "i.", t: "The one-liner",
                d: "For voice memos and short notes. A single sentence: what was said, what it means, what to do." },
              { n: "ii.", t: "The meeting brief",
                d: "Decisions, action items, blockers — extracted from a recorded meeting or pasted transcript. Owner and deadline on every item." },
              { n: "iii.", t: "The document distillation",
                d: "Long docs (PDF, slides, articles) reduced to their argument: the claim, the evidence, the counter-argument, what to read again." },
              { n: "iv.", t: "The weekly digest",
                d: "Monday morning: every note you wrote last week, the recurring themes you didn't notice, the one thing worth your time today." },
              { n: "v.", t: "The cross-archive brief",
                d: "A question, answered across your whole archive — citations from voice notes, docs, meetings, all woven into a multi-paragraph answer." },
            ].map((s, i) => {
              const col = i % 2;
              const row = Math.floor(i / 2);
              const isLast = i === 4;
              return (
                <article key={s.n} style={{
                  padding: "36px 32px",
                  borderRight: !isLast && col === 0 ? `1px solid ${ED.rule}` : "none",
                  borderTop: row > 0 ? `1px solid ${ED.rule}` : "none",
                  gridColumn: isLast ? "1 / -1" : "auto",
                }} className="shape-cell">
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                  }}>
                    <span className="ed-serif ed-italic" style={{ fontSize: 30, color: ED.accent, lineHeight: 1 }}>
                      {s.n}
                    </span>
                    <span className="ed-mono" style={{
                      fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                      color: ED.inkFaint,
                    }}>
                      Shape {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="ed-serif" style={{
                    fontSize: 28, margin: "12px 0 12px", color: ED.ink, letterSpacing: "-0.01em",
                  }}>
                    {s.t}
                  </h3>
                  <p style={{ fontSize: 15.5, lineHeight: 1.65, color: ED.inkMute, margin: 0, maxWidth: 540 }}>
                    {s.d}
                  </p>
                </article>
              );
            })}
          </div>

          <hr className="ed-rule-dbl" style={{ marginTop: 0 }} />
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .sec-head { grid-template-columns: 1fr !important; gap: 24px !important; }
            .ns-ed .shapes { grid-template-columns: 1fr !important; }
            .ns-ed .shape-cell { border-right: none !important; }
          }
        `}</style>
      </section>

      {/* On citation — intentional dark mood band. Pinned to literal hex so
          it stays dark in both light and dark themes (an inverted band; if
          this used ED.ink it would flip to a cream surface in dark mode and
          the child #fff text would become invisible). */}
      <section style={{ padding: "96px 0", background: "#131008", color: "#f6f1e3" }}>
        <div className="ed-page">
          <div className="cite-grid" style={{
            display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 64, alignItems: "start",
          }}>
            <div>
              <div className="ed-mono" style={{
                fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)", marginBottom: 18,
              }}>
                № 03 · On citation
              </div>
              <h2 className="ed-display" style={{
                fontSize: "clamp(36px, 5vw, 64px)", margin: 0, color: "#fff", lineHeight: 1,
              }}>
                Every claim,<br />
                <span className="ed-italic" style={{ color: ED.accent }}>cited.</span>
              </h2>
            </div>
            <div>
              <p className="ed-serif" style={{
                fontSize: 21, lineHeight: 1.5, color: "rgba(255,255,255,0.85)",
                margin: 0, maxWidth: 600,
              }}>
                A summary that can't be checked is a fabrication. NoteStream summaries
                point at the original passages they came from — exact timestamps,
                exact paragraphs — so you can verify any line in a tap. If a claim
                can't be grounded, the summary leaves it out and says so.
              </p>

              <div style={{ marginTop: 36, display: "grid", gap: 0 }}>
                {[
                  ["Source citations", "Every sentence in a brief is traceable to a specific note, with a timestamp and a quote."],
                  ["No invented details", "If the model isn't confident, it abstains rather than fabricates. We'd rather return less than wrong."],
                  ["You can disagree", "Every summary has a 'this isn't right' button. We use the feedback to tune your reasoning profile, never to retrain a model."],
                ].map(([t, b], i) => (
                  <div key={t} style={{
                    display: "grid", gridTemplateColumns: "32px 1fr", gap: 16,
                    padding: "16px 0", alignItems: "baseline",
                    borderTop: i === 0 ? "1px solid rgba(255,255,255,0.12)" : "1px dotted rgba(255,255,255,0.12)",
                    borderBottom: i === 2 ? "1px solid rgba(255,255,255,0.12)" : "none",
                  }}>
                    <span className="ed-serif ed-italic" style={{ color: ED.accent, fontSize: 20 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="ed-serif" style={{
                        fontSize: 19, color: "#fff", letterSpacing: "-0.005em",
                      }}>{t}</div>
                      <div style={{
                        fontSize: 14.5, color: "rgba(255,255,255,0.6)", marginTop: 4, lineHeight: 1.5,
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
            .ns-ed .cite-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          }
        `}</style>
      </section>

      {/* Closing */}
      <section style={{ padding: "96px 0" }}>
        <div className="ed-page" style={{ textAlign: "center" }}>
          <h2 className="ed-display" style={{
            fontSize: "clamp(40px, 6vw, 84px)", margin: "0 auto", maxWidth: 880, color: ED.ink,
          }}>
            See the<br />
            <span className="ed-italic" style={{ color: ED.accent }}>shape</span> of your week.
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

function SummaryMock() {
  return (
    <div style={{ maxWidth: 460, marginLeft: "auto" }}>
      <div style={{
        padding: 22, background: "#131008", color: "#fbf8f0", borderRadius: 14, position: "relative",
      }}>
        <div style={{
          position: "absolute", top: -1, left: 22, right: 22, height: 2,
          background: ED.accent,
        }} />
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          marginBottom: 14,
        }}>
          <span className="ed-mono" style={{
            fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "#c8b988",
          }}>The one thing that mattered</span>
          <span className="ed-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
            47-page transcript · 1.2s
          </span>
        </div>
        <p className="ed-serif" style={{
          fontSize: 17, lineHeight: 1.55, margin: 0, color: "#fbf8f0",
        }}>
          v3 shipping date moved{" "}
          <span style={{ color: "#fff", fontWeight: 500 }}>two weeks earlier</span> to
          align with the partner launch. Three blocker items still open —{" "}
          <span style={{ color: "#fff", fontWeight: 500 }}>auth refactor is the riskiest</span>.
        </p>
      </div>

      <div style={{
        marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
      }}>
        {[
          { v: 4, l: "Decisions" },
          { v: 11, l: "Action items" },
          { v: 3, l: "Blockers" },
        ].map((m) => (
          <div key={m.l} style={{
            padding: 14, background: ED.paper50,
            border: `1px solid ${ED.rule}`, borderRadius: 10, textAlign: "center",
          }}>
            <div className="ed-display" style={{ fontSize: 32, color: ED.ink, lineHeight: 1 }}>
              {m.v}
            </div>
            <div className="ed-mono" style={{
              fontSize: 9.5, letterSpacing: "0.14em", color: ED.inkFaint,
              textTransform: "uppercase", marginTop: 4,
            }}>{m.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
