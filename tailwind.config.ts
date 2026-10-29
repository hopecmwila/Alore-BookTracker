import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      colors: {
        sky: {
          50: "#F3F8FD",
          100: "#E3EFFB",
          200: "#CFE4F7",
          300: "#B3D4F0",
          400: "#8FBEE8",
          500: "#6BA3D6",
          600: "#4C82B8",
          700: "#3A6591",
          800: "#2C4A6B",
          900: "#1E3348",
        },
        bloom: {
          400: "#EC6B9B",
          500: "#E1447E",
          600: "#C22F67",
        },
        ink: {
          900: "#1B2430",
          700: "#3B4657",
          500: "#66707F",
          300: "#A6AEB9",
          100: "#E7EAEE",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,36,48,0.06), 0 6px 16px rgba(27,36,48,0.06)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fill-bar": { from: { width: "0%" }, to: { width: "var(--fill, 0%)" } },
        "pop-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fill-bar": "fill-bar 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "pop-in": "pop-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
