// src/pages/HelpCenter.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import {
  FiSearch,
  FiX,
  FiChevronRight,
  FiChevronDown,
  FiArrowLeft,
} from "react-icons/fi";
import {
  Question,
  Robot,
  Lightbulb,
  BookOpen,
  ShieldCheck,
  Lightning,
  CloudArrowUp,
  Microphone,
  CreditCard,
  ChatCircleDots,
  PaperPlaneTilt,
  X,
  User,
} from "phosphor-react";

// FAQ Categories and Questions
const faqCategories = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: BookOpen,
    color: "indigo",
    questions: [
      {
        q: "How do I create my first note?",
        a: "To create a note, click the purple '+' button at the bottom right of the Notes page. You can give your note a title, add content, and it will be automatically saved. You can also use voice recording or upload files to create notes."
      },
      {
        q: "What file types can I upload?",
        a: "NoteStream supports PDF documents and images (JPG, PNG, GIF). Simply click the '+' button and select 'Upload' to add files. PDFs will be viewable directly in the app, and images can be attached to your notes."
      },
      {
        q: "How do I organize my notes?",
        a: "You can organize notes using tags, favorites, and the search feature. Mark important notes as favorites by clicking the heart icon, and use the filter tabs (All, Favorites, Locked, Voice) to quickly find what you need."
      },
      {
        q: "Can I use NoteStream offline?",
        a: "Basic note viewing works offline, but features like AI summaries and cloud sync require an internet connection. Your notes are stored locally and will sync when you're back online (Pro feature)."
      },
    ]
  },
  {
    id: "ai-features",
    title: "AI Features",
    icon: Lightning,
    color: "purple",
    questions: [
      {
        q: "What AI features are available?",
        a: "NoteStream offers several AI-powered features: Insight Explorer for searching across your workspace, Research Synthesizer for merging documents into briefs, auto-summarization of uploads, and Custom AI Training to personalize responses to your writing style."
      },
      {
        q: "How does the Insight Explorer work?",
        a: "Insight Explorer lets you ask questions about your workspace in natural language. It searches across all your notes and documents to find relevant information and provides AI-generated answers with source citations."
      },
      {
        q: "What are the AI usage limits?",
        a: "Free users get 5 AI summaries, 2 document syntheses, and 10 insight queries per day. Pro users enjoy unlimited access to all AI features. Usage resets at midnight."
      },
      {
        q: "Can I train the AI on my writing style?",
        a: "Yes! Pro users can access Custom AI Training in the AI Lab. This feature analyzes your writing patterns, vocabulary, and formatting preferences to personalize AI responses."
      },
    ]
  },
  {
    id: "pro-features",
    title: "Pro & Team Plans",
    icon: CreditCard,
    color: "amber",
    questions: [
      {
        q: "What's included in Pro?",
        a: "Pro ($9/month) includes: Unlimited AI features, Voice Notes with transcription, Cloud Sync across devices, Custom AI Training, Advanced Export options (PDF, Word, Notion), and priority support."
      },
      {
        q: "What's included in Team?",
        a: "Team ($25/month) includes everything in Pro plus: Up to 10 team members, Shared workspaces, Real-time collaboration, Team analytics, and Custom integrations."
      },
      {
        q: "How do I upgrade my plan?",
        a: "Go to AI Lab from the dashboard and click 'View Plans'. Select your preferred plan and complete the checkout process. Your features will be unlocked immediately."
      },
      {
        q: "Can I cancel my subscription?",
        a: "Yes, you can cancel anytime from AI Lab > Manage Plan. You'll continue to have access until the end of your billing period. No questions asked!"
      },
    ]
  },
  {
    id: "voice-notes",
    title: "Voice Notes",
    icon: Microphone,
    color: "rose",
    questions: [
      {
        q: "How do I record a voice note?",
        a: "Click the '+' button on the Notes page and select 'Voice Note'. Grant microphone permission when prompted, then tap 'Start' to begin recording. Tap 'Stop' when done, and your recording will be saved automatically."
      },
      {
        q: "Is voice transcription available?",
        a: "Yes! Pro users get automatic AI transcription of voice notes. The transcribed text is added to your note and is fully searchable."
      },
      {
        q: "What audio format is used?",
        a: "Voice notes are recorded in WebM format for optimal quality and file size. They're playable directly in the app on all modern browsers."
      },
    ]
  },
  {
    id: "security",
    title: "Security & Privacy",
    icon: ShieldCheck,
    color: "emerald",
    questions: [
      {
        q: "How do I lock a note?",
        a: "Open any note and tap the lock icon, or use the context menu (three dots) on a note card. You'll be prompted to set a 4-digit PIN if you haven't already. Locked notes require your PIN to view."
      },
      {
        q: "Is my data encrypted?",
        a: "Yes, all data is encrypted in transit using TLS 1.3. Pro users with Cloud Sync enabled also have their data encrypted at rest on our servers."
      },
      {
        q: "Can I export my data?",
        a: "Absolutely! Go to Settings > Security > Export my data. This downloads all your notes, documents, and settings as a JSON file that you can keep as a backup."
      },
      {
        q: "How do I delete my account?",
        a: "Go to Settings > Danger Zone > Delete Account. This permanently removes all your data. Please note this action cannot be undone."
      },
    ]
  },
  {
    id: "cloud-sync",
    title: "Cloud Sync",
    icon: CloudArrowUp,
    color: "sky",
    questions: [
      {
        q: "How does Cloud Sync work?",
        a: "Cloud Sync (Pro feature) automatically backs up your notes to our secure servers and syncs them across all your devices. Changes sync in real-time when you're online."
      },
      {
        q: "Which devices are supported?",
        a: "NoteStream works on any device with a modern web browser. Your synced notes are accessible on desktop, tablet, and mobile devices."
      },
      {
        q: "What happens if I'm offline?",
        a: "Your notes are stored locally and will automatically sync when you reconnect. Any changes made offline will be merged with the cloud version."
      },
    ]
  },
];

