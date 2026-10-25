import { useEffect, useState } from 'react'
import BlogCard from '../components/BlogCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { api } from '../api/client'
import useDocumentTitle from '../hooks/useDocumentTitle'

// 博客列表：数据来自 GET /api/blog（服务端已 populate 作者 username）
export default function BlogPage() {
  useDocumentTitle('Blog | Li Hanyong')

  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await api.getPosts()
        if (!cancelled) setPosts(data)
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
        <h2>Blog</h2>
        <span className="page-count">
          {!isLoading && !error ? `${posts.length} post${posts.length === 1 ? '' : 's'}` : ''}
        </span>
      </div>

      <p className="page-subtitle">
        文章来自后端 <code>/api/blog</code>；登录后可以在任意文章下留言。
      </p>

      {isLoading && (
        <p className="projects-loading-text" role="status" aria-live="polite">
          <LoadingSpinner />
          Loading posts…
        </p>
      )}

      {!isLoading && error && (
        <div className="projects-error" role="alert">
          <h3 className="projects-error-title">Error: {error}</h3>
          <button className="retry-button" type="button" onClick={() => setReloadKey((n) => n + 1)}>
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && posts.length === 0 && (
        <p className="projects-empty">No posts yet.</p>
      )}

      {!isLoading && !error && posts.length > 0 && (
        <div className="blog-list">
          {posts.map((post) => (
            <BlogCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </section>
  )
}
