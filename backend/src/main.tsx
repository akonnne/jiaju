import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { App as AntApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { router } from './router'
import './index.css'

// AntD 主题：对齐 UIUX 规范 token（胡桃木主色 #7A5C3E / 墨色 / 米白）
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#7A5C3E',
          colorInfo: '#7A5C3E',
          colorSuccess: '#3E6B45',
          colorError: '#C0392B',
          colorWarning: '#B0762A',
          colorBgLayout: '#F4F1EC',
          borderRadius: 6,
          fontSize: 14
        },
        components: {
          Menu: {
            darkItemBg: '#2B2520',
            darkItemSelectedBg: '#7A5C3E',
            darkItemColor: '#D8CFC0',
            darkItemHoverColor: '#FAF7F1'
          }
        }
      }}
    >
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
)
