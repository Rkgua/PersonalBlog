<template>
  <!--
    v-model="selectedCategory": 双向绑定分类选择
    @title-search: 监听NavBar组件发出的标题搜索事件
  -->
  <NavBar v-model="selectedCategory" @title-search="handleTitleSearch">
    <!-- #action 具名插槽 -->
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

      <!-- 全选框 -->
      <div v-if="filteredPosts.length > 0" class="select-all-bar">
        <label class="checkbox-label">
          <input
            type="checkbox"
            :checked="isAllSelected"
            @change="toggleSelectAll"
          />
          <span>全选</span>
        </label>
        <span class="select-count">共 {{ filteredPosts.length }} 篇</span>
      </div>

      <article v-for="post in filteredPosts" :key="post._id" class="post-card" :class="{ 'is-selected': selectedPostIds.has(post._id) }">
        <div class="post-check-col">
          <input
            type="checkbox"
            :checked="selectedPostIds.has(post._id)"
            @change="toggleSelect(post._id)"
            class="post-checkbox"
          />
        </div>
        <div class="post-content-col">
          <div class="post-header">
            <h2>
              <router-link :to="'/post/' + post._id" class="title-link">{{ post.title }}</router-link>
            </h2>
            <div class="post-meta">
              {{ formatDate(post.createdAt) }}
            </div>
          </div>
          <!-- 移除内容预览 post-body -->
          <div class="post-footer">
            <div class="post-footer-left">
              <span class="post-category">📂 {{ post.category }}</span>
              <!-- 难度选择 -->
              <span class="difficulty-group">
                <span
                  v-for="d in difficultyLevels"
                  :key="d.label"
                  :class="['diff-badge', d.class, { active: post.difficulty === d.label }]"
                  :title="d.label"
                  @click.prevent="updateDifficulty(post, d.label)"
                >{{ d.label }}</span>
              </span>
            </div>
            <div class="post-actions">
              <a @click.prevent="confirmDelete(post)">删除</a>
              <router-link :to="'/post/' + post._id">阅读全文</router-link>
            </div>
          </div>
        </div>
      </article>

      <!-- 批量操作栏 -->
      <div v-if="selectedPostIds.size > 0" class="batch-bar">
        <span class="batch-info">已选 {{ selectedPostIds.size }} 篇</span>
        <button class="batch-move-btn" @click="showMoveModal = true">📂 移动</button>
        <button class="batch-delete-btn" @click="confirmBatchDelete">删除所选</button>
        <button class="batch-cancel-btn" @click="clearSelection">取消选择</button>
      </div>
    </main>
  </div>

  <!-- 删除确认弹窗（支持单删和批量） -->
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
        <p v-if="isBatchDeleting">确定要删除所选 <strong>{{ selectedPostIds.size }}</strong> 篇文章吗？此操作不可恢复。</p>
        <p v-else>确定要删除文章 "{{ postToDelete?.title }}" 吗？</p>
        <input
          type="password"
          v-model="deletePassword"
          placeholder="请输入密码（123456）"
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

  <!-- 移动分类弹窗 -->
  <div
    v-if="showMoveModal"
    class="modal-overlay"
    @click.self="showMoveModal = false"
  >
    <div class="modal">
      <div class="modal-header">
        <h3>移动文章到分类</h3>
        <button class="close-btn" @click="showMoveModal = false">×</button>
      </div>
      <div class="modal-body">
        <p>将所选 <strong>{{ selectedPostIds.size }}</strong> 篇文章移动到：</p>
        <div class="move-category-row">
          <select v-model="moveTargetCategory" class="category-select">
            <option value="" disabled>请选择分类</option>
            <option
              v-for="cat in allCategoryNames"
              :key="cat"
              :value="cat"
            >{{ cat }}</option>
          </select>
          <input
            v-model="moveCustomCategory"
            class="category-input"
            placeholder="或输入新分类名"
          />
        </div>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn" @click="showMoveModal = false">取消</button>
        <button
          class="submit-btn"
          @click="executeBatchMove"
          :disabled="!effectiveMoveCategory || moving"
        >
          {{ moving ? "移动中..." : "确认移动" }}
        </button>
      </div>
    </div>
  </div>

  <!-- 上传弹窗（支持拖拽 + 单文件选择分类） -->
  <div
    v-if="showUploadModal"
    class="modal-overlay"
    @click.self="closeUploadModal"
  >
    <div class="modal upload-modal">
      <div class="modal-header">
        <h3>导入 Markdown 文章</h3>
        <button class="close-btn" @click="closeUploadModal">×</button>
      </div>

      <!-- Upload Tabs -->
      <div class="upload-tabs">
        <button
          :class="['tab-btn', { active: uploadTab === 'folder' }]"
          @click="uploadTab = 'folder'"
        >📁 文件夹导入</button>
        <button
          :class="['tab-btn', { active: uploadTab === 'single' }]"
          @click="uploadTab = 'single'"
        >📄 单文件导入</button>
      </div>

      <div class="modal-body">
        <!-- Tab 1: Folder Import with Drag & Drop -->
        <div v-if="uploadTab === 'folder'">
          <!-- Drag & drop zone -->
          <div
            class="drop-zone"
            :class="{ 'drop-active': isDragging }"
            @dragover.prevent="handleDragOver"
            @dragleave="isDragging = false"
            @drop.prevent="handleDrop"
            @click="folderInputRef?.click()"
          >
            <div class="drop-icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path fill="currentColor" d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
              </svg>
            </div>
            <p class="drop-text">
              {{ selectedFolderName || '拖拽文件夹到此处，或点击选择文件夹' }}
            </p>
            <p class="tip">文件夹名=分类，.md文件名=文章标题，自动批量导入</p>
            <input
              ref="folderInputRef"
              type="file"
              accept=".md,.markdown"
              webkitdirectory
              multiple
              hidden
              @change="handleFolderChange"
            />
          </div>
        </div>

        <!-- Tab 2: Single File Import with Category Picker -->
        <div v-if="uploadTab === 'single'">
          <div class="single-upload-form">
            <label class="form-label">选择 .md 文件</label>
            <input
              type="file"
              accept=".md,.markdown"
              @change="handleSingleFileChange"
            />

            <label class="form-label" style="margin-top: 12px; display: block;">选择分类</label>
            <div class="category-select-row">
              <select v-model="selectedCategoryForUpload" class="category-select">
                <option value="未分类">未分类</option>
                <option
                  v-for="cat in existingCategories"
                  :key="cat"
                  :value="cat"
                >{{ cat }}</option>
              </select>
              <input
                v-model="customCategoryInput"
                class="category-input"
                placeholder="或输入新分类名"
              />
            </div>

            <p class="tip" style="margin-top: 12px;">选择 .md 文件并指定分类导入，文件名=文章标题</p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" @click="closeUploadModal">取消</button>
        <button
          v-if="uploadTab === 'folder'"
          class="submit-btn"
          @click="uploadFolder"
          :disabled="(!selectedFolderFiles && dragFilesCache.length === 0) || uploading"
        >
          {{ uploading ? "导入中..." : "导入文件夹" }}
        </button>
        <button
          v-if="uploadTab === 'single'"
          class="submit-btn"
          @click="uploadSingleFile"
          :disabled="!singleFile || uploading"
        >
          {{ uploading ? "导入中..." : "导入文件" }}
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
 * uploadTab: 上传弹窗的当前标签页
 * 'folder' - 文件夹导入
 * 'single' - 单文件导入
 */
