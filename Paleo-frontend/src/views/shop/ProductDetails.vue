<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";

const route = useRoute();
const router = useRouter();

const product = ref<any>(null);
const loading = ref(true);

const comments = ref<any[]>([]);
const commentText = ref("");
const commentRating = ref(5);
const sending = ref(false);

/* MODAIS */
const showSuccessModal = ref(false);
const showErrorModal = ref(false);
const errorMsg = ref("");

/* HELPERS */
const fossilCode = (id: any) => {
  const n = String(id || "0000").replace(/\D/g, "").slice(-4).padStart(4, "0");
  return `PAL-${n}`;
};

const load = async () => {
  loading.value = true;
  try {
    const { data } = await api.get(`/products/${route.params.id}`);
    product.value = data;
  } catch {
    product.value = null;
  } finally {
    loading.value = false;
  }
};

const loadComments = async () => {
  try {
    const { data } = await api.get(`/products/${route.params.id}/comments`);
    comments.value = data;
  } catch {
    comments.value = [];
  }
};

const addToCart = async () => {
  if (!product.value) return;
  try {
    await api.post("/cart/add", {
      product_id: product.value.id,
      quantity: 1,
    });
    showSuccessModal.value = true;
  } catch {
    errorMsg.value = "Não foi possível adicionar a relíquia ao carrinho.";
    showErrorModal.value = true;
  }
};

const sendComment = async () => {
  if (!commentText.value.trim() || !product.value) return;
  sending.value = true;
  try {
    await api.post(`/products/${route.params.id}/comments`, {
      text: commentText.value,
      rating: commentRating.value,
    });
    commentText.value = "";
    commentRating.value = 5;
    await loadComments();
  } catch {
    errorMsg.value = "Erro ao registrar sua observação no diário.";
    showErrorModal.value = true;
  } finally {
    sending.value = false;
  }
};

const stars = computed(() => {
  const rating = product.value?.rating || 0;
  return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
});

const avgRating = computed(() => {
  if (!comments.value.length) return product.value?.rating || 0;
  const sum = comments.value.reduce((a, c) => a + (c.rating || 0), 0);
  return sum / comments.value.length;
});

const closeModals = () => {
  showSuccessModal.value = false;
  showErrorModal.value = false;
};

const selectedImage = ref<string | null>(null);

const mainImage = computed(() => {
  return selectedImage.value || product.value?.image;
});

const setImage = (img: string) => {
  selectedImage.value = img;
};

watch(product, () => {
  selectedImage.value = null;
});

onMounted(async () => {
  await load();
  await loadComments();
});
</script>

