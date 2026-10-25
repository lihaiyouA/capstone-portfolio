// server.js —— 应用装配入口（只负责“接插件”，业务在 routes/controllers/models 里）
//
// 请求流向：server -> routes -> middleware -> controllers -> models
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const blogRoutes = require('./routes/blogRoutes');
const projectRoutes = require('./routes/projectRoutes');
const contactRoutes = require('./routes/contactRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Render / Railway 等平台前面有反向代理，这一行让 req.protocol、req.ip 还原成真实值
app.set('trust proxy', 1);

// --------------------------
// 安全与通用中间件
// --------------------------
// helmet：设置一批安全响应头（隐藏 x-powered-by、限制 referrer 等）
app.use(helmet());

// cors：允许前端（本地 5173 / 线上 Vercel 域名）跨域调用
// CORS_ORIGIN 支持逗号分隔多个域名；留空则允许所有来源（仅适合开发）
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // 没有 Origin 头：curl / Postman / 服务端之间调用，直接放行
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.warn(`CORS blocked origin: ${origin}`);
      return callback(null, false);
    }
  })
);

// 解析 JSON 请求体
app.use(express.json({ limit: '1mb' }));

// --------------------------
// 路由挂载
// --------------------------
app.use('/api/users', userRoutes);
app.use('/api/blog', blogRoutes);       // 期末文档要求的路径
app.use('/api/projects', projectRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/posts', blogRoutes);      // 兼容 Lab-15/16 的旧路径

// 根路径与健康检查：部署后用来确认服务活着
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Capstone Portfolio & Blog API is running',
    endpoints: ['/api/users', '/api/projects', '/api/blog', '/api/contact']
  });
});

app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    status: 'ok',
    db: states[mongoose.connection.readyState] || 'unknown',
    uptime: Math.round(process.uptime())
  });
});

// --------------------------
// 404 兜底 + 集中错误处理（必须放在所有路由之后）
// --------------------------
app.use(notFound);
app.use(errorHandler);

// 先连数据库，成功了再监听端口
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
});

module.exports = app;
