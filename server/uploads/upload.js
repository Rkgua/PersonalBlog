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
  // ★★★ 关键修复：使用纯 ASCII 安全文件名，避免 multipart 中文编码乱码 ★★★
  // 浏览器发送 Content-Disposition filename 时中文会被 multer 用 Latin-1 解码
  // 从而导致 file.originalname 变为乱码（如 "笔记.md" → "ç¬è®°.md"）
  // 故 temp 文件名和标题都不得依赖 file.originalname，改用前端 JSON 传递
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.fieldname);
  },
});

const upload = multer({ storage });

/**
 * 从前端 JSON 中安全提取文件名
 * multipart 的 file.originalname 在非 ASCII 时必乱码，永不使用
 */
function safeFilename(filenames, index) {
  const raw = filenames[index];
  if (!raw || typeof raw !== "string") return "untitled-" + (index + 1) + ".md";
  // 取 basename 防止路径穿越
  const base = path.basename(raw);
  // 确保有 .md 扩展名，没有则补上
  const ext = path.extname(base).toLowerCase();
  if (ext === ".md" || ext === ".markdown") return base;
  return base + ".md";
}

// 文件夹导入：文件夹名=分类，文件名=标题
router.post("/", upload.array("files", 100), async (req, res) => {
  console.log("[upload] Received upload request, files:", req.files?.length);

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "请选择文件夹" });
    }

    const category = req.body.category || "未分类";
    // JSON 数组传递文件名（前端已做好过滤，纯 UTF-8 JSON 无编码问题）
    let filenames = [];
    try {
      filenames = JSON.parse(req.body.filenames || "[]");
    } catch (e) {
      filenames = [];
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < req.files.length; i++) {
      // 每个文件独立 try-catch，防止一个文件失败拖垮整个导入
      try {
        const file = req.files[i];
        // ★★★ 只用 JSON 传过来的文件名，永不使用 file.originalname ★★★
        const decodedName = safeFilename(filenames, i);

        // 不再检查 ext（前端已过滤），但保留做安全防护
        const ext = path.extname(decodedName).toLowerCase();
        if (ext !== ".md" && ext !== ".markdown") {
          try { fs.unlinkSync(file.path); } catch (_) {}
          continue;
        }

        // 检查文件大小，跳过空文件
        if (file.size === 0) {
          console.log("[upload] Skipping empty file (size=0):", decodedName);
          try { fs.unlinkSync(file.path); } catch (_) {}
          continue;
        }

        const content = fs.readFileSync(file.path, "utf-8");
        if (!content || !content.trim()) {
          console.log("[upload] Skipping empty content:", decodedName);
          try { fs.unlinkSync(file.path); } catch (_) {}
          continue;
        }

        const title = path.basename(decodedName, ext);
        const htmlContent = marked(content);

        if (!htmlContent) {
          console.log("[upload] Skipping unparseable content:", decodedName);
          try { fs.unlinkSync(file.path); } catch (_) {}
          continue;
        }

        const post = new Post({ title, content: htmlContent, category });
        await post.save();
        try { fs.unlinkSync(file.path); } catch (_) {}

        results.push(post);
        console.log("[upload] Saved:", title);
      } catch (fileErr) {
        console.error("[upload] File processing error for index", i, ":", fileErr.message);
        errors.push({ index: i, error: fileErr.message });
        try { if (req.files[i]?.path) fs.unlinkSync(req.files[i].path); } catch (_) {}
      }
    }

    // 最终清理：删除所有残留 temp 文件
    for (const file of req.files) {
      try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (_) {}
    }

    // 统计诊断信息
    const expected = parseInt(req.body.expectedCount) || req.files.length;
    const skipped = req.files.length - results.length;

    if (results.length === 0 && errors.length > 0) {
      return res.status(500).json({
        message: `全部导入失败，${errors.length} 个文件出错`,
        errors,
      });
    }

    // 如果导入数小于预期，在消息中提示
    let detailMsg = `成功导入 ${results.length} 篇文章，分类: ${category}`;
    if (skipped > 0) {
      detailMsg += `（跳过 ${skipped} 个文件）`;
    }
    if (req.files.length < expected) {
      detailMsg += `【警告：预期 ${expected} 个文件，服务端仅收到 ${req.files.length} 个，部分文件可能未成功上传】`;
    }

    res.status(201).json({
      message: detailMsg,
      posts: results,
      errors: errors.length > 0 ? errors : undefined,
      _diagnostics: {
        expected,
        received: req.files.length,
        imported: results.length,
        skipped,
      },
    });
  } catch (err) {
    console.error("[upload] Fatal error:", err);
    if (req.files) {
      for (const file of req.files) {
        try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (_) {}
      }
    }
    res.status(500).json({ message: err.message });
  }
});

// 单文件上传：支持手动选择分类
// 注意：单文件上传使用 req.file.originalname，同样会因 multipart 编码问题乱码
// 但这里的文件名由用户手动选择输入，不做严格校验，仅作安全过滤
router.post("/single", upload.single("file"), async (req, res) => {
  console.log("[upload] Received single file upload");

  try {
    if (!req.file) {
      return res.status(400).json({ message: "请选择文件" });
    }

    const category = req.body.category || "未分类";

    if (req.file.size === 0) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({ message: "文件内容为空" });
    }

    const content = fs.readFileSync(req.file.path, "utf-8");
    if (!content || !content.trim()) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({ message: "文件内容为空" });
    }

    // 单文件上传的标题从 req.body.title 获取（前端可手动输入），
    // 若没有则从 originalname 提取（可能乱码，但 fallback 行为）
    let title = (req.body.title || "").trim();
    if (!title) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext !== ".md" && ext !== ".markdown") {
        try { fs.unlinkSync(req.file.path); } catch (_) {}
        return res.status(400).json({ message: "仅支持 .md 文件" });
      }
      title = path.basename(req.file.originalname, ext);
    }
    const htmlContent = marked(content);

    if (!htmlContent) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(400).json({ message: "无法解析文件内容" });
    }

    const post = new Post({ title, content: htmlContent, category });
    await post.save();
    try { fs.unlinkSync(req.file.path); } catch (_) {}

    res.status(201).json({
      message: `成功导入文章「${title}」，分类: ${category}`,
      post,
    });
  } catch (err) {
    console.error("[upload] Single upload error:", err);
    if (req.file?.path) {
      try { if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (_) {}
    }
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
