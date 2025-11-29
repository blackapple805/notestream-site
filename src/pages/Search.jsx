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
      icon: <FiBookOpen className="text-indigo-300 w-6 h-6" />,
      title: "Project Strategy Meeting Notes",
      desc: "AI summary and extracted action points",
    },
    {
      icon: <FiFileText className="text-indigo-300 w-6 h-6" />,
      title: "Uploaded Screenshot: dashboard.png",
      desc: "Converted into structured summary",
    },
    {
      icon: <FiZap className="text-indigo-300 w-6 h-6" />,
      title: "Weekly Insight Report",
      desc: "Trends detected across your workspace",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full bg-[#0d0d10] text-white px-6 py-[12vh] overflow-hidden"
    >
      {/* Background glows */}
      <div className="absolute top-[10%] left-[5%] w-[260px] h-[260px] bg-indigo-600/25 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[8%] right-[8%] w-[220px] h-[220px] bg-purple-600/20 blur-[150px] rounded-full"></div>

      <div className="relative z-10 max-w-4xl mx-auto">

        {/* Title */}
        <motion.h1
          variants={fadeVariants}
          initial="hidden"
          animate={sectionInView ? "visible" : "hidden"}
          transition={{ duration: 0.7 }}
          className="text-4xl md:text-6xl font-extrabold text-center mb-6"
        >
          Search Your <span className="text-indigo-400">Workspace</span>
        </motion.h1>

        <motion.p
          variants={fadeVariants}
          initial="hidden"
          animate={sectionInView ? "visible" : "hidden"}
          transition={{ duration: 0.85 }}
          className="text-gray-400 text-lg text-center max-w-2xl mx-auto mb-12"
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
            className={`flex items-center w-full bg-[#111114]/80 border 
              ${query ? "border-indigo-500 shadow-[0_0_35px_rgba(99,102,241,0.45)]" : "border-[#1f1f25]"} 
              rounded-full px-6 py-4 transition-all duration-300`}
          >
            <FiSearch className="text-gray-400 w-6 h-6 mr-3" />
            <input
              type="text"
              placeholder="Search notes, summaries, uploads…"
              className="w-full bg-transparent text-gray-200 placeholder-gray-500 placeholder:text-[1rem] text-[1.1rem] outline-none"
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
                className="px-5 py-2 rounded-full bg-[#1a1a22] border border-[#1f1f25] 
                           hover:border-indigo-500/50 hover:text-indigo-400 
                           text-gray-300 transition-all text-sm shadow"
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
            <h3 className="text-gray-400 text-sm mb-3 flex items-center gap-2">
              <FiClock /> Recent Searches
            </h3>

            <div className="flex flex-wrap gap-3">
              {recentSearches.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(item)}
                  className="px-4 py-2 rounded-xl bg-[#111114] border border-[#1f1f25] 
                             hover:border-indigo-500/60 hover:text-indigo-400 
                             text-gray-400 text-sm transition"
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
            <h3 className="text-indigo-400 text-lg font-semibold mb-4">
              Results for “{query}”
            </h3>

            {placeholderResults.map((res, i) => (
              <div
                key={i}
                className="bg-[#111114]/70 border border-[#1f1f25] rounded-2xl p-6 
                           hover:-translate-y-1 hover:border-indigo-500/50 
                           shadow-[0_0_20px_rgba(99,102,241,0.15)] 
                           hover:shadow-[0_0_40px_rgba(99,102,241,0.3)]
                           transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {res.icon}
                  <div>
                    <h4 className="text-white font-semibold">{res.title}</h4>
                    <p className="text-gray-400 text-sm mt-1">{res.desc}</p>
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
