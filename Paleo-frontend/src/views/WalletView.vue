<script setup lang="ts">
import { ref, onMounted, computed, reactive, nextTick } from "vue";
import api from "../services/api";

const coinImage = new URL(
  "@/assets/moedaDoSite.png",
  import.meta.url
).href;

/* ======================
   STATE
====================== */
const balance = ref(0);
const coins = ref(0);

// valores exibidos (animados com countUp)
const displayBalance = ref(0);
const displayCoins = ref(0);

const coinsToConvert = ref<number>(0);
const loading = ref(false);
const burst = ref(false);

const convertedValue = computed(() => {
  const v = Number(coinsToConvert.value) || 0;
  return (v / 100).toFixed(2);
});

const fmtBalance = computed(() =>
  displayBalance.value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
);

const fmtCoins = computed(() =>
  Math.round(displayCoins.value).toLocaleString("pt-BR")
);

/* ======================
   TOAST
====================== */
type ToastType = "success" | "error" | "info";
const toast = reactive({
  show: false,
  message: "",
  type: "info" as ToastType,
});
let toastTimer: number | undefined;
const showToast = (message: string, type: ToastType = "info") => {
  toast.message = message;
  toast.type = type;
  toast.show = true;
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.show = false), 3200);
};

/* ======================
   COUNT-UP ANIMATION
====================== */
const animateValue = (
  from: number,
  to: number,
  duration: number,
  onUpdate: (v: number) => void
) => {
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    onUpdate(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
    else onUpdate(to);
  };
  requestAnimationFrame(step);
};

/* ======================
   LOAD WALLET
====================== */
const loadWallet = async () => {
  try {
    const res = await api.get("/wallet/me");
    const newBalance = Number(res.data.balance) || 0;
    const newCoins = Number(res.data.coins) || 0;

    animateValue(displayBalance.value, newBalance, 1100, (v) => (displayBalance.value = v));
    animateValue(displayCoins.value, newCoins, 1100, (v) => (displayCoins.value = v));

    balance.value = newBalance;
    coins.value = newCoins;
  } catch (error) {
    console.log(error);
    showToast("Falha ao carregar a carteira.", "error");
  }
};

/* ======================
   CONVERT COINS
====================== */
const convertCoins = async () => {
  if (coinsToConvert.value <= 0) {
    showToast("Digite uma quantidade válida.", "error");
    return;
  }
  if (coinsToConvert.value > coins.value) {
    showToast("Você não possui moedas suficientes.", "error");
    return;
  }

  try {
    loading.value = true;

    const res = await api.post("/wallet/convert", {
      coins: coinsToConvert.value,
    });

    const newBalance = Number(res.data.balance) || 0;
    const newCoins = Number(res.data.coins) || 0;

    animateValue(displayBalance.value, newBalance, 900, (v) => (displayBalance.value = v));
    animateValue(displayCoins.value, newCoins, 900, (v) => (displayCoins.value = v));

    balance.value = newBalance;
    coins.value = newCoins;

    // sincroniza profile
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    savedUser.balance = newBalance;
    savedUser.coins = newCoins;
    localStorage.setItem("user", JSON.stringify(savedUser));

    coinsToConvert.value = 0;
    triggerBurst();
    showToast("Conversão realizada com sucesso!", "success");
  } catch (error) {
    console.log(error);
    showToast("Erro ao converter moedas.", "error");
  } finally {
    loading.value = false;
  }
};

const triggerBurst = async () => {
  burst.value = false;
  await nextTick();
  burst.value = true;
  window.setTimeout(() => (burst.value = false), 1600);
};

/* ======================
   QUICK AMOUNTS
====================== */
const presets = [100, 500, 1000];
const setPreset = (n: number) => {
  coinsToConvert.value = Math.min(n, coins.value || n);
};
const setMax = () => {
  coinsToConvert.value = coins.value;
};

