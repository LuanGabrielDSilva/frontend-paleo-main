<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import api from "../../services/api";

const periodos = ref<any[]>([]);
const activeIndex = ref<number | null>(null);
const loading = ref(true);
const error = ref(false);

const MESOZOICO_ID = "861f5e97-902a-4edc-b4ac-50282cbfa98a";

/* ============================================ */
/*  CARROSSEL DECORATIVO — imagens via URL      */
/* ============================================ */
const carouselImages = ref([
  {
    url: "https://admin.cnnbrasil.com.br/wp-content/uploads/sites/12/2023/07/AnyConv.com__Fv1eH3kXgAApo4d.jpg?w=419&h=283&crop=0",
    caption: "Crânio fossilizado de terópode",
    tag: "Cretáceo",
  },
  {
    url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTfODnVo_LzVA8EV4l7Q06OyI8OnkuP5RyHTdXlqQvRUr46yeDnqFMGpymMrNpnRLlq91ugd0j-XtnGOMKHlitpm_tyQmB2ivSHsS9vogw&s=10",
    caption: "Tyrannosaurus rex — o predador supremo",
    tag: "Cretáceo",
  },
  {
    url: "https://thumbs.dreamstime.com/b/floresta-jur%C3%A1ssica-com-dinossauros-selva-pr%C3%A9-hist%C3%B3rica-gerada-por-ai-326768352.jpg",
    caption: "Florestas densas do Jurássico",
    tag: "Jurássico",
  },
  {
    url: "https://www.deviante.com.br/wp-content/uploads/2020/09/Figura-1-Changmiania-liaoningensis-Copia.jpg",
    caption: "Esqueletos preservados em rocha",
    tag: "Mesozoico",
  },
  {
    url: "https://agencia.fapesp.br/files/post/22636.jpg",
    caption: "Vulcanismo no fim do Cretáceo",
    tag: "Extinção",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Palais_de_la_Decouverte_Tyrannosaurus_rex_p1050042.jpg",
    caption: "Fósseis e o registro da vida antiga",
    tag: "Triássico",
  },
]);

const carouselIndex = ref(0);
const carouselPaused = ref(false);
let carouselTimer: ReturnType<typeof setInterval> | null = null;

function startCarousel() {
  stopCarousel();
  carouselTimer = setInterval(() => {
    if (!carouselPaused.value) {
      carouselIndex.value =
        (carouselIndex.value + 1) % carouselImages.value.length;
    }
  }, 4500);
}
function stopCarousel() {
  if (carouselTimer) {
    clearInterval(carouselTimer);
    carouselTimer = null;
  }
}
function goToSlide(i: number) { carouselIndex.value = i; }
function nextSlide() {
  carouselIndex.value = (carouselIndex.value + 1) % carouselImages.value.length;
}
function prevSlide() {
  carouselIndex.value =
    (carouselIndex.value - 1 + carouselImages.value.length) % carouselImages.value.length;
}

/* ============================================ */
/*  CARREGAMENTO DOS PERÍODOS (intacto)         */
/* ============================================ */
onMounted(async () => {
  try {
    const res = await api.get("/periodos");
    periodos.value = res.data.filter((p: any) => p.eraId === MESOZOICO_ID);
  } catch (err) {
    console.error("Erro ao carregar períodos:", err);
    error.value = true;
  } finally {
    loading.value = false;
  }
  startCarousel();
});

onBeforeUnmount(() => stopCarousel());

const activePeriodo = computed(() =>
  activeIndex.value !== null ? periodos.value[activeIndex.value] : null
);

function toggle(i: number) {
  activeIndex.value = activeIndex.value === i ? null : i;
}
</script>

