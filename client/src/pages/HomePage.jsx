import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import About from '../components/About'
import BlogCard from '../components/BlogCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ProjectCard from '../components/ProjectCard'
import { api } from '../api/client'
import useDocumentTitle from '../hooks/useDocumentTitle'

// 首页：个人介绍 + 精选项目 + 最新文章
export default function HomePage() {
  useDocumentTitle('Li Hanyong | Portfolio')

  const [projects, setProjects] = useState([])
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // 首屏要同时拉项目与文章：Promise.all 并行，任一失败都进错误分支
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [projectList, postList] = await Promise.all([api.getProjects(), api.getPosts()])
        if (cancelled) return
        setProjects(projectList.slice(0, 3))
        setPosts(postList.slice(0, 2))
        setError('')
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    // 组件卸载后不再 setState，避免 React 警告
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <About />

      <section>
        <div className="page-header">
          <h2>Featured Projects</h2>
          <Link className="text-link" to="/projects">
            View all projects →
          </Link>
        </div>

        {isLoading && (
          <p className="projects-loading-text">
            <LoadingSpinner />
            Loading projects…
          </p>
        )}

        {!isLoading && error && (
          <p className="inline-error">
            无法加载项目：{error}
            <br />
            <small>请确认后端已启动（默认 http://127.0.0.1:5000）。</small>
          </p>
        )}

        {!isLoading && !error && projects.length === 0 && (
          <p className="empty-state">还没有项目。登录管理员账号后可在后台添加。</p>
        )}

        {!isLoading && !error && projects.length > 0 && (
          <div className="projects-grid">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="page-header">
          <h2>Latest from the Blog</h2>
          <Link className="text-link" to="/blog">
            Read the blog →
          </Link>
        </div>

        {posts.length > 0 ? (
          <div className="blog-list">
            {posts.map((post) => (
              <BlogCard key={post._id} post={post} />
            ))}
          </div>
        ) : (
          !isLoading && <p className="empty-state">还没有文章。</p>
        )}
      </section>
    </>
  )
}
