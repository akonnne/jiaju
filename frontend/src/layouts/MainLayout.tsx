import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

// ---------- 导航配置（含二级下拉） ----------
interface NavChild {
  label: string
  to: string
}
interface NavItem {
  label: string
  to: string
  children?: NavChild[]
}

const NAV_ITEMS: NavItem[] = [
  { label: '首页', to: '/' },
  {
    label: '产品',
    to: '/products',
    children: [
      { label: '民用家具', to: '/products?category=民用' },
      { label: '办公家具', to: '/products?category=办公' },
      { label: '软体家具', to: '/products?category=软体' },
      { label: '定制服务', to: '/products?category=定制' }
    ]
  },
  {
    label: '新闻',
    to: '/news',
    children: [
      { label: '企业新闻', to: '/news?category=enterprise' },
      { label: '行业资讯', to: '/news?category=industry' }
    ]
  },
  {
    label: '招聘入口',
    to: '/careers',
    children: [
      { label: '社会招聘', to: '/careers/social' },
      { label: '校园招聘', to: '/careers/campus' }
    ]
  },
  {
    label: '关于我们',
    to: '/about',
    children: [
      { label: '品牌历程', to: '/about/milestones' },
      { label: '品牌理念', to: '/about/brand' }
    ]
  }
]

const FOOTER_PRODUCTS = ['民用家具', '办公家具', '软体家具', '定制服务']
const FOOTER_ABOUT = ['品牌历程', '品牌理念', '企业介绍']
const FOOTER_CONTACT = ['联系我们', '留言咨询', '社会招聘', '校园招聘']

function Header() {
  const [openChild, setOpenChild] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to.split('?')[0])

  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur border-b border-line">
      {/* TopBar 信息条 */}
      <div className="bg-walnut-dark text-cream/90 text-xs">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between">
          <span>YT 家具 · 让家更懂你</span>
          <span className="hidden sm:inline">咨询热线：400-888-0000</span>
        </div>
      </div>

      {/* 主导航 */}
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between" aria-label="主导航">
        <Link to="/" className="flex items-center gap-2" aria-label="YT 家具首页">
          <span
            className="w-9 h-9 rounded-lg bg-walnut text-cream flex items-center justify-center font-bold text-lg"
            aria-hidden="true"
          >
            YT
          </span>
          <span className="font-serif text-xl font-bold tracking-wide hidden sm:inline">YT 家具</span>
        </Link>

        {/* 桌面导航 */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <li
              key={item.to}
              className="relative group"
              onMouseEnter={() => setOpenChild(item.to)}
              onMouseLeave={() => setOpenChild(null)}
            >
              <NavLink
                to={item.to}
                className={`px-4 py-2 rounded-md text-sm transition-colors duration-200 flex items-center gap-1 ${
                  isActive(item.to) ? 'text-walnut font-semibold' : 'text-ink hover:text-walnut'
                }`}
              >
                {item.label}
                {item.children && (
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${openChild === item.to ? 'rotate-135' : ''}`}
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M2 4l4 4 4-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </NavLink>
              {/* 二级下拉 */}
              {item.children && (
                <div
                  className={`absolute left-0 top-full pt-2 transition-opacity duration-200 ${
                    openChild === item.to ? 'opacity-100 visible' : 'opacity-0 invisible'
                  }`}
                >
                  <ul className="bg-cream border border-line rounded-md shadow-card py-2 w-36">
                    {item.children.map((c) => (
                      <li key={c.to}>
                        <Link
                          to={c.to}
                          className="block px-4 py-2 text-sm text-ink hover:text-walnut hover:bg-sand"
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
          <li>
            <Link
              to="/contact"
              className="ml-2 px-4 py-2 rounded-md bg-walnut text-cream text-sm hover:bg-walnut-dark transition-colors"
            >
              联系我们
            </Link>
          </li>
        </ul>

        {/* 汉堡按钮（移动端） */}
        <button
          className="md:hidden p-2 rounded-md text-ink hover:bg-sand"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
          aria-expanded={mobileOpen}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {mobileOpen ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {/* 移动端全屏菜单 */}
      {mobileOpen && (
        <div className="md:hidden border-t border-line bg-cream">
          <ul className="px-4 py-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.to} className="border-b border-line last:border-0">
                <Link
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-sm font-medium text-ink"
                >
                  {item.label}
                </Link>
                {item.children && (
                  <ul className="pl-4 pb-2">
                    {item.children.map((c) => (
                      <li key={c.to}>
                        <Link
                          to={c.to}
                          onClick={() => setMobileOpen(false)}
                          className="block py-2 text-sm text-ink-soft"
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            <li className="py-3">
              <Link
                to="/contact"
                onClick={() => setMobileOpen(false)}
                className="block text-center py-2.5 rounded-md bg-walnut text-cream text-sm"
              >
                联系我们
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}

function Footer() {
  const col = (title: string, items: { label: string; to: string }[]): ReactNode => (
    <div>
      <h3 className="font-serif text-base mb-4 text-cream">{title}</h3>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.to}>
            <Link to={i.to} className="text-cream/70 hover:text-cream text-sm">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <footer className="bg-ink text-cream">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-9 h-9 rounded-lg bg-walnut text-cream flex items-center justify-center font-bold text-lg" aria-hidden="true">
              YT
            </span>
            <span className="font-serif text-lg font-bold">YT 家具</span>
          </div>
          <p className="text-cream/60 text-sm leading-6">
            匠心工艺，让家更懂你。<br />专注民用 / 办公 / 软体家具四十年。
          </p>
        </div>
        {col('产品', FOOTER_PRODUCTS.map((l) => ({ label: l, to: `/products?category=${encodeURIComponent(l.replace('家具', ''))}` })))}
        {col('关于我们', FOOTER_ABOUT.map((l) => ({ label: l, to: l === '品牌历程' ? '/about/milestones' : l === '品牌理念' ? '/about/brand' : '/about' })))}
        {col('联系与招聘', FOOTER_CONTACT.map((l) => ({ label: l, to: l === '联系我们' || l === '留言咨询' ? '/contact' : `/careers/${l === '社会招聘' ? 'social' : 'campus'}` })))}
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between text-cream/50 text-xs gap-2">
          <span>© 2026 YT 家具 · 保留所有权利</span>
          <span>浙ICP备00000000号</span>
        </div>
      </div>
    </footer>
  )
}

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