/* ======================
   3D TILT (cards)
====================== */
const handleTilt = (e: MouseEvent) => {
  const el = e.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  el.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
  el.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
  el.style.setProperty("--mx", `${x * 100}%`);
  el.style.setProperty("--my", `${y * 100}%`);
};
const resetTilt = (e: MouseEvent) => {
  const el = e.currentTarget as HTMLElement;
  el.style.setProperty("--rx", `0deg`);
  el.style.setProperty("--ry", `0deg`);
};

/* ======================
   FLOATING PARTICLES
====================== */
const particles = Array.from({ length: 22 }, () => ({
  left: Math.random() * 100,
  delay: -Math.random() * 14,
  duration: 12 + Math.random() * 14,
  size: 2 + Math.random() * 4,
  opacity: 0.25 + Math.random() * 0.5,
}));

const sparks = Array.from({ length: 20 }, (_, i) => ({
  angle: (i / 20) * 360 + Math.random() * 10,
  distance: 90 + Math.random() * 70,
  delay: Math.random() * 0.15,
  size: 4 + Math.random() * 6,
}));

onMounted(() => {
  loadWallet();
});
</script>


<template>
  <div class="wallet-page">

    <!-- BG LAYERS -->
    <div class="bg-amber" aria-hidden="true"></div>
    <div class="bg-noise" aria-hidden="true"></div>
    <div class="bg-grid" aria-hidden="true"></div>

    <!-- FOSSIL ORNAMENT -->
    <svg class="fossil-ornament" viewBox="0 0 600 200" aria-hidden="true">
      <path
        d="M20 100 Q60 40 120 100 T220 100 T320 100 T420 100 T520 100 T580 100"
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
        stroke-dasharray="3 7"
      />
      <g opacity=".7">
        <circle cx="120" cy="100" r="4" fill="currentColor" />
        <circle cx="220" cy="100" r="4" fill="currentColor" />
        <circle cx="320" cy="100" r="4" fill="currentColor" />
        <circle cx="420" cy="100" r="4" fill="currentColor" />
        <circle cx="520" cy="100" r="4" fill="currentColor" />
      </g>
    </svg>

    <!-- PARTICLES -->
    <div class="particles" aria-hidden="true">
      <span
        v-for="(p, i) in particles"
        :key="i"
        :style="{
          left: p.left + '%',
          width: p.size + 'px',
          height: p.size + 'px',
          opacity: p.opacity,
          animationDelay: p.delay + 's',
          animationDuration: p.duration + 's',
        }"
      ></span>
    </div>

    <div class="wallet-container">

      <!-- HEADER -->
      <header class="wallet-header">
        <div class="eyebrow">
          <span class="dot"></span>
          Sistema Financeiro · Vault
          <span class="dot"></span>
        </div>

        <h1 class="title">
          Carteira
          <span class="title-accent">Paleontológica</span>
        </h1>

        <p class="subtitle">
          Converta moedas conquistadas nos jogos em saldo utilizável dentro da plataforma —
          preservado como âmbar, líquido como ouro.
        </p>
      </header>

      <!-- GRID -->
      <section class="wallet-grid">

        <!-- BALANCE -->
        <article
          class="wallet-card card-balance"
          @mousemove="handleTilt"
          @mouseleave="resetTilt"
        >
          <div class="card-glow"></div>
          <div class="card-shine"></div>

          <div class="card-head">
            <span class="label">
              <i class="ico ico-vault"></i>
              Saldo em Conta
            </span>
            <span class="chip chip-live">
              <span class="pulse"></span>
              ao vivo
            </span>
          </div>

          <div class="amount">
            <span class="currency">R$</span>
            <h2 class="value mono">{{ fmtBalance }}</h2>
          </div>

          <div class="card-foot">
            <span class="muted">Disponível para uso na plataforma</span>
            <span class="ribbon">BRL</span>
          </div>
        </article>

        <!-- COINS -->
        <article
          class="wallet-card card-coins"
          @mousemove="handleTilt"
          @mouseleave="resetTilt"
        >
          <div class="card-glow"></div>
          <div class="card-shine"></div>

          <div class="card-head">
            <span class="label">
              <i class="ico ico-fossil"></i>
              Minhas Moedas
            </span>
            <span class="chip chip-tier">
              tier · âmbar
            </span>
          </div>

          <div class="amount coin-amount">
            <div class="coin-wrap">
              <span class="coin-halo"></span>
              <img :src="coinImage" alt="Moeda" class="coin-img" />
            </div>
            <h2 class="value mono">{{ fmtCoins }}</h2>
          </div>

          <div class="card-foot">
            <span class="muted">Conquistadas em jogos</span>
            <span class="ribbon">XP</span>
          </div>
        </article>

      </section>

      <!-- CONVERT -->
      <section class="convert-card">

        <!-- BURST -->
        <div v-if="burst" class="burst" aria-hidden="true">
          <span
            v-for="(s, i) in sparks"
            :key="i"
            class="spark"
            :style="{
              '--angle': s.angle + 'deg',
              '--dist': s.distance + 'px',
              '--delay': s.delay + 's',
              '--size': s.size + 'px',
            }"
          ></span>
        </div>

        <header class="convert-head">
          <div>
            <span class="kicker">Câmbio</span>
            <h3 class="convert-title">Converter moedas</h3>
          </div>
          <div class="rate-pill">
            <span class="rate-dot"></span>
            Taxa:&nbsp;<strong>100 moedas = R$&nbsp;1,00</strong>
          </div>
        </header>

        <div class="convert-body">

          <div class="field">
            <label class="field-label">Quantidade de moedas</label>
            <div class="input-wrap">
              <img :src="coinImage" alt="" class="input-coin" />
              <input
                type="number"
                v-model.number="coinsToConvert"
                placeholder="0"
                min="1"
                :max="coins"
                inputmode="numeric"
              />
              <button
                type="button"
                class="max-btn"
                @click="setMax"
                :disabled="!coins"
              >
                MAX
              </button>
            </div>

            <div class="presets">
              <button
                v-for="n in presets"
                :key="n"
                type="button"
                class="preset"
                @click="setPreset(n)"
                :disabled="coins < n"
              >
                +{{ n }}
              </button>
            </div>
          </div>

          <div class="arrow-row" aria-hidden="true">
            <span class="line"></span>
            <span class="arrow">▼</span>
            <span class="line"></span>
          </div>

          <div class="preview">
            <div class="preview-left">
              <span class="preview-label">Você recebe</span>
              <span class="preview-sub">creditado instantaneamente</span>
            </div>
            <strong class="preview-value mono">
              R$ {{ convertedValue }}
            </strong>
          </div>

          <button
            class="cta"
            @click="convertCoins"
            :disabled="
              loading ||
              coinsToConvert <= 0 ||
              coinsToConvert > coins
            "
          >
            <span v-if="!loading" class="cta-label">
              Converter moedas
              <span class="cta-arrow">→</span>
            </span>
            <span v-else class="cta-loading">
              <span class="spinner"></span>
              Convertendo...
            </span>
          </button>

        </div>
      </section>

      <!-- FOOTER MICRO -->
      <p class="micro">
        Transações registradas no histórico do museu · seguro por convenção paleo-criptográfica.
      </p>

    </div>

    <!-- TOAST -->
    <transition name="toast-anim">
      <div
        v-if="toast.show"
        class="toast"
        :class="'toast-' + toast.type"
      >
        <span class="toast-ico">
          <template v-if="toast.type === 'success'">✓</template>
          <template v-else-if="toast.type === 'error'">!</template>
          <template v-else>i</template>
        </span>
        <span class="toast-msg">{{ toast.message }}</span>
      </div>
    </transition>

  </div>
