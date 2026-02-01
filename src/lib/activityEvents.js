// src/lib/activityEvents.js
import { supabase } from "../lib/supabaseClient";

export async function logActivityEvent({
  userId,
  eventType,
  entityId = null,
  metadata = {},
  title = null,
}) {
  if (!userId) return { success: false, error: "Missing userId" };

  // safety: ensure object
  const safeMetadata =
    metadata && typeof metadata === "object" ? metadata : { value: metadata };

  const { error } = await supabase.from("activity_events").insert({
    user_id: userId,
    event_type: eventType,
    entity_id: entityId,
    metadata: safeMetadata, // ✅ correct column name
    title,
  });

  return error ? { success: false, error } : { success: true };
}