const uploadTab = ref("folder");

/**
 * selectedFolderFiles: 响应式变量
 * 用户通过文件夹选择的所有文件
 */
const selectedFolderFiles = ref(null);

/**
 * selectedFolderName: 响应式字符串
 * 已选择的文件夹名称（用于显示）
 */
const selectedFolderName = ref("");

/**
 * folderInputRef: 模板引用
 * 用于触发隐藏的 webkitdirectory input
 */
const folderInputRef = ref(null);

/**
 * isDragging: 响应式布尔值
 * 标记当前是否拖拽悬停
 */
const isDragging = ref(false);

/**
 * singleFile: 响应式变量
 * 用户选择的单个文件
 */
const singleFile = ref(null);

/**
 * selectedCategoryForUpload: 响应式字符串
 * 单文件导入时手动选择的分类
 */
const selectedCategoryForUpload = ref("未分类");

/**
 * customCategoryInput: 响应式字符串
 * 用户手动输入的新分类名
 */
const customCategoryInput = ref("");

/**
 * existingCategories: 响应式数组
 * 从后端获取的已有分类列表
 */
const existingCategories = ref([]);

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
 * selectedPostIds: 响应式 Set
 * 存储用户选中的文章 ID（用于批量删除）
 */
const selectedPostIds = ref(new Set());

