import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { jobApi } from '../api'
import type { JobItem } from '../api'

const PAGE_SIZE = 10

/** 社会招聘 / 校园招聘共用列表（按 /careers/:type 路由区分） */
export default function CareersListPage() {
  const { type } = useParams<{ type: string }>()
  const jobType = type === 'campus' ? 'campus' : 'social'
  const [rows, setRows] = useState<JobItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await jobApi.list({ job_type: jobType, page, page_size: PAGE_SIZE })
      setRows(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [jobType, page])

  useEffect(() => {
    setPage(1)
    void load()
  }, [jobType])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <div className="bg-walnut-dark text-cream">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="font-serif text-3xl font-bold">
            {jobType === 'social' ? '社会招聘' : '校园招聘'}
          </h1>
          <p className="text-cream/70 mt-2">共 {total} 个在招职位</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-16 text-ink-soft">加载中…</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-ink-soft">暂无在招职位</div>
        ) : (
          <ul className="space-y-4">
            {rows.map((j) => (
              <li key={j.id}>
                <Link
                  to={`/careers/${j.id}`}
                  className="flex items-center justify-between gap-4 p-5 rounded-xl bg-white border border-line hover:border-walnut transition-colors"
                >
                  <div>
                    <h2 className="font-medium mb-2">{j.title}</h2>
                    <div className="flex flex-wrap gap-2 text-xs text-ink-soft">
                      <span className="px-2 py-0.5 rounded bg-sand">{jobType === 'social' ? '社会招聘' : '校园招聘'}</span>
                      {j.department && <span className="px-2 py-0.5 rounded bg-sand">{j.department}</span>}
                      <span className="px-2 py-0.5 rounded bg-sand">{j.location}</span>
                      {j.headcount != null && <span className="px-2 py-0.5 rounded bg-sand">招 {j.headcount} 人</span>}
                    </div>
                  </div>
                  <span className="text-sm text-ink-soft shrink-0">{j.publish_time}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 rounded-md border border-line bg-white text-sm disabled:opacity-40"
            >
              上一页
            </button>
            <span className="text-sm text-ink-soft self-center">{page} / {totalPages} 页</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
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
