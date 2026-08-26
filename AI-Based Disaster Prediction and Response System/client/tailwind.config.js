/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'serif': ['Source Serif 4', 'Georgia', 'serif'],
      },
      colors: {
        'cream': '#f6f5f1',
        'ink': '#1a1a1a',
        'ink-light': '#4a4a4a',
        'ink-muted': '#7a7a7a',
        'border': '#e2e0db',
        'card': '#ffffff',
        'red-un': '#d32f2f',
        'blue-un': '#009edb',
      },
    },
  },
  plugins: [],
}
