// src/pages/IntegrationDocs.jsx
// ═══════════════════════════════════════════════════════════════════
// EDITORIAL RESKIN
// ─────────────────────────────────────────────────────────────────
// Same documentation, same data model (`DOCS` array unchanged below),
// same routing — only the visual layer is rebuilt to match Dashboard
// and the rest of the dashboard tree. We wrap the page in `.ns-ed`
// and call `useEditorial()` so it inherits the paper-100 background,
// Instrument Serif headlines, Geist body, and Geist Mono eyebrows the
// rest of the site uses. The page now has a dateline ("VOL · NO ·
// DATE"), a "№ 01 — INTEGRATION DOCS" chapter mark, a serif display
// title, a hairline-bordered search bar, ed-chip tab pills, and an
// accordion built from .ed-card surfaces with hairline dividers
// between sections — no GlassCard, no rounded "indigo-500/15" icon
// chips, no gradient buttons. Body copy in serif/sans, metadata in
// mono small caps. NO content / data changes — the DOCS object is
// byte-identical to the previous file.
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiSearch,
  FiX,
  FiChevronDown,
  FiCloud,
  FiLink2,
  FiDatabase,
  FiGlobe,
} from "react-icons/fi";
import {
  BookOpenIcon as BookOpen,
  PlugsIcon as Plugs,
  WarningIcon as Warning,
  ShieldCheckIcon as ShieldCheck,
} from "@phosphor-icons/react";
import { useEditorial, ED } from "../lib/editorial";

const DOCS = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: BookOpen,
    iconType: "phosphor",
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

// Issue dateline helpers — mirror Dashboard's masthead voice
const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
function issueLine() {
  return new Date()
    .toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    .toUpperCase();
}

function ContentBlock({ block }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {block.text && (
        <p className="ed-serif" style={{ fontSize: 17, lineHeight: 1.55, color: ED.inkSoft, margin: 0 }}>
          {block.text}
        </p>
      )}

      {block.listTitle && (
        <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint, margin: 0 }}>
          {block.listTitle}
        </p>
      )}

      {block.list && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {block.list.map((item, i) => (
            <li
              key={i}
              className="ed-serif"
              style={{ display: "flex", gap: 12, alignItems: "baseline", fontSize: 16, lineHeight: 1.5, color: ED.inkSoft }}
            >
              <span
                style={{
                  fontFamily: ED.serif,
                  fontStyle: "italic",
                  fontSize: 15,
                  color: ED.accent,
                  minWidth: 20,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {block.steps && (
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 14 }}>
          {block.steps.map((step, i) => (
            <li
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 16,
                alignItems: "baseline",
                paddingBottom: 14,
                borderBottom: i === block.steps.length - 1 ? "0" : `1px solid ${ED.ruleSoft}`,
              }}
            >
              <span
                style={{
                  fontFamily: ED.serif,
                  fontStyle: "italic",
                  fontSize: 22,
                  lineHeight: 1,
                  color: ED.accent,
                  minWidth: 32,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="ed-serif" style={{ fontSize: 16, lineHeight: 1.5, color: ED.inkSoft }}>
                {step}
              </span>
            </li>
          ))}
        </ol>
      )}

      {block.commands && (
        <div style={{ display: "grid", gap: 10 }}>
          {block.commands.map((c, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(auto, 240px) 1fr",
                gap: 16,
                alignItems: "baseline",
                paddingBottom: 10,
                borderBottom: `1px solid ${ED.ruleSoft}`,
              }}
            >
              <code
                style={{
                  fontFamily: ED.mono,
                  fontSize: 13,
                  color: ED.accent,
                  background: "transparent",
                }}
              >
                {c.cmd}
              </code>
              <span className="ed-serif" style={{ fontSize: 15, color: ED.inkMute, lineHeight: 1.5 }}>
                {c.desc}
              </span>
            </div>
          ))}
        </div>
      )}

      {block.tip && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: 14,
            padding: "16px 18px",
            background: ED.paper150,
            border: `1px solid ${ED.rule}`,
            borderLeft: `2px solid ${ED.accent}`,
            borderRadius: 4,
          }}
        >
          <span
            className="ed-mono"
            style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.accent, paddingTop: 2 }}
          >
            TIP
          </span>
          <p className="ed-serif" style={{ fontSize: 15, lineHeight: 1.55, color: ED.inkSoft, margin: 0, fontStyle: "italic" }}>
            {block.tip}
          </p>
        </div>
      )}

      {block.note && (
        <p
          className="ed-serif ed-italic"
          style={{ fontSize: 14, color: ED.inkFaint, margin: 0, lineHeight: 1.55, paddingTop: 4 }}
        >
          — {block.note}
        </p>
      )}
    </div>
  );
}