<template>
  <div class="page">
    <div class="grain"></div>
    <div class="vignette"></div>

    <!-- HERO -->
    <div class="hero">
      <img src="@/assets/mesozoico.png" alt="Era Mesozoica" class="hero-img" />
      <div class="hero-gradient"></div>

      <div class="overlay">
        <span class="kicker">
          <span class="kicker-line"></span>
          ERA GEOLÓGICA · 252 – 66 Ma
        </span>
        <h1>Mesozoico</h1>
        <p class="lead">
          A era dos répteis — quando dinossauros dominaram a Terra, os mares e os céus.
        </p>

        <div class="hero-meta">
          <div class="meta-item">
            <span class="meta-num">186M</span>
            <span class="meta-label">anos de duração</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-num">{{ periodos.length || 3 }}</span>
            <span class="meta-label">períodos</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-item">
            <span class="meta-num">75%</span>
            <span class="meta-label">espécies extintas</span>
          </div>
        </div>
      </div>

      <div class="scroll-hint">
        <span></span>
        <small>EXPLORE</small>
      </div>
    </div>

    <!-- CONTENT -->
    <section class="content">
      <header class="section-header">
        <span class="eyebrow">— Sobre a Era</span>
        <h2>A Idade dos Dinossauros</h2>
      </header>

      <!-- TEXTO + CARROSSEL (proporcional) -->
      <div class="prose-with-carousel">
        <div class="prose">
          <p class="drop-cap">
            A Era Mesozoica, conhecida como a "Idade dos Répteis", foi o período em que os dinossauros
            dominaram os ecossistemas terrestres por mais de 180 milhões de anos.
          </p>
          <p>
            Durante esse tempo surgiram gigantes como o Argentinosaurus, predadores ferozes como o
            Tyrannosaurus rex, e os primeiros pássaros — descendentes diretos dos dinossauros terópodes.
          </p>
          <p>
            A era terminou dramaticamente há 66 milhões de anos com o impacto de um asteroide que causou
            uma das maiores extinções em massa da história da Terra.
          </p>
        </div>

        <aside
          class="carousel"
          @mouseenter="carouselPaused = true"
          @mouseleave="carouselPaused = false"
          aria-label="Galeria do Mesozoico"
        >
          <div class="carousel-frame">
            <div class="carousel-corner tl"></div>
            <div class="carousel-corner tr"></div>
            <div class="carousel-corner bl"></div>
            <div class="carousel-corner br"></div>

            <div class="carousel-stage">
              <transition-group name="fade-slide" tag="div" class="slides">
                <div
                  v-for="(img, i) in carouselImages"
                  v-show="i === carouselIndex"
                  :key="img.url"
                  class="slide"
                >
                  <img :src="img.url" :alt="img.caption" loading="lazy" />
                  <div class="slide-overlay"></div>
                  <div class="slide-info">
                    <span class="slide-tag">{{ img.tag }}</span>
                    <p class="slide-caption">{{ img.caption }}</p>
                  </div>
                </div>
              </transition-group>

              <span class="carousel-index">
                {{ String(carouselIndex + 1).padStart(2, "0") }}
                <span class="carousel-index-sep">/</span>
                {{ String(carouselImages.length).padStart(2, "0") }}
              </span>

              <button class="carousel-arrow prev" @click="prevSlide" aria-label="Imagem anterior">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <button class="carousel-arrow next" @click="nextSlide" aria-label="Próxima imagem">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          <div class="carousel-dots" role="tablist">
            <button
              v-for="(img, i) in carouselImages"
              :key="i"
              class="cdot"
              :class="{ active: i === carouselIndex }"
              @click="goToSlide(i)"
              :aria-label="`Ir para slide ${i + 1}`"
            ></button>
          </div>

          <div class="carousel-progress">
            <div
              class="carousel-progress-bar"
              :style="{ width: ((carouselIndex + 1) / carouselImages.length) * 100 + '%' }"
            ></div>
          </div>
        </aside>
      </div>

      <!-- CARDS -->
      <div class="cards">
        <article class="card" data-index="01">
          <div class="card-num">01</div>
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
              <path d="M3 18c2-4 5-6 9-6s7 2 9 6"/>
              <path d="M8 12V6c0-1 1-2 2-2s2 1 2 2v6"/>
            </svg>
          </div>
          <h3>Triássico</h3>
          <p>Surgimento dos primeiros dinossauros em um supercontinente ainda em recuperação.</p>
          <span class="card-glow"></span>
        </article>

        <article class="card" data-index="02">
          <div class="card-num">02</div>
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
              <path d="M2 18c3-2 5-2 7 0s4 2 7 0 4-2 6 0"/>
              <path d="M5 14c2-6 5-9 8-9s6 3 8 9"/>
            </svg>
          </div>
          <h3>Jurássico</h3>
          <p>Apogeu dos dinossauros gigantes. Florestas densas e ecossistemas diversificados.</p>
          <span class="card-glow"></span>
        </article>

        <article class="card" data-index="03">
          <div class="card-num">03</div>
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
              <circle cx="18" cy="6" r="2.5"/>
              <path d="M16 8l-9 9"/>
              <path d="M5 21l2-6 4 1z"/>
            </svg>
          </div>
          <h3>Cretáceo</h3>
          <p>Último ato dos dinossauros. Surgimento das plantas com flores e das primeiras aves modernas.</p>
          <span class="card-glow"></span>
        </article>
      </div>

      <!-- Loading / Error -->
      <div v-if="loading" class="state-msg">
        <span class="spinner"></span>
        Carregando períodos...
      </div>
      <div v-else-if="error" class="state-msg state-error">
        Não foi possível carregar os períodos.
      </div>

      <!-- TIMELINE -->
      <div v-else class="timeline">
        <div class="timeline-track"></div>
        <div
          v-for="(p, i) in periodos"
          :key="p.id"
          class="timeline-item"
          :class="{ active: activeIndex === i }"
          @click="toggle(i)"
          role="button"
          tabindex="0"
          @keydown.enter.prevent="toggle(i)"
          @keydown.space.prevent="toggle(i)"
        >
          <span class="dot"></span>
          <span class="period">{{ p.name }}</span>
        </div>
      </div>

      <!-- ERA DETAIL -->
      <transition name="expand">
        <section v-if="activePeriodo" :key="activePeriodo.id" class="era-detail">
          <button class="era-close" @click="activeIndex = null" aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <div class="era-grid">
            <div class="era-gallery">
              <div class="era-img-main">
                <img v-if="activePeriodo.image" :src="activePeriodo.image" :alt="activePeriodo.name" />
                <div v-else class="era-img-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="9.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
                <div class="era-img-overlay"></div>
                <span class="era-index">
                  {{ String((activeIndex ?? 0) + 1).padStart(2, '0') }} / {{ String(periodos.length).padStart(2, '0') }}
                </span>
              </div>
            </div>

            <div class="era-body">
              <span class="era-kicker">
                <span class="era-kicker-line"></span>
                Mesozoico · Período {{ String((activeIndex ?? 0) + 1).padStart(2, '0') }}
              </span>
              <h2 class="era-title">{{ activePeriodo.name }}</h2>
              <div class="era-rule"></div>
              <p class="era-desc">{{ activePeriodo.description }}</p>
              <div class="era-footer-mark">
                <span>◆</span>
                <small>Era dos Répteis</small>
                <span>◆</span>
              </div>
            </div>
          </div>
        </section>
      </transition>

      <footer class="page-footer">
        <span>◆</span>
        <p>Fim do Mesozoico — o impacto de Chicxulub extinguiu 75% das espécies da Terra.</p>
        <span>◆</span>
      </footer>
    </section>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@300;400&display=swap');

