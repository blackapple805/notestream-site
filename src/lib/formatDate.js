// src/lib/formatDate.js
// Shared date/time formatting helpers.
// Centralized here so callers don't redefine the same logic in 5 places.

/**
 * Format a date as a localized relative time string.
 * "Just now" / "5m ago" / "2h ago" / "3d ago" / "Mar 14"
 * Has a French branch driven by navigator.language.
 *
 * Used by: NoteCard, NoteRow (was duplicated character-for-character in both)
 */
export const formatRelative = (date) => {
  if (!date) return "";

  const diffMs = Date.now() - new Date(date);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const isFR =
    typeof navigator !== "undefined" && navigator.language?.startsWith("fr");

  if (diffMins < 1) return isFR ? "À l'instant" : "Just now";
  if (diffHrs < 1) return isFR ? `${diffMins} min` : `${diffMins}m ago`;
  if (diffDays < 1) return isFR ? `${diffHrs} h` : `${diffHrs}h ago`;
  if (diffDays < 7) return isFR ? `il y a ${diffDays} j` : `${diffDays}d ago`;

  return new Date(date).toLocaleDateString(
    (typeof navigator !== "undefined" && navigator.language) || "en-US",
    { month: "short", day: "numeric" }
  );
};

/**
 * Format seconds as a mm:ss timer string (e.g. "2:05", "0:42").
 * Used by: CloudSync (fmtExpiry), VoiceNotes (timer), AiLab (recorder).
 */
export const formatTimer = (s) => {
  const seconds = Math.max(0, Math.floor(Number(s) || 0));
  const m = Math.floor(seconds / 60);
  const ss = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
};

/**
 * Local YYYY-MM-DD string for a date (defaults to today).
 * Uses local timezone, NOT UTC — important for "did the user use AI today" comparisons.
 *
 * Used by: Dashboard, NoteView (was duplicated in both).
 */
export const toLocalYMD = (d = new Date()) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Parse a "YYYY-MM-DD" string into a local Date, or null if malformed.
 */
export const parseYMDToDate = (ymd) => {
  const [y, m, d] = String(ymd || "")
    .split("-")
    .map((n) => Number(n));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

/**
 * Whole-day difference between two YMD strings (b - a, in days).
 * Returns null if either side fails to parse.
 */
export const diffDaysLocal = (aYmd, bYmd) => {
  const a = parseYMDToDate(aYmd);
  const b = parseYMDToDate(bYmd);
  if (!a || !b) return null;
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
};
