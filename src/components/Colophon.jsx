// Colophon — a real magazine-style footer / closing matter
function Colophon() {
  const today = React.useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, []);

  return (
    <footer id="colophon" style={{
      paddingTop: 96, paddingBottom: 48, background: "var(--ink-900)", color: "var(--paper-100)",
      position: "relative",
    }}>
      <div className="page">

        {/* CTA — the final pitch */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56,
          paddingBottom: 64, borderBottom: "1px solid rgba(255,255,255,0.08)",
        }} className="cta-grid">
          <div>
            <div className="mono" style={{
              fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)", marginBottom: 18,
            }}>
              The last page
            </div>
            <h2 className="display" style={{
              fontSize: "clamp(40px, 5.6vw, 84px)", margin: 0, color: "#fff",
              lineHeight: 1,
            }}>
              Start the<br />
              <span className="italic" style={{ color: "var(--accent)" }}>archive.</span>
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <p className="serif" style={{
              fontSize: 21, lineHeight: 1.45, color: "rgba(255,255,255,0.78)", margin: 0,
              maxWidth: 460,
            }}>
              Bring fifteen years of voice notes, twelve open browser tabs and a
              shoebox of PDFs. NoteStream will read them all, and answer when
              you ask.
            </p>
            <div style={{ marginTop: 26, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href="#" className="btn btn-accent">
                Start free <IconArrowRight size={14} />
              </a>
              <a href="#" className="btn btn-ghost" style={{
                color: "#fff", borderColor: "rgba(255,255,255,0.2)",
              }}>
                Talk to a human
              </a>
            </div>
          </div>
        </div>

        {/* Sitemap-style columns */}
        <div className="footer-cols" style={{
          display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr", gap: 32,
          padding: "48px 0",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
              <span className="serif" style={{ fontSize: 26, color: "#fff", letterSpacing: "-0.02em" }}>
                Notestream
              </span>
              <span className="serif italic" style={{ fontSize: 14, color: "var(--accent)" }}>&</span>
              <span className="mono" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                Co.
              </span>
            </div>
            <p style={{
              fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,0.55)",
              maxWidth: 280, margin: 0,
            }}>
              An archive that reasons. Made for thinkers, writers, and operators
              who keep more notes than they can read.
            </p>
            <div style={{ marginTop: 22, display: "flex", gap: 14 }}>
              {["X", "GitHub", "RSS"].map((s) => (
                <a key={s} href="#" className="ulink" style={{
                  fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.12em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.55)",
                }}>{s}</a>
              ))}
            </div>
          </div>

          {[
            ["Product", ["Smart notes", "AI summaries", "Voice notes", "Cloud sync", "Team workspace"]],
            ["Reading", ["Field notes", "How it works", "Pricing", "Changelog", "Status"]],
            ["Company", ["About", "Manifesto", "Hiring", "Press kit", "Contact"]],
            ["Small print", ["Privacy", "Terms", "Security", "DPA", "Acceptable use"]],
          ].map(([h, items]) => (
            <div key={h}>
              <div className="mono" style={{
                fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)", marginBottom: 14,
              }}>
                {h}
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                {items.map((it) => (
                  <li key={it}>
                    <a href="#" className="ulink" style={{
                      fontFamily: "var(--serif)", fontSize: 15, color: "rgba(255,255,255,0.78)",
                    }}>{it}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr style={{ border: 0, height: 1, background: "rgba(255,255,255,0.08)", margin: 0 }} />

        {/* Actual colophon */}
        <div className="colophon-bar" style={{
          display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 32,
          paddingTop: 28,
          fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.4)",
        }}>
          <span>© 2026 · Notestream Co.</span>
          <span style={{ textAlign: "center" }}>
            Set in <span style={{ color: "rgba(255,255,255,0.78)", fontFamily: "var(--serif)", textTransform: "none", letterSpacing: 0, fontStyle: "italic" }}>Instrument Serif</span>{" "}
            & <span style={{ color: "rgba(255,255,255,0.78)", textTransform: "none", letterSpacing: 0 }}>Geist</span>{" "}
            · Printed monthly · {today} issue
          </span>
          <span style={{ textAlign: "right", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%", background: "var(--accent)",
              animation: "pulse-dot 2.4s ease-in-out infinite",
            }} />
            All systems quiet
          </span>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .cta-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .footer-cols { grid-template-columns: 1fr 1fr !important; }
          .colophon-bar { grid-template-columns: 1fr !important; text-align: left !important; }
          .colophon-bar > span { text-align: left !important; justify-content: flex-start !important; }
        }
      `}</style>
    </footer>
  );
}

window.Colophon = Colophon;
