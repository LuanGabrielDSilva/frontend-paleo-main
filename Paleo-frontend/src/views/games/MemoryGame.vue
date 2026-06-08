<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import moedaDoSite from "@/assets/moedaDoSite.png";

/* =========================================================
   TYPES
========================================================= */
type Animal = {
  id: string;
  name: string;
  image: string;
};

type Card = {
  uid: number;
  id: string;
  image: string;
  name?: string;
  flipped: boolean;
  matched: boolean;
};

type Difficulty = "easy" | "medium" | "hard";

/* =========================================================
   API (fallback seguro)
========================================================= */
const API = import.meta.env.VITE_API_URL || "";

/* =========================================================
   STATE
========================================================= */
const animals = ref<Animal[]>([]);
const cards = ref<Card[]>([]);

const first = ref<Card | null>(null);
const second = ref<Card | null>(null);
const lock = ref(false);

const moves = ref(0);
const matchesFound = ref(0);
const loading = ref(false);

const completed = ref(false);
const showModal = ref(false);
const earnedCoins = ref(0);

const difficulty = ref<Difficulty>("easy");

/* TIMER */
const elapsed = ref(0);
const timerId = ref<number | null>(null);
const started = ref(false);

/* FEEDBACK */
const combo = ref(0);
const bestCombo = ref(0);
const lastFeedback = ref<"hit" | "miss" | null>(null);

/* =========================================================
   LISTA SEGURA
========================================================= */
const difficulties: Difficulty[] = ["easy", "medium", "hard"];

/* =========================================================
   CONFIG
========================================================= */
const rewardMap: Record<Difficulty, number> = {
  easy: 200,
  medium: 500,
  hard: 1000,
};

const cardCountMap: Record<Difficulty, number> = {
  easy: 4,
  medium: 6,
  hard: 8,
};

const gridColsMap: Record<Difficulty, number> = {
  easy: 4,
  medium: 4,
  hard: 4,
};

/* =========================================================
   COMPUTEDS
========================================================= */
const totalPairs = computed(() => cardCountMap[difficulty.value]);

const progress = computed(() =>
  totalPairs.value ? (matchesFound.value / totalPairs.value) * 100 : 0
);

const formattedTime = computed(() => {
  const m = Math.floor(elapsed.value / 60).toString().padStart(2, "0");
  const s = (elapsed.value % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
});

const accuracy = computed(() => {
  if (moves.value === 0) return 0;
  return Math.round((matchesFound.value / moves.value) * 100);
});

/* =========================================================
   TIMER
========================================================= */
const startTimer = () => {
  if (timerId.value) return;
  timerId.value = window.setInterval(() => {
    elapsed.value++;
  }, 1000);
};

const stopTimer = () => {
  if (timerId.value) {
    clearInterval(timerId.value);
    timerId.value = null;
  }
};

const resetTimer = () => {
  stopTimer();
  elapsed.value = 0;
  started.value = false;
};

/* =========================================================
   SHUFFLE
========================================================= */
const shuffleArray = <T,>(array: T[]) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/* =========================================================
   FETCH ANIMALS
========================================================= */
const fetchAnimals = async () => {
  loading.value = true;

  try {
    if (!API) throw new Error("VITE_API_URL não definido");

    const res = await fetch(`${API}/animals`);
    const data: Animal[] = await res.json();

    animals.value = data || [];
    buildGame();
  } catch (err) {
    console.error("Erro ao buscar animais:", err);
    animals.value = [];
  } finally {
    loading.value = false;
  }
};

/* =========================================================
   BUILD GAME
========================================================= */
const buildGame = () => {
  const count = cardCountMap[difficulty.value];
  if (!animals.value.length) return;

  const selected = shuffleArray(animals.value).slice(0, count);

  const duplicated: Card[] = shuffleArray(
    [...selected, ...selected].map((a, i) => ({
      uid: Date.now() + i + Math.random(),
      id: a.id,
      image: a.image,
      name: a.name,
      flipped: false,
      matched: false,
    }))
  );

  cards.value = duplicated;
  resetGameState();
};

/* =========================================================
   RESET
========================================================= */
const resetGameState = () => {
  first.value = null;
  second.value = null;
  lock.value = false;
  moves.value = 0;
  matchesFound.value = 0;
  combo.value = 0;
  bestCombo.value = 0;
  completed.value = false;
  showModal.value = false;
  lastFeedback.value = null;
  resetTimer();
};

/* =========================================================
   FLIP
========================================================= */
const flipCard = (card: Card) => {
  if (lock.value || card.flipped || card.matched) return;

  if (!started.value) {
    started.value = true;
    startTimer();
  }

  card.flipped = true;

  if (!first.value) {
    first.value = card;
    return;
  }

  second.value = card;
  lock.value = true;
  moves.value++;

  checkMatch();
};

/* =========================================================
   MATCH
========================================================= */
const checkMatch = () => {
  if (!first.value || !second.value) return;

  if (first.value.id === second.value.id) {
    first.value.matched = true;
    second.value.matched = true;

    matchesFound.value++;
    combo.value++;
    if (combo.value > bestCombo.value) bestCombo.value = combo.value;
    lastFeedback.value = "hit";

    setTimeout(() => (lastFeedback.value = null), 500);

    resetTurn();
    checkWin();
  } else {
    combo.value = 0;
    lastFeedback.value = "miss";

    setTimeout(() => {
      if (first.value) first.value.flipped = false;
      if (second.value) second.value.flipped = false;

      resetTurn();
      lastFeedback.value = null;
    }, 700);
  }
};

const resetTurn = () => {
  first.value = null;
  second.value = null;
  lock.value = false;
};

/* =========================================================
   WIN + REWARD
========================================================= */
const checkWin = async () => {
  const win = cards.value.every((c) => c.matched);

  if (win && !completed.value) {
    completed.value = true;
    stopTimer();

    const base = rewardMap[difficulty.value];
    const timeBonus = Math.max(0, 60 - elapsed.value) * 5;

    earnedCoins.value = base + timeBonus;

    setTimeout(() => (showModal.value = true), 500);
    await rewardPlayer();
  }
};

const rewardPlayer = async () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.id || !API) return;

  await fetch(`${API}/reward`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.id,
      coins: earnedCoins.value,
    }),
  });
};

