export default function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: '#9C6B3F', marginBottom: 8 }}>{title}</h2>
      <p style={{ color: '#888' }}>页面骨架占位（Phase 5 实现真实功能）</p>
    </div>
  )
}
