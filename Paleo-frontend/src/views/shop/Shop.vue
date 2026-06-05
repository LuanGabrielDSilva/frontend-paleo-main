<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import api from "../../services/api";

import { useRouter } from "vue-router";

const router = useRouter();

const openProduct = (id: string | number) => {
  router.push(`/shop/${id}`);
};

const products = ref<any[]>([]);
const search = ref("");
const loading = ref(true);

const showSuccessModal = ref(false);
const lastAdded = ref<any>(null);

const load = async () => {
  loading.value = true;
  try {
    const { data } = await api.get("/products");
    products.value = data;
  } finally {
    loading.value = false;
  }
};

const add = async (product: any) => {
  await api.post("/cart/add", {
    product_id: product.id,
    quantity: 1,
  });
  lastAdded.value = product;
  showSuccessModal.value = true;
};

const closeModal = () => {
  showSuccessModal.value = false;
  lastAdded.value = null;
};

const fossilCode = (id: string | number) => {
  const n = String(id).replace(/\D/g, "").slice(-4).padStart(4, "0") || "0001";
  return `PAL-${n}`;
};

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim();

  let result = [...products.value];

  // filtro de busca
  if (q) {
    result = result.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }

  // ordenação alfabética
  result.sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR")
  );

  return result;
});

const totalItems = computed(() => products.value.length);

onMounted(load);
</script>

<template>
  <div class="shop">
    <!-- HERO -->
    <header class="hero">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <p class="kicker">⌘ Acervo Paleontológico</p>
        <h1>Loja do Explorador</h1>
        <p class="subtitle">
          Relíquias e artefatos cuidadosamente catalogados pelos curadores da expedição.
        </p>

        <div class="hero-meta">
          <div class="meta-item">
            <span class="meta-num">{{ totalItems }}</span>
            <span class="meta-label">Peças no acervo</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-num">∞</span>
            <span class="meta-label">Anos de história</span>
          </div>
        </div>

        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input
            v-model="search"
            type="text"
            placeholder="Buscar por relíquia, fóssil ou descrição..."
          />
        </div>
      </div>
    </header>

    <!-- LOADING -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Escavando o acervo...</p>
    </div>

    <!-- EMPTY -->
    <div v-else-if="!filtered.length" class="empty">
      <div class="empty-seal">🦖</div>
      <h3>Nenhuma relíquia encontrada</h3>
      <p>Tente ajustar sua busca pela expedição.</p>
    </div>

    <!-- GRID -->
    <section v-else class="products">
      <article
        class="card"
        v-for="p in filtered"
        :key="p.id"
      >
        <div class="corner tl"></div>
        <div class="corner tr"></div>
        <div class="corner bl"></div>
        <div class="corner br"></div>

        <div class="image-wrap">
          <img :src="p.image" :alt="p.name" class="product-image" />
          <div class="image-shade"></div>
          <span class="badge">{{ fossilCode(p.id) }}</span>
        </div>

        <div class="card-body">
          <h3>{{ p.name }}</h3>
          <p class="desc">{{ p.description }}</p>

          <div class="ornament">
            <span></span><span class="diamond">◆</span><span></span>
          </div>

          <div class="price-row">
            <span class="price-label">Valor da relíquia</span>
            <strong class="price">R$ {{ Number(p.price).toFixed(2) }}</strong>
          </div>

          <button class="buy" @click="openProduct(p.id)">
            <span class="buy-text">Adquirir Peça</span>
            <span class="buy-arrow">→</span>
          </button>
        </div>
      </article>
    </section>

    <!-- SUCCESS MODAL (Teleport) -->
    <Teleport to="body">
      <Transition name="pop">
        <div v-if="showSuccessModal" class="overlay" @click.self="closeModal">
          <div class="modal">
            <div class="corner tl"></div>
            <div class="corner tr"></div>
            <div class="corner bl"></div>
            <div class="corner br"></div>

            <div class="seal">✓</div>
            <h2>Relíquia Adquirida</h2>
            <div class="ornament">
              <span></span><span class="diamond">◆</span><span></span>
            </div>
            <p class="modal-text">
              <strong>{{ lastAdded?.name }}</strong> foi adicionada ao seu carrinho de expedição.
            </p>

            <div class="modal-actions">
              <button class="btn-ghost" @click="closeModal">Continuar Explorando</button>
              <button class="btn-primary" @click="closeModal">Ver Carrinho</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

