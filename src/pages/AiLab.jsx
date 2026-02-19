// src/pages/AiLab.jsx
// ═══════════════════════════════════════════════════════════════════
// REDESIGNED: Matching bento-glass visual system.
// All subscription / payment / cancel / demo logic is UNCHANGED.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createSpeechRecognizer, processTranscription } from "../lib/voiceAI";
import { loadStoredProfile, getProfileSummary } from "../lib/writingProfileAI";
import {
  Crown, Lightning, Microphone, CloudArrowUp, Users, Robot, Lock, Star,
  Export, Repeat, CheckCircle, CreditCard, ShieldCheck, Stop, FileText,
  FilePdf, FileDoc, BezierCurve,
} from "phosphor-react";
import {
  FiX, FiCheck, FiLock, FiCreditCard, FiCalendar, FiDownload, FiZap,
} from "react-icons/fi";
import { useSubscription } from "../hooks/useSubscription";

/* ─── Feature definitions ─── */
const proFeatures = [
  { id: "voice", title: "Voice Notes", desc: "Record voice memos with instant AI transcription and smart formatting.", icon: Microphone, color: "purple", demo: true },
  { id: "unlimited", title: "Unlimited AI", desc: "No limits on AI summaries, analysis, or generations.", icon: Repeat, color: "indigo", demo: false },
  { id: "cloud", title: "Cloud Sync", desc: "Sync notes across all devices. Access anywhere, anytime.", icon: CloudArrowUp, color: "sky", demo: true },
  { id: "collab", title: "Team Collaboration", desc: "Share notes with your team. Real-time editing and comments.", icon: Users, color: "emerald", demo: true },
  { id: "custom", title: "Custom AI Training", desc: "Train AI on your writing style for personalized responses.", icon: Robot, color: "amber", demo: true },
  { id: "export", title: "Advanced Export", desc: "Export to PDF, Word, Notion, and more with beautiful formatting.", icon: Export, color: "rose", demo: true },
];

const colorMap = {
  purple: { accent: "#a855f7", rgb: "168,85,247" },
  indigo: { accent: "#818cf8", rgb: "99,102,241" },
  sky: { accent: "#38bdf8", rgb: "56,189,248" },
  emerald: { accent: "#10b981", rgb: "16,185,129" },
  amber: { accent: "#f59e0b", rgb: "245,158,11" },
  rose: { accent: "#f43f5e", rgb: "244,63,94" },
};

const featureRoutes = {
  custom: "/dashboard/ai-lab/training",
  cloud: "/dashboard/ai-lab/cloud-sync",
  export: "/dashboard/notes",
  voice: "/dashboard/ai-lab/voice-notes",
  collab: "/dashboard/ai-lab/team-collaboration",
};

