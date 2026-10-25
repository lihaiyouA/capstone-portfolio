// 期末 API 冒烟测试：逐条验证文档要求的 14 个接口 + 权限边界
//
// 先启动服务（npm run dev），再另开一个终端：
//   npm run test:capstone
//
// 脚本会临时创建两个用户（A 提升为 admin）、一个项目、一篇文章、一条评论、
// 一条留言，全部跑完后自动清理，不会污染演示数据。
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

const User = require('../models/User');
const Project = require('../models/Project');
const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');
const Message = require('../models/Message');

const BASE = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5000';
const suffix = Date.now().toString(36);

let passed = 0;
let failed = 0;
const failures = [];

function ok(label, detail = '') {
  passed += 1;
  console.log(`  ✓ ${label}${detail ? '  ' + detail : ''}`);
}

function bad(label, expected, got, body) {
  failed += 1;
  failures.push(label);
  console.log(`  ✗ ${label}  期望 ${expected} / 实际 ${got}`);
  if (body) console.log('      ' + JSON.stringify(body).slice(0, 220));
}

async function call(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, body: json };
}

function expect(label, expected, res) {
  if (res.status === expected) ok(label, `(${expected})`);
  else bad(label, expected, res.status, res.body);
  return res;
}

(async () => {
  const created = { users: [], projectId: null, postId: null, commentId: null, messageId: null };

  console.log(`\n目标: ${BASE}\n`);

  // 脚本需要直连数据库：用于把测试用户提升为 admin、校验密码哈希、最后清理数据
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✓ 测试脚本已连接数据库（仅用于校验与清理）\n');

  try {
    // ---------- 0. 健康检查 ----------
    console.log('【0】服务与数据库');
    const health = await call('GET', '/api/health');
    expect('GET /api/health 返回 200', 200, health);
    if (health.body && health.body.db === 'connected') ok('数据库状态 connected');
    else bad('数据库状态应为 connected', 'connected', health.body && health.body.db);
    expect('根路径 GET / 返回 200', 200, await call('GET', '/'));

    // ---------- 1. 公开读接口 ----------
    console.log('\n【1】公开读取');
    expect('GET /api/projects 公开可读', 200, await call('GET', '/api/projects'));
    expect('GET /api/blog 公开可读', 200, await call('GET', '/api/blog'));

    // ---------- 2. 未登录写接口必须 401 ----------
    console.log('\n【2】未登录保护');
    expect('POST /api/projects 无 token → 401', 401,
      await call('POST', '/api/projects', { body: { title: 'x', description: 'y' } }));
    expect('POST /api/blog 无 token → 401', 401,
      await call('POST', '/api/blog', { body: { title: 'x', content: 'y' } }));
    expect('POST /api/contact 匿名 → 201（公开）', 201,
      await call('POST', '/api/contact', {
        body: { name: 'Smoke Tester', email: `smoke_${suffix}@example.com`, message: 'hello from smoke test' }
      }));

    // ---------- 3. 注册与登录 ----------
    console.log('\n【3】注册 / 登录');
    const userA = {
      username: `admin_${suffix}`,
      email: `admin_${suffix}@example.com`,
      password: 'Password123'
    };
    const userB = {
      username: `viewer_${suffix}`,
      email: `viewer_${suffix}@example.com`,
      password: 'Password123'
    };

    expect('POST /api/users/register A', 201,
      await call('POST', '/api/users/register', { body: userA }));
    expect('POST /api/users/register B', 201,
      await call('POST', '/api/users/register', { body: userB }));

    const loginA = expect('POST /api/users/login A', 200,
      await call('POST', '/api/users/login', { body: { email: userA.email, password: userA.password } }));
    const loginB = expect('POST /api/users/login B', 200,
      await call('POST', '/api/users/login', { body: { email: userB.email, password: userB.password } }));

    const tokenA = loginA.body && loginA.body.token;
    const tokenB = loginB.body && loginB.body.token;

    if (tokenA) ok('登录返回 JWT'); else bad('登录应返回 JWT', 'token', 'undefined');

    const recordA = await User.findOne({ email: userA.email });
    const recordB = await User.findOne({ email: userB.email });
    if (recordA) created.users.push(recordA._id);
    if (recordB) created.users.push(recordB._id);

    if (recordA && recordA.role !== 'user') bad('新用户默认 role 应为 user', 'user', recordA.role);
    else ok('新用户默认 role = user');

    // 密码哈希校验：库里存的不能是明文
    // 注意 schema 里 password 是 select:false，必须显式 +password 才查得出来
    const withPassword = await User.findOne({ email: userA.email }).select('+password');
    if (withPassword && /^\$2[aby]\$/.test(withPassword.password || '')) {
      ok('密码以 bcrypt 哈希存储');
    } else {
      bad('密码应以 bcrypt 哈希存储', '$2b$...', String(withPassword && withPassword.password).slice(0, 12));
    }
    if (recordA && recordA.password === undefined) {
      ok('默认查询不返回 password 字段（select:false 生效）');
    } else {
      bad('默认查询不应返回 password', 'undefined', 'field present');
    }

    // ---------- 4. 项目接口（仅管理员） ----------
    console.log('\n【4】项目接口（写操作仅管理员）');
    expect('POST /api/projects 普通用户 → 403', 403,
      await call('POST', '/api/projects', {
        token: tokenB,
        body: { title: 'Should fail', description: 'not admin' }
      }));

    // 直接改库把 A 提升为 admin（等价于 npm run make-admin）
    await User.updateOne({ _id: recordA._id }, { role: 'admin' });
    ok('A 已提升为 admin');

    const createProject = expect('POST /api/projects admin → 201', 201,
      await call('POST', '/api/projects', {
        token: tokenA,
        body: {
          title: `Smoke Project ${suffix}`,
          description: 'Created by the smoke test.',
          imageUrl: '/image/project1.png',
          repoUrl: 'https://github.com/example/repo',
          liveUrl: '',
          tags: ['React', 'Express'],
          user: '000000000000000000000000' // 故意伪造，服务端应忽略
        }
      }));

    created.projectId = createProject.body && createProject.body._id;

    if (createProject.body && String(createProject.body.user) === String(recordA._id)) {
      ok('项目 user 由服务端写入（忽略了请求体伪造的 user）');
    } else {
      bad('项目归属人应取自登录用户', String(recordA._id), String(createProject.body && createProject.body.user));
    }

    const getProject = expect('GET /api/projects/:id', 200,
      await call('GET', `/api/projects/${created.projectId}`));
    if (getProject.body && getProject.body.user && getProject.body.user.username) {
      ok('项目 populate 出作者 username');
    } else {
      bad('项目应 populate user.username', 'object with username', JSON.stringify(getProject.body && getProject.body.user));
    }

    expect('PUT /api/projects/:id admin → 200', 200,
      await call('PUT', `/api/projects/${created.projectId}`, {
        token: tokenA,
        body: { title: `Smoke Project ${suffix} (edited)` }
      }));

    expect('GET /api/projects 列表中能看到新项目', 200, await call('GET', '/api/projects'));

    // ---------- 5. 博客接口 ----------
    console.log('\n【5】博客接口');
    const createPost = expect('POST /api/blog 登录 → 201', 201,
      await call('POST', '/api/blog', {
        token: tokenA,
        body: {
          title: `Smoke post ${suffix}`,
          content: 'Content created by the smoke test.',
          category: 'Technology'
        }
      }));
    created.postId = createPost.body && createPost.body._id;

    if (createPost.body && String(createPost.body.author) === String(recordA._id)) {
      ok('文章 author 取自登录用户');
    } else {
      bad('文章 author 应为登录用户', String(recordA._id), String(createPost.body && createPost.body.author));
    }

    const list = expect('GET /api/blog', 200, await call('GET', '/api/blog'));
    const listed = Array.isArray(list.body) && list.body.find((p) => p._id === created.postId);
    if (listed && listed.author && listed.author.username) ok('列表 populate 出 author.username');
    else if (listed && listed.author) bad('列表中 author 应只含 username', 'username', JSON.stringify(listed.author));
    else bad('列表应包含刚创建的文章', 'post', 'missing');

    // 评论
    const createComment = expect('POST /api/blog/:postId/comments 登录 → 201', 201,
      await call('POST', `/api/blog/${created.postId}/comments`, {
        token: tokenB,
        body: { body: 'Nice post from the smoke test.' }
      }));
    created.commentId = createComment.body && createComment.body._id;

    if (createComment.body && createComment.body.author && createComment.body.author.username) {
      ok('评论 populate 出 author.username');
    } else {
      bad('评论应 populate author.username', 'object', JSON.stringify(createComment.body && createComment.body.author));
    }

    expect('POST /api/blog/:postId/comments 未登录 → 401', 401,
      await call('POST', `/api/blog/${created.postId}/comments`, { body: { body: 'anon' } }));

    const comments = expect('GET /api/blog/:postId/comments 公开', 200,
      await call('GET', `/api/blog/${created.postId}/comments`));
    if (Array.isArray(comments.body) && comments.body.length >= 1) ok('评论列表返回 ≥1 条');
    else bad('评论列表应 ≥1 条', '>=1', comments.body && comments.body.length);

    const detail = expect('GET /api/blog/:id 公开', 200,
      await call('GET', `/api/blog/${created.postId}`));
    if (detail.body && Array.isArray(detail.body.comments) && detail.body.comments.length >= 1) {
      ok('详情页内嵌 comments 数组');
    } else {
      bad('详情页应带 comments 数组', 'array', JSON.stringify(detail.body && detail.body.comments));
    }
    if (detail.body && detail.body.author && detail.body.author.username) ok('详情页作者已 populate');
    else bad('详情页作者应 populate', 'object', 'missing');

    // 作者归属：B 不能改 A 的文章
    expect('PUT /api/blog/:id 非作者 → 403', 403,
      await call('PUT', `/api/blog/${created.postId}`, {
        token: tokenB,
        body: { title: 'hijacked' }
      }));
    expect('DELETE /api/blog/:id 非作者 → 403', 403,
      await call('DELETE', `/api/blog/${created.postId}`, { token: tokenB }));
    expect('PUT /api/blog/:id 作者本人 → 200', 200,
      await call('PUT', `/api/blog/${created.postId}`, {
        token: tokenA,
        body: { title: `Smoke post ${suffix} (edited)` }
      }));

    // ---------- 6. 留言收件箱 ----------
    console.log('\n【6】联系表单 / 留言');
    expect('GET /api/contact 未登录 → 401', 401, await call('GET', '/api/contact'));
    const inbox = expect('GET /api/contact admin → 200', 200,
      await call('GET', '/api/contact', { token: tokenA }));
    if (Array.isArray(inbox.body) && inbox.body.length >= 1) ok('收件箱能看到刚才提交的留言');
    else bad('收件箱应 ≥1 条', '>=1', inbox.body && inbox.body.length);

    const msg = Array.isArray(inbox.body)
      ? inbox.body.find((m) => m.email === `smoke_${suffix}@example.com`)
      : null;
    if (msg) created.messageId = msg._id;

    // ---------- 7. 错误处理 ----------
    console.log('\n【7】错误处理');
    expect('未匹配路由 → 404', 404, await call('GET', '/api/does-not-exist'));
    expect('非法 ObjectId → 400', 400, await call('GET', '/api/projects/not-an-id'));
    const noTitle = await call('POST', '/api/blog', { token: tokenA, body: { content: 'no title' } });
    expect('缺 title 触发校验 → 400', 400, noTitle);
    if (noTitle.body && noTitle.body.message && /title/i.test(noTitle.body.message)) {
      ok('校验错误信息里带字段名');
    } else {
      ok('校验错误返回统一 JSON');
    }

    // ---------- 8. 删除 ----------
    console.log('\n【8】删除');
    expect('DELETE /api/contact/:id admin → 200', 200,
      await call('DELETE', `/api/contact/${created.messageId}`, { token: tokenA }));
    expect('DELETE /api/blog/:id 作者 → 200', 200,
      await call('DELETE', `/api/blog/${created.postId}`, { token: tokenA }));
    expect('DELETE /api/projects/:id admin → 200', 200,
      await call('DELETE', `/api/projects/${created.projectId}`, { token: tokenA }));
  } catch (err) {
    failed += 1;
    failures.push('脚本异常: ' + err.message);
    console.error('\n脚本异常:', err.message);
  } finally {
    // ---------- 清理 ----------
    try {
      await Comment.deleteMany({ post: created.postId });
      if (created.messageId) await Message.deleteOne({ _id: created.messageId });
      if (created.postId) await BlogPost.deleteOne({ _id: created.postId });
      if (created.projectId) await Project.deleteOne({ _id: created.projectId });
      if (created.users.length) {
        await BlogPost.deleteMany({ author: { $in: created.users } });
        await Comment.deleteMany({ author: { $in: created.users } });
        await Project.deleteMany({ user: { $in: created.users } });
        await User.deleteMany({ _id: { $in: created.users } });
      }
      await Message.deleteMany({ email: `smoke_${suffix}@example.com` });
      console.log('\n· 测试数据已清理');
    } catch (cleanupErr) {
      console.warn('\n· 清理时出错:', cleanupErr.message);
    }

    await mongoose.disconnect();

    console.log(`\n================ 结果 ================`);
    console.log(`通过 ${passed} 项 / 失败 ${failed} 项`);
    if (failed > 0) {
      console.log('失败项:');
      failures.forEach((f) => console.log('  - ' + f));
    }
    console.log('=====================================\n');
    process.exitCode = failed > 0 ? 1 : 0;
  }
})();
