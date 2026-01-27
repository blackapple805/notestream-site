// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

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
  };
});
