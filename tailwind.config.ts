import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
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
        // Semantic supporting tones; see docs/brand.md
        mint: { DEFAULT: "hsl(var(--mint) / <alpha-value>)", foreground: "hsl(var(--mint-foreground) / <alpha-value>)" },
        apricot: { DEFAULT: "hsl(var(--apricot) / <alpha-value>)", foreground: "hsl(var(--apricot-foreground) / <alpha-value>)" },
        // Five colour families, each a bright dot, a pale fill and a dark ink; see docs/brand.md
        green: { dot: "hsl(var(--green-dot) / <alpha-value>)", soft: "hsl(var(--green-soft) / <alpha-value>)", ink: "hsl(var(--green-ink) / <alpha-value>)" },
        pink: { dot: "hsl(var(--pink-dot) / <alpha-value>)", soft: "hsl(var(--pink-soft) / <alpha-value>)", ink: "hsl(var(--pink-ink) / <alpha-value>)" },
        blue: { dot: "hsl(var(--blue-dot) / <alpha-value>)", soft: "hsl(var(--blue-soft) / <alpha-value>)", ink: "hsl(var(--blue-ink) / <alpha-value>)" },
        amber: { dot: "hsl(var(--amber-dot) / <alpha-value>)", soft: "hsl(var(--amber-soft) / <alpha-value>)", ink: "hsl(var(--amber-ink) / <alpha-value>)" },
        purple: { dot: "hsl(var(--purple-dot) / <alpha-value>)", soft: "hsl(var(--purple-soft) / <alpha-value>)", ink: "hsl(var(--purple-ink) / <alpha-value>)" },
        forest: { DEFAULT: "hsl(var(--primary) / <alpha-value>)", deep: "hsl(var(--forest-deep) / <alpha-value>)" },
        lime: "hsl(var(--lime) / <alpha-value>)",
        gold: "hsl(var(--gold) / <alpha-value>)",
        clay: "hsl(var(--clay) / <alpha-value>)",
        sage: "hsl(var(--sage) / <alpha-value>)",
      },
      boxShadow: { card: "var(--shadow-card)", float: "var(--shadow-float)", button: "none" },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          "var(--font-body)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        pixel: ["var(--font-pixel)", "monospace"],
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "horus-float": { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-1.5px)" } },
        "horus-hop": {
          "0%, 100%": { transform: "translateY(0)" },
          "40%": { transform: "translateY(-6%)" },
        },
        "horus-bounce": {
          "0%, 100%": { transform: "translateY(0) rotate(0)" },
          "25%": { transform: "translateY(-6%) rotate(-3deg)" },
          "75%": { transform: "translateY(-6%) rotate(3deg)" },
        },
        "horus-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%, 75%": { transform: "translateX(-3%)" },
          "50%": { transform: "translateX(3%)" },
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
        "horus-float": "horus-float 4s ease-in-out infinite",
        "horus-hop": "horus-hop 0.5s ease-out",
        "horus-bounce": "horus-bounce 1s ease-in-out 2",
        "horus-shake": "horus-shake 0.35s ease-in-out",
        "horus-dizzy": "horus-dizzy 0.8s linear infinite",
        "horus-zzz": "horus-zzz 2s ease-out infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
