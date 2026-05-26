<template>
  <div class="top-bar">
    <input
      type="text"
      placeholder="搜索你感兴趣的文章标题..."
      v-model="titleSearchQuery"
      @input="onTitleSearch"
    />
    <slot name="action"></slot>
    <button class="settings-btn" @click="showSettings = true" title="设置">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.611 3.611 0 0112 15.6z"/>
      </svg>
    </button>
  </div>

  <div class="nav-bar">
    <router-link to="/">首页</router-link>
    <a
      v-for="(site, i) in settings.websites"
      :key="i"
      :href="site.url"
      target="_blank"
    >{{ site.title }}</a>
    <button class="add-site-btn" @click="showAddSite = true" title="添加网站">+</button>
  </div>

  <Teleport to="body">
    <div v-if="showSettings" class="modal-overlay" @click.self="closeSettings">
      <div class="settings-panel">
        <div class="settings-header">
          <span>设置</span>
          <button class="settings-close" @click="closeSettings">&times;</button>
        </div>

        <div class="settings-body">
          <div class="setting-section">
            <label>主题颜色</label>
            <div class="color-row">
              <div class="color-swatches">
                <button
                  v-for="c in themeColors"
                  :key="c"
                  :class="['swatch', { active: settings.primaryColor === c }]"
                  :style="{ background: c }"
                  @click="changePrimaryColor(c)"
                />
              </div>
              <input class="hex-input" v-model="primaryHex" maxlength="7" @blur="applyPrimaryColor" @keyup.enter="applyPrimaryColor" placeholder="#8bb174" />
            </div>
          </div>

          <div class="setting-section">
            <label>字体</label>
            <select v-model="settings.fontFamily" @change="onFontChange" class="font-select">
              <option v-for="f in fonts" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>
          </div>

          <div class="setting-section">
            <label>背景颜色</label>
            <div class="color-swatches">
              <button
                v-for="c in bgColors"
                :key="c"
                :class="['swatch', { active: settings.bgColor === c }]"
                :style="{ background: c, border: c === '#ffffff' ? '1px solid #ddd' : 'none' }"
                @click="changeBgColor(c)"
              />
            </div>
          </div>

          <div class="setting-section">
            <label>标题字体颜色</label>
            <div class="color-row">
              <div class="color-swatches">
                <button v-for="c in titleColors" :key="c" :class="['swatch', { active: settings.titleColor === c }]" :style="{ background: c }" @click="changeTitleColor(c)" />
              </div>
              <input class="hex-input" v-model="titleHex" maxlength="7" @blur="applyTitleColor" @keyup.enter="applyTitleColor" placeholder="#000000" />
            </div>
          </div>

          <div class="setting-section">
            <label>内容字体颜色</label>
            <div class="color-row">
              <div class="color-swatches">
                <button v-for="c in contentColors" :key="c" :class="['swatch', { active: settings.contentColor === c }]" :style="{ background: c }" @click="changeContentColor(c)" />
              </div>
              <input class="hex-input" v-model="contentHex" maxlength="7" @blur="applyContentColor" @keyup.enter="applyContentColor" placeholder="#333333" />
            </div>
          </div>

          <div class="setting-section">
            <label>标题字体大小</label>
            <select v-model="settings.titleSize" @change="onTitleSizeChange" class="font-select">
              <option v-for="s in titleSizes" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <div class="setting-section">
            <label>内容字体大小</label>
            <select v-model="settings.contentSize" @change="onContentSizeChange" class="font-select">
              <option v-for="s in contentSizes" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <div class="setting-section">
            <label>手写块字体</label>
            <select v-model="settings.handwritingFont" @change="onHandwritingFontChange" class="font-select">
              <option v-for="f in handwritingFonts" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>
          </div>

          <div class="setting-section">
            <label>手写块背景</label>
            <div class="color-row">
              <div class="color-swatches">
                <button v-for="c in handwritingBgs" :key="c" :class="['swatch', { active: settings.handwritingBg === c }]" :style="{ background: c, border: c === '#ffffff' ? '1px solid #ddd' : 'none' }" @click="changeHandwritingBg(c)" />
              </div>
              <input class="hex-input" v-model="handwritingHex" maxlength="7" @blur="applyHandwritingBg" @keyup.enter="applyHandwritingBg" placeholder="#fafaf5" />
            </div>
          </div>

          <div class="setting-section">
            <label>问答机器人</label>
            <label class="toggle-switch">
              <input type="checkbox" v-model="settings.showQA" @change="onQAChange" />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-section">
            <label>AI 提供商</label>
            <select v-model="settings.aiProvider" @change="onProviderChange" class="font-select">
              <option v-for="p in providerList" :key="p.id" :value="p.id">{{ p.label }}</option>
            </select>
          </div>

          <div v-if="settings.aiProvider === 'custom'" class="setting-section">
            <label>自定义端点</label>
            <input class="site-input" v-model="settings.aiEndpoint" placeholder="https://api.example.com/v1/chat/completions" @change="onCustomEndpointChange" />
          </div>

          <div v-if="settings.aiProvider === 'custom'" class="setting-section">
            <label>自定义模型名</label>
            <input class="site-input" v-model="settings.aiModel" placeholder="model-name" @change="onCustomModelChange" />
          </div>

          <div v-if="settings.aiProvider !== 'custom'" class="setting-section">
            <label>模型</label>
            <div class="current-model">{{ getEffectiveConfig().model }}</div>
          </div>

          <div class="setting-section">
            <label>API 密钥（{{ getProviderLabel(settings.aiProvider) }}）</label>
            <div class="api-key-row">
              <input class="api-key-input" v-model="apiKeyInput" type="password" :placeholder="keyPlaceholder" />
              <button class="api-key-save" @click="saveApiKey">保存</button>
            </div>
            <div v-if="apiKeyMsg" class="api-key-msg">{{ apiKeyMsg }}</div>
          </div>

          <div class="setting-section">
            <label>常用网站</label>
            <div class="site-list">
              <div v-for="(site, i) in settings.websites" :key="i" class="site-item">
                <span class="site-title">{{ site.title }}</span>
                <button class="site-remove" @click="removeWebsite(i)">&times;</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAddSite" class="modal-overlay" @click.self="showAddSite = false">
      <div class="add-site-panel">
        <div class="settings-header">
          <span>添加网站</span>
          <button class="settings-close" @click="showAddSite = false">&times;</button>
        </div>
        <div class="settings-body">
          <div class="setting-section">
            <label>网站名称</label>
            <input v-model="newSiteTitle" class="site-input" placeholder="例如：MDN" />
          </div>
          <div class="setting-section">
            <label>网址</label>
            <input v-model="newSiteUrl" class="site-input" placeholder="https://" />
          </div>
          <button class="add-site-confirm" @click="addWebsite">添加</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { settings, saveSettings, applyTheme, providerPresets, getEffectiveConfig } from "../store/settings";

