// src/pages/CloudSync.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../components/GlassCard";
import {
  CloudArrowUp,
  CloudArrowDown,
  CloudCheck,
  Desktop,
  DeviceMobile,
  DeviceTablet,
  ArrowsClockwise,
  CheckCircle,
  Warning,
  Pause,
  Play,
  Trash,
  Plus,
  Gear,
  Clock,
  HardDrives,
  ArrowLeft,
  WifiHigh,
  WifiSlash,
} from "phosphor-react";
import { FiX, FiCheck, FiRefreshCw, FiSettings, FiTrash2 } from "react-icons/fi";
import { useSubscription } from "../hooks/useSubscription";

// QR Code Generator Component
function QRCode({ value, size = 192 }) {
  // Simple QR code pattern generator (deterministic based on value)
  const generatePattern = (str) => {
    const pattern = [];
    const gridSize = 21; // Standard QR code size
    
    // Create a hash from the string for deterministic randomness
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // Generate pattern based on hash
    for (let i = 0; i < gridSize * gridSize; i++) {
      // Use hash to create deterministic pattern
      const seed = (hash * (i + 1) * 9301 + 49297) % 233280;
      const rnd = seed / 233280;
      
      // QR codes have specific patterns - finder patterns in corners
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      // Finder patterns (7x7 squares in three corners)
      const isTopLeftFinder = row < 7 && col < 7;
      const isTopRightFinder = row < 7 && col >= gridSize - 7;
      const isBottomLeftFinder = row >= gridSize - 7 && col < 7;
      
      if (isTopLeftFinder || isTopRightFinder || isBottomLeftFinder) {
        // Create finder pattern
        const localRow = row < 7 ? row : row - (gridSize - 7);
        const localCol = col < 7 ? col : col - (gridSize - 7);
        
        // Outer border
        if (localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6) {
          pattern.push(true);
        }
        // White ring
        else if (localRow === 1 || localRow === 5 || localCol === 1 || localCol === 5) {
          pattern.push(false);
        }
        // Inner square
        else {
          pattern.push(true);
        }
      }
      // Timing patterns
      else if (row === 6 || col === 6) {
        pattern.push((row + col) % 2 === 0);
      }
      // Data area - use deterministic random
      else {
        pattern.push(rnd > 0.5);
      }
    }
    
    return { pattern, gridSize };
  };

  const { pattern, gridSize } = generatePattern(value);
  const cellSize = size / gridSize;

  return (
    <div 
      className="rounded-xl overflow-hidden"
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: 'white',
        padding: cellSize * 2
      }}
    >
      <svg 
        width={size - cellSize * 4} 
        height={size - cellSize * 4} 
        viewBox={`0 0 ${gridSize} ${gridSize}`}
      >
        {pattern.map((filled, i) => {
          const row = Math.floor(i / gridSize);
          const col = i % gridSize;
          return filled ? (
            <rect
              key={i}
              x={col}
              y={row}
              width={1}
              height={1}
              fill="#1a1a2e"
            />
          ) : null;
        })}
      </svg>
    </div>
  );
}

// Reusable Toggle Component
function Toggle({ enabled, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? "bg-sky-500" : "bg-slate-600"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
      />
    </button>
  );
}

