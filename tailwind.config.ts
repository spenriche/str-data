import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light "surface" scale. Names kept as `ink` so existing utility
        // classes (bg-ink-900, border-ink-700, text-ink-600 …) flip to light.
        ink: {
          950: "#eef2f7", // subtle inset / detail background
          900: "#ffffff", // cards, dropdowns, table head
          800: "#f1f5f9", // chips, inputs, row hover
          700: "#e2e8f0", // borders, dividers
          600: "#64748b", // muted text & strong borders
        },
        accent: {
          DEFAULT: "#3b82f6",
          emerald: "#10b981",
          rose: "#f43f5e",
          amber: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