/**
 * isBatchDeleting: 响应式布尔值
 * 标记当前删除弹窗是批量删除还是单篇删除
 */
const isBatchDeleting = ref(false);

/**
 * showMoveModal: 响应式布尔值
 * 控制移动分类弹窗显示/隐藏
 */
const showMoveModal = ref(false);

/**
 * moveTargetCategory: 响应式字符串
 * 移动目标分类（从下拉选择）
 */
const moveTargetCategory = ref("");

/**
 * moveCustomCategory: 响应式字符串
 * 移动目标分类（手动输入新分类名）
 */
const moveCustomCategory = ref("");

/**
 * effectiveMoveCategory: 计算属性
 * 最终有效的目标分类名
 */
const effectiveMoveCategory = computed(() => {
  return moveCustomCategory.value.trim() || moveTargetCategory.value || "";
});

/**
 * allCategoryNames: 计算属性
 * 所有可选分类名（去掉「全部」）
 */
const allCategoryNames = computed(() => {
  return categories.value.filter((c) => c !== "全部");
});

/**
 * moving: 响应式布尔值
 * 标记是否正在移动中
 */
const moving = ref(false);

/**
 * isAllSelected: 计算属性
 * 当前过滤后的文章是否全部选中
 */
const isAllSelected = computed(() => {
  if (filteredPosts.value.length === 0) return false;
  return filteredPosts.value.every((p) => selectedPostIds.value.has(p._id));
});

/**
 * closeUploadModal: 关闭上传弹窗并重置所有状态
 */
const closeUploadModal = () => {
  showUploadModal.value = false;
  selectedFolderFiles.value = null;
  selectedFolderName.value = "";
  dragFilesCache = [];
  dragTextsCache = [];
  dragFolderNameCache = "";
  singleFile.value = null;
  selectedCategoryForUpload.value = "未分类";
  customCategoryInput.value = "";
};

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

  // 3. 按标题关键词模糊匹配
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
 * handleFolderChange: 文件夹选择处理
 *
 * 当用户选择文件夹后触发
 * 将文件对象数组存储到 selectedFolderFiles
 *
 * @param {Event} event - input change 事件
 */
const handleFolderChange = (event) => {
  // 清除拖拽缓存（用户手动选择文件夹时以文件夹选择为准）
  dragFilesCache = [];
  dragTextsCache = [];
  dragFolderNameCache = "";
  selectedFolderFiles.value = event.target.files;
  // 提取文件夹名作为显示名称
  if (event.target.files.length > 0) {
    const path = event.target.files[0].webkitRelativePath;
    if (path) {
      const parts = path.split("/");
      selectedFolderName.value = "📁 " + parts[0] + " (" + event.target.files.length + " 个文件)";
    }
  }
};

/**
 * handleSingleFileChange: 单文件选择处理
 *
 * @param {Event} event - input change 事件
 */
