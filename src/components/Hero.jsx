// src/components/Hero.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiZap, FiSearch, FiLock, FiBarChart2, FiCloud, FiCpu,
  FiFileText, FiCheck, FiTrendingUp, FiBell, FiUser,
  FiFolder, FiStar, FiClock
} from "react-icons/fi";
import { Sparkle } from "phosphor-react";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

export default function Hero() {
  const navigate = useNavigate();
  const [animate, setAnimate] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <FiZap className="w-6 h-6" style={{ color: 'var(--accent-indigo)' }} />,
      title: "Instant Insights",
      desc: "Summarize and visualize your data in seconds with precision AI.",
    },
    {
      icon: <FiSearch className="w-6 h-6" style={{ color: 'var(--accent-indigo)' }} />,
      title: "Smart Organization",
      desc: "AI tags and sorts your notes automatically — stay effortlessly organized.",
    },
    {
      icon: <FiLock className="w-6 h-6" style={{ color: 'var(--accent-indigo)' }} />,
      title: "Private by Design",
      desc: "End-to-end encrypted. Your data is never shared or used for training.",
    },
    {
      icon: <FiBarChart2 className="w-6 h-6" style={{ color: 'var(--accent-indigo)' }} />,
      title: "Analytics Ready",
      desc: "Understand trends instantly and export clean visual summaries.",
    },
    {
      icon: <FiCloud className="w-6 h-6" style={{ color: 'var(--accent-indigo)' }} />,
      title: "Cross-Device Sync",
      desc: "Your workspace stays synced — desktop, tablet, and mobile.",
    },
    {
      icon: <FiCpu className="w-6 h-6" style={{ color: 'var(--accent-indigo)' }} />,
      title: "AI Context Engine",
      desc: "NoteStream learns your workflow and adapts to your focus areas.",
    },
  ];

  return (
    <>
      <section
        id="hero"
        className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* === Background Glows === */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark 
              ? 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99, 102, 241, 0.15), transparent)'
              : 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99, 102, 241, 0.1), transparent)'
          }}
        />
        <div className="absolute top-[15%] left-[10%] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%)', filter: 'blur(60px)' }}
        />
        <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12), transparent 70%)', filter: 'blur(60px)' }}
        />

        {/* === Hero Content === */}
        <div
          className={`relative z-10 text-center px-6 pt-28 md:pt-32 transition-all duration-700 ${
            animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <ScrollReveal>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 border"
              style={{ 
                backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                borderColor: 'rgba(99, 102, 241, 0.2)' 
              }}
            >
              <Sparkle size={16} weight="fill" style={{ color: 'var(--accent-indigo)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--accent-indigo)' }}>
                AI-Powered Note Taking
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Summarize your{" "}
              <span style={{ color: 'var(--accent-indigo)' }}>week</span>
              <br />
              <span style={{ color: 'var(--accent-indigo)' }}>in seconds</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              Transform chaos into clarity with{" "}
              <span className="font-medium" style={{ color: 'var(--accent-indigo)' }}>AI that understands context.</span>
              <br className="hidden md:block" />
              Build summaries, insights, and reports — automatically.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.25}>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => navigate("/signup")}
                className="px-8 py-3.5 rounded-full font-semibold text-lg text-white transition-all duration-300 hover:scale-[1.02]"
                style={{ 
                  background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
                }}
              >
                Get Started
              </button>
              <button 
                onClick={() => navigate("/how-it-works")}
                className="px-8 py-3.5 rounded-full font-semibold text-lg transition-all duration-300 border"
                style={{ 
                  color: 'var(--text-secondary)', 
                  borderColor: 'var(--border-secondary)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-indigo)';
                  e.currentTarget.style.color = 'var(--accent-indigo)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-secondary)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                See How It Works
              </button>
            </div>
          </ScrollReveal>
        </div>

        {/* === Animated Dashboard Preview === */}
        <ScrollReveal delay={0.3} y={60}>
          <div className={`relative z-10 mt-16 md:mt-20 w-[95%] max-w-5xl mx-auto transition-all duration-1000 ${
            animate ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}>
            <DashboardMockup isDark={isDark} />
          </div>
        </ScrollReveal>

        {/* === Features Section === */}
        <ScrollReveal delay={0.35}>
          <div className="relative z-20 text-center px-6 mt-24 md:mt-32 pb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Designed for <span style={{ color: 'var(--accent-indigo)' }}>Clarity</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto mb-16" style={{ color: 'var(--text-muted)' }}>
              Every feature in <span className="font-medium" style={{ color: 'var(--accent-indigo)' }}>NoteStream</span> helps
              simplify how you manage knowledge.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((f, i) => (
                <ScrollReveal key={i} delay={0.08 * i} y={30}>
                  <div 
                    className="group rounded-2xl p-6 transition-all duration-300 border hover:-translate-y-1"
                    style={{ 
                      backgroundColor: 'var(--bg-surface)', 
                      borderColor: 'var(--border-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-secondary)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
                      style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                    >
                      {f.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* === Divider === */}
      <div style={{ borderTop: '1px solid var(--border-secondary)' }} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   ANIMATED DASHBOARD MOCKUP COMPONENT
═══════════════════════════════════════════════════════════ */
function DashboardMockup({ isDark }) {
  const [activeNote, setActiveNote] = useState(0);
  
  const notes = [
    { title: "Team Meeting Notes", time: "Just now", tag: "Work", hasAI: true },
    { title: "Project Roadmap Ideas", time: "2h ago", tag: "Planning", hasAI: false },
    { title: "Research Summary", time: "Yesterday", tag: "Research", hasAI: true },
  ];

  const stats = [
    { label: "Notes", value: "23", trend: "+5" },
    { label: "Summaries", value: "12", trend: "+3" },
    { label: "Streak", value: "7d", trend: "" },
  ];

  // Auto-cycle through notes
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNote((prev) => (prev + 1) % notes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="rounded-2xl overflow-hidden border"
      style={{ 
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-secondary)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.25), 0 0 60px rgba(99, 102, 241, 0.15)',
      }}
    >
      {/* Window Chrome */}
      <div 
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: 'var(--border-secondary)' }}
      >
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ffbd2e' }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28ca42' }} />
        </div>
        <div className="flex-1 flex justify-center">
          <div 
            className="px-4 py-1 rounded-lg text-xs font-medium"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
          >
            NoteStream Dashboard
          </div>
        </div>
        <div className="w-16" /> {/* Spacer for symmetry */}
      </div>

      {/* Dashboard Content */}
      <div className="p-4 md:p-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))',
              }}
            >
              <FiFileText className="text-white" size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Good morning</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>3 notes today</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <FiBell size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--bg-tertiary)' }}
            >
              <FiUser size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="rounded-xl p-3 border"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)', 
                borderColor: 'var(--border-secondary)' 
              }}
            >
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</span>
                {stat.trend && (
                  <span className="text-xs font-medium" style={{ color: 'var(--accent-emerald)' }}>{stat.trend}</span>
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
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Notes</p>
              <p className="text-xs" style={{ color: 'var(--accent-indigo)' }}>View all →</p>
            </div>
            {notes.map((note, i) => (
              <motion.div
                key={note.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  scale: activeNote === i ? 1.02 : 1,
                  borderColor: activeNote === i ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-secondary)',
                }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
                className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer"
                style={{ 
                  backgroundColor: activeNote === i ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-tertiary)',
                  borderColor: 'var(--border-secondary)',
                }}
              >
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                >
                  <FiFileText size={16} style={{ color: 'var(--accent-indigo)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{note.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{note.time}</p>
                </div>
                {note.hasAI && (
                  <div 
                    className="px-2 py-1 rounded-md text-[10px] font-medium flex items-center gap-1"
                    style={{ 
                      backgroundColor: 'rgba(99, 102, 241, 0.15)', 
                      color: 'var(--accent-indigo)' 
                    }}
                  >
                    <Sparkle size={10} weight="fill" />
                    AI Ready
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* AI Summary Panel */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="md:col-span-2 rounded-xl p-4 border"
            style={{ 
              backgroundColor: 'rgba(99, 102, 241, 0.05)', 
              borderColor: 'rgba(99, 102, 241, 0.2)' 
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
              >
                <Sparkle size={16} weight="fill" style={{ color: 'var(--accent-indigo)' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--accent-indigo)' }}>AI Summary</p>
            </div>
            
            <div className="space-y-2">
              <motion.div 
                className="flex items-start gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
              >
                <FiCheck size={14} style={{ color: 'var(--accent-emerald)', marginTop: 2 }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  3 action items identified from today's meeting
                </p>
              </motion.div>
              <motion.div 
                className="flex items-start gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <FiTrendingUp size={14} style={{ color: 'var(--accent-amber)', marginTop: 2 }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Productivity up 23% this week
                </p>
              </motion.div>
              <motion.div 
                className="flex items-start gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
              >
                <FiClock size={14} style={{ color: 'var(--accent-purple)', marginTop: 2 }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Review deadline: Tomorrow 3 PM
                </p>
              </motion.div>
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="w-full mt-4 py-2 rounded-lg text-xs font-medium text-white"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))',
              }}
            >
              Generate Full Report
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}