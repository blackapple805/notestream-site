import { useEffect, useState } from "react";
import { FiZap, FiSearch, FiLock, FiBarChart2, FiCloud, FiCpu } from "react-icons/fi";
import ScrollReveal from "./ScrollReveal";

export default function Hero() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: <FiZap className="text-indigo-400 w-7 h-7" />,
      title: "Instant Insights",
      desc: "Summarize and visualize your data in seconds with precision AI.",
    },
    {
      icon: <FiSearch className="text-indigo-400 w-7 h-7" />,
      title: "Smart Organization",
      desc: "AI tags and sorts your notes automatically — stay effortlessly organized.",
    },
    {
      icon: <FiLock className="text-indigo-400 w-7 h-7" />,
      title: "Private by Design",
      desc: "End-to-end encrypted. Your data is never shared or used for training.",
    },
    {
      icon: <FiBarChart2 className="text-indigo-400 w-7 h-7" />,
      title: "Analytics Ready",
      desc: "Understand trends instantly and export clean visual summaries.",
    },
    {
      icon: <FiCloud className="text-indigo-400 w-7 h-7" />,
      title: "Cross-Device Sync",
      desc: "Your workspace stays synced — desktop, tablet, and mobile.",
    },
    {
      icon: <FiCpu className="text-indigo-400 w-7 h-7" />,
      title: "AI Context Engine",
      desc: "NoteStream learns your workflow and adapts to your focus areas.",
    },
  ];

  return (
    <>
      <section
        id="hero"
        className="relative flex flex-col items-center justify-center min-h-screen text-white overflow-hidden"
        style={{
          backgroundImage: `url('/assets/images/smooth-bg.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        {/* === Background Overlay + Glow === */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d10]/20 via-[#0d0d10]/60 to-[#0d0d10]/90 pointer-events-none"></div>
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 md:left-[5%] md:translate-x-0 w-[320px] h-[320px] bg-indigo-600/25 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[260px] h-[260px] bg-purple-600/15 blur-[130px] rounded-full"></div>

        {/* === Hero Content === */}
        <div
          className={`relative z-10 text-center px-6 mt-[14vh] md:mt-[18vh] transition-all duration-700 ${
            animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <ScrollReveal>
            <h1 className="text-[2.9rem] md:text-[4.6rem] font-extrabold leading-tight mb-6 tracking-tight">
              Summarize your{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent animate-textGlow">
                week
              </span>{" "}
              <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-500 animate-delaySlide">
                in seconds
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              Transform chaos into clarity with{" "}
              <span className="text-indigo-400 font-medium">AI that understands context.</span>
              <br className="hidden md:block" />
              Build summaries, insights, and reports — automatically.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.25}>
            <div className="flex justify-center gap-6">
              <button className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white px-8 py-3.5 rounded-full font-semibold text-lg shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_45px_rgba(99,102,241,0.4)] transition-all duration-300 hover:scale-[1.05]">
                Get Started
              </button>
              <button className="border border-gray-700 hover:border-indigo-400 text-gray-300 hover:text-indigo-400 px-8 py-3.5 rounded-full font-semibold text-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
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
            <div className="rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.3)] ring-1 ring-indigo-500/20 backdrop-blur-sm hover:shadow-[0_0_60px_rgba(99,102,241,0.4)] transition-all duration-500 hover:scale-[1.01]">
              <img
                src="/assets/images/DashPreview.png"
                alt="Dashboard Preview"
                className="w-full h-auto object-cover brightness-[1.12]"
              />
            </div>
          </div>
        </ScrollReveal>

        {/* === Features Section === */}
        <ScrollReveal delay={0.35}>
          <div className="relative z-20 text-center px-8 mt-[14vh] md:mt-[20vh] pb-[10vh] transition-all duration-1000">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              Designed for <span className="text-indigo-400">Clarity</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-20">
              Every feature in <span className="text-indigo-400 font-medium">NoteStream</span> helps
              simplify how you manage knowledge — clean, intuitive, and AI-powered.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
              {features.map((f, i) => (
                <ScrollReveal key={i} delay={0.1 * i} y={50}>
                  <div className="group bg-[#111114]/70 border border-[#1f1f25] rounded-2xl p-8 backdrop-blur-md hover:-translate-y-2 hover:border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.08)] hover:shadow-[0_0_50px_rgba(99,102,241,0.25)] transition-all duration-500">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1b1b25] mb-5 group-hover:bg-indigo-500/20 transition-all duration-300">
                      {f.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-indigo-400 transition">
                      {f.title}
                    </h3>
                    <p className="text-gray-400 text-[0.95rem] leading-relaxed">{f.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* === Gradient Connector (into next section) === */}
        <div className="absolute bottom-0 left-0 w-full h-[100px] bg-gradient-to-b from-[#0d0d10]/90 to-[#0d0d10]" />
      </section>

      {/* === Divider under Hero (matches footer) === */}
      <div className="w-full border-t border-[#1f1f25]" />
    </>
  );
}
