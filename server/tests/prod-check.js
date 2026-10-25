// 线上环境验收：直接打 Vercel 部署的 API
const BASE = process.env.API_BASE || 'https://capstone-portfolio-zeta.vercel.app'
const ADMIN = { email: 'lihanyong@test.com', password: 'MySuperSecretPassword123' }

let pass = 0
let fail = 0
function check(label, ok, detail = '') {
  if (ok) {
    pass += 1
    console.log(`  OK  ${label}`)
  } else {
    fail += 1
    console.log(`  FAIL ${label} ${detail}`)
  }
}

async function call(method, path, { token, body } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text.slice(0, 200) }
  }
  return { status: res.status, data }
}

;(async () => {
  console.log(`BASE = ${BASE}\n`)

  const health = await call('GET', '/api/health')
  check('GET /api/health 200', health.status === 200, JSON.stringify(health.data))
  check('数据库 connected', health.data && health.data.db === 'connected', String(health.data && health.data.db))

  // 根路径：Vercel 的 rewrite 会把 / 改写成 /api，入口里再还原成 /，
  // 所以访问后端域名应该看到接口说明，而不是 404
  const root = await call('GET', '/')
  check(
    'GET / 返回接口说明（不是 404）',
    root.status === 200 && root.data && root.data.success === true,
    JSON.stringify(root.data).slice(0, 120)
  )

  const projects = await call('GET', '/api/projects')
  check('GET /api/projects 200', projects.status === 200)
  check('项目 3 条', Array.isArray(projects.data) && projects.data.length === 3, String(projects.data && projects.data.length))
  check(
    '项目带作者 username',
    Boolean(projects.data && projects.data[0] && projects.data[0].user && projects.data[0].user.username),
    JSON.stringify(projects.data && projects.data[0] && projects.data[0].user)
  )

  const posts = await call('GET', '/api/blog')
  check('GET /api/blog 200', posts.status === 200)
  check('文章 2 篇', Array.isArray(posts.data) && posts.data.length === 2, String(posts.data && posts.data.length))

  if (Array.isArray(posts.data) && posts.data[0]) {
    const detail = await call('GET', `/api/blog/${posts.data[0]._id}`)
    check('GET /api/blog/:id 200', detail.status === 200)
    check('详情带 comments 数组', Array.isArray(detail.data && detail.data.comments))
    check('详情作者已 populate', Boolean(detail.data && detail.data.author && detail.data.author.username))
  }

  const unauth = await call('GET', '/api/contact')
  check('未登录访问收件箱 401', unauth.status === 401, `实际 ${unauth.status}`)

  const anonProject = await call('POST', '/api/projects', { body: { title: 'x', description: 'y' } })
  check('未登录建项目 401', anonProject.status === 401, `实际 ${anonProject.status}`)

  const login = await call('POST', '/api/users/login', { body: ADMIN })
  check('管理员登录 200', login.status === 200, JSON.stringify(login.data))
  const token = login.data && login.data.token
  check('返回 token', Boolean(token))
  check('返回 role=admin', login.data && login.data.role === 'admin', String(login.data && login.data.role))

  if (token) {
    const inbox = await call('GET', '/api/contact', { token })
    check('管理员访问收件箱 200', inbox.status === 200)

    const badId = await call('GET', '/api/projects/not-an-id')
    check('非法 ObjectId 400', badId.status === 400, `实际 ${badId.status}`)

    const notFound = await call('GET', '/api/does-not-exist')
    check('未匹配路由 404', notFound.status === 404, `实际 ${notFound.status}`)
  }

  console.log(`\n通过 ${pass} 项 / 失败 ${fail} 项`)
  process.exitCode = fail > 0 ? 1 : 0
})()
