import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Fix mobile viewport units
const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
};

setViewportHeight();
window.addEventListener("resize", setViewportHeight);

// ThemeProvider lives inside App.jsx so it can be wrapped alongside the other
// app-level providers (Subscription, Workspace, Integrations). Wrapping it
// again here would just nest a second provider for no benefit.
ReactDOM.createRoot(document.getElementById("root")).render(<App />);

// Reveal the body only AFTER:
//   1) React has kicked off its first render, AND
//   2) the web fonts have actually loaded (or a 1.5s timeout fires).
// This pairs with the `html:not(.theme-ready) body { visibility: hidden }`
// rule in index.html. Waiting for `document.fonts.ready` eliminates the
// fallback-font → web-font swap that was causing letters to flash and
// the layout to jump on first load. The timeout is a safety net so the
// page never hangs if the font CDN is slow or unreachable.
function revealApp() {
  document.documentElement.classList.add("theme-ready");
}

const fontsReady =
  typeof document !== "undefined" && document.fonts && document.fonts.ready
    ? document.fonts.ready
    : Promise.resolve();

let revealed = false;
const reveal = () => {
  if (revealed) return;
  revealed = true;
  // One frame after fonts are ready so the browser can lay out with the
  // real font metrics before we make anything visible.
  requestAnimationFrame(revealApp);
};

fontsReady.then(reveal).catch(reveal);
// Safety net: never leave the page hidden for more than 1.5s.
setTimeout(reveal, 1500);
