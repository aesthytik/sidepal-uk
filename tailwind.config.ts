import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        // Game palette (docs/branding.md)
        aqua: "#06B6D4",
        coral: "#F472B6",
        lemon: "#FCD34D",
        mint: "#34D399",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: ["var(--font-space-grotesk)", "sans-serif"],
        pixel: ["var(--font-pixel)", "monospace"],
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "horus-float": { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-4%)" } },
        "horus-hop": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "30%": { transform: "translateY(-14%) scale(1.05, 0.95)" },
          "60%": { transform: "translateY(0) scale(1.1, 0.9)" },
        },
        "horus-bounce": {
          "0%, 100%": { transform: "translateY(0) rotate(0)" },
          "25%": { transform: "translateY(-18%) rotate(-8deg)" },
          "75%": { transform: "translateY(-18%) rotate(8deg)" },
        },
        "horus-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6%) rotate(-4deg)" },
          "40%, 80%": { transform: "translateX(6%) rotate(4deg)" },
        },
        "horus-dizzy": { to: { transform: "rotate(360deg)" } },
        "horus-zzz": {
          "0%": { opacity: "0", transform: "translate(0, 0)" },
          "40%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translate(8px, -14px)" },
        },
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
        marquee: "marquee 40s linear infinite",
        "horus-float": "horus-float 3.5s ease-in-out infinite",
        "horus-hop": "horus-hop 0.6s ease-out 2",
        "horus-bounce": "horus-bounce 0.7s ease-in-out infinite",
        "horus-shake": "horus-shake 0.45s ease-in-out",
        "horus-dizzy": "horus-dizzy 0.6s linear infinite",
        "horus-zzz": "horus-zzz 2s ease-out infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
