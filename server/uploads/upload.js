const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { marked } = require("marked");
const Post = require("../models/Post");

const router = express.Router();

console.log("[upload] Upload route module loaded");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// 文件夹导入：文件夹名=分类，文件名=标题
router.post("/", upload.array("files", 100), async (req, res) => {
  console.log("[upload] Received upload request, files:", req.files?.length);

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "请选择文件夹" });
    }

    // 从请求体获取分类名（前端已解码）
    const category = req.body.category || "未分类";
    // 获取前端传来的文件名列表（用 | 分隔）
    const filenames = (req.body.filenames || "").split("|");

    const results = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      // 使用前端传来的文件名（已解码）
      const decodedName = filenames[i] || file.originalname;
      console.log("[upload] Title:", decodedName);

      const ext = path.extname(decodedName).toLowerCase();
      if (ext !== ".md" && ext !== ".markdown") {
        fs.unlinkSync(file.path);
        continue;
      }

      const content = fs.readFileSync(file.path, "utf-8");
      // 文件名（不含扩展名）作为标题
      const title = path.basename(decodedName, ext);
      const htmlContent = marked(content);

      const post = new Post({
        title,
        content: htmlContent,
        category,
      });

      await post.save();
      fs.unlinkSync(file.path);
      results.push(post);
    }

    res.status(201).json({
      message: `成功导入 ${results.length} 篇文章，分类: ${category}`,
      posts: results,
    });
  } catch (err) {
    console.error("[upload] Error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
