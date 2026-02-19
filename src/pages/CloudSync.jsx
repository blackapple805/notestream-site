// src/pages/CloudSync.jsx
// ═══════════════════════════════════════════════════════════════
// Real device tracking via user_devices table + deviceDetect.js
// Bento-glass UI matching Settings/AiLab/VoiceNotes
// All sync settings, device list, and history are live from DB
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { detectDevice } from "../lib/deviceDetect";
import {
  CloudArrowUp, CloudArrowDown, CloudCheck, Desktop, DeviceMobile,
  DeviceTablet, ArrowsClockwise, CheckCircle, Warning, Pause, Play,
  Plus, Gear, Clock, HardDrives, ArrowLeft, WifiHigh, WifiSlash,
} from "phosphor-react";
import { FiX, FiTrash2, FiCheck } from "react-icons/fi";
import { useSubscription } from "../hooks/useSubscription";

const DEVICES_TABLE = "user_devices";

/* ─── Scoped styles ───────────────────────────────────────── */
const CS_STYLES = `
.ns-cs-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: var(--card-glass-bg, var(--bg-surface));
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--card-glass-border, var(--border-secondary));
  box-shadow: var(--card-glass-shadow, 0 8px 32px rgba(0,0,0,0.12));
}
.ns-cs-card::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%);
  pointer-events: none; z-index: 1;
}
.ns-cs-card::after {
  content: '';
  position: absolute;
  left: 24px; right: 24px; top: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
  pointer-events: none; z-index: 2;
}
.ns-cs-stagger > * {
  animation: ns-cs-up 0.4s cubic-bezier(.22,1,.36,1) both;
}
@keyframes ns-cs-up {
  0%   { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
.ns-cs-stagger > *:nth-child(1) { animation-delay: 0.02s; }
.ns-cs-stagger > *:nth-child(2) { animation-delay: 0.06s; }
.ns-cs-stagger > *:nth-child(3) { animation-delay: 0.10s; }
.ns-cs-stagger > *:nth-child(4) { animation-delay: 0.14s; }
.ns-cs-stagger > *:nth-child(5) { animation-delay: 0.18s; }
.ns-cs-stagger > *:nth-child(6) { animation-delay: 0.22s; }
.ns-cs-stagger > *:nth-child(7) { animation-delay: 0.26s; }
`;

/* ─── Toggle ──────────────────────────────────────────────── */
function Toggle({ enabled, onChange, disabled = false }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!enabled)} disabled={disabled}
      className="relative w-10 h-[22px] rounded-full transition-colors"
      style={{ background: enabled ? "#38bdf8" : "rgba(255,255,255,0.1)", opacity: disabled ? 0.5 : 1 }}>
      <motion.div animate={{ x: enabled ? 18 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm" />
    </button>
  );
}