const handleSingleFileChange = (event) => {
  singleFile.value = event.target.files[0];
};

/**
 * handleDragOver: 拖拽悬停处理
 */
const handleDragOver = (e) => {
  isDragging.value = true;
};

/**
 * dragFilesCache: 拖拽文件缓存（绕过 DataTransfer 内容丢失 bug）
 * entry.file() 取出的 File 对象直接保存，不经过 new DataTransfer()
 * 
 * dragTextsCache: 与 dragFilesCache 一一对应的文件原始内容文本
 *  在 traverseEntry 中用 file.text() 一次性读好，uploadFolder 直接使用
 *     不再在 uploadFolder 中二次 file.text()（new File() 构造的 File 在某些浏览器上 text() 可能返回空）
 */
let dragFilesCache = [];
let dragTextsCache = [];
let dragFolderNameCache = "";

/**
 * handleDrop: 拖拽放下处理
 *
 * 从拖拽的数据中提取文件列表，直接缓存 File 对象
 * 不经过 DataTransfer（会丢失文件内容和 webkitRelativePath）
 *
 * @param {DragEvent} e
 */
const handleDrop = (e) => {
  isDragging.value = false;
  const items = e.dataTransfer?.items;
  if (!items) return;

  dragFilesCache = [];
  dragTextsCache = [];    // 重置内容文本缓存
  dragFolderNameCache = "";
  const promises = [];
  let topFolderName = "";

  for (const item of items) {
    const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
    if (entry) {
      // 记录顶级文件夹名
      if (entry.isDirectory) {
        topFolderName = entry.name;
      }
      promises.push(traverseEntry(entry, dragFilesCache, ""));
    }
  }

  Promise.all(promises).then(() => {
    if (dragFilesCache.length > 0) {
      dragFolderNameCache = topFolderName || "未分类";
      selectedFolderFiles.value = null; // 清除 FileList 引用，使用缓存
      selectedFolderName.value = "📁 " + (topFolderName || "未分类") + " (" + dragFilesCache.length + " 个文件)";
    } else {
      selectedFolderName.value = "";
    }
  });
};

/**
 * traverseEntry: 递归遍历拖拽的文件目录树
 *
 * ★★★ 关键修复：entry.file() 在某些浏览器上返回 File.size=0 且无实际内容，
 * 导致拖拽上传大量文件失败。此处用 file.text() 主动读取内容，
 * 然后用内容重新构造一个有真实数据的 File 对象。
 *
 * @param {FileSystemEntry} entry
 * @param {Array} allFiles - 存储 File 对象的数组
 * @param {string} parentPath - 上级文件夹路径
 * @returns {Promise}
 */
const traverseEntry = (entry, allFiles, parentPath) => {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((file) => {
        // 仅处理 .md 文件
        if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown")) {
          resolve();
          return;
        }

        const fullPath = entry.fullPath || ("/" + parentPath + "/" + file.name).replace(/\/\//g, "/");
        const relPath = fullPath.replace(/^\//, "");

        // ★★★ 用 file.text() 读取实际内容，绕过 entry.file() 返回空 File 的浏览器 bug ★★★
        file.text().then((contentText) => {
          if (!contentText || !contentText.trim()) {
            console.warn("[upload] Skipping empty content (drag):", file.name);
            resolve();
            return;
          }

          // 用实际内容重新构造 File，确保 multipart 传输时有 size > 0
          const properFile = new File([contentText], file.name, {
            type: "text/markdown",
            lastModified: file.lastModified || Date.now(),
          });

          // 手动设置 webkitRelativePath
          Object.defineProperty(properFile, "webkitRelativePath", {
            value: relPath,
            writable: false,
          });

          allFiles.push(properFile);
          // ★★★ 把原始内容文本存到 dragTextsCache，uploadFolder 直接使用，不再二次 file.text() ★★★
          dragTextsCache.push(contentText);
          resolve();
        }).catch(() => {
          // text() 读取失败，放弃此文件
          console.warn("[upload] Failed to read file content (drag):", file.name);
          resolve();
        });
      }, resolve); // 如果 file() 出错也 resolve 防止死锁
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const dirPath = parentPath ? parentPath + "/" + entry.name : entry.name;
      const readEntries = () => {
        reader.readEntries((entries) => {
          if (entries.length === 0) {
            resolve();
          } else {
            const subPromises = entries.map((e) => traverseEntry(e, allFiles, dirPath));
            Promise.all(subPromises).then(readEntries);
          }
        }, resolve); // 如果 readEntries 出错也 resolve
      };
      readEntries();
    } else {
      resolve();
    }
  });
};

