import { useEffect, useState } from 'react'
import { App, Button, Card, Form, Input, Select, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import RichEditor from '../components/RichEditor'
import { companyApi } from '../api'

const CONCEPT_ICONS = ['ergonomic', 'craft', 'eco', 'design', 'service', 'other'].map((i) => ({ label: i, value: i }))

export default function CompanyPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    void companyApi
      .get()
      .then((data) => {
        form.setFieldsValue({
          ...data,
          milestones: data.milestones ?? [],
          honors: data.honors ?? [],
          concepts: data.concepts ?? []
        })
      })
      .finally(() => setLoading(false))
  }, [form])

  const onSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      await companyApi.update({
        ...values,
        milestones: (values.milestones ?? []).filter((m: any) => m.year),
        honors: (values.honors ?? []).filter((h: any) => h.title),
        concepts: (values.concepts ?? []).filter((c: any) => c.title)
      })
      message.success('保存成功')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="公司介绍（单行配置，前台全站共用）" loading={loading}>
      <Form form={form} layout="vertical">
        <Form.Item name="slogan" label="品牌 Slogan" rules={[{ required: true, message: '请输入 Slogan' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="intro" label="企业简介">
          <RichEditor placeholder="企业简介（富文本）" />
        </Form.Item>

        <Form.Item label="发展历程（里程碑）">
          <Form.List name="milestones">
            {(fields, { add, remove }) => (
              <>
                {fields.map((f) => (
                  <Space key={f.key} align="baseline" style={{ display: 'flex', marginBottom: 6 }}>
                    <Form.Item name={[f.name, 'year']} noStyle rules={[{ required: true, message: '年份' }]}>
                      <Input placeholder="年份，如 1953" style={{ width: 120 }} />
                    </Form.Item>
                    <Form.Item name={[f.name, 'event']} noStyle>
                      <Input placeholder="事件描述" style={{ width: 400 }} />
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(f.name)}>删</Button>
                  </Space>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({})}>添加里程碑</Button>
              </>
            )}
          </Form.List>
        </Form.Item>

        <Form.Item label="荣誉资质">
          <Form.List name="honors">
            {(fields, { add, remove }) => (
              <>
                {fields.map((f) => (
                  <Space key={f.key} align="baseline" style={{ display: 'flex', marginBottom: 6 }}>
                    <Form.Item name={[f.name, 'title']} noStyle rules={[{ required: true, message: '荣誉名称' }]}>
                      <Input placeholder="荣誉名称" style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item name={[f.name, 'image']} noStyle>
                      <Input placeholder="图片 URL" style={{ width: 300 }} />
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(f.name)}>删</Button>
                  </Space>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({})}>添加荣誉</Button>
              </>
            )}
          </Form.List>
        </Form.Item>

        <Form.Item label="品牌理念">
          <Form.List name="concepts">
            {(fields, { add, remove }) => (
              <>
                {fields.map((f) => (
                  <Space key={f.key} align="baseline" style={{ display: 'flex', marginBottom: 6 }}>
                    <Form.Item name={[f.name, 'title']} noStyle rules={[{ required: true, message: '理念名称' }]}>
                      <Input placeholder="理念名称" style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item name={[f.name, 'description']} noStyle>
                      <Input placeholder="理念描述" style={{ width: 280 }} />
                    </Form.Item>
                    <Form.Item name={[f.name, 'icon']} noStyle>
                      <Select placeholder="图标" style={{ width: 120 }} options={CONCEPT_ICONS} />
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(f.name)}>删</Button>
                  </Space>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({})}>添加理念</Button>
              </>
            )}
          </Form.List>
        </Form.Item>

        <Space size={16} style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Form.Item name="address" label="地址"><Input style={{ width: 380 }} /></Form.Item>
          <Form.Item name="phone" label="联系电话"><Input style={{ width: 200 }} /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input style={{ width: 220 }} /></Form.Item>
          <Form.Item name="business_hours" label="营业时间"><Input style={{ width: 160 }} /></Form.Item>
          <Form.Item name="job_email" label="招聘投递邮箱"><Input style={{ width: 220 }} /></Form.Item>
          <Form.Item name="job_phone" label="招聘电话"><Input style={{ width: 180 }} /></Form.Item>
        </Space>

        <Button type="primary" loading={saving} onClick={onSave}>
          保存
        </Button>
      </Form>
    </Card>
  )
}
