// PageShell — shared chrome for every page (masthead + colophon + tweaks).
// Persists tweaks across pages via localStorage so the experience feels unified.

function PageShell({ current, children }) {
  const STORAGE_KEY = "notestream:tweaks";

  // Read persisted overrides (if any) and merge with EDITMODE defaults
  const defaults = window.__PAGE_TWEAK_DEFAULTS || {
    accent: "#1f3aa8",
    darkMode: false,
  };

  let initial = defaults;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) initial = { ...defaults, ...JSON.parse(saved) };
  } catch (e) { /* ignore */ }

  const [tweaks, setTweak] = useTweaks(initial);

  // Apply + persist
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", tweaks.accent);
    root.style.setProperty("--accent-soft", softTint(tweaks.accent, 0.18));
    root.style.setProperty("--accent-deep", shadeHex(tweaks.accent, -22));

    if (tweaks.darkMode) root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");

    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks)); }
    catch (e) { /* ignore */ }
  }, [tweaks.accent, tweaks.darkMode]);

  return (
    <>
      <Masthead current={current} />
      <main style={{ paddingTop: 84 }}>
        {children}
      </main>
      <Colophon />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Accent ink" />
        <TweakColor
          label="Color"
          value={tweaks.accent}
          options={["#1f3aa8", "#8a1d2e", "#175b3a", "#c2410c", "#3a3a3a"]}
          onChange={(v) => setTweak("accent", v)}
        />
        <TweakSection label="Reading" />
        <TweakToggle
          label="Dark print"
          value={tweaks.darkMode}
          onChange={(v) => setTweak("darkMode", v)}
        />
      </TweaksPanel>
    </>
  );
}

// Color utilities used by PageShell (small, dependency-free)
function shadeHex(hex, amt) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const adj = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
  return `rgb(${adj(r)}, ${adj(g)}, ${adj(b)})`;
}
function softTint(hex, alpha = 0.16) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

window.PageShell = PageShell;
window.shadeHex = shadeHex;
window.softTint = softTint;
