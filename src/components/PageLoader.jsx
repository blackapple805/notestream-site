// src/components/PageLoader.jsx
// ───────────────────────────────────────────────────────────────
// NoteStream — Editorial PageLoader replacement (Vite drop-in).
// Drop into src/components/PageLoader.jsx (overwrite existing).
//
// Replaces the purple/indigo overlay with a quiet paper sheet
// that matches the editorial aesthetic. Three small dots in the
// accent color tick gently while the next route's chunk loads.
// ───────────────────────────────────────────────────────────────

import { useEditorial, ED } from "../lib/editorial";

export default function PageLoader({ isVisible }) {
  useEditorial();

  return (
    <div
      className="ns-ed"
      aria-hidden={!isVisible}
      style={{
        position: "fixed", inset: 0, zIndex: 90,
        background: ED.paper100,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
        transition: "opacity 220ms ease",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{
              width: 6, height: 6, borderRadius: "50%",
              background: ED.accent,
              animation: `ed-loader-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
            }} />
          ))}
        </div>
        <div className="ed-mono" style={{
          fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase",
          color: ED.inkFaint,
        }}>
          Turning the page
        </div>
      </div>

      <style>{`
        @keyframes ed-loader-dot {
          0%, 100% { transform: translateY(0); opacity: 0.35; }
          50%      { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
