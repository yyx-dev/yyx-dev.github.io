<template>
  <button class="download-btn" @click="handleDownload" >
    {{ text }}
  </button>
</template>

<script setup>
const props = defineProps({
  files: {
    type: Array,
    required: true
  },
  text: {
    type: String,
    default: "下载"
  },
});

function handleDownload() {
  props.files.forEach((url, i) => {
    setTimeout(() => {
      const a = document.createElement("a");
      a.href = url;
      a.download = url.split("/").pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, i * 500);
  });
}
</script>

<style scoped>
.download-btn {
  font-size: 16px;
  text-decoration: underline;
}
</style>