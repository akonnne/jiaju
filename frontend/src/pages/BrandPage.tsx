import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { companyApi } from '../api'

interface Concept {
  title: string
  description: string
  icon?: string
}
interface Honor {
  title: string
  image?: string
}

const CONCEPT_ICONS: Record<string, string> = {
  ergonomic: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8v4M12 16h.01',
  craft: 'M14 4l6 6-9 9H5v-6l9-9zM3 21h18',
  eco: 'M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10zM12 22V2',
  design: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  service: 'M22 12h-4l-3 9L9 3l-3 9H2',
  other: 'M12 3v18M3 12h18'
}

export default function BrandPage() {
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [honors, setHonors] = useState<Honor[]>([])

  useEffect(() => {
    void companyApi.get().then((c) => {
      setConcepts(c.concepts ?? [])
      setHonors(c.honors ?? [])
    })
  }, [])

  return (
    <div>
      <div className="bg-walnut-dark text-cream">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="font-serif text-3xl font-bold">品牌理念</h1>
          <p className="text-cream/70 mt-2">以人为本 · 匠心制造</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold mb-8 text-center">设计理念</h2>
        {concepts.length === 0 ? (
          <p className="text-center text-ink-soft py-8">理念数据暂未录入</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {concepts.map((c) => (
              <div key={c.title} className="rounded-xl bg-white border border-line p-6 text-center hover:border-walnut transition-colors">
                <svg
                  className="w-10 h-10 mx-auto text-walnut mb-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d={CONCEPT_ICONS[c.icon ?? 'other'] ?? CONCEPT_ICONS.other} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="font-medium mb-2">{c.title}</h3>
                <p className="text-sm text-ink-soft leading-6">{c.description}</p>
              </div>
            ))}
          </div>
        )}

        <h2 className="font-serif text-2xl font-bold mt-14 mb-8 text-center">荣誉资质</h2>
        {honors.length === 0 ? (
          <p className="text-center text-ink-soft py-8">荣誉数据暂未录入</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {honors.map((h) => (
              <div key={h.title} className="rounded-xl bg-white border border-line p-6 text-center">
                <svg
                  className="w-10 h-10 mx-auto text-p1 mb-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="9" r="5" />
                  <path d="M8 13.5L6 21l6-3 6 3-2-7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {h.image && <img src={h.image} alt="" className="w-16 h-16 mx-auto mb-3 object-contain" />}
                <h3 className="font-medium">{h.title}</h3>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link to="/about" className="text-walnut text-sm hover:underline">← 返回关于我们</Link>
        </div>
      </div>
    </div>
  )
}
