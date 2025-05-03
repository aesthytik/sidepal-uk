import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "accent-blue": "#2456FF",
        "accent-lavender": "#B39CFF",
        "accent-pink": "#FF6BD2",
        "accent-citrus": "#FFE66E",
        "accent-mint": "#D7F5E3",
      },
      backgroundImage: {
        "gradient-light": "linear-gradient(to bottom, #FCE0F5, #EEB6E0)",
        "gradient-dark": "linear-gradient(to bottom, #121212, #1E1B23)",
      },
    },
    fontFamily: {
      sans: ["Inter", "sans-serif"],
    },
  },
  plugins: [],
};

export default config;
