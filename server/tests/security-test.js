// 安全修复验收：用户管理接口保护 + 禁止客户端改 role + 列表过滤私密文章
// 运行前请先启动服务器（npm start / npm run dev），然后执行：npm run test:security
require('dotenv').config();

const BASE = `http://127.0.0.1:${process.env.PORT || 5000}`;
const suffix = Date.now();
const password = 'Password123';

const results = [];
function check(name, expected, res, extra = '') {
  const ok = res.status === expected;
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name} | expected ${expected}, got ${res.status} | ${JSON.stringify(res.body)}${extra}`);
}

function checkTrue(name, cond, detail = '') {
  results.push(!!cond);
  console.log(`${cond ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);
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
  const alice = await registerAndLogin('sec_alice');
  const bob = await registerAndLogin('sec_bob');

  // ---------- 1. 用户管理接口必须登录 ----------
  check('匿名 GET /api/users -> 401', 401, await call('GET', '/api/users'));
  check('匿名 GET /api/users/:id -> 401', 401, await call('GET', `/api/users/${alice.id}`));
  check('匿名 POST /api/users -> 401', 401, await call('POST', '/api/users', {
    body: { username: `hacker_${suffix}`, email: `hacker_${suffix}@example.com`, password }
  }));
  check('匿名 PUT /api/users/:id -> 401', 401, await call('PUT', `/api/users/${alice.id}`, {
    body: { role: 'editor' }
  }));
  check('匿名 DELETE /api/users/:id -> 401', 401, await call('DELETE', `/api/users/${bob.id}`));

  // 登录后也不能改 / 删别人的账号
  check('Alice 修改 Bob 的账号 -> 403', 403, await call('PUT', `/api/users/${bob.id}`, {
    token: alice.token,
    body: { username: `hacked_${suffix}` }
  }));
  check('Alice 删除 Bob 的账号 -> 403', 403, await call('DELETE', `/api/users/${bob.id}`, {
    token: alice.token
  }));

  // ---------- 2. 登录后也不能改 role ----------
  const selfPromote = await call('PUT', `/api/users/${alice.id}`, {
    token: alice.token,
    body: { role: 'editor', username: `renamed_${suffix}` }
  });
  check('登录用户 PUT role=editor -> 200，但角色应保持 user', 200, selfPromote);
  checkTrue('提权被阻止：role 仍为 user', selfPromote.body.role === 'user', `role=${selfPromote.body.role}`);

  const created = await call('POST', '/api/users', {
    token: alice.token,
    body: { username: `made_${suffix}`, email: `made_${suffix}@example.com`, password, role: 'editor' }
  });
  check('登录用户 POST 带 role=editor -> 201，但角色应保持 user', 201, created);
  checkTrue('创建时提权被阻止：role 仍为 user', created.body.role === 'user', `role=${created.body.role}`);

  // ---------- 3. 列表过滤私密文章 ----------
  const publicPost = await call('POST', '/api/posts', {
    token: alice.token,
    body: { title: `Public list post ${suffix}`, content: 'Public', category: 'Technology' }
  });
  const privatePost = await call('POST', '/api/posts', {
    token: alice.token,
    body: {
      title: `Private list post ${suffix}`,
      content: 'Private',
      category: 'Technology',
      isPrivate: true
    }
  });
  check('创建公开文章 -> 201', 201, publicPost);
  check('创建私密文章 -> 201', 201, privatePost);

  const listAnon = await call('GET', '/api/posts');
  check('匿名 GET /api/posts -> 200', 200, listAnon);
  const anonIds = (listAnon.body || []).map((p) => String(p._id));
  checkTrue('匿名列表不含私密文章', !anonIds.includes(String(privatePost.body._id)));
  checkTrue('匿名列表仍包含公开文章', anonIds.includes(String(publicPost.body._id)));

  const listBob = await call('GET', '/api/posts', { token: bob.token });
  const bobIds = (listBob.body || []).map((p) => String(p._id));
  check('Bob 带 token 获取列表 -> 200', 200, listBob);
  checkTrue('Bob 的列表不含 Alice 的私密文章', !bobIds.includes(String(privatePost.body._id)));

  const listAlice = await call('GET', '/api/posts', { token: alice.token });
  const aliceIds = (listAlice.body || []).map((p) => String(p._id));
  check('Alice 带 token 获取列表 -> 200', 200, listAlice);
  checkTrue('Alice 的列表包含自己的私密文章', aliceIds.includes(String(privatePost.body._id)));

  // ---------- 清理 ----------
  for (const id of [publicPost.body._id, privatePost.body._id]) {
    const d = await call('DELETE', `/api/posts/${id}`, { token: alice.token });
    console.log(`CLEANUP post ${id}: ${d.status}`);
  }
  const madeId = created.body && created.body._id;
  if (madeId) {
    const madeLogin = await call('POST', '/api/users/login', {
      body: { email: `made_${suffix}@example.com`, password }
    });
    const d = await call('DELETE', `/api/users/${madeId}`, { token: madeLogin.body.token });
    console.log(`CLEANUP made user: ${d.status}`);
  }
  for (const u of [bob, alice]) {
    const d = await call('DELETE', `/api/users/${u.id}`, { token: u.token });
    console.log(`CLEANUP user ${u.username}: ${d.status}`);
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\nSUMMARY: ${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 2 : 0);
})().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
