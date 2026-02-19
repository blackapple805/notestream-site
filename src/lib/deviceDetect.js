// src/lib/deviceDetect.js
// ═══════════════════════════════════════════════════════════════
// Detects current device info from browser APIs.
// Used by CloudSync to register/update the current device in DB.
// ═══════════════════════════════════════════════════════════════

/**
 * Parse the browser name + version from userAgent.
 */
function parseBrowser(ua) {
  // Order matters — check specific browsers before generic ones
  const browsers = [
    { name: "Edge",    regex: /Edg(?:e|A|iOS)?\/(\d+)/ },
    { name: "Opera",   regex: /(?:OPR|Opera)\/(\d+)/ },
    { name: "Brave",   regex: /Brave\/(\d+)/ },       // only in some builds
    { name: "Vivaldi", regex: /Vivaldi\/(\d+(?:\.\d+)?)/ },
    { name: "Samsung",  regex: /SamsungBrowser\/(\d+)/ },
    { name: "Firefox",  regex: /Firefox\/(\d+)/ },
    { name: "Safari",   regex: /Version\/(\d+(?:\.\d+)?).*Safari/ },
    { name: "Chrome",   regex: /Chrome\/(\d+)/ },       // must be after Edge/Opera/Samsung
  ];

  for (const b of browsers) {
    const m = ua.match(b.regex);
    if (m) return { name: b.name, version: m[1] };
  }

  return { name: "Unknown", version: "" };
}

/**
 * Parse the OS name + version from userAgent + navigator.platform.
 */
function parseOS(ua) {
  // iOS
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    const m = ua.match(/OS (\d+[_\d]*)/);
    const ver = m ? m[1].replace(/_/g, ".") : "";
    return { name: "iOS", version: ver };
  }

  // Android
  if (/Android/.test(ua)) {
    const m = ua.match(/Android (\d+(?:\.\d+)?)/);
    return { name: "Android", version: m ? m[1] : "" };
  }

  // macOS
  if (/Mac OS X/.test(ua)) {
    const m = ua.match(/Mac OS X (\d+[_.\d]*)/);
    const ver = m ? m[1].replace(/_/g, ".") : "";
    // Map major versions to marketing names
    const major = parseInt(ver);
    let label = "macOS";
    if (major >= 15) label = "macOS Sequoia";
    else if (major >= 14) label = "macOS Sonoma";
    else if (major >= 13) label = "macOS Ventura";
    else if (major >= 12) label = "macOS Monterey";
    return { name: label, version: ver };
  }

  // Windows
  if (/Windows/.test(ua)) {
    const m = ua.match(/Windows NT (\d+\.\d+)/);
    if (m) {
      const ntVer = m[1];
      const winMap = {
        "10.0": "Windows 10/11",
        "6.3": "Windows 8.1",
        "6.2": "Windows 8",
        "6.1": "Windows 7",
      };
      return { name: winMap[ntVer] || "Windows", version: "" };
    }
    return { name: "Windows", version: "" };
  }

  // Chrome OS
  if (/CrOS/.test(ua)) return { name: "Chrome OS", version: "" };

  // Linux
  if (/Linux/.test(ua)) return { name: "Linux", version: "" };

  return { name: "Unknown OS", version: "" };
}

/**
 * Determine device type: "mobile" | "tablet" | "desktop"
 */
function detectType(ua) {
  // iPad with desktop UA (iPadOS 13+)
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return "tablet";

  // Tablets first (before mobile, since some tablets have "Mobile" in UA)
  if (/iPad|tablet|playbook|silk/i.test(ua)) return "tablet";
  if (/Android/.test(ua) && !/Mobile/.test(ua)) return "tablet";

  // Mobile
  if (/Mobile|iPhone|iPod|Android.*Mobile|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua)) return "mobile";

  return "desktop";
}

/**
 * Build a stable fingerprint for device deduplication.
 * NOT a tracking fingerprint — just enough to recognise
 * "same browser on same device" so we don't duplicate rows.
 */
function buildFingerprint() {
  const parts = [
    navigator.userAgent,
    navigator.platform || "",
    navigator.language || "",
    `${screen.width}x${screen.height}`,
    `${screen.colorDepth || ""}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  ];

  // Simple hash (djb2)
  const str = parts.join("|");
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return hash.toString(36);
}

/**
 * Build a short, friendly device name like "Windows PC", "iPhone", "MacBook"
 * The browser/OS details are shown separately in the UI.
 */
function buildDeviceName(browser, os, type) {
  const ua = navigator.userAgent;

  // Mobile devices — use device model when possible
  if (type === "mobile") {
    if (/iPhone/.test(ua)) return "iPhone";
    const android = ua.match(/;\s*([^;)]+)\s*Build\//);
    if (android) {
      const model = android[1].trim();
      // Clean up verbose model strings like "SM-S918B" → keep as-is (recognizable)
      // But shorten "SAMSUNG SM-..." → just the model
      return model.replace(/^SAMSUNG\s+/i, "");
    }
    if (/Android/.test(ua)) return "Android Phone";
    return "Mobile Device";
  }

  // Tablets
  if (type === "tablet") {
    if (/iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iPad";
    if (/Android/.test(ua)) return "Android Tablet";
    return "Tablet";
  }

  // Desktop — use OS to pick a friendly name
  if (/Mac OS X/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/CrOS/.test(ua)) return "Chromebook";
  if (/Linux/.test(ua)) return "Linux PC";

  return `${browser.name} Desktop`;
}

/**
 * Main export: returns all device info for the current browser session.
 */
export function detectDevice() {
  const ua = navigator.userAgent;
  const browser = parseBrowser(ua);
  const os = parseOS(ua);
  const type = detectType(ua);
  const fingerprint = buildFingerprint();
  const name = buildDeviceName(browser, os, type);

  return {
    deviceName: name,
    deviceType: type,           // "desktop" | "mobile" | "tablet"
    browser: browser.version ? `${browser.name} ${browser.version}` : browser.name,
    os: os.version ? `${os.name} ${os.version}` : os.name,
    fingerprint,
    screenSize: `${screen.width}x${screen.height}`,
  };
}