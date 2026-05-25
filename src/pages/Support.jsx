// src/pages/Support.jsx
import { useState } from "react";
import { useEditorial, ED } from "../lib/editorial";
import { FiArrowRight, FiArrowUpRight } from "react-icons/fi";

export default function Support() {
  useEditorial();
  const [form, setForm] = useState({ name: "", email: "", topic: "general", message: "" });
  const [sent, setSent] = useState(false);

  const topics = [
    { v: "general",  l: "General question" },
    { v: "billing",  l: "Billing & subscriptions" },
    { v: "voice",    l: "Voice notes & transcription" },
    { v: "ai",       l: "AI reasoning & briefs" },
    { v: "team",     l: "Team & shared workspaces" },
    { v: "privacy",  l: "Privacy or security concern" },
    { v: "bug",      l: "I think I found a bug" },
    { v: "other",    l: "Something else" },
  ];

  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

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
              <span>Support · Get a Person</span>
            </div>
            <div className="ed-mono" style={{
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint,
            }}>
              Avg reply: 4 hours · Mon–Fri
            </div>
          </div>
          <hr className="ed-rule-dbl" style={{ marginBottom: 48 }} />

          <h1 className="ed-display" style={{
            fontSize: "clamp(48px, 7.4vw, 120px)", margin: 0, color: ED.ink,
          }}>
            A real<br />
            <span className="ed-italic" style={{ color: ED.accent }}>person,</span> replying.
          </h1>
          <p className="ed-lede" style={{ marginTop: 28, maxWidth: 620 }}>
            No chatbot, no ticket queue. Write to us and a human on the team
            replies — usually within hours, always within a day. We read
            every message.
          </p>
        </div>
      </section>

      <section style={{ padding: "0 0 96px" }}>
        <div className="ed-page">
          <div className="sup-grid" style={{
            display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 56, alignItems: "start",
          }}>
            {/* Quick paths */}
            <div>
              <div className="ed-chapter" style={{ marginBottom: 18 }}>
                <span className="num">§</span>
                <span>Before you write</span>
              </div>
              <p className="ed-serif" style={{
                fontSize: 17, lineHeight: 1.55, color: ED.inkMute, margin: 0,
              }}>
                A few common questions live in faster places:
              </p>

              <div style={{ marginTop: 28, display: "grid", gap: 14 }}>
                {[
                  { t: "Help centre", d: "168 articles, written plainly", to: "/help-center" },
                  { t: "FAQ", d: "12 most common questions", to: "/faq" },
                  { t: "Status board", d: "Live service status & incidents", to: "/status" },
                  { t: "Privacy policy", d: "Yes, even the long version", to: "/privacy" },
                ].map((it) => (
                  <a key={it.t} href={it.to} style={{
                    display: "block", padding: "16px 20px",
                    border: `1px solid ${ED.rule}`, borderRadius: 12,
                    background: ED.paper50, transition: "all .18s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = ED.ink; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = ED.rule; }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    }}>
                      <span className="ed-serif" style={{ fontSize: 18, color: ED.ink, letterSpacing: "-0.005em" }}>
                        {it.t}
                      </span>
                      <FiArrowRight size={14} style={{ color: ED.inkFaint }} />
                    </div>
                    <div className="ed-mono" style={{
                      fontSize: 10.5, letterSpacing: "0.1em", color: ED.inkFaint,
                      textTransform: "uppercase", marginTop: 4,
                    }}>
                      {it.d}
                    </div>
                  </a>
                ))}
              </div>

              <hr className="ed-rule-soft" style={{ margin: "32px 0" }} />

              <div className="ed-mono" style={{
                fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                color: ED.inkFaint, marginBottom: 12,
              }}>
                Or write to us directly
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["help@notestream.co", "General questions"],
                  ["billing@notestream.co", "Anything about subscriptions"],
                  ["security@notestream.co", "Report a vulnerability"],
                ].map(([e, l]) => (
                  <a key={e} href={`mailto:${e}`} className="ed-ulink" style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    fontFamily: ED.sans, fontSize: 14, color: ED.accent,
                  }}>
                    <span style={{ fontWeight: 500 }}>{e}</span>
                    <span className="ed-mono" style={{ fontSize: 10.5, color: ED.inkFaint, letterSpacing: "0.06em" }}>
                      {l}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="ed-card" style={{ padding: 32 }}>
              <div className="ed-mono" style={{
                fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
                color: ED.accent, marginBottom: 8,
              }}>
                The form
              </div>
              <h2 className="ed-serif" style={{
                fontSize: 30, margin: 0, marginBottom: 24, color: ED.ink,
                letterSpacing: "-0.01em",
              }}>
                Tell us what's going on.
              </h2>

              {sent ? (
                <div className="ed-reveal" style={{ padding: "24px 0", textAlign: "center" }}>
                  <div className="ed-display" style={{
                    fontSize: 32, color: ED.accent, marginBottom: 12,
                  }}>
                    Sent. <span className="ed-italic">Thank you.</span>
                  </div>
                  <p style={{ fontSize: 15, color: ED.inkMute, margin: 0 }}>
                    We'll reply to <span style={{ color: ED.ink, fontWeight: 500 }}>{form.email || "your email"}</span> within a day. Usually a few hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} style={{ display: "grid", gap: 18 }}>
                  <Field label="Your name">
                    <input
                      required value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      required type="email" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Topic">
                    <select
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      style={inputStyle}
                    >
                      {topics.map((t) => (
                        <option key={t.v} value={t.v}>{t.l}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="What's the problem, or the question?">
                    <textarea
                      required rows={6}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Be specific where you can. If it's a bug, include what you expected vs. what happened."
                      style={{ ...inputStyle, resize: "vertical", minHeight: 130 }}
                    />
                  </Field>

                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginTop: 6, flexWrap: "wrap", gap: 12,
                  }}>
                    <p className="ed-mono" style={{
                      fontSize: 10.5, letterSpacing: "0.1em", color: ED.inkFaint,
                      textTransform: "uppercase", margin: 0,
                    }}>
                      A human reads this, not a model
                    </p>
                    <button type="submit" className="ed-btn ed-btn-primary">
                      Send the message <FiArrowUpRight size={13} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .sup-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          }
        `}</style>
      </section>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "12px 14px",
  border: `1px solid ${ED.rule}`, borderRadius: 10,
  background: ED.paper100, color: ED.ink,
  fontFamily: ED.sans, fontSize: 15,
  outline: "none",
};

function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <span className="ed-mono" style={{
        display: "block", fontSize: 10.5, letterSpacing: "0.14em",
        textTransform: "uppercase", color: ED.inkFaint, marginBottom: 8,
      }}>
        {label}
      </span>
      {children}
    </label>
  );
}
