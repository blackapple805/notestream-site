// src/components/GlassCard.jsx
export default function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`bg-[#ffffff08] border border-[#2b2b31] rounded-2xl p-6 backdrop-blur-xl shadow-[0_0_28px_rgba(0,0,0,0.35)]
      hover:shadow-[0_0_40px_rgba(99,102,241,0.25)] transition ${className}`}
    >
      {children}
    </div>
  );
}
