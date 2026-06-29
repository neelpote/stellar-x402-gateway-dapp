/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0f172a",
        darkCard: "#1e293b",
        stellarPrimary: "#3b82f6",
        stellarAccent: "#6366f1",
      },
    },
  },
  plugins: [],
};
