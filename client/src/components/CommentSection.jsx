import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/format'

// 评论区：公开可读，登录后可发（文档要求 POST /api/blog/:postId/comments 需要 JWT）
export default function CommentSection({ postId, initialComments = [] }) {
  const { isAuthenticated, user } = useAuth()
  const [comments, setComments] = useState(initialComments)
  const [body, setBody] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')

  // 详情页首次加载时可能还没拿到评论，props 变了就同步一次
  useEffect(() => {
    setComments(initialComments)
  }, [initialComments])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const text = body.trim()
    if (!text) return

    setIsSending(true)
    setError('')
    try {
      const created = await api.createComment(postId, text)
      setComments((prev) => [...prev, created])
      setBody('')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="comment-section">
      <h2>Comments ({comments.length})</h2>

      {comments.length === 0 ? (
        <p className="empty-state">No comments yet. Be the first to share your thoughts.</p>
      ) : (
        <ul className="comment-list">
          {comments.map((comment) => (
            <li className="comment" key={comment._id}>
              <div className="comment-meta">
                <strong>{comment.author?.username || 'unknown'}</strong>
                <span>{formatDate(comment.createdAt)}</span>
              </div>
              <p className="comment-body">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      {isAuthenticated ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Write a comment as {user?.username || user?.email}</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Share your thoughts…"
              required
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button className="form-submit" type="submit" disabled={isSending || !body.trim()}>
            {isSending ? 'Posting…' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <p className="comment-login-hint">
          <Link to="/login">登录</Link> 后即可发表评论。
        </p>
      )}
    </section>
  )
}
