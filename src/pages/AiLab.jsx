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
  WaveSquare,
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
    price: "$19",
    period: "per user/month",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Shared workspaces",
      "Admin dashboard",
      "SSO & security",
      "API access",
      "Priority support",
    ],
  },
];

const colorMap = {
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    icon: "text-purple-400",
    button: "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    icon: "text-indigo-400",
    button: "bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300",
  },
  sky: {
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    icon: "text-sky-400",
    button: "bg-sky-500/20 hover:bg-sky-500/30 text-sky-300",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: "text-emerald-400",
    button: "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: "text-amber-400",
    button: "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    icon: "text-rose-400",
    button: "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300",
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
          <h1 className="text-2xl font-semibold tracking-tight text-white">AI Lab</h1>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Crown size={14} weight="fill" className="text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-300">PRO</span>
          </div>
        </div>
        <p className="text-gray-400 text-sm">Unlock powerful AI features to supercharge your workflow.</p>
      </header>

      {/* Upgrade Banner */}
      <GlassCard className="border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Lightning size={24} weight="fill" className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Upgrade to Pro</h3>
              <p className="text-sm text-gray-400 mt-0.5">
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
          <h3 className="text-sm font-semibold text-white">Today's Usage</h3>
          <span className="text-xs text-gray-500">Resets at midnight</span>
        </div>
        <div className="space-y-3">
          <UsageBar label="AI Summaries" used={3} max={5} />
          <UsageBar label="Document Synth" used={1} max={2} />
          <UsageBar label="Insight Queries" used={8} max={10} />
        </div>
        <p className="text-[11px] text-gray-500 mt-3">
          <span className="text-indigo-400">Pro users</span> get unlimited access to all features.
        </p>
      </GlassCard>

      {/* Pro Features Grid */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 px-1">Pro Features</h3>
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
                  <div className="h-6 w-6 rounded-full bg-black/30 flex items-center justify-center">
                    <Lock size={12} weight="fill" className="text-gray-400" />
                  </div>
                </div>

                <div className={`h-10 w-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-3`}>
                  <Icon size={22} weight="duotone" className={colors.icon} />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{feature.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{feature.desc}</p>
                
                {feature.demo ? (
                  <button className={`text-xs px-3 py-1.5 rounded-full ${colors.button} transition`}>
                    Try Demo
                  </button>
                ) : (
                  <span className="text-xs text-gray-500">Requires Pro</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Benefits */}
      <GlassCard>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Star size={16} weight="fill" className="text-amber-400" />
          Why Upgrade?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            "Save 10+ hours per week with AI automation",
            "Never lose a note with cloud sync",
            "Turn voice memos into organized notes",
            "Collaborate with your entire team",
            "Export beautiful PDF reports",
            "Priority support when you need it",
          ].map((benefit, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FiCheck size={10} className="text-emerald-400" />
              </div>
              <span className="text-sm text-gray-300">{benefit}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Pricing Modal */}
      <AnimatePresence>
        {showPricing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-md overflow-y-auto"
          >
            <div className="min-h-full px-4 py-8">
              <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
                    <p className="text-sm text-gray-400 mt-1">Start free, upgrade when you're ready.</p>
                  </div>
                  <button
                    onClick={() => setShowPricing(false)}
                    className="h-10 w-10 rounded-xl bg-[#1c1c24] flex items-center justify-center text-gray-400 hover:text-white transition"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pricingPlans.map((plan) => (
                    <div
                      key={plan.name}
                      className={`relative bg-[#111114] border rounded-2xl p-5 ${
                        plan.popular
                          ? "border-indigo-500/50 ring-2 ring-indigo-500/20"
                          : "border-[#26262c]"
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-[10px] font-semibold text-white">
                          MOST POPULAR
                        </div>
                      )}

                      <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mb-4">
                        <span className="text-3xl font-bold text-white">{plan.price}</span>
                        <span className="text-sm text-gray-500">/{plan.period}</span>
                      </div>

                      <ul className="space-y-2 mb-5">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <FiCheck size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => {
                          if (!plan.current) {
                            alert(`Upgrade to ${plan.name} - Payment flow coming soon!`);
                          }
                        }}
                        className={`w-full py-2.5 rounded-xl font-medium text-sm transition ${
                          plan.current
                            ? "bg-[#1c1c24] text-gray-500 cursor-default"
                            : plan.popular
                            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90"
                            : "bg-[#1c1c24] text-white hover:bg-[#262631]"
                        }`}
                      >
                        {plan.current ? "Current Plan" : `Upgrade to ${plan.name}`}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 mt-6">
                  All plans include a 14-day free trial. Cancel anytime.
                </p>
              </div>
            </div>
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
            className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-md flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111114] border border-[#26262c] rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${colorMap[showDemo.color].bg} border ${colorMap[showDemo.color].border} flex items-center justify-center`}>
                    <showDemo.icon size={22} weight="duotone" className={colorMap[showDemo.color].icon} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{showDemo.title}</h3>
                </div>
                <button
                  onClick={() => setShowDemo(null)}
                  className="h-8 w-8 rounded-lg bg-[#1c1c24] flex items-center justify-center text-gray-400 hover:text-white transition"
                >
                  <FiX size={16} />
                </button>
              </div>

              <p className="text-sm text-gray-400 mb-4">{showDemo.desc}</p>

              {/* Demo Preview */}
              <div className="bg-[#0d0d14] border border-[#1f1f27] rounded-xl p-4 mb-4">
                {showDemo.id === "voice" && (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                      <WaveSquare size={32} weight="duotone" className="text-purple-400" />
                    </div>
                    <p className="text-sm text-gray-300">Tap to record a voice note</p>
                    <p className="text-xs text-gray-500 mt-1">AI will transcribe and format it</p>
                  </div>
                )}
                {showDemo.id === "collab" && (
                  <div className="text-center py-6">
                    <div className="flex -space-x-2 justify-center mb-3">
                      {["bg-indigo-500", "bg-emerald-500", "bg-amber-500"].map((bg, i) => (
                        <div key={i} className={`w-10 h-10 rounded-full ${bg} border-2 border-[#0d0d14] flex items-center justify-center text-white text-sm font-medium`}>
                          {["A", "B", "C"][i]}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-300">Invite team members</p>
                    <p className="text-xs text-gray-500 mt-1">Collaborate in real-time</p>
                  </div>
                )}
                {showDemo.id === "export" && (
                  <div className="text-center py-6">
                    <div className="flex gap-2 justify-center mb-3">
                      {["PDF", "DOCX", "MD"].map((format) => (
                        <div key={format} className="px-3 py-1.5 rounded-lg bg-[#1a1a24] border border-[#26262c] text-xs text-gray-300">
                          {format}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-300">Export to any format</p>
                    <p className="text-xs text-gray-500 mt-1">Beautiful, professional reports</p>
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
   Usage Bar Component
----------------------------------------- */
function UsageBar({ label, used, max }) {
  const percentage = (used / max) * 100;
  const isLow = percentage >= 80;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`text-xs font-medium ${isLow ? "text-amber-400" : "text-gray-300"}`}>
          {used}/{max}
        </span>
      </div>
      <div className="h-1.5 bg-[#1a1a24] rounded-full overflow-hidden">
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