<template>
  <div class="product-page">
    <!-- BACK -->
    <button class="back-btn" @click="router.back()">
      <span class="arrow">←</span>
      Retornar à Expedição
    </button>

    <!-- LOADING -->
    <div v-if="loading" class="loading-state">
      <div class="loader-ring"></div>
      <p>Escavando relíquia...</p>
    </div>

    <!-- PRODUCT -->
    <div v-else-if="product" class="relic-card">
      <span class="corner tl"></span>
      <span class="corner tr"></span>
      <span class="corner bl"></span>
      <span class="corner br"></span>

      <!-- IMAGE COLUMN -->
      <div class="image-column">
        <div class="image-frame">
          <img :src="mainImage" :alt="product.name" />
          <div class="image-shade"></div>
          <span class="fossil-tag">{{ fossilCode(product.id) }}</span>
        </div>

        <div v-if="product.variants?.length" class="thumbnails">
          <div
            v-for="(v, i) in product.variants"
            :key="i"
            class="thumb-wrapper"
          >
            <img
              :src="v.image || product.image"
              class="thumb"
              :class="{ active: mainImage === (v.image || product.image) }"
              @mouseenter="setImage(v.image || product.image)"
              @click="setImage(v.image || product.image)"
            />
            <span class="thumb-label">{{ v.color || 'default' }}</span>
          </div>
        </div>
      </div>

      <!-- INFO COLUMN -->
      <div class="info-section">
        <div class="kicker">⌘ Acervo Paleontológico</div>
        <h1 class="title">{{ product.name }}</h1>

        <div class="rating-row">
          <div class="stars">
            <span
              v-for="(s, i) in stars"
              :key="i"
              class="star"
              :class="{ active: s }"
            >{{ s ? "★" : "☆" }}</span>
          </div>
          <span class="rating-text">
            {{ (product.rating || 0).toFixed(1) }}
            <em>({{ product.ratingCount || comments.length || 0 }} avaliações)</em>
          </span>
        </div>

        <div class="ornament">◆</div>

        <p class="description">{{ product.description }}</p>

        <div class="price-row">
          <span class="price-label">Valor da Relíquia</span>
          <span class="price">R$ {{ Number(product.price).toFixed(2) }}</span>
        </div>

        <button class="buy-btn" @click="addToCart">
          ⚒ Adicionar ao Acervo
        </button>
      </div>
    </div>

    <!-- COMMENTS -->
    <div v-if="product" class="comments-section">
      <span class="corner tl"></span>
      <span class="corner tr"></span>
      <span class="corner bl"></span>
      <span class="corner br"></span>

      <div class="section-head">
        <div class="kicker">✎ Diário de Observações</div>
        <h2 class="section-title">Anotações dos Exploradores</h2>
        <p class="section-sub">
          <strong>{{ comments.length }}</strong> registro(s) no diário · Média
          <strong>{{ avgRating.toFixed(1) }}★</strong>
        </p>
      </div>

      <div class="comment-form">
        <label class="form-label">Sua avaliação</label>
        <div class="rating-pick">
          <button
            v-for="i in 5"
            :key="i"
            class="pick"
            :class="{ active: i <= commentRating }"
            @click="commentRating = i"
          >★</button>
          <span class="rating-num">{{ commentRating }}/5</span>
        </div>

        <label class="form-label">Sua observação</label>
        <textarea
          v-model="commentText"
          placeholder="Registre sua descoberta no diário..."
          rows="4"
        ></textarea>

        <button class="send-btn" :disabled="sending" @click="sendComment">
          {{ sending ? "Registrando..." : "✒ Selar Observação" }}
        </button>
      </div>

      <div v-if="!comments.length" class="empty-comments">
        <div class="empty-icon">🦴</div>
        <p>Nenhum explorador registrou observações ainda.</p>
        <small>Seja o primeiro a documentar esta relíquia.</small>
      </div>

      <ul v-else class="comments-list">
        <li v-for="(c, idx) in comments" :key="idx" class="comment">
          <div class="comment-head">
            <div class="avatar">{{ (c.user?.name || "U")[0].toUpperCase() }}</div>
            <div class="meta">
              <strong>{{ c.user?.name || "Explorador Anônimo" }}</strong>
              <span class="rating-pill">★ {{ (c.rating || 0).toFixed(1) }}</span>
            </div>
          </div>
          <p class="comment-text">{{ c.text }}</p>
        </li>
      </ul>
    </div>

    <!-- NOT FOUND -->
    <div v-else-if="!loading" class="not-found">
      <div class="nf-icon">🦖</div>
      <h2>Relíquia Perdida no Tempo</h2>
      <p>Este fóssil não consta em nosso acervo.</p>
      <button class="back-btn" @click="router.back()">← Voltar</button>
    </div>

    <!-- SUCCESS MODAL -->
    <Teleport to="body">
      <transition name="pop">
        <div v-if="showSuccessModal" class="modal-overlay" @click.self="closeModals">
          <div class="modal-card">
            <span class="corner tl"></span>
            <span class="corner tr"></span>
            <span class="corner bl"></span>
            <span class="corner br"></span>
            <div class="seal">⚒</div>
            <h3>Relíquia Adquirida</h3>
            <p>
              <strong>{{ product?.name }}</strong> foi adicionado ao seu acervo
              paleontológico.
            </p>
            <div class="modal-actions">
              <button class="btn-ghost" @click="closeModals">Continuar Explorando</button>
              <button class="btn-primary" @click="router.push('/cart')">Ver Carrinho</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- ERROR MODAL -->
    <Teleport to="body">
      <transition name="pop">
        <div v-if="showErrorModal" class="modal-overlay" @click.self="closeModals">
          <div class="modal-card">
            <span class="corner tl"></span>
            <span class="corner tr"></span>
            <span class="corner bl"></span>
            <span class="corner br"></span>
            <div class="seal error-seal">⚠</div>
            <h3>Falha na Expedição</h3>
            <p>{{ errorMsg }}</p>
            <div class="modal-actions">
              <button class="btn-primary" @click="closeModals">Entendido</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Crimson+Text:ital,wght@0,400;1,400&display=swap');