/* ─── Scoped styles ─── */
const AILAB_STYLES = `
@keyframes ns-lab-fade-up {
  0%   { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
.ns-lab-stagger > * {
  animation: ns-lab-fade-up 0.4s cubic-bezier(.22,1,.36,1) both;
}
.ns-lab-stagger > *:nth-child(1) { animation-delay: 0.02s; }
.ns-lab-stagger > *:nth-child(2) { animation-delay: 0.05s; }
.ns-lab-stagger > *:nth-child(3) { animation-delay: 0.08s; }
.ns-lab-stagger > *:nth-child(4) { animation-delay: 0.11s; }
.ns-lab-stagger > *:nth-child(5) { animation-delay: 0.14s; }
.ns-lab-stagger > *:nth-child(6) { animation-delay: 0.17s; }

.ns-lab-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: var(--card-glass-bg, var(--bg-surface));
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--card-glass-border, var(--border-secondary));
  box-shadow: var(--card-glass-shadow, 0 8px 32px rgba(0,0,0,0.12));
}
.ns-lab-card::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%);
  pointer-events: none; z-index: 1;
}
.ns-lab-card::after {
  content: '';
  position: absolute;
  left: 24px; right: 24px; top: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  pointer-events: none; z-index: 2;
}

.ns-lab-feature {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-secondary);
  background: var(--bg-surface);
  transition: all 0.25s cubic-bezier(.22,1,.36,1);
  cursor: pointer;
}
.ns-lab-feature:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.ns-lab-row {
  border-radius: 14px;
  border: 1px solid var(--border-secondary);
  background: var(--bg-input, var(--bg-tertiary));
  transition: all 0.2s ease;
}
`;

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function AiLab() {
  const navigate = useNavigate();
  const {
    subscription, usage, PLANS, getCurrentPlan, isFeatureUnlocked,
    subscribe, cancelSubscription, loadSubscription, isLoading,
  } = useSubscription();

  const [showPricing, setShowPricing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(null);
  const [showDemo, setShowDemo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [writingProfile, setWritingProfile] = useState(null);
  const [profileSummary, setProfileSummary] = useState("");

  const currentPlan = getCurrentPlan();
  const isPro = subscription.plan !== "free";

  // Cancel UX: optimistic + polling
  const [optimisticCancel, setOptimisticCancel] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const cancelPollRef = useRef(null);
  const isCancelingUI = optimisticCancel || subscription?.cancelAtPeriodEnd || subscription?.status === "canceling";

  useEffect(() => {
    if (!optimisticCancel) return;
    if (subscription?.cancelAtPeriodEnd || subscription?.status === "canceling") { setOptimisticCancel(false); return; }
    let tries = 0;
    const maxTries = 12;
    if (cancelPollRef.current) clearInterval(cancelPollRef.current);
    cancelPollRef.current = setInterval(async () => {
      tries += 1;
      try { await loadSubscription(); } catch {}
      if (subscription?.cancelAtPeriodEnd || subscription?.status === "canceling") { clearInterval(cancelPollRef.current); cancelPollRef.current = null; setOptimisticCancel(false); return; }
      if (tries >= maxTries) { clearInterval(cancelPollRef.current); cancelPollRef.current = null; setCancelError("Cancellation sent, confirmation taking longer than expected. Please refresh."); }
    }, 800);
    return () => { if (cancelPollRef.current) { clearInterval(cancelPollRef.current); cancelPollRef.current = null; } };
  }, [optimisticCancel]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const userId = subscription?.userId || subscription?.user_id;
        if (!userId) return;
        const profile = await loadStoredProfile(userId);
        if (!mounted) return;
        setWritingProfile(profile);
        setProfileSummary(getProfileSummary(profile));
      } catch (e) { console.error("loadStoredProfile failed:", e); }
    })();
    return () => { mounted = false; };
  }, [subscription?.userId, subscription?.user_id]);

  /* ── Handlers ── */
  const handleUpgrade = () => setShowPricing(true);
  const handleSelectPlan = (plan) => { if (plan.id === "free" || plan.id === subscription.plan) return; setShowPricing(false); setShowCheckout(plan); };

  const formatCardNumber = (value) => { const digits = String(value || "").replace(/\D/g, "").slice(0, 16); return (digits.match(/.{1,4}/g) || []).join(" "); };
  const formatExpiry = (value) => {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 4);
    const mm = digits.slice(0, 2); const yy = digits.slice(2, 4);
    if (mm.length === 0) return ""; if (mm.length === 1) return mm;
    let monthNum = parseInt(mm, 10); if (Number.isNaN(monthNum)) monthNum = 1;
    monthNum = Math.min(12, Math.max(1, monthNum));
    const mmFixed = String(monthNum).padStart(2, "0");
    if (yy.length === 0) return mmFixed + "/"; return mmFixed + "/" + yy;
  };
  const sanitizeName = (value) => String(value || "").replace(/[^a-zA-Z\s'-]/g, "").slice(0, 40);

  const cardDigits = cardNumber.replace(/\s/g, "");
  const expiryDigits = cardExpiry.replace(/\D/g, "");
  const expMM = expiryDigits.slice(0, 2); const expYY = expiryDigits.slice(2, 4);
  const isCardValid = cardDigits.length === 16;
  const isCvcValid = /^\d{3,4}$/.test(cardCvc);
  const isNameValid = cardName.trim().length >= 2;
  const isExpiryValid = (() => { if (expMM.length !== 2 || expYY.length !== 2) return false; const mm = parseInt(expMM, 10); if (Number.isNaN(mm) || mm < 1 || mm > 12) return false; const now = new Date(); const year = 2000 + parseInt(expYY, 10); return new Date(year, mm, 1) > now; })();
  const canPay = isCardValid && isExpiryValid && isCvcValid && isNameValid && !isProcessing;

  const handlePayment = async () => {
    if (!canPay) return;
    setIsProcessing(true);
    try {
      await subscribe(showCheckout.id, { type: "card", last4: cardNumber.slice(-4), brand: cardNumber.startsWith("4") ? "Visa" : "Mastercard" });
      setPaymentSuccess(true); setCardNumber(""); setCardExpiry(""); setCardCvc(""); setCardName("");
      setTimeout(() => { setShowCheckout(null); setPaymentSuccess(false); }, 3000);
    } catch (error) { console.error("Payment failed:", error); }
    finally { setIsProcessing(false); }
  };

  /* FIX: removed setShowManage(false) so modal stays open and transitions smoothly to canceling state */
  const handleCancelSubscription = async () => {
    setCancelError(null); setOptimisticCancel(true); setIsProcessing(true);
    try {
      await Promise.race([cancelSubscription(), new Promise((_, rej) => setTimeout(() => rej(new Error("Cancel timed out")), 6000))]);
      await loadSubscription();
    } catch (err) { setCancelError(err?.message === "Cancel timed out" ? "Cancellation submitted. Confirmation taking longer than expected." : err?.message || String(err)); }
    finally { setIsProcessing(false); }
  };

  const handleDemo = (feature, unlocked) => setShowDemo({ ...feature, unlocked });
  const openFeature = (feature, unlocked) => {
    if (unlocked) { const route = featureRoutes[feature.id]; if (route) { setShowDemo(null); setShowPricing(false); setShowCheckout(null); setShowManage(false); navigate(route); return; } if (feature.demo !== true) return; return handleDemo(feature, true); }
    if (feature.demo === true) return handleDemo(feature, false);
    return handleUpgrade();
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <>
        <style>{AILAB_STYLES}</style>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full" style={{ border: "2.5px solid transparent", borderTopColor: "rgba(99,102,241,0.8)", borderRightColor: "rgba(168,85,247,0.4)", animation: "spin 0.8s linear infinite" }} />
            <div className="absolute inset-2 rounded-full" style={{ border: "2px solid transparent", borderBottomColor: "rgba(6,182,212,0.6)", animation: "spin 1.2s linear infinite reverse" }} />
            <BezierCurve size={20} weight="duotone" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading AI Lab…</p>
        </div>
      </>
    );
  }

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <>
      <style>{AILAB_STYLES}</style>

      <div className="space-y-5 pb-[calc(var(--mobile-nav-height)+24px)] ns-lab-stagger">

        {/* ── HEADER ── */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.12))", border: "1px solid rgba(99,102,241,0.28)" }}>
              <BezierCurve weight="duotone" size={22} className="text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>AI Lab</h1>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                  style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.1))", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>
                  <Crown size={11} weight="fill" /> PRO
                </span>
              </div>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Unlock powerful AI features for your workflow</p>
            </div>
          </div>
        </header>

        {/* ── PLAN STATUS BANNER (smooth transition, no stutter) ── */}
        <motion.div layout transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
          {isPro ? (
            <div className="ns-lab-card" style={{ borderColor: isCancelingUI ? "rgba(245,158,11,0.25)" : "rgba(16,185,129,0.25)", transition: "border-color 0.3s ease" }}>
              <div className="relative z-10 p-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={{
                      background: isCancelingUI
                        ? "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.1))"
                        : "linear-gradient(135deg, #10b981, #0d9488)",
                      boxShadow: isCancelingUI ? "none" : "0 4px 16px rgba(16,185,129,0.3)",
                      border: isCancelingUI ? "1px solid rgba(245,158,11,0.25)" : "none",
                    }}>
                    {isCancelingUI
                      ? <FiCalendar size={20} style={{ color: "#f59e0b" }} />
                      : <CheckCircle size={22} weight="fill" className="text-white" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                        {isCancelingUI ? `${currentPlan.name} Plan Canceling` : `${currentPlan.name} Plan Active`}
                      </h3>
                      {isCancelingUI ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>CANCELING</span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>ACTIVE</span>
                      )}
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {isCancelingUI
                        ? `Access until ${subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString(undefined, { month: "long", day: "numeric" }) : "end of billing period"}`
                        : "All Pro features unlocked"
                      }
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowManage(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition"
                  style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-secondary)" }}>
                  Manage Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="ns-lab-card" style={{ borderColor: "rgba(99,102,241,0.25)" }}>
              <div className="relative z-10 p-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
                    <Lightning size={22} weight="fill" className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Upgrade to Pro</h3>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Unlimited AI, voice notes, cloud sync & more</p>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleUpgrade}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
                  <Crown size={15} weight="fill" /> View Plans
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Cancel error */}
        {cancelError && (
          <div className="rounded-xl p-3" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "#f43f5e" }}>
            <p className="text-sm">{cancelError}</p>
          </div>
        )}

        {/* ── USAGE ── */}
        <div className="ns-lab-card">
          <div className="relative z-10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Today's Usage</h3>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-muted)" }}>
                {isPro ? "∞ Unlimited" : "Resets at midnight"}
              </span>
            </div>
            <div className="space-y-3">
              <UsageBar label="AI Summaries" used={usage.aiSummaries} max={currentPlan.limits.aiSummaries} isPro={isPro} />
              <UsageBar label="Document Synth" used={usage.documentSynth} max={currentPlan.limits.documentSynth} isPro={isPro} />
              <UsageBar label="Insight Queries" used={usage.insightQueries} max={currentPlan.limits.insightQueries} isPro={isPro} />
              {typeof currentPlan.limits.voiceTranscriptions !== "undefined" && (
                <UsageBar label="Voice Transcriptions" used={usage.voiceTranscriptions} max={currentPlan.limits.voiceTranscriptions} isPro={isPro} />
              )}
            </div>
            {!isPro && (
              <p className="text-[11px] mt-3" style={{ color: "var(--text-muted)" }}>
                <span className="font-semibold cursor-pointer" style={{ color: "#818cf8" }} onClick={handleUpgrade}>Pro users</span> get unlimited access.
              </p>
            )}
          </div>
        </div>

        {/* ── FEATURE GRID ── */}
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3 px-1" style={{ color: "var(--text-muted)" }}>Pro Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ns-lab-stagger">
            {proFeatures.map((feature) => {
              const c = colorMap[feature.color];
              const Icon = feature.icon;
              const unlocked = isFeatureUnlocked(feature.id);
              const canPreview = feature.demo === true;

              return (
                <motion.div key={feature.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="ns-lab-feature p-4" onClick={() => openFeature(feature, unlocked)}
                  style={{ borderColor: `rgba(${c.rgb},0.2)` }}>
                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    {unlocked ? (
                      <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
                        <FiCheck size={11} style={{ color: "#10b981" }} />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-secondary)" }}>
                        <Lock size={11} weight="fill" style={{ color: "var(--text-muted)" }} />
                      </div>
                    )}
                  </div>

                  {/* Icon */}
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `rgba(${c.rgb},0.1)`, border: `1px solid rgba(${c.rgb},0.25)` }}>
                    <Icon size={20} weight="duotone" style={{ color: c.accent }} />
                  </div>

                  <h4 className="text-[13px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>{feature.title}</h4>
                  <p className="text-[11px] leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>{feature.desc}</p>

                  {unlocked ? (
                    featureRoutes[feature.id] ? (
                      <button type="button" onClick={(e) => { e.stopPropagation(); openFeature(feature, true); }}
                        className="text-[11px] font-bold px-3.5 py-1.5 rounded-lg transition"
                        style={{ background: `rgba(${c.rgb},0.1)`, border: `1px solid rgba(${c.rgb},0.25)`, color: c.accent }}>
                        Open
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold px-3 py-1 rounded-lg" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>Active</span>
                    )
                  ) : canPreview ? (
                    <button type="button" onClick={(e) => { e.stopPropagation(); openFeature(feature, false); }}
                      className="text-[11px] font-bold px-3.5 py-1.5 rounded-lg transition"
                      style={{ background: `rgba(${c.rgb},0.1)`, border: `1px solid rgba(${c.rgb},0.25)`, color: c.accent }}>
                      Preview
                    </button>
                  ) : (
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Requires Pro</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
           MODALS (Pricing, Checkout, Manage, Demo)
        ═══════════════════════════════════════════════════════ */}

        {/* ── PRICING MODAL ── */}
        <AnimatePresence>
          {showPricing && (
            <ModalOverlay onClose={() => setShowPricing(false)}>
              <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto ns-lab-card mx-4">
                <div className="relative z-10 p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Choose Your Plan</h2>
                      <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>Upgrade to unlock all features</p>
                    </div>
                    <CloseBtn onClick={() => setShowPricing(false)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.values(PLANS).map((plan) => {
                      const isCurrent = subscription.plan === plan.id;
                      const isPopular = plan.id === "pro";
                      return (
                        <div key={plan.id} className="rounded-2xl p-5 transition"
                          style={{
                            background: isPopular ? "rgba(99,102,241,0.06)" : "var(--bg-input)",
                            border: `1px solid ${isPopular ? "rgba(99,102,241,0.3)" : "var(--border-secondary)"}`,
                            boxShadow: isPopular ? "0 0 24px rgba(99,102,241,0.08)" : "none",
                          }}>
                          {isPopular && <div className="flex items-center gap-1 text-[10px] font-bold mb-2" style={{ color: "#818cf8" }}><Star size={11} weight="fill" /> MOST POPULAR</div>}
                          {isCurrent && <div className="text-[10px] font-bold mb-2" style={{ color: "#10b981" }}>✓ CURRENT PLAN</div>}
                          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
                          <div className="mt-2 mb-4">
                            <span className="text-3xl font-extrabold" style={{ color: "var(--text-primary)" }}>${plan.price}</span>
                            <span className="text-sm" style={{ color: "var(--text-muted)" }}>/{plan.period}</span>
                          </div>
                          <ul className="space-y-2 mb-5">
                            {plan.features.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                                <FiCheck size={13} className="mt-0.5 flex-shrink-0" style={{ color: "#10b981" }} /> {f}
                              </li>
                            ))}
                          </ul>
                          <button onClick={() => handleSelectPlan(plan)} disabled={isCurrent || plan.id === "free"}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-40"
                            style={isCurrent || plan.id === "free" ? { color: "var(--text-muted)" } : isPopular
                              ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }
                              : { background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-primary)" }}>
                            {isCurrent ? "Current Plan" : plan.id === "free" ? "Free Forever" : "Get Started"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-center text-[11px] mt-5" style={{ color: "var(--text-muted)" }}>
                    <ShieldCheck size={13} className="inline mr-1" /> Secure payment. Cancel anytime.
                  </p>
                </div>
              </div>
            </ModalOverlay>
          )}
        </AnimatePresence>

        {/* ── CHECKOUT MODAL ── */}
        <AnimatePresence>
          {showCheckout && (
            <ModalOverlay onClose={() => !isProcessing && setShowCheckout(null)}>
              <div className="w-full max-w-md ns-lab-card mx-4 overflow-hidden">
                <div className="relative z-10">
                  {paymentSuccess ? (
                    <div className="p-8 text-center">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
                        <CheckCircle size={44} weight="fill" style={{ color: "#10b981" }} />
                      </motion.div>
                      <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Welcome to {showCheckout.name}!</h2>
                      <p style={{ color: "var(--text-muted)" }}>All Pro features unlocked.</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-5 border-b" style={{ borderColor: "var(--border-secondary)" }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Checkout</h2>
                            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>{showCheckout.name} — ${showCheckout.price}/{showCheckout.period}</p>
                          </div>
                          <CloseBtn onClick={() => setShowCheckout(null)} disabled={isProcessing} />
                        </div>
                      </div>
                      <div className="p-5 space-y-4">
                        <FormField label="Card Number" icon={<FiCreditCard size={14} />}
                          input={<input type="text" inputMode="numeric" autoComplete="cc-number" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} placeholder="4242 4242 4242 4242" maxLength={19} disabled={isProcessing} className="w-full bg-transparent outline-none text-sm pl-9" style={{ color: "var(--text-primary)" }} />} />
                        <div className="grid grid-cols-2 gap-3">
                          <FormField label="Expiry"
                            input={<input type="text" inputMode="numeric" autoComplete="cc-exp" value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" maxLength={5} disabled={isProcessing} className="w-full bg-transparent outline-none text-sm" style={{ color: "var(--text-primary)" }} />} />
                          <FormField label="CVC"
                            input={<input type="text" inputMode="numeric" autoComplete="cc-csc" value={cardCvc} onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" maxLength={4} disabled={isProcessing} className="w-full bg-transparent outline-none text-sm" style={{ color: "var(--text-primary)" }} />} />
                        </div>
                        <FormField label="Cardholder Name"
                          input={<input type="text" autoComplete="cc-name" value={cardName} onChange={(e) => setCardName(sanitizeName(e.target.value))} placeholder="John Doe" disabled={isProcessing} className="w-full bg-transparent outline-none text-sm" style={{ color: "var(--text-primary)" }} />} />
                        <div className="rounded-xl p-3 text-[11px]" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)" }}>
                          <p className="font-bold mb-0.5" style={{ color: "var(--text-secondary)" }}>🧪 Test Mode</p>
                          <p style={{ color: "var(--text-muted)" }}>Use <span className="font-mono" style={{ color: "#818cf8" }}>4242 4242 4242 4242</span> with any future expiry and CVC.</p>
                        </div>
                      </div>
                      <div className="p-5 border-t" style={{ borderColor: "var(--border-secondary)", background: "var(--bg-tertiary)" }}>
                        <button onClick={handlePayment} disabled={!canPay}
                          className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 text-white transition"
                          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: canPay ? "0 4px 16px rgba(99,102,241,0.3)" : "none" }}>
                          {isProcessing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</> : <><FiLock size={13} /> Pay ${showCheckout.price}/{showCheckout.period}</>}
                        </button>
                        {!canPay && <p className="text-center text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>Enter valid card, expiry, CVC, and name.</p>}
                        <p className="text-center text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>By subscribing, you agree to our Terms</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </ModalOverlay>
          )}
        </AnimatePresence>

        {/* ── MANAGE MODAL ── */}
        <AnimatePresence>
          {showManage && (
            <ModalOverlay onClose={() => !isProcessing && setShowManage(false)}>
              <div className="w-full max-w-md sm:max-w-lg md:max-w-xl ns-lab-card mx-4">
                <div className="relative z-10">
                  {/* Header */}
                  <div className="p-5 sm:p-6 border-b" style={{ borderColor: "var(--border-secondary)" }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.12))", border: "1px solid rgba(99,102,241,0.28)" }}>
                          <Crown weight="duotone" size={20} className="text-indigo-400" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Manage Subscription</h2>
                          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>View and manage your billing</p>
                        </div>
                      </div>
                      <CloseBtn onClick={() => setShowManage(false)} disabled={isProcessing} />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Plan + Payment Card */}
                    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-secondary)" }}>
                      <div className="p-4 sm:p-5 flex items-center justify-between"
                        style={{ background: isCancelingUI ? "rgba(245,158,11,0.04)" : "rgba(16,185,129,0.04)" }}>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: isCancelingUI
                                ? "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.1))"
                                : "linear-gradient(135deg, #10b981, #0d9488)",
                              boxShadow: isCancelingUI ? "none" : "0 4px 16px rgba(16,185,129,0.25)",
                              border: isCancelingUI ? "1px solid rgba(245,158,11,0.25)" : "none",
                            }}>
                            {isCancelingUI
                              ? <FiCalendar size={20} style={{ color: "#f59e0b" }} />
                              : <CheckCircle size={22} weight="fill" className="text-white" />
                            }
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{currentPlan.name}</h3>
                              {isCancelingUI ? (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg"
                                  style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>CANCELING</span>
                              ) : (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg"
                                  style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>ACTIVE</span>
                              )}
                            </div>
                            <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                              <span className="font-bold" style={{ color: "var(--text-secondary)" }}>${currentPlan.price}</span>/{currentPlan.period}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="h-px" style={{ background: "var(--border-secondary)" }} />
                      <div className="p-4 sm:p-5 space-y-3" style={{ background: "var(--bg-input)" }}>
                        {subscription.paymentMethod && (
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                              <CreditCard size={16} weight="duotone" style={{ color: "#818cf8" }} />
                            </div>
                            <div>
                              <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                                {subscription.paymentMethod.brand} •••• {subscription.paymentMethod.last4}
                              </p>
                              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Payment method</p>
                            </div>
                          </div>
                        )}
                        {subscription.expiresAt && (
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                              style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
                              <FiCalendar size={14} style={{ color: "#a855f7" }} />
                            </div>
                            <div>
                              <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                                {isCancelingUI ? "Access until" : "Renews"} {new Date(subscription.expiresAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                              </p>
                              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                {isCancelingUI ? "Your plan expires on this date" : "Next billing date"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* What's included */}
                    <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--bg-input)", border: "1px solid var(--border-secondary)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                        {isCancelingUI ? "You'll lose access to" : "Your plan includes"}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {currentPlan.features.slice(0, 6).map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-[12px]" style={{ color: isCancelingUI ? "var(--text-muted)" : "var(--text-secondary)" }}>
                            {isCancelingUI
                              ? <FiX size={12} style={{ color: "#f43f5e", flexShrink: 0 }} />
                              : <FiCheck size={12} style={{ color: "#10b981", flexShrink: 0 }} />
                            }
                            <span style={{ textDecoration: isCancelingUI ? "line-through" : "none", opacity: isCancelingUI ? 0.6 : 1 }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Canceling info banner */}
                    {isCancelingUI && (
                      <div className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
                            <ShieldCheck size={14} weight="duotone" style={{ color: "#f59e0b" }} />
                          </div>
                          <div>
                            <p className="text-[12px] font-bold" style={{ color: "#f59e0b" }}>Cancellation scheduled</p>
                            <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                              You'll keep Pro access until {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString(undefined, { month: "long", day: "numeric" }) : "the end of your billing period"}. After that, you'll be downgraded to the Free plan.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-5 sm:p-6 border-t" style={{ borderColor: "var(--border-secondary)", background: "var(--bg-tertiary)" }}>
                    <div className="space-y-2">
                      {!isCancelingUI && (
                        <button onClick={handleCancelSubscription} disabled={isProcessing}
                          className="w-full py-3 rounded-xl font-semibold text-sm transition disabled:opacity-40"
                          style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.25)", color: "#f43f5e" }}>
                          {isProcessing ? "Cancelling…" : "Cancel Subscription"}
                        </button>
                      )}
                      <button onClick={() => setShowManage(false)}
                        className="w-full py-3 rounded-xl font-semibold text-sm transition"
                        style={{ background: "var(--bg-input)", border: "1px solid var(--border-secondary)", color: "var(--text-secondary)" }}>
                        {isCancelingUI ? "Close" : "Keep My Plan"}
                      </button>
                      {cancelError && <p className="text-[11px] text-center" style={{ color: "#f43f5e" }}>{cancelError}</p>}
                      {!isCancelingUI && (
                        <p className="text-[11px] text-center" style={{ color: "var(--text-muted)" }}>
                          Access continues until your billing period ends.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </ModalOverlay>
          )}
        </AnimatePresence>

        {/* ── DEMO MODAL ── */}
        <AnimatePresence>
          {showDemo && (
            <ModalOverlay onClose={() => setShowDemo(null)}>
              <div className="w-full max-w-md ns-lab-card mx-4">
                <div className="relative z-10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      {showDemo.icon && (() => {
                        const DemoIcon = showDemo.icon;
                        const c = colorMap[showDemo.color];
                        return (
                          <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                            style={{ background: `rgba(${c.rgb},0.1)`, border: `1px solid rgba(${c.rgb},0.25)` }}>
                            <DemoIcon size={18} weight="duotone" style={{ color: c.accent }} />
                          </div>
                        );
                      })()}
                      <div>
                        <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{showDemo.title}</h3>
                        {!showDemo.unlocked && <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Preview mode</p>}
                      </div>
                    </div>
                    <CloseBtn onClick={() => setShowDemo(null)} />
                  </div>

                  <div className="rounded-xl p-4 mb-4 min-h-[280px] overflow-hidden" style={{ background: "var(--bg-input)", border: "1px solid var(--border-secondary)" }}>
                    {showDemo.id === "voice" && <VoiceNotesDemo />}
                    {showDemo.id === "collab" && <CollaborationDemo />}
                    {showDemo.id === "export" && <ExportDemo />}
                    {showDemo.id === "cloud" && <CloudSyncDemo unlocked={!!showDemo.unlocked} />}
                    {showDemo.id === "custom" && <CustomTrainingDemo unlocked={!!showDemo.unlocked} />}
                  </div>

                  {showDemo.unlocked ? (
                    <button onClick={() => setShowDemo(null)}
                      className="w-full py-3 rounded-xl text-sm font-semibold transition"
                      style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-secondary)" }}>
                      Close
                    </button>
                  ) : (
                    <button onClick={() => { setShowDemo(null); handleUpgrade(); }}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition"
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
                      <Crown size={15} weight="fill" /> Unlock with Pro
                    </button>
                  )}
                </div>
              </div>
            </ModalOverlay>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}


/* ═══════════════════════════════════════════════════════
   SHARED HELPERS
═══════════════════════════════════════════════════════ */

const ModalOverlay = ({ children, onClose }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    style={{ backgroundColor: "var(--bg-overlay, rgba(0,0,0,0.6))", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
    onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}>
      {children}
    </motion.div>
  </motion.div>
);

const CloseBtn = ({ onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    className="h-8 w-8 rounded-xl flex items-center justify-center transition disabled:opacity-40"
    style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-muted)" }}>
    <FiX size={16} />
  </button>
);

const FormField = ({ label, icon, input }) => (
  <div>
    <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: "var(--text-muted)" }}>{label}</label>
    <div className="relative rounded-xl px-4 py-3 transition" style={{ background: "var(--bg-input)", border: "1px solid var(--border-secondary)" }}>
      {icon && <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>{icon}</span>}
      {input}
    </div>
  </div>
);

function UsageBar({ label, used, max, isPro }) {
  const pct = max === Infinity ? 30 : (used / max) * 100;
  const isLow = !isPro && pct >= 80;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className="text-[11px] font-bold" style={{ color: isLow ? "#f59e0b" : "var(--text-secondary)" }}>
          {isPro ? <span style={{ color: "#10b981" }}>Unlimited</span> : `${used}/${max}`}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: isPro ? "100%" : `${pct}%` }} transition={{ duration: 0.5 }}
          className="h-full rounded-full"
          style={{ background: isPro ? "linear-gradient(90deg, #10b981, #0d9488)" : isLow ? "linear-gradient(90deg, #f59e0b, #f97316)" : "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   DEMO COMPONENTS
═══════════════════════════════════════════════════════ */

function VoiceNotesDemo() {
  const { incrementUsage } = useSubscription();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [waveformBars, setWaveformBars] = useState(Array(20).fill(0.2));
  const intervalRef = useRef(null);
  const waveformRef = useRef(null);
  const recognizerRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
      waveformRef.current = setInterval(() => setWaveformBars((p) => p.map(() => Math.random() * 0.8 + 0.2)), 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (waveformRef.current) clearInterval(waveformRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); if (waveformRef.current) clearInterval(waveformRef.current); };
  }, [isRecording]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false); setIsTranscribing(true); setWaveformBars(Array(20).fill(0.2));
      const recognizer = recognizerRef.current;
      if (!recognizer) { setIsTranscribing(false); return; }
      recognizer.onEnd(async (finalText) => {
        try { const result = await processTranscription(finalText); setTranscription(result?.cleanedText || finalText); await incrementUsage("voiceTranscriptions"); }
        catch (e) { console.error("processTranscription failed:", e); setTranscription(finalText); }
        finally { setIsTranscribing(false); recognizerRef.current = null; }
      });
      recognizer.stop(); return;
    }
    setIsRecording(true); setRecordingTime(0); setTranscription(""); setLiveText("");
    const recognizer = createSpeechRecognizer(); recognizerRef.current = recognizer;
    recognizer.onResult(({ combined }) => setLiveText(combined));
    recognizer.start();
  };

  const handleReset = () => { setIsRecording(false); setRecordingTime(0); setTranscription(""); setIsTranscribing(false); setWaveformBars(Array(20).fill(0.2)); };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="flex items-center justify-center gap-1 h-16 w-full">
        {waveformBars.map((height, i) => (
          <motion.div key={i} className="w-1.5 rounded-full" animate={{ height: `${height * 100}%` }} transition={{ duration: 0.1 }}
            style={{ minHeight: "8px", maxHeight: "64px", background: isRecording ? "#a855f7" : "rgba(168,85,247,0.25)" }} />
        ))}
      </div>
      <div className="text-2xl font-mono" style={{ color: "var(--text-primary)" }}>{formatTime(recordingTime)}</div>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleToggleRecording} disabled={isTranscribing}
        className="h-16 w-16 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
        style={{ background: isRecording ? "#f43f5e" : "#a855f7", boxShadow: isRecording ? "0 0 24px rgba(244,63,94,0.4)" : "0 0 24px rgba(168,85,247,0.4)" }}>
        {isRecording ? <Stop size={28} weight="fill" className="text-white" /> : <Microphone size={28} weight="fill" className="text-white" />}
      </motion.button>
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{isRecording ? "Tap to stop" : isTranscribing ? "Transcribing…" : "Tap to record"}</p>
      {isTranscribing && (
        <div className="w-full p-3 rounded-xl" style={{ background: "var(--bg-tertiary)" }}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>AI transcribing…</span>
          </div>
        </div>
      )}
      {transcription && !isTranscribing && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="w-full p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)" }}>
          <div className="flex items-center gap-2 mb-1.5"><CheckCircle size={13} weight="fill" style={{ color: "#10b981" }} /><span className="text-[11px] font-bold" style={{ color: "#10b981" }}>Transcribed</span></div>
          <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{transcription}</p>
          <button onClick={handleReset} className="mt-2 text-[11px] font-medium transition" style={{ color: "#a855f7" }}>Record another →</button>
        </motion.div>
      )}
    </div>
  );
}

