import { useEffect, useState } from 'react'
import { Card, Col, Row, Table, Tag } from 'antd'
import { roleApi } from '../api'
import type { PermissionItem, RoleItem } from '../api'

const MODULES = ['product', 'news', 'banner', 'company', 'job', 'message', 'user', 'role', 'stats', 'audit']

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [permissions, setPermissions] = useState<PermissionItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    void Promise.all([roleApi.list(), roleApi.permissions()])
      .then(([rs, ps]) => {
        setRoles(rs)
        setPermissions(ps)
      })
      .finally(() => setLoading(false))
  }, [])

  const permMap = new Map(permissions.map((p) => [p.code, p]))

  // 权限矩阵：行=模块，列=角色，单元格=该角色拥有的权限码集合
  const matrixRows = MODULES.map((module) => {
    const modulePerms = permissions.filter((p) => p.module === module)
    const cell: Record<string, string[]> = {}
    roles.forEach((r) => {
      cell[r.code] = modulePerms.filter((p) => r.permissions.includes(p.code)).map((p) => p.action)
    })
    return { module, perms: modulePerms, cell }
  })

  const matrixColumns = [
    { title: '模块', dataIndex: 'module', width: 120 },
    ...roles.map((r) => ({
      title: r.name,
      key: r.code,
      width: 160,
      render: (_: any, row: any) => {
        const actions = row.cell[r.code] ?? []
        return actions.length ? (
          <span>
            {row.perms.map((p: PermissionItem) => (
              <Tag key={p.code} color={actions.includes(p.action) ? 'green' : 'default'}>
                {actions.includes(p.action) ? '✓' : '—'}
              </Tag>
            ))}
            <span style={{ marginLeft: 4, color: '#8A8176' }}>{row.perms.map((p: PermissionItem) => p.action).join(' / ')}</span>
          </span>
        ) : (
          <span style={{ color: '#B9B1A5' }}>—</span>
        )
      }
    }))
  ]

  return (
    <div>
      <Row gutter={[16, 16]}>
        {roles.map((r) => (
          <Col xs={24} md={8} key={r.code}>
            <Card title={r.name} loading={loading}>
              <p style={{ color: '#8A8176', fontSize: 13, marginBottom: 8 }}>
                编码：<code>{r.code}</code>　{r.is_preset === 1 && <Tag color="walnut">预设</Tag>}
              </p>
              <p style={{ minHeight: 44, color: '#4A4238' }}>{r.description || '—'}</p>
              <p style={{ color: '#8A8176', fontSize: 13 }}>
                权限 {r.permissions.length} 项：
                {r.permissions.slice(0, 5).join('、')}
                {r.permissions.length > 5 ? ` 等 ${r.permissions.length} 项` : ''}
              </p>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="权限矩阵（✓ = 拥有）" style={{ marginTop: 16 }}>
        <Table
          columns={matrixColumns}
          dataSource={matrixRows}
          rowKey="module"
          pagination={false}
          size="middle"
          loading={loading}
        />
      </Card>

      <Card title={`全部权限点（${permissions.length} 项）`} style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {permissions.map((p) => (
            <Tag key={p.code} color={p.action === 'write' ? 'orange' : 'blue'}>
              {permMap.get(p.code)?.name}（{p.code}）
            </Tag>
          ))}
        </div>
      </Card>
    </div>
  )
}
