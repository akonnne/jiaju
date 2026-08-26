import { useState } from 'react'
import { App, Button, Space, Tooltip, Typography } from 'antd'
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'

interface SensitiveViewProps {
  value?: string | null
  endpoint?: string
  extraData?: any
  /** 若直接传入明文则无需调接口 */
  realValue?: string | null
}

/** 脱敏字段查看：默认显示脱敏值，点击眼睛 → 确认 → 调接口授权查看（写 audit_log）。 */
export default function SensitiveView({ value, endpoint, extraData, realValue }: SensitiveViewProps) {
  const { modal, message } = App.useApp()
  const [revealed, setRevealed] = useState(false)
  const [revealedValue, setRevealedValue] = useState<string | null>(null)

  const onReveal = async () => {
    if (realValue != null) {
      setRevealed(true)
      setRevealedValue(realValue)
      return
    }
    if (!endpoint) return
    try {
      const resp = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('yt-auth') || '{}')?.state?.token || ''}` }
      })
      const body = await resp.json()
      if (body.code !== 0) {
        message.error(body.message || '授权查看失败')
        return
      }
      const data = body.data
      const target = extraData?.field === 'id_card' ? data?.id_card : data?.phone
      setRevealed(true)
      setRevealedValue(target ?? '—')
      message.success('已授权查看（已记录审计日志）')
    } catch {
      message.error('查看失败')
    }
  }

  const confirmReveal = () => {
    modal.confirm({
      title: '授权查看敏感信息',
      content: '该操作将被记录到审计日志，确认继续？',
      okText: '确认查看',
      cancelText: '取消',
      onOk: onReveal
    })
  }

  return (
    <Space size={6}>
      <Typography.Text type={revealed ? 'warning' : undefined} strong={revealed}>
        {revealed ? (revealedValue ?? value ?? '—') : (value ?? '—')}
      </Typography.Text>
      {value ? (
        <Tooltip title={revealed ? '隐藏' : '授权查看明文'}>
          <Button
            type="text"
            size="small"
            icon={revealed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => (revealed ? setRevealed(false) : confirmReveal())}
          />
        </Tooltip>
      ) : null}
    </Space>
  )
}
