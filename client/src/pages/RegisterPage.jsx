import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useDocumentTitle from '../hooks/useDocumentTitle'

const MIN_PASSWORD = 6 // 与后端 User 模型的校验保持一致

export default function RegisterPage() {
  useDocumentTitle('Register | Li Hanyong')

  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) return <Navigate to="/" replace />

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    // 前端先做基础校验，减少无谓请求；服务端仍会再校验一次
    if (form.password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters long`)
      return
    }
    if (form.password !== form.confirm) {
      setError('两次输入的密码不一致')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      // 注册即登录；新账号默认是 user 角色，所以回首页
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-section">
      <h2>Create an account</h2>
      <p className="auth-intro">
        注册后即可发表评论。新账号是普通用户；管理员权限由站点维护者在服务器上授予。
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Username</span>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
            placeholder="yourname"
            required
          />
        </label>

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
          <span>Password（至少 {MIN_PASSWORD} 位）</span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            placeholder="••••••••"
            required
          />
        </label>

        <label className="form-field">
          <span>Confirm password</span>
          <input
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            autoComplete="new-password"
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
          {isSubmitting ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="auth-switch">
        已经有账号？<Link to="/login">去登录</Link>
      </p>
    </section>
  )
}
