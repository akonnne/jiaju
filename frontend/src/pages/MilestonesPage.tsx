import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { companyApi } from '../api'

interface Milestone {
  year: string
  event: string
}

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([])

  useEffect(() => {
    void companyApi.get().then((c) => setMilestones(c.milestones ?? []))
  }, [])

  const sorted = [...milestones].sort((a, b) => b.year.localeCompare(a.year))

  return (
    <div>
      <div className="bg-walnut-dark text-cream">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="font-serif text-3xl font-bold">品牌历程</h1>
          <p className="text-cream/70 mt-2">四十载匠心之路</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {sorted.length === 0 ? (
          <p className="text-center text-ink-soft py-16">历程数据暂未录入</p>
        ) : (
          <ol className="relative border-l-2 border-line ml-3">
            {sorted.map((m) => (
              <li key={m.year} className="mb-10 ml-8 relative">
                <span
                  className="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-walnut border-4 border-cream"
                  aria-hidden="true"
                />
                <div className="font-serif text-2xl font-bold text-walnut">{m.year}</div>
                <p className="text-ink-soft leading-7 mt-1">{m.event}</p>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-8">
          <Link to="/about" className="text-walnut text-sm hover:underline">← 返回关于我们</Link>
        </div>
      </div>
    </div>
  )
}
