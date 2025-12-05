// src/pages/Support.jsx
import { motion } from "framer-motion";
import { useState } from "react";
import { 
  FiMail, 
  FiMessageCircle, 
  FiBook, 
  FiAlertTriangle, 
  FiCheckCircle,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiZap,
  FiFileText,
  FiCpu,
  FiUploadCloud,
  FiLayers,
  FiSettings
} from "react-icons/fi";

export default function Support() {
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      icon: <FiMessageCircle className="w-6 h-6 text-indigo-500" />,
      title: "Getting Started",
      desc: "Learn everything you need to begin using NoteStream effectively.",
      link: "#getting-started",
    },
    {
      icon: <FiBook className="w-6 h-6 text-purple-500" />,
      title: "Documentation",
      desc: "Deep-dive guides covering features, workflows, and best practices.",
      link: "#docs",
    },
    {
      icon: <FiMail className="w-6 h-6 text-emerald-500" />,
      title: "Contact Support",
      desc: "Need personal help? Our support team is ready to assist you.",
      link: "#contact",
    },
  ];

  const faqs = [
    {
      question: "How do I upload documents to NoteStream?",
      answer: "You can upload documents by clicking the 'Upload' button in the Documents section, or by dragging and dropping files directly into the app. We support PDFs, images, text files, and more.",
      icon: <FiUploadCloud className="w-5 h-5 text-indigo-500" />,
    },
    {
      question: "What is AI Summary and how does it work?",
      answer: "AI Summary uses advanced language models to analyze your notes and documents, extracting key points, action items, deadlines, and insights. Simply select a document and click 'Generate Summary' to see the magic.",
      icon: <FiCpu className="w-5 h-5 text-purple-500" />,
    },
    {
      question: "How do Smart Notes differ from regular notes?",
      answer: "Smart Notes automatically detect structure in your text — tasks, dates, priorities, and topics. They're organized and searchable by meaning, not just keywords.",
      icon: <FiZap className="w-5 h-5 text-amber-500" />,
    },
    {
      question: "Can I use NoteStream with other apps?",
      answer: "Yes! NoteStream integrates with Google Drive, Slack, Notion, Zapier, GitHub, and more. Check out the Integrations page to connect your favorite tools.",
      icon: <FiLayers className="w-5 h-5 text-blue-500" />,
    },
    {
      question: "How do I customize my dashboard?",
      answer: "Go to Settings to customize your dashboard layout, theme preferences, notification settings, and more. You can also toggle between light and dark mode.",
      icon: <FiSettings className="w-5 h-5 text-emerald-500" />,
    },
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

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section 
      className="min-h-screen text-theme-primary px-6 py-32 relative"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Background glows */}
      <div className="absolute top-[15%] left-[5%] w-[240px] h-[240px] bg-indigo-500/20 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[5%] w-[200px] h-[200px] bg-purple-500/15 blur-[130px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-extrabold mb-6 text-theme-primary">
            We're Here to <span className="text-indigo-500">Help</span>
          </h1>
          <p className="text-theme-muted text-lg max-w-2xl mx-auto">
            Whether you're just getting started or need advanced support, our team is here
            to help you make the most of NoteStream.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-lg mx-auto mb-16"
        >
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-5 py-4 rounded-xl outline-none transition border focus:ring-2 focus:ring-indigo-500/50 text-theme-primary"
              style={{ 
                backgroundColor: 'var(--bg-input)', 
                borderColor: 'var(--border-secondary)' 
              }}
            />
          </div>
        </motion.div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {categories.map((c, idx) => (
            <motion.a
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              href={c.link}
              className="group p-6 rounded-2xl border backdrop-blur-md hover:-translate-y-2 hover:border-indigo-500/40 
              shadow-[0_0_25px_rgba(99,102,241,0.06)] hover:shadow-[0_0_45px_rgba(99,102,241,0.15)] transition-all duration-500"
              style={{ 
                backgroundColor: 'var(--bg-card)', 
                borderColor: 'var(--border-secondary)' 
              }}
            >
              <div 
                className="flex items-center justify-center w-14 h-14 rounded-xl mb-5 group-hover:bg-indigo-500/20 transition"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                {c.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-theme-primary group-hover:text-indigo-500 transition">
                {c.title}
              </h3>
              <p className="text-theme-muted text-sm leading-relaxed">{c.desc}</p>
            </motion.a>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-10 text-theme-primary">
            Frequently Asked <span className="text-indigo-500">Questions</span>
          </h2>

          <div className="space-y-4 max-w-3xl mx-auto">
            {filteredFaqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx }}
                className="rounded-xl border overflow-hidden"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-secondary)' 
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-opacity-80 transition"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    >
                      {faq.icon}
                    </div>
                    <span className="font-medium text-theme-primary">{faq.question}</span>
                  </div>
                  {openFaq === idx ? (
                    <FiChevronUp className="text-theme-muted w-5 h-5 flex-shrink-0" />
                  ) : (
                    <FiChevronDown className="text-theme-muted w-5 h-5 flex-shrink-0" />
                  )}
                </button>
                
                {openFaq === idx && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-5 pb-5"
                  >
                    <div 
                      className="p-4 rounded-lg text-sm text-theme-secondary leading-relaxed"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    >
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}

            {filteredFaqs.length === 0 && searchQuery && (
              <div className="text-center py-10">
                <p className="text-theme-muted">No results found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-8 backdrop-blur-md max-w-2xl mx-auto border"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-secondary)',
            boxShadow: '0 0 25px rgba(99,102,241,0.08)'
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            {status.healthy ? (
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <FiCheckCircle className="text-emerald-500 w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                <FiAlertTriangle className="text-rose-500 w-5 h-5" />
              </div>
            )}
            <span className="text-xl font-semibold text-theme-primary">
              {status.healthy ? "All Systems Operational" : "Service Interruptions Detected"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {status.services.map((service, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-lg text-center"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-medium text-theme-secondary">{service.name}</span>
                </div>
                <span className="text-[10px] text-emerald-500 uppercase font-semibold">
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-theme-muted mb-4">Still have questions?</p>
          <a 
            href="mailto:support@notestream.ai"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 
            text-white font-semibold rounded-full hover:opacity-90 transition shadow-lg shadow-indigo-500/25"
          >
            <FiMail className="w-5 h-5" />
            Contact Support
          </a>
        </motion.div>
      </div>
    </section>
  );
}


























































































