// 统一错误处理：404 兜底 + 集中式错误处理器
// 由 Lab 版 server.js 里的内联实现抽出，逻辑保持一致，方便 server.js 只做装配。
const mongoose = require('mongoose');

// 必须挂在所有正常路由之后：捕获没有被任何路由匹配到的请求
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// 必须挂在 notFound 之后：把任何 next(err) / throw 转成统一 JSON
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || res.statusCode;
  let message = err.message || 'Internal Server Error';

  if (err instanceof mongoose.Error.ValidationError) {
    // 客户端提交的数据不合法或未通过 Mongoose schema 校验
    statusCode = 400;
    message = err.message;
  } else if (err instanceof mongoose.Error.CastError) {
    // 例如 :id 不是合法的 MongoDB ObjectId
    statusCode = 400;
    message = 'Invalid resource ID';
  } else if (err instanceof SyntaxError && err.status === 400) {
    // express.json() 无法解析客户端提交的 JSON
    statusCode = 400;
    message = 'Invalid JSON in request body';
  } else if (err.code === 11000) {
    // Mongoose 唯一索引冲突，例如重复的 username 或 email
    statusCode = 400;
    message = 'User with this email or username already exists';
  }

  if (statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  if (statusCode >= 500) {
    console.error(err.stack || err);
    message = 'Internal Server Error';
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message
  });
};

module.exports = { notFound, errorHandler };
