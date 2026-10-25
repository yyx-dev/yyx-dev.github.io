<template>
  <details ref="detailsRef" class="analysis-details" :open="defaultOpen" @toggle="handleToggle">
    <summary>【{{ title }}】</summary>
    <div class="analysis-content">
      <slot />
      <hr/>
    </div>
  </details>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  defaultTitle: { type: String, default: '' },
  defaultOpen: { type: Boolean, default: false },
  openWhenPrint: { type: Boolean, default: false },
})

const title = computed(() => props.defaultTitle || '分析')
const isOpen = ref(props.defaultOpen)
const detailsRef = ref(null)

const handleToggle = (event) => {
  isOpen.value = event.target.open
}

// 记录打印前的状态，打印后恢复
let openBeforePrint = false

const handleBeforePrint = () => {
  if (!props.openWhenPrint) return
  openBeforePrint = detailsRef.value?.open ?? false
  if (detailsRef.value) detailsRef.value.open = true
}

const handleAfterPrint = () => {
  if (!props.openWhenPrint) return
  if (detailsRef.value) detailsRef.value.open = openBeforePrint
}

onMounted(() => {
  window.addEventListener('beforeprint', handleBeforePrint)
  window.addEventListener('afterprint', handleAfterPrint)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeprint', handleBeforePrint)
  window.removeEventListener('afterprint', handleAfterPrint)
})
</script>

<style scoped>
.analysis-details {
  margin: 16px 0;
  font-family: var(--font-family-analysis);
}

.analysis-details summary {
  margin: 0;
  user-select: none;
  list-style: none;
}

.analysis-details summary::-webkit-details-marker {
  display: none;
}

</style>
