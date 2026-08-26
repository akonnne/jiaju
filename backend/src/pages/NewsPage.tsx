import { useCallback, useEffect, useState } from 'react'
import { App, Button, Popconfirm, Select, Space, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import TablePro from '../components/TablePro'
import FormModal from '../components/FormModal'
import ImageUpload from '../components/ImageUpload'
import RichEditor from '../components/RichEditor'
import Can from '../router/Can'
import { newsApi } from '../api'
import type { NewsItem } from '../api'

export default function NewsPage() {
  const { message } = App.useApp()
  const [rows, setRows] = useState<NewsItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [category, setCategory] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<NewsItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await newsApi.list({ page, page_size: pageSize, category })
      setRows(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, category])

  useEffect(() => {
    void load()
  }, [load])

  const columns: ColumnsType<NewsItem> = [
    {
      title: '封面',
      dataIndex: 'cover_image',
      width: 70,
      render: (v: string) =>
        v ? <img src={v} alt="" style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4 }} /> : '—'
    },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    {
      title: '分类',
      dataIndex: 'category',
      width: 110,
      render: (v: string) => <Tag>{v === 'enterprise' ? '企业新闻' : '行业资讯'}</Tag>
    },
    { title: '发布时间', dataIndex: 'publish_time', width: 170 },
    { title: '浏览量', dataIndex: 'view_count', width: 90 },
    {
      title: '操作',
      width: 150,
      render: (_, r) => (
        <Space size={4}>
          <Can perm="news:write">
            <Button size="small" onClick={() => { setEditing(r); setModalOpen(true) }}>编辑</Button>
            <Popconfirm title="确认删除？" onConfirm={async () => {
              await newsApi.remove(r.id)
              message.success('已删除')
              void load()
            }}>
              <Button size="small" danger>删除</Button>
            </Popconfirm>
          </Can>
        </Space>
      )
    }
  ]

  const onSubmit = async (values: any) => {
    setSubmitting(true)
    try {
      if (editing) {
        await newsApi.update(editing.id, values)
      } else {
        await newsApi.create(values)
      }
      message.success('保存成功')
      setModalOpen(false)
      void load()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <TablePro<NewsItem>
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
          <>
            <Space>
              <Select
                placeholder="分类"
                allowClear
                style={{ width: 140 }}
                options={[
                  { label: '企业新闻', value: 'enterprise' },
                  { label: '行业资讯', value: 'industry' }
                ]}
                onChange={(v) => { setPage(1); setCategory(v) }}
              />
            </Space>
            <Can perm="news:write">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalOpen(true) }}>
                新增新闻
              </Button>
            </Can>
          </>
        }
      />

      <FormModal
        title={editing ? '编辑新闻' : '新增新闻'}
        open={modalOpen}
        initialValues={editing ?? { category: 'enterprise' }}
        loading={submitting}
        onCancel={() => setModalOpen(false)}
        onSubmit={onSubmit}
        width={860}
        fields={[
          { name: 'title', label: '标题', rules: [{ required: true, message: '请输入标题' }] },
          {
            name: 'category', label: '分类', type: 'select',
            options: [
              { label: '企业新闻', value: 'enterprise' },
              { label: '行业资讯', value: 'industry' }
            ],
            span: 12
          },
          { name: 'publish_time', label: '发布时间', span: 12 },
          { name: 'summary', label: '摘要', type: 'textarea', span: 24 },
          { name: 'cover_image', label: '封面图', render: <ImageUpload maxCount={1} />, span: 12 },
          {
            name: 'content', label: '正文', type: 'custom',
            render: <RichEditor placeholder="新闻正文（富文本）" />
          }
        ]}
      />
    </>
  )
}
