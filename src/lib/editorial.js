// src/lib/editorial.js
// ───────────────────────────────────────────────────────────────
// NoteStream — shared editorial design system module.
// Import this into any component that uses the .ns-ed wrapper.
// CSS injects only once per page via useEditorialStyles().
//
// Hardened against parent / global CSS that sets text colors
// on h1-h6 or links (e.g. Tailwind's @apply in @layer base).
// ───────────────────────────────────────────────────────────────

import { useEffect } from "react";

// ── Color & type tokens (exported for use in inline styles) ─────
export const ED = {
  paper50:    "var(--ed-paper-50)",
  paper100:   "var(--ed-paper-100)",
  paper150:   "var(--ed-paper-150)",
  paper200:   "var(--ed-paper-200)",
  paper300:   "var(--ed-paper-300)",
  ink:        "var(--ed-ink)",
  inkSoft:    "var(--ed-ink-soft)",
  inkMute:    "var(--ed-ink-mute)",
  inkFaint:   "var(--ed-ink-faint)",
  rule:       "var(--ed-rule)",
  ruleSoft:   "var(--ed-rule-soft)",
  accent:     "var(--ed-accent)",
  accentSoft: "var(--ed-accent-soft)",
  hiYellow:   "var(--ed-hi-yellow)",
  serif:      "var(--ed-serif)",
  sans:       "var(--ed-sans)",
  mono:       "var(--ed-mono)",
};

