import { useCallback, useEffect, useState } from 'react'
import { App, Button, Drawer, Popconfirm, Select, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import TablePro from '../components/TablePro'
import Can from '../router/Can'
import { messageApi } from '../api'
import type { MessageItem } from '../api'

const STATUS_META: Record<string, { text: string; color: string }> = {
  new: { text: '待处理', color: 'processing' },
  contacted: { text: '已联系', color: 'warning' },
  done: { text: '已完成', color: 'success' }
}

export default function MessagesPage() {
  const { message } = App.useApp()
  const [rows, setRows] = useState<MessageItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [status, setStatus] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<MessageItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await messageApi.list({ page, page_size: pageSize, status })
      setRows(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, status])

  useEffect(() => {
    void load()
  }, [load])

  const changeStatus = async (id: number, next: string) => {
    await messageApi.changeStatus(id, next)
    message.success('状态已更新')
    if (detail?.id === id) {
      setDetail({ ...detail, status: next })
    }
    void load()
  }

  const columns: ColumnsType<MessageItem> = [
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '电话', dataIndex: 'phone', width: 130 },
    {
      title: '内容摘要',
      dataIndex: 'content',
      ellipsis: true,
      render: (v: string) => <Typography.Text ellipsis style={{ maxWidth: 260 }}>{v}</Typography.Text>
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 80,
      render: (v: string) => (v === 'contact' ? '普通留言' : '加盟意向')
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: string) => <Tag color={STATUS_META[v]?.color}>{STATUS_META[v]?.text ?? v}</Tag>
    },
    { title: '提交时间', dataIndex: 'created_date', width: 170 },
    {
      title: '操作',
      width: 130,
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" type="link" onClick={() => setDetail(r)}>查看</Button>
          <Can perm="message:write">
            <Popconfirm title="确认删除？" onConfirm={async () => {
              await messageApi.remove(r.id)
              message.success('已删除')
              void load()
            }}>
              <Button size="small" type="link" danger>删除</Button>
            </Popconfirm>
          </Can>
        </Space>
      )
    }
  ]

  const nextStatus =
    detail?.status === 'new' ? 'contacted' : detail?.status === 'contacted' ? 'done' : null

  return (
    <>
      <TablePro<MessageItem>
        columns={columns}
        dataSource={rows}
        loading={loading}
        rowKey="id"
        pagination={{ current: page, pageSize, total, showTotal: (t) => `共 ${t} 条` }}
        onChange={(pg) => {
          setPage(pg.current ?? 1)
          setPageSize(pg.pageSize ?? 12)
        }}
        toolbar={
          <Select
            placeholder="按状态筛选"
            allowClear
            style={{ width: 160 }}
            options={Object.entries(STATUS_META).map(([v, m]) => ({ label: m.text, value: v }))}
            onChange={(v) => { setPage(1); setStatus(v) }}
          />
        }
      />

      <Drawer title="留言详情" open={!!detail} width={520} onClose={() => setDetail(null)}>
        {detail && (
          <div>
            <p style={{ margin: '4px 0' }}>
              <b>姓名：</b>{detail.name}　<b>电话：</b>{detail.phone}　<b>IP：</b>{detail.ip || '—'}
            </p>
            <p style={{ margin: '4px 0' }}>
              <b>来源：</b>{detail.source === 'contact' ? '普通留言' : '加盟意向'}
              　<b>时间：</b>{detail.created_date}
            </p>
            <p style={{ margin: '4px 0' }}>
              <b>状态：</b>
              <Tag color={STATUS_META[detail.status]?.color}>{STATUS_META[detail.status]?.text}</Tag>
            </p>
            <div style={{ marginTop: 12, background: '#FAF7F1', padding: 12, borderRadius: 6, whiteSpace: 'pre-wrap' }}>
              {detail.content}
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
              <Can perm="message:write">
                {nextStatus && (
                  <Button type="primary" onClick={() => changeStatus(detail.id, nextStatus)}>
                    标记为{STATUS_META[nextStatus]?.text}
                  </Button>
                )}
                {detail.status !== 'new' && (
                  <Button onClick={() => changeStatus(detail.id, 'new')}>回退为待处理</Button>
                )}
              </Can>
            </div>
          </div>
        )}
      </Drawer>
    </>
  )
}
