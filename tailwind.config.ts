import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/screens/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          light: "#f6f7ff",
          dark: "#ced8fa",
        },
        mainRed: "#E63946",
      },
    },
  },
  plugins: [],
} satisfies Config;
