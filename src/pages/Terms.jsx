// src/pages/Terms.jsx
import { useEffect, useMemo, useState } from "react";
import GlassCard from "../components/GlassCard";
import {
  ShieldCheck,
  FileText,
  UserCircle,
  Database,
  Wrench,
  WarningCircle,
  EnvelopeSimple,
} from "phosphor-react";

export default function TermsPage() {
  const updated = new Date().toLocaleDateString();

  const sections = useMemo(
    () => [
      {
        id: "use",
        title: "Use of Service",
        icon: ShieldCheck,
        body: "You agree to use NoteStream only for lawful and permitted purposes, and not to attempt unauthorized access, reverse engineering, or data extraction.",
      },
      {
        id: "account",
        title: "Account Responsibilities",
        icon: UserCircle,
        body: "You are responsible for preserving the confidentiality of your login credentials and for any actions taken inside your account.",
      },
      {
        id: "privacy",
        title: "Data & Privacy",
        icon: Database,
        body: "All uploaded files, notes, and analytics remain privately accessible to you. We do not sell personal data. For full details, refer to our Privacy Policy document.",
      },
      {
        id: "mods",
        title: "Service Modifications",
        icon: Wrench,
        body: "We may update or improve features at any time, including beta access, without prior notice.",
      },
      {
        id: "liability",
        title: "Liability",
        icon: WarningCircle,
        body: 'NoteStream is provided "as-is" without guarantees of accuracy or uptime. We are not responsible for indirect or consequential damages.',
      },
      {
        id: "contact",
        title: "Contact",
        icon: EnvelopeSimple,
        body: "For account or legal inquiries, reach us at support@notestream.app.",
      },
    ],
    []
  );

  const [activeId, setActiveId] = useState(sections[0]?.id || "use");
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean);

    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      {
        root: null,
        rootMargin: "-96px 0px -70% 0px",
        threshold: [0.1, 0.2, 0.35, 0.5, 0.75],
      }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Subtle background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,.35), transparent 60%)" }}
        />
        <div
          className="absolute -bottom-24 left-1/3 h-[520px] w-[520px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,.25), transparent 60%)" }}
        />
      </div>

      <section className="relative max-w-5xl mx-auto px-5 sm:px-6 py-16 sm:py-20">

        {/* ── Page header ── */}
        <div className="mb-10 sm:mb-12 text-center">
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Terms & Conditions
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            Last updated: <span style={{ color: "var(--text-secondary)" }}>{updated}</span>
          </p>
        </div>

        {/* ── Intro card ── */}
        <div className="mb-8">
          <GlassCard className="p-6 sm:p-8">
            <p
              className="text-[15px] leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Welcome to{" "}
              <span className="font-semibold" style={{ color: "#818cf8" }}>NoteStream</span>.
              By accessing or using our website, dashboard, or associated services,
              you agree to the terms below. If you do not agree, please discontinue use.
            </p>

            {/* Mobile TOC */}
            <div className="mt-5 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="w-full flex items-center justify-between rounded-xl px-4 py-3 border text-sm transition"
                style={{
                  borderColor: "var(--border-secondary)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-secondary)",
                }}
              >
                <span className="font-medium">On this page</span>
                <span style={{ color: "var(--text-muted)" }}>{mobileOpen ? "−" : "+"}</span>
              </button>

              {mobileOpen && (
                <div
                  className="mt-2 rounded-xl border overflow-hidden"
                  style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-input)" }}
                >
                  {sections.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setMobileOpen(false); scrollToId(s.id); }}
                      className="w-full text-left px-4 py-3 text-sm transition"
                      style={{
                        backgroundColor: activeId === s.id ? "rgba(255,255,255,0.04)" : "transparent",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <span style={{ color: "var(--text-muted)" }} className="mr-2">{idx + 1}.</span>
                      {s.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* ── Content grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Desktop sidebar TOC */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28">
              <GlassCard className="p-5">
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  On this page
                </p>

                <div className="space-y-1.5">
                  {sections.map((s, idx) => {
                    const isActive = activeId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => scrollToId(s.id)}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] transition"
                        style={{
                          backgroundColor: isActive ? "rgba(99,102,241,0.08)" : "transparent",
                          border: isActive ? "1px solid rgba(99,102,241,0.25)" : "1px solid transparent",
                          color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                        }}
                      >
                        <span className="truncate">
                          <span style={{ color: "var(--text-muted)" }} className="mr-2">{idx + 1}.</span>
                          {s.title}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#818cf8" }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border-secondary)" }}>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="w-full rounded-xl px-3 py-2 text-[12px] transition"
                    style={{ color: "var(--text-muted)", border: "1px solid var(--border-secondary)" }}
                  >
                    ↑ Back to top
                  </button>
                </div>
              </GlassCard>
            </div>
          </aside>

          {/* Sections */}
          <main className="lg:col-span-8 space-y-5">
            {sections.map((s, idx) => {
              const Icon = s.icon;
              return (
                <GlassCard key={s.id} className="p-6 sm:p-7">
                  <div id={s.id} className="scroll-mt-32">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon size={20} weight="duotone" style={{ color: "#818cf8", flexShrink: 0 }} />
                      <h2
                        className="text-lg font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {idx + 1}. {s.title}
                      </h2>
                    </div>

                    <p
                      className="text-[14px] leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {s.body}
                    </p>

                    {s.id === "contact" && (
                      <div className="mt-4">
                        <a
                          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition"
                          style={{
                            backgroundColor: "rgba(99,102,241,0.08)",
                            border: "1px solid rgba(99,102,241,0.25)",
                            color: "#818cf8",
                          }}
                          href="mailto:support@notestream.app"
                        >
                          <EnvelopeSimple size={14} weight="duotone" />
                          support@notestream.app
                        </a>
                      </div>
                    )}
                  </div>
                </GlassCard>
              );
            })}

            <GlassCard className="p-5">
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                These terms are a general template and may need review to match your
                jurisdiction, billing model, and privacy policy.
              </p>
            </GlassCard>
          </main>
        </div>
      </section>
    </div>
  );
}