/* =========================================================
   DIFFICULTY
========================================================= */
const setDifficulty = (level: Difficulty) => {
  difficulty.value = level;
  fetchAnimals();
};

/* =========================================================
   INIT
========================================================= */
onMounted(fetchAnimals);
</script>

<template>
  <div class="memory-page">
    <!-- ATMOSFERA -->
    <div class="atmos atmos-vignette" />
    <div class="atmos atmos-rays" />
    <div class="atmos atmos-grain" />
    <div class="atmos atmos-particles">
      <span v-for="n in 24" :key="n" class="particle" :style="{ '--i': n }" />
    </div>

    <div class="page-wrap">
      <!-- HEADER -->
      <header class="page-header">
        <div class="crest">
          <span class="crest-ring" />
          <span class="crest-ring crest-ring--outer" />
          <span class="crest-icon">𓆉</span>
        </div>
        <p class="eyebrow">
          <span class="eyebrow-line" />
          Archivum Paleontologicum · Cap. I
          <span class="eyebrow-line" />
        </p>
        <h1 class="display-title">
          <span class="title-word">Memória</span>
          <span class="title-and">·</span>
          <span class="title-word title-word--accent">Jurássica</span>
        </h1>
        <p class="subtitle">
          Revele os pares perdidos no tempo. Cada fóssil guarda
          uma <em>relíquia</em> esquecida pelas eras.
        </p>
      </header>

      <!-- HUD -->
      <section class="hud" :class="{ 'hud--alert': lastFeedback === 'miss', 'hud--hit': lastFeedback === 'hit' }">
        <div class="hud-frame">
          <div class="hud-corner hud-corner--tl" />
          <div class="hud-corner hud-corner--tr" />
          <div class="hud-corner hud-corner--bl" />
          <div class="hud-corner hud-corner--br" />

          <div class="hud-grid">
            <div class="stat">
              <div class="stat-orb">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                </svg>
              </div>
              <div class="stat-data">
                <span class="stat-label">Movimentos</span>
                <span class="stat-value">{{ moves }}</span>
              </div>
            </div>

            <div class="stat-divider" />

            <div class="stat">
              <div class="stat-orb">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <circle cx="12" cy="13" r="8" />
                  <path d="M12 9v4l2.5 2.5" stroke-linecap="round" />
                  <path d="M9 3h6" stroke-linecap="round" />
                </svg>
              </div>
              <div class="stat-data">
                <span class="stat-label">Tempo</span>
                <span class="stat-value mono">{{ formattedTime }}</span>
              </div>
            </div>

            <div class="stat-divider" />

            <div class="stat">
              <div class="stat-orb stat-orb--fire">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M12 3c1 4 5 5 5 10a5 5 0 1 1-10 0c0-2 1-3 2-4-1 3 1 4 2 4 0-3-2-5 1-10z" stroke-linejoin="round" />
                </svg>
              </div>
              <div class="stat-data">
                <span class="stat-label">Combo</span>
                <span class="stat-value">
                  ×{{ combo }}
                  <small v-if="bestCombo > 0" class="stat-best">máx {{ bestCombo }}</small>
                </span>
              </div>
            </div>

            <div class="stat-divider" />

            <div class="stat stat--wide">
              <div class="stat-data full">
                <div class="stat-line">
                  <span class="stat-label">Relíquias</span>
                  <span class="stat-mini">
                    <strong>{{ matchesFound }}</strong>
                    <span>/</span>
                    <span>{{ totalPairs }}</span>
                    <span class="stat-acc" v-if="accuracy > 0">· {{ accuracy }}%</span>
                  </span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" :style="{ width: progress + '%' }">
                    <span class="progress-shine" />
                  </div>
                  <div class="progress-ticks">
                    <span v-for="n in totalPairs" :key="n" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- DIFFICULTY -->
      <section class="difficulty-bar">
        <div class="diff-track">
          <button
            v-for="d in difficulties"
            :key="d"
            class="diff-btn"
            :class="{ active: difficulty === d, [d]: true }"
            @click="setDifficulty(d)"
          >
            <span class="diff-glyph">
              <template v-if="d === 'easy'">🥚</template>
              <template v-else-if="d === 'medium'">🦴</template>
              <template v-else>🦖</template>
            </span>
            <span class="diff-text">
              <span class="diff-name">
                {{ d === 'easy' ? 'Aprendiz' : d === 'medium' ? 'Escavador' : 'Paleontólogo' }}
              </span>
              <span class="diff-meta">
                {{ cardCountMap[d] * 2 }} cartas
              </span>
            </span>
            <span class="diff-reward">
              +{{ rewardMap[d] }}
              <img :src="moedaDoSite" alt="Moeda" class="diff-coin" />
            </span>
          </button>
        </div>

        <button class="reset-btn" @click="buildGame" title="Embaralhar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          <span>Reembaralhar</span>
        </button>
      </section>

      <!-- LOADING -->
      <div v-if="loading" class="loading">
        <div class="loader">
          <span class="loader-bone" />
          <span class="loader-bone" />
          <span class="loader-bone" />
        </div>
        <p>Escavando os arquivos do tempo…</p>
      </div>

      <!-- BOARD -->
      <section
        v-else
        class="board-wrap"
        :class="['feedback-' + (lastFeedback ?? 'idle')]"
      >
        <div class="board-frame">
          <span class="board-corner tl" />
          <span class="board-corner tr" />
          <span class="board-corner bl" />
          <span class="board-corner br" />

          <div class="board" :class="['cols-' + gridColsMap[difficulty]]">
            <div
              v-for="card in cards"
              :key="card.uid"
              class="card"
              :class="{
                flipped: card.flipped || card.matched,
                matched: card.matched
              }"
              @click="flipCard(card)"
            >
              <div class="card-inner">
                <div class="face face-front">
                  <div class="face-frame" />
                  <div class="face-emboss">
                    <svg viewBox="0 0 60 60" class="sigil" fill="none" stroke="currentColor" stroke-width="1.2">
                      <circle cx="30" cy="30" r="22" stroke-dasharray="3 3" />
                      <circle cx="30" cy="30" r="14" />
                      <path d="M30 12v8M30 40v8M12 30h8M40 30h8" stroke-linecap="round" />
                    </svg>
                    <span class="sigil-mark">A</span>
                  </div>
                </div>

                <div class="face face-back">
                  <div class="face-frame face-frame--gold" />
                  <div class="face-img">
                    <img
                      v-if="card.image"
                      :src="card.image"
                      :alt="card.name || 'fóssil'"
                    />
                    <span v-else class="fallback">🦖</span>
                  </div>
                  <div v-if="card.name" class="face-name">{{ card.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer class="page-foot">
        <span>“O passado dorme, mas a memória escava.”</span>
      </footer>
    </div>

    <!-- WIN MODAL -->
    <Transition name="fade-scale">
      <div v-if="showModal" class="modal" @click.self="showModal = false">
        <div class="modal-box">
          <div class="modal-rays" />
          <div class="confetti">
            <span v-for="n in 22" :key="n" :style="{ '--i': n }">✦</span>
          </div>

          <div class="trophy-wrap">
            <div class="trophy-ring" />
            <div class="trophy">🏆</div>
          </div>

          <p class="modal-eyebrow">Descoberta arqueológica</p>
          <h2 class="modal-title">Vitória<br />Paleontológica</h2>
          <p class="modal-sub">
            Você reuniu <strong>{{ totalPairs }} relíquias</strong> em
            <strong>{{ moves }}</strong> movimentos —
            <strong>{{ formattedTime }}</strong>.
          </p>

          <div class="modal-stats">
            <div>
              <span>Combo máx.</span>
              <strong>×{{ bestCombo }}</strong>
            </div>
            <div>
              <span>Precisão</span>
              <strong>{{ accuracy }}%</strong>
            </div>
            <div>
              <span>Tempo</span>
              <strong class="mono">{{ formattedTime }}</strong>
            </div>
          </div>

          <div class="reward-box">
            <img :src="moedaDoSite" alt="Moeda" class="coin-icon-img" />
            <div class="reward-text">
              <span class="reward-value">+{{ earnedCoins }}</span>
              <span class="reward-label">moedas conquistadas</span>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-primary" @click="buildGame">
              Nova expedição
            </button>
            <button class="btn-ghost" @click="showModal = false">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@500&display=swap');

/* =========================================================
   TOKENS LOCAIS (mantendo paleta âmbar/obsidiana)
========================================================= */
.memory-page {
  --ink-0: #080402;
  --ink-1: #110804;
  --ink-2: #1a0e06;
  --ink-3: #2a1608;
  --ink-4: #3b1d08;
  --bone: #f5e6c8;
  --bone-soft: #c9b69b;
  --gold-1: #8b6a1f;
  --gold-2: #b8860b;
  --gold-3: #d4af37;
  --gold-4: #fff3b0;
  --hit: #7ddca0;
  --miss: #e07070;

  position: relative;
  min-height: 100vh;
  padding: 64px 24px 96px;
  color: var(--bone);
  font-family: 'Cormorant Garamond', serif;
  background:
    radial-gradient(1200px 600px at 15% -10%, #3a1d08 0%, transparent 55%),
    radial-gradient(1000px 700px at 90% 110%, #4a2510 0%, transparent 55%),
    linear-gradient(180deg, #0d0603 0%, #070301 100%);
  overflow: hidden;
  isolation: isolate;
}

.page-wrap {
  position: relative;
  z-index: 2;
  max-width: 980px;
  margin: 0 auto;
}

/* =========================================================
   ATMOSFERA
========================================================= */
.atmos { position: absolute; inset: 0; pointer-events: none; z-index: 1; }

.atmos-vignette {
  background:
    radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,.65) 100%);
}

.atmos-rays {
  background:
    conic-gradient(from 200deg at 50% -10%,
      transparent 0deg,
      rgba(212,175,55,.05) 12deg,
      transparent 24deg,
      rgba(212,175,55,.04) 40deg,
      transparent 60deg,
      rgba(212,175,55,.06) 80deg,
      transparent 100deg);
  mix-blend-mode: screen;
  opacity: .9;
}

.atmos-grain {
  background-image:
    radial-gradient(rgba(255,243,176,.04) 1px, transparent 1px),
    radial-gradient(rgba(255,243,176,.03) 1px, transparent 1px);
  background-size: 3px 3px, 7px 7px;
  background-position: 0 0, 1px 2px;
  mix-blend-mode: overlay;
  opacity: .5;
}

.atmos-particles { overflow: hidden; }
.particle {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff3b0, rgba(255,243,176,0) 70%);
  left: calc((var(--i) * 4.1%) - 2%);
  bottom: -10%;
  opacity: 0;
  animation: rise calc(14s + (var(--i) * 0.4s)) linear infinite;
  animation-delay: calc(var(--i) * -0.7s);
  filter: blur(.3px);
}
@keyframes rise {
  0%   { transform: translateY(0) translateX(0); opacity: 0; }
  10%  { opacity: .9; }
  90%  { opacity: .6; }
  100% { transform: translateY(-110vh) translateX(40px); opacity: 0; }
}

/* =========================================================
   HEADER
========================================================= */
.page-header {
  text-align: center;
  margin-bottom: 44px;
}

.crest {
  position: relative;
  width: 76px;
  height: 76px;
  margin: 0 auto 14px;
  display: grid;
  place-items: center;
}
.crest-ring {
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(212,175,55,.45);
  border-radius: 50%;
  box-shadow:
    inset 0 0 12px rgba(212,175,55,.2),
    0 0 24px rgba(212,175,55,.15);
}
.crest-ring--outer {
  inset: 0;
  border: 1px dashed rgba(212,175,55,.28);
  animation: spin 30s linear infinite;
}
.crest-icon {
  font-size: 1.9rem;
  color: var(--gold-3);
  filter: drop-shadow(0 0 10px rgba(212,175,55,.55));
  z-index: 1;
}
@keyframes spin { to { transform: rotate(360deg); } }

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  font-family: 'Cinzel', serif;
  font-size: .7rem;
  letter-spacing: .42em;
  text-transform: uppercase;
  color: var(--gold-3);
  margin: 4px 0 14px;
}
.eyebrow-line {
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-3), transparent);
}

