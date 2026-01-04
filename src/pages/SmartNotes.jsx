// src/pages/SmartNotes.jsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiZap, FiTag, FiSearch, FiLayers, FiCpu } from "react-icons/fi";

export default function SmartNotes() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FiTag className="text-indigo-500 w-7 h-7" />,
      title: "Automatic Tagging",
      desc: "Smart Notes scans your content and applies meaningful categories instantly.",
    },
    {
      icon: <FiSearch className="text-indigo-500 w-7 h-7" />,
      title: "Deep Context Search",
      desc: "Find anything by meaning, not keywords — search that understands logic.",
    },
    {
      icon: <FiLayers className="text-indigo-500 w-7 h-7" />,
      title: "Structure Detection",
      desc: "Lists, tasks, highlights, dates — everything is recognized and organized automatically.",
    },
    {
      icon: <FiCpu className="text-indigo-500 w-7 h-7" />,
      title: "Context Engine",
      desc: "Each Smart Note learns from your habits and evolves with your workflow.",
    },
  ];

  return (
    <section 
      className="min-h-screen text-theme-primary pt-32 pb-24 px-6 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Background Glow */}
      <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-indigo-500/20 blur-[160px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[5%] w-[260px] h-[260px] bg-purple-500/15 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* --- HERO SECTION --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl font-extrabold mb-6 text-theme-primary">
            Smart Notes that <span className="text-indigo-500">Think</span>
          </h1>
          <p className="text-theme-muted text-lg max-w-2xl mx-auto leading-relaxed">
            Your notes become living documents — structured, organized, enriched,
            and searchable with AI that understands every detail.
          </p>
        </motion.div>

        {/* --- FEATURES GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-28">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-2xl p-8 backdrop-blur-md border
                         hover:-translate-y-2 hover:border-indigo-500/40 
                         transition-all duration-500"
              style={{ 
                backgroundColor: 'var(--bg-card)', 
                borderColor: 'var(--border-secondary)',
                boxShadow: '0 0 25px rgba(99,102,241,0.08)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 45px rgba(99,102,241,0.2)';
                e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 25px rgba(99,102,241,0.08)';
                e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              }}
            >
              <div 
                className="flex items-center justify-center w-12 h-12 rounded-xl mb-5
                           group-hover:bg-indigo-500/20 transition-all duration-300"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                {f.icon}
              </div>
              <h3 className="text-xl font-semibold text-theme-primary mb-3 group-hover:text-indigo-500 transition">
                {f.title}
              </h3>
              <p className="text-theme-muted text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* --- LIVE PREVIEW MOCKUP --- */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative mb-32"
        >
          <h2 className="text-4xl font-extrabold text-center mb-10 text-theme-primary">
            See Smart Notes <span className="text-indigo-500">in Action</span>
          </h2>

          <div 
            className="rounded-[1.6rem] overflow-hidden border backdrop-blur-md p-8"
            style={{ 
              backgroundColor: 'var(--bg-surface)', 
              borderColor: 'var(--border-secondary)',
              boxShadow: '0 0 60px rgba(99,102,241,0.15)'
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

              {/* Left Text */}
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-theme-primary">Drop in raw text → get a structured result</h3>
                <p className="text-theme-muted mb-6">
                  Smart Notes analyzes tone, structure, entities, tasks, and context — then produces a clean, usable format instantly.
                </p>

                <ul className="space-y-3 text-theme-secondary text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-500">•</span> Extracts tasks & deadlines
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-500">•</span> Detects important highlights
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-500">•</span> Groups topics by meaning
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-500">•</span> Adds smart tags automatically
                  </li>
                </ul>
              </div>

              {/* Right Mockup */}
              <div 
                className="rounded-xl p-6 border"
                style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-secondary)' }}
              >
                <p className="text-xs text-theme-muted mb-3 font-medium">Raw Note →</p>
                <div 
                  className="rounded-lg p-4 text-theme-secondary text-sm mb-6 border"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-secondary)' }}
                >
                  Meeting tomorrow at 3pm. Need to finish the UI components first.
                  Ask Sarah for the updated Figma file. Priority is dashboard layout.
                </div>

                <p className="text-xs text-theme-muted mb-3 font-medium">Smart Note Output →</p>
                <div 
                  className="rounded-lg p-4 space-y-2 text-sm border border-indigo-500/30"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  <p className="text-indigo-500 font-semibold">Tasks:</p>
                  <ul className="list-disc list-inside text-theme-secondary space-y-1 ml-1">
                    <li>Finish UI components</li>
                    <li>Request updated Figma from Sarah</li>
                  </ul>

                  <p className="text-indigo-500 font-semibold mt-3">Important:</p>
                  <p className="text-theme-secondary">Dashboard layout is highest priority.</p>

                  <p className="text-indigo-500 font-semibold mt-3">Schedule:</p>
                  <p className="text-theme-secondary">Meeting tomorrow at 3 PM</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* --- AI LOGIC DIAGRAM --- */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-32"
        >
          <h2 className="text-4xl font-extrabold text-center mb-12 text-theme-primary">
            How Smart Notes <span className="text-indigo-500">Understands You</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: "Analyze", desc: "AI scans your text for structure, intent, tone, and meaning." },
              { title: "Organize", desc: "Breaks content into tasks, events, topics, and insights." },
              { title: "Enrich", desc: "Adds tags, summaries, and context for faster recall." },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-8 backdrop-blur-md flex flex-col items-center text-center border
                           hover:border-indigo-500/40 hover:-translate-y-2 transition-all duration-300"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
              >
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
                >
                  <FiZap className="text-indigo-500 w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-theme-primary">{step.title}</h3>
                <p className="text-theme-muted text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* --- WHY SMART NOTES IS BETTER --- */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-20"
        >
          <h2 className="text-4xl font-extrabold text-center mb-12 text-theme-primary">
            What Makes <span className="text-indigo-500">Smart Notes</span> Different
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Smart Notes - Highlighted */}
            <div 
              className="rounded-xl p-8 backdrop-blur-md border-2 border-indigo-500/40"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <h3 className="text-2xl font-semibold text-indigo-500 mb-4">Smart Notes</h3>
              <ul className="text-theme-secondary space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 text-xs">✓</span>
                  Learns your style
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 text-xs">✓</span>
                  Understands meaning, not just keywords
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 text-xs">✓</span>
                  Auto-organizes everything
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 text-xs">✓</span>
                  Adds reminders, tags, priorities
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-500 text-xs">✓</span>
                  Designed for speed & clarity
                </li>
              </ul>
            </div>

            {/* Normal Notes Apps - Dimmed */}
            <div 
              className="rounded-xl p-8 backdrop-blur-md opacity-70 border"
              style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
            >
              <h3 className="text-2xl font-semibold mb-4 text-theme-secondary">Normal Notes Apps</h3>
              <ul className="text-theme-muted space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-400 text-xs">✗</span>
                  Manual tagging
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-400 text-xs">✗</span>
                  Hard to search
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-400 text-xs">✗</span>
                  No structure detection
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-400 text-xs">✗</span>
                  Static text with no intelligence
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* --- CTA Section --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <div 
            className="rounded-2xl p-10 border"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border-secondary)',
              boxShadow: '0 0 40px rgba(99,102,241,0.1)'
            }}
          >
            <h3 className="text-2xl font-bold text-theme-primary mb-4">
              Ready to transform your notes?
            </h3>
            <p className="text-theme-muted mb-6 max-w-lg mx-auto">
              Start using Smart Notes today and experience the future of note-taking.
            </p>
            <button 
              onClick={() => navigate("/signup")}
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-full hover:opacity-90 transition shadow-lg shadow-indigo-500/25"
            >
              Get Started Free
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}