<template>
  <div class="options" :style="{ width: width }">
    <span v-for="option in options" :key="option" v-html="option">
    </span>
  </div>
</template>

<script setup>
defineProps({
  options: {
    type: Array,
    required: true,
    default: () => []
  },
  width: {
    type: String,
    default: '85%'
  }
})
</script>

<style scoped>
.options {
  display: flex;
  justify-content: space-between;
  font-family: var(--vp-font-family-question);
}
</style>