const props = defineProps({
  modelValue: String,
});

const emit = defineEmits(["update:modelValue", "title-search"]);
const route = useRoute();
const titleSearchQuery = ref("");
const showSettings = ref(false);
const showAddSite = ref(false);
const newSiteTitle = ref("");
const newSiteUrl = ref("");

const selectedCategory = computed({
  get: () => props.modelValue || route.query.category || "全部",
  set: (val) => emit("update:modelValue", val),
});

const onTitleSearch = () => {
  emit("title-search", titleSearchQuery.value);
};

const themeColors = [
  "#8bb174", "#4a90d9", "#9b59b6", "#e74c3c",
  "#f39c12", "#1abc9c", "#2c3e50", "#e91e63",
];

const bgColors = [
  "#f5f5f7", "#ffffff", "#f0f4f8", "#fef9ef",
  "#f5f0eb", "#e8f5e9", "#e3f2fd",
];

const titleColors = [
  "#2c3e50", "#1a1a2e", "#333333", "#000000",
  "#8bb174", "#4a90d9", "#9b59b6", "#c0392b",
];

const contentColors = [
  "#333333", "#444444", "#555555", "#666666",
  "#2c3e50", "#4a3728", "#1a1a1a", "#3d3d3d",
];

const handwritingFonts = [
  { label: "楷体", value: "'KaiTi', '楷体', serif" },
  { label: "行楷", value: "'Xingkai SC', '华文行楷', cursive" },
  { label: "宋体", value: "'SimSun', '宋体', serif" },
  { label: "黑体", value: "'SimHei', '黑体', sans-serif" },
  { label: "微软雅黑", value: "'Microsoft YaHei', sans-serif" },
  { label: "苹方", value: "'PingFang SC', '苹方', sans-serif" },
  { label: "默认", value: "'Segoe UI', 'Microsoft YaHei', sans-serif" },
  { label: "等宽", value: "'Consolas', 'Courier New', monospace" },
];

