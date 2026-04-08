/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vaquita: {
          green: '#16a34a',
          light: '#86efac',
          dark: '#15803d',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
