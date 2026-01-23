import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import {
  FiArrowLeft,
  FiSearch,
  FiX,
  FiChevronDown,
  FiExternalLink,
  FiCloud,
  FiLink2,
  FiDatabase,
  FiGlobe,
  FiInfo,
} from "react-icons/fi";
import {
  BookOpen,
  Plugs,
  Warning,
  ShieldCheck,
} from "phosphor-react";

const DOCS = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: BookOpen,
    iconType: "phosphor",
    iconBg: "bg-indigo-500/15",
    iconBorder: "border-indigo-500/25",
    iconColor: "text-indigo-400",
    content: [
      {
        heading: "Overview",
        text: "NoteStream integrations allow you to connect your favorite tools and automate your workflow. Once connected, data flows seamlessly between NoteStream and your external services.",
        list: [
          "Automatic syncing of notes and documents",
          "AI-powered summaries sent to your tools",
          "Two-way data flow for real-time updates",
          "Secure OAuth 2.0 authentication",
        ],
      },
      {
        heading: "Requirements",
        text: "Before connecting integrations, make sure you have:",
        list: [
          "An active NoteStream account (Free or Pro)",
          "Admin access to the service you want to connect",
          "A stable internet connection",
        ],
        note: "Some advanced integration features require a Pro subscription, including unlimited sync frequency, custom automation rules, and priority processing.",
      },
      {
        heading: "Connecting Your First Integration",
        steps: [
          "Navigate to Integrations from the dashboard sidebar",
          "Find the service you want to connect",
          "Click the Connect button",
          "Authorize NoteStream in the popup window",
          "Configure your sync preferences",
          "Start using your connected integration!",
        ],
        tip: "You can connect multiple integrations at once. They all work together seamlessly.",
      },
    ],
  },
  {
    id: "google-drive",
    label: "Google Drive",
    icon: FiCloud,
    iconType: "feather",
    iconBg: "bg-blue-500/15",
    iconBorder: "border-blue-500/25",
    iconColor: "text-blue-400",
    content: [
      {
        heading: "Overview",
        text: "The Google Drive integration allows you to sync files directly from your Drive workspace into NoteStream. Perfect for importing documents, PDFs, and images for AI analysis.",
        list: ["PDF documents", "Google Docs (converted to text)", "Images (PNG, JPG, GIF)", "Text files"],
        listTitle: "Supported File Types",
      },
      {
        heading: "Setup Instructions",
        steps: [
          "Click Connect on the Google Drive card",
          "Sign in with your Google account and grant permissions",
          "Choose which folders to sync",
          "Configure sync frequency (Real-time for Pro, or 15min/hourly/manual)",
        ],
      },
      {
        heading: "Usage Tips",
        list: [
          'Enable "Auto-summarize new uploads" in Settings for automatic AI summaries',
          'Create a "NoteStream" folder in Drive to easily manage synced content',
          "Export notes back to Drive as Google Docs or PDFs",
          "Large files (>25MB) may take longer to process",
        ],
      },
    ],
  },
  {
    id: "slack",
    label: "Slack",
    icon: FiLink2,
    iconType: "feather",
    iconBg: "bg-purple-500/15",
    iconBorder: "border-purple-500/25",
    iconColor: "text-purple-400",
    content: [
      {
        heading: "Overview",
        text: "Transform your Slack conversations into actionable insights. The Slack integration lets you capture threads, summarize channels, and extract action items automatically.",
        list: ["Channel summaries on demand", "Thread-to-note conversion", "Action item extraction", "Meeting notes from huddles"],
      },
      {
        heading: "Setup Instructions",
        steps: [
          "Click Connect on the Slack card",
          "Choose your Slack workspace",
          "Grant NoteStream permissions to read messages",
          "Select channels to monitor",
        ],
      },
      {
        heading: "Commands & Shortcuts",
        commands: [
          { cmd: "/notestream summarize", desc: "Summarize current channel" },
          { cmd: "/notestream capture [link]", desc: "Save a thread" },
          { cmd: "/notestream search [query]", desc: "Search your notes" },
        ],
        list: ["React with 📝 to save a message", "React with 📋 to extract action items", "React with 🔖 to bookmark for later"],
        listTitle: "Emoji Shortcuts",
      },
    ],
  },
  {
    id: "notion",
    label: "Notion",
    icon: FiDatabase,
    iconType: "feather",
    iconBg: "bg-slate-500/15",
    iconBorder: "border-slate-500/25",
    iconColor: "text-slate-400",
    content: [
      {
        heading: "Overview",
        text: "Export your NoteStream content directly to Notion with perfect formatting. Create new pages, update databases, and keep everything in sync.",
        list: ["Create pages from notes", "Update database entries", "Preserve formatting and structure", "Sync attachments and images"],
      },
      {
        heading: "Setup Instructions",
        steps: [
          "Click Connect on the Notion card",
          "Select the Notion workspace to connect",
          "Grant page access (specific pages or entire workspace)",
          "Map NoteStream content to Notion templates",
        ],
      },
      {
        heading: "Export Options",
        list: [
          "Quick Export: Click export on any note and select Notion",
          "Database Sync: Map note fields to Notion properties",
          "Templates: Apply Notion templates automatically to exports",
          "Bulk Export: Select multiple notes and export at once",
        ],
      },
    ],
  },
  {
    id: "zapier",
    label: "Zapier",
    icon: FiGlobe,
    iconType: "feather",
    iconBg: "bg-orange-500/15",
    iconBorder: "border-orange-500/25",
    iconColor: "text-orange-400",
    content: [
      {
        heading: "Overview",
        text: "Connect NoteStream to 5,000+ apps through Zapier. Automate workflows, trigger actions, and build powerful integrations without code.",
        list: ["New note → Create Trello card", "New summary → Send to email", "Tagged note → Add to Airtable", "Voice note → Transcribe and save"],
        listTitle: "Popular Zaps",
      },
      {
        heading: "Setup Instructions",
        steps: [
          "Connect your Zapier account",
          "Find NoteStream in Zapier's app directory",
          "Choose a trigger (New Note, Note Updated, etc.)",
          "Choose an action in another app",
          "Map fields and test your Zap",
        ],
      },
      {
        heading: "Available Triggers & Actions",
        commands: [
          { cmd: "new_note", desc: "When a note is created" },
          { cmd: "note_updated", desc: "When a note is modified" },
          { cmd: "summary_created", desc: "When AI generates a summary" },
          { cmd: "create_note", desc: "Create a new note" },
          { cmd: "add_tag", desc: "Add tags to a note" },
        ],
        note: "Pro users can set up custom webhooks for advanced integrations.",
      },
    ],
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    icon: Warning,
    iconType: "phosphor",
    iconBg: "bg-rose-500/15",
    iconBorder: "border-rose-500/25",
    iconColor: "text-rose-400",
    content: [
      {
        heading: "Common Issues",
        list: [
          "Clear your browser cache and cookies",
          "Disable browser extensions temporarily",
          "Try a different browser",
          "Check if the service is experiencing outages",
        ],
        listTitle: "Integration Won't Connect",
      },
      {
        heading: "Error Messages",
        commands: [
          { cmd: "Authentication Failed", desc: "Session expired. Disconnect and reconnect." },
          { cmd: "Permission Denied", desc: "Check with your workspace admin." },
          { cmd: "Rate Limit Exceeded", desc: "Wait a few minutes. Pro users have higher limits." },
          { cmd: "Sync Conflict", desc: "Choose which version to keep in sync settings." },
        ],
      },
      {
        heading: "Getting Help",
        list: [
          "Check our FAQ in the Help Center",
          "Search community forums for your issue",
          "Free users: support@notestream.app (24-48h response)",
          "Pro users: Priority support (2-4h response)",
        ],
        tip: 'Use the "Report Issue" button in integration settings to send diagnostic info to our team.',
      },
    ],
  },
  {
    id: "security",
    label: "Security & Privacy",
    icon: ShieldCheck,
    iconType: "phosphor",
    iconBg: "bg-emerald-500/15",
    iconBorder: "border-emerald-500/25",
    iconColor: "text-emerald-400",
    content: [
      {
        heading: "How We Protect Your Data",
        list: [
          "All data encrypted in transit (TLS 1.3)",
          "Data at rest encrypted with AES-256",
          "API keys stored in secure vaults",
          "OAuth 2.0 for all integrations",
          "No passwords stored by NoteStream",
        ],
      },
      {
        heading: "Data Handling",
        list: [
          "We only access data you explicitly authorize",
          "File contents processed for AI features",
          "We never sell your data to third parties",
          "You control what data we can access",
        ],
      },
      {
        heading: "Managing Permissions",
        steps: ['Go to Integrations', 'Click the integration card', 'Select "Disconnect"', 'Confirm removal'],
        text: "This immediately revokes NoteStream's access. You can also revoke from within the external service's settings.",
        note: "When you disconnect, you can choose to keep synced data, delete all synced data, or export before deletion.",
      },
    ],
  },
];

