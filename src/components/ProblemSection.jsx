import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { FiAlertCircle, FiClock, FiLayers, FiZap } from "react-icons/fi";

export default function ProblemSection() {
  const navigate = useNavigate();
  
  // NEW smooth fade-up animation
  const fadeSoft = {
    hidden: { opacity: 0, y: 30, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  const leftRef = useRef(null);
  const rightRef = useRef(null);

  const leftInView = useInView(leftRef, { amount: 0.3 });
  const rightInView = useInView(rightRef, { amount: 0.3 });

  return (
    <section
      id="problem"
      className="relative flex flex-col md:flex-row items-center justify-center gap-16 md:gap-24 px-8 md:px-20 py-[16vh] text-theme-primary overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* === Floating Background Glows === */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        className="absolute top-[10%] left-[8%] w-[220px] h-[220px] bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
        className="absolute bottom-[15%] right-[8%] w-[200px] h-[200px] bg-purple-500/15 rounded-full blur-3xl pointer-events-none"
      />

      {/* === Left Side: Illustration === */}
      <motion.div
        ref={leftRef}
        variants={fadeSoft}
        initial="hidden"
        animate={leftInView ? "visible" : "hidden"}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative flex items-center justify-center w-[260px] h-[260px] md:w-[320px] md:h-[320px] rounded-3xl backdrop-blur-md border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.2)] hover:shadow-[0_0_70px_rgba(99,102,241,0.3)] transition-transform duration-700 hover:scale-[1.05]"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/10 to-transparent rounded-3xl blur-2xl pointer-events-none" />
        <motion.div
          animate={{ rotate: [0, 8, -8, 0], y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
        >
          <FiAlertCircle className="text-indigo-500 w-20 h-20 relative z-10 drop-shadow-[0_0_25px_rgba(99,102,241,0.6)]" />
        </motion.div>
      </motion.div>

      {/* === Right Side: Text === */}
      <motion.div
        ref={rightRef}
        variants={fadeSoft}
        initial="hidden"
        animate={rightInView ? "visible" : "hidden"}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-2xl text-center md:text-left relative z-10"
      >
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight text-theme-primary">
          The Problem We{" "}
          <span className="text-indigo-500">
            Solve
          </span>
        </h2>

        <p className="text-theme-muted text-lg mb-10 leading-relaxed max-w-xl">
          Before <span className="text-indigo-500 font-semibold">NoteStream</span>, finding insights
          meant scrolling through chaos. We turn that noise into clarity — instantly.
        </p>

        {/* === Staggered List === */}
        <motion.ul
          initial="hidden"
          animate={rightInView ? "visible" : "hidden"}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
          }}
          className="space-y-5 text-theme-secondary text-base"
        >
          {[
            {
              icon: <FiClock className="text-indigo-500 mt-1 w-5 h-5 shrink-0" />,
              text: "Hours lost sorting and reviewing notes.",
            },
            {
              icon: <FiLayers className="text-indigo-500 mt-1 w-5 h-5 shrink-0" />,
              text: "Insights buried across tools and folders.",
            },
            {
              icon: <FiZap className="text-indigo-500 mt-1 w-5 h-5 shrink-0" />,
              text: (
                <>
                  <span className="text-indigo-500 font-semibold">NoteStream</span> connects it all
                  — fast, clear, and effortless.
                </>
              ),
            },
          ].map((item, i) => (
            <motion.li
              key={i}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.98 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              whileHover={{ scale: 1.03 }}
              className="flex items-start gap-3"
            >
              {item.icon}
              {item.text}
            </motion.li>
          ))}
        </motion.ul>

        {/* === CTA Button === */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate("/smart-notes")}
          className="inline-block mt-10 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-[1rem] px-8 py-3.5 rounded-full shadow-lg shadow-indigo-500/25 hover:opacity-90 transition-all"
        >
          Explore Smart Notes
        </motion.button>
      </motion.div>
    </section>
  );
}