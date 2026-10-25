const User = require('../models/User');//".."表示回到上一级文件夹 ps:"."则表示当前文件夹
const Post = require('../models/Post');
const ErrorHandler = require('../utils/ErrorHandler');
const generateToken = require('../utils/generateToken');

// 注册用户
exports.registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const newUser = await User.create({ username, email, password });

    res.status(201).json({
      success: true,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ErrorHandler('User with this email or username already exists', 400));
    }
    next(error);
  }
};

// 登录用户
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return next(new ErrorHandler('Invalid email or password', 401));
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !user.password || !(await user.matchPassword(password))) {
      return next(new ErrorHandler('Invalid email or password', 401));
    }

    res.status(200).json({
      success: true,
      _id: user._id,
      username: user.username,
      email: user.email,
      // 前端靠 role 决定是否显示“后台管理”入口；真正的权限校验仍在服务端
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

// 获取全部用户
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// 获取单个用户
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// 创建用户（需要登录；角色不能由客户端指定，防止提权）
exports.createUser = async (req, res, next) => {
  try {
    // 忽略请求体里的 role / _id，新用户一律是普通 user 角色
    const { role, _id, ...userData } = req.body || {};
    const newUser = await User.create({ ...userData, role: 'user' });
    const user = newUser.toObject();
    delete user.password;
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

// 更新用户（需要登录；禁止客户端修改 role / _id，防止提权）
exports.updateUser = async (req, res, next) => {
  try {
    const { role, _id, ...updates } = req.body || {};
    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {new:true, runValidators:true});
    if(!updatedUser) return res.status(404).json({message:"User not found"});
    res.status(200).json(updatedUser);
  } catch(err){
    next(err);
  }
};

// 删除用户
exports.deleteUser = async (req, res, next) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if(!deletedUser) return res.status(404).json({message:"User not found"});
    // 同时删除这个用户全部的文章
    await Post.deleteMany({ author: req.params.id });

    res.status(200).json({message:"User deleted"});
  } catch(err){
    next(err);
  }
};
