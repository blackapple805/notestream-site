// src/hooks/useSubscription.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { supabase } from "../lib/supabaseClient";

// ============================================================
// Plan definitions (DO NOT export from this file to keep Vite Fast Refresh happy)
// ============================================================
const PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    period: "month",
    features: [
      "5 AI summaries per day",
      "3 document syntheses per day",
      "10 insight queries per day",
      "Basic note organization",
    ],
    limits: {
      aiSummaries: 5,
      documentSynth: 3,
      insightQueries: 10,
      voiceTranscriptions: 3,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 12,
    period: "month",
    features: [
      "Unlimited AI summaries",
      "Unlimited document synthesis",
      "Unlimited insight queries",
      "Voice notes & transcription",
      "Cloud sync across devices",
      "Priority support",
    ],
    limits: {
      aiSummaries: Infinity,
      documentSynth: Infinity,
      insightQueries: Infinity,
      voiceTranscriptions: Infinity,
    },
  },
  team: {
    id: "team",
    name: "Team",
    price: 29,
    period: "month",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Shared workspaces",
      "Admin controls",
      "Custom AI training",
      "API access",
    ],
    limits: {
      aiSummaries: Infinity,
      documentSynth: Infinity,
      insightQueries: Infinity,
      voiceTranscriptions: Infinity,
    },
  },
};

// ============================================================
// Feature entitlements (IMPORTANT)
// - collab should be Team-only
// ============================================================
const ENTITLEMENTS = {
  free: new Set([]),
  pro: new Set(["voice", "unlimited", "cloud", "export", "custom"]),
  team: new Set(["voice", "unlimited", "cloud", "export", "custom", "collab"]),
};

// ============================================================
// Context
// ============================================================
const SubscriptionContext = createContext(null);

// ============================================================
// Helpers
// ============================================================
const CACHE_KEY = "notestream_subscription";

const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

const isoToMs = (iso) => {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
};

function computeAccess(sub) {
  const plan = sub?.plan || "free";
  const status = sub?.status || "active";
  const periodEndIso = sub?.expiresAt || sub?.current_period_end || null;
  const endMs = isoToMs(periodEndIso);

  const paidAccess =
    plan !== "free" &&
    (status === "active" || status === "canceling") &&
    endMs > Date.now();

  return {
    plan,
    status,
    endMs,
    paidAccess,
    isCanceling: status === "canceling" || !!sub?.cancelAtPeriodEnd,
  };
}

