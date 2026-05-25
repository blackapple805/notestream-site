/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Fraunces", "Tiempos Headline", "Georgia", "serif"],
        sans:  ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono:  ["JetBrains Mono", "SF Mono", "Menlo", "monospace"],
      },
      colors: {
        // Editorial palette — also available as utility classes
        paper: {
          50:  "#FDFCF9",
          100: "#FAFAF7",
          200: "#F4F2EC",
          300: "#E8E5DC",
          400: "#D4D0C4",
          500: "#A8A398",
        },
        ink: {
          300: "#8B8478",
          400: "#6B655C",
          500: "#4A4640",
          700: "#2C2A26",
          900: "#1A1815",
        },
        ember: {
          50:  "#FFF7ED",
          100: "#FED7AA",
          500: "#EA580C",
          600: "#C2410C",
        },
      },
      letterSpacing: {
        tightest: "-0.03em",
        tighter:  "-0.02em",
        tight:    "-0.01em",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(26, 24, 21, 0.04)",
        md: "0 4px 12px rgba(26, 24, 21, 0.06), 0 1px 3px rgba(26, 24, 21, 0.04)",
        lg: "0 12px 32px rgba(26, 24, 21, 0.08), 0 4px 8px rgba(26, 24, 21, 0.04)",
        xl: "0 24px 64px rgba(26, 24, 21, 0.10), 0 8px 16px rgba(26, 24, 21, 0.04)",
      },
      maxWidth: {
        prose:   "680px",
        narrow:  "880px",
        wide:    "1200px",
      },
    },
  },
  plugins: [],
};
