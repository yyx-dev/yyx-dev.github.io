<template>
  <details class="analysis-details" :open="isOpen" @toggle="handleToggle">
    <summary>
      【{{ displayTitle }}】
    </summary>
    <div class="analysis-content">
      <slot />
      <hr/>
    </div>
  </details>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  }
})

const isOpen = ref(false)

const handleToggle = (event) => {
  isOpen.value = event.target.open
}

const displayTitle = computed(() => {
  return props.title || '分析'
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
