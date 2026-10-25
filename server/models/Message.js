// 联系表单留言模型（期末文档 Phase 1 要求）
// POST /api/contact 收到前台表单后，就往这个集合写一条记录。
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
