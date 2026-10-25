import { useState } from 'react'
import AdminMessages from './admin/AdminMessages'
import AdminPosts from './admin/AdminPosts'
import AdminProjects from './admin/AdminProjects'
import { useAuth } from '../context/AuthContext'
import useDocumentTitle from '../hooks/useDocumentTitle'

const TABS = [
  { id: 'projects', label: 'Projects' },
  { id: 'posts', label: 'Blog Posts' },
  { id: 'messages', label: 'Messages' },
]

// 后台管理面板（受保护路由 /admin）
// 三个标签页分别对应：作品集项目的增删改、文章的增删改、联系表单留言收件箱
export default function AdminPage() {
  useDocumentTitle('Admin Dashboard | Li Hanyong')

  const { user } = useAuth()
  const [tab, setTab] = useState('projects')

  return (
    <section>
      <div className="page-header">
        <h2>Admin Dashboard</h2>
        <span className="page-count">
          {user?.username} · <span className="role-badge">{user?.role}</span>
        </span>
      </div>

      <p className="page-subtitle">
        这里的写操作都会带上 JWT（<code>Authorization: Bearer &lt;token&gt;</code>）；
        项目接口在服务端要求 admin 角色。
      </p>

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`admin-tab ${tab === item.id ? 'admin-tab--active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="admin-panel">
        {tab === 'projects' && <AdminProjects />}
        {tab === 'posts' && <AdminPosts />}
        {tab === 'messages' && <AdminMessages />}
      </div>
    </section>
  )
}
