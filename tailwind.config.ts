import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
      colors: {
        cream: '#FAF7F2',
        sage: '#8FAF8C',
        'dusty-rose': '#D4A5A5',
        'muted-blue': '#8FAFC4',
        'warm-brown': '#8B6F5E',
        'soft-gold': '#C9A96E',
      },
    },
  },
  plugins: [],
}

export default config
