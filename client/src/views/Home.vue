<template>
  <!--
    v-model="selectedCategory": 双向绑定分类选择
    @title-search: 监听NavBar组件发出的标题搜索事件
  -->
  <NavBar v-model="selectedCategory" @title-search="handleTitleSearch">
    <template #action>
      <button class="upload-btn" @click="showUploadModal = true">导入MD</button>
    </template>
  </NavBar>

  <div class="container">
    <aside class="sidebar">
      <h3>全部教程</h3>
      <ul class="category-list">
        <li v-for="category in categories" :key="category">
          <a
            href="#"
            :class="{ active: selectedCategory === category }"
            @click.prevent="selectCategory(category)"
            >{{ category }}</a
          >
        </li>
      </ul>
    </aside>

    <main class="main-content">
      <div class="blog-header">
        <h1>
          {{
            selectedCategory === "全部"
              ? "技术随笔与问题解析"
              : selectedCategory
          }}
        </h1>
        <p>记录前端开发、架构设计与工程实践的点滴思考和问题</p>
      </div>

      <!-- 显示搜索结果统计 -->
      <div v-if="titleSearchQuery" class="search-result">
        <span
          >给你搜索<strong>{{ titleSearchQuery }}</strong
          >，找到 {{ filteredPosts.length }} 篇文章</span
        >
      </div>

      <div v-if="filteredPosts.length === 0 && !titleSearchQuery">暂无文章</div>

      <article v-for="post in filteredPosts" :key="post._id" class="post-card">
        <div class="post-header">
          <h2>{{ post.title }}</h2>
          <div class="post-meta">
            {{ formatDate(post.createdAt) }} · 阅读时间
            {{ Math.ceil(post.content.length / 500) }} 分钟
          </div>
        </div>
        <div class="post-body" v-html="post.content"></div>
        <div class="post-footer">
          <span>标签：{{ post.category }}</span>
          <div class="post-actions">
            <a @click.prevent="confirmDelete(post)">删除</a>
            <router-link :to="'/post/' + post._id">阅读全文 →</router-link>
          </div>
        </div>
      </article>
    </main>
  </div>

  <!-- 删除确认弹窗 -->
  <div
    v-if="showDeleteModal"
    class="modal-overlay"
    @click.self="showDeleteModal = false"
  >
    <div class="modal">
      <div class="modal-header">
        <h3>确认删除</h3>
        <button class="close-btn" @click="showDeleteModal = false">×</button>
      </div>
      <div class="modal-body">
        <p>确定要删除文章 "{{ postToDelete?.title }}" 吗？</p>
        <input
          type="password"
          v-model="deletePassword"
          placeholder="请输入密码"
        />
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="showDeleteModal = false">
          取消
        </button>
        <button class="delete-btn" @click="deletePost" :disabled="deleting">
          {{ deleting ? "删除中..." : "确认删除" }}
        </button>
      </div>
    </div>
  </div>

  <div
    v-if="showUploadModal"
    class="modal-overlay"
    @click.self="showUploadModal = false"
  >
    <div class="modal">
      <div class="modal-header">
        <h3>导入 Markdown 文章</h3>
        <button class="close-btn" @click="showUploadModal = false">×</button>
      </div>
      <div class="modal-body">
        <!-- 支持选择文件夹或多文件 -->
        <input
          type="file"
          accept=".md,.markdown"
          webkitdirectory
          multiple
          @change="handleFileChange"
        />
        <p class="tip">选择文件夹导入，文件夹名=分类，文件名=标题</p>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="showUploadModal = false">
          取消
        </button>
        <button
          class="submit-btn"
          @click="uploadFile"
          :disabled="!selectedFiles || uploading"
        >
          {{ uploading ? "导入中..." : "导入" }}
        </button>
      </div>
    </div>
  </div>
  <BackToTop />
</template>

<script setup>
/**
 * Vue 3 Composition API 导入
 * ref: 创建响应式变量
 * computed: 创建计算属性
 * onMounted: 组件挂载完成的生命周期钩子
 * watch: 监听响应式数据变化
 */
import { ref, computed, onMounted, watch } from "vue";

/**
 * Vue Router 钩子
 * useRoute: 获取当前路由信息
 * useRouter: 编程式导航
 */
import { useRoute, useRouter } from "vue-router";

/**
 * Axios - HTTP 客户端库
 * 用于前端向后端发送异步请求
 */
import axios from "axios";

