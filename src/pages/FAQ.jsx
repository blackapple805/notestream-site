// src/pages/FAQ.jsx
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiChevronDown,
  FiSearch,
  FiExternalLink,
  FiCheckCircle,
  FiArrowLeft,
  FiHelpCircle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function FAQ() {
  const navigate = useNavigate();

  const faqs = [
    {
      q: "Is my data private?",
      a: "Yes. NoteStream uses end-to-end encryption and never uses your data for model training.",
    },
    {
      q: "Can I upload any type of file?",
      a: "You can upload images, PDFs, screenshots, and documents. More formats are coming soon.",
    },
    {
      q: "Does NoteStream work on mobile?",
      a: "Yes — NoteStream is fully optimized for iOS and Android devices.",
    },
    {
      q: "How accurate are the AI summaries?",
      a: "Our engine is fine-tuned for structured note clarity and consistently delivers highly accurate insights.",
    },
    {
      q: "How do I reset my password?",
      a: "Go to Reset Password, enter your email, and we’ll send a secure reset link.",
      link: "/reset-password",
      linkLabel: "Reset Password",
    },
    {
      q: "Where can I see plan details?",
      a: "You can review plans, pricing, and features on our Pricing page.",
      link: "/pricing",
      linkLabel: "Pricing",
    },
  ];

  const [open, setOpen] = useState(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter(
      (f) =>
        f.q.toLowerCase().includes(q) || (f.a && f.a.toLowerCase().includes(q))
    );
  }, [faqs, query]);

  return (
    <section
      className="min-h-screen px-6 py-24 md:py-28 relative"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* Background glows */}
      <div
        className="absolute top-[12%] left-[10%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.14), transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute bottom-[12%] right-[10%] w-[260px] h-[260px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.12), transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto">
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
            type="button"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>

          <a
            href="mailto:support@notestream.ai"
            className="text-xs font-semibold transition hover:opacity-90"
            style={{ color: "var(--accent-indigo)" }}
          >
            Still stuck? Contact support{" "}
            <FiExternalLink className="inline ml-1" size={12} />
          </a>
        </div>

        {/* Header (uses global page header vars/classes) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex justify-center">
            <div className="page-header">
              <div className="page-header-content">
                <div className="page-header-icon" aria-hidden="true">
                  <FiHelpCircle />
                </div>

                <div className="text-left">
                  <div className="page-header-title">
                    Frequently Asked{" "}
                    <span style={{ color: "var(--accent-indigo)" }}>
                      Questions
                    </span>
                  </div>
                  <div className="page-header-subtitle">
                    Quick answers to the most common questions about NoteStream.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border p-5 md:p-6 mb-6"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-secondary)",
            boxShadow: "0 22px 60px rgba(0,0,0,0.22)",
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Search the FAQ
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Type a keyword (e.g., “privacy”, “mobile”, “upload”).
              </p>
            </div>

            <div
              className="relative w-full md:w-[380px] rounded-xl border transition-all"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderColor: query
                  ? "rgba(99, 102, 241, 0.35)"
                  : "var(--border-secondary)",
                boxShadow: query ? "0 0 0 4px rgba(99, 102, 241, 0.10)" : "none",
              }}
            >
              <FiSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(null);
                }}
                placeholder="Search questions…"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-transparent outline-none text-sm"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
          </div>

          {query.trim() && (
            <div className="mt-4">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Showing{" "}
                <span style={{ color: "var(--text-primary)" }}>
                  {filtered.length}
                </span>{" "}
                result(s)
              </p>
            </div>
          )}
        </motion.div>

        {/* FAQ list */}
        <div className="space-y-4">
          {filtered.map((item, index) => {
            const isOpen = open === index;

            return (
              <motion.div
                key={`${item.q}-${index}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 + index * 0.03 }}
                className="rounded-2xl border overflow-hidden"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-secondary)",
                  boxShadow: isOpen ? "0 18px 48px rgba(0,0,0,0.22)" : "none",
                }}
              >
                <button
                  className="w-full text-left p-5 md:p-6 flex items-center justify-between gap-4"
                  onClick={() => setOpen(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  type="button"
                >
                  <div className="min-w-0">
                    <p
                      className="text-base md:text-[1.05rem] font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.q}
                    </p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                      {isOpen ? "Tap to collapse" : "Tap to view answer"}
                    </p>
                  </div>

                  <div
                    className="w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition"
                    style={{
                      backgroundColor: isOpen
                        ? "rgba(99, 102, 241, 0.12)"
                        : "var(--bg-tertiary)",
                      borderColor: isOpen
                        ? "rgba(99, 102, 241, 0.28)"
                        : "var(--border-secondary)",
                    }}
                  >
                    <FiChevronDown
                      className={`w-5 h-5 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      style={{
                        color: isOpen ? "var(--accent-indigo)" : "var(--text-muted)",
                      }}
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-5 md:px-6 pb-5 md:pb-6"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <div
                          className="rounded-2xl border p-4 md:p-5"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.03)",
                            borderColor: "var(--border-secondary)",
                          }}
                        >
                          <p className="text-sm leading-relaxed">{item.a}</p>

                          {item.link ? (
                            <button
                              type="button"
                              onClick={() => navigate(item.link)}
                              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition hover:opacity-90 active:scale-[0.98]"
                              style={{
                                backgroundColor: "var(--bg-tertiary)",
                                borderColor: "var(--border-secondary)",
                                color: "var(--text-primary)",
                              }}
                            >
                              {item.linkLabel ?? "Learn more"}{" "}
                              <FiExternalLink size={14} />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {!filtered.length && (
            <div
              className="rounded-2xl border p-6 text-center"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-secondary)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                No results found
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Try a different keyword, or contact support.
              </p>
            </div>
          )}
        </div>

        {/* Bottom helper */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10 rounded-2xl border p-6 md:p-7"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-secondary)",
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Didn’t find what you need?
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Visit Support to send a message and we’ll help you out.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/support")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition hover:opacity-90 active:scale-[0.98]"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderColor: "var(--border-secondary)",
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
              }}
            >
              <FiCheckCircle size={16} />
              Go to Support
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
