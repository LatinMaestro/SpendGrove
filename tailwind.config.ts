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
        muted: "hsl(var(--muted))",
        focus: "hsl(var(--focus))",
        brand: {
          evergreen: "hsl(var(--brand-deep-teal))",
          deepTeal: "hsl(var(--brand-deep-teal))",
          green: "hsl(var(--brand-green))",
          teal: "hsl(var(--brand-teal))",
        },
        surface: {
          base: "hsl(var(--surface-base))",
          subtle: "hsl(var(--surface-subtle))",
          mint: "hsl(var(--surface-mint))",
        },
        warning: {
          amber: "hsl(var(--warning-amber))",
        },
        danger: {
          red: "hsl(var(--danger-red))",
        },
        success: {
          green: "hsl(var(--success-green))",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 10px 32px rgba(12, 75, 75, 0.07)",
        overlay: "0 22px 60px rgba(16, 48, 48, 0.16)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};

export default config;
