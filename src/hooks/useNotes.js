// src/hooks/useNotes.js
// ═══════════════════════════════════════════════════════════════════
// Single source of truth for notes CRUD against Supabase.
//
// Why this exists:
//   App.jsx had `useState([])` for notes that never loaded anything,
//   QuickCreateModal called an undefined `onCreate`, and NoteView.jsx
//   ignored params.id and rendered a hardcoded essay. This hook ties
//   all three together by:
//     · loading notes for the current user on mount
//     · exposing createNote / updateNote / deleteNote
//     · refetching on auth changes
//
// Schema columns used (from the public.notes table):
//   id, user_id, title, body, tags, is_favorite, is_highlight,
//   created_at, updated_at, ai_payload, ai_generated_at, ai_model
// ═══════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from "react";
import { supabase, supabaseReady } from "../lib/supabaseClient";

const TABLE = "notes";

/**
 * Convert a DB row → the shape the existing Notes.jsx / NoteView.jsx UI
 * expects. The UI was built against a stub with fields like `preview`,
 * `words`, `updatedAt` (string), etc., so we synthesize those here
 * rather than rewriting every UI component.
 */
function rowToNote(row) {
  if (!row) return null;
  const body = row.body || "";
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title || "Untitled entry",
    body,
    _body: body, // alias the stub UI uses
    preview: body.trim().slice(0, 180) || "—",
    tags: Array.isArray(row.tags) ? row.tags : [],
    pinned: Boolean(row.is_favorite),
    is_favorite: Boolean(row.is_favorite),
    is_highlight: Boolean(row.is_highlight),
    status: row.ai_payload ? "published" : "draft",
    type: "note",
    words: wordCount,
    createdAt: row.created_at,
    updatedAt: humanizeTimestamp(row.updated_at || row.created_at),
    updated_at: row.updated_at || row.created_at,
    ai_payload: row.ai_payload || null,
    ai_generated_at: row.ai_generated_at || null,
    ai_model: row.ai_model || null,
  };
}

function humanizeTimestamp(iso) {
  if (!iso) return "JUST NOW";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "JUST NOW";
  if (min < 60) return `${min} MIN AGO`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} H AGO`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days} D AGO`;
  return new Date(iso).toLocaleDateString();
}

export function useNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  /* ─── Track auth state ─── */
  useEffect(() => {
    if (!supabaseReady || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUserId(data?.user?.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUserId(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  /* ─── Load notes whenever the user changes ─── */
  const refetch = useCallback(async () => {
    if (!supabaseReady || !supabase) {
      setLoading(false);
      return;
    }
    if (!userId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from(TABLE)
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (err) throw err;
      setNotes((data || []).map(rowToNote));
    } catch (err) {
      console.error("[useNotes] load failed:", err);
      setError(err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  /* ─── Create ─── */
  const createNote = useCallback(
    async (input) => {
      if (!supabaseReady || !supabase || !userId) {
        throw new Error("Not signed in or Supabase unavailable");
      }

      const payload = {
        user_id: userId,
        title: (input.title || "Untitled entry").slice(0, 500),
        body: input.body || input._body || "",
        tags: Array.isArray(input.tags) ? input.tags.slice(0, 20) : [],
        is_favorite: Boolean(input.pinned || input.is_favorite),
        is_highlight: Boolean(input.is_highlight),
      };

      const { data, error: err } = await supabase
        .from(TABLE)
        .insert(payload)
        .select()
        .single();

      if (err) {
        console.error("[useNotes] create failed:", err);
        throw err;
      }

      const created = rowToNote(data);
      // Optimistic prepend so the list/viewer see it instantly
      setNotes((prev) => [created, ...prev.filter((n) => n.id !== created.id)]);
      return created;
    },
    [userId],
  );

  /* ─── Read one (by id) ─── */
  const getNote = useCallback(
    async (id) => {
      if (!id) return null;
      // Try cache first
      const cached = notes.find((n) => n.id === id);
      if (cached) return cached;

      if (!supabaseReady || !supabase) return null;

      const { data, error: err } = await supabase
        .from(TABLE)
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (err) {
        console.error("[useNotes] get failed:", err);
        return null;
      }
      return rowToNote(data);
    },
    [notes],
  );

  /* ─── Update ─── */
  const updateNote = useCallback(
    async (id, patch) => {
      if (!supabaseReady || !supabase || !id) return null;

      // Defense in depth: refuse to PATCH unless the id is a valid uuid.
      // The QuickCreateModal generates local `n_xxx` placeholder ids that
      // would otherwise hit Postgres error 22P02 ("invalid input syntax
      // for type uuid"). The real uuid is set after Supabase insert, so
      // a placeholder slipping in here means something upstream is stale.
      const looksLikeUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          String(id),
        );
      if (!looksLikeUuid) {
        console.warn("[useNotes] update skipped — non-uuid id:", id);
        return null;
      }

      const dbPatch = {};
      if ("title" in patch) dbPatch.title = patch.title;
      if ("body" in patch) dbPatch.body = patch.body;
      if ("tags" in patch) dbPatch.tags = patch.tags;
      if ("pinned" in patch) dbPatch.is_favorite = Boolean(patch.pinned);
      if ("is_favorite" in patch) dbPatch.is_favorite = Boolean(patch.is_favorite);
      if ("is_highlight" in patch) dbPatch.is_highlight = Boolean(patch.is_highlight);
      if ("ai_payload" in patch) {
        dbPatch.ai_payload = patch.ai_payload;
        dbPatch.ai_generated_at = new Date().toISOString();
        if (patch.ai_model) dbPatch.ai_model = patch.ai_model;
      }
      dbPatch.updated_at = new Date().toISOString();

      const { data, error: err } = await supabase
        .from(TABLE)
        .update(dbPatch)
        .eq("id", id)
        .select()
        .single();

      if (err) {
        console.error("[useNotes] update failed:", err);
        throw err;
      }

      const updated = rowToNote(data);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      return updated;
    },
    [],
  );

  /* ─── Delete ─── */
  const deleteNote = useCallback(async (id) => {
    if (!supabaseReady || !supabase || !id) return false;
    const { error: err } = await supabase.from(TABLE).delete().eq("id", id);
    if (err) {
      console.error("[useNotes] delete failed:", err);
      throw err;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
    return true;
  }, []);

  return {
    notes,
    setNotes, // exposed for Notes.jsx compatibility
    loading,
    error,
    userId,
    refetch,
    createNote,
    getNote,
    updateNote,
    deleteNote,
  };
}
