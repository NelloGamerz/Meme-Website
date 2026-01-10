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
        'typing-dots': 'typingDots 1.4s infinite both',
      },
      keyframes: {
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        typingDots: {
          '0%': { 
            opacity: '0.4',
            transform: 'scale(1) translateY(0px)' 
          },
          '20%': { 
            opacity: '1',
            transform: 'scale(1.2) translateY(-2px)' 
          },
          '40%': { 
            opacity: '0.4',
            transform: 'scale(1) translateY(0px)' 
          },
          '100%': { 
            opacity: '0.4',
            transform: 'scale(1) translateY(0px)' 
          },
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
        },
        '.touch-manipulation': {
          'touch-action': 'manipulation',
          '-webkit-tap-highlight-color': 'transparent',
        },
        '.safe-area-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        }
      };
      addUtilities(newUtilities);
    },
  ],
};
