<template>
  <button class="qa-float-btn" @click="open = !open" title="问答助手">
    <img :src="botIcon" class="qa-bot-icon" />
  </button>

  <div v-if="open" class="qa-panel">
    <div class="qa-header">
      <span>问答助手</span>
      <div class="qa-header-right">
        <button v-if="settings.deepseekKey" class="qa-key-btn" @click="showKeyInput = !showKeyInput" title="修改API密钥">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M12.65 10a6 6 0 10-6 6h6v3h4v-3h2v-4h-6.76A6.05 6.05 0 0012 10z"/>
          </svg>
        </button>
        <button class="qa-close" @click="open = false">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="!settings.deepseekKey || showKeyInput" class="qa-key-setup">
      <div class="qa-key-label">DeepSeek API 密钥</div>
      <div class="qa-key-desc">在 deepseek.com 注册获取，密钥保存在本地</div>
      <div class="qa-key-row">
        <input v-model="keyInput" class="qa-key-input" type="password" placeholder="sk-..." />
        <button class="qa-key-save" @click="saveKey">保存</button>
      </div>
      <div v-if="keySavedMsg" class="qa-key-msg">{{ keySavedMsg }}</div>
    </div>

    <template v-if="settings.deepseekKey && !showKeyInput">
      <div class="qa-messages" ref="msgBox">
        <div v-for="(msg, i) in messages" :key="i" :class="['qa-msg', msg.role]">
          <div v-if="msg.role === 'assistant'" class="qa-bubble" v-html="renderMarkdown(msg.content)"></div>
          <div v-else class="qa-bubble">{{ msg.content }}</div>
        </div>
        <div v-if="loading" class="qa-msg assistant">
          <div class="qa-bubble qa-thinking">正在思考</div>
        </div>
      </div>

      <div class="qa-input-row">
        <input v-model="question" @keyup.enter="ask" placeholder="输入你的问题..." />
        <button @click="ask" :disabled="!question.trim() || loading">发送</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue";
import axios from "axios";
import { marked } from "marked";
import { settings, saveSettings, getEffectiveConfig } from "../store/settings";
import botIcon from "../assets/机器人.svg";

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
const showKeyInput = ref(false);
const keyInput = ref("");
const keySavedMsg = ref("");

const ask = async () => {
  const q = question.value.trim();
  if (!q || loading.value || !settings.deepseekKey) return;

  messages.value.push({ role: "user", content: q });
  question.value = "";
  loading.value = true;

  try {
    const cfg = getEffectiveConfig();
    const res = await axios.post("/api/qa", {
      question: q,
      apiKey: settings.deepseekKey,
      provider: settings.aiProvider,
      endpoint: cfg.endpoint,
      model: cfg.model,
      providerType: cfg.type,
    });
    messages.value.push({ role: "assistant", content: res.data.answer });
  } catch {
    messages.value.push({ role: "assistant", content: "❌ 请求失败，请重试" });
  } finally {
    loading.value = false;
    nextTick(() => {
      msgBox.value?.scrollTo({ top: msgBox.value.scrollHeight, behavior: "smooth" });
    });
  }
};

function saveKey() {
  const key = keyInput.value.trim();
  if (!key.startsWith("sk-")) {
    keySavedMsg.value = "密钥格式不正确，应以 sk- 开头";
    return;
  }
  settings.deepseekKey = key;
  saveSettings();
  showKeyInput.value = false;
  keyInput.value = "";
  keySavedMsg.value = "✓ 密钥已保存";
  setTimeout(() => { keySavedMsg.value = ""; }, 2000);
}
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
.qa-header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}
.qa-key-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.qa-key-btn:hover {
  background: rgba(255,255,255,0.35);
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

.qa-key-setup {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.qa-key-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
.qa-key-desc {
  font-size: 12px;
  color: #999;
}
.qa-key-row {
  display: flex;
  gap: 8px;
}
.qa-key-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}
.qa-key-input:focus {
  border-color: var(--primary);
}
.qa-key-save {
  padding: 8px 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}
.qa-key-save:hover {
  opacity: 0.85;
}
.qa-key-msg {
  font-size: 13px;
  color: var(--primary);
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
