// src/pages/Support.jsx
import { motion } from "framer-motion";
import { FiMail, FiMessageCircle, FiBook, FiServer, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

export default function Support() {
  const categories = [
    {
      icon: <FiMessageCircle className="w-6 h-6 text-indigo-400" />,
      title: "Getting Started",
      desc: "Learn everything you need to begin using NoteStream effectively.",
      link: "#",
    },
    {
      icon: <FiBook className="w-6 h-6 text-indigo-400" />,
      title: "Documentation",
      desc: "Deep-dive guides covering features, workflows, and best practices.",
      link: "#",
    },
    {
      icon: <FiMail className="w-6 h-6 text-indigo-400" />,
      title: "Contact Support",
      desc: "Need personal help? Our support team is ready to assist you.",
      link: "#",
    },
  ];

  const status = {
    healthy: true,
    message: "All systems operational",
  };

  return (
    <section className="min-h-screen bg-[#0d0d10] text-white px-6 py-24 relative">
      {/* Background glows */}
      <div className="absolute top-[15%] left-[5%] w-[240px] h-[240px] bg-indigo-600/20 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[10%] right-[5%] w-[200px] h-[200px] bg-purple-600/15 blur-[130px] rounded-full"></div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-extrabold mb-6"
        >
          We're Here to Help
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg max-w-2xl mx-auto mb-12"
        >
          Whether you're just getting started or need advanced support, our team is here
          to help you make the most of NoteStream.
        </motion.p>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-lg mx-auto mb-16"
        >
          <input
            type="text"
            placeholder="Search for help topics..."
            className="w-full bg-[#141418] border border-[#1f1f25] text-gray-300 px-5 py-4 rounded-xl outline-none shadow-[0_0_20px_rgba(99,102,241,0.15)] focus:border-indigo-500 transition"
          />
        </motion.div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
          {categories.map((c, idx) => (
            <motion.a
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              href={c.link}
              className="group bg-[#111114]/80 p-8 rounded-2xl border border-[#1f1f25] backdrop-blur-md hover:-translate-y-2 hover:border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.1)] hover:shadow-[0_0_45px_rgba(99,102,241,0.25)] transition-all duration-500"
            >
              <div className="flex items-center justify-center w-14 h-14 bg-[#1b1b25] rounded-xl mb-5 group-hover:bg-indigo-500/20 transition">
                {c.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 group-hover:text-indigo-400 transition">
                {c.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">{c.desc}</p>
            </motion.a>
          ))}
        </div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#111114]/70 border border-[#1f1f25] rounded-2xl p-8 backdrop-blur-md max-w-lg mx-auto shadow-[0_0_25px_rgba(99,102,241,0.1)]"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            {status.healthy ? (
              <FiCheckCircle className="text-green-400 w-6 h-6" />
            ) : (
              <FiAlertTriangle className="text-red-400 w-6 h-6" />
            )}

            <span className="text-lg font-semibold text-white">
              {status.healthy ? "All Systems Operational" : "Service Interruptions Detected"}
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            No issues reported with NoteStream API, Sync, or Dashboard.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
