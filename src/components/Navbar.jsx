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
  const [suppressMainLogo, setSuppressMainLogo] = useState(false);

  const hoverCloseTimeout = useRef(null);
  const mobileMenuRef = useRef(null);

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
        setSuppressMainLogo(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isMobileOpen]);

  /* Lock scroll when menu open */
  useEffect(() => {
    if (isMobileOpen) {
      const y = window.scrollY;
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.position = "fixed";
      document.documentElement.style.top = `-${y}px`;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${y}px`;
      document.body.style.touchAction = "none";
      return () => {
        document.documentElement.style = "";
        document.body.style = "";
        window.scrollTo(0, y);
      };
    }
  }, [isMobileOpen]);

  /* Close on route change */
  useEffect(() => {
    setIsMobileOpen(false);
    setMobileDropdown(null);
    setSuppressMainLogo(false);
  }, [location.pathname]);

  /* Outside click to close */
  useEffect(() => {
    const handler = (e) => {
      if (!isMobileOpen) return;
      const menu = mobileMenuRef.current;
      const btn = document.querySelector("[data-hamburger-button]");
      if (!menu?.contains(e.target) && !btn?.contains(e.target)) {
        setIsMobileOpen(false);
        setMobileDropdown(null);
        setSuppressMainLogo(false);
      }
    };
    if (isMobileOpen) {
      setTimeout(() => {
        document.addEventListener("mousedown", handler);
        document.addEventListener("touchstart", handler);
      }, 120);
    }
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [isMobileOpen]);

  const handleHamburgerClick = () => {
    setIsMobileOpen((prev) => !prev);
    setSuppressMainLogo((prev) => !prev);
  };

  const handleMobileNavigate = (to) => {
    setIsMobileOpen(false);
    setMobileDropdown(null);
    setSuppressMainLogo(false);
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
    hoverCloseTimeout.current = setTimeout(
      () => setDesktopDropdown(null),
      200
    );
  };

  return (
    <>
      {/* TOP NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[120] transition-all duration-300 ${
          isScrolled
            ? "backdrop-blur-xl bg-[#0d0d10]/90 border-b border-gray-800 shadow-lg"
            : "bg-[#0d0d10]"
        }`}
      >
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24">
          <div className="flex items-center justify-between h-20">

            {/* DESKTOP LOGO */}
            {!suppressMainLogo && (
              <Link to="/" className="flex items-center gap-2 sm:gap-3">
                <img
                  src="/assets/icons/logo-header-32x32.png"
                  alt="NoteStream"
                  className="h-7 w-7 sm:h-8 sm:w-8 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                />
                <span className="text-lg sm:text-xl font-semibold tracking-wide">
                  <span className="text-white">Note</span>
                  <span className="text-indigo-400">Stream</span>
                </span>
              </Link>
            )}

            {/* DESKTOP NAV */}
            <div className="hidden md:flex items-center space-x-10">
              {navLinks.map((link) => (
                <div
                  key={link.name}
                  className="relative"
                  onMouseEnter={() => handleDesktopHoverEnter(link.name)}
                  onMouseLeave={handleDesktopHoverLeave}
                >
                  {link.dropdown ? (
                    <>
                      <button className="flex items-center text-gray-300 hover:text-indigo-400 px-4 py-2 rounded-full hover:bg-[#1a1a1f] transition-all">
                        {link.name}
                        <FiChevronDown
                          className={`ml-1 w-4 h-4 transition-transform ${
                            desktopDropdown === link.name ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {desktopDropdown === link.name && (
                        <div className="absolute left-0 top-full mt-2 bg-[#121216] border border-gray-800 rounded-xl shadow-xl py-2 w-48 animate-fadeIn z-[140]">
                          {link.dropdown.map((item) => (
                            <Link
                              key={item.label}
                              to={item.to}
                              className="block px-4 py-2 text-gray-300 hover:text-indigo-400 hover:bg-[#1a1a1f] transition"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={link.to}
                      className="text-gray-300 hover:text-indigo-400 px-4 py-2 rounded-full hover:bg-[#1a1a1f] transition-all"
                    >
                      {link.name}
                    </Link>
                  )}
                </div>
              ))}

              <Link
                to="/signup"
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-full transition"
              >
                Start Free
              </Link>

              <Link
                to="/login"
                className="border border-gray-700 hover:border-indigo-400 text-gray-300 hover:text-indigo-400 px-6 py-2 rounded-full transition"
              >
                Login
              </Link>

              <Link
                to="/search"
                className="text-gray-400 hover:text-indigo-400 p-2"
              >
                <FiSearch className="w-5 h-5" />
              </Link>
            </div>

            {/* MOBILE HAMBURGER (ANIMATED) */}
            <button
              onClick={handleHamburgerClick}
              data-hamburger-button
              className="md:hidden text-gray-300 hover:text-indigo-400 p-2"
            >
              {isMobileOpen ? (
                <FiX className="h-6 w-6 ns-hamburger ns-hamburger-rotate" />
              ) : (
                <FiMenu className="h-6 w-6 ns-hamburger" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobileOpen && (
        <div
          ref={mobileMenuRef}
          className="
            fixed top-0 left-0 right-0 h-screen z-[200] md:hidden
            bg-gradient-to-b from-[#12001f] via-[#0b0016] to-[#05000c]
            backdrop-blur-xl
            animate-ns-slideDown
            shadow-[inset_0_0_60px_rgba(0,0,0,0.45)]
          "
        >
          {/* Mobile Header */}
          <div className="flex justify-between items-center px-4 h-20 border-b border-white/10">
            <div className="flex items-center gap-2 ns-menu-item">
              <img
                src="/assets/icons/logo-header-32x32.png"
                alt="NoteStream Logo"
                className="h-7 w-7 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]"
              />
              <span className="text-lg font-semibold tracking-wide text-white">
                Note<span className="text-indigo-400">Stream</span>
              </span>
            </div>

            <button
              onClick={() => {
                setIsMobileOpen(false);
                setSuppressMainLogo(false);
              }}
              className="p-2 text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition ns-menu-item"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          {/* Menu content */}
          <div className="overflow-y-auto h-[calc(100vh-5rem)] px-4 pt-3 pb-16">
            <div className="space-y-2">
              {navLinks.map((link, index) => (
                <div key={link.name} className="ns-menu-item">
                  {link.dropdown ? (
                    <>
                      <button
                        onClick={() => toggleMobileDropdown(link.name)}
                        className="w-full flex items-center justify-between text-white px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all"
                      >
                        <span className="text-[16px] font-medium">
                          {link.name}
                        </span>
                        <FiChevronDown
                          className={`w-5 h-5 transition-transform ${
                            mobileDropdown === link.name ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <div
                        className={`overflow-hidden transition-[max-height] duration-300 ${
                          mobileDropdown === link.name ? "max-h-64" : "max-h-0"
                        }`}
                      >
                        <div className="pl-5 pr-1 py-1 space-y-1">
                          {link.dropdown.map((item) => (
                            <button
                              key={item.label}
                              onClick={() => handleMobileNavigate(item.to)}
                              className="w-full text-left text-white/80 px-4 py-2 rounded-lg hover:bg-white/10 transition-all ns-menu-item"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => handleMobileNavigate(link.to)}
                      className="w-full text-left text-white px-4 py-2.5 rounded-xl hover:bg-white/10 transition ns-menu-item"
                    >
                      {link.name}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="my-4 mx-3 h-px bg-white/10 ns-menu-item" />

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => handleMobileNavigate("/signup")}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl transition-all font-semibold ns-menu-item"
              >
                Start Free
              </button>

              <button
                onClick={() => handleMobileNavigate("/login")}
                className="w-full border border-white/20 text-white/90 hover:border-white/40 px-6 py-3 rounded-xl transition-all ns-menu-item"
              >
                Login
              </button>

              <button
                onClick={() => handleMobileNavigate("/search")}
                className="w-full flex items-center justify-center gap-3 text-white/90 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl transition ns-menu-item"
              >
                <FiSearch className="w-5 h-5" />
                <span className="font-medium">Search</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
