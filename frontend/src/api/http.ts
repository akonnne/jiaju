import axios from 'axios'

// 前台 API 客户端：baseURL 指向 /api，由 vite proxy 转发到 FastAPI(:8000)
const http = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// 统一响应拦截：{code!==0} 抛错；直接返回 data
http.interceptors.response.use(
  (res) => {
    const body = res.data
    if (typeof body === 'object' && body !== null && body.code !== undefined) {
      if (body.code !== 0) {
        return Promise.reject(new Error(body.message || '请求失败'))
      }
      res.data = body.data
    }
    return res
  },
  (err) => Promise.reject(err)
)

export const get = async <T = any>(url: string, params?: any): Promise<T> => {
  const res = await http.get(url, { params })
  return res.data as T
}

export const post = async <T = any>(url: string, data?: any): Promise<T> => {
  const res = await http.post(url, data)
  return res.data as T
}

export default http
