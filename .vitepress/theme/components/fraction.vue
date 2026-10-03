<template>
  <span class="fraction">
    <span v-if="left" class="left">{{ left }} =</span>
    <span class="frac">
      <span class="num">{{ num }}</span>
      <span class="den">{{ den }}</span>
    </span>
  </span>
</template>

<script setup>
defineProps({
  num: { type: String, required: true },
  den: { type: String, required: true },
  left: { type: String, default: '' }
})
</script>

<style scoped>
.fraction {
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  vertical-align: middle;
}

.frac {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  vertical-align: middle;
}

.frac .num,
.frac .den {
  padding: 0 0.4em;
  line-height: 1.2;
  font-size: 0.9em;
}

.frac .num {
  border-bottom: 1px solid currentColor;
}
</style>