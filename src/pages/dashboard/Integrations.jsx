// src/pages/dashboard/Integrations.jsx — "The Correspondents"
// ═══════════════════════════════════════════════════════════════════
// EDITORIAL RESKIN — what changed and why
// ─────────────────────────────────────────────────────────────────
// Wrapped the page in `<div className="ns-ed">` and called
// `useEditorial()`. The bento-glass tile grid is now an editorial
// directory: chapter mark (`№ 07 — THE CORRESPONDENTS`), a serif
// display title ("Letters from elsewhere.") with "elsewhere" in
// italic accent blue, a mono dateline (n services / n connected /
// n coming soon), a double-rule break, a brief lede, mono filter
// pills, then full-width editorial article rows — mono ordinal ·
// serif name with terminal period · serif description · mono meta
// with status chip · right-aligned aside (CONNECT → / MANAGE → /
// JOIN →). Detail modal is a paper-50 card with serif title, mono
// "FEATURES INCLUDED" eyebrow, ink/ghost buttons.
// All Supabase / subscription / connect / disconnect / waitlist
// logic is UNCHANGED. The original IconTile (coloured squircle)
// is removed since editorial typography carries identity; the
// original icons are reused inline at the title.
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscription } from "../../hooks/useSubscription";
import { useEditorial, ED } from "../../lib/editorial";

import {
  FiX,
  FiCheck,
  FiCloud,
  FiLink2,
  FiDatabase,
  FiBookOpen,
  FiSettings,
  FiRefreshCw,
  FiGithub,
  FiInbox,
  FiBell,
  FiZap,
  FiArrowRight,
  FiArrowUpRight,
} from "react-icons/fi";

const integrations = [
  {
    id: "google-drive", title: "Google Drive",
    desc: "Syncs docs, sheets, and slides back into the archive every fifteen minutes.",
    icon: FiCloud,
    features: ["Auto-sync files", "Folder organisation", "Real-time updates", "Two-way sync"],
    status: "available",
  },
  {
    id: "slack", title: "Slack",
    desc: "Turn Slack conversations into organised notes — channels read, threads extracted, drafts kept.",
    icon: FiLink2,
    features: ["Channel summaries", "Thread extraction", "Direct messaging", "Workspace sync"],
    status: "available",
  },
  {
    id: "notion", title: "Notion",
    desc: "Import and sync your Notion workspace with pages, databases, and block formatting preserved.",
    icon: FiDatabase,
    features: ["Page sync", "Database updates", "Block formatting", "Template support"],
    status: "available",
  },
  {
    id: "zapier", title: "Zapier",
    desc: "Automate workflows with five thousand apps. NoteStream sits quietly in the middle.",
    icon: FiRefreshCw,
    features: ["5000+ apps", "Custom workflows", "Trigger actions", "Multi-step zaps"],
    status: "available",
  },
  {
    id: "github", title: "GitHub",
    desc: "Link repos and track project notes. Issues created, pull requests summarised.",
    icon: FiGithub,
    features: ["Issue creation", "PR summaries", "Repo integration", "Commit linking"],
    status: "coming-soon",
  },
  {
    id: "email", title: "Email import",
    desc: "Forward emails and receive instant summaries — attachments parsed, replies suggested.",
    icon: FiInbox,
    features: ["Email forwarding", "Attachment parsing", "Auto-categorise", "Smart replies"],
    status: "coming-soon",
  },
];

