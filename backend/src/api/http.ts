import axios from 'axios'

// 后台 API 客户端：baseURL 指向 /api，由 vite proxy 转发到 FastAPI(:8000)
const http = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// 请求拦截：自动附带 Bearer Token
http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`
  }
  return cfg
})

// 响应拦截：401 清除令牌（Phase 5 接入跳转登录）
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
    }
    return Promise.reject(err)
  }
)

export default http
