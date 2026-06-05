<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ShopService, Product } from "../services/shop.service";

const products = ref<Product[]>([]);
const loading = ref(false);

const loadProducts = async () => {
  loading.value = true;

  try {
    products.value = await ShopService.listProducts();
  } finally {
    loading.value = false;
  }
};

const addToCart = async (id: string) => {
  await ShopService.addToCart(id);
  alert("Adicionado ao carrinho 🛒");
};

onMounted(loadProducts);
</script>

<template>
  <div class="shop">

    <h1>🏪 Loja Jurássica</h1>

    <p v-if="loading">Carregando produtos...</p>

    <div class="grid">

      <div
        v-for="p in products"
        :key="p.id"
        class="card"
      >

        <img v-if="p.image" :src="p.image" />

        <h2>{{ p.name }}</h2>

        <p>{{ p.description }}</p>

        <strong>💰 R$ {{ p.price }}</strong>

        <button @click="addToCart(p.id)">
          Comprar
        </button>

      </div>

    </div>

  </div>
</template>

<style scoped>
.shop {
  padding: 40px;
  background: #0b0805;
  color: #f5e6c8;
  min-height: 100vh;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.card {
  padding: 16px;
  border-radius: 14px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(212,175,55,0.2);
}

.card img {
  width: 100%;
  border-radius: 10px;
  margin-bottom: 10px;
}

button {
  margin-top: 10px;
  width: 100%;
  padding: 10px;
  background: gold;
  border: none;
  cursor: pointer;
}
</style>