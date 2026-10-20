import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b1b28",
          900: "#102a3c",
          800: "#173a50",
          700: "#21506b",
          600: "#2f6785",
        },
        paper: {
          50: "#fbf8f3",
          100: "#f5efe6",
          200: "#e9dfd0",
          300: "#d8c9b4",
        },
        crimson: {
          400: "#c05668",
          500: "#b23a4c",
          600: "#9d2235",
          700: "#84202f",
        },
        gold: {
          300: "#dcc59a",
          400: "#c8a96a",
          500: "#b8935a",
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