export default function Integrations() {
  useEditorial();
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const isPro = subscription?.plan && subscription.plan !== "free";

  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [connectedIntegrations, setConnectedIntegrations] = useState({});
  const [waitlist, setWaitlist] = useState({});
  const [showToast, setShowToast] = useState(null);
  const [filter, setFilter] = useState("all");

  /* Lock body scroll when modal is open (UNCHANGED) */
  const openModal = (integration) => {
    document.body.style.overflow = "hidden";
    setSelectedIntegration(integration);
  };
  const closeModal = () => {
    document.body.style.overflow = "";
    setSelectedIntegration(null);
  };

  const displayToast = (message, type = "success") => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleConnect = (integrationId) => {
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    setConnectedIntegrations((prev) => ({ ...prev, [integrationId]: true }));
    setSelectedIntegration(null);
    displayToast(`${integrations.find((i) => i.id === integrationId)?.title} connected.`);
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
      document.body.style.overflow = "";
    });
  };

  const handleDisconnect = (integrationId) => {
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    setConnectedIntegrations((prev) => {
      const updated = { ...prev };
      delete updated[integrationId];
      return updated;
    });
    displayToast("Integration disconnected.", "info");
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
      document.body.style.overflow = "";
    });
  };

  const handleJoinWaitlist = (integrationId) => {
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    setWaitlist((prev) => ({ ...prev, [integrationId]: true }));
    setSelectedIntegration(null);
    displayToast("You're on the list. We'll write when it lands.");
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
      document.body.style.overflow = "";
    });
  };

  const availableIntegrations = integrations.filter((i) => i.status === "available");
  const comingSoonIntegrations = integrations.filter((i) => i.status === "coming-soon");
  const connectedCount = Object.keys(connectedIntegrations).length;

  const visible = useMemo(() => {
    if (filter === "connected") return integrations.filter((i) => connectedIntegrations[i.id]);
    if (filter === "available") return availableIntegrations;
    if (filter === "coming")    return comingSoonIntegrations;
    return integrations;
  }, [filter, connectedIntegrations, availableIntegrations, comingSoonIntegrations]);

  return (
    <div className="ns-ed">
      <style>{INT_STYLES}</style>

      <div style={{ paddingBottom: "calc(var(--mobile-nav-height, 0px) + 24px)" }}>

        {/* ── TOAST (portal) ── */}
        {createPortal(
          <AnimatePresence>
            {showToast && (
              <motion.div
                initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="ns-int-toast ed-mono"
                style={{ borderColor: showToast.type === "success" ? ED.accent : ED.rule }}
              >
                <FiCheck size={13} /> {showToast.message}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* ── HEADER ── */}
        <header className="ns-int-head" style={{ paddingTop: 32 }}>
          <div>
            <div className="ed-chapter" style={{ marginBottom: 18 }}>
              <span className="num">№ 07</span>
              <span>— THE CORRESPONDENTS</span>
            </div>
            <h1 className="ed-display ns-int-title">
              Letters from{" "}
              <span className="ed-italic" style={{ color: ED.accent }}>elsewhere.</span>
            </h1>
            <p className="ed-mono ns-int-sub">
              {integrations.length} SERVICES
              <span className="ns-dotsep">·</span>
              {connectedCount} CONNECTED
              <span className="ns-dotsep">·</span>
              {comingSoonIntegrations.length} COMING SOON
            </p>
          </div>
        </header>

        <hr className="ed-rule-dbl" style={{ marginTop: 32 }} />

        {/* ── LEDE ── */}
        <p className="ed-serif ns-int-lede">
          The archive doesn't insist on being the only place you write. These are the rooms it sends letters to and waits at the door of. Connect what you use; ignore the rest.
        </p>

        {/* ── FILTERS ── */}
        <div className="ns-int-filters">
          {[
            { id: "all",       label: "All",         n: integrations.length },
            { id: "connected", label: "Connected",   n: connectedCount },
            { id: "available", label: "Available",   n: availableIntegrations.length },
            { id: "coming",    label: "Coming soon", n: comingSoonIntegrations.length },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`ns-int-filter ${filter === f.id ? "is-on" : ""}`}
            >
              {f.label} <span className="n">{f.n}</span>
            </button>
          ))}
        </div>

        <hr className="ed-rule" style={{ marginTop: 18 }} />

        {/* ── DIRECTORY ── */}
        <div className="ns-int-list">
          {visible.length === 0 ? (
            <p className="ed-serif ed-italic" style={{ padding: "56px 0", color: ED.inkMute, textAlign: "center", fontSize: 18, margin: 0 }}>
              Nothing in this column.
            </p>
          ) : (
            visible.map((integration, i) => {
              const isConnected = connectedIntegrations[integration.id];
              const isOnWaitlist = waitlist[integration.id];
              const IconComponent = integration.icon;
              const comingSoon = integration.status === "coming-soon";

              return (
                <article
                  key={integration.id}
                  className="ns-int-row"
                  onClick={() => openModal(integration)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter") openModal(integration); }}
                >
                  <span className="ord">{String(i + 1).padStart(2, "0")}</span>
                  <div className="body">
                  <h3 className="title">
                    <span className="title-inner">
                      <IconComponent className="title-icon" size={16} />
                      <span>
                        {integration.title}
                        {!/[.!?]$/.test(integration.title) ? "." : ""}
                      </span>
                    </span>
                  </h3>
                    <p className="excerpt">{integration.desc}</p>
                    <div className="meta">
                      {isConnected && <span className="ed-chip ed-chip-accent">CONNECTED</span>}
                      {comingSoon && !isOnWaitlist && <span className="ed-chip">COMING SOON</span>}
                      {isOnWaitlist && <span className="ed-chip ed-chip-accent">ON THE WAITLIST</span>}
                      {!isConnected && !comingSoon && <span className="ed-chip">AVAILABLE</span>}
                      <span>{integration.features.length} FEATURES</span>
                    </div>
                  </div>
                  <div className="aside">
                    {isConnected ? "MANAGE →" : isOnWaitlist ? "WAITING →" : comingSoon ? "JOIN →" : "CONNECT →"}
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* ── HELP STRIP ── */}
        <section className="ns-int-help">
          <div>
            <p className="ed-mono ns-int-help-eye">NEED A HAND</p>
            <h3 className="ed-serif ns-int-help-title">
              Stuck connecting one of <span className="ed-italic" style={{ color: ED.accent }}>these?</span>
            </h3>
            <p className="ns-int-help-desc">
              The docs walk through OAuth and webhook setup. Support reads every email.
            </p>
          </div>
          <div className="ns-int-help-cta">
            <button onClick={() => navigate("/dashboard/integration-docs")} className="ed-btn ed-btn-ghost">
              <FiBookOpen size={13} /> Read the docs
            </button>
            <button onClick={() => navigate("/dashboard/contact-support")} className="ed-btn ed-btn-primary">
              Contact support <FiArrowUpRight size={13} />
            </button>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━ DETAIL MODAL ━━━━━━━━━━━━━━ */}
        <AnimatePresence>
          {selectedIntegration && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="ns-int-backdrop"
                onClick={() => closeModal()}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: "spring", damping: 26, stiffness: 320 }}
                className="ns-int-modal"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="ns-int-modal-head">
                  <div>
                    <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: ED.inkFaint, margin: 0 }}>
                      <span style={{ color: ED.accent, fontFamily: ED.serif, fontStyle: "italic", fontSize: 13, marginRight: 6 }}>№</span>
                      CORRESPONDENT
                    </p>
                    <h2 className="ed-serif ns-int-modal-title">
                      {selectedIntegration.title}.
                    </h2>
                    <p className="ed-mono ns-int-modal-sub">
                      {selectedIntegration.status === "coming-soon"
                        ? "COMING SOON"
                        : connectedIntegrations[selectedIntegration.id]
                        ? "CONNECTED"
                        : "AVAILABLE"}
                    </p>
                  </div>
                  <button onClick={() => closeModal()} className="ns-int-modal-close" aria-label="Close">
                    <FiX size={13} />
                  </button>
                </div>
                <hr className="ed-rule" />

                {/* Body */}
                <div className="ns-int-modal-body">
                  <p className="ed-serif ns-int-modal-desc">
                    {selectedIntegration.desc}
                  </p>

                  <p className="ed-mono ns-int-modal-eye">FEATURES INCLUDED</p>
                  <ul className="ns-int-modal-features">
                    {selectedIntegration.features.map((feature, i) => (
                      <li key={i}>
                        <span className="ed-mono ord">{String(i + 1).padStart(2, "0")}</span>
                        <span className="ed-serif">{feature}.</span>
                      </li>
                    ))}
                  </ul>

                  {!isPro && selectedIntegration.status === "available" && (
                    <div className="ns-int-modal-pro">
                      <FiZap size={14} style={{ color: ED.accent, marginTop: 3, flexShrink: 0 }} />
                      <div>
                        <p className="ed-mono" style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.accent, margin: 0 }}>
                          PRO FEATURE
                        </p>
                        <p className="ed-serif" style={{ fontSize: 14, color: ED.inkMute, margin: "4px 0 0 0" }}>
                          Some features require a Pro subscription.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="ns-int-modal-foot">
                  {selectedIntegration.status === "coming-soon" ? (
                    waitlist[selectedIntegration.id] ? (
                      <button disabled className="ed-btn ed-btn-ghost" style={{ width: "100%", justifyContent: "center", opacity: 0.7 }}>
                        <FiCheck size={13} /> On the waitlist
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinWaitlist(selectedIntegration.id)}
                        className="ed-btn ed-btn-primary"
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        <FiBell size={13} /> Join the waitlist
                      </button>
                    )
                  ) : connectedIntegrations[selectedIntegration.id] ? (
                    <div className="ns-int-modal-actions">
                      <button onClick={() => closeModal()} className="ed-btn ed-btn-ghost">
                        <FiSettings size={13} /> Manage settings
                      </button>
                      <button
                        onClick={() => handleDisconnect(selectedIntegration.id)}
                        className="ed-btn"
                        style={{ background: "transparent", color: "#a3261c", borderColor: "#f5c2bd" }}
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(selectedIntegration.id)}
                      className="ed-btn ed-btn-primary"
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      Connect {selectedIntegration.title} <FiArrowRight size={13} />
                    </button>
                  )}

                  <p className="ed-mono ns-int-modal-foot-note">
                    {selectedIntegration.status === "coming-soon"
                      ? "WE'LL WRITE WHEN IT LAUNCHES"
                      : "YOU CAN DISCONNECT ANY TIME FROM SETTINGS"}
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SCOPED STYLES
═══════════════════════════════════════════════════════ */
const INT_STYLES = `
  .ns-ed .ns-dotsep { padding: 0 8px; color: var(--ed-rule); }

  .ns-ed .ns-int-toast {
    position: fixed; top: calc(env(safe-area-inset-top, 0px) + 80px);
    left: 50%; transform: translateX(-50%);
    z-index: 9999;
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 16px;
    background: var(--ed-paper-50);
    border: 1px solid var(--ed-rule);
    border-radius: 999px;
    font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--ed-ink);
    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  }

  .ns-ed .ns-int-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
  .ns-ed .ns-int-title { font-size: clamp(40px, 5vw, 64px); margin: 0; padding-bottom: 0.06em; }
  .ns-ed .ns-int-sub { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ed-ink-faint); margin-top: 28px; }
  .ns-ed .ns-int-lede {
    font-size: 18px; line-height: 1.55; color: var(--ed-ink-mute);
    margin: 36px 0 0 0; max-width: 680px;
  }

  /* filters */
  .ns-ed .ns-int-filters { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 28px; }
  .ns-ed .ns-int-filter {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: var(--ed-mono); font-size: 11px; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--ed-ink-mute);
    padding: 7px 12px; border-radius: 999px;
    border: 1px solid var(--ed-rule); background: transparent;
    cursor: pointer; transition: all .15s ease;
  }
  .ns-ed .ns-int-filter:hover { border-color: var(--ed-ink); color: var(--ed-ink); }
  .ns-ed .ns-int-filter.is-on { background: var(--ed-ink); color: var(--ed-paper-50); border-color: var(--ed-ink); }
  .ns-ed .ns-int-filter .n { opacity: 0.7; }

  /* list */
  .ns-ed .ns-int-list { padding: 8px 0 24px; }
  .ns-ed .ns-int-row {
    display: grid; grid-template-columns: 56px 1fr minmax(0, 130px); gap: 18px;
    padding: 22px 14px; border-bottom: 1px solid var(--ed-rule-soft);
    cursor: pointer; transition: background-color .12s, padding .12s;
    align-items: start;
  }
  .ns-ed .ns-int-row:hover { background: var(--ed-paper-150); padding-left: 18px; }
  .ns-ed .ns-int-row:focus-visible { outline: 0; background: var(--ed-paper-150); box-shadow: inset 4px 0 0 var(--ed-accent); }
  .ns-ed .ns-int-row .ord {
    font-family: var(--ed-mono); font-size: 11px; letter-spacing: 0.14em;
    color: var(--ed-ink-faint); padding-top: 6px; transition: all .15s ease;
  }
  .ns-ed .ns-int-row:hover .ord { color: var(--ed-accent); font-family: var(--ed-serif); font-style: italic; font-size: 17px; }
  .ns-ed .ns-int-row .body { min-width: 0; max-width: 760px; }
  .ns-ed .ns-int-row .title {
    font-family: var(--ed-serif); font-size: clamp(20px, 1.8vw, 26px);
    line-height: 1.22; color: var(--ed-ink); margin: 0; padding-bottom: 0.04em;
    transition: color .15s ease;
  }
   .ns-ed .ns-int-row .title-inner {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .ns-ed .ns-int-row .title-icon {
    color: var(--ed-ink-faint);
    flex-shrink: 0;

    position: relative;
    top: 2px;
    opacity: 0.82;
  }  
  .ns-ed .ns-int-row:hover .title { color: var(--ed-accent); }
  .ns-ed .ns-int-row .excerpt {
    font-family: var(--ed-serif); font-size: 16px; line-height: 1.5;
    color: var(--ed-ink-mute); margin: 8px 0 0 0;
  }
  .ns-ed .ns-int-row .meta {
    font-family: var(--ed-mono); font-size: 10.5px; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--ed-ink-faint);
    margin-top: 12px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
  }
  .ns-ed .ns-int-row .aside {
    font-family: var(--ed-mono); font-size: 10.5px; letter-spacing: 0.14em;
    color: var(--ed-ink-faint); padding-top: 8px; text-align: right;
  }

  /* help strip */
  .ns-ed .ns-int-help {
    margin-top: 56px; padding: 32px;
    background: var(--ed-paper-50); border: 1px solid var(--ed-rule); border-radius: 14px;
    display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: center;
  }
  .ns-ed .ns-int-help-eye {
    font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--ed-ink-faint); margin: 0 0 8px 0;
  }
  .ns-ed .ns-int-help-title {
    font-size: 26px; color: var(--ed-ink); margin: 0; letter-spacing: -0.01em;
  }
  .ns-ed .ns-int-help-desc {
    font-size: 14.5px; line-height: 1.55; color: var(--ed-ink-mute); margin: 8px 0 0 0; max-width: 480px;
  }
  .ns-ed .ns-int-help-cta { display: flex; gap: 10px; flex-wrap: wrap; }

  /* modal */
  .ns-ed .ns-int-backdrop {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(35, 28, 14, 0.4);
    backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  }
  .ns-ed .ns-int-modal {
    position: fixed; inset: 0; margin: auto;
    z-index: 101; max-width: 520px; width: calc(100% - 2rem);
    max-height: calc(100dvh - 3rem); height: fit-content;
    background: var(--ed-paper-50);
    border: 1px solid var(--ed-rule); border-radius: 14px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.12);
    overflow-y: auto;
  }
  .ns-ed .ns-int-modal-head {
    padding: 24px 28px;
    display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  }
  .ns-ed .ns-int-modal-title {
    font-size: 32px; color: var(--ed-ink); margin: 4px 0 0 0;
    letter-spacing: -0.01em; padding-bottom: 0.04em;
  }
  .ns-ed .ns-int-modal-sub {
    font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--ed-ink-faint); margin: 8px 0 0 0;
  }
  .ns-ed .ns-int-modal-close {
    width: 28px; height: 28px; border-radius: 999px;
    background: transparent; border: 1px solid var(--ed-rule);
    color: var(--ed-ink-faint); cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    transition: all .15s ease; flex-shrink: 0;
  }
  .ns-ed .ns-int-modal-close:hover { border-color: var(--ed-ink); color: var(--ed-ink); }
  .ns-ed .ns-int-modal-body { padding: 20px 28px 24px; }
  .ns-ed .ns-int-modal-desc {
    font-size: 17px; line-height: 1.55; color: var(--ed-ink-mute);
    margin: 0 0 24px 0;
  }
  .ns-ed .ns-int-modal-eye {
    font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--ed-ink-faint); margin: 0 0 10px 0;
  }
  .ns-ed .ns-int-modal-features {
    list-style: none; margin: 0; padding: 0; display: grid; gap: 0;
    border-top: 1px solid var(--ed-rule-soft);
  }
  .ns-ed .ns-int-modal-features li {
    display: grid; grid-template-columns: 36px 1fr; gap: 12px;
    align-items: baseline; padding: 12px 0;
    border-bottom: 1px solid var(--ed-rule-soft);
  }
  .ns-ed .ns-int-modal-features li .ord {
    font-size: 10px; letter-spacing: 0.14em; color: var(--ed-ink-faint);
  }
  .ns-ed .ns-int-modal-features li .ed-serif {
    font-size: 15.5px; color: var(--ed-ink);
  }
  .ns-ed .ns-int-modal-pro {
    margin-top: 20px; padding: 14px; border-radius: 10px;
    background: var(--ed-accent-soft); border: 1px solid transparent;
    display: flex; gap: 10px; align-items: flex-start;
  }
  .ns-ed .ns-int-modal-foot {
    padding: 20px 28px 24px;
    border-top: 1px solid var(--ed-rule);
    background: var(--ed-paper-100);
  }
  .ns-ed .ns-int-modal-actions { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
  .ns-ed .ns-int-modal-foot-note {
    font-size: 10px; letter-spacing: 0.14em; text-align: center;
    color: var(--ed-ink-faint); margin: 12px 0 0 0;
  }

  @media (max-width: 720px) {
    .ns-ed .ns-int-help { grid-template-columns: 1fr; }
    .ns-ed .ns-int-row { grid-template-columns: 44px 1fr; padding: 16px 8px; }
    .ns-ed .ns-int-row .aside { display: none; }
    .ns-ed .ns-int-modal-actions { grid-template-columns: 1fr; }
  }
`;
