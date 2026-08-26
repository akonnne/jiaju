import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: {
    port: 5174,
    proxy: {
      // 开发期将 /api 代理到 FastAPI（:8000）
      '/api': { target: 'http://localhost:8000', changeOrigin: true }
    }
  }
})
