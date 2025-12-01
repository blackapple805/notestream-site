// src/pages/SmartNotes.jsx
import { motion } from "framer-motion";
import { FiZap, FiTag, FiFileText, FiSearch, FiLayers, FiCpu } from "react-icons/fi";

export default function SmartNotes() {
  const features = [
    {
      icon: <FiTag className="text-indigo-400 w-7 h-7" />,
      title: "Automatic Tagging",
      desc: "Smart Notes scans your content and applies meaningful categories instantly.",
    },
    {
      icon: <FiSearch className="text-indigo-400 w-7 h-7" />,
      title: "Deep Context Search",
      desc: "Find anything by meaning, not keywords — search that understands logic.",
    },
    {
      icon: <FiLayers className="text-indigo-400 w-7 h-7" />,
      title: "Structure Detection",
      desc: "Lists, tasks, highlights, dates — everything is recognized and organized automatically.",
    },
    {
      icon: <FiCpu className="text-indigo-400 w-7 h-7" />,
      title: "Context Engine",
      desc: "Each Smart Note learns from your habits and evolves with your workflow.",
    },
  ];

  return (
    <section className="min-h-screen bg-theme-surface text-theme-primary pt-32 pb-24 px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-indigo-600/20 blur-[160px] rounded-full"></div>
      <div className="absolute bottom-[10%] right-[5%] w-[260px] h-[260px] bg-purple-600/15 blur-[150px] rounded-full"></div>

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* --- HERO SECTION --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl font-extrabold mb-6">
            Smart Notes that <span className="text-indigo-400">Think</span>
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
              className="group bg-theme-elevated/70 border border-[#1f1f25] rounded-2xl p-8 backdrop-blur-md
                         hover:-translate-y-2 hover:bg-theme-elevated hover:border-indigo-500/40 
                         shadow-[0_0_25px_rgba(99,102,241,0.08)]
                         hover:shadow-[0_0_45px_rgba(99,102,241,0.25)]
                         transition-all duration-500"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1b1b25] mb-5
                              group-hover:bg-indigo-500/20 transition-all duration-300">
                {f.icon}
              </div>
              <h3 className="text-xl font-semibold text-theme-primary mb-3 group-hover:text-indigo-400 transition">
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
          <h2 className="text-4xl font-extrabold text-center mb-10">
            See Smart Notes <span className="text-indigo-400">in Action</span>
          </h2>

          <div className="rounded-[1.6rem] overflow-hidden border border-[#1f1f25] bg-[#0f0f14]/80 
                          shadow-[0_0_60px_rgba(99,102,241,0.25)] backdrop-blur-md p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

              {/* Left Text */}
              <div>
                <h3 className="text-2xl font-semibold mb-4">Drop in raw text → get a structured result</h3>
                <p className="text-theme-muted mb-6">
                  Smart Notes analyzes tone, structure, entities, tasks, and context — then produces a clean, usable format instantly.
                </p>

                <ul className="space-y-3 text-[var(--text-secondary)] text-sm">
                  <li>• Extracts tasks & deadlines</li>
                  <li>• Detects important highlights</li>
                  <li>• Groups topics by meaning</li>
                  <li>• Adds smart tags automatically</li>
                </ul>
              </div>

              {/* Right Mockup */}
              <div className="bg-theme-elevated/60 border border-[#1f1f25] rounded-xl p-6 shadow-inner">
                <p className="text-xs text-theme-muted mb-3">Raw Note →</p>
                <div className="bg-[var(--bg-input)]nput)] rounded-lg p-4 text-theme-muted text-sm mb-6">
                  Meeting tomorrow at 3pm. Need to finish the UI components first.
                  Ask Sarah for the updated Figma file. Priority is dashboard layout.
                </div>

                <p className="text-xs text-theme-muted mb-3">Smart Note Output →</p>
                <div className="bg-theme-elevated border border-indigo-500/20 rounded-lg p-4 space-y-2 text-sm">
                  <p className="text-accent-indigo font-medium">Tasks:</p>
                  <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-1">
                    <li>Finish UI components</li>
                    <li>Request updated Figma from Sarah</li>
                  </ul>

                  <p className="text-accent-indigo font-medium mt-3">Important:</p>
                  <p className="text-[var(--text-secondary)]">Dashboard layout is highest priority.</p>

                  <p className="text-accent-indigo font-medium mt-3">Schedule:</p>
                  <p className="text-[var(--text-secondary)]">Meeting tomorrow at 3 PM</p>
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
          <h2 className="text-4xl font-extrabold text-center mb-12">
            How Smart Notes <span className="text-indigo-400">Understands You</span>
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
                className="bg-theme-elevated/70 border border-[#1f1f25] rounded-2xl p-8 backdrop-blur-md flex flex-col items-center text-center
                           hover:bg-theme-elevated hover:border-indigo-500/40 hover:-translate-y-2 transition-all duration-300"
              >
                <FiZap className="text-indigo-400 w-10 h-10 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
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
          <h2 className="text-4xl font-extrabold text-center mb-12">
            What Makes <span className="text-indigo-400">Smart Notes</span> Different
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-theme-elevated/70 border border-[#1f1f25] rounded-xl p-8 backdrop-blur-md">
              <h3 className="text-2xl font-semibold text-indigo-400 mb-4">Smart Notes</h3>
              <ul className="text-[var(--text-secondary)] space-y-3 text-sm">
                <li>• Learns your style</li>
                <li>• Understands meaning, not just keywords</li>
                <li>• Auto-organizes everything</li>
                <li>• Adds reminders, tags, priorities</li>
                <li>• Designed for speed & clarity</li>
              </ul>
            </div>

            <div className="bg-theme-elevated/40 border border-[#1f1f25] rounded-xl p-8 backdrop-blur-md opacity-60">
              <h3 className="text-2xl font-semibold mb-4">Normal Notes Apps</h3>
              <ul className="text-theme-muted space-y-3 text-sm">
                <li>• Manual tagging</li>
                <li>• Hard to search</li>
                <li>• No structure detection</li>
                <li>• Static text with no intelligence</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}