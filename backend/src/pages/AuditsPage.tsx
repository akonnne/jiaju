import { useCallback, useEffect, useState } from 'react'
import { App, Button, DatePicker, Select, Space, Tag } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import TablePro from '../components/TablePro'
import { auditApi } from '../api'
import type { AuditItem } from '../api'

const ACTIONS = ['login', 'logout', 'create', 'update', 'delete', 'status_change', 'upload', 'password_reset', 'export', 'permission_change']
const RESOURCES = ['product', 'news', 'banner', 'company', 'job', 'message', 'user', 'role', 'auth', 'audit']

// 敏感操作高亮
const SENSITIVE_ACTIONS = new Set(['delete', 'export', 'permission_change', 'password_reset'])

const ACTION_TEXT: Record<string, string> = {
  login: '登录', logout: '退出', create: '新增', update: '修改', delete: '删除',
  status_change: '状态变更', upload: '上传', password_reset: '密码修改', export: '导出', permission_change: '权限变更'
}

export default function AuditsPage() {
  const { message } = App.useApp()
  const [rows, setRows] = useState<AuditItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [action, setAction] = useState<string>()
  const [resource, setResource] = useState<string>()
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await auditApi.list({
        page,
        page_size: pageSize,
        action,
        resource,
        start_date: dateRange?.[0],
        end_date: dateRange?.[1]
      })
      setRows(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, action, resource, dateRange])

  useEffect(() => {
    void load()
  }, [load])

  const onExport = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('yt-auth') || '{}')?.state?.token
      const resp = await fetch('/api/sys/audits/export', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audits_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
      a.click()
      URL.revokeObjectURL(url)
      message.success('导出成功（已记录审计日志）')
      void load()
    } catch {
      message.error('导出失败')
    }
  }

  const columns: ColumnsType<AuditItem> = [
    { title: '时间', dataIndex: 'created_date', width: 170 },
    { title: '操作人', dataIndex: 'username', width: 110 },
    {
      title: '操作',
      dataIndex: 'action',
      width: 110,
      render: (v: string) => (
        <Tag color={SENSITIVE_ACTIONS.has(v) ? 'error' : 'blue'}>{ACTION_TEXT[v] ?? v}</Tag>
      )
    },
    { title: '资源', dataIndex: 'resource', width: 90, render: (v: string) => <Tag>{v}</Tag> },
    { title: '资源 ID', dataIndex: 'resource_id', width: 80, render: (v?: number) => v ?? '—' },
    {
      title: '详情',
      dataIndex: 'detail',
      ellipsis: true,
      render: (v?: string) => (v ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> : '—')
    },
    { title: 'IP', dataIndex: 'ip', width: 120, render: (v?: string) => v || '—' },
    {
      title: '结果',
      dataIndex: 'status',
      width: 70,
      render: (v: number) => (v === 1 ? <Tag color="success">成功</Tag> : <Tag color="error">失败</Tag>)
    }
  ]

  return (
    <TablePro<AuditItem>
      columns={columns}
      dataSource={rows}
      loading={loading}
      rowKey="id"
      pagination={{ current: page, pageSize, total, showTotal: (t) => `共 ${t} 条` }}
      onChange={(pg) => {
        setPage(pg.current ?? 1)
        setPageSize(pg.pageSize ?? 20)
      }}
      toolbar={
        <Space wrap>
          <Select
            placeholder="操作类型"
            allowClear
            style={{ width: 150 }}
            options={ACTIONS.map((a) => ({ label: ACTION_TEXT[a] ?? a, value: a }))}
            onChange={(v) => { setPage(1); setAction(v) }}
          />
          <Select
            placeholder="资源模块"
            allowClear
            style={{ width: 140 }}
            options={RESOURCES.map((r) => ({ label: r, value: r }))}
            onChange={(v) => { setPage(1); setResource(v) }}
          />
          <DatePicker.RangePicker
            onChange={(dates) => {
              setPage(1)
              setDateRange(dates ? [dates[0]!.format('YYYY-MM-DD'), dates[1]!.format('YYYY-MM-DD')] : null)
            }}
          />
          <Button icon={<DownloadOutlined />} onClick={onExport}>导出 CSV</Button>
        </Space>
      }
    />
  )
}
