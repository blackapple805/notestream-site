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
        body:
          "You agree to use NoteStream only for lawful and permitted purposes, and not to attempt unauthorized access, reverse engineering, or data extraction.",
      },
      {
        id: "account",
        title: "Account Responsibilities",
        icon: UserCircle,
        body:
          "You are responsible for preserving the confidentiality of your login credentials and for any actions taken inside your account.",
      },
      {
        id: "privacy",
        title: "Data & Privacy",
        icon: Database,
        body:
          "All uploaded files, notes, and analytics remain privately accessible to you. We do not sell personal data. For full details, refer to our Privacy Policy document.",
      },
      {
        id: "mods",
        title: "Service Modifications",
        icon: Wrench,
        body:
          "We may update or improve features at any time, including beta access, without prior notice.",
      },
      {
        id: "liability",
        title: "Liability",
        icon: WarningCircle,
        body:
          'NoteStream is provided "as-is" without guarantees of accuracy or uptime. We are not responsible for indirect or consequential damages.',
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
        // pick the most visible section in view
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];

        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      {
        root: null,
        // offset for your fixed navbar
        rootMargin: "-96px 0px -70% 0px",
        threshold: [0.1, 0.2, 0.35, 0.5, 0.75],
      }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* subtle background */}
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

      <section className="relative max-w-6xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center border"
              style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)" }}
            >
              <ShieldCheck size={22} weight="duotone" className="text-indigo-400" />
            </div>

            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-theme-primary">
                Terms & Conditions
              </h1>
              <p className="text-sm text-theme-muted mt-1">
                Last updated: <span className="text-theme-secondary">{updated}</span>
              </p>
            </div>
          </div>

          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center border flex-shrink-0"
                style={{
                  backgroundColor: "rgba(99, 102, 241, 0.08)",
                  borderColor: "rgba(99, 102, 241, 0.25)",
                }}
              >
                <FileText size={20} weight="duotone" className="text-indigo-400" />
              </div>

              <div className="min-w-0">
                <p className="text-theme-secondary leading-relaxed">
                  Welcome to{" "}
                  <span className="text-indigo-400 font-semibold">NoteStream</span>.
                  By accessing or using our website, dashboard, or associated services,
                  you agree to the terms below. If you do not agree, discontinue use.
                </p>

                {/* mobile TOC */}
                <div className="mt-4 lg:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileOpen((v) => !v)}
                    className="w-full flex items-center justify-between rounded-xl px-4 py-3 border text-sm text-theme-secondary hover:bg-white/5 transition"
                    style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-input)" }}
                  >
                    <span className="font-medium">On this page</span>
                    <span className="text-theme-muted">{mobileOpen ? "–" : "+"}</span>
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
                          onClick={() => {
                            setMobileOpen(false);
                            scrollToId(s.id);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition ${
                            activeId === s.id ? "bg-white/5" : "hover:bg-white/5"
                          }`}
                        >
                          <span className="text-theme-muted mr-2">{idx + 1}.</span>
                          <span className="text-theme-secondary">{s.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Desktop outline */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24">
              <GlassCard className="p-5">
                <p className="text-xs font-semibold text-theme-muted mb-3">On this page</p>

                <div className="space-y-2">
                  {sections.map((s, idx) => {
                    const isActive = activeId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => scrollToId(s.id)}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm transition border ${
                          isActive ? "bg-white/5" : "hover:bg-white/5"
                        }`}
                        style={{
                          borderColor: isActive ? "rgba(99,102,241,.35)" : "var(--border-secondary)",
                        }}
                      >
                        <span className="truncate">
                          <span className="text-theme-muted mr-2">{idx + 1}.</span>
                          <span className="text-theme-secondary">{s.title}</span>
                        </span>
                        <span className={isActive ? "text-indigo-400" : "text-theme-muted"}>•</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border-secondary)" }}>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="w-full rounded-xl px-3 py-2 text-xs text-theme-muted hover:text-theme-secondary hover:bg-white/5 transition border"
                    style={{ borderColor: "var(--border-secondary)" }}
                  >
                    Back to top
                  </button>
                </div>
              </GlassCard>
            </div>
          </aside>

          {/* Sections */}
          <main className="lg:col-span-8 space-y-4">
            {sections.map((s, idx) => {
              const Icon = s.icon;
              return (
                <GlassCard key={s.id} className="p-5 sm:p-6">
                  {/* IMPORTANT: put the id on the card content target */}
                  <div id={s.id} className="scroll-mt-28">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="h-10 w-10 rounded-xl flex items-center justify-center border flex-shrink-0"
                          style={{
                            backgroundColor: "var(--bg-input)",
                            borderColor: "var(--border-secondary)",
                          }}
                        >
                          <Icon size={20} weight="duotone" className="text-theme-secondary" />
                        </div>

                        <div className="min-w-0">
                          <h2 className="text-lg sm:text-xl font-semibold text-theme-primary">
                            {idx + 1}. {s.title}
                          </h2>
                          <p className="text-sm text-theme-secondary leading-relaxed mt-2">
                            {s.body}
                          </p>

                          {s.id === "contact" && (
                            <div className="mt-3">
                              <a
                                className="inline-flex items-center rounded-full px-3 py-1.5 text-xs border hover:bg-white/5 transition"
                                style={{ borderColor: "rgba(99,102,241,.35)" }}
                                href="mailto:support@notestream.app"
                              >
                                support@notestream.app
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="hidden sm:inline-flex text-xs text-theme-muted hover:text-theme-secondary transition"
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      >
                        Back to top
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}

            <GlassCard className="p-5 sm:p-6">
              <p className="text-xs text-theme-muted">
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



