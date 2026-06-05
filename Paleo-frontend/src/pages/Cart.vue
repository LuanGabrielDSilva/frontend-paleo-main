<script setup lang="ts">
import { ref, onMounted } from "vue";
import { CartService } from "../services/cart.service";

const cart = ref<any>(null);

const loadCart = async () => {
  cart.value = await CartService.getCart();
};

const remove = async (id: string) => {
  await CartService.removeItem(id);
  loadCart();
};

onMounted(loadCart);
</script>

<template>
  <div class="cart">

    <h1>🛒 Carrinho</h1>

    <div v-if="!cart?.items?.length">
      Carrinho vazio 😢
    </div>

    <div v-else>

      <div
        v-for="item in cart.items"
        :key="item.id"
        class="item"
      >

        <span>{{ item.product.name }}</span>

        <span>x{{ item.quantity }}</span>

        <button @click="remove(item.id)">
          ❌
        </button>

      </div>

    </div>

  </div>
</template>

<style scoped>
.cart {
  padding: 40px;
  color: white;
}

.item {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
}
</style>