// Masthead — newspaper-style fixed header with real cross-page navigation
function Masthead({ current }) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const today = React.useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }, []);

  const links = [
    { id: "product", label: "Voice notes",  href: "voice-notes.html" },
    { id: "how",     label: "How it works",  href: "how-it-works.html" },
    { id: "pricing", label: "Pricing",       href: "pricing.html" },
    { id: "field",   label: "Field notes",   href: "changelog.html" },
  ];

  return (
    <header
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? "color-mix(in srgb, var(--bg) 88%, transparent)" : "transparent",
        backdropFilter: scrolled ? "blur(14px) saturate(140%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(14px) saturate(140%)" : "none",
        borderBottom: scrolled ? "1px solid var(--rule)" : "1px solid transparent",
        transition: "all .25s ease",
      }}
    >
      {/* tiny dateline */}
      <div className="page" style={{ paddingTop: 10, paddingBottom: 6 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "var(--ink-faint)"
        }}>
          <span>Vol. II · No. 24</span>
          <span className="tabular dateline-mid">{today}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%", background: "var(--accent)",
              animation: "pulse-dot 2.4s ease-in-out infinite"
            }} />
            All systems quiet
          </span>
        </div>
      </div>

      <hr className="rule-soft" />

      {/* main nav row */}
      <nav className="page mast-nav" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 32px", height: 64,
      }}>
        <a href="index.html" style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{
            fontFamily: "var(--serif)", fontSize: 26, lineHeight: 1,
            letterSpacing: "-0.02em", color: "var(--ink)"
          }}>
            Notestream
          </span>
          <span style={{
            fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 14,
            color: "var(--accent)"
          }}>
            &
          </span>
          <span style={{
            fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em",
            textTransform: "uppercase", color: "var(--ink-faint)"
          }}>
            Co.
          </span>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 28 }} className="nav-links">
          {links.map((l) => {
            const isActive = l.id === current;
            return (
              <a key={l.id} href={l.href} className="ulink" style={{
                fontFamily: "var(--sans)", fontSize: 13.5,
                color: isActive ? "var(--ink)" : "var(--ink-soft)",
                letterSpacing: "-0.005em", padding: "6px 0",
                fontWeight: isActive ? 500 : 400,
                backgroundSize: isActive ? "100% 1px" : undefined,
              }}>
                {l.label}
              </a>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a href="#" style={{
            fontFamily: "var(--sans)", fontSize: 13.5, color: "var(--ink-soft)",
            padding: "8px 4px",
          }} className="ulink">Sign in</a>
          <a href="#" className="btn btn-primary">
            Start reading <IconArrowRight size={14} />
          </a>
        </div>
      </nav>

      <style>{`
        @media (max-width: 900px) {
          .nav-links { display: none !important; }
          .dateline-mid { display: none; }
        }
      `}</style>
    </header>
  );
}

window.Masthead = Masthead;
