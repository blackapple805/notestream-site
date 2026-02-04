// src/ui/layoutState.js
// Helper: hide mobile bottom nav (used by modals, sheets, etc)
export function hideMobileNav() {
  window.dispatchEvent(new CustomEvent("modal:open"));
  document.body.classList.add("modal-open");
}

// Helper: show mobile bottom nav again
export function showMobileNav() {
  window.dispatchEvent(new CustomEvent("modal:close"));
  document.body.classList.remove("modal-open");
}
