// MongoDB 连接（Mongoose ODM）
// 出错时抛异常而不是直接 process.exit：
//   - 本地启动时 server.js 捕获后退出
//   - Serverless（Vercel）里必须抛错，否则进程被杀，客户端只能拿到 502
const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured. Set it in .env or the hosting provider.');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Serverless 冷启动时不要等太久，失败就尽快返回 503
      serverSelectionTimeoutMS: 10000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('MongoDB connect error:', err.message);
    throw err;
  }
};

module.exports = connectDB;