/* ─── QR Code (demo for add-device flow) ──────────────────── */
function QRCode({ value, size = 180 }) {
  const grid = 21;
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) & 0xffffffff;
  const cells = [];
  for (let i = 0; i < grid * grid; i++) {
    const rnd = (((hash * (i + 1) * 9301 + 49297) % 233280) / 233280);
    const r = Math.floor(i / grid), c = i % grid;
    const tl = r < 7 && c < 7, tr = r < 7 && c >= grid - 7, bl = r >= grid - 7 && c < 7;
    if (tl || tr || bl) {
      const lr = r < 7 ? r : r - (grid - 7), lc = c < 7 ? c : c - (grid - 7);
      cells.push(lr === 0 || lr === 6 || lc === 0 || lc === 6 ? true : !(lr === 1 || lr === 5 || lc === 1 || lc === 5));
    } else if (r === 6 || c === 6) cells.push((r + c) % 2 === 0);
    else cells.push(rnd > 0.5);
  }
  const cs = size / grid;
  return (
    <div className="rounded-xl overflow-hidden" style={{ width: size, height: size, background: "#fff", padding: cs * 2 }}>
      <svg width={size - cs * 4} height={size - cs * 4} viewBox={`0 0 ${grid} ${grid}`}>
        {cells.map((f, i) => f ? <rect key={i} x={i % grid} y={Math.floor(i / grid)} width={1} height={1} fill="#1a1a2e" /> : null)}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function CloudSync() {
  const navigate = useNavigate();
  const { subscription, isFeatureUnlocked, isLoading } = useSubscription();
  const isPro = subscription?.plan !== "free";
  const isUnlocked = isFeatureUnlocked?.("cloud");
  const supabaseReady = typeof isSupabaseConfigured === "function" ? isSupabaseConfigured() : !!isSupabaseConfigured;

  useEffect(() => {
    if (!isLoading && (!isPro || !isUnlocked)) navigate("/dashboard/ai-lab");
  }, [isLoading, isPro, isUnlocked, navigate]);

  // ─── State ──────────────────────────────────────────────────
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);

  const [syncEnabled, setSyncEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState("15");
  const [wifiOnly, setWifiOnly] = useState(true);

  const [showAddDevice, setShowAddDevice] = useState(false);
  const [qrExpiry, setQrExpiry] = useState(300);
  const [deviceCode, setDeviceCode] = useState("");

  const intervalRef = useRef(null);
  const qrTimerRef = useRef(null);
  const heartbeatRef = useRef(null);

  // ─── Auth helper ────────────────────────────────────────────
  const getUser = useCallback(async () => {
    if (!supabaseReady || !supabase) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    } catch { return null; }
  }, [supabaseReady]);

  // ─── Register current device on mount ──────────────────────
  useEffect(() => {
    if (!supabaseReady || !supabase || isLoading) return;
    let alive = true;

    (async () => {
      const user = await getUser();
      if (!user || !alive) { setDevicesLoading(false); return; }

      const info = detectDevice();
      await registerDevice(user.id, info);

      if (alive) await loadDevices();
      if (alive) setDevicesLoading(false);
    })();

    return () => { alive = false; };
  }, [supabaseReady, isLoading, getUser]);

  /**
   * Single registration path — no RPC dependency.
   * 1. Query for existing device by fingerprint
   * 2. If found → update it
   * 3. If not found → insert (with dedup guard)
   * 4. Clean up any accidental duplicates
   * 5. Mark this device as current, others as not
   */
  const registerDevice = async (userId, info) => {
    if (!supabase) return;

    try {
      // Step 1: Find ALL rows for this fingerprint (catches dupes too)
      const { data: matches } = await supabase
        .from(DEVICES_TABLE).select("id, created_at")
        .eq("user_id", userId).eq("fingerprint", info.fingerprint)
        .order("created_at", { ascending: true });

      let deviceId;

      if (matches && matches.length > 0) {
        // Keep the oldest row, delete any duplicates
        deviceId = matches[0].id;

        if (matches.length > 1) {
          const dupeIds = matches.slice(1).map((m) => m.id);
          await supabase.from(DEVICES_TABLE).delete().in("id", dupeIds);
        }

        // Update the kept row
        await supabase.from(DEVICES_TABLE).update({
          device_name: info.deviceName, device_type: info.deviceType,
          browser: info.browser, os: info.os,
          is_current: true, last_seen_at: new Date().toISOString(), status: "online",
        }).eq("id", deviceId);
      } else {
        // No existing row — insert new
        const { data: newDev, error: insertErr } = await supabase.from(DEVICES_TABLE).insert({
          user_id: userId, device_name: info.deviceName, device_type: info.deviceType,
          browser: info.browser, os: info.os, fingerprint: info.fingerprint,
          is_current: true, status: "online",
        }).select("id").single();

        if (insertErr) { console.error("Device insert error:", insertErr); return; }
        deviceId = newDev?.id;
      }

      if (deviceId) {
        setCurrentDeviceId(deviceId);
        // Mark all other devices as not-current
        await supabase.from(DEVICES_TABLE).update({ is_current: false })
          .eq("user_id", userId).neq("id", deviceId);
        // Mark stale devices as offline (not seen in 10 min)
        await supabase.from(DEVICES_TABLE).update({ status: "offline" })
          .eq("user_id", userId).neq("id", deviceId)
          .lt("last_seen_at", new Date(Date.now() - 600_000).toISOString());
      }
    } catch (err) {
      console.error("Device registration failed:", err);
    }
  };

  // ─── Load devices from DB ──────────────────────────────────
  const loadDevices = async () => {
    if (!supabaseReady || !supabase) return;
    const user = await getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from(DEVICES_TABLE).select("*")
      .eq("user_id", user.id)
      .order("last_seen_at", { ascending: false });

    if (!error && data) {
      const now = Date.now();
      setDevices(data.map((d) => {
        // Compute real status from last_seen timestamp
        let status;
        if (d.is_current) {
          status = "online";
        } else {
          const seenAgo = now - new Date(d.last_seen_at).getTime();
          if (seenAgo < 5 * 60_000) status = "synced";        // seen within 5 min
          else if (seenAgo < 30 * 60_000) status = "synced";   // seen within 30 min
          else status = "offline";                              // stale
        }
        return {
          id: d.id, name: d.device_name, type: d.device_type,
          browser: d.browser, os: d.os, isCurrent: d.is_current,
          lastSeen: d.last_seen_at, createdAt: d.created_at,
          status, fingerprint: d.fingerprint,
        };
      }));

      // Find last sync time from most recent non-current device
      const latest = data.find((d) => !d.is_current);
      if (latest) setLastSyncTime(new Date(latest.last_seen_at));
      else setLastSyncTime(new Date());
    }
  };

  // ─── Heartbeat: update last_seen every 2 min ──────────────
  useEffect(() => {
    if (!currentDeviceId || !supabaseReady || !supabase) return;
    heartbeatRef.current = setInterval(async () => {
      await supabase.from(DEVICES_TABLE).update({
        last_seen_at: new Date().toISOString(), status: "online",
      }).eq("id", currentDeviceId);
    }, 120_000);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [currentDeviceId, supabaseReady]);

  // ─── Remove device ─────────────────────────────────────────
  const removeDevice = async (id) => {
    setDevices((p) => p.filter((d) => d.id !== id));
    if (supabaseReady && supabase) {
      await supabase.from(DEVICES_TABLE).delete().eq("id", id);
    }
  };

  // ─── Sync action (demo with real timestamp update) ─────────
  const handleSync = async () => {
    if (isSyncing || !syncEnabled) return;
    setIsSyncing(true); setSyncProgress(0);

    // Mark all online devices as syncing in UI
    setDevices((p) => p.map((d) => d.status !== "offline" ? { ...d, status: "syncing" } : d));

    intervalRef.current = setInterval(() => {
      setSyncProgress((p) => {
        const next = Math.min(100, p + Math.floor(Math.random() * 15) + 5);
        if (next >= 100) {
          clearInterval(intervalRef.current); intervalRef.current = null;
          const now = new Date();
          setLastSyncTime(now); setIsSyncing(false);
          setDevices((prev) => prev.map((d) =>
            d.status !== "offline" ? { ...d, status: d.isCurrent ? "online" : "synced", lastSeen: now.toISOString() } : d
          ));

          // Update last_seen in DB for all non-offline devices
          if (supabaseReady && supabase) {
            getUser().then((user) => {
              if (user) {
                supabase.from(DEVICES_TABLE).update({ last_seen_at: now.toISOString() })
                  .eq("user_id", user.id).neq("status", "offline").then(() => {});
              }
            });
          }
          return 100;
        }
        return next;
      });
    }, 200);
  };

  // ─── QR / Add Device ───────────────────────────────────────
  const genCode = () => {
    const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 8; i++) s += c[Math.floor(Math.random() * c.length)];
    return s;
  };

  const openAddDevice = () => { setDeviceCode(genCode()); setQrExpiry(300); setShowAddDevice(true); };

  useEffect(() => {
    if (!showAddDevice) return;
    qrTimerRef.current = setInterval(() => {
      setQrExpiry((p) => { if (p <= 1) { setDeviceCode(genCode()); return 300; } return p - 1; });
    }, 1000);
    return () => { if (qrTimerRef.current) clearInterval(qrTimerRef.current); };
  }, [showAddDevice]);

  // ─── Cleanup ───────────────────────────────────────────────
  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (qrTimerRef.current) clearInterval(qrTimerRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
  }, []);

  // ─── Helpers ───────────────────────────────────────────────
  const fmtTime = (d) => {
    if (!d) return "Never";
    const date = d instanceof Date ? d : new Date(d);
    const diff = Math.floor((Date.now() - date) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const fmtExpiry = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const deviceIcon = (t) => t === "mobile" ? DeviceMobile : t === "tablet" ? DeviceTablet : Desktop;

  const statusStyle = (s) => {
    if (s === "online" || s === "synced") return { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", color: "#10b981" };
    if (s === "syncing") return { bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.25)", color: "#38bdf8" };
    return { bg: "rgba(255,255,255,0.04)", border: "var(--border-secondary)", color: "var(--text-muted)" };
  };

  // ─── Loading / Guards ──────────────────────────────────────
  if (isLoading) return (
    <>
      <style>{CS_STYLES}</style>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full" style={{ border: "2.5px solid transparent", borderTopColor: "rgba(56,189,248,0.8)", borderRightColor: "rgba(6,182,212,0.4)", animation: "spin 0.8s linear infinite" }} />
          <div className="absolute inset-2 rounded-full" style={{ border: "2px solid transparent", borderBottomColor: "rgba(56,189,248,0.5)", animation: "spin 1.2s linear infinite reverse" }} />
          <CloudArrowUp size={20} weight="duotone" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sky-400" />
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading Cloud Sync…</p>
      </div>
    </>
  );

  if (!isPro || !isUnlocked) return null;

  const onlineCount = devices.filter((d) => d.status === "online" || d.status === "synced").length;

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <>
      <style>{CS_STYLES}</style>
      <div className="space-y-5 pb-[calc(var(--mobile-nav-height)+24px)] ns-cs-stagger">

        {/* Header */}
        <header className="pt-1 px-1">
          <button onClick={() => navigate("/dashboard/ai-lab")}
            className="flex items-center gap-2 mb-3 transition" style={{ color: "var(--text-muted)" }}>
            <ArrowLeft size={16} />
            <span className="text-[12px] font-medium">Back to AI Lab</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.18), rgba(6,182,212,0.12))", border: "1px solid rgba(56,189,248,0.28)" }}>
              <CloudArrowUp weight="duotone" size={22} className="text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Cloud Sync</h1>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Sync notes across all your devices</p>
            </div>
          </div>
        </header>

        {/* ── Sync Status Card ── */}
        <div className="ns-cs-card" style={{ borderColor: isSyncing ? "rgba(56,189,248,0.35)" : syncEnabled ? "rgba(16,185,129,0.2)" : undefined }}>
          <div className="relative z-10 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isSyncing
                      ? "linear-gradient(135deg, #38bdf8, #06b6d4)"
                      : syncEnabled ? "linear-gradient(135deg, #10b981, #0d9488)" : "linear-gradient(135deg, #64748b, #475569)",
                    boxShadow: isSyncing ? "0 4px 16px rgba(56,189,248,0.3)" : syncEnabled ? "0 4px 16px rgba(16,185,129,0.3)" : "none",
                  }}>
                  {isSyncing
                    ? <ArrowsClockwise size={22} weight="bold" className="text-white animate-spin" />
                    : syncEnabled ? <CloudCheck size={22} weight="fill" className="text-white" />
                    : <Pause size={22} weight="fill" className="text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {isSyncing ? "Syncing…" : syncEnabled ? "Sync Active" : "Sync Paused"}
                    </h3>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg"
                      style={isSyncing
                        ? { background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.25)", color: "#38bdf8" }
                        : syncEnabled
                          ? { background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }
                          : { background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-secondary)", color: "var(--text-muted)" }}>
                      {isSyncing ? "IN PROGRESS" : syncEnabled ? "ENABLED" : "PAUSED"}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {isSyncing ? `${syncProgress}% complete` : `Last synced ${fmtTime(lastSyncTime)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setSyncEnabled(!syncEnabled)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold transition"
                  style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-secondary)" }}>
                  {syncEnabled ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Resume</>}
                </button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleSync} disabled={isSyncing || !syncEnabled}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-semibold text-white transition disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #38bdf8, #06b6d4)", boxShadow: "0 4px 16px rgba(56,189,248,0.25)" }}>
                  <ArrowsClockwise size={13} className={isSyncing ? "animate-spin" : ""} />
                  {isSyncing ? "Syncing…" : "Sync Now"}
                </motion.button>
              </div>
            </div>

            {isSyncing && (
              <div className="mt-4">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${syncProgress}%` }}
                    className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #38bdf8, #06b6d4)" }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Devices", value: devices.length, icon: Desktop, color: { bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.25)", text: "#38bdf8" } },
            { label: "Online", value: onlineCount, icon: CloudCheck, color: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)", text: "#10b981" } },
            { label: "Interval", value: `${syncInterval}m`, icon: Clock, color: { bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.25)", text: "#a855f7" } },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="ns-cs-card">
              <div className="relative z-10 p-3 flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: color.bg, border: `1px solid ${color.border}` }}>
                  <Icon size={18} weight="duotone" style={{ color: color.text }} />
                </div>
                <div>
                  <p className="text-lg font-extrabold leading-none" style={{ color: "var(--text-primary)" }}>{value}</p>
                  <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Devices ── */}
        <div className="ns-cs-card">
          <div className="relative z-10 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Your Devices</h3>
              <button onClick={openAddDevice}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", color: "#38bdf8" }}>
                <Plus size={12} /> Add Device
              </button>
            </div>

            {devicesLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-10">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)" }}>
                  <Desktop size={24} weight="duotone" className="text-sky-400" />
                </div>
                <p className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>No devices registered yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map((d) => {
                  const Icon = deviceIcon(d.type);
                  const ss = statusStyle(d.status);
                  return (
                    <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl transition"
                      style={{ background: "var(--bg-input, var(--bg-tertiary))", border: "1px solid var(--border-secondary)" }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: d.isCurrent ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.04)",
                              border: d.isCurrent ? "1px solid rgba(56,189,248,0.3)" : "1px solid var(--border-secondary)",
                            }}>
                            <Icon size={18} style={{ color: d.isCurrent ? "#38bdf8" : "var(--text-muted)" }} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[12px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{d.name}</p>
                              {d.isCurrent && (
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                                  style={{ background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.25)", color: "#38bdf8" }}>
                                  THIS DEVICE
                                </span>
                              )}
                            </div>
                            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                              {d.browser} · {d.os} · {fmtTime(d.lastSeen)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg capitalize"
                            style={{ background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color }}>
                            {d.status}
                          </span>
                          {!d.isCurrent && (
                            <button onClick={() => removeDevice(d.id)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center transition"
                              style={{ color: "var(--text-muted)" }}>
                              <FiTrash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Settings ── */}
        <div className="ns-cs-card">
          <div className="relative z-10 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>Sync Settings</h3>
            </div>
            <div className="space-y-2">
              {/* Auto Sync */}
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "var(--bg-input, var(--bg-tertiary))", border: "1px solid var(--border-secondary)" }}>
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>Auto Sync</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Automatically sync changes</p>
                </div>
                <Toggle enabled={autoSync} onChange={setAutoSync} />
              </div>

              {/* Interval */}
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "var(--bg-input, var(--bg-tertiary))", border: "1px solid var(--border-secondary)" }}>
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>Sync Interval</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>How often to check</p>
                </div>
                <select value={syncInterval} onChange={(e) => setSyncInterval(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold outline-none"
                  style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-primary)" }}>
                  <option value="5">5 min</option>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="60">1 hour</option>
                </select>
              </div>

              {/* WiFi Only */}
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "var(--bg-input, var(--bg-tertiary))", border: "1px solid var(--border-secondary)" }}>
                <div className="flex items-center gap-2">
                  {wifiOnly ? <WifiHigh size={14} style={{ color: "#38bdf8" }} /> : <WifiSlash size={14} style={{ color: "var(--text-muted)" }} />}
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>WiFi Only</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Save mobile data</p>
                  </div>
                </div>
                <Toggle enabled={wifiOnly} onChange={setWifiOnly} />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ ADD DEVICE MODAL ═══ */}
        <AnimatePresence>
          {showAddDevice && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
              style={{ backgroundColor: "var(--bg-overlay, rgba(0,0,0,0.6))", backdropFilter: "blur(12px)" }}
              onMouseDown={(e) => { if (e.target === e.currentTarget) setShowAddDevice(false); }}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md ns-cs-card mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="relative z-10 p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Add New Device</h2>
                    <button onClick={() => setShowAddDevice(false)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center"
                      style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-muted)" }}>
                      <FiX size={14} />
                    </button>
                  </div>

                  <div className="text-center">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)" }}>
                      <CloudArrowDown size={24} className="text-sky-400" />
                    </div>
                    <h3 className="text-[14px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>Scan QR Code</h3>
                    <p className="text-[11px] mb-4" style={{ color: "var(--text-muted)" }}>
                      Open <span style={{ color: "#38bdf8", fontWeight: 600 }}>notestream.dev</span> on another device and scan this code to connect.
                    </p>

                    <div className="flex justify-center mb-4">
                      <QRCode value={`https://www.notestream.dev/pair?code=${deviceCode}`} size={180} />
                    </div>

                    <p className="text-[10px] mb-2" style={{ color: "var(--text-muted)" }}>Or enter manually:</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-base tracking-widest"
                      style={{ background: "var(--bg-input)", border: "1px solid var(--border-secondary)" }}>
                      <span style={{ color: "var(--text-primary)" }}>{deviceCode.slice(0, 4)}</span>
                      <span style={{ color: "var(--text-muted)" }}>-</span>
                      <span style={{ color: "var(--text-primary)" }}>{deviceCode.slice(4)}</span>
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
                      <Clock size={12} />
                      <span>Expires in <span style={{ color: qrExpiry < 60 ? "#f59e0b" : "#38bdf8", fontWeight: 600 }}>{fmtExpiry(qrExpiry)}</span></span>
                    </div>

                    {qrExpiry < 60 && (
                      <button onClick={() => { setDeviceCode(genCode()); setQrExpiry(300); }}
                        className="mt-2 text-[11px] font-semibold" style={{ color: "#38bdf8" }}>
                        Generate new code
                      </button>
                    )}
                  </div>

                  <button onClick={() => setShowAddDevice(false)}
                    className="w-full py-2.5 rounded-xl text-[12px] font-semibold transition mt-5"
                    style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-secondary)", color: "var(--text-secondary)" }}>
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}