.display-title {
  font-family: 'Cinzel', serif;
  font-weight: 600;
  font-size: clamp(2.4rem, 6vw, 4.2rem);
  line-height: 1;
  margin: 0;
  letter-spacing: .02em;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: .35em;
  flex-wrap: wrap;
}
.title-word {
  background: linear-gradient(180deg, #fff8de 0%, #f5e6c8 40%, #b8860b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 30px rgba(212,175,55,.18);
}
.title-and {
  color: var(--gold-3);
  font-size: .7em;
  opacity: .6;
}
.title-word--accent {
  background: linear-gradient(180deg, #ffe79a 0%, #d4af37 50%, #6b4d10 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-style: italic;
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
}

.subtitle {
  max-width: 520px;
  margin: 18px auto 0;
  font-size: 1.05rem;
  color: var(--bone-soft);
  line-height: 1.55;
  opacity: .85;
}
.subtitle em {
  color: var(--gold-3);
  font-style: italic;
}

/* =========================================================
   HUD
========================================================= */
.hud { margin-bottom: 28px; }
.hud-frame {
  position: relative;
  padding: 22px 28px;
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(40,22,10,.85), rgba(15,8,4,.92));
  border: 1px solid rgba(212,175,55,.18);
  box-shadow:
    inset 0 1px 0 rgba(255,243,176,.06),
    inset 0 0 0 1px rgba(0,0,0,.4),
    0 30px 60px -20px rgba(0,0,0,.7);
  transition: box-shadow .35s ease, border-color .35s ease;
}
.hud--hit .hud-frame {
  border-color: rgba(125,220,160,.45);
  box-shadow:
    inset 0 1px 0 rgba(255,243,176,.06),
    0 0 0 1px rgba(125,220,160,.25),
    0 30px 60px -20px rgba(0,0,0,.7),
    0 0 40px rgba(125,220,160,.18);
}
.hud--alert .hud-frame {
  border-color: rgba(224,112,112,.45);
  animation: nudge .35s ease;
}
@keyframes nudge {
  0%,100% { transform: translateX(0); }
  30% { transform: translateX(-4px); }
  70% { transform: translateX(4px); }
}

.hud-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 1px solid var(--gold-3);
  opacity: .6;
}
.hud-corner--tl { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.hud-corner--tr { top: -1px; right: -1px; border-left: none; border-bottom: none; }
.hud-corner--bl { bottom: -1px; left: -1px; border-right: none; border-top: none; }
.hud-corner--br { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.hud-grid {
  display: grid;
  grid-template-columns: auto 1px auto 1px auto 1px 1.4fr;
  align-items: center;
  gap: 18px;
}
.stat-divider {
  width: 1px;
  height: 44px;
  background: linear-gradient(180deg, transparent, rgba(212,175,55,.25), transparent);
}
.stat {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.stat--wide { width: 100%; }
.stat-orb {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  color: var(--gold-3);
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 25%, rgba(255,243,176,.2), rgba(212,175,55,.05) 60%),
    rgba(40,22,10,.6);
  border: 1px solid rgba(212,175,55,.3);
  box-shadow: inset 0 0 10px rgba(0,0,0,.4);
}
.stat-orb svg { width: 20px; height: 20px; }
.stat-orb--fire {
  color: #ffb46b;
  animation: emberPulse 2.4s ease-in-out infinite;
}
@keyframes emberPulse {
  0%,100% { box-shadow: inset 0 0 10px rgba(0,0,0,.4), 0 0 8px rgba(255,140,60,.15); }
  50%     { box-shadow: inset 0 0 10px rgba(0,0,0,.4), 0 0 18px rgba(255,140,60,.45); }
}
.stat-data { display: flex; flex-direction: column; min-width: 0; }
.stat-data.full { width: 100%; }
.stat-label {
  font-family: 'Cinzel', serif;
  font-size: .62rem;
  letter-spacing: .3em;
  text-transform: uppercase;
  color: var(--bone-soft);
  opacity: .7;
}
.stat-value {
  font-family: 'Cinzel', serif;
  font-size: 1.4rem;
  color: var(--bone);
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.stat-value.mono { font-family: 'JetBrains Mono', monospace; font-size: 1.25rem; letter-spacing: .04em; }
.stat-best {
  font-family: 'Cormorant Garamond', serif;
  font-size: .75rem;
  color: var(--bone-soft);
  opacity: .6;
  font-style: italic;
}

.stat-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.stat-mini {
  font-family: 'Cinzel', serif;
  font-size: .85rem;
  color: var(--bone);
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}
.stat-mini strong { color: var(--gold-3); font-size: 1rem; }
.stat-acc { color: var(--bone-soft); opacity: .7; font-size: .75rem; }

.progress-track {
  position: relative;
  height: 10px;
  border-radius: 2px;
  background:
    repeating-linear-gradient(45deg,
      rgba(255,255,255,.025) 0 6px,
      transparent 6px 12px),
    rgba(0,0,0,.4);
  border: 1px solid rgba(212,175,55,.2);
  overflow: hidden;
}
.progress-fill {
  position: relative;
  height: 100%;
  background: linear-gradient(90deg, #8b6a1f, #d4af37 50%, #fff3b0);
  box-shadow: 0 0 14px rgba(212,175,55,.55);
  transition: width .5s cubic-bezier(.3,.2,.2,1.2);
  overflow: hidden;
}
.progress-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent);
  transform: translateX(-100%);
  animation: shineSweep 2.4s ease-in-out infinite;
}
@keyframes shineSweep {
  0%   { transform: translateX(-100%); }
  60%,100% { transform: translateX(200%); }
}
.progress-ticks {
  position: absolute;
  inset: 0;
  display: flex;
  pointer-events: none;
}
.progress-ticks span {
  flex: 1;
  border-right: 1px solid rgba(0,0,0,.4);
}
.progress-ticks span:last-child { border-right: none; }

/* =========================================================
   DIFFICULTY
========================================================= */
.difficulty-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 36px;
}
.diff-track {
  display: flex;
  gap: 10px;
  padding: 8px;
  border-radius: 6px;
  background: rgba(15,8,4,.7);
  border: 1px solid rgba(212,175,55,.15);
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.4);
  flex: 1 1 auto;
}
.diff-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 4px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--bone);
  font-family: 'Cormorant Garamond', serif;
  text-align: left;
  cursor: pointer;
  transition: all .3s ease;
  position: relative;
  overflow: hidden;
}
.diff-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(212,175,55,.0), rgba(212,175,55,.08));
  opacity: 0;
  transition: opacity .3s ease;
}
.diff-btn:hover::before { opacity: 1; }
.diff-btn:hover {
  border-color: rgba(212,175,55,.25);
}
.diff-btn.active {
  background: linear-gradient(135deg, rgba(184,134,11,.95), rgba(212,175,55,.95));
  border-color: rgba(255,243,176,.6);
  color: #1a0f08;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.4),
    0 8px 24px -8px rgba(212,175,55,.55);
}
.diff-btn.active::before { opacity: 0; }

