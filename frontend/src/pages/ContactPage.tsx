import { useEffect, useState } from 'react'
import { FormEvent } from 'react'
import { companyApi, messageApi } from '../api'
import type { CompanyInfo } from '../api'

/** 留言表单（含 60s 防刷提示）。 */
function ContactForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    // 前端校验
    if (!name.trim()) return setError('请填写姓名')
    if (!/^1[3-9]\d{9}$/.test(phone)) return setError('请填写正确的 11 位手机号')
    if (!content.trim()) return setError('请填写留言内容')

    setSubmitting(true)
    try {
      await messageApi.create({ name: name.trim(), phone, content: content.trim(), source: 'contact' })
      setSuccess(true)
      setName('')
      setPhone('')
      setContent('')
      setTimeout(() => setSuccess(false), 4000)
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setRateLimited(true)
        setTimeout(() => setRateLimited(false), 60000)
      } else {
        setError(err?.response?.data?.message || err?.message || '提交失败')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cf-name" className="block text-sm font-medium mb-1.5">姓名 *</label>
          <input
            id="cf-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="您的称呼"
            className="w-full px-3.5 py-2.5 rounded-md border border-line bg-white focus:border-walnut outline-none"
          />
        </div>
        <div>
          <label htmlFor="cf-phone" className="block text-sm font-medium mb-1.5">联系电话 *</label>
          <input
            id="cf-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="11 位手机号"
            inputMode="numeric"
            className="w-full px-3.5 py-2.5 rounded-md border border-line bg-white focus:border-walnut outline-none"
          />
        </div>
      </div>
      <div>
        <label htmlFor="cf-content" className="block text-sm font-medium mb-1.5">留言内容 *</label>
        <textarea
          id="cf-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="想了解产品、报价或加盟信息，请留言…"
          rows={4}
          maxLength={500}
          className="w-full px-3.5 py-2.5 rounded-md border border-line bg-white focus:border-walnut outline-none resize-none"
        />
      </div>

      {error && <p role="alert" className="text-danger text-sm">{error}</p>}
      {rateLimited && <p role="alert" className="text-danger text-sm">提交过于频繁，请 60 秒后再试</p>}
      {success && (
        <div role="status" className="px-4 py-3 rounded-md bg-success/10 text-success text-sm">
          提交成功，我们将尽快与您联系
        </div>
      )}
      {!rateLimited && (
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-8 py-3 rounded-md bg-walnut text-cream font-medium hover:bg-walnut-dark transition-colors disabled:opacity-60"
        >
          {submitting ? '提交中…' : '提交留言'}
        </button>
      )}
    </form>
  )
}

export default function ContactPage() {
  const [company, setCompany] = useState<CompanyInfo>({})

  useEffect(() => {
    void companyApi.get().then(setCompany)
  }, [])

  const cards = [
    { label: '公司地址', value: company.address || '浙江省杭州市余杭区 YT 工业园' },
    { label: '联系电话', value: company.phone || '400-888-0000' },
    { label: '电子邮箱', value: company.email || 'service@yt-furniture.com' },
    { label: '营业时间', value: company.business_hours || '周一至周日 9:00-18:00' }
  ]

  return (
    <div>
      <div className="bg-walnut-dark text-cream">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="font-serif text-3xl font-bold">联系我们</h1>
          <p className="text-cream/70 mt-2">期待与您的每一次沟通</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* 左：联系卡 + 地图占位 */}
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map((c) => (
              <div key={c.label} className="rounded-xl bg-white border border-line p-5">
                <h3 className="text-sm text-walnut font-medium mb-1.5">{c.label}</h3>
                <p className="text-sm text-ink-soft leading-6">{c.value}</p>
              </div>
            ))}
          </div>
          {/* 地图占位 */}
          <div className="mt-4 rounded-xl bg-sand border border-line p-8 text-center relative">
            <p className="text-ink-soft text-sm">{company.address || '浙江省杭州市余杭区 YT 工业园'}</p>
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-p1/15 text-p1 text-[10px] font-semibold">
              P1 · 地图接入
            </span>
          </div>
        </div>

        {/* 右：留言表单 */}
        <div className="rounded-xl bg-white border border-line p-8">
          <h2 className="font-serif text-xl font-bold mb-1">在线留言</h2>
          <p className="text-sm text-ink-soft mb-6">留下您的需求，我们会尽快与您联系</p>
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
