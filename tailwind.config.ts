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
          primary: "#2774AE",
        },
        mainRed: "#E63946",
        green: {
          primary: "#b7e394",
        },
        yellow: {
          primary: "#ffeeB0",
        },
        gray: {
          primary: "#22070B",
        },
        amber: {
          primary: "#8F6C1A",
        },
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("@tailwindcss/forms")],
} satisfies Config;
