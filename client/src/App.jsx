import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import HomePage from './pages/HomePage'
import ProjectsPage from './pages/ProjectsPage'
import BlogPage from './pages/BlogPage'
import BlogDetailPage from './pages/BlogDetailPage'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminPage from './pages/AdminPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  // 暗色模式：Lab 版就有的功能，通过给 body 加类名实现
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    document.body.className = isDark ? 'dark-mode' : ''
  }, [isDark])

  const toggleTheme = () => setIsDark((value) => !value)

  return (
    <Routes>
      {/* 所有页面共用一个布局：Header + <Outlet /> + Footer */}
      <Route element={<Layout isDark={isDark} toggleTheme={toggleTheme} />}>
        <Route index element={<HomePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:id" element={<BlogDetailPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* 受保护路由：未登录会被重定向到 /login；仅管理员可进 */}
        <Route
          path="admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