.shop {
  padding: 40px 32px 80px;
  color: #f1d98a;
  min-height: 100vh;
  background:
    radial-gradient(ellipse at top, rgba(212, 175, 55, 0.08), transparent 60%),
    linear-gradient(180deg, #14100a 0%, #0d0a06 100%);
  font-family: 'Crimson Text', serif;
}

/* ===== HERO ===== */
.hero {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  padding: 60px 40px;
  margin-bottom: 50px;
  background: linear-gradient(145deg, #1f1810, #15100a);
  border: 1px solid rgba(212, 175, 55, 0.25);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), inset 0 0 60px rgba(212, 175, 55, 0.04);
}
.hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(212, 175, 55, 0.15), transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(168, 85, 50, 0.12), transparent 45%);
  pointer-events: none;
}
.hero-content { position: relative; z-index: 1; text-align: center; }
.kicker {
  font-family: 'Cinzel', serif;
  letter-spacing: 0.4em;
  font-size: 0.8rem;
  color: #d4af37;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.hero h1 {
  font-family: 'Cinzel', serif;
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  background: linear-gradient(135deg, #f1d98a 0%, #d4af37 50%, #b8941f 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin: 0 0 14px;
  letter-spacing: 0.05em;
}
.subtitle {
  color: #c8b890;
  font-style: italic;
  font-size: 1.1rem;
  max-width: 560px;
  margin: 0 auto 28px;
}
.hero-meta {
  display: inline-flex;
  align-items: center;
  gap: 28px;
  padding: 18px 32px;
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.25);
  margin-bottom: 28px;
}
.meta-item { display: flex; flex-direction: column; align-items: center; }
.meta-num {
  font-family: 'Cinzel', serif;
  font-size: 1.8rem;
  color: #d4af37;
  line-height: 1;
}
.meta-label {
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #8a7a5a;
  margin-top: 6px;
}
.meta-divider { width: 1px; height: 36px; background: rgba(212, 175, 55, 0.3); }

.search-wrap {
  position: relative;
  max-width: 500px;
  margin: 0 auto;
}
.search-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #d4af37;
}
.search-wrap input {
  width: 100%;
  padding: 14px 18px 14px 46px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 10px;
  color: #f1d98a;
  font-family: 'Crimson Text', serif;
  font-size: 1rem;
  transition: all 0.3s;
}
.search-wrap input:focus {
  outline: none;
  border-color: #d4af37;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
}

/* ===== GRID ===== */
.products {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 28px;
}

.card {
  position: relative;
  background: linear-gradient(145deg, #1e1810, #16120c);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  transition: transform 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
.card:hover {
  transform: translateY(-6px);
  border-color: rgba(212, 175, 55, 0.55);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 175, 55, 0.1);
}

/* ornamental corners */
.corner {
  position: absolute;
  width: 18px;
  height: 18px;
  border-color: #d4af37;
  border-style: solid;
  border-width: 0;
  opacity: 0.7;
}
.corner.tl { top: 8px; left: 8px; border-top-width: 2px; border-left-width: 2px; }
.corner.tr { top: 8px; right: 8px; border-top-width: 2px; border-right-width: 2px; }
.corner.bl { bottom: 8px; left: 8px; border-bottom-width: 2px; border-left-width: 2px; }
.corner.br { bottom: 8px; right: 8px; border-bottom-width: 2px; border-right-width: 2px; }

.image-wrap {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}
.product-image {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
  transition: transform 0.6s ease;
  filter: sepia(0.15) contrast(1.05);
}
.card:hover .product-image { transform: scale(1.06); }

.image-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(0, 0, 0, 0.6));
  pointer-events: none;
}
.badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(212, 175, 55, 0.5);
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

