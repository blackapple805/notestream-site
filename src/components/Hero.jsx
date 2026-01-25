// src/components/Hero.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiZap, FiSearch, FiLock, FiBarChart2, FiCloud, FiCpu,
  FiFileText, FiCheck, FiTrendingUp, FiBell, FiUser,
  FiClock, FiArrowRight
} from "react-icons/fi";
import { Sparkle, Play } from "phosphor-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Hero() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: <FiZap className="w-5 h-5" />,
      title: "Instant Insights",
      desc: "Summarize and visualize your data in seconds with precision AI.",
    },
    {
      icon: <FiSearch className="w-5 h-5" />,
      title: "Smart Organization",
      desc: "AI tags and sorts your notes automatically — stay effortlessly organized.",
    },
    {
      icon: <FiLock className="w-5 h-5" />,
      title: "Private by Design",
      desc: "End-to-end encrypted. Your data is never shared or used for training.",
    },
    {
      icon: <FiBarChart2 className="w-5 h-5" />,
      title: "Analytics Ready",
      desc: "Understand trends instantly and export clean visual summaries.",
    },
    {
      icon: <FiCloud className="w-5 h-5" />,
      title: "Cross-Device Sync",
      desc: "Your workspace stays synced — desktop, tablet, and mobile.",
    },
    {
      icon: <FiCpu className="w-5 h-5" />,
      title: "AI Context Engine",
      desc: "NoteStream learns your workflow and adapts to your focus areas.",
    },
  ];

  // Staggered animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          HERO SECTION - Transparent background
      ═══════════════════════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden"
        style={{ backgroundColor: 'transparent' }}
      >
        {/* === Animated Background Elements === */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Top gradient glow */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          
          {/* Floating orbs */}
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[15%] w-[200px] h-[200px] rounded-full"
            style={{ 
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2), transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <motion.div 
            animate={{ 
              y: [0, 20, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[25%] right-[10%] w-[250px] h-[250px] rounded-full"
            style={{ 
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15), transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
          <motion.div 
            animate={{ 
              y: [0, 15, 0],
              x: [0, 10, 0],
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[40%] right-[20%] w-[150px] h-[150px] rounded-full"
            style={{ 
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1), transparent 70%)',
              filter: 'blur(30px)',
            }}
          />
        </div>

        {/* === Hero Content === */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          className="relative z-10 text-center px-6 pt-28 md:pt-36 max-w-5xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 border backdrop-blur-sm"
              style={{ 
                backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                borderColor: 'rgba(99, 102, 241, 0.25)' 
              }}
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkle size={16} weight="fill" style={{ color: 'var(--accent-indigo)' }} />
              </motion.div>
              <span className="text-sm font-medium" style={{ color: 'var(--accent-indigo)' }}>
                AI-Powered Note Taking
              </span>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Summarize your{" "}
            <span 
              className="relative inline-block"
              style={{ color: 'var(--accent-indigo)' }}
            >
              week
              <motion.svg
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
              >
                <motion.path
                  d="M2 8C50 2 150 2 198 8"
                  stroke="var(--accent-indigo)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                />
              </motion.svg>
            </span>
            <br />
            <span style={{ color: 'var(--accent-indigo)' }}>in seconds</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            Transform chaos into clarity with{" "}
            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              AI that understands context.
            </span>
            <br className="hidden md:block" />
            Build summaries, insights, and reports — automatically.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <motion.button 
              whileHover={{ scale: 1.03, boxShadow: "0 8px 30px rgba(99, 102, 241, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/signup")}
              className="group px-8 py-4 rounded-full font-semibold text-lg text-white transition-all duration-300 flex items-center justify-center gap-2"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
              }}
            >
              Get Started Free
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.03, borderColor: "var(--accent-indigo)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/how-it-works")}
              className="group px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 border flex items-center justify-center gap-2 backdrop-blur-sm"
              style={{ 
                color: 'var(--text-secondary)', 
                borderColor: 'rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              <Play size={20} weight="fill" className="group-hover:text-indigo-400 transition-colors" />
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-6 mt-10"
          >
            {[
              { icon: <FiCheck size={14} />, text: "No credit card required" },
              { icon: <FiLock size={14} />, text: "256-bit encryption" },
              { icon: <FiZap size={14} />, text: "Setup in 30 seconds" },
            ].map((item, i) => (
              <div 
                key={i}
                className="flex items-center gap-2 text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                <span style={{ color: 'var(--accent-emerald)' }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* === Animated Dashboard Preview === */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ 
            opacity: isLoaded ? 1 : 0, 
            y: isLoaded ? 0 : 60, 
            scale: isLoaded ? 1 : 0.95 
          }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 mt-16 md:mt-20 w-[95%] max-w-5xl mx-auto"
        >
          <DashboardMockup />
          
          {/* Glow under dashboard */}
          <div 
            className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-[100px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.2), transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
        </motion.div>

        {/* === Features Section === */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative z-20 text-center px-6 mt-32 md:mt-40 pb-20 max-w-6xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Designed for{" "}
              <span style={{ color: 'var(--accent-indigo)' }}>Clarity</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto mb-16" style={{ color: 'var(--text-muted)' }}>
              Every feature in{" "}
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>NoteStream</span>{" "}
              helps simplify how you manage knowledge.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="group rounded-2xl p-6 transition-all duration-300 text-center flex flex-col items-center"
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 mx-auto"
              style={{
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                color: "var(--accent-indigo)",
              }}
            >
              {f.icon}
            </div>

            {/* Title */}
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              {f.title}
            </h3>

            {/* Description */}
            <p
              className="text-sm leading-relaxed max-w-[28ch]"
              style={{ color: "var(--text-muted)" }}
            >
              {f.desc}
            </p>
          </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* === Divider === */}
      <div style={{ borderTop: '1px solid var(--border-secondary)' }} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   ANIMATED DASHBOARD MOCKUP COMPONENT
═══════════════════════════════════════════════════════════ */
function DashboardMockup() {
  const [activeNote, setActiveNote] = useState(0);
  
  const notes = [
    { title: "Team Meeting Notes", time: "Just now", tag: "Work", hasAI: true },
    { title: "Project Roadmap Ideas", time: "2h ago", tag: "Planning", hasAI: false },
    { title: "Research Summary", time: "Yesterday", tag: "Research", hasAI: true },
  ];

  const stats = [
    { label: "Notes", value: "23", trend: "+5", color: "var(--accent-indigo)" },
    { label: "Summaries", value: "12", trend: "+3", color: "var(--accent-purple)" },
    { label: "Streak", value: "7d", trend: "🔥", color: "var(--accent-amber)" },
  ];

  // Auto-cycle through notes
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNote((prev) => (prev + 1) % notes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className="rounded-3xl overflow-hidden border"
      style={{ 
        backgroundColor: 'rgba(var(--bg-surface-rgb), 0.8)',
        backdropFilter: 'blur(20px)',
        borderColor: 'var(--border-secondary)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.05) inset',
      }}
    >
      {/* Window Chrome */}
      <div 
        className="flex items-center gap-2 px-5 py-3.5 border-b"
        style={{ 
          borderColor: 'var(--border-secondary)',
          backgroundColor: 'rgba(var(--bg-surface-rgb), 0.5)',
        }}
      >
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ffbd2e' }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28ca42' }} />
        </div>
        <div className="flex-1 flex justify-center">
          <div 
            className="px-4 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
          >
            app.notestream.ai
          </div>
        </div>
        <div className="w-16" />
      </div>

      {/* Dashboard Content */}
      <div className="p-5 md:p-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
              }}
            >
              <FiFileText className="text-white" size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Good morning ☀️
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                3 notes created today
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}
            >
              <FiBell size={16} style={{ color: 'var(--text-muted)' }} />
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-emerald), #059669)',
              }}
            >
              <FiUser size={16} className="text-white" />
            </motion.div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="rounded-xl p-4 border"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)', 
                borderColor: 'var(--border-secondary)' 
              }}
            >
              <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</span>
                {stat.trend && (
                  <span className="text-xs font-medium" style={{ color: 'var(--accent-emerald)' }}>
                    {stat.trend}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Notes List */}
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Recent Notes
              </p>
              <p className="text-xs cursor-pointer hover:underline" style={{ color: 'var(--accent-indigo)' }}>
                View all →
              </p>
            </div>
            {notes.map((note, i) => (
              <motion.div
                key={note.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                className="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200"
                style={{ 
                  backgroundColor: activeNote === i ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-tertiary)',
                  borderColor: activeNote === i ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-secondary)',
                  transform: activeNote === i ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: activeNote === i ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
                    border: '1px solid var(--border-secondary)',
                  }}
                >
                  <FiFileText size={18} style={{ color: 'var(--accent-indigo)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {note.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{note.time}</p>
                </div>
                {note.hasAI && (
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1"
                    style={{ 
                      backgroundColor: 'rgba(99, 102, 241, 0.15)', 
                      color: 'var(--accent-indigo)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                    }}
                  >
                    <Sparkle size={10} weight="fill" />
                    AI
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* AI Summary Panel */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="md:col-span-2 rounded-xl p-4 border"
            style={{ 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.05))',
              borderColor: 'rgba(99, 102, 241, 0.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))',
                }}
              >
                <Sparkle size={18} weight="fill" className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  AI Insights
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Updated just now
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {[
                { icon: <FiCheck size={14} />, color: 'var(--accent-emerald)', text: "3 action items identified" },
                { icon: <FiTrendingUp size={14} />, color: 'var(--accent-amber)', text: "Productivity up 23%" },
                { icon: <FiClock size={14} />, color: 'var(--accent-purple)', text: "Review due: Tomorrow 3 PM" },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4 + i * 0.1 }}
                >
                  <span style={{ color: item.color, marginTop: 1 }}>{item.icon}</span>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)',
              }}
            >
              <Sparkle size={14} weight="fill" />
              Generate Full Report
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}