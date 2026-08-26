import { useEffect, useRef, useState } from 'react'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import { message } from 'antd'
import { uploadApi } from '../../api'

interface RichEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
}

/** 富文本编辑器（wangEditor）：工具栏 + 图片上传对接 /api/sys/upload。 */
export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  const editorRef = useRef<IDomEditor | null>(null)
  const [editor, setEditor] = useState<IDomEditor | null>(null)

  const toolbarConfig: Partial<IToolbarConfig> = {
    excludeKeys: ['group-video']
  }

  const editorConfig: Partial<IEditorConfig> = {
    placeholder: placeholder || '请输入内容…',
    MENU_CONF: {
      uploadImage: {
        async customUpload(file: File, insertFn: (url: string, alt: string, href: string) => void) {
          try {
            const url = await uploadApi.upload(file)
            insertFn(url, file.name, url)
          } catch {
            message.error('图片上传失败')
          }
        }
      }
    }
  }

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy()
      }
    }
  }, [])

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, zIndex: 100 }}>
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: '1px solid #d9d9d9' }}
      />
      <Editor
        defaultConfig={editorConfig}
        value={value || ''}
        onCreated={(e) => {
          editorRef.current = e
          setEditor(e)
        }}
        onChange={(e) => onChange?.(e.getHtml())}
        mode="default"
        style={{ height: 320, overflowY: 'hidden' }}
      />
    </div>
  )
}
