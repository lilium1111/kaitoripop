import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        pop: "0 10px 20px rgba(4, 18, 48, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