.diff-glyph {
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,.4));
}
.diff-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  min-width: 0;
  flex: 1;
}
.diff-name {
  font-family: 'Cinzel', serif;
  font-size: .85rem;
  letter-spacing: .04em;
}
.diff-meta {
  font-size: .72rem;
  opacity: .65;
  font-style: italic;
}
.diff-btn.active .diff-meta { opacity: .8; }

.diff-reward {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Cinzel', serif;
  font-size: .8rem;
  padding: 4px 10px;
  border-radius: 99px;
  background: rgba(0,0,0,.25);
  border: 1px solid rgba(212,175,55,.2);
}
.diff-btn.active .diff-reward {
  background: rgba(26,15,8,.4);
  border-color: rgba(26,15,8,.3);
  color: #1a0f08;
}
.diff-coin {
  width: 16px;
  height: 16px;
  object-fit: contain;
  filter: drop-shadow(0 0 4px rgba(212,175,55,.5));
}

.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 4px;
  background: transparent;
  border: 1px solid rgba(212,175,55,.3);
  color: var(--gold-3);
  font-family: 'Cinzel', serif;
  font-size: .8rem;
  letter-spacing: .12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all .3s ease;
}
.reset-btn svg { width: 16px; height: 16px; }
.reset-btn:hover {
  background: rgba(212,175,55,.08);
  border-color: var(--gold-3);
  box-shadow: 0 0 18px rgba(212,175,55,.2);
}
.reset-btn:hover svg { animation: spin 1s linear; }