// ── Hook: load Google Fonts once per page ───────────────────────
export function useEditorialFonts() {
  useEffect(() => {
    if (document.getElementById("ns-editorial-fonts")) return;
    const link = document.createElement("link");
    link.id = "ns-editorial-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);
}

// ── Hook: inject scoped editorial CSS once per page ─────────────
export function useEditorialStyles() {
  useEffect(() => {
    if (document.getElementById("ns-editorial-styles")) return;
    const style = document.createElement("style");
    style.id = "ns-editorial-styles";
    style.textContent = SCOPED_CSS;
    document.head.appendChild(style);
  }, []);
}

// ── Combined ────────────────────────────────────────────────────
export function useEditorial() {
  useEditorialFonts();
  useEditorialStyles();
}

// ── The scoped CSS (everything lives inside .ns-ed) ─────────────
const SCOPED_CSS = `
.ns-ed {
  --ed-paper-50:   #fbf8f0;
  --ed-paper-100:  #f6f1e3;
  --ed-paper-150:  #efe9d8;
  --ed-paper-200:  #e7e0cb;
  --ed-paper-300:  #d6cdb2;
  --ed-ink:        #131008;
  --ed-ink-soft:   #2a2519;
  --ed-ink-mute:   #4b4534;
  --ed-ink-faint:  #8a8472;
  --ed-rule:       #d8cfb6;
  --ed-rule-soft:  #e5dec5;
  --ed-accent:     #1f3aa8;
  --ed-accent-soft:#dbe1f3;
  --ed-hi-yellow:  #f7e84a;

  --ed-serif: "Instrument Serif", Georgia, serif;
  --ed-sans:  "Geist", -apple-system, system-ui, sans-serif;
  --ed-mono:  "Geist Mono", ui-monospace, monospace;

  background: var(--ed-paper-100);
  color: var(--ed-ink);
  font-family: var(--ed-sans);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.ns-ed *,
.ns-ed *::before,
.ns-ed *::after { box-sizing: border-box; }

/* ── force editorial text colors over any inherited global rules ── */
/* Specificity 0,1,1 beats type selectors like h2{} that Tailwind   */
/* base layers or src/index.css may set globally.                   */
.ns-ed h1,
.ns-ed h2,
.ns-ed h3,
.ns-ed h4,
.ns-ed h5,
.ns-ed h6 { color: var(--ed-ink); }

.ns-ed p,
.ns-ed li,
.ns-ed blockquote,
.ns-ed figcaption,
.ns-ed dd,
.ns-ed dt { color: var(--ed-ink); }

.ns-ed a { color: inherit; text-decoration: none; }

.ns-ed button {
  font-family: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.ns-ed input,
.ns-ed textarea,
.ns-ed select {
  font-family: inherit;
  color: var(--ed-ink);
}

/* Layout */
.ns-ed .ed-page      { max-width: 1320px; margin: 0 auto; padding: 0 32px; }
.ns-ed .ed-rule      { height: 1px; background: var(--ed-rule); border: 0; margin: 0; }
.ns-ed .ed-rule-soft { height: 1px; background: var(--ed-rule-soft); border: 0; margin: 0; }
.ns-ed .ed-rule-dbl  { border: 0; border-top: 1px solid var(--ed-ink); border-bottom: 1px solid var(--ed-ink); height: 4px; margin: 0; }

/* Type classes — all carry explicit color */
.ns-ed .ed-mono    { font-family: var(--ed-mono); color: var(--ed-ink); }
.ns-ed .ed-serif   { font-family: var(--ed-serif); font-weight: 400; letter-spacing: -0.01em; color: var(--ed-ink); }
.ns-ed .ed-italic  { font-style: italic; }
.ns-ed .ed-display { font-family: var(--ed-serif); font-weight: 400; line-height: 0.95; letter-spacing: -0.025em; color: var(--ed-ink); }
.ns-ed .ed-eyebrow { font-family: var(--ed-mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ed-ink-mute); font-weight: 500; }
.ns-ed .ed-lede    { font-family: var(--ed-serif); font-size: clamp(20px, 1.8vw, 26px); line-height: 1.4; color: var(--ed-ink-soft); }

.ns-ed .ed-chapter { display: inline-flex; align-items: baseline; gap: 8px; font-family: var(--ed-mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ed-ink-faint); }
.ns-ed .ed-chapter .num { font-family: var(--ed-serif); font-style: italic; font-size: 22px; letter-spacing: 0; color: var(--ed-accent); }

.ns-ed .ed-chip { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; font-family: var(--ed-mono); font-size: 11px; letter-spacing: 0.04em; background: var(--ed-paper-200); color: var(--ed-ink-mute); border: 1px solid var(--ed-rule); }
.ns-ed .ed-chip-accent { background: var(--ed-accent-soft); color: var(--ed-accent); border-color: transparent; }
.ns-ed .ed-card { background: var(--ed-paper-50); border: 1px solid var(--ed-rule); border-radius: 14px; color: var(--ed-ink); }

.ns-ed .ed-hi { background: linear-gradient(180deg, transparent 55%, var(--ed-hi-yellow) 55%, var(--ed-hi-yellow) 92%, transparent 92%); padding: 0 0.05em; color: var(--ed-ink); }

.ns-ed .ed-ulink { background-image: linear-gradient(currentColor, currentColor); background-position: 0 100%; background-repeat: no-repeat; background-size: 100% 1px; transition: background-size .3s ease; }
.ns-ed .ed-ulink:hover { background-size: 100% 2px; }

.ns-ed .ed-btn { display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px; border-radius: 999px; font-family: var(--ed-sans); font-size: 14px; font-weight: 500; letter-spacing: -0.005em; border: 1px solid transparent; transition: all 0.18s ease; white-space: nowrap; cursor: pointer; text-decoration: none; }
.ns-ed .ed-btn-primary { background: var(--ed-ink); color: var(--ed-paper-50); border-color: var(--ed-ink); }
.ns-ed .ed-btn-primary:hover { transform: translateY(-1px); background: var(--ed-ink-soft); color: var(--ed-paper-50); }
.ns-ed .ed-btn-ghost { background: transparent; color: var(--ed-ink); border-color: var(--ed-rule); }
.ns-ed .ed-btn-ghost:hover { border-color: var(--ed-ink); color: var(--ed-ink); }

.ns-ed .ed-dropcap::first-letter {
  font-family: var(--ed-serif);
  font-size: 5.4em;
  float: left;
  line-height: 0.85;
  padding: 0.08em 0.12em 0 0;
  font-style: italic;
  color: var(--ed-accent);
}

/* selection inside editorial only */
.ns-ed ::selection { background: var(--ed-hi-yellow); color: var(--ed-ink); }

@keyframes ed-reveal { from { opacity: 0; transform: translateY(14px);} to { opacity: 1; transform: translateY(0); } }
@keyframes ed-pulse  { 0%,100% { transform: scale(1); opacity: 1;} 50% { transform: scale(1.4); opacity: 0.5; } }
@keyframes ed-blink  { 0%,50% { opacity: 1;} 50.01%,100% { opacity: 0; } }

.ns-ed .ed-reveal { animation: ed-reveal .7s cubic-bezier(.22,1,.36,1) both; }

@media (max-width: 960px) {
  .ns-ed .hero-grid,
  .ns-ed .sec-head,
  .ns-ed .demo-body { grid-template-columns: 1fr !important; gap: 32px !important; }
  .ns-ed .margin-col { padding-top: 0 !important; }
}
`;
