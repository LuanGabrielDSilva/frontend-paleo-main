<script setup lang="ts">
import { ref, onMounted } from "vue";
import api from "../services/api";
import { RouterLink } from "vue-router";

const eras = ref<any[]>([]);

onMounted(async () => {
  try {
    const res = await api.get("/eras");
    eras.value = res.data;
  } catch (error) {
    console.error("Erro ao buscar eras:", error);
  }
});
</script>

<template>
  <div class="page">
    <!-- Decorative overlays -->
    <div class="grain"></div>
    <div class="vignette"></div>

    <div class="container">
      <header class="header">
        <span class="eyebrow">ARQUIVO GEOLÓGICO</span>
        <h1 class="title">Eras Geológicas</h1>
        <p class="subtitle">
          Uma jornada através do tempo profundo da Terra
        </p>
      </header>

      <div v-if="eras.length === 0" class="loading">
        <p>Carregando eras geológicas...</p>
      </div>

      <div v-else class="eras-grid">
        <RouterLink
          v-for="era in eras"
          :key="era.id"
          :to="`/eras/${era.name.toLowerCase()}`"
          class="era-card"
        >
          <div class="image-wrapper">
            <img
              v-if="era.image"
              :src="era.image"
              :alt="era.name"
              class="era-image"
            />
            <div class="image-overlay"></div>
          </div>

          <div class="card-content">
            <span class="era-period">{{ era.period || 'Era' }}</span>
            <h3>{{ era.name }}</h3>
            <p class="description">{{ era.description }}</p>
            
            <div class="card-footer">
              <span class="explore">Explorar →</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@300;400&display=swap');

.page {
  min-height: 100vh;
  background: #0a0604;
  color: #f5e6c8;
  position: relative;
  overflow-x: hidden;
  font-family: 'Cormorant Garamond', Georgia, serif;
}

/* Grain & Vignette */
.grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0.35;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.85 0 0 0 0 0.7 0 0 0 0 0.4 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}

.vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.65) 100%);
}

.container {
  position: relative;
  z-index: 3;
  max-width: 1280px;
  margin: 0 auto;
  padding: clamp(80px, 10vw, 140px) clamp(40px, 6vw, 80px);
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 100px;
}

.eyebrow {
  display: block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  letter-spacing: 0.35em;
  color: #d4af37;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.title {
  font-family: 'Cinzel', serif;
  font-size: clamp(3.2rem, 7vw, 5.5rem);
  font-weight: 600;
  background: linear-gradient(180deg, #fff5d6 0%, #d4af37 60%, #8a6a1f 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 20px;
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: 1.25rem;
  color: #d3c39b;
  max-width: 600px;
  margin: 0 auto;
  font-style: italic;
}

/* Grid */
.eras-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
}

/* Card */
.era-card {
  text-decoration: none;
  color: inherit;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(212, 175, 55, 0.18);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  backdrop-filter: blur(8px);
}

.era-card:hover {
  transform: translateY(-12px);
  border-color: #d4af37;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.6);
}

.image-wrapper {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.era-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.8s ease;
}

.era-card:hover .era-image {
  transform: scale(1.08);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(10, 6, 4, 0.85), transparent 50%);
}

.card-content {
  padding: 28px 24px 32px;
}

.era-period {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.25em;
  color: #d4af37;
  text-transform: uppercase;
  margin-bottom: 8px;
  display: block;
}

.card-content h3 {
  font-family: 'Cinzel', serif;
  font-size: 1.55rem;
  color: #f1d98a;
  margin: 0 0 12px;
  letter-spacing: 0.01em;
}

.description {
  color: #b8a578;
  line-height: 1.7;
  font-size: 1.02rem;
  margin-bottom: 20px;
  font-style: italic;
}

.card-footer {
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  padding-top: 16px;
}

.explore {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: #d4af37;
  letter-spacing: 0.1em;
  transition: color 0.3s ease;
}

.era-card:hover .explore {
  color: #f1d98a;
}

/* Loading */
.loading {
  text-align: center;
  padding: 80px 20px;
  color: #b8a578;
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .eras-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .image-wrapper {
    height: 180px;
  }
}
</style>