/* =========================================================
   LOADING
========================================================= */
.loading {
  text-align: center;
  padding: 80px 0;
  color: var(--bone-soft);
  font-style: italic;
  font-size: 1.05rem;
}
.loader {
  display: inline-flex;
  gap: 6px;
  margin-bottom: 18px;
}
.loader-bone {
  width: 8px;
  height: 28px;
  background: linear-gradient(180deg, var(--gold-3), var(--gold-1));
  border-radius: 4px;
  animation: boneBounce 1s ease-in-out infinite;
}
.loader-bone:nth-child(2) { animation-delay: .15s; }
.loader-bone:nth-child(3) { animation-delay: .3s; }
@keyframes boneBounce {
  0%,100% { transform: scaleY(.6); opacity: .5; }
  50%     { transform: scaleY(1); opacity: 1; }
}

/* =========================================================
   BOARD
========================================================= */
.board-wrap {
  position: relative;
  max-width: 620px;
  margin: 0 auto;
  transition: filter .35s ease;
}
.board-wrap.feedback-hit { filter: drop-shadow(0 0 18px rgba(125,220,160,.3)); }
.board-wrap.feedback-miss { animation: shake .35s ease; }
@keyframes shake {
  0%,100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

.board-frame {
  position: relative;
  padding: 24px;
  border-radius: 8px;
  background:
    radial-gradient(circle at 50% 0%, rgba(212,175,55,.10), transparent 65%),
    linear-gradient(160deg, rgba(40,22,10,.7), rgba(15,8,4,.88));
  border: 1px solid rgba(212,175,55,.2);
  box-shadow:
    inset 0 1px 0 rgba(255,243,176,.06),
    inset 0 0 0 1px rgba(0,0,0,.4),
    0 40px 80px -30px rgba(0,0,0,.8);
}
.board-corner {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 1px solid var(--gold-3);
  opacity: .7;
}
.board-corner.tl { top: 8px; left: 8px; border-right: none; border-bottom: none; }
.board-corner.tr { top: 8px; right: 8px; border-left: none; border-bottom: none; }
.board-corner.bl { bottom: 8px; left: 8px; border-right: none; border-top: none; }
.board-corner.br { bottom: 8px; right: 8px; border-left: none; border-top: none; }

.board {
  display: grid;
  gap: 14px;
}
.board.cols-4 { grid-template-columns: repeat(4, 1fr); }

/* =========================================================
   CARDS
========================================================= */
.card {
  aspect-ratio: 1 / 1;
  perspective: 1200px;
  cursor: pointer;
}
.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform .6s cubic-bezier(.4,.2,.2,1.15);
}
.card.flipped .card-inner { transform: rotateY(180deg); }
.card:hover .card-inner { transform: translateY(-4px); }
.card.flipped:hover .card-inner { transform: rotateY(180deg) translateY(-4px); }

