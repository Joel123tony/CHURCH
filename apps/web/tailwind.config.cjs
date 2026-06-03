/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07111f",
        gold: "#d7b46a",
        pearl: "#f6f1e8",
        mist: "#d8e3ef"
      },
      boxShadow: {
        glow: "0 20px 80px rgba(215, 180, 106, 0.22)"
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top, rgba(215,180,106,0.18), transparent 40%), linear-gradient(180deg, #08111e 0%, #0b1526 100%)"
      }
    }
  },
  plugins: []
};

