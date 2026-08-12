<template>
  <span class="super-warning">
    <slot />
  </span>
</template>

<style scoped>
.super-warning {
  background-color: var(--super-warning-bg);
  color: var(--super-warning-color);
}
</style>
