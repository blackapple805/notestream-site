// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Initialize theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("notestream-theme");
    if (savedTheme) return savedTheme;
    
    // Check system preference if set to 'system' or no preference saved
    if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "system"; // Will resolve to light
    }
    return "dark";
  });

  // Get the actual applied theme (resolves 'system' to actual theme)
  const resolvedTheme = theme === "system" 
    ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : theme;

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove("light", "dark");
    
    // Add the resolved theme class
    root.classList.add(resolvedTheme);
    
    // Also set a data attribute for CSS targeting
    root.setAttribute("data-theme", resolvedTheme);
    
    // Save to localStorage
    localStorage.setItem("notestream-theme", theme);
  }, [theme, resolvedTheme]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    
    const handleChange = () => {
      // Force re-render to update resolvedTheme
      setTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const value = {
    theme,           // The selected theme ('light', 'dark', 'system')
    resolvedTheme,   // The actual applied theme ('light' or 'dark')
    setTheme,        // Function to change theme
    isDark: resolvedTheme === "dark",
    isLight: resolvedTheme === "light",
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeContext;