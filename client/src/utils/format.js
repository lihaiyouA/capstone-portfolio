// 日期格式化：后端返回 ISO 字符串，这里统一显示成 "25 Oct 2026"
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return dateFormatter.format(date)
}

// 列表页摘要：把 Markdown 风格的换行压平，超长截断
export function excerpt(text, max = 150) {
  const flat = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  return flat.length > max ? `${flat.slice(0, max)}…` : flat
}
