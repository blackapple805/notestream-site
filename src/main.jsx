import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { NextUIProvider } from "@nextui-org/react";

// Set CSS viewport height variable for accurate mobile heights
// Accounts for browser chrome (address bar, tabs, etc.)
const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

// Set on initial load
setViewportHeight();

// Update on resize and orientation change
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);

// iOS-specific: Update after layout settles
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
  window.addEventListener('load', () => {
    setTimeout(setViewportHeight, 100);
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <NextUIProvider>
      <App />
    </NextUIProvider>
  </React.StrictMode>
);
