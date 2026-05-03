const express = require("express");
const router = express.Router();
const axios = require("axios"); // 用 axios 调 AI API

// POST /api/qa  — 问问题
router.post("/", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ message: "请输入问题" });
  const Post = require("../models/Post");

  // 在调用 AI 之前，先搜相关笔记
  const posts = await Post.find({
    $or: [
      { title: { $regex: question, $options: "i" } },
      { content: { $regex: question, $options: "i" } },
    ],
  }).limit(5);

  // 把笔记内容拼进 prompt
  const context = posts
    .map((p) => `标题：${p.title}\n内容：${p.content}`)
    .join("\n---\n");

  try {
    // 调用 DeepSeek API
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: context
              ? `根据笔记内容简要回答问题,要求语句通畅以文本形式回答并说明在哪篇文章提到了如'在什么分类中的什么标题中有关你的疑问'注意不要有*和#以及其他md文档里面的符号,如果笔记中没有相关信息，请说笔记中没有,正在给你调用api解答。\n\n笔记内容：\n${context}`
              : "你是一个技术笔记助手，回答问题。",
          },
          { role: "user", content: question },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    res.json({ answer: response.data.choices[0].message.content });
  } catch (err) {
    console.error("QA API error:", err.message);
    res.status(500).json({ message: "问答服务出错" });
  }
});

module.exports = router;
