// 联系表单接口（期末文档 Portfolio: Contact Endpoint）
// 提交公开，读取仅管理员（后台的留言收件箱）。
const Message = require('../models/Message');
const ErrorHandler = require('../utils/ErrorHandler');

// POST /api/contact —— 公开，把前台表单真正写进数据库
exports.createMessage = async (req, res, next) => {
  try {
    const { name, email, message } = req.body || {};
    const saved = await Message.create({ name, email, message });

    res.status(201).json({
      success: true,
      message: 'Message received, thank you!',
      data: {
        _id: saved._id,
        name: saved.name,
        email: saved.email,
        message: saved.message,
        createdAt: saved.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/contact —— 需登录 + 管理员
exports.getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/contact/:id —— 需登录 + 管理员
exports.deleteMessage = async (req, res, next) => {
  try {
    const deleted = await Message.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return next(new ErrorHandler('Message not found', 404));
    }
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (err) {
    next(err);
  }
};
