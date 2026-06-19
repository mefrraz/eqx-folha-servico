import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        navy: {
          DEFAULT: "#131041",
          900: "#0e0c30",
          800: "#131041",
          700: "#1a1655",
          600: "#211d6b",
          50: "#f0f0fa",
        },
        gold: {
          DEFAULT: "#F1C411",
          50: "#fefce8",
          100: "#fef9c3",
          400: "#F1C411",
          500: "#d9ad0f",
          600: "#b8900c",
        },
        steel: {
          DEFAULT: "#54595F",
          700: "#54595F",
          500: "#7A7A7A",
          400: "#9CA3AF",
          300: "#CFCFCF",
        },
        green: {
          DEFAULT: "#61CE70",
          500: "#61CE70",
          700: "#3d9e4a",
        },
        olive: {
          DEFAULT: "#98C03E",
        },
      },
    },
  },
  plugins: [],
};
export default config;
