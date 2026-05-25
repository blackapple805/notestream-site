// PullQuote — magazine-style testimonial section, three voices.
function PullQuote() {
  const voices = [
    {
      q: "I've kept journals for fifteen years. NoteStream is the first thing that let me actually read them back.",
      who: "Eliza Tan", role: "Essayist · 4 years in",
    },
    {
      q: "Half my meetings are voice notes pacing my apartment at 6 a.m. Now they assemble themselves into a brief by 9.",
      who: "Marcus Doyle", role: "Founder, Fieldnote Studio",
    },
    {
      q: "It feels less like a notes app and more like a reading room I built for myself, slowly.",
      who: "Priya Mehrotra", role: "Researcher · Cortex Labs",
    },
  ];

  return (
    <section id="voices" style={{ paddingTop: 96, paddingBottom: 96 }}>
      <div className="page">
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          marginBottom: 48, flexWrap: "wrap", gap: 24,
        }}>
          <div>
            <div className="chapter-mark" style={{ marginBottom: 14 }}>
              <span className="num">№ 05</span>
              <span>A Word from the Field</span>
            </div>
            <h2 className="display italic" style={{
              fontSize: "clamp(36px, 4.6vw, 64px)", margin: 0, color: "var(--ink)",
            }}>
              "Said by people who keep notes."
            </h2>
          </div>
          <span className="mono" style={{
            fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}>
            Three of twelve thousand
          </span>
        </div>

        <hr className="rule-double" />

        <div className="voices" style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0,
        }}>
          {voices.map((v, i) => (
            <figure key={i} style={{
              padding: "44px 32px",
              borderRight: i < voices.length - 1 ? "1px solid var(--rule)" : "none",
              margin: 0, position: "relative",
            }}>
              <IconQuote size={28} style={{
                color: "var(--accent)", opacity: 0.5, marginBottom: 14,
              }} />
              <blockquote className="serif" style={{
                fontSize: 22, lineHeight: 1.35, color: "var(--ink)",
                letterSpacing: "-0.01em", margin: 0,
              }}>
                {v.q}
              </blockquote>
              <figcaption style={{ marginTop: 22 }}>
                <div className="serif italic" style={{
                  fontSize: 17, color: "var(--ink)",
                }}>
                  — {v.who}
                </div>
                <div className="mono" style={{
                  fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "var(--ink-faint)", marginTop: 4,
                }}>
                  {v.role}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <hr className="rule-double" />
      </div>

      <style>{`
        @media (max-width: 900px) {
          .voices { grid-template-columns: 1fr !important; }
          .voices figure { border-right: none !important; border-bottom: 1px solid var(--rule) !important; }
          .voices figure:last-child { border-bottom: none !important; }
        }
      `}</style>
    </section>
  );
}

window.PullQuote = PullQuote;
