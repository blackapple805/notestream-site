// src/utils/smartSummary.js

export function generateSmartSummary(doc) {
  const baseTitle = doc.name.replace(/\.[^/.]+$/, "");

  return {
    beforeNote: [
      "Client unhappy with current delivery timeline.",
      "Marketing assets still missing.",
      "Backend bug not yet resolved.",
      "Pending analytics update from Sarah.",
      "Possible delay in contract renewal if issues persist."
    ],

    summaryText: `“${baseTitle}” outlines key blockers, timeline pressure, and 
cross-team dependencies that require immediate coordination.`,

    keyInsights: [
      "Timeline risk based on current expectations.",
      "Marketing support required immediately for launch readiness.",
      "Engineering blockers need escalation and clearer ownership.",
      "Follow-through on analytics is required for client reporting."
    ],

    actionPlan: [
      {
        priority: "High",
        title: "Escalate backend bug resolution",
        ownerHint: "Engineering Lead",
        effort: "2–6h",
        urgencyLevel: "Critical",
        dueHint: "Today"
      },
      {
        priority: "High",
        title: "Deliver marketing asset package",
        ownerHint: "Marketing / Creative",
        effort: "1–2 days",
        dueHint: "This week"
      },
      {
        priority: "Medium",
        title: "Check status: Analytics dashboard update",
        ownerHint: "Sarah (Data Product)",
        effort: "1h",
        dueHint: "2–3 days"
      }
    ],

    highlightTakeaway:
      "Project health at risk — rapid alignment needed to prevent renewal impact.",

    sentiment: {
      confidence: "Moderate",
      tone: "Concerned but actionable",
      urgency: "High"
    },

    risks: [
      "Delay may weaken client confidence and relationship strength.",
      "Failure to deliver assets will block launch activities.",
      "Escalation pathways unclear — may stall progress further."
    ],

    meta: {
      generatedAt: new Date().toISOString(),
      sourceDocId: doc.id,
      engineVersion: "NoteStream-AI v0.4",
      comprehensionScore: 0.92
    }
  };
}
