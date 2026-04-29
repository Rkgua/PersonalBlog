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

// 3. 获取所有分类 (GET /api/posts/categories)
// 注意：categories 必须在 /:id 之前，否则会被匹配为 id 参数
router.get("/categories", async (req, res) => {
  try {
    const categories = await Post.distinct("category");
    res.json(categories.filter(Boolean));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. 根据 ID 获取单篇文章 (GET /api/posts/:id)
router.get("/:id", getPost, (req, res) => {
  res.json(res.post);
});

// 5. 删除文章 (DELETE /api/posts/:id)  定义自己的密码
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

// 6. 批量删除文章 (POST /api/posts/batch-delete)
// 使用 POST 而不是 DELETE 来传递 body（避免 DELETE body 兼容性问题）
router.post("/batch-delete", async (req, res) => {
  const { ids, password } = req.body;
  const correctPassword = "123456";

  if (password !== correctPassword) {
    return res.status(401).json({ message: "密码错误" });
  }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "请选择要删除的文章" });
  }

  try {
    const result = await Post.deleteMany({ _id: { $in: ids } });
    res.json({ message: `成功删除 ${result.deletedCount} 篇文章` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. 批量移动文章到指定分类 (POST /api/posts/batch-move)
router.post("/batch-move", async (req, res) => {
  const { ids, category } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "请选择要移动的文章" });
  }
  if (!category || !category.trim()) {
    return res.status(400).json({ message: "请指定目标分类" });
  }

  try {
    const result = await Post.updateMany(
      { _id: { $in: ids } },
      { $set: { category: category.trim() } },
    );
    res.json({
      message: `成功将 ${result.modifiedCount} 篇文章移动到「${category.trim()}」`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 8. 更新文章 cue/summary/difficulty (PATCH /api/posts/:id)
router.patch("/:id", getPost, async (req, res) => {
  const { cue, summary, difficulty } = req.body;
  try {
    if (cue !== undefined) res.post.cue = cue;
    if (summary !== undefined) res.post.summary = summary;
    if (difficulty !== undefined) {
      if (["频繁", "常见", "偶尔", "罕见", ""].includes(difficulty)) {
        res.post.difficulty = difficulty;
      }
    }
    const updatedPost = await res.post.save();
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
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
