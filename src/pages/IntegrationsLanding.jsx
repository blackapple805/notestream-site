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
import { Lightning, CheckCircle, Clock, Bell, Plugs, BookOpen, Gear } from "phosphor-react";

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
        color: "#4285F4",
        desc: "Sync docs, sheets, and slides directly to NoteStream",
        status: "Available",
      },
      {
        name: "Slack",
        icon: <FiLink2 size={26} />,
        color: "#4A154B",
        desc: "Turn Slack conversations into organized notes",
        status: "Available",
      },
      {
        name: "Notion",
        icon: <FiBookOpen size={26} />,
        color: "#FFFFFF",
        desc: "Import and sync your Notion workspace",
        status: "Available",
      },
      {
        name: "Dropbox",
        icon: <FiCloud size={26} />,
        color: "#0061FF",
        desc: "Access your Dropbox files seamlessly",
        status: "Coming Soon",
      },
      {
        name: "Trello",
        icon: <FiSettings size={26} />,
        color: "#0052CC",
        desc: "Connect boards and cards to your notes",
        status: "Coming Soon",
      },
      {
        name: "GitHub",
        icon: <FiGithub size={26} />,
        color: "#FFFFFF",
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

  // Helper styles to make icons more visible
  const iconShellStyle = (color) => ({
    background:
      `radial-gradient(circle at 30% 30%, ${color}40 0%, ${color}18 45%, rgba(255,255,255,0.04) 100%)`,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: `0 10px 30px ${color}22, inset 0 1px 0 rgba(255,255,255,0.08)`,
    color: "#FFFFFF",
  });

  const iconInnerStyle = (color) => ({
    color,
    filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.45)) drop-shadow(0 0 10px rgba(255,255,255,0.06))",
    opacity: 1,
  });

  return (
    <div style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Hero */}
      <section className="relative py-24 md:py-32 px-6 overflow-hidden">
        {/* Background glows */}
        <div
          className="absolute top-[10%] left-[10%] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.12), transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-[20%] right-[5%] w-[250px] h-[250px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(168, 85, 247, 0.1), transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border"
              style={{
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                borderColor: "rgba(99, 102, 241, 0.2)",
              }}
            >
              <Lightning
                size={16}
                weight="fill"
                style={{ color: "var(--accent-indigo)" }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: "var(--accent-indigo)" }}
              >
                Seamless Connections
              </span>
            </div>

            <h1
              className="text-4xl md:text-6xl font-bold mb-6"
              style={{ color: "var(--text-primary)" }}
            >
              Connect your{" "}
              <span style={{ color: "var(--accent-indigo)" }}>
                favorite tools
              </span>
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
                className="px-8 py-3.5 rounded-full font-semibold text-lg text-white transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))",
                  boxShadow: "0 4px 20px rgba(99, 102, 241, 0.35)",
                }}
              >
                Get Started Free
              </button>

              <button
                onClick={() => navigate("/how-it-works")}
                className="px-8 py-3.5 rounded-full font-semibold text-lg transition-all duration-300 border"
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

      {/* Integrations grid */}
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
              Connect with popular tools and platforms to streamline your workflow
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((integration, i) => (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: 0.08 * i }}
              >
                <GlassCard className="relative rounded-2xl p-6 border transition-all duration-300">
                  {/* Status badge */}
                  <div
                    className="absolute top-4 right-4 px-2 py-1 rounded-md text-[10px] font-medium"
                    style={{
                      backgroundColor:
                        integration.status === "Available"
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(245, 158, 11, 0.15)",
                      color:
                        integration.status === "Available"
                          ? "var(--accent-emerald)"
                          : "var(--accent-amber)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {integration.status}
                  </div>

                  {/* Icon (more visible) */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={iconShellStyle(integration.color)}
                  >
                    <div style={iconInnerStyle(integration.color)}>
                      {integration.icon}
                    </div>
                  </div>

                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {integration.name}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {integration.desc}
                  </p>

                  {integration.status === "Available" ? (
                    <button
                      onClick={() => navigate("/signup")}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium transition-colors"
                      style={{ color: "var(--accent-indigo)" }}
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
            ))}
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
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.25), rgba(99,102,241,0.10))",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow:
                      "0 12px 32px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
                    color: "var(--accent-indigo)",
                  }}
                >
                  <div
                    style={{
                      filter:
                        "drop-shadow(0 8px 14px rgba(0,0,0,0.45)) drop-shadow(0 0 10px rgba(255,255,255,0.06))",
                    }}
                  >
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
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border"
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                borderColor: "rgba(16, 185, 129, 0.2)",
              }}
            >
              <CheckCircle
                size={16}
                weight="fill"
                style={{ color: "var(--accent-emerald)" }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: "var(--accent-emerald)" }}
              >
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
              Start using NoteStream for free and connect your favorite tools in minutes.
            </p>

            <button
              onClick={() => navigate("/signup")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))",
                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.35)",
              }}
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


