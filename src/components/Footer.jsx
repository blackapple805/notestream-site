import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { FiArrowRight, FiGithub, FiLinkedin, FiCheck } from "react-icons/fi";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  const socials = {
    github: "https://github.com/blackapple805",
    linkedin: "https://www.linkedin.com/in/eric-del-angel/",
    instagram: "https://instagram.com/quest.on.a.dream",
    whatsapp: "https://wa.me/18056768875",
  };

  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  const isValidEmail = useMemo(() => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const onSubscribe = (e) => {
    e.preventDefault();
    if (!isValidEmail) return;

    // MOCK: "save" locally for now
    setSaved(true);

    // Optional: clear input after save
    // setEmail("");

    // Auto-hide success after a moment
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <footer
      className="relative text-theme-muted pt-20 pb-12 px-10 lg:px-20"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderTop: "1px solid var(--border-secondary)",
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
        {/* Newsletter */}
        <div className="lg:col-span-2">
          <h3 className="text-[1.6rem] font-semibold text-theme-primary mb-3">
            Stay Updated with{" "}
            <span className="text-indigo-500 font-bold">NoteStream</span>
          </h3>
          <p className="text-theme-muted mb-6 max-w-lg">
            Subscribe for product releases, new AI features, and exclusive early
            access programs.
          </p>

          <form onSubmit={onSubscribe} className="w-full max-w-md">
            <div
              className="flex items-center rounded-full overflow-hidden shadow-[0_0_25px_rgba(99,102,241,0.1)] focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all border"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: saved
                  ? "rgba(16, 185, 129, 0.35)"
                  : "var(--border-secondary)",
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-5 py-3.5 bg-transparent text-theme-primary text-[1rem] outline-none placeholder:text-theme-muted"
                autoComplete="email"
                inputMode="email"
                aria-label="Email address"
              />

              <button
                className="px-5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                aria-label="Subscribe"
                disabled={!isValidEmail || saved}
                style={{
                  color: saved ? "var(--accent-emerald)" : "var(--accent-indigo)",
                }}
              >
                {saved ? (
                  <FiCheck className="w-5 h-5" />
                ) : (
                  <FiArrowRight className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Mock success / validation text */}
            <div className="mt-2 min-h-[20px]">
              {saved ? (
                <p
                  className="text-xs font-medium"
                  style={{ color: "var(--accent-emerald)" }}
                >
                  Saved — you’re on the list.
                </p>
              ) : email && !isValidEmail ? (
                <p
                  className="text-xs font-medium"
                  style={{ color: "var(--accent-rose)" }}
                >
                  Please enter a valid email.
                </p>
              ) : (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  No spam. Unsubscribe anytime.
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Features */}
        <div>
          <h4 className="text-theme-primary font-semibold mb-3">Features</h4>
          <ul className="space-y-2">
            <li>
              <Link
                to="/smart-notes"
                className="text-theme-muted hover:text-indigo-500 transition"
              >
                Smart Notes
              </Link>
            </li>
            <li>
              <Link
                to="/ai-summary"
                className="text-theme-muted hover:text-indigo-500 transition"
              >
                AI Summary
              </Link>
            </li>
            <li>
              <Link
                to="/integrations"
                className="text-theme-muted hover:text-indigo-500 transition"
              >
                Integrations
              </Link>
            </li>
            <li>
              <Link
                to="/updates"
                className="text-theme-muted hover:text-indigo-500 transition"
              >
                Product Updates
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-theme-primary font-semibold mb-3">Company</h4>
          <ul className="space-y-2">
            <li>
              <Link
                to="/how-it-works"
                className="text-theme-muted hover:text-indigo-500 transition"
              >
                How it Works
              </Link>
            </li>
            <li>
              <Link
                to="/support"
                className="text-theme-muted hover:text-indigo-500 transition"
              >
                Support
              </Link>
            </li>
            <li>
              <Link
                to="/faq"
                className="text-theme-muted hover:text-indigo-500 transition"
              >
                FAQ
              </Link>
            </li>
            <li>
              <Link
                to="/terms"
                className="text-theme-muted hover:text-indigo-500 transition"
              >
                Terms & Privacy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Row */}
      <div
        className="max-w-7xl mx-auto mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between text-[0.95rem]"
        style={{ borderTop: "1px solid var(--border-secondary)" }}
      >
        <div className="text-theme-muted mb-5 sm:mb-0">
          © {new Date().getFullYear()}{" "}
          <span className="text-indigo-500 font-medium">NoteStream</span> — Built
          with AI precision
        </div>

        <div className="flex items-center gap-6 text-theme-muted">
          <a
            href={socials.github}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-indigo-500 transition"
            aria-label="GitHub"
          >
            <FiGithub className="w-6 h-6" />
          </a>

          <a
            href={socials.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-indigo-500 transition"
            aria-label="LinkedIn"
          >
            <FiLinkedin className="w-6 h-6" />
          </a>

          <a
            href={socials.instagram}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-indigo-500 transition"
            aria-label="Instagram"
          >
            <FaInstagram className="w-6 h-6" />
          </a>

          <a
            href={socials.whatsapp}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-indigo-500 transition"
            aria-label="WhatsApp"
          >
            <FaWhatsapp className="w-6 h-6" />
          </a>
        </div>
      </div>
    </footer>
  );
}