:root {
  --bg: #0a0604;
  --gold: #d4af37;
  --gold-soft: #f1d98a;
  --gold-deep: #8a6a1f;
  --muted: #b8a578;
  --rust: #7a3a1c;
}

.page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(212, 175, 55, 0.08), transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(164, 79, 23, 0.12), transparent 50%),
    #0a0604;
  color: #f5e6c8;
  font-family: 'Cormorant Garamond', Georgia, serif;
  position: relative;
  overflow-x: hidden;
}

.grain {
  position: fixed; inset: 0;
  pointer-events: none; z-index: 100;
  opacity: 0.35; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.85 0 0 0 0 0.7 0 0 0 0 0.4 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
.vignette {
  position: fixed; inset: 0;
  pointer-events: none; z-index: 99;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.6) 100%);
}

/* HERO */
.hero { position: relative; height: 100vh; min-height: 600px; overflow: hidden; }
.hero-img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover;
  filter: brightness(0.38) contrast(1.12) saturate(0.85) sepia(0.25);
  transform: scale(1.05);
  animation: kenburns 22s ease-in-out infinite alternate;
}
@keyframes kenburns {
  0% { transform: scale(1.05) translate(0, 0); }
  100% { transform: scale(1.16) translate(-2%, -2%); }
}
.hero-gradient {
  position: absolute; inset: 0;
  background:
    linear-gradient(180deg, rgba(10, 6, 4, 0.45) 0%, transparent 30%, rgba(10, 6, 4, 0.95) 100%),
    linear-gradient(90deg, rgba(10, 6, 4, 0.65) 0%, transparent 60%);
}
.overlay {
  position: relative; z-index: 2; height: 100%;
  display: flex; flex-direction: column; justify-content: center;
  padding: 0 clamp(40px, 8vw, 120px); max-width: 900px;
  animation: rise 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
.kicker {
  display: inline-flex; align-items: center; gap: 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem; letter-spacing: 0.35em;
  color: var(--gold); text-transform: uppercase; margin-bottom: 28px;
}
.kicker-line { width: 60px; height: 1px; background: linear-gradient(90deg, transparent, var(--gold)); }
.overlay h1 {
  font-family: 'Cinzel', serif; font-weight: 600;
  font-size: clamp(4rem, 10vw, 8.5rem);
  line-height: 0.95; margin: 0 0 24px;
  background: linear-gradient(180deg, #fff5d6 0%, #d4af37 60%, #8a6a1f 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.02em;
  text-shadow: 0 0 80px rgba(212, 175, 55, 0.2);
}
.lead {
  font-size: clamp(1.1rem, 1.6vw, 1.4rem);
  font-style: italic; color: #ddd0aa;
  max-width: 620px; line-height: 1.6; margin: 0 0 56px;
}
.hero-meta {
  display: flex; align-items: center; gap: 28px;
  padding-top: 28px; border-top: 1px solid rgba(212, 175, 55, 0.25);
  max-width: 560px;
}
.meta-item { display: flex; flex-direction: column; gap: 4px; }
.meta-num { font-family: 'Cinzel', serif; font-size: 1.6rem; font-weight: 600; color: var(--gold-soft); }
.meta-label {
  font-family: 'JetBrains Mono', monospace; font-size: 0.7rem;
  letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted);
}
.meta-divider { width: 1px; height: 32px; background: rgba(212, 175, 55, 0.25); }

.scroll-hint {
  position: absolute; bottom: 32px; left: 50%;
  transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 12px; z-index: 3;
}
.scroll-hint span {
  width: 1px; height: 40px;
  background: linear-gradient(180deg, transparent, var(--gold));
  animation: scrolldown 2s ease-in-out infinite;
}
@keyframes scrolldown {
  0%, 100% { opacity: 0.3; transform: translateY(-6px); }
  50% { opacity: 1; transform: translateY(6px); }
}
.scroll-hint small {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem; letter-spacing: 0.4em; color: var(--muted);
}

/* CONTENT */
.content {
  position: relative;
  padding: clamp(80px, 12vw, 160px) clamp(40px, 8vw, 120px);
  max-width: 1280px; margin: 0 auto;
}
.section-header { margin-bottom: 64px; max-width: 720px; }
.eyebrow {
  display: block; font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem; letter-spacing: 0.3em; color: var(--gold);
  text-transform: uppercase; margin-bottom: 20px;
}
.content h2 {
  font-family: 'Cinzel', serif; font-weight: 400;
  font-size: clamp(2.5rem, 5vw, 4rem);
  color: var(--gold-soft); margin: 0; line-height: 1.05; letter-spacing: -0.01em;
}

/* TEXTO + CARROSSEL (carrossel = altura texto) */
.prose-with-carousel {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: clamp(40px, 6vw, 80px);
  align-items: stretch;
  margin-bottom: 120px;
}
.prose {
  max-width: 640px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.prose p { font-size: 1.25rem; line-height: 1.85; color: #d3c39b; margin-bottom: 24px; }
.prose p:last-child { margin-bottom: 0; }
.drop-cap::first-letter {
  font-family: 'Cinzel', serif; font-size: 4.5rem; font-weight: 600;
  color: var(--gold); float: left; line-height: 0.85;
  margin: 8px 14px 0 0; text-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
}

/* CARROSSEL */
.carousel {
  position: relative;
  display: flex; flex-direction: column;
  gap: 14px;
  height: 100%;
  min-height: 0;
  animation: rise 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.carousel-frame {
  position: relative;
  flex: 1; min-height: 0;
  display: flex;
  border: 1px solid rgba(212, 175, 55, 0.3);
  padding: 12px;
  background: linear-gradient(160deg, rgba(255, 245, 214, 0.04), rgba(10, 6, 4, 0.45));
  backdrop-filter: blur(10px);
  border-radius: 4px;
  box-shadow:
    0 24px 60px -20px rgba(0, 0, 0, 0.8),
    0 0 80px -30px rgba(212, 175, 55, 0.4);
}
.carousel-corner {
  position: absolute; width: 18px; height: 18px;
  border: 1px solid var(--gold);
  pointer-events: none;
}
.carousel-corner.tl { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.carousel-corner.tr { top: -1px; right: -1px; border-left: none; border-bottom: none; }
.carousel-corner.bl { bottom: -1px; left: -1px; border-right: none; border-top: none; }
.carousel-corner.br { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.carousel-stage {
  position: relative;
  flex: 1; min-height: 0;
  width: 100%;
  overflow: hidden;
  border-radius: 2px;
  background: #0a0604;
}
.slides { position: absolute; inset: 0; }
.slide { position: absolute; inset: 0; width: 100%; height: 100%; }
.slide img {
  width: 100%; height: 100%;
  object-fit: cover;
  filter: brightness(0.7) contrast(1.12) saturate(0.85) sepia(0.28);
  transform: scale(1.05);
  animation: slow-zoom 9s ease-in-out infinite alternate;
}
@keyframes slow-zoom {
  0% { transform: scale(1.05) translate(0, 0); }
  100% { transform: scale(1.18) translate(-2%, -2%); }
}
.slide-overlay {
  position: absolute; inset: 0;
  background:
    linear-gradient(180deg, rgba(10, 6, 4, 0.15) 0%, transparent 40%, rgba(10, 6, 4, 0.92) 100%),
    linear-gradient(90deg, rgba(122, 58, 28, 0.22), transparent 60%);
  pointer-events: none;
}
.slide-info {
  position: absolute; left: 22px; right: 22px; bottom: 22px;
  display: flex; flex-direction: column; gap: 8px;
}
.slide-tag {
  align-self: flex-start;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem; letter-spacing: 0.3em;
  color: var(--gold); text-transform: uppercase;
  padding: 5px 10px;
  border: 1px solid rgba(212, 175, 55, 0.5);
  background: rgba(10, 6, 4, 0.55);
  backdrop-filter: blur(6px);
}
.slide-caption {
  font-family: 'Cinzel', serif;
  font-size: 1.05rem;
  color: #fff5d6;
  margin: 0;
  letter-spacing: 0.01em;
  line-height: 1.3;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.8);
}

.carousel-index {
  position: absolute; top: 16px; right: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem; letter-spacing: 0.25em;
  color: var(--gold);
  padding: 5px 10px;
  border: 1px solid rgba(212, 175, 55, 0.45);
  background: rgba(10, 6, 4, 0.55);
  backdrop-filter: blur(6px);
  z-index: 3;
}
.carousel-index-sep { opacity: 0.5; margin: 0 4px; }

.carousel-arrow {
  position: absolute; top: 50%;
  transform: translateY(-50%);
  width: 38px; height: 38px;
  display: grid; place-items: center;
  background: rgba(10, 6, 4, 0.55);
  border: 1px solid rgba(212, 175, 55, 0.3);
  color: var(--gold);
  cursor: pointer;
  border-radius: 50%;
  backdrop-filter: blur(6px);
  opacity: 0; z-index: 3;
  transition: opacity 0.4s ease, transform 0.3s ease, background 0.3s ease, border-color 0.3s ease;
}
.carousel-arrow svg { width: 16px; height: 16px; }
.carousel-arrow.prev { left: 14px; }
.carousel-arrow.next { right: 14px; }
.carousel:hover .carousel-arrow { opacity: 1; }
.carousel-arrow:hover {
  background: rgba(212, 175, 55, 0.18);
  border-color: rgba(212, 175, 55, 0.7);
  color: #fff5d6;
}
.carousel-arrow.prev:hover { transform: translateY(-50%) translateX(-3px); }
.carousel-arrow.next:hover { transform: translateY(-50%) translateX(3px); }

.carousel-dots {
  display: flex; justify-content: center;
  gap: 10px; flex-shrink: 0;
}
.cdot {
  width: 8px; height: 8px;
  background: transparent;
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.4s ease;
  padding: 0;
}
.cdot:hover { border-color: var(--gold); }
.cdot.active {
  background: var(--gold);
  border-color: var(--gold);
  transform: scale(1.3);
  box-shadow: 0 0 14px rgba(212, 175, 55, 0.7);
}

.carousel-progress {
  position: relative;
  height: 1px; width: 100%;
  background: rgba(212, 175, 55, 0.15);
  overflow: hidden; flex-shrink: 0;
}
.carousel-progress-bar {
  position: absolute; left: 0; top: 0; bottom: 0;
  background: linear-gradient(90deg, var(--gold-deep), var(--gold), var(--gold-soft));
  transition: width 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.6);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 1.2s ease, transform 1.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.fade-slide-enter-from { opacity: 0; transform: scale(1.04); }
.fade-slide-leave-to   { opacity: 0; transform: scale(0.98); }

/* CARDS */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px; margin-bottom: 120px;
}
.card {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 245, 214, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(212, 175, 55, 0.18);
  padding: 40px 32px 36px; border-radius: 4px; overflow: hidden;
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.5s ease;
  backdrop-filter: blur(10px);
}
.card:hover { transform: translateY(-8px); border-color: rgba(212, 175, 55, 0.5); }
.card:hover .card-glow { opacity: 0.4; }
.card-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem; letter-spacing: 0.3em;
  color: var(--gold-deep); margin-bottom: 28px;
}
.card-icon {
  width: 52px; height: 52px; color: var(--gold); margin-bottom: 24px;
  transition: transform 0.5s ease, color 0.4s ease;
}
.card:hover .card-icon { transform: rotate(-4deg) scale(1.08); color: var(--gold-soft); }
.card-icon svg { width: 100%; height: 100%; }
.card h3 {
  font-family: 'Cinzel', serif; font-weight: 500;
  font-size: 1.4rem; color: var(--gold-soft);
  margin: 0 0 14px; letter-spacing: 0.02em;
}
.card p { font-size: 1.02rem; line-height: 1.7; color: #b8a578; font-style: italic; }
.card-glow {
  position: absolute; bottom: -40px; right: -40px;
  width: 140px; height: 140px;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.6), transparent 70%);
  filter: blur(30px); opacity: 0;
  transition: opacity 0.5s ease; pointer-events: none;
}

/* Loading / Error */
.state-msg {
  display: flex; align-items: center; justify-content: center;
  gap: 14px; padding: 80px 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--muted);
}
.state-error { color: var(--rust); }
.spinner {
  width: 14px; height: 14px;
  border: 1.5px solid rgba(212, 175, 55, 0.25);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* TIMELINE */
.timeline {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  padding: 56px 0;
  margin-bottom: 40px;
}
.timeline-track {
  position: absolute; top: 56px; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.4) 10%, rgba(212, 175, 55, 0.4) 90%, transparent);
}
.timeline-item {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  text-align: center; position: relative; cursor: pointer;
  transition: transform 0.3s ease;
  outline: none;
}
.timeline-item:hover { transform: translateY(-4px); }
.timeline-item:focus-visible .dot {
  box-shadow: 0 0 0 4px var(--bg), 0 0 0 6px rgba(212, 175, 55, 0.5), 0 0 30px rgba(212, 175, 55, 0.8);
}
.dot {
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--bg); border: 2px solid var(--gold);
  box-shadow: 0 0 0 4px var(--bg), 0 0 20px rgba(212, 175, 55, 0.4);
  transition: background 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
}
.timeline-item:hover .dot {
  background: var(--gold);
  box-shadow: 0 0 0 4px var(--bg), 0 0 30px rgba(212, 175, 55, 0.8);
}
.timeline-item.active .dot {
  background: var(--gold);
  transform: scale(1.25);
  box-shadow: 0 0 0 4px var(--bg), 0 0 0 6px rgba(212, 175, 55, 0.35), 0 0 40px rgba(212, 175, 55, 0.9);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 4px var(--bg), 0 0 0 6px rgba(212, 175, 55, 0.35), 0 0 40px rgba(212, 175, 55, 0.9); }
  50% { box-shadow: 0 0 0 4px var(--bg), 0 0 0 10px rgba(212, 175, 55, 0.15), 0 0 55px rgba(212, 175, 55, 1); }
}
.period {
  font-family: 'Cinzel', serif; font-size: 0.95rem;
  color: var(--gold-soft); margin-top: 14px;
  transition: color 0.3s ease;
}
.timeline-item.active .period { color: #fff5d6; }
.age {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem; letter-spacing: 0.15em; color: var(--muted);
}

/* ERA DETAIL */
.era-detail {
  position: relative;
  margin: 16px 0 80px;
  padding: clamp(32px, 5vw, 56px);
  background: linear-gradient(160deg, rgba(255, 245, 214, 0.045) 0%, rgba(10, 6, 4, 0.5) 100%);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 6px;
  overflow: hidden;
  backdrop-filter: blur(14px);
  box-shadow:
    0 24px 60px -20px rgba(0, 0, 0, 0.7),
    0 0 80px -20px rgba(212, 175, 55, 0.15);
}
.era-detail::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.7), transparent);
}
.era-detail::after {
  content: '';
  position: absolute; bottom: -60px; right: -60px;
  width: 220px; height: 220px;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.35), transparent 70%);
  filter: blur(40px); pointer-events: none;
}
.era-close {
  position: absolute; top: 20px; right: 20px;
  width: 38px; height: 38px;
  display: grid; place-items: center;
  background: rgba(10, 6, 4, 0.6);
  color: var(--gold);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 50%; cursor: pointer;
  backdrop-filter: blur(6px);
  transition: transform 0.3s ease, background 0.3s ease, border-color 0.3s ease, color 0.3s ease;
  z-index: 4;
}
.era-close svg { width: 16px; height: 16px; }
.era-close:hover {
  transform: rotate(90deg) scale(1.05);
  background: rgba(212, 175, 55, 0.15);
  border-color: rgba(212, 175, 55, 0.7);
  color: #fff5d6;
}
.era-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: clamp(28px, 4vw, 56px);
  align-items: start; position: relative; z-index: 2;
}

