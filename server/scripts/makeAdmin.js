// 把某个账号设为管理员，可选同时重设密码
//
// 用法：
//   npm run make-admin -- you@example.com                      # 只提升角色
//   npm run make-admin -- you@example.com MyPassword123        # 顺便重设密码
//
// 说明：改密码必须走 document.save()，这样才会触发 User schema 里的
// bcrypt pre-save 钩子；用 findOneAndUpdate 直接改字段会把明文写进库。
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  const email = (process.argv[2] || '').trim().toLowerCase();
  const password = (process.argv[3] || '').trim();

  if (!email) {
    console.error('用法: npm run make-admin -- you@example.com [新密码]');
    console.error('提示: 账号需先在网站上注册，或用 npm run seed 创建。');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.error(`✗ 找不到用户 ${email}`);
      console.error('  请先访问 /register 注册该邮箱，再执行本命令。');
      process.exitCode = 1;
      return;
    }

    const before = user.role;
    user.role = 'admin';
    if (password) user.password = password; // 明文赋值，save 时自动哈希

    await user.save();

    const check = await User.findOne({ email }).select('+password');
    const hashed = /^\$2[aby]\$/.test(check.password || '');

    console.log(`✅ ${check.email}（${check.username}）`);
    console.log(`   角色: ${before} → ${check.role}`);
    if (password) {
      console.log(`   密码: 已重设为 ${password.length} 个字符，库中为 bcrypt 哈希${hashed ? '（校验通过）' : '（异常！）'}`);
    }
    console.log('   现在可以用这个账号登录后台管理作品集与文章了。');
  } catch (err) {
    console.error('执行失败:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
