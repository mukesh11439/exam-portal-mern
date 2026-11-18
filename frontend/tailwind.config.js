/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#15243a',
        muted: '#718096',
        brand: {
          50: '#eef4ff',
          100: '#dce8ff',
          500: '#4678ed',
          600: '#315fce',
          700: '#254ba8'
        }
      },
      boxShadow: {
        card: '0 12px 40px rgba(34, 55, 92, 0.07)'
      }
    }
  },
  plugins: []
};

