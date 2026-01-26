// src/pages/Signup.jsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiLock,
  FiMail,
  FiUser,
  FiBarChart2,
  FiZap,
  FiShield,
  FiArrowRight,
  FiInfo,
} from "react-icons/fi";

const signupToneStyles = {
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
  const t = signupToneStyles[tone] || signupToneStyles.indigo;
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

const Field = ({ label, icon, type = "text", placeholder, autoComplete }) => {
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
          type={type}
          placeholder={placeholder}
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

export default function SignupPage() {
  const navigate = useNavigate();

  const fadeVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const leftInView = useInView(leftRef, { amount: 0.25 });
  const rightInView = useInView(rightRef, { amount: 0.25 });

  const handleSignup = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  const features = [
    {
      tone: "indigo",
      icon: <FiShield />,
      label: "Secure",
      sub: "Protected workspace",
    },
    {
      tone: "purple",
      icon: <FiBarChart2 />,
      label: "Analytics",
      sub: "Trends & insights",
    },
    {
      tone: "emerald",
      icon: <FiZap />,
      label: "Fast",
      sub: "Upload → summary",
    },
  ];

  return (
    <section
      id="signup-page"
      className="relative w-full min-h-screen overflow-hidden"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Background wash (match Login) */}
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
          {/* LEFT: SIGNUP FORM */}
          <motion.div
            ref={leftRef}
            variants={fadeVariants}
            initial="hidden"
            animate={leftInView ? "visible" : "hidden"}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative overflow-hidden rounded-3xl border p-8 sm:p-10 h-full flex flex-col lg:min-h-[640px]"
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

            <div className="relative h-full flex flex-col">
              {/* TOP */}
              <div>
                <div className="flex items-center gap-3 min-w-0 mb-6">
                  <IconTile tone="indigo" size="md">
                    <FiUser />
                  </IconTile>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-theme-muted font-semibold">
                      Create account
                    </p>
                    <p className="text-sm text-theme-secondary">
                      Start your NoteStream workspace
                    </p>
                  </div>
                </div>

                <h2 className="text-[2rem] md:text-[2.4rem] font-extrabold leading-tight text-theme-primary">
                  Create your{" "}
                  <span className="text-indigo-400">NoteStream</span> account
                </h2>

                <p className="text-theme-muted leading-relaxed mt-3 max-w-md text-[0.98rem]">
                  Access analytics, secure uploads, and AI insights that help you
                  understand your notes instantly.
                </p>

                <form onSubmit={handleSignup} className="space-y-5 mt-8">
                  <Field
                    label="Full Name"
                    icon={<FiUser />}
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
                  />
                  <Field
                    label="Email"
                    icon={<FiMail />}
                    type="email"
                    placeholder="you@email.com"
                    autoComplete="email"
                  />
                  <Field
                    label="Password"
                    icon={<FiLock />}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />

                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 12px 40px rgba(99,102,241,0.28)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-4 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      boxShadow: "0 6px 24px rgba(99,102,241,0.22)",
                    }}
                  >
                    <span>Create Account</span>
                    <FiArrowRight />
                  </motion.button>
                </form>
              </div>

              {/* BOTTOM (fills desktop) */}
              <div className="pt-6 mt-auto">
                <p className="text-theme-muted text-sm text-center">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-indigo-400 hover:text-indigo-300 hover:underline"
                  >
                    Log in
                  </button>
                </p>

                <p className="hidden lg:block text-[11px] text-theme-muted text-center mt-3">
                  By creating an account you agree to our Terms & Privacy Policy.
                </p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: WHY SIGN UP */}
          <motion.div
            ref={rightRef}
            variants={fadeVariants}
            initial="hidden"
            animate={rightInView ? "visible" : "hidden"}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.05 }}
            className="relative overflow-hidden rounded-3xl border p-8 sm:p-10 h-full flex flex-col lg:min-h-[640px]"
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

            <div className="relative h-full flex flex-col">
              {/* TOP */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3 min-w-0">
                    <IconTile tone="purple" size="md">
                      <FiZap />
                    </IconTile>
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-theme-primary">
                        Why sign up
                      </h2>
                      <p className="text-[11px] text-theme-muted">
                        Clarity, security, and speed
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
                    Built for focus
                  </span>
                </div>

                <p className="text-theme-muted leading-relaxed max-w-md text-[0.98rem]">
                  NoteStream helps you organize your notes, track your insights,
                  and use AI-powered clarity tools in a unified workspace.
                </p>

                {/* Desktop-only filler (prevents empty card on large screens) */}
                <div
                  className="hidden lg:block mt-6 rounded-2xl border p-4"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    borderColor: "var(--border-secondary)",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.03) inset",
                  }}
                >
                  <p className="text-sm font-semibold text-theme-secondary mb-3">
                    What you get on day one
                  </p>

                  <ul className="space-y-2 text-[12px] text-theme-muted">
                    <li className="flex items-start gap-2">
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-indigo-400/80 shrink-0" />
                      Clean workspace layout to stay organized.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-indigo-400/80 shrink-0" />
                      Secure defaults and privacy-first design.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-indigo-400/80 shrink-0" />
                      AI tools that summarize and extract insights.
                    </li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-8">
                  {features.map((f, i) => {
                    const t = signupToneStyles[f.tone] || signupToneStyles.indigo;
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

              {/* BOTTOM */}
              <div
                className="mt-6 rounded-2xl border p-3.5 sm:p-4 mt-auto"
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
                      Use a password manager to create a strong password and keep
                      your account secure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

