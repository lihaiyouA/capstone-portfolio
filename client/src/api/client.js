// 统一的后端访问层：
//   - 所有请求都从这里走，方便换部署地址
//   - 自动带上 Authorization: Bearer <token>
//   - 把后端的 { success:false, status, message } 统一转成 Error，页面直接读 message
const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000').replace(/\/$/, '')

const TOKEN_KEY = 'capstone_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function request(path, { method = 'GET', body, auth } = {}) {
  const headers = {}
  // auth 显式传 null 表示“这次不带令牌”（登录/注册/公开接口）
  const token = auth === undefined ? getToken() : auth
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error('无法连接服务器，请确认后端已启动（npm run dev）')
  }

  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }

  if (!response.ok) {
    // 令牌过期/被删号：通知外层自动退出登录
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event('capstone:unauthorized'))
    }
    const error = new Error((data && data.message) || `请求失败（HTTP ${response.status}）`)
    error.status = response.status
    throw error
  }

  return data
}

export const api = {
  // 认证
  login: (email, password) =>
    request('/api/users/login', { method: 'POST', body: { email, password }, auth: null }),
  register: (payload) =>
    request('/api/users/register', { method: 'POST', body: payload, auth: null }),

  // 作品集项目
  getProjects: () => request('/api/projects'),
  getProject: (id) => request(`/api/projects/${id}`),
  createProject: (payload) => request('/api/projects', { method: 'POST', body: payload }),
  updateProject: (id, payload) => request(`/api/projects/${id}`, { method: 'PUT', body: payload }),
  deleteProject: (id) => request(`/api/projects/${id}`, { method: 'DELETE' }),

  // 博客
  getPosts: () => request('/api/blog'),
  getPost: (id) => request(`/api/blog/${id}`),
  createPost: (payload) => request('/api/blog', { method: 'POST', body: payload }),
  updatePost: (id, payload) => request(`/api/blog/${id}`, { method: 'PUT', body: payload }),
  deletePost: (id) => request(`/api/blog/${id}`, { method: 'DELETE' }),

  // 评论
  getComments: (postId) => request(`/api/blog/${postId}/comments`),
  createComment: (postId, body) =>
    request(`/api/blog/${postId}/comments`, { method: 'POST', body: { body } }),

  // 联系表单与留言收件箱
  sendMessage: (payload) => request('/api/contact', { method: 'POST', body: payload, auth: null }),
  getMessages: () => request('/api/contact'),
  deleteMessage: (id) => request(`/api/contact/${id}`, { method: 'DELETE' }),
}

export { API_URL }
