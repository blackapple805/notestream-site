// src/hooks/useWorkspaceSettings.js
import { useState, useEffect, useCallback, createContext, useContext } from "react";

const WorkspaceContext = createContext(null);

// Storage keys
const KEYS = {
  autoSummarize: "notestream-autoSummarize",
  smartNotifications: "notestream-smartNotifications",
  weeklyDigest: "notestream-weeklyDigest",
};

// Default values
const DEFAULTS = {
  autoSummarize: true,
  smartNotifications: true,
  weeklyDigest: false,
};

export function WorkspaceProvider({ children }) {
  const [settings, setSettings] = useState(() => ({
    autoSummarize: localStorage.getItem(KEYS.autoSummarize) !== "false",
    smartNotifications: localStorage.getItem(KEYS.smartNotifications) !== "false",
    weeklyDigest: localStorage.getItem(KEYS.weeklyDigest) === "true",
  }));

  // Notifications state (parsed from notes)
  const [notifications, setNotifications] = useState([]);

  // Update a single setting
  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    localStorage.setItem(KEYS[key], value.toString());
  }, []);

  // Parse notes for smart notifications
  const parseNotificationsFromNotes = useCallback((notes) => {
    if (!settings.smartNotifications) {
      setNotifications([]);
      return [];
    }

    const parsed = [];
    const now = new Date();
    const todayStr = now.toDateString();

    // Patterns to detect
    const patterns = {
      deadline: /\b(deadline|due|due date|by|before)\b[:\s]*([^.\n,]+)/gi,
      reminder: /\b(remind|reminder|don't forget|remember)\b[:\s]*([^.\n,]+)/gi,
      todo: /\b(todo|to-do|task|action item)\b[:\s]*([^.\n,]+)/gi,
      meeting: /\b(meeting|call|sync|standup|1:1)\b[:\s]*([^.\n,]+)/gi,
      urgent: /\b(urgent|asap|critical|important|priority)\b/gi,
      date: /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this week|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/gi,
    };

    notes.forEach((note) => {
      const content = `${note.title} ${note.body}`.toLowerCase();
      const noteDate = new Date(note.updated);
      const isRecent = (now - noteDate) < 7 * 24 * 60 * 60 * 1000; // Within 7 days

      // Check for urgent items
      if (patterns.urgent.test(content)) {
        parsed.push({
          id: `urgent-${note.id}`,
          noteId: note.id,
          noteTitle: note.title,
          type: "urgent",
          message: "Contains urgent items",
          priority: "high",
          icon: "⚠️",
        });
        patterns.urgent.lastIndex = 0;
      }

      // Check for deadlines
      let match;
      patterns.deadline.lastIndex = 0;
      while ((match = patterns.deadline.exec(content)) !== null) {
        const context = match[2]?.trim().slice(0, 50);
        if (context) {
          parsed.push({
            id: `deadline-${note.id}-${match.index}`,
            noteId: note.id,
            noteTitle: note.title,
            type: "deadline",
            message: `Deadline: ${context}`,
            priority: "high",
            icon: "📅",
          });
        }
      }

      // Check for todos
      patterns.todo.lastIndex = 0;
      while ((match = patterns.todo.exec(content)) !== null) {
        const context = match[2]?.trim().slice(0, 50);
        if (context) {
          parsed.push({
            id: `todo-${note.id}-${match.index}`,
            noteId: note.id,
            noteTitle: note.title,
            type: "todo",
            message: `Task: ${context}`,
            priority: "medium",
            icon: "✅",
          });
        }
      }

      // Check for reminders
      patterns.reminder.lastIndex = 0;
      while ((match = patterns.reminder.exec(content)) !== null) {
        const context = match[2]?.trim().slice(0, 50);
        if (context) {
          parsed.push({
            id: `reminder-${note.id}-${match.index}`,
            noteId: note.id,
            noteTitle: note.title,
            type: "reminder",
            message: `Reminder: ${context}`,
            priority: "medium",
            icon: "🔔",
          });
        }
      }

      // Check for meetings in recent notes
      if (isRecent) {
        patterns.meeting.lastIndex = 0;
        while ((match = patterns.meeting.exec(content)) !== null) {
          const context = match[2]?.trim().slice(0, 50);
          if (context) {
            parsed.push({
              id: `meeting-${note.id}-${match.index}`,
              noteId: note.id,
              noteTitle: note.title,
              type: "meeting",
              message: `Meeting: ${context}`,
              priority: "medium",
              icon: "📞",
            });
          }
        }
      }
    });

    // Deduplicate and limit
    const unique = parsed.reduce((acc, item) => {
      const exists = acc.find(
        (i) => i.noteId === item.noteId && i.type === item.type && i.message === item.message
      );
      if (!exists) acc.push(item);
      return acc;
    }, []);

    // Sort by priority
    const sorted = unique.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Limit to 10 notifications
    const limited = sorted.slice(0, 10);
    
    setNotifications(limited);
    return limited;
  }, [settings.smartNotifications]);

  // Generate weekly digest data
  const generateDigest = useCallback((notes = [], docs = []) => {
    if (!settings.weeklyDigest) return null;

    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Filter items from the past week
    const recentNotes = notes.filter((n) => new Date(n.updated) > weekAgo);
    const recentDocs = docs.filter((d) => {
      // Assume docs have an 'updated' field or use creation time
      const docDate = d.updated ? new Date(d.updated) : new Date();
      return docDate > weekAgo;
    });

    // Calculate stats
    const notesCreated = recentNotes.length;
    const docsUploaded = recentDocs.length;
    const favoritedNotes = recentNotes.filter((n) => n.favorite).length;
    const synthesizedDocs = recentDocs.filter((d) => d.synthesized).length;

    // Find most active day
    const dayCount = {};
    recentNotes.forEach((n) => {
      const day = new Date(n.updated).toLocaleDateString("en-US", { weekday: "long" });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });
    const mostActiveDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Tags summary
    const tagCount = {};
    recentNotes.forEach((n) => {
      if (n.tag) {
        tagCount[n.tag] = (tagCount[n.tag] || 0) + 1;
      }
    });
    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag, count]) => ({ tag, count }));

    return {
      period: {
        start: weekAgo.toLocaleDateString(),
        end: now.toLocaleDateString(),
      },
      stats: {
        notesCreated,
        docsUploaded,
        favoritedNotes,
        synthesizedDocs,
        totalItems: notesCreated + docsUploaded,
      },
      insights: {
        mostActiveDay,
        topTags,
        productivity: notesCreated > 5 ? "High" : notesCreated > 2 ? "Medium" : "Getting started",
      },
      highlights: recentNotes
        .filter((n) => n.favorite)
        .slice(0, 3)
        .map((n) => ({ id: n.id, title: n.title })),
    };
  }, [settings.weeklyDigest]);

  // Dismiss a notification
  const dismissNotification = useCallback((notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    settings,
    updateSetting,
    notifications,
    parseNotificationsFromNotes,
    dismissNotification,
    clearAllNotifications,
    generateDigest,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceSettings() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspaceSettings must be used within a WorkspaceProvider");
  }
  return context;
}

export default useWorkspaceSettings;