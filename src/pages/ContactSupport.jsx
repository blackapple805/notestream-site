// src/pages/ContactSupport.jsx
// ✅ DB-first profile prefill (no localStorage for name/email)
// ✅ Stale-response guard to prevent “revert”
// ✅ Saves support tickets to Supabase (support_tickets)

import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import { useSubscription } from "../hooks/useSubscription";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import {
  FiArrowLeft,
  FiSend,
  FiCheck,
  FiMessageSquare,
  FiMail,
  FiChevronDown,
} from "react-icons/fi";
import {
  ChatCircleDots,
  Envelope,
  PaperPlaneTilt,
  Robot,
  User,
  X,
  Bug,
  CreditCard,
  Question,
  Lightbulb,
  Crown,
  CheckCircle,
  Clock,
} from "phosphor-react";

// Tables
const USER_STATS_TABLE = "user_engagement_stats";
const SUPPORT_TICKETS_TABLE = "support_tickets";

// Support categories
const supportCategories = [
  { id: "general", label: "General Question", icon: Question, color: "sky" },
  { id: "bug", label: "Bug Report", icon: Bug, color: "rose" },
  { id: "feature", label: "Feature Request", icon: Lightbulb, color: "amber" },
  { id: "billing", label: "Billing & Subscription", icon: CreditCard, color: "emerald" },
  { id: "account", label: "Account Issue", icon: User, color: "purple" },
  { id: "other", label: "Other", icon: ChatCircleDots, color: "indigo" },
];

// Priority levels
const priorityLevels = [
  { id: "low", label: "Low", description: "General questions, not urgent", color: "emerald" },
  { id: "medium", label: "Medium", description: "Issues affecting workflow", color: "amber" },
  { id: "high", label: "High", description: "Critical issues, need help ASAP", color: "rose" },
];

// Simulated support bot responses
const liveChatResponses = {
  greeting:
    "Hi! 👋 I'm connecting you with our support team. While you wait, can you briefly describe your issue?",
  received:
    "Thanks for the details! I've notified our team. A support agent will be with you shortly.\n\nIn the meantime, have you checked our **Help Center**? Many common questions are answered there.",
  waiting:
    "Our team is reviewing your message. Pro and Team members get priority support with faster response times! 🚀",
  agent:
    "**Sarah from Support** has joined the chat.\n\nHi there! I've reviewed your message. How can I help you today?",
};

