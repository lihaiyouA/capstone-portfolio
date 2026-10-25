// 博客评论接口（期末文档 Blog: Comment Endpoints）
// 路由挂在 /api/blog/:postId/comments 下，所以 postId 来自父级路径。
const Comment = require('../models/Comment');
const BlogPost = require('../models/BlogPost');
const ErrorHandler = require('../utils/ErrorHandler');

// GET /api/blog/:postId/comments —— 公开
exports.getCommentsForPost = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.postId);
    if (!post) {
      return next(new ErrorHandler('Post not found', 404));
    }

    const comments = await Comment.find({ post: post._id })
      .populate('author', 'username')
      .sort({ createdAt: 1 });

    res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
};

// POST /api/blog/:postId/comments —— 需登录
exports.createComment = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.postId);
    if (!post) {
      return next(new ErrorHandler('Post not found', 404));
    }

    // 只接受 body 字段；作者与所属文章都由服务端决定，客户端无法伪造
    const comment = await Comment.create({
      body: req.body?.body,
      author: req.user._id,
      post: post._id
    });

    const populated = await comment.populate('author', 'username');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};
