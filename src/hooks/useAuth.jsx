// src/hooks/useAuth.jsx
// ═══════════════════════════════════════════════════════════════════
// Single shared auth state for the whole app.
//
// Why this exists:
//   The codebase had 18 separate getSession() / getUser() call sites
//   across hooks, layouts, and pages. On a dashboard mount, easily
//   5–6 of them would fire concurrently. Each one is a candidate to
//   independently trigger a refresh_token call when the cached JWT
//   is expired, and Supabase rate-limits that endpoint — so on a
//   stale-session load you'd see a 429 on /token, a cascade of 401s
//   on data queries, and the app would kick you to /login even
//   though the *next* refresh attempt would have succeeded.
//
//   This provider does the work once: it owns the auth listener,
//   exposes { user, session, loading, ready }, and every consumer
//   reads from context. No more concurrent refresh attempts.
//
// `ready` is the important new flag. It starts false, flips to true
// once we've either confirmed a session or confirmed there isn't
// one. Code that previously bounced to /login on a null session
// should wait for `ready` first — otherwise it bounces during the
// fraction of a second between mount and the first auth event.
// ═══════════════════════════════════════════════════════════════════

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase, supabaseReady } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const settledOnce = useRef(false);

  useEffect(() => {
    if (!supabaseReady || !supabase) {
      // No Supabase configured — treat as "not signed in but ready"
      // so consumers don't hang waiting for an event that'll never fire.
      setReady(true);
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    // Initial probe. getSession() reads from in-memory cache populated
    // synchronously from localStorage at client init. If the access
    // token is expired, the SDK will refresh in the background and
    // emit a TOKEN_REFRESHED event — we wait for that via the listener.
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);
      setLoading(false);
      if (data?.session) {
        settledOnce.current = true;
        setReady(true);
      }
    });

    // Grace window — if no auth event has fired within 1s of mount,
    // mark ready anyway so the UI can decide what to render.
    const graceTimer = setTimeout(() => {
      if (mounted && !settledOnce.current) {
        settledOnce.current = true;
        setReady(true);
      }
    }, 1000);

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setLoading(false);
      settledOnce.current = true;
      setReady(true);

      // ─────────────────────────────────────────────────────────────
      // CRITICAL: only update state if the user actually changed.
      //
      // The Supabase SDK fires TOKEN_REFRESHED frequently — every time
      // it rotates the access_token, which happens on its own schedule
      // AND when something validates the JWT against /auth/v1/user.
      // Each event delivers a fresh `newSession` object with a new
      // access_token, but the same user.
      //
      // If we naively do `setSession(newSession); setUser(newSession?.user)`
      // on every event, the new object references propagate through
      // every consumer that has `session` / `user` / `authUser` in a
      // dependency array. Each consumer re-runs effects, which re-fires
      // data queries, which can re-validate the JWT, which can trigger
      // another refresh — and we end up in an O(n^2) loop where the
      // SDK is refreshing the token dozens of times per second.
      //
      // The fix: key off user.id. If the id matches what we already
      // have, this is the same person — DON'T propagate. Update the
      // session ref internally (the SDK manages the live token) but
      // don't trigger React re-renders for downstream consumers.
      // ─────────────────────────────────────────────────────────────
      const newUserId = newSession?.user?.id ?? null;
      setUser((prev) => {
        const prevId = prev?.id ?? null;
        if (prevId === newUserId) {
          // Same user — keep the previous reference so React.memo /
          // dependency arrays don't see a change. The SDK still has
          // the fresh token internally; we just don't propagate.
          return prev;
        }
        return newSession?.user ?? null;
      });
      setSession((prev) => {
        const prevId = prev?.user?.id ?? null;
        if (prevId === newUserId) return prev;
        return newSession ?? null;
      });

      if (typeof window !== "undefined" && window.location?.hostname === "localhost") {
        // eslint-disable-next-line no-console
        console.debug("[auth]", event, newSession?.user?.email || "(none)");
      }
    });

    return () => {
      mounted = false;
      clearTimeout(graceTimer);
      sub?.subscription?.unsubscribe();
    };
  }, []);

  // Memoize so consumers don't rerender every time AuthProvider's parent
  // rerenders. The deps are all primitives or stable refs, so this object
  // changes ONLY when something meaningful changed.
  const value = useMemo(() => ({
    session,
    user,
    userId: user?.id ?? null,
    loading,
    ready,
    isAuthenticated: Boolean(user?.id),
  }), [session, user, loading, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
