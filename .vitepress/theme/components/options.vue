<template>
  <div class="options" :style="computedStyle">
    <span v-for="option in options" :key="option" v-html="option"></span>
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

const computedStyle = computed(() => {
  const count = props.options.length

  // 列数：1 个选项占满整行，2 个选项两列，4 个选项四列，其它情况按 1 列处理或自行调整
  let columns = 1
  if (count === 2) columns = 2
  else if (count === 4) columns = 4

  const style = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
  }

  if (props.width !== null) {
    style.width = props.width
  }

  return style
})
</script>

<style scoped>
.options {
  display: grid;
  width: 100%;
  padding-left: 20px;
  box-sizing: border-box;
}

.options > span {
  text-align: left;
}
</style>