</template>


<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,900&family=Inter:wght@400;500;600&family=Geist+Mono:wght@500;700&display=swap");

/* ======================
   ROOT VARS
====================== */
.wallet-page {
  --bg-0: #0a0604;
  --bg-1: #120a06;
  --bg-2: #1a1108;
  --gold: #d4af37;
  --gold-2: #f1d98a;
  --gold-bright: #ffd86b;
  --bone: #f5e6c8;
  --bone-dim: #cdbb90;
  --amber: #b87320;
  --amber-glow: #ffb648;
  --line: rgba(212, 175, 55, .18);
  --line-strong: rgba(212, 175, 55, .35);

  position: relative;
  min-height: 100vh;
  padding: 80px 24px 100px;
  color: var(--bone);
  font-family: "Inter", system-ui, sans-serif;
  background:
    radial-gradient(1200px 600px at 20% -10%, rgba(184, 115, 32, .28), transparent 60%),
    radial-gradient(900px 500px at 90% 10%, rgba(212, 175, 55, .14), transparent 55%),
    radial-gradient(700px 700px at 50% 110%, rgba(255, 182, 72, .12), transparent 60%),
    linear-gradient(180deg, var(--bg-0), var(--bg-1) 60%, var(--bg-0));
  overflow: hidden;
  isolation: isolate;
}

