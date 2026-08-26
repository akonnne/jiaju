import axios from 'axios'

// 前台 API 客户端：baseURL 指向 /api，由 vite proxy 转发到 FastAPI(:8000)
const http = axios.create({
  baseURL: '/api',
  timeout: 15000
})

export default http
