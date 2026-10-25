// Vercel Serverless 入口：/api/* 的请求都会进到这里，再交给 Express 处理。
//
// 两个 Serverless 特有的注意点：
//   1. 不能每次请求都 mongoose.connect()——会把 Atlas 的连接数打满。
//      所以把连接 Promise 缓存在模块作用域（函数实例复用期间一直有效）。
//   2. 数据库连不上时要返回 JSON 错误，不能让进程崩掉（否则客户端只看到 502）。
const app = require('../app');
const connectDB = require('../config/db');
const mongoose = require('mongoose');

// Vercel 的函数实例会被复用，模块级变量在复用期间保留
let connectionPromise = global.__capstoneMongoConnection;

async function ensureDatabase() {
  // readyState 1 = connected，直接返回
  if (mongoose.connection.readyState === 1) return;

  if (!connectionPromise) {
    connectionPromise = connectDB().catch((err) => {
      // 失败后清空缓存，下次请求可以重试（比如 Atlas 白名单刚配好）
      connectionPromise = null;
      global.__capstoneMongoConnection = null;
      throw err;
    });
    global.__capstoneMongoConnection = connectionPromise;
  }

  await connectionPromise;
}

module.exports = async (req, res) => {
  try {
    await ensureDatabase();
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 503,
      message: `Database unavailable: ${err.message}`
    });
    return;
  }

  // Vercel 的 rewrite 只用来「选中这个函数」，req.url 仍然是客户端的原始路径：
  //   请求 /            -> 函数看到 /
  //   请求 /api/health  -> 函数看到 /api/health
  // 所以这里不能给路径加 /api 前缀（会把 / 变成 /api 而 404）。
  // 只有部分配置会把根路径送成 /api，此时统一还原成 /。
  if (req.url === '/api' || req.url === '/api/') {
    req.url = '/';
  }

  return app(req, res);
};