export default function IntegrationDocs() {
  useEditorial();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("getting-started");
  const [search, setSearch] = useState("");
  const [openSections, setOpenSections] = useState([0]);

  const vol = "II";
  const no  = "21";

  const activeDoc = DOCS.find((d) => d.id === activeTab);

  const filteredDocs = useMemo(
    () =>
      search
        ? DOCS.filter(
            (doc) =>
              doc.label.toLowerCase().includes(search.toLowerCase()) ||
              doc.content.some((block) =>
                JSON.stringify(block).toLowerCase().includes(search.toLowerCase())
              )
          )
        : DOCS,
    [search]
  );

  const toggleSection = (idx) => {
    setOpenSections((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleTabChange = (id) => {
    setActiveTab(id);
    setOpenSections([0]);
  };

  const renderIcon = (doc, size) => {
    const Icon = doc.icon;
    if (doc.iconType === "phosphor") {
      return <Icon size={size} weight="duotone" style={{ color: ED.ink }} />;
    }
    return <Icon size={size} style={{ color: ED.ink }} />;
  };

  return (
    <div className="ns-ed">
      <div style={{ paddingBottom: "calc(var(--mobile-nav-height, 0px) + 64px)" }}>
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
              }}
            />
            DOCUMENTATION
          </span>
        </div>

        <hr className="ed-rule" />

        {/* ━━━━━━━━━━━━━━ COVER (HEADER) ━━━━━━━━━━━━━━ */}
        <section className="ed-reveal" style={{ padding: "56px 0 8px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <button
              onClick={() => navigate("/dashboard/integrations")}
              aria-label="Back to integrations"
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
              <span>— INTEGRATION DOCS</span>
            </div>
          </div>

          <h1
            className="ed-display"
            style={{ fontSize: "clamp(40px, 5vw, 72px)", marginTop: 0, marginBottom: 18, paddingBottom: "0.06em" }}
          >
            How to connect,{" "}
            <span className="ed-italic" style={{ color: ED.accent }}>and what to expect</span>.
          </h1>

          <p className="ed-lede" style={{ maxWidth: 760, margin: 0 }}>
            A field guide to the seven services NoteStream speaks to —
            setup, behaviour, troubleshooting, and the security underneath
            it all.
          </p>
        </section>

        {/* ━━━━━━━━━━━━━━ SEARCH ━━━━━━━━━━━━━━ */}
        <section style={{ marginTop: 48 }}>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px",
              background: ED.paper50,
              border: `1px solid ${ED.rule}`,
              borderRadius: 999,
              transition: "border-color .2s ease",
            }}
            onFocusCapture={(e) => (e.currentTarget.style.borderColor = ED.ink)}
            onBlurCapture={(e) => (e.currentTarget.style.borderColor = ED.rule)}
          >
            <FiSearch size={16} style={{ color: ED.inkFaint }} />
            <input
              type="text"
              placeholder="Search the documentation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1, background: "transparent", border: 0, outline: "none",
                fontFamily: ED.sans, fontSize: 14, color: ED.ink,
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                style={{ color: ED.inkFaint, background: "transparent", border: 0, cursor: "pointer" }}
              >
                <FiX size={16} />
              </button>
            )}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━ TABS — horizontal scroll, ed-chip style ━━━━━━━━━━━━━━ */}
        <section style={{ marginTop: 24 }}>
          <div
            className="ed-scroll-x"
            style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}
          >
            {filteredDocs.map((doc) => {
              const isActive = activeTab === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => handleTabChange(doc.id)}
                  className={isActive ? "ed-chip ed-chip-accent" : "ed-chip"}
                  style={{
                    flexShrink: 0,
                    padding: "8px 14px",
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {renderIcon(doc, 13)}
                  <span style={{ marginLeft: 6 }}>{doc.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━ CONTENT ━━━━━━━━━━━━━━ */}
        {activeDoc && (
          <section className="ed-card" style={{ marginTop: 36, padding: "36px 36px 28px", borderRadius: 6 }}>
            {/* Doc header */}
            <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 8 }}>
              <div>
                <div className="ed-chapter" style={{ marginBottom: 10 }}>
                  <span className="num">№ {String(DOCS.findIndex(d => d.id === activeDoc.id) + 1).padStart(2, "0")}</span>
                  <span>— THE CHAPTER</span>
                </div>
                <h2
                  className="ed-display"
                  style={{ fontSize: "clamp(28px, 3vw, 42px)", margin: 0, paddingBottom: "0.04em" }}
                >
                  {activeDoc.label}
                </h2>
              </div>
              <p
                className="ed-mono"
                style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint, margin: 0 }}
              >
                {activeDoc.content.length} SECTION{activeDoc.content.length !== 1 && "S"}
              </p>
            </header>

            <hr className="ed-rule-dbl" style={{ margin: "28px 0 8px" }} />

            {/* Accordion sections */}
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {activeDoc.content.map((block, idx) => {
                const isOpen = openSections.includes(idx);
                return (
                  <li
                    key={idx}
                    style={{ borderBottom: `1px solid ${ED.ruleSoft}` }}
                  >
                    <button
                      onClick={() => toggleSection(idx)}
                      style={{
                        width: "100%",
                        display: "grid",
                        gridTemplateColumns: "44px 1fr auto",
                        gap: 16,
                        alignItems: "baseline",
                        padding: "22px 4px",
                        background: "transparent",
                        border: 0,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          letterSpacing: "0.14em",
                          color: isOpen ? ED.accent : ED.inkFaint,
                          fontFamily: isOpen ? ED.serif : ED.mono,
                          fontStyle: isOpen ? "italic" : "normal",
                          fontSize: isOpen ? 17 : 11,
                          transition: "all .15s ease",
                        }}
                      >
                        {isOpen ? "§" : String(idx + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="ed-serif"
                        style={{
                          fontSize: "clamp(20px, 2vw, 26px)",
                          lineHeight: 1.25,
                          color: ED.ink,
                        }}
                      >
                        {block.heading}
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ color: ED.inkFaint, display: "inline-flex" }}
                      >
                        <FiChevronDown size={18} />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div style={{ padding: "0 4px 28px 60px" }}>
                            <ContentBlock block={block} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>

            {/* Related */}
            <div style={{ marginTop: 36, paddingTop: 24, borderTop: `1px solid ${ED.rule}` }}>
              <p
                className="ed-mono"
                style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint, marginBottom: 16 }}
              >
                — RELATED CHAPTERS
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <button
                  className="ed-btn ed-btn-ghost"
                  onClick={() => navigate("/dashboard/integrations")}
                >
                  <Plugs size={15} weight="duotone" />
                  View integrations
                </button>
                <button
                  className="ed-btn ed-btn-ghost"
                  onClick={() => navigate("/dashboard/help-center")}
                >
                  Help center
                </button>
                <button
                  className="ed-btn ed-btn-primary"
                  onClick={() => navigate("/dashboard/contact-support")}
                >
                  Contact support
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ━━━━━━━━━━━━━━ NO RESULTS ━━━━━━━━━━━━━━ */}
        {filteredDocs.length === 0 && (
          <section className="ed-card" style={{ marginTop: 36, padding: "56px 24px", textAlign: "center", borderRadius: 6 }}>
            <p
              className="ed-mono"
              style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint, marginBottom: 14 }}
            >
              — NOTHING IN THE ARCHIVE
            </p>
            <p
              className="ed-serif ed-italic"
              style={{ fontSize: 22, color: ED.inkMute, marginBottom: 18 }}
            >
              No chapter mentions “{search}.”
            </p>
            <button className="ed-btn ed-btn-ghost" onClick={() => setSearch("")}>
              Clear search
            </button>
          </section>
        )}

        {/* ━━━━━━━━━━━━━━ COLOPHON ━━━━━━━━━━━━━━ */}
        <section style={{ marginTop: 80 }}>
          <hr className="ed-rule" />
          <div className="ed-colophon">
            <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint }}>
              NOTESTREAM · VOL. {vol} · NO. {no}
            </p>
            <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.inkFaint }}>
              SEVEN CHAPTERS · ALWAYS REVISED
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
