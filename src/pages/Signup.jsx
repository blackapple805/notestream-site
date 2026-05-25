// src/pages/Signup.jsx
// ───────────────────────────────────────────────────────────────
// Editorial signup page. Visual layout only — wire your
// Supabase signUp() in onSubmit where the comment indicates.
// ───────────────────────────────────────────────────────────────

import { useState } from "react";
import AuthShell, { authInputStyle, AuthField } from "../components/AuthShell";
import { ED } from "../lib/editorial";
import { FiArrowRight } from "react-icons/fi";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", plan: "reader" });
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    // ─── REPLACE with your supabase.auth.signUp({...}) call ───
    await new Promise((r) => setTimeout(r, 600));
    setBusy(false);
    console.log("signup submitted:", form);
  };

  return (
    <AuthShell
      chapter="A new subscription"
      title="Start the"
      italicWord="archive."
      lede="Fourteen days of Writer, free. No card. Read all the way back to the start of your thinking."
      quote={{
        text: "I've kept journals for fifteen years. NoteStream is the first thing that let me actually read them back.",
        attr: "Eliza Tan, essayist",
      }}
      footerText="Already have an account?"
      footerLinkLabel="Sign in →"
      footerLinkTo="/login"
    >
      <div className="ed-mono" style={{
        fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
        color: ED.accent, marginBottom: 8,
      }}>
        The form
      </div>
      <h2 className="ed-serif" style={{
        fontSize: 30, margin: 0, marginBottom: 24, color: ED.ink, letterSpacing: "-0.01em",
      }}>
        Tell us who you are.
      </h2>

      <form onSubmit={onSubmit}>
        <AuthField label="Your name">
          <input
            required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={authInputStyle}
          />
        </AuthField>

        <AuthField label="Email">
          <input
            required type="email" autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={authInputStyle}
          />
        </AuthField>

        <AuthField
          label="A password"
          hint="At least 12 characters. NoteStream never sees the plain version — only the hash."
        >
          <input
            required type="password" autoComplete="new-password" minLength={12}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={authInputStyle}
          />
        </AuthField>

        <AuthField label="Starting plan">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { v: "reader", t: "Reader", d: "Free, forever" },
              { v: "writer", t: "Writer", d: "$12/mo · 14-day trial" },
            ].map((p) => {
              const sel = form.plan === p.v;
              return (
                <button
                  key={p.v} type="button"
                  onClick={() => setForm({ ...form, plan: p.v })}
                  style={{
                    padding: "12px 14px", borderRadius: 10,
                    border: `1px solid ${sel ? ED.ink : ED.rule}`,
                    background: sel ? ED.paper200 : ED.paper100,
                    textAlign: "left", cursor: "pointer",
                  }}
                >
                  <div className="ed-serif" style={{
                    fontSize: 16, color: sel ? ED.ink : ED.inkSoft,
                  }}>
                    {p.t}
                  </div>
                  <div className="ed-mono" style={{
                    fontSize: 10, letterSpacing: "0.1em", color: ED.inkFaint,
                    textTransform: "uppercase", marginTop: 2,
                  }}>
                    {p.d}
                  </div>
                </button>
              );
            })}
          </div>
        </AuthField>

        <button type="submit" disabled={busy} className="ed-btn ed-btn-primary" style={{
          width: "100%", justifyContent: "center", marginTop: 8, opacity: busy ? 0.6 : 1,
        }}>
          {busy ? "One moment…" : "Begin reading"}
          <FiArrowRight size={14} />
        </button>

        <p className="ed-mono" style={{
          fontSize: 10.5, letterSpacing: "0.1em", color: ED.inkFaint,
          textTransform: "uppercase", marginTop: 14, textAlign: "center",
        }}>
          No card · Cancel anytime · Yours alone
        </p>
      </form>
    </AuthShell>
  );
}
