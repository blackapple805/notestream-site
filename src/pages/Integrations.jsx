// src/pages/Integrations.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ScrollReveal from "../components/ScrollReveal";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiZap,
  FiLink2,
  FiCloud,
  FiDatabase,
  FiTrendingUp,
  FiGlobe,
  FiMail,
  FiGithub,
  FiX,
  FiCheck,
  FiArrowRight,
} from "react-icons/fi";

export default function Integrations() {
  const navigate = useNavigate();
  const [selectedIntegration, setSelectedIntegration] = useState(null);

  const integrations = [
    {
      title: "Google Drive",
      desc: "Sync notes, PDFs, and screenshots directly from your Drive workspace.",
      icon: <FiCloud className="text-blue-500 w-7 h-7" />,
      color: "blue",
      features: ["Auto-sync files", "Folder organization", "Real-time updates"],
      status: "available",
    },
    {
      title: "Slack",
      desc: "Turn message threads into AI summaries and actionable insights.",
      icon: <FiLink2 className="text-purple-500 w-7 h-7" />,
      color: "purple",
      features: ["Channel summaries", "Thread extraction", "Direct messaging"],
      status: "available",
    },
    {
      title: "Notion",
      desc: "Send Smart Notes to any Notion page with perfect formatting.",
      icon: <FiDatabase className="text-slate-500 w-7 h-7" />,
      color: "slate",
      features: ["Page sync", "Database updates", "Block formatting"],
      status: "available",
    },
    {
      title: "Zapier",
      desc: "Automate everything — from new notes to CRM updates and reminders.",
      icon: <FiGlobe className="text-orange-500 w-7 h-7" />,
      color: "orange",
      features: ["5000+ apps", "Custom workflows", "Trigger actions"],
      status: "available",
    },
    {
      title: "GitHub Issues",
      desc: "Automatically extract tasks from meeting notes and push them into issues.",
      icon: <FiGithub className="text-gray-500 w-7 h-7" />,
      color: "gray",
      features: ["Issue creation", "PR summaries", "Repo integration"],
      status: "coming-soon",
    },
    {
      title: "Email Import",
      desc: "Forward emails and get instant summaries and action items.",
      icon: <FiMail className="text-rose-500 w-7 h-7" />,
      color: "rose",
      features: ["Email forwarding", "Attachment parsing", "Auto-categorize"],
      status: "coming-soon",
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: "bg-blue-500/20", text: "text-blue-500", border: "border-blue-500/30" },
      purple: { bg: "bg-purple-500/20", text: "text-purple-500", border: "border-purple-500/30" },
      slate: { bg: "bg-slate-500/20", text: "text-slate-500", border: "border-slate-500/30" },
      orange: { bg: "bg-orange-500/20", text: "text-orange-500", border: "border-orange-500/30" },
      gray: { bg: "bg-gray-500/20", text: "text-gray-500", border: "border-gray-500/30" },
      rose: { bg: "bg-rose-500/20", text: "text-rose-500", border: "border-rose-500/30" },
    };
    return colors[color] || colors.blue;
  };

  const handleIntegrationClick = (integration) => {
    setSelectedIntegration(integration);
  };

  const handleConnect = () => {
    setSelectedIntegration(null);
    navigate("/signup");
  };

  return (
    <section
      className="relative min-h-screen text-theme-primary px-6 py-[18vh] overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Background Glow */}
      <div className="absolute top-[12%] left-[8%] w-[320px] h-[320px] bg-indigo-500/20 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[260px] h-[260px] bg-purple-500/15 blur-[130px] rounded-full pointer-events-none"></div>

      {/* Title */}
      <ScrollReveal>
        <h1 className="text-4xl md:text-6xl font-extrabold text-center mb-6 text-theme-primary">
          Integrate <span className="text-indigo-500">Everywhere</span>
        </h1>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <p className="text-theme-muted text-lg max-w-2xl mx-auto text-center mb-20">
          NoteStream connects with the tools you already use — turning your
          workflows into a seamless AI-powered ecosystem.
        </p>
      </ScrollReveal>

      {/* Integrations Grid */}
      <ScrollReveal delay={0.15}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {integrations.map((item, i) => {
            const colorClasses = getColorClasses(item.color);
            
            return (
              <ScrollReveal key={i} delay={0.1 * i} y={50}>
                <motion.div
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleIntegrationClick(item)}
                  className="group rounded-2xl p-8 backdrop-blur-md cursor-pointer border relative overflow-hidden"
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-secondary)',
                    boxShadow: '0 0 25px rgba(99,102,241,0.08)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                    e.currentTarget.style.boxShadow = '0 0 50px rgba(99,102,241,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-secondary)';
                    e.currentTarget.style.boxShadow = '0 0 25px rgba(99,102,241,0.08)';
                  }}
                >
                  {/* Status Badge */}
                  {item.status === "coming-soon" && (
                    <div className="absolute top-4 right-4">
                      <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                        COMING SOON
                      </span>
                    </div>
                  )}
                  
                  <div 
                    className={`flex items-center justify-center w-14 h-14 rounded-xl mb-5 
                    ${colorClasses.bg} group-hover:scale-110 transition-all duration-300`}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-theme-primary mb-3 group-hover:text-indigo-500 transition">
                    {item.title}
                  </h3>
                  <p className="text-theme-muted text-[0.95rem] leading-relaxed mb-4">{item.desc}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Learn more</span>
                    <FiArrowRight className="w-4 h-4" />
                  </div>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>
      </ScrollReveal>

      {/* Workflow Timeline */}
      <ScrollReveal delay={0.3}>
        <div 
          className="max-w-5xl mx-auto mt-[14vh] rounded-2xl p-10 backdrop-blur-md border"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-secondary)',
            boxShadow: '0 0 40px rgba(99,102,241,0.12)'
          }}
        >
          <h2 className="text-3xl font-bold text-indigo-500 mb-10 text-center">
            How Integrations Supercharge Your Workflow
          </h2>

          <div className="space-y-10">
            {[
              {
                title: "1. Capture Anything",
                desc: "Send notes, files, screenshots, or messages from any connected tool.",
              },
              {
                title: "2. NoteStream Analyzes",
                desc: "AI extracts insights, tasks, summaries, people, deadlines, and blockers.",
              },
              {
                title: "3. Everything Syncs Back",
                desc: "Output is automatically pushed into your workspace — Notion, Drive, Slack, GitHub, or Zapier.",
              },
            ].map((step, index) => (
              <ScrollReveal key={index} delay={index * 0.15}>
                <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                  <div 
                    className="min-w-[60px] min-h-[60px] flex items-center justify-center rounded-xl 
                    bg-indigo-500/20 border border-indigo-500/30 text-indigo-500 text-xl font-bold"
                  >
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-theme-primary mb-2">
                      {step.title}
                    </h3>
                    <p className="text-theme-muted">{step.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal delay={0.4}>
        <div className="text-center mt-[12vh]">
          <button
            onClick={() => navigate("/signup")}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90
            text-white px-10 py-4 rounded-full font-semibold text-lg 
            shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] 
            flex items-center gap-2 mx-auto"
          >
            Get Started with Integrations
            <FiLink2 className="w-5 h-5" />
          </button>
          <p className="text-theme-muted text-sm mt-4">
            Free account required to connect integrations
          </p>
        </div>
      </ScrollReveal>

      {/* Integration Detail Modal */}
      <AnimatePresence>
        {selectedIntegration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedIntegration(null)}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 backdrop-blur-sm"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl p-8 border z-10"
              style={{ 
                backgroundColor: 'var(--bg-surface)', 
                borderColor: 'var(--border-secondary)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedIntegration(null)}
                className="absolute top-4 right-4 p-2 rounded-lg text-theme-muted hover:text-theme-primary transition"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FiX className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center ${getColorClasses(selectedIntegration.color).bg}`}
                >
                  {selectedIntegration.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-theme-primary">{selectedIntegration.title}</h3>
                  {selectedIntegration.status === "coming-soon" ? (
                    <span className="text-sm text-amber-500">Coming Soon</span>
                  ) : (
                    <span className="text-sm text-emerald-500">Available</span>
                  )}
                </div>
              </div>

              <p className="text-theme-muted mb-6">{selectedIntegration.desc}</p>

              {/* Features */}
              <div className="mb-8">
                <p className="text-sm font-semibold text-theme-secondary mb-3">Features included:</p>
                <ul className="space-y-2">
                  {selectedIntegration.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-theme-secondary">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <FiCheck className="w-3 h-3 text-indigo-500" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              {selectedIntegration.status === "coming-soon" ? (
                <button
                  onClick={() => {
                    setSelectedIntegration(null);
                    navigate("/signup");
                  }}
                  className="w-full py-3 rounded-xl font-semibold transition border text-theme-secondary"
                  style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                >
                  Join Waitlist
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition shadow-lg shadow-indigo-500/25"
                >
                  Connect {selectedIntegration.title}
                </button>
              )}

              <p className="text-xs text-theme-muted text-center mt-4">
                Requires a free NoteStream account
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}