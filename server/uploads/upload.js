const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const db = require("../models/database");
const MarkdownIt = require("markdown-it");
const md = new MarkdownIt();

function mdToHtml(content) {
  return md.render(content || "");
}

const router = express.Router();
console.log("[upload] Upload route module loaded");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || "uploads";
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.fieldname);
  },
});

const upload = multer({ storage });

function safeFilename(filenames, index) {
  const raw = filenames[index];
  if (!raw || typeof raw !== "string") return "untitled-" + (index + 1) + ".md";
  const base = path.basename(raw);
  const ext = path.extname(base).toLowerCase();
  if (ext === ".md" || ext === ".markdown") return base;
  return base + ".md";
}

router.post(
  "/",
  upload.array("files", 100),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new AppError(400, "请选择文件夹");
    }

    const category = req.body.category || "未分类";

    let filenames = [];
    try {
      filenames = JSON.parse(req.body.filenames || "[]");
    } catch (_) {}
    let contents = [];
    try {
      contents = JSON.parse(req.body.contents || "[]");
    } catch (_) {}

    const results = [];
    const errors = [];

    for (let i = 0; i < req.files.length; i++) {
      try {
        const file = req.files[i];
        const decodedName = safeFilename(filenames, i);

        const ext = path.extname(decodedName).toLowerCase();
        if (ext !== ".md" && ext !== ".markdown") {
          try { fs.unlinkSync(file.path); } catch (_) {}
          console.log(`[upload] SKIP[${i}] ${decodedName}: not md`);
          continue;
        }

        let content = "";
        if (contents[i] && contents[i].trim()) {
          content = contents[i];
        } else {
          try { content = fs.readFileSync(file.path, "utf-8") || ""; } catch (_) {}
        }

        if (!content || !content.trim()) {
          console.log(`[upload] SKIP[${i}] ${decodedName}: empty content`);
          try { fs.unlinkSync(file.path); } catch (_) {}
          continue;
        }

        const title = path.basename(decodedName, ext);
        const htmlContent = mdToHtml(content);
        if (!htmlContent) {
          console.log(`[upload] SKIP[${i}] ${decodedName}: marked failed`);
          try { fs.unlinkSync(file.path); } catch (_) {}
          continue;
        }

        const post = await db.insertAsync({
          title,
          content: htmlContent,
          cue: "",
          summary: "",
          difficulty: "",
          category,
          author: "Rkgua",
          createdAt: new Date().toISOString(),
        });
        try { fs.unlinkSync(file.path); } catch (_) {}
        results.push(post);
        console.log("[upload] Saved:", title);
      } catch (fileErr) {
        console.error("[upload] File error at index", i, ":", fileErr.message);
        errors.push({ index: i, error: fileErr.message });
        try { if (req.files[i]?.path) fs.unlinkSync(req.files[i].path); } catch (_) {}
      }
    }

    for (const file of req.files) {
      try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (_) {}
    }

    const expected = parseInt(req.body.expectedCount) || req.files.length;
    const skipped = req.files.length - results.length;

    if (results.length === 0 && errors.length > 0) {
      throw new AppError(500, `全部导入失败，${errors.length} 个文件出错`);
    }

    let detailMsg = `成功导入 ${results.length} 篇文章，分类: ${category}`;
    if (skipped > 0) detailMsg += `（跳过 ${skipped} 个文件）`;
    if (req.files.length < expected) {
      detailMsg += `【警告：预期 ${expected} 个文件，服务端仅收到 ${req.files.length} 个】`;
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
  }),
);

router.post(
  "/single",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError(400, "请选择文件");

    const category = req.body.category || "未分类";

    if (req.file.size === 0) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      throw new AppError(400, "文件内容为空");
    }
    const content = fs.readFileSync(req.file.path, "utf-8");
    if (!content || !content.trim()) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      throw new AppError(400, "文件内容为空");
    }

    let title = (req.body.title || "").trim();
    if (!title) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext !== ".md" && ext !== ".markdown") {
        try { fs.unlinkSync(req.file.path); } catch (_) {}
        throw new AppError(400, "仅支持 .md 文件");
      }
      title = path.basename(req.file.originalname, ext);
    }

    const htmlContent = mdToHtml(content);
    if (!htmlContent) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      throw new AppError(400, "无法解析文件内容");
    }

    const post = await db.insertAsync({
      title,
      content: htmlContent,
      cue: "",
      summary: "",
      difficulty: "",
      category,
      author: "Rkgua",
      createdAt: new Date().toISOString(),
    });

    try { fs.unlinkSync(req.file.path); } catch (_) {}

    res.status(201).json({
      message: `成功导入文章「${title}」，分类: ${category}`,
      post,
    });
  }),
);

module.exports = router;
