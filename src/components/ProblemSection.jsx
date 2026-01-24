// src/components/ProblemSection.jsx
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { 
  FiClock, FiLayers, FiZap, FiArrowRight,
  FiX, FiCheck, FiFolder, FiSearch
} from "react-icons/fi";
import { Lightning, Sparkle } from "phosphor-react";

export default function ProblemSection() {
  const navigate = useNavigate();
  
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { amount: 0.3, once: true });

  const problems = [
    {
      icon: <FiClock size={20} />,
      title: "Hours Wasted",
      desc: "Sorting through endless notes and documents to find what matters.",
      color: "var(--accent-rose)",
    },
    {
      icon: <FiLayers size={20} />,
      title: "Scattered Data",
      desc: "Insights buried across multiple tools, folders, and platforms.",
      color: "var(--accent-amber)",
    },
    {
      icon: <FiSearch size={20} />,
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
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* === Background Elements === */}
      <div 
        className="absolute top-[20%] left-[5%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle, rgba(244, 63, 94, 0.08), transparent 70%)', 
          filter: 'blur(60px)' 
        }}
      />
      <div 
        className="absolute bottom-[10%] right-[10%] w-[250px] h-[250px] rounded-full pointer-events-none"
        style={{ 
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1), transparent 70%)', 
          filter: 'blur(60px)' 
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
              backgroundColor: 'rgba(244, 63, 94, 0.1)', 
              borderColor: 'rgba(244, 63, 94, 0.2)' 
            }}
          >
            <FiX size={14} style={{ color: 'var(--accent-rose)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--accent-rose)' }}>
              The Problem
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Note-taking is{" "}
            <span style={{ color: 'var(--accent-rose)' }}>broken</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Before <span className="font-medium" style={{ color: 'var(--accent-indigo)' }}>NoteStream</span>, 
            finding insights meant scrolling through chaos.
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
              className="group relative rounded-2xl p-6 border transition-all duration-300"
              style={{ 
                backgroundColor: 'var(--bg-surface)', 
                borderColor: 'var(--border-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${problem.color}40`;
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-secondary)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* X mark in corner */}
              <div 
                className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${problem.color}15` }}
              >
                <FiX size={12} style={{ color: problem.color }} />
              </div>

              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${problem.color}15`, color: problem.color }}
              >
                {problem.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {problem.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
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
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <FiArrowRight 
                size={20} 
                style={{ color: 'var(--accent-indigo)', transform: 'rotate(90deg)' }} 
              />
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
              backgroundColor: 'rgba(99, 102, 241, 0.1)', 
              borderColor: 'rgba(99, 102, 241, 0.2)' 
            }}
          >
            <Lightning size={14} weight="fill" style={{ color: 'var(--accent-indigo)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--accent-indigo)' }}>
              The Solution
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--accent-indigo)' }}>NoteStream</span> fixes this
          </h2>
          <p className="text-lg max-w-xl mx-auto mb-10" style={{ color: 'var(--text-muted)' }}>
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
                  backgroundColor: 'var(--bg-surface)', 
                  borderColor: 'var(--border-secondary)',
                }}
              >
                <div 
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}
                >
                  <FiCheck size={12} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
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
              background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
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