export default function CasesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sand text-walnut mb-6" aria-hidden="true">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9l9-6 9 6v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 21v-7h6v7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="font-serif text-3xl font-bold mb-3">新案例展示</h1>
      <span className="inline-block px-2.5 py-0.5 rounded bg-p1/15 text-p1 text-xs font-semibold mb-4">P1 功能</span>
      <p className="text-ink-soft max-w-md mx-auto">工程案例实景展示正在筹备中，敬请期待。</p>
    </div>
  )
}
