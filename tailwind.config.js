/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Dancing Script"', 'cursive'],
        sans: ['"Quicksand"', 'system-ui', 'sans-serif'],
      },
      colors: {
        love: {
          pink: '#ffd6e8',
          rose: '#ff8fab',
          peach: '#ffd4c4',
          lilac: '#e8d9ff',
          blush: '#fff0f5',
        },
      },
      boxShadow: {
        glass: '0 8px 32px rgba(255, 105, 180, 0.15), inset 0 1px 0 rgba(255,255,255,0.6)',
        glow: '0 0 40px rgba(255, 143, 171, 0.45)',
        'glow-lg': '0 0 60px rgba(200, 162, 255, 0.35)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(3deg)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        drift: {
          '0%': { transform: 'translateY(100vh) scale(0.6)', opacity: '0' },
          '10%': { opacity: '0.8' },
          '100%': { transform: 'translateY(-20vh) scale(1)', opacity: '0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        twinkle: 'twinkle 3s ease-in-out infinite',
        drift: 'drift 14s linear infinite',
      },
    },
  },
  plugins: [],
}
