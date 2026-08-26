import { Outlet, Link } from 'react-router-dom'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink">
      <header className="border-b border-cream-deep">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl font-bold text-walnut">
            YT 家居
          </Link>
          <div className="space-x-4 text-sm">
            <Link to="/products">产品</Link>
            <Link to="/news">新闻</Link>
            <Link to="/careers">招聘</Link>
            <Link to="/about">关于</Link>
            <Link to="/contact">联系</Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-cream-deep text-center text-sm text-ink-light py-6">
        © YT 品牌家具官网 · 演示骨架
      </footer>
    </div>
  )
}
