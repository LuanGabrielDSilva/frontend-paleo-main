<template>
  <div class="inventory">
    <h1>🎒 Meu Inventário</h1>

    <div v-if="items.length === 0">
      Nenhum item comprado ainda.
    </div>

    <div v-else class="grid">
      <div v-for="item in items" :key="item.id" class="card">
        <h3>{{ item.product.name }}</h3>
        <p>Quantidade: {{ item.quantity }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import api from "../../services/api";

const items = ref<any[]>([]);

onMounted(async () => {
  const res = await api.get("/inventory");
  items.value = res.data;
});
</script>

<style scoped>
.inventory {
  padding: 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.card {
  padding: 10px;
  background: #222;
  color: white;
  border-radius: 8px;
}
</style>