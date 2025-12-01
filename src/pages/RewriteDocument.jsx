// src/pages/RewriteDocument.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";

export default function RewriteDocument({ docs }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const doc = docs.find((d) => d.id === id);
  const [output, setOutput] = useState("");

  const handleRewrite = (mode) => {
    const rewrites = {
      professional: "Professional rewrite of " + doc.name,
      shorter: "Short concise rewrite of " + doc.name,
      friendly: "Friendly tone rewrite of " + doc.name,
    };
    setOutput(rewrites[mode]);
  };

  return (
    <div className="min-h-full w-full py-12 px-5 text-theme-primary animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center mb-6">
        <button
          className="text-theme-muted active:scale-90"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft size={22} />
        </button>
      </div>

      <h1 className="text-xl font-semibold mb-2">
        Rewrite with AI — {doc.name}
      </h1>

      <p className="text-theme-muted text-sm mb-6">
        Choose a rewrite style below
      </p>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => handleRewrite("professional")}
          className="px-4 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-700"
        >
          Professional
        </button>
        <button
          onClick={() => handleRewrite("shorter")}
          className="px-4 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-700"
        >
          Shorter
        </button>
        <button
          onClick={() => handleRewrite("friendly")}
          className="px-4 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-700"
        >
          Friendly
        </button>
      </div>

      <div className="bg-[#1b1b22] border border-[var(--border-secondary)]/20 p-6 rounded-xl min-h-[30vh]">
        {output || (
          <p className="text-theme-muted text-sm">
            Select a style to generate rewritten text
          </p>
        )}
      </div>
    </div>
  );
}