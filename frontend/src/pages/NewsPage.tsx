import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { newsApi } from '../api'
import type { NewsItem } from '../api'

const CATEGORIES = [
  { label: '全部', value: '' },
  { label: '企业新闻', value: 'enterprise' },
  { label: '行业资讯', value: 'industry', p1: true }
]

const PAGE_SIZE = 10

export default function NewsPage() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') ?? ''
  const page = Number(params.get('page') ?? '1')
  const [rows, setRows] = useState<NewsItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await newsApi.list({ category: category || undefined, page, page_size: PAGE_SIZE })
      setRows(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [category, page])

  useEffect(() => {
    void load()
  }, [load])

  const setFilter = (value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set('category', value)
    else next.delete('category')
    next.delete('page')
    setParams(next)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <div className="bg-walnut-dark text-cream">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="font-serif text-3xl font-bold">新闻资讯</h1>
          <p className="text-cream/70 mt-2">了解 YT 最新动态与行业风向</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="新闻分类">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              className={`px-5 py-2 rounded-full text-sm transition-colors flex items-center gap-1.5 ${
                category === c.value
                  ? 'bg-walnut text-cream'
                  : 'bg-white border border-line text-ink hover:border-walnut'
              }`}
            >
              {c.label}
              {c.p1 && (
                <span className="px-1.5 py-px rounded bg-p1 text-cream text-[10px] leading-tight">P1</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-ink-soft">加载中…</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-ink-soft">暂无新闻</div>
        ) : (
          <ul className="space-y-4">
            {rows.map((n) => {
              const d = n.publish_time.slice(0, 10).split('-')
              return (
                <li key={n.id}>
                  <Link
                    to={`/news/${n.id}`}
                    className="flex items-start gap-5 p-5 rounded-xl bg-white border border-line hover:border-walnut transition-colors"
                  >
                    <div className="w-14 shrink-0 text-center rounded-lg bg-sand py-2">
                      <div className="font-serif text-xl font-bold text-walnut leading-none">{Number(d[2])}</div>
                      <div className="text-xs text-ink-soft mt-1">{d[0]}/{d[1]}</div>
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-medium mb-1 truncate">{n.title}</h2>
                      <p className="text-sm text-ink-soft line-clamp-1">{n.summary || ''}</p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button
              disabled={page <= 1}
              onClick={() => {
                const next = new URLSearchParams(params)
                next.set('page', String(page - 1))
                setParams(next)
              }}
              className="px-4 py-2 rounded-md border border-line bg-white text-sm disabled:opacity-40"
            >
              上一页
            </button>
            <span className="text-sm text-ink-soft self-center">
              {page} / {totalPages} 页
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => {
                const next = new URLSearchParams(params)
                next.set('page', String(page + 1))
                setParams(next)
              }}
              className="px-4 py-2 rounded-md border border-line bg-white text-sm disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
