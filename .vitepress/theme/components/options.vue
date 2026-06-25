<template>
  <div class="options" :style="{ width: computedWidth }">
    <span v-for="option in options" :key="option" v-html="option">
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  options: {
    type: Array,
    required: true,
    default: () => []
  },
  width: {
    type: String,
    default: null
  }
})

const computedWidth = computed(() => {
  if (props.width !== null) {
    return props.width
  }

  const count = props.options.length
  if (count === 1) {
    return '100%'
  } else if (count === 2) {
    return '75%'
  } else if (count === 4) {
    return '85%'
  } else {
    return '85%'
  }
})
</script>

<style scoped>
.options {
  display: flex;
  justify-content: space-between;
  padding-left: 10px;
  font-family: var(--vp-font-family-question);
}
</style>