<template>
  <NavBar simple homeLabel="返回" />

  <div v-if="post" class="cornell-root">
    <!-- 顶部 -->
    <header class="cornell-header">
      <h1>{{ post.title }}</h1>
      <div class="post-meta">
        {{ formatDate(post.createdAt) }} · 分类：{{ post.category }}
      </div>
    </header>

    <!-- 主要 -->
    <div class="cornell-row" ref="scrollContainer" @scroll="onScroll">
      <!-- 问题 (Left) -->
      <div class="cue-column" :style="{ width: cueWidth }">
        <div class="cue-header">问题</div>
        <textarea
          class="cue-textarea handwriting"
          v-model="cueText"
          placeholder="在此输入笔记相关的问题..."
          @input="onCueChange"
        ></textarea>
      </div>

      <!-- Draggable Divider -->
      <div class="divider-handle" @mousedown="startResize"></div>
      <!-- 笔记 (Right) -->
      <div class="note-column">
        <div class="note-toolbar">
          <span class="note-header">笔记</span>
          <button
            class="blur-toggle"
            @click="blurred = !blurred"
            :title="blurred ? '点击显示内容' : '点击遮盖内容'"
          >
            <span v-if="blurred"
              ><img :src="IconLock" class="icon-inline" /> 遮盖</span
            >
            <span v-else
              ><img :src="IconUnlock" class="icon-inline" /> 显示</span
            >
          </button>
        </div>
        <div
          class="note-content"
          :class="{ blurred: blurred }"
          v-html="post.content"
        ></div>
      </div>
    </div>

    <!-- 底部总结部分 -->
    <div class="cornell-summary">
      <div class="summary-header">总结</div>
      <textarea
        class="summary-textarea handwriting"
        v-model="summaryText"
        placeholder="在此输入笔记总结..."
        @input="onSummaryChange"
      ></textarea>
    </div>

    <!-- Save Button -->
    <div class="save-bar">
      <button class="save-btn" @click="saveCueSummary" :disabled="saving">
        {{ saving ? "保存中..." : "保存问题与总结" }}
      </button>
      <span v-if="saveMsg" class="save-msg">{{ saveMsg }}</span>
    </div>
  </div>

  <div v-else class="loading">加载中...</div>
  <BackToTop />
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import NavBar from "../components/NavBar.vue";
import BackToTop from "../components/BackToTop.vue";
import IconLock from "../assets/icon_lock.svg";
import IconUnlock from "../assets/icon_unlock.svg";

const route = useRoute();
const post = ref(null);

const cueText = ref("");
const summaryText = ref("");
const blurred = ref(false);
const saving = ref(false);
const saveMsg = ref("");

// 初始宽度 = 主笔记的 50%（即总宽的 33.33%），用户可拖拽调整
const cueWidth = ref("33.33%");
const isResizing = ref(false);

// Sync scroll state
const scrollContainer = ref(null);

const fetchPost = async () => {
  try {
    const res = await axios.get(`/api/posts/${route.params.id}`);
    post.value = res.data;
    cueText.value = res.data.cue || "";
    summaryText.value = res.data.summary || "";
  } catch (error) {
    console.error("获取文章失败", error);
  }
};

const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const onCueChange = () => {
  // 同步滚动
  nextTick(() => {
    document
      .querySelectorAll(".cue-textarea, .summary-textarea")
      .forEach((el) => {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      });
  });
};

const onSummaryChange = onCueChange;

const saveCueSummary = async () => {
  saving.value = true;
  saveMsg.value = "";
  try {
    await axios.patch(`/api/posts/${route.params.id}`, {
      cue: cueText.value,
      summary: summaryText.value,
    });
    saveMsg.value = "保存成功";
    setTimeout(() => {
      saveMsg.value = "";
    }, 2000);
  } catch (error) {
    saveMsg.value =
      "保存失败: " + (error.response?.data?.message || error.message);
  } finally {
    saving.value = false;
  }
};

// Draggable divider logic — 基于百分比
const startResize = (e) => {
  isResizing.value = true;
  const startX = e.clientX;
  const container = document.querySelector(".cornell-row");
  if (!container) return;
  const containerWidth = container.getBoundingClientRect().width;
  // 解析当前百分比
  const currentPct = parseFloat(cueWidth.value) || 50;

  const onMouseMove = (ev) => {
    if (!isResizing.value) return;
    const deltaPx = ev.clientX - startX;
    const deltaPct = (deltaPx / containerWidth) * 100;
    const newPct = Math.max(0, Math.min(70, currentPct + deltaPct));
    cueWidth.value = newPct + "%";
  };

  const onMouseUp = () => {
    isResizing.value = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
};

onMounted(() => {
  fetchPost();
});
</script>

<style>
.cornell-root {
  max-width: 1310px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
}

.cornell-header {
  background: var(--card-bg);
  border-radius: 8px 8px 0 0;
  padding: 24px 30px;
  border-bottom: 2px solid var(--primary);
  flex-shrink: 0;
}

.cornell-header h1 {
  font-size: 28px;
  margin-bottom: 8px;
  color: var(--title-color);
}

.cornell-header .post-meta {
  color: var(--text-secondary);
  font-size: 14px;
}

/* Cornell Row: side-by-side cue and note with shared scroll */
.cornell-row {
  display: flex;
  flex: 1;
  overflow-y: auto;
  background: var(--card-bg);
  min-height: 300px;
}

.cue-column {
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--handwriting-bg);
  overflow: hidden; /* 宽度为 0 时隐藏内容 */
  min-width: 0; /* 允许 flex 收缩到 0 */
}

