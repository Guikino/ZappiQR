/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        borderRun: {
          '0%': { 'background-position': '0% 0%' },
          '100%': { 'background-position': '200% 0%' },
        },
        textRun: {
          '0%': { 'background-position': '0% 0%' },
          '100%': { 'background-position': '200% 0%' },
        },
      },
      animation: {
        'border-run': 'borderRun 2s linear infinite',
        'text-run': 'textRun 2s linear infinite alternate',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};