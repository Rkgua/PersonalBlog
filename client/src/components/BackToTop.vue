<template>
  <!-- 回到顶部 -->
  <button v-show="showTop" class="float-btn float-top" @click="scrollToTop" title="回到顶部">
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
    </svg>
  </button>
  <!-- 回到底部 -->
  <button v-show="showBottom" class="float-btn float-bottom" @click="scrollToBottom" title="回到底部">
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
    </svg>
  </button>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const showTop = ref(false);
const showBottom = ref(false);
const scrollThreshold = 300;

const updateVisibility = () => {
  const scrollY = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

  showTop.value = scrollY > scrollThreshold;
  showBottom.value = maxScroll > scrollThreshold && scrollY < maxScroll - scrollThreshold;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const scrollToBottom = () => {
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
};

onMounted(() => {
  window.addEventListener("scroll", updateVisibility);
  updateVisibility();
});

onUnmounted(() => {
  window.removeEventListener("scroll", updateVisibility);
});
</script>

<style scoped>
.float-btn {
  position: fixed;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition:
    transform 0.3s,
    opacity 0.3s;
  z-index: 999;
}

.float-btn:hover {
  transform: scale(1.1);
}

.float-top {
  bottom: 90px;
}

.float-bottom {
  bottom: 30px;
}
</style>
