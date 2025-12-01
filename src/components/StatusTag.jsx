// src/components/StatusTag.jsx
// A theme-aware status tag/badge component

export default function StatusTag({ children, type = "success", size = "sm" }) {
  // Size classes
  const sizeClasses = {
    xs: "text-[9px] px-1.5 py-0.5",
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  // Type-specific styles that work in both themes
  const typeStyles = {
    success: {
      background: "rgba(16, 185, 129, 0.15)",
      color: "var(--tag-success-text, #10b981)",
      border: "rgba(16, 185, 129, 0.3)",
    },
    warning: {
      background: "rgba(245, 158, 11, 0.15)",
      color: "var(--tag-warning-text, #f59e0b)",
      border: "rgba(245, 158, 11, 0.3)",
    },
    error: {
      background: "rgba(244, 63, 94, 0.15)",
      color: "var(--tag-error-text, #f43f5e)",
      border: "rgba(244, 63, 94, 0.3)",
    },
    info: {
      background: "rgba(99, 102, 241, 0.15)",
      color: "var(--tag-info-text, #6366f1)",
      border: "rgba(99, 102, 241, 0.3)",
    },
    high: {
      background: "rgba(244, 63, 94, 0.15)",
      color: "var(--tag-error-text, #f43f5e)",
      border: "rgba(244, 63, 94, 0.3)",
    },
    medium: {
      background: "rgba(245, 158, 11, 0.15)",
      color: "var(--tag-warning-text, #f59e0b)",
      border: "rgba(245, 158, 11, 0.3)",
    },
    low: {
      background: "rgba(34, 197, 94, 0.15)",
      color: "var(--tag-success-text, #22c55e)",
      border: "rgba(34, 197, 94, 0.3)",
    },
    neutral: {
      background: "var(--bg-tertiary)",
      color: "var(--text-secondary)",
      border: "var(--border-secondary)",
    },
  };

  const style = typeStyles[type] || typeStyles.neutral;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses[size]}`}
      style={{
        backgroundColor: style.background,
        color: style.color,
        borderColor: style.border,
      }}
    >
      {children}
    </span>
  );
}

// Pre-styled variants for common use cases
export const AIReadyTag = () => <StatusTag type="success" size="xs">AI Ready</StatusTag>;
export const HighPriorityTag = () => <StatusTag type="high" size="xs">High</StatusTag>;
export const MediumPriorityTag = () => <StatusTag type="medium" size="xs">Medium</StatusTag>;
export const LowPriorityTag = () => <StatusTag type="low" size="xs">Low</StatusTag>;
export const ProTag = () => <StatusTag type="warning" size="xs">PRO</StatusTag>;