# Lab-15：实现 protect 授权中间件

> 对应 `Lab-15.pdf`（Slide 13–19）：创建、应用并测试 JWT 授权中间件。

## 一、完成的内容

| Slide | 要求 | 实现位置 |
| --- | --- | --- |
| 14 | 安装 `jsonwebtoken`、在 `.env` 中定义 `JWT_SECRET` | `package.json`、`.env`（`NODE_ENV`、`JWT_EXPIRES_IN`） |
| 15 | 创建 `middleware/authMiddleware.js`，从 `Authorization: Bearer` 取 token | `middleware/authMiddleware.js` |
| 16 | `jwt.verify()` 验证 + 用 `decoded.id` 查用户 + 挂到 `req.user` + `next()` | `middleware/authMiddleware.js` |
| 17 | 在 `postRoutes.js` 中引入 `protect`，保护创建文章的 POST 路由 | `routes/postRoutes.js` |
| 18 | 无 token → 401；有效 token → 201 创建成功 | 已实测，见下方结果 |
| 19 Challenge 1 | token 1 秒过期测试 | `utils/generateToken.js` 支持 `JWT_EXPIRES_IN=1s` |
| 19 Challenge 2 | 保护 `PUT` / `DELETE /api/posts/:id` | `routes/postRoutes.js` |

## 二、关键改动

### 1. `middleware/authMiddleware.js`（新增）

```js
const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) { res.status(401); throw new Error('Not authorized, user not found'); }
    next();
  } catch (error) {
    console.error('JWT verify failed:', error.name, '-', error.message);
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});
```

`asyncHandler` 会把 async 中间件里 `throw` 的错误自动交给 `server.js` 的全局错误处理器，
由它统一返回 `{ success:false, status:401, message }`。

### 2. `routes/postRoutes.js`

```js
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(getPosts)                    // 公开
  .post(protect, createPost);       // 创建文章需要登录，作者取自 req.user

router.route('/:id')
  .get(getPostById)
  .put(protect, updatePost)         // Challenge 2
  .delete(protect, deletePost);     // Challenge 2
```

> 说明：Lab-15 测试阶段临时使用的 `testProtectedController` 和 `POST /api/posts/create` 已删除，
> `POST /api/posts` 恢复为“创建文章”接口，并且仍然受 `protect` 保护。

### 3. `controllers/postController.js`

`createPost` 直接用 `req.user._id` 作为 `author`，客户端无法伪造作者。

### 4. `utils/generateToken.js` 与 `.env`

```js
expiresIn: process.env.JWT_EXPIRES_IN || '30d'
```

测试过期 token 时，把 `.env` 的 `JWT_EXPIRES_IN` 改成 `1s` 再登录即可，无需改代码。

## 三、测试方法

### 方式 A：自动验收（推荐）

```powershell
npm start          # 终端 1：启动服务器
npm run test:auth  # 终端 2：运行 8 项检查
```

### 方式 B：Postman / Thunder Client

1. 注册：`POST /api/users/register`
   ```json
   { "username": "alice", "email": "alice@example.com", "password": "Password123" }
   ```
2. 登录拿 token：`POST /api/users/login`
   ```json
   { "email": "alice@example.com", "password": "Password123" }
   ```
3. 失败场景：`POST /api/posts`，不带 `Authorization` 头
   → `401 {"message":"Not authorized, no token"}`
4. 成功场景：`POST /api/posts`，Header 加 `Authorization: Bearer <token>`
   ```json
   { "title": "My first post", "content": "Hello world", "category": "Technology" }
   ```
   → `201`，返回新文章，`author` 自动是登录用户

## 四、实测结果（2026-10-23，连接 MongoDB Atlas）

| # | 测试 | 预期 | 实际 | 结果 |
| --- | --- | --- | --- | --- |
| 1 | 注册新用户 | 201 | 201 | ✅ |
| 2 | 登录获取 JWT | 200 + token | 200 + token | ✅ |
| 3 | 无 token `POST /api/posts` | 401 `Not authorized, no token` | 一致 | ✅ |
| 4 | 伪造 token | 401 `Not authorized, token failed` | 一致 | ✅ |
| 5 | 有效 token `POST /api/posts` | 201，author 为登录用户 | 一致 | ✅ |
| 6 | 无 token `PUT /api/posts/:id` | 401 | 401 | ✅ |
| 7 | 无 token `DELETE /api/posts/:id` | 401 | 401 | ✅ |
| 8 | 过期 token（1 秒后） | 401 `Not authorized, token failed` | 一致 | ✅ |

