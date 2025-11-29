// src/components/PageLoader.jsx
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PageLoader({ isVisible, onFinish }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => onFinish(), 600); // auto exit
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[9998] pointer-events-none bg-transparent"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/15 to-transparent animate-shimmer" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
