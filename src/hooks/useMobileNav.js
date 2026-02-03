// src/hooks/useMobileNav.js
// Hook to control mobile navigation visibility for modals/overlays

import { useEffect, useCallback } from "react";

/**
 * Hook to hide/show mobile nav when modals or overlays are active.
 * 
 * Usage in your component:
 * 
 * const { hideMobileNav, showMobileNav } = useMobileNav();
 * 
 * // When opening modal:
 * const handleOpenModal = () => {
 *   setShowModal(true);
 *   hideMobileNav();
 * };
 * 
 * // When closing modal:
 * const handleCloseModal = () => {
 *   setShowModal(false);
 *   showMobileNav();
 * };
 * 
 * OR use the auto-sync version:
 * 
 * useMobileNav(isModalOpen); // Automatically hides when true, shows when false
 */

export function useMobileNav(syncWithState) {
  const hideMobileNav = useCallback(() => {
    window.dispatchEvent(new CustomEvent("modal:open"));
    document.body.classList.add("modal-open");
  }, []);

  const showMobileNav = useCallback(() => {
    window.dispatchEvent(new CustomEvent("modal:close"));
    document.body.classList.remove("modal-open");
  }, []);

  // Auto-sync with a boolean state if provided
  useEffect(() => {
    if (typeof syncWithState === "boolean") {
      if (syncWithState) {
        hideMobileNav();
      } else {
        showMobileNav();
      }
    }

    // Cleanup: ensure nav is shown when component unmounts
    return () => {
      if (typeof syncWithState === "boolean" && syncWithState) {
        showMobileNav();
      }
    };
  }, [syncWithState, hideMobileNav, showMobileNav]);

  return { hideMobileNav, showMobileNav };
}

// Standalone functions for non-hook usage
export function hideMobileNav() {
  window.dispatchEvent(new CustomEvent("modal:open"));
  document.body.classList.add("modal-open");
}

export function showMobileNav() {
  window.dispatchEvent(new CustomEvent("modal:close"));
  document.body.classList.remove("modal-open");
}

export default useMobileNav;