.product-page {
  min-height: 100vh;
  padding: 30px 24px 80px;
  background:
    radial-gradient(1200px 600px at 20% 0%, rgba(212, 175, 55, 0.08), transparent 60%),
    radial-gradient(900px 500px at 90% 30%, rgba(168, 100, 50, 0.07), transparent 60%),
    linear-gradient(180deg, #1a140d 0%, #120e08 100%);
  color: #e8d9b6;
  font-family: 'Crimson Text', serif;
}

/* BACK */
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(145deg, #1f180f, #16110a);
  color: #f1d98a;
  border: 1px solid rgba(212, 175, 55, 0.3);
  padding: 10px 18px;
  border-radius: 10px;
  font-family: 'Cinzel', serif;
  font-size: .85rem;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .25s ease;
  margin-bottom: 28px;
}
.back-btn:hover {
  border-color: #d4af37;
  transform: translateX(-3px);
  box-shadow: 0 4px 18px rgba(212, 175, 55, .2);
}
.back-btn .arrow { font-size: 1.1rem; }

/* LOADING */
.loading-state {
  text-align: center;
  padding: 80px 20px;
  color: #b89c6a;
  font-style: italic;
}
.loader-ring {
  width: 48px; height: 48px;
  border: 3px solid rgba(212, 175, 55, .15);
  border-top-color: #d4af37;
  border-radius: 50%;
  margin: 0 auto 18px;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* CARD */
.relic-card,
.comments-section {
  position: relative;
  background: linear-gradient(145deg, #1e1810 0%, #16120c 100%);
  border: 1px solid rgba(212, 175, 55, 0.18);
  border-radius: 18px;
  padding: 32px;
  margin: 0 auto 28px;
  max-width: 1100px;
  box-shadow:
    0 30px 60px -20px rgba(0, 0, 0, .6),
    inset 0 1px 0 rgba(212, 175, 55, .08);
}

.relic-card {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: 40px;
  align-items: start;
}

.corner {
  position: absolute;
  width: 22px; height: 22px;
  border: 2px solid #d4af37;
  opacity: .55;
}
.tl { top: 10px; left: 10px; border-right: none; border-bottom: none; }
.tr { top: 10px; right: 10px; border-left: none; border-bottom: none; }
.bl { bottom: 10px; left: 10px; border-right: none; border-top: none; }
.br { bottom: 10px; right: 10px; border-left: none; border-top: none; }

/* IMAGE COLUMN */
.image-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  position: sticky;
  top: 24px;
}

.image-frame {
  position: relative;
  width: 100%;
  max-width: 380px;
  aspect-ratio: 4 / 5;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(212, 175, 55, .25);
  box-shadow:
    0 18px 40px -15px rgba(0,0,0,.7),
    inset 0 0 0 1px rgba(212, 175, 55, .05);
  background: #0f0c07;
}
.image-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  filter: sepia(.18) saturate(1.05);
  transition: transform .6s ease;
}
.image-frame:hover img { transform: scale(1.04); }
.image-shade {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 55%, rgba(0,0,0,.55));
  pointer-events: none;
}
.fossil-tag {
  position: absolute;
  bottom: 12px; left: 12px;
  background: rgba(20, 14, 8, .85);
  color: #f1d98a;
  font-family: 'Cinzel', serif;
  font-size: .68rem;
  letter-spacing: 2px;
  padding: 5px 11px;
  border-radius: 6px;
  border: 1px solid rgba(212, 175, 55, .3);
}

