/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
          50: '#EEF5F3',
          100: '#D9EAE5',
          200: '#B3D5CB',
          300: '#86BDAF',
          400: '#4C9C89',
          500: '#1D7A67',
          600: '#0F5D52',
          700: '#0C4A42',
          800: '#093A34',
          900: '#062924',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}