/* ======================
   BG LAYERS
====================== */
.bg-amber {
  position: absolute; inset: -10%;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(255, 182, 72, .10), transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(212, 175, 55, .08), transparent 55%);
  filter: blur(40px);
  pointer-events: none; z-index: 0;
  animation: drift 22s ease-in-out infinite alternate;
}
@keyframes drift {
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  100% { transform: translate3d(-2%, 2%, 0) scale(1.05); }
}

.bg-noise {
  position: absolute; inset: 0;
  pointer-events: none; z-index: 1;
  opacity: .35;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.9  0 0 0 0 0.75  0 0 0 0 0.4  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}

.bg-grid {
  position: absolute; inset: 0;
  pointer-events: none; z-index: 1;
  opacity: .08;
  background-image:
    linear-gradient(rgba(212, 175, 55, .6) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212, 175, 55, .6) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse at 50% 50%, #000 30%, transparent 75%);
}

.fossil-ornament {
  position: absolute;
  left: 50%; transform: translateX(-50%);
  top: 24px;
  width: min(600px, 80vw);
  color: var(--gold);
  opacity: .35;
  z-index: 1;
  pointer-events: none;
}

/* ======================
   PARTICLES
====================== */
.particles {
  position: absolute; inset: 0;
  pointer-events: none; z-index: 1;
  overflow: hidden;
}
.particles span {
  position: absolute;
  bottom: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--gold-bright), transparent 65%);
  box-shadow: 0 0 12px rgba(255, 216, 107, .6);
  animation: rise linear infinite;
}
@keyframes rise {
  0%   { transform: translateY(0) translateX(0); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(-110vh) translateX(20px); opacity: 0; }
}

/* ======================
   CONTAINER
====================== */
.wallet-container {
  position: relative; z-index: 2;
  max-width: 1180px;
  margin: 0 auto;
}

/* ======================
   HEADER
====================== */
.wallet-header {
  text-align: center;
  margin: 40px 0 64px;
  animation: fadeUp .9s ease both;
}
.eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  color: var(--gold-2);
  text-transform: uppercase;
  letter-spacing: .42em;
  font-size: .68rem;
  font-weight: 600;
  padding: 8px 18px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(212, 175, 55, .05);
  backdrop-filter: blur(6px);
}
.eyebrow .dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--gold-bright);
  box-shadow: 0 0 10px var(--gold-bright);
}
.title {
  font-family: "Fraunces", serif;
  font-weight: 700;
  font-size: clamp(2.8rem, 6vw, 5rem);
  line-height: 1;
  margin: 22px 0 18px;
  letter-spacing: -.02em;
}
.title-accent {
  display: block;
  font-style: italic;
  font-weight: 500;
  background: linear-gradient(180deg, #fff5d6 0%, var(--gold-bright) 45%, var(--gold) 75%, #8a6a1f 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 4px 20px rgba(255, 182, 72, .25));
}
.subtitle {
  color: var(--bone-dim);
  max-width: 620px;
  margin: 0 auto;
  line-height: 1.7;
  font-size: 1.02rem;
}

/* ======================
   GRID + CARDS (3D)
====================== */
.wallet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 36px;
  perspective: 1400px;
}

