import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background
        void: "#0C0C0C",
        surface: "#141414",
        // Text
        cream: "#EDE9E0",
        "cream-dim": "#A09890",
        // Accent
        ember: "#B85C38",
        "ember-dim": "#8A4228",
        // Divider
        "chalk-line": "#2A2A2A",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-lora)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(2.5rem, 10vw, 4.5rem)", { lineHeight: "0.95" }],
        "display-lg": ["clamp(1.8rem, 7vw, 3rem)", { lineHeight: "1.05" }],
      },
      keyframes: {
        "waveform-bar": {
          "0%, 100%": { transform: "scaleY(0.15)" },
          "50%": { transform: "scaleY(1)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
      },
      animation: {
        "waveform-bar": "waveform-bar 1.2s ease-in-out infinite",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