// ============================================================
// Provider Component
// ============================================================
export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState({
    id: null, // subscriptions.id
    plan: "free",
    status: "active", // active | canceling | canceled
    expiresAt: null,
    cancelAtPeriodEnd: false,
    paymentMethod: null,
  });

  const [usage, setUsage] = useState({
    aiSummaries: 0,
    documentSynth: 0,
    insightQueries: 0,
    voiceTranscriptions: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Prevent UI “stuck” states during optimistic updates
  const [cancelInFlight, setCancelInFlight] = useState(false);
  const [reactivateInFlight, setReactivateInFlight] = useState(false);

  const stateRef = useRef({ subscription, usage });
  useEffect(() => {
    stateRef.current = { subscription, usage };
  }, [subscription, usage]);

  // ✅ NEW: in-flight guard to prevent repeated/overlapping loads
  const loadingRef = useRef(false);

  const loadFromCache = useCallback(() => {
    const cached = safeJsonParse(localStorage.getItem(CACHE_KEY));
    if (!cached) return;

    const nextSub = cached.subscription || stateRef.current.subscription;
    const nextUsage = cached.usage || stateRef.current.usage;

    setSubscription((prev) => ({ ...prev, ...nextSub }));
    setUsage((prev) => ({ ...prev, ...nextUsage }));
  }, []);

  // Always-truth subscription fetch from table (bypasses RPC staleness)
  const fetchSubscriptionRow = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        "id,plan,status,current_period_end,cancel_at_period_end,payment_method_type,payment_method_last4,payment_method_brand"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }, []);

  // ----------------------------------------------------------
  // Load subscription + usage (SESSION-GATED)
  // ----------------------------------------------------------
  const loadSubscription = useCallback(async () => {
    // ✅ in-flight guard
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session fetch error:", sessionError);
        loadFromCache();
        return;
      }

      const user = session?.user;
      if (!user?.id) {
        loadFromCache();
        return;
      }

      const userId = user.id;

      // Ensure row exists (best effort). If RPC fails, we still read table.
      try {
        await supabase.rpc("get_or_create_subscription", { p_user_id: userId });
      } catch {
        // ignore
      }

      const subRow = await fetchSubscriptionRow(userId);

      if (subRow) {
        const status =
          subRow.status || (subRow.cancel_at_period_end ? "canceling" : "active");

        setSubscription({
          id: subRow.id ?? null,
          plan: subRow.plan || "free",
          status,
          expiresAt: subRow.current_period_end || null,
          cancelAtPeriodEnd: !!subRow.cancel_at_period_end,
          paymentMethod: subRow.payment_method_last4
            ? {
                type: subRow.payment_method_type || "card",
                last4: subRow.payment_method_last4,
                brand: subRow.payment_method_brand || null,
              }
            : null,
        });
      } else {
        setSubscription({
          id: null,
          plan: "free",
          status: "active",
          expiresAt: null,
          cancelAtPeriodEnd: false,
          paymentMethod: null,
        });
      }

      // USAGE
      const { data: usageData, error: usageError } = await supabase.rpc(
        "get_daily_usage",
        { p_user_id: userId }
      );

      if (usageError) throw usageError;

      if (Array.isArray(usageData) && usageData.length > 0) {
        const u = usageData[0];
        setUsage({
          aiSummaries: u.ai_summaries || 0,
          documentSynth: u.document_synth || 0,
          insightQueries: u.insight_queries || 0,
          voiceTranscriptions: u.voice_transcriptions || 0,
        });
      } else {
        setUsage({
          aiSummaries: 0,
          documentSynth: 0,
          insightQueries: 0,
          voiceTranscriptions: 0,
        });
      }
    } catch (err) {
      console.error("Failed to load subscription:", err);
      setError(err?.message || String(err));
      loadFromCache();
    } finally {
      setIsLoading(false);
      loadingRef.current = false; // ✅ unlock
    }
  }, [fetchSubscriptionRow, loadFromCache]);

  // ----------------------------------------------------------
  // Subscribe
  // ----------------------------------------------------------
  const subscribe = useCallback(
    async (planId, paymentMethod) => {
      try {
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user;

        if (!user?.id) {
          const newSubscription = {
            id: null,
            plan: planId,
            status: "active",
            expiresAt: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            cancelAtPeriodEnd: false,
            paymentMethod: paymentMethod || null,
          };
          setSubscription(newSubscription);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              subscription: newSubscription,
              usage: stateRef.current.usage,
            })
          );
          return { success: true };
        }

        const { data, error: subError } = await supabase.rpc("subscribe_to_plan", {
          p_user_id: user.id,
          p_plan: planId,
          p_payment_last4: paymentMethod?.last4 || null,
          p_payment_brand: paymentMethod?.brand || null,
          p_payment_type: paymentMethod?.type || "card",
        });

        if (subError) throw subError;

        await loadSubscription();
        return { success: true, data };
      } catch (err) {
        console.error("Failed to subscribe:", err);
        setError(err?.message || String(err));
        return { success: false, error: err?.message || String(err) };
      }
    },
    [loadSubscription]
  );

  // ----------------------------------------------------------
  // Cancel (RPC expects p_subscription_id uuid, returns boolean)
  // ----------------------------------------------------------
  const cancelSubscription = useCallback(async () => {
    const rollback = () => {
      setSubscription((prev) => ({
        ...prev,
        cancelAtPeriodEnd: false,
        status: "active",
      }));
    };

    try {
      setError(null);
      setCancelInFlight(true);

      // optimistic
      setSubscription((prev) => ({
        ...prev,
        cancelAtPeriodEnd: true,
        status: prev.status === "active" ? "canceling" : prev.status,
      }));

      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();

      if (sessionErr) {
        rollback();
        return { success: false, error: sessionErr.message };
      }

      const user = session?.user;
      if (!user?.id) {
        return { success: true, demo: true };
      }

      const subId = stateRef.current.subscription?.id;
      if (!subId) {
        rollback();
        return {
          success: false,
          error: "Missing subscription id. Reload and try again.",
        };
      }

      const { data, error: cancelError } = await supabase.rpc(
        "cancel_subscription",
        { p_subscription_id: subId }
      );

      if (cancelError) {
        rollback();
        throw cancelError;
      }

      if (data !== true) {
        rollback();
        return { success: false, error: "Cancel failed (not found / not owned)." };
      }

      await loadSubscription();
      return { success: true };
    } catch (err) {
      console.error("Failed to cancel:", err);
      setError(err?.message || String(err));
      return { success: false, error: err?.message || String(err) };
    } finally {
      setCancelInFlight(false);
    }
  }, [loadSubscription]);

  // ----------------------------------------------------------
  // Reactivate
  // ----------------------------------------------------------
  const reactivateSubscription = useCallback(async () => {
    try {
      setError(null);
      setReactivateInFlight(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user?.id) {
        setSubscription((prev) => ({
          ...prev,
          status: "active",
          cancelAtPeriodEnd: false,
        }));
        return { success: true };
      }

      const { error: reactivateError } = await supabase.rpc(
        "reactivate_subscription",
        { p_user_id: user.id }
      );

      if (reactivateError) {
        const { error: updErr } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            cancel_at_period_end: false,
            cancelled_at: null,
          })
          .eq("user_id", user.id);

        if (updErr) throw updErr;
      }

      await loadSubscription();
      return { success: true };
    } catch (err) {
      console.error("Failed to reactivate:", err);
      setError(err?.message || String(err));
      return { success: false, error: err?.message || String(err) };
    } finally {
      setReactivateInFlight(false);
    }
  }, [loadSubscription]);

  // ----------------------------------------------------------
  // Increment usage
  // ----------------------------------------------------------
  const incrementUsage = useCallback(async (usageType) => {
    const typeMap = {
      aiSummaries: "ai_summaries",
      documentSynth: "document_synth",
      insightQueries: "insight_queries",
      voiceTranscriptions: "voice_transcriptions",
    };

    const dbType = typeMap[usageType] || usageType;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user?.id) {
        setUsage((prev) => ({
          ...prev,
          [usageType]: (prev[usageType] || 0) + 1,
        }));
        return { success: true, limitReached: false };
      }

      const { data, error: incError } = await supabase.rpc("increment_usage", {
        p_user_id: user.id,
        p_usage_type: dbType,
        p_amount: 1,
      });

      if (incError) throw incError;

      if (Array.isArray(data) && data.length > 0) {
        const result = data[0];
        setUsage((prev) => ({
          ...prev,
          [usageType]: result.new_count,
        }));

        return {
          success: result.success,
          newCount: result.new_count,
          limitReached: result.limit_reached,
        };
      }

      return { success: true, limitReached: false };
    } catch (err) {
      console.error("Failed to increment usage:", err);
      setUsage((prev) => ({
        ...prev,
        [usageType]: (prev[usageType] || 0) + 1,
      }));
      return { success: false, error: err?.message || String(err) };
    }
  }, []);

  // ----------------------------------------------------------
  // Helper functions
  // ----------------------------------------------------------
  const getCurrentPlan = useCallback(() => {
    return PLANS[subscription?.plan] || PLANS.free;
  }, [subscription?.plan]);

  const hasPaidAccess = useCallback(() => {
    const { paidAccess } = computeAccess(subscription);
    return paidAccess;
  }, [subscription]);

  const isFeatureUnlocked = useCallback(
    (featureId) => {
      const plan = subscription?.plan || "free";
      if (!featureId) return false;
      if (plan === "free") return false;
      if (!hasPaidAccess()) return false;
      return ENTITLEMENTS[plan]?.has(featureId) || false;
    },
    [subscription?.plan, hasPaidAccess]
  );

  const canUseFeature = useCallback(
    (featureType) => {
      const plan = getCurrentPlan();
      const limit = plan?.limits?.[featureType];
      const used = usage?.[featureType] || 0;

      if (limit === Infinity) return true;
      if (typeof limit !== "number") return true;
      return used < limit;
    },
    [getCurrentPlan, usage]
  );

  const getRemainingQuota = useCallback(
    (featureType) => {
      const plan = getCurrentPlan();
      const limit = plan?.limits?.[featureType];
      const used = usage?.[featureType] || 0;

      if (limit === Infinity) return Infinity;
      if (typeof limit !== "number") return Infinity;
      return Math.max(0, limit - used);
    },
    [getCurrentPlan, usage]
  );

  // ----------------------------------------------------------
  // Load on mount and auth changes
  // ----------------------------------------------------------
  useEffect(() => {
    loadSubscription();

    const inFlight = { current: false };

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        if (inFlight.current) return;
        inFlight.current = true;

        Promise.resolve(loadSubscription()).finally(() => {
          inFlight.current = false;
        });
      } else if (event === "SIGNED_OUT") {
        setSubscription({
          id: null,
          plan: "free",
          status: "active",
          expiresAt: null,
          cancelAtPeriodEnd: false,
          paymentMethod: null,
        });
        setUsage({
          aiSummaries: 0,
          documentSynth: 0,
          insightQueries: 0,
          voiceTranscriptions: 0,
        });
      }
    });

    return () => authSub?.unsubscribe();
  }, [loadSubscription]);


  // ----------------------------------------------------------
  // Cache to localStorage when data changes
  // ----------------------------------------------------------
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ subscription, usage }));
    }
  }, [subscription, usage, isLoading]);

  // ----------------------------------------------------------
  // Context value
  // ----------------------------------------------------------
  const value = {
    subscription,
    usage,
    isLoading,
    error,

    // expose plans via context (instead of exporting constant)
    PLANS,

    // computed helpers
    getCurrentPlan,
    hasPaidAccess,
    isFeatureUnlocked,
    canUseFeature,
    getRemainingQuota,

    // actions
    subscribe,
    cancelSubscription,
    reactivateSubscription,
    incrementUsage,
    loadSubscription,

    // UI helpers
    cancelInFlight,
    reactivateInFlight,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}

export default useSubscription;


