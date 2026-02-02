// src/pages/RewriteDocument.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useState, useCallback } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { consumeAiUsage } from "../lib/usage";

const EVENTS_TABLE = "activity_events";

export default function RewriteDocument({ docs = [] }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const supabaseReady =
    typeof isSupabaseConfigured === "function"
      ? isSupabaseConfigured()
      : !!isSupabaseConfigured;

  const doc = useMemo(() => docs.find((d) => d.id === id) || null, [docs, id]);

  const [output, setOutput] = useState("");
  const [mode, setMode] = useState(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState(null);

  const getAuthedUser = useCallback(async () => {
    if (!supabaseReady || !supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data?.user ?? null;
  }, [supabaseReady]);

  const logActivity = useCallback(
    async (userId, metadata = {}) => {
      if (!supabaseReady || !supabase || !userId) return;
      try {
        await supabase.from(EVENTS_TABLE).insert({
          user_id: userId,
          event_type: "ai_used",
          entity_id: doc?.id || null,
          metadata,
          title: "Rewrite document",
        });
      } catch {
        // silent
      }
    },
    [supabaseReady, doc?.id]
  );

  const handleRewrite = async (nextMode) => {
    if (!doc) return;

    setError(null);
    setMode(nextMode);
    setIsRewriting(true);
    setOutput("");

    try {
      // ✅ Consume BEFORE request (prevents bypass)
      // If your lib/usage expects snake_case keys for the DB RPC:
      await consumeAiUsage("insight_queries");

      // Replace this mock with your real AI call later
      await new Promise((r) => setTimeout(r, 900));

      const rewrites = {
        professional: `Professional rewrite of ${doc.name}`,
        shorter: `Short concise rewrite of ${doc.name}`,
        friendly: `Friendly tone rewrite of ${doc.name}`,
      };

      setOutput(rewrites[nextMode] || "Rewritten content will appear here.");

      const user = await getAuthedUser();
      if (user?.id) {
        await logActivity(user.id, {
          feature: "rewrite_document",
          mode: nextMode,
          doc_id: doc.id,
          doc_name: doc.name,
        });
      }
    } catch (e) {
      // If consumeAiUsage throws on limit reached, show a clean message
      const msg = String(e?.message || "");
      if (msg.toLowerCase().includes("limit")) {
        setError("Daily limit reached for AI actions. Upgrade your plan or try again tomorrow.");
      } else {
        setError("Rewrite failed. Please try again.");
      }
    } finally {
      setIsRewriting(false);
    }
  };

  if (!doc) {
    return (
      <div className="min-h-full w-full py-12 px-5 text-theme-primary animate-fadeIn">
        <div className="flex items-center mb-6">
          <button className="text-theme-muted active:scale-90" onClick={() => navigate(-1)}>
            <FiArrowLeft size={22} />
          </button>
        </div>

        <h1 className="text-xl font-semibold mb-2">Rewrite with AI</h1>
        <p className="text-theme-muted text-sm mb-6">Document not found.</p>

        <button
          onClick={() => navigate("/dashboard/documents")}
          className="px-4 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-700"
        >
          Back to Documents
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full py-12 px-5 text-theme-primary animate-fadeIn">
      <div className="flex items-center mb-6">
        <button className="text-theme-muted active:scale-90" onClick={() => navigate(-1)}>
          <FiArrowLeft size={22} />
        </button>
      </div>

      <h1 className="text-xl font-semibold mb-2">Rewrite with AI — {doc.name}</h1>

      <p className="text-theme-muted text-sm mb-6">Choose a rewrite style below</p>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => handleRewrite("professional")}
          disabled={isRewriting}
          className={`px-4 py-2 rounded-xl transition ${
            mode === "professional" ? "bg-indigo-600" : "bg-indigo-600"
          } hover:bg-indigo-700 disabled:opacity-60`}
        >
          Professional
        </button>
        <button
          onClick={() => handleRewrite("shorter")}
          disabled={isRewriting}
          className="px-4 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60"
        >
          Shorter
        </button>
        <button
          onClick={() => handleRewrite("friendly")}
          disabled={isRewriting}
          className="px-4 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-60"
        >
          Friendly
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm rounded-xl border px-4 py-3"
             style={{ backgroundColor: "rgba(244,63,94,0.08)", borderColor: "rgba(244,63,94,0.25)" }}>
          {error}
        </div>
      )}

      <div className="bg-[#1b1b22] border border-[var(--border-secondary)]/20 p-6 rounded-xl min-h-[30vh]">
        {isRewriting ? (
          <p className="text-theme-muted text-sm">Generating rewrite…</p>
        ) : output ? (
          <p className="text-theme-primary whitespace-pre-wrap">{output}</p>
        ) : (
          <p className="text-theme-muted text-sm">Select a style to generate rewritten text</p>
        )}
      </div>
    </div>
  );
}
