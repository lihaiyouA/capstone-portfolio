// 博客接口（期末文档 /api/blog）
// 由 Lab-15/16 的 postController 升级：逻辑不变，补上 populate 作者与评论。
const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');
const ErrorHandler = require('../utils/ErrorHandler');

// 资源归属校验：protect 只保证“已登录”，这里判断“这篇文章是不是你的”。
// author 是 ObjectId，必须用 .equals()；用 === 比较两个对象永远是 false。
const isPostOwner = (post, user) => post.author.equals(user._id);

// 作者本人或管理员可以改/删
const canManagePost = (post, user) => isPostOwner(post, user) || user.role === 'admin';

// GET /api/blog —— 公开
// 列表只显示公开文章；登录用户额外能看到自己的私密文章（Lab-16 加分项）。
exports.getBlogPosts = async (req, res, next) => {
  try {
    const filter = req.user
      ? { $or: [{ isPrivate: { $ne: true } }, { author: req.user._id }] }
      : { isPrivate: { $ne: true } };

    // 只取 username，避免把作者的 email 泄露给前台
    const posts = await BlogPost.find(filter)
      .populate('author', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
};

// GET /api/blog/:id —— 公开，返回文章 + 作者 username + 该文章下全部评论
exports.getBlogPostById = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('author', 'username');
    if (!post) {
      return next(new ErrorHandler('Post not found', 404));
    }

    // 私密文章只有作者本人能读
    if (post.isPrivate) {
      const authorId = post.author && post.author._id ? post.author._id : post.author;
      if (!req.user || String(authorId) !== String(req.user._id)) {
        return next(new ErrorHandler('Not authorized to view this post', 403));
      }
    }

    const comments = await Comment.find({ post: post._id })
      .populate('author', 'username')
      .sort({ createdAt: 1 });

    res.status(200).json({ ...post.toObject(), comments });
  } catch (err) {
    next(err);
  }
};

// POST /api/blog —— 需登录
exports.createBlogPost = async (req, res, next) => {
  try {
    // 作者只认登录用户，忽略请求体里的 author，客户端无法伪造
    const postData = { ...req.body, author: req.user._id };
    const newPost = await BlogPost.create(postData);
    res.status(201).json(newPost);
  } catch (err) {
    next(err);
  }
};

// PUT /api/blog/:id —— 需登录，且仅作者（或管理员）
exports.updateBlogPost = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return next(new ErrorHandler('Post not found', 404));
    }

    if (!canManagePost(post, req.user)) {
      return next(new ErrorHandler('Not authorized to update this post', 403));
    }

    // 忽略 author / _id，防止把文章“过户”给别人
    const { author, _id, ...updates } = req.body || {};
    Object.assign(post, updates);
    await post.save(); // 触发 schema 校验

    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/blog/:id —— 需登录，且仅作者（或管理员）
exports.deleteBlogPost = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return next(new ErrorHandler('Post not found', 404));
    }

    if (!canManagePost(post, req.user)) {
      return next(new ErrorHandler('Not authorized to delete this post', 403));
    }

    // 顺手清掉这篇文章的评论，避免留下孤儿数据
    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    next(err);
  }
};
