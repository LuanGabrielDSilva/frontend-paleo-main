
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import moedaDoSite from "@/assets/moedaDoSite.png";
import { questions as questionsData } from "@/data/questions";

/* =========================================================
   TYPES
========================================================= */
type Difficulty = "easy" | "medium" | "hard";

type Question = {
  question: string;
  options: string[];
  answer: string;
  difficulty?: Difficulty;
};

type LevelConfig = {
  id: Difficulty;
  label: string;
  description: string;
  icon: string;
  totalQuestions: number;
  timePerQuestion: number;
  coinsPerHit: number;
  accent: string;
};

/* =========================================================
   LEVEL CONFIG
========================================================= */
const LEVELS: LevelConfig[] = [
  {
    id: "easy",
    label: "Fácil",
    description: "Para aprendizes curiosos. Mais tempo, menos perguntas.",
    icon: "🥚",
    totalQuestions: 5,
    timePerQuestion: 30,
    coinsPerHit: 15,
    accent: "#7fc97f"
  },
  {
    id: "medium",
    label: "Médio",
    description: "Para exploradores de campo. Equilíbrio entre tempo e desafio.",
    icon: "🦴",
    totalQuestions: 10,
    timePerQuestion: 20,
    coinsPerHit: 25,
    accent: "#d4af37"
  },
  {
    id: "hard",
    label: "Difícil",
    description: "Apenas para paleontólogos experientes. Rápido e implacável.",
    icon: "🦖",
    totalQuestions: 15,
    timePerQuestion: 10,
    coinsPerHit: 40,
    accent: "#e07a5f"
  }
];

/* =========================================================
   STATE
========================================================= */
const screen = ref<"levels" | "quiz">("levels");
const selectedLevel = ref<LevelConfig | null>(null);

const currentQuestion = ref(0);
const questions = ref<Question[]>([]);
const score = ref(0);
const finished = ref(false);

const coinsEarned = ref(0);
const loadingReward = ref(false);

const selectedAnswer = ref<string | null>(null);
const answerState = ref<"correct" | "wrong" | null>(null);

const timeLeft = ref(0);
let timerId: ReturnType<typeof setInterval> | null = null;

/* =========================================================
   HELPERS
========================================================= */
function shuffleArray<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function clearTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function loadQuiz(level: LevelConfig) {
  if (!questionsData || questionsData.length === 0) {
    questions.value = [];
    return;
  }

  const filtered = questionsData.filter(
    (q: Question) => !q.difficulty || q.difficulty === level.id
  );

  const pool = filtered.length > 0 ? filtered : questionsData;

  const shuffled = shuffleArray(pool)
    .slice(0, level.totalQuestions)
    .map(q => ({ ...q, options: shuffleArray(q.options || []) }));

  questions.value = shuffled;
}

const progress = computed(() => {
  if (!questions.value.length) return 0;
  return ((currentQuestion.value + 1) / questions.value.length) * 100;
});

const timeProgress = computed(() => {
  if (!selectedLevel.value) return 0;
  return (timeLeft.value / selectedLevel.value.timePerQuestion) * 100;
});

const current = computed(() => questions.value[currentQuestion.value] || null);

function selectLevel(level: LevelConfig) {
  selectedLevel.value = level;
  loadQuiz(level);
  currentQuestion.value = 0;
  score.value = 0;
  finished.value = false;
  selectedAnswer.value = null;
  answerState.value = null;
  screen.value = "quiz";
  startTimer();
}

function backToLevels() {
  clearTimer();
  screen.value = "levels";
  selectedLevel.value = null;
  finished.value = false;
}

function startTimer() {
  clearTimer();
  if (!selectedLevel.value) return;
  timeLeft.value = selectedLevel.value.timePerQuestion;
  timerId = setInterval(() => {
    if (timeLeft.value > 0) timeLeft.value--;
    else { clearTimer(); handleTimeout(); }
  }, 1000);
}

async function handleTimeout() {
  if (selectedAnswer.value) return;
  selectedAnswer.value = "__timeout__";
  answerState.value = "wrong";
  await new Promise(r => setTimeout(r, 900));
  goNext();
}

