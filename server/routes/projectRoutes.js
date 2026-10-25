// 路由：/api/projects
const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

// 读：公开；写：登录 + 管理员
router.route('/')
  .get(getProjects)
  .post(protect, requireAdmin, createProject);

router.route('/:id')
  .get(getProjectById)
  .put(protect, requireAdmin, updateProject)
  .delete(protect, requireAdmin, deleteProject);

module.exports = router;
