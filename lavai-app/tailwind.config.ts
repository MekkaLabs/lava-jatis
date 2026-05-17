import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#08090f',
          2: '#0d0f1a',
          3: '#12152a',
        },
        cyan: { DEFAULT: '#00d4ff' },
        lavai: {
          blue:   '#4f8eff',
          green:  '#00e676',
          purple: '#a855f7',
          muted:  '#6b7280',
          border: 'rgba(255,255,255,0.07)',
        },
      },
      fontFamily: {
        sans:   ['var(--font-inter)'],
        grotesk:['var(--font-grotesk)'],
      },
      backgroundImage: {
        'grad-cyan': 'linear-gradient(135deg, #00d4ff, #4f8eff)',
        'grad-dark': 'linear-gradient(135deg, #0d0f1a, #12152a)',
      },
      animation: {
        'float':    'float 8s ease-in-out infinite',
        'pulse-dot':'pulse-dot 2s infinite',
        'ticker':   'ticker 25s linear infinite',
        'fadeUp':   'fadeUp 0.6s ease forwards',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0) scale(1)' },
          '50%':     { transform: 'translateY(-20px) scale(1.03)' },
        },
        'pulse-dot': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(0,230,118,.4)' },
          '50%':     { boxShadow: '0 0 0 6px rgba(0,230,118,0)' },
        },
        ticker: {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
