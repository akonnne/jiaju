import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import BannerSwiper from '../components/BannerSwiper'
import { MemoryRouter } from 'react-router-dom'

describe('BannerSwiper', () => {
  it('空数据时显示占位', () => {
    render(
      <MemoryRouter>
        <BannerSwiper banners={[]} />
      </MemoryRouter>
    )
    expect(screen.getByText('暂无轮播图')).toBeInTheDocument()
  })

  it('有数据时渲染标题', () => {
    render(
      <MemoryRouter>
        <BannerSwiper
          banners={[
            {
              id: 1,
              group_code: 'home',
              title: '云栖系列新品上市',
              image: '/b1.jpg',
              link_type: 'internal',
              link_target: '/products',
              sort_order: 1
            }
          ]}
        />
      </MemoryRouter>
    )
    expect(screen.getByAltText('云栖系列新品上市')).toBeInTheDocument()
  })
})
