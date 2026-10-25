import { useEffect, useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner'
import ProjectCard from '../components/ProjectCard'
import { api } from '../api/client'
import useDocumentTitle from '../hooks/useDocumentTitle'

// 项目页：数据来自 GET /api/projects
export default function ProjectsPage() {
  useDocumentTitle('Projects | Li Hanyong')

  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  // 点「重试」时自增，触发 useEffect 重新请求
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await api.getProjects()
        if (!cancelled) setProjects(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  return (
    <section>
      <div className="page-header">
        <h2>My Projects</h2>
        <span className="page-count">
          {!isLoading && !error ? `${projects.length} project${projects.length === 1 ? '' : 's'}` : ''}
        </span>
      </div>

      <p className="page-subtitle">
        每个项目都来自后端 <code>/api/projects</code>，可在管理员后台增删改。
      </p>

      {isLoading && (
        <div className="projects-loading" role="status" aria-live="polite">
          <p className="projects-loading-text">
            <LoadingSpinner />
            Loading projects…
          </p>
          <div className="projects-skeleton" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <div className="skeleton-card" key={n}>
                <div className="skeleton-line skeleton-line--title" />
                <div className="skeleton-line" />
                <div className="skeleton-line skeleton-line--short" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="projects-error" role="alert">
          <h3 className="projects-error-title">Error: {error}</h3>
          <p className="projects-error-hint">
            确认后端已启动、地址正确（VITE_API_URL），然后再试一次。
          </p>
          <button className="retry-button" type="button" onClick={() => setReloadKey((n) => n + 1)}>
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && projects.length === 0 && (
        <p className="projects-empty">No projects yet.</p>
      )}

      {!isLoading && !error && projects.length > 0 && (
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </section>
  )
}
