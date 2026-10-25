# Lab-16(2)：Enforcing Post Ownership —— 完成与 Challenge

> 对应 `Lab-16(2).pdf`（Slide 13–19）。
> 基础任务（保护路由 + 归属校验）已在之前完成；本文件记录 Slide 19 两个 Challenge 的实现。

## 一、任务总览

| Lab-16 要求 | 状态 | 位置 |
| --- | --- | --- |
| Step 1：`PUT` / `DELETE` 应用 `protect` | ✅ | `routes/postRoutes.js` |
| Step 2：`updatePost` 先 `findById` | ✅ | `controllers/postController.js` |
| Step 3：`updatePost` 归属校验，失败 403 | ✅ | `controllers/postController.js` |
| Step 4：`deletePost` 同样校验 + `deleteOne()` | ✅ | `controllers/postController.js` |
| Step 5：两个用户测试 403 / 200 | ✅ | `tests/lab-ownership-test.js`（7/7） |
| Challenge 1：`isPrivate` + 私密文章仅作者可读 | ✅ 本次实现 | 见下 |
| Challenge 2：`editor` 角色可改任意文章 | ✅ 本次实现 | 见下 |

## 二、Challenge 1：Read-Access Protection

### 1. `models/Post.js`

```js
isPrivate: {
  type: Boolean,
  default: false
}
```

### 2. `middleware/authMiddleware.js`：新增 `optionalAuth`

`GET /api/posts/:id` 要同时支持“匿名看公开文章”和“作者看私密文章”，
所以不能直接用 `protect`（它没 token 就 401），而是加一个“有 token 就解析、没有也放行”的中间件：

```js
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next();          // 匿名：交给 controller 判断

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch (error) {
    req.user = null;                  // token 无效也按匿名处理
  }
  next();
});
```

### 3. `controllers/postController.js`：`getPostById`

```js
if (post.isPrivate) {
  const authorId = post.author && post.author._id ? post.author._id : post.author;
  if (!req.user || String(authorId) !== String(req.user._id)) {
    return next(new ErrorHandler('Not authorized to view this post', 403));
  }
}
```

### 4. `routes/postRoutes.js`

```js
router.route('/:id')
  .get(optionalAuth, getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);
```

## 三、Challenge 2：Role Override（RBAC）

### 1. `models/User.js`

```js
role: {
  type: String,
  enum: ['user', 'editor'],
  default: 'user'
}
```

### 2. `controllers/postController.js`：`updatePost`

```js
// editor 可以改任意文章；普通用户只能是作者本人
const canUpdate = isPostOwner(post, req.user) || req.user.role === 'editor';
if (!canUpdate) {
  return next(new ErrorHandler('Not authorized to update this post', 403));
}
```

> 删除操作**没有**给 editor 放行，仍然是“只有作者本人可删”，符合 Challenge 2 只要求 update 的描述。

## 四、权限矩阵（更新后）

| 接口 | 未登录 | 作者本人 | 其他用户 | editor |
| --- | --- | --- | --- | --- |
| `GET /api/posts` | 200 | 200 | 200 | 200 |
| `GET /api/posts/:id`（公开） | 200 | 200 | 200 | 200 |
| `GET /api/posts/:id`（私密） | **403** | 200 | **403** | **403**（只有作者能读） |
| `POST /api/posts` | 401 | 201 | 201 | 201 |
| `PUT /api/posts/:id` | 401 | 200 | **403** | **200** |
| `DELETE /api/posts/:id` | 401 | 200 | **403** | **403** |

## 五、测试

```powershell
npm run test:challenge    # 10 项
npm run test:owner        # 7 项（回归）
npm run test:auth         # 8 项（回归）
```

实测（2026-10-23，Atlas）：

```
PASS | 匿名读公开文章 -> 200
PASS | 匿名读私密文章 -> 403
PASS | Bob 读他人私密文章 -> 403
PASS | 作者读自己私密文章 -> 200
PASS | 普通用户改他人文章 -> 403
PASS | editor 改他人公开文章 -> 200
PASS | editor 改他人私密文章 -> 200
PASS | editor 删他人文章 -> 403
SUMMARY: 10/10 passed
```

回归：ownership 7/7、auth 8/8。

## 六、如何把某个用户设为 editor

注册接口不允许客户端指定角色，测试脚本是直接改数据库：

```js
await mongoose.connect(process.env.MONGO_URI);
await mongoose.connection.getClient().db().collection('users')
  .updateOne({ email: 'editor@example.com' }, { $set: { role: 'editor' } });
```

实际项目里可以写一个 seed 脚本或由管理员接口来设置。

## 七、安全加固（已修复）

### 1. 用户管理接口加 `protect`

`routes/userRoutes.js`：注册 / 登录保持公开，其余用户管理接口都需要登录：

```js
router.post('/register', registerUser);
router.post('/login', loginUser);

router.route('/')
  .get(protect, getUsers)
  .post(protect, createUser);

router.route('/:id')
  .get(protect, getUserById)
  .put(protect, requireSelf, updateUser)
  .delete(protect, requireSelf, deleteUser);
```

### 2. 禁止客户端修改 `role`

`controllers/userController.js` 里 `createUser` / `updateUser` 都先剔除 `role`（和 `_id`）：

```js
// createUser：新用户一律 user 角色
const { role, _id, ...userData } = req.body || {};
const newUser = await User.create({ ...userData, role: 'user' });

// updateUser：忽略请求体里的 role / _id
const { role, _id, ...updates } = req.body || {};
```

这样即使登录后提交 `{ "role": "editor" }`，角色也不会变。`editor` 只能由数据库或 seed 脚本设置。

### 3. 文章列表过滤私密文章

`controllers/postController.js` 的 `getPosts`：

```js
const filter = req.user
  ? { $or: [{ isPrivate: { $ne: true } }, { author: req.user._id }] }
  : { isPrivate: { $ne: true } };
```

- 匿名 / 其他用户：只看到公开文章
- 作者本人：还能看到自己的私密文章
- 用 `$ne: true` 是为了兼容 `isPrivate` 字段加入之前创建的旧文章（字段缺失也算公开）

`routes/postRoutes.js`：`GET /api/posts` 加上 `optionalAuth`。

### 4. 改 / 删用户只能操作自己（`requireSelf`）

`middleware/authMiddleware.js`：

```js
const requireSelf = (req, res, next) => {
  if (!req.user || String(req.user._id) !== String(req.params.id)) {
    res.status(403);
    return next(new Error('Not authorized to modify this user'));
  }
  next();
};
```

配合 `protect` 使用后：未登录 → 401；已登录但不是 `:id` 本人 → 403。
`DELETE` 自己会把账号和自己的文章一起删除（沿用原来的 `deleteUser` 逻辑）。

### 5. 测试

```powershell
npm run test:security
```

实测 **20/20 通过**：匿名访问 `/api/users` 的 5 种请求全部 401；Alice 改/删 Bob 的账号 403；
登录后提交 `role: editor` 仍是 `user`；匿名列表不含私密文章；Bob 看不到 Alice 的私密文章；
Alice 能在列表看到自己的私密文章。

回归：`test:owner` 7/7、`test:challenge` 10/10、`test:auth` 8/8。

## 八、仍可继续加固的点

1. `deleteUser` 删除账号时会连带删除该用户的文章；如果业务上需要保留文章，应改成软删除或先转移 `author`。
2. `updateUser` 走的是 `findByIdAndUpdate`，如果请求体带 `password`，会绕过 bcrypt 的 pre-save 钩子
   存成明文；建议改成 `user.password = ...; await user.save()`，或禁止走这个接口改密码。