.era-gallery { display: flex; flex-direction: column; gap: 14px; }
.era-img-main {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid rgba(212, 175, 55, 0.25);
  background: rgba(10, 6, 4, 0.5);
}
.era-img-main img {
  width: 100%; height: 100%; object-fit: cover;
  filter: brightness(0.65) contrast(1.08) saturate(0.9) sepia(0.25);
  transform: scale(1.03);
  transition: transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.8s ease;
}
.era-img-main:hover img {
  transform: scale(1.1);
  filter: brightness(0.82) contrast(1.1) saturate(1) sepia(0.18);
}
.era-img-placeholder {
  position: absolute; inset: 0;
  display: grid; place-items: center;
  color: rgba(212, 175, 55, 0.4);
}
.era-img-placeholder svg { width: 64px; height: 64px; }
.era-img-overlay {
  position: absolute; inset: 0;
  background:
    linear-gradient(180deg, transparent 50%, rgba(10, 6, 4, 0.75) 100%),
    linear-gradient(90deg, rgba(122, 58, 28, 0.18), transparent 60%);
  pointer-events: none;
}
.era-index {
  position: absolute; bottom: 16px; left: 18px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem; letter-spacing: 0.35em;
  color: var(--gold);
  padding: 6px 12px;
  border: 1px solid rgba(212, 175, 55, 0.5);
  background: rgba(10, 6, 4, 0.6);
  border-radius: 2px;
  backdrop-filter: blur(6px);
}

