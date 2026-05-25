// src/pages/ResetPassword.jsx
// ───────────────────────────────────────────────────────────────
// Editorial "forgot password" page — wired to Supabase.
// ───────────────────────────────────────────────────────────────

import { useState } from "react";
import AuthShell, { authInputStyle, AuthField } from "../components/AuthShell";
import { ED } from "../lib/editorial";
import { FiArrowRight } from "react-icons/fi";
import { supabase, supabaseReady } from "../lib/supabaseClient";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!supabaseReady) {
      setErr("Password reset is not configured.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (error) {
      setErr(error?.message || "Could not send reset link. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      chapter="A reset, requested"
      title="It happens to"
      italicWord="everyone."
      lede="Enter the email you signed up with and we'll send you a link to set a new password. The link is good for one hour."
      footerText="Remembered it?"
      footerLinkLabel="Back to sign in →"
      footerLinkTo="/login"
    >
      {sent ? (
        <div className="ed-reveal">
          <div className="ed-mono" style={{
            fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
            color: ED.accent, marginBottom: 8,
          }}>
            Link sent
          </div>
          <h2 className="ed-serif" style={{
            fontSize: 30, margin: 0, marginBottom: 16, color: ED.ink, letterSpacing: "-0.01em",
          }}>
            Check your <span className="ed-italic" style={{ color: ED.accent }}>inbox.</span>
          </h2>
          <p style={{ fontSize: 15.5, lineHeight: 1.6, color: ED.inkMute, marginBottom: 24 }}>
            We sent a one-hour reset link to{" "}
            <span style={{ color: ED.ink, fontWeight: 500 }}>{email}</span>.
            Click the link from the same browser to set a new password.
          </p>
          <div style={{
            padding: 16, background: ED.paper100,
            border: `1px solid ${ED.rule}`, borderRadius: 10,
          }}>
            <div className="ed-mono" style={{
              fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
              color: ED.inkFaint, marginBottom: 8,
            }}>
              Didn't get it?
            </div>
            <p style={{ fontSize: 14, color: ED.inkMute, margin: 0, lineHeight: 1.55 }}>
              Check the spam folder, then{" "}
              <button
                onClick={() => setSent(false)}
                className="ed-ulink"
                style={{
                  background: "transparent", border: 0, padding: 0,
                  color: ED.accent, fontFamily: ED.sans, fontSize: 14, fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                try sending again
              </button>.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="ed-mono" style={{
            fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
            color: ED.accent, marginBottom: 8,
          }}>
            Reset
          </div>
          <h2 className="ed-serif" style={{
            fontSize: 30, margin: 0, marginBottom: 24, color: ED.ink, letterSpacing: "-0.01em",
          }}>
            Forgotten your password?
          </h2>

          <form onSubmit={onSubmit}>
            <AuthField
              label="Email"
              hint="We'll send a one-hour reset link to this address."
            >
              <input
                required type="email" autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <button type="submit" disabled={busy} className="ed-btn ed-btn-primary" style={{
              width: "100%", justifyContent: "center", opacity: busy ? 0.6 : 1,
            }}>
              {busy ? "Sending…" : "Send reset link"}
              <FiArrowRight size={14} />
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
