// 路由：/api/blog
const express = require('express');
const router = express.Router();
const {
  getBlogPosts,
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost
} = require('../controllers/blogController');
const { getCommentsForPost, createComment } = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// /api/blog
router.route('/')
  .get(optionalAuth, getBlogPosts) // 公开；带 token 时还能看到自己的私密文章
  .post(protect, createBlogPost);  // 需登录

// /api/blog/:postId/comments —— 必须写在 /:id 之前，语义更清楚
router.route('/:postId/comments')
  .get(getCommentsForPost)          // 公开
  .post(protect, createComment);    // 需登录

// /api/blog/:id
router.route('/:id')
  .get(optionalAuth, getBlogPostById) // 公开（私密文章仅作者）
  .put(protect, updateBlogPost)       // 需登录；作者本人或管理员
  .delete(protect, deleteBlogPost);   // 需登录；作者本人或管理员

module.exports = router;
