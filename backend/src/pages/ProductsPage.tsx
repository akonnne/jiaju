import { useCallback, useEffect, useState } from 'react'
import { App, Button, Form, Input, Popconfirm, Space, Tag } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import TablePro from '../components/TablePro'
import FormModal from '../components/FormModal'
import ImageUpload from '../components/ImageUpload'
import RichEditor from '../components/RichEditor'
import Can from '../router/Can'
import { productApi, seriesApi } from '../api'
import type { ProductItem } from '../api'

const CATEGORY_OPTIONS = [
  { label: '民用', value: 1 },
  { label: '办公', value: 2 },
  { label: '软体', value: 3 },
  { label: '定制', value: 4 }
]
const CATEGORY_NAMES: Record<number, string> = { 1: '民用', 2: '办公', 3: '软体', 4: '定制' }
const TYPE_OPTIONS = ['床', '沙发', '桌椅', '柜体', '衣柜', '茶几', '床垫', '其他'].map((t) => ({ label: t, value: t }))

export default function ProductsPage() {
  const { message } = App.useApp()
  const [rows, setRows] = useState<ProductItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [series, setSeries] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await productApi.list({ page, page_size: pageSize, keyword: keyword || undefined })
      setRows(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void seriesApi.list().then(setSeries).catch(() => {})
  }, [])

  const initialValues = editing
    ? {
        ...editing,
        category_code: CATEGORY_OPTIONS.find((c) => c.label === editing.category)?.value ?? 1,
        status: editing.status === 1
      }
    : { category_code: 1, status: true, product_type: '沙发' }

  const columns: ColumnsType<ProductItem> = [
    {
      title: '封面',
      dataIndex: 'cover_image',
      width: 70,
      render: (v: string) =>
        v ? <img src={v} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} /> : '—'
    },
    { title: '名称', dataIndex: 'name', ellipsis: true },
    { title: '型号', dataIndex: 'model', width: 130, render: (v) => v || '—' },
    {
      title: '分类',
      dataIndex: 'category_code',
      width: 90,
      render: (v: number) => <Tag color="walnut">{CATEGORY_NAMES[v] ?? v}</Tag>
    },
    { title: '排序', dataIndex: 'sort_order', width: 70 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: number) =>
        v === 1 ? <Tag color="success">上架</Tag> : <Tag color="default">下架</Tag>
    },
    { title: '浏览量', dataIndex: 'view_count', width: 90 },
    {
      title: '操作',
      width: 220,
      render: (_, r) => (
        <Space size={4}>
          <Can perm="product:write">
            <Button size="small" onClick={() => { setEditing(r); setModalOpen(true) }}>编辑</Button>
            <Popconfirm
              title={r.status === 1 ? '确认下架该产品？' : '确认上架该产品？'}
              onConfirm={async () => {
                await productApi.changeStatus(r.id, r.status === 1 ? 0 : 1)
                message.success('状态已更新')
                void load()
              }}
            >
              <Button size="small">{r.status === 1 ? '下架' : '上架'}</Button>
            </Popconfirm>
            <Popconfirm
              title="删除后不可恢复，确认？"
              onConfirm={async () => {
                await productApi.remove(r.id)
                message.success('已删除')
                void load()
              }}
            >
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
      // 参数键值对 → params 对象
      const params: Record<string, string> = {}
      ;(values.paramsItems ?? []).forEach((p: { k?: string; v?: string }) => {
        if (p.k) params[p.k] = p.v ?? ''
      })
      const payload = {
        ...values,
        category: CATEGORY_NAMES[values.category_code],
        category_code: values.category_code,
        status: values.status ? 1 : 0,
        params: Object.keys(params).length ? params : null,
        images: values.images?.length ? values.images : null
      }
      delete payload.paramsItems
      if (editing) {
        await productApi.update(editing.id, payload)
      } else {
        await productApi.create(payload)
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
      <TablePro<ProductItem>
        columns={columns}
        dataSource={rows}
        loading={loading}
        rowKey="id"
        pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        onChange={(pg) => {
          setPage(pg.current ?? 1)
          setPageSize(pg.pageSize ?? 12)
        }}
        toolbar={
          <>
            <Space>
              <Input
                placeholder="搜索产品名称"
                prefix={<SearchOutlined />}
                allowClear
                style={{ width: 220 }}
                onPressEnter={(e) => { setPage(1); setKeyword((e.target as HTMLInputElement).value) }}
              />
              <Button onClick={() => { setPage(1); setKeyword('') }}>重置</Button>
            </Space>
            <Can perm="product:write">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalOpen(true) }}>
                新增产品
              </Button>
            </Can>
          </>
        }
      />

      <FormModal
        title={editing ? '编辑产品' : '新增产品'}
        open={modalOpen}
        initialValues={initialValues}
        loading={submitting}
        onCancel={() => setModalOpen(false)}
        onSubmit={onSubmit}
        width={880}
        fields={[
          { name: 'name', label: '产品名称', rules: [{ required: true, message: '请输入名称' }] },
          {
            name: 'series_id', label: '所属系列', type: 'select',
            options: series.map((s) => ({ label: s.name, value: s.id })),
            span: 12
          },
          { name: 'model', label: '型号', span: 12 },
          {
            name: 'category_code', label: '分类', type: 'select',
            options: CATEGORY_OPTIONS, rules: [{ required: true }], span: 8
          },
          {
            name: 'product_type', label: '产品类型', type: 'select',
            options: TYPE_OPTIONS, rules: [{ required: true }], span: 8
          },
          { name: 'sort_order', label: '排序', type: 'number', span: 8 },
          { name: 'original_price', label: '原价(元)', type: 'number', props: { min: 0 }, span: 8 },
          { name: 'discount_price', label: '折扣价(元)', type: 'number', props: { min: 0 }, span: 8 },
          { name: 'status', label: '上架', type: 'switch', span: 8 },
          { name: 'cover_image', label: '封面图', render: <ImageUpload maxCount={1} />, span: 12 },
          { name: 'images', label: '详情图（多图）', render: <ImageUpload maxCount={6} multiple />, span: 12 },
          {
            name: 'paramsItems', label: '参数（键值对）', type: 'custom',
            render: (
              <Form.List name="paramsItems">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((f) => (
                      <Space key={f.key} align="baseline" style={{ display: 'flex', marginBottom: 6 }}>
                        <Form.Item name={[f.name, 'k']} noStyle><Input placeholder="参数名，如 尺寸" style={{ width: 160 }} /></Form.Item>
                        <Form.Item name={[f.name, 'v']} noStyle><Input placeholder="参数值，如 3000×950" style={{ width: 240 }} /></Form.Item>
                        <Button type="text" danger onClick={() => remove(f.name)}>删</Button>
                      </Space>
                    ))}
                    <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({})}>添加参数</Button>
                  </>
                )}
              </Form.List>
            ),
            span: 24
          },
          {
            name: 'description', label: '图文描述',
            render: <RichEditor placeholder="产品详情（富文本）" />, span: 24
          }
        ]}
      />
    </>
  )
}
