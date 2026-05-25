// src/pages/UpdatePassword.jsx
// ───────────────────────────────────────────────────────────────
// Editorial "set a new password" page (after clicking the reset link).
// Wired to Supabase.
// ───────────────────────────────────────────────────────────────

import { useState } from "react";
import AuthShell, { authInputStyle, AuthField } from "../components/AuthShell";
import { ED } from "../lib/editorial";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import { supabase, supabaseReady } from "../lib/supabaseClient";

export default function UpdatePassword() {
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const mismatch = form.confirm.length > 0 && form.password !== form.confirm;
  const ok = form.password.length >= 12 && form.password === form.confirm;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!ok) return;
    setErr("");

    if (!supabaseReady) {
      setErr("Password update is not configured.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: form.password,
      });
      if (error) throw error;
      setDone(true);
    } catch (error) {
      setErr(error?.message || "Could not update password. The reset link may have expired.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      chapter="Setting a new password"
      title="A fresh"
      italicWord="key."
      lede="Choose something at least twelve characters long. NoteStream never sees the plain version — only the hash."
      footerText="Changed your mind?"
      footerLinkLabel="Back to sign in →"
      footerLinkTo="/login"
    >
      {done ? (
        <div className="ed-reveal" style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: ED.accentSoft, color: ED.accent,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 18px",
          }}>
            <FiCheck size={22} />
          </div>
          <h2 className="ed-display" style={{
            fontSize: 36, margin: 0, marginBottom: 10, color: ED.ink,
          }}>
            Done. <span className="ed-italic" style={{ color: ED.accent }}>Welcome back.</span>
          </h2>
          <p style={{ fontSize: 15, color: ED.inkMute, marginBottom: 20 }}>
            Your password has been updated. You'll be redirected to the archive in a moment.
          </p>
          <a href="/dashboard" className="ed-btn ed-btn-primary" style={{ justifyContent: "center" }}>
            Open the archive <FiArrowRight size={14} />
          </a>
        </div>
      ) : (
        <>
          <div className="ed-mono" style={{
            fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
            color: ED.accent, marginBottom: 8,
          }}>
            New password
          </div>
          <h2 className="ed-serif" style={{
            fontSize: 30, margin: 0, marginBottom: 24, color: ED.ink, letterSpacing: "-0.01em",
          }}>
            Choose something <span className="ed-italic" style={{ color: ED.accent }}>memorable.</span>
          </h2>

          <form onSubmit={onSubmit}>
            <AuthField
              label="New password"
              hint="At least 12 characters. A passphrase is easier to remember than a random string."
            >
              <input
                required type="password" autoComplete="new-password" minLength={12}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={authInputStyle}
              />
            </AuthField>

            <AuthField
              label="Confirm new password"
              hint={mismatch ? "These two don't match." : undefined}
            >
              <input
                required type="password" autoComplete="new-password" minLength={12}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                style={{
                  ...authInputStyle,
                  borderColor: mismatch ? "#c2410c" : ED.rule,
                }}
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

            <button
              type="submit"
              disabled={busy || !ok}
              className="ed-btn ed-btn-primary"
              style={{
                width: "100%", justifyContent: "center",
                opacity: busy || !ok ? 0.6 : 1,
                cursor: busy || !ok ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "Saving…" : "Set new password"}
              <FiArrowRight size={14} />
            </button>

            <p className="ed-mono" style={{
              fontSize: 10.5, letterSpacing: "0.1em", color: ED.inkFaint,
              textTransform: "uppercase", marginTop: 14, textAlign: "center",
            }}>
              Stored as a hash · We never see the plain version
            </p>
          </form>
        </>
      )}
    </AuthShell>
  );
}