export default function CloudSync() {
  const navigate = useNavigate();
  const { subscription, isFeatureUnlocked } = useSubscription();
  const isPro = subscription.plan !== "free";
  const isUnlocked = isFeatureUnlocked("cloud");

  // Redirect non-Pro users
  useEffect(() => {
    if (!isPro || !isUnlocked) {
      navigate("/dashboard/ai-lab");
    }
  }, [isPro, isUnlocked, navigate]);

  const [syncEnabled, setSyncEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(new Date(Date.now() - 1000 * 60 * 5));
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState("15");
  const [wifiOnly, setWifiOnly] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [qrExpiry, setQrExpiry] = useState(300); // 5 minutes in seconds
  const [deviceCode, setDeviceCode] = useState("");

  const intervalRef = useRef(null);
  const qrTimerRef = useRef(null);

  const [devices, setDevices] = useState([
    {
      id: "current",
      name: "This Device",
      type: "desktop",
      status: "connected",
      lastSync: new Date(),
      isCurrent: true,
      notesCount: 24,
      documentsCount: 12,
    },
    {
      id: "iphone",
      name: "iPhone 15 Pro",
      type: "mobile",
      status: "synced",
      lastSync: new Date(Date.now() - 1000 * 60 * 3),
      isCurrent: false,
      notesCount: 24,
      documentsCount: 12,
    },
    {
      id: "ipad",
      name: "iPad Air",
      type: "tablet",
      status: "synced",
      lastSync: new Date(Date.now() - 1000 * 60 * 15),
      isCurrent: false,
      notesCount: 22,
      documentsCount: 10,
    },
    {
      id: "macbook",
      name: "MacBook Pro",
      type: "desktop",
      status: "offline",
      lastSync: new Date(Date.now() - 1000 * 60 * 60 * 2),
      isCurrent: false,
      notesCount: 20,
      documentsCount: 8,
    },
  ]);

  const [syncHistory, setSyncHistory] = useState([
    { id: 1, action: "Synced 3 notes", device: "iPhone 15 Pro", time: new Date(Date.now() - 1000 * 60 * 3), status: "success" },
    { id: 2, action: "Synced 1 document", device: "iPad Air", time: new Date(Date.now() - 1000 * 60 * 15), status: "success" },
    { id: 3, action: "Full sync completed", device: "All devices", time: new Date(Date.now() - 1000 * 60 * 30), status: "success" },
    { id: 4, action: "Conflict resolved", device: "MacBook Pro", time: new Date(Date.now() - 1000 * 60 * 45), status: "warning" },
    { id: 5, action: "Synced 5 notes", device: "This Device", time: new Date(Date.now() - 1000 * 60 * 60), status: "success" },
  ]);

  const [storageUsed, setStorageUsed] = useState({
    notes: 12.4,
    documents: 45.2,
    total: 57.6,
    limit: 500,
  });

  // Generate device pairing code
  const generateDeviceCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Handle opening add device modal
  const handleOpenAddDevice = () => {
    setDeviceCode(generateDeviceCode());
    setQrExpiry(300);
    setShowAddDevice(true);
  };

  // QR code expiry countdown
  useEffect(() => {
    if (showAddDevice && qrExpiry > 0) {
      qrTimerRef.current = setInterval(() => {
        setQrExpiry(prev => {
          if (prev <= 1) {
            // Regenerate code when expired
            setDeviceCode(generateDeviceCode());
            return 300;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (qrTimerRef.current) clearInterval(qrTimerRef.current);
    };
  }, [showAddDevice]);

  // Format expiry time
  const formatExpiry = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case "mobile": return DeviceMobile;
      case "tablet": return DeviceTablet;
      default: return Desktop;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
      case "synced": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "syncing": return "text-sky-400 bg-sky-500/10 border-sky-500/30";
      case "offline": return "text-slate-400 bg-slate-500/10 border-slate-500/30";
      case "error": return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      default: return "text-theme-muted bg-white/5 border-white/10";
    }
  };

  const handleSync = () => {
    if (isSyncing || !syncEnabled) return;

    setIsSyncing(true);
    setSyncProgress(0);

    // Update device statuses
    setDevices(prev => prev.map(d => 
      d.status !== "offline" ? { ...d, status: "syncing" } : d
    ));

    intervalRef.current = setInterval(() => {
      setSyncProgress(prev => {
        const next = Math.min(100, prev + Math.floor(Math.random() * 15) + 5);
        
        if (next >= 100) {
          clearInterval(intervalRef.current);
          
          const now = new Date();
          setLastSyncTime(now);
          setIsSyncing(false);
          
          // Update devices
          setDevices(prev => prev.map(d => 
            d.status !== "offline" 
              ? { ...d, status: d.isCurrent ? "connected" : "synced", lastSync: now }
              : d
          ));

          // Add to history
          setSyncHistory(prev => [{
            id: Date.now(),
            action: "Full sync completed",
            device: "All devices",
            time: now,
            status: "success"
          }, ...prev.slice(0, 9)]);

          return 100;
        }
        return next;
      });
    }, 200);
  };

  const handleRemoveDevice = (deviceId) => {
    setDevices(prev => prev.filter(d => d.id !== deviceId));
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (qrTimerRef.current) clearInterval(qrTimerRef.current);
    };
  }, []);

  if (!isPro || !isUnlocked) {
    return null;
  }

  return (
    <div className="space-y-6 pb-[calc(var(--mobile-nav-height)+24px)] animate-fadeIn">
      {/* Header */}
      <header className="pt-2 px-1">
        <button
          onClick={() => navigate("/dashboard/ai-lab")}
          className="flex items-center gap-2 text-theme-muted hover:text-theme-primary transition mb-3"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back to AI Lab</span>
        </button>
        
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center">
            <CloudArrowUp size={22} weight="fill" className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-theme-primary">Cloud Sync</h1>
            <p className="text-theme-muted text-sm">Sync your notes across all your devices</p>
          </div>
        </div>
      </header>

      {/* Sync Status Card */}
      <GlassCard className="border-sky-500/30 bg-gradient-to-br from-sky-500/5 to-cyan-500/5">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isSyncing 
                ? "bg-gradient-to-br from-sky-500 to-cyan-600" 
                : syncEnabled 
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                  : "bg-gradient-to-br from-slate-500 to-slate-600"
            }`}>
              {isSyncing ? (
                <ArrowsClockwise size={24} weight="bold" className="text-white animate-spin" />
              ) : syncEnabled ? (
                <CloudCheck size={24} weight="fill" className="text-white" />
              ) : (
                <Pause size={24} weight="fill" className="text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-theme-primary">
                  {isSyncing ? "Syncing..." : syncEnabled ? "Sync Active" : "Sync Paused"}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  isSyncing 
                    ? "bg-sky-500/20 text-sky-400" 
                    : syncEnabled 
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-500/20 text-slate-400"
                }`}>
                  {isSyncing ? "IN PROGRESS" : syncEnabled ? "ENABLED" : "PAUSED"}
                </span>
              </div>
              <p className="text-sm text-theme-muted mt-0.5">
                {isSyncing 
                  ? `${syncProgress}% complete` 
                  : `Last synced ${formatTime(lastSyncTime)}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSyncEnabled(!syncEnabled)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm border transition ${
                syncEnabled 
                  ? "border-slate-500/30 text-slate-400 hover:bg-slate-500/10" 
                  : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              }`}
            >
              {syncEnabled ? <Pause size={16} /> : <Play size={16} />}
              {syncEnabled ? "Pause" : "Resume"}
            </button>
            <button
              onClick={handleSync}
              disabled={isSyncing || !syncEnabled}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-600 text-white font-medium text-sm shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowsClockwise size={16} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isSyncing && (
          <div className="mt-4">
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${syncProgress}%` }}
                transition={{ duration: 0.2 }}
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500"
              />
            </div>
          </div>
        )}
      </GlassCard>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center">
              <Desktop size={20} className="text-sky-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-theme-primary">{devices.length}</p>
              <p className="text-xs text-theme-muted">Devices</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
              <CloudCheck size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-theme-primary">
                {devices.filter(d => d.status === "synced" || d.status === "connected").length}
              </p>
              <p className="text-xs text-theme-muted">Synced</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
              <HardDrives size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-theme-primary">{storageUsed.total}</p>
              <p className="text-xs text-theme-muted">MB Used</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center">
              <Clock size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-theme-primary">{syncInterval}</p>
              <p className="text-xs text-theme-muted">Min Interval</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Devices Section */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-theme-primary">Connected Devices</h3>
          <button
            onClick={handleOpenAddDevice}
            className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition"
          >
            <Plus size={14} />
            Add Device
          </button>
        </div>

        <div className="space-y-3">
          {devices.map((device) => {
            const DeviceIcon = getDeviceIcon(device.type);
            return (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 rounded-xl border transition hover:bg-white/[0.02]"
                style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-input)" }}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    device.isCurrent ? "bg-sky-500/10 border border-sky-500/30" : "bg-white/5 border border-white/10"
                  }`}>
                    <DeviceIcon size={20} className={device.isCurrent ? "text-sky-400" : "text-theme-muted"} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-theme-primary">{device.name}</p>
                      {device.isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-medium">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-theme-muted">
                      {device.notesCount} notes • {device.documentsCount} docs • Last sync {formatTime(device.lastSync)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2 py-1 rounded-full border font-medium capitalize ${getStatusColor(device.status)}`}>
                    {device.status}
                  </span>
                  {!device.isCurrent && (
                    <button
                      onClick={() => handleRemoveDevice(device.id)}
                      className="h-8 w-8 rounded-full flex items-center justify-center text-theme-muted hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Storage & Settings Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Storage Usage */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-theme-primary">Cloud Storage</h3>
            <span className="text-xs text-theme-muted">
              {storageUsed.total} MB / {storageUsed.limit} MB
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(storageUsed.total / storageUsed.limit) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500"
                />
              </div>
              <p className="text-xs text-theme-muted mt-2">
                {((storageUsed.total / storageUsed.limit) * 100).toFixed(1)}% used
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-surface)" }}>
                <p className="text-xs text-theme-muted">Notes</p>
                <p className="text-lg font-semibold text-theme-primary">{storageUsed.notes} MB</p>
              </div>
              <div className="p-3 rounded-xl border" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-surface)" }}>
                <p className="text-xs text-theme-muted">Documents</p>
                <p className="text-lg font-semibold text-theme-primary">{storageUsed.documents} MB</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Sync Settings */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-theme-primary">Sync Settings</h3>
            <button
              onClick={() => setShowSettings(true)}
              className="h-8 w-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-primary hover:bg-white/5 transition"
            >
              <Gear size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Auto Sync Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-surface)" }}>
              <div>
                <p className="text-sm text-theme-primary">Auto Sync</p>
                <p className="text-xs text-theme-muted">Automatically sync changes</p>
              </div>
              <Toggle enabled={autoSync} onChange={setAutoSync} />
            </div>

            {/* Sync Interval */}
            <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-surface)" }}>
              <div>
                <p className="text-sm text-theme-primary">Sync Interval</p>
                <p className="text-xs text-theme-muted">How often to check for changes</p>
              </div>
              <select
                value={syncInterval}
                onChange={(e) => setSyncInterval(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm text-theme-primary border outline-none cursor-pointer"
                style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)" }}
              >
                <option value="5">5 min</option>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="60">1 hour</option>
              </select>
            </div>

            {/* WiFi Only Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-surface)" }}>
              <div className="flex items-center gap-2">
                {wifiOnly ? (
                  <WifiHigh size={16} className="text-sky-400" />
                ) : (
                  <WifiSlash size={16} className="text-theme-muted" />
                )}
                <div>
                  <p className="text-sm text-theme-primary">Sync on WiFi Only</p>
                  <p className="text-xs text-theme-muted">Save mobile data</p>
                </div>
              </div>
              <Toggle enabled={wifiOnly} onChange={setWifiOnly} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Sync History */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-theme-primary">Recent Activity</h3>
          <button className="text-xs text-theme-muted hover:text-theme-secondary transition">
            View All
          </button>
        </div>

        <div className="space-y-2">
          {syncHistory.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-xl border transition hover:bg-white/[0.02]"
              style={{ borderColor: "var(--border-secondary)", backgroundColor: "var(--bg-surface)" }}
            >
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  item.status === "success" 
                    ? "bg-emerald-500/10" 
                    : item.status === "warning"
                      ? "bg-amber-500/10"
                      : "bg-rose-500/10"
                }`}>
                  {item.status === "success" ? (
                    <CheckCircle size={16} weight="fill" className="text-emerald-400" />
                  ) : item.status === "warning" ? (
                    <Warning size={16} weight="fill" className="text-amber-400" />
                  ) : (
                    <FiX size={16} className="text-rose-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-theme-primary">{item.action}</p>
                  <p className="text-xs text-theme-muted">{item.device}</p>
                </div>
              </div>
              <span className="text-xs text-theme-muted">{formatTime(item.time)}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Add Device Modal */}
      <AnimatePresence>
        {showAddDevice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowAddDevice(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6 border"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-secondary)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-theme-primary">Add New Device</h2>
                <button
                  onClick={() => setShowAddDevice(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-primary transition"
                  style={{ backgroundColor: "var(--bg-tertiary)" }}
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="text-center py-4">
                <div className="h-16 w-16 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center mx-auto mb-4">
                  <CloudArrowDown size={32} className="text-sky-400" />
                </div>
                <h3 className="text-lg font-semibold text-theme-primary mb-2">Scan QR Code</h3>
                <p className="text-sm text-theme-muted mb-6">
                  Open NoteStream on your other device and scan this code to connect.
                </p>
                
                {/* QR Code */}
                <div className="flex justify-center mb-4">
                  <QRCode value={`notestream://pair/${deviceCode}`} size={192} />
                </div>

                {/* Device Code */}
                <div className="mb-4">
                  <p className="text-xs text-theme-muted mb-2">Or enter this code manually:</p>
                  <div 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-lg tracking-widest"
                    style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-secondary)" }}
                  >
                    <span className="text-theme-primary">{deviceCode.slice(0, 4)}</span>
                    <span className="text-theme-muted">-</span>
                    <span className="text-theme-primary">{deviceCode.slice(4)}</span>
                  </div>
                </div>

                {/* Expiry Timer */}
                <div className="flex items-center justify-center gap-2 text-xs text-theme-muted">
                  <Clock size={14} />
                  <span>
                    Code expires in{" "}
                    <span className={`font-medium ${qrExpiry < 60 ? "text-amber-400" : "text-sky-400"}`}>
                      {formatExpiry(qrExpiry)}
                    </span>
                  </span>
                </div>

                {qrExpiry < 60 && (
                  <button
                    onClick={() => {
                      setDeviceCode(generateDeviceCode());
                      setQrExpiry(300);
                    }}
                    className="mt-3 text-xs text-sky-400 hover:text-sky-300 transition"
                  >
                    Generate new code
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowAddDevice(false)}
                className="w-full py-3 rounded-xl border text-theme-secondary font-medium text-sm hover:bg-white/5 transition mt-4"
                style={{ borderColor: "var(--border-secondary)" }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}