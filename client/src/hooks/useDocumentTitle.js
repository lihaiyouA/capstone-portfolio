import { useEffect } from 'react'

// 小工具：让每个页面有自己的浏览器标签标题
export default function useDocumentTitle(title) {
  useEffect(() => {
    if (title) document.title = title
  }, [title])
}