/**
 * resolveFiles: 获取当前要上传的文件列表（兼容 FileList 和拖拽缓存）
 *
 * @returns {{ files: Array, filenames: string[], category: string }}
 */
const resolveFiles = () => {
  const useDrag = dragFilesCache.length > 0;
  const sourceFiles = useDrag ? dragFilesCache : Array.from(selectedFolderFiles.value || []);

  // 过滤出 .md 文件（交给后端做内容有效性检查，前端不做 size 过滤）
  const mdFiles = sourceFiles.filter((f) => {
    const name = f.name || "";
    return name.endsWith(".md") || name.endsWith(".markdown");
  });

  // 提取分类名
  let category = "未分类";
  if (useDrag && dragFolderNameCache) {
    category = dragFolderNameCache;
  } else if (mdFiles.length > 0 && mdFiles[0].webkitRelativePath) {
    let decodedPath = mdFiles[0].webkitRelativePath;
    let lastPath = "";
    let loopCount = 0;
    while (decodedPath !== lastPath && loopCount < 5) {
      lastPath = decodedPath;
      try { decodedPath = decodeURIComponent(decodedPath); } catch (e) { break; }
      loopCount++;
    }
    const parts = decodedPath.split("/");
    category = parts.length > 1 ? parts[0] : "未分类";
  }

  // 提取解码后的文件名
  const filenames = mdFiles.map((f) => {
    if (!f.webkitRelativePath) return f.name;
    let decodedPath = f.webkitRelativePath;
    let lastPath = "";
    let loopCount = 0;
    while (decodedPath !== lastPath && loopCount < 5) {
      lastPath = decodedPath;
      try { decodedPath = decodeURIComponent(decodedPath); } catch (e) { break; }
      loopCount++;
    }
    const parts = decodedPath.split("/");
    return parts.length > 1 ? parts[parts.length - 1] : f.name;
  });

  return { files: mdFiles, filenames, category };
};

/**
 * uploadFolder: 上传整个文件夹
 *
 * 文件夹名=分类，文件名=标题
 * 支持 webkitdirectory 文件输入和拖拽两种来源
 */
