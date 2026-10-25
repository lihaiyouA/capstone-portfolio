// Lab-15 自动化验收脚本
// 运行前请先启动服务器（npm start / npm run dev），然后执行：npm run test:auth
require('dotenv').config();
const jwt = require('jsonwebtoken');

const BASE = `http://127.0.0.1:${process.env.PORT || 5000}`;
const suffix = Date.now();
const username = `lab15_${suffix}`;
const email = `lab15_${suffix}@example.com`;
const password = 'Password123';

const results = [];
function check(name, expectedStatus, res, extra = '') {
  const ok = res.status === expectedStatus;
  results.push({ name, ok, expected: expectedStatus, actual: res.status, body: res.body, extra });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name} | expected ${expectedStatus}, got ${res.status} | ${JSON.stringify(res.body)}`);
}

async function call(method, path, { token, body } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  let data;
  try { data = await r.json(); } catch { data = await r.text(); }
  return { status: r.status, body: data };
}

(async () => {
  const created = {};

  // 1. 注册（Chapter 7 的接口）
  const reg = await call('POST', '/api/users/register', {
    body: { username, email, password }
  });
  check('注册新用户', 201, reg);

  // 2. 登录拿 token
  const login = await call('POST', '/api/users/login', { body: { email, password } });
  check('登录并获取 JWT', 200, login);
  const token = login.body && login.body.token;
  if (!token) { console.log('!! 没有拿到 token，后续测试无法进行'); process.exit(1); }
  const userId = login.body._id;

  // 3. Test 1（失败场景）：不携带 token 创建文章
  const noToken = await call('POST', '/api/posts', {
    body: {
      title: `No token test ${suffix}`,
      content: 'No token content',
      category: 'Technology'
    }
  });
  check('无 token POST /api/posts -> 401', 401, noToken);
  if (noToken.body && noToken.body.message !== 'Not authorized, no token') {
    console.log('!! 错误信息不是 "Not authorized, no token"');
  }

  // 4. 伪造 token
  const badToken = await call('POST', '/api/posts', {
    token: 'this.is.not.a.real.token',
    body: {
      title: `Bad token test ${suffix}`,
      content: 'Bad token content',
      category: 'Technology'
    }
  });
  check('伪造 token -> 401', 401, badToken);

  // 5. Test 2（成功场景）：携带有效 token 创建文章
  const withToken = await call('POST', '/api/posts', {
    token,
    body: {
      title: `Lab15 test post ${suffix}`,
      content: 'This post is created by the automated Lab-15 test.',
      category: 'Technology'
    }
  });
  check('有效 token POST /api/posts -> 201', 201, withToken);
  if (!withToken.body || String(withToken.body.author) !== String(userId)) {
    console.log('!! author 不是当前登录用户');
  } else {
    created.postId = withToken.body._id;
  }

  // 6. Challenge 2：PUT / DELETE 未登录应被拒绝
  const putNoToken = await call('PUT', `/api/posts/${created.postId || '000000000000000000000000'}`, {
    body: { title: 'Hacked title' }
  });
  check('无 token PUT /api/posts/:id -> 401', 401, putNoToken);

  const delNoToken = await call('DELETE', `/api/posts/${created.postId || '000000000000000000000000'}`);
  check('无 token DELETE /api/posts/:id -> 401', 401, delNoToken);

  // 7. Challenge 1：1 秒后过期的 token
  const expiredToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1s' });
  await new Promise((r) => setTimeout(r, 1600));
  const expired = await call('POST', '/api/posts', {
    token: expiredToken,
    body: {
      title: `Expired token test ${suffix}`,
      content: 'Expired token content',
      category: 'Technology'
    }
  });
  check('过期 token -> 401', 401, expired);

  // 8. 清理测试数据
  if (created.postId) {
    const delPost = await call('DELETE', `/api/posts/${created.postId}`, { token });
    console.log(`CLEANUP delete post: ${delPost.status}`);
  }
  if (userId) {
    const delUser = await call('DELETE', `/api/users/${userId}`, { token });
    console.log(`CLEANUP delete user: ${delUser.status}`);
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nSUMMARY: ${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 2 : 0);
})().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
