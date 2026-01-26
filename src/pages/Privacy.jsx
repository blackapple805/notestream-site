// src/pages/Privacy.jsx
import { motion } from "framer-motion";
import { FiArrowLeft, FiExternalLink } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, FileText, Lock, Users, Clock } from "phosphor-react";

export default function Privacy() {
  const navigate = useNavigate();

  // ---- Dates (top-of-page meta) ----
  const effectiveDate = "January 25, 2026";
  const lastUpdated = "January 25, 2026";

  /**
   * ORGANIZATION GOAL:
   * 1) Plain-English summary first (most users)
   * 2) The 4 “topic” cards (collect/use/share/retain)
   * 3) Deeper “legal-ish” details (still mock)
   * 4) Recommended additions + contact CTA
   */

  // ---- Plain-English summary blocks (fast scan) ----
  const highlights = [
    {
      title: "What we collect",
      items: [
        "Account info (email, profile)",
        "Usage & diagnostics (feature events, device/browser signals)",
        "Content you upload (notes, documents) and generated outputs",
      ],
    },
    {
      title: "Why we collect it",
      items: [
        "Provide and improve features (including AI features)",
        "Security, fraud prevention, and abuse detection",
        "Billing, subscriptions, and customer support",
      ],
    },
    {
      title: "Your choices",
      items: [
        "Access, export, or delete your account data (where applicable)",
        "Update preferences (marketing, analytics) if enabled",
        "Request help via support@notestream.ai",
      ],
    },
  ];

  // ---- Quick facts (small grid, high signal) ----
  const quickFacts = [
    { label: "Data controller", value: "NoteStream (placeholder legal entity)" },
    { label: "Contact", value: "support@notestream.ai" },
    { label: "Applies to", value: "Website, app, and related services" },
    { label: "Regions", value: "Global (add region-specific terms if needed)" },
  ];

  // ---- 4 topic cards (your existing sections) ----
  const sections = [
    {
      icon: FileText,
      title: "Information we collect",
      desc: "Account details, usage signals, and content you choose to upload.",
      bullets: [
        "Account info (email, profile)",
        "Usage data (feature interactions)",
        "Uploaded content (notes, docs)",
      ],
    },
    {
      icon: Lock,
      title: "How we use data",
      desc: "To provide features, keep your account secure, and improve performance.",
      bullets: ["Deliver AI features", "Prevent abuse & fraud", "Improve reliability & UX"],
    },
    {
      icon: Users,
      title: "Sharing & third parties",
      desc: "Only when needed to operate the service (e.g., payments, analytics).",
      bullets: ["Payment processing", "Infrastructure & storage", "Analytics (optional)"],
    },
    {
      icon: Clock,
      title: "Retention & deletion",
      desc: "We keep data only as long as necessary, with deletion options.",
      bullets: ["Account deletion on request", "Retention policies by type", "Backups with limited window"],
    },
  ];

  // ---- Deeper details (accordion-like feel, still simple) ----
  const legalSections = [
    {
      title: "Legal bases (where applicable)",
      body:
        "We process data based on contract necessity (to provide the service), legitimate interests (security and improvement), consent (optional analytics/marketing), and legal obligations (billing and compliance).",
    },
    {
      title: "Data retention",
      body:
        "We retain personal data only as long as needed for the purposes described. Content and account data may be retained while your account is active. Backup copies may persist for a limited period after deletion.",
    },
    {
      title: "International transfers",
      body:
        "If you access NoteStream from outside the country where our servers are located, your data may be transferred and processed internationally. We use safeguards consistent with applicable law.",
    },
    {
      title: "Third parties",
      body:
        "We may use service providers for hosting, storage, payments, and analytics. Providers only receive the data necessary to perform their services and are required to protect it.",
    },
    {
      title: "Security",
      body:
        "We use administrative, technical, and physical safeguards designed to protect your data. No method of transmission or storage is 100% secure, but we work to continuously improve our protections.",
    },
  ];

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

          <a
            href="mailto:support@notestream.ai"
            className="text-xs font-semibold transition hover:opacity-90"
            style={{ color: "var(--accent-indigo)" }}
          >
            Questions? Contact support <FiExternalLink className="inline ml-1" size={12} />
          </a>
        </div>

        {/* Header (global page-header vars/classes) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex justify-center">
            <div className="page-header">
              <div className="page-header-content">
                <div className="page-header-icon" aria-hidden="true">
                  <ShieldCheck weight="duotone" />
                </div>

                <div className="text-left">
                  <div className="page-header-title">
                    Privacy <span style={{ color: "var(--accent-indigo)" }}>Policy</span>
                  </div>
                  <div className="page-header-subtitle">
                    Plain-English summary first, then details. Replace this mock copy with your official policy.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 1) Plain-English summary (first-time visitors) */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border p-6 md:p-7 mb-8"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-secondary)",
            boxShadow: "0 22px 60px rgba(0,0,0,0.28)",
          }}
        >
          {/* Meta row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Effective date
              </p>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {effectiveDate}
              </p>
            </div>

            <div className="md:text-right">
              <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Last updated
              </p>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {lastUpdated}
              </p>
            </div>
          </div>

          <div className="divider my-5" />

          {/* Quick facts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickFacts.map((f) => (
              <div
                key={f.label}
                className="rounded-xl border p-4"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  {f.label}
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  {f.value}
                </p>
              </div>
            ))}
          </div>

          {/* Highlights (3-up) */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {highlights.map((h) => (
              <div
                key={h.title}
                className="rounded-2xl border p-5"
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {h.title}
                </p>

                <div className="mt-3 space-y-2">
                  {h.items.map((it) => (
                    <div key={it} className="flex items-start gap-3">
                      <div className="section-bullet-icon" aria-hidden="true">
                        <span className="section-bullet-dot">•</span>
                      </div>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {it}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 2) The 4 topic cards (scan + confidence) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((s, idx) => {
            const Icon = s.icon;

            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + idx * 0.06 }}
                className="rounded-2xl border p-6 md:p-7"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-secondary)",
                  boxShadow: "0 18px 48px rgba(0,0,0,0.20)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="section-icon" aria-hidden="true">
                    <Icon weight="duotone" />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                      {s.title}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                      {s.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {s.bullets.map((b) => (
                    <div key={b} className="flex items-start gap-3">
                      <div className="section-bullet-icon" aria-hidden="true">
                        <span className="section-bullet-dot">•</span>
                      </div>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {b}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 3) Deeper details (still mock, but structured) */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mt-8 rounded-2xl border p-6 md:p-7"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-secondary)",
            boxShadow: "0 22px 60px rgba(0,0,0,0.22)",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            More details (mock policy text)
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Keep this section for the “legal” version. Most users only read the summary above.
          </p>

          <div className="divider my-5" />

          <div className="space-y-4">
            {legalSections.map((s) => (
              <div key={s.title} className="rounded-xl border p-4"
                style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {s.title}
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 4) Recommended additions + contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-10 rounded-2xl border p-6 md:p-7"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Recommended additions
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Add region-specific sections (GDPR/CCPA), a cookie policy, and an AI processing statement once you finalize your approach.
              </p>
            </div>

            <a
              href="mailto:support@notestream.ai"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition hover:opacity-90"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderColor: "var(--border-secondary)",
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
              }}
            >
              Contact privacy team <FiExternalLink size={14} />
            </a>
          </div>

          <div className="divider my-5" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
            >
              <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Cookies
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Explain what cookies you use and how users can manage them.
              </p>
            </div>

            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
            >
              <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                AI & content
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Clarify how uploaded content is processed, stored, and whether it’s used for training.
              </p>
            </div>

            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
            >
              <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                User rights
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Include access, portability, deletion, objection, and complaint rights (where applicable).
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}



