import { useCallback, useEffect, useState } from 'react'
import { App, Button, Modal, Popconfirm, Space, Tag } from 'antd'
import { CopyOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import TablePro from '../components/TablePro'
import FormModal from '../components/FormModal'
import SensitiveView from '../components/SensitiveView'
import Can from '../router/Can'
import { useAuthStore } from '../store/useAuthStore'
import { userApi } from '../api'
import type { SysUser } from '../api'

const ROLE_OPTIONS = [
  { label: '系统管理员', value: 'system' },
  { label: '内容编辑', value: 'editor' },
  { label: '客服', value: 'service' }
]

export default function UsersPage() {
  const { message } = App.useApp()
  const me = useAuthStore((s) => s.user)
  const [rows, setRows] = useState<SysUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SysUser | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resetTarget, setResetTarget] = useState<SysUser | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await userApi.list({ page, page_size: pageSize })
      setRows(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  const isSelf = (id: number) => id === me?.id
  const isPreset = (u: SysUser) => u.username === '10000'

  const columns: ColumnsType<SysUser> = [
    { title: '账号', dataIndex: 'username', width: 100 },
    { title: '姓名', dataIndex: 'name', width: 120 },
    {
      title: '角色',
      dataIndex: 'roles',
      width: 130,
      render: (v: string[]) => v.map((r) => <Tag key={r} color={r === 'system' ? 'walnut' : 'default'}>{r}</Tag>)
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 150,
      render: (v: string | undefined, r) =>
        v ? (
          <SensitiveView
            value={v}
            endpoint={`/api/sys/users/${r.id}/sensitive`}
            extraData={{ field: 'phone' }}
          />
        ) : (
          '—'
        )
    },
    {
      title: '身份证',
      dataIndex: 'id_card',
      width: 190,
      render: (v: string | undefined, r) =>
        v ? (
          <SensitiveView
            value={v}
            endpoint={`/api/sys/users/${r.id}/sensitive`}
            extraData={{ field: 'id_card' }}
          />
        ) : (
          '—'
        )
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: number) => (v === 1 ? <Tag color="success">启用</Tag> : <Tag color="default">停用</Tag>)
    },
    { title: '最后登录', dataIndex: 'last_login_at', width: 170, render: (v?: string) => v || '—' },
    {
      title: '操作',
      width: 260,
      render: (_, r) => (
        <Space size={4}>
          <Can perm="user:write">
            <Button
              size="small"
              onClick={() => {
                setEditing(r)
                setModalOpen(true)
              }}
            >
              编辑
            </Button>
            <Popconfirm
              title={r.status === 1 ? '确认停用该账号？' : '确认启用该账号？'}
              disabled={isSelf(r.id) || isPreset(r)}
              onConfirm={async () => {
                await userApi.update(r.id, { status: r.status === 1 ? 0 : 1 })
                message.success('状态已更新')
                void load()
              }}
            >
              <Button size="small" disabled={isSelf(r.id) || isPreset(r)}>
                {r.status === 1 ? '停用' : '启用'}
              </Button>
            </Popconfirm>
            <Button size="small" onClick={() => { setResetTarget(r); setNewPassword('') }}>
              重置密码
            </Button>
            <Popconfirm
              title="删除后不可恢复，确认？"
              disabled={isSelf(r.id) || isPreset(r)}
              onConfirm={async () => {
                await userApi.remove(r.id)
                message.success('已删除')
                void load()
              }}
            >
              <Button size="small" danger disabled={isSelf(r.id) || isPreset(r)}>
                删除
              </Button>
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
        await userApi.update(editing.id, { name: values.name, role_code: values.role_code, status: values.status ? 1 : 0 })
      } else {
        await userApi.create(values)
      }
      message.success('保存成功')
      setModalOpen(false)
      void load()
    } finally {
      setSubmitting(false)
    }
  }

  const doReset = async () => {
    if (!resetTarget) return
    const data = await userApi.resetPassword(resetTarget.id)
    setNewPassword(data.new_password)
  }

  return (
    <>
      <TablePro<SysUser>
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
          <Can perm="user:write">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalOpen(true) }}>
              新增用户
            </Button>
          </Can>
        }
      />

      <FormModal
        title={editing ? '编辑用户' : '新增用户'}
        open={modalOpen}
        initialValues={editing ? { name: editing.name, role_code: editing.roles?.[0], status: editing.status === 1 } : { role_code: 'editor', status: true }}
        loading={submitting}
        onCancel={() => setModalOpen(false)}
        onSubmit={onSubmit}
        width={520}
        fields={
          editing
            ? [
                { name: 'name', label: '姓名', rules: [{ required: true }] },
                { name: 'role_code', label: '角色', type: 'select', options: ROLE_OPTIONS, span: 12 },
                { name: 'status', label: '启用', type: 'switch', span: 12 }
              ]
            : [
                { name: 'username', label: '账号（纯数字）', rules: [{ required: true, pattern: /^\d+$/, message: '账号必须为纯数字' }] },
                { name: 'name', label: '姓名', rules: [{ required: true }] },
                { name: 'password', label: '初始密码', type: 'password', rules: [{ required: true, min: 6 }] },
                { name: 'phone', label: '手机号（11 位）', rules: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }] },
                { name: 'role_code', label: '角色', type: 'select', options: ROLE_OPTIONS, rules: [{ required: true }] }
              ]
        }
      />

      <Modal
        title={`重置密码 · ${resetTarget?.name ?? ''}`}
        open={!!resetTarget}
        onCancel={() => setResetTarget(null)}
        footer={
          newPassword
            ? [
                <Button key="copy" icon={<CopyOutlined />} onClick={() => { void navigator.clipboard.writeText(newPassword); message.success('已复制') }}>
                  复制
                </Button>,
                <Button key="ok" type="primary" onClick={() => setResetTarget(null)}>完成</Button>
              ]
            : [
                <Button key="cancel" onClick={() => setResetTarget(null)}>取消</Button>,
                <Button key="reset" type="primary" onClick={doReset}>生成新密码</Button>
              ]
        }
      >
        {newPassword ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ color: '#8A8176', marginBottom: 8 }}>新密码（仅显示一次，请妥善保存）：</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, color: '#B0762A' }}>{newPassword}</div>
          </div>
        ) : (
          <div style={{ color: '#8A8176' }}>
            将随机生成 12 位密码并仅展示一次，该操作会写入审计日志。确认继续？
          </div>
        )}
      </Modal>
    </>
  )
}
