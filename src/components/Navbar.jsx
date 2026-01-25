// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { FiMenu, FiX, FiSearch, FiChevronDown } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  {
    name: "Features",
    dropdown: [
      { label: "Smart Notes", to: "/smart-notes" },
      { label: "AI Summary", to: "/ai-summary" },
      { label: "Integrations", to: "/integrations-landing" },
    ],
  },
  { name: "How it Works", to: "/how-it-works" },
  { name: "Updates", to: "/updates" },
  {
    name: "Help",
    dropdown: [
      { label: "Support", to: "/support" },
      { label: "FAQ", to: "/faq" },
    ],
  },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [shouldRenderMobile, setShouldRenderMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);
  const [desktopDropdown, setDesktopDropdown] = useState(null);
  const [mobileDropdown, setMobileDropdown] = useState(null);

  const hoverCloseTimeout = useRef(null);
  const mobileMenuRef = useRef(null);
  const hamburgerBtnRef = useRef(null);

  // Entrance animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Always start CLOSED (guards against weird cached state / iOS restore)
  useEffect(() => {
    setIsMobileOpen(false);
    setMobileDropdown(null);
    setShouldRenderMobile(false);
  }, []);

  // Render panel only while open (or while closing animation finishes)
  useEffect(() => {
    if (isMobileOpen) {
      setShouldRenderMobile(true);
      return;
    }
    // wait for CSS transition to finish, then unmount
    const t = setTimeout(() => setShouldRenderMobile(false), 280);
    return () => clearTimeout(t);
  }, [isMobileOpen]);

  /* Scroll Detection */
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Escape closes menu */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setIsMobileOpen(false);
        setMobileDropdown(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* Lock scroll when menu open */
  useEffect(() => {
    if (!isMobileOpen) return;
    const y = window.scrollY;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      window.scrollTo(0, y);
    };
  }, [isMobileOpen]);

  /* Close on route change */
  useEffect(() => {
    setIsMobileOpen(false);
    setMobileDropdown(null);
  }, [location.pathname]);

  /* Outside click/tap to close (more reliable with refs on iOS) */
  useEffect(() => {
    if (!isMobileOpen) return;

    const handler = (e) => {
      const menu = mobileMenuRef.current;
      const btn = hamburgerBtnRef.current;
      if (!menu?.contains(e.target) && !btn?.contains(e.target)) {
        setIsMobileOpen(false);
        setMobileDropdown(null);
      }
    };

    const t = setTimeout(() => {
      document.addEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler, { passive: true });
    }, 120);

    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [isMobileOpen]);

  const handleMobileNavigate = (to) => {
    setIsMobileOpen(false);
    setMobileDropdown(null);
    navigate(to);
  };

  const toggleMobileDropdown = (name) => {
    setMobileDropdown((prev) => (prev === name ? null : name));
  };

  const handleDesktopHoverEnter = (name) => {
    clearTimeout(hoverCloseTimeout.current);
    setDesktopDropdown(name);
  };

  const handleDesktopHoverLeave = () => {
    hoverCloseTimeout.current = setTimeout(() => setDesktopDropdown(null), 200);
  };

  // Animation variants for navbar items
  const navItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3 + i * 0.1,
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    }),
  };

  const logoVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.1,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const actionsVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.4,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <>
      {/* TOP NAVBAR - Transparent with blur on scroll */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : -20 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 left-0 right-0 z-[120]"
        style={{
          backgroundColor: isScrolled 
            ? "rgba(var(--bg-surface-rgb), 0.85)" 
            : "transparent",
          backdropFilter: isScrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: isScrolled ? "blur(20px)" : "none",
          borderBottom: isScrolled 
            ? "1px solid var(--border-secondary)" 
            : "1px solid transparent",
          transition: "background-color 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease",
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* LOGO */}
            <motion.div
              variants={logoVariants}
              initial="hidden"
              animate={isLoaded ? "visible" : "hidden"}
            >
              <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))",
                    boxShadow: "0 4px 20px rgba(99, 102, 241, 0.35)",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 7H17M7 12H17M7 17H12"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <span className="text-lg font-semibold tracking-tight">
                  <span style={{ color: "var(--text-primary)" }}>Note</span>
                  <span style={{ color: "var(--accent-indigo)" }}>Stream</span>
                </span>
              </Link>
            </motion.div>

            {/* DESKTOP NAV */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  className="relative"
                  variants={navItemVariants}
                  initial="hidden"
                  animate={isLoaded ? "visible" : "hidden"}
                  custom={index}
                  onMouseEnter={() => handleDesktopHoverEnter(link.name)}
                  onMouseLeave={handleDesktopHoverLeave}
                >
                  {link.dropdown ? (
                    <>
                      <button
                        type="button"
                        className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200"
                        style={{
                          color:
                            desktopDropdown === link.name
                              ? "var(--text-primary)"
                              : "var(--text-secondary)",
                          backgroundColor:
                            desktopDropdown === link.name
                              ? "rgba(255, 255, 255, 0.1)"
                              : "transparent",
                        }}
                        aria-haspopup="menu"
                        aria-expanded={desktopDropdown === link.name}
                      >
                        {link.name}
                        <FiChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            desktopDropdown === link.name ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {desktopDropdown === link.name && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute left-0 top-full pt-2 z-[140]"
                            style={{ minWidth: "200px" }}
                          >
                            <div
                              className="rounded-2xl py-2 border overflow-hidden"
                              style={{
                                backgroundColor: "var(--bg-surface)",
                                borderColor: "var(--border-secondary)",
                                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
                              }}
                              role="menu"
                            >
                              {link.dropdown.map((item) => (
                                <Link
                                  key={item.label}
                                  to={item.to}
                                  className="block px-4 py-3 text-sm transition-all duration-150"
                                  style={{ color: "var(--text-secondary)" }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "var(--bg-hover)";
                                    e.currentTarget.style.color =
                                      "var(--accent-indigo)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "transparent";
                                    e.currentTarget.style.color =
                                      "var(--text-secondary)";
                                  }}
                                  role="menuitem"
                                >
                                  {item.label}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      to={link.to}
                      className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200"
                      style={{ color: "var(--text-secondary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255, 255, 255, 0.1)";
                        e.currentTarget.style.color = "var(--text-primary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      {link.name}
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>

            {/* RIGHT SIDE ACTIONS */}
            <motion.div
              variants={actionsVariants}
              initial="hidden"
              animate={isLoaded ? "visible" : "hidden"}
              className="flex items-center gap-2 sm:gap-3"
            >
              <div className="hidden lg:flex items-center gap-3">
                <Link
                  to="/signup"
                  className="px-5 py-2.5 rounded-full text-sm font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))",
                    boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
                  }}
                >
                  Start Free
                </Link>

                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border hover:bg-white/10"
                  style={{
                    color: "var(--text-primary)",
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    backgroundColor: "transparent",
                  }}
                >
                  Login
                </Link>

                <Link
                  to="/search"
                  className="p-2.5 rounded-full transition-all duration-200 hover:bg-white/10"
                  style={{ color: "var(--text-muted)" }}
                >
                  <FiSearch className="w-5 h-5" />
                </Link>
              </div>

              {/* Mobile hamburger */}
              <button
                ref={hamburgerBtnRef}
                type="button"
                onClick={() => setIsMobileOpen((v) => !v)}
                className="lg:hidden p-2.5 rounded-xl transition-all duration-200"
                style={{
                  color: "var(--text-primary)",
                  backgroundColor: isMobileOpen ? "rgba(255, 255, 255, 0.1)" : "transparent",
                }}
                aria-label={isMobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileOpen}
                aria-controls="mobile-nav-panel"
              >
                <span className="sr-only">
                  {isMobileOpen ? "Close menu" : "Open menu"}
                </span>
                {isMobileOpen ? (
                  <FiX className="h-6 w-6" />
                ) : (
                  <FiMenu className="h-6 w-6" />
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Only mount overlay/panel when needed */}
      <AnimatePresence>
        {shouldRenderMobile && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isMobileOpen ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[110] lg:hidden"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(4px)",
              }}
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Panel */}
            <motion.div
              id="mobile-nav-panel"
              ref={mobileMenuRef}
              initial={{ x: "100%" }}
              animate={{ x: isMobileOpen ? 0 : "100%" }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 z-[130] lg:hidden"
              style={{
                width: "min(320px, 85vw)",
                height: "100dvh",
                backgroundColor: "var(--bg-surface)",
                borderLeft: "1px solid var(--border-secondary)",
                boxShadow: "-10px 0 50px rgba(0, 0, 0, 0.4)",
              }}
              role="dialog"
              aria-modal="true"
            >
              {/* Header */}
              <div
                className="flex justify-between items-center px-5 h-16"
                style={{ borderBottom: "1px solid var(--border-secondary)" }}
              >
                <span
                  className="text-base font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Menu
                </span>

                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-xl transition-all duration-200 hover:bg-white/10"
                  style={{ color: "var(--text-muted)" }}
                  aria-label="Close menu"
                >
                  <span className="sr-only">Close menu</span>
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div
                className="px-4 py-4"
                style={{
                  overflowY: "auto",
                  height: "calc(100dvh - 64px)",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <div className="space-y-1">
                  {navLinks.map((link, index) => (
                    <motion.div 
                      key={link.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 + 0.1 }}
                    >
                      {link.dropdown ? (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleMobileDropdown(link.name)}
                            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200"
                            style={{
                              color: "var(--text-primary)",
                              backgroundColor:
                                mobileDropdown === link.name
                                  ? "var(--bg-hover)"
                                  : "transparent",
                            }}
                            aria-expanded={mobileDropdown === link.name}
                          >
                            <span className="text-[15px] font-medium">
                              {link.name}
                            </span>
                            <FiChevronDown
                              className={`w-5 h-5 transition-transform duration-200 ${
                                mobileDropdown === link.name ? "rotate-180" : ""
                              }`}
                              style={{ color: "var(--text-muted)" }}
                            />
                          </button>

                          <AnimatePresence>
                            {mobileDropdown === link.name && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="pl-4 py-1 space-y-0.5">
                                  {link.dropdown.map((item) => (
                                    <button
                                      key={item.label}
                                      type="button"
                                      onClick={() => handleMobileNavigate(item.to)}
                                      className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 hover:bg-white/5"
                                      style={{ color: "var(--text-secondary)" }}
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMobileNavigate(link.to)}
                          className="w-full text-left px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all duration-200 hover:bg-white/5"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {link.name}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div
                  className="my-5 h-px"
                  style={{ backgroundColor: "var(--border-secondary)" }}
                />

                <div className="space-y-3">
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    type="button"
                    onClick={() => handleMobileNavigate("/signup")}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))",
                      boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    Start Free
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    type="button"
                    onClick={() => handleMobileNavigate("/login")}
                    className="w-full py-3.5 rounded-xl text-sm font-medium transition-all duration-200 border active:scale-[0.98]"
                    style={{
                      color: "var(--text-primary)",
                      borderColor: "var(--border-secondary)",
                    }}
                  >
                    Login
                  </motion.button>

                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    type="button"
                    onClick={() => handleMobileNavigate("/search")}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]"
                    style={{
                      color: "var(--text-secondary)",
                      backgroundColor: "var(--bg-tertiary)",
                    }}
                  >
                    <FiSearch className="w-4 h-4" />
                    Search
                  </motion.button>
                </div>

                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 px-4"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))",
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M7 7H17M7 12H17M7 17H12"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        NoteStream
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Early Access
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}


