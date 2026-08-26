import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BannerSwiper from '../components/BannerSwiper'
import { bannerApi, companyApi, newsApi, productApi, seriesApi } from '../api'
import type { Banner, CompanyInfo, NewsItem, ProductListItem, Series } from '../api'

export default function HomePage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [company, setCompany] = useState<CompanyInfo>({})

  useEffect(() => {
    void Promise.all([
      bannerApi.list(),
      seriesApi.list(),
      productApi.list({ page: 1, page_size: 8 }),
      newsApi.list({ page: 1, page_size: 3 }),
      companyApi.get()
    ]).then(([bs, ss, ps, ns, cp]) => {
      setBanners(bs)
      setSeries(ss)
      setProducts(ps.items)
      setNews(ns.items)
      setCompany(cp)
    })
  }, [])

  const price = (p: ProductListItem) =>
    p.discount_price ?? p.original_price

  return (
    <div>
      {/* Hero：轮播 */}
      <BannerSwiper banners={banners} />

      {/* 品牌数据栏 */}
      <div className="bg-walnut text-cream">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ['40+', '年制造经验'],
            ['300+', '全国经销商'],
            ['1200+', '产品款式'],
            ['98%', '客户满意度']
          ].map(([num, label]) => (
            <div key={label}>
              <div className="font-serif text-2xl md:text-3xl font-bold">{num}</div>
              <div className="text-cream/70 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 系列 4 卡 */}
      <section className="max-w-7xl mx-auto px-4 py-16" aria-labelledby="series-title">
        <h2 id="series-title" className="font-serif text-2xl md:text-3xl font-bold text-center mb-2">
          产品系列
        </h2>
        <p className="text-center text-ink-soft mb-10">四大系列，满足不同空间想象</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {series.slice(0, 4).map((s) => (
            <Link
              key={s.id}
              to={`/products?series_id=${s.id}`}
              className="group rounded-xl overflow-hidden bg-white shadow-card hover:-translate-y-1 transition-transform"
            >
              <div className="h-44 bg-sand flex items-center justify-center overflow-hidden">
                {s.cover_image ? (
                  <img src={s.cover_image} alt={s.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <span className="font-serif text-2xl text-walnut">{s.name}</span>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-serif text-lg font-semibold mb-1">{s.name}</h3>
                <p className="text-sm text-ink-soft line-clamp-2">{s.description || '…'}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 最新产品 8 卡（sand 底） */}
      <section className="bg-sand py-16" aria-labelledby="new-products-title">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 id="new-products-title" className="font-serif text-2xl md:text-3xl font-bold">
                最新产品
              </h2>
              <p className="text-ink-soft mt-1">新品上市，匠心之作</p>
            </div>
            <Link to="/products" className="text-walnut text-sm font-medium hover:underline">
              查看全部 →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((p) => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="group rounded-xl overflow-hidden bg-white shadow-card hover:-translate-y-1 transition-transform"
              >
                <div className="h-40 bg-sand overflow-hidden">
                  {p.cover_image ? (
                    <img src={p.cover_image} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-walnut font-serif">
                      YT
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium mb-1 line-clamp-1">{p.name}</h3>
                  <div className="text-walnut font-semibold text-sm">
                    {price(p) != null ? `¥${price(p)?.toLocaleString()}` : '价格面议'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 最新新闻 3 卡 */}
      <section className="max-w-7xl mx-auto px-4 py-16" aria-labelledby="news-title">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 id="news-title" className="font-serif text-2xl md:text-3xl font-bold">最新动态</h2>
            <p className="text-ink-soft mt-1">了解 YT 最新资讯</p>
          </div>
          <Link to="/news" className="text-walnut text-sm font-medium hover:underline">
            全部新闻 →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.map((n) => (
            <Link
              key={n.id}
              to={`/news/${n.id}`}
              className="rounded-xl overflow-hidden bg-white shadow-card hover:-translate-y-1 transition-transform"
            >
              <div className="h-36 bg-sand overflow-hidden">
                {n.cover_image ? (
                  <img src={n.cover_image} alt="" loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-soft">YT</div>
                )}
              </div>
              <div className="p-5">
                <div className="text-xs text-ink-soft mb-2">{n.publish_time}</div>
                <h3 className="font-medium mb-1 line-clamp-1">{n.title}</h3>
                <p className="text-sm text-ink-soft line-clamp-2">{n.summary || ''}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA 横条 */}
      <section className="bg-walnut-dark text-cream">
        <div className="max-w-7xl mx-auto px-4 py-14 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">
              {company.slogan || 'YT 家具 · 让家更懂你'}
            </h2>
            <p className="text-cream/70">诚邀全国经销商加盟，共创美好家居生活</p>
          </div>
          <div className="flex gap-4">
            <Link to="/products" className="px-6 py-3 rounded-md bg-cream text-walnut-dark font-medium hover:bg-white transition-colors">
              浏览产品
            </Link>
            <Link to="/contact" className="px-6 py-3 rounded-md border border-cream/50 text-cream hover:bg-white/10 transition-colors">
              联系我们
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
