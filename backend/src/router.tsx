import { createBrowserRouter, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import RequireAuth from './router/RequireAuth'
import RequirePerm from './router/RequirePerm'
import LoginPage from './pages/LoginPage'
import ForbiddenPage from './pages/ForbiddenPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import NewsPage from './pages/NewsPage'
import BannersPage from './pages/BannersPage'
import CompanyPage from './pages/CompanyPage'
import JobsPage from './pages/JobsPage'
import MessagesPage from './pages/MessagesPage'
import UsersPage from './pages/UsersPage'
import RolesPage from './pages/RolesPage'
import AuditsPage from './pages/AuditsPage'

// 后台 12 路由：登录 + 403 + 10 管理视图（挂登录守卫 + 权限守卫）
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/403', element: <ForbiddenPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: (
          <RequirePerm perm="stats:read">
            <DashboardPage />
          </RequirePerm>
        )
      },
      {
        path: 'products',
        element: (
          <RequirePerm perm="product:read">
            <ProductsPage />
          </RequirePerm>
        )
      },
      {
        path: 'news',
        element: (
          <RequirePerm perm="news:read">
            <NewsPage />
          </RequirePerm>
        )
      },
      {
        path: 'banners',
        element: (
          <RequirePerm perm="banner:read">
            <BannersPage />
          </RequirePerm>
        )
      },
      {
        path: 'company',
        element: (
          <RequirePerm perm="company:read">
            <CompanyPage />
          </RequirePerm>
        )
      },
      {
        path: 'jobs',
        element: (
          <RequirePerm perm="job:read">
            <JobsPage />
          </RequirePerm>
        )
      },
      {
        path: 'messages',
        element: (
          <RequirePerm perm="message:read">
            <MessagesPage />
          </RequirePerm>
        )
      },
      {
        path: 'users',
        element: (
          <RequirePerm perm="user:read">
            <UsersPage />
          </RequirePerm>
        )
      },
      {
        path: 'roles',
        element: (
          <RequirePerm perm="role:read">
            <RolesPage />
          </RequirePerm>
        )
      },
      {
        path: 'audits',
        element: (
          <RequirePerm perm="audit:read">
            <AuditsPage />
          </RequirePerm>
        )
      }
    ]
  },
  { path: '*', element: <Navigate to="/" replace /> }
])