function ContentBlock({ block, iconColor }) {
  return (
    <div className="space-y-3">
      {block.text && <p className="text-sm text-theme-muted leading-relaxed">{block.text}</p>}

      {block.listTitle && (
        <p className="text-xs font-semibold text-theme-secondary uppercase tracking-wide">{block.listTitle}</p>
      )}

      {block.list && (
        <ul className="space-y-2">
          {block.list.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-theme-muted">
              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${iconColor.replace("text-", "bg-")}`} />
              {item}
            </li>
          ))}
        </ul>
      )}

      {block.steps && (
        <ol className="space-y-2.5">
          {block.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-theme-muted">
              <span
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${iconColor} bg-indigo-500/10 border border-indigo-500/20`}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      )}

      {block.commands && (
        <div className="space-y-2">
          {block.commands.map((c, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
              <code className={`px-2 py-1 rounded-md text-xs font-mono ${iconColor} bg-indigo-500/10 border border-indigo-500/20`}>
                {c.cmd}
              </code>
              <span className="text-theme-muted">{c.desc}</span>
            </div>
          ))}
        </div>
      )}

      {block.tip && (
        <div
          className="flex items-start gap-2.5 p-3 rounded-xl border"
          style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
        >
          <FiInfo size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-indigo-400">{block.tip}</span>
        </div>
      )}

      {block.note && <p className="text-xs text-theme-muted italic">{block.note}</p>}
    </div>
  );
}

