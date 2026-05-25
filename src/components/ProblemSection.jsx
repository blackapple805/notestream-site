// src/components/ProblemSection.jsx
// ───────────────────────────────────────────────────────────────
// NoteStream — Editorial "The Trouble" section (Vite drop-in)
// Drop into src/components/ProblemSection.jsx (overwrite existing).
// Requires: src/lib/editorial.js
//
// Rewritten as the "problem statement" piece of the home page:
// three numbered editorial entries on why most notes apps don't work.
// ───────────────────────────────────────────────────────────────

import { useEditorial, ED } from "../lib/editorial";
import { FiArrowRight } from "react-icons/fi";

export default function ProblemSection() {
  useEditorial();

  const problems = [
    {
      num: "i.",
      pre: "The first problem",
      title: "Notes that stay buried.",
      body: "You capture diligently. Three years later, you can't find the thing. Most apps optimize for storage and forget that the point of writing things down is being able to read them back. A drawer full of unread notebooks is not a knowledge base. It's clutter with better metadata.",
      tag: "Capture without recall",
    },
    {
      num: "ii.",
      pre: "The second problem",
      title: "Tools that demand maintenance.",
      body: "Folders. Tags. Backlinks. Daily notes. Templates. The 'second brain' methodology asks you to become a part-time librarian on top of your actual job. You are not the librarian. You're the writer. The tool's whole purpose is to do the librarian's work for you — quietly, in the background, while you go think about something else.",
      tag: "You become the librarian",
    },
    {
      num: "iii.",
      pre: "The third problem",
      title: "AI that makes things up.",
      body: "When an AI summary or answer can't be traced back to a specific note you wrote on a specific day, it isn't useful — it's a risk. NoteStream answers cite the exact passages they came from, with timestamps. If you didn't write it, the model doesn't pretend you did.",
      tag: "Untrustworthy answers",
    },
  ];

  return (
    <section id="trouble" className="ns-ed" style={{
      padding: "96px 0 112px",
      borderTop: `1px solid ${ED.rule}`,
    }}>
      <div className="ed-page">
        {/* Section header */}
        <div className="sec-head" style={{
          display: "grid", gridTemplateColumns: "1fr 2fr", gap: 64,
          alignItems: "end", marginBottom: 56,
        }}>
          <div>
            <div className="ed-chapter" style={{ marginBottom: 18 }}>
              <span className="num">№ 03</span>
              <span>The Trouble</span>
            </div>
            <h2 className="ed-display" style={{
              fontSize: "clamp(40px, 5.4vw, 78px)", margin: 0,
            }}>
              Three things<br />
              <span className="ed-italic" style={{ color: ED.accent }}>most apps</span><br />
              keep getting wrong.
            </h2>
          </div>
          <p className="ed-lede" style={{ maxWidth: 540, margin: 0 }}>
            We didn't build NoteStream because the world needed another notes
            app. We built it because the ones we tried — and we tried most of
            them — kept failing in the same three ways. What follows is the
            short version.
          </p>
        </div>

        <hr className="ed-rule-dbl" style={{ marginBottom: 0 }} />

        {/* Problems list */}
        <div>
          {problems.map((p, i) => (
            <article
              key={p.num}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 320px",
                gap: 56,
                padding: "48px 0",
                borderBottom: `1px solid ${ED.rule}`,
                alignItems: "start",
              }}
              className="trouble-row"
            >
              {/* Big roman numeral */}
              <div style={{
                fontFamily: ED.serif, fontStyle: "italic", fontSize: 80,
                color: ED.accent, lineHeight: 0.85, letterSpacing: "-0.02em",
              }}>
                {p.num}
              </div>

              {/* Main content */}
              <div>
                <div className="ed-mono" style={{
                  fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase",
                  color: ED.inkFaint, marginBottom: 12,
                }}>
                  {p.pre}
                </div>
                <h3 className="ed-display" style={{
                  fontSize: "clamp(28px, 3.6vw, 44px)", margin: 0,
                  color: ED.ink, letterSpacing: "-0.02em",
                }}>
                  {p.title}
                </h3>
                <p style={{
                  marginTop: 18, fontSize: 17, lineHeight: 1.65,
                  color: ED.inkSoft, maxWidth: 560,
                }}>
                  {p.body}
                </p>
              </div>

              {/* Marginalia tag */}
              <aside className="trouble-aside" style={{ paddingTop: 18 }}>
                <div style={{ borderLeft: `1px solid ${ED.rule}`, paddingLeft: 20 }}>
                  <div className="ed-mono" style={{
                    fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                    color: ED.inkFaint, marginBottom: 10,
                  }}>
                    In one phrase
                  </div>
                  <p className="ed-serif ed-italic" style={{
                    fontSize: 22, lineHeight: 1.25,
                    color: ED.ink, margin: 0,
                    letterSpacing: "-0.01em",
                  }}>
                    {p.tag}
                  </p>
                </div>
              </aside>
            </article>
          ))}
        </div>

        {/* Closing prompt */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingTop: 36, flexWrap: "wrap", gap: 24,
        }}>
          <p className="ed-serif ed-italic" style={{
            fontSize: 22, color: ED.inkMute, margin: 0, maxWidth: 540, lineHeight: 1.4,
          }}>
            Most notes apps solve none of these. We tried to solve all three —
            in that order.
          </p>
          <a href="/how-it-works" className="ed-btn ed-btn-primary">
            How we did it <FiArrowRight size={14} />
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .ns-ed .sec-head { grid-template-columns: 1fr !important; gap: 24px !important; }
          .ns-ed .trouble-row { grid-template-columns: 60px 1fr !important; gap: 24px !important; }
          .ns-ed .trouble-row > div:first-child { font-size: 52px !important; }
          .ns-ed .trouble-aside { display: none !important; }
        }
      `}</style>
    </section>
  );
}
