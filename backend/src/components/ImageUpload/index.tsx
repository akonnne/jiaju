import { Upload } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { uploadApi } from '../../api'

interface ImageUploadProps {
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  maxCount?: number
  multiple?: boolean
}

/** 图片上传（AntD Upload picture-card）：对接 /api/sys/upload，返回 URL 列表。 */
export default function ImageUpload({
  value,
  onChange,
  maxCount = 1,
  multiple = false
}: ImageUploadProps) {
  const files: string[] = multiple ? (Array.isArray(value) ? value : []) : value ? [value as string] : []

  const customRequest = async (options: any) => {
    const { file, onSuccess, onError } = options
    try {
      const url = await uploadApi.upload(file as File)
      onSuccess?.({ url })
    } catch (e) {
      onError?.(e as Error)
    }
  }

  const handleChange = (info: any) => {
    const list = info.fileList ?? []
    const urls = list
      .map((f: any) => f.response?.url ?? f.url)
      .filter((u: string | undefined): u is string => Boolean(u))
    if (multiple) {
      onChange?.(urls)
    } else {
      onChange?.(urls[0] ?? '')
    }
  }

  return (
    <Upload
      listType="picture-card"
      multiple={multiple}
      maxCount={maxCount}
      customRequest={customRequest}
      onChange={handleChange}
      accept="image/*"
      fileList={files.map((url, i) => ({
        uid: String(i),
        name: url.split('/').pop() || `img-${i}`,
        status: 'done' as const,
        url
      }))}
      onRemove={(file) => {
        const rest = files.filter((u) => u !== file.url)
        if (multiple) onChange?.(rest)
        else onChange?.('')
      }}
    >
      {files.length >= maxCount ? null : (
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 4, fontSize: 12 }}>上传</div>
        </div>
      )}
    </Upload>
  )
}
