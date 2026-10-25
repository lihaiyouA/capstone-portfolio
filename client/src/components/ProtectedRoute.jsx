import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// 受保护路由（文档要求：/admin 未登录不可访问）
//   requireAdmin = true  → 还需要 role === 'admin'
// 未登录时跳转 /login，并记住原来想去的地址，登录后自动跳回去。
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (requireAdmin && !isAdmin) {
    return (
      <section>
        <h2>403 · 只有管理员可以访问</h2>
        <p>
          当前账号 <strong>{user?.username || user?.email}</strong> 的角色是{' '}
          <span className="role-badge">{user?.role || 'user'}</span>。
        </p>
        <p>
          作品集项目属于管理功能，需要 admin 角色。若这是你自己的站点，可在服务器上执行
          <code> npm run make-admin -- {user?.email}</code> 提升权限，然后重新登录。
        </p>
      </section>
    )
  }

  return children
}
