import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CasesPage from './pages/CasesPage'
import NewsPage from './pages/NewsPage'
import NewsDetailPage from './pages/NewsDetailPage'
import CareersPage from './pages/CareersPage'
import CareersListPage from './pages/CareersListPage'
import JobDetailPage from './pages/JobDetailPage'
import AboutPage from './pages/AboutPage'
import MilestonesPage from './pages/MilestonesPage'
import BrandPage from './pages/BrandPage'
import ContactPage from './pages/ContactPage'

// 前台 14 页路由（技术文档 v1.7 §5.3）
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'cases', element: <CasesPage /> },
      { path: 'news', element: <NewsPage /> },
      { path: 'news/:id', element: <NewsDetailPage /> },
      { path: 'careers', element: <CareersPage /> },
      { path: 'careers/social', element: <CareersListPage /> },
      { path: 'careers/campus', element: <CareersListPage /> },
      { path: 'careers/:id', element: <JobDetailPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'about/milestones', element: <MilestonesPage /> },
      { path: 'about/brand', element: <BrandPage /> },
      { path: 'contact', element: <ContactPage /> }
    ]
  },
  { path: '*', element: <Navigate to="/" replace /> }
])
