// src/pages/AISummary.jsx
import { FiZap, FiEdit3, FiFeather, FiList } from "react-icons/fi";
import ScrollReveal from "../components/ScrollReveal";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function AISummary() {
  const [animateText, setAnimateText] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateText(true), 700);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: <FiEdit3 className="text-indigo-400 w-7 h-7" />,
      title: "Instant Smart Summary",
      desc: "Condense long notes into clear, structured summaries in seconds.",
    },
    {
      icon: <FiList className="text-indigo-400 w-7 h-7" />,
      title: "Key Action Item Extraction",
      desc: "Auto-identifies decisions, deadlines, and tasks from any text.",
    },
    {
      icon: <FiFeather className="text-indigo-400 w-7 h-7" />,
      title: "Tone + Context Awareness",
      desc: "Understands nuance — sentiment, urgency, and writing style.",
    },
  ];

  const beforeText = `Meeting notes:
- client unhappy with timeline
- need marketing assets soon
- backend bug unresolved
- ask Sarah about analytics update
- contract renewal may be delayed`;

  const afterText = [
    "Timeline risk — client expecting earlier delivery.",
    "Marketing assets required immediately.",
    "Engineering: unresolved backend issue.",
    "Follow up with Sarah on analytics dashboard.",
    "Renewal impacted by current delays.",
  ];

  return (
    <section
      className="relative min-h-screen text-white px-6 py-[18vh] overflow-hidden"
      style={{
        backgroundColor: "#0d0d10",
        backgroundImage: "url('/assets/images/smooth-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
      }}
    >
      {/* BG Glows */}
      <div className="absolute top-[8%] left-[10%] w-[280px] h-[280px] bg-indigo-500/25 blur-[140px] rounded-full"></div>
      <div className="absolute bottom-[10%] right-[8%] w-[240px] h-[240px] bg-purple-500/20 blur-[130px] rounded-full"></div>

      {/* Title */}
      <ScrollReveal>
        <h1 className="text-4xl md:text-6xl font-extrabold text-center mb-6">
          Smarter <span className="text-indigo-400">Summaries</span> Powered by{" "}
          <span className="text-indigo-300">AI</span>
        </h1>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto text-center mb-20">
          Turn long, messy notes into clear insights. NoteStream’s AI doesn’t just summarize —
          it understands, rewrites, and highlights what actually matters.
        </p>
      </ScrollReveal>

      {/* Feature Cards */}
      <ScrollReveal delay={0.15}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto mb-20">
          {features.map((f, i) => (
            <div
              key={i}
              className="group bg-[#111114]/70 border border-[#1f1f25] rounded-2xl p-8 
              backdrop-blur-md hover:-translate-y-2 hover:border-indigo-500/50 
              shadow-[0_0_25px_rgba(99,102,241,0.08)] hover:shadow-[0_0_50px_rgba(99,102,241,0.25)] 
              transition-all duration-500"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1b1b25] mb-5 
              group-hover:bg-indigo-500/20 transition-all duration-300">
                {f.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-indigo-400 transition">
                {f.title}
              </h3>
              <p className="text-gray-400 text-[0.95rem] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* BEFORE → AFTER TRANSFORMATION */}
      <ScrollReveal delay={0.2}>
        <div className="max-w-5xl mx-auto bg-[#111114]/70 border border-[#1f1f25] rounded-2xl p-10 
        shadow-[0_0_40px_rgba(99,102,241,0.18)] backdrop-blur-md mb-20">
          <h2 className="text-3xl font-bold text-indigo-400 mb-8">
            See AI Summary Transform Your Notes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* BEFORE BOX */}
            <div className="bg-[#0e0e12]/60 p-6 rounded-xl border border-[#1f1f25]">
              <h3 className="text-indigo-300 text-lg font-semibold mb-3">Before</h3>
              <p className="text-gray-400 whitespace-pre-line text-sm leading-relaxed">
                {beforeText}
              </p>
            </div>

            {/* AFTER BOX */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={animateText ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="bg-[#0e0e12]/60 p-6 rounded-xl border border-[#1f1f25]"
            >
              <h3 className="text-indigo-300 text-lg font-semibold mb-3">After</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                {afterText.map((line, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <FiZap className="text-indigo-400 mt-[2px]" />
                    {line}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal delay={0.25}>
        <div className="text-center mt-10">
          <button className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 
          hover:to-indigo-500 text-white px-10 py-4 rounded-full font-semibold text-lg 
          shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_45px_rgba(99,102,241,0.4)] 
          transition-all duration-300 hover:scale-[1.05] flex items-center gap-2 mx-auto">
            Try AI Summary <FiZap className="w-5 h-5 text-white" />
          </button>
        </div>
      </ScrollReveal>
    </section>
  );
}
