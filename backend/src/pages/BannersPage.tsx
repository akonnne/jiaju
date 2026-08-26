import { useCallback, useEffect, useState } from 'react'
import { App, Button, Drawer, Form, Input, InputNumber, Popconfirm, Select, Space, Switch, Tabs, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TablePro from '../components/TablePro'
import ImageUpload from '../components/ImageUpload'
import Can from '../router/Can'
import { bannerApi } from '../api'
import type { BannerItem } from '../api'

const GROUPS = [
  { key: 'home', label: '首页主图' },
  { key: 'category', label: '分类页' },
  { key: 'mobile', label: '移动端' },
  { key: 'popup', label: '弹窗' },
  { key: 'float', label: '悬浮' }
]
const PLATFORM_OPTIONS = ['web', 'app', 'wechat'].map((p) => ({ label: p, value: p }))

function sortableRow(props: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props['data-row-key'] })
  const style = { ...props.style, transform: CSS.Transform.toString(transform), transition, cursor: 'grab', opacity: isDragging ? 0.5 : 1 }
  return <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />
}

// 投放状态机：投放中 / 定时 / 已过期 / 停用
function statusOf(b: BannerItem): { text: string; color: string } {
  if (b.status !== 1) return { text: '停用', color: 'default' }
  const now = new Date().getTime()
  const start = b.start_date ? new Date(b.start_date.replace(' ', 'T')).getTime() : 0
  const end = b.end_date ? new Date(b.end_date.replace(' ', 'T')).getTime() : Infinity
  if (start && now < start) return { text: '定时', color: 'processing' }
  if (now > end) return { text: '已过期', color: 'error' }
  return { text: '投放中', color: 'success' }
}

export default function BannersPage() {
  const { message } = App.useApp()
  const [group, setGroup] = useState('home')
  const [rows, setRows] = useState<BannerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<BannerItem | null>(null)
  const [form] = Form.useForm()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await bannerApi.list({ group_code: group }))
    } finally {
      setLoading(false)
    }
  }, [group])

  useEffect(() => {
    void load()
  }, [load])

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const oldIndex = rows.findIndex((r) => r.id === active.id)
    const newIndex = rows.findIndex((r) => r.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(rows, oldIndex, newIndex)
    setRows(next)
    await bannerApi.sort(next.map((r) => r.id))
    message.success('排序已保存')
  }

  const columns = [
    {
      title: '预览',
      dataIndex: 'image',
      width: 90,
      render: (v: string) =>
        v ? <img src={v} alt="" style={{ width: 72, height: 40, objectFit: 'cover', borderRadius: 4 }} /> : '—'
    },
    { title: '标题', dataIndex: 'title', render: (v?: string) => v || '—' },
    { title: '副标题', dataIndex: 'subtitle', render: (v?: string) => v || '—' },
    { title: '链接', dataIndex: 'link_target', width: 130, render: (v?: string) => v || '—' },
    {
      title: '投放状态',
      dataIndex: 'status',
      width: 90,
      render: (_: number, r: BannerItem) => {
        const s = statusOf(r)
        return <Tag color={s.color}>{s.text}</Tag>
      }
    },
    { title: '曝光/点击', width: 110, render: (_: any, r: BannerItem) => `${r.impressions}/${r.clicks}` },
    {
      title: '操作',
      width: 150,
      render: (_: any, r: BannerItem) => (
        <Space size={4}>
          <Can perm="banner:write">
            <Button size="small" onClick={() => openDrawer(r)}>编辑</Button>
            <Popconfirm title="确认删除？" onConfirm={async () => {
              await bannerApi.remove(r.id)
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

  const openDrawer = (banner: BannerItem | null) => {
    setEditing(banner)
    setDrawerOpen(true)
    form.resetFields()
    if (banner) {
      form.setFieldsValue({ ...banner, status: banner.status === 1 })
    } else {
      form.setFieldsValue({ group_code: group, link_type: 'internal', status: true, sort_order: rows.length + 1 })
    }
  }

  const onSave = async () => {
    const values = await form.validateFields()
    const payload = {
      ...values,
      status: values.status ? 1 : 0,
      start_date: values.start_date || null,
      end_date: values.end_date || null
    }
    if (editing) {
      await bannerApi.update(editing.id, payload)
    } else {
      await bannerApi.create(payload)
    }
    message.success('保存成功')
    setDrawerOpen(false)
    void load()
  }

  return (
    <div>
      <Tabs
        activeKey={group}
        onChange={setGroup}
        tabBarExtraContent={
          <Can perm="banner:write">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer(null)}>
              新增轮播图
            </Button>
          </Can>
        }
        items={GROUPS.map((g) => ({ key: g.key, label: g.label }))}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <TablePro
            columns={columns}
            dataSource={rows}
            loading={loading}
            rowKey="id"
            pagination={false}
            components={{ body: { row: sortableRow } }}
            toolbar={
              <span style={{ color: '#8A8176', fontSize: 13 }}>
                拖拽行首 🖐 可调整组内顺序（自动持久化）
              </span>
            }
          />
        </SortableContext>
      </DndContext>

      <Drawer
        title={editing ? '编辑轮播图' : '新增轮播图'}
        open={drawerOpen}
        width={560}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={onSave}>保存</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="group_code" label="分组" rules={[{ required: true }]}>
            <Select options={GROUPS.map((g) => ({ label: g.label, value: g.key }))} />
          </Form.Item>
          <Form.Item name="title" label="标题"><Input /></Form.Item>
          <Form.Item name="subtitle" label="副标题"><Input /></Form.Item>
          <Form.Item name="image" label="PC 图片 URL" rules={[{ required: true, message: '请填写图片' }]}>
            <Input placeholder="或使用下方上传" />
          </Form.Item>
          <Form.Item name="image_upload" label="上传图片">
            <ImageUpload
              maxCount={1}
              onChange={(url) => form.setFieldValue('image', url as string)}
            />
          </Form.Item>
          <Form.Item name="image_mobile" label="移动端图片 URL"><Input /></Form.Item>
          <Form.Item name="link_type" label="链接类型" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '内部路由', value: 'internal' },
                { label: '外部链接', value: 'external' }
              ]}
            />
          </Form.Item>
          <Form.Item name="link_target" label="链接目标（如 /products 或 https://…）"><Input /></Form.Item>
          <Form.Item name="button_text" label="按钮文字"><Input /></Form.Item>
          <Form.Item name="button_color" label="按钮颜色"><Input placeholder="#7A5C3E" /></Form.Item>
          <Form.Item name="platforms" label="投放平台">
            <Select mode="multiple" options={PLATFORM_OPTIONS} placeholder="默认全部" />
          </Form.Item>
          <Space size={16} style={{ display: 'flex' }}>
            <Form.Item name="start_date" label="上线时间"><Input placeholder="2026-08-01 00:00:00" /></Form.Item>
            <Form.Item name="end_date" label="下线时间"><Input placeholder="2026-12-31 23:59:59" /></Form.Item>
          </Space>
          <Space size={24}>
            <Form.Item name="sort_order" label="排序" initialValue={1}>
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item name="status" label="启用" valuePropName="checked" initialValue>
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Drawer>
    </div>
  )
}
