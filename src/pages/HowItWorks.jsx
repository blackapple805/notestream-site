// src/pages/HowItWorks.jsx
// ───────────────────────────────────────────────────────────────
// NoteStream — Editorial "How It Works" page (Vite drop-in)
// Drop into src/pages/HowItWorks.jsx (overwrite existing).
// Requires: src/lib/editorial.js (the shared design module).
// ───────────────────────────────────────────────────────────────

import { useEditorial, ED } from "../lib/editorial";
import { FiArrowRight } from "react-icons/fi";

export default function HowItWorks() {
  useEditorial();

  return (
    <div className="ns-ed" style={{ minHeight: "100vh" }}>
      {/* ── Cover ───────────────────────────── */}
      <section style={{ paddingTop: 140, paddingBottom: 72 }}>
        <div className="ed-page">
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            marginBottom: 56, flexWrap: "wrap", gap: 16,
          }}>
            <div className="ed-chapter">
              <span className="num">№ 01</span>
              <span>The Mechanics</span>
            </div>
            <div className="ed-mono" style={{
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
              color: ED.inkFaint,
            }}>
              An essay · 6 minutes · For the curious
            </div>
          </div>

          <hr className="ed-rule-dbl" style={{ marginBottom: 48 }} />

          <div className="hero-grid" style={{
            display: "grid", gridTemplateColumns: "1fr 320px", gap: 64, alignItems: "start",
          }}>
            <div>
              <h1 className="ed-display ed-reveal" style={{
                fontSize: "clamp(50px, 8vw, 130px)", margin: 0, color: ED.ink,
              }}>
                From a voice<br />
                memo to a <span className="ed-italic" style={{ color: ED.accent }}>brief</span>,<br />
                in four turns.
              </h1>

              <p className="ed-lede ed-reveal" style={{ marginTop: 36, maxWidth: 620, animationDelay: "0.15s" }}>
                NoteStream isn't a notes app with AI bolted on. It's a small,
                opinionated pipeline — capture, transcribe, index, reason —
                where each stage is built to do one thing well, and to hand
                clean material to the next.
              </p>

              <div className="ed-reveal" style={{
                marginTop: 36, display: "flex", gap: 12, flexWrap: "wrap",
                animationDelay: "0.3s",
              }}>
                <a href="#act-1" className="ed-btn ed-btn-primary">
                  Begin reading <FiArrowRight size={14} />
                </a>
                <a href="/pricing" className="ed-btn ed-btn-ghost">
                  The plans
                </a>
              </div>
            </div>

            <aside className="margin-col ed-reveal" style={{ paddingTop: 28, animationDelay: "0.45s" }}>
              <div style={{ borderLeft: `1px solid ${ED.rule}`, paddingLeft: 20 }}>
                <div className="ed-mono" style={{
                  fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                  color: ED.inkFaint, marginBottom: 14,
                }}>
                  The four turns
                </div>
                <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 14 }}>
                  {[
                    ["I", "Capture", "What you bring", "#act-1"],
                    ["II", "Transcribe", "Clean material, never your filler", "#act-2"],
                    ["III", "Index", "Quiet structure, on every note", "#act-3"],
                    ["IV", "Reason", "An archive that argues back", "#act-4"],
                  ].map(([n, t, d, h]) => (
                    <li key={n}>
                      <a href={h} style={{
                        display: "grid", gridTemplateColumns: "32px 1fr", gap: 10,
                        padding: "6px 0", textDecoration: "none",
                      }}>
                        <span className="ed-serif ed-italic" style={{
                          fontSize: 24, color: ED.accent, lineHeight: 1,
                        }}>{n}</span>
                        <div>
                          <div className="ed-serif" style={{ fontSize: 16, color: ED.ink }}>{t}</div>
                          <div className="ed-mono" style={{
                            fontSize: 10.5, letterSpacing: "0.08em", color: ED.inkFaint, marginTop: 2,
                          }}>{d}</div>
                        </div>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── Pipeline diagram ────────────────── */}
      <section style={{ padding: "48px 0 88px" }}>
        <div className="ed-page">
          <hr className="ed-rule-soft" style={{ marginBottom: 36 }} />
          <PipelineDiagram />
          <hr className="ed-rule-soft" style={{ marginTop: 36 }} />
        </div>
      </section>

      {/* ── Acts ────────────────────────────── */}
      <Act
        id="act-1" num="I" chapter="Act One"
        title="Capture" subtitle="What you bring."
        text={[
          "Most thinking is not at a desk. It happens at 6 a.m. on a walk, halfway through reading a paragraph, in the third minute of a stand-up. NoteStream is built for that. Voice notes are the primary input. Text, screenshots, PDFs, web clippings, the occasional ten-page transcript — all welcome, none required.",
          "We do not ask you to triage the moment. You hold the button, you speak, you let go. The note lives. Where it goes, what it's called, whose project it belongs to — those are problems for later, and not yours.",
        ]}
        aside={{ label: "On the device", body: "Voice is captured on the device first. Nothing leaves your phone until it has to." }}
        flip={false}
      />

      <Act
        id="act-2" num="II" chapter="Act Two"
        title="Transcribe" subtitle="Clean material, never your filler."
        text={[
          "Raw voice is a mess. Pauses, restarts, throat-clearings, half-finished sentences that pivoted mid-clause. A transcript that preserves all of it is a transcript no one reads.",
          "NoteStream transcribes locally, then runs a small editing pass: collapsing the false starts, joining the fragments, keeping the structure but losing the cruft. Your original audio is preserved alongside, untouched, in case you ever want it back. What the index sees, though, is the clean version — so reasoning later doesn't have to wade through your throat-clearing to find the point.",
        ]}
        aside={{ label: "Lost in editing", body: "Verbatim transcript is one tap away. We don't throw your original recording out — we just don't ask the model to read it." }}
        flip={true}
      />

      <Act
        id="act-3" num="III" chapter="Act Three"
        title="Index" subtitle="Quiet structure, on every note."
        text={[
          "Behind every note, NoteStream is doing the boring work of librarianship — extracting people, projects, places, dates, the dollar figures, the deadlines, the questions you asked but didn't answer. None of it requires you to tag anything.",
          "The result is a thin layer of structure under the surface of your archive. You never see it directly. But it's how a question like \"what did Maya say about pricing\" can return an answer in under a second, with the right citations, instead of returning four pages of full-text search results.",
        ]}
        aside={{ label: "Soft tags", body: "We extract structure. We never force a taxonomy on you. If you call it 'Atlas' on Monday and 'the launch' on Friday, NoteStream knows." }}
        flip={false}
      />

      <Act
        id="act-4" num="IV" chapter="Act Four"
        title="Reason" subtitle="An archive that argues back."
        text={[
          "This is the part most notes apps don't do, and the part NoteStream was built for. With a small index and an opinionated model, your archive becomes a thing you can ask questions of — not a thing you search.",
          "Reasoning runs across every space, every date, every document type. It cites its sources. It can disagree with itself across two notes written six months apart. It can write you a brief that uses last Tuesday's voice memo as evidence for a paragraph in tomorrow's plan. This is the second reader we kept wanting and could never quite find.",
        ]}
        aside={{ label: "Always cited", body: "Every answer points back to the original notes it drew from. You're never reading a hallucination — you're reading a re-reading." }}
        flip={true}
      />

      {/* ── What we don't do ────────────────── */}
      <section style={{
        padding: "96px 0", background: ED.paper50,
        borderTop: `1px solid ${ED.rule}`, borderBottom: `1px solid ${ED.rule}`,
      }}>
        <div className="ed-page">
          <div className="ed-chapter" style={{ marginBottom: 24 }}>
            <span className="num">§</span>
            <span>An aside on what we don't do</span>
          </div>
          <h2 className="ed-display" style={{
            fontSize: "clamp(36px, 5vw, 64px)", maxWidth: 900, margin: 0,
          }}>
            Some things are <span className="ed-italic" style={{ color: ED.accent }}>worth not building.</span>
          </h2>

          <div className="dont-grid" style={{
            marginTop: 56, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0,
            borderTop: `1px solid ${ED.rule}`,
          }}>
            {[
              { t: "Training on your notes", b: "We don't. Not ours, not anyone else's. Your archive is not a corpus. If a future model improves NoteStream, it learned from public data, never from your private writing." },
              { t: "Selling your data", b: "We don't sell, share, or expose your archive. We make money from subscriptions. That alignment is the product." },
              { t: "Locking you in", b: "Export everything, anytime — Markdown, plain text, JSON of the structured layer, the original audio files. The archive is yours to take with you." },
              { t: "Asking you to tag", b: "If we're a real librarian, we don't make you write the card catalogue. Structure is extracted, not assigned." },
              { t: "Notifications", b: "NoteStream sends you nothing. It is not designed to be opened. It is designed to be opened on your terms — which means, usually, when you have a question." },
              { t: "A timeline you scroll", b: "There is no feed. Your archive is a library you visit with a purpose, not a river you drown in." },
            ].map((d, i) => {
              const col = i % 3;
              const row = Math.floor(i / 3);
              return (
                <article key={d.t} style={{
                  padding: "30px 28px",
                  borderRight: col < 2 ? `1px solid ${ED.rule}` : "none",
                  borderBottom: row === 0 ? `1px solid ${ED.rule}` : "none",
                }}>
                  <div className="ed-mono" style={{
                    fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                    color: ED.accent, marginBottom: 10,
                  }}>
                    We don't
                  </div>
                  <h3 className="ed-serif" style={{
                    fontSize: 22, margin: 0, marginBottom: 10, color: ED.ink, letterSpacing: "-0.01em",
                  }}>
                    {d.t}
                  </h3>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: ED.inkMute, margin: 0 }}>{d.b}</p>
                </article>
              );
            })}
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .dont-grid { grid-template-columns: 1fr !important; }
            .ns-ed .dont-grid > article { border-right: none !important; border-bottom: 1px solid ${ED.rule} !important; }
            .ns-ed .dont-grid > article:last-child { border-bottom: none !important; }
          }
        `}</style>
      </section>

      {/* ── Closing CTA ─────────────────────── */}
      <section style={{ padding: "96px 0" }}>
        <div className="ed-page" style={{ textAlign: "center" }}>
          <div className="ed-chapter" style={{ justifyContent: "center", marginBottom: 24 }}>
            <span className="num">¶</span>
            <span>The end of this essay</span>
          </div>
          <h2 className="ed-display" style={{ fontSize: "clamp(40px, 6vw, 84px)", maxWidth: 880, margin: "0 auto" }}>
            That's it. <span className="ed-italic" style={{ color: ED.accent }}>Four turns.</span>{" "}
            One archive. Yours.
          </h2>
          <div style={{ marginTop: 36, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <a href="/signup" className="ed-btn ed-btn-primary">Start free <FiArrowRight size={14} /></a>
            <a href="/pricing" className="ed-btn ed-btn-ghost">See the plans</a>
          </div>
          <p className="ed-mono" style={{
            fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
            color: ED.inkFaint, marginTop: 18,
          }}>
            No card · 14-day pro trial · Yours alone, always
          </p>
        </div>
      </section>
    </div>
  );
}

/* ── Act ── */
function Act({ id, num, chapter, title, subtitle, text, aside, flip }) {
  return (
    <section id={id} style={{ padding: "72px 0", borderTop: `1px solid ${ED.rule}` }}>
      <div className="ed-page">
        <div className="act-grid" style={{
          display: "grid",
          gridTemplateColumns: flip ? "320px 1fr" : "1fr 320px",
          gap: 64, alignItems: "start",
        }}>
          <aside className="act-aside" style={{ order: flip ? 0 : 1, paddingTop: 16 }}>
            <div style={{ borderLeft: `1px solid ${ED.rule}`, paddingLeft: 20 }}>
              <div className="ed-chapter" style={{ marginBottom: 12 }}>
                <span className="num">{num}.</span>
                <span>{chapter}</span>
              </div>
              <div className="ed-mono" style={{
                fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                color: ED.inkFaint, marginBottom: 8,
              }}>
                {aside.label}
              </div>
              <p className="ed-serif ed-italic" style={{
                fontSize: 17, lineHeight: 1.5, color: ED.inkSoft, margin: 0,
              }}>
                {aside.body}
              </p>
            </div>
          </aside>

          <div style={{ order: flip ? 1 : 0 }}>
            <div className="ed-serif ed-italic" style={{ fontSize: 22, color: ED.accent, marginBottom: 8 }}>
              Act {num}.
            </div>
            <h2 className="ed-display" style={{ fontSize: "clamp(40px, 5.6vw, 78px)", margin: 0, lineHeight: 0.96 }}>
              {title}
            </h2>
            <p className="ed-serif ed-italic" style={{
              fontSize: 22, color: ED.inkMute, marginTop: 12,
            }}>
              {subtitle}
            </p>

            <hr style={{ margin: "32px 0 28px", border: 0, height: 1, background: ED.ink, width: 64 }} />

            {text.map((p, i) => (
              <p key={i} className={i === 0 ? "ed-dropcap" : ""} style={{
                fontSize: 17, lineHeight: 1.7, color: ED.inkSoft,
                maxWidth: 620, marginTop: i === 0 ? 0 : 18,
              }}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .ns-ed .act-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .ns-ed .act-aside { order: -1 !important; }
        }
      `}</style>
    </section>
  );
}

