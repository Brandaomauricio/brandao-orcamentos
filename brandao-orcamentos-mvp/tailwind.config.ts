import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#111111",
        cement: "#4A4A4A",
        wood: "#D4A03D",
        warning: "#D4A03D",
        technical: "#F5F5F5",
      },
      boxShadow: {
        soft: "0 12px 35px rgba(17,17,17,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
