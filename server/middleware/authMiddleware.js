// middleware/authMiddleware.js
// --------------------------
// Lab-15：实现 protect 授权中间件
// 作用：在进入受保护路由的 controller 之前，先检查请求头中的 JWT。
//   1. 从 Authorization: Bearer <token> 中取出 token
//   2. 用 jwt.verify() 验证签名与有效期
//   3. 根据 token 里的 id 查询用户，挂到 req.user 上
//   4. 调用 next()，把控制权交给后面的 controller
// 中间件执行顺序：server.js -> routes -> middleware(protect) -> controllers -> models
// --------------------------
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler'); // 自动捕获 async 函数里的错误并交给 error handler
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 标准格式：Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // "Bearer xxx".split(' ') => ['Bearer', 'xxx']
    token = req.headers.authorization.split(' ')[1];
  }

  // 情况 1：根本没有带 token（或格式不是 Bearer）
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    // 验证签名和过期时间；签名不对或已过期都会抛出错误
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // token 的 payload 是 { id: userId }（见 utils/generateToken.js）
    // 用 id 查用户，并排除密码字段
    req.user = await User.findById(decoded.id).select('-password');

    // 情况 2：token 合法，但用户已经被删除
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    // **成功**：进入下一个中间件 / controller
    next();
  } catch (error) {
    // 情况 3：token 被篡改、签名错误、已过期（TokenExpiredError）
    console.error('JWT verify failed:', error.name, '-', error.message);
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

// --------------------------
// Lab-16 Challenge 1：可选登录（optionalAuth）
// GET /api/posts/:id 需要同时支持“匿名看公开文章”和“作者看私密文章”：
//   - 带了有效 token：把用户挂到 req.user
//   - 没带 token 或 token 无效：当作匿名访问，不直接报错，
//     由 controller 判断这篇文章是否需要登录（私密文章 -> 403）
// --------------------------
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch (error) {
    // 无效/过期 token 不在这里拦截，按“未登录”处理
    req.user = null;
  }

  next();
});

// --------------------------
// 只能操作自己的账号
// 用在 PUT /api/users/:id 与 DELETE /api/users/:id 上：
//   protect 先确认“已登录”，这里再确认 token 对应的用户就是 :id 本人，
//   防止任何登录用户去修改/删除别人的账号。
// --------------------------
const requireSelf = (req, res, next) => {
  if (!req.user || String(req.user._id) !== String(req.params.id)) {
    res.status(403);
    return next(new Error('Not authorized to modify this user'));
  }
  next();
};

// --------------------------
// 仅管理员（期末要求：作品集项目管理 assumed admin-only）
// 必须挂在 protect 之后：protect 负责“你是谁”，requireAdmin 负责“你能不能”。
//   普通用户 -> 403；管理员 -> next()
// --------------------------
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403);
    return next(new Error('Not authorized, admin only'));
  }
  next();
};

module.exports = { protect, optionalAuth, requireSelf, requireAdmin };
