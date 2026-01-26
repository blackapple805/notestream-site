// src/pages/Support.jsx
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiExternalLink,
  FiSend,
  FiMail,
  FiCheck,
} from "react-icons/fi";
import {
  Lifebuoy,
  BookOpen,
  ChatCircleDots,
  Envelope,
  RocketLaunch,
  Lightning,
  ShieldCheck,
  DiscordLogo,
} from "phosphor-react";

function XIcon({ size = 20, className = "", style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path
        fill="currentColor"
        d="M18.9 2H21l-6.6 7.6L22 22h-6.2l-4.9-6.4L5.3 22H3.2l7.1-8.2L2 2h6.3l4.4 5.8L18.9 2Zm-1.1 18h1.2L7.1 3.9H5.8L17.8 20Z"
      />
    </svg>
  );
}

export default function Support() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidEmail = useMemo(() => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const categories = [
    {
      icon: RocketLaunch,
      title: "Getting Started",
      desc: "New to NoteStream? Learn the basics and get up and running in minutes.",
      link: "/how-it-works",
      color: "indigo",
    },
    {
      icon: BookOpen,
      title: "Documentation",
      desc: "Deep-dive guides covering features, workflows, and best practices.",
      link: "/docs",
      color: "purple",
    },
    {
      icon: ChatCircleDots,
      title: "FAQ",
      desc: "Find quick answers to the most commonly asked questions.",
      link: "/faq",
      color: "emerald",
    },
  ];

  const quickLinks = [
    { label: "Reset Password", link: "/reset-password" },
    { label: "Billing & Plans", link: "/pricing" },
    { label: "Privacy Policy", link: "/privacy" },
    { label: "Terms of Service", link: "/terms" },
  ];

  const status = {
    healthy: true,
    services: [
      { name: "API", status: "operational" },
      { name: "Dashboard", status: "operational" },
      { name: "AI Processing", status: "operational" },
      { name: "Sync", status: "operational" },
    ],
  };

  const colorConfig = {
    indigo: {
      bg: "rgba(99, 102, 241, 0.1)",
      border: "rgba(99, 102, 241, 0.25)",
      text: "var(--accent-indigo)",
    },
    purple: {
      bg: "rgba(168, 85, 247, 0.1)",
      border: "rgba(168, 85, 247, 0.25)",
      text: "var(--accent-purple)",
    },
    emerald: {
      bg: "rgba(16, 185, 129, 0.1)",
      border: "rgba(16, 185, 129, 0.25)",
      text: "var(--accent-emerald)",
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail || !message.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // TODO: replace with your real API call
    // await fetch("/api/support", { method: "POST", body: JSON.stringify({ email, message }) })
    await new Promise((r) => setTimeout(r, 750));

    setIsSubmitting(false);
    setSubmitted(true);

    // Clear form
    setEmail("");
    setMessage("");

    // Auto-hide success
    window.setTimeout(() => setSubmitted(false), 2200);
  };

  return (
    <section
      className="min-h-screen px-6 py-24 md:py-32 relative"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Background glows */}
      <div
        className="absolute top-[10%] left-[10%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute bottom-[15%] right-[10%] w-[250px] h-[250px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.12), transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border"
            style={{
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              borderColor: "rgba(99, 102, 241, 0.25)",
            }}
          >
            <Lifebuoy
              size={16}
              weight="duotone"
              style={{ color: "var(--accent-indigo)" }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: "var(--accent-indigo)" }}
            >
              Support Center
            </span>
          </div>

          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            How can we <span style={{ color: "var(--accent-indigo)" }}>help</span>{" "}
            you?
          </h1>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: "var(--text-muted)" }}
          >
            Find answers, browse documentation, or reach out to our support team.
          </p>
        </motion.div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {categories.map((c, idx) => {
            const colors = colorConfig[c.color];
            const IconComponent = c.icon;

            return (
              <motion.a
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.1 }}
                href={c.link}
                className="group p-6 rounded-2xl border text-center transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-secondary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.boxShadow = `0 10px 40px ${colors.bg}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-secondary)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <IconComponent
                    size={26}
                    weight="duotone"
                    style={{ color: colors.text }}
                  />
                </div>

                <h3
                  className="text-lg font-semibold mb-2 transition-colors"
                  style={{ color: "var(--text-primary)" }}
                >
                  {c.title}
                </h3>

                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-muted)" }}
                >
                  {c.desc}
                </p>

                <div
                  className="mt-4 text-xs font-medium flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: colors.text }}
                >
                  Learn more <FiExternalLink size={12} />
                </div>
              </motion.a>
            );
          })}
        </div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-6 mb-16 border"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-secondary)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: status.healthy
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(244, 63, 94, 0.15)",
                  border: `1px solid ${
                    status.healthy
                      ? "rgba(16, 185, 129, 0.3)"
                      : "rgba(244, 63, 94, 0.3)"
                  }`,
                }}
              >
                {status.healthy ? (
                  <ShieldCheck
                    size={20}
                    weight="duotone"
                    style={{ color: "var(--accent-emerald)" }}
                  />
                ) : (
                  <Lightning
                    size={20}
                    weight="fill"
                    style={{ color: "var(--accent-rose)" }}
                  />
                )}
              </div>
              <div>
                <h3
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  System Status
                </h3>
                <p
                  className="text-xs"
                  style={{
                    color: status.healthy
                      ? "var(--accent-emerald)"
                      : "var(--accent-rose)",
                  }}
                >
                  {status.healthy
                    ? "All systems operational"
                    : "Service interruptions"}
                </p>
              </div>
            </div>

            <a
              href="/status"
              className="text-xs font-medium transition"
              style={{ color: "var(--accent-indigo)" }}
            >
              View details →
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {status.services.map((service, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl text-center border"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "var(--accent-emerald)" }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {service.name}
                  </span>
                </div>
                <span
                  className="text-[10px] uppercase font-semibold"
                  style={{ color: "var(--accent-emerald)" }}
                >
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact Form Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16"
        >
          {/* Contact Form */}
          <div
            className="rounded-2xl p-6 border"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-secondary)",
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: "rgba(99, 102, 241, 0.15)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                }}
              >
                <Envelope
                  size={20}
                  weight="duotone"
                  style={{ color: "var(--accent-indigo)" }}
                />
              </div>
              <div>
                <h3
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Send us a message
                </h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  We typically respond within 24 hours
                </p>
              </div>
            </div>

            {/* Success block (footer-like) */}
            {submitted ? (
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
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Sent — we received your message.
                  </p>
                  <p
                    className="text-sm mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    We’ll get back to you soon.
                  </p>
                  <p
                    className="text-xs mt-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Tip: If you don’t hear back, check spam/junk folders.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="text-xs font-medium mb-2 block"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Email
                  </label>

                  <div
                    className="relative rounded-xl border transition-all"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      borderColor: email
                        ? "rgba(99, 102, 241, 0.35)"
                        : "var(--border-secondary)",
                      boxShadow: email
                        ? "0 0 0 4px rgba(99, 102, 241, 0.10)"
                        : "none",
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
                    <p
                      className="mt-2 text-xs font-medium"
                      style={{ color: "var(--accent-rose)" }}
                    >
                      Please enter a valid email.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      We’ll reply to this address.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className="text-xs font-medium mb-2 block"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help you?"
                    className="w-full px-4 py-3 rounded-xl border outline-none transition text-sm resize-none"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      borderColor: "var(--border-secondary)",
                      color: "var(--text-primary)",
                    }}
                  />
                  {!message.trim() ? (
                    <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      Include a quick summary so we can help faster.
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={!isValidEmail || !message.trim() || isSubmitting}
                  className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))",
                    boxShadow: "0 10px 28px rgba(99, 102, 241, 0.22)",
                    color: "white",
                  }}
                >
                  <FiSend size={16} />
                  {isSubmitting ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </div>

          {/* Quick Links + Social */}
          <div className="space-y-6">
            {/* Quick Links */}
            <div
              className="rounded-2xl p-6 border"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-secondary)",
              }}
            >
              <h3
                className="font-semibold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Quick Links
              </h3>
              <div className="space-y-2">
                {quickLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.link}
                    className="flex items-center justify-between p-3 rounded-xl border transition-all"
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      borderColor: "var(--border-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(99, 102, 241, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--border-secondary)";
                    }}
                  >
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {link.label}
                    </span>
                    <FiExternalLink
                      size={14}
                      style={{ color: "var(--text-muted)" }}
                    />
                  </a>
                ))}
              </div>
            </div>

            {/* Community / Social */}
            <div
              className="rounded-2xl p-6 border"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-secondary)",
              }}
            >
              <h3
                className="font-semibold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Join the Community
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://discord.gg/notestream"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: "rgba(88, 101, 242, 0.1)",
                    borderColor: "rgba(88, 101, 242, 0.25)",
                  }}
                >
                  <DiscordLogo
                    size={20}
                    weight="fill"
                    style={{ color: "#5865F2" }}
                  />
                  <span className="text-sm font-medium" style={{ color: "#5865F2" }}>
                    Discord
                  </span>
                </a>

                <a
                  href="https://x.com/notestream"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.4)",
                    borderColor: "rgba(27, 13, 13, 0.34)",
                  }}
                >
                  <XIcon size={20} style={{ color: "var(--text-primary)" }} />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                  </span>
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Removed the bottom mailto CTA*/}
      </div>
    </section>
  );
}



























































































