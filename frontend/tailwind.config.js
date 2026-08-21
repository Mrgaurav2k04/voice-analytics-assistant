/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0a0a0a',
          panel: '#121212',
          border: '#262626',
          text: '#f5f5f5',
          textDim: '#a3a3a3',
          accent: '#00d4aa',
        }
      }
    },
  },
  plugins: [],
}
