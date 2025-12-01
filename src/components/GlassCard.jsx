// src/components/GlassCard.jsx
export default function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`
        rounded-2xl
        p-3.5 sm:p-4 md:p-5
        transition-colors duration-200
        border
        ${className}
      `}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-secondary)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {children}
    </div>
  );
}