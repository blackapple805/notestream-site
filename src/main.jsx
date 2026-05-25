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
