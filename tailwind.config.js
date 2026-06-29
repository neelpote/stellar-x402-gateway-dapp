/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sofia-sans)", "Arial", "sans-serif"],
      },
      colors: {
        canvasCream: "#F3F0EE",
        liftedCream: "#FCFBFA",
        inkBlack: "#141413",
        signalOrange: "#CF4500",
        lightSignalOrange: "#F37338",
        slateGray: "#696969",
        softBone: "#F4F4F4",
      },
      borderRadius: {
        stadium: "40px",
        pill: "999px",
        mcButton: "20px",
      },
      boxShadow: {
        navShadow: "rgba(0, 0, 0, 0.04) 0px 4px 24px 0px",
        cardShadow: "rgba(0, 0, 0, 0.08) 0px 24px 48px 0px",
      },
    },
  },
  plugins: [],
};
