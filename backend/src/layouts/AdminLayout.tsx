import { Outlet, Link } from 'react-router-dom'
import { Layout, Menu } from 'antd'

const { Header, Sider, Content } = Layout

export default function AdminLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={200}>
        <div
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: '#9C6B3F'
          }}
        >
          YT 后台
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={['dashboard']}
          items={[
            { key: 'dashboard', label: <Link to="/">工作台</Link> },
            { key: 'products', label: <Link to="/products">产品管理</Link> },
            { key: 'news', label: <Link to="/news">新闻管理</Link> },
            { key: 'banners', label: <Link to="/banners">轮播图</Link> },
            { key: 'company', label: <Link to="/company">公司介绍</Link> },
            { key: 'jobs', label: <Link to="/jobs">职位管理</Link> },
            { key: 'messages', label: <Link to="/messages">留言管理</Link> },
            { key: 'users', label: <Link to="/users">用户管理</Link> },
            { key: 'roles', label: <Link to="/roles">角色权限</Link> },
            { key: 'audits', label: <Link to="/audits">操作日志</Link> }
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', paddingLeft: 16 }}>
          YT 家具官网 · 后台管理系统
        </Header>
        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
