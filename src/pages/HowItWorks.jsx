// src/pages/HowItWorks.jsx
import { FiUploadCloud, FiCpu, FiBarChart2, FiZap, FiShield, FiCheck } from "react-icons/fi";
import { motion } from "framer-motion";

export default function HowItWorks() {
  return (
    <section className="relative min-h-screen text-white px-6 pt-32 pb-32 overflow-hidden bg-[#0d0d10]">

      {/* ===== Background Glow ===== */}
      <div className="absolute top-[15%] left-[5%] w-[320px] h-[320px] bg-indigo-600/25 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[5%] w-[260px] h-[260px] bg-purple-500/20 blur-[130px] rounded-full pointer-events-none"></div>

      {/* ===== Header ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-20 relative z-10"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
          How <span className="text-indigo-400">NoteStream</span> Works
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          A simple workflow powered by serious AI. From unstructured chaos → organized clarity.
        </p>
      </motion.div>

      {/* =========================================================
          STEP TIMELINE
      ========================================================== */}
      <div className="max-w-5xl mx-auto space-y-28 relative z-10">

        {/* ===== Step 1 ===== */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2 className="text-3xl font-bold mb-3 flex items-center gap-3">
              <FiUploadCloud className="text-indigo-400" /> 1. Upload Your Content
            </h2>
            <p className="text-gray-400 leading-relaxed text-lg">
              Upload notes, screenshots, receipts, articles, or meeting logs.
              NoteStream instantly extracts text, tags, structure, and context — no formatting required.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-[#1f1f25] bg-[#111114]/60 p-4 shadow-[0_0_35px_rgba(99,102,241,0.18)]">
            <img
              src="/assets/images/upload-demo.png"
              alt="Upload screenshot"
              className="rounded-xl w-full object-cover opacity-95"
            />
          </div>
        </motion.div>

        {/* ===== Step 2 ===== */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
        >
          <div className="order-2 md:order-1">
            <h2 className="text-3xl font-bold mb-3 flex items-center gap-3">
              <FiCpu className="text-indigo-400" /> 2. AI Understanding Engine
            </h2>
            <p className="text-gray-400 leading-relaxed text-lg">
              Our AI breaks your content down into:
              <br />• Key points  
              <br />• Action items  
              <br />• Sentiment  
              <br />• Financial values  
              <br />• Topics & relationships  
              <br />
              Think of it as your personal analyst reading everything for you.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-[#1f1f25] bg-[#111114]/60 p-4 shadow-[0_0_35px_rgba(99,102,241,0.18)] order-1 md:order-2">
            <img
              src="/assets/images/ai-process.png"
              alt="AI processing visualization"
              className="rounded-xl w-full object-cover opacity-95"
            />
          </div>
        </motion.div>

        {/* ===== Step 3 ===== */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2 className="text-3xl font-bold mb-3 flex items-center gap-3">
              <FiBarChart2 className="text-indigo-400" /> 3. Get Your Summary & Insights
            </h2>
            <p className="text-gray-400 leading-relaxed text-lg">
              NoteStream turns everything into a beautifully structured summary —
              plus charts, categories, totals, insights, and trends.
              All ready to export or share.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-[#1f1f25] bg-[#111114]/60 p-4 shadow-[0_0_35px_rgba(99,102,241,0.18)]">
            <img
              src="/assets/images/summary-output.png"
              alt="Summary results"
              className="rounded-xl w-full object-cover opacity-95"
            />
          </div>
        </motion.div>
      </div>

      {/* =========================================================
          REALTIME AI DEMO PANEL
      ========================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto mt-32 mb-24 p-10 bg-[#111114]/70 border border-[#1f1f25] rounded-3xl shadow-[0_0_60px_rgba(99,102,241,0.22)]"
      >
        <h2 className="text-4xl font-bold mb-6 text-center">
          What NoteStream Understands <span className="text-indigo-400">Automatically</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          {[
            { icon: <FiZap className="text-indigo-400 w-7 h-7"/>, title: "Key Sentences", text: "Pulls the most important statements out of long text."},
            { icon: <FiShield className="text-indigo-400 w-7 h-7"/>, title: "Action Items", text: "Detects tasks, deadlines, and next steps automatically."},
            { icon: <FiCpu className="text-indigo-400 w-7 h-7"/>, title: "Context Linking", text: "Understands relationships between ideas, dates, and topics."},
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="p-6 bg-[#0f0f12] border border-[#1e1e24] rounded-2xl hover:bg-theme-elevated hover:border-indigo-500/40 hover:shadow-[0_0_35px_rgba(99,102,241,0.25)] transition-all duration-300"
            >
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* =========================================================
          WHY NOTESTREAM?
      ========================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto text-center mt-32"
      >
        <h2 className="text-4xl font-bold mb-4">Why NoteStream?</h2>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-16">
          We’re not “just another summarizer.”  
          We're a complete intelligence layer for your digital life.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Highest Accuracy", desc: "Custom-tuned models built specifically for personal knowledge processing." },
            { title: "Private By Default", desc: "Your data is encrypted and never used for training. Ever." },
            { title: "Fast + Beautiful", desc: "Designed with top-tier UX — smooth, intuitive, and addictive to use." }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="p-7 bg-[#111114]/70 border border-[#1e1e24] rounded-2xl hover:bg-theme-elevated hover:border-indigo-500/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.3)] transition-all duration-300"
            >
              <h3 className="text-xl font-semibold mb-3 text-indigo-300">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ===== Bottom Spacer ===== */}
      <div className="h-[180px]" />
    </section>
  );
}
