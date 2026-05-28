const express = require("express");
const router = express.Router();
const db = require("../models/database");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const getPost = asyncHandler(async (req, res, next) => {
  const post = await db.findOneAsync({ _id: req.params.id });
  if (!post) throw new AppError(404, "文章不存在");
  res.post = post;
  next();
});

router.get("/", asyncHandler(async (req, res) => {
  const posts = await db.findAsync({});
  res.json(posts);
}));

router.post("/", asyncHandler(async (req, res) => {
  const newPost = await db.insertAsync({
    title: req.body.title,
    content: req.body.content,
    cue: "",
    summary: "",
    difficulty: "",
    category: req.body.category || "未分类",
    author: "Rkgua",
    createdAt: new Date().toISOString(),
  });
  res.status(201).json(newPost);
}));

router.get("/categories", asyncHandler(async (req, res) => {
  const posts = await db.findAsync({});
  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean))];
  res.json(categories);
}));

router.get("/:id", getPost, (req, res) => {
  res.json(res.post);
});

router.delete("/:id", getPost, asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (password !== "123456") throw new AppError(401, "密码错误");
  await db.removeAsync({ _id: req.params.id }, {});
  res.json({ message: "Deleted Post" });
}));

router.post("/batch-delete", asyncHandler(async (req, res) => {
  const { ids, password } = req.body;
  if (password !== "123456") throw new AppError(401, "密码错误");
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new AppError(400, "请选择要删除的文章");
  }
  const numRemoved = await db.removeAsync({ _id: { $in: ids } }, { multi: true });
  res.json({ message: `成功删除 ${numRemoved} 篇文章` });
}));

router.post("/batch-move", asyncHandler(async (req, res) => {
  const { ids, category } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new AppError(400, "请选择要移动的文章");
  }
  if (!category || !category.trim()) {
    throw new AppError(400, "请指定目标分类");
  }
  const numAffected = await db.updateAsync(
    { _id: { $in: ids } },
    { $set: { category: category.trim() } },
    { multi: true },
  );
  res.json({
    message: `成功将 ${numAffected} 篇文章移动到「${category.trim()}」`,
    modifiedCount: numAffected,
  });
}));

router.patch("/:id", getPost, asyncHandler(async (req, res) => {
  const { cue, summary, difficulty } = req.body;
  const update = {};
  if (cue !== undefined) update.cue = cue;
  if (summary !== undefined) update.summary = summary;
  if (difficulty !== undefined) {
    if (["频繁", "常见", "偶尔", "罕见", ""].includes(difficulty)) {
      update.difficulty = difficulty;
    }
  }
  await db.updateAsync({ _id: req.params.id }, { $set: update }, {});
  const updatedPost = await db.findOneAsync({ _id: req.params.id });
  res.json(updatedPost);
}));

module.exports = router;
