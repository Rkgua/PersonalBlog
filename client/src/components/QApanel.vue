<template>
  <!-- 悬浮按钮 -->
  <button class="qa-float-btn" @click="open = !open" title="问答助手">
    <img :src="botIcon" class="qa-bot-icon" />
  </button>

  <!-- 问答面板 -->
  <div v-if="open" class="qa-panel">
    <div class="qa-header">
      <span>问答助手</span>
      <button class="qa-close" @click="open = false">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path
            fill="currentColor"
            d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
          />
        </svg>
      </button>
    </div>

    <!-- 对话记录 -->
    <div class="qa-messages" ref="msgBox">
      <div v-for="(msg, i) in messages" :key="i" :class="['qa-msg', msg.role]">
        <div
          v-if="msg.role === 'assistant'"
          class="qa-bubble"
          v-html="renderMarkdown(msg.content)"
        ></div>
        <div v-else class="qa-bubble">{{ msg.content }}</div>
      </div>
      <div v-if="loading" class="qa-msg assistant">
        <div class="qa-bubble qa-thinking">正在思考</div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="qa-input-row">
      <input
        v-model="question"
        @keyup.enter="ask"
        placeholder="输入你的问题..."
      />
      <button @click="ask" :disabled="!question.trim() || loading">发送</button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from "vue";
import axios from "axios";
import { marked } from "marked";
import botIcon from "../assets/机器人.svg";

// 渲染 Markdown 为 HTML，过滤危险标签
const renderMarkdown = (text) => {
  if (!text) return "";
  try {
    return marked(text, { breaks: true, gfm: true });
  } catch {
    return text;
  }
};

const open = ref(false);
const question = ref("");
const loading = ref(false);
const messages = ref([]);
const msgBox = ref(null);

const ask = async () => {
  const q = question.value.trim();
  if (!q || loading.value) return;

  messages.value.push({ role: "user", content: q });
  question.value = "";
  loading.value = true;

  try {
    const res = await axios.post("http://localhost:5000/api/qa", {
      question: q,
    });
    messages.value.push({ role: "assistant", content: res.data.answer });
  } catch {
    messages.value.push({ role: "assistant", content: "❌ 请求失败，请重试" });
  } finally {
    loading.value = false;
    nextTick(() => {
      msgBox.value?.scrollTo({
        top: msgBox.value.scrollHeight,
        behavior: "smooth",
      });
    });
  }
};
</script>

<style scoped>
.qa-float-btn {
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 120px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  border: none;
  font-size: 24px;
  cursor: pointer;
  z-index: 999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s;
}
.qa-float-btn:hover {
  transform: scale(1.1);
}
.qa-bot-icon {
  width: 42px;
  height: 42px;
  display: block;
}

.qa-panel {
  position: fixed;
  bottom: 150px;
  right: 30px;
  width: 380px;
  height: 500px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 998;
  overflow: hidden;
}

.qa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: var(--primary);
  color: #fff;
  font-weight: 600;
}
.qa-close {
  cursor: pointer;
  font-size: 16px;
  color: #fff;
  padding: 4px;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  transition: background 0.2s;
}
.qa-close:hover {
  background: rgba(255, 255, 255, 0.2);
}
.qa-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  scrollbar-width: thin;
}
.qa-messages::-webkit-scrollbar {
  width: 4px;
}
.qa-messages::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}
.qa-msg {
  margin-bottom: 12px;
}
.qa-msg.user {
  text-align: right;
}
.qa-bubble {
  display: inline-block;
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  text-align: left;
}
.qa-msg.user .qa-bubble {
  background: var(--primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.qa-msg.assistant .qa-bubble {
  background: #f0f0f0;
  color: #333;
  border-bottom-left-radius: 4px;
}
.qa-thinking {
  color: #999 !important;
}

.qa-input-row {
  display: flex;
  padding: 10px 12px;
  gap: 8px;
  border-top: 1px solid var(--border);
}
.qa-input-row input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}
.qa-input-row input:focus {
  border-color: var(--primary);
}
.qa-input-row button {
  padding: 8px 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.qa-input-row button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
