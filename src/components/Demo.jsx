// src/components/Demo.jsx
import { useState, useEffect, useRef } from "react";
import { 
  FiPlay, FiFileText, FiZap, FiCheck, FiArrowRight,
  FiMic, FiImage, FiUpload, FiClock, FiStar
} from "react-icons/fi";
import { Sparkle, Lightning, Brain } from "phosphor-react";
import { motion, AnimatePresence, useInView } from "framer-motion";

export default function Demo() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDark, setIsDark] = useState(true);

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

  // Auto-play demo steps
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= 3) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const steps = [
    { 
      icon: <FiUpload size={20} />, 
      title: "Capture", 
      desc: "Upload notes, voice memos, or images",
      color: "var(--accent-indigo)"
    },
    { 
      icon: <Brain size={20} weight="fill" />, 
      title: "Analyze", 
      desc: "AI extracts key insights automatically",
      color: "var(--accent-purple)"
    },
    { 
      icon: <FiZap size={20} />, 
      title: "Summarize", 
      desc: "Get actionable summaries in seconds",
      color: "var(--accent-amber)"
    },
    { 
      icon: <FiCheck size={20} />, 
      title: "Act", 
      desc: "Export, share, or integrate anywhere",
      color: "var(--accent-emerald)"
    },
  ];

  const useScrollFade = (options = { amount: 0.3 }) => {
    const ref = useRef(null);
    const inView = useInView(ref, options);
    const variants = {
      hidden: { opacity: 0, y: 40 },
      visible: { opacity: 1, y: 0 },
    };
    return { ref, inView, variants };
  };

  const heading = useScrollFade();
  const demo = useScrollFade();

  return (
    <>
      <section
        id="demo"
        className="relative flex flex-col items-center justify-center text-center py-24 md:py-32 px-6 overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* === Background Glows === */}
        <div 
          className="absolute top-[20%] left-[5%] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12), transparent 70%)', filter: 'blur(60px)' }}
        />
        <div 
          className="absolute bottom-[10%] right-[10%] w-[250px] h-[250px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent 70%)', filter: 'blur(60px)' }}
        />

        {/* === Heading === */}
        <motion.div
          ref={heading.ref}
          variants={heading.variants}
          initial="hidden"
          animate={heading.inView ? "visible" : "hidden"}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border"
            style={{ 
              backgroundColor: 'rgba(168, 85, 247, 0.1)', 
              borderColor: 'rgba(168, 85, 247, 0.2)' 
            }}
          >
            <Lightning size={16} weight="fill" style={{ color: 'var(--accent-purple)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--accent-purple)' }}>
              See It In Action
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Experience <span style={{ color: 'var(--accent-indigo)' }}>NoteStream</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto mb-12" style={{ color: 'var(--text-muted)' }}>
            Watch how NoteStream transforms your raw notes into organized, actionable insights in just a few steps.
          </p>
        </motion.div>

        {/* === Interactive Demo === */}
        <motion.div
          ref={demo.ref}
          variants={demo.variants}
          initial="hidden"
          animate={demo.inView ? "visible" : "hidden"}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-full max-w-5xl"
        >
          {/* Steps Indicator */}
          <div className="flex items-center justify-center gap-2 md:gap-4 mb-8">
            {steps.map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: activeStep === i ? `${step.color}15` : 'transparent',
                  border: `1px solid ${activeStep === i ? `${step.color}40` : 'var(--border-secondary)'}`,
                }}
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{ 
                    backgroundColor: activeStep >= i ? step.color : 'var(--bg-tertiary)',
                    color: activeStep >= i ? 'white' : 'var(--text-muted)',
                  }}
                >
                  {activeStep > i ? <FiCheck size={12} /> : <span className="text-xs font-medium">{i + 1}</span>}
                </div>
                <span 
                  className="text-sm font-medium hidden md:block transition-colors duration-300"
                  style={{ color: activeStep === i ? step.color : 'var(--text-muted)' }}
                >
                  {step.title}
                </span>
              </button>
            ))}
          </div>

          {/* Demo Container */}
          <div 
            className="rounded-2xl overflow-hidden border"
            style={{ 
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-secondary)',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.2), 0 0 40px rgba(99, 102, 241, 0.1)',
            }}
          >
            {/* Window Chrome */}
            <div 
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--border-secondary)' }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ffbd2e' }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28ca42' }} />
              </div>
              
              {/* Play Button */}
              <button
                onClick={() => {
                  setActiveStep(0);
                  setIsPlaying(true);
                }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300"
                style={{
                  backgroundColor: isPlaying ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-tertiary)',
                  color: isPlaying ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                  border: `1px solid ${isPlaying ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-secondary)'}`,
                }}
              >
                {isPlaying ? (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: 'var(--accent-indigo)' }}
                    />
                    Playing...
                  </>
                ) : (
                  <>
                    <FiPlay size={14} />
                    Watch Demo
                  </>
                )}
              </button>

              <div className="w-16" />
            </div>

            {/* Demo Content */}
            <div className="p-6 md:p-8 min-h-[400px] md:min-h-[450px]">
              <AnimatePresence mode="wait">
                {activeStep === 0 && <CaptureStep key="capture" />}
                {activeStep === 1 && <AnalyzeStep key="analyze" />}
                {activeStep === 2 && <SummarizeStep key="summarize" />}
                {activeStep === 3 && <ActStep key="act" />}
              </AnimatePresence>
            </div>
          </div>

          {/* Step Description */}
          <motion.div 
            key={activeStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center"
          >
            <p className="text-lg font-semibold" style={{ color: steps[activeStep].color }}>
              {steps[activeStep].title}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {steps[activeStep].desc}
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* === Divider === */}
      <div style={{ borderTop: '1px solid var(--border-secondary)' }} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   STEP COMPONENTS
