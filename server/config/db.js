// MongoDB 连接（Mongoose ODM）
// 每次只建立一次连接；server.js 启动前会 await 它。
const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not configured. Create server/.env first.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('MongoDB connect error', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
