//该文件负责定义URL路径
const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { protect, requireSelf } = require('../middleware/authMiddleware');

// 路由组：/api/users
// 注册 / 登录保持公开；其余用户管理接口必须登录后才能访问。
// PUT / DELETE 还要求 token 对应的就是 :id 本人，不能改/删别人的账号。
router.post('/register', registerUser);
router.post('/login', loginUser);

router.route('/')
  .get(protect, getUsers)
  .post(protect, createUser);

router.route('/:id')
  .get(protect, getUserById)
  .put(protect, requireSelf, updateUser)
  .delete(protect, requireSelf, deleteUser);

module.exports = router;
