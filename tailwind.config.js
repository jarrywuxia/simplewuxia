/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    // Rarity colors
    { pattern: /^text-(slate|emerald|sky|purple|amber|rose)-(50|100|200|300|400|500|600|700)$/ },
    { pattern: /^bg-(slate|emerald|sky|purple|amber|rose)-(50|100|200|300|400|500|600|700)$/ },
    { pattern: /^border-(slate|emerald|sky|purple|amber|rose)-(300|400|500)$/ },
    { pattern: /^ring-(slate|emerald|sky|purple|amber|rose)-(200|300)$/ },
    { pattern: /^shadow-(slate|emerald|sky|purple|amber|rose)-(100|200)$/ },
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