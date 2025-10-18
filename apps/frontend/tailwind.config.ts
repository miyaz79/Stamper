import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./path_to_your_design_system/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--color-brand-primary)",
          "primary-dark": "var(--color-brand-primary-dark)",
          secondary: "var(--color-brand-secondary)",
          accent: "var(--color-brand-accent)"
        },
        surface: {
          primary: "var(--color-surface-primary)",
          muted: "var(--color-surface-muted)",
          contrast: "var(--color-surface-contrast)",
          backdrop: "var(--color-surface-backdrop)",
          shell: "var(--color-surface-shell)"
        },
        border: {
          subtle: "var(--color-border-subtle)",
          strong: "var(--color-border-strong)"
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
          inverse: "var(--color-text-inverse)"
        }
      },
      boxShadow: {
        ambient: "var(--color-shadow-ambient)",
        elevated: "var(--color-shadow-elevated)",
        focus: "var(--color-shadow-focus)"
      },
      fontFamily: {
        sans: "var(--font-family-sans)"
      }
    }
  },
  plugins: []
};

export default config;
