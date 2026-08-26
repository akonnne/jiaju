import type { ReactNode } from 'react'
import { Card, Table } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'

interface TableProProps<T = any> {
  columns: ColumnsType<T>
  dataSource: T[]
  loading?: boolean
  rowKey?: string | ((r: T) => string | number)
  pagination?: TablePaginationConfig | false
  toolbar?: ReactNode
  onChange?: (pagination: TablePaginationConfig) => void
  scroll?: { x?: number | string; y?: number | string }
  expandable?: any
  components?: any
}

/** 通用数据表格：Card 容器 + AntD Table + 工具栏 + 分页。 */
export default function TablePro<T = any>({
  columns,
  dataSource,
  loading,
  rowKey,
  pagination,
  toolbar,
  onChange,
  scroll,
  expandable,
  components
}: TableProProps<T>) {
  return (
    <Card styles={{ body: { padding: 0 } }}>
      {toolbar && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 16px 0',
            gap: 12,
            flexWrap: 'wrap'
          }}
        >
          {toolbar}
        </div>
      )}
      <Table<T>
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        rowKey={rowKey}
        pagination={pagination}
        onChange={onChange}
        scroll={scroll}
        expandable={expandable}
        components={components}
        size="middle"
        style={{ padding: toolbar ? 16 : 0 }}
      />
    </Card>
  )
}
