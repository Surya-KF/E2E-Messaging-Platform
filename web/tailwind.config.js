/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./pages/**/*.{ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#d9e9ff',
          200: '#b9d6ff',
          300: '#8abaff',
          400: '#5595ff',
          500: '#1d6dff',
          600: '#0f55e6',
          700: '#0d43b4',
          800: '#0f3b8c',
          900: '#0f346e',
          950: '#0a213f'
        },
        accent: {
          50: '#fff0f7',
          100: '#ffd9ec',
          200: '#ffb0d9',
          300: '#ff7abc',
          400: '#ff429e',
          500: '#ff157f',
          600: '#e4006e',
          700: '#b30055',
          800: '#870043',
          900: '#620035',
          950: '#3c001f'
        },
        ink: {
          50: '#f5f7fa',
            100: '#eceff4',
            200: '#d8dde5',
            300: '#b8c1cf',
            400: '#8a99b1',
            500: '#5d6d85',
            600: '#415066',
            700: '#2f3a4b',
            800: '#262f3c',
            900: '#202731',
            950: '#0e1115'
        }
      },
      boxShadow: {
        'soft': '0 4px 16px -2px rgba(0,0,0,0.05), 0 2px 6px -1px rgba(0,0,0,0.06)',
        'glow': '0 0 0 1px rgba(29,109,255,0.4), 0 0 0 4px rgba(29,109,255,0.15)'
      },
      borderRadius: {
        'xl2': '1.15rem'
      },
      fontSize: {
        '2xs': '0.675rem'
      },
      transitionTimingFunction: {
        'bounce-soft': 'cubic-bezier(.22,1.12,.28,1)'
      }
    },
  },
  plugins: [],
};
