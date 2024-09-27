/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{tsx,jsx,js,ts}",
    "./components/**/*.{tsx,jsx,js,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        rubik: ['Rubik', 'sans-serif'],
        rubiksemibold: ['RubikSemibold', 'sans-serif'],
        rubikmedium: ['RubikMedium', 'sans-serif'],
        rubikbold: ['RubikBold', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

