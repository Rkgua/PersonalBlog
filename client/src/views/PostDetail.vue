<template>
  <NavBar>
    <template #action>
      <button class="back-btn" @click="$router.back()">← 返回</button>
    </template>
  </NavBar>

  <div v-if="post" class="cornell-root">
    <!-- Header -->
    <header class="cornell-header">
      <h1>{{ post.title }}</h1>
      <div class="post-meta">
        {{ formatDate(post.createdAt) }} · 分类：{{ post.category }}
      </div>
    </header>

    <!-- Cornell Main Row: Cue + Note -->
    <div class="cornell-row" ref="scrollContainer" @scroll="onScroll">
      <!-- Cue Column (Left) -->
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

      <!-- Main Note Column (Right) -->
      <div class="note-column">
        <div class="note-toolbar">
          <span class="note-header">笔记</span>
          <button
            class="blur-toggle"
            @click="blurred = !blurred"
            :title="blurred ? '点击显示内容' : '点击遮盖内容'"
          >
            <span v-if="blurred">👁 显示</span>
            <span v-else>🔒 遮盖</span>
          </button>
        </div>
        <div
          class="note-content"
          :class="{ blurred: blurred }"
          v-html="post.content"
        ></div>
      </div>
    </div>

    <!-- Summary Section (Bottom) -->
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

const route = useRoute();
const post = ref(null);

const cueText = ref("");
const summaryText = ref("");
const blurred = ref(false);
const saving = ref(false);
const saveMsg = ref("");

// Draggable divider state
// 初始宽度 = 主笔记的 50%（即总宽的 33.33%），用户可拖拽调整
const cueWidth = ref("calc(33.33% - 3px)");
const isResizing = ref(false);

// Sync scroll state
const scrollContainer = ref(null);
const isSyncing = ref(false);

const fetchPost = async () => {
  try {
    const res = await axios.get(
      `http://localhost:5000/api/posts/${route.params.id}`,
    );
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
  // Auto-adjust textarea height
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
    await axios.patch(`http://localhost:5000/api/posts/${route.params.id}`, {
      cue: cueText.value,
      summary: summaryText.value,
    });
    saveMsg.value = "保存成功 ✓";
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

// Sync scroll between cue and note columns
const onScroll = () => {
  if (!scrollContainer.value) return;
  // Both cue and note are inside the same scroll container,
  // so they scroll together naturally. No extra sync needed.
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
  color: var(--text);
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

/* Cue Column */
.cue-column {
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: #fafaf5;
  overflow: hidden; /* 宽度为 0 时隐藏内容 */
  min-width: 0;     /* 允许 flex 收缩到 0 */
}

.cue-header {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
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
  font-size: 15px;
  line-height: 1.8;
  background: transparent;
  color: #555;
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
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
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
  font-size: 15px;
  overflow-wrap: break-word;
  transition: filter 0.3s ease;
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

/* Summary Section */
.cornell-summary {
  background: var(--card-bg);
  border-top: 2px solid var(--primary);
  flex-shrink: 0;
}

.summary-header {
  padding: 12px 24px;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
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
  font-size: 15px;
  line-height: 1.8;
  background: #fafaf5;
  color: #555;
  min-height: 80px;
  box-sizing: border-box;
}

.summary-textarea::placeholder {
  color: #bbb;
  font-style: italic;
}

/* Handwriting font */
.handwriting {
  font-family: "Ma Shan Zheng", cursive;
  font-size: 17px;
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