═══════════════════════════════════════════════════════════ */

function CaptureStep() {
  const inputTypes = [
    { icon: <FiFileText size={24} />, label: "Text Note", active: true },
    { icon: <FiMic size={24} />, label: "Voice Memo", active: false },
    { icon: <FiImage size={24} />, label: "Image", active: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col items-center justify-center"
    >
      <div className="grid grid-cols-3 gap-4 mb-8">
        {inputTypes.map((type, i) => (
          <motion.div
            key={type.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300"
            style={{
              backgroundColor: type.active ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-tertiary)',
              borderColor: type.active ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-secondary)',
              color: type.active ? 'var(--accent-indigo)' : 'var(--text-muted)',
            }}
          >
            {type.icon}
            <span className="text-xs font-medium">{type.label}</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-md rounded-xl p-4 border"
        style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-secondary)' }}
      >
        <div className="flex items-start gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
          >
            <FiFileText size={16} style={{ color: 'var(--accent-indigo)' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Team Meeting Notes</p>
            <motion.p 
              className="text-xs leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Discussed Q4 roadmap priorities. Sarah to finalize designs by Friday. 
              Engineering to review API specs. Follow-up meeting scheduled for next Tuesday...
            </motion.p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AnalyzeStep() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 100));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const analysisItems = [
    { label: "Extracting key points", done: progress > 30 },
    { label: "Identifying action items", done: progress > 60 },
    { label: "Detecting deadlines", done: progress > 80 },
    { label: "Generating summary", done: progress >= 100 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col items-center justify-center"
    >
      <motion.div
        animate={{ rotate: progress < 100 ? 360 : 0 }}
        transition={{ duration: 2, repeat: progress < 100 ? Infinity : 0, ease: "linear" }}
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ 
          backgroundColor: 'rgba(168, 85, 247, 0.15)',
          border: '2px solid rgba(168, 85, 247, 0.3)',
        }}
      >
        <Brain size={36} weight="fill" style={{ color: 'var(--accent-purple)' }} />
      </motion.div>

      <div className="w-full max-w-xs mb-6">
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ 
              backgroundColor: 'var(--accent-purple)',
              width: `${progress}%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
          Analyzing... {progress}%
        </p>
      </div>

      <div className="space-y-2">
        {analysisItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: item.done ? 1 : 0.4, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2"
          >
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: item.done ? 'var(--accent-purple)' : 'var(--bg-tertiary)',
              }}
            >
              {item.done && <FiCheck size={12} color="white" />}
            </div>
            <span 
              className="text-sm"
              style={{ color: item.done ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function SummarizeStep() {
  const summaryItems = [
    { icon: <FiStar size={14} />, text: "Q4 roadmap is top priority", color: 'var(--accent-amber)' },
    { icon: <FiCheck size={14} />, text: "Sarah: Finalize designs by Friday", color: 'var(--accent-emerald)' },
    { icon: <FiCheck size={14} />, text: "Engineering: Review API specs", color: 'var(--accent-emerald)' },
    { icon: <FiClock size={14} />, text: "Follow-up: Tuesday", color: 'var(--accent-indigo)' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-xl p-5 border"
        style={{ 
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          borderColor: 'rgba(245, 158, 11, 0.2)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}
          >
            <Sparkle size={16} weight="fill" style={{ color: 'var(--accent-amber)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--accent-amber)' }}>AI Summary</p>
        </div>

        <div className="space-y-3">
          {summaryItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.15 }}
              className="flex items-start gap-3 p-2 rounded-lg"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              <div 
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${item.color}20`, color: item.color }}
              >
                {item.icon}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ActStep() {
  const actions = [
    { icon: <FiFileText size={18} />, label: "Export PDF", desc: "Download formatted report" },
    { icon: <FiZap size={18} />, label: "Add to Tasks", desc: "Sync with your todo app" },
    { icon: <FiArrowRight size={18} />, label: "Share", desc: "Send to your team" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ 
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
        }}
      >
        <FiCheck size={32} style={{ color: 'var(--accent-emerald)' }} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold mb-6"
        style={{ color: 'var(--text-primary)' }}
      >
        Ready to use!
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
        {actions.map((action, i) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all duration-300"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
              e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-secondary)';
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
          >
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}
            >
              {action.icon}
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{action.label}</p>
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>{action.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}