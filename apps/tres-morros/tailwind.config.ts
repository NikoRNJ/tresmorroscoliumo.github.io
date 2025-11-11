import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          DEFAULT: "#0B3B3C",
          accent: "#C05C30",
          muted: "#F4EDE4",
        },
        state: {
          available: "#16a34a",
          busy: "#dc2626",
          hold: "#fbbf24",
        },
      },
      boxShadow: {
        card: "0 10px 35px rgba(7, 25, 26, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
