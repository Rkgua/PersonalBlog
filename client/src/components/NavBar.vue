<template>
  <div class="top-bar">
    <input
      v-if="!simple"
      type="text"
      placeholder="搜索你感兴趣的文章标题..."
      v-model="titleSearchQuery"
      @input="onTitleSearch"
    />
    <slot name="action"></slot>
    <button
      v-if="!simple"
      class="settings-btn" @click="showSettings = true" title="设置">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path
          d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.611 3.611 0 0112 15.6z"
        />
      </svg>
    </button>
  </div>

  <div class="nav-bar">
    <router-link v-if="homeLabel === '首页'" to="/">首页</router-link>
    <a v-else href="#" @click.prevent="$router.back()">{{ homeLabel }}</a>
    <a
      v-for="(site, i) in settings.websites"
      :key="i"
      :href="site.url"
      target="_blank"
      >{{ site.title }}</a
    >
    <button class="add-site-btn" @click="showAddSite = true" title="添加网站">
      +
    </button>
  </div>

  <Teleport to="body">
    <Transition name="settings">
      <div
        v-if="showSettings"
        class="modal-overlay"
        @click.self="closeSettings"
      >
        <div class="settings-panel" @click.stop>
          <div class="settings-header">
            <span class="settings-title">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
                style="margin-right: 8px"
              >
                <path
                  d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.611 3.611 0 0112 15.6z"
                />
              </svg>
              设置
            </span>
            <button class="settings-close" @click="closeSettings">
              &times;
            </button>
          </div>

          <div class="settings-body">
            <!-- 外观设置 -->
            <div class="settings-group">
              <div class="settings-group-title">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="currentColor"
                >
                  <path
                    d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm-1 8V7h2v3h-2zm0 7v-5h2v5h-2z"
                  />
                </svg>
                外观
              </div>
              <div class="settings-group-body">
                <div class="setting-section">
                  <label>主题色</label>
                  <div class="color-row">
                    <div class="color-swatches">
                      <button
                        v-for="c in themeColors"
                        :key="c"
                        :class="[
                          'swatch',
                          { active: settings.primaryColor === c },
                        ]"
                        :style="{ background: c }"
                        @click="changePrimaryColor(c)"
                        :title="c"
                      />
                    </div>
                    <input
                      class="hex-input"
                      v-model="primaryHex"
                      maxlength="7"
                      @blur="applyPrimaryColor"
                      @keyup.enter="applyPrimaryColor"
                      placeholder="#8bb174"
                    />
                  </div>
                </div>

                <div class="setting-section">
                  <label>背景色</label>
                  <div class="color-swatches">
                    <button
                      v-for="c in bgColors"
                      :key="c"
                      :class="['swatch', { active: settings.bgColor === c }]"
                      :style="{
                        background: c,
                        border: c === '#ffffff' ? '1px solid #ddd' : 'none',
                      }"
                      @click="changeBgColor(c)"
                      :title="c"
                    />
                  </div>
                </div>

                <div class="setting-section">
                  <label>字体</label>
                  <select
                    v-model="settings.fontFamily"
                    @change="onFontChange"
                    class="font-select"
                  >
                    <option v-for="f in fonts" :key="f.value" :value="f.value">
                      {{ f.label }}
                    </option>
                  </select>
                </div>

                <div class="setting-section">
                  <label>标题大小</label>
                  <select
                    v-model="settings.titleSize"
                    @change="onTitleSizeChange"
                    class="font-select"
                  >
                    <option v-for="s in titleSizes" :key="s" :value="s">
                      {{ s }}
                    </option>
                  </select>
                </div>

                <div class="setting-section">
                  <label>内容大小</label>
                  <select
                    v-model="settings.contentSize"
                    @change="onContentSizeChange"
                    class="font-select"
                  >
                    <option v-for="s in contentSizes" :key="s" :value="s">
                      {{ s }}
                    </option>
                  </select>
                </div>

                <div class="setting-section">
                  <label>标题颜色</label>
                  <div class="color-row">
                    <div class="color-swatches">
                      <button
                        v-for="c in titleColors"
                        :key="c"
                        :class="[
                          'swatch',
                          { active: settings.titleColor === c },
                        ]"
                        :style="{ background: c }"
                        @click="changeTitleColor(c)"
                        :title="c"
                      />
                    </div>
                    <input
                      class="hex-input"
                      v-model="titleHex"
                      maxlength="7"
                      @blur="applyTitleColor"
                      @keyup.enter="applyTitleColor"
                      placeholder="#2c3e50"
                    />
                  </div>
                </div>

                <div class="setting-section">
                  <label>内容颜色</label>
                  <div class="color-row">
                    <div class="color-swatches">
                      <button
                        v-for="c in contentColors"
                        :key="c"
                        :class="[
                          'swatch',
                          { active: settings.contentColor === c },
                        ]"
                        :style="{ background: c }"
                        @click="changeContentColor(c)"
                        :title="c"
                      />
                    </div>
                    <input
                      class="hex-input"
                      v-model="contentHex"
                      maxlength="7"
                      @blur="applyContentColor"
                      @keyup.enter="applyContentColor"
                      placeholder="#333333"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 笔记区设置 -->
            <div class="settings-group">
              <div class="settings-group-title">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="currentColor"
                >
                  <path
                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                  />
                </svg>
                笔记区
              </div>
              <div class="settings-group-body">
                <div class="setting-section">
                  <label>手写块字体</label>
                  <select
                    v-model="settings.handwritingFont"
                    @change="onHandwritingFontChange"
                    class="font-select"
                  >
                    <option
                      v-for="f in handwritingFonts"
                      :key="f.value"
                      :value="f.value"
                    >
                      {{ f.label }}
                    </option>
                  </select>
                </div>

                <div class="setting-section">
                  <label>手写块背景</label>
                  <div class="color-row">
                    <div class="color-swatches">
                      <button
                        v-for="c in handwritingBgs"
                        :key="c"
                        :class="[
                          'swatch',
                          { active: settings.handwritingBg === c },
                        ]"
                        :style="{
                          background: c,
                          border: c === '#ffffff' ? '1px solid #ddd' : 'none',
                        }"
                        @click="changeHandwritingBg(c)"
                        :title="c"
                      />
                    </div>
                    <input
                      class="hex-input"
                      v-model="handwritingHex"
                      maxlength="7"
                      @blur="applyHandwritingBg"
                      @keyup.enter="applyHandwritingBg"
                      placeholder="#fafaf5"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- AI 配置 -->
            <div class="settings-group">
              <div class="settings-group-title">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="currentColor"
                >
                  <path
                    d="M21 10.5h-1.5V9h-1v1.5H17v1h1.5V13h1v-1.5H21v-1zm-7.5-1.5H12v1.5h1.5V9zm0 3H12v1.5h1.5V12zM9 9H7.5v1.5H9V9zm0 3H7.5v1.5H9V12zm3.75-6h-7.5A2.25 2.25 0 003 8.25v7.5A2.25 2.25 0 005.25 18h7.5A2.25 2.25 0 0015 15.75v-7.5A2.25 2.25 0 0012.75 6zM13.5 15.75c0 .414-.336.75-.75.75h-7.5a.75.75 0 01-.75-.75v-7.5c0-.414.336-.75.75-.75h7.5c.414 0 .75.336.75.75v7.5z"
                  />
                </svg>
                AI 配置
              </div>
              <div class="settings-group-body">
                <div class="setting-section">
                  <div class="setting-row">
                    <label>问答机器人</label>
                    <label class="toggle-switch">
                      <input
                        type="checkbox"
                        v-model="settings.showQA"
                        @change="onQAChange"
                      />
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div class="setting-section">
                  <label>AI 提供商</label>
                  <select
                    v-model="settings.aiProvider"
                    @change="onProviderChange"
                    class="font-select"
                  >
                    <option v-for="p in providerList" :key="p.id" :value="p.id">
                      {{ p.label }}
                    </option>
                  </select>
                </div>

                <div
                  v-if="settings.aiProvider === 'custom'"
                  class="setting-section"
                >
                  <label>自定义端点</label>
                  <input
                    class="form-input"
                    v-model="settings.aiEndpoint"
                    placeholder="https://api.example.com/v1/chat/completions"
                    @change="onCustomEndpointChange"
                  />
                </div>

                <div
                  v-if="settings.aiProvider === 'custom'"
                  class="setting-section"
                >
                  <label>自定义模型名</label>
                  <input
                    class="form-input"
                    v-model="settings.aiModel"
                    placeholder="model-name"
                    @change="onCustomModelChange"
                  />
                </div>

                <div
                  v-if="settings.aiProvider !== 'custom'"
                  class="setting-section"
                >
                  <label>模型</label>
                  <div class="current-model">
                    {{ getEffectiveConfig().model }}
                  </div>
                </div>

                <div class="setting-section">
                  <label
                    >API 密钥（{{
                      getProviderLabel(settings.aiProvider)
                    }}）</label
                  >
                  <div class="api-key-row">
                    <input
                      class="form-input"
                      v-model="apiKeyInput"
                      type="password"
                      :placeholder="keyPlaceholder"
                    />
                    <button class="btn btn-primary" @click="saveApiKey">
                      保存
                    </button>
                  </div>
                  <div
                    v-if="apiKeyMsg"
                    class="api-key-msg"
                    :class="{ success: apiKeyMsg.startsWith('✓') }"
                  >
                    {{ apiKeyMsg }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 删除保护 -->
            <div class="settings-group">
              <div class="settings-group-title">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/>
                </svg>
                删除保护
              </div>
              <div class="settings-group-body">
                <div class="setting-section">
                  <div class="setting-row">
                    <label>启用删除密码</label>
                    <label class="toggle-switch">
                      <input type="checkbox" v-model="settings.deletePasswordEnabled" @change="saveSettings" />
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                <div v-if="settings.deletePasswordEnabled" class="setting-section">
                  <label>删除密码</label>
                  <input class="form-input" v-model="deletePasswordInput" type="password" placeholder="设置删除密码" @change="onDeletePasswordChange" />
                </div>
              </div>
            </div>

            <!-- 快捷网站 -->
            <div class="settings-group">
              <div class="settings-group-title">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="currentColor"
                >
                  <path
                    d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 015.08 16zm2.95-8H5.08a7.987 7.987 0 014.33-3.56A15.65 15.65 0 008.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"
                  />
                </svg>
                快捷网站
              </div>
              <div class="settings-group-body">
                <div class="setting-section">
                  <div class="site-list">
                    <div
                      v-for="(site, i) in settings.websites"
                      :key="i"
                      class="site-item"
                    >
                      <span class="site-title">{{ site.title }}</span>
                      <button
                        class="site-remove"
                        @click="removeWebsite(i)"
                        title="删除"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                  <button
                    class="add-site-btn-inline"
                    @click="showAddSite = true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="currentColor"
                    >
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    添加网站
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-footer">
            <button class="btn btn-ghost" @click="resetDefaults">
              恢复默认
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <div
      v-if="showAddSite"
      class="modal-overlay"
      @click.self="showAddSite = false"
    >
      <div class="add-site-panel">
        <div class="settings-header">
          <span>添加网站</span>
          <button class="settings-close" @click="showAddSite = false">
            &times;
          </button>
        </div>
        <div class="settings-body">
          <div class="setting-section">
            <label>网站名称</label>
            <input
              v-model="newSiteTitle"
              class="site-input"
              placeholder="例如：MDN"
            />
          </div>
          <div class="setting-section">
            <label>网址</label>
            <input
              v-model="newSiteUrl"
              class="site-input"
              placeholder="https://"
            />
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
import {
  settings,
  saveSettings,
  applyTheme,
  providerPresets,
  getEffectiveConfig,
} from "../store/settings";

const props = defineProps({
  modelValue: String,
  simple: Boolean,
  homeLabel: { type: String, default: "首页" },
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
  "#8bb174",
  "#4a90d9",
  "#9b59b6",
  "#e74c3c",
  "#f39c12",
  "#1abc9c",
  "#2c3e50",
  "#e91e63",
];

const bgColors = [
  "#f5f5f7",
  "#ffffff",
  "#f0f4f8",
  "#fef9ef",
  "#f5f0eb",
  "#e8f5e9",
  "#e3f2fd",
];

const titleColors = [
  "#2c3e50",
  "#1a1a2e",
  "#333333",
  "#000000",
  "#8bb174",
  "#4a90d9",
  "#9b59b6",
  "#c0392b",
];

const contentColors = [
  "#333333",
  "#444444",
  "#555555",
  "#666666",
  "#2c3e50",
  "#4a3728",
  "#1a1a1a",
  "#3d3d3d",
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
  "#fafaf5",
  "#f5f0eb",
  "#fef9ef",
  "#e8f5e9",
  "#f0f4f8",
  "#fff8e1",
  "#fce4ec",
  "#ffffff",
];

const titleSizes = [
  "14px",
  "15px",
  "16px",
  "17px",
  "18px",
  "20px",
  "22px",
  "24px",
  "28px",
];
const contentSizes = [
  "12px",
  "13px",
  "14px",
  "15px",
  "16px",
  "17px",
  "18px",
  "20px",
];

const primaryHex = ref(settings.primaryColor);
const titleHex = ref(settings.titleColor);
const contentHex = ref(settings.contentColor);
const handwritingHex = ref(settings.handwritingBg);
const apiKeyInput = ref("");
const apiKeyMsg = ref("");
const deletePasswordInput = ref(settings.deletePassword);

const providerList = Object.entries(providerPresets).map(([id, cfg]) => ({
  id,
  label: cfg.label,
}));

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
  if (
    (provider === "openai" || provider === "deepseek") &&
    !key.startsWith("sk-")
  ) {
    apiKeyMsg.value = "密钥格式不正确";
    return;
  }
  settings.deepseekKey = key;
  saveSettings();
  apiKeyMsg.value = "✓ 已保存";
  setTimeout(() => {
    apiKeyMsg.value = "";
  }, 2000);
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

function onDeletePasswordChange() {
  const val = deletePasswordInput.value.trim();
  if (val) {
    settings.deletePassword = val;
    saveSettings();
  }
}

function resetDefaults() {
  localStorage.removeItem("pnt-settings");
  location.reload();
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
  background: rgba(255, 255, 255, 0.2);
  border: 1px dashed rgba(255, 255, 255, 0.5);
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
  background: rgba(255, 255, 255, 0.35);
}

/* ── Modal Overlay ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 60px;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

/* ── Settings Panel ── */
.settings-panel {
  background: #fff;
  border-radius: 16px;
  width: 440px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  animation: panelIn 0.25s ease;
}

@keyframes panelIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.settings-title {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
}

.settings-close {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #bbb;
  padding: 0 6px;
  line-height: 1;
  border-radius: 6px;
  transition: all 0.2s;
}
.settings-close:hover {
  color: #333;
  background: #f5f5f5;
}

.settings-body {
  padding: 8px 0;
  flex: 1;
  overflow-y: auto;
}

/* ── Settings Groups ── */
.settings-group {
  margin: 0 0 4px;
}

.settings-group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.settings-group-body {
  padding: 0 24px;
}

.setting-section {
  margin-bottom: 16px;
}

.setting-section label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  margin-bottom: 6px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.setting-row label {
  margin-bottom: 0;
}

/* ── Color Swatches ── */
.color-swatches {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.swatch {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.swatch:hover {
  transform: scale(1.18);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.swatch.active {
  border-color: #333;
  box-shadow:
    0 0 0 2px #fff,
    0 0 0 3.5px #333;
}

/* ── Form Controls ── */
.font-select,
.form-input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  background: #fff;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  box-sizing: border-box;
}
.font-select:focus,
.form-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);
}
.form-input::placeholder {
  color: #bbb;
}

/* ── Color Row ── */
.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hex-input {
  width: 78px;
  padding: 6px 8px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 12px;
  font-family: monospace;
  text-align: center;
  flex-shrink: 0;
  outline: none;
  transition: border-color 0.2s;
}
.hex-input:focus {
  border-color: var(--primary);
}

/* ── Toggle Switch ── */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.toggle-switch input:checked + .toggle-slider {
  background: var(--primary);
}
.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

/* ── API Key ── */
.api-key-row {
  display: flex;
  gap: 8px;
}
.api-key-msg {
  font-size: 12px;
  margin-top: 4px;
  color: #e74c3c;
}
.api-key-msg.success {
  color: var(--primary);
}

/* ── Buttons ── */
.btn {
  padding: 9px 18px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-primary {
  background: var(--primary);
  color: #fff;
}
.btn-primary:hover {
  opacity: 0.88;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--primary) 40%, transparent);
}
.btn-ghost {
  background: transparent;
  color: #999;
  border: 1px solid #e0e0e0;
}
.btn-ghost:hover {
  background: #f5f5f5;
  color: #666;
}

/* ── Current Model Display ── */
.current-model {
  padding: 9px 12px;
  background: #f7f7f7;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
  font-family: monospace;
  border: 1px solid #eee;
}

/* ── Website List ── */
.site-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.site-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f8f8;
  border-radius: 8px;
  font-size: 14px;
  transition: background 0.2s;
}
.site-item:hover {
  background: #f0f0f0;
}

.site-remove {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #ccc;
  padding: 0 4px;
  line-height: 1;
  border-radius: 4px;
  transition: all 0.2s;
}
.site-remove:hover {
  color: #e74c3c;
  background: #fee;
}

.add-site-btn-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #f8f8f8;
  border: 1.5px dashed #d0d0d0;
  border-radius: 8px;
  font-size: 13px;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}
.add-site-btn-inline:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: #f5faf5;
}

/* ── Settings Footer ── */
.settings-footer {
  padding: 12px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Add Site Sub-panel ── */
.add-site-panel {
  background: #fff;
  border-radius: 16px;
  width: 380px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  animation: panelIn 0.2s ease;
  padding: 12px 24px;
}
.site-input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.site-input:focus {
  border-color: var(--primary);
}
.add-site-confirm {
  width: 100%;
  padding: 10px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.add-site-confirm:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

/* ── Scrollbar ── */
.settings-panel::-webkit-scrollbar,
.settings-body::-webkit-scrollbar {
  width: 4px;
}
.settings-panel::-webkit-scrollbar-thumb,
.settings-body::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}
.settings-panel::-webkit-scrollbar-track,
.settings-body::-webkit-scrollbar-track {
  background: transparent;
}
</style>
