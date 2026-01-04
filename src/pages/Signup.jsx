// src/pages/Signup.jsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FiLock, FiBarChart2, FiZap, FiUser, FiMail } from "react-icons/fi";

export default function SignupPage() {
  const fadeVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const leftInView = useInView(leftRef, { amount: 0.25 });
  const rightInView = useInView(rightRef, { amount: 0.25 });

  return (
    <section
      id="signup-page"
      className="relative flex flex-col lg:flex-row items-center justify-center w-full text-theme-primary py-[12vh] px-6 overflow-hidden min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Background glows */}
      <div className="absolute top-[12%] left-[8%] w-[260px] h-[260px] bg-indigo-500/20 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[8%] w-[220px] h-[220px] bg-purple-500/15 blur-[140px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row justify-center items-stretch gap-10 relative z-10">

        {/* ========================================================= */}
        {/* LEFT: SIGNUP FORM (MAIN CTA) */}
        {/* ========================================================= */}
        <motion.div
          ref={leftRef}
          variants={fadeVariants}
          initial="hidden"
          animate={leftInView ? "visible" : "hidden"}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col justify-center w-full lg:w-[50%] rounded-2xl p-10 max-w-[520px] mx-auto border"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-secondary)',
            boxShadow: '0 0 60px rgba(99,102,241,0.1)'
          }}
        >
          <h2 className="text-[2rem] md:text-[2.4rem] font-extrabold mb-2 leading-tight text-theme-primary">
            Create Your <span className="text-indigo-500">NoteStream</span> Account
          </h2>

          <p className="text-theme-muted mb-8 leading-relaxed text-[1rem]">
            Access analytics, secure uploads, and AI insights that help you understand your notes instantly.
          </p>

          <form className="space-y-6">
            {/* FULL NAME */}
            <div>
              <label className="text-sm text-theme-secondary mb-2 block">Full Name</label>
              <div 
                className="flex items-center rounded-full px-5 py-3 
                           focus-within:ring-2 focus-within:ring-indigo-500/50
                           transition-all duration-300 border"
                style={{ 
                  backgroundColor: 'var(--bg-input)', 
                  borderColor: 'var(--border-secondary)' 
                }}
              >
                <FiUser className="text-indigo-500 w-5 h-5 mr-3" />
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-transparent text-theme-primary placeholder:text-theme-muted text-[1rem] outline-none"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-sm text-theme-secondary mb-2 block">Email</label>
              <div 
                className="flex items-center rounded-full px-5 py-3 
                           focus-within:ring-2 focus-within:ring-indigo-500/50
                           transition-all duration-300 border"
                style={{ 
                  backgroundColor: 'var(--bg-input)', 
                  borderColor: 'var(--border-secondary)' 
                }}
              >
                <FiMail className="text-indigo-500 w-5 h-5 mr-3" />
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="w-full bg-transparent text-theme-primary placeholder:text-theme-muted text-[1rem] outline-none"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm text-theme-secondary mb-2 block">Password</label>
              <div 
                className="flex items-center rounded-full px-5 py-3 
                           focus-within:ring-2 focus-within:ring-indigo-500/50
                           transition-all duration-300 border"
                style={{ 
                  backgroundColor: 'var(--bg-input)', 
                  borderColor: 'var(--border-secondary)' 
                }}
              >
                <FiLock className="text-indigo-500 w-5 h-5 mr-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-transparent text-theme-primary placeholder:text-theme-muted text-[1rem] outline-none"
                />
              </div>
            </div>

            {/* SIGNUP CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3.5 rounded-full font-semibold 
                         bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[1rem] 
                         shadow-lg shadow-indigo-500/25 hover:opacity-90 transition-all"
            >
              Create Account
            </motion.button>
          </form>

          <p className="text-theme-muted text-sm text-center mt-6">
            Already have an account?{" "}
            <a href="/login" className="text-indigo-500 hover:underline">
              Log in
            </a>
          </p>
        </motion.div>

        {/* ========================================================= */}
        {/* RIGHT: WHY SIGN UP / FEATURE BADGES */}
        {/* ========================================================= */}
        <motion.div
          ref={rightRef}
          variants={fadeVariants}
          initial="hidden"
          animate={rightInView ? "visible" : "hidden"}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="flex flex-col justify-center items-center w-full lg:w-[50%] 
                     rounded-2xl p-10 max-w-[520px] mx-auto text-center border"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-secondary)',
            boxShadow: '0 0 60px rgba(99,102,241,0.1)'
          }}
        >
          <h3 className="text-[1.8rem] md:text-[2rem] font-semibold text-indigo-500 mb-4">
            Why Sign Up?
          </h3>

          <p className="text-theme-muted max-w-md mb-10 leading-relaxed text-[1rem]">
            NoteStream helps you organize your notes, track your insights, 
            and use AI-powered clarity tools in a unified workspace.
          </p>

          {/* Feature Icons */}
          <motion.div
            initial="hidden"
            animate={rightInView ? "visible" : "hidden"}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.2, delayChildren: 0.1 },
              },
            }}
            className="grid grid-cols-3 gap-8 text-center w-full max-w-[320px]"
          >
            {[
              { icon: <FiLock className="text-indigo-500 w-7 h-7" />, label: "Secure" },
              { icon: <FiBarChart2 className="text-indigo-500 w-7 h-7" />, label: "Analytics" },
              { icon: <FiZap className="text-indigo-500 w-7 h-7" />, label: "Fast" },
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 30, scale: 0.9 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                <div 
                  className="flex items-center justify-center w-14 h-14 rounded-2xl 
                             mb-3 hover:border-indigo-500/50 transition-all border"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)', 
                    borderColor: 'var(--border-secondary)' 
                  }}
                >
                  {f.icon}
                </div>
                <p className="text-sm text-theme-muted">{f.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}