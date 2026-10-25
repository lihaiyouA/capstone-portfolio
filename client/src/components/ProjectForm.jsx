import { useState } from 'react'

// 后台的「新增/编辑项目」表单。
// 受控组件：所有字段都放在一个 state 对象里，提交时交给父组件调用 API。
const EMPTY = {
  title: '',
  description: '',
  imageUrl: '',
  repoUrl: '',
  liveUrl: '',
  tags: '',
}

export default function ProjectForm({ initial, onSubmit, onCancel, isSubmitting }) {
  // initial 有值时是编辑模式：把 tags 数组拼回逗号字符串
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...(initial || {}),
    tags: Array.isArray(initial?.tags) ? initial.tags.join(', ') : '',
  }))

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      repoUrl: form.repoUrl.trim(),
      liveUrl: form.liveUrl.trim(),
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    })
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h3>{initial ? '编辑项目' : '新增项目'}</h3>

      <label className="form-field">
        <span>标题 *</span>
        <input name="title" value={form.title} onChange={handleChange} required maxLength={120} />
      </label>

      <label className="form-field">
        <span>描述 *</span>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          required
        />
      </label>

      <label className="form-field">
        <span>图片地址</span>
        <input
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleChange}
          placeholder="/image/project1.png 或 https://…"
        />
      </label>

      <div className="form-row">
        <label className="form-field">
          <span>仓库地址</span>
          <input name="repoUrl" value={form.repoUrl} onChange={handleChange} placeholder="https://github.com/…" />
        </label>

        <label className="form-field">
          <span>线上地址</span>
          <input name="liveUrl" value={form.liveUrl} onChange={handleChange} placeholder="https://…" />
        </label>
      </div>

      <label className="form-field">
        <span>技术标签（逗号分隔）</span>
        <input name="tags" value={form.tags} onChange={handleChange} placeholder="React, Express, MongoDB" />
      </label>

      <div className="form-actions">
        <button className="form-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '保存中…' : initial ? '保存修改' : '创建项目'}
        </button>
        {onCancel && (
          <button className="btn btn--ghost" type="button" onClick={onCancel}>
            取消
          </button>
        )}
      </div>
    </form>
  )
}
