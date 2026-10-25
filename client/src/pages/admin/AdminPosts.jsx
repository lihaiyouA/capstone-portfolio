import { useCallback, useEffect, useState } from 'react'
import BlogForm from '../../components/BlogForm'
import { api } from '../../api/client'
import { formatDate } from '../../utils/format'

// 后台 · 文章管理：POST / PUT / DELETE /api/blog
// 注意：文章只有作者本人（或管理员）能改，这里的账号是 admin，所以都能操作。
export default function AdminPosts() {
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | post
  const [isSaving, setIsSaving] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      setPosts(await api.getPosts())
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (payload) => {
    setIsSaving(true)
    setError('')
    try {
      if (editing === 'new') await api.createPost(payload)
      else await api.updatePost(editing._id, payload)

      setEditing(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (post) => {
    if (!window.confirm(`删除文章「${post.title}」？其评论也会一起删除。`)) return
    try {
      await api.deletePost(post._id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <h3>Blog Posts ({posts.length})</h3>
        {!editing && (
          <button className="btn btn--primary" type="button" onClick={() => setEditing('new')}>
            + 新增文章
          </button>
        )}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {editing && (
        <BlogForm
          initial={editing === 'new' ? null : editing}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
          isSubmitting={isSaving}
        />
      )}

      {isLoading ? (
        <p className="empty-state">加载中…</p>
      ) : posts.length === 0 ? (
        <p className="empty-state">还没有文章。</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>标题</th>
                <th>分类</th>
                <th>作者</th>
                <th>发布时间</th>
                <th className="col-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id}>
                  <td>
                    <strong>{post.title}</strong>
                    {post.isPrivate && <span className="badge badge--warn">Private</span>}
                  </td>
                  <td className="cell-muted">{post.category || 'Other'}</td>
                  <td className="cell-muted">{post.author?.username || '—'}</td>
                  <td className="cell-muted">{formatDate(post.createdAt)}</td>
                  <td className="col-actions">
                    <button className="btn btn--small" type="button" onClick={() => setEditing(post)}>
                      编辑
                    </button>
                    <button
                      className="btn btn--small btn--danger"
                      type="button"
                      onClick={() => handleDelete(post)}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
