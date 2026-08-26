import { useEffect, useState } from 'react'
import { Button, Checkbox, Form, Input, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { useAuthStore } from '../store/useAuthStore'

interface LoginForm {
  username: string
  password: string
  captcha: string
  remember_me: boolean
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [captchaSvg, setCaptchaSvg] = useState('')
  const [captchaId, setCaptchaId] = useState('')
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const refreshCaptcha = async () => {
    try {
      const resp = await fetch('/api/sys/auth/captcha', { cache: 'no-store' })
      const svg = await resp.text()
      const id = resp.headers.get('X-Captcha-Id') || ''
      setCaptchaSvg(svg)
      setCaptchaId(id)
    } catch {
      message.error('验证码加载失败')
    }
  }

  // 首次挂载加载验证码
  useEffect(() => {
    void refreshCaptcha()
  }, [])

  const onFinish = async (values: LoginForm) => {
    setLoading(true)
    try {
      const data = await authApi.login({
        username: values.username,
        password: values.password,
        captcha: values.captcha,
        captcha_id: captchaId,
        remember_me: values.remember_me
      })
      login(data.access_token, data.user)
      message.success('登录成功')
      navigate('/', { replace: true })
    } catch (e: any) {
      const lockUntil = e?.response?.data?.data?.lock_until
      if (lockUntil) {
        message.error(`账号已锁定至 ${lockUntil}，请稍后再试`)
      } else {
        message.error(e?.response?.data?.message || e?.message || '登录失败')
      }
      void refreshCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="login-wrap"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2B2520 0%, #5F4730 55%, #7A5C3E 100%)',
        padding: 16
      }}
    >
      <div
        style={{
          width: 400,
          maxWidth: '100%',
          background: '#fff',
          borderRadius: 12,
          padding: '36px 32px 28px',
          boxShadow: '0 16px 48px rgba(0,0,0,.28)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              margin: '0 auto 12px',
              borderRadius: 12,
              background: '#7A5C3E',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 700
            }}
          >
            YT
          </div>
          <h1 style={{ margin: 0, fontSize: 20, color: '#2B2520' }}>YT 家具 · 后台管理系统</h1>
          <p style={{ margin: '6px 0 0', color: '#8A8176', fontSize: 13 }}>企业后台 · 内部人员登录</p>
        </div>

        <Form<LoginForm> onFinish={onFinish} size="large" initialValues={{ remember_me: true }}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined />} placeholder="账号（如 10000）" autoFocus />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item name="captcha" rules={[{ required: true, message: '请输入验证码' }]}>
            <div style={{ display: 'flex', gap: 10 }}>
              <Input placeholder="验证码" maxLength={4} />
              <div
                onClick={refreshCaptcha}
                title="点击刷新"
                style={{
                  width: 120,
                  height: 40,
                  cursor: 'pointer',
                  border: '1px solid #E8E2D9',
                  borderRadius: 6,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                dangerouslySetInnerHTML={{ __html: captchaSvg || '点击加载' }}
              />
            </div>
          </Form.Item>
          <Form.Item name="remember_me" valuePropName="checked" style={{ marginBottom: 16 }}>
            <Checkbox>记住我（7 天免登录）</Checkbox>
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            登 录
          </Button>
        </Form>
      </div>
    </div>
  )
}
