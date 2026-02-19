// src/pages/Signup.jsx
// ═══════════════════════════════════════════════════════════════════
// Matching Login layout: single centered card, mobile-first, wider on desktop.
// Google: ACTIVE · Apple: greyed out with "Coming soon"
// Includes leaked password validation via passwordSafety.js
// ═══════════════════════════════════════════════════════════════════

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiLock, FiMail, FiUser, FiArrowRight, FiInfo, FiEye, FiEyeOff } from "react-icons/fi";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { validatePassword } from "../lib/passwordSafety";

/* ─── Same scoped styles as Login ─── */
const AUTH_STYLES = `
@keyframes ns-auth-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
.ns-auth-card {
  position: relative; overflow: hidden; border-radius: 24px;
  background: var(--card-glass-bg, var(--bg-surface));
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--card-glass-border, var(--border-secondary));
  box-shadow: 0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04) inset;
}
.ns-auth-card::before {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%);
  pointer-events: none; z-index: 1;
}
.ns-auth-card::after {
  content: ''; position: absolute; left: 32px; right: 32px; top: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
  pointer-events: none; z-index: 2;
}
.ns-auth-input {
  border-radius: 16px; border: 1px solid var(--border-secondary);
  background: var(--bg-input, var(--bg-tertiary));
  padding: 14px 16px 14px 48px; font-size: 15px;
  color: var(--text-primary); outline: none; width: 100%;
  transition: all 0.2s ease;
}
.ns-auth-input::placeholder { color: var(--text-muted); }
.ns-auth-input:focus {
  border-color: rgba(99,102,241,0.4);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.08), 0 4px 16px rgba(99,102,241,0.06);
}
.ns-auth-oauth {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; padding: 13px 16px; border-radius: 16px;
  border: 1px solid var(--border-secondary);
  background: var(--bg-input, var(--bg-tertiary));
  font-size: 13px; font-weight: 600; color: var(--text-muted);
  cursor: not-allowed; opacity: 0.45; position: relative;
}
.ns-auth-oauth-active {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; padding: 13px 16px; border-radius: 16px;
  border: 1px solid var(--border-secondary);
  background: var(--bg-input, var(--bg-tertiary));
  font-size: 13px; font-weight: 600; color: var(--text-primary);
  cursor: pointer; transition: all 0.2s ease;
}
.ns-auth-oauth-active:hover {
  border-color: rgba(99,102,241,0.3);
  background: rgba(255,255,255,0.05);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  transform: translateY(-1px);
}
.ns-auth-oauth-active:active { transform: translateY(0); }
.ns-auth-oauth-active:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

/* ─── Icons ─── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" opacity=".45">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);
const LogoIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12M8 11l4 4 4-4"/><path d="M3 17l3.5 3.5h11L21 17"/>
  </svg>
);
const SoonBadge = () => (
  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ml-auto"
    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-muted)" }}>Soon</span>
);

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.2 });
  const onChange = (e) => { setErrorMsg(""); setForm((s) => ({ ...s, [e.target.name]: e.target.value })); };

  /* ── Google OAuth ── */
  const handleGoogleSignUp = async () => {
    if (!isSupabaseConfigured || !supabase || submitting) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (err) {
      setErrorMsg(err?.message || "Google sign-up failed.");
      setSubmitting(false);
    }
  };

  /* ── Email/password signup ── */
  const handleSignup = async (e) => {
    e.preventDefault(); setErrorMsg("");
    if (!isSupabaseConfigured || !supabase) { setErrorMsg("Supabase env vars missing."); return; }
    const fullName = form.fullName.trim(); const email = form.email.trim(); const password = form.password;
    if (!fullName || !email || !password) { setErrorMsg("Please fill out all fields."); return; }
    setSubmitting(true);
    try {
      const pw = await validatePassword(password);
      if (!pw.valid) { setErrorMsg(pw.errors[0]); setSubmitting(false); return; }
    } catch { /* fail open if API unreachable */ }
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/login` } });
      if (error) throw error;
      const userId = data?.user?.id;
      if (userId) {
        const { error: insertError } = await supabase.from("NoteStreams Table").insert([{ user_id: userId }]);
        if (insertError) console.warn("Table insert failed:", insertError.message);
      }
      navigate("/login");
    } catch (err) { setErrorMsg(err?.message || "Signup failed."); }
    finally { setSubmitting(false); }
  };

  return (
    <>
      <style>{AUTH_STYLES}</style>
      <section className="relative w-full min-h-screen overflow-hidden flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>

        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: "radial-gradient(800px 400px at 20% 15%, rgba(99,102,241,0.2), transparent 60%), radial-gradient(800px 400px at 80% 20%, rgba(168,85,247,0.14), transparent 60%), radial-gradient(600px 300px at 50% 100%, rgba(6,182,212,0.08), transparent 55%)" }} />
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "radial-gradient(55% 50% at 50% 45%, black 50%, transparent 100%)", WebkitMaskImage: "radial-gradient(55% 50% at 50% 45%, black 50%, transparent 100%)" }} />
          <div className="absolute top-[12%] right-[12%] w-56 h-56 rounded-full opacity-35" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.14), transparent 70%)", animation: "ns-auth-float 7s ease-in-out infinite" }} />
          <div className="absolute bottom-[18%] left-[8%] w-48 h-48 rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)", animation: "ns-auth-float 6s ease-in-out infinite 0.5s" }} />
        </div>

        <div className="relative z-10 w-full max-w-[540px] mx-auto px-5 py-10 sm:py-16">
          <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>

            {/* Brand */}
            <div className="text-center mb-8">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", boxShadow: "0 8px 32px rgba(139,92,246,0.35)" }}>
                <LogoIcon />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Create your account</h1>
              <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
                Get started with <span style={{ color: "#818cf8" }}>NoteStream</span> for free
              </p>
            </div>

            {/* Card */}
            <div className="ns-auth-card">
              <div className="relative z-10 p-6 sm:p-8">

                {errorMsg && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 rounded-xl p-3"
                    style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
                    <p className="text-[12px] font-medium" style={{ color: "#f43f5e" }}>{errorMsg}</p>
                  </motion.div>
                )}

                {/* OAuth */}
                <div className="space-y-2.5 mb-5">
                  <button onClick={handleGoogleSignUp} disabled={submitting} className="ns-auth-oauth-active">
                    <GoogleIcon /><span>Sign up with Google</span>
                  </button>
                  <div className="ns-auth-oauth"><AppleIcon /><span>Sign up with Apple</span><SoonBadge /></div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px" style={{ background: "var(--border-secondary)" }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>or sign up with email</span>
                  <div className="flex-1 h-px" style={{ background: "var(--border-secondary)" }} />
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>Full Name</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                        <FiUser size={13} style={{ color: "#10b981" }} />
                      </div>
                      <input name="fullName" type="text" placeholder="John Doe" autoComplete="name"
                        value={form.fullName} onChange={onChange} disabled={submitting}
                        className="ns-auth-input disabled:opacity-50" />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>Email</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                        <FiMail size={13} style={{ color: "#818cf8" }} />
                      </div>
                      <input name="email" type="email" placeholder="you@email.com" autoComplete="email"
                        value={form.email} onChange={onChange} disabled={submitting}
                        className="ns-auth-input disabled:opacity-50" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>Password</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
                        <FiLock size={13} style={{ color: "#a855f7" }} />
                      </div>
                      <input name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" autoComplete="new-password"
                        value={form.password} onChange={onChange} disabled={submitting}
                        className="ns-auth-input disabled:opacity-50" style={{ paddingRight: 48 }} />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg flex items-center justify-center transition"
                        style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-muted)" }}>
                        {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.button whileHover={submitting ? {} : { scale: 1.01, boxShadow: "0 12px 40px rgba(99,102,241,0.3)" }}
                    whileTap={submitting ? {} : { scale: 0.98 }} type="submit" disabled={submitting || !isSupabaseConfigured}
                    className="w-full py-3.5 rounded-2xl font-semibold text-[14px] text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 6px 24px rgba(99,102,241,0.25)" }}>
                    {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</> : <>Create Account <FiArrowRight size={15} /></>}
                  </motion.button>
                </form>

                {!isSupabaseConfigured && <p className="text-[11px] mt-3 text-center" style={{ color: "#f43f5e" }}>Missing env vars</p>}
              </div>
            </div>

            {/* Footer */}
            <p className="mt-5 text-center text-[12px]" style={{ color: "var(--text-muted)" }}>
              Already have an account? <button type="button" onClick={() => navigate("/login")} className="font-semibold" style={{ color: "#818cf8" }}>Sign in</button>
            </p>

            <p className="mt-2 text-center text-[10px]" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              By creating an account you agree to our Terms & Privacy Policy.
            </p>

            {/* Tip */}
            <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <FiInfo size={14} style={{ color: "#10b981" }} />
                </div>
                <div>
                  <p className="text-[12px] font-bold" style={{ color: "var(--text-secondary)" }}>Quick tip</p>
                  <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Use a password manager to create a strong password and keep your account secure.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}


