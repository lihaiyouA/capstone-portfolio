// 作品集项目模型（期末文档 Phase 1 要求）
// 与 BlogPost 的区别：这里的 user 字段是「项目归属人」，文档里明确叫 user 而不是 author。
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [120, 'Project title cannot exceed 120 characters']
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true
    },
    imageUrl: {
      type: String,
      trim: true,
      default: ''
    },
    repoUrl: {
      type: String,
      trim: true,
      default: ''
    },
    liveUrl: {
      type: String,
      trim: true,
      default: ''
    },
    // 给前端 ProjectCard 用的技术栈标签（文档未强制，前端已有展示位）
    tags: {
      type: [String],
      default: []
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