.wallet-card {
  --rx: 0deg; --ry: 0deg; --mx: 50%; --my: 50%;
  position: relative;
  padding: 32px 32px 28px;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .045), rgba(255, 255, 255, .015)),
    linear-gradient(135deg, rgba(212, 175, 55, .06), rgba(0, 0, 0, .2));
  border: 1px solid var(--line);
  box-shadow:
    0 30px 60px -30px rgba(0, 0, 0, .9),
    inset 0 1px 0 rgba(255, 255, 255, .04);
  backdrop-filter: blur(14px);
  transform: rotateX(var(--rx)) rotateY(var(--ry));
  transition: transform .3s ease, border-color .3s ease, box-shadow .3s ease;
  overflow: hidden;
  animation: fadeUp 1s .15s ease both;
}
.wallet-card:hover {
  border-color: var(--line-strong);
  box-shadow:
    0 40px 80px -30px rgba(0, 0, 0, .95),
    0 0 0 1px rgba(212, 175, 55, .15),
    inset 0 1px 0 rgba(255, 255, 255, .06);
}
.card-glow {
  position: absolute; inset: 0;
  pointer-events: none;
  background: radial-gradient(360px circle at var(--mx) var(--my), rgba(255, 216, 107, .12), transparent 55%);
  opacity: 0; transition: opacity .4s ease;
}
.wallet-card:hover .card-glow { opacity: 1; }
.card-shine {
  position: absolute; inset: 0;
  pointer-events: none;
  background: linear-gradient(120deg, transparent 30%, rgba(255, 255, 255, .04) 50%, transparent 70%);
  transform: translateX(-100%);
}
.wallet-card:hover .card-shine {
  animation: shine 1.2s ease;
}
@keyframes shine {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}
.label {
  display: inline-flex; align-items: center; gap: 10px;
  color: var(--bone-dim);
  letter-spacing: .22em;
  text-transform: uppercase;
  font-size: .72rem;
  font-weight: 600;
}
.ico {
  width: 18px; height: 18px;
  display: inline-block;
  background: var(--gold-2);
  -webkit-mask-size: contain; mask-size: contain;
  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
  -webkit-mask-position: center; mask-position: center;
}
.ico-vault {
  -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><rect x='3' y='5' width='18' height='14' rx='2'/><circle cx='12' cy='12' r='3'/><path d='M12 9v6M9 12h6'/></svg>");
          mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><rect x='3' y='5' width='18' height='14' rx='2'/><circle cx='12' cy='12' r='3'/><path d='M12 9v6M9 12h6'/></svg>");
}
.ico-fossil {
  -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'><circle cx='12' cy='12' r='9' fill='none' stroke='currentColor' stroke-width='2'/><circle cx='12' cy='12' r='3'/></svg>");
          mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'><circle cx='12' cy='12' r='9' fill='none' stroke='currentColor' stroke-width='2'/><circle cx='12' cy='12' r='3'/></svg>");
}

.chip {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: .68rem;
  letter-spacing: .15em;
  text-transform: uppercase;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(212, 175, 55, .06);
  color: var(--gold-2);
}
.chip-live .pulse {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #6ce0a4;
  box-shadow: 0 0 10px #6ce0a4;
  animation: livePulse 1.6s ease-in-out infinite;
}
@keyframes livePulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.5); opacity: .6; }
}

