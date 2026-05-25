// src/pages/FAQ.jsx
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useEditorial, ED } from "../lib/editorial";
import { FiPlus, FiArrowUpRight, FiArrowRight } from "react-icons/fi";

export default function FAQ() {
  useEditorial();
  const location = useLocation();
  const [openIds, setOpenIds] = useState({ 0: 0 }); // first item open in section 0

  // The `slug` matches the link target on the Help Center page so anchors
  // like /faq#ai-reasoning land on the right section.
  const groups = [
    {
      slug: "getting-started",
      title: "Getting started",
      qs: [
        { q: "Do I need to install anything to try NoteStream?",
          a: "No. The web app at notestream.co works in any modern browser. iOS, Mac, and iPad apps are available in their respective stores if you want native capture; the experience is identical." },
        { q: "Is the free Reader plan time-limited?",
          a: "No. Reader is free forever, with no trial expiration. It's rate-limited (5 notes/day, 30 voice minutes/month), but otherwise the same product." },
        { q: "Can I import notes from another app?",
          a: "Yes. We import from Notion, Apple Notes, Obsidian, Bear, Roam, and any plain Markdown export. Voice memos from iOS, Otter, or Granola transcripts are all supported. Settings → Import." },
      ],
    },
    {
      slug: "ai-reasoning",
      title: "How it works",
      qs: [
        { q: "What's the difference between Search and Reasoning?",
          a: "Search returns a list of matching notes. Reasoning returns an answer — synthesized across multiple notes, with citations back to the originals. Search is on every plan; Reasoning is Writer and Editor." },
        { q: "Will the AI hallucinate answers about my notes?",
          a: "Every answer cites the specific notes it drew from, with timestamps. If the answer can't be grounded, NoteStream says so rather than guess. We'd rather return 'I don't see anything about that' than make something up." },
        { q: "What languages does voice transcription support?",
          a: "Currently 38 languages with full structure extraction; 90+ for basic transcription. Quality is best for English, Spanish, French, German, Portuguese, Japanese, Mandarin, and Hindi." },
      ],
    },
    {
      slug: "privacy-security",
      title: "Privacy & data",
      qs: [
        { q: "Is my archive used to train AI models?",
          a: "No. Not by us, not by our model providers (Anthropic and OpenAI). Our contracts with them include a no-training clause; we publish those clauses on our security page." },
        { q: "Where is my data stored?",
          a: "EU-West (Ireland) or US-East (Virginia), your choice at signup. Backups stay in the same region. No data leaves your region except for transient model-inference requests, which you can route within-region in Settings." },
        { q: "Can I export everything?",
          a: "Anytime. Markdown for notes, original audio files for voice memos, JSON for the structured extract layer. Full export in one zip from Settings → Export." },
      ],
    },
    {
      slug: "settings-billing",
      title: "Billing",
      qs: [
        { q: "Do you offer annual billing?",
          a: "Yes. 20% off the Writer plan, 17% off Editor. Switch anytime from Settings → Billing." },
        { q: "Can I cancel anytime?",
          a: "Yes. Access continues until the end of your current billing period. No 'are you sure?' five-step retention flow." },
        { q: "Education and journalism discounts?",
          a: "50% off Writer for students, full-time educators, and accredited journalists. Email education@notestream.co from your institutional address. The discount is permanent, not a trial." },
      ],
    },
  ];

  // Scroll to the section matching the URL hash whenever it changes.
  // Runs after render so the target element is in the DOM. Also opens the
  // first question in that section so the user sees something useful.
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);

    // If the hash matches a group, open its first question.
    const idx = groups.findIndex((g) => g.slug === id);
    if (idx !== -1) {
      setOpenIds((prev) => ({ ...prev, [idx]: 0 }));
    }

    // Defer scroll one frame so layout is settled.
    const t = requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    return () => cancelAnimationFrame(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash, location.key]);

  return (
    <div className="ns-ed" style={{ minHeight: "100vh" }}>
      <section style={{ paddingTop: 140, paddingBottom: 56 }}>
        <div className="ed-page">
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            marginBottom: 48, flexWrap: "wrap", gap: 16,
          }}>
            <div className="ed-chapter">
              <span className="num">№ 01</span>
              <span>Frequently Asked</span>
            </div>
            <div className="ed-mono" style={{
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: ED.inkFaint,
            }}>
              12 of the most common
            </div>
          </div>
          <hr className="ed-rule-dbl" style={{ marginBottom: 48 }} />

          <h1 className="ed-display" style={{
            fontSize: "clamp(48px, 7vw, 110px)", margin: 0, color: ED.ink,
          }}>
            Questions,<br />
            <span className="ed-italic" style={{ color: ED.accent }}>answered.</span>
          </h1>
          <p className="ed-lede" style={{ marginTop: 28, maxWidth: 620 }}>
            What people ask us, sorted by topic. If something isn't here,
            write to <a href="mailto:help@notestream.co" className="ed-ulink" style={{ color: ED.accent }}>help@notestream.co</a> — a human reads every email.
          </p>
        </div>
      </section>

      <section style={{ padding: "0 0 96px" }}>
        <div className="ed-page">
          {groups.map((g, gi) => (
            <div
              key={g.title}
              id={g.slug}
              style={{ marginBottom: 56, scrollMarginTop: 100 }}
            >
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                marginBottom: 16, gap: 16,
              }}>
                <div className="ed-chapter">
                  <span className="num">§ {String(gi + 1).padStart(2, "0")}</span>
                  <span>{g.title}</span>
                </div>
                <div className="ed-mono" style={{ fontSize: 10.5, color: ED.inkFaint, letterSpacing: "0.1em" }}>
                  {g.qs.length} {g.qs.length === 1 ? "question" : "questions"}
                </div>
              </div>
              <hr className="ed-rule" />

              {g.qs.map((it, i) => {
                const isOpen = openIds[gi] === i;
                return (
                  <div key={i} style={{ borderBottom: `1px solid ${ED.rule}` }}>
                    <button
                      onClick={() => setOpenIds({ ...openIds, [gi]: isOpen ? -1 : i })}
                      style={{
                        display: "flex", width: "100%", justifyContent: "space-between",
                        alignItems: "center", padding: "22px 0", textAlign: "left",
                      }}
                    >
                      <span className="ed-serif" style={{
                        fontSize: 21, color: ED.ink, letterSpacing: "-0.005em", paddingRight: 24,
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
          ))}

          {/* CTA */}
          <div style={{
            marginTop: 48, padding: "32px 36px",
            background: ED.paper50, border: `1px solid ${ED.rule}`, borderRadius: 14,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 20,
          }}>
            <div>
              <h3 className="ed-serif" style={{ fontSize: 24, color: ED.ink, margin: 0, letterSpacing: "-0.01em" }}>
                Still <span className="ed-italic" style={{ color: ED.accent }}>stuck?</span>
              </h3>
              <p style={{ fontSize: 14.5, color: ED.inkMute, marginTop: 6, marginBottom: 0 }}>
                Write to a human. We reply within a day, usually within a few hours.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href="/support" className="ed-btn ed-btn-ghost">Contact support</a>
              <a href="mailto:help@notestream.co" className="ed-btn ed-btn-primary">
                help@notestream.co <FiArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
