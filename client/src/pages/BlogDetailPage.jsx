import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CommentSection from '../components/CommentSection'
import LoadingSpinner from '../components/LoadingSpinner'
import { api } from '../api/client'
import { formatDate } from '../utils/format'
import useDocumentTitle from '../hooks/useDocumentTitle'

// 博客详情：GET /api/blog/:id 一次拿到文章 + 作者 + 全部评论
export default function BlogDetailPage() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useDocumentTitle(post ? `${post.title} | Blog` : 'Blog Post')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await api.getPost(id)
        if (!cancelled) setPost(data)
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
  }, [id])

  if (isLoading) {
    return (
      <section>
        <p className="projects-loading-text" role="status" aria-live="polite">
          <LoadingSpinner />
          Loading post…
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section>
        <h2>文章打不开</h2>
        <div className="projects-error" role="alert">
          <h3 className="projects-error-title">{error}</h3>
          <Link className="retry-button" to="/blog">
            返回博客列表
          </Link>
        </div>
      </section>
    )
  }

  if (!post) return null

  return (
    <>
      <section>
        <p className="breadcrumb">
          <Link to="/blog">← Back to blog</Link>
        </p>

        <h1 className="post-title">{post.title}</h1>

        <div className="blog-meta post-meta">
          <span className="card-tag">{post.category || 'Other'}</span>
          <span>{formatDate(post.createdAt)}</span>
          <span>by {post.author?.username || 'unknown'}</span>
          {post.isPrivate && <span className="badge badge--warn">Private</span>}
        </div>

        {/* 正文按换行切段，避免整段挤在一起 */}
        <div className="post-content">
          {String(post.content || '')
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </div>
      </section>

      <CommentSection postId={post._id} initialComments={post.comments || []} />
    </>
  )
}
