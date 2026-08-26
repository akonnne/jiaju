// 统一响应结构（与 api/app/utils/response.py 对应）
export interface ApiResp<T = unknown> {
  code: number
  message: string
  data: T
}

// 分页结构
export interface PageData<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}