.amount {
  display: flex; align-items: baseline; gap: 10px;
  margin: 4px 0 22px;
}
.currency {
  font-family: "Fraunces", serif;
  font-size: 1.4rem;
  color: var(--gold-2);
  font-weight: 500;
}
.value {
  font-family: "Geist Mono", "JetBrains Mono", monospace;
  font-size: clamp(2.4rem, 4.5vw, 3.4rem);
  font-weight: 700;
  margin: 0;
  background: linear-gradient(180deg, #fff5d6, var(--gold) 80%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -.02em;
  line-height: 1;
}
.mono { font-variant-numeric: tabular-nums; }

.coin-amount { gap: 18px; }
.coin-wrap {
  position: relative;
  width: 56px; height: 56px;
  display: flex; align-items: center; justify-content: center;
}
.coin-halo {
  position: absolute; inset: -8px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 216, 107, .35), transparent 65%);
  animation: pulseHalo 2.4s ease-in-out infinite;
}
@keyframes pulseHalo {
  0%, 100% { transform: scale(.9); opacity: .5; }
  50%      { transform: scale(1.1); opacity: 1; }
}
.coin-img {
  position: relative;
  width: 48px; height: 48px;
  object-fit: contain;
  filter: drop-shadow(0 4px 14px rgba(255, 182, 72, .5));
  animation: coinFloat 3.5s ease-in-out infinite;
}
@keyframes coinFloat {
  0%, 100% { transform: translateY(0) rotate(-6deg); }
  50%      { transform: translateY(-6px) rotate(6deg); }
}

.card-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 18px;
  border-top: 1px dashed var(--line);
}
.muted { color: var(--bone-dim); font-size: .82rem; }
.ribbon {
  font-family: "Geist Mono", monospace;
  font-size: .7rem;
  letter-spacing: .2em;
  color: var(--gold);
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: rgba(0, 0, 0, .3);
}

/* ======================
   CONVERT CARD
====================== */
.convert-card {
  position: relative;
  padding: 44px;
  border-radius: 32px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .035), rgba(255, 255, 255, .01)),
    radial-gradient(600px 300px at 50% 0%, rgba(212, 175, 55, .08), transparent 70%);
  border: 1px solid var(--line);
  box-shadow:
    0 40px 80px -30px rgba(0, 0, 0, .9),
    inset 0 1px 0 rgba(255, 255, 255, .04);
  backdrop-filter: blur(14px);
  overflow: hidden;
  animation: fadeUp 1s .3s ease both;
}
.convert-card::before {
  content: "";
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 60%; height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  opacity: .6;
}

.convert-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}
.kicker {
  display: inline-block;
  font-family: "Geist Mono", monospace;
  color: var(--gold);
  font-size: .72rem;
  letter-spacing: .3em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.convert-title {
  font-family: "Fraunces", serif;
  font-weight: 700;
  font-size: clamp(1.6rem, 2.6vw, 2.1rem);
  margin: 0;
  color: var(--bone);
  letter-spacing: -.01em;
}
.rate-pill {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(212, 175, 55, .05);
  color: var(--bone-dim);
  font-size: .85rem;
}
.rate-pill strong { color: var(--gold-2); font-weight: 600; }
.rate-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--gold-bright);
  box-shadow: 0 0 10px var(--gold-bright);
}

.convert-body { display: flex; flex-direction: column; gap: 22px; }