const handwritingBgs = [
  "#fafaf5", "#f5f0eb", "#fef9ef", "#e8f5e9",
  "#f0f4f8", "#fff8e1", "#fce4ec", "#ffffff",
];

const titleSizes = ["14px", "15px", "16px", "17px", "18px", "20px", "22px", "24px", "28px"];
const contentSizes = ["12px", "13px", "14px", "15px", "16px", "17px", "18px", "20px"];

const primaryHex = ref(settings.primaryColor);
const titleHex = ref(settings.titleColor);
const contentHex = ref(settings.contentColor);
const handwritingHex = ref(settings.handwritingBg);
const apiKeyInput = ref("");
const apiKeyMsg = ref("");

const providerList = Object.entries(providerPresets).map(([id, cfg]) => ({ id, label: cfg.label }));

function getProviderLabel(id) {
  return providerPresets[id]?.label || id;
}

const keyPlaceholder = computed(() => {
  const p = settings.aiProvider;
  if (p === "anthropic") return "sk-ant-...";
  if (p === "groq") return "gsk_...";
  return "sk-...";
});

function onProviderChange() {
  saveSettings();
}

function onCustomEndpointChange() {
  saveSettings();
}

function onCustomModelChange() {
  saveSettings();
}

const fonts = [
  { label: "默认", value: "'Segoe UI', 'Microsoft YaHei', sans-serif" },
  { label: "楷体", value: "'KaiTi', '楷体', serif" },
  { label: "宋体", value: "'SimSun', '宋体', serif" },
  { label: "黑体", value: "'SimHei', '黑体', sans-serif" },
  { label: "微软雅黑", value: "'Microsoft YaHei', sans-serif" },
  { label: "等宽", value: "'Consolas', 'Courier New', monospace" },
];

function changePrimaryColor(color) {
  settings.primaryColor = color;
  primaryHex.value = color;
  applyTheme();
  saveSettings();
}

function applyPrimaryColor() {
  const hex = primaryHex.value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    settings.primaryColor = hex;
    applyTheme();
    saveSettings();
  }
}

function changeBgColor(color) {
  settings.bgColor = color;
  applyTheme();
  saveSettings();
}

function onFontChange() {
  applyTheme();
  saveSettings();
}

function onQAChange() {
  saveSettings();
}

function saveApiKey() {
  const key = apiKeyInput.value.trim();
  const provider = settings.aiProvider;
  if (provider === "anthropic" && !key.startsWith("sk-ant-")) {
    apiKeyMsg.value = "Anthropic 密钥应以 sk-ant- 开头";
    return;
  }
  if ((provider === "openai" || provider === "deepseek") && !key.startsWith("sk-")) {
    apiKeyMsg.value = "密钥格式不正确";
    return;
  }
  settings.deepseekKey = key;
  saveSettings();
  apiKeyMsg.value = "✓ 已保存";
  setTimeout(() => { apiKeyMsg.value = ""; }, 2000);
}

function changeTitleColor(color) {
  settings.titleColor = color;
  titleHex.value = color;
  applyTheme();
  saveSettings();
}

function changeContentColor(color) {
  settings.contentColor = color;
  contentHex.value = color;
  applyTheme();
  saveSettings();
}

function applyTitleColor() {
  const hex = titleHex.value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    settings.titleColor = hex;
    applyTheme();
    saveSettings();
  }
}

