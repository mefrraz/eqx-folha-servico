import type { Config } from "tailwindcss";

// Cores configuráveis via env vars (build-time). Defaults neutros.
const brand = {
  gold: process.env.NEXT_PUBLIC_BRAND_PRIMARY || "#F1C411",
  dark: process.env.NEXT_PUBLIC_BRAND_DARK || "#1a1a1a",
  soft: process.env.NEXT_PUBLIC_BRAND_SOFT || "#54595F",
  muted: process.env.NEXT_PUBLIC_BRAND_MUTED || "#7A7A7A",
  light: process.env.NEXT_PUBLIC_BRAND_LIGHT || "#CFCFCF",
  success: process.env.NEXT_PUBLIC_BRAND_SUCCESS || "#61CE70",
  olive: process.env.NEXT_PUBLIC_BRAND_OLIVE || "#98C03E",
  page: process.env.NEXT_PUBLIC_BRAND_PAGE || "#F7F7F7",
};

const config: Config = {
  darkMode: "media",
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
        brand: {
          gold: brand.gold,
          dark: brand.dark,
          soft: brand.soft,
          muted: brand.muted,
          light: brand.light,
        },
        success: brand.success,
        olive: brand.olive,
        page: brand.page,
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
    },
  },
  plugins: [],
};
export default config;