/**
 * 导入子组件
 * NavBar: 导航栏组件（包含标题搜索框）
 * BackToTop: 返回顶部组件
 */
import NavBar from "../components/NavBar.vue";
import BackToTop from "../components/BackToTop.vue";

/**
 * useRoute: 获取当前路由实例
 * 用于读取 URL 中的 query 参数（如 ?category=xxx）
 */
const route = useRoute();

/**
 * useRouter: 获取路由实例
 * 用于编程式导航（如 this.$router.push）
 */
const router = useRouter();

/**
 * posts: 响应式数组
 * 存储从后端获取的所有文章列表
 *
 * ref() 函数用于创建响应式引用
 * - 读取值：posts.value
 * - 修改值：posts.value = [...]
 */
const posts = ref([]);

/**
 * selectedCategory: 响应式字符串
 * 当前选中的文章分类，默认值 "全部"
 */
const selectedCategory = ref("全部");

/**
 * titleSearchQuery: 响应式字符串
 * 用户输入的标题搜索关键词
 */
const titleSearchQuery = ref("");

/**
 * showUploadModal: 响应式布尔值
 * 控制"导入MD"弹窗的显示/隐藏
 */
const showUploadModal = ref(false);

/**
 * selectedFiles: 响应式变量
 * 用户选择的要上传的文件（支持多个文件或文件夹）
 */
const selectedFiles = ref(null);

/**
 * uploading: 响应式布尔值
 * 标记当前是否正在上传文件（用于禁用按钮）
 */
const uploading = ref(false);

/**
 * showDeleteModal: 响应式布尔值
 * 控制删除确认弹窗的显示/隐藏
 */
const showDeleteModal = ref(false);

/**
 * postToDelete: 响应式变量
 * 存储当前准备删除的文章对象
 */
const postToDelete = ref(null);

/**
 * deletePassword: 响应式字符串
 * 用户输入的删除密码
 */
const deletePassword = ref("");

/**
 * deleting: 响应式布尔值
 * 标记当前是否正在删除（用于禁用按钮）
 */
const deleting = ref(false);

/**
 * categories: 计算属性
 * 从所有文章中提取不重复的分类列表
 *
 * 计算过程：
 * 1. posts.value.map((p) => p.category) - 提取所有分类
 * 2. [...new Set(...)] - 去重
 * 3. .filter(Boolean) - 过滤掉空值
 * 4. ["全部", ...cats] - 前面加上"全部"选项
 */
const categories = computed(() => {
  // 提取所有分类并去重
  const cats = [...new Set(posts.value.map((p) => p.category).filter(Boolean))];
  // 返回包含"全部"的完整列表
  return ["全部", ...cats];
});

/**
 * filteredPosts: 核心计算属性 - 执行多条件过滤
 *
 * 过滤逻辑（按顺序执行）：
 * 1. 先按分类过滤
 * 2. 再按标题关键词模糊匹配
 *
 * 模糊匹配原理：
 * - toLowerCase() 将搜索词和标题都转为小写
 * - includes() 检查标题是否包含搜索词
 * - 这样"Vue"能匹配到"vue"、"Vue"、"VUE"等
 */
const filteredPosts = computed(() => {
  // 1. 从所有文章开始
  let result = posts.value;

  // 2. 按分类过滤（如果选择了非"全部"分类）
  if (selectedCategory.value !== "全部") {
    /**
     * filter() 方法：
     * - 遍历 result 数组
     * - 对每个元素执行回调函数
     * - 返回满足条件的元素组成新数组
     *
     * p.category === selectedCategory.value
     * 只有分类完全匹配的文章才保留
     */
    result = result.filter((p) => p.category === selectedCategory.value);
  }

  // 3. 按标题关键词模糊匹配（新增功能）
  if (titleSearchQuery.value) {
    /**
     * 模糊搜索实现：
     *
     * 1. titleSearchQuery.value
     *    - 获取用户输入的搜索词
     *
     * 2. .toLowerCase()
     *    - 将搜索词转为小写
     *    - 实现大小写不敏感匹配
     *
     * 3. .toLowerCase()
     *    - 将文章标题也转为小写
     *    - 避免"Vue"匹配不到"vue"的问题
     *
     * 4. .includes(query)
     *    - 判断标题是否包含搜索词
     *    - includes 是严格包含，不是正则
     *    - "vue" 可以匹配 "Vue教程"
     *
     * 5. || 操作符
     *    - 标题或内容包含关键词都算匹配
     *    - 提供更广泛的搜索范围
     *
     * 示例：
     * - 搜索词: "vue"
     * - 文章标题: "Vue3 入门教程"
     * - "vue3 入门教程".toLowerCase() = "vue3 入门教程"
     * - "vue3 入门教程".includes("vue") = true ✓
     */
    const query = titleSearchQuery.value.toLowerCase();
    result = result.filter(
      (p) =>
        // 标题模糊匹配（主要）
        p.title.toLowerCase().includes(query) ||
        // 内容模糊匹配（次要，作为补充）
        p.content.toLowerCase().includes(query),
    );
  }

  // 返回过滤后的结果
  return result;
});

