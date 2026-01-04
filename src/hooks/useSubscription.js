// src/hooks/useSubscription.js
import { useState, useEffect, createContext, useContext, createElement } from "react";

// Plan definitions
const PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    limits: {
      aiSummaries: 5,
      documentSynth: 2,
      insightQueries: 10,
    },
    features: [
      "5 AI summaries per day",
      "Basic note organization",
      "Document uploads",
      "Insight Explorer (limited)",
      "Research Synthesizer (2 docs)",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 9,
    period: "month",
    limits: {
      aiSummaries: Infinity,
      documentSynth: Infinity,
      insightQueries: Infinity,
    },
    features: [
      "Unlimited AI summaries",
      "Voice notes & transcription",
      "Cloud sync across devices",
      "Priority AI processing",
      "Advanced export options",
      "Custom AI training",
      "Email support",
    ],
    unlockedFeatures: ["voice", "unlimited", "cloud", "custom", "export"],
  },
  team: {
    id: "team",
    name: "Team",
    price: 25,
    period: "month",
    limits: {
      aiSummaries: Infinity,
      documentSynth: Infinity,
      insightQueries: Infinity,
      teamMembers: 10,
    },
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Shared workspaces",
      "Team analytics",
      "Priority support",
      "Custom integrations",
    ],
    unlockedFeatures: ["voice", "unlimited", "cloud", "custom", "export", "collab"],
  },
};

// Create context
const SubscriptionContext = createContext(null);

// Provider component
export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState({
    plan: "free",
    status: "active",
    subscribedAt: null,
    expiresAt: null,
    paymentMethod: null,
  });
  
  const [usage, setUsage] = useState({
    aiSummaries: 0,
    documentSynth: 0,
    insightQueries: 0,
    lastReset: new Date().toDateString(),
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // Load subscription from localStorage on mount
  useEffect(() => {
    const savedSubscription = localStorage.getItem("notestream_subscription");
    const savedUsage = localStorage.getItem("notestream_usage");
    
    if (savedSubscription) {
      try {
        setSubscription(JSON.parse(savedSubscription));
      } catch (e) {
        console.error("Failed to parse subscription:", e);
      }
    }
    
    if (savedUsage) {
      try {
        const parsedUsage = JSON.parse(savedUsage);
        // Reset usage if it's a new day
        if (parsedUsage.lastReset !== new Date().toDateString()) {
          setUsage({
            aiSummaries: 0,
            documentSynth: 0,
            insightQueries: 0,
            lastReset: new Date().toDateString(),
          });
        } else {
          setUsage(parsedUsage);
        }
      } catch (e) {
        console.error("Failed to parse usage:", e);
      }
    }
    
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever subscription changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("notestream_subscription", JSON.stringify(subscription));
    }
  }, [subscription, isLoading]);

  // Save usage to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("notestream_usage", JSON.stringify(usage));
    }
  }, [usage, isLoading]);

  // Get current plan details
  const getCurrentPlan = () => {
    return PLANS[subscription.plan] || PLANS.free;
  };

  // Check if user has a specific plan or higher
  const hasPlan = (planId) => {
    const planOrder = ["free", "pro", "team"];
    const currentIndex = planOrder.indexOf(subscription.plan);
    const requiredIndex = planOrder.indexOf(planId);
    return currentIndex >= requiredIndex;
  };

  // Check if a feature is unlocked
  const isFeatureUnlocked = (featureId) => {
    const plan = getCurrentPlan();
    return plan.unlockedFeatures?.includes(featureId) || false;
  };

  // Check if user can use a feature (based on limits)
  const canUse = (featureType) => {
    const plan = getCurrentPlan();
    const limit = plan.limits[featureType];
    
    if (limit === Infinity) return true;
    return usage[featureType] < limit;
  };

  // Get remaining usage for a feature
  const getRemainingUsage = (featureType) => {
    const plan = getCurrentPlan();
    const limit = plan.limits[featureType];
    
    if (limit === Infinity) return Infinity;
    return Math.max(0, limit - usage[featureType]);
  };

  // Increment usage
  const incrementUsage = (featureType) => {
    setUsage((prev) => ({
      ...prev,
      [featureType]: prev[featureType] + 1,
    }));
  };

  // Subscribe to a plan (mock payment)
  const subscribe = async (planId, paymentDetails = {}) => {
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    setSubscription({
      plan: planId,
      status: "active",
      subscribedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      paymentMethod: {
        type: paymentDetails.type || "card",
        last4: paymentDetails.last4 || "4242",
        brand: paymentDetails.brand || "Visa",
      },
    });
    
    // Reset usage on upgrade
    setUsage({
      aiSummaries: 0,
      documentSynth: 0,
      insightQueries: 0,
      lastReset: new Date().toDateString(),
    });
    
    return { success: true };
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setSubscription({
      plan: "free",
      status: "cancelled",
      subscribedAt: null,
      expiresAt: null,
      paymentMethod: null,
    });
    
    return { success: true };
  };

  // Check if subscription is active
  const isSubscriptionActive = () => {
    if (subscription.plan === "free") return true;
    if (!subscription.expiresAt) return false;
    return new Date(subscription.expiresAt) > new Date();
  };

  const value = {
    subscription,
    usage,
    isLoading,
    PLANS,
    getCurrentPlan,
    hasPlan,
    isFeatureUnlocked,
    canUse,
    getRemainingUsage,
    incrementUsage,
    subscribe,
    cancelSubscription,
    isSubscriptionActive,
  };

  return createElement(
    SubscriptionContext.Provider,
    { value },
    children
  );
}

// Hook to use subscription
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}

export default useSubscription;