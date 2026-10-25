import { useState } from 'react'

const CATEGORIES = [
  'Technology',
  'Lifestyle',
  'Education',
  'Health',
  'Business',
  'Entertainment',
  'Other',
]

const EMPTY = {
  title: '',
  category: 'Technology',
  summary: '',
  content: '',
  isPrivate: false,
}

// 后台的「新增/编辑文章」表单（字段与 BlogPost 模型对应）
export default function BlogForm({ initial, onSubmit, onCancel, isSubmitting }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(initial || {}) }))

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({
      title: form.title.trim(),
      category: form.category,
      summary: form.summary.trim(),
      content: form.content.trim(),
      isPrivate: Boolean(form.isPrivate),
    })
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h3>{initial ? '编辑文章' : '新增文章'}</h3>

      <label className="form-field">
        <span>标题 *</span>
        <input name="title" value={form.title} onChange={handleChange} required maxLength={100} />
      </label>

      <div className="form-row">
        <label className="form-field">
          <span>分类</span>
          <select name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field form-field--checkbox">
          <input
            type="checkbox"
            name="isPrivate"
            checked={form.isPrivate}
            onChange={handleChange}
          />
          <span>仅自己可见（Private）</span>
        </label>
      </div>

      <label className="form-field">
        <span>摘要（列表页显示）</span>
        <input
          name="summary"
          value={form.summary}
          onChange={handleChange}
          maxLength={150}
          placeholder="一句话概括这篇内容"
        />
      </label>

      <label className="form-field">
        <span>正文 *</span>
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          rows={8}
          required
          placeholder="支持换行"
        />
      </label>

      <div className="form-actions">
        <button className="form-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '保存中…' : initial ? '保存修改' : '发布文章'}
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
