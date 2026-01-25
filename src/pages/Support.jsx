// src/pages/Support.jsx
import { motion } from "framer-motion";
import { useState } from "react";
import { 
  FiMail, 
  FiCheckCircle,
  FiSearch,
  FiExternalLink,
  FiSend,
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
  TwitterLogo,
} from "phosphor-react";

export default function Support() {
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
    ]
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setEmail("");
      setMessage("");
      setSubmitted(false);
    }, 3000);
  };

  return (
    <section 
      className="min-h-screen px-6 py-24 md:py-32 relative"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Background glows */}
      <div 
        className="absolute top-[10%] left-[10%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%)', filter: 'blur(60px)' }}
      />
      <div 
        className="absolute bottom-[15%] right-[10%] w-[250px] h-[250px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12), transparent 70%)', filter: 'blur(60px)' }}
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
              backgroundColor: 'rgba(99, 102, 241, 0.1)', 
              borderColor: 'rgba(99, 102, 241, 0.25)' 
            }}
          >
            <Lifebuoy size={16} weight="duotone" style={{ color: 'var(--accent-indigo)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--accent-indigo)' }}>
              Support Center
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            How can we <span style={{ color: 'var(--accent-indigo)' }}>help</span> you?
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Find answers, browse documentation, or reach out to our support team.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-xl mx-auto mb-16"
        >
          <div 
            className="relative flex items-center rounded-2xl border transition-all duration-300"
            style={{ 
              backgroundColor: 'var(--bg-surface)', 
              borderColor: searchQuery ? 'var(--accent-indigo)' : 'var(--border-secondary)',
              boxShadow: searchQuery ? '0 0 30px rgba(99, 102, 241, 0.15)' : 'none',
            }}
          >
            <FiSearch 
              className="absolute left-4 w-5 h-5" 
              style={{ color: 'var(--text-muted)' }} 
            />
            <input
              type="text"
              placeholder="Search for help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-5 py-4 rounded-2xl bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </motion.div>

        {/* Categories - Centered Content */}
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
                  backgroundColor: 'var(--bg-surface)', 
                  borderColor: 'var(--border-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.boxShadow = `0 10px 40px ${colors.bg}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-secondary)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Icon - Centered */}
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{ 
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <IconComponent size={26} weight="duotone" style={{ color: colors.text }} />
                </div>

                {/* Title - Centered */}
                <h3 
                  className="text-lg font-semibold mb-2 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {c.title}
                </h3>

                {/* Description - Centered */}
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {c.desc}
                </p>

                {/* Arrow indicator */}
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
            backgroundColor: 'var(--bg-surface)', 
            borderColor: 'var(--border-secondary)',
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  backgroundColor: status.healthy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  border: `1px solid ${status.healthy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                }}
              >
                {status.healthy ? (
                  <ShieldCheck size={20} weight="duotone" style={{ color: 'var(--accent-emerald)' }} />
                ) : (
                  <Lightning size={20} weight="fill" style={{ color: 'var(--accent-rose)' }} />
                )}
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  System Status
                </h3>
                <p className="text-xs" style={{ color: status.healthy ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  {status.healthy ? "All systems operational" : "Service interruptions"}
                </p>
              </div>
            </div>

            <a 
              href="/status" 
              className="text-xs font-medium transition"
              style={{ color: 'var(--accent-indigo)' }}
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
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-secondary)',
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--accent-emerald)' }}
                  />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {service.name}
                  </span>
                </div>
                <span 
                  className="text-[10px] uppercase font-semibold"
                  style={{ color: 'var(--accent-emerald)' }}
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
              backgroundColor: 'var(--bg-surface)', 
              borderColor: 'var(--border-secondary)',
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ 
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                <Envelope size={20} weight="duotone" style={{ color: 'var(--accent-indigo)' }} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Send us a message
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  We typically respond within 24 hours
                </p>
              </div>
            </div>

            {submitted ? (
              <div 
                className="p-6 rounded-xl text-center"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}
              >
                <FiCheckCircle size={32} style={{ color: 'var(--accent-emerald)' }} className="mx-auto mb-3" />
                <p className="font-medium" style={{ color: 'var(--accent-emerald)' }}>Message sent!</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border outline-none transition text-sm"
                    style={{ 
                      backgroundColor: 'var(--bg-tertiary)', 
                      borderColor: 'var(--border-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>
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
                      backgroundColor: 'var(--bg-tertiary)', 
                      borderColor: 'var(--border-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-medium text-white text-sm flex items-center justify-center gap-2 transition hover:opacity-90 active:scale-[0.98]"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)',
                  }}
                >
                  <FiSend size={16} />
                  Send Message
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
                backgroundColor: 'var(--bg-surface)', 
                borderColor: 'var(--border-secondary)',
              }}
            >
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Quick Links
              </h3>
              <div className="space-y-2">
                {quickLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.link}
                    className="flex items-center justify-between p-3 rounded-xl border transition-all"
                    style={{ 
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-secondary)';
                    }}
                  >
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {link.label}
                    </span>
                    <FiExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
                  </a>
                ))}
              </div>
            </div>

            {/* Community / Social */}
            <div 
              className="rounded-2xl p-6 border"
              style={{ 
                backgroundColor: 'var(--bg-surface)', 
                borderColor: 'var(--border-secondary)',
              }}
            >
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Join the Community
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://discord.gg/notestream"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border transition-all hover:scale-[1.02]"
                  style={{ 
                    backgroundColor: 'rgba(88, 101, 242, 0.1)',
                    borderColor: 'rgba(88, 101, 242, 0.25)',
                  }}
                >
                  <DiscordLogo size={20} weight="fill" style={{ color: '#5865F2' }} />
                  <span className="text-sm font-medium" style={{ color: '#5865F2' }}>Discord</span>
                </a>
                <a
                  href="https://twitter.com/notestream"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-xl border transition-all hover:scale-[1.02]"
                  style={{ 
                    backgroundColor: 'rgba(29, 161, 242, 0.1)',
                    borderColor: 'rgba(29, 161, 242, 0.25)',
                  }}
                >
                  <TwitterLogo size={20} weight="fill" style={{ color: '#1DA1F2' }} />
                  <span className="text-sm font-medium" style={{ color: '#1DA1F2' }}>Twitter</span>
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
            Need immediate assistance?
          </p>
          <a 
            href="mailto:support@notestream.ai"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition"
            style={{ 
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-secondary)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-indigo)';
              e.currentTarget.style.color = 'var(--accent-indigo)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-secondary)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <FiMail size={16} />
            support@notestream.ai
          </a>
        </motion.div>
      </div>
    </section>
  );
}


























































































