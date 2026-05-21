/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        board: {
          wood: '#8B5A2B',
          line: '#3E2723',
          highlight: '#FFD54F',
        },
      },
    },
  },
  plugins: [],
};