const uploadFolder = async () => {
  const useDrag = dragFilesCache.length > 0;
  const hasInputFiles = selectedFolderFiles.value && selectedFolderFiles.value.length > 0;

  if (!useDrag && !hasInputFiles) return;

  const { files, filenames, category } = resolveFiles();
  if (files.length === 0) {
    alert("未找到 .md 文件");
    return;
  }

  uploading.value = true;

  try {
    const formData = new FormData();
    formData.append("category", category);
    formData.append("expectedCount", String(files.length));

    for (const file of files) {
      formData.append("files", file);
    }
    formData.append("filenames", JSON.stringify(filenames));

    // ★★★ 使用 dragTextsCache（拖拽时已用 file.text() 读好的原始内容），
    //     不再对 File 对象二次 file.text()（new File 在某些浏览器上 text() 可能返回空）
    let contents;
    if (useDrag && dragTextsCache.length >= files.length) {
      contents = dragTextsCache.slice(0, files.length);
    } else {
      // fallback: 从文件夹选择器来的文件，用 File 对象的 text()
      contents = await Promise.all(files.map((f) =>
        f.text().catch(() => "")
      ));
    }
    // 诊断
    contents.forEach((c, i) => {
      if (!c || !c.trim()) {
        console.warn(`[upload] content empty [${i}]: "${filenames[i]}"`);
      }
    });
    console.log(`[upload] Sending ${files.length} files, ${contents.filter(c => c && c.trim()).length} with content`);
    formData.append("contents", JSON.stringify(contents));

    const res = await axios.post("http://localhost:5000/api/upload/", formData);

    const diag = res.data._diagnostics;
    const newPosts = res.data.posts || [];

    if (diag) {
      console.log(`[upload] 期望 ${diag.expected} 个文件，服务端收到 ${diag.received}，成功导入 ${diag.imported}`);
      if (diag.received < diag.expected) {
        alert(`警告：预期 ${diag.expected} 个文件，服务端仅收到 ${diag.received} 个。\n这通常是因为浏览器拖拽上传时部分文件内容丢失。\n建议改用「选择文件夹」方式导入。`);
      } else if (diag.imported < diag.received) {
        console.warn(`[upload] ${diag.skipped} 个文件被跳过（空文件或内容异常）`);
      }
    }

    if (newPosts.length > 0) {
      posts.value = [...newPosts, ...posts.value];
      showUploadModal.value = false;
      selectedFolderFiles.value = null;
      selectedFolderName.value = "";
      dragFilesCache = [];
      dragTextsCache = [];
      dragFolderNameCache = "";
    }
  } catch (error) {
    console.error("上传失败", error);
    alert("上传失败: " + (error.response?.data?.message || error.message));
  } finally {
    uploading.value = false;
  }
};

/**
 * uploadSingleFile: 上传单个文件
 *
 * 使用手动选择的分类
 */
const uploadSingleFile = async () => {
  if (!singleFile.value) return;

  const formData = new FormData();
  const category = customCategoryInput.value.trim() || selectedCategoryForUpload.value || "未分类";
  formData.append("category", category);
  // 用 file.name 作为标题（File API 的 name 是正确 UTF-8，不受 multipart 编码影响）
  formData.append("title", singleFile.value.name.replace(/\.(md|markdown)$/i, ""));
  formData.append("file", singleFile.value);

  uploading.value = true;

  try {
    // 注意：不要手动设置 Content-Type，axios 会自动添加 multipart boundary
    const res = await axios.post("http://localhost:5000/api/upload/single", formData);

    if (res.data.post) {
      posts.value = [res.data.post, ...posts.value];
      showUploadModal.value = false;
      singleFile.value = null;
      selectedCategoryForUpload.value = "未分类";
      customCategoryInput.value = "";
    }
  } catch (error) {
    console.error("上传失败", error);
    alert("上传失败: " + (error.response?.data?.message || error.message));
  } finally {
    uploading.value = false;
  }
};

/**
 * fetchCategories: 从后端获取已有分类列表
 */
const fetchCategories = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/posts/categories");
    existingCategories.value = res.data || [];
  } catch (error) {
    console.error("获取分类失败", error);
  }
};

/**
 * difficultyLevels: 难度等级配置
 * 用于文章卡片上的难度选择标签
 */
const difficultyLevels = [
  { label: "频繁", class: "diff-frequent", color: "#e74c3c" },
  { label: "常见", class: "diff-common", color: "#e67e22" },
  { label: "偶尔", class: "diff-occasional", color: "#27ae60" },
  { label: "罕见", class: "diff-rare", color: "#2980b9" },
];

/**
 * updateDifficulty: 更新文章难度
 *
 * @param {Object} post - 文章对象
 * @param {string} difficulty - 难度值
 */
