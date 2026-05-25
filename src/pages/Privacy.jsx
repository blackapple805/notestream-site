// src/pages/Privacy.jsx
import { useEditorial, ED } from "../lib/editorial";

export default function Privacy() {
  useEditorial();

  const sections = [
    {
      h: "What we collect",
      body: [
        "Your account: an email, a chosen name, and a hashed password (or your SSO identity, if you sign in that way). That's it. No phone number, no address, no employer field.",
        "Your archive: the notes, voice memos, documents, and metadata you create inside NoteStream. This is encrypted at rest with AES-256 and only ever decrypted in the context of you reading or writing it.",
        "Usage telemetry: aggregate, anonymous counts — how often features are used, broad device classes, latency percentiles. Never the content of your notes.",
      ],
    },
    {
      h: "What we never collect",
      body: [
        "The content of any note, voice memo, or document — for any purpose other than serving it back to you.",
        "Your contacts, calendar, location, or any data from your device beyond what you explicitly upload.",
        "Cross-site tracking pixels, third-party advertising IDs, or 'shadow profile' enrichment from data brokers.",
      ],
    },
    {
      h: "Training, in plain English",
      body: [
        "Your archive is never used to train any model — not ours, not our model providers', not anyone's. Our contracts with model providers (currently Anthropic and OpenAI) include a no-training clause; we publish those clauses on our security page.",
        "When you ask a question and the model reasons over your archive, the model receives only the relevant excerpts in-context for that query. Nothing is retained on the model provider's side beyond what's required for the request to complete.",
      ],
    },
    {
      h: "Who can see your archive",
      body: [
        "You. Your collaborators on a shared space, when you grant access. NoteStream support staff, only with your written consent, only for the duration of an open ticket.",
        "Not our employees outside of support. Not advertisers. Not model providers, beyond a single transient request. Not law enforcement, except under a valid legal demand — which we will challenge in court when narrow, and notify you of unless prohibited.",
      ],
    },
    {
      h: "Export and deletion",
      body: [
        "Export everything at any time, in plain formats: Markdown for notes, original audio files for voice memos, JSON for the structured extract layer.",
        "Delete your account from Settings → Privacy. All notes, voice files, and derived data are removed from our active systems within 24 hours and from backups within 30 days. We retain only the minimum required for legal compliance (e.g. transaction records) and only for the legally required period.",
      ],
    },
    {
      h: "Where the data lives",
      body: [
        "Primary storage in EU-West (Ireland) or US-East (Virginia), your choice at signup. Backups within the same region.",
        "No data is sent outside your chosen region except for model inference requests, which can route to the model provider's nearest region. You can disable cross-region inference in Settings, at the cost of slightly higher latency on AI features.",
      ],
    },
    {
      h: "Changes to this policy",
      body: [
        "Material changes are announced 30 days in advance via email and in-product banner. Minor clarifications go in the changelog on the Field Notes page. We do not back-date policies.",
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
              <span className="num">§</span>
              <span>The small print, made coarse</span>
            </div>
            <div className="ed-mono" style={{
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint,
            }}>
              Effective May 2026 · v3.0
            </div>
          </div>
          <hr className="ed-rule-dbl" style={{ marginBottom: 48 }} />

          <h1 className="ed-display" style={{
            fontSize: "clamp(48px, 7vw, 110px)", margin: 0, color: ED.ink,
          }}>
            Privacy,<br />
            <span className="ed-italic" style={{ color: ED.accent }}>written plainly.</span>
          </h1>
          <p className="ed-lede" style={{ marginTop: 28, maxWidth: 620 }}>
            The short version: your archive is yours. We don't sell it, we don't
            train on it, we don't expose it. The long version is below, in language
            you can actually read.
          </p>
        </div>
      </section>

      <section style={{ padding: "0 0 96px" }}>
        <div className="ed-page">
          <div className="legal-grid" style={{
            display: "grid", gridTemplateColumns: "220px 1fr", gap: 56, alignItems: "start",
          }}>
            <aside style={{ position: "sticky", top: 120 }}>
              <div className="ed-mono" style={{
                fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                color: ED.inkFaint, marginBottom: 14,
              }}>
                On this page
              </div>
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
                {sections.map((s, i) => (
                  <li key={s.h}>
                    <a href={`#s-${i}`} className="ed-ulink" style={{
                      display: "grid", gridTemplateColumns: "24px 1fr", gap: 10,
                      fontFamily: ED.serif, fontSize: 15, color: ED.inkSoft,
                    }}>
                      <span className="ed-mono" style={{ fontSize: 10, color: ED.inkFaint }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{s.h}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </aside>

            <div>
              {sections.map((s, i) => (
                <article key={s.h} id={`s-${i}`} style={{
                  paddingBottom: 40, marginBottom: 40,
                  borderBottom: i < sections.length - 1 ? `1px solid ${ED.rule}` : "none",
                }}>
                  <div className="ed-chapter" style={{ marginBottom: 14 }}>
                    <span className="num">§ {String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h2 className="ed-display" style={{
                    fontSize: "clamp(28px, 3.6vw, 44px)", margin: 0, color: ED.ink,
                    letterSpacing: "-0.02em",
                  }}>
                    {s.h}
                  </h2>
                  <div style={{ marginTop: 18 }}>
                    {s.body.map((p, j) => (
                      <p key={j} className={j === 0 ? "ed-dropcap" : ""} style={{
                        fontSize: 17, lineHeight: 1.7, color: ED.inkSoft,
                        maxWidth: 680, marginTop: j === 0 ? 0 : 14,
                      }}>
                        {p}
                      </p>
                    ))}
                  </div>
                </article>
              ))}

              <p className="ed-serif ed-italic" style={{
                fontSize: 17, color: ED.inkMute, marginTop: 24,
              }}>
                Questions? Write to <a href="mailto:privacy@notestream.co" className="ed-ulink" style={{ color: ED.accent }}>privacy@notestream.co</a>. A human reads every email.
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .legal-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
            .ns-ed .legal-grid > aside { position: static !important; }
          }
        `}</style>
      </section>
    </div>
  );
}
