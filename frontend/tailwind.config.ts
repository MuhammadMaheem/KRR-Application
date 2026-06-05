import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        bg: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        // Text
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
        },
        // Primary
        primary: {
          DEFAULT: "var(--primary)",
          strong: "var(--primary-strong)",
          fg: "var(--primary-fg)",
        },
        accent: {
          DEFAULT: "var(--accent)",
        },
        // Sidebar
        sidebar: {
          DEFAULT: "var(--sidebar)",
          text: "var(--sidebar-text)",
          muted: "var(--sidebar-muted)",
          border: "var(--sidebar-border)",
        },
        // Status
        "st-ready": "var(--st-ready)",
        "st-proc": "var(--st-proc)",
        "st-pend": "var(--st-pend)",
        "st-err": "var(--st-err)",
        violet: "var(--violet)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "var(--radius-sm)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
