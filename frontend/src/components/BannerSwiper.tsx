import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { Link } from 'react-router-dom'
import type { Banner } from '../api'

interface BannerSwiperProps {
  banners: Banner[]
  height?: number
}

/** 轮播组件：autoplay 5s + 分页 + 箭头；图片懒加载；无数据时显示占位。 */
export default function BannerSwiper({ banners, height = 480 }: BannerSwiperProps) {
  if (!banners.length) {
    return (
      <div
        className="flex items-center justify-center bg-sand"
        style={{ height }}
        aria-hidden="true"
      >
        <span className="text-ink-soft">暂无轮播图</span>
      </div>
    )
  }

  return (
    <Swiper
      modules={[Autoplay, Navigation, Pagination]}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      navigation
      pagination={{ clickable: true }}
      loop={banners.length > 1}
      className="banner-swiper"
      style={{ height }}
    >
      {banners.map((b) => {
        const inner = (
          <>
            <img
              src={b.image}
              alt={b.title || '轮播图'}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            {(b.title || b.subtitle) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 text-center px-4">
                {b.title && (
                  <h2 className="text-cream font-serif text-3xl md:text-5xl mb-3 drop-shadow-lg">
                    {b.title}
                  </h2>
                )}
                {b.subtitle && (
                  <p className="text-cream/90 text-base md:text-xl mb-4 drop-shadow">{b.subtitle}</p>
                )}
                {b.button_text && (
                  <span className="px-6 py-2.5 rounded-md bg-walnut text-cream text-sm hover:bg-walnut-dark transition-colors">
                    {b.button_text}
                  </span>
                )}
              </div>
            )}
          </>
        )
        return (
          <SwiperSlide key={b.id}>
            {b.link_type === 'external' && b.link_target ? (
              <a href={b.link_target} target="_blank" rel="noreferrer" className="block h-full">
                {inner}
              </a>
            ) : b.link_target ? (
              <Link to={b.link_target} className="block h-full">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </SwiperSlide>
        )
      })}
    </Swiper>
  )
}
