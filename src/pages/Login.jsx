// src/pages/Login.jsx
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiLock,
  FiMail,
  FiSmile,
  FiTrendingUp,
  FiArrowRight,
  FiGrid,
  FiInfo,
} from "react-icons/fi";
import { createClient } from "@supabase/supabase-js";

/* ---------------------------
   Supabase client (Vite)
--------------------------- */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const toneStyles = {
  indigo: {
    text: "text-indigo-400",
    bg: "rgba(99,102,241,0.12)",
    border: "rgba(99,102,241,0.22)",
    glow: "rgba(99,102,241,0.18)",
  },
  purple: {
    text: "text-purple-400",
    bg: "rgba(168,85,247,0.12)",
    border: "rgba(168,85,247,0.22)",
    glow: "rgba(168,85,247,0.16)",
  },
  emerald: {
    text: "text-emerald-400",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.22)",
    glow: "rgba(16,185,129,0.14)",
  },
};

const IconTile = ({ children, tone = "indigo", size = "md" }) => {
  const t = toneStyles[tone] || toneStyles.indigo;
  const tileClass =
    size === "sm" ? "ns-auth-field-icon-tile" : "ns-auth-icon-tile";

  return (
    <div
      className={`${tileClass} border flex items-center justify-center ${t.text}`}
      style={{
        backgroundColor: t.bg,
        borderColor: t.border,
        boxShadow: `0 10px 30px ${t.glow}`,
      }}
    >
      {children}
    </div>
  );
};

