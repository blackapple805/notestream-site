// src/pages/ContactSupport.jsx
// ═══════════════════════════════════════════════════════════════════
// EDITORIAL RESKIN
// ─────────────────────────────────────────────────────────────────
// Same Supabase profile prefill, same stale-response guard, same
// `support_tickets` insert, same simulated live-chat phasing — only
// the visual layer is rebuilt to match the rest of the dashboard
// tree. The page now wears the editorial skin: paper-100 background,
// Instrument Serif headlines, Geist Mono small-caps eyebrows, an
// editorial dateline, chapter marks (№ 01, § 02 …), hairline rules,
// ed-card surfaces, ed-btn buttons — no GlassCard, no gradient
// pills, no emerald-500/15 icon chips. Form inputs sit on paper-50
// with ed-rule borders that warm to ink on focus. The live chat
// floating panel is rebuilt as a paper card with a thin top accent.
// NO data-flow changes — auth, validation, submit, and chat phases
// are byte-identical to the previous file.
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscription } from "../hooks/useSubscription";
import { useAuth } from "../hooks/useAuth";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import {
  FiArrowLeft,
  FiSend,
  FiCheck,
  FiChevronDown,
} from "react-icons/fi";
import {
  PaperPlaneTiltIcon as PaperPlaneTilt,
  XIcon as X,
  BugIcon as Bug,
  CreditCardIcon as CreditCard,
  QuestionIcon as Question,
  LightbulbIcon as Lightbulb,
  UserIcon as User,
  ChatCircleDotsIcon as ChatCircleDots,
  CheckCircleIcon as CheckCircle,
} from "@phosphor-icons/react";
import { useEditorial, ED } from "../lib/editorial";

// Tables
const USER_STATS_TABLE = "user_engagement_stats";
const SUPPORT_TICKETS_TABLE = "support_tickets";

// Support categories
const supportCategories = [
  { id: "general",  label: "General Question",       icon: Question     },
  { id: "bug",      label: "Bug Report",             icon: Bug          },
  { id: "feature",  label: "Feature Request",        icon: Lightbulb    },
  { id: "billing",  label: "Billing & Subscription", icon: CreditCard   },
  { id: "account",  label: "Account Issue",          icon: User         },
  { id: "other",    label: "Other",                  icon: ChatCircleDots },
];

