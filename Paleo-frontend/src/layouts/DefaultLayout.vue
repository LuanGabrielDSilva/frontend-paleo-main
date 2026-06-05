<template>
  <div class="default-layout">
    <Header />
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import Header from "@/components/Header.vue";
</script>

<style scoped>
.default-layout {
  min-height: 100vh;
}

.content {
  padding: 20px;
}
</style>