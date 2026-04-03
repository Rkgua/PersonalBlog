const express = require("express");
const router = express.Router();
const Post = require("../models/Post"); // 引入刚才创建的模型

// 1. 获取所有文章 (GET /api/posts)
router.get("/", async (req, res) => {
  try {
    // find() 不加参数表示查询所有数据
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. 创建新文章 (POST /api/posts)
router.post("/", async (req, res) => {
  const post = new Post({
    title: req.body.title,
    content: req.body.content,
    category: req.body.category || "未分类",
  });

  try {
    // .save() 会将数据保存到数据库
    const newPost = await post.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 3. 根据 ID 获取单篇文章 (GET /api/posts/:id)
router.get("/:id", getPost, (req, res) => {
  res.json(res.post);
});

// 4. 删除文章 (DELETE /api/posts/:id)  定义自己的密码
router.delete("/:id", getPost, async (req, res) => {
  const { password } = req.body;
  const correctPassword = "123456";

  if (password !== correctPassword) {
    return res.status(401).json({ message: "密码错误" });
  }

  try {
    await Post.deleteOne({ _id: req.params.id });
    res.json({ message: "Deleted Post" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 中间件：用于根据 ID 查找文章，避免重复代码
async function getPost(req, res, next) {
  let post;
  try {
    post = await Post.findById(req.params.id);
    if (post == null) {
      return res.status(404).json({ message: "Cannot find post" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.post = post;
  next();
}

module.exports = router;