.face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  backface-visibility: hidden;
  overflow: hidden;
}

/* FRONT — costas da carta (selo arqueológico) */
.face-front {
  background:
    radial-gradient(circle at 50% 30%, rgba(212,175,55,.14), transparent 60%),
    radial-gradient(circle at 50% 100%, rgba(0,0,0,.6), transparent 60%),
    linear-gradient(160deg, #4a2a12 0%, #2a1608 60%, #160c06 100%);
  border: 1px solid rgba(212,175,55,.25);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.06),
    inset 0 -20px 30px rgba(0,0,0,.5);
}
.face-frame {
  position: absolute;
  inset: 6px;
  border-radius: 4px;
  border: 1px solid rgba(212,175,55,.25);
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.4);
  pointer-events: none;
}
.face-frame::before,
.face-frame::after {
  content: "";
  position: absolute;
  width: 10px;
  height: 10px;
  border: 1px solid rgba(212,175,55,.6);
}
.face-frame::before {
  top: -1px; left: -1px;
  border-right: none; border-bottom: none;
}
.face-frame::after {
  bottom: -1px; right: -1px;
  border-left: none; border-top: none;
}

.face-emboss {
  position: relative;
  width: 70%;
  height: 70%;
  display: grid;
  place-items: center;
  color: var(--gold-3);
  filter: drop-shadow(0 0 10px rgba(212,175,55,.4));
}
.sigil {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  animation: spin 22s linear infinite;
  opacity: .7;
}
.sigil-mark {
  position: relative;
  font-family: 'Cinzel', serif;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--gold-3);
  text-shadow: 0 0 14px rgba(212,175,55,.55);
}

