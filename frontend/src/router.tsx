import { createBrowserRouter } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import * as P from './pages/placeholders'

// 前台 14 个路由（对应产品原型页面）
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <P.Home /> },
      { path: 'products', element: <P.Products /> },
      { path: 'products/:id', element: <P.ProductDetail /> },
      { path: 'cases', element: <P.CasesPlaceholder /> },
      { path: 'news', element: <P.News /> },
      { path: 'news/:id', element: <P.NewsDetail /> },
      { path: 'careers', element: <P.Careers /> },
      { path: 'careers/social', element: <P.CareersSocial /> },
      { path: 'careers/campus', element: <P.CareersCampus /> },
      { path: 'careers/:id', element: <P.JobDetail /> },
      { path: 'about', element: <P.About /> },
      { path: 'about/milestones', element: <P.AboutMilestones /> },
      { path: 'about/brand', element: <P.AboutBrand /> },
      { path: 'contact', element: <P.Contact /> }
    ]
  }
])