.card-body { display: flex; flex-direction: column; flex: 1; padding: 0 4px; }
.card-body h3 {
  font-family: 'Cinzel', serif;
  font-size: 1.25rem;
  color: #f1d98a;
  margin: 0 0 8px;
  letter-spacing: 0.03em;
}
.desc {
  color: #b8a87c;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 14px;
  font-style: italic;
}

.ornament {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0 14px;
}
.ornament span:not(.diamond) {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.5), transparent);
}
.diamond { color: #d4af37; font-size: 0.7rem; }

.price-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border-left: 3px solid #d4af37;
}
.price-label {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #8a7a5a;
  margin-bottom: 4px;
}
.price {
  font-family: 'Cinzel', serif;
  font-size: 1.5rem;
  color: #d4af37;
  letter-spacing: 0.05em;
}

.buy {
  position: relative;
  margin-top: auto;
  padding: 12px 18px;
  background: linear-gradient(135deg, #d4af37, #b8941f);
  color: #1a140a;
  border: none;
  border-radius: 10px;
  font-family: 'Cinzel', serif;
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  transition: all 0.3s;
}
.buy::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}
.buy:hover::before { transform: translateX(100%); }
.buy:hover {
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.4);
  transform: translateY(-2px);
}
.buy-arrow { transition: transform 0.3s; }
.buy:hover .buy-arrow { transform: translateX(4px); }

/* ===== LOADING / EMPTY ===== */
.loading, .empty {
  text-align: center;
  padding: 80px 20px;
  color: #b8a87c;
}
.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(212, 175, 55, 0.2);
  border-top-color: #d4af37;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-seal { font-size: 4rem; margin-bottom: 16px; }
.empty h3 { font-family: 'Cinzel', serif; color: #f1d98a; margin-bottom: 8px; }

/* ===== MODAL ===== */
.overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at center, rgba(20, 14, 6, 0.85), rgba(0, 0, 0, 0.95));
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}
.modal {
  position: relative;
  max-width: 460px;
  width: 100%;
  background: linear-gradient(145deg, #1f1810, #15100a);
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 18px;
  padding: 40px 32px 32px;
  text-align: center;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8), inset 0 0 60px rgba(212, 175, 55, 0.05);
}
.seal {
  width: 70px;
  height: 70px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d4af37, #b8941f);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #1a140a;
  font-weight: bold;
  box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.15), 0 8px 20px rgba(0, 0, 0, 0.5);
  animation: pulseSeal 2s ease-in-out infinite;
}
@keyframes pulseSeal {
  0%, 100% { box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.15), 0 8px 20px rgba(0, 0, 0, 0.5); }
  50% { box-shadow: 0 0 0 10px rgba(212, 175, 55, 0.05), 0 8px 30px rgba(212, 175, 55, 0.3); }
}
.modal h2 {
  font-family: 'Cinzel', serif;
  color: #f1d98a;
  font-size: 1.6rem;
  margin: 0 0 12px;
  letter-spacing: 0.08em;
}
.modal-text {
  color: #c8b890;
  font-size: 1.05rem;
  line-height: 1.6;
  margin: 0 0 24px;
}
.modal-text strong { color: #d4af37; }

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.btn-ghost, .btn-primary {
  padding: 11px 20px;
  border-radius: 8px;
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-ghost {
  background: transparent;
  border: 1px solid rgba(212, 175, 55, 0.4);
  color: #d4af37;
}
.btn-ghost:hover { background: rgba(212, 175, 55, 0.1); border-color: #d4af37; }
.btn-primary {
  background: linear-gradient(135deg, #d4af37, #b8941f);
  border: none;
  color: #1a140a;
  font-weight: 600;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(212, 175, 55, 0.4);
}

/* Transitions */
.pop-enter-active, .pop-leave-active { transition: all 0.3s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(0.9) rotateX(8deg); }

@media (max-width: 600px) {
  .shop { padding: 24px 16px 60px; }
  .hero { padding: 40px 20px; }
  .hero-meta { gap: 16px; padding: 14px 20px; }
  .products { grid-template-columns: 1fr; }
}
</style>
