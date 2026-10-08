/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#08060f',
        deep: '#100c1e',
        violet: '#8b5cf6',
        magenta: '#ec4899',
        cyan: '#22d3ee',
        gold: '#f0b429',
        mist: '#faf8ff',
        ink: '#150f28',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
