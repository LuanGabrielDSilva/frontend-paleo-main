<script setup lang="ts">
import { ref, onMounted } from "vue";
import api from "../services/api";

const animals = ref<any[]>([]);

onMounted(async () => {
  const res = await api.get("/animals");
  animals.value = res.data;
});
</script>

<template>
  <div>
    <h2>🦖 Animais</h2>

    <div v-for="a in animals" :key="a.id" class="card">
      <h3>{{ a.name }}</h3>
      <p><strong>Tipo:</strong> {{ a.type }}</p>
      <p v-if="a.description">{{ a.description }}</p>
    </div>
  </div>
</template>

<style scoped>
.card {
  border: 1px solid #ddd;
  margin: 10px;
  padding: 15px;
  border-radius: 8px;
}
</style>