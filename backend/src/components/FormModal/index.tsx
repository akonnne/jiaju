import { useEffect } from 'react'
import { Form, Input, InputNumber, Modal, Select, Switch } from 'antd'
import type { ReactNode } from 'react'

export interface FormField {
  name: string
  label: string
  type?: 'input' | 'password' | 'textarea' | 'select' | 'number' | 'switch' | 'custom'
  options?: { label: string; value: string | number }[]
  rules?: any[]
  span?: number
  props?: Record<string, any>
  render?: ReactNode // 自定义渲染（如富文本/图片上传）；type='custom' 时直接渲染不包 Form.Item
}

interface FormModalProps {
  title: string
  open: boolean
  initialValues?: Record<string, any>
  fields: FormField[]
  onSubmit: (values: any) => void | Promise<void>
  onCancel: () => void
  width?: number
  loading?: boolean
}

/** 通用表单弹窗：声明式字段数组 → AntD Form + Modal。 */
export default function FormModal({
  title,
  open,
  initialValues,
  fields,
  onSubmit,
  onCancel,
  width = 720,
  loading
}: FormModalProps) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      form.resetFields()
      if (initialValues) {
        form.setFieldsValue(initialValues)
      }
    }
  }, [open, initialValues, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    await onSubmit(values)
  }

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={width}
      confirmLoading={loading}
      destroyOnHidden
      forceRender
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
          {fields.map((f) => (
            <div key={f.name} style={{ width: `calc(${f.span ? (f.span / 24) * 100 : 100}% - 0px)` }}>
              {f.render && f.type === 'custom' ? (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 4, color: 'rgba(0,0,0,.88)', fontSize: 14 }}>{f.label}</div>
                  {f.render}
                </div>
              ) : f.render ? (
                <Form.Item label={f.label} name={f.name} rules={f.rules} valuePropName="value">
                  {f.render}
                </Form.Item>
              ) : (
                <Form.Item label={f.label} name={f.name} rules={f.rules} valuePropName={f.type === 'switch' ? 'checked' : 'value'}>
                  {f.type === 'select' ? (
                    <Select options={f.options} allowClear {...f.props} />
                  ) : f.type === 'number' ? (
                    <InputNumber style={{ width: '100%' }} {...f.props} />
                  ) : f.type === 'switch' ? (
                    <Switch {...f.props} />
                  ) : f.type === 'textarea' ? (
                    <Input.TextArea rows={4} {...f.props} />
                  ) : f.type === 'password' ? (
                    <Input.Password {...f.props} />
                  ) : (
                    <Input {...f.props} />
                  )}
                </Form.Item>
              )}
            </div>
          ))}
        </div>
      </Form>
    </Modal>
  )
}
