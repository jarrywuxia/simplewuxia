/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Crimson Text', 'serif'],
        'mono': ['Inconsolata', 'monospace'],
      },
      colors: {
        paper: '#f3f3f3',
        ink: '#1a1a1a',
        'ink-light': '#4a4a4a',
        border: '#d0d0d0',
        'accent': '#362c25ff',
        'accent-light': '#3a312dff',
      }
    },
  },
  plugins: [],
}