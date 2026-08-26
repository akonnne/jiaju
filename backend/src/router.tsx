import { createBrowserRouter, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import * as P from './pages/placeholders'
import Login from './pages/Login'

// 后台 11 个视图（登录 + 10 个管理页）
export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <P.Dashboard /> },
      { path: 'products', element: <P.Products /> },
      { path: 'news', element: <P.News /> },
      { path: 'banners', element: <P.Banners /> },
      { path: 'company', element: <P.Company /> },
      { path: 'jobs', element: <P.Jobs /> },
      { path: 'messages', element: <P.Messages /> },
      { path: 'users', element: <P.Users /> },
      { path: 'roles', element: <P.Roles /> },
      { path: 'audits', element: <P.Audits /> }
    ]
  },
  { path: '*', element: <Navigate to="/" replace /> }
])
