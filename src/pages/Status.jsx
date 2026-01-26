// src/pages/Status.jsx
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiExternalLink } from "react-icons/fi";
import { ShieldCheck, Lightning, Activity, Wrench, Clock } from "phosphor-react";

export default function Status() {
  const navigate = useNavigate();

  // Mock status data (replace with real API later)
  const data = useMemo(
    () => ({
      overall: "operational", // operational | degraded | outage
      updatedAt: "Updated just now",
      services: [
        { name: "API", status: "operational", uptime: "99.98%", latency: "82ms" },
        { name: "Dashboard", status: "operational", uptime: "99.95%", latency: "96ms" },
        { name: "AI Processing", status: "operational", uptime: "99.90%", latency: "210ms" },
        { name: "Sync", status: "operational", uptime: "99.92%", latency: "110ms" },
      ],
      incidents: [
        // Example placeholders
        { title: "No active incidents", status: "resolved", time: "All clear" },
      ],
      maintenance: [
        // Example placeholders
        { title: "No scheduled maintenance", status: "none", time: "" },
      ],
    }),
    []
  );

  const overallMeta = {
    operational: {
      label: "All systems operational",
      toneBg: "rgba(16, 185, 129, 0.14)",
      toneBorder: "rgba(16, 185, 129, 0.28)",
      toneText: "var(--accent-emerald)",
      Icon: ShieldCheck,
    },
    degraded: {
      label: "Degraded performance",
      toneBg: "rgba(245, 158, 11, 0.12)",
      toneBorder: "rgba(245, 158, 11, 0.25)",
      toneText: "var(--accent-amber)",
      Icon: Activity,
    },
    outage: {
      label: "Service disruption",
      toneBg: "rgba(244, 63, 94, 0.12)",
      toneBorder: "rgba(244, 63, 94, 0.25)",
      toneText: "var(--accent-rose)",
      Icon: Lightning,
    },
  }[data.overall];

  const statusPill = (status) => {
    if (status === "operational")
      return { bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.25)", text: "var(--accent-emerald)" };
    if (status === "degraded")
      return { bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.25)", text: "var(--accent-amber)" };
    return { bg: "rgba(244, 63, 94, 0.12)", border: "rgba(244, 63, 94, 0.25)", text: "var(--accent-rose)" };
  };

  return (
    <section className="min-h-screen px-6 py-24 md:py-28 relative" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Background glows */}
      <div
        className="absolute top-[12%] left-[10%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.14), transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute bottom-[12%] right-[10%] w-[260px] h-[260px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.12), transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl transition-all active:scale-[0.98]"
            style={{
              color: "var(--text-primary)",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-secondary)",
            }}
            aria-label="Go back"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <Clock size={14} />
            {data.updatedAt}
          </div>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border"
            style={{ backgroundColor: "rgba(99, 102, 241, 0.1)", borderColor: "rgba(99, 102, 241, 0.25)" }}
          >
            <Activity size={16} weight="duotone" style={{ color: "var(--accent-indigo)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--accent-indigo)" }}>
              Status
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
            NoteStream <span style={{ color: "var(--accent-indigo)" }}>System Status</span>
          </h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: "var(--text-muted)" }}>
            Live status of core services and platform components.
          </p>
        </motion.div>

        {/* Overall status card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border p-6 md:p-7 mb-8"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-secondary)",
            boxShadow: "0 20px 55px rgba(0,0,0,0.22)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center border"
                style={{ backgroundColor: overallMeta.toneBg, borderColor: overallMeta.toneBorder }}
              >
                <overallMeta.Icon size={20} weight="duotone" style={{ color: overallMeta.toneText }} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  System Status
                </h3>
                <p className="text-sm" style={{ color: overallMeta.toneText }}>
                  {overallMeta.label}
                </p>
              </div>
            </div>

            <a
              href="mailto:support@notestream.ai"
              className="text-xs font-medium transition hover:opacity-90"
              style={{ color: "var(--accent-indigo)" }}
            >
              Report an issue →
            </a>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            {data.services.map((s) => {
              const pill = statusPill(s.status);
              return (
                <div
                  key={s.name}
                  className="rounded-2xl border p-4"
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    borderColor: "var(--border-secondary)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {s.name}
                      </span>
                    </div>

                    <span
                      className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border"
                      style={{ backgroundColor: pill.bg, borderColor: pill.border, color: pill.text }}
                    >
                      {s.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>Uptime</span>
                    <span style={{ color: "var(--text-secondary)" }}>{s.uptime}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>Latency</span>
                    <span style={{ color: "var(--text-secondary)" }}>{s.latency}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Incidents + Maintenance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Incidents */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-2xl border p-6 md:p-7"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Lightning size={18} weight="duotone" style={{ color: "var(--accent-indigo)" }} />
                <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  Incidents
                </h3>
              </div>
              <a href="/support" className="text-xs font-medium" style={{ color: "var(--accent-indigo)" }}>
                Support <FiExternalLink className="inline ml-1" size={12} />
              </a>
            </div>

            <div className="space-y-3">
              {data.incidents.map((i, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border p-4"
                  style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {i.title}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        {i.time}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border"
                      style={{
                        backgroundColor: "rgba(16, 185, 129, 0.12)",
                        borderColor: "rgba(16, 185, 129, 0.25)",
                        color: "var(--accent-emerald)",
                      }}
                    >
                      resolved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Maintenance */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="rounded-2xl border p-6 md:p-7"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Wrench size={18} weight="duotone" style={{ color: "var(--accent-indigo)" }} />
                <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  Scheduled Maintenance
                </h3>
              </div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Next 7 days
              </span>
            </div>

            <div className="space-y-3">
              {data.maintenance.map((m, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border p-4"
                  style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-secondary)" }}
                >
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {m.title}
                  </p>
                  {m.time ? (
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {m.time}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mt-10 rounded-2xl border p-6 text-center"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Want email updates during incidents?{" "}
            <a href="mailto:support@notestream.ai" style={{ color: "var(--accent-indigo)" }} className="font-semibold">
              Contact support
            </a>{" "}
            to subscribe.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
