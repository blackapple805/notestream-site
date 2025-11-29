// src/layouts/DashboardLayout.jsx
import { useLocation, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";

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
        min-h-[100dvh]     /* FIX — dynamic viewport for iPhone */
        flex 
        bg-[#0b0b0e] 
        text-gray-200 
        relative
      "
    >

      {/* ===== Desktop Sidebar ===== */}
      <aside
        className="
          hidden md:block
          fixed top-0 left-0 
          h-screen w-[220px]
          bg-[#0d0d12]/95 
          border-r border-[#1f1f24]
          shadow-xl 
          z-[80]
        "
        style={{ transform: "translate3d(0,0,0)" }}
      >
        <Sidebar />
      </aside>

      {/* ===== MAIN SCROLL AREA ===== */}
      <div
        className="
          flex-grow w-full min-h-screen
          min-h-[100dvh]      /* FIX — prevents content clipping */
          md:ml-[220px]
          relative z-[10]
          overflow-y-visible md:overflow-y-auto
          pb-[90px] md:pb-12         /* FIX — room for mobile nav */
        "
      >
        <div className="flex w-full justify-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.main
              key={location.pathname}
              variants={pageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="
                w-full max-w-[1200px]
                px-4 sm:px-5 md:px-8
                pt-6 sm:pt-8 md:pt-10
              "
            >
              <Outlet />
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      {/* ===== Mobile Bottom Navigation ===== */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[90]">
      <MobileNav />
    </div>
    </div>
  );
}

