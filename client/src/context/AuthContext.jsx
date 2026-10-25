// 全局认证状态（文档要求：用 Context API 管理 authentication state）
//
// 保存两份东西：
//   - token：放进 localStorage，刷新页面后仍然登录
//   - user ：{ _id, username, email, role }，只用于界面展示与路由守卫
//
// 注意：前端判断 role 只是“显示/隐藏入口”，真正的权限校验永远在服务端
// （项目写接口有 requireAdmin，文章修改有作者校验）。
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken } from '../api/client'

const USER_KEY = 'capstone_user'
const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken())
  const [user, setUser] = useState(() => readStoredUser())

  const persist = useCallback((nextToken, nextUser) => {
    setTokenState(nextToken)
    setToken(nextToken)
    setUser(nextUser)
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    else localStorage.removeItem(USER_KEY)
  }, [])

  const login = useCallback(
    async (email, password) => {
      const data = await api.login(email, password)
      persist(data.token, {
        _id: data._id,
        username: data.username,
        email: data.email,
        role: data.role,
      })
      return data
    },
    [persist],
  )

  const register = useCallback(
    async ({ username, email, password }) => {
      await api.register({ username, email, password })
      // 注册成功后直接登录，省掉用户再填一次表单
      return login(email, password)
    },
    [login],
  )

  const logout = useCallback(() => persist(null, null), [persist])

  // 令牌失效（401）时自动登出，避免界面停在“已登录但全部 401”的状态
  useEffect(() => {
    const handle = () => {
      persist(null, null)
    }
    window.addEventListener('capstone:unauthorized', handle)
    return () => window.removeEventListener('capstone:unauthorized', handle)
  }, [persist])

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [token, user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 自定义 hook：任何组件里 const { user, login } = useAuth()
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth 必须在 <AuthProvider> 内部使用')
  return context
}
