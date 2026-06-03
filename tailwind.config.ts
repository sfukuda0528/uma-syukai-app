import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        paper: "#f7f4ec",
        moss: "#31513b",
        tomato: "#d85c3a",
        steel: "#49636f"
      },
      boxShadow: {
        panel: "0 18px 55px rgba(23, 23, 23, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
