import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { productApi } from '../api'
import type { ProductDetail } from '../api'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [mainImage, setMainImage] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setNotFound(false)
    void productApi
      .detail(Number(id))
      .then((p) => {
        setProduct(p)
        setMainImage(p.cover_image || p.images?.[0] || '')
      })
      .catch(() => setNotFound(true))
  }, [id])

  if (notFound) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="font-serif text-2xl mb-4">产品不存在或已下架</h1>
        <Link to="/products" className="text-walnut underline">返回产品中心</Link>
      </div>
    )
  }

  if (!product) {
    return <div className="text-center py-24 text-ink-soft">加载中…</div>
  }

  const images = [product.cover_image, ...(product.images ?? [])].filter(Boolean) as string[]
  const params = product.params ?? {}
  const price = product.discount_price ?? product.original_price

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 面包屑 */}
      <nav aria-label="面包屑" className="text-sm text-ink-soft mb-6">
        <Link to="/" className="hover:text-walnut">首页</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-walnut">产品中心</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* 左：主图 + 缩略图 */}
        <div>
          <div className="rounded-xl overflow-hidden bg-white border border-line h-[460px] flex items-center justify-center">
            {mainImage ? (
              <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-serif text-3xl text-walnut">YT</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 mt-4" role="group" aria-label="产品缩略图">
              {images.map((img) => (
                <button
                  key={img}
                  onClick={() => setMainImage(img)}
                  className={`w-20 h-20 rounded-md overflow-hidden border-2 ${
                    mainImage === img ? 'border-walnut' : 'border-line hover:border-walnut/50'
                  }`}
                  aria-label="切换主图"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 右：信息 */}
        <div>
          <div className="text-sm text-walnut mb-2">
            {product.category} · {product.product_type}
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">{product.name}</h1>
          {product.model && <p className="text-ink-soft text-sm mb-4">型号：{product.model}</p>}
          {product.series && (
            <p className="text-sm mb-4">
              所属系列：
              <Link to={`/products?series_id=${product.series_id}`} className="text-walnut hover:underline">
                {product.series.name}
              </Link>
            </p>
          )}

          <div className="flex items-baseline gap-3 mb-6">
            {price != null ? (
              <>
                <span className="text-2xl font-bold text-danger">
                  ¥{price.toLocaleString()}
                </span>
                {product.discount_price != null && product.original_price != null && (
                  <span className="text-ink-soft line-through">¥{product.original_price.toLocaleString()}</span>
                )}
              </>
            ) : (
              <span className="text-xl text-ink-soft">价格面议</span>
            )}
            {product.is_customizable === 1 && (
              <span className="px-2 py-0.5 rounded bg-p1/15 text-p1 text-xs font-medium">支持定制</span>
            )}
          </div>

          <Link
            to="/contact"
            className="inline-block px-8 py-3 rounded-md bg-walnut text-cream font-medium hover:bg-walnut-dark transition-colors"
          >
            立即咨询
          </Link>

          {/* 参数表 */}
          {Object.keys(params).length > 0 && (
            <dl className="mt-8 border-t border-line pt-6">
              {Object.entries(params).map(([k, v]) => (
                <div key={k} className="flex py-2 border-b border-line/60">
                  <dt className="w-28 text-ink-soft text-sm shrink-0">{k}</dt>
                  <dd className="text-sm">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {/* 图文描述 */}
      {product.description && (
        <div className="mt-12">
          <h2 className="font-serif text-xl font-bold mb-4">产品详情</h2>
          <div className="rich-content bg-white rounded-xl p-6 border border-line" dangerouslySetInnerHTML={{ __html: product.description }} />
        </div>
      )}
    </div>
  )
}