function applyContentColor() {
  const hex = contentHex.value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    settings.contentColor = hex;
    applyTheme();
    saveSettings();
  }
}

function onTitleSizeChange() {
  applyTheme();
  saveSettings();
}

function onContentSizeChange() {
  applyTheme();
  saveSettings();
}

function onHandwritingFontChange() {
  applyTheme();
  saveSettings();
}

function changeHandwritingBg(color) {
  settings.handwritingBg = color;
  handwritingHex.value = color;
  applyTheme();
  saveSettings();
}

function applyHandwritingBg() {
  const hex = handwritingHex.value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    settings.handwritingBg = hex;
    applyTheme();
    saveSettings();
  }
}

function addWebsite() {
  const title = newSiteTitle.value.trim();
  const url = newSiteUrl.value.trim();
  if (!title || !url) return;
  settings.websites.push({ title, url });
  saveSettings();
  newSiteTitle.value = "";
  newSiteUrl.value = "";
  showAddSite.value = false;
}

function removeWebsite(index) {
  settings.websites.splice(index, 1);
  saveSettings();
}

function closeSettings() {
  showSettings.value = false;
}

watch(showSettings, (val) => {
  document.body.style.overflow = val ? "hidden" : "";
});

defineExpose({ titleSearchQuery, selectedCategory });
</script>

<style>
.top-bar {
  background: #fff;
  padding: 12px 20px;
  text-align: right;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.top-bar input {
  width: 300px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 14px;
}

.settings-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  transition: background 0.2s;
}
.settings-btn:hover {
  background: #f0f0f0;
  color: var(--primary);
}

.nav-bar {
  background-color: var(--primary);
  display: flex;
  align-items: center;
  height: 50px;
  width: 100%;
}
.nav-bar a {
  color: #fff;
  text-decoration: none;
  padding: 0 16px;
  font-size: 14px;
  transition: opacity 0.3s;
  white-space: nowrap;
}
.nav-bar a:hover {
  opacity: 0.8;
}

.add-site-btn {
  background: rgba(255,255,255,0.2);
  border: 1px dashed rgba(255,255,255,0.5);
  color: #fff;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 0 12px;
  height: 30px;
  border-radius: 4px;
  margin-left: 8px;
  transition: background 0.2s;
}
.add-site-btn:hover {
  background: rgba(255,255,255,0.35);
}

/* Modal overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 80px;
  z-index: 1000;
}

.settings-panel,
.add-site-panel {
  background: #fff;
  border-radius: 12px;
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  font-size: 16px;
  font-weight: 600;
}

.settings-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0 4px;
}
.settings-close:hover {
  color: #333;
}

.settings-body {
  padding: 16px 20px;
}

.setting-section {
  margin-bottom: 20px;
}
.setting-section label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.color-swatches {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s;
}
.swatch:hover {
  transform: scale(1.15);
}
.swatch.active {
  border-color: #333;
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px #333;
}

.font-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

/* Toggle switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: #ccc;
  border-radius: 24px;
  transition: 0.3s;
}
.toggle-slider::before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: 0.3s;
}
.toggle-switch input:checked + .toggle-slider {
  background: var(--primary);
}
.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

/* Website list */
.site-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.site-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #f8f8f8;
  border-radius: 6px;
  font-size: 14px;
}

.site-remove {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #ccc;
  padding: 0 4px;
  line-height: 1;
}
.site-remove:hover {
  color: #e74c3c;
}

/* Add site panel */
.site-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.add-site-confirm {
  width: 100%;
  padding: 10px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}
.add-site-confirm:hover {
  opacity: 0.85;
}

/* Color row with swatches + hex input */
.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hex-input {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  font-family: monospace;
  text-align: center;
  flex-shrink: 0;
}

/* API key */
.api-key-row {
  display: flex;
  gap: 8px;
}
.api-key-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}
.api-key-save {
  padding: 8px 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}
.api-key-save:hover {
  opacity: 0.85;
}
.api-key-msg {
  font-size: 13px;
  color: var(--primary);
  margin-top: 4px;
}

.current-model {
  padding: 8px 10px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
  font-family: monospace;
}
</style>
