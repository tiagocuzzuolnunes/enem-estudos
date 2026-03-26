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
        natureza:   { DEFAULT: '#10b981', light: '#d1fae5' },
        humanas:    { DEFAULT: '#8b5cf6', light: '#ede9fe' },
        linguagens: { DEFAULT: '#3b82f6', light: '#dbeafe' },
        matematica: { DEFAULT: '#f59e0b', light: '#fef3c7' },
        redacao:    { DEFAULT: '#ef4444', light: '#fee2e2' },
      },
    },
  },
  plugins: [],
}
export default config
