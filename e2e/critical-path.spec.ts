import { test, expect } from '@playwright/test'

/**
 * E2E 关键路径（步骤 7.6）
 * 前台：首页 → 产品列表 → 产品详情 → 联系留言提交
 * 后台：登录 → 产品列表 → 登出
 * 前置：三端已启动；后台登录若未开 CAPTCHA_BYPASS，请先在页面手动填验证码逻辑
 */

test.describe('前台全流程', () => {
  test('首页 → 产品 → 详情 → 留言', async ({ page }) => {
    // 1. 首页可访问且品牌区渲染
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '产品系列' })).toBeVisible({ timeout: 10000 })

    // 2. 产品中心
    await page.getByRole('link', { name: /产品中心|最新产品/ }).first().click()
    await page.waitForURL('**/products*')

    // 3. 进入第一个产品详情（若有产品）
    const productLink = page.locator('a[href^="/products/"]').first()
    if (await productLink.count()) {
      await productLink.click()
      await page.waitForURL('**/products/**')
      await expect(page.locator('nav[aria-label="面包屑"]')).toBeVisible()
    }

    // 4. 联系页留言表单
    await page.goto('/contact')
    await page.getByLabel('姓名').fill('E2E 用户')
    await page.getByLabel('联系电话').fill('13800000000')
    await page.getByLabel('留言内容').fill('Playwright 端到端测试留言')
    await page.getByRole('button', { name: '提交留言' }).click()
    await expect(page.getByText('提交成功，我们将尽快与您联系')).toBeVisible({ timeout: 8000 })
  })

  test('新闻与招聘页可访问', async ({ page }) => {
    await page.goto('/news')
    await expect(page.getByRole('heading', { name: '新闻资讯' })).toBeVisible()
    await page.goto('/careers')
    await expect(page.getByRole('heading', { name: '加入 YT 家具' })).toBeVisible()
  })
})

test.describe('后台管理流程', () => {
  test('登录 → 工作台 → 登出', async ({ page }) => {
    await page.goto('http://localhost:5174/login')
    await page.getByPlaceholder('账号（如 10000）').fill('10000')
    await page.getByPlaceholder('密码').fill(process.env.INIT_SYSADMIN_PASSWORD || 'YT@2026')
    // 验证码：CAPTCHA_BYPASS=true 时填任意 4 位
    const captcha = page.locator('input[placeholder="验证码"]')
    await captcha.fill('0000')
    await page.getByRole('button', { name: '登 录' }).click()

    // 登录成功跳工作台
    await expect(page.getByText('近 7 日访问趋势').first()).toBeVisible({ timeout: 10000 })

    // 侧边栏菜单可见
    await expect(page.getByText('产品管理')).toBeVisible()

    // 登出
    await page.locator('.ant-avatar').click()
    await page.getByText('退出登录').click()
    await page.waitForURL('**/login')
  })
})
