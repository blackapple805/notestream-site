// src/hooks/useIntegrations.js
import { useState, useEffect, createContext, useContext, createElement } from "react";

// Integration data with all details
const INTEGRATIONS_DATA = {
  "google-drive": {
    id: "google-drive",
    title: "Google Drive",
    desc: "Sync notes, PDFs, and screenshots directly from your Drive workspace.",
    icon: "FiCloud",
    color: "blue",
    features: ["Auto-sync files", "Folder organization", "Real-time updates"],
    status: "available",
    mockData: {
      filesCount: 24,
      lastSync: "2 minutes ago",
      storageUsed: "1.2 GB",
    },
  },
  slack: {
    id: "slack",
    title: "Slack",
    desc: "Turn message threads into AI summaries and actionable insights.",
    icon: "FiMessageSquare",
    color: "purple",
    features: ["Channel summaries", "Thread extraction", "Direct messaging"],
    status: "available",
    mockData: {
      channelsConnected: 5,
      messagesProcessed: 142,
      lastSync: "5 minutes ago",
    },
  },
  notion: {
    id: "notion",
    title: "Notion",
    desc: "Send Smart Notes to any Notion page with perfect formatting.",
    icon: "FiDatabase",
    color: "slate",
    features: ["Page sync", "Database updates", "Block formatting"],
    status: "available",
    mockData: {
      pagesLinked: 8,
      lastExport: "1 hour ago",
      autoSync: true,
    },
  },
  zapier: {
    id: "zapier",
    title: "Zapier",
    desc: "Automate everything — from new notes to CRM updates and reminders.",
    icon: "FiZap",
    color: "orange",
    features: ["5000+ apps", "Custom workflows", "Trigger actions"],
    status: "available",
    mockData: {
      zapsActive: 3,
      tasksRun: 89,
      lastTrigger: "10 minutes ago",
    },
  },
  github: {
    id: "github",
    title: "GitHub Issues",
    desc: "Automatically extract tasks from meeting notes and push them into issues.",
    icon: "FiGithub",
    color: "gray",
    features: ["Issue creation", "PR summaries", "Repo integration"],
    status: "coming-soon",
    mockData: null,
  },
  email: {
    id: "email",
    title: "Email Import",
    desc: "Forward emails and get instant summaries and action items.",
    icon: "FiMail",
    color: "rose",
    features: ["Email forwarding", "Attachment parsing", "Auto-categorize"],
    status: "coming-soon",
    mockData: null,
  },
};

// Create context
const IntegrationsContext = createContext(null);

// Provider component - using createElement instead of JSX
export function IntegrationsProvider({ children }) {
  const [connections, setConnections] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load connections from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("notestream_integrations");
    if (saved) {
      try {
        setConnections(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse integrations:", e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever connections change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("notestream_integrations", JSON.stringify(connections));
    }
  }, [connections, isLoading]);

  // Connect an integration
  const connect = (integrationId, accountInfo = {}) => {
    const integration = INTEGRATIONS_DATA[integrationId];
    if (!integration || integration.status === "coming-soon") return false;

    setConnections((prev) => ({
      ...prev,
      [integrationId]: {
        connectedAt: new Date().toISOString(),
        accountEmail: accountInfo.email || "user@example.com",
        accountName: accountInfo.name || "Connected Account",
        isActive: true,
        ...integration.mockData,
      },
    }));
    return true;
  };

  // Disconnect an integration
  const disconnect = (integrationId) => {
    setConnections((prev) => {
      const updated = { ...prev };
      delete updated[integrationId];
      return updated;
    });
  };

  // Check if integration is connected
  const isConnected = (integrationId) => {
    return !!connections[integrationId]?.isActive;
  };

  // Get connection details
  const getConnection = (integrationId) => {
    return connections[integrationId] || null;
  };

  // Get all integrations with connection status
  const getAllIntegrations = () => {
    return Object.values(INTEGRATIONS_DATA).map((integration) => ({
      ...integration,
      isConnected: isConnected(integration.id),
      connection: getConnection(integration.id),
    }));
  };

  // Get connected integrations only
  const getConnectedIntegrations = () => {
    return getAllIntegrations().filter((i) => i.isConnected);
  };

  // Get available (not connected) integrations
  const getAvailableIntegrations = () => {
    return getAllIntegrations().filter((i) => !i.isConnected && i.status === "available");
  };

  // Simulate a sync action
  const syncIntegration = async (integrationId) => {
    if (!isConnected(integrationId)) return false;

    // Simulate sync delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setConnections((prev) => ({
      ...prev,
      [integrationId]: {
        ...prev[integrationId],
        lastSync: "Just now",
      },
    }));

    return true;
  };

  const value = {
    connections,
    isLoading,
    connect,
    disconnect,
    isConnected,
    getConnection,
    getAllIntegrations,
    getConnectedIntegrations,
    getAvailableIntegrations,
    syncIntegration,
    INTEGRATIONS_DATA,
  };

  // Using createElement instead of JSX so this works with .js extension
  return createElement(
    IntegrationsContext.Provider,
    { value },
    children
  );
}

// Hook to use integrations
export function useIntegrations() {
  const context = useContext(IntegrationsContext);
  if (!context) {
    throw new Error("useIntegrations must be used within an IntegrationsProvider");
  }
  return context;
}

export default useIntegrations;