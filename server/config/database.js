const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // 使用的是本地 MongoDB，默认端口是 27017
    const conn = await mongoose.connect("mongodb://localhost:27017/myblog");

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error);
    // 连接失败时退出进程
    process.exit(1);
  }
};

module.exports = connectDB;
