import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { productApi } from '../api'
import type { ProductListItem } from '../api'

const CATEGORIES = [
  { label: '全部', value: '' },
  { label: '民用', value: '民用' },
  { label: '办公', value: '办公' },
  { label: '软体', value: '软体' },
  { label: '定制', value: '定制' }
]

const PAGE_SIZE = 12

export default function ProductsPage() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') ?? ''
  const seriesId = params.get('series_id') ?? ''
  const keyword = params.get('keyword') ?? ''
  const page = Number(params.get('page') ?? '1')

  const [rows, setRows] = useState<ProductListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await productApi.list({
        category: category || undefined,
        series_id: seriesId ? Number(seriesId) : undefined,
        keyword: keyword || undefined,
        page,
        page_size: PAGE_SIZE
      })
      setRows(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [category, seriesId, keyword, page])

  useEffect(() => {
    void load()
  }, [load])

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const price = (p: ProductListItem) => p.discount_price ?? p.original_price

  return (
    <div>
      {/* 页头 */}
      <div className="bg-walnut-dark text-cream">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="font-serif text-3xl font-bold">产品中心</h1>
          <p className="text-cream/70 mt-2">匠心之作 · 让家更懂你</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* 分类胶囊 */}
        <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="产品分类">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilter('category', c.value)}
              className={`px-5 py-2 rounded-full text-sm transition-colors ${
                category === c.value
                  ? 'bg-walnut text-cream'
                  : 'bg-white border border-line text-ink hover:border-walnut'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* 产品网格 */}
        {loading ? (
          <div className="text-center py-16 text-ink-soft">加载中…</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-ink-soft">暂无产品</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {rows.map((p) => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="group rounded-xl overflow-hidden bg-white shadow-card hover:-translate-y-1 transition-transform"
              >
                <div className="h-44 bg-sand overflow-hidden">
                  {p.cover_image ? (
                    <img src={p.cover_image} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-serif text-walnut">YT</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-xs text-ink-soft mb-1">{p.category}</div>
                  <h2 className="text-sm font-medium mb-2 line-clamp-1">{p.name}</h2>
                  <div className="flex items-center justify-between">
                    <span className="text-walnut font-semibold text-sm">
                      {price(p) != null ? `¥${price(p)?.toLocaleString()}` : '价格面议'}
                    </span>
                    <span className="text-xs text-ink-soft">{p.view_count} 浏览</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button
              disabled={page <= 1}
              onClick={() => setFilter('page', String(page - 1))}
              className="px-4 py-2 rounded-md border border-line bg-white text-sm disabled:opacity-40 hover:border-walnut"
            >
              上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center gap-2">
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-ink-soft">…</span>}
                  <button
                    onClick={() => setFilter('page', String(p))}
                    className={`w-10 h-10 rounded-md text-sm ${
                      p === page ? 'bg-walnut text-cream' : 'border border-line bg-white hover:border-walnut'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setFilter('page', String(page + 1))}
              className="px-4 py-2 rounded-md border border-line bg-white text-sm disabled:opacity-40 hover:border-walnut"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
