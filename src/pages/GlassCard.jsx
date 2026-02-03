// src/components/GlassCard.jsx
// Liquid Glass Card Component — Theme-aware

import { motion } from "framer-motion";

/**
 * GlassCard - A theme-aware liquid glass card component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.hover - Enable hover effects (default: true)
 * @param {boolean} props.active - Active/selected state
 * @param {string} props.variant - Card variant: 'default' | 'sm' | 'row' | 'stat'
 * @param {string} props.accent - Accent color for stat variant: 'indigo' | 'purple' | 'emerald' | 'amber' | 'rose'
 * @param {function} props.onClick - Click handler
 * @param {Object} props.style - Additional inline styles
 */
export default function GlassCard({
  children,
  className = "",
  hover = true,
  active = false,
  variant = "default",
  accent = "indigo",
  onClick,
  style = {},
  ...props
}) {
  // Variant class mapping
  const variantClasses = {
    default: "liquid-glass-card",
    sm: "liquid-glass-card-sm",
    row: "liquid-glass-row",
    stat: `liquid-glass-stat ${accent}`,
  };

  const baseClass = variantClasses[variant] || variantClasses.default;

  // Build final className
  const finalClassName = [
    baseClass,
    active ? "active" : "",
    !hover ? "hover:bg-none hover:border-inherit hover:shadow-inherit" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Use motion.div for smooth hover animations if hover is enabled
  if (hover && onClick) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={finalClassName}
        onClick={onClick}
        style={{ cursor: "pointer", ...style }}
        data-active={active}
        {...props}
      >
        {/* Inner glow overlay */}
        <div
          className="absolute inset-0 rounded-inherit pointer-events-none"
          style={{
            background: "var(--card-glass-inner-glow)",
            borderRadius: "inherit",
            opacity: 0.8,
          }}
        />
        {/* Specular highlight */}
        <div
          className="absolute inset-x-6 top-0 h-[1px] pointer-events-none"
          style={{
            background: "var(--card-glass-specular)",
          }}
        />
        {/* Content */}
        <div className="relative z-10 p-4">{children}</div>
      </motion.div>
    );
  }

  // Standard div for non-interactive cards
  return (
    <div
      className={finalClassName}
      onClick={onClick}
      style={onClick ? { cursor: "pointer", ...style } : style}
      data-active={active}
      {...props}
    >
      {/* Inner glow overlay */}
      <div
        className="absolute inset-0 rounded-inherit pointer-events-none"
        style={{
          background: "var(--card-glass-inner-glow)",
          borderRadius: "inherit",
          opacity: 0.8,
        }}
      />
      {/* Specular highlight */}
      <div
        className="absolute inset-x-6 top-0 h-[1px] pointer-events-none"
        style={{
          background: "var(--card-glass-specular)",
        }}
      />
      {/* Content */}
      <div className="relative z-10 p-4">{children}</div>
    </div>
  );
}

/**
 * GlassStatCard - A compact stat card with accent glow
 */
export function GlassStatCard({
  icon,
  label,
  value,
  suffix,
  accent = "indigo",
  loading = false,
  className = "",
}) {
  const accentColors = {
    indigo: "text-indigo-400",
    purple: "text-purple-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };

  const textColor = accentColors[accent] || accentColors.indigo;

  return (
    <div
      className={`liquid-glass-stat ${accent} px-4 py-3 ${className}`}
      style={{ opacity: loading ? 0.7 : 1 }}
    >
      {/* Inner glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "var(--card-glass-inner-glow)",
          borderRadius: "inherit",
          opacity: 0.6,
        }}
      />
      {/* Specular */}
      <div
        className="absolute inset-x-4 top-0 h-[1px] pointer-events-none"
        style={{ background: "var(--card-glass-specular)" }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className={textColor}>{icon}</span>
          <p className="text-[10px] text-theme-muted uppercase tracking-wide">
            {label}
          </p>
        </div>
        <p className={`text-xl font-bold ${textColor}`}>
          {value}{" "}
          {suffix && (
            <span className="text-sm font-normal text-theme-muted">{suffix}</span>
          )}
        </p>
      </div>
    </div>
  );
}

/**
 * GlassRowCard - A row/list item card with hover lift effect
 */
export function GlassRowCard({
  children,
  onClick,
  active = false,
  className = "",
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.99 }}
      className={`liquid-glass-row ${active ? "active" : ""} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
      data-active={active}
    >
      {/* Inner glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "var(--card-glass-inner-glow)",
          borderRadius: "inherit",
          opacity: 0.5,
        }}
      />
      {/* Content */}
      <div className="relative z-10 px-4 py-3">{children}</div>
    </motion.div>
  );
}