<script setup lang="ts">
import { ref, onMounted } from "vue";

const videoUrl = new URL(
  "@/assets/dino-bg.mp4",
  import.meta.url
).href;

const clickGameImage = new URL(
  "@/assets/click-game.jpg",
  import.meta.url
).href;

const memoryGameImage = new URL(
  "@/assets/jogoMemoriaSite.jpg",
  import.meta.url
).href;

const quizGameImage = new URL(
  "@/assets/ImagemQuiz.jpg",
  import.meta.url
).href;

const user = ref<{ name: string } | null>(null);

onMounted(() => {
  const data = localStorage.getItem("user");

  if (data) {
    user.value = JSON.parse(data);
  }
});
</script>

<template>
  <section class="hero">
    <!-- Vídeo -->
    <video autoplay muted loop playsinline class="hero-video">
      <source :src="videoUrl" type="video/mp4" />
    </video>

    <div class="overlay"></div>
    <div class="dust"></div>
    <div class="vignette"></div>

    <div class="content">
      <div class="eyebrow">
        <span class="eyebrow-line"></span>

        <span class="eyebrow-text">
          Era Mesozoica · Est. 66M a.C.
        </span>

        <span class="eyebrow-line"></span>
      </div>

      <h1 class="title">
        {{ user ? `Bem-vindo, ${user.name}` : "Bem-vindo" }}
      </h1>

      <div class="divider">
        <span class="divider-dot"></span>
        <span class="divider-icon">🦴</span>
        <span class="divider-dot"></span>
      </div>

      <h2 class="subtitle">
        Mini Games
      </h2>

      <p class="description">
        Venha explorar nossos mini games e transforme seu tempo
        livre em uma aventura jurássica cheia de diversão e desafios
        pré-históricos.
      </p>

      <div class="stats">

        <div class="stat">
          <span class="stat-num">+3</span>
          <span class="stat-label">Mini Games</span>
        </div>

        <span class="stat-sep"></span>

        <div class="stat">
          <span class="stat-num">∞</span>
          <span class="stat-label">Fósseis</span>
        </div>

        <span class="stat-sep"></span>

        <div class="stat">
          <span class="stat-num">3</span>
          <span class="stat-label">Eras</span>
        </div>

      </div>
    </div>

    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
  </section>

  <!-- GAMES -->
  <section class="games-section">

    <div class="games-header">
      <p class="games-eyebrow">
        Catálogo Jurássico
      </p>

      <h2>
        Jogos Disponíveis
      </h2>
    </div>

    <div class="games-grid">

      <!-- CLICKER -->
      <div
        class="game-card"
        @click="$router.push('/games/dino-clicker')"
      >

        <div class="game-thumb">
          <img
            :src="clickGameImage"
            alt="Dino Clicker"
          />
        </div>

        <div class="game-body">

          <span class="game-tag">
            Clicker
          </span>

          <h3>
            Dino Clicker
          </h3>

          <p>
            Clique no dinossauro, acumule moedas e
            desbloqueie recompensas.
          </p>

          <button>
            Jogar Agora
          </button>

        </div>
      </div>

      <!-- MEMORY -->
      <div
        class="game-card"
        @click="$router.push('/games/memory-game')"
      >

        <div class="game-thumb">
          <img
            :src="memoryGameImage"
            alt="Jogo da Memória"
          />
        </div>

        <div class="game-body">

          <span class="game-tag">
            Memória
          </span>

          <h3>
            Jogo da Memória
          </h3>

          <p>
            Encontre os pares de animais pré-históricos
            e ganhe moedas.
          </p>

          <button>
            Jogar Agora
          </button>

        </div>
      </div>

            <!-- QUIZ -->
      <div
        class="game-card"
        @click="$router.push('/games/quiz')"
      >

        <div class="game-thumb">
          <img
            :src="quizGameImage"
            alt="Quiz Game"
          />
        </div>

        <div class="game-body">

          <span class="game-tag">
            Quiz
          </span>

          <h3>
            Quiz Paleontológico
          </h3>

          <p>
            Teste seus conhecimentos sobre dinossauros,
            eras e criaturas pré-históricas.
          </p>

          <button>
            Jogar Agora
          </button>

        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

.hero {
  --gold-1: #f3d98b;
  --gold-2: #d6b05a;
  --gold-3: #a87d2e;
  --ink: #f7e9c5;
  --bg-0: #0a0806;

  position: relative;
  height: 100vh;
  overflow: hidden;

  background: var(--bg-0);

  color: var(--ink);
  font-family: 'Cinzel', serif;
}

.hero-video {
  position: absolute;
  inset: 0;

  width: 100%;
  height: 100%;

  object-fit: cover;

  filter:
    sepia(0.35)
    saturate(1.05)
    contrast(1.08)
    brightness(0.85);
}

.overlay {
  position: absolute;
  inset: 0;

  background:
    radial-gradient(
      ellipse at 50% 40%,
      rgba(214, 176, 90, 0.18),
      transparent 55%
    ),
    linear-gradient(
      180deg,
      rgba(10, 8, 6, 0.45) 0%,
      rgba(10, 8, 6, 0.75) 60%,
      rgba(10, 8, 6, 0.95) 100%
    );
}

