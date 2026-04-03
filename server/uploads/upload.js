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

router.post("/", upload.single("file"), async (req, res) => {
  console.log("[upload] Received upload request", req.file);
  try {
    if (!req.file) {
      return res.status(400).json({ message: "请选择文件" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== ".md" && ext !== ".markdown") {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "只支持 MD 文件" });
    }

    const content = fs.readFileSync(req.file.path, "utf-8");

    // 这段代码用于从上传的 Markdown 文件中自动提取文章元数据
    const lines = content.split("\n");
    let title = "未命名";
    let category = "未分类";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("# ")) {
        title = trimmed.replace("# ", "").trim();
      } else if (trimmed.startsWith("分类为:")) {
        category = trimmed.replace("分类为:", "").trim();
      } else {
        break;
      }
    }

    const htmlContent = marked(content);

    const post = new Post({
      title,
      content: htmlContent,
      category,
    });

    await post.save();
    fs.unlinkSync(req.file.path);

    res.status(201).json({ message: "导入成功", post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
