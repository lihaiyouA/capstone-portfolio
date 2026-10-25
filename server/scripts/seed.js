// 一次性初始化：准备管理员账号 + 填充示例数据
//
// 用法：
//   npm run seed
//
// 账号来源（按优先级）：
//   1. 环境变量 SEED_ADMIN_EMAIL / SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD
//   2. 都没有？直接报错退出，不会悄悄建一个 admin@example.com 弱口令账号
//
// 说明：
//   - 只往“空集合”里写数据，重复执行不会产生重复记录。
//   - 账号已存在时只补角色，不会覆盖已有密码。
require('dotenv').config({ quiet: true });
const crypto = require('crypto');
const mongoose = require('mongoose');

const User = require('../models/User');
const Project = require('../models/Project');
const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');
const Message = require('../models/Message');

const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || '').toLowerCase().trim();
const ADMIN_USERNAME = (process.env.SEED_ADMIN_USERNAME || 'admin').trim();
// 没给密码就随机生成一个强密码，并只打印一次（不会硬编码弱口令）
const GENERATED_PASSWORD = !process.env.SEED_ADMIN_PASSWORD;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');

const SAMPLE_PROJECTS = [
  {
    title: 'Capstone Portfolio & Blog',
    description:
      'Full-stack personal portfolio with a blog, JWT authentication and an admin dashboard. React SPA on the front end, Express + MongoDB API on the back end.',
    // 与 Lab 时期的图片对应关系保持一致：portfolio→project1、todo→project2、第三个→project3
    imageUrl: '/image/project3.png',
    repoUrl: 'https://github.com/',
    liveUrl: '',
    tags: ['React', 'Express', 'MongoDB', 'JWT']
  },
  {
    title: 'Responsive Portfolio Website',
    description:
      'Personal responsive portfolio site built with HTML5 and CSS3, including dark mode and a mobile-first navigation bar.',
    imageUrl: '/image/project1.png',
    repoUrl: 'https://github.com/',
    liveUrl: '',
    tags: ['HTML5', 'CSS3', 'Responsive']
  },
  {
    title: 'Todo App (Vanilla JS)',
    description:
      'A small todo application implemented with vanilla JavaScript and the DOM API, persisting items in localStorage.',
    imageUrl: '/image/project2.png',
    repoUrl: 'https://github.com/',
    liveUrl: '',
    tags: ['JavaScript', 'DOM']
  }
];

const SAMPLE_POSTS = [
  {
    title: 'How I structured my capstone API',
    content:
      'This post walks through the MVC layout of the capstone back end: models hold the Mongoose schemas, controllers hold the business logic, and routes only map URLs to controllers.\n\nAuthentication lives in middleware, so every protected route reuses the same protect() function instead of repeating token parsing.',
    category: 'Technology',
    summary: 'MVC layout, JWT middleware and error handling in one place.'
  },
  {
    title: 'Lessons learned from building the portfolio',
    content:
      'The first version of the portfolio was a single page with anchor links. Turning it into a real SPA meant adding React Router, an auth context and a protected admin area.\n\nThe biggest lesson: keep the loading and error states explicit, because every network call can fail.',
    category: 'Education',
    summary: 'From a single page to a routed SPA: what changed and why.'
  }
];

(async () => {
  if (!ADMIN_EMAIL) {
    console.error('✗ 缺少 SEED_ADMIN_EMAIL');
    console.error('  请在 server/.env 里设置（示例）：');
    console.error('    SEED_ADMIN_EMAIL=you@example.com');
    console.error('    SEED_ADMIN_USERNAME=yourname');
    console.error('    SEED_ADMIN_PASSWORD=你的强密码        # 不填则随机生成并打印一次');
    console.error('  已有账号也可以只改角色：npm run make-admin -- you@example.com');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected: ${mongoose.connection.host}`);

    // 1) 管理员
    let admin = await User.findOne({ email: ADMIN_EMAIL });
    if (!admin) {
      admin = await User.create({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin'
      });
      console.log(`✓ 创建管理员 ${admin.email}`);
      if (GENERATED_PASSWORD) {
        console.log(`  ⚠ 本次密码为随机生成，请立即记录（只显示一次）：${ADMIN_PASSWORD}`);
      }
    } else if (admin.role !== 'admin') {
      admin.role = 'admin';
      await admin.save();
      console.log(`✓ 已把 ${admin.email} 提升为 admin（密码保持不变）`);
    } else {
      console.log(`· 管理员已存在：${admin.email}（密码保持不变）`);
    }

    // 2) 示例项目
    if ((await Project.countDocuments()) === 0) {
      await Project.insertMany(SAMPLE_PROJECTS.map((p) => ({ ...p, user: admin._id })));
      console.log(`✓ 写入 ${SAMPLE_PROJECTS.length} 个示例项目`);
    } else {
      console.log('· 项目集合非空，跳过');
    }

    // 3) 示例文章 + 评论
    if ((await BlogPost.countDocuments()) === 0) {
      const posts = await BlogPost.insertMany(
        SAMPLE_POSTS.map((p) => ({ ...p, author: admin._id }))
      );
      await Comment.create({
        body: 'Nice write-up — the MVC breakdown really helps.',
        author: admin._id,
        post: posts[0]._id
      });
      console.log(`✓ 写入 ${posts.length} 篇示例文章 + 1 条评论`);
    } else {
      console.log('· 文章集合非空，跳过');
    }

    console.log(`· 当前留言数：${await Message.countDocuments()}`);
    console.log('\n完成。下一步：npm run dev');
  } catch (err) {
    console.error('初始化失败:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
