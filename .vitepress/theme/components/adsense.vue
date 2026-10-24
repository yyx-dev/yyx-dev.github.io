<template>
  <div ref="adRef" class="adsense-container">
    <ins
      class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-9759530688796073"
      data-ad-slot="2032294557"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  </div>
</template>

<style scoped>
.adsense-container {
  margin: 16px 0;
  min-width: 100px;
  min-height: 100px;
  overflow: hidden;
}
</style>

<script setup>
import { onMounted, ref, nextTick } from 'vue'

const adRef = ref(null)

onMounted(() => {
  try {
    ;(window.adsbygoogle = window.adsbygoogle || []).push({})
  } catch (e) {
    console.error('AdSense error:', e)
  }
})
</script>
