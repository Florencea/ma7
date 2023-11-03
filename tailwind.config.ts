import type { Config } from "tailwindcss";

export default {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        list: "repeat(auto-fill, minmax(125px, 1fr))",
      },
    },
  },
} satisfies Config;
