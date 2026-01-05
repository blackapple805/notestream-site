// src/components/UsageLimitModal.jsx
import { motion, AnimatePresence } from "framer-motion";
import { Warning, Crown, Lightning } from "phosphor-react";
import { FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function UsageLimitModal({ isOpen, onClose, featureType, used, max }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const featureNames = {
    aiSummaries: "AI Summaries",
    documentSynth: "Document Synthesis",
    insightQueries: "Insight Queries",
  };

  const featureName = featureNames[featureType] || "this feature";

  const handleUpgrade = () => {
    onClose();
    navigate("/dashboard/ai-lab");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-secondary)',
            }}
          >
            <div className="p-6 text-center">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Warning size={32} weight="fill" className="text-amber-500" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-theme-primary mb-2">
                Daily Limit Reached
              </h3>

              {/* Message */}
              <p className="text-theme-muted mb-4">
                You've used all {max} {featureName} for today. Your limit resets at midnight.
              </p>

              {/* Usage indicator */}
              <div 
                className="rounded-xl p-4 mb-6"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-theme-secondary">{featureName}</span>
                  <span className="text-sm font-semibold text-amber-500">{used}/{max}</span>
                </div>
                <div 
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-input)' }}
                >
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Upgrade CTA */}
              <div 
                className="rounded-xl p-4 border border-indigo-500/30 bg-indigo-500/5 mb-6"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Lightning size={18} weight="fill" className="text-indigo-400" />
                  <span className="font-semibold text-theme-primary">Go Unlimited</span>
                </div>
                <p className="text-xs text-theme-muted">
                  Pro users get unlimited access to all AI features.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-medium border text-theme-secondary hover:bg-white/5 transition"
                  style={{ borderColor: 'var(--border-secondary)' }}
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleUpgrade}
                  className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  <Crown size={16} weight="fill" />
                  Upgrade
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}