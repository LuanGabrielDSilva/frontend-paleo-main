<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import api from "../services/api";

const route = useRoute();

const era = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const id = route.params.id;

    const res = await api.get(`/eras/${id}`);

    era.value = res.data;
  } catch (error) {
    console.error("Erro ao carregar era:", error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="page">

    <!-- LOADING -->
    <div v-if="loading" class="loading">
      <p>Carregando era...</p>
    </div>

    <!-- ERA -->
    <div v-else-if="era" class="container">

      <img
        v-if="era.image"
        :src="era.image"
        :alt="era.name"
        class="banner"
      />

      <div class="content">

        <p class="eyebrow">ERA GEOLÓGICA</p>

        <h1>{{ era.name }}</h1>

        <p class="description">
          {{ era.description }}
        </p>

      </div>
    </div>

    <!-- NÃO ENCONTRADA -->
    <div v-else class="not-found">
      <h2>Era não encontrada</h2>
    </div>

  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, #2b1808 0%, #090909 70%);
  color: #f5e6c8;
  padding: 40px;
}

.loading,
.not-found {
  text-align: center;
  padding: 100px 20px;
}

.container {
  max-width: 1200px;
  margin: auto;
}

.banner {
  width: 100%;
  height: 420px;
  object-fit: cover;
  border-radius: 20px;
  border: 1px solid rgba(212,175,55,0.2);
  margin-bottom: 30px;
}

.content {
  max-width: 900px;
}

.eyebrow {
  color: #d4af37;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  font-size: 0.75rem;
  margin-bottom: 10px;
}

h1 {
  font-size: 4rem;
  font-family: "Cinzel", serif;
  margin-bottom: 20px;
  color: #f1d98a;
}

.description {
  line-height: 1.8;
  font-size: 1.1rem;
  color: #d7c49a;
}
</style>