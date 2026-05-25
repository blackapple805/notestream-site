// Reasoning — long-form editorial moment with working "ask the archive" prompt
function Reasoning() {
  const samples = [
    "What did Maya say about the launch timing?",
    "Summarize every voice note I left this month about Project Atlas.",
    "Find contradictions between my Q3 plan and the board memo.",
    "Where did I first write down the term 'reading room'?",
  ];

  const cannedAnswers = {
    "What did Maya say about the launch timing?":
      "On Sep 14 Maya pushed for a soft launch the week of Oct 21 — she wanted lead time to brief partners. By Sep 22 (Slack DM) she'd softened: 'fine with Nov 4 if eng is firm on it.' Most recent take is Nov 4. Source: 3 voice memos, 1 slack thread.",
    "Summarize every voice note I left this month about Project Atlas.":
      "11 voice notes, all this month. Pattern: you keep returning to the data-model question — five mentions, none resolved. Other recurring themes are pricing tiers (3) and the hiring slot (2). The one decision actually made: Atlas ships behind a feature flag, not a separate plan.",
    "Find contradictions between my Q3 plan and the board memo.":
      "Two. (1) The plan targets enterprise; the board memo emphasizes mid-market expansion. (2) The plan budgets 4 engineering hires; the memo cites 2. Both documents were authored by you, two weeks apart.",
    "Where did I first write down the term 'reading room'?":
      "Voice memo, March 3, 7:14 am, while walking. Quote: 'imagine if your notes app felt more like a reading room than a feed.' First written reference: a Notion doc March 5, in the same week.",
  };

  const [q, setQ] = React.useState(samples[0]);
  const [answer, setAnswer] = React.useState(cannedAnswers[samples[0]]);
  const [loading, setLoading] = React.useState(false);
  const [custom, setCustom] = React.useState("");

  const ask = async (question) => {
    setQ(question);
    setLoading(true);
    setAnswer("");
    // Pre-canned simulated response
    if (cannedAnswers[question]) {
      await new Promise((r) => setTimeout(r, 700));
      const txt = cannedAnswers[question];
      let i = 0;
      const id = setInterval(() => {
        i += 4;
        setAnswer(txt.slice(0, i));
        if (i >= txt.length) {
          clearInterval(id);
          setLoading(false);
        }
      }, 18);
    } else {
      // Use live Claude for novel questions
      try {
        const text = await window.claude.complete(
          `You are an AI assistant inside a fictional notes app called NoteStream. The user is asking you to reason across their personal archive of voice notes, meeting transcripts and documents. Their archive is fictional — make up plausible, specific citations (e.g. "voice memo, Sep 14, 2:48 pm" or "doc: Q3 plan, page 3"). Keep your answer to 3–4 short sentences. Be confident, editorial in tone, never hedge. Always cite at least 2 specific sources from the imagined archive.\n\nThe user's question: "${question}"\n\nAnswer:`
        );
        setAnswer(text);
      } catch (e) {
        setAnswer("Reasoning couldn't reach the archive just now. Try one of the suggested questions above.");
      }
      setLoading(false);
    }
  };

  React.useEffect(() => {
    ask(samples[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    if (custom.trim()) {
      ask(custom.trim());
      setCustom("");
    }
  };

  return (
    <section id="reasoning" style={{
      paddingTop: 96, paddingBottom: 96,
      background: "var(--bg-soft)",
      borderTop: "1px solid var(--rule)",
      borderBottom: "1px solid var(--rule)",
    }}>
      <div className="page">
        {/* section head */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 2fr", gap: 64, alignItems: "end",
          marginBottom: 64,
        }} className="sec-head">
          <div>
            <div className="chapter-mark" style={{ marginBottom: 18 }}>
              <span className="num">№ 04</span>
              <span>An Essay on Reasoning</span>
            </div>
            <h2 className="display" style={{
              fontSize: "clamp(40px, 5.4vw, 78px)", margin: 0,
            }}>
              The archive,<br />
              <span className="italic" style={{ color: "var(--accent)" }}>arguing</span> with itself.
            </h2>
          </div>
          <div>
            <p className="lede" style={{ maxWidth: 540, margin: 0 }}>
              Search returns matches. Reasoning returns a position. NoteStream
              reads across your whole archive the way an editor reads across
              every draft — looking for what's repeated, what's contradicted,
              what's the one thing you keep coming back to.
            </p>
          </div>
        </div>

        {/* Two-column long form + live prompt */}
        <div className="reasoning-body" style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "start",
        }}>
          {/* Essay column */}
          <article style={{ maxWidth: 560 }}>
            <p className="dropcap serif" style={{
              fontSize: 18, lineHeight: 1.65, color: "var(--ink-soft)",
              marginTop: 0,
            }}>
              For a long time, a notebook was a hedge against forgetting.
              You wrote things down so that, later, you could find them.
              The problem is that nobody actually reads their old notes.
              They sit there — voice memos from a walk, half-drafted essays,
              transcripts of meetings nobody quite remembers — and
              the one thing you needed lives buried in the seventh paragraph
              of the third document, under a heading you don't recall.
            </p>
            <p className="serif" style={{
              fontSize: 18, lineHeight: 1.65, color: "var(--ink-soft)",
              marginTop: 20,
            }}>
              We built NoteStream because the missing piece was never{" "}
              <span className="italic">capture</span>. It was{" "}
              <span className="italic">retrieval that thinks</span> — a librarian
              who has read every note you've ever written, and can argue back.
              You ask a question; the archive answers, with citations,{" "}
              <span className="hi">in your own words.</span>
            </p>

            <hr className="rule-soft" style={{ margin: "32px 0" }} />

            <div className="serif italic" style={{
              fontSize: 17, color: "var(--ink-muted)", lineHeight: 1.55,
            }}>
              "It's not a second brain. It's a second reader — one that has
              actually read every note I've kept, and has opinions about them."
              <div className="mono" style={{
                fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                color: "var(--ink-faint)", marginTop: 10, fontStyle: "normal",
              }}>
                — From a field note, June '25
              </div>
            </div>
          </article>

          {/* Live "ask the archive" panel */}
          <div className="card paper-grain" style={{
            padding: 28, position: "sticky", top: 120,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <span className="chip chip-accent">
                <IconBrain size={11} /> Ask the archive
              </span>
              <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Live · try it
              </span>
            </div>

            {/* Suggested questions */}
            <div className="eyebrow" style={{ marginBottom: 10 }}>Suggested</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
              {samples.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  style={{
                    textAlign: "left", padding: "10px 12px", borderRadius: 8,
                    background: q === s ? "var(--paper-200)" : "var(--bg)",
                    border: "1px solid " + (q === s ? "var(--ink)" : "var(--rule)"),
                    fontFamily: "var(--serif)", fontSize: 15, color: "var(--ink)",
                    cursor: "pointer", transition: "all .15s",
                    lineHeight: 1.4,
                  }}
                >
                  <span className="serif italic" style={{ color: "var(--accent)", marginRight: 6 }}>?</span>
                  {s}
                </button>
              ))}
            </div>

            {/* Custom prompt */}
            <form onSubmit={onSubmit} style={{
              display: "flex", gap: 8, marginBottom: 18,
              padding: 8, background: "var(--bg)", border: "1px solid var(--rule)",
              borderRadius: 10,
            }}>
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Or ask your own — Claude will improvise an answer…"
                style={{
                  flex: 1, border: 0, background: "transparent", outline: "none",
                  fontFamily: "var(--serif)", fontSize: 15, color: "var(--ink)",
                  padding: "6px 8px",
                }}
              />
              <button type="submit" className="btn btn-accent" style={{ padding: "8px 14px", fontSize: 13 }}>
                Ask <IconArrowRight size={12} />
              </button>
            </form>

            {/* Answer */}
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {loading ? "Reading the archive…" : "The archive answers"}
            </div>
            <div style={{
              padding: 18, background: "var(--ink-900)", color: "var(--paper-50)",
              borderRadius: 10, minHeight: 130, position: "relative",
            }}>
              <div style={{
                position: "absolute", top: -1, left: 18, right: 18, height: 2,
                background: "var(--accent)",
              }} />
              <p className="serif" style={{
                fontSize: 16, lineHeight: 1.55, margin: 0, color: "var(--paper-50)",
              }}>
                {answer || (loading ? "Reading 1,284 notes…" : "")}
                {loading && answer && (
                  <span style={{
                    display: "inline-block", width: 2, height: 16, marginLeft: 3,
                    background: "var(--accent)", verticalAlign: "middle",
                    animation: "type-cursor 1s steps(2) infinite",
                  }} />
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .reasoning-body { grid-template-columns: 1fr !important; gap: 32px !important; }
          .reasoning-body > div:last-child { position: static !important; }
        }
      `}</style>
    </section>
  );
}

window.Reasoning = Reasoning;
