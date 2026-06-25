import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        clinical: {
          blue: "#0f6aa6",
          cyan: "#e8f5fb",
          green: "#0b7a5a",
          ink: "#1f2937"
        }
      }
    }
  },
  plugins: []
};

export default config;

