const express = require("express");
const router = express.Router();
const axios = require("axios");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

router.post("/", asyncHandler(async (req, res) => {
  const { question, apiKey, endpoint, model, providerType = "openai" } = req.body;
  if (!question) throw new AppError(400, "请输入问题");
  if (!apiKey) throw new AppError(400, "请先配置 API 密钥");

  const db = require("../models/database");

  const englishWords = question.match(/[a-zA-Z0-9_]+/g) || [];
  const chineseChars = question.match(/[\u4e00-\u9fff]+/g) || [];

  let searchTerms;
  if (englishWords.length > 0) {
    searchTerms = englishWords;
  } else if (chineseChars.length > 0) {
    const cleaned = chineseChars
      .map((c) => c.replace(/[？?的什么是哪怎么如何有没有为什么哪些哪个可以需要]|是什么意思/g, ""))
      .filter(Boolean);
    searchTerms = cleaned.length > 0 ? cleaned : chineseChars;
  } else {
    searchTerms = [question];
  }

  const searchConditions = searchTerms.map((kw) => ({
    $or: [
      { title: { $regex: new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } },
      { category: { $regex: new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } },
      { content: { $regex: new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } },
    ],
  }));

  let posts = await db.findAsync({ $or: searchConditions });
  posts = posts.slice(0, 10);

  if (posts.length === 0) {
    const allPosts = await db.findAsync({});
    const limited = allPosts.slice(0, 100);
    posts = limited
      .filter((p) => searchTerms.some((kw) => stripHtml(p.content).includes(kw)))
      .slice(0, 10);
  }

  const context = posts
    .map((p) => `分类：${p.category} > 标题：${p.title}\n内容：${stripHtml(p.content)}`)
    .join("\n---\n");

  const systemPrompt = context
    ? `你是一个技术笔记助手。下面是从用户笔记中搜索到的相关内容。

要求：
1. 仔细阅读下面的笔记内容，并基于这些内容回答问题
2. 回答时必须说明依据了哪篇笔记（分类和标题）
3. 笔记内容中提到了哪些信息，就如实回答哪些。即使信息很简单，也要回答
4. 只有在笔记内容中完全找不到这个词或相关内容时，才说"笔记中没有找到"
5. 用纯文本回答，不要使用 Markdown 符号
6.如果没有找到相关内容，可以回答"正在给你联网回答"+你的搜索结果，但不要回答"根据笔记内容，..."之类的话

笔记内容：
${context}`
    : "你是一个技术笔记助手，回答问题。";

  let answer;

  if (providerType === "anthropic") {
    const cliRes = await axios.post(
      endpoint,
      {
        model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: question }],
      },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      },
    );
    answer = cliRes.data.content?.[0]?.text || "";
  } else {
    const openaiRes = await axios.post(
      endpoint,
      {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );
    answer = openaiRes.data.choices?.[0]?.message?.content || "";
  }

  if (!answer) throw new AppError(502, "AI 返回为空，请检查密钥或模型名");

  res.json({ answer });
}));

router.get("/check", asyncHandler(async (req, res) => {
  const { word } = req.query;
  if (!word) return res.json({ found: false, message: "请提供 word 参数" });

  const db = require("../models/database");

  const regex = new RegExp(word, "i");
  const allPosts = await db.findAsync({});

  const titleMatch = allPosts.filter((p) => regex.test(p.title)).length;
  const contentMatch = allPosts.filter((p) => regex.test(p.content)).length;
  const categoryMatch = allPosts.filter((p) => regex.test(p.category)).length;

  res.json({
    word,
    found: titleMatch + contentMatch + categoryMatch > 0,
    details: { title: titleMatch, content: contentMatch, category: categoryMatch },
  });
}));

module.exports = router;
