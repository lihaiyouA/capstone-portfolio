const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      // 期末文档要求 minlength 6；用 validator 是为了给客户端更清楚的错误信息
      validate: {
        validator: function (value) {
          return value.length >= 6;
        },
        message: 'Password must be at least 6 characters long'
      },
      select: false
    },
    // user = 普通注册用户；admin = 管理员（唯一能管理作品集项目的人）
    // editor 是 Lab-16 留下的角色，保留以免旧数据失效
    role: {
      type: String,
      enum: ['user', 'editor', 'admin'],
      default: 'user'
    }
  },
  { timestamps: true }
);

// Normalize email addresses before duplicate checks and storage.
UserSchema.pre('save', function () {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
});

// Hash plaintext passwords only when they are changed.
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
