<template>
  <!-- 测量层：只量选项自然宽度 -->
  <div ref="measureRef" class="options-measure" aria-hidden="true">
    <span
      v-for="(option, index) in options"
      :key="'m-' + index"
      ref="measureItemsRef"
      v-html="option"
    ></span>
  </div>

  <!-- 正式渲染层：容器宽度的来源 -->
  <div ref="containerRef" class="options" :style="computedStyle">
    <span v-for="(option, index) in options" :key="index" v-html="option"></span>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'

const props = defineProps({
  options: { type: Array, required: true, default: () => [] },
  width: { type: String, default: null },
  // ✅ 新增：强制指定一行几个。不传（null / undefined）则自动布局
  columns: { type: Number, default: null }
})

const measureRef = ref(null)
const measureItemsRef = ref([])
const containerRef = ref(null)
const columns = ref(1)

function recalcColumns() {
  // ✅ 显式指定了每行数量，直接采用，跳过自动测量
  if (props.columns !== null && props.columns !== undefined) {
    columns.value = props.columns
    return
  }

  const container = containerRef.value
  const items = measureItemsRef.value || []
  if (!container || items.length === 0) return

  const containerWidth = container.clientWidth
  if (containerWidth === 0) return

  const itemWidths = items.map((el) => el.offsetWidth)

  const candidates = [4, 2, 1]
  let finalColumns = 1
  for (const n of candidates) {
    const effectiveN = Math.min(n, props.options.length)
    const threshold = containerWidth / effectiveN
    const overflow = itemWidths.some((w) => w > threshold)
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

  // 自动布局时才需要监听尺寸变化
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

// options 变化时重新测量（自动布局下才有意义，但强制模式下也顺手同步一下）
watch(
  () => props.options,
  async () => {
    await nextTick()
    recalcColumns()
  },
  { deep: true }
)

// ✅ columns 变化时立即应用
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