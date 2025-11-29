// src/pages/Login.jsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom"; // <-- Added
import { FiLock, FiMail, FiSmile, FiTrendingUp } from "react-icons/fi";

export default function LoginPage() {
  const navigate = useNavigate(); // <-- Added navigation hook

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
    navigate("/dashboard"); // redirect after “login”
  };

  return (
    <section
      id="login-page"
      className="relative flex flex-col lg:flex-row items-center justify-center w-full bg-[#0d0d10] text-white py-[12vh] px-6 overflow-hidden min-h-screen"
    >
      {/* Glows */}
      <div className="absolute top-[12%] left-[8%] w-[260px] h-[260px] bg-indigo-600/25 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[220px] h-[220px] bg-blue-500/20 blur-[140px] rounded-full"></div>

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
                     bg-[#111114]/80 border border-[#1f1f25] rounded-2xl p-10 
                     shadow-[0_0_55px_rgba(99,102,241,0.12)]
                     max-w-[520px] mx-auto text-center"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={leftInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-[2rem] md:text-[2.4rem] font-extrabold mb-3"
          >
            Welcome Back<span className="text-indigo-400">!</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={leftInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-gray-400 leading-relaxed max-w-md text-[1rem]"
          >
            We’re grateful you chose <span className="text-indigo-400 font-medium">NoteStream</span>.
            Your workspace is ready — let’s continue where you left off.
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
              { icon: <FiSmile className="text-indigo-400 w-8 h-8" />, label: "We missed you" },
              { icon: <FiTrendingUp className="text-indigo-400 w-8 h-8" />, label: "Your insights are improving" },
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
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl 
                                bg-[#1a1a22] border border-gray-800 mb-3">
                  {f.icon}
                </div>
                <p className="text-gray-400 text-sm">{f.label}</p>
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
                     bg-[#111114]/85 border border-[#1f1f25] rounded-2xl p-10 
                     shadow-[0_0_55px_rgba(99,102,241,0.15)]
                     max-w-[520px] mx-auto"
        >
          <h2 className="text-[1.8rem] md:text-[2rem] font-extrabold mb-6 leading-tight">
            Log in to Your <span className="text-indigo-400">Account</span>
          </h2>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* EMAIL */}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Email</label>
              <div className="flex items-center bg-[#111114] border border-[#1f1f25] 
                              rounded-full px-5 py-3 
                              shadow-[0_0_20px_rgba(99,102,241,0.08)] 
                              focus-within:border-indigo-500 
                              focus-within:shadow-[0_0_30px_rgba(99,102,241,0.25)]
                              transition-all duration-300">
                <FiMail className="text-indigo-400 w-5 h-5 mr-3" />
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="w-full bg-transparent text-gray-200 placeholder-gray-500 text-[1rem] outline-none"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Password</label>
              <div className="flex items-center bg-[#111114] border border-[#1f1f25] 
                              rounded-full px-5 py-3 
                              shadow-[0_0_20px_rgba(99,102,241,0.08)] 
                              focus-within:border-indigo-500 
                              focus-within:shadow-[0_0_30px_rgba(99,102,241,0.25)]
                              transition-all duration-300">
                <FiLock className="text-indigo-400 w-5 h-5 mr-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-transparent text-gray-200 placeholder-gray-500 text-[1rem] outline-none"
                />
              </div>
            </div>

            {/* BUTTON */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="submit"
              className="w-full py-3.5 rounded-full font-semibold 
                         bg-gradient-to-r from-indigo-500 to-indigo-400 text-white text-[1rem] 
                         shadow-[0_0_25px_rgba(99,102,241,0.25)] 
                         hover:shadow-[0_0_40px_rgba(99,102,241,0.45)] 
                         transition-all"
            >
              Log In
            </motion.button>
          </form>

          <p className="text-gray-500 text-sm text-center mt-6">
            New to NoteStream?{" "}
            <a href="/signup" className="text-indigo-400 hover:underline">
              Create an account
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