async function answer(option: string) {
  if (!current.value) return;
  if (selectedAnswer.value) return;
  clearTimer();
  selectedAnswer.value = option;
  const correct = option === current.value.answer;
  if (correct) { score.value++; answerState.value = "correct"; }
  else { answerState.value = "wrong"; }
  await new Promise(r => setTimeout(r, 900));
  goNext();
}

function goNext() {
  selectedAnswer.value = null;
  answerState.value = null;
  if (currentQuestion.value < questions.value.length - 1) {
    currentQuestion.value++;
    startTimer();
  } else {
    finished.value = true;
    finishQuiz();
  }
}

async function finishQuiz() {
  clearTimer();
  const perHit = selectedLevel.value?.coinsPerHit ?? 25;
  const earned = score.value * perHit;
  coinsEarned.value = earned;

  const API = import.meta.env.VITE_API_URL || "";
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!user?.id || !API) {
    console.error("Usuário ou API inválida");
    return;
  }

  try {
    loadingReward.value = true;
    const response = await fetch(`${API}/reward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        coins: earned,
        level: selectedLevel.value?.id
      })
    });
    if (!response.ok) throw new Error("Erro ao salvar moedas");
    console.log("Moedas salvas com sucesso");
  } catch (err) {
    console.error("Erro ao recompensar quiz:", err);
  } finally {
    loadingReward.value = false;
  }
}

function restartQuiz() {
  if (!selectedLevel.value) { screen.value = "levels"; return; }
  selectLevel(selectedLevel.value);
}

function changeLevel() { backToLevels(); }

function exitQuiz() {
  clearTimer();
  if (window.history.length > 1) window.history.back();
  else window.location.href = "/";
}

onMounted(() => {});
onBeforeUnmount(() => { clearTimer(); });
watch(finished, val => { if (val) clearTimer(); });
</script>

<template>
  <div class="quiz-page">

    <div class="bg-glow"></div>
    <div class="particles">
      <span v-for="n in 25" :key="n"></span>
    </div>

    <div class="quiz-container">

      <!-- HEADER -->
      <div class="header">
        <button
          v-if="screen === 'levels'"
          class="exit-corner"
          @click="exitQuiz"
          aria-label="Sair"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <div class="logo-circle">
          <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="gLogo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#fff2b0"/>
                <stop offset="0.6" stop-color="#d4af37"/>
                <stop offset="1" stop-color="#8b6914"/>
              </linearGradient>
            </defs>
            <path
              d="M14 38 C14 28 22 22 32 22 C40 22 44 26 47 22 L52 26 L46 30 C48 32 49 36 49 40 C49 47 43 52 36 52 L34 52 L34 46 L30 46 L30 52 L24 52 C18 52 14 47 14 42 Z M40 30 A1.4 1.4 0 1 1 40 30.01"
              fill="url(#gLogo)" stroke="#5a4410" stroke-width="1.2" stroke-linejoin="round"/>
            <path d="M20 42 L18 46 M24 44 L23 48" stroke="#5a4410" stroke-width="1" stroke-linecap="round"/>
          </svg>
        </div>

        <h1>Quiz Paleontológico</h1>

        <p v-if="screen === 'levels'">
          Escolha sua expedição. Cada nível guarda desafios únicos.
        </p>
        <p v-else-if="!finished">
          Descubra se você domina os mistérios das eras antigas.
        </p>
      </div>

      <!-- LEVEL SELECTION -->
      <Transition name="fade-slide" mode="out-in">
        <div v-if="screen === 'levels'" key="levels" class="levels-screen">

          <div class="levels-grid">
            <button
              v-for="level in LEVELS"
              :key="level.id"
              class="level-card"
              :style="{ '--accent': level.accent }"
              @click="selectLevel(level)"
            >
              <div class="level-icon">{{ level.icon }}</div>
              <h3 class="level-title">{{ level.label }}</h3>
              <p class="level-desc">{{ level.description }}</p>

              <div class="level-stats">
                <div class="stat">
                  <span class="stat-value">{{ level.totalQuestions }}</span>
                  <span class="stat-label">Perguntas</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat">
                  <span class="stat-value">{{ level.timePerQuestion }}s</span>
                  <span class="stat-label">Tempo</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat">
                  <span class="stat-value">+{{ level.coinsPerHit }}</span>
                  <span class="stat-label">Moedas</span>
                </div>
              </div>

              <span class="level-cta">
                Iniciar Expedição
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6"/>
                </svg>
              </span>
            </button>
          </div>

        </div>
      </Transition>

      <!-- QUIZ -->
      <div v-if="screen === 'quiz' && !finished">

        <div class="top-bar">
          <div class="top-bar-left">
            <button class="pill-btn pill-btn--danger" @click="exitQuiz">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
              Sair
            </button>

            <button class="pill-btn" @click="changeLevel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5M11 18l-6-6 6-6"/>
              </svg>
              Trocar nível
            </button>
          </div>

          <div class="level-pill" :style="{ '--accent': selectedLevel?.accent }">
            <span class="level-pill-icon">{{ selectedLevel?.icon }}</span>
            <strong>{{ selectedLevel?.label }}</strong>
          </div>
        </div>

        <div class="top-progress">
          <div class="progress-info">
            <span>Pergunta {{ currentQuestion + 1 }}</span>
            <span>{{ questions.length }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
        </div>

        <div class="timer-row" :class="{ urgent: timeLeft <= 5 }">
          <svg class="timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="13" r="8"/>
            <path d="M12 9v4l2 2M9 2h6M5 5l2-2M19 5l-2-2"/>
          </svg>
          <div class="timer-bar">
            <div class="timer-fill" :style="{ width: timeProgress + '%' }"></div>
          </div>
          <div class="timer-value">{{ timeLeft }}s</div>
        </div>

        <Transition name="fade-slide" mode="out-in">
          <div v-if="questions.length > 0" :key="currentQuestion">

            <h2 class="question">{{ questions[currentQuestion]?.question }}</h2>

            <div class="options">
              <button
                v-for="(option, index) in questions[currentQuestion]?.options"
                :key="option"
                class="option-btn"
                :class="{
                  correct: selectedAnswer && option === questions[currentQuestion].answer,
                  wrong: selectedAnswer === option && option !== questions[currentQuestion].answer
                }"
                :disabled="!!selectedAnswer"
                @click="answer(option)"
              >
                <span class="option-letter">{{ ['A', 'B', 'C', 'D'][index] }}</span>
                <span class="option-text">{{ option }}</span>

                <span
                  v-if="selectedAnswer && option === questions[currentQuestion].answer"
                  class="feedback-icon feedback-icon--correct"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12l5 5L20 7"/>
                  </svg>
                </span>

                <span
                  v-if="selectedAnswer === option && option !== questions[currentQuestion].answer"
                  class="feedback-icon feedback-icon--wrong"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </span>
              </button>
            </div>

          </div>
        </Transition>

      </div>

      <!-- RESULT -->
      <Transition name="modal-pop">
        <div v-if="finished" class="result">

          <div class="trophy-wrap">
            <svg class="trophy-svg" viewBox="0 0 80 80" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="gTrophy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="#fff6c5"/>
                  <stop offset="0.5" stop-color="#d4af37"/>
                  <stop offset="1" stop-color="#6e520f"/>
                </linearGradient>
              </defs>
              <path d="M20 14 H60 V28 C60 40 52 48 40 48 C28 48 20 40 20 28 Z"
                    fill="url(#gTrophy)" stroke="#5a4410" stroke-width="1.4"/>
              <path d="M20 18 H10 V24 C10 30 14 34 20 34" stroke="#d4af37" stroke-width="2.2" fill="none"/>
              <path d="M60 18 H70 V24 C70 30 66 34 60 34" stroke="#d4af37" stroke-width="2.2" fill="none"/>
              <rect x="34" y="48" width="12" height="10" fill="url(#gTrophy)" stroke="#5a4410" stroke-width="1.2"/>
              <rect x="24" y="58" width="32" height="8" rx="2" fill="url(#gTrophy)" stroke="#5a4410" stroke-width="1.2"/>
              <path d="M32 24 l4 4 l8 -8" stroke="#5a4410" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <h2 class="victory-title">Expedição Concluída</h2>

          <p class="result-text">
            Você acertou
            <strong>{{ score }}</strong>
            de
            <strong>{{ questions.length }}</strong>
            no nível
            <strong>{{ selectedLevel?.label }}</strong>.
          </p>

          <div class="rank-box">
            <span v-if="score === questions.length">Mestre dos Dinossauros</span>
            <span v-else-if="score >= questions.length / 2">Explorador Experiente</span>
            <span v-else>Aprendiz Jurássico</span>
          </div>

          <div class="coins-box">
            <img :src="moedaDoSite" class="coin-img" alt="Moeda" />
            <div class="coins-content">
              <strong>+{{ coinsEarned }}</strong>
              <span>moedas conquistadas</span>
            </div>
          </div>

          <div class="result-actions">
            <button class="action-btn action-btn--primary" @click="restartQuiz">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/>
                <path d="M3 21v-5h5"/>
              </svg>
              Jogar Novamente
            </button>

            <button class="action-btn action-btn--secondary" @click="changeLevel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <path d="M16 8l-2 6-6 2 2-6z"/>
              </svg>
              Trocar Nível
            </button>

            <button class="action-btn action-btn--ghost" @click="exitQuiz">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 17l5-5-5-5M21 12H9M13 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/>
              </svg>
              Sair
            </button>
          </div>

        </div>
      </Transition>

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

:root, .quiz-page {
  --gold-1: #fff2b0;
  --gold-2: #d4af37;
  --gold-3: #8b6914;
  --gold-deep: #5a4410;
  --bg-1:    #0a0705;
  --bg-2:    #120905;
  --ink:     #f5e6c8;
  --danger:  #e07a5f;
  --btn-h:   46px;
  --pill-h:  38px;
}

/* PAGE */
.quiz-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  padding: 32px 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at top, rgba(212,175,55,0.08), transparent 40%),
    linear-gradient(180deg, var(--bg-1) 0%, var(--bg-2) 100%);
  color: var(--ink);
  font-family: 'Inter', sans-serif;
}

.bg-glow {
  position: absolute; inset: 0;
  background: radial-gradient(circle at center, rgba(212,175,55,0.12), transparent 60%);
  pointer-events: none;
}

.particles { position: absolute; inset: 0; overflow: hidden; }
.particles span {
  position: absolute; width: 4px; height: 4px;
  background: rgba(212,175,55,0.35); border-radius: 50%;
  animation: float 14s linear infinite;
}
.particles span:nth-child(odd) { width: 2px; height: 2px; }

@keyframes float {
  from { transform: translateY(100vh); opacity: 0; }
  10%  { opacity: 1; }
  to   { transform: translateY(-10vh); opacity: 0; }
}

/* CONTAINER */
.quiz-container {
  position: relative;
  width: 100%;
  max-width: 860px;
  padding: 34px 38px;
  border-radius: 28px;
  overflow: hidden;
  backdrop-filter: blur(14px);
  background: linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  border: 1px solid rgba(212,175,55,0.2);
  box-shadow:
    0 30px 80px rgba(0,0,0,0.6),
    inset 0 1px 0 rgba(255,255,255,0.06);
}

/* HEADER */
.header { position: relative; text-align: center; margin-bottom: 30px; }

.exit-corner {
  position: absolute;
  top: -4px; left: 0;
  width: 40px; height: 40px;
  border-radius: 50%;
  background: linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01));
  border: 1px solid rgba(212,175,55,.3);
  color: var(--ink);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all .25s ease;
}
.exit-corner svg { width: 18px; height: 18px; }
.exit-corner:hover {
  color: var(--gold-1);
  border-color: rgba(212,175,55,.75);
  transform: translateX(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,.45), 0 0 16px rgba(212,175,55,.18);
}

.logo-circle {
  width: 78px; height: 78px;
  margin: 0 auto 14px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle, rgba(212,175,55,0.28), rgba(212,175,55,0.06));
  border: 1px solid rgba(212,175,55,0.4);
  box-shadow:
    0 0 36px rgba(212,175,55,0.22),
    inset 0 1px 0 rgba(255,255,255,.08);
  animation: floatLogo 3.2s ease-in-out infinite;
}
.logo-circle svg { width: 50px; height: 50px; }
@keyframes floatLogo {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-6px); }
}

h1 {
  margin: 0 0 8px;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-family: 'Cinzel', serif;
  letter-spacing: .02em;
  background: linear-gradient(180deg, var(--gold-1), var(--gold-2), var(--gold-3));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.header p {
  color: rgba(255,255,255,0.65);
  font-size: .95rem;
  margin: 0;
}

/* LEVELS */
.levels-screen { width: 100%; }

.levels-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.level-card {
  --accent: #d4af37;
  position: relative;
  cursor: pointer;
  text-align: left;
  padding: 22px 20px;
  border-radius: 22px;
  background: linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015));
  border: 1px solid rgba(212,175,55,0.18);
  color: var(--ink);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
}

.level-card::before {
  content: "";
  position: absolute; inset: -1px;
  border-radius: inherit; padding: 1px;
  background: linear-gradient(160deg, var(--accent), transparent 60%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  opacity: .35;
  pointer-events: none;
  transition: opacity .3s ease;
}

.level-card:hover {
  transform: translateY(-5px);
  border-color: var(--accent);
  box-shadow:
    0 18px 40px rgba(0,0,0,.5),
    0 0 26px color-mix(in srgb, var(--accent) 30%, transparent);
}
.level-card:hover::before { opacity: 1; }

.level-icon {
  width: 56px; height: 56px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.8rem;
  border-radius: 16px;
  background: linear-gradient(160deg,
    color-mix(in srgb, var(--accent) 18%, transparent),
    color-mix(in srgb, var(--accent) 4%, transparent));
  border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--accent) 35%, transparent));
}

.level-title {
  margin: 4px 0 0;
  font-family: 'Cinzel', serif;
  font-size: 1.35rem;
  color: var(--accent);
  line-height: 1.1;
}

.level-desc {
  margin: 0;
  font-size: .85rem;
  color: rgba(255,255,255,.62);
  line-height: 1.45;
  flex: 1;
}

.level-stats {
  display: flex; align-items: stretch;
  padding: 10px 6px;
  border-radius: 14px;
  background: rgba(0,0,0,.28);
  border: 1px solid rgba(212,175,55,.08);
}
.stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0; }
.stat-divider { width: 1px; background: rgba(212,175,55,.14); margin: 4px 0; }
.stat-value { font-family: 'Cinzel', serif; font-size: 1rem; color: var(--gold-1); line-height: 1; }
.stat-label { font-size: .62rem; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.5); }

.level-cta {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 4px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: .04em;
  font-size: .85rem;
  transition: gap .25s ease;
}
.level-cta svg { width: 14px; height: 14px; }
.level-card:hover .level-cta { gap: 10px; }

/* QUIZ TOP BAR */
.top-bar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 18px; gap: 12px;
}
.top-bar-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

/* PILL BUTTON */
.pill-btn {
  position: relative;
  display: inline-flex; align-items: center; gap: 8px;
  height: var(--pill-h);
  padding: 0 16px;
  border-radius: 999px;
  font-size: .85rem;
  font-weight: 600;
  letter-spacing: .02em;
  color: var(--ink);
  background: linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01));
  border: 1px solid rgba(212,175,55,.3);
  cursor: pointer;
  overflow: hidden;
  transition: all .28s ease;
}
.pill-btn::after {
  content: ""; position: absolute; inset: 0;
  background: radial-gradient(circle at 20% 20%, rgba(212,175,55,.22), transparent 60%);
  opacity: 0; transition: opacity .3s ease;
  pointer-events: none;
}
.pill-btn svg { width: 15px; height: 15px; }
.pill-btn:hover {
  color: var(--gold-1);
  border-color: rgba(212,175,55,.75);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(0,0,0,.4), 0 0 16px rgba(212,175,55,.18);
}
.pill-btn:hover::after { opacity: 1; }
.pill-btn--danger { border-color: rgba(224,122,95,.4); }
.pill-btn--danger:hover {
  color: #ffb8a8;
  border-color: rgba(224,122,95,.85);
  box-shadow: 0 8px 20px rgba(0,0,0,.4), 0 0 16px rgba(224,122,95,.2);
}
.pill-btn--danger::after {
  background: radial-gradient(circle at 20% 20%, rgba(224,122,95,.25), transparent 60%);
}

.level-pill {
  --accent: #d4af37;
  display: inline-flex; align-items: center; gap: 8px;
  height: var(--pill-h);
  padding: 0 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
  font-size: .85rem;
}
.level-pill strong { color: var(--accent); }
.level-pill-icon { font-size: 1rem; line-height: 1; }

/* PROGRESS */
.top-progress { margin-bottom: 14px; }
.progress-info {
  display: flex; justify-content: space-between;
  margin-bottom: 6px;
  color: rgba(255,255,255,0.65);
  font-size: .78rem;
  text-transform: uppercase;
  letter-spacing: .12em;
}
.progress-bar {
  height: 10px; border-radius: 999px; overflow: hidden;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(212,175,55,0.15);
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-3), var(--gold-2), var(--gold-1));
  box-shadow: 0 0 18px rgba(212,175,55,0.45);
  transition: width .4s ease;
}

/* TIMER */
.timer-row {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 22px;
  padding: 9px 14px;
  border-radius: 14px;
  background: rgba(0,0,0,.28);
  border: 1px solid rgba(212,175,55,.14);
  transition: border-color .3s ease, background .3s ease;
}
.timer-row.urgent {
  border-color: rgba(224,122,95,.6);
  background: rgba(224,122,95,.08);
  animation: pulseUrgent 1s ease-in-out infinite;
}
@keyframes pulseUrgent {
  0%,100% { box-shadow: 0 0 0 0 rgba(224,122,95,0); }
  50%     { box-shadow: 0 0 0 5px rgba(224,122,95,.14); }
}
.timer-icon { width: 18px; height: 18px; color: var(--gold-2); flex-shrink: 0; }
.timer-row.urgent .timer-icon { color: var(--danger); }
.timer-bar {
  flex: 1; height: 6px;
  border-radius: 999px;
  background: rgba(255,255,255,.06);
  overflow: hidden;
}
.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-2), var(--gold-1));
  transition: width 1s linear;
}
.timer-row.urgent .timer-fill {
  background: linear-gradient(90deg, var(--danger), #ff4d4d);
}
.timer-value {
  min-width: 38px; text-align: right;
  font-family: 'Cinzel', serif;
  font-size: .95rem;
  color: var(--gold-1);
}
.timer-row.urgent .timer-value { color: #ff8a7a; }

/* QUESTION */
.question {
  margin: 0 0 20px;
  text-align: center;
  line-height: 1.45;
  font-size: clamp(1.25rem, 2.6vw, 1.65rem);
  font-family: 'Cinzel', serif;
}

/* OPTIONS */
.options { display: grid; gap: 12px; }
.option-btn {
  position: relative;
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px;
  min-height: 60px;
  border-radius: 16px;
  border: 1px solid rgba(212,175,55,0.15);
  background: linear-gradient(160deg, rgba(212,175,55,0.12), rgba(255,255,255,0.02));
  color: var(--ink);
  cursor: pointer;
  text-align: left;
  transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
}
.option-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(212,175,55,0.45);
  box-shadow: 0 8px 24px rgba(212,175,55,0.12);
}
.option-btn:disabled { cursor: default; }

.option-letter {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  border-radius: 10px;
  font-family: 'Cinzel', serif;
  font-size: .95rem;
  font-weight: 700;
  color: var(--gold-1);
  background: rgba(212,175,55,.1);
  border: 1px solid rgba(212,175,55,.25);
  flex-shrink: 0;
}
.option-text { flex: 1; font-size: .98rem; font-weight: 500; line-height: 1.35; }

.option-btn.correct {
  background: linear-gradient(135deg, rgba(46,204,113,.25), rgba(39,174,96,.15));
  border-color: rgba(46,204,113,.7);
  animation: correctPulse .5s ease;
}
.option-btn.correct .option-letter {
  color: #c6f1d6;
  background: rgba(46,204,113,.2);
  border-color: rgba(46,204,113,.6);
}
.option-btn.wrong {
  background: linear-gradient(135deg, rgba(231,76,60,.25), rgba(192,57,43,.15));
  border-color: rgba(231,76,60,.7);
  animation: shake .45s ease;
}
.option-btn.wrong .option-letter {
  color: #ffc9c1;
  background: rgba(231,76,60,.2);
  border-color: rgba(231,76,60,.6);
}

.feedback-icon {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
}
.feedback-icon svg { width: 16px; height: 16px; }
.feedback-icon--correct { color: #c6f1d6; background: rgba(46,204,113,.22); }
.feedback-icon--wrong   { color: #ffc9c1; background: rgba(231,76,60,.22); }

@keyframes correctPulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.02); }
  100% { transform: scale(1); }
}
@keyframes shake {
  0%,100% { transform: translateX(0); }
  25%     { transform: translateX(-5px); }
  75%     { transform: translateX(5px); }
}

/* RESULT */
.result {
  position: relative; text-align: center;
  display: flex; flex-direction: column; align-items: center;
}

.trophy-wrap {
  width: 100px; height: 100px;
  display: flex; align-items: center; justify-content: center;
  filter: drop-shadow(0 0 26px rgba(212,175,55,0.55));
  animation: trophyBounce 2.4s ease-in-out infinite;
}
.trophy-svg { width: 100%; height: 100%; }
@keyframes trophyBounce {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-10px); }
}

.victory-title {
  margin: 14px 0 8px;
  font-size: clamp(1.7rem, 3.5vw, 2.1rem);
  font-family: 'Cinzel', serif;
  letter-spacing: .04em;
  background: linear-gradient(180deg, var(--gold-1), var(--gold-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.result-text {
  color: rgba(255,255,255,0.78);
  margin: 0 0 18px;
  font-size: .95rem;
}

.rank-box {
  margin-bottom: 18px;
  padding: 11px 22px;
  border-radius: 999px;
  background: linear-gradient(160deg, rgba(212,175,55,0.16), rgba(212,175,55,0.04));
  border: 1px solid rgba(212,175,55,0.3);
  font-family: 'Cinzel', serif;
  font-weight: 600;
  font-size: .95rem;
  color: var(--gold-1);
  letter-spacing: .04em;
}

.coins-box {
  display: inline-flex; align-items: center; gap: 14px;
  margin-bottom: 26px;
  padding: 14px 22px;
  border-radius: 18px;
  background: linear-gradient(160deg, rgba(212,175,55,0.18), rgba(212,175,55,0.05));
  border: 1px solid rgba(212,175,55,0.28);
  box-shadow: 0 0 32px rgba(212,175,55,0.12);
}
.coin-img {
  width: 44px; height: 44px;
  object-fit: contain;
  filter: drop-shadow(0 0 12px rgba(212,175,55,0.45));
  animation: spinCoin 5s linear infinite;
}
@keyframes spinCoin {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(360deg); }
}
.coins-content { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.1; }
.coins-content strong { font-size: 1.55rem; color: var(--gold-1); font-family: 'Cinzel', serif; }
.coins-content span {
  color: rgba(255,255,255,0.65);
  text-transform: uppercase;
  letter-spacing: .1em;
  font-size: .65rem;
  margin-top: 3px;
}

/* RESULT ACTION BUTTONS */
.result-actions {
  display: flex; flex-wrap: wrap;
  justify-content: center; align-items: center;
  gap: 10px; width: 100%;
}

.action-btn {
  position: relative;
  display: inline-flex; align-items: center; justify-content: center;
  gap: 9px;
  height: var(--btn-h);
  padding: 0 22px;
  border-radius: 999px;
  font-size: .92rem;
  font-weight: 700;
  letter-spacing: .03em;
  cursor: pointer;
  overflow: hidden;
  border: 1px solid transparent;
  transition: transform .25s ease, box-shadow .25s ease, background .25s ease, border-color .25s ease, color .25s ease;
}
.action-btn svg { width: 17px; height: 17px; }

/* PRIMARY — golden with shimmer */
.action-btn--primary {
  color: #1a1208;
  background:
    linear-gradient(135deg, #fff6c5 0%, #f0d77a 30%, var(--gold-2) 60%, #a78327 100%);
  box-shadow:
    0 12px 28px rgba(212,175,55,0.3),
    inset 0 1px 0 rgba(255,255,255,.5),
    inset 0 -2px 6px rgba(90,68,16,.25);
}
.action-btn--primary::before {
  content: "";
  position: absolute;
  top: 0; left: -120%;
  width: 60%; height: 100%;
  background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,.55) 50%, transparent 100%);
  transform: skewX(-20deg);
  transition: left .8s ease;
  pointer-events: none;
}
.action-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow:
    0 16px 34px rgba(212,175,55,0.42),
    inset 0 1px 0 rgba(255,255,255,.6),
    inset 0 -2px 6px rgba(90,68,16,.25);
}
.action-btn--primary:hover::before { left: 130%; }

/* SECONDARY — outlined gold */
.action-btn--secondary {
  color: var(--gold-1);
  background: linear-gradient(160deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02));
  border-color: rgba(212,175,55,.4);
}
.action-btn--secondary::after {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at top, rgba(212,175,55,.2), transparent 70%);
  opacity: 0; transition: opacity .3s ease;
  pointer-events: none;
}
.action-btn--secondary:hover {
  color: #fff;
  border-color: var(--gold-2);
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(0,0,0,.4), 0 0 18px rgba(212,175,55,.22);
}
.action-btn--secondary:hover::after { opacity: 1; }

/* GHOST — danger subtle */
.action-btn--ghost {
  color: rgba(255,255,255,.78);
  background: linear-gradient(160deg, rgba(255,255,255,.04), rgba(255,255,255,.01));
  border-color: rgba(224,122,95,.35);
}
.action-btn--ghost:hover {
  color: #ffb8a8;
  border-color: rgba(224,122,95,.8);
  background: rgba(224,122,95,.08);
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(0,0,0,.4), 0 0 18px rgba(224,122,95,.22);
}

/* TRANSITIONS */
.fade-slide-enter-active,
.fade-slide-leave-active { transition: opacity .35s ease, transform .35s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(16px); }
.fade-slide-leave-to   { opacity: 0; transform: translateY(-16px); }
.modal-pop-enter-active { transition: opacity .4s ease, transform .4s ease; }
.modal-pop-enter-from   { opacity: 0; transform: scale(.9); }

/* RESPONSIVE */
@media (max-width: 820px) {
  .levels-grid { grid-template-columns: 1fr; }
  .level-card { padding: 20px; }
}
@media (max-width: 700px) {
  .quiz-container { padding: 26px 22px; }
  .header { margin-bottom: 22px; }
  .exit-corner { top: -2px; width: 36px; height: 36px; }
  .exit-corner svg { width: 16px; height: 16px; }

  .top-bar { flex-direction: column; gap: 10px; align-items: stretch; }
  .top-bar-left { justify-content: center; }
  .level-pill { justify-content: center; align-self: center; }

  .option-btn { padding: 12px 14px; min-height: 56px; }
  .option-letter { width: 28px; height: 28px; font-size: .85rem; }

  .coins-box { padding: 12px 18px; gap: 12px; }
  .coin-img { width: 38px; height: 38px; }
  .coins-content strong { font-size: 1.35rem; }

  .result-actions { flex-direction: column; align-items: stretch; gap: 8px; }
  .action-btn { width: 100%; }
}
</style>
