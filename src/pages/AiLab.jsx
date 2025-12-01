// src/pages/AiLab.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import {
  Crown,
  Lightning,
  Microphone,
  CloudArrowUp,
  Users,
  Robot,
  Lock,
  Star,
  Export,
  Repeat,
} from "phosphor-react";
import { FiX, FiCheck } from "react-icons/fi";

const proFeatures = [
  {
    id: "voice",
    title: "Voice Notes",
    desc: "Record voice memos and get instant AI transcription with smart formatting.",
    icon: Microphone,
    color: "purple",
    demo: true,
  },
  {
    id: "unlimited",
    title: "Unlimited AI",
    desc: "No limits on AI summaries, analysis, or generations. Use as much as you need.",
    icon: Repeat,
    color: "indigo",
    demo: false,
  },
  {
    id: "cloud",
    title: "Cloud Sync",
    desc: "Sync your notes across all devices. Access anywhere, anytime.",
    icon: CloudArrowUp,
    color: "sky",
    demo: false,
  },
  {
    id: "collab",
    title: "Team Collaboration",
    desc: "Share notes and briefs with your team. Real-time editing and comments.",
    icon: Users,
    color: "emerald",
    demo: true,
  },
  {
    id: "custom",
    title: "Custom AI Training",
    desc: "Train AI on your writing style and terminology for personalized responses.",
    icon: Robot,
    color: "amber",
    demo: false,
  },
  {
    id: "export",
    title: "Advanced Export",
    desc: "Export to PDF, Word, Notion, and more. Beautiful formatted reports.",
    icon: Export,
    color: "rose",
    demo: true,
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "5 AI summaries per day",
      "Basic note organization",
      "Document uploads",
      "Insight Explorer (limited)",
      "Research Synthesizer (2 docs)",
    ],
    current: true,
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    features: [
      "Unlimited AI summaries",
      "Voice notes & transcription",
      "Cloud sync across devices",
      "Priority AI processing",
      "Advanced export options",
      "Custom AI training",
      "Email support",
    ],
    popular: true,
  },
  {
    name: "Team",
    price: "$25",
    period: "per month",
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Shared workspaces",
      "Team analytics",
      "Priority support",
      "Custom integrations",
    ],
  },
];

const colorMap = {
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/25",
    icon: "text-purple-400",
    button: "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/25",
    icon: "text-indigo-400",
    button: "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400",
  },
  sky: {
    bg: "bg-sky-500/10",
    border: "border-sky-500/25",
    icon: "text-sky-400",
    button: "bg-sky-500/20 hover:bg-sky-500/30 text-sky-400",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    icon: "text-emerald-400",
    button: "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    icon: "text-amber-400",
    button: "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/25",
    icon: "text-rose-400",
    button: "bg-rose-500/20 hover:bg-rose-500/30 text-rose-400",
  },
};

