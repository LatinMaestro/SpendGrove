import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        brand: {
          deepTeal: "hsl(var(--brand-deep-teal))",
          green: "hsl(var(--brand-green))",
          teal: "hsl(var(--brand-teal))",
        },
        surface: {
          base: "hsl(var(--surface-base))",
          mint: "hsl(var(--surface-mint))",
        },
        warning: {
          amber: "hsl(var(--warning-amber))",
        },
        danger: {
          red: "hsl(var(--danger-red))",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(10, 64, 62, 0.08)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};

export default config;
