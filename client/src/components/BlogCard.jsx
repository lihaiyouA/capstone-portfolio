import { Link } from 'react-router-dom'
import { excerpt, formatDate } from '../utils/format'

// 博客列表卡片：数据来自后端 /api/blog（author 已 populate 成 { _id, username }）
export default function BlogCard({ post }) {
  const author = post.author?.username || 'unknown'

  return (
    <article className="blog-card">
      <div className="blog-meta">
        <span className="card-tag">{post.category || 'Other'}</span>
        <span>{formatDate(post.createdAt)}</span>
        <span>by {author}</span>
        {post.isPrivate && <span className="badge badge--warn">Private</span>}
      </div>

      <h3 className="blog-card-title">
        <Link to={`/blog/${post._id}`}>{post.title}</Link>
      </h3>

      <p className="blog-card-excerpt">{post.summary || excerpt(post.content)}</p>

      <Link className="card-link" to={`/blog/${post._id}`}>
        Read more →
      </Link>
    </article>
  )
}
