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
        background:       "#EFF2F6",
        surface:          "#FFFFFF",
        "surface-hover":  "#F8FAFB",
        border:           "#E3E8EF",
        "accent-gold":    "#00C896",   // mint neon (mantiene el nombre para no tocar componentes)
        "accent-bone":    "#0A1628",   // dark text (antes era bone claro)
        "accent-mint":    "#00C896",
        "accent-mint-2":  "#00A87A",
        "accent-mint-light": "#E6FAF5",
        positive:         "#00B87A",
        negative:         "#F5425A",
        "text-primary":   "#0A1628",
        "text-secondary": "#4A5568",
        "text-tertiary":  "#94A3B8",
      },
      fontFamily: {
        heading: ["Inter", "system-ui", "sans-serif"],
        body:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
      borderColor: {
        DEFAULT: "#E3E8EF",
      },
      boxShadow: {
        gold:    "0 4px 16px rgba(0,0,0,.07), 0 1px 4px rgba(0,0,0,.04)",
        "gold-sm": "0 1px 3px rgba(0,0,0,.06)",
        card:    "0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)",
        "card-hover": "0 4px 16px rgba(0,0,0,.09), 0 1px 4px rgba(0,0,0,.05)",
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
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
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fadeIn 0.25s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
