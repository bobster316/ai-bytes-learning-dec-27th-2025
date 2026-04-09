import type { Config } from "tailwindcss";
import typography from '@tailwindcss/typography';

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background-default)",
        "background-subtle": "var(--background-subtle)",
        "background-card": "var(--background-card)",
        "background-inverse": "var(--background-inverse)",

        foreground: "var(--foreground-default)",
        "foreground-subtle": "var(--foreground-subtle)",
        "foreground-inverse": "var(--foreground-inverse)",

        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        "primary-glow": "var(--primary-glow)",

        border: "var(--border-default)",

        // Shorthand aliases for common usage
        card: "var(--background-card)",
        obsidian: "var(--obsidian)",
      },
      fontFamily: {
        sans: ["Arial", "sans-serif"],
        mono: ["Consolas", "Courier New", "monospace"],
        display: ["Arial Black", "Arial", "sans-serif"],
        body: ["Arial", "sans-serif"],
      },
      keyframes: {
        "gradient-x": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
      },
      animation: {
        "gradient-x": "gradient-x 15s ease infinite",
      },
    },
  },
  plugins: [
    typography,
  ],
};

export default config;
