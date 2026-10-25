// 项目卡片：数据来自后端 /api/projects（字段与 Project 模型对应）
export default function ProjectCard({ project }) {
  const { title, description, imageUrl, tags = [], repoUrl, liveUrl } = project || {}

  return (
    <article className="project-card">
      {imageUrl && (
        <img className="card-image" src={imageUrl} alt={`Screenshot of ${title}`} />
      )}

      <h3 className="card-title">{title}</h3>
      <p className="card-description">{description}</p>

      <div className="card-actions">
        {liveUrl && (
          <a className="card-link" href={liveUrl} target="_blank" rel="noreferrer">
            Live Demo →
          </a>
        )}
        {repoUrl && (
          <a className="card-link" href={repoUrl} target="_blank" rel="noreferrer">
            Source Code →
          </a>
        )}
        {!liveUrl && !repoUrl && <span className="card-link-muted">No links yet</span>}
      </div>

      {tags.length > 0 && (
        <div className="card-tags">
          {tags.map((tag) => (
            <span className="card-tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
