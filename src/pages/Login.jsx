// src/pages/Login.jsx
// ───────────────────────────────────────────────────────────────
// Editorial login page — wired to Supabase auth.
// ───────────────────────────────────────────────────────────────

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthShell, { authInputStyle, AuthField } from "../components/AuthShell";
import { ED } from "../lib/editorial";
import { FiArrowRight } from "react-icons/fi";
import { supabase, supabaseReady } from "../lib/supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!supabaseReady) {
      setErr("Authentication is not configured. Please contact support.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (error) throw error;
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErr(error?.message || "Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onOAuth = async (provider) => {
    setErr("");
    if (!supabaseReady) {
      setErr("Authentication is not configured.");
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setErr(error?.message || `Could not start ${provider} sign-in.`);
    }
  };

  return (
    <AuthShell
      chapter="Returning to your archive"
      title="Welcome"
      italicWord="back."
      lede="Pick up where you left off. Voice notes from this morning, drafts from last week, the brief you almost finished — all where you left them."
      quote={{
        text: "It feels less like a notes app and more like a reading room I built for myself, slowly.",
        attr: "Priya Mehrotra, researcher",
      }}
      footerText="No account yet?"
      footerLinkLabel="Start the archive →"
      footerLinkTo="/signup"
    >
      <div className="ed-mono" style={{
        fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
        color: ED.accent, marginBottom: 8,
      }}>
        Sign in
      </div>
      <h2 className="ed-serif" style={{
        fontSize: 30, margin: 0, marginBottom: 24, color: ED.ink, letterSpacing: "-0.01em",
      }}>
        Who's reading?
      </h2>

      <form onSubmit={onSubmit}>
        <AuthField label="Email">
          <input
            required type="email" autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={authInputStyle}
          />
        </AuthField>

        <AuthField label="Password">
          <input
            required type="password" autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={authInputStyle}
          />
        </AuthField>

        {err && (
          <div role="alert" style={{
            padding: "10px 12px", marginBottom: 14, borderRadius: 8,
            background: "#fdecea", color: "#a3261c",
            border: "1px solid #f5c2bd",
            fontFamily: ED.sans, fontSize: 13.5, lineHeight: 1.4,
          }}>
            {err}
          </div>
        )}

        <div style={{
          display: "flex", justifyContent: "flex-end", marginTop: -8, marginBottom: 18,
        }}>
          <Link to="/reset-password" className="ed-ulink" style={{
            fontFamily: ED.sans, fontSize: 13, color: ED.accent, fontWeight: 500,
          }}>
            Forgotten your password?
          </Link>
        </div>

        <button type="submit" disabled={busy} className="ed-btn ed-btn-primary" style={{
          width: "100%", justifyContent: "center", opacity: busy ? 0.6 : 1,
        }}>
          {busy ? "One moment…" : "Open the archive"}
          <FiArrowRight size={14} />
        </button>

        <div style={{
          display: "flex", alignItems: "center", gap: 12, margin: "20px 0",
        }}>
          <hr style={{ flex: 1, border: 0, height: 1, background: ED.rule, margin: 0 }} />
          <span className="ed-mono" style={{
            fontSize: 10, letterSpacing: "0.16em", color: ED.inkFaint, textTransform: "uppercase",
          }}>
            Or
          </span>
          <hr style={{ flex: 1, border: 0, height: 1, background: ED.rule, margin: 0 }} />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {[
            { l: "Continue with Google", k: "google" },
            { l: "Continue with Apple",  k: "apple" },
          ].map((b) => (
            <button
              key={b.k} type="button"
              onClick={() => onOAuth(b.k)}
              style={{
                padding: "11px 14px",
                border: `1px solid ${ED.rule}`, borderRadius: 10,
                background: ED.paper100, color: ED.ink,
                fontFamily: ED.sans, fontSize: 14, fontWeight: 500,
                cursor: "pointer", transition: "border-color .15s",
                textAlign: "center",
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = ED.ink}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = ED.rule}
            >
              {b.l}
            </button>
          ))}
        </div>
      </form>
    </AuthShell>
  );
}
