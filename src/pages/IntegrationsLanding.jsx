// src/pages/IntegrationsLanding.jsx
import { useEditorial, ED } from "../lib/editorial";
import { FiArrowUpRight, FiArrowRight } from "react-icons/fi";

export default function IntegrationsLanding() {
  useEditorial();

  const groups = [
    {
      h: "Capture", desc: "Pipe notes in from everywhere",
      items: [
        { n: "iOS Shortcuts",     d: "Capture from anywhere on your phone" },
        { n: "Apple Notes",       d: "One-way import, on a schedule" },
        { n: "Otter & Granola",   d: "Pull meeting transcripts in automatically" },
        { n: "Web clipper",       d: "Save articles with reading view" },
        { n: "Email-to-archive",  d: "Forward to a private inbox address" },
        { n: "Voice memos",       d: "iOS Voice Memos sync, with cleanup" },
      ],
    },
    {
      h: "Documents", desc: "Bring the long-form in",
      items: [
        { n: "Google Drive",      d: "PDFs, Docs, Sheets — read into the archive" },
        { n: "Notion",            d: "Selective import, no schema lock-in" },
        { n: "Dropbox & iCloud",  d: "Watch folders for new files" },
        { n: "Readwise",          d: "Highlights and book notes" },
        { n: "Obsidian",          d: "Markdown vault, bidirectional sync" },
      ],
    },
    {
      h: "Calendar & meetings", desc: "Context for the things you wrote",
      items: [
        { n: "Google Calendar",   d: "Match notes to meetings automatically" },
        { n: "Cal.com",           d: "Same, for open-source schedulers" },
        { n: "Zoom & Meet",       d: "Pull in recordings (with consent)" },
      ],
    },
    {
      h: "Conversation", desc: "From channel to archive",
      items: [
        { n: "Slack",             d: "Save a thread to a space with one emoji" },
        { n: "Discord",           d: "Same model — private archive, never shared" },
      ],
    },
    {
      h: "Outbound", desc: "Send your briefs elsewhere",
      items: [
        { n: "Email a brief",     d: "Any summary → email, formatted nicely" },
        { n: "Linear",            d: "Action items → tickets, owners attached" },
        { n: "Things & Todoist",  d: "Tasks extracted from notes → your todo app" },
      ],
    },
    {
      h: "Privacy-respecting", desc: "Even the integrations behave",
      items: [
        { n: "OAuth scopes",      d: "Granular permission, revocable per-source" },
        { n: "Read-only first",   d: "Most integrations request read access only" },
        { n: "Per-space scoping", d: "Pipe to a specific space, not the whole archive" },
      ],
    },
  ];

  return (
    <div className="ns-ed" style={{ minHeight: "100vh" }}>
      <section style={{ paddingTop: 140, paddingBottom: 64 }}>
        <div className="ed-page">
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            marginBottom: 48, flexWrap: "wrap", gap: 16,
          }}>
            <div className="ed-chapter">
              <span className="num">№ 01</span>
              <span>The Connections</span>
            </div>
            <div className="ed-mono" style={{
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint,
            }}>
              28 integrations · More each issue
            </div>
          </div>
          <hr className="ed-rule-dbl" style={{ marginBottom: 48 }} />

          <div className="int-hero" style={{
            display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 64, alignItems: "end",
          }}>
            <h1 className="ed-display" style={{
              fontSize: "clamp(48px, 7.4vw, 120px)", margin: 0, color: ED.ink,
            }}>
              Quietly<br />
              <span className="ed-italic" style={{ color: ED.accent }}>compatible.</span>
            </h1>
            <p className="ed-lede" style={{ maxWidth: 460, margin: 0 }}>
              NoteStream doesn't try to be your whole stack. It connects to the
              tools you already use — calendars, meeting apps, document stores,
              email — and turns each into another way for the archive to learn
              what you've been doing.
            </p>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .int-hero { grid-template-columns: 1fr !important; gap: 28px !important; }
          }
        `}</style>
      </section>

      <section style={{ padding: "0 0 64px" }}>
        <div className="ed-page">
          {groups.map((g, gi) => (
            <div key={g.h} style={{ marginBottom: 56 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "baseline", marginBottom: 16, gap: 16, flexWrap: "wrap",
              }}>
                <div>
                  <div className="ed-chapter" style={{ marginBottom: 6 }}>
                    <span className="num">§ {String(gi + 1).padStart(2, "0")}</span>
                    <span>{g.h}</span>
                  </div>
                  <div className="ed-serif ed-italic" style={{ fontSize: 19, color: ED.inkMute }}>
                    {g.desc}
                  </div>
                </div>
                <div className="ed-mono" style={{ fontSize: 10.5, color: ED.inkFaint, letterSpacing: "0.1em" }}>
                  {g.items.length} {g.items.length === 1 ? "integration" : "integrations"}
                </div>
              </div>
              <hr className="ed-rule" />

              <div className="int-grid" style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0,
              }}>
                {g.items.map((it, i) => {
                  const col = i % 3;
                  return (
                    <a key={it.n} href="#" style={{
                      display: "block", padding: "22px 24px",
                      borderRight: col < 2 ? `1px solid ${ED.rule}` : "none",
                      borderBottom: `1px solid ${ED.rule}`,
                      transition: "background .18s ease",
                    }} className="int-cell"
                       onMouseEnter={(e) => e.currentTarget.style.background = ED.paper50}
                       onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "baseline",
                      }}>
                        <span className="ed-serif" style={{
                          fontSize: 19, color: ED.ink, letterSpacing: "-0.005em",
                        }}>
                          {it.n}
                        </span>
                        <FiArrowUpRight size={13} style={{ color: ED.inkFaint }} />
                      </div>
                      <p style={{
                        marginTop: 6, marginBottom: 0, fontSize: 13.5,
                        lineHeight: 1.5, color: ED.inkMute,
                      }}>{it.d}</p>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .int-grid { grid-template-columns: 1fr !important; }
            .ns-ed .int-cell { border-right: none !important; }
          }
          @media (min-width: 901px) and (max-width: 1100px) {
            .ns-ed .int-grid { grid-template-columns: 1fr 1fr !important; }
            .ns-ed .int-grid .int-cell:nth-child(3n) { border-right: 1px solid ${ED.rule} !important; }
            .ns-ed .int-grid .int-cell:nth-child(2n) { border-right: none !important; }
          }
        `}</style>
      </section>

      {/* Request an integration */}
      <section style={{
        padding: "72px 0", background: ED.paper50,
        borderTop: `1px solid ${ED.rule}`, borderBottom: `1px solid ${ED.rule}`,
      }}>
        <div className="ed-page">
          <div className="req-grid" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center",
          }}>
            <div>
              <div className="ed-chapter" style={{ marginBottom: 18 }}>
                <span className="num">§</span>
                <span>Don't see something</span>
              </div>
              <h2 className="ed-display" style={{
                fontSize: "clamp(32px, 4.4vw, 56px)", margin: 0, color: ED.ink,
              }}>
                Ask for the<br />
                <span className="ed-italic" style={{ color: ED.accent }}>integration</span> you need.
              </h2>
            </div>
            <div>
              <p className="ed-serif" style={{
                fontSize: 19, lineHeight: 1.55, color: ED.inkSoft, margin: 0, maxWidth: 480,
              }}>
                We build integrations in the order people ask for them. If your
                tool isn't here, tell us — we publish the queue, and we build
                the top one most weeks.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                <a href="mailto:integrations@notestream.co" className="ed-btn ed-btn-primary">
                  Request one <FiArrowUpRight size={13} />
                </a>
                <a href="#" className="ed-btn ed-btn-ghost">
                  See the queue
                </a>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .req-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          }
        `}</style>
      </section>
    </div>
  );
}
