// Changelog — releases as serialized magazine issues.
function ChangelogPage() {
  const issues = [
    {
      vol: "Vol. II · No. 24", date: "Nov 14, 2026", title: "Voice notes, finally",
      lede: "On-device transcription, faster than typing. Plus a quieter post-capture flow and a few rough edges sanded.",
      tag: "Major",
      sections: [
        { h: "New", items: [
          "Voice notes capture, transcribe, and file in one continuous flow.",
          "Local-first transcription on iOS 17+ and macOS 14+. Cloud fallback on older devices.",
          "A 'this week in voice' summary surfaces in the dashboard on Monday mornings.",
        ]},
        { h: "Improved", items: [
          "Post-capture animation no longer interrupts the next thought.",
          "Filler-word stripping is gentler — you sound less robotic.",
        ]},
        { h: "Fixed", items: [
          "Recording would occasionally stop on backgrounding. It no longer does.",
        ]},
      ],
    },
    {
      vol: "Vol. II · No. 23", date: "Oct 28, 2026", title: "Reasoning across spaces",
      lede: "The reasoning engine now reads across every space you've granted it — without breaking your private spaces' walls.",
      tag: "Major",
      sections: [
        { h: "New", items: [
          "Cross-space reasoning: ask a question, draw answers from every space the model can see.",
          "Per-space privacy mode keeps reserved spaces out of all AI features.",
          "'Sources' panel now groups citations by space, with origin badges.",
        ]},
        { h: "Improved", items: [
          "Brief generation is ~40% faster on long archives.",
          "Better handling of stale citations when notes have been edited since.",
        ]},
      ],
    },
    {
      vol: "Vol. II · No. 22", date: "Oct 03, 2026", title: "A quieter dashboard",
      lede: "A reset on the workspace home. Less bento, more breathing room — for the people we already heard from.",
      tag: "Minor",
      sections: [
        { h: "New", items: [
          "A 'today' surface that shows only what's worth your attention.",
          "Drag a note onto another to merge — including their voice memos.",
        ]},
        { h: "Removed", items: [
          "The streak counter. (Sorry.) If you want it back, it lives in Settings → Personal.",
        ]},
        { h: "Fixed", items: [
          "Dark mode no longer flashes on first load.",
          "Search occasionally returned duplicate notes. Resolved.",
        ]},
      ],
    },
    {
      vol: "Vol. II · No. 21", date: "Sep 11, 2026", title: "Cloud sync, signed and sealed",
      lede: "End-to-end encrypted sync. Same speed as before, fewer questions about where your archive lives.",
      tag: "Major",
      sections: [
        { h: "New", items: [
          "End-to-end encryption at rest, on every plan.",
          "Sync now uses delta packets — faster on slow connections.",
          "iPad app, full feature parity with iOS.",
        ]},
        { h: "Improved", items: [
          "Login flows on small screens are no longer cramped.",
        ]},
      ],
    },
    {
      vol: "Vol. II · No. 20", date: "Aug 22, 2026", title: "Briefs",
      lede: "Long-form reasoning. Ask a complex question, get a five-paragraph brief with citations.",
      tag: "Major",
      sections: [
        { h: "New", items: [
          "Briefs: multi-paragraph reasoning across your archive, cited.",
          "A 'pin to space' option for the briefs you keep coming back to.",
        ]},
      ],
    },
    {
      vol: "Vol. II · No. 19", date: "Jul 30, 2026", title: "Smaller, sturdier",
      lede: "Hundreds of unglamorous fixes, plus the second half of the search overhaul.",
      tag: "Minor",
      sections: [
        { h: "Improved", items: [
          "Search is materially faster on archives over 5,000 notes.",
          "Notes list now keeps its scroll position when you back out.",
          "PDF rendering is sharper on retina displays.",
        ]},
        { h: "Fixed", items: [
          "Forty-three small things. The full list, if you must, is on GitHub.",
        ]},
      ],
    },
  ];

  return (
    <>
      {/* ── Header ─────────────────────────── */}
      <section style={{ paddingTop: 140, paddingBottom: 64 }}>
        <div className="page">
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            marginBottom: 48, flexWrap: "wrap", gap: 16,
          }}>
            <div className="chapter-mark">
              <span className="num">№ 01</span>
              <span>Field Notes</span>
            </div>
            <div className="mono" style={{
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
              color: "var(--ink-faint)",
            }}>
              Updated as we ship · Subscribe by RSS
            </div>
          </div>
          <hr className="rule-double" style={{ marginBottom: 48 }} />

          <div className="cl-hero" style={{
            display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 64, alignItems: "end",
          }}>
            <h1 className="display" style={{
              fontSize: "clamp(48px, 7.4vw, 120px)", margin: 0,
            }}>
              What we<br />
              <span className="italic" style={{ color: "var(--accent)" }}>shipped.</span>
            </h1>
            <p className="lede" style={{ maxWidth: 460, margin: 0 }}>
              Releases, written out plainly. We publish an issue every couple
              of weeks — sometimes a big chapter, more often a stack of small
              kindnesses. The most recent is on top.
            </p>
          </div>

          <div style={{ marginTop: 36, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="#" className="btn btn-ghost">Subscribe by RSS</a>
            <a href="#" className="btn btn-ghost">Follow on X</a>
            <a href="#" className="btn btn-ghost">Annual report</a>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .cl-hero { grid-template-columns: 1fr !important; gap: 28px !important; }
          }
        `}</style>
      </section>

      {/* ── Issues feed ────────────────────── */}
      <section style={{ paddingBottom: 96 }}>
        <div className="page">
          {issues.map((it, i) => (
            <Issue key={i} issue={it} index={i} />
          ))}

          {/* end-of-archive marker */}
          <div style={{ marginTop: 56, textAlign: "center" }}>
            <hr className="rule-double" />
            <div className="mono" style={{
              fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--ink-faint)", padding: "24px 0",
            }}>
              ¶  End of recent issues · See the <a href="#" className="ulink" style={{ color: "var(--accent)" }}>full archive →</a>
            </div>
            <hr className="rule-double" />
          </div>
        </div>
      </section>

      {/* ── Roadmap teaser ─────────────────── */}
      <section style={{
        padding: "96px 0", background: "var(--bg-soft)",
        borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)",
      }}>
        <div className="page">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 56, alignItems: "start" }} className="rm-grid">
            <div>
              <div className="chapter-mark" style={{ marginBottom: 18 }}>
                <span className="num">№ 02</span>
                <span>Coming next</span>
              </div>
              <h2 className="display" style={{
                fontSize: "clamp(36px, 5vw, 64px)", margin: 0,
              }}>
                On the<br />
                <span className="italic" style={{ color: "var(--accent)" }}>desk.</span>
              </h2>
              <p className="serif" style={{ fontSize: 17, lineHeight: 1.55, color: "var(--ink-muted)", marginTop: 18 }}>
                What we're working on, roughly in the order we expect to ship.
                Subject to change — but we'll write about it here when it does.
              </p>
            </div>
            <div style={{
              borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)",
            }}>
              {[
                { t: "Web clipper, with reading view", e: "In review · Dec '26", s: "shipping" },
                { t: "Reasoning profiles — your house style, learned", e: "Beta · Jan '27", s: "building" },
                { t: "Calendar integration (Google, Cal.com)", e: "Building · Feb '27", s: "building" },
                { t: "Self-hosted edition for teams", e: "Considering · Q2 '27", s: "considering" },
                { t: "Ambient note-taking from meetings (with consent)", e: "Considering · 2027", s: "considering" },
              ].map((r, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "1fr auto", gap: 20,
                  padding: "18px 0", borderTop: i > 0 ? "1px dotted var(--rule)" : "none",
                  alignItems: "baseline",
                }}>
                  <span className="serif" style={{ fontSize: 19, color: "var(--ink)", letterSpacing: "-0.005em" }}>
                    <span className="serif italic" style={{ color: "var(--accent)", marginRight: 10 }}>
                      {String(i + 1).padStart(2, "0")}.
                    </span>
                    {r.t}
                  </span>
                  <span className="mono" style={{
                    fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: r.s === "shipping" ? "var(--accent)" : "var(--ink-faint)",
                  }}>
                    {r.e}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .rm-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          }
        `}</style>
      </section>
    </>
  );
}

