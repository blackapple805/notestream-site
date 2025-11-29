import { Link } from "react-router-dom";
import { FiArrowRight, FiGithub, FiLinkedin } from "react-icons/fi";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="relative bg-[#0d0d10] border-t border-[#1f1f25] text-gray-400 pt-20 pb-12 px-10 lg:px-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">

        {/* Newsletter */}
        <div className="lg:col-span-2">
          <h3 className="text-[1.6rem] font-semibold text-white mb-3">
            Stay Updated with <span className="text-indigo-400 font-bold">NoteStream</span>
          </h3>
          <p className="text-gray-400 mb-6 max-w-lg">
            Subscribe for product releases, new AI features, and exclusive early access programs.
          </p>

          <div className="flex items-center bg-[#111114] border border-[#1f1f25] rounded-full overflow-hidden w-full max-w-md shadow-[0_0_25px_rgba(99,102,241,0.15)] focus-within:border-indigo-500 transition-all">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-5 py-3.5 bg-transparent text-gray-200 text-[1rem] outline-none"
            />
            <button className="px-5 text-indigo-400 hover:text-indigo-300 transition-all">
              <FiArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Features */}
        <div>
          <h4 className="text-white font-semibold mb-3">Features</h4>
          <ul className="space-y-2">
            <li><Link to="/smart-notes" className="hover:text-indigo-400 transition">Smart Notes</Link></li>
            <li><Link to="/ai-summary" className="hover:text-indigo-400 transition">AI Summary</Link></li>
            <li><Link to="/integrations" className="hover:text-indigo-400 transition">Integrations</Link></li>
            <li><Link to="/updates" className="hover:text-indigo-400 transition">Product Updates</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-white font-semibold mb-3">Company</h4>
          <ul className="space-y-2">
            <li><Link to="/how-it-works" className="hover:text-indigo-400 transition">How it Works</Link></li>
            <li><Link to="/support" className="hover:text-indigo-400 transition">Support</Link></li>
            <li><Link to="/faq" className="hover:text-indigo-400 transition">FAQ</Link></li>
            <li><Link to="/terms" className="hover:text-indigo-400 transition">Terms & Privacy</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="max-w-7xl mx-auto mt-16 border-t border-[#1f1f25] pt-8 flex flex-col sm:flex-row items-center justify-between text-[0.95rem]">
        <div className="text-gray-500 mb-5 sm:mb-0">
          © {new Date().getFullYear()} <span className="text-indigo-400 font-medium">NoteStream</span> — Built with AI precision
        </div>

        <div className="flex items-center gap-6 text-gray-400">

          <a href="#" className="hover:text-indigo-400 transition">
            <FiGithub className="w-6 h-6" />
          </a>

          <a href="#" className="hover:text-indigo-400 transition">
            <FiLinkedin className="w-6 h-6" />
          </a>

          {/* NEW ICONS */}
          <a href="#" className="hover:text-indigo-400 transition">
            <FaInstagram className="w-6 h-6" />
          </a>

          <a href="#" className="hover:text-indigo-400 transition">
            <FaWhatsapp className="w-6 h-6" />
          </a>

        </div>
      </div>
    </footer>
  );
}