const updateDifficulty = async (post, difficulty) => {
  // 如果点击已选中的难度，则取消选择
  const newDifficulty = post.difficulty === difficulty ? "" : difficulty;
  try {
    await axios.patch(
      `http://localhost:5000/api/posts/${post._id}`,
      { difficulty: newDifficulty },
    );
    // 更新本地数据
    const idx = posts.value.findIndex((p) => p._id === post._id);
    if (idx !== -1) {
      posts.value[idx] = { ...posts.value[idx], difficulty: newDifficulty };
    }
  } catch (error) {
    console.error("更新难度失败", error);
  }
};

/**
 * toggleSelect: 切换单篇文章的选中状态
 *
 * @param {string} id - 文章 _id
 */
const toggleSelect = (id) => {
  const newSet = new Set(selectedPostIds.value);
  if (newSet.has(id)) {
    newSet.delete(id);
  } else {
    newSet.add(id);
  }
  selectedPostIds.value = newSet;
};

/**
 * toggleSelectAll: 全选/取消全选
 */
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedPostIds.value = new Set();
  } else {
    selectedPostIds.value = new Set(filteredPosts.value.map((p) => p._id));
  }
};

/**
 * clearSelection: 清空所有选中
 */
const clearSelection = () => {
  selectedPostIds.value = new Set();
  showMoveModal.value = false;
};

/**
 * confirmBatchDelete: 确认批量删除
 */
const confirmBatchDelete = () => {
  if (selectedPostIds.value.size === 0) return;
  isBatchDeleting.value = true;
  postToDelete.value = null;
  deletePassword.value = "";
  showDeleteModal.value = true;
};

/**
 * executeBatchMove: 执行批量移动分类
 */
const executeBatchMove = async () => {
  const target = effectiveMoveCategory.value;
  if (!target || selectedPostIds.value.size === 0) return;

  moving.value = true;
  const ids = Array.from(selectedPostIds.value);

  try {
    const res = await axios.post("http://localhost:5000/api/posts/batch-move", {
      ids,
      category: target,
    });

    // 更新本地文章列表的分类
    posts.value = posts.value.map((p) => {
      if (selectedPostIds.value.has(p._id)) {
        return { ...p, category: target };
      }
      return p;
    });

    showMoveModal.value = false;
    clearSelection();
    alert(res.data.message || `成功移动到「${target}」`);
    // 刷新分类列表
    fetchCategories();
  } catch (error) {
    alert("移动失败: " + (error.response?.data?.message || error.message));
  } finally {
    moving.value = false;
  }
};

/**
 * confirmDelete: 确认单篇删除
 *
 * @param {Object} post - 要删除的文章对象
 */
const confirmDelete = (post) => {
  isBatchDeleting.value = false;
  postToDelete.value = post;
  deletePassword.value = "";
  showDeleteModal.value = true;
};

/**
 * deletePost: 执行删除（支持单篇和批量）
 */
const deletePost = async () => {
  deleting.value = true;

  try {
    if (isBatchDeleting.value) {
      // 批量删除
      const ids = Array.from(selectedPostIds.value);
      await axios.post("http://localhost:5000/api/posts/batch-delete", {
        ids,
        password: deletePassword.value,
      });
      posts.value = posts.value.filter((p) => !selectedPostIds.value.has(p._id));
      clearSelection();
      alert(`成功删除 ${ids.length} 篇文章`);
    } else {
      // 单篇删除
      if (!postToDelete.value) return;
      await axios.delete(
        `http://localhost:5000/api/posts/${postToDelete.value._id}`,
        { data: { password: deletePassword.value } },
      );
      posts.value = posts.value.filter((p) => p._id !== postToDelete.value._id);
      alert("删除成功");
      postToDelete.value = null;
    }

    showDeleteModal.value = false;
  } catch (error) {
    alert("删除失败: " + (error.response?.data?.message || error.message));
  } finally {
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
  // 组件加载时获取所有文章和分类
  fetchPosts();
  fetchCategories();
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

/* ── 多选相关样式 ── */

.select-all-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--primary);
  cursor: pointer;
}

