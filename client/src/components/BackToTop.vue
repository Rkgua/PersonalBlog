<template>
  <button v-show="isVisible" class="back-to-top" @click="scrollToTop">
    <svg viewBox="0 0 24 24" width="24" height="24">
      <path
        fill="currentColor"
        d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"
      />
    </svg>
  </button>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";

const isVisible = ref(false);
const scrollThreshold = 300;

const updateVisibility = () => {
  isVisible.value = window.scrollY > scrollThreshold;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
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
.back-to-top {
  position: fixed;
  bottom: 30px;
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
  transition: transform 0.3s, opacity 0.3s;
  z-index: 999;
}

.back-to-top:hover {
  transform: scale(1.1);
}
</style>
