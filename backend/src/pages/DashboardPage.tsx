import { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic } from 'antd'
import { EyeOutlined, FileTextOutlined, MessageOutlined, ShopOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { statsApi } from '../api'

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null)
  const [top, setTop] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    void Promise.all([statsApi.overview(), statsApi.top(), statsApi.messages()]).then(
      ([ov, tp, ms]) => {
        setOverview(ov)
        setTop(tp)
        setMessages(ms)
      }
    )
  }, [])

  const trendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 24, bottom: 28 },
    xAxis: { type: 'category', data: (overview?.trend ?? []).map((t: any) => t.date.slice(5)) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '访问量',
        type: 'line',
        smooth: true,
        data: (overview?.trend ?? []).map((t: any) => t.views),
        areaStyle: { opacity: 0.15 },
        itemStyle: { color: '#7A5C3E' }
      }
    ]
  }

  const msgOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 24, bottom: 28 },
    xAxis: { type: 'category', data: messages.map((m) => m.date.slice(5)) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '留言量',
        type: 'bar',
        data: messages.map((m) => m.count),
        itemStyle: { color: '#A98F6C', borderRadius: [4, 4, 0, 0] }
      }
    ]
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="总访问量" value={overview?.total_views ?? 0} prefix={<EyeOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="今日访问" value={overview?.today_views ?? 0} prefix={<EyeOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="留言总数" value={overview?.total_messages ?? 0} prefix={<MessageOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="产品总数" value={overview?.product_count ?? 0} prefix={<ShopOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="近 7 日访问趋势">
            <ReactECharts option={trendOption} style={{ height: 280 }} notMerge />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="留言量统计">
            <ReactECharts option={msgOption} style={{ height: 280 }} notMerge />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="产品浏览量 Top10">
            {(top?.products ?? []).map((p: any, i: number) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 4px',
                  borderBottom: '1px solid #F5F0E8'
                }}
              >
                <span style={{ color: i < 3 ? '#B0762A' : '#2B2520', fontWeight: i < 3 ? 700 : 400 }}>
                  {i + 1}. {p.name}
                </span>
                <span style={{ color: '#8A8176' }}>
                  <EyeOutlined /> {p.view_count}
                </span>
              </div>
            ))}
            {(top?.products ?? []).length === 0 && (
              <div style={{ color: '#B9B1A5', textAlign: 'center', padding: 24 }}>暂无数据</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="新闻浏览量 Top10">
            {(top?.news ?? []).map((n: any, i: number) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 4px',
                  borderBottom: '1px solid #F5F0E8'
                }}
              >
                <span style={{ color: i < 3 ? '#B0762A' : '#2B2520', fontWeight: i < 3 ? 700 : 400 }}>
                  {i + 1}. {n.title}
                </span>
                <span style={{ color: '#8A8176' }}>
                  <FileTextOutlined /> {n.view_count}
                </span>
              </div>
            ))}
            {(top?.news ?? []).length === 0 && (
              <div style={{ color: '#B9B1A5', textAlign: 'center', padding: 24 }}>暂无数据</div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
