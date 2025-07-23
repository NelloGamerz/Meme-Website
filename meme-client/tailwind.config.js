/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      height: {
      'screen-dvh': '100dvh',
    },
    maxHeight: {
      '100dvh': '100dvh',
    },
      animation: {
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.animation-delay-150': {
          'animation-delay': '150ms',
        },
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.scroll-smooth': {
          'scroll-behavior': 'smooth',
        },
        '.scroll-momentum': {
          '-webkit-overflow-scrolling': 'touch',
        },
        '.scroll-contain': {
          'overscroll-behavior': 'contain',
        },
        '.scroll-gpu': {
          'will-change': 'scroll-position',
          'transform': 'translateZ(0)',
          'backface-visibility': 'hidden',
        }
      };
      addUtilities(newUtilities);
    },
  ],
};