/**
 * selectCategory: 选择分类函数
 *
 * 功能：
 * 1. 更新本地状态 selectedCategory
 * 2. 同步更新 URL query 参数（支持分享链接）
 */
const selectCategory = (category) => {
  // 更新响应式变量
  selectedCategory.value = category;

  /**
   * router.push: 编程式导航
   *
   * path: 目标路径（这里是当前路径）
   * query: URL query 参数
   *
   * 结果：URL 变为 /?category=xxx
   * 好处：用户刷新页面不会丢失分类选择
   */
  router.push({ path: "/", query: { category } });
};

/**
 * handleTitleSearch: 标题搜索处理函数
 *
 * 接收从 NavBar 组件传来的搜索关键词
 * 更新 titleSearchQuery 响应式变量
 *
 * @param {string} query - 搜索关键词
 */
const handleTitleSearch = (query) => {
  /**
   * 更新搜索关键词
   * 由于 filteredPosts 是计算属性，
   * 会自动重新计算并更新视图
   */
  titleSearchQuery.value = query;
};

/**
 * watch: 监听器
 *
 * 监听 route.query.category 的变化
 * 用于：当用户通过 URL 直接访问时（如点击分享链接）
 *       同步更新选中的分类
 */
watch(
  /**
   * 第一个参数：要监听的数据
   * () => route.query.category
   * 包装成函数是为了能正确追踪变化
   */
  () => route.query.category,

  /**
   * 第二个参数：变化时的回调函数
   * @param {string|null} newCat - 新的分类值
   */
  (newCat) => {
    if (newCat) {
      // URL 有分类参数，更新选中状态
      selectedCategory.value = newCat;
    } else {
      // URL 没有分类参数，显示"全部"
      selectedCategory.value = "全部";
    }
  },

  /**
   * 第三个参数：选项
   * immediate: true 表示立即执行一次
   *           这样组件初始化时就会执行回调
   */
  { immediate: true },
);

/**
 * formatDate: 日期格式化函数
 *
 * 将 ISO 日期字符串转换为中文日期格式
 * 例如：2024-03-15T08:00:00.000Z → 2024年3月15日
 *
 * @param {string} date - ISO 格式的日期字符串
 * @returns {string} 格式化后的日期
 */
