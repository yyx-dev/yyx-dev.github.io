<template>
  <div class="stress" :class="{ 'nobg': nobg }">
    <div class="content">
      <slot />
    </div>
    <span class="label">【{{ label }}】{{ title }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: '考点'
  },
  title: {
    type: String,
    default: ''
  },
  nobg: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.stress {
  position: relative;
  background-color: var(--stress-bg);
  transition: all 0.2s ease;
  border-radius: 2px;
}

.stress.nobg {
  background-color: transparent;
  pointer-events: none;
}

.label {
  position: absolute;
  top: 0px;
  right: 5px;
  color: var(--stress-color);
  font-size: 16px;
  font-weight: 600;
  font-family: var(--font-family-stress);
}

.stress:hover {
  box-shadow: 0 2px 8px var(--stress-hover);
}
</style>