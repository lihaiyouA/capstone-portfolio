const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  // Challenge 1（测试 token 过期）：把有效期做成可配置项。
  // 平时用 .env 里的 JWT_EXPIRES_IN=30d；想测试过期时改成 1s 即可，
  // 不需要修改代码。jwt.verify 遇到过期 token 会抛出 TokenExpiredError。
  return jwt.sign(
    { id: userId },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

module.exports = generateToken;