/* BACK — frente revelada */
.face-back {
  background:
    radial-gradient(circle at 50% 0%, #382010, #160a04);
  border: 1px solid rgba(212,175,55,.3);
  transform: rotateY(180deg);
  padding: 6px;
  flex-direction: column;
}
.face-frame--gold {
  border-color: rgba(255,243,176,.35);
}
.face-img {
  flex: 1;
  width: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 4px;
  position: relative;
  z-index: 1;
}
.face-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: 4px;
}
.face-back .fallback { font-size: 2.4rem; }

.face-name {
  position: relative;
  z-index: 1;
  width: 100%;
  text-align: center;
  margin-top: 4px;
  font-family: 'Cinzel', serif;
  font-size: .58rem;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: var(--gold-4);
  opacity: 0;
  transition: opacity .4s ease .2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
}
.card.matched .face-name { opacity: .9; }

.card.matched .card-inner { animation: matched .8s ease; }
.card.matched .face-back {
  border-color: var(--gold-3);
  box-shadow:
    inset 0 0 0 1px rgba(255,243,176,.5),
    0 0 30px rgba(212,175,55,.5);
}
@keyframes matched {
  0%   { transform: rotateY(180deg) scale(1); }
  40%  { transform: rotateY(180deg) scale(1.08); }
  100% { transform: rotateY(180deg) scale(1); }
}

/* =========================================================
   FOOTER
========================================================= */
.page-foot {
  text-align: center;
  margin-top: 40px;
  color: var(--bone-soft);
  font-style: italic;
  font-size: .9rem;
  opacity: .5;
  letter-spacing: .02em;
}

/* =========================================================
   MODAL
========================================================= */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.78);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal-box {
  position: relative;
  width: min(480px, 100%);
  padding: 40px 32px 32px;
  border-radius: 10px;
  text-align: center;
  background:
    radial-gradient(circle at 50% 0%, rgba(212,175,55,.22), transparent 65%),
    linear-gradient(160deg, #2a1608, #0e0502);
  border: 1px solid rgba(212,175,55,.35);
  box-shadow:
    inset 0 1px 0 rgba(255,243,176,.1),
    0 50px 100px rgba(0,0,0,.7);
  overflow: hidden;
}
.modal-rays {
  position: absolute;
  inset: 0;
  background:
    conic-gradient(from 90deg at 50% 0%,
      transparent 0deg,
      rgba(212,175,55,.15) 30deg,
      transparent 60deg,
      rgba(212,175,55,.1) 90deg,
      transparent 120deg);
  opacity: .8;
  pointer-events: none;
  animation: spin 28s linear infinite;
}

.confetti {
  position: absolute; inset: 0;
  pointer-events: none; overflow: hidden;
}
.confetti span {
  position: absolute;
  top: -10%;
  left: calc(var(--i) * 4.5%);
  color: var(--gold-3);
  font-size: 1rem;
  animation: fall 3.5s linear infinite;
  animation-delay: calc(var(--i) * -.18s);
  opacity: .8;
}
@keyframes fall {
  0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translateY(560px) rotate(540deg); opacity: 0; }
}

