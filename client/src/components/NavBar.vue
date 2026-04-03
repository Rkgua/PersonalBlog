<template>
  <div class="top-bar">
    <!-- 标题搜索框：使用 v-model 双向绑定标题搜索关键词 -->
    <input
      type="text"
      placeholder="搜索你感兴趣的文章标题..."
      v-model="titleSearchQuery"
      @input="onTitleSearch"
    />
    <slot name="action"></slot>
  </div>

  <div class="nav-bar">
    <router-link to="/">首页</router-link>
    <a href="	https://js-web-runner.mereith.com" target="_blank">JS工具</a>
    <a href="https://www.runoob.com/" target="_blank">菜鸟教程</a>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";

/**
 * defineProps - Vue 3 Composition API
 * 用于接收父组件传递的 props
 *
 * modelValue: 当前选中的分类（由父组件控制）
 */
const props = defineProps({
  modelValue: String,
});

/**
 * defineEmits - Vue 3 Composition API
 * 定义组件可以触发的事件
 *
 * 'update:modelValue': v-model 语法糖，用于双向绑定
 */
const emit = defineEmits(["update:modelValue"]);

/**
 * useRoute - Vue Router 钩子
 * 获取当前路由信息，用于读取 URL query 参数
 */
const route = useRoute();

/**
 * titleSearchQuery - 响应式变量
 * 存储用户输入的标题搜索关键词
 * ref() 创建响应式引用，值变化会自动更新视图
 */
const titleSearchQuery = ref("");

/**
 * selectedCategory - 计算属性
 * 双重职责：
 * 1. get: 读取当前选中分类（优先props，其次URL参数，默认"全部"）
 * 2. set: 当分类变化时，通过emit通知父组件更新
 */
const selectedCategory = computed({
  get: () => props.modelValue || route.query.category || "全部",
  set: (val) => emit("update:modelValue", val),
});

/**
 * onTitleSearch - 搜索事件处理函数
 * 当用户在搜索框输入时触发，通知父组件执行搜索
 */
const onTitleSearch = () => {
  /**
   * $emit 触发父组件的事件
   * 'title-search': 自定义事件名
   * titleSearchQuery.value: 传递搜索关键词给父组件
   *
   * 注意：ref 对象的值通过 .value 访问
   */
  emit("title-search", titleSearchQuery.value);
};

/**
 * defineExpose - Vue 3 Composition API
 * 指定哪些属性/方法可以暴露给父组件通过模板 ref 访问
 *
 * 父组件可以通过 ref 访问这些属性
 */
defineExpose({ titleSearchQuery, selectedCategory });
</script>

<style>
.top-bar {
  background: #fff;
  padding: 12px 20px;
  text-align: right;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.top-bar input {
  width: 300px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 14px;
}

.nav-bar {
  background-color: var(--primary);
  display: flex;
  align-items: center;
  height: 50px;
  width: 100%;
}
.nav-bar a,
.nav-bar router-link {
  color: #fff;
  text-decoration: none;
  padding: 0 16px;
  font-size: 14px;
  transition: opacity 0.3s;
}
.nav-bar a:hover,
.nav-bar router-link:hover {
  opacity: 0.8;
}
</style>
