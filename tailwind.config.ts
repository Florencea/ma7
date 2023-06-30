import daisyui from "daisyui";
import type { Config } from "tailwindcss";

export default {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        "fade-in-up": "fade-in-up 0.1s ease-out",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    logs: false,
    themes: ["black"],
    darkTheme: "black",
  },
} satisfies Config;
