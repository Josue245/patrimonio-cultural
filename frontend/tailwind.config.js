/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        andino: {
          50:  '#fdf8ee',
          100: '#f9eccc',
          200: '#f2d48a',
          300: '#eabc48',
          400: '#e4a726',
          500: '#d4851a',
          600: '#b86314',
          700: '#984514',
          800: '#7c3617',
          900: '#672e16',
        },
      },
    },
  },
  plugins: [],
}
