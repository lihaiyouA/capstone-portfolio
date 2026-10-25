// server.js —— 本地 / 常驻服务器入口（npm start / npm run dev）
// 只做两件事：连数据库、监听端口。应用本身在 app.js 里。
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch(() => {
    // connectDB 已经打印了具体原因
    process.exit(1);
  });
