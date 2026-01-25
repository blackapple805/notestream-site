// src/pages/IntegrationsLanding.jsx
// Public landing page for Integrations feature (marketing site)

import { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import GlassCard from "../components/GlassCard";
import { useSubscription } from "../hooks/useSubscription";
import {
  FiLink2,
  FiCloud,
  FiDatabase,
  FiBookOpen,
  FiSettings,
  FiRefreshCw,
  FiExternalLink,
  FiGithub,
} from "react-icons/fi";
import {
  Lightning,
  CheckCircle,
  Clock,
  Bell,
  Plugs,
  BookOpen,
  Gear,
} from "phosphor-react";

// Dashboard-style palette (matches your IntegrationConnect colorMap)
const colorMap = {
  blue: {
    bg: "bg-blue-500",
    light: "bg-blue-500/20",
    text: "text-blue-500",
    ring: "ring-blue-500/20",
  },
  purple: {
    bg: "bg-purple-500",
    light: "bg-purple-500/20",
    text: "text-purple-500",
    ring: "ring-purple-500/20",
  },
  slate: {
    bg: "bg-slate-600",
    light: "bg-slate-500/20",
    text: "text-slate-300",
    ring: "ring-slate-500/20",
  },
  orange: {
    bg: "bg-orange-500",
    light: "bg-orange-500/20",
    text: "text-orange-500",
    ring: "ring-orange-500/20",
  },
  gray: {
    bg: "bg-gray-600",
    light: "bg-gray-500/20",
    text: "text-gray-300",
    ring: "ring-gray-500/20",
  },
  rose: {
    bg: "bg-rose-500",
    light: "bg-rose-500/20",
    text: "text-rose-500",
    ring: "ring-rose-500/20",
  },
};

export default function IntegrationsLanding() {
  const navigate = useNavigate();
  const { plan } = useSubscription?.() || {};
  const isPro = plan === "pro";

  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { amount: 0.2, once: true });

  const integrations = useMemo(
    () => [
      {
        name: "Google Drive",
        icon: <FiCloud size={26} />,
        colorKey: "blue",
        desc: "Sync docs, sheets, and slides directly to NoteStream",
        status: "Available",
      },
      {
        name: "Slack",
        icon: <FiLink2 size={26} />,
        colorKey: "purple",
        desc: "Turn Slack conversations into organized notes",
        status: "Available",
      },
      {
        name: "Notion",
        icon: <FiBookOpen size={26} />,
        colorKey: "slate",
        desc: "Import and sync your Notion workspace",
        status: "Available",
      },
      {
        name: "Dropbox",
        icon: <FiCloud size={26} />,
        colorKey: "blue",
        desc: "Access your Dropbox files seamlessly",
        status: "Coming Soon",
      },
      {
        name: "Trello",
        icon: <FiSettings size={26} />,
        colorKey: "blue",
        desc: "Connect boards and cards to your notes",
        status: "Coming Soon",
      },
      {
        name: "GitHub",
        icon: <FiGithub size={26} />,
        colorKey: "gray",
        desc: "Link repositories and track project notes",
        status: "Coming Soon",
      },
    ],
    []
  );

  const features = useMemo(
    () => [
      {
        icon: <FiRefreshCw size={24} />,
        title: "Real-time Sync",
        desc: "Changes sync automatically across all connected platforms",
      },
      {
        icon: <FiSettings size={24} />,
        title: "Secure Connection",
        desc: "OAuth 2.0 authentication with encrypted data transfer",
      },
      {
        icon: <FiDatabase size={24} />,
        title: "AI Processing",
        desc: "Imported content is automatically analyzed and organized",
      },
    ],
    []
  );

  return (
    <div style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Hero */}
      <section className="relative py-24 md:py-32 px-6 overflow-hidden">
        {/* Background glows (dashboard theme) */}
        <div className="absolute top-[10%] left-[10%] w-[300px] h-[300px] rounded-full pointer-events-none bg-indigo-500/10 blur-[60px]" />
        <div className="absolute bottom-[20%] right-[5%] w-[250px] h-[250px] rounded-full pointer-events-none bg-purple-500/10 blur-[60px]" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-indigo-500/20 bg-indigo-500/10">
              <Lightning size={16} weight="fill" className="text-indigo-500" />
              <span className="text-sm font-medium text-indigo-500">
                Seamless Connections
              </span>
            </div>

            <h1
              className="text-4xl md:text-6xl font-bold mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              Connect your{" "}
              <span className="text-indigo-400">favorite tools</span>
            </h1>

            <p
              className="text-lg md:text-xl max-w-2xl mx-auto mb-10"
              style={{ color: "var(--text-muted)" }}
            >
              NoteStream integrates with the apps you already use. Import, sync,
              and organize content from anywhere — all in one intelligent
              workspace.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => navigate("/signup")}
                className="px-8 py-3.5 rounded-full font-semibold text-lg text-white transition-all duration-300 hover:scale-[1.02]
                           bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_4px_20px_rgba(99,102,241,0.35)]"
              >
                Get Started Free
              </button>

              <button
                onClick={() => navigate("/how-it-works")}
                className="px-8 py-3.5 rounded-full font-semibold text-lg transition-all duration-300 border hover:bg-white/5"
                style={{
                  color: "var(--text-secondary)",
                  borderColor: "var(--border-secondary)",
                }}
              >
                See How It Works
              </button>
            </div>

            {typeof plan !== "undefined" && (
              <div className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
                Current plan:{" "}
                <span style={{ color: "var(--text-secondary)" }}>
                  {String(plan)}
                </span>
                {isPro ? " (Pro)" : ""}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Integration grid */}
      <section ref={sectionRef} className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55 }}
            className="text-center mb-16"
          >
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Supported Integrations
            </h2>
            <p
              className="text-lg max-w-xl mx-auto"
              style={{ color: "var(--text-muted)" }}
            >
              Connect with popular tools and platforms to streamline your
              workflow
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration, i) => {
              const c = colorMap[integration.colorKey] || colorMap.blue;

              return (
                <motion.div
                  key={integration.name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.08 * i }}
                >
                  <GlassCard className="relative rounded-2xl p-6 border transition-all duration-300">
                    {/* Status badge */}
                    <div
                      className={`absolute top-4 right-4 px-2 py-1 rounded-md text-[10px] font-medium border
                      ${
                        integration.status === "Available"
                          ? "bg-emerald-500/15 text-emerald-400 border-white/10"
                          : "bg-amber-500/15 text-amber-400 border-white/10"
                      }`}
                    >
                      {integration.status}
                    </div>

                    {/* Icon (dashboard theme) */}
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${c.light} ring-1 ${c.ring}`}
                    >
                      <div
                        className={`${c.text} drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]`}
                      >
                        {integration.icon}
                      </div>
                    </div>

                    <h3
                      className="text-lg font-semibold mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {integration.name}
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {integration.desc}
                    </p>

                    {integration.status === "Available" ? (
                      <button
                        onClick={() => navigate("/signup")}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium transition-colors text-indigo-400 hover:text-indigo-300"
                      >
                        Connect <FiExternalLink size={14} />
                      </button>
                    ) : (
                      <div
                        className="mt-4 inline-flex items-center gap-2 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Clock size={14} /> Coming soon
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              How integrations work
            </h2>
            <p
              className="text-lg max-w-xl mx-auto"
              style={{ color: "var(--text-muted)" }}
            >
              Simple, secure, and intelligent
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.08 * i }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-indigo-500/10 ring-1 ring-indigo-500/20">
                  <div className="text-indigo-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]">
                    {feature.icon}
                  </div>
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border border-emerald-500/20 bg-emerald-500/10">
              <CheckCircle
                size={16}
                weight="fill"
                className="text-emerald-400"
              />
              <span className="text-sm font-medium text-emerald-400">
                Free to start
              </span>
            </div>

            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Ready to connect?
            </h2>
            <p className="text-lg mb-8" style={{ color: "var(--text-muted)" }}>
              Start using NoteStream for free and connect your favorite tools in
              minutes.
            </p>

            <button
              onClick={() => navigate("/signup")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-white transition-all duration-300 hover:scale-[1.02]
                         bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_4px_20px_rgba(99,102,241,0.35)]"
            >
              Get Started <Plugs size={18} />
            </button>

            <div
              className="mt-6 flex items-center justify-center gap-6 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <span className="inline-flex items-center gap-2">
                <Bell size={14} /> Get notified
              </span>
              <span className="inline-flex items-center gap-2">
                <BookOpen size={14} /> Docs
              </span>
              <span className="inline-flex items-center gap-2">
                <Gear size={14} /> Settings
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}



