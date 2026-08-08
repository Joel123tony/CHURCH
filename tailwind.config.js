/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5D1324",
        secondary: "#7D2935",
        cream: "#D7C9B5",
        light: "#F4EFE7",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.95) translateY(10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        fadeOut: {
          "0%": { opacity: "1", transform: "scale(1) translateY(0)" },
          "100%": { opacity: "0", transform: "scale(0.95) translateY(10px)" },
        }
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        popIn: "popIn 0.35s ease-out forwards",
        fadeOut: "fadeOut 0.35s ease-in forwards",
      },
    },
  },
  plugins: [],
}