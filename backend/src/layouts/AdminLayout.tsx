import { useEffect, useState } from 'react'
import { Avatar, Badge, Dropdown, Layout, Menu, message } from 'antd'
import {
  BarChartOutlined,
  FileTextOutlined,
  HomeOutlined,
  IdcardOutlined,
  LogoutOutlined,
  MessageOutlined,
  PictureOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { authApi, messageApi } from '../api'

const { Sider, Header, Content } = Layout

// 菜单项：perm 用于按权限过滤
const MENU_ITEMS = [
  { key: '/', icon: <HomeOutlined />, label: '工作台', perm: 'stats:read' },
  { key: '/products', icon: <ShopOutlined />, label: '产品管理', perm: 'product:read' },
  { key: '/news', icon: <FileTextOutlined />, label: '新闻管理', perm: 'news:read' },
  { key: '/banners', icon: <PictureOutlined />, label: '轮播图管理', perm: 'banner:read' },
  { key: '/company', icon: <IdcardOutlined />, label: '公司介绍', perm: 'company:read' },
  { key: '/jobs', icon: <TeamOutlined />, label: '职位管理', perm: 'job:read' },
  { key: '/messages', icon: <MessageOutlined />, label: '留言线索', perm: 'message:read' },
  { key: '/users', icon: <UserOutlined />, label: '用户管理', perm: 'user:read' },
  { key: '/roles', icon: <SafetyCertificateOutlined />, label: '角色与权限', perm: 'role:read' },
  { key: '/audits', icon: <BarChartOutlined />, label: '操作日志', perm: 'audit:read' }
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const hasPerm = useAuthStore((s) => s.hasPerm)
  const logout = useAuthStore((s) => s.logout)
  const [newCount, setNewCount] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  const items = MENU_ITEMS.filter((m) => !m.perm || hasPerm(m.perm))

  // 留言未读数：登录拉一次 + 每 30s 轮询
  const fetchNewCount = async () => {
    try {
      if (hasPerm('message:read')) {
        const data = await messageApi.list({ page: 1, page_size: 1 })
        setNewCount(data.new_count ?? 0)
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void fetchNewCount()
    const timer = setInterval(fetchNewCount, 30000)
    return () => clearInterval(timer)
  }, [hasPerm])

  const onLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      /* ignore */
    }
    logout()
    message.success('已退出登录')
    navigate('/login', { replace: true })
  }

  const selectedKey =
    '/' + (location.pathname.split('/')[1] || '')

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={216}
        style={{ background: '#2B2520' }}
        theme="dark"
      >
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: '#FAF7F1',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: 1
          }}
        >
          {!collapsed ? 'YT 后台管理' : 'YT'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items.map((m) => ({
            key: m.key,
            icon: m.key === '/messages' ? (
              <Badge count={newCount} size="small" offset={[4, -2]}>
                {m.icon}
              </Badge>
            ) : (
              m.icon
            ),
            label: m.label
          }))}
          onClick={(e) => navigate(e.key)}
          style={{ background: 'transparent', borderInlineEnd: 'none' }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderBottom: '1px solid #F1ECE4',
            height: 56
          }}
        >
          <Dropdown
            menu={{
              items: [
                { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: onLogout }
              ]
            }}
          >
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size={30} style={{ background: '#7A5C3E' }}>
                {user?.name?.[0] || 'U'}
              </Avatar>
              <span style={{ color: '#2B2520', fontWeight: 600 }}>{user?.name || ''}</span>
              <span style={{ color: '#8A8176', fontSize: 12 }}>{user?.username}</span>
            </span>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, background: '#F4F1EC', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
