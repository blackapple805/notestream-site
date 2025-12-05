// src/pages/HowItWorks.jsx
import { 
  FiUploadCloud, 
  FiCpu, 
  FiBarChart2, 
  FiZap, 
  FiShield, 
  FiCheck,
  FiFile,
  FiImage,
  FiFileText,
  FiMessageSquare,
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiPieChart,
  FiLayers,
  FiTarget,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { Brain, Sparkle, Lightning, ListChecks, Tag } from "phosphor-react";

export default function HowItWorks() {
  return (
    <section 
      className="relative min-h-screen text-theme-primary px-6 pt-32 pb-32 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* ===== Background Glow ===== */}
      <div className="absolute top-[15%] left-[5%] w-[320px] h-[320px] bg-indigo-500/20 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[5%] w-[260px] h-[260px] bg-purple-500/15 blur-[130px] rounded-full pointer-events-none"></div>

      {/* ===== Header ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-20 relative z-10"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-theme-primary">
          How <span className="text-indigo-500">NoteStream</span> Works
        </h1>
        <p className="text-theme-muted max-w-2xl mx-auto text-lg">
          A simple workflow powered by serious AI. From unstructured chaos → organized clarity.
        </p>
      </motion.div>

      {/* =========================================================
          STEP TIMELINE
      ========================================================== */}
      <div className="max-w-5xl mx-auto space-y-28 relative z-10">

        {/* ===== Step 1: Upload ===== */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2 className="text-3xl font-bold mb-3 flex items-center gap-3 text-theme-primary">
              <FiUploadCloud className="text-indigo-500" /> 1. Upload Your Content
            </h2>
            <p className="text-theme-muted leading-relaxed text-lg">
              Upload notes, screenshots, receipts, articles, or meeting logs.
              NoteStream instantly extracts text, tags, structure, and context — no formatting required.
            </p>
          </div>
          
          {/* Icon-based Upload Illustration */}
          <div 
            className="rounded-2xl overflow-hidden border p-8"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border-secondary)',
              boxShadow: '0 0 35px rgba(99,102,241,0.12)'
            }}
          >
            <div className="flex flex-col items-center">
              <div 
                className="w-full rounded-xl border-2 border-dashed border-indigo-500/40 p-8 flex flex-col items-center mb-6"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                  <FiUploadCloud className="w-8 h-8 text-indigo-500" />
                </div>
                <p className="text-theme-secondary font-medium mb-1">Drop files here</p>
                <p className="text-theme-muted text-sm">or click to browse</p>
              </div>
              
              <div className="flex gap-4 justify-center">
                {[
                  { icon: FiFileText, label: "Notes", color: "text-blue-500" },
                  { icon: FiImage, label: "Images", color: "text-emerald-500" },
                  { icon: FiFile, label: "PDFs", color: "text-rose-500" },
                  { icon: FiMessageSquare, label: "Chats", color: "text-purple-500" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                      style={{ backgroundColor: 'var(--bg-elevated)' }}
                    >
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <span className="text-xs text-theme-muted">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===== Step 2: AI Processing ===== */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
        >
          <div className="order-2 md:order-1">
            <h2 className="text-3xl font-bold mb-3 flex items-center gap-3 text-theme-primary">
              <FiCpu className="text-indigo-500" /> 2. AI Understanding Engine
            </h2>
            <p className="text-theme-muted leading-relaxed text-lg mb-4">
              Our AI breaks your content down into:
            </p>
            <ul className="space-y-2 text-theme-secondary">
              {["Key points", "Action items", "Sentiment", "Financial values", "Topics & relationships"].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <FiCheck className="text-indigo-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-theme-muted mt-4">
              Think of it as your personal analyst reading everything for you.
            </p>
          </div>

          {/* Icon-based AI Processing Illustration */}
          <div 
            className="rounded-2xl overflow-hidden border p-8 order-1 md:order-2"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border-secondary)',
              boxShadow: '0 0 35px rgba(99,102,241,0.12)'
            }}
          >
            <div className="flex flex-col items-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Brain size={48} weight="duotone" className="text-indigo-500" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" style={{ animationDuration: '2s' }}></div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 w-full">
                {[
                  { icon: ListChecks, label: "Tasks", color: "text-emerald-500" },
                  { icon: Tag, label: "Tags", color: "text-blue-500" },
                  { icon: FiCalendar, label: "Dates", color: "text-amber-500" },
                  { icon: FiDollarSign, label: "Values", color: "text-green-500" },
                  { icon: FiTarget, label: "Intent", color: "text-rose-500" },
                  { icon: Lightning, label: "Insights", color: "text-purple-500" },
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center p-3 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <item.icon size={24} className={item.color} />
                    <span className="text-xs text-theme-muted mt-1">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===== Step 3: Summary & Insights ===== */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2 className="text-3xl font-bold mb-3 flex items-center gap-3 text-theme-primary">
              <FiBarChart2 className="text-indigo-500" /> 3. Get Your Summary & Insights
            </h2>
            <p className="text-theme-muted leading-relaxed text-lg">
              NoteStream turns everything into a beautifully structured summary —
              plus charts, categories, totals, insights, and trends.
              All ready to export or share.
            </p>
          </div>

          {/* Icon-based Summary Illustration */}
          <div 
            className="rounded-2xl overflow-hidden border p-6"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderColor: 'var(--border-secondary)',
              boxShadow: '0 0 35px rgba(99,102,241,0.12)'
            }}
          >
            <div 
              className="rounded-xl p-4 mb-4 border"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-secondary)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkle size={18} weight="fill" className="text-indigo-500" />
                <span className="text-sm font-semibold text-theme-primary">AI Summary</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 rounded-full w-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                <div className="h-2 rounded-full w-4/5" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
                <div className="h-2 rounded-full w-3/5" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { icon: FiTrendingUp, value: "+24%", label: "Growth", color: "text-emerald-500" },
                { icon: FiPieChart, value: "12", label: "Topics", color: "text-blue-500" },
                { icon: FiLayers, value: "48", label: "Items", color: "text-purple-500" },
              ].map((stat, i) => (
                <div 
                  key={i}
                  className="rounded-lg p-3 text-center"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-theme-muted">{stat.label}</p>
                </div>
              ))}
            </div>
            
            <div 
              className="rounded-lg p-3 border"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-secondary)' }}
            >
              <p className="text-xs text-theme-muted mb-2 font-medium">Action Items</p>
              <div className="space-y-2">
                {["Review Q4 budget proposal", "Schedule team sync", "Update project docs"].map((task, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border border-indigo-500/50 flex items-center justify-center">
                      {i === 0 && <FiCheck className="w-3 h-3 text-indigo-500" />}
                    </div>
                    <span className={`text-sm ${i === 0 ? 'text-theme-muted line-through' : 'text-theme-secondary'}`}>{task}</span>
                  </div>
                ))}
              </div>
            </div>
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
        className="max-w-4xl mx-auto mt-32 mb-24 p-10 rounded-3xl border"
        style={{ 
          backgroundColor: 'var(--bg-card)', 
          borderColor: 'var(--border-secondary)',
          boxShadow: '0 0 60px rgba(99,102,241,0.15)'
        }}
      >
        <h2 className="text-4xl font-bold mb-6 text-center text-theme-primary">
          What NoteStream Understands <span className="text-indigo-500">Automatically</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          {[
            { icon: <FiZap className="text-indigo-500 w-7 h-7"/>, title: "Key Sentences", text: "Pulls the most important statements out of long text."},
            { icon: <FiShield className="text-indigo-500 w-7 h-7"/>, title: "Action Items", text: "Detects tasks, deadlines, and next steps automatically."},
            { icon: <FiCpu className="text-indigo-500 w-7 h-7"/>, title: "Context Linking", text: "Understands relationships between ideas, dates, and topics."},
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.currentTarget.style.boxShadow = '0 0 35px rgba(99,102,241,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-secondary)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                {f.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-theme-primary">{f.title}</h3>
              <p className="text-theme-muted">{f.text}</p>
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
        <h2 className="text-4xl font-bold mb-4 text-theme-primary">Why NoteStream?</h2>
        <p className="text-theme-muted max-w-2xl mx-auto text-lg mb-16">
          We're not "just another summarizer."  
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
              className="p-7 rounded-2xl border transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.currentTarget.style.boxShadow = '0 0 40px rgba(99,102,241,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-secondary)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <h3 className="text-xl font-semibold mb-3 text-indigo-500">{item.title}</h3>
              <p className="text-theme-muted">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ===== CTA Section ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center mt-32"
      >
        <div 
          className="rounded-2xl p-10 border"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-secondary)',
            boxShadow: '0 0 50px rgba(99,102,241,0.1)'
          }}
        >
          <h3 className="text-3xl font-bold text-theme-primary mb-4">
            Ready to get started?
          </h3>
          <p className="text-theme-muted mb-8 max-w-lg mx-auto">
            Join thousands of users who have transformed how they capture and understand information.
          </p>
          <button className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-full hover:opacity-90 transition shadow-lg shadow-indigo-500/25 text-lg">
            Start Free Trial
          </button>
        </div>
      </motion.div>

      <div className="h-[100px]" />
    </section>
  );
}
