// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { FiMenu, FiX, FiSearch, FiChevronDown } from "react-icons/fi";

const navLinks = [
  {
    name: "Features",
    dropdown: [
      { label: "Smart Notes", to: "/smart-notes" },
      { label: "AI Summary", to: "/ai-summary" },
      { label: "Integrations", to: "/integrations" },
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

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [desktopDropdown, setDesktopDropdown] = useState(null);
  const [mobileDropdown, setMobileDropdown] = useState(null);

  const hoverCloseTimeout = useRef(null);
  const mobileMenuRef = useRef(null);
  const hamburgerBtnRef = useRef(null);

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

  /* Outside click/tap to close */
  useEffect(() => {
    const handler = (e) => {
      if (!isMobileOpen) return;
      const menu = mobileMenuRef.current;
      const btn = hamburgerBtnRef.current;
      if (!menu?.contains(e.target) && !btn?.contains(e.target)) {
        setIsMobileOpen(false);
        setMobileDropdown(null);
      }
    };

    if (isMobileOpen) {
      // small delay prevents immediate close from the click that opened it
      const t = setTimeout(() => {
        document.addEventListener("mousedown", handler);
        document.addEventListener("touchstart", handler, { passive: true });
      }, 120);

      return () => {
        clearTimeout(t);
        document.removeEventListener("mousedown", handler);
        document.removeEventListener("touchstart", handler);
      };
    }

    return () => {
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

  return (
    <>
      {/* TOP NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[120] transition-all duration-300 ${
          isScrolled ? "scrolled" : ""
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* LOGO - Always visible */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent-indigo), var(--accent-purple))",
                  boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
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

            {/* DESKTOP NAV - Only show at lg (1024px) and above */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div
                  key={link.name}
                  className="relative"
                  onMouseEnter={() => handleDesktopHoverEnter(link.name)}
                  onMouseLeave={handleDesktopHoverLeave}
                >
                  {link.dropdown ? (
                    <>
                      <button
                        type="button"
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200"
                        style={{
                          color:
                            desktopDropdown === link.name
                              ? "var(--accent-indigo)"
                              : "var(--text-secondary)",
                          backgroundColor:
                            desktopDropdown === link.name
                              ? "rgba(99, 102, 241, 0.1)"
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

                      {/* Dropdown Menu */}
                      {desktopDropdown === link.name && (
                        <div
                          className="absolute left-0 top-full pt-2 z-[140]"
                          style={{ minWidth: "180px" }}
                        >
                          <div
                            className="rounded-xl shadow-xl py-1.5 border animate-fadeIn"
                            style={{
                              backgroundColor: "var(--bg-surface)",
                              borderColor: "var(--border-secondary)",
                              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
                            }}
                            role="menu"
                          >
                            {link.dropdown.map((item) => (
                              <Link
                                key={item.label}
                                to={item.to}
                                className="block px-4 py-2.5 text-sm transition-all duration-150"
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
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={link.to}
                      className="px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200"
                      style={{ color: "var(--text-secondary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(99, 102, 241, 0.1)";
                        e.currentTarget.style.color = "var(--accent-indigo)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      {link.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* RIGHT SIDE ACTIONS */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop-only buttons */}
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  to="/signup"
                  className="px-5 py-2 rounded-full text-sm font-medium text-white transition-all duration-200"
                  style={{
                    backgroundColor: "var(--accent-indigo)",
                    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#4f46e5";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(99, 102, 241, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--accent-indigo)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(99, 102, 241, 0.3)";
                  }}
                >
                  Start Free
                </Link>

                <Link
                  to="/login"
                  className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border"
                  style={{
                    color: "var(--text-primary)",
                    borderColor: "var(--border-secondary)",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-indigo)";
                    e.currentTarget.style.color = "var(--accent-indigo)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-secondary)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                >
                  Login
                </Link>

                <Link
                  to="/search"
                  className="p-2 rounded-lg transition-all duration-200"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                    e.currentTarget.style.color = "var(--accent-indigo)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  <FiSearch className="w-5 h-5" />
                </Link>
              </div>

              {/* Mobile hamburger - Show below lg */}
              <button
                ref={hamburgerBtnRef}
                type="button"
                onClick={() => setIsMobileOpen((v) => !v)}
                className="lg:hidden p-2 rounded-lg transition-all duration-200"
                style={{
                  color: "var(--text-secondary)",
                  backgroundColor: isMobileOpen ? "var(--bg-hover)" : "transparent",
                }}
                aria-label={isMobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileOpen}
                aria-controls="mobile-nav-panel"
              >
                {/* IMPORTANT: hide any visible "Menu" label on mobile */}
                <span className="sr-only">
                  {isMobileOpen ? "Close menu" : "Open menu"}
                </span>

                {isMobileOpen ? (
                  <FiX className="h-6 w-6" />
                ) : (
                  <FiMenu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[110] lg:hidden"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* MOBILE MENU PANEL */}
      <div
        id="mobile-nav-panel"
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 h-full w-[min(320px,85vw)] z-[130] lg:hidden transform transition-transform duration-300 ease-out ${
          isMobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          backgroundColor: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-secondary)",
          boxShadow: "-10px 0 40px rgba(0, 0, 0, 0.3)",
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Header */}
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
            className="p-2 rounded-lg transition-all duration-200"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close menu"
          >
            <span className="sr-only">Close menu</span>
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Menu content */}
        <div className="overflow-y-auto h-[calc(100%-64px)] px-4 py-4">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <div key={link.name}>
                {link.dropdown ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleMobileDropdown(link.name)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200"
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

                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        mobileDropdown === link.name
                          ? "max-h-48 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="pl-4 py-1 space-y-0.5">
                        {link.dropdown.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => handleMobileNavigate(item.to)}
                            className="w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleMobileNavigate(link.to)}
                    className="w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium transition-all duration-200"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {link.name}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div
            className="my-4 h-px"
            style={{ backgroundColor: "var(--border-secondary)" }}
          />

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => handleMobileNavigate("/signup")}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
              style={{
                backgroundColor: "var(--accent-indigo)",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
              }}
            >
              Start Free
            </button>

            <button
              type="button"
              onClick={() => handleMobileNavigate("/login")}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 border"
              style={{
                color: "var(--text-primary)",
                borderColor: "var(--border-secondary)",
              }}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => handleMobileNavigate("/search")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                color: "var(--text-secondary)",
                backgroundColor: "var(--bg-tertiary)",
              }}
            >
              <FiSearch className="w-4 h-4" />
              Search
            </button>
          </div>

          {/* App info at bottom */}
          <div className="mt-8 px-4">
            <div className="flex items-center gap-2.5">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
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
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;

