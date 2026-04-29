const mongoose = require("mongoose");

// 定义博客文章 数据结构定义模板
const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  cue: {
    type: String,
    default: "",
  },
  summary: {
    type: String,
    default: "",
  },
  difficulty: {
    type: String,
    enum: ["频繁", "常见", "偶尔", "罕见", ""],
    default: "",
  },
  category: {
    type: String,
    required: true,
    default: "未分类",
  },
  author: {
    type: String,
    default: "Admin", // 默认作者
  },
  createdAt: {
    type: Date,
    default: Date.now, // 默认为当前时间
  },
});

// 创建模型并导出
const Post = mongoose.model("Post", postSchema);
//Post.find(conditions)                    
//Post.findById(id)                       
//Post.findOne(conditions)               
//Post.create(doc)                        
//Post.deleteOne(conditions)              
//Post.deleteMany(conditions)
//Post.updateOne(conditions, updates)      
//Post.updateMany(conditions, updates)     
//Post.countDocuments(conditions) 
module.exports = Post;