.trophy-wrap {
  position: relative;
  width: 88px;
  height: 88px;
  margin: 0 auto;
  display: grid;
  place-items: center;
}
.trophy-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dashed rgba(212,175,55,.5);
  animation: spin 16s linear infinite;
}
.trophy-ring::after {
  content: "";
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  border: 1px solid rgba(212,175,55,.3);
  box-shadow: inset 0 0 18px rgba(212,175,55,.25);
}
.trophy {
  position: relative;
  font-size: 3rem;
  filter: drop-shadow(0 0 22px rgba(212,175,55,.6));
  animation: bob 2.4s ease-in-out infinite;
}
@keyframes bob {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-6px); }
}

.modal-eyebrow {
  margin: 18px 0 6px;
  font-family: 'Cinzel', serif;
  font-size: .65rem;
  letter-spacing: .42em;
  text-transform: uppercase;
  color: var(--gold-3);
  opacity: .85;
  position: relative;
}
.modal-title {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.8rem, 5vw, 2.4rem);
  line-height: 1;
  margin: 0 0 14px;
  background: linear-gradient(180deg, #fff3b0, #d4af37 60%, #8b6a1f);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  position: relative;
}
.modal-sub {
  color: var(--bone-soft);
  margin: 0 0 22px;
  font-size: 1.02rem;
  line-height: 1.5;
  position: relative;
}
.modal-sub strong { color: var(--bone); font-weight: 600; }

.modal-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 22px;
  padding: 14px 8px;
  border-radius: 6px;
  background: rgba(0,0,0,.3);
  border: 1px solid rgba(212,175,55,.15);
  position: relative;
}
.modal-stats > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.modal-stats span {
  font-family: 'Cinzel', serif;
  font-size: .58rem;
  letter-spacing: .25em;
  text-transform: uppercase;
  color: var(--bone-soft);
  opacity: .7;
}
.modal-stats strong {
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  color: var(--gold-4);
}
.modal-stats strong.mono { font-family: 'JetBrains Mono', monospace; font-size: 1.05rem; }

.reward-box {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 14px 22px;
  margin-bottom: 24px;
  border-radius: 8px;
  background: linear-gradient(160deg, rgba(212,175,55,.2), rgba(212,175,55,.04));
  border: 1px solid rgba(212,175,55,.4);
  box-shadow: 0 0 30px rgba(212,175,55,.15);
}
.coin-icon-img {
  width: 44px;
  height: 44px;
  object-fit: contain;
  filter: drop-shadow(0 0 12px rgba(212,175,55,.55));
  animation: coinFloat 2.5s ease-in-out infinite;
}
@keyframes coinFloat {
  0%,100% { transform: translateY(0) rotate(0deg); }
  50%     { transform: translateY(-5px) rotate(8deg); }
}
.reward-text {
  display: flex;
  flex-direction: column;
  text-align: left;
  line-height: 1;
}
.reward-value {
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  color: var(--gold-4);
  text-shadow: 0 0 16px rgba(212,175,55,.6);
}
.reward-label {
  margin-top: 4px;
  letter-spacing: .22em;
  text-transform: uppercase;
  font-size: .65rem;
  color: var(--bone-soft);
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  position: relative;
}
.btn-primary,
.btn-ghost {
  padding: 13px 22px;
  border-radius: 4px;
  font-family: 'Cinzel', serif;
  font-size: .8rem;
  letter-spacing: .14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all .25s ease;
}
.btn-primary {
  border: none;
  background: linear-gradient(135deg, #b8860b, #d4af37);
  color: #1a0f08;
  font-weight: 700;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.3),
    0 10px 28px -8px rgba(212,175,55,.5);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.4),
    0 14px 34px -8px rgba(212,175,55,.7);
}
.btn-ghost {
  background: transparent;
  border: 1px solid rgba(212,175,55,.3);
  color: var(--bone);
}
.btn-ghost:hover {
  background: rgba(212,175,55,.08);
  border-color: var(--gold-3);
}

/* TRANSITION */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity .35s ease, transform .35s cubic-bezier(.3,.2,.2,1.2);
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(.92) translateY(8px);
}

/* =========================================================
   RESPONSIVE
========================================================= */
@media (max-width: 760px) {
  .memory-page { padding: 40px 16px 60px; }
  .hud-grid {
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .stat-divider { display: none; }
  .stat--wide { grid-column: 1 / -1; }
  .diff-track { flex-direction: column; }
  .diff-btn { width: 100%; }
  .board-frame { padding: 14px; }
  .board { gap: 10px; }
  .sigil-mark { font-size: 1.4rem; }
  .modal-stats { grid-template-columns: repeat(3, 1fr); }
  .modal-stats strong { font-size: 1rem; }
}
</style>
