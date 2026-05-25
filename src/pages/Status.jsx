// src/pages/Status.jsx
import { useEditorial, ED } from "../lib/editorial";

export default function Status() {
  useEditorial();

  const components = [
    { name: "Web app & API",       status: "ok",   uptime: "100.000%" },
    { name: "iOS & Mac apps",      status: "ok",   uptime: "99.998%" },
    { name: "Voice transcription", status: "ok",   uptime: "99.991%" },
    { name: "AI reasoning",        status: "ok",   uptime: "99.974%" },
    { name: "Sync & backup",       status: "ok",   uptime: "100.000%" },
    { name: "Auth & sign-in",      status: "ok",   uptime: "100.000%" },
  ];

  const incidents = [
    {
      date: "May 18", title: "Slow voice transcription on Android",
      tag: "Resolved", duration: "42 min",
      body: "Increased latency on Android voice notes between 14:08 and 14:50 UTC due to a model-provider regional issue. Cleared automatically; root cause was an upstream auto-scaler. No data loss.",
    },
    {
      date: "Apr 30", title: "Scheduled maintenance — sync overhaul",
      tag: "Completed", duration: "18 min",
      body: "Migrated sync layer to delta packets (faster on slow connections). Announced two weeks in advance. Brief read-only mode for 18 minutes. No data loss.",
    },
    {
      date: "Apr 12", title: "API rate-limiting too aggressive",
      tag: "Resolved", duration: "1h 04m",
      body: "After a deploy, the API rate-limiter started returning 429s to legitimate clients on Pro plans. Reverted within an hour; no data lost. Post-mortem published.",
    },
  ];

  const days = Array.from({ length: 90 }).map((_, i) => {
    // Pseudo-random uptime pattern for the strip
    const seed = (i * 9301 + 49297) % 233280;
    const r = seed / 233280;
    return r > 0.985 ? "warn" : r > 0.998 ? "down" : "ok";
  });

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
              <span>The Status Board</span>
            </div>
            <div className="ed-mono" style={{
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint,
            }}>
              Updated every 30 seconds · Last check {new Date().toLocaleTimeString()}
            </div>
          </div>
          <hr className="ed-rule-dbl" style={{ marginBottom: 56 }} />

          <div className="status-hero" style={{
            display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 64, alignItems: "end",
          }}>
            <div>
              <h1 className="ed-display" style={{
                fontSize: "clamp(48px, 7vw, 110px)", margin: 0, color: ED.ink,
              }}>
                All systems<br />
                <span className="ed-italic" style={{ color: ED.accent }}>quiet.</span>
              </h1>
            </div>
            <div style={{
              padding: 24, background: ED.paper50, border: `1px solid ${ED.rule}`, borderRadius: 14,
            }}>
              <div className="ed-mono" style={{
                fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                color: ED.inkFaint, marginBottom: 8,
              }}>
                Rolling 90-day uptime
              </div>
              <div className="ed-display" style={{ fontSize: 48, color: ED.accent, lineHeight: 1 }}>
                99.987<span style={{ color: ED.inkFaint, fontSize: 24 }}>%</span>
              </div>
              <p style={{ fontSize: 13, color: ED.inkMute, marginTop: 8, marginBottom: 0, lineHeight: 1.5 }}>
                Across all components, weighted by usage. Target: 99.9%.
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .status-hero { grid-template-columns: 1fr !important; gap: 28px !important; }
          }
        `}</style>
      </section>

      <section style={{ padding: "0 0 64px" }}>
        <div className="ed-page">
          <hr className="ed-rule-dbl" style={{ marginBottom: 0 }} />
          {components.map((c, i) => (
            <div key={c.name} style={{
              display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 24,
              padding: "20px 0", borderBottom: `1px solid ${ED.rule}`,
              alignItems: "center",
            }} className="status-row">
              <span style={{
                width: 10, height: 10, borderRadius: "50%",
                background: c.status === "ok" ? "#1f8a5b" : "#d97706",
                boxShadow: c.status === "ok" ? "0 0 0 4px rgba(31,138,91,0.12)" : "0 0 0 4px rgba(217,119,6,0.12)",
              }} />
              <div className="ed-serif" style={{ fontSize: 19, color: ED.ink, letterSpacing: "-0.005em" }}>
                {c.name}
              </div>

              {/* 90-day strip */}
              <div className="status-strip" style={{
                display: "flex", gap: 2, height: 24,
              }}>
                {days.slice(i * 3, i * 3 + 60).map((d, j) => (
                  <span key={j} style={{
                    width: 4, height: "100%",
                    background: d === "down" ? "#c2410c" : d === "warn" ? "#d97706" : ED.accent,
                    opacity: d === "ok" ? 0.65 : 0.9,
                    borderRadius: 1,
                  }} />
                ))}
              </div>

              <div style={{ textAlign: "right" }}>
                <div className="ed-mono" style={{
                  fontSize: 10.5, letterSpacing: "0.1em", color: ED.inkFaint,
                  textTransform: "uppercase",
                }}>{c.status === "ok" ? "Operational" : "Investigating"}</div>
                <div className="ed-mono" style={{ fontSize: 13, color: ED.ink, marginTop: 2 }}>
                  {c.uptime}
                </div>
              </div>
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 800px) {
            .ns-ed .status-row { grid-template-columns: auto 1fr auto !important; }
            .ns-ed .status-strip { display: none !important; }
          }
        `}</style>
      </section>

      <section style={{ padding: "64px 0 96px", borderTop: `1px solid ${ED.rule}` }}>
        <div className="ed-page">
          <div className="ed-chapter" style={{ marginBottom: 18 }}>
            <span className="num">№ 02</span>
            <span>Recent incidents</span>
          </div>
          <h2 className="ed-display" style={{
            fontSize: "clamp(32px, 4.4vw, 56px)", margin: 0, marginBottom: 36, color: ED.ink,
          }}>
            What we've<br />
            <span className="ed-italic" style={{ color: ED.accent }}>broken lately.</span>
          </h2>

          {incidents.map((it, i) => (
            <article key={i} style={{
              display: "grid", gridTemplateColumns: "120px 1fr 120px", gap: 32,
              padding: "28px 0", borderTop: `1px solid ${ED.rule}`,
              borderBottom: i === incidents.length - 1 ? `1px solid ${ED.rule}` : "none",
              alignItems: "start",
            }} className="incident-row">
              <div>
                <div className="ed-serif ed-italic" style={{ fontSize: 22, color: ED.ink }}>{it.date}</div>
                <div className="ed-mono" style={{
                  fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                  color: ED.inkFaint, marginTop: 4,
                }}>{it.duration}</div>
              </div>
              <div>
                <span className="ed-chip ed-chip-accent" style={{ marginBottom: 10 }}>{it.tag}</span>
                <h3 className="ed-serif" style={{
                  fontSize: 22, margin: 0, marginTop: 8, color: ED.ink, letterSpacing: "-0.005em",
                }}>{it.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: ED.inkMute, marginTop: 8 }}>
                  {it.body}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <a href="#" className="ed-ulink ed-mono" style={{
                  fontSize: 11, color: ED.accent, letterSpacing: "0.08em",
                }}>Post-mortem →</a>
              </div>
            </article>
          ))}
        </div>

        <style>{`
          @media (max-width: 800px) {
            .ns-ed .incident-row { grid-template-columns: 1fr !important; gap: 12px !important; }
          }
        `}</style>
      </section>
    </div>
  );
}
