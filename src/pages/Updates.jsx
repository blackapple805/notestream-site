// src/pages/Updates.jsx
import { motion } from "framer-motion";
import { 
  FiClock, 
  FiZap, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiBell, 
  FiCheck,
  FiGitCommit,
  FiPackage,
  FiStar,
  FiArrowRight
} from "react-icons/fi";
import { Sparkle, Lightning, Rocket, Calendar, CheckCircle } from "phosphor-react";

export default function Updates() {
  return (
    <section 
      className="relative min-h-screen text-theme-primary px-6 pt-32 pb-32 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* ===== Background Glow ===== */}
      <div className="absolute top-[12%] left-[8%] w-[300px] h-[300px] bg-indigo-500/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[8%] right-[8%] w-[240px] h-[240px] bg-purple-500/15 blur-[120px] rounded-full pointer-events-none" />

      {/* ===== Header ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-20 relative z-10"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-theme-primary">
          Latest <span className="text-indigo-500">Updates</span>
        </h1>
        <p className="text-theme-muted max-w-2xl mx-auto text-lg">
          Every improvement, release, and new feature rolled out to make NoteStream smarter, faster, and more powerful.
        </p>
      </motion.div>

      {/* =========================================================
          LATEST RELEASE HIGHLIGHT
      ========================================================== */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto rounded-3xl p-10 mb-24 relative z-10 border"
        style={{ 
          backgroundColor: 'var(--bg-card)', 
          borderColor: 'var(--border-secondary)',
          boxShadow: '0 0 60px rgba(99,102,241,0.15)'
        }}
      >
        {/* Version Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Rocket size={22} weight="duotone" className="text-indigo-500" />
            </div>
            <span className="uppercase tracking-widest text-indigo-500 text-sm font-semibold">
              Latest Release
            </span>
          </div>
          <span 
            className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
          >
            NEW
          </span>
        </div>

        <h2 className="text-3xl font-bold mb-4 text-theme-primary">
          Version 1.4 — Smarter Summaries, Faster AI
        </h2>

        <p className="text-theme-muted leading-relaxed mb-8">
          The AI engine now understands context deeper than ever. We've also
          improved speed by 40%, added new Smart Notes layouts, and introduced
          automatic topic grouping to help your workspace stay effortlessly organized.
        </p>

        {/* Feature Tags */}
        <div className="flex flex-wrap gap-3">
          {[
            { text: "40% Faster Summary Generation", icon: Lightning },
            { text: "New Topic Grouping Engine", icon: FiPackage },
            { text: "Improved OCR Accuracy", icon: FiStar },
            { text: "Cleaned Up UI Interactions", icon: Sparkle },
          ].map((item, i) => (
            <span
              key={i}
              className="px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 border"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)', 
                borderColor: 'rgba(99, 102, 241, 0.3)',
                color: 'var(--text-secondary)'
              }}
            >
              <item.icon size={16} className="text-indigo-500" />
              {item.text}
            </span>
          ))}
        </div>
      </motion.div>

      {/* =========================================================
          TIMELINE OF PAST UPDATES
      ========================================================== */}
      <div className="max-w-4xl mx-auto relative z-10">
        <h2 className="text-4xl font-bold mb-10 text-center text-theme-primary">Recent Updates</h2>

        {/* Timeline Line */}
        <div className="relative">
          <div 
            className="absolute left-6 top-0 bottom-0 w-0.5 hidden md:block"
            style={{ backgroundColor: 'var(--border-secondary)' }}
          ></div>

          <div className="space-y-8">
            {[
              {
                version: "1.3",
                title: "AI Summary templates + export tools",
                desc: "Added one-click templates for Weekly Recaps, Study Guides, and Financial Breakdowns.",
                date: "3 weeks ago",
                icon: FiPackage,
                color: "text-purple-500",
                bgColor: "bg-purple-500/20",
              },
              {
                version: "1.2",
                title: "New Dashboard Preview",
                desc: "We redesigned the dashboard to provide faster access to your summaries and insights.",
                date: "1 month ago",
                icon: FiTrendingUp,
                color: "text-blue-500",
                bgColor: "bg-blue-500/20",
              },
              {
                version: "1.1",
                title: "Smart Notes v2",
                desc: "Major update to note parsing: higher accuracy, better formatting, and category detection.",
                date: "2 months ago",
                icon: FiZap,
                color: "text-amber-500",
                bgColor: "bg-amber-500/20",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative md:pl-16"
              >
                {/* Timeline Dot */}
                <div 
                  className={`absolute left-4 top-6 w-5 h-5 rounded-full border-4 hidden md:flex items-center justify-center ${item.bgColor}`}
                  style={{ borderColor: 'var(--bg-primary)' }}
                >
                </div>

                <div 
                  className="rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1"
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-secondary)',
                    boxShadow: '0 0 30px rgba(99,102,241,0.08)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                    e.currentTarget.style.boxShadow = '0 0 40px rgba(99,102,241,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-secondary)';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(99,102,241,0.08)';
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center`}
                      >
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-indigo-500">v{item.version}</span>
                        <h3 className="text-xl font-semibold text-theme-primary">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                    <span className="text-theme-muted text-sm flex items-center gap-2">
                      <FiClock className="text-theme-muted" size={14} /> {item.date}
                    </span>
                  </div>

                  <p className="text-theme-muted ml-0 sm:ml-13">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================
          ROADMAP SECTION
      ========================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-5xl mx-auto mt-32 relative z-10"
      >
        <h2 className="text-4xl font-bold text-center mb-4 text-theme-primary">Roadmap</h2>
        <p className="text-theme-muted text-center mb-14 max-w-2xl mx-auto">
          See what we're building next and what's already shipped.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Planned */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            className="p-6 rounded-2xl border"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-slate-500/20 flex items-center justify-center">
                <Calendar size={18} weight="duotone" className="text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Planned</h3>
            </div>
            <ul className="space-y-3">
              {["Multi-Workspace Support", "App Integrations Marketplace", "Sharing + Collaboration"].map((item, i) => (
                <li 
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <div className="w-5 h-5 rounded-full border-2 border-slate-400/50"></div>
                  <span className="text-sm text-theme-secondary">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* In Progress */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl border-2 border-indigo-500/40"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <FiTrendingUp size={18} className="text-indigo-500" />
              </div>
              <h3 className="text-lg font-semibold text-indigo-500">In Progress</h3>
              <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-500 border border-indigo-500/30">
                ACTIVE
              </span>
            </div>
            <ul className="space-y-3">
              {["Advanced Analytics View", "New AI Summary Models", "Faster OCR & Document Parsing"].map((item, i) => (
                <li 
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl border border-indigo-500/20"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-500/30 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  </div>
                  <span className="text-sm text-theme-secondary">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Released */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl border"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle size={18} weight="duotone" className="text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">Released</h3>
            </div>
            <ul className="space-y-3">
              {["New Dashboard UI", "Topic Grouping Engine", "Summary Templates"].map((item, i) => (
                <li 
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <FiCheck className="w-3 h-3 text-emerald-500" />
                  </div>
                  <span className="text-sm text-theme-secondary">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </motion.div>

      {/* =========================================================
          SUBSCRIBE CTA
      ========================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto mt-32 rounded-3xl p-12 text-center relative z-10 border"
        style={{ 
          backgroundColor: 'var(--bg-card)', 
          borderColor: 'var(--border-secondary)',
          boxShadow: '0 0 60px rgba(99,102,241,0.12)'
        }}
      >
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-6">
          <FiBell className="text-indigo-500 w-8 h-8" />
        </div>

        <h2 className="text-3xl font-bold mb-4 text-theme-primary">Stay in the Loop</h2>
        <p className="text-theme-muted max-w-lg mx-auto mb-8">
          Get notified about new features, AI improvements, and major announcements.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
          <input
            type="email"
            placeholder="you@example.com"
            className="px-6 py-3 rounded-full text-theme-primary focus:ring-2 focus:ring-indigo-500/50 outline-none w-full border"
            style={{ 
              backgroundColor: 'var(--bg-input)', 
              borderColor: 'var(--border-secondary)'
            }}
          />
          <button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white px-8 py-3 rounded-full font-semibold transition shadow-lg shadow-indigo-500/25 whitespace-nowrap">
            Subscribe
          </button>
        </div>

        <p className="text-xs text-theme-muted mt-4">
          No spam, unsubscribe anytime.
        </p>
      </motion.div>

      <div className="h-[100px]" />
    </section>
  );
}
