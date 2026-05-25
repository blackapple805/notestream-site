// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ESM doesn't have __dirname; derive it from import.meta.url.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command, mode }) => {
  // Keep your base as-is
  const base = "/";

  // Only enable local HTTPS for dev server (vite serve), never for build
  const enableLocalHttps = command === "serve" && mode === "development";

  let https = false;

  if (enableLocalHttps) {
    const keyPath = path.resolve(__dirname, ".certs/localhost-key.pem");
    const certPath = path.resolve(__dirname, ".certs/localhost.pem");

    // Prevent Vercel/CI crash: only read files if they exist
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      https = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
    } else {
      https = false; // fallback to http locally if certs aren't present
    }
  }

  return {
    plugins: [react()],
    base,
    server: {
      https,
      host: "localhost",
      port: 5173,
    },
    build: {
      // Split big third-party libs into their own chunks so browsers cache
      // them independently of your app code. When you ship a code change,
      // users don't re-download framer-motion or recharts.
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "framer-motion": ["framer-motion"],
            "recharts": ["recharts"],
            "supabase": ["@supabase/supabase-js"],
            "icons": ["@phosphor-icons/react", "react-icons"],
          },
        },
      },
    },
  };
});
