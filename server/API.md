# Capstone API 接口清单

Base URL

- 本地：`http://127.0.0.1:5000`
- 线上：`https://capstone-portfolio-zeta.vercel.app`（Vercel Serverless）

## 约定

- 所有请求/响应都是 JSON。
- 需要登录的接口，请在请求头带上：`Authorization: Bearer <token>`。
- 令牌由 `POST /api/users/login` 返回。
- 失败响应统一格式：

```json
{ "success": false, "status": 401, "message": "Not authorized, no token" }
```

- 状态码：`200` 成功 / `201` 创建成功 / `400` 参数或校验错误 / `401` 未登录 / `403` 已登录但无权限 / `404` 资源不存在 / `500` 服务端错误。

## 角色

| 角色 | 说明 |
|---|---|
| 匿名 | 不需要令牌 |
| 登录用户 (`user`) | 注册即可获得；可发表文章、评论 |
| 管理员 (`admin`) | 额外可管理作品集项目、查看留言收件箱 |

> 把账号提升为管理员（可顺带重设密码）：`npm run make-admin -- you@example.com [新密码]`

## 接口总表

| # | 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|---|
| 1 | POST | `/api/users/register` | 公开 | 注册（密码 bcrypt 哈希） |
| 2 | POST | `/api/users/login` | 公开 | 登录，返回 JWT |
| 3 | GET | `/api/projects` | 公开 | 作品集项目列表 |
| 4 | GET | `/api/projects/:id` | 公开 | 单个项目 |
| 5 | POST | `/api/projects` | 管理员 | 新增项目，归属人取登录用户 |
| 6 | PUT | `/api/projects/:id` | 管理员 | 更新项目 |
| 7 | DELETE | `/api/projects/:id` | 管理员 | 删除项目 |
| 8 | POST | `/api/contact` | 公开 | 提交联系表单留言 |
| 9 | GET | `/api/blog` | 公开 | 文章列表（`author` 只含 username） |
| 10 | GET | `/api/blog/:id` | 公开 | 文章详情 + 作者 + 全部评论 |
| 11 | POST | `/api/blog` | 登录 | 发表文章，作者取登录用户 |
| 12 | PUT | `/api/blog/:id` | 作者本人/管理员 | 更新文章 |
| 13 | DELETE | `/api/blog/:id` | 作者本人/管理员 | 删除文章（连带删评论） |
| 14 | GET | `/api/blog/:postId/comments` | 公开 | 某篇文章的评论 |
| 15 | POST | `/api/blog/:postId/comments` | 登录 | 发表评论 |
| 16 | GET | `/api/contact` | 管理员 | 留言收件箱 |
| 17 | DELETE | `/api/contact/:id` | 管理员 | 删除留言 |
| 18 | GET | `/api/health` | 公开 | 健康检查（数据库状态） |

> 兼容：`/api/posts` 与 `/api/blog` 等价（Lab-15/16 的老路径）。

## 请求与响应示例

### 1. 注册

```http
POST /api/users/register
Content-Type: application/json

{ "username": "alice", "email": "alice@example.com", "password": "Password123" }
```

```json
201
{ "success": true, "user": { "username": "alice", "email": "alice@example.com" } }
```

### 2. 登录

```http
POST /api/users/login
Content-Type: application/json

{ "email": "alice@example.com", "password": "Password123" }
```

```json
200
{
  "success": true,
  "_id": "6712...",
  "email": "alice@example.com",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 5. 新增项目（管理员）

```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Capstone Portfolio",
  "description": "Full-stack portfolio with blog and admin dashboard.",
  "imageUrl": "/image/project1.png",
  "repoUrl": "https://github.com/you/repo",
  "liveUrl": "https://your-app.vercel.app",
  "tags": ["React", "Express", "MongoDB"]
}
```

```json
201
{
  "_id": "6713...",
  "title": "Capstone Portfolio",
  "description": "...",
  "imageUrl": "/image/project1.png",
  "repoUrl": "https://github.com/you/repo",
  "liveUrl": "https://your-app.vercel.app",
  "tags": ["React", "Express", "MongoDB"],
  "user": "6712...",
  "createdAt": "2026-10-25T07:20:00.000Z",
  "updatedAt": "2026-10-25T07:20:00.000Z"
}
```

### 8. 提交留言

```http
POST /api/contact
Content-Type: application/json

{ "name": "Bob", "email": "bob@example.com", "message": "Let's work together!" }
```

```json
201
{
  "success": true,
  "message": "Message received, thank you!",
  "data": { "_id": "6714...", "name": "Bob", "email": "bob@example.com", "message": "Let's work together!", "createdAt": "..." }
}
```

### 10. 文章详情（含评论）

```json
200
{
  "_id": "6715...",
  "title": "How I built this",
  "content": "...",
  "category": "Technology",
  "isPrivate": false,
  "author": { "_id": "6712...", "username": "alice" },
  "createdAt": "...",
  "updatedAt": "...",
  "comments": [
    {
      "_id": "6716...",
      "body": "Nice post!",
      "author": { "_id": "6717...", "username": "bob" },
      "post": "6715...",
      "createdAt": "..."
    }
  ]
}
```

### 15. 发表评论

```http
POST /api/blog/6715.../comments
Authorization: Bearer <token>
Content-Type: application/json

{ "body": "Nice post!" }
```

```json
201
{ "_id": "6716...", "body": "Nice post!", "author": { "_id": "6717...", "username": "bob" }, "post": "6715...", "createdAt": "..." }
```

## 一分钟自测（curl）

```bash
BASE=http://127.0.0.1:5000

curl -s $BASE/api/health
curl -s $BASE/api/projects
curl -s $BASE/api/blog

# 注册 + 登录，拿到 TOKEN
curl -s -X POST $BASE/api/users/register -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"Password123"}'

TOKEN=$(curl -s -X POST $BASE/api/users/login -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 带令牌发表文章
curl -s -X POST $BASE/api/blog -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"title":"Hello","content":"World"}'
```

更省事的方式：`npm run test:capstone`，会自动跑完 49 项断言并清理测试数据。

## 环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB Atlas 连接串 |
| `JWT_SECRET` | ✅ | JWT 签名密钥 |
| `JWT_EXPIRES_IN` | — | 默认 `30d` |
| `PORT` | — | 默认 `5000` |
| `CORS_ORIGIN` | — | 允许的前端地址，逗号分隔；留空＝允许所有（仅开发） |
| `SEED_ADMIN_EMAIL` 等 | — | `npm run seed` 创建管理员时使用 |
