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
const lastFeedback = ref<"hit" | "miss" | null>(null);

/* =========================================================
   FIX: lista segura para template (SEM CAST)
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
   SHUFFLE (mais seguro que sort aleatório)
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
    <!-- BG layers -->
    <div class="bg-glow" />
    <div class="bg-grid" />
    <div class="bg-fossils">
      <span class="fossil f1">🦴</span>
      <span class="fossil f2">🦖</span>
      <span class="fossil f3">🥚</span>
      <span class="fossil f4">🦕</span>
      <span class="fossil f5">🌿</span>
      <span class="fossil f6">🦴</span>
    </div>

    <!-- HEADER -->
    <header class="page-header">
      <div class="emblem">🧠</div>
      <p class="eyebrow">Expedição da Memória</p>
      <h1>Memória Jurássica</h1>
      <p class="subtitle">
        Encontre os pares de fósseis e desperte os antigos guardiões.
      </p>
    </header>

    <!-- HUD -->
    <section class="hud">
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-body">
          <span class="stat-label">Movimentos</span>
          <span class="stat-value">{{ moves }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-body">
          <span class="stat-label">Tempo</span>
          <span class="stat-value">{{ formattedTime }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-body">
          <span class="stat-label">Combo</span>
          <span class="stat-value">x{{ combo }}</span>
        </div>
      </div>

      <div class="stat-card progress-card">
        <div class="stat-body full">
          <span class="stat-label">
            Pares {{ matchesFound }} / {{ totalPairs }}
          </span>
          <div class="progress">
            <div class="progress-fill" :style="{ width: progress + '%' }" />
          </div>
        </div>
      </div>
    </section>

    <!-- DIFFICULTY -->
    <section class="difficulty-bar">
      <button
        v-for="d in (['easy','medium','hard'] as Difficulty[])"
        :key="d"
        class="diff-btn"
        :class="{ active: difficulty === d, [d]: true }"
        @click="setDifficulty(d)"
      >
        <span class="diff-icon">
          {{ d === 'easy' ? '🥚' : d === 'medium' ? '🦴' : '🦖' }}
        </span>
        <span class="diff-label">
          {{ d === 'easy' ? 'Fácil' : d === 'medium' ? 'Médio' : 'Difícil' }}
        </span>
        <span class="diff-reward">+{{ rewardMap[d] }} 🪙</span>
      </button>

      <button class="reset-btn" @click="buildGame" title="Embaralhar">
        <span>🔄</span> Embaralhar
      </button>
    </section>

    <!-- LOADING -->
    <div v-if="loading" class="loading">
      <div class="loader-ring" />
      <p>🧬 Escavando fósseis...</p>
    </div>

    <!-- BOARD -->
    <section
      v-else
      class="board"
      :class="['feedback-' + (lastFeedback ?? 'idle'), 'cols-' + gridColsMap[difficulty]]"
    >
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
            <div class="rune">?</div>
            <div class="ornament" />
          </div>

          <div class="face face-back">
            <img
              v-if="card.image"
              :src="card.image"
              :alt="card.name || 'fóssil'"
            />
            <span v-else class="fallback">🦖</span>
          </div>
        </div>
      </div>
    </section>

    <!-- WIN MODAL -->
    <Transition name="fade-scale">
      <div v-if="showModal" class="modal" @click.self="showModal = false">
        <div class="modal-box">
          <div class="confetti">
            <span v-for="n in 18" :key="n" :style="{ '--i': n }">✦</span>
          </div>

          <div class="trophy">🏆</div>
          <h2>Vitória Paleontológica!</h2>
          <p class="modal-sub">
            Você descobriu todos os fósseis em
            <strong>{{ moves }}</strong> movimentos
            e <strong>{{ formattedTime }}</strong>.
          </p>

          <div class="reward-box">
            <img
              :src="moedaDoSite"
              alt="Moeda"
              class="coin-icon-img"
            />
            <span class="reward-value">+{{ earnedCoins }}</span>
            <span class="reward-label">moedas</span>
          </div>

          <div class="modal-actions">
            <button class="btn-primary" @click="buildGame">
              🔁 Jogar novamente
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
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Crimson+Text:ital,wght@0,400;1,400&display=swap');

/* =========================================================
   BASE
========================================================= */
.memory-page {
  position: relative;
  min-height: 100vh;
  padding: 50px 24px 80px;
  color: #f5e6c8;
  font-family: 'Crimson Text', serif;
  background:
    radial-gradient(circle at 20% 0%, #2a1608 0%, transparent 55%),
    radial-gradient(circle at 80% 100%, #3b1d08 0%, transparent 55%),
    linear-gradient(180deg, #110804 0%, #0b0503 100%);
  overflow: hidden;
}

.bg-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 30%, rgba(212,175,55,0.10), transparent 60%);
  pointer-events: none;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(212,175,55,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212,175,55,0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(circle at center, #000 30%, transparent 80%);
  pointer-events: none;
}

.bg-fossils {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.fossil {
  position: absolute;
  font-size: 3rem;
  opacity: 0.06;
  animation: drift 18s ease-in-out infinite;
}
.f1 { top: 8%;  left: 6%;  animation-delay: 0s; }
.f2 { top: 20%; right: 8%; animation-delay: -3s; font-size: 4.5rem; }
.f3 { top: 65%; left: 4%;  animation-delay: -6s; }
.f4 { bottom: 10%; right: 12%; animation-delay: -9s; font-size: 4rem; }
.f5 { top: 45%; left: 50%; animation-delay: -12s; }
.f6 { bottom: 30%; left: 30%; animation-delay: -15s; }

@keyframes drift {
  0%, 100% { transform: translate(0,0) rotate(0deg); }
  50%      { transform: translate(20px,-20px) rotate(8deg); }
}

/* =========================================================
   HEADER
========================================================= */
.page-header {
  position: relative;
  text-align: center;
  margin-bottom: 36px;
}
.emblem {
  font-size: 2.6rem;
  filter: drop-shadow(0 0 12px rgba(212,175,55,0.5));
  animation: bob 3s ease-in-out infinite;
}
@keyframes bob {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-6px); }
}
.eyebrow {
  letter-spacing: .35em;
  text-transform: uppercase;
  font-size: .75rem;
  color: #d4af37;
  margin: 6px 0 4px;
  font-family: 'Cinzel', serif;
}
.page-header h1 {
  font-family: 'Cinzel', serif;
  font-size: clamp(2rem, 5vw, 3rem);
  margin: 0 0 8px;
  background: linear-gradient(180deg, #f5e6c8 0%, #d4af37 60%, #8b6a1f 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 24px rgba(212,175,55,0.15);
}
.subtitle {
  color: #c9b69b;
  opacity: .8;
  font-style: italic;
  margin: 0;
}

/* =========================================================
   HUD
========================================================= */
.hud {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0,1fr));
  gap: 14px;
  max-width: 880px;
  margin: 0 auto 24px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: linear-gradient(160deg, rgba(40,22,10,0.85), rgba(20,10,5,0.85));
  border: 1px solid rgba(212,175,55,0.18);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.04),
    0 8px 24px rgba(0,0,0,0.4);
  backdrop-filter: blur(6px);
  transition: transform .25s ease, border-color .25s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(212,175,55,0.4);
}
.stat-icon {
  font-size: 1.6rem;
  filter: drop-shadow(0 0 6px rgba(212,175,55,.4));
}
.stat-body { display: flex; flex-direction: column; min-width: 0; }
.stat-body.full { width: 100%; }
.stat-label {
  font-size: .7rem;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: #c9b69b;
  opacity: .75;
  font-family: 'Cinzel', serif;
}
.stat-value {
  font-family: 'Cinzel', serif;
  font-size: 1.4rem;
  color: #f5e6c8;
}
.progress {
  margin-top: 8px;
  height: 8px;
  border-radius: 99px;
  background: rgba(255,255,255,0.06);
  overflow: hidden;
  border: 1px solid rgba(212,175,55,0.15);
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #b8860b, #d4af37, #fff3b0, #d4af37);
  background-size: 200% 100%;
  animation: shine 2s linear infinite;
  transition: width .4s ease;
}
@keyframes shine {
  0% { background-position: 0% 0; }
  100% { background-position: 200% 0; }
}

