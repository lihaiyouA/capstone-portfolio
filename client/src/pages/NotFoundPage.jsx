import { Link, useLocation } from 'react-router-dom'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle('404 | Li Hanyong')
  // 用路由提供的 location，而不是 window.location（SSR/测试环境下也安全）
  const { pathname } = useLocation()

  return (
    <section>
      <h2>404 · Page not found</h2>
      <p className="page-subtitle">
        这个地址不存在：<code>{pathname}</code>
      </p>
      <p className="form-actions">
        <Link className="form-submit" to="/">
          回到首页
        </Link>
        <Link className="btn btn--ghost" to="/blog">
          去看博客
        </Link>
      </p>
    </section>
  )
}
