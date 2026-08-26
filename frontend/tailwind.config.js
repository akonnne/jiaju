/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 胡桃木 / 墨色 / 米白（UIUX 设计规范 v1.1 / 技术文档 v1.7 §5.2）
        walnut: { DEFAULT: '#7A5C3E', dark: '#5F4730', light: '#A98F6C' },
        ink: { DEFAULT: '#2B2520', soft: '#6E675E' },
        cream: '#FAF7F1',
        sand: '#F0EAE1',
        line: '#E5DCCE',
        p1: '#B98A4E',
        success: '#3E6B45',
        danger: '#C0392B'
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Songti SC"', '"SimSun"', 'serif'],
        sans: ['"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        md: '6px',
        xl: '12px'
      },
      boxShadow: {
        card: '0 6px 24px rgba(43, 37, 32, 0.08)'
      }
    }
  },
  plugins: []
}
