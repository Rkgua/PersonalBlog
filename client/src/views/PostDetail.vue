<template>
  <NavBar>
    <template #action>
      <button class="back-btn" @click="$router.back()">← 返回</button>
    </template>
  </NavBar>

  <div class="detail-container">
    <article class="post-detail" v-if="post">
      <header class="detail-header">
        <h1>{{ post.title }}</h1>
        <div class="post-meta">
          {{ formatDate(post.createdAt) }} · 分类：{{ post.category }}
        </div>
      </header>
      <div class="detail-body" v-html="post.content"></div>
    </article>
    <div v-else class="loading">加载中...</div>
  </div>
  <BackToTop />
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import NavBar from "../components/NavBar.vue";
import BackToTop from "../components/BackToTop.vue";

const route = useRoute();
const post = ref(null);

const fetchPost = async () => {
  try {
    const res = await axios.get(
      `http://localhost:5000/api/posts/${route.params.id}`,
    );
    post.value = res.data;
  } catch (error) {
    console.error("获取文章失败", error);
  }
};

const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

onMounted(() => {
  fetchPost();
});
</script>

<style>
.back-btn {
  padding: 8px 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
.back-btn:hover {
  opacity: 0.8;
}

.detail-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 30px 20px;
}

.post-detail {
  background: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 40px;
}

.detail-header {
  border-bottom: 1px solid var(--border);
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.detail-header h1 {
  font-size: 32px;
  margin-bottom: 10px;
}

.post-meta {
  color: var(--text-secondary);
  font-size: 14px;
}

.detail-body {
  line-height: 1.8;
  font-size: 16px;
  overflow-wrap: break-word;
}
/* overflow-wrap: break-word;  优先保留单词完整性；仅当整行无法放入时，在任意位置断行避免超长字母溢出 */
.detail-body h1,
.detail-body h2,
.detail-body h3 {
  margin: 20px 0 10px;
}

.detail-body p {
  margin-bottom: 16px;
}

.detail-body code {
  background: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.detail-body pre {
  background: #f4f4f4;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 16px 0;
}

.detail-body pre code {
  background: none;
  padding: 0;
}

.detail-body ul,
.detail-body ol {
  margin: 16px 0;
  padding-left: 24px;
}

.detail-body li {
  margin-bottom: 8px;
}

.detail-body blockquote {
  border-left: 4px solid var(--primary);
  padding-left: 16px;
  margin: 16px 0;
  color: var(--text-secondary);
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}
</style>
