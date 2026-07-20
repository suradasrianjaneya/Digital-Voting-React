/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#020617',     // Slate-950 dark background
          card: '#0f172a',   // Slate-900 card background
          hover: '#1e293b',  // Slate-800 hover states
          border: '#1e293b', // Slate-800 borders
          input: '#0f172a',  // Slate-900 input inputs
        },
        brand: {
          primary: '#8b5cf6', // Violet-500 accents
          secondary: '#3b82f6', // Blue-500 secondary
          success: '#10b981', // Emerald-500 alerts
          warning: '#f59e0b', // Amber-500
          danger: '#ef4444', // Red-500
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
