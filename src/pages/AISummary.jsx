// src/pages/AISummary.jsx
import { FiZap, FiEdit3, FiFeather, FiList, FiArrowRight } from "react-icons/fi";
import ScrollReveal from "../components/ScrollReveal";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Sparkle, Lightning, Brain } from "phosphor-react";

export default function AISummary() {
  const [animateText, setAnimateText] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateText(true), 700);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: <FiEdit3 className="text-indigo-500 w-7 h-7" />,
      title: "Instant Smart Summary",
      desc: "Condense long notes into clear, structured summaries in seconds.",
      bgColor: "bg-indigo-500/20",
    },
    {
      icon: <FiList className="text-purple-500 w-7 h-7" />,
      title: "Key Action Item Extraction",
      desc: "Auto-identifies decisions, deadlines, and tasks from any text.",
      bgColor: "bg-purple-500/20",
    },
    {
      icon: <FiFeather className="text-emerald-500 w-7 h-7" />,
      title: "Tone + Context Awareness",
      desc: "Understands nuance — sentiment, urgency, and writing style.",
      bgColor: "bg-emerald-500/20",
    },
  ];

  const beforeText = `Meeting notes:
- client unhappy with timeline
- need marketing assets soon
- backend bug unresolved
- ask Sarah about analytics update
- contract renewal may be delayed`;

  const afterText = [
    { text: "Timeline risk — client expecting earlier delivery.", priority: "high" },
    { text: "Marketing assets required immediately.", priority: "high" },
    { text: "Engineering: unresolved backend issue.", priority: "medium" },
    { text: "Follow up with Sarah on analytics dashboard.", priority: "low" },
    { text: "Renewal impacted by current delays.", priority: "medium" },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "text-rose-500";
      case "medium": return "text-amber-500";
      case "low": return "text-emerald-500";
      default: return "text-indigo-500";
    }
  };

  return (
    <section
      className="relative min-h-screen text-theme-primary px-6 py-[18vh] overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* BG Glows */}
      <div className="absolute top-[8%] left-[10%] w-[280px] h-[280px] bg-indigo-500/20 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[8%] w-[240px] h-[240px] bg-purple-500/15 blur-[130px] rounded-full pointer-events-none"></div>

      {/* Title */}
      <ScrollReveal>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 mb-6">
            <Sparkle size={18} weight="fill" className="text-indigo-500" />
            <span className="text-sm font-medium text-indigo-500">AI-Powered</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-theme-primary">
            Smarter <span className="text-indigo-500">Summaries</span> Powered by{" "}
            <span className="text-purple-500">AI</span>
          </h1>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <p className="text-theme-muted text-lg max-w-2xl mx-auto text-center mb-20">
          Turn long, messy notes into clear insights. NoteStream's AI doesn't just summarize —
          it understands, rewrites, and highlights what actually matters.
        </p>
      </ScrollReveal>

      {/* Feature Cards */}
      <ScrollReveal delay={0.15}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-2xl p-8 border backdrop-blur-md transition-all duration-500 hover:-translate-y-2"
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
              <div 
                className={`flex items-center justify-center w-14 h-14 rounded-xl ${f.bgColor} mb-5 
                group-hover:scale-110 transition-all duration-300`}
              >
                {f.icon}
              </div>
              <h3 className="text-xl font-semibold text-theme-primary mb-3 group-hover:text-indigo-500 transition">
                {f.title}
              </h3>
              <p className="text-theme-muted text-[0.95rem] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </ScrollReveal>

      {/* BEFORE → AFTER TRANSFORMATION */}
      <ScrollReveal delay={0.2}>
        <div 
          className="max-w-5xl mx-auto rounded-2xl p-8 md:p-10 mb-20 border"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-secondary)',
            boxShadow: '0 0 40px rgba(99,102,241,0.12)'
          }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Brain size={28} weight="duotone" className="text-indigo-500" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-theme-primary">
                See AI Summary Transform Your Notes
              </h2>
              <p className="text-theme-muted text-sm">Watch messy notes become actionable insights</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {/* BEFORE BOX */}
            <div 
              className="p-6 rounded-xl border relative"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-secondary)' }}
            >
              <div className="absolute -top-3 left-4">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-semibold border"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}
                >
                  BEFORE
                </span>
              </div>
              <div className="mt-3">
                <p className="text-theme-secondary whitespace-pre-line text-sm leading-relaxed font-mono">
                  {beforeText}
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <FiArrowRight className="text-white w-5 h-5" />
              </div>
            </div>

            {/* AFTER BOX */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={animateText ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="p-6 rounded-xl border-2 border-indigo-500/40 relative"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <div className="absolute -top-3 left-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500 text-white">
                  AFTER
                </span>
              </div>
              <div className="mt-3">
                <ul className="text-sm space-y-3">
                  {afterText.map((item, index) => (
                    <motion.li 
                      key={index} 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={animateText ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        item.priority === 'high' ? 'bg-rose-500/20' :
                        item.priority === 'medium' ? 'bg-amber-500/20' : 'bg-emerald-500/20'
                      }`}>
                        <Lightning 
                          size={12} 
                          weight="fill" 
                          className={getPriorityColor(item.priority)} 
                        />
                      </div>
                      <span className="text-theme-secondary">{item.text}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
            <span className="text-xs text-theme-muted">Priority:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/30"></div>
              <span className="text-xs text-theme-muted">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500/30"></div>
              <span className="text-xs text-theme-muted">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500/30"></div>
              <span className="text-xs text-theme-muted">Low</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* How It Works */}
      <ScrollReveal delay={0.25}>
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center text-theme-primary mb-12">
            How AI Summary Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Paste or Upload", desc: "Drop in any text, document, or screenshot", icon: FiEdit3 },
              { step: "2", title: "AI Analyzes", desc: "Our engine extracts key information", icon: Brain },
              { step: "3", title: "Get Results", desc: "Receive a clean, actionable summary", icon: Sparkle },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div 
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  <item.icon size={28} className="text-indigo-500" />
                </div>
                <div className="text-xs font-semibold text-indigo-500 mb-2">STEP {item.step}</div>
                <h3 className="text-lg font-semibold text-theme-primary mb-2">{item.title}</h3>
                <p className="text-sm text-theme-muted">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal delay={0.3}>
        <div className="text-center">
          <div 
            className="max-w-xl mx-auto rounded-2xl p-8 border"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border-secondary)',
              boxShadow: '0 0 40px rgba(99,102,241,0.1)'
            }}
          >
            <h3 className="text-2xl font-bold text-theme-primary mb-3">
              Ready to summarize smarter?
            </h3>
            <p className="text-theme-muted mb-6">
              Try AI Summary free and see the difference.
            </p>
            <button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 
            text-white px-10 py-4 rounded-full font-semibold text-lg 
            shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] 
            flex items-center gap-2 mx-auto">
              Try AI Summary <FiZap className="w-5 h-5" />
            </button>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}