<template>
  <div class="muted-block">
    <slot />
  </div>
</template>

<style scoped>

.muted-block {
  position: relative;
}

.muted-block :deep(:is(
  h1, h2, h3, h4, h5, h6,
  p, li, strong, em, span,
  a, td, th, blockquote, hr
)) {
  color: rgba(60, 60, 67, 0.45);
}

.muted-block :deep(img) {
  filter: opacity(0.6);
}

.muted-block::after {
  content: '不重要内容';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  font-size: clamp(2rem, 8vw, 6rem);
  font-weight: 900;
  letter-spacing: 0.15em;
  white-space: nowrap;

  color: rgba(60, 60, 67, 0.06);
  pointer-events: none;
  user-select: none;
  z-index: 1;
}
</style>