/* =========================================================
   DIFFICULTY
========================================================= */
.difficulty-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  max-width: 880px;
  margin: 0 auto 28px;
}
.diff-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(40,22,10,0.6);
  border: 1px solid rgba(212,175,55,0.2);
  color: #f5e6c8;
  font-family: 'Cinzel', serif;
  font-size: .85rem;
  cursor: pointer;
  transition: all .25s ease;
}
.diff-btn:hover {
  border-color: #d4af37;
  transform: translateY(-2px);
}
.diff-btn.active {
  background: linear-gradient(135deg, #b8860b, #d4af37);
  color: #1a0f08;
  border-color: #fff3b0;
  box-shadow: 0 0 20px rgba(212,175,55,.4);
}
.diff-reward {
  font-size: .75rem;
  opacity: .8;
}
.diff-btn.active .diff-reward { opacity: 1; }

.reset-btn {
  padding: 10px 16px;
  border-radius: 999px;
  background: transparent;
  border: 1px dashed rgba(212,175,55,0.4);
  color: #d4af37;
  font-family: 'Cinzel', serif;
  cursor: pointer;
  transition: all .25s ease;
}
.reset-btn:hover {
  background: rgba(212,175,55,0.1);
  transform: rotate(8deg);
}

/* =========================================================
   LOADING
========================================================= */
.loading {
  text-align: center;
  padding: 60px 0;
  color: #c9b69b;
}
.loader-ring {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  border: 3px solid rgba(212,175,55,0.15);
  border-top-color: #d4af37;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* =========================================================
   BOARD
========================================================= */
.board {
  display: grid;
  gap: 14px;
  max-width: 560px;
  margin: 0 auto;
  padding: 22px;
  border-radius: 22px;
  background:
    radial-gradient(circle at 50% 0%, rgba(212,175,55,0.08), transparent 60%),
    linear-gradient(160deg, rgba(40,22,10,0.7), rgba(15,8,4,0.85));
  border: 1px solid rgba(212,175,55,0.18);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.04),
    0 24px 60px rgba(0,0,0,0.55);
  transition: box-shadow .35s ease;
}
.board.cols-4 { grid-template-columns: repeat(4, 1fr); }

.board.feedback-hit {
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.06),
    0 0 0 2px rgba(120, 220, 150, .35),
    0 24px 60px rgba(0,0,0,0.55);
}
.board.feedback-miss {
  animation: shake .35s ease;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.06),
    0 0 0 2px rgba(220, 80, 80, .35),
    0 24px 60px rgba(0,0,0,0.55);
}
@keyframes shake {
  0%,100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

/* =========================================================
   CARDS
========================================================= */
.card {
  aspect-ratio: 1 / 1;
  perspective: 1000px;
  cursor: pointer;
}
.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform .55s cubic-bezier(.4,.2,.2,1.1);
  border-radius: 14px;
}
.card.flipped .card-inner {
  transform: rotateY(180deg);
}
.card:hover .card-inner {
  transform: translateY(-3px) scale(1.02);
}
.card.flipped:hover .card-inner {
  transform: rotateY(180deg) translateY(-3px) scale(1.02);
}

