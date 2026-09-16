/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cork: {
          DEFAULT: "#5c4433",
          dark: "#3f2f24",
          light: "#7a5c45",
        },
        cream: "#f3ead9",
        accent: "#b5352f",
        ink: "#231a14",
      },
      fontFamily: {
        display: ["'Courier New'", "monospace"],
        body: ["system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 6px 14px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
