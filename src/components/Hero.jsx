import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiZap, FiSearch, FiLock, FiBarChart2, FiCloud, FiCpu } from "react-icons/fi";
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
      icon: <FiZap className="text-indigo-500 w-7 h-7" />,
      title: "Instant Insights",
      desc: "Summarize and visualize your data in seconds with precision AI.",
    },
    {
      icon: <FiSearch className="text-indigo-500 w-7 h-7" />,
      title: "Smart Organization",
      desc: "AI tags and sorts your notes automatically — stay effortlessly organized.",
    },
    {
      icon: <FiLock className="text-indigo-500 w-7 h-7" />,
      title: "Private by Design",
      desc: "End-to-end encrypted. Your data is never shared or used for training.",
    },
    {
      icon: <FiBarChart2 className="text-indigo-500 w-7 h-7" />,
      title: "Analytics Ready",
      desc: "Understand trends instantly and export clean visual summaries.",
    },
    {
      icon: <FiCloud className="text-indigo-500 w-7 h-7" />,
      title: "Cross-Device Sync",
      desc: "Your workspace stays synced — desktop, tablet, and mobile.",
    },
    {
      icon: <FiCpu className="text-indigo-500 w-7 h-7" />,
      title: "AI Context Engine",
      desc: "NoteStream learns your workflow and adapts to your focus areas.",
    },
  ];

  return (
    <>
      <section
        id="hero"
        className="relative flex flex-col items-center justify-center min-h-screen text-theme-primary overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* === Background Overlay + Glow === */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark 
              ? 'linear-gradient(to bottom, rgba(13,13,16,0.2), rgba(13,13,16,0.6), rgba(13,13,16,0.9))'
              : 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.6), rgba(255,255,255,0.9))'
          }}
        ></div>
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 md:left-[5%] md:translate-x-0 w-[320px] h-[320px] bg-indigo-500/20 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[260px] h-[260px] bg-purple-500/15 blur-[130px] rounded-full pointer-events-none"></div>

        {/* === Hero Content === */}
        <div
          className={`relative z-10 text-center px-6 mt-[14vh] md:mt-[18vh] transition-all duration-700 ${
            animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <ScrollReveal>
            <h1 className="text-[2.9rem] md:text-[4.6rem] font-extrabold leading-tight mb-6 tracking-tight text-theme-primary">
              Summarize your{" "}
              <span className="text-indigo-500">
                week
              </span>{" "}
              <br className="hidden md:block" />
              <span className="text-indigo-500">
                in seconds
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <p className="text-theme-muted text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              Transform chaos into clarity with{" "}
              <span className="text-indigo-500 font-medium">AI that understands context.</span>
              <br className="hidden md:block" />
              Build summaries, insights, and reports — automatically.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.25}>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
              <button 
                onClick={() => navigate("/signup")}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 text-white px-8 py-3.5 rounded-full font-semibold text-lg shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02]"
              >
                Get Started
              </button>
              <button 
                onClick={() => navigate("/how-it-works")}
                className="text-theme-secondary hover:text-indigo-500 px-8 py-3.5 rounded-full font-semibold text-lg transition-all duration-300 border"
                style={{ borderColor: 'var(--border-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgb(99, 102, 241)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-secondary)'}
              >
                See How It Works
              </button>
            </div>
          </ScrollReveal>
        </div>

        {/* === Dashboard Preview === */}
        <ScrollReveal delay={0.3} y={60}>
          <div
            className={`relative z-10 mt-[10vh] md:mt-[12vh] w-[92%] max-w-5xl mx-auto transition-all duration-1000 delay-700 ${
                animate ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <div 
              className="rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/20 backdrop-blur-sm hover:shadow-[0_0_60px_rgba(99,102,241,0.35)] transition-all duration-500 hover:scale-[1.01]"
            >
              <img
                src="/assets/images/DashPreview.png"
                alt="Dashboard Preview"
                className="w-full h-auto object-cover"
                style={{ filter: isDark ? 'brightness(1.12)' : 'brightness(1)' }}
              />
            </div>
          </div>
        </ScrollReveal>

        {/* === Features Section === */}
        <ScrollReveal delay={0.35}>
          <div className="relative z-20 text-center px-8 mt-[14vh] md:mt-[20vh] pb-[10vh] transition-all duration-1000">
            <h2 className="text-4xl md:text-5xl font-extrabold text-theme-primary mb-6">
              Designed for <span className="text-indigo-500">Clarity</span>
            </h2>
            <p className="text-theme-muted text-lg max-w-2xl mx-auto mb-20">
              Every feature in <span className="text-indigo-500 font-medium">NoteStream</span> helps
              simplify how you manage knowledge — clean, intuitive, and AI-powered.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {features.map((f, i) => (
                <ScrollReveal key={i} delay={0.1 * i} y={50}>
                  <div 
                    className="group rounded-2xl p-8 backdrop-blur-md hover:-translate-y-2 hover:border-indigo-500/40 shadow-[0_0_25px_rgba(99,102,241,0.06)] hover:shadow-[0_0_50px_rgba(99,102,241,0.15)] transition-all duration-500 border"
                    style={{ 
                      backgroundColor: 'var(--bg-card)', 
                      borderColor: 'var(--border-secondary)' 
                    }}
                  >
                    <div 
                      className="flex items-center justify-center w-12 h-12 rounded-xl mb-5 group-hover:bg-indigo-500/20 transition-all duration-300"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    >
                      {f.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-theme-primary mb-3 group-hover:text-indigo-500 transition">
                      {f.title}
                    </h3>
                    <p className="text-theme-muted text-[0.95rem] leading-relaxed">{f.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* === Gradient Connector (into next section) === */}
        <div 
          className="absolute bottom-0 left-0 w-full h-[100px] pointer-events-none"
          style={{
            background: isDark 
              ? 'linear-gradient(to bottom, transparent, var(--bg-primary))'
              : 'linear-gradient(to bottom, transparent, var(--bg-primary))'
          }}
        />
      </section>

      {/* === Divider under Hero === */}
      <div 
        className="w-full"
        style={{ borderTop: '1px solid var(--border-secondary)' }}
      />
    </>
  );
}