export default function IntegrationDocs() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("getting-started");
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState([0]);

  const activeDoc = DOCS.find((d) => d.id === activeTab);

  const filteredDocs = search
    ? DOCS.filter(
        (doc) =>
          doc.label.toLowerCase().includes(search.toLowerCase()) ||
          doc.content.some((block) => JSON.stringify(block).toLowerCase().includes(search.toLowerCase()))
      )
    : DOCS;

  const toggleSection = (idx) => {
    setOpenSections((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  };

  const handleTabChange = (id) => {
    setActiveTab(id);
    setOpenSections([0]);
  };

  const renderIcon = (doc, size) => {
    const Icon = doc.icon;
    if (doc.iconType === "phosphor") {
      return <Icon size={size} weight="duotone" className={doc.iconColor} />;
    }
    return <Icon size={size} className={doc.iconColor} />;
  };

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
      {/* Header */}
      <header className="pt-2 px-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/integrations")}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-theme-muted hover:text-theme-primary transition"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
            <BookOpen size={18} weight="duotone" className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-theme-primary">Integration Docs</h1>
            <p className="text-theme-muted text-sm">Learn how to connect and use integrations</p>
          </div>
        </div>
      </header>

      {/* Search */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all focus-within:border-indigo-500/40"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
      >
        <FiSearch className="text-theme-muted" size={18} />
        <input
          type="text"
          placeholder="Search documentation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-theme-primary placeholder:text-theme-muted focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-theme-muted hover:text-theme-primary transition">
            <FiX size={18} />
          </button>
        )}
      </div>

      {/* Tabs - Horizontal scroll */}
      <div className="-mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filteredDocs.map((doc) => {
            const isActive = activeTab === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => handleTabChange(doc.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all flex-shrink-0 border ${
                  isActive
                    ? `${doc.iconBg} ${doc.iconBorder} ${doc.iconColor}`
                    : "border-transparent hover:bg-white/5 text-theme-secondary"
                }`}
                style={!isActive ? { backgroundColor: "var(--bg-surface)" } : {}}
              >
                {renderIcon(doc, 16)}
                <span className="text-sm font-medium">{doc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeDoc && (
        <GlassCard>
          {/* Doc Header */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b" style={{ borderColor: "var(--border-secondary)" }}>
            <div className={`w-14 h-14 rounded-xl ${activeDoc.iconBg} border ${activeDoc.iconBorder} flex items-center justify-center`}>
              {renderIcon(activeDoc, 26)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-theme-primary">{activeDoc.label}</h2>
              <p className="text-sm text-theme-muted">
                {activeDoc.content.length} section{activeDoc.content.length !== 1 && "s"}
              </p>
            </div>
          </div>

          {/* Accordion Sections */}
          <div className="space-y-3">
            {activeDoc.content.map((block, idx) => {
              const isOpen = openSections.includes(idx);
              return (
                <div
                  key={idx}
                  className="rounded-xl border overflow-hidden transition-colors"
                  style={{
                    backgroundColor: isOpen ? "var(--bg-tertiary)" : "transparent",
                    borderColor: isOpen ? "var(--border-primary)" : "var(--border-secondary)",
                  }}
                >
                  <button
                    onClick={() => toggleSection(idx)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <span className={`font-medium ${isOpen ? "text-theme-primary" : "text-theme-secondary"}`}>
                      {block.heading}
                    </span>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <FiChevronDown size={18} className="text-theme-muted" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t pt-4" style={{ borderColor: "var(--border-secondary)" }}>
                          <ContentBlock block={block} iconColor={activeDoc.iconColor} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t" style={{ borderColor: "var(--border-secondary)" }}>
            <p className="text-xs font-semibold text-theme-muted uppercase tracking-wide mb-3">Related</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/dashboard/integrations")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border text-theme-secondary hover:bg-white/5 transition"
                style={{ borderColor: "var(--border-secondary)" }}
              >
                <Plugs size={16} weight="duotone" />
                View Integrations
              </button>
              <button
                onClick={() => navigate("/dashboard/help-center")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border text-theme-secondary hover:bg-white/5 transition"
                style={{ borderColor: "var(--border-secondary)" }}
              >
                <FiInfo size={16} />
                Help Center
              </button>
              <button
                onClick={() => navigate("/dashboard/contact-support")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border text-theme-secondary hover:bg-white/5 transition"
                style={{ borderColor: "var(--border-secondary)" }}
              >
                <FiExternalLink size={16} />
                Contact Support
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* No Results */}
      {filteredDocs.length === 0 && (
        <div
          className="text-center py-12 rounded-2xl border"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
        >
          <FiSearch size={32} className="mx-auto text-theme-muted mb-3" />
          <p className="text-theme-muted">No results for "{search}"</p>
          <button onClick={() => setSearch("")} className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 transition">
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}