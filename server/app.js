// app.js —— 只负责「组装 Express 应用」，不监听端口、不连数据库。
// 这样本地启动（server.js）和 Vercel Serverless（api/index.js）都能复用它。
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');

const userRoutes = require('./routes/userRoutes');
const blogRoutes = require('./routes/blogRoutes');
const projectRoutes = require('./routes/projectRoutes');
const contactRoutes = require('./routes/contactRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Render / Vercel 前面都有反向代理，这一行让 req.protocol、req.ip 还原成真实值
app.set('trust proxy', 1);

// --------------------------
// 安全与通用中间件
// --------------------------
app.use(helmet());

// CORS_ORIGIN 支持逗号分隔多个域名；留空则允许所有来源（仅适合开发）
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // 没有 Origin 头：curl / Postman / 服务端调用，直接放行
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.warn(`CORS blocked origin: ${origin}`);
      return callback(null, false);
    }
  })
);

app.use(express.json({ limit: '1mb' }));

// --------------------------
// 路由挂载
// --------------------------
app.use('/api/users', userRoutes);
app.use('/api/blog', blogRoutes); // 期末文档要求的路径
app.use('/api/projects', projectRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/posts', blogRoutes); // 兼容 Lab-15/16 的旧路径

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

module.exports = app;
