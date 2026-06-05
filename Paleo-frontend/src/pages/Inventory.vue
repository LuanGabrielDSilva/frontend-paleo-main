<script setup lang="ts">
import { ref, onMounted } from "vue";
import { InventoryService } from "../services/inventory.service";

const items = ref<any[]>([]);

const load = async () => {
  items.value = await InventoryService.getInventory();
};

onMounted(load);
</script>

<template>
  <div class="inventory">

    <h1>🎒 Inventário</h1>

    <div class="grid">

      <div
        v-for="i in items"
        :key="i.id"
        class="item"
      >

        <h3>{{ i.product.name }}</h3>

        <p>Qtd: {{ i.quantity }}</p>

      </div>

    </div>

  </div>
</template>

<style scoped>
.inventory {
  padding: 40px;
  color: white;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.item {
  padding: 16px;
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
}
</style>