.face {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  backface-visibility: hidden;
  overflow: hidden;
}

.face-front {
  background:
    radial-gradient(circle at 30% 30%, rgba(212,175,55,0.18), transparent 55%),
    linear-gradient(160deg, #4a2a12 0%, #2a1608 70%, #1c100a 100%);
  border: 1px solid rgba(212,175,55,0.25);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.06),
    inset 0 -10px 20px rgba(0,0,0,0.4);
}
.face-front .rune {
  font-family: 'Cinzel', serif;
  font-size: 2.2rem;
  font-weight: 700;
  color: #d4af37;
  text-shadow: 0 0 14px rgba(212,175,55,0.6);
  animation: pulse 2.4s ease-in-out infinite;
}
@keyframes pulse {
  0%,100% { transform: scale(1); opacity: .9; }
  50%     { transform: scale(1.08); opacity: 1; }
}
.face-front .ornament {
  position: absolute;
  inset: 6px;
  border-radius: 10px;
  border: 1px dashed rgba(212,175,55,0.25);
  pointer-events: none;
}

.face-back {
  background:
    radial-gradient(circle at 50% 30%, #2a1a0c, #120904);
  border: 1px solid rgba(212,175,55,0.25);
  transform: rotateY(180deg);
}

.face-back img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: 14px;
}

