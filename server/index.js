
require("dotenv").config();
const express = require("express");
const cors = require("cors");
require("./models/database");
const postRoutes = require("./routes/posts");
const uploadRoutes = require("./uploads/upload");

const app = express();
const PORT = 5000;

app.use(cors());

// 解析 JSON 请求体
app.use(express.json());

// 静态文件目录（用于上传的文件）
app.use("/uploads", express.static("uploads"));

// 使用路由
app.use("/api/posts", postRoutes);
app.use("/api/upload", uploadRoutes);
const qaRoutes = require("./routes/qa");
app.use("/api/qa", qaRoutes);

//  全局错误处理中间件（必须在所有路由之后注册）
const errorHandler = require("./utils/errorHandler");
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
