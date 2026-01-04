import { useState, useEffect, useRef } from "react";
import { FiUploadCloud, FiDollarSign, FiRotateCw, FiLock } from "react-icons/fi";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function Demo() {
  const [files, setFiles] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [data, setData] = useState([]);
  const [showChart, setShowChart] = useState(false);
  const [uploadTimer, setUploadTimer] = useState(null);
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

  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      if (uploadTimer) clearTimeout(uploadTimer);
    };
  }, [files, uploadTimer]);

  const handleUpload = (e) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    if (files.length >= 3) {
      const toast = document.createElement("div");
      toast.className =
        "fixed top-6 right-6 text-sm px-6 py-3 rounded-xl shadow-lg backdrop-blur-xl z-[9999] transition-all duration-300 border";
      toast.style.backgroundColor = 'var(--bg-surface)';
      toast.style.borderColor = 'rgba(99, 102, 241, 0.4)';
      toast.style.boxShadow = '0 0 40px rgba(99,102,241,0.3)';
      toast.innerHTML =
        `<strong style="color: var(--text-primary)">Demo Limit Reached</strong><br/><span style="color: var(--text-muted)">Upgrade to <span style="color: rgb(99, 102, 241); font-weight: 600;">NoteStream Pro</span> for unlimited uploads.</span>`;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 600);
      }, 3500);
      return;
    }

    const preview = URL.createObjectURL(uploaded);
    setAnalyzing(true);

    const timer = setTimeout(() => {
      const fakeSpend = (Math.random() * 80 + 20).toFixed(2);
      const fakeCategory = ["Dining", "Groceries", "Transport", "Office"][
        Math.floor(Math.random() * 4)
      ];
      const newEntry = { id: Date.now(), preview, spend: +fakeSpend, category: fakeCategory };

      setFiles((prev) => [...prev, newEntry]);
      setData((prev) => {
        const updated = [...prev];
        const existing = updated.find((x) => x.category === fakeCategory);
        if (existing) existing.total += +fakeSpend;
        else updated.push({ category: fakeCategory, total: +fakeSpend });
        return updated;
      });

      setAnalyzing(false);
      setShowChart(true);
    }, 2000);

    setUploadTimer(timer);
  };

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
  const upload = useScrollFade();
  const chart = useScrollFade();

  // Theme-aware colors for chart
  const chartColors = {
    grid: isDark ? "rgba(80,80,90,0.25)" : "rgba(0,0,0,0.1)",
    tick: isDark ? "#9ca3af" : "#6b7280",
    tooltipBg: isDark ? "#111114" : "#ffffff",
    tooltipBorder: "rgba(99,102,241,0.4)",
    cursor: "rgba(99,102,241,0.08)",
  };

  return (
    <>
      <section
        id="demo"
        className="relative flex flex-col items-center justify-center text-center py-[16vh] px-6 select-none overflow-hidden text-theme-primary"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* === Background Glows === */}
        <div className="absolute top-[10%] left-[5%] w-[280px] h-[280px] bg-indigo-500/20 blur-[140px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[5%] right-[5%] w-[220px] h-[220px] bg-blue-500/15 blur-[120px] rounded-full pointer-events-none"></div>

        {/* === Heading === */}
        <motion.div
          ref={heading.ref}
          variants={heading.variants}
          initial="hidden"
          animate={heading.inView ? "visible" : "hidden"}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-theme-primary">
            Experience <span className="text-indigo-500">NoteStream</span> in Action
          </h2>
          <p className="text-theme-muted text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Upload a receipt, watch it analyze in real time, and see your spending come alive.
          </p>
        </motion.div>

        {/* === Divider ABOVE upload box ONLY === */}
        <div 
          className="w-full my-[6vh] block md:hidden"
          style={{ borderTop: '1px solid var(--border-secondary)' }}
        />

        {/* === Upload Box === */}
        <motion.div
          ref={upload.ref}
          variants={upload.variants}
          initial="hidden"
          animate={upload.inView ? "visible" : "hidden"}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-[90%] max-w-5xl rounded-2xl backdrop-blur-md overflow-hidden transition-all duration-700 border"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-secondary)',
            boxShadow: '0 0 60px rgba(99,102,241,0.15)',
            minHeight: "55vh" 
          }}
        >
          {/* Upload UI */}
          {!analyzing && (
            <label 
              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-all duration-500"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative mb-6 flex items-center justify-center">
                  <motion.div
                    animate={{ opacity: [0.4, 0.9, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 blur-3xl bg-indigo-500/30 rounded-full"
                  />
                  <FiUploadCloud className="relative text-indigo-500 w-20 h-20 drop-shadow-[0_0_16px_rgba(99,102,241,0.6)]" />
                </div>

                <span className="text-xl text-theme-primary font-semibold tracking-wide mb-2">
                  Upload Your Receipts
                </span>
                <p className="text-sm text-theme-muted font-light">
                  Drag & drop a photo or click to browse
                </p>
                <p className="text-xs text-indigo-500/70 mt-2">(max 3 uploads in demo)</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} tabIndex={-1} />
            </label>
          )}

          {/* Loader */}
          <AnimatePresence>
            {analyzing && (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl z-10"
                style={{ backgroundColor: 'var(--bg-overlay)' }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="p-6 rounded-full bg-indigo-500/10 border border-indigo-500/40 shadow-[0_0_25px_rgba(99,102,241,0.5)]"
                >
                  <FiRotateCw className="w-12 h-12 text-indigo-500" />
                </motion.div>
                <p className="text-theme-muted mt-6 text-sm animate-pulse">Analyzing receipt data...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File previews */}
          {files.length > 0 && !analyzing && (
            <div className="absolute bottom-6 left-0 right-0 flex flex-wrap justify-center gap-6 px-4">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="relative w-[150px] h-[130px] rounded-2xl overflow-hidden border border-indigo-500/20 
                  shadow-[0_0_40px_rgba(99,102,241,0.2)] hover:scale-105 hover:border-indigo-500/40 transition-all duration-300"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                >
                  <img
                    src={f.preview}
                    alt="receipt"
                    className="object-cover w-full h-full opacity-80 pointer-events-none select-none"
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      background: isDark 
                        ? 'linear-gradient(to top, rgba(13,13,16,0.9), transparent)' 
                        : 'linear-gradient(to top, rgba(255,255,255,0.9), transparent)'
                    }}
                  />
                  <div className="absolute bottom-2 left-0 right-0 text-xs text-indigo-500 py-1 text-center font-medium">
                    {f.category}: ${f.spend}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Divider before chart */}
        {showChart && (
          <div 
            className="w-full my-[8vh] block md:hidden"
            style={{ borderTop: '1px solid var(--border-secondary)' }}
          />
        )}

        {/* Chart */}
        <AnimatePresence>
          {showChart && (
            <motion.div
              ref={chart.ref}
              variants={chart.variants}
              initial="hidden"
              animate={chart.inView ? "visible" : "hidden"}
              transition={{ duration: 0.9, ease: "easeOut" }}
              key="chart"
              className="relative z-10 mt-[6vh] w-[90%] max-w-4xl rounded-xl p-6 border"
              style={{ 
                backgroundColor: 'var(--bg-card)', 
                borderColor: 'rgba(99, 102, 241, 0.2)',
                boxShadow: '0 0 40px rgba(99,102,241,0.15)'
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-indigo-500 flex items-center gap-2">
                  <FiDollarSign /> Spending Overview
                </h3>
                <div 
                  className="flex items-center gap-2 text-theme-muted text-sm px-3 py-1.5 rounded-lg backdrop-blur-sm cursor-not-allowed hover:brightness-110 transition border"
                  style={{ 
                    backgroundColor: 'var(--bg-tertiary)', 
                    borderColor: 'var(--border-secondary)' 
                  }}
                >
                  <FiLock className="text-indigo-500" />
                  <span>Weekly View (Pro)</span>
                </div>
              </div>

              <div className="h-[300px] select-none pointer-events-none">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
                    <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="category"
                      tick={{ fill: chartColors.tick, fontSize: 13 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: chartColors.tick, fontSize: 13 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        border: `1px solid ${chartColors.tooltipBorder}`,
                        borderRadius: "0.75rem",
                        color: isDark ? "#fff" : "#1f2937",
                      }}
                      cursor={{ fill: chartColors.cursor }}
                    />
                    <Bar dataKey="total" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={50} />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.85} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Bottom divider */}
      <div 
        className="w-full"
        style={{ borderTop: '1px solid var(--border-secondary)' }}
      />
    </>
  );
}