function CollaborationDemo() {
  const [cursors, setCursors] = useState([{ id: 1, name: "Alex", color: "#8b5cf6", x: 60, y: 45 }, { id: 2, name: "Sarah", color: "#10b981", x: 180, y: 90 }, { id: 3, name: "Mike", color: "#f59e0b", x: 120, y: 140 }]);
  const [text, setText] = useState("Project Brief: Q4 Marketing Strategy\n\nObjectives:\n• Increase brand awareness by 25%\n• Launch 3 new campaigns\n• ");
  const [typingUser, setTypingUser] = useState(null);
  const additions = useRef([{ user: "Alex", text: "Expand social media presence" }, { user: "Sarah", text: "Partner with influencers" }, { user: "Mike", text: "Optimize ad spend ROI" }]);

  useEffect(() => {
    const ci = setInterval(() => { setCursors((p) => p.map((c) => ({ ...c, x: Math.max(20, Math.min(280, c.x + (Math.random() - 0.5) * 40)), y: Math.max(20, Math.min(180, c.y + (Math.random() - 0.5) * 30)) }))); }, 1500);
    let idx = 0;
    const ti = setInterval(() => { const a = additions.current[idx % additions.current.length]; setTypingUser(a.user); setTimeout(() => { setText((p) => p + a.text + "\n• "); setTypingUser(null); idx++; }, 1500); }, 4000);
    return () => { clearInterval(ci); clearInterval(ti); };
  }, []);

  return (
    <div className="relative h-full">
      <div className="h-full rounded-xl p-3 text-[11px] font-mono relative overflow-hidden" style={{ background: "var(--bg-surface)" }}>
        <pre className="whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{text}</pre>
        {typingUser && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-1"><span className="w-2 h-4 animate-pulse rounded-sm" style={{ backgroundColor: cursors.find((c) => c.name === typingUser)?.color }} /><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{typingUser} typing…</span></motion.span>}
        {cursors.map((c) => <motion.div key={c.id} className="absolute pointer-events-none" animate={{ x: c.x, y: c.y }} transition={{ type: "spring", stiffness: 100, damping: 15 }}><svg width="16" height="20" viewBox="0 0 16 20" fill="none"><path d="M0 0L16 12L8 12L4 20L0 0Z" fill={c.color} /></svg><span className="absolute left-4 top-3 text-[8px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: c.color }}>{c.name}</span></motion.div>)}
      </div>
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <div className="flex -space-x-2">{cursors.map((c) => <div key={c.id} className="h-6 w-6 rounded-full border-2 flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: c.color, borderColor: "var(--bg-surface)" }}>{c.name[0]}</div>)}</div>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>3 editing</span>
      </div>
      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px]" style={{ background: "var(--bg-tertiary)" }}><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /><span style={{ color: "#10b981" }}>Live</span></div>
    </div>
  );
}

const EXPORT_FORMATS = [
  { id: "pdf", name: "PDF", icon: FilePdf, color: "#f43f5e", rgb: "244,63,94" },
  { id: "docx", name: "Word", icon: FileDoc, color: "#3b82f6", rgb: "59,130,246" },
  { id: "md", name: "Markdown", icon: FileText, color: "#94a3b8", rgb: "148,163,184" },
  { id: "notion", name: "Notion", icon: FileText, color: "#a1a1aa", rgb: "161,161,170" },
];

function ExportDemo() {
  const { incrementUsage } = useSubscription();
  const [selectedFormat, setSelectedFormat] = useState(EXPORT_FORMATS[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const timerRef = useRef(null);

  const startExport = (format) => {
    if (!format) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setSelectedFormat(format); setIsExporting(true); setExportComplete(false);
    timerRef.current = setTimeout(async () => {
      try { setIsExporting(false); setExportComplete(true); await incrementUsage("documentSynth"); }
      catch (e) { console.error("Export increment failed:", e); }
    }, 2000);
  };
  const handleReset = () => { if (timerRef.current) clearTimeout(timerRef.current); setIsExporting(false); setExportComplete(false); };
  useEffect(() => { startExport(EXPORT_FORMATS[0]); return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 rounded-xl p-3 mb-4 relative" style={{ background: "var(--bg-surface)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Preview</div>
          <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Format: <span className="font-bold" style={{ color: "var(--text-primary)" }}>{selectedFormat?.name}</span></div>
        </div>
        <div className="space-y-2"><div className="h-3 w-3/4 rounded" style={{ background: "rgba(255,255,255,0.06)" }} /><div className="h-2 w-full rounded" style={{ background: "rgba(255,255,255,0.03)" }} /><div className="h-2 w-5/6 rounded" style={{ background: "rgba(255,255,255,0.03)" }} /><div className="h-2 w-full rounded" style={{ background: "rgba(255,255,255,0.03)" }} /><div className="h-6 w-1/2 rounded mt-4" style={{ background: "rgba(255,255,255,0.02)" }} /><div className="h-2 w-full rounded" style={{ background: "rgba(255,255,255,0.03)" }} /></div>
        <AnimatePresence>
          {(isExporting || exportComplete) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
              {isExporting ? (
                <div className="text-center"><div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-sm" style={{ color: "var(--text-primary)" }}>Exporting to {selectedFormat?.name}…</p></div>
              ) : (
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(16,185,129,0.12)" }}><CheckCircle size={28} weight="fill" style={{ color: "#10b981" }} /></div>
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Export Complete!</p>
                  <p className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>note_export.{selectedFormat?.id}</p>
                  <button onClick={handleReset} className="text-[11px] flex items-center gap-1 mx-auto" style={{ color: "#818cf8" }}><FiDownload size={11} /> Try another format</button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div>
        <p className="text-[11px] mb-2" style={{ color: "var(--text-muted)" }}>Choose format:</p>
        <div className="grid grid-cols-4 gap-2">
          {EXPORT_FORMATS.map((f) => {
            const Icon = f.icon; const active = selectedFormat?.id === f.id;
            return (
              <motion.button key={f.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => startExport(f)} disabled={isExporting}
                className="p-3 rounded-xl flex flex-col items-center gap-1.5 transition disabled:opacity-50"
                style={{ background: `rgba(${f.rgb},0.08)`, border: `1px solid rgba(${f.rgb},${active ? "0.4" : "0.2"})`, boxShadow: active ? `0 0 12px rgba(${f.rgb},0.1)` : "none" }}>
                <Icon size={18} weight="duotone" style={{ color: f.color }} />
                <span className="text-[10px] font-bold" style={{ color: f.color }}>{f.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CloudSyncDemo({ unlocked }) {
  const { incrementUsage } = useSubscription();
  const [enabled, setEnabled] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastSync, setLastSync] = useState(() => new Date(Date.now() - 1000 * 60 * 17));
  const [status, setStatus] = useState("Up to date");
  const timerRef = useRef(null);
  const [devices, setDevices] = useState([{ id: "mac", name: "MacBook Pro", state: "Synced", last: new Date(Date.now() - 1000 * 60 * 4) }, { id: "iphone", name: "iPhone", state: "Synced", last: new Date(Date.now() - 1000 * 60 * 11) }, { id: "ipad", name: "iPad", state: "Idle", last: new Date(Date.now() - 1000 * 60 * 32) }]);
  const formatTime = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const stop = () => { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; setSyncing(false); setProgress(0); };
  const run = () => {
    if (!enabled || syncing) return; setSyncing(true); setProgress(0); setStatus("Syncing…");
    setDevices((p) => p.map((x) => ({ ...x, state: x.id === "ipad" ? "Syncing" : "Synced" })));
    timerRef.current = setInterval(() => {
      setProgress((p) => { const next = Math.min(100, p + Math.floor(Math.random() * 14) + 6);
        if (next >= 100) { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; const now = new Date(); setLastSync(now); setStatus("Up to date"); setSyncing(false); setDevices((prev) => prev.map((x) => ({ ...x, state: "Synced", last: now }))); incrementUsage("insightQueries").catch(() => {}); return 100; } return next; });
    }, 350);
  };
  useEffect(() => () => stop(), []);
  useEffect(() => { if (!enabled) { stop(); setStatus("Paused"); setDevices((p) => p.map((x) => ({ ...x, state: "Paused" }))); } else { setStatus("Up to date"); setDevices((p) => p.map((x) => ({ ...x, state: x.state === "Paused" ? "Idle" : x.state }))); } }, [enabled]);

  const stateStyle = (s) => { if (s === "Synced") return { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", color: "#10b981" }; if (s === "Syncing") return { bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.25)", color: "#38bdf8" }; if (s === "Paused") return { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", color: "#f59e0b" }; return { bg: "rgba(255,255,255,0.04)", border: "var(--border-secondary)", color: "var(--text-muted)" }; };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div><h4 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Cloud Sync</h4><p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{unlocked ? "Enabled" : "Preview mode"}</p></div>
        <button onClick={() => setEnabled((v) => !v)} className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-secondary)" }}>{enabled ? "Disable" : "Enable"}</button>
      </div>
      <div className="rounded-xl p-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-secondary)" }}>
        <div className="flex items-center justify-between mb-2"><span className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>{status}</span><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Last: {formatTime(lastSync)}</span></div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full rounded-full" style={{ background: syncing ? "linear-gradient(90deg, #38bdf8, #6366f1)" : "linear-gradient(90deg, #10b981, #0d9488)" }} /></div>
        <div className="mt-3 flex gap-2">
          <button onClick={run} disabled={!enabled || syncing} className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition disabled:opacity-40" style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", color: "var(--text-primary)" }}>Run Sync</button>
          <button onClick={stop} disabled={!syncing} className="px-4 py-2 rounded-xl text-[12px] font-semibold transition disabled:opacity-40" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-secondary)" }}>Stop</button>
        </div>
        {!unlocked && <p className="mt-2 text-[10px]" style={{ color: "var(--text-muted)" }}>Mock preview. Upgrade for real sync.</p>}
      </div>
      <div className="rounded-xl p-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-secondary)" }}>
        <div className="flex items-center justify-between mb-2"><p className="text-[11px] font-bold" style={{ color: "var(--text-secondary)" }}>Devices</p><p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{devices.filter((d) => d.state === "Synced").length}/{devices.length} synced</p></div>
        <div className="space-y-1.5">{devices.map((d) => { const s = stateStyle(d.state); return (<div key={d.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--bg-input)", border: "1px solid var(--border-secondary)" }}><div className="min-w-0"><p className="text-[12px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{d.name}</p><p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Last: {formatTime(d.last)}</p></div><span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>{d.state}</span></div>); })}</div>
      </div>
    </div>
  );
}

function CustomTrainingDemo({ unlocked }) {
  const { incrementUsage } = useSubscription();
  const [enabled, setEnabled] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Ready");
  const [lastUpdate, setLastUpdate] = useState(() => new Date(Date.now() - 1000 * 60 * 53));
  const intervalRef = useRef(null);
  const [signals, setSignals] = useState({ tone: true, vocabulary: true, formatting: true, corrections: false, language: true, templates: false });
  const [stats, setStats] = useState({ samples: 128, tokens: 48210, confidence: 62 });
  const formatTime = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const stop = () => { if (intervalRef.current) clearInterval(intervalRef.current); intervalRef.current = null; setCollecting(false); setProgress(0); };
  const totalEnabled = Object.values(signals).filter(Boolean).length;
  const start = () => {
    if (!enabled || collecting) return; setCollecting(true); setProgress(0); setStatus("Learning…");
    intervalRef.current = setInterval(() => {
      setProgress((p) => { const next = Math.min(100, p + Math.floor(Math.random() * 12) + 5);
        if (next >= 100) { if (intervalRef.current) clearInterval(intervalRef.current); intervalRef.current = null; setLastUpdate(new Date()); setCollecting(false); setStatus("Profile updated"); setStats((s) => ({ samples: s.samples + Math.floor(Math.random() * 12) + 6, tokens: s.tokens + Math.floor(Math.random() * 2500) + 900, confidence: Math.min(95, s.confidence + Math.floor(Math.random() * 6) + 2) })); incrementUsage("insightQueries").catch(() => {}); return 100; } return next; });
    }, 280);
  };
  useEffect(() => () => stop(), []);
  useEffect(() => { if (!enabled) { stop(); setStatus("Paused"); } else { setStatus("Ready"); } }, [enabled]);
  const toggleSignal = (k) => setSignals((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div><h4 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Custom AI Training</h4><p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{unlocked ? "Enabled" : "Preview mode"}</p></div>
        <button onClick={() => setEnabled((v) => !v)} className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-secondary)" }}>{enabled ? "Disable" : "Enable"}</button>
      </div>
      <div className="rounded-xl p-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-secondary)" }}>
        <div className="flex items-center justify-between mb-2"><span className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>{status}</span><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Updated: {formatTime(lastUpdate)}</span></div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full rounded-full" style={{ background: collecting ? "linear-gradient(90deg, #f59e0b, #f43f5e)" : "linear-gradient(90deg, #6366f1, #8b5cf6)" }} /></div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg p-2" style={{ background: "var(--bg-input)", border: "1px solid var(--border-secondary)" }}><div className="text-[9px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>Samples</div><div className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>{stats.samples}</div></div>
          <div className="rounded-lg p-2" style={{ background: "var(--bg-input)", border: "1px solid var(--border-secondary)" }}><div className="text-[9px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>Tokens</div><div className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>{stats.tokens.toLocaleString()}</div></div>
          <div className="rounded-lg p-2" style={{ background: "var(--bg-input)", border: "1px solid var(--border-secondary)" }}><div className="text-[9px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>Confidence</div><div className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>{stats.confidence}%</div></div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={start} disabled={!enabled || collecting || totalEnabled === 0} className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition disabled:opacity-40" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "var(--text-primary)" }}>Run Training</button>
          <button onClick={stop} disabled={!collecting} className="px-4 py-2 rounded-xl text-[12px] font-semibold transition disabled:opacity-40" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-secondary)" }}>Stop</button>
        </div>
        {!unlocked && <p className="mt-2 text-[10px]" style={{ color: "var(--text-muted)" }}>Mock preview. Upgrade for real training.</p>}
      </div>
      <div className="rounded-xl p-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-secondary)" }}>
        <div className="flex items-center justify-between mb-2"><p className="text-[11px] font-bold" style={{ color: "var(--text-secondary)" }}>Signals</p><p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{totalEnabled} on</p></div>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(signals).map(([key, val]) => (
            <button key={key} onClick={() => toggleSignal(key)} className="flex items-center justify-between rounded-lg px-3 py-2 transition"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-secondary)" }}>
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                style={val ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" } : { background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-secondary)", color: "var(--text-muted)" }}>
                {val ? "On" : "Off"}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px]" style={{ color: "var(--text-muted)" }}>Signals build a personalization profile from your writing.</p>
      </div>
    </div>
  );
}


