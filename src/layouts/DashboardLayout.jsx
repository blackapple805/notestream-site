// src/layouts/DashboardLayout.jsx
// ═══════════════════════════════════════════════════════════════════
// EDITORIAL RESKIN — what changed and why
// ─────────────────────────────────────────────────────────────────
// Restructured into a two-column grid: a fixed-width left sidebar
// column on desktop (the editorial nav rail managed by Sidebar.jsx)
// plus a main content column that holds the top masthead strip and
// the page outlet. Dark theme classes (`bg-theme-primary`,
// `text-theme-primary`) are gone; the paper bg is set by the
// Sidebar's global override. Mobile keeps the same single-column
// layout (the sidebar collapses into a slide-out drawer).
//
// The `--ns-layout-sidebar-w` and `--app-content-top` CSS vars are
// set by Sidebar.jsx; this layout reads them so the two stay in
// sync if either height changes. Right gutter via `--ns-right-gutter`
// is kept exactly as before so Notes.jsx, FAB positioning, and
// context menus continue to align correctly.
// ═══════════════════════════════════════════════════════════════════

import { useLocation, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout() {
  const location = useLocation();

  const pageVariants = {
    hidden:  { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
    exit:    { opacity: 0, y: -8, transition: { duration: 0.18, ease: "easeIn" } },
  };

  return (
    <div
      className="
        w-full
        min-h-[100dvh]
        relative
        overflow-x-hidden
        ns-ed-app-shell
      "
    >
      {/* Sidebar renders:
          • DESKTOP: left column (fixed, width: var(--ns-layout-sidebar-w))
                     + top strip (fixed, from left: sidebar-w to right: 0)
          • MOBILE:  thin top masthead + slide-out drawer */}
      <Sidebar />

      {/* Main scroll area — offset by the sidebar width on desktop
          and by the masthead height (top) on all sizes. */}
      <div
        className="
          ns-ed-main
          w-full
          min-h-[100dvh]
          relative
          z-[10]
          overflow-y-auto
        "
        style={{
          paddingTop: "var(--app-content-top, 0px)",
          paddingLeft: "var(--ns-layout-sidebar-w, 0px)",
          paddingBottom: "var(--app-content-bottom, 0px)",
          paddingRight: "var(--ns-layout-right-pad, 0px)",
          scrollPaddingTop: "var(--app-content-top, 0px)",
          scrollPaddingBottom: "var(--app-content-bottom, 0px)",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="
              ns-dashboard-content
              mx-auto
              w-full
              max-w-[1280px]
              px-4 sm:px-6 md:px-10
              pt-6 sm:pt-8
            "
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Global toast target — unchanged */}
      <div id="global-toast" className="hidden opacity-0 pointer-events-none" />

      {/* Mobile clearance — matches mobile masthead height */}
      <style>{`
        @media (max-width: 767px) {
          .ns-dashboard-content {
            padding-top: calc(env(safe-area-inset-top, 0px) + 64px) !important;
          }
          .ns-ed-main {
            padding-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
