// src/pages/Terms.jsx
import { useEditorial, ED } from "../lib/editorial";

export default function Terms() {
  useEditorial();

  const sections = [
    { h: "The agreement", body: [
      "By creating a NoteStream account, you agree to these terms. They're written to be readable; if anything is unclear, write to legal@notestream.co and we'll explain — and probably rewrite this page.",
      "These terms apply to anyone using the service, on any plan, including the free Reader tier. They may be updated; material changes get 30 days' notice.",
    ]},
    { h: "Your account", body: [
      "You're responsible for keeping your login credentials private. If you suspect unauthorized access, write to security@notestream.co immediately and we'll lock the account while we investigate — no charge.",
      "One person, one account. Team plans allow multiple seats; sharing a single seat across people is not allowed and may trigger an automatic upgrade prompt.",
    ]},
    { h: "Your content", body: [
      "You own everything you put into NoteStream. We claim no rights to your notes, voice memos, documents, or any derived structured data. We host them, encrypt them, and serve them back to you.",
      "You grant us the minimum technical license needed to operate the service: to store, transmit, decrypt at your request, and process for the specific AI features you invoke. That's it. The grant ends when you delete your data.",
    ]},
    { h: "Acceptable use", body: [
      "Don't use NoteStream to store or transmit illegal content. Don't probe our infrastructure looking for vulnerabilities outside our coordinated disclosure program (security@notestream.co — we pay bounties).",
      "Don't use the service in a way that would violate the privacy or rights of people you're capturing notes about. Local laws on recording, retention, and consent apply.",
    ]},
    { h: "Service availability", body: [
      "We aim for 99.9% uptime, measured monthly. Recent statistics are on the Status page. If we miss the target, paying customers get a pro-rated credit, automatically.",
      "We may take the service offline briefly for maintenance, with advance notice when possible. Emergency security patches happen without notice.",
    ]},
    { h: "Billing", body: [
      "Paid plans renew monthly or annually. Cancel anytime from Settings; access continues until the end of the current period.",
      "Refunds: within 30 days of an initial subscription, full refund, no questions. After that, pro-rated on cancellation if you request it. We'd rather you leave easily than feel stuck.",
    ]},
    { h: "If we mess up", body: [
      "Our liability is capped at the amount you paid us in the previous 12 months. We carry insurance above that, but legally we have to write a cap; this is it.",
      "We do not offer warranties on the accuracy of AI-generated summaries, briefs, or reasoning. They're tools to help you think — not statements of fact. Verify before you act.",
    ]},
    { h: "Ending the relationship", body: [
      "You can close your account from Settings. We can suspend an account that's actively breaking these terms — usually after notice and a chance to fix the issue, except in cases of clear abuse.",
      "On termination, you have 30 days to export your data. After that, it's deleted as described in the privacy policy.",
    ]},
    { h: "Jurisdiction", body: [
      "These terms are governed by the laws of the State of Delaware, USA, with disputes resolved in the courts of New Castle County. EU residents retain all rights under their local consumer protection laws.",
    ]},
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
              <span>The terms, made plain</span>
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
            Terms of<br />
            <span className="ed-italic" style={{ color: ED.accent }}>good faith.</span>
          </h1>
          <p className="ed-lede" style={{ marginTop: 28, maxWidth: 620 }}>
            The contract between you and NoteStream, written so a normal person
            can read it. If something is unclear, it's our fault — write to
            us and we'll fix the page.
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
                    <a href={`#t-${i}`} className="ed-ulink" style={{
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
                <article key={s.h} id={`t-${i}`} style={{
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
                Questions? <a href="mailto:legal@notestream.co" className="ed-ulink" style={{ color: ED.accent }}>legal@notestream.co</a>.
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