/* INFO */
.info-section {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.kicker {
  font-family: 'Cinzel', serif;
  font-size: .72rem;
  letter-spacing: 4px;
  color: #d4af37;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.title {
  font-family: 'Cinzel', serif;
  font-size: 2.1rem;
  font-weight: 700;
  color: #f1d98a;
  margin: 0 0 16px;
  line-height: 1.15;
  text-shadow: 0 2px 14px rgba(212, 175, 55, .12);
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.stars { display: flex; gap: 3px; }
.star { color: #4a3d28; font-size: 1.15rem; }
.star.active { color: #d4af37; text-shadow: 0 0 8px rgba(212,175,55,.5); }
.rating-text { color: #c9b487; font-size: .95rem; }
.rating-text em { color: #8a7551; font-style: normal; font-size: .85rem; margin-left: 4px; }

.ornament {
  text-align: center;
  color: #d4af37;
  opacity: .5;
  margin: 16px 0;
  letter-spacing: 8px;
}

.description {
  color: #d8c8a5;
  line-height: 1.75;
  font-size: 1.02rem;
  margin: 0 0 24px;
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-radius: 12px;
  background: linear-gradient(145deg, #251c10, #1a140b);
  border-left: 3px solid #d4af37;
  margin-bottom: 20px;
}
.price-label {
  font-family: 'Cinzel', serif;
  font-size: .75rem;
  letter-spacing: 2px;
  color: #b89c6a;
  text-transform: uppercase;
}
.price {
  font-family: 'Cinzel', serif;
  font-size: 1.7rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f1d98a, #d4af37);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.buy-btn {
  position: relative;
  background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
  color: #1a1208;
  border: none;
  padding: 16px 22px;
  border-radius: 12px;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  overflow: hidden;
  transition: all .3s ease;
  box-shadow: 0 8px 22px rgba(212, 175, 55, .3);
}
.buy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(212, 175, 55, .5);
}

/* COMMENTS */
.section-head { margin-bottom: 26px; }
.section-title {
  font-family: 'Cinzel', serif;
  font-size: 1.6rem;
  color: #f1d98a;
  margin: 6px 0;
}
.section-sub { color: #b89c6a; font-size: .95rem; }
.section-sub strong { color: #d4af37; }

.comment-form {
  background: linear-gradient(145deg, #1a140d, #14100a);
  border: 1px dashed rgba(212, 175, 55, .25);
  border-radius: 14px;
  padding: 22px;
  margin-bottom: 28px;
}
.form-label {
  display: block;
  font-family: 'Cinzel', serif;
  font-size: .75rem;
  letter-spacing: 2px;
  color: #b89c6a;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.rating-pick {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 18px;
}
.pick {
  background: transparent;
  border: none;
  color: #4a3d28;
  font-size: 1.7rem;
  cursor: pointer;
  padding: 0 2px;
  transition: all .2s;
}
.pick:hover { transform: scale(1.15); }
.pick.active { color: #d4af37; text-shadow: 0 0 10px rgba(212,175,55,.6); }
.rating-num {
  margin-left: 12px;
  color: #c9b487;
  font-family: 'Cinzel', serif;
  font-size: .9rem;
}

textarea {
  width: 100%;
  background: #0f0c07;
  border: 1px solid rgba(212, 175, 55, .2);
  color: #e8d9b6;
  border-radius: 10px;
  padding: 12px 14px;
  font-family: 'Crimson Text', serif;
  font-size: 1rem;
  resize: vertical;
  margin-bottom: 16px;
  transition: border-color .2s;
}
textarea:focus {
  outline: none;
  border-color: #d4af37;
  box-shadow: 0 0 0 3px rgba(212,175,55,.1);
}

.send-btn {
  background: linear-gradient(135deg, #b8941f, #8c6b14);
  color: #1a1208;
  border: none;
  padding: 12px 22px;
  border-radius: 10px;
  font-family: 'Cinzel', serif;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .25s;
}
.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #d4af37, #b8941f);
  transform: translateY(-1px);
}
.send-btn:disabled { opacity: .55; cursor: not-allowed; }

.empty-comments {
  text-align: center;
  padding: 40px 20px;
  color: #8a7551;
  font-style: italic;
}
.empty-icon { font-size: 2.6rem; margin-bottom: 10px; }
.empty-comments small { display: block; margin-top: 6px; opacity: .7; }

.comments-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.comment {
  background: linear-gradient(145deg, #1a140d, #16110a);
  border: 1px solid rgba(212, 175, 55, .12);
  border-left: 3px solid rgba(212, 175, 55, .5);
  border-radius: 12px;
  padding: 16px 18px;
  transition: all .25s;
}
.comment:hover {
  border-left-color: #d4af37;
  transform: translateX(3px);
}
.comment-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.avatar {
  width: 38px; height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d4af37, #8c6b14);
  color: #1a1208;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
  font-weight: 700;
}
.meta { display: flex; align-items: center; gap: 10px; flex: 1; flex-wrap: wrap; }
.meta strong { color: #f1d98a; font-family: 'Cinzel', serif; font-size: .95rem; }
.rating-pill {
  background: rgba(212, 175, 55, .12);
  border: 1px solid rgba(212, 175, 55, .3);
  color: #d4af37;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: .8rem;
  font-family: 'Cinzel', serif;
}
.comment-text {
  color: #d8c8a5;
  line-height: 1.65;
  margin: 0;
}

/* NOT FOUND */
.not-found {
  text-align: center;
  padding: 80px 20px;
}
.nf-icon { font-size: 4rem; margin-bottom: 18px; }
.not-found h2 {
  font-family: 'Cinzel', serif;
  color: #f1d98a;
  margin-bottom: 8px;
}
.not-found p { color: #b89c6a; margin-bottom: 24px; }

/* MODAL */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(10, 7, 4, .78);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}
.modal-card {
  position: relative;
  background:
    radial-gradient(600px 300px at 50% 0%, rgba(212, 175, 55, .12), transparent 60%),
    linear-gradient(145deg, #1f180f, #14100a);
  border: 1px solid rgba(212, 175, 55, .3);
  border-radius: 18px;
  padding: 36px 30px 28px;
  max-width: 460px;
  width: 100%;
  text-align: center;
  box-shadow: 0 30px 80px -20px rgba(0,0,0,.8);
}
.seal {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d4af37, #8c6b14);
  color: #1a1208;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.7rem;
  margin: 0 auto 16px;
  box-shadow: 0 0 0 6px rgba(212,175,55,.12);
  animation: pulseSeal 2s ease-in-out infinite;
}
.error-seal {
  background: linear-gradient(135deg, #c0392b, #7d2418);
  color: #fff;
  box-shadow: 0 0 0 6px rgba(192,57,43,.18);
}
@keyframes pulseSeal {
  0%,100% { box-shadow: 0 0 0 6px rgba(212,175,55,.12); }
  50%     { box-shadow: 0 0 0 12px rgba(212,175,55,.04); }
}
.modal-card h3 {
  font-family: 'Cinzel', serif;
  color: #f1d98a;
  margin: 0 0 10px;
  font-size: 1.4rem;
  letter-spacing: 1px;
}
.modal-card p {
  color: #d8c8a5;
  line-height: 1.6;
  margin: 0 0 22px;
}
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}
.btn-ghost,
.btn-primary {
  border: none;
  padding: 11px 18px;
  border-radius: 10px;
  font-family: 'Cinzel', serif;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all .25s;
}
.btn-ghost {
  background: transparent;
  color: #d4af37;
  border: 1px solid rgba(212,175,55,.4);
}
.btn-ghost:hover { background: rgba(212,175,55,.08); }
.btn-primary {
  background: linear-gradient(135deg, #d4af37, #b8941f);
  color: #1a1208;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(212,175,55,.3); }

/* TRANSITIONS */
.pop-enter-active, .pop-leave-active { transition: all .35s cubic-bezier(.2,.9,.3,1.2); }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(.85) rotateX(-15deg); }

/* THUMBS */
.thumbnails {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
  justify-content: center;
}
.thumb {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid transparent;
  opacity: 0.65;
  transition: all 0.2s ease;
  box-shadow: 0 6px 18px rgba(0,0,0,.3);
}
.thumb:hover { transform: scale(1.05); opacity: 1; }
.thumb.active {
  border-color: #d4af37;
  opacity: 1;
  transform: scale(1.08);
}
.thumb-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.thumb-label {
  font-size: 0.65rem;
  color: #b89c6a;
  font-family: 'Cinzel', serif;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .relic-card {
    grid-template-columns: 1fr;
    gap: 26px;
    padding: 24px;
  }
  .image-column { position: static; }
  .image-frame {
    max-width: 340px;
    aspect-ratio: 1 / 1;
  }
  .title { font-size: 1.7rem; }
}

@media (max-width: 520px) {
  .product-page { padding: 20px 14px 60px; }
  .relic-card { padding: 18px; }
  .image-frame {
    max-width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
  }
  .title { font-size: 1.45rem; }
  .price { font-size: 1.4rem; }
  .thumb { width: 48px; height: 48px; }
}
</style>