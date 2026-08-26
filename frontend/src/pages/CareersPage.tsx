import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { jobApi } from '../api'

export default function CareersPage() {
  const [socialCount, setSocialCount] = useState(0)
  const [campusCount, setCampusCount] = useState(0)

  useEffect(() => {
    void Promise.all([
      jobApi.list({ job_type: 'social', page: 1, page_size: 1 }),
      jobApi.list({ job_type: 'campus', page: 1, page_size: 1 })
    ]).then(([s, c]) => {
      setSocialCount(s.total)
      setCampusCount(c.total)
    })
  }, [])

  return (
    <div>
      {/* 深色 Hero */}
      <div className="bg-ink text-cream">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="font-serif text-4xl font-bold mb-4">加入 YT 家具</h1>
          <p className="text-cream/70 max-w-xl mx-auto">
            匠心四十载，与优秀的你同行。这里有成长空间、有并肩伙伴，
            更有让产品走进千家万户的成就感。
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 社会招聘卡 */}
        <Link
          to="/careers/social"
          className="group rounded-2xl bg-white border border-line p-10 text-center hover:shadow-card transition-shadow"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-walnut/10 text-walnut flex items-center justify-center mb-5" aria-hidden="true">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" strokeLinecap="round" />
              <circle cx="10" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold mb-2">社会招聘</h2>
          <p className="text-ink-soft text-sm mb-5">销售、生产、职能等社招岗位</p>
          <span className="inline-block px-5 py-2 rounded-md bg-walnut text-cream text-sm group-hover:bg-walnut-dark transition-colors">
            查看职位（在招 {socialCount} 个）
          </span>
        </Link>

        {/* 校园招聘卡 */}
        <Link
          to="/careers/campus"
          className="group rounded-2xl bg-white border border-line p-10 text-center hover:shadow-card transition-shadow"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-walnut/10 text-walnut flex items-center justify-center mb-5" aria-hidden="true">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 10L12 5 2 10l10 5 10-5z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 10v6" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold mb-2">校园招聘</h2>
          <p className="text-ink-soft text-sm mb-5">面向应届毕业生的人才计划</p>
          <span className="inline-block px-5 py-2 rounded-md bg-walnut text-cream text-sm group-hover:bg-walnut-dark transition-colors">
            查看职位（在招 {campusCount} 个）
          </span>
        </Link>
      </div>
    </div>
  )
}
