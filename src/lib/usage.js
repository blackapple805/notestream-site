// ✅ Put this file here:
// src/lib/usage.js
// (Same folder where you already keep supabaseClient, e.g. src/lib/supabaseClient.js)

import { supabase } from "./supabaseClient";

/**
 * Consume (and enforce) daily AI usage in DB via increment_usage RPC.
 * usageType must be one of:
 * - "ai_summaries"
 * - "document_synth"
 * - "insight_queries"
 * - "voice_transcriptions"
 */
export async function consumeAiUsage(userId, usageType, amount = 1) {
  if (!supabase || !userId || !usageType) {
    return { success: false, newCount: 0, limitReached: false };
  }

  const { data, error } = await supabase.rpc("increment_usage", {
    p_user_id: userId,
    p_usage_type: usageType,
    p_amount: amount,
  });

  if (error) {
    console.error("increment_usage error:", error);
    return { success: false, newCount: 0, limitReached: false };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const result = {
    success: !!row?.success,
    newCount: Number(row?.new_count ?? 0),
    limitReached: !!row?.limit_reached,
  };

  // Optional: let Dashboard/other pages refetch today's daily_usage
  window.dispatchEvent(
    new CustomEvent("notestream:daily_usage_changed", {
      detail: { userId, usageType, newCount: result.newCount },
    })
  );

  return result;
}