## 五、Challenge 1 答案

把 `JWT_EXPIRES_IN` 设为 `1s`，登录后立刻请求受保护路由：

- `jwt.verify()` 抛出 `TokenExpiredError`（`error.name === 'TokenExpiredError'`，`error.message === 'jwt expired'`）；
- 被 `catch` 捕获后返回 **401**，消息为 **`Not authorized, token failed`**；
- 服务器控制台会打印 `JWT verify failed: TokenExpiredError - jwt expired`。

对比：签名错误是 `JsonWebTokenError: invalid signature`，同样落到这个 catch。

## 六、注意事项

- `.env` 已在 `.gitignore` 中，`JWT_SECRET` 不会提交到版本库。
- token 的 payload 是 `{ id: userId }`，与 `protect` 中 `decoded.id` 对应。
- Lab-15 的 `protect` 只校验“是否登录”；“只能改/删自己的文章”的归属校验已作为扩展实现，见第七节。
- 测试阶段的 `testProtectedController` 与 `POST /api/posts/create` 已删除，`POST /api/posts` 恢复为创建文章接口（仍需登录）。
- admin 角色校验属于更后面的内容，目前 `User` 模型还没有 `role` 字段，暂未实现。

## 七、扩展：文章归属校验（Chapter 8 Part 2）

Slide 21 留下的问题：**已登录用户拿着自己的 token 仍能改/删别人的文章**。
现在在 controller 里补上“这篇文章是不是你的”判断。

### 1. 实现（`controllers/postController.js`）

```js
const ErrorHandler = require('../utils/ErrorHandler');

// post.author 是 ObjectId，必须用 .equals() 比较；用 === 比较两个对象永远为 false
const isPostOwner = (post, user) => post.author.equals(user._id);

exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new ErrorHandler('Post not found', 404));

    // 归属校验：已登录，但不是作者 -> 403
    if (!isPostOwner(post, req.user)) {
      return next(new ErrorHandler('Not authorized to update this post', 403));
    }

    // 忽略请求体里的 author / _id，防止把文章“过户”给别人
    const { author, _id, ...updates } = req.body || {};
    Object.assign(post, updates);
    await post.save();          // 触发 schema 校验

    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new ErrorHandler('Post not found', 404));

    if (!isPostOwner(post, req.user)) {
      return next(new ErrorHandler('Not authorized to delete this post', 403));
    }

    await post.deleteOne();
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    next(err);
  }
};
```

> 注意：`PUT`/`DELETE` 路由本身仍然先经过 `protect`，所以“未登录”返回 401，
> “已登录但不是作者”返回 403，两者含义不同。

### 2. 权限矩阵

| 接口 | 未登录 | 已登录（作者本人） | 已登录（其他人） |
| --- | --- | --- | --- |
| `GET /api/posts`、`GET /api/posts/:id` | 200 | 200 | 200 |
| `POST /api/posts` | 401 | 201 | 201（创建的是自己的文章） |
| `PUT /api/posts/:id` | 401 | 200 | **403** |
| `DELETE /api/posts/:id` | 401 | 200 | **403** |

### 3. 测试

```powershell
npm run test:owner   # 需先 npm run dev / npm start
```

实测（2026-10-23，Atlas）：**7/7 通过**

| 测试 | 结果 |
| --- | --- |
| Alice 创建文章 | 201 ✅ |
| Bob 修改 Alice 的文章 | 403 `Not authorized to update this post` ✅ |
| Bob 删除 Alice 的文章 | 403 `Not authorized to delete this post` ✅ |
| 文章仍存在且标题未被修改 | 200 ✅ |
| Alice 修改自己的文章（请求体伪造 author 无效） | 200 ✅ |
| Alice 删除自己的文章 | 200 ✅ |
| 删除后再查询 | 404 ✅ |
