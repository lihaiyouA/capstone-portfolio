// 路由：/api/contact
const express = require('express');
const router = express.Router();
const {
  createMessage,
  getMessages,
  deleteMessage
} = require('../controllers/messageController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

// 提交留言：公开（作品集联系表单）
router.post('/', createMessage);

// 留言收件箱：仅管理员
router.get('/', protect, requireAdmin, getMessages);
router.delete('/:id', protect, requireAdmin, deleteMessage);

module.exports = router;
