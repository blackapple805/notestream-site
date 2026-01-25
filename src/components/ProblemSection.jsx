// src/components/ProblemSection.jsx
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  FiClock,
  FiLayers,
  FiZap,
  FiArrowRight,
  FiX,
  FiCheck,
  FiFolder,
  FiSearch,
} from "react-icons/fi";
import { Lightning, Sparkle } from "phosphor-react";

function ToneTile({ tone, size = 56, children, className = "" }) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        background: `linear-gradient(135deg, ${tone}22, ${tone}10)`,
        border: `1px solid ${tone}2A`,
      }}
    >
      {children}
    </div>
  );
}

export default function ProblemSection() {
  const navigate = useNavigate();

  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { amount: 0.3, once: true });

  const problems = [
    {
      icon: <FiClock size={22} />,
      title: "Hours Wasted",
      desc: "Sorting through endless notes and documents to find what matters.",
      color: "var(--accent-rose)",
    },
    {
      icon: <FiLayers size={22} />,
      title: "Scattered Data",
      desc: "Insights buried across multiple tools, folders, and platforms.",
      color: "var(--accent-amber)",
    },
    {
      icon: <FiSearch size={22} />,
      title: "Lost Context",
      desc: "Important connections between ideas slip through the cracks.",
      color: "var(--accent-purple)",
    },
  ];

  const solutions = [
    { icon: <FiZap size={16} />, text: "Instant AI-powered summaries" },
    { icon: <FiFolder size={16} />, text: "Auto-organized by topic" },
    { icon: <Sparkle size={16} weight="fill" />, text: "Smart connections discovered" },
  ];

  return (
    <section
      ref={sectionRef}
      id="problem"
      className="relative py-24 md:py-32 px-6 overflow-hidden"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      {/* === Background Elements === */}
      <div
        className="absolute top-[20%] left-[5%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(244, 63, 94, 0.08), transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute bottom-[10%] right-[10%] w-[250px] h-[250px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.1), transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border"
            style={{
              backgroundColor: "rgba(244, 63, 94, 0.1)",
              borderColor: "rgba(244, 63, 94, 0.2)",
            }}
          >
            <FiX size={14} style={{ color: "var(--accent-rose)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--accent-rose)" }}>
              The Problem
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            Note-taking is <span style={{ color: "var(--accent-rose)" }}>broken</span>
          </h2>

          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--text-muted)" }}>
            Before{" "}
            <span className="font-medium" style={{ color: "var(--accent-indigo)" }}>
              NoteStream
            </span>
            , finding insights meant scrolling through chaos.
          </p>
        </motion.div>

        {/* Problems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-16">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl p-6 border transition-all duration-300 text-center flex flex-col items-center"
              style={{
                backgroundColor: "rgba(var(--bg-surface-rgb), 0.65)",
                backdropFilter: "blur(12px)",
                borderColor: "var(--border-secondary)",
                boxShadow: "0 0 0 rgba(0,0,0,0)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${problem.color}40`;
                e.currentTarget.style.boxShadow = `0 10px 40px ${problem.color}12`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-secondary)";
                e.currentTarget.style.boxShadow = "0 0 0 rgba(0,0,0,0)";
              }}
            >
              {/* Negative marker (not "close"): place near title as a badge */}
              <div className="absolute left-15.5 top-3">
                <div className="flex items-center gap-0">
                  <ToneTile tone={problem.color} size={28} className="rounded-xl">
                    <FiX size={14} style={{ color: problem.color }} />
                  </ToneTile>
                  <span
                    className="text-[11px] font-semibold tracking-wide uppercase"
                    style={{ color: problem.color, opacity: 0.95 }}
                  >
                    Issue
                  </span>
                </div>
              </div>

              {/* Icon tile (Hero-style) */}
              <div className="mt-6 mb-4 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <div
                  className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    color: problem.color,
                    background: `radial-gradient(circle at 30% 30%, ${problem.color}22, ${problem.color}10 55%, transparent 75%)`,
                    border: `1px solid ${problem.color}2A`,
                  }}
                >
                  {problem.icon}
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                {problem.title}
              </h3>

              <p className="text-sm leading-relaxed max-w-[30ch]" style={{ color: "var(--text-muted)" }}>
                {problem.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Transition Arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center mb-16"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
            }}
          >
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <FiArrowRight size={20} style={{ color: "var(--accent-indigo)", transform: "rotate(90deg)" }} />
            </motion.div>
          </div>
        </motion.div>

        {/* Solution Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border"
            style={{
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              borderColor: "rgba(99, 102, 241, 0.2)",
            }}
          >
            <Lightning size={14} weight="fill" style={{ color: "var(--accent-indigo)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--accent-indigo)" }}>
              The Solution
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            <span style={{ color: "var(--accent-indigo)" }}>NoteStream</span> fixes this
          </h2>

          <p className="text-lg max-w-xl mx-auto mb-10" style={{ color: "var(--text-muted)" }}>
            We turn noise into clarity — instantly and effortlessly.
          </p>

          {/* Solution Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {solutions.map((solution, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border"
                style={{
                  backgroundColor: "rgba(var(--bg-surface-rgb), 0.65)",
                  backdropFilter: "blur(10px)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "var(--accent-emerald)" }}
                >
                  <FiCheck size={12} />
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {solution.text}
                </span>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.9 }}
            onClick={() => navigate("/smart-notes")}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))",
              boxShadow: "0 4px 20px rgba(99, 102, 241, 0.35)",
            }}
          >
            Explore Smart Notes
            <FiArrowRight size={18} />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}