.era-body { display: flex; flex-direction: column; }
.era-kicker {
  display: inline-flex; align-items: center; gap: 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.76rem; letter-spacing: 0.3em;
  color: var(--gold); text-transform: uppercase;
  margin-bottom: 18px;
}
.era-kicker-line { width: 40px; height: 1px; background: linear-gradient(90deg, transparent, var(--gold)); }
.era-title {
  font-family: 'Cinzel', serif; font-weight: 600;
  font-size: clamp(2.4rem, 4.5vw, 3.5rem);
  line-height: 0.98; margin: 0 0 22px;
  letter-spacing: -0.01em;
  background: linear-gradient(180deg, #fff5d6 0%, #d4af37 65%, #8a6a1f 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}
.era-rule {
  width: 56px; height: 1px;
  background: linear-gradient(90deg, var(--gold), transparent);
  margin-bottom: 26px;
}
.era-desc {
  font-size: 1.1rem; line-height: 1.85;
  color: #d3c39b; margin: 0 0 36px;
  font-style: italic; white-space: pre-line;
}
.era-footer-mark {
  display: flex; align-items: center; gap: 14px;
  padding-top: 24px;
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  color: var(--gold);
}
.era-footer-mark span { font-size: 0.7rem; }
.era-footer-mark small {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem; letter-spacing: 0.25em;
  color: var(--muted); text-transform: uppercase;
}

.expand-enter-active {
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), max-height 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
}
.expand-leave-active {
  transition: opacity 0.35s ease, transform 0.4s ease, max-height 0.5s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to { opacity: 0; transform: translateY(-16px); max-height: 0; }
.expand-enter-to,
.expand-leave-from { opacity: 1; transform: translateY(0); max-height: 2000px; }

.page-footer {
  display: flex; align-items: center; justify-content: center;
  gap: 24px; padding-top: 56px;
  border-top: 1px solid rgba(212, 175, 55, 0.15);
  text-align: center;
}
.page-footer span { color: var(--gold); font-size: 0.7rem; }
.page-footer p { font-style: italic; color: var(--muted); font-size: 1rem; max-width: 540px; }

/* RESPONSIVO */
@media (max-width: 980px) {
  .prose-with-carousel { grid-template-columns: 1fr; gap: 56px; }
  .carousel { height: auto; max-width: 520px; }
  .carousel-frame { aspect-ratio: 4 / 5; flex: none; }
}
@media (max-width: 900px) {
  .era-grid { grid-template-columns: 1fr; gap: 32px; }
  .era-close { top: 14px; right: 14px; }
}
@media (max-width: 720px) {
  .hero { height: 90vh; }
  .overlay h1 { font-size: clamp(3.2rem, 14vw, 5rem); }
  .hero-meta { flex-wrap: wrap; gap: 18px; }
  .meta-divider { display: none; }
  .timeline { grid-template-columns: 1fr; }
  .era-detail { padding: 28px 20px; }
}
</style>