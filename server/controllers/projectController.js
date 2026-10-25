// 作品集项目接口（期末文档 /api/projects）
// 读接口公开，写接口由路由层的 protect + requireAdmin 保护（仅管理员）。
const Project = require('../models/Project');
const ErrorHandler = require('../utils/ErrorHandler');

// 允许客户端修改的字段，防止把 user 字段改给别人
const EDITABLE_FIELDS = ['title', 'description', 'imageUrl', 'repoUrl', 'liveUrl', 'tags'];

const pickEditable = (body = {}) => {
  const data = {};
  EDITABLE_FIELDS.forEach((key) => {
    if (body[key] !== undefined) data[key] = body[key];
  });
  return data;
};

// GET /api/projects —— 公开
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find()
      .populate('user', 'username')
      .sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id —— 公开
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('user', 'username');
    if (!project) {
      return next(new ErrorHandler('Project not found', 404));
    }
    res.status(200).json(project);
  } catch (err) {
    next(err);
  }
};

// POST /api/projects —— 需登录 + 管理员
exports.createProject = async (req, res, next) => {
  try {
    const project = await Project.create({
      ...pickEditable(req.body),
      user: req.user._id // 归属人只认登录用户
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:id —— 需登录 + 管理员
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return next(new ErrorHandler('Project not found', 404));
    }

    Object.assign(project, pickEditable(req.body));
    await project.save(); // 触发 schema 校验

    res.status(200).json(project);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id —— 需登录 + 管理员
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return next(new ErrorHandler('Project not found', 404));
    }

    await project.deleteOne();
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};
