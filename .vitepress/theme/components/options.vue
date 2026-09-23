<template>
  <div ref="measureRef" class="options-measure" aria-hidden="true">
    <span
      v-for="(option, index) in options"
      :key="'m-' + index"
      ref="measureItemsRef"
      v-html="option"
    ></span>
  </div>

  <div ref="containerRef" class="options" :style="computedStyle">
    <span v-for="(option, index) in options" :key="index" v-html="option"></span>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'

const props = defineProps({
  options: { type: Array, required: true, default: () => [] },
  width:   { type: String, default: null },
  columns: { type: Number, default: null },
  ratio:   { type: Number, default: 0.95 },
})

const measureRef = ref(null)
const measureItemsRef = ref([])
const containerRef = ref(null)
const columns = ref(1)

function recalcColumns() {
  if (props.columns !== null && props.columns !== undefined) {
    columns.value = props.columns
    return
  }

  const container = containerRef.value
  const items = measureItemsRef.value || []
  if (!container || items.length === 0) return

  const style = getComputedStyle(container)
  const paddingLeft = parseFloat(style.paddingLeft) || 0
  const paddingRight = parseFloat(style.paddingRight) || 0
  const containerWidth = container.clientWidth - paddingLeft - paddingRight
  if (containerWidth <= 0) return

  const itemWidths = items.map((el) => el.offsetWidth)

  const candidates = [5, 4, 2, 1]
  let finalColumns = 1
  for (const n of candidates) {
    const effectiveN = Math.min(n, props.options.length)
    const threshold = (containerWidth / effectiveN) * props.ratio;
    const overflow = itemWidths.some((w) => w > threshold)
        console.log(`候选 ${effectiveN} 列, threshold = ${threshold}px, 选项宽度 =`, itemWidths)

    if (!overflow) {
      finalColumns = effectiveN
      break
    }
  }

  columns.value = finalColumns
}

const computedStyle = computed(() => {
  const style = {
    gridTemplateColumns: `repeat(${columns.value}, minmax(0, 1fr))`
  }
  if (props.width !== null) style.width = props.width
  return style
})

let resizeObserver = null

onMounted(async () => {
  await nextTick()
  recalcColumns()

  if (props.columns === null || props.columns === undefined) {
    if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
      resizeObserver = new ResizeObserver(() => recalcColumns())
      resizeObserver.observe(containerRef.value)
    } else {
      window.addEventListener('resize', recalcColumns)
    }
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  } else {
    window.removeEventListener('resize', recalcColumns)
  }
})

watch(
  () => props.options,
  async () => {
    await nextTick()
    recalcColumns()
  },
  { deep: true }
)

watch(
  () => props.columns,
  () => {
    recalcColumns()
  }
)
</script>

<style scoped>
.options-measure {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  height: 0;
  overflow: hidden;
  white-space: nowrap;
  left: -9999px;
  top: 0;
}

.options-measure > span {
  display: inline-block;
  white-space: nowrap;
}

.options {
  display: grid;
  width: 100%;
  padding-left: 10px;
  box-sizing: border-box;
  margin: 16px 0;
}

.options > span {
  text-align: left;
  overflow-wrap: anywhere;
}
</style>