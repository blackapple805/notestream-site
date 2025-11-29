// src/pages/Updates.jsx
import { motion } from "framer-motion";
import { FiClock, FiZap, FiCheckCircle, FiTrendingUp, FiBell, FiCheck } from "react-icons/fi";

export default function Updates() {
  return (
    <section className="relative min-h-screen text-white px-6 pt-32 pb-32 overflow-hidden bg-[#0d0d10]">

      {/* ===== Background Glow ===== */}
      <div className="absolute top-[12%] left-[8%] w-[300px] h-[300px] bg-indigo-600/25 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[8%] right-[8%] w-[240px] h-[240px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

      {/* ===== Header ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-20 relative z-10"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
          Latest <span className="text-indigo-400">Updates</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
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
        className="max-w-4xl mx-auto bg-[#111114]/70 border border-[#1f1f25] rounded-3xl p-10 mb-24 shadow-[0_0_60px_rgba(99,102,241,0.22)] relative z-10"
      >
        <div className="flex items-center gap-3 mb-3">
          <FiZap className="text-indigo-400 w-6 h-6" />
          <span className="uppercase tracking-widest text-indigo-400 text-sm font-semibold">
            Latest Release
          </span>
        </div>

        <h2 className="text-3xl font-bold mb-4">
          Version 1.4 — Smarter Summaries, Faster AI
        </h2>

        <p className="text-gray-400 leading-relaxed mb-8">
          The AI engine now understands context deeper than ever. We’ve also
          improved speed by 40%, added new Smart Notes layouts, and introduced
          automatic topic grouping to help your workspace stay effortlessly organized.
        </p>

        <div className="flex flex-wrap gap-4">
          {[
            "40% Faster Summary Generation",
            "New Topic Grouping Engine",
            "Improved OCR Accuracy",
            "Cleaned Up UI Interactions",
          ].map((item, i) => (
            <span
              key={i}
              className="px-4 py-2 rounded-full bg-[#1b1b23] border border-indigo-500/30 text-indigo-300 text-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </motion.div>

      {/* =========================================================
          TIMELINE OF PAST UPDATES
      ========================================================== */}
      <div className="max-w-4xl mx-auto relative z-10">
        <h2 className="text-4xl font-bold mb-10 text-center">Recent Updates</h2>

        <div className="space-y-10">

          {[
            {
              version: "1.3",
              title: "AI Summary templates + export tools",
              desc: "Added one-click templates for Weekly Recaps, Study Guides, and Financial Breakdowns.",
              date: "3 weeks ago",
            },
            {
              version: "1.2",
              title: "New Dashboard Preview",
              desc: "We redesigned the dashboard to provide faster access to your summaries and insights.",
              date: "1 month ago",
            },
            {
              version: "1.1",
              title: "Smart Notes v2",
              desc: "Major update to note parsing: higher accuracy, better formatting, and category detection.",
              date: "2 months ago",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-[#111114]/60 border border-[#1f1f25] rounded-2xl p-8 shadow-[0_0_40px_rgba(99,102,241,0.18)]"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-2xl font-semibold text-indigo-300">
                  v{item.version} — {item.title}
                </h3>
                <span className="text-gray-500 text-sm flex items-center gap-2">
                  <FiClock className="text-gray-500" /> {item.date}
                </span>
              </div>

              <p className="text-gray-400">{item.desc}</p>
            </motion.div>
          ))}

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
        <h2 className="text-4xl font-bold text-center mb-14">Roadmap</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Planned */}
          <div className="p-8 bg-[#111114]/70 rounded-2xl border border-[#1f1f25] shadow-[0_0_30px_rgba(99,102,241,0.16)]">
            <h3 className="text-xl font-semibold text-indigo-300 mb-4">Planned</h3>
            <ul className="space-y-3 text-gray-400">
              <li><FiCheckCircle className="inline text-indigo-400 mr-2" /> Multi-Workspace Support</li>
              <li><FiCheckCircle className="inline text-indigo-400 mr-2" /> App Integrations Marketplace</li>
              <li><FiCheckCircle className="inline text-indigo-400 mr-2" /> Sharing + Collaboration</li>
            </ul>
          </div>

          {/* In Progress */}
          <div className="p-8 bg-[#111114]/70 rounded-2xl border border-[#1f1f25] shadow-[0_0_30px_rgba(99,102,241,0.16)]">
            <h3 className="text-xl font-semibold text-indigo-300 mb-4">In Progress</h3>
            <ul className="space-y-3 text-gray-400">
              <li><FiTrendingUp className="inline text-indigo-400 mr-2" /> Advanced Analytics View</li>
              <li><FiTrendingUp className="inline text-indigo-400 mr-2" /> New AI Summary Models</li>
              <li><FiTrendingUp className="inline text-indigo-400 mr-2" /> Faster OCR & Document Parsing</li>
            </ul>
          </div>

          {/* Released */}
          <div className="p-8 bg-[#111114]/70 rounded-2xl border border-[#1f1f25] shadow-[0_0_30px_rgba(99,102,241,0.16)]">
            <h3 className="text-xl font-semibold text-indigo-300 mb-4">Recently Released</h3>
            <ul className="space-y-3 text-gray-400">
              <li><FiCheck className="inline text-indigo-400 mr-2" /> New Dashboard UI</li>
              <li><FiCheck className="inline text-indigo-400 mr-2" /> Topic Grouping Engine</li>
              <li><FiCheck className="inline text-indigo-400 mr-2" /> Summary Templates</li>
            </ul>
          </div>
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
        className="max-w-4xl mx-auto mt-32 bg-[#111114]/70 border border-[#1f1f25] rounded-3xl p-12 text-center shadow-[0_0_60px_rgba(99,102,241,0.22)] relative z-10"
      >
        <FiBell className="text-indigo-400 w-10 h-10 mx-auto mb-6" />

        <h2 className="text-3xl font-bold mb-4">Stay in the Loop</h2>
        <p className="text-gray-400 max-w-lg mx-auto mb-8">
          Get notified about new features, AI improvements, and major announcements.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <input
            type="email"
            placeholder="you@example.com"
            className="px-6 py-3 rounded-full bg-[#0f0f12] border border-[#1f1f25] text-gray-300 focus:border-indigo-400 outline-none w-full sm:w-[320px]"
          />
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold transition">
            Subscribe
          </button>
        </div>
      </motion.div>

      <div className="h-[200px]" />
    </section>
  );
}
