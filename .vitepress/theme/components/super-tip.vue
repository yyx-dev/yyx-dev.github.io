<template>
  <span class="tip">
    <slot />
  </span>
</template>

<style scoped>
.tip {
  background-color: var(--tip-bg);
  color: var(--tip-color);
}
</style>
