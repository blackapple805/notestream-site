// src/pages/FAQ.jsx
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

export default function FAQ() {
  const faqs = [
    {
      q: "Is my data private?",
      a: "Yes. NoteStream uses end-to-end encryption and never uses your data for model training.",
    },
    {
      q: "Can I upload any type of file?",
      a: "You can upload images, PDFs, screenshots, and documents. More formats are coming soon.",
    },
    {
      q: "Does NoteStream work on mobile?",
      a: "Yes — NoteStream is fully optimized for iOS and Android devices.",
    },
    {
      q: "How accurate are the AI summaries?",
      a: "Our engine is fine-tuned for structured note clarity and consistently delivers highly accurate insights.",
    },
  ];

  const [open, setOpen] = useState(null);

  return (
    <section 
      className="min-h-screen text-theme-primary px-6 py-24 relative"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Background glows */}
      <div className="absolute top-[15%] left-[5%] w-[240px] h-[240px] bg-indigo-500/20 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[5%] w-[200px] h-[200px] bg-purple-500/15 blur-[130px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-extrabold text-center mb-10 text-theme-primary"
        >
          Frequently Asked Questions
        </motion.h1>

        <div className="space-y-6">
          {faqs.map((item, index) => {
            const isOpen = open === index;
            const contentRef = useRef(null);

            return (
              <div
                key={index}
                className="rounded-2xl p-6 backdrop-blur-md hover:border-indigo-500/40 transition-all duration-300 border"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-secondary)' 
                }}
              >
                {/* Header */}
                <button
                  className="flex justify-between items-center w-full text-left"
                  onClick={() => setOpen(isOpen ? null : index)}
                >
                  <span className="text-lg font-semibold text-theme-primary">
                    {item.q}
                  </span>

                  <FiChevronDown
                    className={`w-6 h-6 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-indigo-500" : "text-theme-muted"
                    }`}
                  />
                </button>

                {/* Animated Content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: contentRef.current
                          ? contentRef.current.scrollHeight
                          : "auto",
                        opacity: 1,
                      }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div
                        ref={contentRef}
                        className="text-theme-muted mt-4 text-sm leading-relaxed pb-2"
                      >
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
