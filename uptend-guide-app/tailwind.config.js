/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F97316',
          light: '#FF9A4D',
          dark: '#D46A15',
        },
        secondary: {
          DEFAULT: '#1E293B',
        },
        accent: {
          DEFAULT: '#22C55E',
        },
      },
    },
  },
  plugins: [],
};
