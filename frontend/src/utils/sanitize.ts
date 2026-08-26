import DOMPurify from 'dompurify'

/** 富文本 HTML 清洗（XSS 防护，验收 14.4）。渲染前必须经过 sanitizeHtml。 */
export const sanitizeHtml = (html: string): string =>
  DOMPurify.sanitize(html, {
    // 允许图片与基础排版，禁用脚本/事件属性（DOMPurify 默认）
    ADD_TAGS: ['img'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|data:image\/|\/|#)/i
  })
