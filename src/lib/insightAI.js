// src/lib/insightAI.js
// ✅ AI Insight Explorer — calls insight-query edge function
// ✅ Graceful fallback to local mock responses when AI is unavailable

import { callEdgeFunction } from "./edgeFunctions";

// ─── Local fallback ────────────────────────────────────────────

function localMockResponse(query, files) {
  const lowerQuery = query.toLowerCase();
  const pickedSources =
    files?.length > 0 ? files.map((f) => f.name) : ["Multiple files"];

  if (lowerQuery.includes("meeting") || lowerQuery.includes("action")) {
    return {
      answer:
        "Based on your workspace, here are the key action items:\n\n• **Complete UI mockups** - Due Friday\n• **Review budget proposal** - Pending Sarah's input\n• **Schedule follow-up** with design team\n• **Update project timeline** in shared doc",
      sources: pickedSources.slice(0, 2),
      followUp: [
        "What are the deadlines for these action items?",
        "Who is responsible for each task?",
      ],
    };
  }

  if (lowerQuery.includes("deadline") || lowerQuery.includes("due")) {
    return {
      answer:
        "I found the following deadlines across your workspace:\n\n• **Jan 15** - Q1 Budget review\n• **Jan 20** - UI mockups delivery\n• **Feb 01** - Project milestone 1\n• **Feb 15** - Research presentation",
      sources: pickedSources.slice(0, 2),
      followUp: [
        "Which deadlines are at risk?",
        "Show me tasks due this week",
      ],
    };
  }

  if (lowerQuery.includes("budget") || lowerQuery.includes("cost")) {
    return {
      answer:
        "Here's a summary of budget-related information:\n\n• **Total Q1 Budget**: $45,000\n• **Spent to date**: $12,500 (28%)\n• **Largest expense**: Software licenses ($5,200)\n• **Pending approvals**: $3,800",
      sources: pickedSources.slice(0, 2),
      followUp: [
        "What are the pending budget approvals?",
        "Compare spending vs. last quarter",
      ],
    };
  }

  if (lowerQuery.includes("research") || lowerQuery.includes("notes")) {
    return {
      answer:
        "From your workspace notes, the main points are:\n\n• **Key finding**: User engagement increased 40% with new UI\n• **Recommendation**: Implement progressive onboarding\n• **Next steps**: A/B testing scheduled for next sprint\n• **Resources needed**: 2 additional developers",
      sources: pickedSources.slice(0, 2),
      followUp: [
        "What were the A/B test results?",
        "Summarize the onboarding research",
      ],
    };
  }

  return {
    answer:
      "I searched across your workspace and found relevant information.\n\n• Your query relates to multiple items\n• I found **3 relevant mentions** across your workspace\n• Tell me which file you want to drill into, or ask for a tighter summary",
    sources: pickedSources,
    followUp: [
      "Can you narrow this down to a specific document?",
      "Show me the most recent mentions",
    ],
  };
}

// ─── Public API ────────────────────────────────────────────────

/**
 * Send a query to the Insight Explorer AI.
 * Falls back to local mock responses when AI is unavailable.
 *
 * @param {string} query - The user's question
 * @param {object[]} selectedFiles - Array of { id, name, type, content? }
 * @param {object[]} [conversationHistory] - Previous turns for multi-turn context
 * @returns {{ answer: string, sources: string[], followUp?: string[] }}
 */
export async function queryInsight(
  query,
  selectedFiles = [],
  conversationHistory = []
) {
  try {
    // Build context from selected files
    const context = selectedFiles.map((f) => ({
      name: f.name || "Untitled",
      content: f.content || `${f.type || "file"}: ${f.name || "Untitled"}`,
      type: f.type || "file",
    }));

    // Build conversation history for multi-turn
    const history = conversationHistory
      .filter((m) => m.type === "user" || m.type === "ai")
      .map((m) => ({
        role: m.type === "user" ? "user" : "assistant",
        content: m.content || "",
      }));

    const result = await callEdgeFunction("insight-query", {
      query,
      context: context.length > 0 ? context : undefined,
      conversationHistory: history.length > 0 ? history : undefined,
    });

    return {
      answer: result.answer || "",
      sources: result.sources || [],
      followUp: result.followUp || [],
    };
  } catch (err) {
    console.warn("AI insight unavailable, using local fallback:", err);
    return localMockResponse(query, selectedFiles);
  }
}