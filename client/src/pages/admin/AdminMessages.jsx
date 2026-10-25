import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client'
import { formatDate } from '../../utils/format'

// 后台 · 留言收件箱：GET / DELETE /api/contact（仅管理员）
// 对应作品集联系表单提交的 Message 记录
export default function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      setMessages(await api.getMessages())
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

  const handleDelete = async (message) => {
    if (!window.confirm(`删除来自 ${message.name} 的留言？`)) return
    try {
      await api.deleteMessage(message._id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <h3>Messages ({messages.length})</h3>
        <button className="btn" type="button" onClick={load}>
          刷新
        </button>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="empty-state">加载中…</p>
      ) : messages.length === 0 ? (
        <p className="empty-state">还没有人留言。去联系页提交一条试试。</p>
      ) : (
        <ul className="message-list">
          {messages.map((message) => (
            <li className="message-item" key={message._id}>
              <div className="message-head">
                <strong>{message.name}</strong>
                <a href={`mailto:${message.email}`}>{message.email}</a>
                <span className="cell-muted">{formatDate(message.createdAt)}</span>
                <button
                  className="btn btn--small btn--danger"
                  type="button"
                  onClick={() => handleDelete(message)}
                >
                  删除
                </button>
              </div>
              <p className="message-body">{message.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
