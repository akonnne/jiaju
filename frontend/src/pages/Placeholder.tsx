export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <h1 className="font-serif text-3xl text-walnut mb-3">{title}</h1>
      <p className="text-ink-light">页面骨架占位（Phase 6 实现真实内容）</p>
    </div>
  )
}
