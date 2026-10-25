// Lab-16 Challenge 验收脚本：Challenge 1（isPrivate）+ Challenge 2（editor 角色）
// 运行前请先启动服务器（npm start / npm run dev），然后执行：npm run test:challenge
require('dotenv').config();
const mongoose = require('mongoose');

const BASE = `http://127.0.0.1:${process.env.PORT || 5000}`;
const suffix = Date.now();
const password = 'Password123';

const results = [];
function check(name, expected, res) {
  const ok = res.status === expected;
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name} | expected ${expected}, got ${res.status} | ${JSON.stringify(res.body)}`);
  return ok;
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
  const alice = await registerAndLogin('alice');
  const bob = await registerAndLogin('bob');
  const editor = await registerAndLogin('editor');

  // 把 editor 的角色改成 'editor'（注册接口不允许自己指定角色）
  await mongoose.connect(process.env.MONGO_URI);
  const users = mongoose.connection.getClient().db().collection('users');
  const r = await users.updateOne(
    { _id: new mongoose.Types.ObjectId(editor.id) },
    { $set: { role: 'editor' } }
  );
  console.log(`设置 editor 角色: matched=${r.matchedCount} modified=${r.modifiedCount}`);
  await mongoose.disconnect();

  // Alice 创建两篇文章：P1 公开，P2 私密
  const create1 = await call('POST', '/api/posts', {
    token: alice.token,
    body: { title: `Public post ${suffix}`, content: 'Public content', category: 'Technology' }
  });
  check('Alice 创建公开文章 P1 -> 201', 201, create1);
  const p1 = create1.body._id;

  const create2 = await call('POST', '/api/posts', {
    token: alice.token,
    body: {
      title: `Private post ${suffix}`,
      content: 'Secret content',
      category: 'Technology',
      isPrivate: true
    }
  });
  check('Alice 创建私密文章 P2 -> 201', 201, create2);
  const p2 = create2.body._id;

  // Challenge 1：读取权限
  const p1Anon = await call('GET', `/api/posts/${p1}`);
  check('匿名读公开文章 P1 -> 200', 200, p1Anon);

  const p2Anon = await call('GET', `/api/posts/${p2}`);
  check('匿名读私密文章 P2 -> 403', 403, p2Anon);

  const p2Bob = await call('GET', `/api/posts/${p2}`, { token: bob.token });
  check('Bob 读 Alice 的私密文章 -> 403', 403, p2Bob);

  const p2Alice = await call('GET', `/api/posts/${p2}`, { token: alice.token });
  check('Alice 读自己的私密文章 -> 200', 200, p2Alice);
  if (p2Alice.body && p2Alice.body.isPrivate !== true) {
    console.log('!! 返回的文章 isPrivate 不是 true');
  }

  // Challenge 2：editor 角色可以修改任意文章
  const bobPut = await call('PUT', `/api/posts/${p1}`, {
    token: bob.token,
    body: { title: `Bob edit ${suffix}` }
  });
  check('普通用户 Bob 修改他人文章 -> 403', 403, bobPut);

  const editorPut = await call('PUT', `/api/posts/${p1}`, {
    token: editor.token,
    body: { title: `Editor edit ${suffix}` }
  });
  check('editor 修改他人公开文章 -> 200', 200, editorPut);

  const editorPutPrivate = await call('PUT', `/api/posts/${p2}`, {
    token: editor.token,
    body: { title: `Editor edit private ${suffix}` }
  });
  check('editor 修改他人私密文章 -> 200', 200, editorPutPrivate);

  const editorDelete = await call('DELETE', `/api/posts/${p2}`, { token: editor.token });
  check('editor 删除他人文章 -> 403（删除仍只允许作者）', 403, editorDelete);

  // 清理
  const del1 = await call('DELETE', `/api/posts/${p1}`, { token: alice.token });
  const del2 = await call('DELETE', `/api/posts/${p2}`, { token: alice.token });
  console.log(`CLEANUP posts: ${del1.status} / ${del2.status}`);
  for (const u of [bob, editor, alice]) {
    const d = await call('DELETE', `/api/users/${u.id}`, { token: u.token });
    console.log(`CLEANUP user ${u.username}: ${d.status}`);
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\nSUMMARY: ${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 2 : 0);
})().catch(async (e) => {
  console.error('TEST ERROR', e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