// Bot responses for common queries
const botResponses = {
  greeting: [
    "Hi there! 👋 I'm NoteBot, your AI assistant. How can I help you today?",
    "Hello! I'm here to help you get the most out of NoteStream. What would you like to know?",
    "Hey! 👋 Welcome to NoteStream support. Ask me anything!"
  ],
  upgrade: "To upgrade to Pro or Team, head to the **AI Lab** from your dashboard and click **View Plans**. You'll get instant access to all premium features! Would you like me to explain what's included?",
  pricing: "Our plans are:\n\n• **Free** - Basic features, 5 AI summaries/day\n• **Pro** ($9/month) - Unlimited AI, Voice Notes, Cloud Sync\n• **Team** ($25/month) - Everything in Pro + collaboration for up to 10 members\n\nWould you like more details on any plan?",
  voice: "Voice Notes let you record audio memos that are automatically transcribed (Pro feature). Tap the **+** button → **Voice Note** to get started. Need help with something specific about voice notes?",
  ai: "NoteStream's AI features include:\n\n• **Insight Explorer** - Ask questions about your notes\n• **Research Synthesizer** - Merge documents into briefs\n• **Auto-summarize** - AI summaries for uploads\n• **Custom Training** - Personalize AI to your style\n\nWhich feature would you like to learn more about?",
  lock: "To lock a note:\n1. Open the note or tap the three dots on a note card\n2. Tap the **lock icon**\n3. Set a 4-digit PIN (first time only)\n\nLocked notes require your PIN to view. You can manage your PIN in Settings > Security.",
  export: "To export your data:\n1. Go to **Settings**\n2. Scroll to **Security**\n3. Tap **Export my data**\n\nThis downloads all your notes and settings as a JSON file. Great for backups!",
  contact: "You can reach our support team through the **Contact Support** page for personalized help. Pro and Team users get priority support with faster response times!",
  fallback: "I'm not sure I understand that question. Could you try rephrasing it? Or you can browse the FAQ categories above for common topics. You can also contact our support team for personalized help!"
};