function Issue({ issue, index }) {
  return (
    <article style={{
      padding: "48px 0",
      borderTop: "1px solid var(--rule)",
      borderBottom: index === 0 ? "1px solid var(--rule)" : "none",
    }}>
      <div className="issue-grid" style={{
        display: "grid", gridTemplateColumns: "240px 1fr", gap: 56, alignItems: "start",
      }}>
        {/* Margin meta */}
        <aside style={{ paddingTop: 4 }}>
          <div className="mono" style={{
            fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase",
            color: "var(--ink-faint)", marginBottom: 6,
          }}>
            {issue.vol}
          </div>
          <div className="serif italic" style={{
            fontSize: 17, color: "var(--ink)",
          }}>
            {issue.date}
          </div>
          <div style={{
            marginTop: 16, display: "inline-block",
            padding: "3px 10px", fontSize: 10.5, letterSpacing: "0.16em",
            textTransform: "uppercase", fontFamily: "var(--mono)",
            color: issue.tag === "Major" ? "var(--accent)" : "var(--ink-muted)",
            background: issue.tag === "Major" ? "var(--accent-soft)" : "var(--paper-200)",
            borderRadius: 999,
          }}>
            {issue.tag} release
          </div>
        </aside>

        {/* Issue body */}
        <div>
          <h2 className="display" style={{
            fontSize: "clamp(34px, 4.4vw, 56px)", margin: 0, color: "var(--ink)",
            letterSpacing: "-0.02em", lineHeight: 1.02,
          }}>
            {issue.title}
          </h2>
          <p className="serif" style={{
            fontSize: 19, lineHeight: 1.5, color: "var(--ink-muted)", marginTop: 14,
            maxWidth: 680,
          }}>
            {issue.lede}
          </p>

          <div style={{ marginTop: 32, display: "grid", gap: 22 }}>
            {issue.sections.map((sec) => (
              <div key={sec.h}>
                <div className="mono" style={{
                  fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase",
                  color: "var(--accent)", marginBottom: 10,
                }}>
                  § {sec.h}
                </div>
                <ul style={{
                  margin: 0, padding: 0, listStyle: "none",
                  display: "grid", gap: 8,
                }}>
                  {sec.items.map((t, i) => (
                    <li key={i} style={{
                      display: "grid", gridTemplateColumns: "auto 1fr", gap: 12,
                      alignItems: "baseline",
                    }}>
                      <span className="mono" style={{
                        fontSize: 10.5, color: "var(--ink-faint)", letterSpacing: "0.06em",
                      }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span style={{
                        fontSize: 15.5, lineHeight: 1.6, color: "var(--ink-soft)",
                      }}>
                        {t}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .issue-grid { grid-template-columns: 1fr !important; gap: 18px !important; }
        }
      `}</style>
    </article>
  );
}

window.ChangelogPage = ChangelogPage;
