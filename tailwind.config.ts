import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#141414",
        "surface-hover": "#1A1A1A",
        border: "#2A2A2A",
        "accent-gold": "#C8A96E",
        "accent-bone": "#E8E8E8",
        positive: "#4ADE80",
        negative: "#F87171",
        "text-primary": "#F5F5F5",
        "text-secondary": "#9CA3AF",
      },
      fontFamily: {
        heading: ["Playfair Display", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderColor: {
        DEFAULT: "#2A2A2A",
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(200,169,110,0.3), 0 4px 24px rgba(200,169,110,0.08)",
        "gold-sm": "0 0 0 1px rgba(200,169,110,0.2)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