.field-label {
  display: block;
  margin-bottom: 10px;
  font-size: .78rem;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: var(--bone-dim);
  font-weight: 600;
}
.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(0, 0, 0, .4);
  padding: 0 14px;
  transition: border-color .25s ease, box-shadow .25s ease;
}
.input-wrap:focus-within {
  border-color: var(--gold);
  box-shadow: 0 0 0 4px rgba(212, 175, 55, .12);
}
.input-coin {
  width: 28px; height: 28px;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(255, 182, 72, .5));
}
.input-wrap input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--bone);
  padding: 20px 14px;
  font-size: 1.4rem;
  font-family: "Geist Mono", monospace;
  font-weight: 600;
  letter-spacing: -.01em;
  width: 100%;
}
.input-wrap input::placeholder { color: rgba(245, 230, 200, .25); }
.input-wrap input::-webkit-outer-spin-button,
.input-wrap input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.input-wrap input[type=number] { -moz-appearance: textfield; }

.max-btn {
  border: 1px solid var(--line);
  background: rgba(212, 175, 55, .1);
  color: var(--gold-2);
  font-family: "Geist Mono", monospace;
  font-size: .72rem;
  letter-spacing: .18em;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all .2s ease;
}
.max-btn:hover:not(:disabled) {
  background: rgba(212, 175, 55, .22);
  color: var(--gold-bright);
  transform: translateY(-1px);
}
.max-btn:disabled { opacity: .35; cursor: not-allowed; }

.presets { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
.preset {
  font-family: "Geist Mono", monospace;
  font-size: .8rem;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--bone-dim);
  cursor: pointer;
  transition: all .2s ease;
}
.preset:hover:not(:disabled) {
  border-color: var(--gold);
  color: var(--gold-bright);
  transform: translateY(-1px);
}
.preset:disabled { opacity: .3; cursor: not-allowed; }

.arrow-row {
  display: flex; align-items: center; gap: 14px;
  color: var(--gold);
  opacity: .6;
}
.arrow-row .line {
  flex: 1; height: 1px;
  background: linear-gradient(90deg, transparent, var(--line), transparent);
}
.arrow-row .arrow {
  font-size: .8rem;
  animation: bob 1.8s ease-in-out infinite;
}
@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(3px); }
}

.preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 24px;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(212, 175, 55, .14), rgba(212, 175, 55, .04));
  border: 1px solid var(--line);
  position: relative;
  overflow: hidden;
}
.preview::before {
  content: "";
  position: absolute; inset: 0;
  background: radial-gradient(400px 100px at 20% 50%, rgba(255, 216, 107, .15), transparent 60%);
}
.preview-left { display: flex; flex-direction: column; gap: 2px; position: relative; }
.preview-label {
  font-size: .72rem;
  letter-spacing: .25em;
  text-transform: uppercase;
  color: var(--bone-dim);
  font-weight: 600;
}
.preview-sub { font-size: .78rem; color: var(--bone-dim); opacity: .7; }
.preview-value {
  font-family: "Geist Mono", monospace;
  font-size: 1.7rem;
  font-weight: 700;
  background: linear-gradient(180deg, #fff5d6, var(--gold));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  letter-spacing: -.02em;
}

/* ======================
   CTA
====================== */
.cta {
  position: relative;
  width: 100%;
  padding: 20px;
  border: none;
  border-radius: 18px;
  background: linear-gradient(135deg, #ffd86b, var(--gold) 45%, #8a6a1f 100%);
  color: #1a1208;
  font-weight: 700;
  font-size: .95rem;
  letter-spacing: .15em;
  text-transform: uppercase;
  cursor: pointer;
  overflow: hidden;
  transition: transform .25s ease, box-shadow .25s ease, filter .25s ease;
  box-shadow:
    0 14px 30px -10px rgba(212, 175, 55, .45),
    inset 0 1px 0 rgba(255, 255, 255, .35);
  font-family: "Inter", sans-serif;
}
.cta::before {
  content: "";
  position: absolute;
  top: 0; left: -100%;
  width: 60%; height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, .5), transparent);
  transition: left .8s ease;
}
.cta:hover:not(:disabled) {
  transform: translateY(-3px);
  filter: brightness(1.08);
  box-shadow:
    0 22px 40px -10px rgba(212, 175, 55, .6),
    inset 0 1px 0 rgba(255, 255, 255, .45);
}
.cta:hover:not(:disabled)::before { left: 130%; }
.cta:active:not(:disabled) { transform: translateY(-1px); }
.cta:disabled {
  opacity: .45;
  cursor: not-allowed;
  filter: grayscale(.3);
}
.cta-label, .cta-loading {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  position: relative;
}
.cta-arrow {
  transition: transform .25s ease;
  display: inline-block;
}
.cta:hover:not(:disabled) .cta-arrow { transform: translateX(4px); }

.spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(26, 18, 8, .3);
  border-top-color: #1a1208;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ======================
   BURST (sparks)
====================== */
.burst {
  position: absolute;
  left: 50%; top: 50%;
  width: 0; height: 0;
  pointer-events: none;
  z-index: 4;
}
.spark {
  position: absolute;
  left: 0; top: 0;
  width: var(--size); height: var(--size);
  border-radius: 50%;
  background: radial-gradient(circle, var(--gold-bright), var(--gold) 60%, transparent 70%);
  box-shadow: 0 0 14px var(--gold-bright);
  transform: rotate(var(--angle)) translateY(0);
  animation: sparkFly 1.3s var(--delay) cubic-bezier(.2, .8, .3, 1) forwards;
  opacity: 0;
}
@keyframes sparkFly {
  0%   { opacity: 1; transform: rotate(var(--angle)) translateY(0) scale(1); }
  80%  { opacity: 1; }
  100% { opacity: 0; transform: rotate(var(--angle)) translateY(calc(var(--dist) * -1)) scale(.3); }
}

/* ======================
   MICRO + UTILS
====================== */
.micro {
  text-align: center;
  font-size: .76rem;
  color: var(--bone-dim);
  opacity: .55;
  margin-top: 40px;
  letter-spacing: .08em;
  font-family: "Geist Mono", monospace;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ======================
   TOAST
====================== */
.toast {
  position: fixed;
  bottom: 28px; left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px 14px 16px;
  border-radius: 14px;
  background: rgba(20, 12, 6, .92);
  border: 1px solid var(--line-strong);
  color: var(--bone);
  font-size: .9rem;
  font-weight: 500;
  backdrop-filter: blur(14px);
  box-shadow: 0 20px 50px -15px rgba(0, 0, 0, .8);
  max-width: 90vw;
}
.toast-ico {
  width: 26px; height: 26px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%;
  font-weight: 700;
  font-size: .9rem;
  font-family: "Fraunces", serif;
}
.toast-success .toast-ico { background: rgba(108, 224, 164, .15); color: #6ce0a4; border: 1px solid rgba(108, 224, 164, .3); }
.toast-error   .toast-ico { background: rgba(255, 110, 90, .15);  color: #ff8a73; border: 1px solid rgba(255, 110, 90, .3); }
.toast-info    .toast-ico { background: rgba(212, 175, 55, .15);  color: var(--gold-2); border: 1px solid var(--line-strong); }

.toast-anim-enter-from, .toast-anim-leave-to { opacity: 0; transform: translateX(-50%) translateY(20px); }
.toast-anim-enter-active, .toast-anim-leave-active { transition: all .35s cubic-bezier(.2, .8, .3, 1); }

/* ======================
   RESPONSIVE
====================== */
@media (max-width: 720px) {
  .wallet-page { padding: 60px 16px 80px; }
  .convert-card { padding: 28px 22px; }
  .convert-head { flex-direction: column; align-items: flex-start; }
  .rate-pill { align-self: stretch; justify-content: center; }
  .wallet-card { padding: 26px 22px; }
}

/* ======================
   MOTION REDUCED
====================== */
@media (prefers-reduced-motion: reduce) {
  .bg-amber, .coin-img, .coin-halo, .arrow-row .arrow,
  .particles span, .chip-live .pulse { animation: none !important; }
  .wallet-card { transform: none !important; }
}
</style>