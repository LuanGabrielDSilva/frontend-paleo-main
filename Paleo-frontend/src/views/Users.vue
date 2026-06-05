<script setup lang="ts">
import { ref, onMounted } from "vue";
import api from "../services/api";

const users = ref<any[]>([]);

onMounted(async () => {
  const res = await api.get("/users");
  users.value = res.data;
});
</script>

<template>
  <div>
    <h2>👤 Usuários</h2>

    <div v-for="u in users" :key="u.id" class="card">
      <strong>{{ u.name }}</strong>
      <p>{{ u.email }}</p>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-bottom: 1px solid #eee;
  padding: 15px;
}
</style>