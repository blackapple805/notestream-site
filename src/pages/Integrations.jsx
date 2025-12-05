// src/pages/Integrations.jsx
import ScrollReveal from "../components/ScrollReveal";
import { motion } from "framer-motion";
import {
  FiZap,
  FiLink2,
  FiCloud,
  FiDatabase,
  FiTrendingUp,
  FiGlobe,
  FiMail,
  FiGithub,
} from "react-icons/fi";

export default function Integrations() {
  const integrations = [
    {
      title: "Google Drive",
      desc: "Sync notes, PDFs, and screenshots directly from your Drive workspace.",
      icon: <FiCloud className="text-indigo-500 w-7 h-7" />,
    },
    {
      title: "Slack",
      desc: "Turn message threads into AI summaries and actionable insights.",
      icon: <FiLink2 className="text-indigo-500 w-7 h-7" />,
    },
    {
      title: "Notion",
      desc: "Send Smart Notes to any Notion page with perfect formatting.",
      icon: <FiDatabase className="text-indigo-500 w-7 h-7" />,
    },
    {
      title: "Zapier",
      desc: "Automate everything — from new notes to CRM updates and reminders.",
      icon: <FiGlobe className="text-indigo-500 w-7 h-7" />,
    },
    {
      title: "GitHub Issues",
      desc: "Automatically extract tasks from meeting notes and push them into issues.",
      icon: <FiGithub className="text-indigo-500 w-7 h-7" />,
    },
    {
      title: "Email Import",
      desc: "Forward emails and get instant summaries and action items.",
      icon: <FiMail className="text-indigo-500 w-7 h-7" />,
    },
  ];

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {integrations.map((item, i) => (
            <ScrollReveal key={i} delay={0.1 * i} y={50}>
              <div
                className="group rounded-2xl p-8 backdrop-blur-md hover:-translate-y-2 hover:border-indigo-500/40 
                shadow-[0_0_25px_rgba(99,102,241,0.08)] hover:shadow-[0_0_50px_rgba(99,102,241,0.2)] 
                transition-all duration-500 cursor-pointer border"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-secondary)' 
                }}
              >
                <div 
                  className="flex items-center justify-center w-12 h-12 rounded-xl mb-5 
                  group-hover:bg-indigo-500/20 transition-all duration-300"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-theme-primary mb-3 group-hover:text-indigo-500 transition">
                  {item.title}
                </h3>
                <p className="text-theme-muted text-[0.95rem] leading-relaxed">{item.desc}</p>
              </div>
            </ScrollReveal>
          ))}
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
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90
            text-white px-10 py-4 rounded-full font-semibold text-lg 
            shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] 
            flex items-center gap-2 mx-auto"
          >
            Explore Integrations
            <FiLink2 className="w-5 h-5" />
          </button>
        </div>
      </ScrollReveal>
    </section>
  );
}
