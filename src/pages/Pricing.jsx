// src/pages/Pricing.jsx
// ───────────────────────────────────────────────────────────────
// NoteStream — Editorial Pricing page (Vite drop-in)
// Drop into src/pages/Pricing.jsx (overwrite existing).
// Requires: src/lib/editorial.js
// ───────────────────────────────────────────────────────────────

import { useState } from "react";
import { useEditorial, ED } from "../lib/editorial";
import { FiArrowRight, FiArrowUpRight, FiCheck, FiPlus } from "react-icons/fi";

export default function Pricing() {
  useEditorial();

  const plans = [
    {
      name: "Reader", sub: "Free, forever", price: "$0", cadence: "—",
      blurb: "Get started. Capture, search, and read your archive at a measured pace.",
      perks: ["5 notes a day", "30 voice minutes / mo", "Search & quick summaries", "1 personal space", "iOS + Web"],
      cta: "Start reading", featured: false,
    },
    {
      name: "Writer", sub: "Pro · the obvious one", price: "$12", cadence: "per month",
      blurb: "Unlimited capture, full reasoning, and the long-form briefs NoteStream was built for.",
      perks: ["Unlimited notes & voice", "Reasoning across archive", "AI briefs & summaries", "5 spaces, unlimited tags", "iOS · Mac · Web", "Priority email support"],
      cta: "Start the 14-day trial", featured: true,
    },
    {
      name: "Editor", sub: "Team · shared archive", price: "$24", cadence: "per seat / mo",
      blurb: "Everything in Writer, plus a shared archive with private spaces and an editor's level of control.",
      perks: ["Everything in Writer", "Shared & private spaces", "SSO, SCIM, audit log", "Permissioned reasoning", "DPA & SOC 2", "Priority support"],
      cta: "Talk to us", featured: false,
    },
  ];

  const comparison = [
    { section: "Capture", rows: [
      ["Notes per day", "5", "Unlimited", "Unlimited"],
      ["Voice minutes / month", "30", "Unlimited", "Unlimited"],
      ["Document uploads", "10 / mo", "Unlimited", "Unlimited"],
      ["Auto-transcription", true, true, true],
      ["On-device first capture", true, true, true],
    ]},
    { section: "Reasoning", rows: [
      ["Search by meaning", true, true, true],
      ["AI quick summaries", "10 / mo", "Unlimited", "Unlimited"],
      ["Cross-archive reasoning", false, true, true],
      ["Long-form briefs", false, true, true],
      ["Custom reasoning style", false, "1 profile", "Per-seat"],
    ]},
    { section: "Workspace", rows: [
      ["Spaces", "1", "5", "Unlimited"],
      ["Tags", "Unlimited", "Unlimited", "Unlimited"],
      ["Shared spaces", false, false, true],
      ["Private-within-team", false, false, true],
      ["Guest readers", false, false, "10 / workspace"],
    ]},
    { section: "Privacy & control", rows: [
      ["End-to-end encryption at rest", true, true, true],
      ["Never used for training", true, true, true],
      ["Export everything", true, true, true],
      ["SSO (Google, Okta, Azure)", false, false, true],
      ["SCIM provisioning", false, false, true],
      ["Audit log", false, false, true],
      ["DPA & SOC 2 Type II", false, false, true],
    ]},
    { section: "Support", rows: [
      ["Help centre", true, true, true],
      ["Email support", "48h", "24h", "4h"],
      ["Onboarding call", false, false, true],
      ["Dedicated success manager", false, false, "10+ seats"],
    ]},
  ];

  const faqs = [
    { q: "Is the free Reader plan actually useful?", a: "Yes. It's the same product — capture, search, summaries — just rate-limited. We use it ourselves for personal notes, and it would hold up as a primary tool if you write five notes a day or fewer." },
    { q: "What happens to my archive if I downgrade?", a: "Nothing. Your notes, voice memos and documents stay exactly where they are. If you exceed the new limits, capture pauses on new items — but existing material is always readable and exportable." },
    { q: "Can I switch monthly to annual later?", a: "Anytime. Annual billing knocks 20% off the Writer plan and 17% off Editor. We don't make you commit upfront." },
    { q: "Do you offer a free trial of Writer?", a: "Fourteen days, no card required. At the end, you fall back to Reader unless you choose to keep Writer." },
    { q: "What's the actual privacy story?", a: "End-to-end encrypted at rest. Your archive is never used to train any model, ours or anyone else's. We make money from subscriptions — that's the whole alignment. Read the privacy page for the long version." },
    { q: "How does Editor billing work?", a: "Per active seat, monthly or annual. You can mix Writer and Editor seats inside one workspace — admins are typically Editor, contributors can stay on Writer." },
    { q: "Education and journalism discounts?", a: "50% off Writer for students, full-time educators, and accredited journalists. No paperwork — just email us from your institutional address." },
    { q: "Refund policy?", a: "Money back within 30 days, no questions. After that we'll pro-rate the remainder. We'd rather you leave easily than feel stuck." },
  ];

  return (
    <div className="ns-ed" style={{ minHeight: "100vh" }}>
      {/* ── Hero ────────────────────────────── */}
      <section style={{ paddingTop: 140, paddingBottom: 72 }}>
        <div className="ed-page">
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            marginBottom: 48, flexWrap: "wrap", gap: 16,
          }}>
            <div className="ed-chapter">
              <span className="num">№ 01</span>
              <span>The Rates</span>
            </div>
            <div className="ed-mono" style={{
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint,
            }}>
              Honest · Monthly · Cancel anytime
            </div>
          </div>
          <hr className="ed-rule-dbl" style={{ marginBottom: 48 }} />

          <div className="price-hero" style={{
            display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 64, alignItems: "end",
          }}>
            <h1 className="ed-display" style={{ fontSize: "clamp(48px, 7.4vw, 120px)", margin: 0 }}>
              Three<br />
              <span className="ed-italic" style={{ color: ED.accent }}>subscriptions.</span>
            </h1>
            <p className="ed-lede" style={{ maxWidth: 460, margin: 0 }}>
              The free Reader is genuinely useful. The Writer is what most
              people want. The Editor is for small teams sharing an archive.
              No annual lock-ins, no surprise overage fees, no upsell email
              campaigns. Subscribe, leave, return — whichever suits.
            </p>
          </div>
        </div>
      </section>

      {/* ── Plans ───────────────────────────── */}
      <section style={{ padding: "0 0 96px" }}>
        <div className="ed-page">
          <hr className="ed-rule-dbl" style={{ marginBottom: 0 }} />
          <div className="rates" style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0,
          }}>
            {plans.map((p, i) => (
              <article key={p.name} style={{
                padding: "40px 32px 36px",
                borderRight: i < plans.length - 1 ? `1px solid ${ED.rule}` : "none",
                background: p.featured ? ED.ink : "transparent",
                color: p.featured ? ED.paper50 : ED.ink,
                position: "relative",
              }}>
                {p.featured && (
                  <div style={{
                    position: "absolute", top: -1, left: 32, right: 32, height: 3,
                    background: ED.accent,
                  }} />
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <div className="ed-serif" style={{
                      fontSize: 30, lineHeight: 1, color: p.featured ? "#fff" : ED.ink,
                      letterSpacing: "-0.01em",
                    }}>{p.name}</div>
                    <div className="ed-mono" style={{
                      fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                      color: p.featured ? "#bfb38c" : ED.inkFaint, marginTop: 6,
                    }}>{p.sub}</div>
                  </div>
                  {p.featured && (
                    <span className="ed-mono" style={{
                      padding: "3px 9px", fontSize: 10, letterSpacing: "0.14em",
                      textTransform: "uppercase", color: ED.accent,
                      background: "rgba(138,161,255,0.14)", borderRadius: 999,
                    }}>Most chosen</span>
                  )}
                </div>

                <div style={{ marginTop: 28, display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span className="ed-display" style={{
                    fontSize: 64, lineHeight: 1, color: p.featured ? "#fff" : ED.ink,
                    letterSpacing: "-0.03em",
                  }}>{p.price}</span>
                  <span className="ed-serif ed-italic" style={{
                    fontSize: 16, color: p.featured ? "#bfb38c" : ED.inkMute,
                  }}>{p.cadence}</span>
                </div>

                <p style={{
                  marginTop: 14, fontSize: 14, lineHeight: 1.55,
                  color: p.featured ? "#cfc6a5" : ED.inkMute,
                }}>{p.blurb}</p>

                <hr style={{
                  margin: "22px 0 18px", border: 0, height: 1,
                  background: p.featured ? "rgba(255,255,255,0.1)" : ED.rule,
                }} />

                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 9 }}>
                  {p.perks.map((k, j) => (
                    <li key={j} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      fontSize: 14, color: p.featured ? ED.paper50 : ED.inkSoft,
                    }}>
                      <span style={{
                        width: 18, height: 18, borderRadius: "50%",
                        border: `1px solid ${p.featured ? ED.accent : ED.rule}`,
                        color: p.featured ? ED.accent : ED.inkMute,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <FiCheck size={11} />
                      </span>
                      {k}
                    </li>
                  ))}
                </ul>

                <a href="/signup" className={p.featured ? "ed-btn" : "ed-btn ed-btn-ghost"} style={{
                  marginTop: 28, width: "100%", justifyContent: "center",
                  ...(p.featured
                    ? { background: ED.accent, color: "#fff", borderColor: ED.accent }
                    : { borderColor: ED.ink, color: ED.ink }),
                }}>
                  {p.cta} <FiArrowRight size={13} />
                </a>
              </article>
            ))}
          </div>
          <hr className="ed-rule-dbl" style={{ marginTop: 0 }} />
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .rates { grid-template-columns: 1fr !important; }
            .ns-ed .rates > article { border-right: none !important; border-bottom: 1px solid ${ED.rule} !important; }
            .ns-ed .rates > article:last-child { border-bottom: none !important; }
            .ns-ed .price-hero { grid-template-columns: 1fr !important; gap: 28px !important; }
          }
        `}</style>
      </section>

      {/* ── Comparison table ────────────────── */}
      <section style={{ padding: "0 0 96px" }}>
        <div className="ed-page">
          <div className="ed-chapter" style={{ marginBottom: 18 }}>
            <span className="num">№ 02</span>
            <span>Every line, side by side</span>
          </div>
          <h2 className="ed-display" style={{
            fontSize: "clamp(36px, 5vw, 64px)", margin: 0, marginBottom: 36,
          }}>
            The <span className="ed-italic" style={{ color: ED.accent }}>fine print,</span> made coarse.
          </h2>

          <div className="cmp" style={{
            border: `1px solid ${ED.rule}`, borderRadius: 0, overflow: "hidden",
          }}>
            <div className="cmp-row" style={{
              display: "grid",
              gridTemplateColumns: "minmax(220px, 2fr) repeat(3, minmax(140px, 1fr))",
              borderBottom: `1px solid ${ED.ink}`,
              background: ED.paper50,
            }}>
              <div style={{ padding: "16px 20px" }} className="ed-mono cmp-c">
                <span style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint }}>
                  Feature
                </span>
              </div>
              {["Reader", "Writer", "Editor"].map((n, i) => (
                <div key={n} style={{
                  padding: "16px 20px", textAlign: "center", borderLeft: `1px solid ${ED.rule}`,
                  background: i === 1 ? ED.accentSoft : "transparent",
                }} className="cmp-c">
                  <div className="ed-serif" style={{ fontSize: 18, color: ED.ink, letterSpacing: "-0.01em" }}>{n}</div>
                </div>
              ))}
            </div>

            {comparison.map((sec, si) => (
              <div key={sec.section}>
                <div style={{
                  padding: "18px 20px 8px",
                  borderTop: si > 0 ? `1px solid ${ED.rule}` : "none",
                  background: ED.paper50,
                }}>
                  <span className="ed-mono" style={{
                    fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: ED.accent,
                  }}>
                    § {sec.section}
                  </span>
                </div>
                {sec.rows.map((r, ri) => (
                  <div key={ri} className="cmp-row" style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(220px, 2fr) repeat(3, minmax(140px, 1fr))",
                    borderTop: `1px solid ${ED.ruleSoft}`,
                  }}>
                    <div style={{ padding: "14px 20px", color: ED.inkSoft, fontSize: 14.5 }} className="cmp-c cmp-feat">
                      {r[0]}
                    </div>
                    {[r[1], r[2], r[3]].map((v, i) => (
                      <div key={i} style={{
                        padding: "14px 20px", textAlign: "center",
                        borderLeft: `1px solid ${ED.ruleSoft}`,
                        background: i === 1 ? "color-mix(in srgb, var(--ed-accent-soft) 60%, transparent)" : "transparent",
                        fontSize: 14, color: ED.inkSoft,
                      }} className="cmp-c">
                        <CellValue v={v} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 800px) {
            .ns-ed .cmp-row { grid-template-columns: minmax(160px, 1.5fr) repeat(3, 1fr) !important; }
            .ns-ed .cmp-c { padding: 10px 8px !important; font-size: 12.5px !important; }
            .ns-ed .cmp-feat { padding-left: 12px !important; }
          }
        `}</style>
      </section>

      {/* ── Education ───────────────────────── */}
      <section style={{
        padding: "72px 0", background: ED.paper50,
        borderTop: `1px solid ${ED.rule}`, borderBottom: `1px solid ${ED.rule}`,
      }}>
        <div className="ed-page edu-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <div className="ed-chapter" style={{ marginBottom: 18 }}>
              <span className="num">§</span>
              <span>A note for educators, students, and journalists</span>
            </div>
            <h2 className="ed-display" style={{ fontSize: "clamp(32px, 4.4vw, 56px)", margin: 0 }}>
              <span className="ed-italic" style={{ color: ED.accent }}>Half off</span>{" "}
              the Writer plan. No paperwork.
            </h2>
          </div>
          <div>
            <p className="ed-serif" style={{ fontSize: 19, lineHeight: 1.55, color: ED.inkSoft, margin: 0, maxWidth: 480 }}>
              If you keep notes for a living — teaching, learning, or
              reporting — write to us from your institutional address and we'll
              flip the discount on. It's permanent, not a trial.
            </p>
            <a href="mailto:education@notestream.co" className="ed-ulink" style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginTop: 18,
              color: ED.accent, fontFamily: ED.sans, fontWeight: 500,
            }}>
              education@notestream.co <FiArrowUpRight size={13} />
            </a>
          </div>
        </div>

        <style>{`
          @media (max-width: 800px) {
            .ns-ed .edu-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          }
        `}</style>
      </section>

      {/* ── FAQ ─────────────────────────────── */}
      <FAQ items={faqs} />

      {/* ── Closing CTA ─────────────────────── */}
      <section style={{ padding: "96px 0" }}>
        <div className="ed-page" style={{ textAlign: "center" }}>
          <h2 className="ed-display" style={{
            fontSize: "clamp(40px, 6vw, 84px)", margin: "0 auto", maxWidth: 880,
          }}>
            Start the <span className="ed-italic" style={{ color: ED.accent }}>archive.</span>
          </h2>
          <p className="ed-lede" style={{ marginTop: 18, maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>
            Fourteen days of Writer, free, no card. Decide at the end.
          </p>
          <div style={{ marginTop: 28, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <a href="/signup" className="ed-btn ed-btn-primary">Start the trial <FiArrowRight size={14} /></a>
            <a href="/how-it-works" className="ed-btn ed-btn-ghost">How it works</a>
          </div>
        </div>
      </section>
    </div>
  );
}

function CellValue({ v }) {
  if (v === true)  return <FiCheck size={14} style={{ color: ED.ink }} />;
  if (v === false) return <span style={{ color: ED.inkFaint, fontFamily: ED.mono, fontSize: 13 }}>—</span>;
  return <span className="ed-mono" style={{ fontSize: 12, color: ED.inkSoft, letterSpacing: "0.02em" }}>{v}</span>;
}

function FAQ({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <section style={{ padding: "96px 0" }}>
      <div className="ed-page">
        <div className="faq-grid" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 64, alignItems: "start" }}>
          <div style={{ position: "sticky", top: 120 }}>
            <div className="ed-chapter" style={{ marginBottom: 18 }}>
              <span className="num">№ 03</span>
              <span>Frequently Asked</span>
            </div>
            <h2 className="ed-display" style={{ fontSize: "clamp(36px, 5vw, 64px)", margin: 0 }}>
              What we get<br />
              <span className="ed-italic" style={{ color: ED.accent }}>asked.</span>
            </h2>
            <p className="ed-serif" style={{ fontSize: 17, lineHeight: 1.55, color: ED.inkMute, marginTop: 18 }}>
              Eight of the most common. The rest live in the help centre —
              or write to us, a human reads every email.
            </p>
            <a href="mailto:help@notestream.co" className="ed-ulink" style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
              color: ED.accent, fontFamily: ED.sans, fontWeight: 500,
            }}>
              help@notestream.co <FiArrowUpRight size={13} />
            </a>
          </div>

          <div>
            <hr className="ed-rule" />
            {items.map((it, i) => {
              const isOpen = open === i;
              return (
                <div key={i} style={{ borderBottom: `1px solid ${ED.rule}` }}>
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    style={{
                      display: "flex", width: "100%", justifyContent: "space-between",
                      alignItems: "center", padding: "22px 0", border: 0,
                      background: "transparent", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <span className="ed-serif" style={{
                      fontSize: 21, color: ED.ink, letterSpacing: "-0.01em", paddingRight: 24,
                    }}>
                      <span className="ed-serif ed-italic" style={{ color: ED.accent, marginRight: 12 }}>
                        {String(i + 1).padStart(2, "0")}.
                      </span>
                      {it.q}
                    </span>
                    <span style={{
                      flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
                      border: `1px solid ${ED.rule}`, display: "inline-flex",
                      alignItems: "center", justifyContent: "center",
                      transform: isOpen ? "rotate(45deg)" : "rotate(0)",
                      transition: "transform .2s", color: ED.inkSoft,
                    }}>
                      <FiPlus size={14} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="ed-reveal" style={{ paddingBottom: 22 }}>
                      <p style={{
                        fontSize: 16, lineHeight: 1.65, color: ED.inkMute,
                        margin: 0, paddingLeft: 36, maxWidth: 680,
                      }}>
                        {it.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .ns-ed .faq-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
            .ns-ed .faq-grid > div:first-child { position: static !important; }
          }
        `}</style>
      </div>
    </section>
  );
}
