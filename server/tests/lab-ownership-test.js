// Chapter 8 Part 2：文章归属校验自动化验收脚本
// 运行前请先启动服务器（npm start / npm run dev），然后执行：npm run test:owner
require('dotenv').config();

const BASE = `http://127.0.0.1:${process.env.PORT || 5000}`;
const suffix = Date.now();
const password = 'Password123';

const results = [];
function check(name, expected, res) {
  const ok = res.status === expected;
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name} | expected ${expected}, got ${res.status} | ${JSON.stringify(res.body)}`);
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

async function registerAndLogin(tag) {
  const username = `${tag}_${suffix}`;
  const email = `${tag}_${suffix}@example.com`;
  const reg = await call('POST', '/api/users/register', { body: { username, email, password } });
  if (reg.status !== 201) throw new Error(`register ${tag} failed: ${JSON.stringify(reg.body)}`);
  const login = await call('POST', '/api/users/login', { body: { email, password } });
  if (login.status !== 200 || !login.body.token) throw new Error(`login ${tag} failed`);
  return { username, email, token: login.body.token, id: login.body._id };
}

(async () => {
  const alice = await registerAndLogin('owner');
  const bob = await registerAndLogin('other');

  // Alice 创建文章
  const create = await call('POST', '/api/posts', {
    token: alice.token,
    body: { title: `Ownership test ${suffix}`, content: 'Post owned by Alice.', category: 'Technology' }
  });
  check('Alice 创建文章 -> 201', 201, create);
  const postId = create.body._id;

  // Bob 既不是作者，所以不能改、不能删
  const bobPut = await call('PUT', `/api/posts/${postId}`, {
    token: bob.token,
    body: { title: 'Bob tries to edit' }
  });
  check('Bob 修改 Alice 的文章 -> 403', 403, bobPut);

  const bobDelete = await call('DELETE', `/api/posts/${postId}`, { token: bob.token });
  check('Bob 删除 Alice 的文章 -> 403', 403, bobDelete);

  // 文章必须原封不动
  const stillThere = await call('GET', `/api/posts/${postId}`);
  check('文章仍然存在 -> 200', 200, stillThere);
  if (stillThere.body.title !== `Ownership test ${suffix}`) {
    console.log('!! 文章标题被 Bob 改掉了');
  }

  // 作者本人可以修改；请求体里伪造 author 也不会生效
  const alicePut = await call('PUT', `/api/posts/${postId}`, {
    token: alice.token,
    body: { title: `Updated by owner ${suffix}`, author: bob.id }
  });
  check('Alice 修改自己的文章 -> 200', 200, alicePut);
  if (String(alicePut.body.author) !== String(alice.id)) {
    console.log('!! author 被请求体篡改了');
  }

  // 作者本人可以删除
  const del = await call('DELETE', `/api/posts/${postId}`, { token: alice.token });
  check('Alice 删除自己的文章 -> 200', 200, del);

  const gone = await call('GET', `/api/posts/${postId}`);
  check('删除后再查询 -> 404', 404, gone);

  // 清理测试账号（用户管理接口需要登录，且只能删除自己的账号）
  for (const u of [bob, alice]) {
    const d = await call('DELETE', `/api/users/${u.id}`, { token: u.token });
    console.log(`CLEANUP delete user ${u.username}: ${d.status}`);
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\nSUMMARY: ${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 2 : 0);
})().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