.face-back .fallback {
  font-size: 2.4rem;
}

.card.matched .card-inner {
  animation: matched .6s ease;
}
.card.matched .face-back {
  border-color: #d4af37;
  box-shadow:
    inset 0 0 0 1px rgba(255,243,176,0.4),
    0 0 24px rgba(212,175,55,0.45);
}
@keyframes matched {
  0%   { transform: rotateY(180deg) scale(1); }
  40%  { transform: rotateY(180deg) scale(1.1); }
  100% { transform: rotateY(180deg) scale(1); }
}

/* =========================================================
   MODAL
========================================================= */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal-box {
  position: relative;
  width: min(440px, 100%);
  padding: 36px 28px 28px;
  border-radius: 22px;
  text-align: center;
  background:
    radial-gradient(circle at 50% 0%, rgba(212,175,55,0.18), transparent 60%),
    linear-gradient(160deg, #2a1608, #110804);
  border: 1px solid rgba(212,175,55,0.3);
  box-shadow:
    0 0 0 1px rgba(255,243,176,0.05),
    0 40px 80px rgba(0,0,0,0.6);
  overflow: hidden;
}
.confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.confetti span {
  position: absolute;
  top: -10%;
  left: calc(var(--i) * 5.5%);
  color: #d4af37;
  font-size: 1rem;
  animation: fall 3s linear infinite;
  animation-delay: calc(var(--i) * -0.2s);
  opacity: .8;
}
@keyframes fall {
  0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translateY(500px) rotate(360deg); opacity: 0; }
}

.trophy {
  font-size: 3.6rem;
  filter: drop-shadow(0 0 18px rgba(212,175,55,0.6));
  animation: bob 2s ease-in-out infinite;
}
.modal-box h2 {
  font-family: 'Cinzel', serif;
  margin: 8px 0 6px;
  background: linear-gradient(180deg, #fff3b0, #d4af37);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.modal-sub {
  color: #c9b69b;
  margin: 0 0 18px;
}
.reward-box {
  display: inline-flex;
  align-items: baseline;
  gap: 10px;
  padding: 14px 22px;
  margin-bottom: 22px;
  border-radius: 14px;
  background: linear-gradient(160deg, rgba(212,175,55,0.18), rgba(212,175,55,0.04));
  border: 1px solid rgba(212,175,55,0.3);
}
.coin-icon { font-size: 1.6rem; }
.reward-value {
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  color: #fff3b0;
  text-shadow: 0 0 16px rgba(212,175,55,0.6);
}
.reward-label {
  letter-spacing: .2em;
  text-transform: uppercase;
  font-size: .75rem;
  color: #c9b69b;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}
.btn-primary {
  padding: 12px 22px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #b8860b, #d4af37);
  color: #1a0f08;
  font-family: 'Cinzel', serif;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(212,175,55,0.3);
  transition: transform .2s ease;
}
.btn-primary:hover { transform: translateY(-2px) scale(1.03); }
.btn-ghost {
  padding: 12px 22px;
  border-radius: 999px;
  background: transparent;
  border: 1px solid rgba(212,175,55,0.3);
  color: #f5e6c8;
  font-family: 'Cinzel', serif;
  cursor: pointer;
}
.btn-ghost:hover { background: rgba(212,175,55,0.08); }

/* TRANSITION */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity .3s ease, transform .3s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(.92);
}

/* =========================================================
   RESPONSIVE
========================================================= */
@media (max-width: 700px) {
  .hud { grid-template-columns: repeat(2, 1fr); }
  .board { padding: 14px; gap: 10px; }
  .face-front .rune { font-size: 1.6rem; }
}

.coin-icon { font-size: 1.6rem; }

.coin-icon-img {
  width: 42px;
  height: 42px;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgba(212,175,55,0.45));
  animation: coinFloat 2.5s ease-in-out infinite;
}

@keyframes coinFloat {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }

  50% {
    transform: translateY(-4px) rotate(6deg);
  }
}

</style>