const formatDate = (date) => {
  // 1. new Date(date) - 将字符串解析为 Date 对象
  const d = new Date(date);

  // 2. d.getFullYear() - 获取四位数年份
  // 3. d.getMonth() + 1 - 获取月份（0-11，所以要+1）
  // 4. d.getDate() - 获取日期（1-31）
  // 5. 拼接成目标格式
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

/**
 * fetchPosts: 异步获取文章列表
 *
 * 从后端 API 获取所有文章并更新到 posts 变量
 */
const fetchPosts = async () => {
  try {
    /**
     * axios.get: 发送 GET 请求
     *
     * await: 等待请求完成
     * - async 函数中才能使用 await
     * - 会暂停函数执行直到 Promise resolve
     *
     * 完整URL: http://localhost:5000/api/posts
     */
    const res = await axios.get("http://localhost:5000/api/posts");

    /**
     * res.data: axios 响应的数据部分
     * posts.value: 响应式变量的实际值
     *
     * 这里赋值会触发 Vue 的响应式更新
     * 视图会自动重新渲染
     */
    posts.value = res.data;
  } catch (error) {
    /**
     * 请求失败时
     * console.error: 在控制台输出错误（红色）
     * 用于调试和问题排查
     */
    console.error("连接后端失败", error);
  }
};

/**
 * handleFileChange: 文件选择处理
 *
 * 当用户选择文件后触发
 * 将文件对象数组存储到 selectedFiles
 * 支持选择文件夹（多个文件）
 *
 * @param {Event} event - input change 事件
 */
const handleFileChange = (event) => {
  // event.target.files - 获取用户选择的所有文件
  selectedFiles.value = event.target.files;
};

/**
 * uploadFile: 上传文件函数
 *
 * 将用户选择的 Markdown 文件上传到服务器
 * 文件夹名=分类，文件名=标题
 */
const uploadFile = async () => {
  // 防御性检查：如果没有选择文件，直接返回
  if (!selectedFiles.value || selectedFiles.value.length === 0) return;

  /**
   * FormData: Web API
   * 用于构建multipart/form-data格式的请求体
   * 必须用这种方式上传文件
   */
  const formData = new FormData();

  // 从第一个文件的 webkitRelativePath 获取文件夹名
  // 例如: "技术文章/vue3-教程.md" -> "技术文章"
  let category = "未分类";
  if (selectedFiles.value.length > 0) {
    const firstFile = selectedFiles.value[0];
    const relativePath = firstFile.webkitRelativePath;
    console.log("[upload] Raw relativePath:", relativePath);
    if (relativePath) {
      // 循环解码直到无法再解码
      let decodedPath = relativePath;
      let lastPath = "";
      let loopCount = 0;
      while (decodedPath !== lastPath && loopCount < 5) {
        lastPath = decodedPath;
        try {
          decodedPath = decodeURIComponent(decodedPath);
        } catch (e) {
          break;
        }
        loopCount++;
      }
      console.log("[upload] Decoded relativePath:", decodedPath);
      // 获取文件夹路径的第一个部分作为分类名
      const pathParts = decodedPath.split("/");
      if (pathParts.length > 1) {
        category = pathParts[0];
      }
      console.log("[upload] Category:", category);
    }
  }

  /**
   * append: 向 FormData 添加字段
   * 'files': 文件对象
   * 'filenames': 文件名列表（已解码），用 | 分隔（避免逗号问题）
   * 'category': 文件夹名作为分类
   */
  formData.append("category", category);

  // 收集所有解码后的文件名
  const filenames = [];
  for (let i = 0; i < selectedFiles.value.length; i++) {
    const file = selectedFiles.value[i];
    formData.append("files", file);

    // 从 webkitRelativePath 获取解码后的文件名
    let decodedName = file.name;
    if (file.webkitRelativePath) {
      let decodedPath = file.webkitRelativePath;
      let lastPath = "";
      let loopCount = 0;
      while (decodedPath !== lastPath && loopCount < 5) {
        lastPath = decodedPath;
        try {
          decodedPath = decodeURIComponent(decodedPath);
        } catch (e) {
          break;
        }
        loopCount++;
      }
      const pathParts = decodedPath.split("/");
      if (pathParts.length > 1) {
        decodedName = pathParts[pathParts.length - 1];
      }
    }
    filenames.push(decodedName);
  }
  formData.append("filenames", filenames.join("|"));

  // 标记开始上传
  uploading.value = true;

  try {
    /**
     * axios.post: 发送 POST 请求
     *
     * 参数1: URL
     * 参数2: 请求体数据
     * 参数3: 配置对象
     *   - headers: 设置请求头
     *   - Content-Type: multipart/form-data
     *     告诉服务器这是文件上传请求
     */
    const res = await axios.post(
      "http://localhost:5000/api/upload/",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    /**
     * res.data.posts: 后端返回的文章对象数组
     *
     * unshift: 在数组开头添加元素
     * 将新文章添加到列表最前面（最新发布）
     */
    const newPosts = res.data.posts || [];
    if (newPosts.length > 0) {
      posts.value = [...newPosts, ...posts.value];

      // 关闭弹窗
      showUploadModal.value = false;

      // 清空已选文件
      selectedFiles.value = null;
    }
  } catch (error) {
    console.error("上传失败", error);

    /**
     * error.response?.data?.message
     * - error.response: 服务器响应对象
     * - error.response.data: 响应数据
     * - error.response.data.message: 后端返回的错误信息
     * - error.message: axios 错误信息（如网络错误）
     * - ?. 是可选链操作符，避免访问undefined属性报错
     *
     * 优先显示后端错误信息，其次显示axios错误
     */
    alert("上传失败: " + (error.response?.data?.message || error.message));
  } finally {
    /**
     * finally: 无论try还是catch，都会执行
     * 用于：清理工作，如重置loading状态
     */
    uploading.value = false;
  }
};

/**
 * confirmDelete: 确认删除
 *
 * 打开删除确认弹窗
 * 重置密码输入和删除状态
 *
 * @param {Object} post - 要删除的文章对象
 */
const confirmDelete = (post) => {
  // 保存要删除的文章
  postToDelete.value = post;

  // 重置密码
  deletePassword.value = "";

  // 显示确认弹窗
  showDeleteModal.value = true;
};

/**
 * deletePost: 执行删除
 *
 * 发送删除请求到后端
 * 删除成功后更新本地列表
 */
const deletePost = async () => {
  // 防御性检查
  if (!postToDelete.value) return;

  // 标记开始删除
  deleting.value = true;

  try {
    /**
     * axios.delete: 发送 DELETE 请求
     *
     * URL: /api/posts/:id
     * :id 是动态参数，从 postToDelete.value._id 获取
     *
     * data 选项：发送请求体数据（密码）
     * 注意：DELETE 请求通常用 data 发送 body
     */
    await axios.delete(
      `http://localhost:5000/api/posts/${postToDelete.value._id}`,
      {
        data: { password: deletePassword.value },
      },
    );

    /**
     * filter: 过滤数组
     * 排除被删除的文章，返回新数组
     *
     * p._id !== postToDelete.value._id
     * 只保留不等于被删除文章ID的元素
     */
    posts.value = posts.value.filter((p) => p._id !== postToDelete.value._id);

    alert("删除成功");

    // 关闭弹窗
    showDeleteModal.value = false;

    // 清空删除目标
    postToDelete.value = null;
  } catch (error) {
    alert("删除失败: " + (error.response?.data?.message || error.message));
  } finally {
    // 重置删除状态
    deleting.value = false;
  }
};

/**
 * onMounted: 生命周期钩子
 *
 * 组件挂载完成后（DOM渲染完毕）执行
 *
 * 用途：初始化数据（如从API获取初始数据）
 */
onMounted(() => {
  // 组件加载时获取所有文章
  fetchPosts();
});
</script>

<style>
.container {
  display: flex;
  min-height: calc(100vh - 100px);
  padding-top: 20px;
}

.sidebar {
  width: 25%;
  min-width: 100px;
  max-width: 200px;
  background: #fff;
  border-right: 1px solid var(--border);
  padding: 20px 0;
  overflow-x: hidden;
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar h3 {
  padding: 0 10px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-list {
  list-style: none;
  width: 100%;
}
.category-list > li {
  margin-bottom: 8px;
  width: 100%;
}
.category-list a {
  display: block;
  padding: 12px 10px;
  width: 100%;
  color: var(--text);
  text-decoration: none;
  border-left: 4px solid transparent;
  transition: all 0.3s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  box-sizing: border-box;
}
.category-list a:hover,
.category-list a.active {
  background-color: #f0f7f0;
  border-left-color: var(--primary);
  font-weight: 500;
}

.main-content {
  width: 75%;
  padding: 0 20px;
  background: var(--light-bg);
  box-sizing: border-box;
}

.blog-header {
  margin-bottom: 24px;
}
.blog-header h1 {
  font-size: 28px;
  color: var(--text);
  margin-bottom: 8px;
}
.blog-header p {
  color: var(--text-secondary);
}

/* 搜索结果提示样式 */
.search-result {
  background: #f0f7f0;
  border: 1px solid var(--primary);
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 20px;
  color: var(--primary);
  font-size: 14px;
}

.search-result strong {
  font-weight: 600;
}

.post-card {
  background: var(--card-bg);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}
.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.post-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
}
.post-header h2 {
  font-size: 22px;
  margin-bottom: 8px;
}
.post-meta {
  color: var(--text-secondary);
  font-size: 14px;
}

.post-body {
  padding: 20px;
  max-height: 200px;
  overflow: hidden; /* 隐藏溢出内容 */
  text-overflow: ellipsis;
  color: var(--text);
}

.post-footer {
  padding: 16px 20px;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--text-secondary);
}

.upload-btn {
  margin-left: 15px;
  padding: 8px 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
.upload-btn:hover {
  opacity: 0.8;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.modal-body input[type="file"] {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 4px;
}

.modal-body .tip {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-secondary);
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn {
  padding: 8px 20px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.post-actions {
  display: flex;
  gap: 15px;
}

.post-actions a {
  color: var(--text-secondary);
  text-decoration: none;
  cursor: pointer;
}

.post-actions a:hover {
  color: var(--primary);
}

.delete-btn {
  padding: 8px 20px;
  background: #dc3545;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.modal-body input[type="password"] {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 4px;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    max-width: none;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  .main-content {
    padding: 20px;
  }
}
</style>
