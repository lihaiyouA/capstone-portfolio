import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

// 布局组件：Header/Footer 只渲染一次，中间的 <Outlet /> 由路由决定
export default function Layout({ isDark, toggleTheme }) {
  return (
    <>
      <Header isDark={isDark} toggleTheme={toggleTheme} />
      <div className="container">
        <main>
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  )
}
