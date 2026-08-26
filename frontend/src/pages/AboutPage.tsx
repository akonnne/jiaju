import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { companyApi } from '../api'
import type { CompanyInfo } from '../api'

export default function AboutPage() {
  const [company, setCompany] = useState<CompanyInfo>({})

  useEffect(() => {
    void companyApi.get().then(setCompany)
  }, [])

  return (
    <div>
      <div className="bg-walnut-dark text-cream">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="font-serif text-3xl font-bold">关于我们</h1>
          <p className="text-cream/70 mt-2">{company.slogan || 'YT 家具 · 让家更懂你'}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-12">
          <div className="rounded-xl bg-sand h-72 flex items-center justify-center">
            <span className="font-serif text-4xl text-walnut">YT</span>
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold mb-4">匠心四十载 · 让家更懂你</h2>
            {company.intro ? (
              <div className="rich-content" dangerouslySetInnerHTML={{ __html: company.intro }} />
            ) : (
              <p className="text-ink-soft leading-7">
                YT 家具创立于 1986 年，专注民用 / 办公 / 软体家具制造，
                以匠心工艺与人性化设计服务万千家庭，产品远销全国 300+ 城市。
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/about/milestones"
            className="group rounded-xl bg-white border border-line p-8 hover:border-walnut transition-colors"
          >
            <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-walnut transition-colors">品牌历程</h3>
            <p className="text-sm text-ink-soft">穿越时间，见证 YT 四十年的每一步成长</p>
            <span className="inline-block mt-4 text-walnut text-sm">查看历程 →</span>
          </Link>
          <Link
            to="/about/brand"
            className="group rounded-xl bg-white border border-line p-8 hover:border-walnut transition-colors"
          >
            <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-walnut transition-colors">品牌理念</h3>
            <p className="text-sm text-ink-soft">以人为本的设计哲学与荣誉见证</p>
            <span className="inline-block mt-4 text-walnut text-sm">查看理念 →</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
