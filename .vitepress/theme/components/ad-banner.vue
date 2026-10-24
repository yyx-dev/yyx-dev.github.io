<template>
  <div ref="adRef" class="adsterra-banner">
  </div>
</template>

<style scoped>
.adsterra-banner {
  display: flex;
  justify-content: center;
  margin: 16px 0;
  min-height: 300px;
}
</style>

<script setup>
import { onMounted, ref } from 'vue'

const adRef = ref(null)

onMounted(() => {
  window.atOptions = {
    key: '8269abba1e9f41736859fe717cc21f9e',
    format: 'iframe',
    height: 300,
    width: 160,
    params: {}
  }

  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = 'https://bauval.org/22/8269abba1e9f41736859fe717cc21f9e'
  script.async = true
  adRef.value?.appendChild(script)
})
</script>