.dust {
  position: absolute;
  inset: 0;

  opacity: 0.6;
  pointer-events: none;
}

.vignette {
  position: absolute;
  inset: 0;

  box-shadow:
    inset 0 0 220px 60px rgba(0, 0, 0, 0.75);
}

.content {
  position: relative;
  z-index: 2;

  height: 100%;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  text-align: center;

  max-width: 780px;

  margin: 0 auto;
  padding: 24px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 14px;

  margin-bottom: 24px;

  color: var(--gold-2);
}

.eyebrow-line {
  width: 64px;
  height: 1px;

  background:
    linear-gradient(
      90deg,
      transparent,
      var(--gold-2),
      transparent
    );
}

.eyebrow-text {
  font-size: 14px;

  letter-spacing: 3px;
  text-transform: uppercase;
}

.title {
  font-size: clamp(2.6rem, 6vw, 4.5rem);

  letter-spacing: 6px;

  background:
    linear-gradient(
      180deg,
      #fff1cf 0%,
      var(--gold-1) 40%,
      var(--gold-3) 100%
    );

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.divider {
  display: flex;
  align-items: center;
  gap: 14px;

  margin: 18px 0 8px;
}

.divider-dot {
  width: 90px;
  height: 1px;

  background:
    linear-gradient(
      90deg,
      transparent,
      var(--gold-2),
      transparent
    );
}

.subtitle {
  margin-bottom: 14px;

  color: var(--gold-1);

  letter-spacing: 8px;
  text-transform: uppercase;
}

.description {
  max-width: 620px;

  color: rgba(247, 233, 197, 0.85);

  line-height: 1.65;
}

.stats {
  display: flex;
  align-items: center;
  gap: 28px;

  margin-top: 44px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-num {
  font-size: 1.6rem;
  font-weight: bold;

  color: var(--gold-1);
}

.stat-label {
  font-size: 13px;

  letter-spacing: 2px;
  text-transform: uppercase;

  color: rgba(247, 233, 197, 0.65);
}

.stat-sep {
  width: 1px;
  height: 28px;

  background: rgba(214, 176, 90, 0.5);
}

.games-section {
  padding: 100px 40px;

  background:
    linear-gradient(
      180deg,
      #0a0806,
      #120d08
    );
}

.games-header {
  margin-bottom: 60px;

  text-align: center;
}

.games-eyebrow {
  margin-bottom: 14px;

  color: #d6b05a;

  letter-spacing: .4em;
  text-transform: uppercase;
}

.games-header h2 {
  color: #f3d98b;

  letter-spacing: 4px;
}

.games-grid {
  display: grid;

  grid-template-columns:
    repeat(auto-fit, minmax(280px, 280px));

  justify-content: center;

  gap: 30px;
}

.game-card {
  overflow: hidden;

  border-radius: 24px;

  cursor: pointer;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.05),
      rgba(255,255,255,.015)
    );

  border: 1px solid rgba(214,176,90,.18);

  transition: .35s ease;
}

.game-card:hover {
  transform:
    translateY(-6px)
    scale(1.02);
}

.game-thumb {
  width: 100%;
  height: 180px;

  overflow: hidden;
}

.game-thumb img {
  width: 100%;
  height: 100%;

  object-fit: cover;
}

.game-body {
  padding: 22px;
}

.game-tag {
  display: inline-block;

  margin-bottom: 16px;
  padding: 6px 12px;

  border-radius: 999px;

  background: rgba(214,176,90,.12);

  color: #f3d98b;

  font-size: .68rem;

  letter-spacing: .14em;
  text-transform: uppercase;
}

.game-body h3 {
  margin-bottom: 12px;

  color: #fff1cf;
}

.game-body p {
  margin-bottom: 22px;

  color: rgba(247,233,197,.72);

  line-height: 1.6;
}

.game-body button {
  width: 100%;

  padding: 14px;

  border: none;
  border-radius: 14px;

  cursor: pointer;

  font-weight: 700;

  letter-spacing: .1em;
  text-transform: uppercase;

  color: #1a1208;

  background:
    linear-gradient(
      135deg,
      #f3d98b,
      #a87d2e
    );
}

.corner {
  position: absolute;

  width: 44px;
  height: 44px;

  border-style: solid;
  border-color: rgba(214, 176, 90, 0.55);

  border-width: 0;
}

.corner-tl {
  top: 28px;
  left: 28px;

  border-top-width: 2px;
  border-left-width: 2px;
}

.corner-tr {
  top: 28px;
  right: 28px;

  border-top-width: 2px;
  border-right-width: 2px;
}

.corner-bl {
  bottom: 28px;
  left: 28px;

  border-bottom-width: 2px;
  border-left-width: 2px;
}

.corner-br {
  bottom: 28px;
  right: 28px;

  border-bottom-width: 2px;
  border-right-width: 2px;
}

@media (max-width: 720px) {

  .games-grid {
    grid-template-columns: 1fr;
  }

  .game-card {
    width: 100%;
    max-width: 320px;

    margin: 0 auto;
  }

  .title {
    letter-spacing: 4px;
  }

  .subtitle {
    letter-spacing: 5px;
  }

}

</style>