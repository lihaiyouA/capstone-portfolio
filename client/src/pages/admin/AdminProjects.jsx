import { useCallback, useEffect, useState } from 'react'
import ProjectForm from '../../components/ProjectForm'
import { api } from '../../api/client'
import { formatDate } from '../../utils/format'

// 后台 · 项目管理：POST / PUT / DELETE /api/projects（服务端要求 admin 角色）
export default function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  // null = 不显示表单；'new' = 新增；对象 = 编辑该条
  const [editing, setEditing] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      setProjects(await api.getProjects())
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
      if (editing === 'new') await api.createProject(payload)
      else await api.updateProject(editing._id, payload)

      setEditing(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (project) => {
    if (!window.confirm(`删除项目「${project.title}」？此操作不可撤销。`)) return
    try {
      await api.deleteProject(project._id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <h3>Projects ({projects.length})</h3>
        {!editing && (
          <button className="btn btn--primary" type="button" onClick={() => setEditing('new')}>
            + 新增项目
          </button>
        )}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {editing && (
        <ProjectForm
          initial={editing === 'new' ? null : editing}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
          isSubmitting={isSaving}
        />
      )}

      {isLoading ? (
        <p className="empty-state">加载中…</p>
      ) : projects.length === 0 ? (
        <p className="empty-state">还没有项目，点上面的按钮新建一个。</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>标题</th>
                <th>标签</th>
                <th>更新时间</th>
                <th className="col-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project._id}>
                  <td>
                    <strong>{project.title}</strong>
                    <div className="cell-muted">{project.description}</div>
                  </td>
                  <td>
                    <div className="card-tags">
                      {(project.tags || []).map((tag) => (
                        <span className="card-tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="cell-muted">{formatDate(project.updatedAt)}</td>
                  <td className="col-actions">
                    <button className="btn btn--small" type="button" onClick={() => setEditing(project)}>
                      编辑
                    </button>
                    <button
                      className="btn btn--small btn--danger"
                      type="button"
                      onClick={() => handleDelete(project)}
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
