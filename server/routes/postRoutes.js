// 兼容文件：Lab-15/16 时期的路径是 /api/posts，期末统一为 /api/blog。
// server.js 仍然把这一份挂在 /api/posts 上，旧测试与旧前端无需修改就能继续用。
module.exports = require('./blogRoutes');
