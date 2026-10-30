import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b2233",
          900: "#102f44",
          800: "#17435e",
          700: "#23617f",
          600: "#2f7a99",
        },
        paper: {
          50: "#f7fbfd",
          100: "#eef6fa",
          200: "#dcebf2",
          300: "#c6dce8",
        },
        crimson: {
          400: "#8ec8dd",
          500: "#5fa6c1",
          600: "#2f7a99",
          700: "#245f78",
        },
        gold: {
          300: "#f7d9bd",
          400: "#efbf92",
          500: "#dfa06a",
        },
      },
      fontFamily: {
        serif: [
          "\"Noto Serif SC\"",
          "\"Source Han Serif SC\"",
          "\"Songti SC\"",
          "SimSun",
          "Georgia",
          "serif",
        ],
        sans: [
          "\"Noto Sans SC\"",
          "\"Source Han Sans SC\"",
          "\"PingFang SC\"",
          "\"Microsoft YaHei\"",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        paper: "0 18px 45px -25px rgba(16, 42, 60, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