/* ── Pipeline diagram ── */
function PipelineDiagram() {
  const steps = [
    { n: "I",   t: "Capture",     sub: "voice · text · pdf" },
    { n: "II",  t: "Transcribe",  sub: "on-device first" },
    { n: "III", t: "Index",       sub: "structure, quietly" },
    { n: "IV",  t: "Reason",      sub: "your archive, asked" },
  ];
  return (
    <div className="pipeline" style={{
      display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, position: "relative",
    }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ padding: "0 18px", textAlign: "center", position: "relative" }}>
          <div className="ed-serif ed-italic" style={{
            fontSize: 44, color: ED.accent, lineHeight: 1,
          }}>{s.n}.</div>
          <div className="ed-serif" style={{
            fontSize: 22, color: ED.ink, letterSpacing: "-0.01em", marginTop: 6,
          }}>{s.t}</div>
          <div className="ed-mono" style={{
            fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase",
            color: ED.inkFaint, marginTop: 6,
          }}>{s.sub}</div>
          {i < steps.length - 1 && (
            <div className="pipeline-arrow" style={{
              position: "absolute", right: -8, top: 22, color: ED.inkFaint,
            }}>
              <FiArrowRight size={18} />
            </div>
          )}
        </div>
      ))}

      <style>{`
        @media (max-width: 800px) {
          .ns-ed .pipeline { grid-template-columns: 1fr 1fr !important; gap: 36px 0 !important; }
          .ns-ed .pipeline-arrow { display: none !important; }
        }
      `}</style>
    </div>
  );
}
