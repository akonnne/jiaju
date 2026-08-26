import { defineConfig } from '@playwright/test'

// E2E 关键路径测试配置（步骤 7.6）
// 安装浏览器：npx playwright install chromium（约 150MB，需网络）
// 前置：三端已启动（api:8000 / frontend:5173 / backend:5174，且 .env 设 CAPTCHA_BYPASS=true 或登录用真实验证码）
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
})