const Field = ({
  label,
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  name,
  autoComplete,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-semibold tracking-wide uppercase text-theme-muted">
        {label}
      </label>

      <div
        className="group rounded-2xl border px-4 py-3 flex items-center gap-3 transition-all"
        style={{
          backgroundColor: "var(--bg-input)",
          borderColor: "var(--border-secondary)",
        }}
      >
        <div
          className="ns-auth-field-icon-tile border"
          style={{
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.08))",
            borderColor: "rgba(99,102,241,0.22)",
            boxShadow: "0 10px 26px rgba(99,102,241,0.12)",
          }}
        >
          <span className="text-indigo-400">{icon}</span>
        </div>

        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="ns-auth-input w-full bg-transparent text-theme-primary placeholder:text-theme-muted text-[0.95rem] outline-none"
        />

        <div
          className="h-2 w-2 rounded-full opacity-0 group-focus-within:opacity-100 transition"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            boxShadow: "0 0 14px rgba(99,102,241,0.35)",
          }}
        />
      </div>
    </div>
  );
};

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fadeVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const leftInView = useInView(leftRef, { amount: 0.25 });
  const rightInView = useInView(rightRef, { amount: 0.25 });

  const features = [
    {
      tone: "indigo",
      icon: <FiTrendingUp />,
      label: "Smarter insights",
      sub: "Track progress",
    },
    {
      tone: "purple",
      icon: <FiGrid />,
      label: "Clean UI",
      sub: "Neon glass theme",
    },
  ];

  const onChange = (e) => {
    setErrorMsg("");
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!supabase) {
      setErrorMsg(
        "Supabase env vars missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
      return;
    }

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      setErrorMsg("Please enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(err?.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="login-page"
      className="relative w-full min-h-screen overflow-hidden"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Background wash */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 420px at 15% 10%, rgba(99,102,241,0.22), transparent 60%)," +
              "radial-gradient(900px 460px at 90% 20%, rgba(168,85,247,0.16), transparent 60%)," +
              "radial-gradient(800px 420px at 50% 110%, rgba(6,182,212,0.10), transparent 55%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(60% 55% at 50% 45%, black 55%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(60% 55% at 50% 45%, black 55%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-[10vh]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* LEFT */}
          <motion.div
            ref={leftRef}
            variants={fadeVariants}
            initial="hidden"
            animate={leftInView ? "visible" : "hidden"}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative overflow-hidden rounded-3xl border p-8 sm:p-10"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-secondary)",
              boxShadow: "0 25px 70px rgba(0,0,0,0.35)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(700px 260px at 20% -10%, rgba(99,102,241,0.18), transparent 60%)," +
                  "radial-gradient(700px 260px at 95% 10%, rgba(168,85,247,0.14), transparent 55%)",
              }}
            />

            <div className="relative">
              <div className="flex items-center gap-3 min-w-0 mb-6">
                <IconTile tone="indigo" size="md">
                  <FiSmile />
                </IconTile>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-theme-muted font-semibold">
                    Welcome back
                  </p>
                  <p className="text-sm text-theme-secondary">
                    Continue where you left off
                  </p>
                </div>
              </div>

              <h2 className="text-[2rem] md:text-[2.4rem] font-extrabold leading-tight text-theme-primary">
                Log into <span className="text-indigo-400">NoteStream</span>
              </h2>

              <p className="text-theme-muted leading-relaxed mt-3 max-w-md text-[0.98rem]">
                Your workspace is ready. Pick up your notes, insights, and AI tools
                with the same neon dashboard feel.
              </p>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-8">
                {features.map((f, i) => {
                  const t = toneStyles[f.tone] || toneStyles.indigo;

                  return (
                    <div
                      key={i}
                      className="rounded-2xl border p-3.5 sm:p-4 flex"
                      style={{
                        backgroundColor: "var(--bg-tertiary)",
                        borderColor: "var(--border-secondary)",
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 w-full">
                        <div
                          className={`ns-auth-field-icon-tile border ${t.text} flex-shrink-0 self-center`}
                          style={{
                            backgroundColor: t.bg,
                            borderColor: t.border,
                            boxShadow: `0 10px 26px ${t.glow}`,
                          }}
                        >
                          {f.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] sm:text-sm font-semibold text-theme-secondary leading-snug line-clamp-2">
                            {f.label}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-theme-muted leading-snug line-clamp-2">
                            {f.sub}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            ref={rightRef}
            variants={fadeVariants}
            initial="hidden"
            animate={rightInView ? "visible" : "hidden"}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.05 }}
            className="relative overflow-hidden rounded-3xl border p-8 sm:p-10"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-secondary)",
              boxShadow: "0 25px 70px rgba(0,0,0,0.35)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(700px 260px at 10% -10%, rgba(99,102,241,0.16), transparent 60%)," +
                  "radial-gradient(700px 260px at 90% 0%, rgba(6,182,212,0.10), transparent 55%)",
              }}
            />

            <div className="relative">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 min-w-0">
                  <IconTile tone="purple" size="md">
                    <FiLock />
                  </IconTile>
                  <div>
                    <h2 className="text-lg font-semibold text-theme-primary">
                      Sign in
                    </h2>
                    <p className="text-[11px] text-theme-muted">
                      Use your account credentials
                    </p>
                  </div>
                </div>

                <span
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    borderColor: "var(--border-secondary)",
                    color: "var(--text-muted)",
                  }}
                >
                  Secure
                </span>
              </div>

              {/* Error banner */}
              {errorMsg ? (
                <div
                  className="mb-5 rounded-2xl border p-3.5"
                  style={{
                    backgroundColor: "rgba(244,63,94,0.08)",
                    borderColor: "rgba(244,63,94,0.22)",
                    boxShadow: "0 0 0 1px rgba(244,63,94,0.10) inset",
                  }}
                >
                  <p className="text-[12px] text-rose-200/90">{errorMsg}</p>
                </div>
              ) : null}

              <form onSubmit={handleLogin} className="space-y-5">
                <Field
                  name="email"
                  label="Email"
                  icon={<FiMail />}
                  type="email"
                  placeholder="you@email.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={onChange}
                />
                <Field
                  name="password"
                  label="Password"
                  icon={<FiLock />}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={onChange}
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    className="text-theme-muted hover:text-theme-primary transition"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot password?
                  </button>

                  <span className="text-theme-muted">
                    New here?{" "}
                    <a className="text-indigo-400 hover:text-indigo-300" href="/signup">
                      Create account
                    </a>
                  </span>
                </div>

                <motion.button
                  whileHover={{
                    scale: submitting ? 1 : 1.02,
                    boxShadow: submitting ? undefined : "0 12px 40px rgba(99,102,241,0.28)",
                  }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    boxShadow: "0 6px 24px rgba(99,102,241,0.22)",
                  }}
                >
                  <span>{submitting ? "Signing in..." : "Log In"}</span>
                  <FiArrowRight />
                </motion.button>
              </form>

              <div
                className="mt-6 rounded-2xl border p-3.5 sm:p-4"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-secondary)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.03) inset",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="ns-auth-field-icon-tile border text-emerald-400 flex-shrink-0"
                    style={{
                      backgroundColor: "rgba(16,185,129,0.10)",
                      borderColor: "rgba(16,185,129,0.22)",
                      boxShadow: "0 10px 26px rgba(16,185,129,0.10)",
                    }}
                  >
                    <FiInfo />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-theme-secondary">
                      Tip
                    </p>
                    <p className="text-[11px] text-theme-muted leading-relaxed">
                      You can enable smart notifications and weekly digests after
                      signing in from Settings.
                    </p>
                  </div>
                </div>
              </div>

              {!supabaseUrl || !supabaseAnonKey ? (
                <div className="mt-4 text-[11px] text-rose-200/80">
                  Missing env vars: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}


