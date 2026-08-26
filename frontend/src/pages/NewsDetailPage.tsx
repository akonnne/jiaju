import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { newsApi } from '../api'
import type { NewsDetail } from '../api'

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [news, setNews] = useState<NewsDetail | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setNotFound(false)
    void newsApi.detail(Number(id)).then(setNews).catch(() => setNotFound(true))
  }, [id])

  if (notFound) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="font-serif text-2xl mb-4">新闻不存在</h1>
        <Link to="/news" className="text-walnut underline">返回新闻列表</Link>
      </div>
    )
  }
  if (!news) {
    return <div className="text-center py-24 text-ink-soft">加载中…</div>
  }

  return (
    <div className="max-w-[860px] mx-auto px-4 py-10">
      <nav aria-label="面包屑" className="text-sm text-ink-soft mb-6">
        <Link to="/" className="hover:text-walnut">首页</Link>
        <span className="mx-2">/</span>
        <Link to="/news" className="hover:text-walnut">新闻资讯</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{news.title}</span>
      </nav>

      <h1 className="font-serif text-[28px] font-bold leading-snug mb-4">{news.title}</h1>
      <div className="flex items-center gap-4 text-sm text-ink-soft border-b border-line pb-6 mb-6">
        <span>{news.publish_time}</span>
        <span>{news.view_count} 次浏览</span>
        <span>{news.category === 'enterprise' ? '企业新闻' : '行业资讯'}</span>
      </div>

      <div className="rich-content" dangerouslySetInnerHTML={{ __html: news.content }} />
    </div>
  )
}
