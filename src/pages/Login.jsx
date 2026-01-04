// src/pages/Login.jsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiLock, FiMail, FiSmile, FiTrendingUp } from "react-icons/fi";

export default function LoginPage() {
  const navigate = useNavigate();

  const fadeVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  };

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const leftInView = useInView(leftRef, { amount: 0.25 });
  const rightInView = useInView(rightRef, { amount: 0.25 });

  // === TEMPORARY LOGIN HANDLER FOR TESTING ===
  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <section
      id="login-page"
      className="relative flex flex-col lg:flex-row items-center justify-center w-full text-theme-primary py-[12vh] px-6 overflow-hidden min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Glows */}
      <div className="absolute top-[12%] left-[8%] w-[260px] h-[260px] bg-indigo-500/20 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[220px] h-[220px] bg-blue-500/15 blur-[140px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row justify-center items-stretch gap-10 relative z-10">

        {/* ========================================================= */}
        {/* LEFT: WELCOME BACK MESSAGE */}
        {/* ========================================================= */}
        <motion.div
          ref={leftRef}
          variants={fadeVariants}
          initial="hidden"
          animate={leftInView ? "visible" : "hidden"}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="flex flex-col justify-center items-center w-full lg:w-[50%] 
                     rounded-2xl p-10 max-w-[520px] mx-auto text-center border"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-secondary)',
            boxShadow: '0 0 55px rgba(99,102,241,0.1)'
          }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={leftInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-[2rem] md:text-[2.4rem] font-extrabold mb-3 text-theme-primary"
          >
            Welcome Back<span className="text-indigo-500">!</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={leftInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-theme-muted leading-relaxed max-w-md text-[1rem]"
          >
            We're grateful you chose <span className="text-indigo-500 font-medium">NoteStream</span>.
            Your workspace is ready — let's continue where you left off.
          </motion.p>

          {/* Appreciation icons */}
          <motion.div
            initial="hidden"
            animate={leftInView ? "visible" : "hidden"}
            variants={{
              visible: {
                transition: { staggerChildren: 0.2, delayChildren: 0.3 },
              },
            }}
            className="grid grid-cols-2 gap-8 mt-10"
          >
            {[
              { icon: <FiSmile className="text-indigo-500 w-8 h-8" />, label: "We missed you" },
              { icon: <FiTrendingUp className="text-indigo-500 w-8 h-8" />, label: "Your insights are improving" },
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
                  className="flex items-center justify-center w-16 h-16 rounded-2xl mb-3 border"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)', 
                    borderColor: 'var(--border-secondary)' 
                  }}
                >
                  {f.icon}
                </div>
                <p className="text-theme-muted text-sm">{f.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* ========================================================= */}
        {/* RIGHT: LOGIN FORM */}
        {/* ========================================================= */}
        <motion.div
          ref={rightRef}
          variants={fadeVariants}
          initial="hidden"
          animate={rightInView ? "visible" : "hidden"}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col justify-center w-full lg:w-[50%] 
                     rounded-2xl p-10 max-w-[520px] mx-auto border"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-secondary)',
            boxShadow: '0 0 55px rgba(99,102,241,0.1)'
          }}
        >
          <h2 className="text-[1.8rem] md:text-[2rem] font-extrabold mb-6 leading-tight text-theme-primary">
            Log in to Your <span className="text-indigo-500">Account</span>
          </h2>

          <form onSubmit={handleLogin} className="space-y-6">
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

            {/* BUTTON */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3.5 rounded-full font-semibold 
                         bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[1rem] 
                         shadow-lg shadow-indigo-500/25 hover:opacity-90 transition-all"
            >
              Log In
            </motion.button>
          </form>

          <p className="text-theme-muted text-sm text-center mt-6">
            New to NoteStream?{" "}
            <a href="/signup" className="text-indigo-500 hover:underline">
              Create an account
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}