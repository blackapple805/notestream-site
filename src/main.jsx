import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider } from "./context/ThemeContext.jsx";

// Fix mobile viewport units
const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
};

setViewportHeight();
window.addEventListener("resize", setViewportHeight);

ReactDOM.createRoot(document.getElementById("root")).render(
  <NextUIProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </NextUIProvider>
);
