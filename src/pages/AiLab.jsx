// src/pages/AiLab.jsx
import { useState, useEffect, useRef } from "react";
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
  CheckCircle,
  CreditCard,
  ShieldCheck,
  Stop,
  Play,
  Pause,
  FileText,
  FilePdf,
  FileDoc,
  Cursor,
} from "phosphor-react";
import { FiX, FiCheck, FiLock, FiCreditCard, FiCalendar, FiDownload } from "react-icons/fi";
import { useSubscription } from "../hooks/useSubscription";

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
  const { 
    subscription, 
    usage, 
    PLANS, 
    getCurrentPlan, 
    isFeatureUnlocked, 
    subscribe,
    cancelSubscription,
    isLoading 
  } = useSubscription();

  const [showPricing, setShowPricing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(null);
  const [showDemo, setShowDemo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showManage, setShowManage] = useState(false);
  
  // Payment form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  const currentPlan = getCurrentPlan();
  const isPro = subscription.plan !== "free";

  const handleUpgrade = () => setShowPricing(true);

  const handleSelectPlan = (plan) => {
    if (plan.id === "free" || plan.id === subscription.plan) return;
    setShowPricing(false);
    setShowCheckout(plan);
  };

  const handlePayment = async () => {
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) return;
    
    setIsProcessing(true);
    
    try {
      await subscribe(showCheckout.id, {
        type: "card",
        last4: cardNumber.slice(-4),
        brand: cardNumber.startsWith("4") ? "Visa" : "Mastercard",
      });
      setPaymentSuccess(true);
      
      setCardNumber("");
      setCardExpiry("");
      setCardCvc("");
      setCardName("");
      
      setTimeout(() => {
        setShowCheckout(null);
        setPaymentSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Payment failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    try {
      await cancelSubscription();
      setShowManage(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDemo = (feature) => {
    setShowDemo(feature);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

      {/* Upgrade or Manage Banner */}
      {isPro ? (
        <GlassCard className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={24} weight="fill" className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-theme-primary">{currentPlan.name} Plan Active</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                    ACTIVE
                  </span>
                </div>
                <p className="text-sm text-theme-muted mt-0.5">
                  All Pro features unlocked. Thank you for supporting NoteStream!
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowManage(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-theme-secondary font-medium text-sm border transition hover:bg-white/5"
              style={{ borderColor: 'var(--border-secondary)' }}
            >
              Manage Plan
            </button>
          </div>
        </GlassCard>
      ) : (
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
      )}

      {/* Current Usage */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-theme-primary">Today's Usage</h3>
          <span className="text-xs text-theme-muted">
            {isPro ? "Unlimited" : "Resets at midnight"}
          </span>
        </div>
        <div className="space-y-3">
          <UsageBar 
            label="AI Summaries" 
            used={usage.aiSummaries} 
            max={currentPlan.limits.aiSummaries} 
            isPro={isPro}
          />
          <UsageBar 
            label="Document Synth" 
            used={usage.documentSynth} 
            max={currentPlan.limits.documentSynth}
            isPro={isPro}
          />
          <UsageBar 
            label="Insight Queries" 
            used={usage.insightQueries} 
            max={currentPlan.limits.insightQueries}
            isPro={isPro}
          />
        </div>
        {!isPro && (
          <p className="text-[11px] text-theme-muted mt-3">
            <span className="text-indigo-400 cursor-pointer hover:underline" onClick={handleUpgrade}>
              Pro users
            </span> get unlimited access to all features.
          </p>
        )}
      </GlassCard>

      {/* Pro Features Grid */}
      <div>
        <h3 className="text-sm font-semibold text-theme-secondary mb-3 px-1">Pro Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {proFeatures.map((feature) => {
            const colors = colorMap[feature.color];
            const Icon = feature.icon;
            const unlocked = isFeatureUnlocked(feature.id);
            
            return (
              <motion.div
                key={feature.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative ${colors.bg} border ${colors.border} rounded-2xl p-4 cursor-pointer transition`}
                onClick={() => unlocked ? null : (feature.demo ? handleDemo(feature) : handleUpgrade())}
              >
                {/* Lock/Unlock Badge */}
                <div className="absolute top-3 right-3">
                  {unlocked ? (
                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <FiCheck size={12} className="text-emerald-400" />
                    </div>
                  ) : (
                    <div 
                      className="h-6 w-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--bg-overlay)' }}
                    >
                      <Lock size={12} weight="fill" className="text-theme-muted" />
                    </div>
                  )}
                </div>

                <div className={`h-10 w-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-3`}>
                  <Icon size={22} weight="duotone" className={colors.icon} />
                </div>
                <h4 className="text-sm font-semibold text-theme-primary mb-1">{feature.title}</h4>
                <p className="text-xs text-theme-muted leading-relaxed mb-3">{feature.desc}</p>
                
                {unlocked ? (
                  <span className="text-[10px] text-emerald-400 font-medium">✓ Unlocked</span>
                ) : feature.demo ? (
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
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
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
                  {Object.values(PLANS).map((plan) => {
                    const isCurrent = subscription.plan === plan.id;
                    const isPopular = plan.id === "pro";
                    
                    return (
                      <div
                        key={plan.id}
                        className={`rounded-xl p-5 border transition ${
                          isPopular ? "border-indigo-500/50 ring-1 ring-indigo-500/30" : ""
                        }`}
                        style={{
                          backgroundColor: isPopular ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-input)',
                          borderColor: isPopular ? undefined : 'var(--border-secondary)',
                        }}
                      >
                        {isPopular && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 mb-2">
                            <Star size={12} weight="fill" />
                            MOST POPULAR
                          </div>
                        )}
                        {isCurrent && (
                          <div className="text-[10px] font-semibold text-emerald-400 mb-2">
                            ✓ CURRENT PLAN
                          </div>
                        )}
                        <h3 className="text-lg font-semibold text-theme-primary">{plan.name}</h3>
                        <div className="mt-2 mb-4">
                          <span className="text-3xl font-bold text-theme-primary">${plan.price}</span>
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
                          onClick={() => handleSelectPlan(plan)}
                          disabled={isCurrent || plan.id === "free"}
                          className={`w-full py-2.5 rounded-xl text-sm font-medium transition ${
                            isCurrent || plan.id === "free"
                              ? "text-theme-muted cursor-default"
                              : isPopular
                              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/25"
                              : "text-theme-primary hover:bg-white/5 border"
                          }`}
                          style={(!isCurrent && !isPopular && plan.id !== "free") ? { borderColor: 'var(--border-secondary)' } : {}}
                        >
                          {isCurrent ? "Current Plan" : plan.id === "free" ? "Free Forever" : "Get Started"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <p className="text-center text-xs text-theme-muted mt-6">
                  <ShieldCheck size={14} className="inline mr-1" />
                  Secure payment powered by Stripe. Cancel anytime.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => !isProcessing && setShowCheckout(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-secondary)',
              }}
            >
              {paymentSuccess ? (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle size={48} weight="fill" className="text-emerald-500" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-theme-primary mb-2">Welcome to {showCheckout.name}!</h2>
                  <p className="text-theme-muted">
                    Your subscription is now active. All Pro features have been unlocked.
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-6 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-theme-primary">Checkout</h2>
                        <p className="text-sm text-theme-muted mt-1">
                          Subscribe to {showCheckout.name} - ${showCheckout.price}/{showCheckout.period}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowCheckout(null)}
                        disabled={isProcessing}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-primary transition disabled:opacity-50"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Payment Form */}
                  <div className="p-6 space-y-4">
                    {/* Card Number */}
                    <div>
                      <label className="text-xs font-medium text-theme-muted mb-2 block">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          disabled={isProcessing}
                          className="w-full px-4 py-3 pl-11 rounded-xl border text-theme-primary placeholder:text-theme-muted outline-none focus:ring-2 focus:ring-indigo-500/50 transition disabled:opacity-50"
                          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-secondary)' }}
                        />
                        <FiCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted" />
                      </div>
                    </div>

                    {/* Expiry and CVC */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-theme-muted mb-2 block">Expiry</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                          maxLength={5}
                          disabled={isProcessing}
                          className="w-full px-4 py-3 rounded-xl border text-theme-primary placeholder:text-theme-muted outline-none focus:ring-2 focus:ring-indigo-500/50 transition disabled:opacity-50"
                          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-secondary)' }}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-theme-muted mb-2 block">CVC</label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="123"
                          maxLength={4}
                          disabled={isProcessing}
                          className="w-full px-4 py-3 rounded-xl border text-theme-primary placeholder:text-theme-muted outline-none focus:ring-2 focus:ring-indigo-500/50 transition disabled:opacity-50"
                          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-secondary)' }}
                        />
                      </div>
                    </div>

                    {/* Cardholder Name */}
                    <div>
                      <label className="text-xs font-medium text-theme-muted mb-2 block">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="John Doe"
                        disabled={isProcessing}
                        className="w-full px-4 py-3 rounded-xl border text-theme-primary placeholder:text-theme-muted outline-none focus:ring-2 focus:ring-indigo-500/50 transition disabled:opacity-50"
                        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-secondary)' }}
                      />
                    </div>

                    {/* Test Card Notice */}
                    <div 
                      className="rounded-xl p-3 text-xs text-theme-muted"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    >
                      <p className="font-medium text-theme-secondary mb-1">🧪 Test Mode</p>
                      <p>Use card number <span className="font-mono text-indigo-400">4242 4242 4242 4242</span> with any future expiry and CVC.</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-tertiary)' }}>
                    <button
                      onClick={handlePayment}
                      disabled={isProcessing || !cardNumber || !cardExpiry || !cardCvc || !cardName}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/25 transition"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FiLock size={14} />
                          Pay ${showCheckout.price}/{showCheckout.period}
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-theme-muted mt-3">
                      By subscribing, you agree to our Terms of Service
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Subscription Modal */}
      <AnimatePresence>
        {showManage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={() => !isProcessing && setShowManage(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-secondary)',
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-theme-primary">Manage Subscription</h2>
                  <button
                    onClick={() => setShowManage(false)}
                    disabled={isProcessing}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-primary transition"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <FiX size={18} />
                  </button>
                </div>

                {/* Current Plan Info */}
                <div 
                  className="rounded-xl p-4 mb-6 border"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-secondary)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-theme-primary">{currentPlan.name} Plan</h3>
                      <p className="text-sm text-theme-muted">${currentPlan.price}/{currentPlan.period}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                      Active
                    </span>
                  </div>
                  
                  {subscription.paymentMethod && (
                    <div className="flex items-center gap-2 text-sm text-theme-secondary">
                      <CreditCard size={16} />
                      <span>{subscription.paymentMethod.brand} •••• {subscription.paymentMethod.last4}</span>
                    </div>
                  )}
                  
                  {subscription.expiresAt && (
                    <div className="flex items-center gap-2 text-sm text-theme-muted mt-2">
                      <FiCalendar size={14} />
                      <span>Renews {new Date(subscription.expiresAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleCancelSubscription}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl font-medium text-rose-500 border border-rose-500/30 hover:bg-rose-500/10 transition disabled:opacity-50"
                  >
                    {isProcessing ? "Cancelling..." : "Cancel Subscription"}
                  </button>
                  <p className="text-[11px] text-theme-muted text-center">
                    You'll continue to have access until your current billing period ends.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Modal - Enhanced with Interactive Demos */}
      <AnimatePresence>
        {showDemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
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
                className="rounded-xl p-4 mb-4 min-h-[280px] border overflow-hidden"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-secondary)',
                }}
              >
                {showDemo.id === "voice" && <VoiceNotesDemo />}
                {showDemo.id === "collab" && <CollaborationDemo />}
                {showDemo.id === "export" && <ExportDemo />}
              </div>

              <button
                onClick={() => {
                  setShowDemo(null);
                  handleUpgrade();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/25 transition"
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
   Voice Notes Demo Component
----------------------------------------- */
function VoiceNotesDemo() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [waveformBars, setWaveformBars] = useState(Array(20).fill(0.2));
  const intervalRef = useRef(null);
  const waveformRef = useRef(null);

  const sampleTranscriptions = [
    "Meeting notes for Q4 planning session...",
    "Remember to follow up with the design team about the new dashboard layout.",
    "Key insights: User engagement increased by 23% after implementing the new onboarding flow.",
  ];

  useEffect(() => {
    if (isRecording) {
      // Timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Waveform animation
      waveformRef.current = setInterval(() => {
        setWaveformBars(prev => 
          prev.map(() => Math.random() * 0.8 + 0.2)
        );
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (waveformRef.current) clearInterval(waveformRef.current);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (waveformRef.current) clearInterval(waveformRef.current);
    };
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsTranscribing(true);
      setWaveformBars(Array(20).fill(0.2));
      
      // Simulate transcription
      setTimeout(() => {
        setIsTranscribing(false);
        const randomTranscription = sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];
        setTranscription(randomTranscription);
      }, 2000);
    } else {
      setIsRecording(true);
      setRecordingTime(0);
      setTranscription("");
    }
  };

  const handleReset = () => {
    setIsRecording(false);
    setRecordingTime(0);
    setTranscription("");
    setIsTranscribing(false);
    setWaveformBars(Array(20).fill(0.2));
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      {/* Waveform Visualization */}
      <div className="flex items-center justify-center gap-1 h-16 w-full">
        {waveformBars.map((height, i) => (
          <motion.div
            key={i}
            className={`w-1.5 rounded-full ${isRecording ? 'bg-purple-500' : 'bg-purple-500/30'}`}
            animate={{ height: `${height * 100}%` }}
            transition={{ duration: 0.1 }}
            style={{ minHeight: '8px', maxHeight: '64px' }}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="text-2xl font-mono text-theme-primary">
        {formatTime(recordingTime)}
      </div>

      {/* Recording Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggleRecording}
        disabled={isTranscribing}
        className={`h-16 w-16 rounded-full flex items-center justify-center transition-all ${
          isRecording 
            ? 'bg-rose-500 shadow-lg shadow-rose-500/40' 
            : 'bg-purple-500 shadow-lg shadow-purple-500/40'
        } ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isRecording ? (
          <Stop size={28} weight="fill" className="text-white" />
        ) : (
          <Microphone size={28} weight="fill" className="text-white" />
        )}
      </motion.button>

      <p className="text-xs text-theme-muted">
        {isRecording ? "Tap to stop recording" : isTranscribing ? "Transcribing..." : "Tap to start recording"}
      </p>

      {/* Transcription Result */}
      {isTranscribing && (
        <div className="w-full p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-theme-muted">AI is transcribing...</span>
          </div>
        </div>
      )}

      {transcription && !isTranscribing && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full p-3 rounded-lg border border-emerald-500/30"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} weight="fill" className="text-emerald-500" />
            <span className="text-xs font-medium text-emerald-500">Transcribed</span>
          </div>
          <p className="text-sm text-theme-secondary">{transcription}</p>
          <button 
            onClick={handleReset}
            className="mt-2 text-xs text-purple-400 hover:text-purple-300 transition"
          >
            Record another →
          </button>
        </motion.div>
      )}
    </div>
  );
}

/* -----------------------------------------
   Collaboration Demo Component
----------------------------------------- */
function CollaborationDemo() {
  const [cursors, setCursors] = useState([
    { id: 1, name: "Alex", color: "#8b5cf6", x: 60, y: 45 },
    { id: 2, name: "Sarah", color: "#10b981", x: 180, y: 90 },
    { id: 3, name: "Mike", color: "#f59e0b", x: 120, y: 140 },
  ]);
  const [text, setText] = useState("Project Brief: Q4 Marketing Strategy\n\nObjectives:\n• Increase brand awareness by 25%\n• Launch 3 new campaigns\n• ");
  const [typingUser, setTypingUser] = useState(null);

  const additions = [
    { user: "Alex", text: "Expand social media presence" },
    { user: "Sarah", text: "Partner with influencers" },
    { user: "Mike", text: "Optimize ad spend ROI" },
  ];

  useEffect(() => {
    // Animate cursors
    const cursorInterval = setInterval(() => {
      setCursors(prev => prev.map(cursor => ({
        ...cursor,
        x: Math.max(20, Math.min(280, cursor.x + (Math.random() - 0.5) * 40)),
        y: Math.max(20, Math.min(180, cursor.y + (Math.random() - 0.5) * 30)),
      })));
    }, 1500);

    // Simulate typing
    let additionIndex = 0;
    const typingInterval = setInterval(() => {
      const addition = additions[additionIndex % additions.length];
      setTypingUser(addition.user);
      
      setTimeout(() => {
        setText(prev => prev + addition.text + "\n• ");
        setTypingUser(null);
        additionIndex++;
      }, 1500);
    }, 4000);

    return () => {
      clearInterval(cursorInterval);
      clearInterval(typingInterval);
    };
  }, []);

  return (
    <div className="relative h-full">
      {/* Document Preview */}
      <div 
        className="h-full rounded-lg p-3 text-xs font-mono relative overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        <pre className="text-theme-secondary whitespace-pre-wrap">{text}</pre>
        
        {typingUser && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-1"
          >
            <span 
              className="w-2 h-4 animate-pulse rounded-sm"
              style={{ backgroundColor: cursors.find(c => c.name === typingUser)?.color }}
            />
            <span className="text-[10px] text-theme-muted">{typingUser} is typing...</span>
          </motion.span>
        )}

        {/* Cursors */}
        {cursors.map(cursor => (
          <motion.div
            key={cursor.id}
            className="absolute pointer-events-none"
            animate={{ x: cursor.x, y: cursor.y }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
              <path 
                d="M0 0L16 12L8 12L4 20L0 0Z" 
                fill={cursor.color}
              />
            </svg>
            <span 
              className="absolute left-4 top-3 text-[9px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap text-white"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.name}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Online Users */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <div className="flex -space-x-2">
          {cursors.map(cursor => (
            <div
              key={cursor.id}
              className="h-6 w-6 rounded-full border-2 flex items-center justify-center text-[8px] font-bold text-white"
              style={{ 
                backgroundColor: cursor.color,
                borderColor: 'var(--bg-surface)',
              }}
            >
              {cursor.name[0]}
            </div>
          ))}
        </div>
        <span className="text-[10px] text-theme-muted">3 editing</span>
      </div>

      {/* Activity Indicator */}
      <div 
        className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px]"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-emerald-400">Live</span>
      </div>
    </div>
  );
}

/* -----------------------------------------
   Export Demo Component
----------------------------------------- */
function ExportDemo() {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const formats = [
    { id: "pdf", name: "PDF", icon: FilePdf, color: "text-rose-400", bgColor: "bg-rose-500/10", borderColor: "border-rose-500/30" },
    { id: "docx", name: "Word", icon: FileDoc, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
    { id: "md", name: "Markdown", icon: FileText, color: "text-slate-400", bgColor: "bg-slate-500/10", borderColor: "border-slate-500/30" },
    { id: "notion", name: "Notion", icon: FileText, color: "text-theme-secondary", bgColor: "bg-white/5", borderColor: "border-white/20" },
  ];

  const handleExport = (format) => {
    setSelectedFormat(format);
    setIsExporting(true);
    setExportComplete(false);

    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
    }, 2000);
  };

  const handleReset = () => {
    setSelectedFormat(null);
    setExportComplete(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Preview Area */}
      <div 
        className="flex-1 rounded-lg p-3 mb-4 relative"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {/* Document Preview */}
        <div className="space-y-2">
          <div className="h-3 w-3/4 rounded bg-theme-muted/20" />
          <div className="h-2 w-full rounded bg-theme-muted/10" />
          <div className="h-2 w-5/6 rounded bg-theme-muted/10" />
          <div className="h-2 w-full rounded bg-theme-muted/10" />
          <div className="h-6 w-1/2 rounded bg-theme-muted/5 mt-4" />
          <div className="h-2 w-full rounded bg-theme-muted/10" />
          <div className="h-2 w-4/5 rounded bg-theme-muted/10" />
        </div>

        {/* Export Overlay */}
        <AnimatePresence>
          {(isExporting || exportComplete) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            >
              {isExporting ? (
                <div className="text-center">
                  <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-theme-primary">Exporting to {selectedFormat?.name}...</p>
                </div>
              ) : exportComplete ? (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={28} weight="fill" className="text-emerald-500" />
                  </div>
                  <p className="text-sm text-theme-primary mb-1">Export Complete!</p>
                  <p className="text-xs text-theme-muted mb-3">note_export.{selectedFormat?.id}</p>
                  <button
                    onClick={handleReset}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 mx-auto"
                  >
                    <FiDownload size={12} />
                    Try another format
                  </button>
                </motion.div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Format Selection */}
      <div>
        <p className="text-xs text-theme-muted mb-2">Choose export format:</p>
        <div className="grid grid-cols-4 gap-2">
          {formats.map((format) => {
            const Icon = format.icon;
            return (
              <motion.button
                key={format.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleExport(format)}
                disabled={isExporting}
                className={`p-3 rounded-xl border ${format.bgColor} ${format.borderColor} flex flex-col items-center gap-1.5 transition disabled:opacity-50`}
              >
                <Icon size={20} weight="duotone" className={format.color} />
                <span className={`text-[10px] font-medium ${format.color}`}>{format.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -----------------------------------------
   Usage Bar Component - Theme Aware
----------------------------------------- */
function UsageBar({ label, used, max, isPro }) {
  const percentage = max === Infinity ? 30 : (used / max) * 100;
  const isLow = !isPro && percentage >= 80;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-theme-muted">{label}</span>
        <span className={`text-xs font-medium ${isLow ? "text-amber-500" : "text-theme-secondary"}`}>
          {isPro ? (
            <span className="text-emerald-400">Unlimited</span>
          ) : (
            `${used}/${max}`
          )}
        </span>
      </div>
      <div 
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: isPro ? '100%' : `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full rounded-full ${
            isPro
              ? "bg-gradient-to-r from-emerald-500 to-teal-500"
              : isLow
              ? "bg-gradient-to-r from-amber-500 to-orange-500"
              : "bg-gradient-to-r from-indigo-500 to-purple-500"
          }`}
        />
      </div>
    </div>
  );
}