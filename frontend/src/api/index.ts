import { get, post } from './http'

// ---------- 通用类型 ----------
export interface PageResult<T> {
  total: number
  page: number
  page_size: number
  items: T[]
}

export interface Banner {
  id: number
  group_code: string
  title?: string
  subtitle?: string
  image: string
  image_mobile?: string
  link_type: string
  link_target?: string
  button_text?: string
  button_color?: string
  sort_order: number
}

export interface Series {
  id: number
  name: string
  description?: string
  cover_image?: string
}

export interface ProductListItem {
  id: number
  name: string
  model?: string
  series?: { id: number; name: string } | null
  category: string
  cover_image?: string
  original_price?: number
  discount_price?: number
  view_count: number
}

export interface ProductDetail extends ProductListItem {
  series_id?: number
  category_code: number
  product_type: string
  description?: string
  params?: Record<string, string> | null
  images?: string[] | null
  is_customizable: number
}

export interface NewsItem {
  id: number
  title: string
  summary?: string
  category: string
  cover_image?: string
  publish_time: string
  view_count: number
}

export interface NewsDetail extends NewsItem {
  content: string
}

export interface JobItem {
  id: number
  title: string
  job_type: string
  department?: string
  location: string
  headcount?: number
  publish_time: string
  view_count: number
}

export interface JobDetail extends JobItem {
  description?: string
  requirement?: string
  contact_email?: string
  contact_phone?: string
}

export interface CompanyInfo {
  slogan?: string
  intro?: string
  milestones?: { year: string; event: string }[]
  honors?: { title: string; image?: string }[]
  concepts?: { title: string; description: string; icon?: string }[]
  address?: string
  phone?: string
  email?: string
  business_hours?: string
  job_email?: string
  job_phone?: string
}

// ---------- API 模块 ----------
export const bannerApi = {
  list: () => get<Banner[]>('/public/banners')
}

export const seriesApi = {
  list: () => get<Series[]>('/public/series')
}

export const productApi = {
  list: (params?: { series_id?: number; category?: string; keyword?: string; page?: number; page_size?: number }) =>
    get<PageResult<ProductListItem>>('/public/products', params),
  detail: (id: number) => get<ProductDetail>(`/public/products/${id}`)
}

export const newsApi = {
  list: (params?: { category?: string; page?: number; page_size?: number }) =>
    get<PageResult<NewsItem>>('/public/news', params),
  detail: (id: number) => get<NewsDetail>(`/public/news/${id}`)
}

export const jobApi = {
  list: (params?: { job_type?: string; page?: number; page_size?: number }) =>
    get<PageResult<JobItem>>('/public/jobs', params),
  detail: (id: number) => get<JobDetail>(`/public/jobs/${id}`)
}

export const companyApi = {
  get: () => get<CompanyInfo>('/public/company')
}

export const messageApi = {
  create: (data: { name: string; phone: string; content: string; source?: string }) =>
    post<{ id: number; created_at: string }>('/public/messages', data)
}
