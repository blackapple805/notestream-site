// src/layouts/DashboardLayout.jsx
import { useLocation, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout() {
  const location = useLocation();

  const pageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2, ease: "easeIn" },
    },
  };

  return (
    <div
      className="
        w-full
        min-h-[100dvh]
        flex
        bg-theme-primary
        text-theme-primary
        relative
        transition-colors duration-300
        overflow-x-hidden
      "
    >
      {/* Sidebar (desktop + mobile) */}
      <Sidebar />

      {/* Main Scroll Area */}
      <div
        className="
          flex-grow
          w-full
          min-h-[100dvh]
          relative
          z-[10]
          overflow-y-auto
          transition-colors duration-300
        "
        style={{
          paddingTop: "var(--app-content-top, 0px)",
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
              max-w-[1500px]
              px-4 sm:px-5 md:px-8
              pt-6 sm:pt-8
            "
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Global Toast Target */}
      <div id="global-toast" className="hidden opacity-0 pointer-events-none" />

      {/* Mobile header clearance — applied globally to all dashboard pages */}
      <style>{`
        @media (max-width: 767px) {
          .ns-dashboard-content {
            padding-top: calc(env(safe-area-inset-top, 0px) + 68px) !important;
          }
        }
      `}</style>
    </div>
  );
}