// src/hooks/useNotes.jsx
// ═══════════════════════════════════════════════════════════════════
// Single source of truth for notes CRUD against Supabase.
//
// ARCHITECTURE NOTE (2026-05-28):
//   Previously this file exported a plain hook (useNotes()) and the
//   pattern was "call useNotes() from wherever you need notes." That
//   meant App.jsx had one mount and Sidebar.jsx had another, each
//   spinning up its own auth listener, its own getUser() call, and
//   its own copy of `notes` state. Two consequences:
//     · every auth event triggered two parallel refetches
//     · the sidebar's `createNote` prepended to the sidebar's local
//       state, but the Notes page's `notes` prop came from App's
//       copy — so a sidebar-created note was invisible to the page
//       until the page-level hook independently refetched
//   The fix is the same pattern useSubscription uses: a Provider
//   does the work once at the top of the app, and useNotes() reads
//   from React Context. Mounting it twice would be a runtime error
//   (one Provider only), so the "two copies" bug becomes impossible.
//
// Schema columns used (from the public.notes table):
//   id, user_id, title, body, tags, is_favorite, is_highlight, status,
//   created_at, updated_at, ai_payload, ai_generated_at, ai_model
// ═══════════════════════════════════════════════════════════════════

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase, supabaseReady } from "../lib/supabaseClient";
import { useAuth } from "./useAuth";

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
    // Real `status` column with a safe fallback for pre-migration rows.
    status: row.status || (row.ai_payload ? "published" : "draft"),
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

const NotesContext = createContext(null);

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Source of truth for auth lives in AuthProvider. We just read it
  // here instead of running our own getUser() + onAuthStateChange
  // subscription. Previously this hook had its own listener, which
  // meant TWO listeners total (this + AuthProvider) — fine semantically
  // but a wasted refresh attempt during token-renewal storms. Reading
  // from context is also cheaper and means the notes list reacts to
  // auth state changes in the same tick the rest of the app does.
  const { userId, ready: authReady } = useAuth();

  /* ─── Load notes whenever the user changes ─── */
  const refetch = useCallback(async () => {
    if (!supabaseReady || !supabase) {
      setLoading(false);
      return;
    }
    // Wait for the auth provider to settle before deciding the user is
    // signed-out. Without this guard the very first render (where
    // userId is briefly null while the SDK validates the cached token)
    // would clear `notes` to [] and the UI would flash an empty state.
    if (!authReady) {
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
  }, [userId, authReady]);

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
      // Publish/unpublish writes the real `status` column. Whitelist matches
      // the Postgres CHECK so a bad value short-circuits with a console
      // warning instead of a 23514 error.
      if ("status" in patch && ["draft", "published", "archived"].includes(patch.status)) {
        dbPatch.status = patch.status;
      }
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

  const value = {
    notes,
    setNotes,
    loading,
    error,
    userId,
    refetch,
    createNote,
    getNote,
    updateNote,
    deleteNote,
  };

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) {
    // Fail loudly during development so the missing-Provider mistake
    // doesn't silently produce empty notes everywhere.
    throw new Error("useNotes must be used inside <NotesProvider>");
  }
  return ctx;
}