.cue-header {
  padding: 12px 16px;
  font-size: var(--title-size);
  font-weight: 600;
  color: var(--title-color);
  border-bottom: 1px solid var(--border);
  background: #f5f8f2;
  flex-shrink: 0;
  letter-spacing: 1px;
}

.cue-textarea {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 16px;
  font-size: var(--content-size);
  line-height: 1.8;
  background: transparent;
  color: var(--content-color);
  min-height: 200px;
  box-sizing: border-box;
}

.cue-textarea::placeholder {
  color: #bbb;
  font-style: italic;
}

/* Draggable Divider — 可拖拽到 0（完全隐藏问题栏），仍可拖出 */
.divider-handle {
  width: 6px;
  cursor: col-resize;
  background: transparent;
  flex-shrink: 0;
  position: relative;
  z-index: 5;
  transition: background 0.2s;
  /* 扩展左侧不可见点击区域，在问题栏为 0 时仍可抓住拖拽 */
  padding-left: 10px;
  margin-left: -10px;
  background-clip: content-box;
}

.divider-handle:hover,
.divider-handle:active {
  background: var(--primary);
  background-clip: content-box;
}

/* 左侧不可见拖拽区指示条（始终可见） */
.divider-handle::before {
  content: "";
  position: absolute;
  top: 0;
  left: -14px;
  width: 20px;
  height: 100%;
  cursor: col-resize;
  z-index: -1;
}

.divider-handle::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 30px;
  background: var(--border);
  border-radius: 1px;
  opacity: 0;
  transition: opacity 0.2s;
}

.divider-handle:hover::after {
  opacity: 1;
  background: #fff;
}

/* Main Note Column */
.note-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.note-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: #fff;
  flex-shrink: 0;
}

.note-header {
  font-size: var(--title-size);
  font-weight: 600;
  color: var(--title-color);
  letter-spacing: 1px;
}

.blur-toggle {
  padding: 4px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.blur-toggle:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.note-content {
  padding: 24px 28px;
  line-height: 1.8;
  font-size: var(--content-size);
  overflow-wrap: break-word;
  transition: filter 0.3s ease;
  color: var(--content-color);
}

.note-content.blurred {
  filter: blur(8px);
  cursor: pointer;
  user-select: none;
  pointer-events: none;
}

/* When blurred, clicking the toggle button still works because it's outside */
.note-content h1,
.note-content h2,
.note-content h3 {
  margin: 20px 0 10px;
}

.note-content p {
  margin-bottom: 16px;
}

.note-content code {
  background: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.note-content pre {
  background: #f4f4f4;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 16px 0;
}

.note-content pre code {
  background: none;
  padding: 0;
}

.note-content ul,
.note-content ol {
  margin: 16px 0;
  padding-left: 24px;
}

.note-content li {
  margin-bottom: 8px;
}

.note-content blockquote {
  border-left: 4px solid var(--primary);
  padding-left: 16px;
  margin: 16px 0;
  color: var(--text-secondary);
}

.note-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
  font-size: 0.95em;
}

.note-content th,
.note-content td {
  border: 1px solid #d0d0d0;
  padding: 8px 12px;
  text-align: left;
}

.note-content th {
  background: #f0f0f0;
  font-weight: 600;
}

.note-content tr:nth-child(even) {
  background: #fafafa;
}

/* Summary Section */
.cornell-summary {
  background: var(--card-bg);
  border-top: 2px solid var(--primary);
  flex-shrink: 0;
}

.summary-header {
  padding: 12px 24px;
  font-size: var(--title-size);
  font-weight: 600;
  color: var(--title-color);
  background: #f5f8f2;
  border-bottom: 1px solid var(--border);
  letter-spacing: 1px;
}

.summary-textarea {
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 16px 24px;
  font-size: var(--content-size);
  line-height: 1.8;
  background: var(--handwriting-bg);
  color: var(--content-color);
  min-height: 80px;
  box-sizing: border-box;
}

.summary-textarea::placeholder {
  color: #bbb;
  font-style: italic;
}

/* Handwriting 字号调整 */
.handwriting {
  font-family: var(--handwriting-font);
  line-height: 1.9;
}

/* Save bar */
.save-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: var(--card-bg);
  border-radius: 0 0 8px 8px;
  flex-shrink: 0;
}

.save-btn {
  padding: 10px 24px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;
}

.save-btn:hover {
  opacity: 0.85;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.save-msg {
  font-size: 14px;
  color: var(--primary);
}

.loading {
  text-align: center;
  padding: 80px 20px;
  font-size: 16px;
  color: var(--text-secondary);
}

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

.post-back-btn {
  padding: 6px 14px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.post-back-btn:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .cornell-row {
    flex-direction: column;
  }

  .cue-column {
    width: 100% !important;
    border-right: none;
    border-bottom: 1px solid var(--border);
    max-height: 200px;
  }

  .divider-handle {
    display: none;
  }

  .cornell-header h1 {
    font-size: 22px;
  }
}
</style>
