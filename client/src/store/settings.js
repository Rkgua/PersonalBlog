import { reactive } from "vue";

const STORAGE_KEY = "pnt-settings";

const defaults = {
  primaryColor: "#8bb174",
  fontFamily: "'Segoe UI', 'Microsoft YaHei', sans-serif",
  textColor: "#333333",
  bgColor: "#f5f5f7",
  showQA: true,
  deepseekKey: "",
  aiProvider: "deepseek",
  aiEndpoint: "",
  aiModel: "",
  titleColor: "#2c3e50",
  contentColor: "#333333",
  titleSize: "16px",
  contentSize: "15px",
  handwritingFont: "'KaiTi', '楷体', serif",
  handwritingBg: "#fafaf5",
  deletePasswordEnabled: true,
  deletePassword: "123456",
  websites: [
    { title: "JS工具", url: "https://js-web-runner.mereith.com" },
    { title: "菜鸟教程", url: "https://www.runoob.com/" },
  ],
};

const providerPresets = {
  deepseek: {
    label: "DeepSeek",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    model: "deepseek-chat",
    type: "openai",
  },
  openai: {
    label: "OpenAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    type: "openai",
  },
  groq: {
    label: "Groq",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama-3.3-70b-versatile",
    type: "openai",
  },
  together: {
    label: "Together AI",
    endpoint: "https://api.together.xyz/v1/chat/completions",
    model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    type: "openai",
  },
  anthropic: {
    label: "Anthropic Claude",
    endpoint: "https://api.anthropic.com/v1/messages",
    model: "claude-sonnet-4-20250520",
    type: "anthropic",
  },
  custom: {
    label: "自定义",
    endpoint: "",
    model: "",
    type: "openai",
  },
};

function getEffectiveConfig() {
  const preset = providerPresets[settings.aiProvider];
  if (!preset) return providerPresets.deepseek;
  return {
    ...preset,
    endpoint: settings.aiEndpoint || preset.endpoint,
    model: settings.aiModel || preset.model,
  };
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaults, ...JSON.parse(saved) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

const settings = reactive(loadSettings());

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings }));
}

function applyTheme() {
  const root = document.documentElement;
  root.style.setProperty("--primary", settings.primaryColor);
  root.style.setProperty("--text", settings.textColor);
  root.style.setProperty("--light-bg", settings.bgColor);
  root.style.setProperty("--title-color", settings.titleColor);
  root.style.setProperty("--content-color", settings.contentColor);
  root.style.setProperty("--title-size", settings.titleSize);
  root.style.setProperty("--content-size", settings.contentSize);
  root.style.setProperty("--handwriting-font", settings.handwritingFont);
  root.style.setProperty("--handwriting-bg", settings.handwritingBg);
  document.body.style.fontFamily = settings.fontFamily;
}

export { settings, saveSettings, applyTheme, providerPresets, getEffectiveConfig };
