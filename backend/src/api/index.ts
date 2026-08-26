import { get, post, put, del } from './http'

// ---------- 通用类型 ----------
export interface PageResult<T> {
  total: number
  page: number
  page_size: number
  items: T[]
}

export interface RoleBrief {
  code: string
  name: string
}

export interface UserInfo {
  id: number
  username: string
  name: string
  roles: RoleBrief[]
  permissions: string[]
}

// ---------- 认证 ----------
export const authApi = {
  login: (data: { username: string; password: string; captcha: string; captcha_id: string; remember_me?: boolean }) =>
    post<{ access_token: string; token_type: string; expires_in: number; user: UserInfo }>('/sys/auth/login', data),
  me: () => get<UserInfo>('/sys/auth/me'),
  logout: () => post('/sys/auth/logout'),
  changePassword: (data: { old_password: string; new_password: string }) =>
    put('/sys/auth/password', data)
}

// ---------- 用户 ----------
export interface SysUser {
  id: number
  username: string
  name: string
  phone?: string
  id_card?: string
  status: number
  roles: string[]
  last_login_at?: string
  created_date?: string
}

export const userApi = {
  list: (params?: any) => get<PageResult<SysUser>>('/sys/users', params),
  create: (data: any) => post('/sys/users', data),
  update: (id: number, data: any) => put(`/sys/users/${id}`, data),
  remove: (id: number) => del(`/sys/users/${id}`),
  resetPassword: (id: number) => put(`/sys/users/${id}/password/reset`),
  sensitive: (id: number) => get(`/sys/users/${id}/sensitive`)
}

// ---------- 角色/权限 ----------
export interface RoleItem {
  id: number
  code: string
  name: string
  description?: string
  is_preset: number
  permissions: string[]
}
export interface PermissionItem {
  id: number
  code: string
  name: string
  module: string
  action: string
}

export const roleApi = {
  list: () => get<RoleItem[]>('/sys/roles'),
  permissions: () => get<PermissionItem[]>('/sys/permissions')
}

// ---------- 产品 ----------
export interface ProductItem {
  id: number
  name: string
  model?: string
  series_id?: number
  category: string
  category_code: number
  product_type: string
  material_id?: number
  params?: Record<string, string>
  original_price?: number
  discount_price?: number
  cover_image?: string
  images?: string[]
  is_customizable: number
  sort_order: number
  status: number
  view_count: number
  created_date?: string
}

export const productApi = {
  list: (params?: any) => get<PageResult<ProductItem>>('/sys/products', params),
  create: (data: any) => post('/sys/products', data),
  update: (id: number, data: any) => put(`/sys/products/${id}`, data),
  remove: (id: number) => del(`/sys/products/${id}`),
  changeStatus: (id: number, status: number) => put(`/sys/products/${id}/status`, { status })
}

export const seriesApi = {
  list: () => get<any[]>('/sys/series'),
  create: (data: any) => post('/sys/series', data),
  update: (id: number, data: any) => put(`/sys/series/${id}`, data),
  remove: (id: number) => del(`/sys/series/${id}`)
}

// ---------- 新闻 ----------
export interface NewsItem {
  id: number
  title: string
  summary?: string
  category: string
  cover_image?: string
  content: string
  publish_time: string
  view_count: number
}

export const newsApi = {
  list: (params?: any) => get<PageResult<NewsItem>>('/sys/news', params),
  create: (data: any) => post('/sys/news', data),
  update: (id: number, data: any) => put(`/sys/news/${id}`, data),
  remove: (id: number) => del(`/sys/news/${id}`)
}

// ---------- 轮播图 ----------
export interface BannerItem {
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
  platforms?: string[]
  start_date?: string
  end_date?: string
  sort_order: number
  status: number
  impressions: number
  clicks: number
}

export const bannerApi = {
  list: (params?: any) => get<BannerItem[]>('/sys/banners', params),
  create: (data: any) => post('/sys/banners', data),
  update: (id: number, data: any) => put(`/sys/banners/${id}`, data),
  remove: (id: number) => del(`/sys/banners/${id}`),
  sort: (ids: number[]) => put('/sys/banners/sort', { ids })
}

// ---------- 公司介绍 ----------
export const companyApi = {
  get: () => get<any>('/sys/company'),
  update: (data: any) => put('/sys/company', data)
}

// ---------- 职位 ----------
export interface JobItem {
  id: number
  title: string
  job_type: string
  department?: string
  location: string
  headcount?: number
  description?: string
  requirement?: string
  contact_email?: string
  contact_phone?: string
  publish_time: string
  status: number
  view_count: number
}

export const jobApi = {
  list: (params?: any) => get<PageResult<JobItem>>('/sys/jobs', params),
  create: (data: any) => post('/sys/jobs', data),
  update: (id: number, data: any) => put(`/sys/jobs/${id}`, data),
  remove: (id: number) => del(`/sys/jobs/${id}`),
  changeStatus: (id: number, status: number) => put(`/sys/jobs/${id}/status`, { status })
}

// ---------- 留言 ----------
export interface MessageItem {
  id: number
  name: string
  phone: string
  content: string
  source: string
  status: string
  ip?: string
  created_date?: string
}

export const messageApi = {
  list: (params?: any) =>
    get<PageResult<MessageItem> & { new_count: number }>('/sys/messages', params),
  changeStatus: (id: number, status: string) => put(`/sys/messages/${id}/status`, { status }),
  remove: (id: number) => del(`/sys/messages/${id}`)
}

// ---------- 统计 ----------
export const statsApi = {
  overview: () => get<any>('/sys/stats/overview'),
  top: () => get<any>('/sys/stats/top'),
  messages: () => get<any[]>('/sys/stats/messages')
}

// ---------- 审计 ----------
export interface AuditItem {
  id: number
  username: string
  action: string
  resource: string
  resource_id?: number
  detail?: string
  ip?: string
  status: number
  created_date: string
}

export const auditApi = {
  list: (params?: any) => get<PageResult<AuditItem>>('/sys/audits', params)
}

// ---------- 上传 ----------
export const uploadApi = {
  upload: async (file: File): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    const res = await import('./http').then((m) => m.default.post('/sys/upload', form))
    return res.data.data.url as string
  }
}