export default function ContactSupport() {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const isPro = subscription?.plan && subscription.plan !== "free";

  // ✅ Profile state (DB/Auth is source of truth)
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profile, setProfile] = useState({ name: "", email: "" });

  // ✅ Form state (name/email are hydrated from profile, not localStorage)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    priority: "medium",
    subject: "",
    message: "",
  });

  // Track if user has edited name/email so hydration can’t overwrite it
  const touchedRef = useRef({ name: false, email: false });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});

  // Stale-response guard (prevents revert)
  const loadReqIdRef = useRef(0);

  // Live chat state
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatPhase, setChatPhase] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Category dropdown
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const colorMap = useMemo(
    () => ({
      sky: "bg-sky-500/15 border-sky-500/25 text-sky-400",
      rose: "bg-rose-500/15 border-rose-500/25 text-rose-400",
      amber: "bg-amber-500/15 border-amber-500/25 text-amber-400",
      emerald: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
      purple: "bg-purple-500/15 border-purple-500/25 text-purple-400",
      indigo: "bg-indigo-500/15 border-indigo-500/25 text-indigo-400",
    }),
    []
  );

  const selectedCategory = supportCategories.find((c) => c.id === formData.category);

  // ✅ Insert stats row if missing (safe)
  const ensureStatsRow = async (user) => {
    if (!user?.id) return;

    const nameFromAuth =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      (user.email ? user.email.split("@")[0] : null);

    try {
      const { error } = await supabase.rpc("ensure_user_stats_exists", {
        p_user_id: user.id,
        p_display_name: nameFromAuth,
      });
      if (error) console.warn("ensure_user_stats_exists error:", error);
    } catch (err) {
      console.warn("ensureStatsRow error (non-blocking):", err);
    }
  };

  // ✅ Load profile from Auth + DB display_name (DB wins)
  const loadProfile = async () => {
    if (!isSupabaseConfigured || !supabase) return;

    const reqId = ++loadReqIdRef.current;
    setProfileError("");
    setProfileLoading(true);

    try {
      const { data: sessRes, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;

      const user = sessRes?.session?.user;
      if (!user?.id) {
        if (reqId !== loadReqIdRef.current) return;
        setProfile({ name: "", email: "" });
        setFormData((p) => ({
          ...p,
          name: touchedRef.current.name ? p.name : "",
          email: touchedRef.current.email ? p.email : "",
        }));
        return;
      }

      await ensureStatsRow(user);

      // Auth email is reliable
      const authEmail = user.email || "";

      // DB display name (single source of truth)
      let dbName = "";
      const { data, error } = await supabase
        .from(USER_STATS_TABLE)
        .select("display_name")
        .eq("user_id", user.id)
        .single();

      if (!error) dbName = data?.display_name || "";
      // If RLS blocks read, we’ll fall back to auth metadata (but won’t overwrite user edits)
      if (error) {
        dbName =
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          (authEmail ? authEmail.split("@")[0] : "");
      }

      if (reqId !== loadReqIdRef.current) return;

      const nextProfile = { name: dbName, email: authEmail };
      setProfile(nextProfile);

      // Prefill form fields, but do not override user edits
      setFormData((prev) => ({
        ...prev,
        name: touchedRef.current.name ? prev.name : nextProfile.name,
        email: touchedRef.current.email ? prev.email : nextProfile.email,
      }));
    } catch (e) {
      if (reqId !== loadReqIdRef.current) return;
      setProfileError(e?.message || "Failed to load profile.");
    } finally {
      if (reqId === loadReqIdRef.current) setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();

    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // Re-hydrate safely (guard prevents revert)
      loadProfile();
    });

    return () => sub?.subscription?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open live chat
  const openLiveChat = () => {
    setShowLiveChat(true);
    if (chatMessages.length === 0) {
      setChatMessages([{ type: "bot", text: liveChatResponses.greeting }]);
    }
  };

  // Send chat message
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { type: "user", text: userMessage }]);
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

    let response = "";
    if (chatPhase === 0) {
      response = liveChatResponses.received;
      setChatPhase(1);
      setTimeout(async () => {
        setIsTyping(true);
        await new Promise((r) => setTimeout(r, 2000));
        setIsTyping(false);
        setChatMessages((prev) => [...prev, { type: "bot", text: liveChatResponses.waiting }]);
        setChatPhase(2);

        setTimeout(async () => {
          setIsTyping(true);
          await new Promise((r) => setTimeout(r, 3000));
          setIsTyping(false);
          setChatMessages((prev) => [
            ...prev,
            { type: "agent", text: liveChatResponses.agent, agentName: "Sarah" },
          ]);
          setChatPhase(3);
        }, 4000);
      }, 3000);
    } else if (chatPhase >= 2) {
      response =
        "I understand. Let me look into that for you. Can you provide any additional details that might help?";
    }

    setIsTyping(false);
    if (response) {
      setChatMessages((prev) => [
        ...prev,
        {
          type: chatPhase >= 3 ? "agent" : "bot",
          text: response,
          agentName: chatPhase >= 3 ? "Sarah" : undefined,
        },
      ]);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email address";
    if (!formData.category) newErrors.category = "Please select a category";
    if (!formData.subject.trim()) newErrors.subject = "Subject is required";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    else if (formData.message.trim().length < 20)
      newErrors.message = "Please provide more details (at least 20 characters)";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Submit form -> saves to DB
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error("Supabase not configured.");
      }

      const { data: sessRes, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;

      const user = sessRes?.session?.user;
      if (!user?.id) throw new Error("You must be signed in to submit a ticket.");

      const payload = {
        user_id: user.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        category: formData.category,
        priority: formData.priority,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        status: "open",
        metadata: {
          plan: subscription?.plan || "free",
          app_version: "1.0.0",
          ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
        },
      };

      const { data, error } = await supabase
        .from(SUPPORT_TICKETS_TABLE)
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error("Ticket insert failed.");

      setSubmitSuccess(true);
      setErrors({});
    } catch (err) {
      setSubmitError(err?.message || "Failed to submit ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form (keep name/email)
  const resetForm = () => {
    setFormData((prev) => ({
      ...prev,
      name: profile.name || prev.name,
      email: profile.email || prev.email,
      category: "",
      priority: "medium",
      subject: "",
      message: "",
    }));
    setSubmitSuccess(false);
    setSubmitError("");
    setErrors({});
  };

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
      {/* Header */}
      <header className="pt-2 px-1">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/dashboard/settings")}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-theme-muted hover:text-theme-primary transition"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <ChatCircleDots size={18} weight="duotone" className="text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-theme-primary">
                  Contact Support
                </h1>
                <p className="text-theme-muted text-sm">We're here to help</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Support Options */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={openLiveChat}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all hover:border-indigo-500/30 hover:bg-indigo-500/5"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
            <FiMessageSquare size={22} className="text-indigo-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-theme-primary">Live Chat</p>
            <p className="text-xs text-theme-muted">Chat with us now</p>
          </div>
        </button>

        <button
          onClick={() => document.getElementById("ticket-form")?.scrollIntoView({ behavior: "smooth" })}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <FiMail size={22} className="text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-theme-primary">Submit Ticket</p>
            <p className="text-xs text-theme-muted">Email response</p>
          </div>
        </button>
      </div>

      {/* Response Time Info */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPro ? "bg-amber-500/15 border border-amber-500/25" : "bg-theme-tertiary"
            }`}
          >
            {isPro ? (
              <Crown size={20} weight="fill" className="text-amber-400" />
            ) : (
              <Clock size={20} weight="duotone" className="text-theme-muted" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-theme-primary">
              {isPro ? "Priority Support" : "Standard Support"}
            </p>
            <p className="text-xs text-theme-muted">
              {isPro ? "Average response time: 2-4 hours" : "Average response time: 24-48 hours"}
            </p>
          </div>
          {!isPro && (
            <button
              onClick={() => navigate("/dashboard/ai-lab")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white"
            >
              Upgrade
            </button>
          )}
        </div>
      </GlassCard>

      {/* Success / Form */}
      <AnimatePresence mode="wait">
        {submitSuccess ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <GlassCard className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center"
              >
                <CheckCircle size={40} weight="fill" className="text-emerald-400" />
              </motion.div>
              <h3 className="text-xl font-semibold text-theme-primary mb-2">Ticket Submitted!</h3>
              <p className="text-theme-muted text-sm mb-6">
                We've received your message and will get back to you{" "}
                {isPro ? "within 2-4 hours" : "within 24-48 hours"}. Check your email for confirmation.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border transition hover:bg-white/5"
                  style={{ borderColor: "var(--border-secondary)" }}
                >
                  Submit Another
                </button>
                <button
                  onClick={() => navigate("/dashboard/help-center")}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium"
                >
                  View Help Center
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <GlassCard id="ticket-form">
              <div className="flex items-center gap-2 mb-5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Envelope size={16} weight="duotone" className="text-emerald-400" />
                </div>
                <h2 className="text-sm font-semibold text-emerald-300">Submit a Support Ticket</h2>
              </div>

              {profileError && (
                <div className="mb-4 text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                  {profileError}
                </div>
              )}

              {submitError && (
                <div className="mb-4 text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-theme-muted mb-1.5 block">Your Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        touchedRef.current.name = true;
                        setFormData((p) => ({ ...p, name: e.target.value }));
                      }}
                      className={`w-full border rounded-xl px-4 py-2.5 text-theme-primary text-sm placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/50 transition ${
                        errors.name ? "border-rose-500/50" : ""
                      }`}
                      style={{
                        backgroundColor: "var(--bg-input)",
                        borderColor: errors.name ? undefined : "var(--border-secondary)",
                      }}
                      placeholder={profileLoading ? "Loading..." : "John Doe"}
                      disabled={profileLoading && !formData.name}
                    />
                    {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="text-xs text-theme-muted mb-1.5 block">Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        touchedRef.current.email = true;
                        setFormData((p) => ({ ...p, email: e.target.value }));
                      }}
                      className={`w-full border rounded-xl px-4 py-2.5 text-theme-primary text-sm placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/50 transition ${
                        errors.email ? "border-rose-500/50" : ""
                      }`}
                      style={{
                        backgroundColor: "var(--bg-input)",
                        borderColor: errors.email ? undefined : "var(--border-secondary)",
                      }}
                      placeholder={profileLoading ? "Loading..." : "you@example.com"}
                      disabled={profileLoading && !formData.email}
                    />
                    {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs text-theme-muted mb-1.5 block">Category *</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown((v) => !v)}
                      className={`w-full flex items-center justify-between border rounded-xl px-4 py-2.5 text-sm transition ${
                        errors.category ? "border-rose-500/50" : ""
                      }`}
                      style={{
                        backgroundColor: "var(--bg-input)",
                        borderColor: errors.category ? undefined : "var(--border-secondary)",
                      }}
                    >
                      {selectedCategory ? (
                        <div className="flex items-center gap-2">
                          <selectedCategory.icon
                            size={16}
                            className={colorMap[selectedCategory.color].split(" ")[2]}
                          />
                          <span className="text-theme-primary">{selectedCategory.label}</span>
                        </div>
                      ) : (
                        <span className="text-theme-muted">Select a category</span>
                      )}
                      <FiChevronDown
                        size={16}
                        className={`text-theme-muted transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {showCategoryDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-xl z-20 overflow-hidden"
                          style={{
                            backgroundColor: "var(--bg-surface)",
                            borderColor: "var(--border-secondary)",
                          }}
                        >
                          {supportCategories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setFormData((p) => ({ ...p, category: cat.id }));
                                setShowCategoryDropdown(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5 ${
                                formData.category === cat.id ? "bg-white/5" : ""
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colorMap[cat.color]}`}>
                                <cat.icon size={16} />
                              </div>
                              <span className="text-sm text-theme-primary">{cat.label}</span>
                              {formData.category === cat.id && <FiCheck size={16} className="ml-auto text-emerald-400" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {errors.category && <p className="text-xs text-rose-400 mt-1">{errors.category}</p>}
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs text-theme-muted mb-1.5 block">Priority</label>
                  <div className="flex gap-2">
                    {priorityLevels.map((level) => (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, priority: level.id }))}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${
                          formData.priority === level.id
                            ? level.color === "emerald"
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                              : level.color === "amber"
                              ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                              : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                            : "text-theme-muted hover:text-theme-secondary"
                        }`}
                        style={{ borderColor: formData.priority === level.id ? undefined : "var(--border-secondary)" }}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-theme-muted mt-1.5">
                    {priorityLevels.find((l) => l.id === formData.priority)?.description}
                  </p>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-xs text-theme-muted mb-1.5 block">Subject *</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
                    className={`w-full border rounded-xl px-4 py-2.5 text-theme-primary text-sm placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/50 transition ${
                      errors.subject ? "border-rose-500/50" : ""
                    }`}
                    style={{
                      backgroundColor: "var(--bg-input)",
                      borderColor: errors.subject ? undefined : "var(--border-secondary)",
                    }}
                    placeholder="Brief description of your issue"
                  />
                  {errors.subject && <p className="text-xs text-rose-400 mt-1">{errors.subject}</p>}
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs text-theme-muted mb-1.5 block">Message *</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                    rows={5}
                    className={`w-full border rounded-xl px-4 py-3 text-theme-primary text-sm placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/50 resize-none transition ${
                      errors.message ? "border-rose-500/50" : ""
                    }`}
                    style={{
                      backgroundColor: "var(--bg-input)",
                      borderColor: errors.message ? undefined : "var(--border-secondary)",
                    }}
                    placeholder="Please describe your issue in detail. Include steps to reproduce, error messages, etc."
                  />
                  <div className="flex justify-between mt-1">
                    {errors.message && <p className="text-xs text-rose-400">{errors.message}</p>}
                    <p className="text-[11px] text-theme-muted ml-auto">{formData.message.length} characters</p>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FiSend size={16} />
                      Submit Ticket
                    </>
                  )}
                </button>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Links */}
      <GlassCard className="p-4">
        <p className="text-xs text-theme-muted mb-3">Quick Links</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/dashboard/help-center")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition hover:bg-white/5"
            style={{ borderColor: "var(--border-secondary)" }}
          >
            Help Center
          </button>
          <button
            onClick={() => navigate("/dashboard/ai-lab")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition hover:bg-white/5"
            style={{ borderColor: "var(--border-secondary)" }}
          >
            View Plans
          </button>
          <button
            onClick={() => navigate("/dashboard/settings")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition hover:bg-white/5"
            style={{ borderColor: "var(--border-secondary)" }}
          >
            Settings
          </button>
        </div>
      </GlassCard>

      {/* Live Chat Widget */}
      <AnimatePresence>
        {showLiveChat && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+var(--mobile-nav-height)+16px)] right-4 left-4 sm:left-auto sm:w-[380px] z-[100] rounded-2xl border shadow-2xl overflow-hidden"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
          >
            <div
              className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-500/10 to-teal-500/10"
              style={{ borderColor: "var(--border-secondary)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <ChatCircleDots size={22} weight="fill" className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-theme-primary">Live Support</p>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {chatPhase >= 3 ? "Sarah is here" : "Connected"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLiveChat(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-theme-muted hover:text-theme-primary transition"
                style={{ backgroundColor: "var(--bg-tertiary)" }}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="h-[300px] overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-end gap-2 max-w-[85%] ${msg.type === "user" ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        msg.type === "user"
                          ? "bg-indigo-500/20 border border-indigo-500/30"
                          : msg.type === "agent"
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                          : "bg-gradient-to-br from-indigo-500 to-purple-600"
                      }`}
                    >
                      {msg.type === "user" ? (
                        <User size={14} className="text-indigo-400" />
                      ) : msg.type === "agent" ? (
                        <span className="text-[10px] font-bold text-white">S</span>
                      ) : (
                        <Robot size={14} weight="fill" className="text-white" />
                      )}
                    </div>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm ${
                        msg.type === "user"
                          ? "bg-indigo-500/15 border border-indigo-500/25 text-theme-primary rounded-br-md"
                          : "bg-theme-tertiary text-theme-secondary rounded-bl-md"
                      }`}
                    >
                      <ChatMessage text={msg.text} />
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <ChatCircleDots size={14} weight="fill" className="text-white" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-theme-tertiary">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-theme-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-theme-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-theme-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t" style={{ borderColor: "var(--border-secondary)" }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendChatMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 rounded-xl border text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-emerald-500/50 transition"
                  style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)" }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="h-10 w-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-center disabled:opacity-50 transition"
                >
                  <PaperPlaneTilt size={18} weight="fill" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showLiveChat && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openLiveChat}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+var(--mobile-nav-height)+16px)] right-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center z-[100]"
        >
          <ChatCircleDots size={26} weight="fill" />
        </motion.button>
      )}
    </div>
  );
}

// Chat message renderer with markdown-like formatting
function ChatMessage({ text }) {
  const lines = text.split("\n");
  return (
    <span className="whitespace-pre-wrap">
      {lines.map((line, lineIdx) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={lineIdx}>
            {parts.map((part, idx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={idx} className="font-semibold text-theme-primary">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={idx}>{part}</span>;
            })}
            {lineIdx < lines.length - 1 && <br />}
          </span>
        );
      })}
    </span>
  );
}
