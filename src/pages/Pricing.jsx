// src/pages/Pricing.jsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheck } from "react-icons/fi";
import { Crown, Sparkle, Receipt, Users } from "phosphor-react";

export default function Pricing() {
  const navigate = useNavigate();

  const goAuth = (plan) => {
    // If you later want to pass the plan, you can do:
    // navigate(`/signup?plan=${plan.toLowerCase()}`);
    navigate("/signup");
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/forever",
      desc: "Core features to start organizing immediately.",
      features: [
        "5 AI summaries per day",
        "Basic note organization",
        "Document uploads",
        "Insight Explorer (limited)",
        "Research Synthesizer (2 docs)",
      ],
      badge: "Current Plan",
      badgeTone: "current",
      cta: "Current Plan",
      ctaVariant: "secondary",
      disabled: true,
      icon: Sparkle,
    },
    {
      name: "Pro",
      price: "$9",
      period: "/month",
      desc: "Unlock unlimited AI and power features.",
      features: [
        "Unlimited AI summaries",
        "Voice notes & transcription",
        "Cloud sync across devices",
        "Priority AI processing",
        "Advanced export options",
        "Custom AI training",
        "Email support",
      ],
      badge: "Most Popular",
      badgeTone: "popular",
      cta: "Get Started",
      ctaVariant: "primary",
      disabled: false,
      icon: Crown,
    },
    {
      name: "Team",
      price: "$25",
      period: "/month",
      desc: "Collaboration and control for teams.",
      features: [
        "Everything in Pro",
        "Up to 10 team members",
        "Shared workspaces",
        "Team analytics",
        "Priority support",
        "Custom integrations",
      ],
      badge: null,
      cta: "Get Started",
      ctaVariant: "secondary",
      disabled: false,
      icon: Users,
    },
  ];

  const cardStyle = (highlight) => ({
    backgroundColor: "var(--bg-surface)",
    borderColor: highlight ? "rgba(99, 102, 241, 0.35)" : "var(--border-secondary)",
    boxShadow: highlight ? "0 25px 70px rgba(99, 102, 241, 0.12)" : "none",
  });

  const badgeStyle = (tone) => {
    if (tone === "popular") {
      return {
        backgroundColor: "rgba(99, 102, 241, 0.14)",
        borderColor: "rgba(99, 102, 241, 0.28)",
        color: "var(--accent-indigo)",
      };
    }
    if (tone === "current") {
      return {
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        borderColor: "rgba(16, 185, 129, 0.25)",
        color: "var(--accent-emerald)",
      };
    }
    return {
      backgroundColor: "rgba(255, 255, 255, 0.06)",
      borderColor: "rgba(255, 255, 255, 0.14)",
      color: "var(--text-secondary)",
    };
  };

  const primaryBtn = {
    background: "linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))",
    boxShadow: "0 8px 26px rgba(99, 102, 241, 0.25)",
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
        className="absolute top-[12%] left-[10%] w-[300px] h-[300px] rounded-full pointer-events-none"
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

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="mb-8 flex items-center gap-3">
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
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border"
            style={{
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              borderColor: "rgba(99, 102, 241, 0.25)",
            }}
          >
            <Receipt size={16} weight="duotone" style={{ color: "var(--accent-indigo)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--accent-indigo)" }}>
              Choose Your Plan
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
            Upgrade to unlock{" "}
            <span style={{ color: "var(--accent-indigo)" }}>all features</span>
          </h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: "var(--text-muted)" }}>
            Create an account to get started, then upgrade anytime from your dashboard.
          </p>
        </motion.div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p, idx) => {
            const isPro = p.name === "Pro";
            const Icon = p.icon;

            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + idx * 0.08 }}
                className="rounded-2xl border p-6 md:p-7 transition-all duration-300 hover:-translate-y-1"
                style={cardStyle(isPro)}
                onMouseEnter={(e) => {
                  if (!isPro) {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.22)";
                    e.currentTarget.style.boxShadow = "0 20px 55px rgba(0,0,0,0.22)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPro) {
                    e.currentTarget.style.borderColor = "var(--border-secondary)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {/* Badge row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon
                        size={18}
                        weight="duotone"
                        style={{ color: isPro ? "var(--accent-indigo)" : "var(--text-muted)" }}
                      />
                      <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                        {p.name}
                      </h3>
                    </div>

                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                      {p.desc}
                    </p>
                  </div>

                  {p.badge && (
                    <span
                      className="text-[11px] font-semibold px-3 py-1 rounded-full border whitespace-nowrap"
                      style={badgeStyle(p.badgeTone)}
                    >
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {p.price}
                  </span>
                  <span className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
                    {p.period}
                  </span>
                </div>

                {/* Features */}
                <div className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-start gap-3">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center border"
                        style={{
                          backgroundColor: isPro ? "rgba(99, 102, 241, 0.12)" : "var(--bg-tertiary)",
                          borderColor: isPro ? "rgba(99, 102, 241, 0.22)" : "var(--border-secondary)",
                        }}
                      >
                        <FiCheck
                          className="w-4 h-4"
                          style={{ color: isPro ? "var(--accent-indigo)" : "var(--text-muted)" }}
                        />
                      </div>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {f}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  type="button"
                  onClick={() => (!p.disabled ? goAuth(p.name) : navigate("/signup"))}
                  className="mt-7 w-full py-3 rounded-xl text-sm font-semibold transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={p.ctaVariant === "primary" ? primaryBtn : secondaryBtn}
                  disabled={false}
                >
                  {p.cta}
                </button>

                {/* Login helper */}
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-xs font-medium transition hover:opacity-90"
                    style={{ color: "var(--accent-indigo)" }}
                  >
                    Already have an account? Log in
                  </button>
                </div>

                {/* Fine print */}
                <p className="mt-3 text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  Secure payment powered by Stripe. Cancel anytime.
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-10 rounded-2xl border p-6 text-center"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-secondary)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Need help choosing? Visit{" "}
            <a href="/support" style={{ color: "var(--accent-indigo)" }} className="font-semibold">
              Support
            </a>{" "}
            or{" "}
            <a
              href="mailto:support@notestream.ai"
              style={{ color: "var(--accent-indigo)" }}
              className="font-semibold"
            >
              contact us
            </a>
            .
          </p>
        </motion.div>
      </div>
    </section>
  );
}


