// src/pages/ResetPassword.jsx
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMail, FiCheck, FiArrowRight } from "react-icons/fi";
import { Envelope } from "phosphor-react";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidEmail = useMemo(() => {
    if (!email) return false;
    // simple client-side check; backend should validate
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail || isSubmitting) return;

    setIsSubmitting(true);

    // TODO: replace with your real API call
    // await fetch("/api/auth/reset", { method: "POST", body: JSON.stringify({ email }) })
    await new Promise((r) => setTimeout(r, 650));

    setIsSubmitting(false);
    setSent(true);
  };

  const primaryBtn = {
    background: "linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))",
    boxShadow: "0 10px 28px rgba(99, 102, 241, 0.22)",
    color: "white",
  };

  const secondaryBtn = {
    backgroundColor: "var(--bg-tertiary)",
    border: "1px solid var(--border-secondary)",
    color: "var(--text-primary)",
  };

  return (
    <section
      className="min-h-screen px-6 py-24 md:py-28 relative"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Background glows */}
      <div
        className="absolute top-[12%] left-[10%] w-[280px] h-[280px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.14), transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute bottom-[12%] right-[10%] w-[260px] h-[260px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.12), transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl transition-all active:scale-[0.98]"
            style={{
              color: "var(--text-primary)",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-secondary)",
            }}
            aria-label="Go back"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate("/login")}
            className="text-xs font-semibold transition hover:opacity-90"
            style={{ color: "var(--accent-indigo)" }}
            type="button"
          >
            Back to login <FiArrowRight className="inline ml-1" size={12} />
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Badge */}
            <div className="flex justify-center mb-7">
             <div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border"
                style={{
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                borderColor: "rgba(99, 102, 241, 0.25)",
                }}
            >
                <Envelope size={16} weight="duotone" style={{ color: "var(--accent-indigo)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--accent-indigo)" }}>
                Account Recovery
                </span>
             </div>
            </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
            Reset <span style={{ color: "var(--accent-indigo)" }}>Password</span>
          </h1>
          <p className="mb-8 text-base md:text-lg" style={{ color: "var(--text-muted)" }}>
            Enter your email and we’ll send a secure reset link.
          </p>

          {/* Main card */}
            <div
            className="rounded-2xl p-7 md:p-10 border"
            style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-secondary)",
                boxShadow: "0 24px 70px rgba(0,0,0,0.30)",
                minHeight: "340px",
            }}
            >
            {sent ? (
              <div className="space-y-4">
                <div
                  className="p-5 rounded-2xl border flex items-start gap-3"
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.10)",
                    borderColor: "rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0"
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.12)",
                      borderColor: "rgba(16, 185, 129, 0.25)",
                    }}
                  >
                    <FiCheck size={18} style={{ color: "var(--accent-emerald)" }} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      Check your inbox
                    </p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                      If an account exists for{" "}
                      <span style={{ color: "var(--text-primary)" }}>{email}</span>, you’ll receive a reset link shortly.
                    </p>
                    <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                      Tip: Check spam/junk folders if you don’t see it within a few minutes.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full py-3 rounded-xl text-sm font-semibold transition hover:opacity-95 active:scale-[0.98]"
                    style={primaryBtn}
                    type="button"
                  >
                    Go to Login
                  </button>

                  <button
                    onClick={() => {
                      setSent(false);
                      setEmail("");
                    }}
                    className="w-full py-3 rounded-xl text-sm font-semibold transition hover:opacity-95 active:scale-[0.98]"
                    style={secondaryBtn}
                    type="button"
                  >
                    Send another link
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-muted)" }}>
                    Email
                  </label>

                  <div
                    className="relative rounded-xl border transition-all"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      borderColor: email ? "rgba(99, 102, 241, 0.35)" : "var(--border-secondary)",
                      boxShadow: email ? "0 0 0 4px rgba(99, 102, 241, 0.10)" : "none",
                    }}
                  >
                    <FiMail
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-transparent outline-none text-sm"
                      style={{ color: "var(--text-primary)" }}
                      autoComplete="email"
                      inputMode="email"
                    />
                  </div>

                  {!email ? null : !isValidEmail ? (
                    <p className="mt-2 text-xs" style={{ color: "var(--accent-rose)" }}>
                      Enter a valid email address.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      We’ll send a link to this address.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!isValidEmail || isSubmitting}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={primaryBtn}
                >
                  {isSubmitting ? "Sending…" : "Send reset link"}
                </button>

                <div
                  className="rounded-2xl border p-4"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "var(--border-secondary)" }}
                >
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    If you don’t see the email, check spam/junk folders. For help, contact{" "}
                    <a
                      href="mailto:support@notestream.ai"
                      className="font-semibold"
                      style={{ color: "var(--accent-indigo)" }}
                    >
                      support@notestream.ai
                    </a>
                    .
                  </p>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}


