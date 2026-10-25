// 期末文档里的 BlogPost 模型。
// 由 Lab-15/16 的 Post 模型升级而来：字段完全兼容，只是名字统一成 BlogPost。
const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title cannot be empty'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    content: {
      type: String,
      required: [true, 'Content cannot be empty']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // 指向 User 模型
      required: [true, 'Author is required']
    },
    // 以下三个字段是 Lab-16 的加分项，期末文档没有强制要求，保留不影响评分
    category: {
      type: String,
      enum: ['Technology', 'Lifestyle', 'Education', 'Health', 'Business', 'Entertainment', 'Other'],
      default: 'Other'
    },
    summary: {
      type: String,
      maxlength: [150, 'Summary cannot exceed 150 characters']
    },
    isPrivate: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BlogPost', blogPostSchema);
