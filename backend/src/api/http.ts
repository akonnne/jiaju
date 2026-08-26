import axios from 'axios'
import { message } from 'antd'

// 后台 API 客户端：baseURL 指向 /api，由 vite proxy 转发到 FastAPI(:8000)
const http = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// 请求拦截：自动附带 Bearer Token（与 useAuthStore 持久化 key 同步）
http.interceptors.request.use((cfg) => {
  try {
    const raw = localStorage.getItem('yt-auth')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.state?.token) {
        cfg.headers.Authorization = `Bearer ${parsed.state.token}`
      }
    }
  } catch {
    /* ignore */
  }
  return cfg
})

// 响应拦截：统一解包 {code,data,message}；401 登出跳转、403 提示、业务码报错
http.interceptors.response.use(
  (res) => {
    const body = res.data
    // 非 JSON 响应（CSV 导出等）直接返回
    if (typeof body !== 'object' || body === null || body.code === undefined) {
      return res
    }
    if (body.code !== 0) {
      const err = new Error(body.message || '请求失败') as Error & { code?: number }
      err.code = body.code
      return Promise.reject(err)
    }
    return res
  },
  (err) => {
    const status = err.response?.status
    if (status === 401) {
      try {
        localStorage.removeItem('yt-auth')
      } catch {
        /* ignore */
      }
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    } else if (status === 403) {
      message.error(err.response?.data?.message || '无操作权限')
    }
    return Promise.reject(err)
  }
)

// 便捷方法：直接返回 data 字段
export const get = async <T = any>(url: string, params?: any): Promise<T> => {
  const res = await http.get(url, { params })
  return res.data.data as T
}

export const post = async <T = any>(url: string, data?: any): Promise<T> => {
  const res = await http.post(url, data)
  return res.data.data as T
}

export const put = async <T = any>(url: string, data?: any): Promise<T> => {
  const res = await http.put(url, data)
  return res.data.data as T
}

export const del = async <T = any>(url: string): Promise<T> => {
  const res = await http.delete(url)
  return res.data.data as T
}

export default http
