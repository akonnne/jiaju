import { useCallback, useEffect, useState } from 'react'
import { App, Button, Popconfirm, Select, Space, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import TablePro from '../components/TablePro'
import FormModal from '../components/FormModal'
import RichEditor from '../components/RichEditor'
import Can from '../router/Can'
import { jobApi } from '../api'
import type { JobItem } from '../api'

export default function JobsPage() {
  const { message } = App.useApp()
  const [rows, setRows] = useState<JobItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [jobType, setJobType] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<JobItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await jobApi.list({ page, page_size: pageSize, job_type: jobType })
      setRows(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, jobType])

  useEffect(() => {
    void load()
  }, [load])

  const columns: ColumnsType<JobItem> = [
    { title: '职位名称', dataIndex: 'title', ellipsis: true },
    {
      title: '类型',
      dataIndex: 'job_type',
      width: 90,
      render: (v: string) => (v === 'social' ? <Tag color="blue">社会招聘</Tag> : <Tag color="purple">校园招聘</Tag>)
    },
    { title: '部门', dataIndex: 'department', width: 120, render: (v?: string) => v || '—' },
    { title: '地点', dataIndex: 'location', width: 110 },
    { title: '人数', dataIndex: 'headcount', width: 70, render: (v?: number) => v ?? '—' },
    { title: '发布时间', dataIndex: 'publish_time', width: 170 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: number) => (v === 1 ? <Tag color="success">招聘中</Tag> : <Tag color="default">已关闭</Tag>)
    },
    {
      title: '操作',
      width: 220,
      render: (_, r) => (
        <Space size={4}>
          <Can perm="job:write">
            <Button size="small" onClick={() => { setEditing(r); setModalOpen(true) }}>编辑</Button>
            <Popconfirm
              title={r.status === 1 ? '确认关闭该职位？' : '确认重新开启？'}
              onConfirm={async () => {
                await jobApi.changeStatus(r.id, r.status === 1 ? 0 : 1)
                message.success('状态已更新')
                void load()
              }}
            >
              <Button size="small">{r.status === 1 ? '关闭' : '开启'}</Button>
            </Popconfirm>
            <Popconfirm title="确认删除？" onConfirm={async () => {
              await jobApi.remove(r.id)
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
        await jobApi.update(editing.id, values)
      } else {
        await jobApi.create(values)
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
      <TablePro<JobItem>
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
            <Select
              placeholder="招聘类型"
              allowClear
              style={{ width: 140 }}
              options={[
                { label: '社会招聘', value: 'social' },
                { label: '校园招聘', value: 'campus' }
              ]}
              onChange={(v) => { setPage(1); setJobType(v) }}
            />
            <Can perm="job:write">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalOpen(true) }}>
                新增职位
              </Button>
            </Can>
          </>
        }
      />

      <FormModal
        title={editing ? '编辑职位' : '新增职位'}
        open={modalOpen}
        initialValues={editing ?? { job_type: 'social', status: 1, location: '杭州' }}
        loading={submitting}
        onCancel={() => setModalOpen(false)}
        onSubmit={onSubmit}
        width={860}
        fields={[
          { name: 'title', label: '职位名称', rules: [{ required: true, message: '请输入职位名称' }] },
          {
            name: 'job_type', label: '招聘类型', type: 'select', span: 8,
            options: [
              { label: '社会招聘', value: 'social' },
              { label: '校园招聘', value: 'campus' }
            ],
            rules: [{ required: true }]
          },
          { name: 'department', label: '部门', span: 8 },
          { name: 'location', label: '工作地点', rules: [{ required: true }], span: 8 },
          { name: 'headcount', label: '招聘人数', type: 'number', props: { min: 0 }, span: 8 },
          { name: 'publish_time', label: '发布时间', span: 8 },
          { name: 'contact_email', label: '投递邮箱', span: 8 },
          { name: 'contact_phone', label: '投递电话', span: 8 },
          {
            name: 'description', label: '职位描述 / 职责', type: 'custom',
            render: <RichEditor placeholder="职位职责（富文本）" />
          },
          {
            name: 'requirement', label: '任职要求', type: 'custom',
            render: <RichEditor placeholder="任职要求（富文本）" />
          }
        ]}
      />
    </>
  )
}
