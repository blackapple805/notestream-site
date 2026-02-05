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
          overflow-y-visible md:overflow-y-auto
          pb-[90px] md:pb-12
          transition-colors duration-300
        "
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="
              mx-auto
              w-full
              max-w-[1200px]
              px-4 sm:px-5 md:px-8
              pt-6 sm:pt-8
              md:pt-[calc(var(--ns-desktop-header-h,0px)+24px)]
            "
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Global Toast Target */}
      <div id="global-toast" className="hidden opacity-0 pointer-events-none" />
    </div>
  );
}

