import { Link } from "react-router-dom";
import { FiArrowRight, FiGithub, FiLinkedin } from "react-icons/fi";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  return (
    <footer 
      className="relative text-theme-muted pt-20 pb-12 px-10 lg:px-20"
      style={{ 
        backgroundColor: 'var(--bg-primary)', 
        borderTop: '1px solid var(--border-secondary)' 
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">

        {/* Newsletter */}
        <div className="lg:col-span-2">
          <h3 className="text-[1.6rem] font-semibold text-theme-primary mb-3">
            Stay Updated with <span className="text-indigo-500 font-bold">NoteStream</span>
          </h3>
          <p className="text-theme-muted mb-6 max-w-lg">
            Subscribe for product releases, new AI features, and exclusive early access programs.
          </p>

          <div 
            className="flex items-center rounded-full overflow-hidden w-full max-w-md shadow-[0_0_25px_rgba(99,102,241,0.1)] focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all border"
            style={{ 
              backgroundColor: 'var(--bg-input)', 
              borderColor: 'var(--border-secondary)' 
            }}
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-5 py-3.5 bg-transparent text-theme-primary text-[1rem] outline-none placeholder:text-theme-muted"
            />
            <button className="px-5 text-indigo-500 hover:text-indigo-400 transition-all">
              <FiArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Features */}
        <div>
          <h4 className="text-theme-primary font-semibold mb-3">Features</h4>
          <ul className="space-y-2">
            <li><Link to="/smart-notes" className="text-theme-muted hover:text-indigo-500 transition">Smart Notes</Link></li>
            <li><Link to="/ai-summary" className="text-theme-muted hover:text-indigo-500 transition">AI Summary</Link></li>
            <li><Link to="/integrations" className="text-theme-muted hover:text-indigo-500 transition">Integrations</Link></li>
            <li><Link to="/updates" className="text-theme-muted hover:text-indigo-500 transition">Product Updates</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-theme-primary font-semibold mb-3">Company</h4>
          <ul className="space-y-2">
            <li><Link to="/how-it-works" className="text-theme-muted hover:text-indigo-500 transition">How it Works</Link></li>
            <li><Link to="/support" className="text-theme-muted hover:text-indigo-500 transition">Support</Link></li>
            <li><Link to="/faq" className="text-theme-muted hover:text-indigo-500 transition">FAQ</Link></li>
            <li><Link to="/terms" className="text-theme-muted hover:text-indigo-500 transition">Terms & Privacy</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Row */}
      <div 
        className="max-w-7xl mx-auto mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between text-[0.95rem]"
        style={{ borderTop: '1px solid var(--border-secondary)' }}
      >
        <div className="text-theme-muted mb-5 sm:mb-0">
          © {new Date().getFullYear()} <span className="text-indigo-500 font-medium">NoteStream</span> — Built with AI precision
        </div>

        <div className="flex items-center gap-6 text-theme-muted">
          <a href="#" className="hover:text-indigo-500 transition">
            <FiGithub className="w-6 h-6" />
          </a>

          <a href="#" className="hover:text-indigo-500 transition">
            <FiLinkedin className="w-6 h-6" />
          </a>

          <a href="#" className="hover:text-indigo-500 transition">
            <FaInstagram className="w-6 h-6" />
          </a>

          <a href="#" className="hover:text-indigo-500 transition">
            <FaWhatsapp className="w-6 h-6" />
          </a>
        </div>
      </div>
    </footer>
  );
}
