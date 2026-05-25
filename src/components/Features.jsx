// Features — "Six small kindnesses". Editorial numbered entries.
function Features() {
  const items = [
    { num: "i.",   title: "Instant capture",     body: "Hold the button, speak, let go. We transcribe locally, clean the fillers, file it under the right space — before you've put the phone down.", Icon: IconLightning },
    { num: "ii.",  title: "An archive that listens", body: "Search by what you meant. NoteStream reads across every note, voice memo and PDF — and cites the original passages back to you.", Icon: IconBrain },
    { num: "iii.", title: "Auto-structure",      body: "Meetings become summaries. Voice notes become outlines. A wall of text becomes a bullet list. Without you asking, and without you losing the original.", Icon: IconList },
    { num: "iv.",  title: "The one thing",       body: "Every long doc, transcript and week of notes ends with The One Thing — the decision, the deadline, the dollar figure you actually need to remember.", Icon: IconSparkle },
    { num: "v.",   title: "Yours alone",         body: "End-to-end encryption at rest. Your archive never trains anyone's model, never crosses a border you didn't authorize, never gets indexed by us.", Icon: IconLock },
    { num: "vi.",  title: "Voice-first",         body: "Built for thinking out loud — pacing a room, walking the dog, halfway between two thoughts. Type when you must, speak when you can.", Icon: IconMic },
  ];

  return (
    <section id="features" style={{ paddingTop: 96, paddingBottom: 96 }}>
      <div className="page">
        {/* section head */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 2fr", gap: 64, alignItems: "end",
          marginBottom: 56,
        }} className="sec-head">
          <div>
            <div className="chapter-mark" style={{ marginBottom: 18 }}>
              <span className="num">№ 03</span>
              <span>The Particulars</span>
            </div>
            <h2 className="display" style={{
              fontSize: "clamp(40px, 5.4vw, 78px)", margin: 0,
            }}>
              Six small<br />
              <span className="italic" style={{ color: "var(--accent)" }}>kindnesses.</span>
            </h2>
          </div>
          <p className="lede" style={{ maxWidth: 540 }}>
            Most tools want to add to the pile. NoteStream's promise is the
            opposite: keep everything, surface only what's needed, and never
            ask you to do the librarian's work yourself.
          </p>
        </div>

        <hr className="rule-double" style={{ marginBottom: 0 }} />

        {/* grid */}
        <div className="features-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0,
        }}>
          {items.map((it, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            return (
              <article key={it.title} style={{
                padding: "36px 32px 38px",
                borderRight: col < 2 ? "1px solid var(--rule)" : "none",
                borderBottom: row === 0 ? "1px solid var(--rule)" : "none",
                position: "relative",
                background: "transparent",
                transition: "background .25s ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--paper-50)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{
                  display: "flex", alignItems: "baseline", justifyContent: "space-between",
                  marginBottom: 22,
                }}>
                  <span className="serif italic" style={{
                    fontSize: 30, color: "var(--accent)", lineHeight: 1,
                  }}>{it.num}</span>
                  <span style={{
                    width: 38, height: 38, borderRadius: "50%",
                    border: "1px solid var(--rule)", display: "inline-flex",
                    alignItems: "center", justifyContent: "center",
                    color: "var(--ink-soft)",
                  }}>
                    <it.Icon size={16} />
                  </span>
                </div>

                <h3 className="serif" style={{
                  fontSize: 26, margin: 0, color: "var(--ink)",
                  letterSpacing: "-0.01em", lineHeight: 1.15,
                }}>
                  {it.title}
                </h3>
                <p style={{
                  marginTop: 12, marginBottom: 0, fontSize: 14.5,
                  lineHeight: 1.6, color: "var(--ink-muted)",
                }}>
                  {it.body}
                </p>

                <div style={{
                  marginTop: 24, display: "flex", alignItems: "center", gap: 8,
                  fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "var(--ink-faint)",
                }}>
                  Read more
                  <IconArrowRight size={12} />
                </div>
              </article>
            );
          })}
        </div>

        <hr className="rule-double" style={{ marginTop: 0 }} />
      </div>

      <style>{`
        @media (max-width: 900px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .features-grid article { border-right: none !important; border-bottom: 1px solid var(--rule) !important; }
          .features-grid article:last-child { border-bottom: none !important; }
        }
        @media (min-width: 901px) and (max-width: 1100px) {
          .features-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </section>
  );
}

window.Features = Features;
