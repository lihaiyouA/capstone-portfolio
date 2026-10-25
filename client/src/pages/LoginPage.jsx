import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function LoginPage() {
  useDocumentTitle('Login | Li Hanyong')

  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // 从受保护页面被踢回来时，登录成功后回到原地址
  const from = location.state?.from

  const [form, setForm] = useState({ email: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) return <Navigate to={from || '/'} replace />

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const data = await login(form.email.trim(), form.password)
      const target = from || (data.role === 'admin' ? '/admin' : '/')
      navigate(target, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-section">
      <h2>Login</h2>
      <p className="auth-intro">
        登录后可以发表评论；管理员还可以进入 <Link to="/admin">后台管理</Link>。
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="form-field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button className="form-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-switch">
        还没有账号？<Link to="/register">注册一个</Link>
      </p>
    </section>
  )
}