// Priority levels
const priorityLevels = [
  { id: "low",    label: "Low",    description: "General questions, not urgent"   },
  { id: "medium", label: "Medium", description: "Issues affecting workflow"       },
  { id: "high",   label: "High",   description: "Critical issues, need help ASAP" },
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

// Dateline helper
function issueLine() {
  return new Date()
    .toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    .toUpperCase();
}

export default function ContactSupport() {
  useEditorial();
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  // ✅ Shared auth — replaces both getSession() call sites in this file.
  const { user: authUser, ready: authReady } = useAuth();
  const isPro = subscription?.plan && subscription.plan !== "free";

  const vol = "II";
  const no  = "21";

  // ── Profile state (DB/Auth is source of truth) ─────────────────
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profile, setProfile] = useState({ name: "", email: "" });

  // ── Form state (hydrated from profile, not localStorage) ───────
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    priority: "medium",
    subject: "",
    message: "",
  });

  // Track if user has edited name/email so hydration can't overwrite it
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

  const selectedCategory = useMemo(
    () => supportCategories.find((c) => c.id === formData.category),
    [formData.category]
  );

  // ── Insert stats row if missing (safe) ─────────────────────────
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

  // ── Load profile from Auth + DB display_name (DB wins) ─────────
  const loadProfile = async () => {
    if (!isSupabaseConfigured || !supabase) return;

    const reqId = ++loadReqIdRef.current;
    setProfileError("");
    setProfileLoading(true);

    try {
      // Wait for auth provider to settle so we don't render an empty
      // profile during the brief startup window.
      if (!authReady) {
        if (reqId !== loadReqIdRef.current) return;
        return;
      }
      const user = authUser;
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

      const authEmail = user.email || "";

      let dbName = "";
      const { data, error } = await supabase
        .from(USER_STATS_TABLE)
        .select("display_name")
        .eq("user_id", user.id)
        .single();

      if (!error) dbName = data?.display_name || "";
      if (error) {
        dbName =
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          (authEmail ? authEmail.split("@")[0] : "");
      }

      if (reqId !== loadReqIdRef.current) return;

      const nextProfile = { name: dbName, email: authEmail };
      setProfile(nextProfile);

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

  // Re-load profile when auth changes. The shared AuthProvider's
  // listener already covers SIGNED_IN/OUT/TOKEN_REFRESHED, so we
  // don't need our own subscription.
  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, authUser?.id]);

  // ── Live chat handlers (unchanged behaviour) ───────────────────
  const openLiveChat = () => {
    setShowLiveChat(true);
    if (chatMessages.length === 0) {
      setChatMessages([{ type: "bot", text: liveChatResponses.greeting }]);
    }
  };

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

  // ── Validation ─────────────────────────────────────────────────
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

  // ── Submit → saves to DB ───────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error("Supabase not configured.");
      }
      if (!authReady) throw new Error("Please wait — still signing you in.");
      const user = authUser;
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

  // ── Shared input style ─────────────────────────────────────────
  const inputBase = {
    width: "100%",
    fontFamily: ED.sans,
    fontSize: 15,
    color: ED.ink,
    background: ED.paper50,
    border: `1px solid ${ED.rule}`,
    borderRadius: 4,
    padding: "12px 14px",
    outline: "none",
    transition: "border-color .15s ease",
  };
  const inputError = { borderColor: "#a8324c" };

  return (
    <div className="ns-ed">
      <div style={{ paddingBottom: "calc(var(--mobile-nav-height, 0px) + 96px)" }}>
        {/* ━━━━━━━━━━━━━━ DATELINE ━━━━━━━━━━━━━━ */}
        <div className="ed-dateline" style={{ paddingTop: 18 }}>
          <span className="ed-mono">VOL. {vol} · NO. {no}</span>
          <span className="ed-mono">{issueLine()}</span>
          <span className="ed-mono" style={{ display: "inline-flex", alignItems: "center" }}>
            <span
              style={{
                display: "inline-block",
                width: 6, height: 6, borderRadius: 999,
                background: ED.accent, marginRight: 8,
                animation: "ed-pulse 2.4s ease-in-out infinite",
              }}
            />
            CORRESPONDENCE OPEN
          </span>
        </div>
        <hr className="ed-rule" />

        {/* ━━━━━━━━━━━━━━ COVER ━━━━━━━━━━━━━━ */}
        <section className="ed-reveal" style={{ padding: "56px 0 8px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <button
              onClick={() => navigate("/dashboard/settings")}
              aria-label="Back to settings"
              style={{
                height: 36, width: 36, borderRadius: 999,
                border: `1px solid ${ED.rule}`, color: ED.inkSoft,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: "transparent",
              }}
            >
              <FiArrowLeft size={16} />
            </button>
            <div className="ed-chapter">
              <span className="num">№ 01</span>
              <span>— THE LETTERS DESK</span>
            </div>
          </div>

          <h1
            className="ed-display"
            style={{ fontSize: "clamp(40px, 5.5vw, 76px)", marginTop: 0, marginBottom: 18, paddingBottom: "0.06em" }}
          >
            Write to us,{" "}
            <span className="ed-italic" style={{ color: ED.accent }}>we read every word</span>.
          </h1>

          <p className="ed-lede" style={{ maxWidth: 760, margin: 0 }}>
            File a ticket with the editors below, or open a live conversation
            from the corner of the page. {isPro ? "Pro members are answered within 2–4 hours." : "Standard replies arrive within 24–48 hours."}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 28 }}>
            <span className="ed-chip">
              {isPro ? "PRIORITY DESK" : "STANDARD DESK"}
            </span>
            <span className="ed-chip">
              {isPro ? "2–4 HOUR REPLIES" : "24–48 HOUR REPLIES"}
            </span>
            {!isPro && (
              <button
                onClick={() => navigate("/dashboard/ai-lab")}
                className="ed-chip ed-chip-accent"
                style={{ cursor: "pointer" }}
              >
                UPGRADE TO PRIORITY →
              </button>
            )}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━ TWO OPTIONS ━━━━━━━━━━━━━━ */}
        <section style={{ marginTop: 56 }}>
          <div className="ed-chapter" style={{ marginBottom: 18 }}>
            <span className="num">§ 02</span>
            <span>— TWO WAYS TO REACH US</span>
          </div>
          <hr className="ed-rule" />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 0,
              borderBottom: `1px solid ${ED.rule}`,
            }}
          >
            <button
              onClick={openLiveChat}
              style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr auto",
                gap: 16,
                alignItems: "baseline",
                padding: "28px 4px 28px 4px",
                borderRight: `1px solid ${ED.rule}`,
                background: "transparent",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span className="ed-mono" style={{ fontSize: 11, letterSpacing: "0.14em", color: ED.inkFaint }}>
                01
              </span>
              <div>
                <p className="ed-serif" style={{ fontSize: "clamp(22px, 2.2vw, 28px)", margin: 0, color: ED.ink, lineHeight: 1.2 }}>
                  Live conversation
                </p>
                <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint, marginTop: 6 }}>
                  AN EDITOR JOINS WITHIN MINUTES
                </p>
              </div>
              <span className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.14em", color: ED.accent }}>
                OPEN →
              </span>
            </button>

            <button
              onClick={() => document.getElementById("ticket-form")?.scrollIntoView({ behavior: "smooth" })}
              style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr auto",
                gap: 16,
                alignItems: "baseline",
                padding: "28px 4px",
                background: "transparent",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span className="ed-mono" style={{ fontSize: 11, letterSpacing: "0.14em", color: ED.inkFaint }}>
                02
              </span>
              <div>
                <p className="ed-serif" style={{ fontSize: "clamp(22px, 2.2vw, 28px)", margin: 0, color: ED.ink, lineHeight: 1.2 }}>
                  Written correspondence
                </p>
                <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint, marginTop: 6 }}>
                  REPLY DELIVERED BY EMAIL
                </p>
              </div>
              <span className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.14em", color: ED.accent }}>
                SCROLL ↓
              </span>
            </button>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━ TICKET FORM / SUCCESS ━━━━━━━━━━━━━━ */}
        <section style={{ marginTop: 80 }} id="ticket-form">
          <AnimatePresence mode="wait">
            {submitSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="ed-card"
                style={{ padding: "64px 36px", textAlign: "center", borderRadius: 6 }}
              >
                <div
                  style={{
                    width: 64, height: 64, margin: "0 auto 22px",
                    border: `1px solid ${ED.accent}`,
                    borderRadius: 999,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    color: ED.accent,
                  }}
                >
                  <CheckCircle size={28} weight="duotone" />
                </div>
                <p
                  className="ed-mono"
                  style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint, marginBottom: 14 }}
                >
                  — FILED WITH THE EDITORS
                </p>
                <h3 className="ed-display" style={{ fontSize: "clamp(28px, 3vw, 40px)", marginBottom: 12, paddingBottom: "0.04em" }}>
                  Your letter is in.
                </h3>
                <p className="ed-serif" style={{ fontSize: 17, color: ED.inkMute, lineHeight: 1.55, maxWidth: 480, margin: "0 auto 28px" }}>
                  We've received your message and will write back{" "}
                  <span className="ed-italic" style={{ color: ED.accent }}>
                    {isPro ? "within 2–4 hours" : "within 24–48 hours"}
                  </span>
                  . A confirmation is on its way to your inbox.
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button className="ed-btn ed-btn-ghost" onClick={resetForm}>
                    Write another
                  </button>
                  <button
                    className="ed-btn ed-btn-primary"
                    onClick={() => navigate("/dashboard/help-center")}
                  >
                    Visit the Help Center
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
              >
                <div className="ed-chapter" style={{ marginBottom: 18 }}>
                  <span className="num">§ 03</span>
                  <span>— FILE A TICKET</span>
                </div>
                <hr className="ed-rule-dbl" />

                {profileError && (
                  <div
                    style={{
                      marginTop: 20,
                      padding: "12px 16px",
                      border: `1px solid ${ED.rule}`,
                      borderLeft: "2px solid #a8324c",
                      background: ED.paper150,
                      borderRadius: 4,
                    }}
                  >
                    <p className="ed-mono" style={{ fontSize: 11, color: "#a8324c", letterSpacing: "0.06em", margin: 0 }}>
                      {profileError}
                    </p>
                  </div>
                )}

                {submitError && (
                  <div
                    style={{
                      marginTop: 20,
                      padding: "12px 16px",
                      border: `1px solid ${ED.rule}`,
                      borderLeft: "2px solid #a8324c",
                      background: ED.paper150,
                      borderRadius: 4,
                    }}
                  >
                    <p className="ed-mono" style={{ fontSize: 11, color: "#a8324c", letterSpacing: "0.06em", margin: 0 }}>
                      {submitError}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "grid", gap: 28, marginTop: 36 }}>
                  {/* Name & Email */}
                  <div className="ed-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div>
                      <label className="ed-mono" style={fieldLabel}>
                        YOUR NAME
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          touchedRef.current.name = true;
                          setFormData((p) => ({ ...p, name: e.target.value }));
                        }}
                        onFocus={(e) => (e.target.style.borderColor = ED.ink)}
                        onBlur={(e) => (e.target.style.borderColor = errors.name ? "#a8324c" : ED.rule)}
                        placeholder={profileLoading ? "Loading…" : "Jane Smith"}
                        disabled={profileLoading && !formData.name}
                        style={{ ...inputBase, ...(errors.name ? inputError : {}) }}
                      />
                      {errors.name && <p style={errorText}>{errors.name}</p>}
                    </div>

                    <div>
                      <label className="ed-mono" style={fieldLabel}>
                        EMAIL ADDRESS
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          touchedRef.current.email = true;
                          setFormData((p) => ({ ...p, email: e.target.value }));
                        }}
                        onFocus={(e) => (e.target.style.borderColor = ED.ink)}
                        onBlur={(e) => (e.target.style.borderColor = errors.email ? "#a8324c" : ED.rule)}
                        placeholder={profileLoading ? "Loading…" : "you@example.com"}
                        disabled={profileLoading && !formData.email}
                        style={{ ...inputBase, ...(errors.email ? inputError : {}) }}
                      />
                      {errors.email && <p style={errorText}>{errors.email}</p>}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="ed-mono" style={fieldLabel}>
                      CATEGORY
                    </label>
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={() => setShowCategoryDropdown((v) => !v)}
                        style={{
                          ...inputBase,
                          ...(errors.category ? inputError : {}),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        {selectedCategory ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                            <selectedCategory.icon size={16} weight="duotone" style={{ color: ED.accent }} />
                            <span style={{ color: ED.ink }}>{selectedCategory.label}</span>
                          </span>
                        ) : (
                          <span style={{ color: ED.inkFaint }}>Select a category</span>
                        )}
                        <FiChevronDown
                          size={16}
                          style={{
                            color: ED.inkFaint,
                            transform: showCategoryDropdown ? "rotate(180deg)" : "none",
                            transition: "transform .15s ease",
                          }}
                        />
                      </button>

                      <AnimatePresence>
                        {showCategoryDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                            style={{
                              position: "absolute",
                              top: "calc(100% + 6px)",
                              left: 0, right: 0,
                              zIndex: 20,
                              background: ED.paper50,
                              border: `1px solid ${ED.rule}`,
                              borderRadius: 4,
                              overflow: "hidden",
                              boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
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
                                style={{
                                  width: "100%",
                                  display: "grid",
                                  gridTemplateColumns: "auto 1fr auto",
                                  gap: 12,
                                  alignItems: "center",
                                  padding: "12px 16px",
                                  background: formData.category === cat.id ? ED.paper150 : "transparent",
                                  border: 0,
                                  borderBottom: `1px solid ${ED.ruleSoft}`,
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = ED.paper150)}
                                onMouseLeave={(e) => (e.currentTarget.style.background = formData.category === cat.id ? ED.paper150 : "transparent")}
                              >
                                <cat.icon size={16} weight="duotone" style={{ color: ED.accent }} />
                                <span className="ed-serif" style={{ fontSize: 16, color: ED.ink }}>
                                  {cat.label}
                                </span>
                                {formData.category === cat.id && (
                                  <FiCheck size={14} style={{ color: ED.accent }} />
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {errors.category && <p style={errorText}>{errors.category}</p>}
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="ed-mono" style={fieldLabel}>
                      PRIORITY
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, border: `1px solid ${ED.rule}`, borderRadius: 4 }}>
                      {priorityLevels.map((level, i) => {
                        const isActive = formData.priority === level.id;
                        return (
                          <button
                            key={level.id}
                            type="button"
                            onClick={() => setFormData((p) => ({ ...p, priority: level.id }))}
                            style={{
                              padding: "12px 10px",
                              background: isActive ? ED.ink : "transparent",
                              color: isActive ? ED.paper50 : ED.inkSoft,
                              border: 0,
                              borderRight: i < priorityLevels.length - 1 ? `1px solid ${ED.rule}` : 0,
                              cursor: "pointer",
                              fontFamily: ED.mono,
                              fontSize: 11,
                              letterSpacing: "0.14em",
                              textTransform: "uppercase",
                              transition: "background .15s ease, color .15s ease",
                            }}
                          >
                            {level.label}
                          </button>
                        );
                      })}
                    </div>
                    <p
                      className="ed-serif ed-italic"
                      style={{ fontSize: 13, color: ED.inkFaint, marginTop: 8 }}
                    >
                      {priorityLevels.find((l) => l.id === formData.priority)?.description}
                    </p>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="ed-mono" style={fieldLabel}>
                      SUBJECT
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
                      onFocus={(e) => (e.target.style.borderColor = ED.ink)}
                      onBlur={(e) => (e.target.style.borderColor = errors.subject ? "#a8324c" : ED.rule)}
                      placeholder="A short headline for your message"
                      style={{ ...inputBase, ...(errors.subject ? inputError : {}) }}
                    />
                    {errors.subject && <p style={errorText}>{errors.subject}</p>}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="ed-mono" style={fieldLabel}>
                      MESSAGE
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                      onFocus={(e) => (e.target.style.borderColor = ED.ink)}
                      onBlur={(e) => (e.target.style.borderColor = errors.message ? "#a8324c" : ED.rule)}
                      rows={6}
                      placeholder="Tell us what's happening. Steps to reproduce, error messages, screenshots if you have them — anything that helps us help you."
                      style={{
                        ...inputBase,
                        ...(errors.message ? inputError : {}),
                        resize: "vertical",
                        lineHeight: 1.5,
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 6 }}>
                      {errors.message ? (
                        <p style={errorText}>{errors.message}</p>
                      ) : <span />}
                      <p
                        className="ed-mono"
                        style={{ fontSize: 10.5, letterSpacing: "0.14em", color: ED.inkFaint, margin: 0 }}
                      >
                        {formData.message.length} CHARACTERS
                      </p>
                    </div>
                  </div>

                  {/* Submit */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="ed-btn ed-btn-primary"
                      style={{
                        padding: "13px 22px",
                        opacity: isSubmitting ? 0.6 : 1,
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <span
                            style={{
                              width: 14, height: 14, borderRadius: 999,
                              border: `1.5px solid ${ED.paper50}`,
                              borderTopColor: "transparent",
                              animation: "ed-spin 0.9s linear infinite",
                              display: "inline-block",
                            }}
                          />
                          Filing your letter…
                        </>
                      ) : (
                        <>
                          File the ticket
                          <FiSend size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ━━━━━━━━━━━━━━ QUICK LINKS ━━━━━━━━━━━━━━ */}
        <section style={{ marginTop: 96 }}>
          <div className="ed-chapter" style={{ marginBottom: 18 }}>
            <span className="num">§ 04</span>
            <span>— ELSEWHERE IN THE ISSUE</span>
          </div>
          <hr className="ed-rule" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, paddingTop: 24 }}>
            <button className="ed-btn ed-btn-ghost" onClick={() => navigate("/dashboard/help-center")}>
              Help center
            </button>
            <button className="ed-btn ed-btn-ghost" onClick={() => navigate("/dashboard/integration-docs")}>
              Integration docs
            </button>
            <button className="ed-btn ed-btn-ghost" onClick={() => navigate("/dashboard/ai-lab")}>
              View plans
            </button>
            <button className="ed-btn ed-btn-ghost" onClick={() => navigate("/dashboard/settings")}>
              Settings
            </button>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━ COLOPHON ━━━━━━━━━━━━━━ */}
        <section style={{ marginTop: 80 }}>
          <hr className="ed-rule" />
          <div className="ed-colophon">
            <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint }}>
              NOTESTREAM · VOL. {vol} · NO. {no}
            </p>
            <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint }}>
              THE LETTERS DESK · OPEN DAILY
            </p>
          </div>
        </section>
      </div>

      {/* ━━━━━━━━━━━━━━ LIVE CHAT PANEL ━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {showLiveChat && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              bottom: "calc(env(safe-area-inset-bottom) + var(--mobile-nav-height, 0px) + 16px)",
              right: 16, left: 16,
              maxWidth: 380,
              marginLeft: "auto",
              zIndex: 100,
              background: ED.paper50,
              border: `1px solid ${ED.rule}`,
              borderTop: `3px solid ${ED.accent}`,
              borderRadius: 6,
              overflow: "hidden",
              boxShadow: "0 12px 36px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderBottom: `1px solid ${ED.rule}`,
                background: ED.paper100,
              }}
            >
              <div>
                <p
                  className="ed-mono"
                  style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint, margin: 0 }}
                >
                  LIVE TRANSMISSION
                </p>
                <p className="ed-serif" style={{ fontSize: 18, color: ED.ink, margin: 0, lineHeight: 1.2 }}>
                  {chatPhase >= 3 ? (
                    <>Sarah, <span className="ed-italic" style={{ color: ED.accent }}>editor on duty</span></>
                  ) : (
                    <>The desk is <span className="ed-italic" style={{ color: ED.accent }}>listening</span></>
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowLiveChat(false)}
                aria-label="Close chat"
                style={{
                  height: 30, width: 30, borderRadius: 999,
                  border: `1px solid ${ED.rule}`, color: ED.inkSoft,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: "transparent", cursor: "pointer",
                }}
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <div
              style={{
                height: 300,
                overflowY: "auto",
                padding: 16,
                display: "flex", flexDirection: "column", gap: 12,
                background: ED.paper50,
              }}
            >
              {chatMessages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex",
                    justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      display: "flex",
                      flexDirection: msg.type === "user" ? "row-reverse" : "row",
                      alignItems: "flex-end",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 24, height: 24, borderRadius: 999,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        background: msg.type === "user" ? ED.paper200 : msg.type === "agent" ? ED.accent : ED.paper200,
                        color: msg.type === "agent" ? ED.paper50 : ED.ink,
                        fontFamily: ED.serif,
                        fontStyle: "italic",
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {msg.type === "user" ? "y" : msg.type === "agent" ? "S" : "n"}
                    </div>
                    <div
                      className="ed-serif"
                      style={{
                        fontSize: 15,
                        lineHeight: 1.5,
                        padding: "10px 14px",
                        color: ED.ink,
                        background: msg.type === "user" ? ED.paper150 : "transparent",
                        border: `1px solid ${ED.rule}`,
                        borderRadius: 4,
                      }}
                    >
                      <ChatMessage text={msg.text} />
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                  <div
                    style={{
                      width: 24, height: 24, borderRadius: 999,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: ED.paper200, color: ED.ink,
                      fontFamily: ED.serif, fontStyle: "italic", fontSize: 13,
                    }}
                  >
                    n
                  </div>
                  <div
                    style={{
                      padding: "10px 14px",
                      border: `1px solid ${ED.rule}`,
                      borderRadius: 4,
                      display: "flex",
                      gap: 4,
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: 999, background: ED.inkFaint, animation: "ed-bounce 1.2s infinite", animationDelay: "0ms" }} />
                    <span style={{ width: 5, height: 5, borderRadius: 999, background: ED.inkFaint, animation: "ed-bounce 1.2s infinite", animationDelay: "150ms" }} />
                    <span style={{ width: 5, height: 5, borderRadius: 999, background: ED.inkFaint, animation: "ed-bounce 1.2s infinite", animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div style={{ padding: 14, borderTop: `1px solid ${ED.rule}`, background: ED.paper100 }}>
              <form
                onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }}
                style={{ display: "flex", gap: 8 }}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your message…"
                  onFocus={(e) => (e.target.style.borderColor = ED.ink)}
                  onBlur={(e) => (e.target.style.borderColor = ED.rule)}
                  style={{
                    flex: 1,
                    fontFamily: ED.sans,
                    fontSize: 14,
                    color: ED.ink,
                    background: ED.paper50,
                    border: `1px solid ${ED.rule}`,
                    borderRadius: 4,
                    padding: "10px 12px",
                    outline: "none",
                    transition: "border-color .15s ease",
                  }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  aria-label="Send"
                  style={{
                    height: 38, width: 38, borderRadius: 4,
                    background: chatInput.trim() ? ED.ink : ED.paper200,
                    color: ED.paper50,
                    border: 0,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    cursor: chatInput.trim() ? "pointer" : "not-allowed",
                    transition: "background .15s ease",
                  }}
                >
                  <PaperPlaneTilt size={16} weight="fill" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating launcher */}
      {!showLiveChat && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={openLiveChat}
          aria-label="Open live chat"
          style={{
            position: "fixed",
            bottom: "calc(env(safe-area-inset-bottom) + var(--mobile-nav-height, 0px) + 16px)",
            right: 16,
            width: 54, height: 54,
            borderRadius: 999,
            background: ED.ink,
            color: ED.paper50,
            border: `1px solid ${ED.ink}`,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            zIndex: 100,
          }}
        >
          <ChatCircleDots size={22} weight="duotone" />
        </motion.button>
      )}

      {/* Page-scoped keyframes (don't override editorial system) */}
      <style>{`
        @keyframes ed-spin { to { transform: rotate(360deg); } }
        @keyframes ed-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-3px); opacity: 1; }
        }
        @media (max-width: 720px) {
          .ed-form-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ── Small style constants used across the form ───────────────────
const fieldLabel = {
  display: "block",
  fontSize: 10.5,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--ed-ink-faint)",
  marginBottom: 8,
};

const errorText = {
  fontFamily: "var(--ed-mono)",
  fontSize: 11,
  color: "#a8324c",
  marginTop: 6,
  letterSpacing: "0.04em",
  margin: 0,
  paddingTop: 6,
};

// Chat message renderer with bold (**...**) and line breaks
function ChatMessage({ text }) {
  const lines = text.split("\n");
  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      {lines.map((line, lineIdx) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={lineIdx}>
            {parts.map((part, idx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={idx} style={{ fontFamily: "var(--ed-serif)", fontStyle: "italic", color: "var(--ed-accent)", fontWeight: 400 }}>
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
