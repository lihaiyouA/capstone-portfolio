import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// 导航项：桌面端与移动端共用同一份数据
const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/projects', label: 'Projects' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
]

const linkBase =
  'block rounded px-3 py-2 text-base font-medium transition-colors hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300'

const controlClasses =
  'cursor-pointer rounded border border-gray-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300'

export default function Header({ isDark, toggleTheme }) {
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)

  const closeMenu = () => setIsMenuOpen(false)

  // Esc 关闭移动端菜单并把焦点还给按钮
  useEffect(() => {
    if (!isMenuOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isMenuOpen])

  const handleLogout = () => {
    logout()
    closeMenu()
    navigate('/')
  }

  // 当前路由高亮：未选中时白字，选中时青色
  const navClass = ({ isActive }) =>
    `${linkBase} ${
      isActive
        ? 'bg-gray-800 text-teal-300'
        : 'text-white hover:bg-gray-800 hover:text-teal-300'
    }`

  return (
    <header className="bg-gray-900 text-white shadow-lg">
      <nav aria-label="Main navigation" className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            onClick={closeMenu}
            className="rounded text-xl font-bold text-white hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
          >
            Li Hanyong
          </Link>

          {/* 桌面端导航 */}
          <ul className="hidden items-center gap-2 md:flex">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.end} className={navClass}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className={controlClasses}
            >
              {isDark ? 'Light' : 'Dark'}
            </button>

            {/* 桌面端：根据登录状态显示不同入口（文档要求 auth-aware） */}
            <div className="hidden items-center gap-2 md:flex">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <NavLink to="/admin" className={navClass}>
                      Admin
                    </NavLink>
                  )}
                  <span className="rounded bg-gray-800 px-3 py-2 text-sm text-gray-300">
                    {user?.username || user?.email}
                  </span>
                  <button type="button" onClick={handleLogout} className={controlClasses}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className={navClass}>
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="block rounded bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
                  >
                    Register
                  </NavLink>
                </>
              )}
            </div>

            {/* 移动端菜单按钮 */}
            <button
              ref={menuButtonRef}
              type="button"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsMenuOpen((open) => !open)}
              className={`${controlClasses} md:hidden`}
            >
              {isMenuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>

        {/* 移动端下拉菜单 */}
        <ul
          id="mobile-navigation"
          className={`${
            isMenuOpen ? 'flex' : 'hidden'
          } mt-4 flex-col gap-1 border-t border-gray-700 pt-4 md:hidden`}
        >
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.end} onClick={closeMenu} className={navClass}>
                {link.label}
              </NavLink>
            </li>
          ))}

          {isAuthenticated ? (
            <>
              {isAdmin && (
                <li>
                  <NavLink to="/admin" onClick={closeMenu} className={navClass}>
                    Admin
                  </NavLink>
                </li>
              )}
              <li className="px-3 py-2 text-sm text-gray-400">
                已登录：{user?.username || user?.email}
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`${controlClasses} w-full text-left`}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/login" onClick={closeMenu} className={navClass}>
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink to="/register" onClick={closeMenu} className={navClass}>
                  Register
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  )
}
