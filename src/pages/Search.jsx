// src/pages/Search.jsx
import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FiSearch, FiClock, FiZap, FiBookOpen, FiFileText } from "react-icons/fi";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const fadeVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: { opacity: 1, y: 0 },
  };

  const sectionRef = useRef(null);
  const sectionInView = useInView(sectionRef, { amount: 0.25 });

  const recentSearches = ["Meeting notes", "Marketing update", "Expense report", "Project roadmap"];

  const aiSuggestions = [
    "Summaries",
    "Meeting Decisions",
    "Weekly Insights",
    "Expenses",
    "Uploaded Files",
  ];

  const placeholderResults = [
    {
      icon: <FiBookOpen className="text-indigo-500 w-6 h-6" />,
      title: "Project Strategy Meeting Notes",
      desc: "AI summary and extracted action points",
    },
    {
      icon: <FiFileText className="text-indigo-500 w-6 h-6" />,
      title: "Uploaded Screenshot: dashboard.png",
      desc: "Converted into structured summary",
    },
    {
      icon: <FiZap className="text-indigo-500 w-6 h-6" />,
      title: "Weekly Insight Report",
      desc: "Trends detected across your workspace",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full text-theme-primary px-6 py-[12vh] overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Background glows */}
      <div className="absolute top-[10%] left-[5%] w-[260px] h-[260px] bg-indigo-500/20 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[8%] right-[8%] w-[220px] h-[220px] bg-purple-500/15 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto">

        {/* Title */}
        <motion.h1
          variants={fadeVariants}
          initial="hidden"
          animate={sectionInView ? "visible" : "hidden"}
          transition={{ duration: 0.7 }}
          className="text-4xl md:text-6xl font-extrabold text-center mb-6 text-theme-primary"
        >
          Search Your <span className="text-indigo-500">Workspace</span>
        </motion.h1>

        <motion.p
          variants={fadeVariants}
          initial="hidden"
          animate={sectionInView ? "visible" : "hidden"}
          transition={{ duration: 0.85 }}
          className="text-theme-muted text-lg text-center max-w-2xl mx-auto mb-12"
        >
          Instantly find summaries, notes, insights, screenshots, meeting decisions, and more.
        </motion.p>

        {/* Search Bar */}
        <motion.div
          variants={fadeVariants}
          initial="hidden"
          animate={sectionInView ? "visible" : "hidden"}
          transition={{ duration: 1.0 }}
          className="relative w-full max-w-3xl mx-auto mb-10"
        >
          <div
            className={`flex items-center w-full rounded-full px-6 py-4 transition-all duration-300 border ${
              query ? "border-indigo-500 shadow-[0_0_35px_rgba(99,102,241,0.3)]" : ""
            }`}
            style={{ 
              backgroundColor: 'var(--bg-input)', 
              borderColor: query ? 'rgb(99, 102, 241)' : 'var(--border-secondary)' 
            }}
          >
            <FiSearch className="text-theme-muted w-6 h-6 mr-3" />
            <input
              type="text"
              placeholder="Search notes, summaries, uploads…"
              className="w-full bg-transparent text-theme-primary placeholder:text-theme-muted text-[1.1rem] outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* AI SUGGESTION CHIPS */}
        {!query && (
          <motion.div
            variants={fadeVariants}
            initial="hidden"
            animate={sectionInView ? "visible" : "hidden"}
            transition={{ duration: 1.1 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            {aiSuggestions.map((s, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setQuery(s)}
                className="px-5 py-2 rounded-full hover:border-indigo-500/50 hover:text-indigo-500 
                           text-theme-secondary transition-all text-sm shadow border"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)', 
                  borderColor: 'var(--border-secondary)' 
                }}
              >
                {s}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* RECENT SEARCHES */}
        {!query && (
          <motion.div
            variants={fadeVariants}
            initial="hidden"
            animate={sectionInView ? "visible" : "hidden"}
            transition={{ duration: 1.2 }}
            className="mb-16"
          >
            <h3 className="text-theme-muted text-sm mb-3 flex items-center gap-2">
              <FiClock /> Recent Searches
            </h3>

            <div className="flex flex-wrap gap-3">
              {recentSearches.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(item)}
                  className="px-4 py-2 rounded-xl hover:border-indigo-500/50 hover:text-indigo-500 
                             text-theme-muted text-sm transition border"
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border-secondary)' 
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* SEARCH RESULTS */}
        {query && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-12 space-y-6"
          >
            <h3 className="text-indigo-500 text-lg font-semibold mb-4">
              Results for "{query}"
            </h3>

            {placeholderResults.map((res, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 hover:-translate-y-1 hover:border-indigo-500/40 
                           shadow-[0_0_20px_rgba(99,102,241,0.08)] 
                           hover:shadow-[0_0_40px_rgba(99,102,241,0.15)]
                           transition-all duration-300 cursor-pointer border"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-secondary)' 
                }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    {res.icon}
                  </div>
                  <div>
                    <h4 className="text-theme-primary font-semibold">{res.title}</h4>
                    <p className="text-theme-muted text-sm mt-1">{res.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