export default function AiLab() {
  const [showPricing, setShowPricing] = useState(false);
  const [showDemo, setShowDemo] = useState(null);

  const handleUpgrade = () => setShowPricing(true);

  const handleDemo = (feature) => {
    setShowDemo(feature);
  };

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
      {/* Header */}
      <header className="pt-2 px-1">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-semibold tracking-tight text-theme-primary">AI Lab</h1>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Crown size={14} weight="fill" className="text-amber-500" />
            <span className="text-[10px] font-semibold text-amber-500">PRO</span>
          </div>
        </div>
        <p className="text-theme-muted text-sm">Unlock powerful AI features to supercharge your workflow.</p>
      </header>

      {/* Upgrade Banner */}
      <GlassCard className="border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Lightning size={24} weight="fill" className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-theme-primary">Upgrade to Pro</h3>
              <p className="text-sm text-theme-muted mt-0.5">
                Get unlimited AI, voice notes, cloud sync, and more.
              </p>
            </div>
          </div>
          <button
            onClick={handleUpgrade}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition active:scale-95"
          >
            <Crown size={16} weight="fill" />
            View Plans
          </button>
        </div>
      </GlassCard>

      {/* Current Usage */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-theme-primary">Today's Usage</h3>
          <span className="text-xs text-theme-muted">Resets at midnight</span>
        </div>
        <div className="space-y-3">
          <UsageBar label="AI Summaries" used={3} max={5} />
          <UsageBar label="Document Synth" used={1} max={2} />
          <UsageBar label="Insight Queries" used={8} max={10} />
        </div>
        <p className="text-[11px] text-theme-muted mt-3">
          <span className="text-indigo-400">Pro users</span> get unlimited access to all features.
        </p>
      </GlassCard>

      {/* Pro Features Grid */}
      <div>
        <h3 className="text-sm font-semibold text-theme-secondary mb-3 px-1">Pro Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {proFeatures.map((feature) => {
            const colors = colorMap[feature.color];
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative ${colors.bg} border ${colors.border} rounded-2xl p-4 cursor-pointer transition`}
                onClick={() => feature.demo && handleDemo(feature)}
              >
                {/* Lock Badge */}
                <div className="absolute top-3 right-3">
                  <div 
                    className="h-6 w-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--bg-overlay)' }}
                  >
                    <Lock size={12} weight="fill" className="text-theme-muted" />
                  </div>
                </div>

                <div className={`h-10 w-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-3`}>
                  <Icon size={22} weight="duotone" className={colors.icon} />
                </div>
                <h4 className="text-sm font-semibold text-theme-primary mb-1">{feature.title}</h4>
                <p className="text-xs text-theme-muted leading-relaxed mb-3">{feature.desc}</p>
                
                {feature.demo ? (
                  <button className={`text-xs px-3 py-1.5 rounded-full ${colors.button} transition`}>
                    Try Demo
                  </button>
                ) : (
                  <span className="text-[10px] text-theme-muted">Requires Pro</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Pricing Modal */}
      <AnimatePresence>
        {showPricing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowPricing(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-secondary)',
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-theme-primary">Choose Your Plan</h2>
                    <p className="text-sm text-theme-muted mt-1">Upgrade to unlock all features</p>
                  </div>
                  <button
                    onClick={() => setShowPricing(false)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-primary transition"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <FiX size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pricingPlans.map((plan) => (
                    <div
                      key={plan.name}
                      className={`rounded-xl p-5 border transition ${
                        plan.popular
                          ? "border-indigo-500/50 ring-1 ring-indigo-500/30"
                          : ""
                      }`}
                      style={{
                        backgroundColor: plan.popular ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-input)',
                        borderColor: plan.popular ? undefined : 'var(--border-secondary)',
                      }}
                    >
                      {plan.popular && (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 mb-2">
                          <Star size={12} weight="fill" />
                          MOST POPULAR
                        </div>
                      )}
                      {plan.current && (
                        <div className="text-[10px] font-semibold text-theme-muted mb-2">
                          CURRENT PLAN
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-theme-primary">{plan.name}</h3>
                      <div className="mt-2 mb-4">
                        <span className="text-3xl font-bold text-theme-primary">{plan.price}</span>
                        <span className="text-sm text-theme-muted">/{plan.period}</span>
                      </div>
                      <ul className="space-y-2 mb-5">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-theme-secondary">
                            <FiCheck className="text-emerald-500 mt-0.5 flex-shrink-0" size={14} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button
                        className={`w-full py-2.5 rounded-xl text-sm font-medium transition ${
                          plan.current
                            ? "text-theme-muted cursor-default"
                            : plan.popular
                            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg"
                            : "text-theme-primary hover:bg-[var(--bg-button-hover)]"
                        }`}
                        style={!plan.current && !plan.popular ? { backgroundColor: 'var(--bg-button)', border: '1px solid var(--border-secondary)' } : {}}
                        disabled={plan.current}
                      >
                        {plan.current ? "Current Plan" : "Get Started"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Modal */}
      <AnimatePresence>
        {showDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ backgroundColor: 'var(--bg-overlay)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowDemo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6 border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-secondary)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {showDemo.icon && (
                    <div className={`h-8 w-8 rounded-lg ${colorMap[showDemo.color]?.bg} border ${colorMap[showDemo.color]?.border} flex items-center justify-center`}>
                      <showDemo.icon size={18} weight="duotone" className={colorMap[showDemo.color]?.icon} />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-theme-primary">{showDemo.title}</h3>
                </div>
                <button
                  onClick={() => setShowDemo(null)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-primary transition"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <FiX size={18} />
                </button>
              </div>

              <div 
                className="rounded-xl p-4 mb-4 min-h-[200px] flex items-center justify-center border"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-secondary)',
                }}
              >
                {showDemo.id === "voice" && (
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-3">
                      <Microphone size={32} weight="duotone" className="text-purple-400" />
                    </div>
                    <p className="text-sm text-theme-secondary">Tap to start recording</p>
                    <p className="text-xs text-theme-muted mt-1">Voice demo is simulated</p>
                  </div>
                )}
                {showDemo.id === "collab" && (
                  <div className="text-center">
                    <div className="flex -space-x-3 justify-center mb-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-10 w-10 rounded-full border-2 flex items-center justify-center text-xs font-medium"
                          style={{
                            backgroundColor: `hsl(${i * 100}, 60%, 50%)`,
                            borderColor: 'var(--bg-surface)',
                            color: 'white',
                          }}
                        >
                          U{i}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-theme-secondary">3 team members online</p>
                    <p className="text-xs text-theme-muted mt-1">Collaboration demo</p>
                  </div>
                )}
                {showDemo.id === "export" && (
                  <div className="text-center">
                    <div className="flex gap-2 justify-center mb-3">
                      <div 
                        className="px-3 py-2 rounded-lg text-xs font-medium text-rose-400"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                      >
                        PDF
                      </div>
                      <div 
                        className="px-3 py-2 rounded-lg text-xs font-medium text-blue-400"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                      >
                        DOCX
                      </div>
                      <div 
                        className="px-3 py-2 rounded-lg text-xs font-medium text-theme-secondary"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                      >
                        Notion
                      </div>
                    </div>
                    <p className="text-sm text-theme-secondary">Export to any format</p>
                    <p className="text-xs text-theme-muted mt-1">Export demo</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setShowDemo(null);
                  setShowPricing(true);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm flex items-center justify-center gap-2"
              >
                <Crown size={16} weight="fill" />
                Unlock with Pro
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -----------------------------------------
   Usage Bar Component - Theme Aware
----------------------------------------- */
function UsageBar({ label, used, max }) {
  const percentage = (used / max) * 100;
  const isLow = percentage >= 80;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-theme-muted">{label}</span>
        <span className={`text-xs font-medium ${isLow ? "text-amber-500" : "text-theme-secondary"}`}>
          {used}/{max}
        </span>
      </div>
      <div 
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full rounded-full ${
            isLow
              ? "bg-gradient-to-r from-amber-500 to-orange-500"
              : "bg-gradient-to-r from-indigo-500 to-purple-500"
          }`}
        />
      </div>
    </div>
  );
}