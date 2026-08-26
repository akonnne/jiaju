import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { jobApi } from '../api'
import type { JobDetail } from '../api'
import { sanitizeHtml } from '../utils/sanitize'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setNotFound(false)
    void jobApi.detail(Number(id)).then(setJob).catch(() => setNotFound(true))
  }, [id])

  if (notFound) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="font-serif text-2xl mb-4">职位不存在或已关闭</h1>
        <Link to="/careers" className="text-walnut underline">返回招聘主页</Link>
      </div>
    )
  }
  if (!job) {
    return <div className="text-center py-24 text-ink-soft">加载中…</div>
  }

  return (
    <div className="max-w-[860px] mx-auto px-4 py-10">
      <nav aria-label="面包屑" className="text-sm text-ink-soft mb-6">
        <Link to="/" className="hover:text-walnut">首页</Link>
        <span className="mx-2">/</span>
        <Link to="/careers" className="hover:text-walnut">招聘</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{job.title}</span>
      </nav>

      <h1 className="font-serif text-[28px] font-bold mb-3">{job.title}</h1>
      <div className="flex flex-wrap gap-2 text-xs text-ink-soft mb-8">
        <span className="px-2.5 py-1 rounded bg-sand">{job.job_type === 'social' ? '社会招聘' : '校园招聘'}</span>
        {job.department && <span className="px-2.5 py-1 rounded bg-sand">{job.department}</span>}
        <span className="px-2.5 py-1 rounded bg-sand">{job.location}</span>
        {job.headcount != null && <span className="px-2.5 py-1 rounded bg-sand">招聘 {job.headcount} 人</span>}
        <span className="px-2.5 py-1 rounded bg-sand">{job.publish_time}</span>
      </div>

      {job.description && (
        <section className="mb-8">
          <h2 className="font-serif text-lg font-bold border-b border-line pb-2 mb-4">职位描述 / 职责</h2>
          <div className="rich-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.description) }} />
        </section>
      )}

      {job.requirement && (
        <section className="mb-8">
          <h2 className="font-serif text-lg font-bold border-b border-line pb-2 mb-4">任职要求</h2>
          <div className="rich-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.requirement) }} />
        </section>
      )}

      <section className="bg-sand rounded-xl p-6">
        <h2 className="font-serif text-lg font-bold mb-4">投递方式</h2>
        <div className="flex flex-wrap gap-4">
          {job.contact_email && (
            <a
              href={`mailto:${job.contact_email}`}
              className="px-6 py-2.5 rounded-md bg-walnut text-cream text-sm hover:bg-walnut-dark transition-colors"
            >
              邮件投递：{job.contact_email}
            </a>
          )}
          {job.contact_phone && (
            <a
              href={`tel:${job.contact_phone}`}
              className="px-6 py-2.5 rounded-md border border-walnut text-walnut text-sm hover:bg-walnut/10 transition-colors"
            >
              电话咨询：{job.contact_phone}
            </a>
          )}
          {!job.contact_email && !job.contact_phone && (
            <span className="text-ink-soft text-sm">请通过公司招聘邮箱投递简历</span>
          )}
        </div>
      </section>
    </div>
  )
}
