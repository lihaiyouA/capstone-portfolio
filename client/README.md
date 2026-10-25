# Capstone Client — React SPA

期末作品的前端：React 19 + React Router 7 + Vite 8 + Tailwind CSS 4（含一套自定义 CSS 设计系统与暗色模式）。

完整说明（含接口清单、部署步骤）见上级目录的 [../README.md](../README.md)。

## 开发

```bash
npm install
cp .env.example .env.local   # VITE_API_URL 指向后端
npm run dev                  # http://localhost:5173
```

> Vite 8 在这台机器上默认只监听 IPv6 的 localhost，浏览器用 `http://localhost:5173` 打开即可；
> 若要用 `127.0.0.1` 访问，加 `--host 127.0.0.1` 启动。

## 构建

```bash
npm run build     # 产物在 dist/
npm run preview   # 本地预览生产构建
npm run lint      # oxlint
```

## 路由

| 路径 | 页面 | 权限 |
|---|---|---|
| `/` | 首页：About + 精选项目 + 最新文章 | 公开 |
| `/projects` | 项目列表（GET /api/projects） | 公开 |
| `/blog` | 博客列表（GET /api/blog） | 公开 |
| `/blog/:id` | 文章详情 + 评论区 | 公开（评论需登录） |
| `/contact` | 联系表单（POST /api/contact） | 公开 |
| `/login` `/register` | 登录 / 注册 | 公开 |
| `/admin` | 后台管理面板（项目 / 文章 / 留言） | **需登录且 role=admin** |

## 目录

```
src/
├── api/client.js         统一的 fetch 封装：自动带 Bearer token、统一错误信息
├── context/AuthContext.jsx  全局登录状态（token + user 存 localStorage）
├── components/           Header、Footer、Layout、ProtectedRoute、卡片、表单、评论区
├── pages/                9 个页面 + admin/ 三个子面板
├── hooks/useDocumentTitle.js
├── utils/format.js       日期格式化与摘要截断
└── index.css             设计系统（Tailwind 入口 + 自定义样式 + 暗色模式）
```