.select-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.post-card {
  background: var(--card-bg);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  display: flex;
  transition:
    transform 0.3s,
    box-shadow 0.3s,
    border-color 0.2s;
  border: 2px solid transparent;
}
.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.post-card.is-selected {
  border-color: var(--primary);
  background: #f8fbf6;
}

.post-check-col {
  display: flex;
  align-items: flex-start;
  padding: 20px 0 0 16px;
  flex-shrink: 0;
}

.post-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--primary);
  cursor: pointer;
}

.post-content-col {
  flex: 1;
  min-width: 0;
}

.post-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
}
.post-header h2 {
  font-size: 22px;
  margin-bottom: 8px;
}

.title-link {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s;
}

.title-link:hover {
  color: var(--primary);
}
.post-meta {
  color: var(--text-secondary);
  font-size: 14px;
}

.post-body {
  display: none; /* 隐藏内容预览 */
}

.post-footer {
  padding: 14px 20px;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--text-secondary);
  flex-wrap: wrap;
  gap: 8px;
}

.post-footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.post-category {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* ── 难度选择标签 ── */
.difficulty-group {
  display: flex;
  gap: 4px;
}

.diff-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  cursor: pointer;
  border: 1px solid transparent;
  opacity: 0.4;
  transition: all 0.2s;
  user-select: none;
  line-height: 1.6;
}

.diff-badge:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.diff-badge.active {
  opacity: 1;
  font-weight: 600;
  border-width: 1.5px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.diff-frequent {
  color: #e74c3c;
  border-color: #e74c3c;
  background: #fef0ef;
}
.diff-frequent.active {
  background: #e74c3c;
  color: #fff;
}

.diff-common {
  color: #e67e22;
  border-color: #e67e22;
  background: #fef5ed;
}
.diff-common.active {
  background: #e67e22;
  color: #fff;
}

.diff-occasional {
  color: #27ae60;
  border-color: #27ae60;
  background: #edf9f1;
}
.diff-occasional.active {
  background: #27ae60;
  color: #fff;
}

.diff-rare {
  color: #2980b9;
  border-color: #2980b9;
  background: #edf5fa;
}
.diff-rare.active {
  background: #2980b9;
  color: #fff;
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

/* ── 批量操作栏 ── */
.batch-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 900;
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.batch-info {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
}

.batch-delete-btn {
  padding: 8px 20px;
  background: #dc3545;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s;
}

.batch-delete-btn:hover {
  opacity: 0.85;
}

.batch-move-btn {
  padding: 8px 20px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s;
}

.batch-move-btn:hover {
  opacity: 0.85;
}

.move-category-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.move-category-row .category-select,
.move-category-row .category-input {
  flex: 1;
}

.batch-cancel-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.batch-cancel-btn:hover {
  background: #eee;
  color: var(--text);
}

.modal-body input[type="password"] {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 4px;
  margin-top: 10px;
}

/* Upload Modal Enhancements */
.upload-modal {
  max-width: 560px;
}

.upload-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  background: #fafafa;
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab-btn:hover {
  color: var(--text);
  background: #f0f0f0;
}

.tab-btn.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  font-weight: 600;
  background: #fff;
}

.drop-zone {
  border: 2px dashed var(--border);
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafaf8;
}

.drop-zone:hover,
.drop-zone.drop-active {
  border-color: var(--primary);
  background: #f0f7f0;
}

.drop-zone.drop-active {
  border-color: var(--primary);
  background: #e8f5e8;
  transform: scale(1.02);
}

.drop-icon {
  color: var(--border);
  margin-bottom: 12px;
}

.drop-zone:hover .drop-icon,
.drop-zone.drop-active .drop-icon {
  color: var(--primary);
}

.drop-text {
  font-size: 15px;
  color: var(--text);
  margin-bottom: 8px;
}

.single-upload-form {
  padding: 10px 0;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.category-select-row {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.category-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 14px;
  background: #fff;
  color: var(--text);
}

.category-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.category-input:focus,
.category-select:focus {
  border-color: var(--primary);
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
