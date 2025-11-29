// src/pages/AiLab.jsx
import GlassCard from "../components/GlassCard";
import { Crown } from "phosphor-react";

export default function AiLab() {
  const handleUpgrade = () => alert("Open upgrade / pricing flow");
  const handleDemo = (name) => alert(`Open AI Lab demo: ${name}`);

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          AI Lab (Pro)
          <Crown size={18} className="text-indigo-300" />
        </h1>
      </header>

      <GlassCard className="border-indigo-500/40">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-100 font-medium">
              Unlock experimental AI features.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Try multi-document reasoning, smart workflows, and early beta tools before anyone else.
            </p>
          </div>
          <button
            onClick={handleUpgrade}
            className="px-4 py-2 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-sm text-white"
          >
            Upgrade to Pro
          </button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Smart Meeting Recap", desc: "Turn meetings into action items & next steps." },
          { title: "Research Synthesizer", desc: "Merge multiple PDFs into one clean brief." },
          { title: "Insight Explorer", desc: "Ask questions across your entire workspace." },
        ].map((tool, i) => (
          <GlassCard key={i} className="bg-[#171724] border-[#333348]">
            <h3 className="text-sm font-semibold text-white mb-1">{tool.title}</h3>
            <p className="text-xs text-gray-400 mb-3">{tool.desc}</p>
            <button
              onClick={() => handleDemo(tool.title)}
              className="text-xs px-3 py-1 rounded-full bg-indigo-600/80 hover:bg-indigo-500 text-white"
            >
              Try Demo
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