export default function HelpCenter() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [showBot, setShowBot] = useState(false);
  const [botMessages, setBotMessages] = useState([]);
  const [botInput, setBotInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Filter FAQs based on search
  const filteredCategories = faqCategories.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0 || !searchQuery);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [botMessages]);

  // Initialize bot with greeting
  const openBot = () => {
    setShowBot(true);
    if (botMessages.length === 0) {
      const greeting = botResponses.greeting[Math.floor(Math.random() * botResponses.greeting.length)];
      setBotMessages([{ type: "bot", text: greeting }]);
    }
  };

  // Process bot message
  const sendBotMessage = async () => {
    if (!botInput.trim()) return;

    const userMessage = botInput.trim();
    setBotInput("");
    setBotMessages(prev => [...prev, { type: "user", text: userMessage }]);
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 700));

    // Simple keyword matching for responses
    const lowerMsg = userMessage.toLowerCase();
    let response = botResponses.fallback;

    if (lowerMsg.includes("upgrade") || lowerMsg.includes("pro") || lowerMsg.includes("subscribe")) {
      response = botResponses.upgrade;
    } else if (lowerMsg.includes("price") || lowerMsg.includes("cost") || lowerMsg.includes("plan")) {
      response = botResponses.pricing;
    } else if (lowerMsg.includes("voice") || lowerMsg.includes("record") || lowerMsg.includes("audio")) {
      response = botResponses.voice;
    } else if (lowerMsg.includes("ai") || lowerMsg.includes("summary") || lowerMsg.includes("insight")) {
      response = botResponses.ai;
    } else if (lowerMsg.includes("lock") || lowerMsg.includes("pin") || lowerMsg.includes("secure")) {
      response = botResponses.lock;
    } else if (lowerMsg.includes("export") || lowerMsg.includes("backup") || lowerMsg.includes("download")) {
      response = botResponses.export;
    } else if (lowerMsg.includes("contact") || lowerMsg.includes("support") || lowerMsg.includes("email")) {
      response = botResponses.contact;
    } else if (lowerMsg.includes("hi") || lowerMsg.includes("hello") || lowerMsg.includes("hey")) {
      response = botResponses.greeting[Math.floor(Math.random() * botResponses.greeting.length)];
    } else if (lowerMsg.includes("thank")) {
      response = "You're welcome! 😊 Is there anything else I can help you with?";
    }

    setIsTyping(false);
    setBotMessages(prev => [...prev, { type: "bot", text: response }]);
  };

  const colorMap = {
    indigo: { bg: "bg-indigo-500/15", border: "border-indigo-500/25", text: "text-indigo-400", icon: "text-indigo-400" },
    purple: { bg: "bg-purple-500/15", border: "border-purple-500/25", text: "text-purple-400", icon: "text-purple-400" },
    amber: { bg: "bg-amber-500/15", border: "border-amber-500/25", text: "text-amber-400", icon: "text-amber-400" },
    rose: { bg: "bg-rose-500/15", border: "border-rose-500/25", text: "text-rose-400", icon: "text-rose-400" },
    emerald: { bg: "bg-emerald-500/15", border: "border-emerald-500/25", text: "text-emerald-400", icon: "text-emerald-400" },
    sky: { bg: "bg-sky-500/15", border: "border-sky-500/25", text: "text-sky-400", icon: "text-sky-400" },
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
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
                <Question size={18} weight="duotone" className="text-sky-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-theme-primary">Help Center</h1>
                <p className="text-theme-muted text-sm">Find answers to common questions</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative group">
        <div 
          className="absolute -inset-0.5 bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-sky-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300"
        />
        <div 
          className="relative flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 group-focus-within:border-sky-500/50 group-focus-within:shadow-lg group-focus-within:shadow-sky-500/10"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <FiSearch className="text-sky-400" size={16} />
          </div>
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-theme-tertiary text-theme-muted hover:text-theme-primary transition"
            >
              <FiX size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={openBot}
          className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:border-indigo-500/30 hover:bg-indigo-500/5"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
            <Robot size={20} weight="duotone" className="text-indigo-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-theme-primary">Ask NoteBot</p>
            <p className="text-xs text-theme-muted">AI-powered help</p>
          </div>
        </button>
        <button
          onClick={() => navigate("/dashboard/contact-support")}
          className="flex items-center gap-3 p-4 rounded-2xl border transition-all hover:border-emerald-500/30 hover:bg-emerald-500/5"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <ChatCircleDots size={20} weight="duotone" className="text-emerald-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-theme-primary">Contact Us</p>
            <p className="text-xs text-theme-muted">Get human support</p>
          </div>
        </button>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-theme-secondary px-1">Browse Topics</h2>
        
        {filteredCategories.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <FiSearch size={28} className="text-sky-400/60" />
            </div>
            <h3 className="text-lg font-medium text-theme-primary mb-1">No results found</h3>
            <p className="text-theme-muted text-sm mb-4">Try a different search term or ask NoteBot</p>
            <button
              onClick={openBot}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium"
            >
              <Robot size={16} weight="duotone" />
              Ask NoteBot
            </button>
          </GlassCard>
        ) : (
          filteredCategories.map((category) => {
            const IconComponent = category.icon;
            const colors = colorMap[category.color];
            const isExpanded = expandedCategory === category.id;

            return (
              <div key={category.id}>
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    isExpanded ? `${colors.bg} ${colors.border}` : "hover:bg-white/5"
                  }`}
                  style={{ 
                    backgroundColor: isExpanded ? undefined : "var(--bg-surface)", 
                    borderColor: isExpanded ? undefined : "var(--border-secondary)" 
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                      <IconComponent size={20} weight="duotone" className={colors.icon} />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-medium ${isExpanded ? colors.text : "text-theme-primary"}`}>
                        {category.title}
                      </p>
                      <p className="text-xs text-theme-muted">{category.questions.length} questions</p>
                    </div>
                  </div>
                  <FiChevronDown 
                    size={18} 
                    className={`text-theme-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} 
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 space-y-2">
                        {category.questions.map((item, idx) => {
                          const qKey = `${category.id}-${idx}`;
                          const isQExpanded = expandedQuestion === qKey;

                          return (
                            <div
                              key={idx}
                              className="ml-4 border-l-2 pl-4"
                              style={{ borderColor: "var(--border-secondary)" }}
                            >
                              <button
                                onClick={() => setExpandedQuestion(isQExpanded ? null : qKey)}
                                className="w-full text-left py-3 flex items-start justify-between gap-3"
                              >
                                <span className={`text-sm ${isQExpanded ? "text-theme-primary font-medium" : "text-theme-secondary"}`}>
                                  {item.q}
                                </span>
                                <FiChevronRight 
                                  size={16} 
                                  className={`text-theme-muted flex-shrink-0 mt-0.5 transition-transform ${isQExpanded ? "rotate-90" : ""}`} 
                                />
                              </button>
                              <AnimatePresence>
                                {isQExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <p className="text-sm text-theme-muted pb-3 leading-relaxed">
                                      {item.a}
                                    </p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Still need help? */}
      <GlassCard className="text-center p-6">
        <Lightbulb size={32} weight="duotone" className="text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-theme-primary mb-1">Still need help?</h3>
        <p className="text-sm text-theme-muted mb-4">Our support team is ready to assist you</p>
        <button
          onClick={() => navigate("/dashboard/contact-support")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium transition hover:opacity-90"
        >
          <ChatCircleDots size={16} weight="duotone" />
          Contact Support
        </button>
      </GlassCard>

      {/* NoteBot Chat Widget */}
      <AnimatePresence>
        {showBot && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+var(--mobile-nav-height)+16px)] right-4 left-4 sm:left-auto sm:w-[380px] z-[100] rounded-2xl border shadow-2xl overflow-hidden"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-secondary)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Robot size={22} weight="fill" className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-theme-primary">NoteBot</p>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBot(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-theme-muted hover:text-theme-primary transition"
                style={{ backgroundColor: "var(--bg-tertiary)" }}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-[300px] overflow-y-auto p-4 space-y-3">
              {botMessages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-end gap-2 max-w-[85%] ${msg.type === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      msg.type === "user" 
                        ? "bg-indigo-500/20 border border-indigo-500/30" 
                        : "bg-gradient-to-br from-indigo-500 to-purple-600"
                    }`}>
                      {msg.type === "user" ? (
                        <User size={14} className="text-indigo-400" />
                      ) : (
                        <Robot size={14} weight="fill" className="text-white" />
                      )}
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                      msg.type === "user"
                        ? "bg-indigo-500/15 border border-indigo-500/25 text-theme-primary rounded-br-md"
                        : "bg-theme-tertiary text-theme-secondary rounded-bl-md"
                    }`}>
                      <BotMessage text={msg.text} />
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-end gap-2"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Robot size={14} weight="fill" className="text-white" />
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

            {/* Input */}
            <div className="p-4 border-t" style={{ borderColor: "var(--border-secondary)" }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendBotMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={botInput}
                  onChange={(e) => setBotInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-2.5 rounded-xl border text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-indigo-500/50 transition"
                  style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)" }}
                />
                <button
                  type="submit"
                  disabled={!botInput.trim()}
                  className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center disabled:opacity-50 transition"
                >
                  <PaperPlaneTilt size={18} weight="fill" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bot Button (when closed) */}
      {!showBot && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openBot}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+var(--mobile-nav-height)+16px)] right-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center z-[100]"
        >
          <Robot size={26} weight="fill" />
        </motion.button>
      )}
    </div>
  );
}

// Simple markdown-like text renderer for bot messages
function BotMessage({ text }) {
  // Convert **bold** to <strong> and handle line breaks
  const lines = text.split('\n');
  
  return (
    <span className="whitespace-pre-wrap">
      {lines.map((line, lineIdx) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={lineIdx}>
            {parts.map((part, idx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={idx} className="font-semibold text-theme-primary">{part.slice(2, -2)}</strong>;
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