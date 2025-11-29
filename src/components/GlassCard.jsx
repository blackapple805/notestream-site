// src/components/GlassCard.jsx
export default function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`
        relative
        bg-[#101018] border border-[#262632] rounded-2xl
        p-3.5 sm:p-4 md:p-5
        shadow-[0_12px_28px_rgba(0,0,0,0.65)]
        overflow-visible
        ${className}
      `}
    >
      {children}
    </div>
  );
}
