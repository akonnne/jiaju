/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 胡桃木 / 墨绿 / 米白 主色板（参照 UIUX 设计规范）
        walnut: { DEFAULT: '#6B4F3A', light: '#8A6A4F', dark: '#4A3526' },
        ink: { DEFAULT: '#1F2A24', light: '#3A4A40' },
        cream: { DEFAULT: '#F5F0E6', deep: '#EADFCB' },
        accent: '#9C6B3F'
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif']
      },
      borderRadius: { xl2: '1rem' }
    }
  },
  plugins: []
}
