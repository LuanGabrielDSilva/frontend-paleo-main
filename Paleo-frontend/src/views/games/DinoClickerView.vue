<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
} from "vue";

import { upgrades as upgradesData } from "@/data/upgrades";
import { achievementsData } from "@/data/achievements";

/* =========================================================
   TYPES
========================================================= */
type Upgrade = {
  id: string;
  name: string;
  description: string;
  icon: string;
  baseCost: number;
  power: number;
  cps?: number;
  level: number;
};

type FloatingText = {
  id: string;
  x: number;
  y: number;
  value: string;
  critical: boolean;
};

type Particle = {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  size: number;
};

type Achievement = {
  id: string;
  icon: string;
  name: string;
  description: string;
  goal: number;
  reward?: number;
  metric: "clicks" | "coins" | "upgrades" | "combo";
  unlocked: boolean;
};

type Toast = {
  id: number;
  icon: string;
  title: string;
  message: string;
  tone: "gold" | "mint" | "magenta";
};

type GameEvent = {
  id: number;
  type: "golden" | "meteor" | "surge";
  x: number;
  y: number;
  expires: number;
};

/* =========================================================
   USER / GUEST ID
========================================================= */
const user = JSON.parse(localStorage.getItem("user") || "null");

let guestId = localStorage.getItem("@paleoworld:guestId");
if (!guestId) {
  guestId = crypto.randomUUID();
  localStorage.setItem("@paleoworld:guestId", guestId);
}

const userId = ref<string>(
  user?.id ? `user_${user.id}` : `guest_${guestId}`
);

const getSaveKey = () => `paleo_clicker_save_${userId.value}`;

/* =========================================================
   STATE
========================================================= */
const coins = ref<number>(0);
const totalClicks = ref<number>(0);
const lifetimeCoins = ref<number>(0);

const currentDino = ref<string>("🦖");
const dinos = ref<string[]>(["🦖", "🦕", "🐊", "🦴", "🐉"]);

const upgrades = ref<Upgrade[]>(
  upgradesData.map((upgrade: any) => ({
    ...upgrade,
    level: 0,
  }))
);

const floatingTexts = ref<FloatingText[]>([]);
const particles = ref<Particle[]>([]);
const toasts = ref<Toast[]>([]);
const gameEvents = ref<GameEvent[]>([]);

/* Achievement Unlock Modal */
const showAchievementModal = ref(false);
const unlockedAchievement = ref<Achievement | null>(null);
const achievementRewardAmount = ref(0);

/* Combo system */
const combo = ref<number>(0);
const comboBarPct = ref<number>(0);
let comboResetTimer: ReturnType<typeof setTimeout> | null = null;
let comboDecayInterval: ReturnType<typeof setInterval> | null = null;
const COMBO_WINDOW_MS = 1600;

/* Tabs */
const activeTab = ref<"shop" | "achievements" | "stats">("shop");

/* Surge state */
const surgeActive = ref<boolean>(false);
const surgeUntil = ref<number>(0);

/* Screen shake */
const shakeStrength = ref<number>(0);

/* Heartbeat */
const heartbeat = ref<number>(0);

/* =========================================================
   ACHIEVEMENTS (APENAS DO ARQUIVO achievements.ts)
========================================================= */
const achievements = ref<Achievement[]>(
  achievementsData.map((a: any) => ({
    ...a,
    unlocked: false,
  }))
);

/* =========================================================
   COMPUTEDS
========================================================= */
const surgeMultiplier = computed(() => (surgeActive.value ? 3 : 1));

const comboMultiplier = computed(() => {
  if (combo.value < 5) return 1;
  return 1 + Math.min(combo.value, 200) * 0.04;
});

const coinsPerSecond = computed(() => {
  const baseCps = upgrades.value.reduce(
    (total, upgrade) => total + upgrade.level * (upgrade.cps || 0),
    0
  );
  return Math.floor(baseCps * surgeMultiplier.value);
});

const clickPower = computed(() => {
  const basePower = upgrades.value.reduce(
    (total, upgrade) => total + upgrade.level * upgrade.power,
    1
  );
  return Math.floor(basePower);
});

const effectiveClickPower = computed(() =>
  Math.floor(clickPower.value * comboMultiplier.value)
);

const upgradesOwned = computed(
  () => upgrades.value.filter((u) => u.level > 0).length
);

const achievementsUnlocked = computed(
  () => achievements.value.filter((a) => a.unlocked).length
);

/* =========================================================
   SAVE / LOAD
========================================================= */
const loadGame = () => {
  const data = localStorage.getItem(getSaveKey());
  if (!data) return;
  try {
    const parsed = JSON.parse(data);
    coins.value = parsed.coins ?? 0;
    totalClicks.value = parsed.totalClicks ?? 0;
    lifetimeCoins.value = parsed.lifetimeCoins ?? 0;

    upgrades.value.forEach((upgrade) => {
      const saved = parsed.upgrades?.find((s: any) => s.id === upgrade.id);
      upgrade.level = saved?.level ?? 0;
    });

    achievements.value.forEach((ach) => {
      const saved = parsed.achievements?.find((s: any) => s.id === ach.id);
      ach.unlocked = saved?.unlocked ?? false;
    });
  } catch (e) {
    console.error("Erro ao carregar save:", e);
  }
};

const saveGame = () => {
  const data = {
    coins: coins.value,
    totalClicks: totalClicks.value,
    lifetimeCoins: lifetimeCoins.value,
    upgrades: upgrades.value.map((u) => ({ id: u.id, level: u.level })),
    achievements: achievements.value.map((a) => ({
      id: a.id,
      unlocked: a.unlocked,
    })),
  };
  localStorage.setItem(getSaveKey(), JSON.stringify(data));
};

/* =========================================================
   REWARD ACHIEVEMENT
========================================================= */
const rewardAchievement = async (ach: Achievement) => {
  if (!ach.reward) return;
  const reward = ach.reward;

  coins.value += reward;
  lifetimeCoins.value += reward;

  spawnParticles(window.innerWidth / 2, window.innerHeight / 2 - 100, true);
  shakeStrength.value = 16;
  setTimeout(() => (shakeStrength.value = 0), 500);

  pushToast(ach.icon, "Conquista Desbloqueada!", `+${reward} moedas`, "gold");
  spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2 - 80, `+${reward}`, true);

  saveGame();

  // Tenta salvar no banco
  const API = import.meta.env.VITE_API_URL || "http://localhost:3333";
  const userData = JSON.parse(localStorage.getItem("user") || "{}");

  if (userData?.id) {
    try {
      await fetch(`${API}/reward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          coins: reward,
          source: "achievement",
          achievementId: ach.id
        }),
      });
    } catch (err) {
      console.warn("Não foi possível salvar no banco, moedas salvas localmente.");
    }
  }
};

/* =========================================================
   CHECK ACHIEVEMENTS
========================================================= */
const checkAchievements = () => {
  achievements.value.forEach((ach) => {
    if (ach.unlocked) return;

    let current = 0;
    if (ach.metric === "clicks") current = totalClicks.value;
    else if (ach.metric === "coins") current = lifetimeCoins.value;
    else if (ach.metric === "upgrades") current = upgradesOwned.value;
    else if (ach.metric === "combo") current = combo.value;

    if (current >= ach.goal) {
      ach.unlocked = true;
      rewardAchievement(ach);
      showAchievementUnlockModal(ach);
    }
  });
};

watch([totalClicks, lifetimeCoins, upgradesOwned, combo], checkAchievements);

/* =========================================================
   TOASTS + MODAL
========================================================= */
const pushToast = (
  icon: string,
  title: string,
  message: string,
  tone: Toast["tone"] = "gold"
) => {
  const id = Date.now() + Math.random();
  toasts.value.push({ id, icon, title, message, tone });
  if (toasts.value.length > 4) toasts.value.shift();
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, 4200);
};

const showAchievementUnlockModal = (ach: Achievement) => {
  unlockedAchievement.value = ach;
  achievementRewardAmount.value = ach.reward || 0;
  showAchievementModal.value = true;
};

const closeAchievementModal = () => {
  showAchievementModal.value = false;
  setTimeout(() => {
    unlockedAchievement.value = null;
    achievementRewardAmount.value = 0;
  }, 300);
};

/* =========================================================
   PARTICLES + FLOATING TEXT
========================================================= */
let particleCounter = 0;
let floatingCounter = 0;

const animateParticles = () => {
  particles.value = particles.value
    .map((p) => ({
      ...p,
      x: p.x + p.dx,
      y: p.y + p.dy,
      dy: p.dy + 0.35,
      size: p.size * 0.96,
    }))
    .filter((p) => p.size > 0.5 && p.y < window.innerHeight + 50);

  requestAnimationFrame(animateParticles);
};

const spawnParticles = (x: number, y: number, critical: boolean) => {
  const count = critical ? 14 : 8;
  const palette = critical
    ? ["#ff5fa2", "#f5b14c", "#7cffb2", "#ffffff"]
    : ["#f5b14c", "#ffd97c", "#fff1c2"];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const speed = 4 + Math.random() * 5;
    particles.value.push({
      id: `p-${Date.now()}-${particleCounter++}`,
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed - 2,
      color: palette[Math.floor(Math.random() * palette.length)],
      size: 6 + Math.random() * 5,
    });
  }
};

const spawnFloatingText = (
  x: number,
  y: number,
  value: string,
  critical: boolean
) => {
  const id = `f-${Date.now()}-${floatingCounter++}`;
  floatingTexts.value.push({ id, x, y, value, critical });
  setTimeout(() => {
    floatingTexts.value = floatingTexts.value.filter((t) => t.id !== id);
  }, 1000);
};

/* =========================================================
   UTILS + CLICK + UPGRADES + MINI EVENTS
========================================================= */
const coinImage = new URL(
  "@/assets/moedaDoSite.png",
  import.meta.url
).href;

const formatNumber = (
  value: number | undefined | null
): string => {
  if (value === undefined || value === null || isNaN(value)) return "0";
  if (value < 1000) return Math.floor(value).toString();

  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  let unitIndex = -1;
  let v = value;
  while (v >= 1000 && unitIndex < units.length - 1) {
    v /= 1000;
    unitIndex++;
  }
  return `${v.toFixed(1)}${units[unitIndex]}`;
};

const clickDino = (event: MouseEvent) => {
  totalClicks.value++;
  const gained = effectiveClickPower.value;
  coins.value += gained;
  lifetimeCoins.value += gained;

  const critical = combo.value >= 10;
  spawnFloatingText(event.clientX, event.clientY, `+${formatNumber(gained)}`, critical);
  spawnParticles(event.clientX, event.clientY, critical);

  combo.value++;
  if (comboResetTimer) clearTimeout(comboResetTimer);
  comboResetTimer = setTimeout(() => combo.value = 0, COMBO_WINDOW_MS);
};

const shakeStyle = computed(() => {
  if (!shakeStrength.value) return {};
  const s = shakeStrength.value;
  const x = (Math.random() - 0.5) * s;
  const y = (Math.random() - 0.5) * s;
  return { transform: `translate(${x}px, ${y}px)` };
});

const getAchievementProgress = (ach: Achievement): number => {
  let current = 0;
  if (ach.metric === "clicks") current = totalClicks.value;
  else if (ach.metric === "coins") current = lifetimeCoins.value;
  else if (ach.metric === "upgrades") current = upgradesOwned.value;
  else if (ach.metric === "combo") current = combo.value;
  return Math.min(100, (current / ach.goal) * 100);
};

const getUpgradeCost = (upgrade: Upgrade): number =>
  Math.floor(upgrade.baseCost * Math.pow(1.45, upgrade.level));

const buyUpgrade = (upgrade: Upgrade) => {
  const cost = getUpgradeCost(upgrade);
  if (coins.value < cost) return;
  coins.value -= cost;
  upgrade.level++;
  saveGame();

  if (upgrade.level === 1) {
    pushToast(upgrade.icon, "Novo desbloqueio", upgrade.name, "mint");
  }
};

// Mini-events (mantidos)
const spawnGoldenDino = () => { /* seu código original */ };
const claimGolden = (event: GameEvent, e: MouseEvent) => { /* seu código original */ };
const spawnMeteor = () => { /* seu código original */ };
const triggerSurge = () => { /* seu código original */ };

/* =========================================================
   LIFECYCLE
========================================================= */
let gameInterval: ReturnType<typeof setInterval>;
let saveInterval: ReturnType<typeof setInterval>;
let eventInterval: ReturnType<typeof setInterval>;
let heartbeatInterval: ReturnType<typeof setInterval>;

onMounted(() => {
  loadGame();

  gameInterval = setInterval(() => {
    const gain = coinsPerSecond.value;
    coins.value += gain;
    lifetimeCoins.value += gain;

    if (surgeActive.value && Date.now() > surgeUntil.value) {
      surgeActive.value = false;
    }
  }, 1000);

  saveInterval = setInterval(saveGame, 5000);

  heartbeatInterval = setInterval(() => {
    heartbeat.value = (heartbeat.value + 1) % 1000;
  }, 1100);

  eventInterval = setInterval(() => {
    if (gameEvents.value.length > 0) return;
    const roll = Math.random();
    if (roll < 0.18) spawnGoldenDino();
    else if (roll < 0.30) spawnMeteor();
    else if (roll < 0.38) triggerSurge();
  }, 25000);

  animateParticles();
  checkAchievements();
});

onUnmounted(() => {
  clearInterval(gameInterval);
  clearInterval(saveInterval);
  clearInterval(eventInterval);
  clearInterval(heartbeatInterval);
  if (comboResetTimer) clearTimeout(comboResetTimer);
  if (comboDecayInterval) clearInterval(comboDecayInterval);
  saveGame();
});
</script>

<template>
  <div class="clicker-page" :style="shakeStyle" data-testid="clicker-page">
    <!-- AMBIENT BG -->
    <div class="bg-amber-orb bg-amber-orb--1"></div>
    <div class="bg-amber-orb bg-amber-orb--2"></div>
    <div class="bg-mint-orb"></div>
    <div class="bg-grain"></div>
    <div class="bg-grid"></div>
    <div class="bg-vignette"></div>

    <!-- DNA HELIX DECOR (left side) -->
    <svg class="dna-decor dna-decor--left" viewBox="0 0 60 600" preserveAspectRatio="none" aria-hidden="true">
      <path d="M30 0 Q60 50 30 100 T30 200 T30 300 T30 400 T30 500 T30 600"
            fill="none" stroke="url(#dnaGrad)" stroke-width="1.5" opacity="0.5"/>
      <path d="M30 0 Q0 50 30 100 T30 200 T30 300 T30 400 T30 500 T30 600"
            fill="none" stroke="url(#dnaGrad2)" stroke-width="1.5" opacity="0.5"/>
      <defs>
        <linearGradient id="dnaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7cffb2"/>
          <stop offset="100%" stop-color="#f5b14c"/>
        </linearGradient>
        <linearGradient id="dnaGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ff5fa2"/>
          <stop offset="100%" stop-color="#7cffb2"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- HEADER -->
    <header class="page-header" data-testid="page-header">
      <div class="header-left">
        <div class="emblem-wrap">
          <div class="emblem-ring"></div>
          <div class="emblem">🦖</div>
        </div>
        <div class="header-text">
          <span class="eyebrow">
            <span class="eyebrow-dot"></span>
            EXPEDIÇÃO 0.{{ totalClicks }} · ÂMBAR VIVO
          </span>
          <h1>
            Arena dos<br/>
            <em>Fósseis Vivos</em>
          </h1>
        </div>
      </div>
      <div class="header-right">
        <div class="achievement-badge" data-testid="achievement-badge">
          <span class="badge-num">{{ achievementsUnlocked }}</span>
          <span class="badge-total">/{{ achievements.length }}</span>
          <span class="badge-label">Conquistas</span>
        </div>
        <div class="surge-pill" v-if="surgeActive" data-testid="surge-pill">
          <span class="pulse"></span>
          SURTO DE DNA · CPS x3
        </div>
      </div>
    </header>

    <!-- STATS STRIP -->
    <section class="stats-strip" data-testid="stats-strip">
      <div class="stat-pod stat-pod--primary" data-testid="stat-tesouro">
        <div class="pod-icon">
          <img :src="coinImage" alt="" />
        </div>
        <div class="pod-meta">
          <span class="pod-label">Tesouro</span>
          <strong class="pod-value">{{ formatNumber(coins) }}</strong>
        </div>
        <span class="pod-spark"></span>
      </div>

      <div class="stat-pod" data-testid="stat-poder">
        <div class="pod-icon pod-icon--power">⚡</div>
        <div class="pod-meta">
          <span class="pod-label">Poder / clique</span>
          <strong class="pod-value">
            {{ formatNumber(effectiveClickPower) }}
            <span class="pod-mult" v-if="comboMultiplier > 1">
              ×{{ comboMultiplier.toFixed(2) }}
            </span>
          </strong>
        </div>
      </div>

      <div class="stat-pod" data-testid="stat-cps">
        <div class="pod-icon pod-icon--mint">🧬</div>
        <div class="pod-meta">
          <span class="pod-label">Por segundo</span>
          <strong class="pod-value pod-value--mint">
            {{ formatNumber(coinsPerSecond) }}
          </strong>
        </div>
      </div>

      <div class="stat-pod" data-testid="stat-cliques">
        <div class="pod-icon pod-icon--bone">🦴</div>
        <div class="pod-meta">
          <span class="pod-label">Cliques totais</span>
          <strong class="pod-value">{{ formatNumber(totalClicks) }}</strong>
        </div>
      </div>
    </section>

    <!-- ACHIEVEMENT UNLOCK MODAL — teleportado para <body> para flutuar acima de tudo
         (evita que ancestrais com transform/filter quebrem position: fixed e empurrem o layout) -->
    <Teleport to="body">
    <Transition name="modal-pop">
      <div v-if="showAchievementModal && unlockedAchievement" class="achievement-modal" @click.self="closeAchievementModal">
        <div class="modal-aurora"></div>

        <div class="modal-box">
          <!-- Animated backdrop layers -->
          <div class="modal-rays"></div>
          <div class="modal-glow"></div>
          <div class="modal-grid"></div>

          <!-- Confetti / sparkles -->
          <div class="confetti">
            <span v-for="n in 30" :key="'c'+n" :style="{ '--i': n }">✦</span>
          </div>
          <div class="sparkles">
            <span v-for="n in 12" :key="'s'+n" :style="{ '--i': n }"></span>
          </div>

          <!-- Close button -->
          <button class="modal-close" @click="closeAchievementModal" aria-label="Fechar">
            <span>×</span>
          </button>

          <!-- Eyebrow ribbon -->
          <div class="modal-ribbon">
            <span class="ribbon-dot"></span>
            <span class="ribbon-text">CONQUISTA DESBLOQUEADA</span>
            <span class="ribbon-dot"></span>
          </div>

          <!-- Trophy with halos -->
          <div class="trophy-wrap">
            <div class="trophy-halo trophy-halo--outer"></div>
            <div class="trophy-halo trophy-halo--mid"></div>
            <div class="trophy-ring"></div>
            <div class="trophy-disc">
              <div class="trophy">{{ unlockedAchievement.icon }}</div>
            </div>
            <div class="trophy-stars">
              <span>★</span><span>★</span><span>★</span>
            </div>
          </div>

          <h2 class="modal-title">{{ unlockedAchievement.name }}</h2>
          <p class="modal-desc">{{ unlockedAchievement.description }}</p>

          <div class="modal-divider">
            <span class="divider-gem">◆</span>
          </div>

          <div class="reward-box">
            <div class="reward-coin">
              <img :src="coinImage" alt="Moeda" class="coin-icon" />
            </div>
            <div class="reward-text">
              <span class="reward-label">RECOMPENSA</span>
              <span class="reward-value">+{{ formatNumber(achievementRewardAmount) }}</span>
              <span class="reward-sub">moedas adicionadas ao cofre</span>
            </div>
          </div>

          <button class="modal-btn" @click="closeAchievementModal">
            <span class="btn-text">Continuar Expedição</span>
            <span class="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </Transition>
    </Teleport>

    <!-- MAIN GRID -->
    <main class="layout">
      <!-- LEFT — ARENA -->
      <section class="arena-col">
        <div class="arena" data-testid="arena">
          <!-- Aurora behind dino -->
          <div class="aurora aurora--1"></div>
          <div class="aurora aurora--2"></div>

          <!-- Rings -->
          <div class="ring ring--outer">
            <span v-for="i in 12" :key="i" class="ring-mark" :style="{ transform: `rotate(${i * 30}deg) translateY(-160px)` }"></span>
          </div>
          <div class="ring ring--mid"></div>
          <div class="ring ring--inner" :class="{ 'ring--combo': combo >= 10 }"></div>

          <!-- Heartbeat -->
          <span class="heartbeat" :key="heartbeat"></span>

          <!-- Combo halo -->
          <div class="combo-halo" v-if="combo >= 5" :class="{ 'combo-halo--super': combo >= 50 }"></div>

          <!-- Dino button -->
          <button
            class="dino-button"
            :class="{ 'dino-button--combo': combo >= 25 }"
            @click="clickDino"
            data-testid="dino-button"
            aria-label="Clicar no dinossauro"
          >
            <span class="dino-emoji" :key="currentDino">{{ currentDino }}</span>
            <span class="dino-shadow"></span>
          </button>

          <!-- Combo indicator -->
          <div class="combo-indicator" :class="{ 'combo-indicator--visible': combo >= 2 }" data-testid="combo-indicator">
            <span class="combo-num">{{ combo }}<small>x</small></span>
            <span class="combo-label">COMBO</span>
            <div class="combo-bar">
              <div class="combo-bar-fill" :style="{ width: comboBarPct + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- Instruction -->
        <p class="instruction">
          <span class="dash"></span>
          Toque o fóssil. Acumule. Quebre o tempo.
          <span class="dash"></span>
        </p>

        <!-- Golden Dino floating events -->
        <transition-group name="golden" tag="div" class="golden-layer">
          <button
            v-for="ev in gameEvents.filter(e => e.type === 'golden')"
            :key="ev.id"
            class="golden-dino"
            :style="{ left: ev.x + '%', top: ev.y + '%' }"
            @click="(e) => claimGolden(ev, e)"
            data-testid="golden-dino"
            aria-label="Dino Dourado"
          >
            <span class="golden-aura"></span>
            <span class="golden-emoji">🦖</span>
          </button>
        </transition-group>
      </section>

      <!-- RIGHT — SIDE PANEL -->
      <aside class="side-panel" data-testid="side-panel">
        <nav class="tab-nav">
          <button
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'shop' }"
            @click="activeTab = 'shop'"
            data-testid="tab-shop"
          >
            <span>Mercado</span>
          </button>
          <button
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'achievements' }"
            @click="activeTab = 'achievements'"
            data-testid="tab-achievements"
          >
            <span>Conquistas</span>
            <em class="tab-pill">{{ achievementsUnlocked }}</em>
          </button>
          <button
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'stats' }"
            @click="activeTab = 'stats'"
            data-testid="tab-stats"
          >
            <span>Códex</span>
          </button>
        </nav>

        <!-- SHOP -->
        <div class="panel-body" v-if="activeTab === 'shop'" data-testid="shop-panel">
          <header class="panel-head">
            <span class="panel-eyebrow">Mercado Fóssil</span>
            <h2>Catálogo de Resinas</h2>
          </header>

          <div class="upgrades-list">
            <article
              v-for="upgrade in upgrades"
              :key="upgrade.id"
              class="shop-card"
              :class="{ 'shop-card--owned': upgrade.level > 0, 'shop-card--locked': coins < getUpgradeCost(upgrade) }"
              :data-testid="`upgrade-${upgrade.id}`"
            >
              <div class="shop-card-glow"></div>
              <div class="shop-icon">
                <span>{{ upgrade.icon }}</span>
              </div>
              <div class="shop-info">
                <div class="shop-title-row">
                  <h3>{{ upgrade.name }}</h3>
                  <span class="shop-level" v-if="upgrade.level > 0">
                    Nv. {{ upgrade.level }}
                  </span>
                </div>
                <p>{{ upgrade.description }}</p>
              </div>
              <button
                class="buy-btn"
                @click="buyUpgrade(upgrade)"
                :disabled="coins < getUpgradeCost(upgrade)"
                :data-testid="`buy-${upgrade.id}`"
              >
                <span class="buy-cost">
                  <img :src="coinImage" alt="" />
                  {{ formatNumber(getUpgradeCost(upgrade)) }}
                </span>
                <span class="buy-label">COMPRAR</span>
              </button>
            </article>
          </div>
        </div>

        <!-- ACHIEVEMENTS -->
        <div class="panel-body" v-if="activeTab === 'achievements'" data-testid="achievements-panel">
          <header class="panel-head">
            <span class="panel-eyebrow">Salão dos Feitos</span>
            <h2>Conquistas</h2>
          </header>

          <div class="ach-list">
            <article
              v-for="ach in achievements"
              :key="ach.id"
              class="ach-card"
              :class="{ 'ach-card--unlocked': ach.unlocked }"
              :data-testid="`ach-${ach.id}`"
            >
              <div class="ach-icon">
                <span>{{ ach.icon }}</span>
              </div>
              <div class="ach-info">
                <div class="ach-title-row">
                  <h4>{{ ach.name }}</h4>
                  <span class="ach-status" v-if="ach.unlocked">DESBLOQUEADO</span>
                  <span class="ach-status ach-status--locked" v-else>
                    {{ getAchievementProgress(ach).toFixed(0) }}%
                  </span>
                </div>
                <p>{{ ach.description }}</p>
                <div class="ach-bar">
                  <div class="ach-bar-fill" :style="{ width: getAchievementProgress(ach) + '%' }"></div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <!-- STATS / CÓDEX -->
        <div class="panel-body" v-if="activeTab === 'stats'" data-testid="stats-panel">
          <header class="panel-head">
            <span class="panel-eyebrow">Bestiário Numérico</span>
            <h2>Códex</h2>
          </header>

          <ul class="codex">
            <li>
              <span>Moedas em órbita</span>
              <strong>{{ formatNumber(coins) }}</strong>
            </li>
            <li>
              <span>Moedas acumuladas (vida)</span>
              <strong>{{ formatNumber(lifetimeCoins) }}</strong>
            </li>
            <li>
              <span>Cliques totais</span>
              <strong>{{ formatNumber(totalClicks) }}</strong>
            </li>
            <li>
              <span>Poder base / clique</span>
              <strong>{{ formatNumber(clickPower) }}</strong>
            </li>
            <li>
              <span>Multiplicador de combo</span>
              <strong>×{{ comboMultiplier.toFixed(2) }}</strong>
            </li>
            <li>
              <span>Multiplicador surto</span>
              <strong>×{{ surgeMultiplier }}</strong>
            </li>
            <li>
              <span>Upgrades adquiridos</span>
              <strong>{{ upgradesOwned }} / {{ upgrades.length }}</strong>
            </li>
          </ul>

          <p class="codex-note">
            <em>“A história não escava a si mesma. Mas talvez você sim.”</em>
          </p>
        </div>
      </aside>
    </main>

    <!-- PARTICLES -->
    <div class="particle-layer" aria-hidden="true">
      <span
        v-for="p in particles"
        :key="p.id"
        class="particle"
        :style="{
          left: p.x + 'px',
          top: p.y + 'px',
          width: p.size + 'px',
          height: p.size + 'px',
          background: p.color,
          boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
        }"
      ></span>
    </div>

    <!-- FLOATING NUMBERS -->
    <transition-group name="float" tag="div">
      <div
        v-for="text in floatingTexts"
        :key="text.id"
        class="floating-text"
        :class="{ 'floating-text--crit': text.critical }"
        :style="{ left: text.x + 'px', top: text.y + 'px' }"
      >
        <img :src="coinImage" alt="" />
        {{ text.value }}
      </div>
    </transition-group>

    <!-- TOASTS -->
    <div class="toast-stack" data-testid="toast-stack">
      <transition-group name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast"
          :class="`toast--${t.tone}`"
        >
          <span class="toast-icon">{{ t.icon }}</span>
          <div class="toast-body">
            <strong>{{ t.title }}</strong>
            <span>{{ t.message }}</span>
          </div>
        </div>
      </transition-group>
    </div>

    

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Fraunces:ital,wght@0,400;0,600;1,400;1,600&family=JetBrains+Mono:wght@500;700&display=swap');

/* =========================================================
   ROOT VARS
========================================================= */
.clicker-page {
  --bg-0: #04060a;
  --bg-1: #080b13;
  --bg-2: #0d1119;
  --amber: #f5b14c;
  --amber-soft: #ffd97c;
  --amber-deep: #b8780f;
  --mint: #7cffb2;
  --mint-soft: #a8ffd0;
  --magenta: #ff5fa2;
  --ink-text: #f4ead7;
  --ink-mute: rgba(244, 234, 215, 0.55);
  --line: rgba(245, 177, 76, 0.18);
  --line-strong: rgba(245, 177, 76, 0.4);

  position: relative;
  min-height: 100vh;
  padding: 40px 38px 80px;
  overflow: hidden;
  color: var(--ink-text);
  font-family: 'Fraunces', serif;
  background:
    radial-gradient(1200px 600px at 80% -10%, rgba(245, 177, 76, 0.12), transparent 60%),
    radial-gradient(900px 700px at -10% 30%, rgba(124, 255, 178, 0.08), transparent 65%),
    radial-gradient(1000px 800px at 50% 110%, rgba(255, 95, 162, 0.08), transparent 60%),
    linear-gradient(180deg, var(--bg-0), var(--bg-1) 60%, var(--bg-2));
  transition: transform 60ms linear;
}

/* =========================================================
   BG DECOR
========================================================= */
.bg-amber-orb,
.bg-mint-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
}
.bg-amber-orb--1 {
  width: 520px; height: 520px;
  top: -180px; left: -100px;
  background: radial-gradient(circle, rgba(245, 177, 76, 0.35), transparent 65%);
  animation: orbDrift 18s ease-in-out infinite;
}
.bg-amber-orb--2 {
  width: 620px; height: 620px;
  bottom: -240px; right: -180px;
  background: radial-gradient(circle, rgba(184, 80, 40, 0.28), transparent 65%);
  animation: orbDrift 22s ease-in-out infinite reverse;
}
.bg-mint-orb {
  width: 420px; height: 420px;
  top: 35%; left: 45%;
  background: radial-gradient(circle, rgba(124, 255, 178, 0.18), transparent 70%);
  animation: orbDrift 26s ease-in-out infinite;
}
.bg-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(245, 177, 76, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245, 177, 76, 0.06) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 70% at center, #000 25%, transparent 80%);
  pointer-events: none;
  z-index: 0;
}
.bg-grain {
  position: absolute; inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.35;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0.95 0 0 0 0 0.7 0 0 0 0 0.3 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
}
.bg-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%);
  pointer-events: none;
  z-index: 0;
}
.dna-decor {
  position: absolute;
  width: 60px;
  height: 600px;
  pointer-events: none;
  z-index: 0;
  opacity: 0.6;
}
.dna-decor--left {
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  animation: dnaFlow 12s linear infinite;
}

.clicker-page > *:not(.bg-amber-orb):not(.bg-mint-orb):not(.bg-grid):not(.bg-grain):not(.bg-vignette):not(.dna-decor) {
  position: relative;
  z-index: 1;
}

/* =========================================================
   HEADER
========================================================= */
.page-header {
  max-width: 1320px;
  margin: 0 auto 28px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 30px;
  align-items: center;
  padding: 28px 32px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(20, 14, 8, 0.6), rgba(8, 6, 10, 0.55));
  border: 1px solid var(--line);
  backdrop-filter: blur(14px);
  box-shadow:
    0 30px 80px rgba(0,0,0,0.6),
    inset 0 1px 0 rgba(255, 235, 200, 0.06);
}
.header-left {
  display: flex; align-items: center; gap: 22px;
}
.emblem-wrap {
  position: relative;
  width: 78px; height: 78px;
}
.emblem-ring {
  position: absolute; inset: -6px;
  border-radius: 22px;
  border: 1px dashed rgba(245, 177, 76, 0.5);
  animation: spin 22s linear infinite;
}
.emblem {
  position: absolute; inset: 0;
  border-radius: 18px;
  display: grid; place-items: center;
  font-size: 2.4rem;
  background:
    radial-gradient(circle at 30% 30%, rgba(245, 177, 76, 0.25), transparent 60%),
    linear-gradient(135deg, #2c1a08, #0a0604);
  border: 1px solid rgba(245, 177, 76, 0.35);
  box-shadow: inset 0 0 22px rgba(245, 177, 76, 0.18), 0 0 30px rgba(245, 177, 76, 0.18);
}
.eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: 'Syne', sans-serif;
  font-weight: 600;
  font-size: 0.68rem;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--amber-soft);
  margin-bottom: 8px;
}
.eyebrow-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--mint);
  box-shadow: 0 0 12px var(--mint);
  animation: pulse 1.4s ease-in-out infinite;
}
.page-header h1 {
  margin: 0;
  font-family: 'Syne', sans-serif;
  font-size: 2.4rem;
  font-weight: 800;
  line-height: 0.98;
  letter-spacing: -0.02em;
  color: var(--ink-text);
}
.page-header h1 em {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-weight: 600;
  background: linear-gradient(120deg, var(--amber-soft), var(--amber) 50%, var(--magenta));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.header-right {
  display: flex; align-items: center; gap: 16px;
}
.achievement-badge {
  display: flex; align-items: baseline; gap: 2px;
  padding: 14px 22px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(124, 255, 178, 0.1), rgba(0,0,0,0.4));
  border: 1px solid rgba(124, 255, 178, 0.25);
  font-family: 'JetBrains Mono', monospace;
  position: relative;
}
.badge-num {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--mint);
  text-shadow: 0 0 12px rgba(124, 255, 178, 0.6);
}
.badge-total {
  color: var(--ink-mute);
  font-size: 1rem;
}
.badge-label {
  position: absolute;
  bottom: -18px; left: 0;
  font-family: 'Syne', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--ink-mute);
}
.surge-pill {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 12px 18px;
  border-radius: 999px;
  background: linear-gradient(120deg, rgba(124, 255, 178, 0.18), rgba(255, 95, 162, 0.15));
  border: 1px solid rgba(124, 255, 178, 0.5);
  font-family: 'Syne', sans-serif;
  font-size: 0.7rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--mint);
  box-shadow: 0 0 30px rgba(124, 255, 178, 0.25);
  animation: surgeBreath 1.4s ease-in-out infinite;
}
.surge-pill .pulse {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--mint);
  box-shadow: 0 0 12px var(--mint);
  animation: pulse 1s ease-in-out infinite;
}

/* =========================================================
   STATS STRIP
========================================================= */
.stats-strip {
  max-width: 1320px;
  margin: 0 auto 30px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}
.stat-pod {
  position: relative;
  padding: 22px 24px;
  border-radius: 20px;
  display: flex; align-items: center; gap: 16px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 235, 200, 0.04), rgba(255, 235, 200, 0.01));
  border: 1px solid var(--line);
  backdrop-filter: blur(12px);
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}
.stat-pod::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, transparent 50%, rgba(245, 177, 76, 0.06));
  pointer-events: none;
}
.stat-pod:hover {
  transform: translateY(-3px);
  border-color: var(--line-strong);
}
.stat-pod--primary {
  border-color: rgba(245, 177, 76, 0.45);
  box-shadow: 0 0 40px rgba(245, 177, 76, 0.12), inset 0 1px 0 rgba(255, 235, 200, 0.1);
}
.stat-pod--primary::after {
  content: ''; position: absolute;
  width: 220px; height: 220px;
  top: -60px; right: -60px;
  background: radial-gradient(circle, rgba(245, 177, 76, 0.25), transparent 70%);
  pointer-events: none;
}
.pod-spark {
  position: absolute;
  top: 14px; right: 14px;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--amber);
  box-shadow: 0 0 14px var(--amber);
  animation: pulse 1.6s ease-in-out infinite;
}
.pod-icon {
  width: 58px; height: 58px;
  border-radius: 16px;
  display: grid; place-items: center;
  font-size: 1.7rem;
  background: linear-gradient(135deg, rgba(245, 177, 76, 0.15), rgba(0,0,0,0.4));
  border: 1px solid var(--line);
}
.pod-icon img {
  width: 38px; height: 38px;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgba(245, 177, 76, 0.6));
  animation: coinFloat 3s ease-in-out infinite;
}
.pod-icon--power { color: var(--amber-soft); text-shadow: 0 0 14px rgba(255, 217, 124, 0.6); }
.pod-icon--mint { color: var(--mint); text-shadow: 0 0 14px rgba(124, 255, 178, 0.6); }
.pod-icon--bone { color: #e9d6a8; }
.pod-meta {
  display: flex; flex-direction: column;
  min-width: 0;
  flex: 1;
}
.pod-label {
  font-family: 'Syne', sans-serif;
  font-size: 0.62rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--ink-mute);
  margin-bottom: 4px;
}
.pod-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.55rem;
  color: var(--ink-text);
  line-height: 1;
  letter-spacing: -0.01em;
  word-break: break-all;
}
.pod-value--mint {
  color: var(--mint);
  text-shadow: 0 0 14px rgba(124, 255, 178, 0.4);
}
.pod-mult {
  display: inline-block;
  margin-left: 6px;
  font-size: 0.85rem;
  color: var(--magenta);
  text-shadow: 0 0 10px rgba(255, 95, 162, 0.5);
  animation: pulse 0.9s ease-in-out infinite;
}

/* =========================================================
   LAYOUT
========================================================= */
.layout {
  max-width: 1320px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 460px;
  gap: 28px;
  align-items: start;
}

/* =========================================================
   ARENA
========================================================= */
.arena-col {
  display: flex; flex-direction: column; align-items: center;
  gap: 24px;
}
.arena {
  position: relative;
  width: 100%;
  max-width: 560px;
  aspect-ratio: 1 / 1;
  display: grid; place-items: center;
  isolation: isolate;
  padding: 22px;
  border-radius: 36px;
  background:
    radial-gradient(ellipse at center, rgba(245, 177, 76, 0.06), transparent 70%),
    linear-gradient(160deg, rgba(20, 14, 8, 0.4), rgba(8, 6, 10, 0.4));
  border: 1px solid var(--line);
  box-shadow:
    inset 0 0 80px rgba(0,0,0,0.5),
    0 30px 90px rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
}
.aurora {
  position: absolute;
  width: 70%; height: 70%;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
}
.aurora--1 {
  background: radial-gradient(circle, rgba(245, 177, 76, 0.45), transparent 65%);
  animation: auroraDrift 8s ease-in-out infinite;
}
.aurora--2 {
  background: radial-gradient(circle, rgba(255, 95, 162, 0.25), transparent 65%);
  animation: auroraDrift 11s ease-in-out infinite reverse;
}
.ring {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  border: 1px dashed rgba(245, 177, 76, 0.25);
}
.ring--outer {
  width: 92%; height: 92%;
  animation: spin 38s linear infinite;
}
.ring-mark {
  position: absolute;
  top: 50%; left: 50%;
  width: 3px; height: 12px;
  background: rgba(245, 177, 76, 0.45);
  border-radius: 3px;
  transform-origin: center;
}
.ring--mid {
  width: 76%; height: 76%;
  border: 1px solid rgba(245, 177, 76, 0.12);
  box-shadow: inset 0 0 40px rgba(245, 177, 76, 0.08);
}
.ring--inner {
  width: 62%; height: 62%;
  border: 1px solid rgba(245, 177, 76, 0.4);
  animation: spin 22s linear infinite reverse;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.ring--combo {
  border-color: rgba(255, 95, 162, 0.7);
  box-shadow: 0 0 50px rgba(255, 95, 162, 0.4);
}
.heartbeat {
  position: absolute;
  width: 56%; height: 56%;
  border-radius: 50%;
  border: 2px solid rgba(245, 177, 76, 0.45);
  pointer-events: none;
  animation: heartbeat 1.1s ease-out;
}
.combo-halo {
  position: absolute;
  width: 70%; height: 70%;
  border-radius: 50%;
  background: radial-gradient(circle, transparent 50%, rgba(255, 95, 162, 0.18));
  pointer-events: none;
  animation: comboHalo 0.9s ease-in-out infinite;
}
.combo-halo--super {
  background: radial-gradient(circle, transparent 45%, rgba(255, 95, 162, 0.35));
  filter: drop-shadow(0 0 30px var(--magenta));
}

.dino-button {
  position: relative;
  width: 56%; aspect-ratio: 1 / 1;
  border-radius: 50%;
  display: grid; place-items: center;
  cursor: pointer;
  user-select: none;
  background:
    radial-gradient(circle at 30% 28%, rgba(255, 235, 200, 0.4), transparent 50%),
    radial-gradient(circle, rgba(60, 36, 14, 0.9), rgba(10, 5, 3, 0.95));
  border: 3px solid rgba(245, 177, 76, 0.5);
  transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, border-color 0.3s ease;
  box-shadow:
    0 0 70px rgba(245, 177, 76, 0.25),
    inset 0 0 50px rgba(0,0,0,0.5);
}
.dino-button:hover {
  transform: scale(1.04);
  box-shadow: 0 0 100px rgba(245, 177, 76, 0.4), inset 0 0 50px rgba(0,0,0,0.5);
}
.dino-button:active {
  transform: scale(0.92);
  box-shadow: 0 0 130px rgba(245, 177, 76, 0.55), inset 0 0 30px rgba(0,0,0,0.6);
}
.dino-button--combo {
  border-color: var(--magenta);
  box-shadow: 0 0 90px rgba(255, 95, 162, 0.5), inset 0 0 50px rgba(0,0,0,0.5);
}
.dino-emoji {
  font-size: clamp(4.5rem, 12vw, 7.5rem);
  filter: drop-shadow(0 8px 18px rgba(0,0,0,0.7));
  animation: dinoBob 2.4s ease-in-out infinite;
  display: inline-block;
}
.dino-shadow {
  position: absolute;
  bottom: 14px; left: 50%;
  transform: translateX(-50%);
  width: 140px; height: 18px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.6), transparent 70%);
  border-radius: 50%;
  filter: blur(3px);
}

.combo-indicator {
  position: absolute;
  bottom: 28px; left: 50%;
  transform: translateX(-50%) translateY(20px);
  opacity: 0;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 10px 22px;
  min-width: 180px;
  border-radius: 16px;
  background: rgba(8, 4, 12, 0.7);
  border: 1px solid rgba(255, 95, 162, 0.4);
  backdrop-filter: blur(10px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
}
.combo-indicator--visible {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
.combo-num {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 1.8rem;
  color: var(--magenta);
  text-shadow: 0 0 14px rgba(255, 95, 162, 0.55);
  line-height: 1;
}
.combo-num small {
  font-size: 1rem;
  opacity: 0.7;
}
.combo-label {
  font-family: 'Syne', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 0.4em;
  color: var(--ink-mute);
}
.combo-bar {
  width: 100%; height: 4px;
  background: rgba(255,255,255,0.05);
  border-radius: 999px;
  overflow: hidden;
}
.combo-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--magenta), var(--amber));
  box-shadow: 0 0 8px var(--magenta);
  transition: width 0.08s linear;
}

.instruction {
  display: flex; align-items: center; gap: 14px;
  font-family: 'Syne', sans-serif;
  font-size: 0.78rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--ink-mute);
  margin: 0;
}
.dash {
  width: 36px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--amber), transparent);
}

/* Golden dino mini-event */
.golden-layer {
  position: absolute; inset: 0;
  pointer-events: none;
  width: 100%;
}
.golden-dino {
  position: absolute;
  width: 64px; height: 64px;
  border-radius: 50%;
  border: none;
  background: radial-gradient(circle, #ffe186, #f5b14c 60%, #8a6a1f);
  cursor: pointer;
  pointer-events: auto;
  display: grid; place-items: center;
  font-size: 2rem;
  animation: goldenBob 1.2s ease-in-out infinite;
  box-shadow: 0 0 40px rgba(255, 217, 124, 0.7);
  transform: translate(-50%, -50%);
}
.golden-aura {
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  border: 2px solid rgba(255, 217, 124, 0.6);
  animation: goldenPing 1.4s ease-out infinite;
  pointer-events: none;
}
.golden-emoji {
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
}
.golden-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.golden-leave-active { transition: all 0.3s ease-out; }
.golden-enter-from { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
.golden-leave-to { opacity: 0; transform: translate(-50%, -50%) scale(1.6); }

/* =========================================================
   SIDE PANEL
========================================================= */
.side-panel {
  position: sticky;
  top: 24px;
  display: flex; flex-direction: column;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(20, 14, 8, 0.55), rgba(8, 6, 10, 0.55));
  border: 1px solid var(--line);
  backdrop-filter: blur(14px);
  overflow: hidden;
  max-height: calc(100vh - 48px);
  box-shadow: 0 30px 80px rgba(0,0,0,0.6);
}
.tab-nav {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: rgba(0,0,0,0.3);
  border-bottom: 1px solid var(--line);
}
.tab-btn {
  position: relative;
  background: transparent;
  border: none;
  padding: 18px 14px;
  font-family: 'Syne', sans-serif;
  font-weight: 600;
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-mute);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}
.tab-btn:hover {
  color: var(--amber-soft);
  background: rgba(245, 177, 76, 0.04);
}
.tab-btn--active {
  color: var(--amber);
  background: rgba(245, 177, 76, 0.08);
}
.tab-btn--active::after {
  content: '';
  position: absolute;
  bottom: 0; left: 20%; right: 20%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--amber), transparent);
  box-shadow: 0 0 14px var(--amber);
}
.tab-pill {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(124, 255, 178, 0.15);
  border: 1px solid rgba(124, 255, 178, 0.3);
  font-family: 'JetBrains Mono', monospace;
  font-style: normal;
  font-size: 0.65rem;
  color: var(--mint);
}
.panel-body {
  padding: 22px;
  overflow-y: auto;
  flex: 1;
}
.panel-body::-webkit-scrollbar { width: 6px; }
.panel-body::-webkit-scrollbar-thumb {
  background: rgba(245, 177, 76, 0.3);
  border-radius: 999px;
}
.panel-head {
  margin-bottom: 18px;
}
.panel-eyebrow {
  display: block;
  font-family: 'Syne', sans-serif;
  font-weight: 600;
  font-size: 0.62rem;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--amber-soft);
  margin-bottom: 4px;
}
.panel-head h2 {
  margin: 0;
  font-family: 'Syne', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--ink-text);
}

/* SHOP */
.upgrades-list {
  display: flex; flex-direction: column;
  gap: 12px;
}
.shop-card {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 235, 200, 0.04), rgba(255, 235, 200, 0.01));
  border: 1px solid rgba(245, 177, 76, 0.15);
  overflow: hidden;
  transition: border-color 0.25s ease, transform 0.2s ease;
}
.shop-card:hover {
  border-color: rgba(245, 177, 76, 0.4);
}
.shop-card--owned {
  border-color: rgba(124, 255, 178, 0.35);
  background: linear-gradient(180deg, rgba(124, 255, 178, 0.05), rgba(255, 235, 200, 0.01));
}
.shop-card--locked .shop-icon { opacity: 0.5; filter: grayscale(0.6); }
.shop-card-glow {
  position: absolute;
  width: 200px; height: 200px;
  top: -100px; right: -100px;
  background: radial-gradient(circle, rgba(245, 177, 76, 0.15), transparent 70%);
  pointer-events: none;
}
.shop-icon {
  width: 50px; height: 50px;
  border-radius: 14px;
  display: grid; place-items: center;
  font-size: 1.5rem;
  background: linear-gradient(135deg, rgba(245, 177, 76, 0.18), rgba(0,0,0,0.4));
  border: 1px solid rgba(245, 177, 76, 0.25);
  flex-shrink: 0;
}
.shop-info { min-width: 0; }
.shop-title-row {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 2px;
  flex-wrap: wrap;
}
.shop-card h3 {
  margin: 0;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  color: var(--amber-soft);
  font-size: 0.98rem;
}
.shop-level {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(124, 255, 178, 0.12);
  border: 1px solid rgba(124, 255, 178, 0.3);
  color: var(--mint);
}
.shop-card p {
  margin: 0;
  color: var(--ink-mute);
  font-size: 0.82rem;
  font-style: italic;
}
.buy-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-family: 'Syne', sans-serif;
  background: linear-gradient(135deg, var(--amber-soft), var(--amber) 60%, var(--amber-deep));
  color: #1a1208;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
  box-shadow:
    0 6px 20px rgba(245, 177, 76, 0.35),
    inset 0 1px 0 rgba(255,255,255,0.45);
  min-width: 100px;
}
.buy-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(245, 177, 76, 0.5);
  filter: brightness(1.08);
}
.buy-btn:active:not(:disabled) { transform: translateY(0); }
.buy-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  filter: grayscale(0.6);
}
.buy-cost {
  display: flex; align-items: center; gap: 5px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 0.85rem;
}
.buy-cost img { width: 14px; height: 14px; object-fit: contain; }
.buy-label {
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.65rem;
  opacity: 0.85;
}

/* ACHIEVEMENTS */
.ach-list {
  display: flex; flex-direction: column;
  gap: 10px;
}
.ach-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 235, 200, 0.02);
  border: 1px solid rgba(245, 177, 76, 0.1);
  transition: border-color 0.25s ease, transform 0.2s ease;
}
.ach-card--unlocked {
  background: linear-gradient(120deg, rgba(255, 95, 162, 0.08), rgba(245, 177, 76, 0.06));
  border-color: rgba(255, 95, 162, 0.4);
  box-shadow: 0 0 24px rgba(255, 95, 162, 0.1);
}
.ach-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: grid; place-items: center;
  font-size: 1.3rem;
  background: linear-gradient(135deg, rgba(245, 177, 76, 0.15), rgba(0,0,0,0.4));
  border: 1px solid rgba(245, 177, 76, 0.2);
}
.ach-card--unlocked .ach-icon {
  background: linear-gradient(135deg, rgba(255, 95, 162, 0.25), rgba(245, 177, 76, 0.2));
  border-color: rgba(255, 95, 162, 0.5);
  box-shadow: 0 0 18px rgba(255, 95, 162, 0.3);
}
.ach-title-row {
  display: flex; justify-content: space-between; align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}
.ach-card h4 {
  margin: 0;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--amber-soft);
}
.ach-card--unlocked h4 { color: var(--magenta); }
.ach-status {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 95, 162, 0.15);
  border: 1px solid rgba(255, 95, 162, 0.4);
  color: var(--magenta);
  letter-spacing: 0.1em;
}
.ach-status--locked {
  background: rgba(245, 177, 76, 0.08);
  border-color: rgba(245, 177, 76, 0.25);
  color: var(--ink-mute);
}
.ach-card p {
  margin: 0 0 8px;
  color: var(--ink-mute);
  font-size: 0.78rem;
  font-style: italic;
}
.ach-bar {
  height: 4px;
  background: rgba(0,0,0,0.4);
  border-radius: 999px;
  overflow: hidden;
}
.ach-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--amber-deep), var(--amber-soft), var(--magenta));
  box-shadow: 0 0 10px rgba(245, 177, 76, 0.5);
  transition: width 0.4s ease;
}

/* CODEX */
.codex {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
  display: flex; flex-direction: column;
  gap: 2px;
}
.codex li {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 4px;
  border-bottom: 1px dashed rgba(245, 177, 76, 0.12);
  font-size: 0.86rem;
}
.codex li span {
  color: var(--ink-mute);
  font-style: italic;
}
.codex li strong {
  font-family: 'JetBrains Mono', monospace;
  color: var(--amber-soft);
  font-weight: 700;
}
.codex-note {
  text-align: center;
  font-style: italic;
  color: var(--ink-mute);
  font-size: 0.82rem;
  padding: 14px;
  border-radius: 12px;
  background: rgba(245, 177, 76, 0.04);
  border: 1px dashed rgba(245, 177, 76, 0.2);
}

/* =========================================================
   PARTICLES
========================================================= */
.particle-layer {
  position: fixed; inset: 0;
  pointer-events: none;
  z-index: 998;
}
.particle {
  position: absolute;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  will-change: transform, opacity;
}

/* =========================================================
   FLOATING TEXT
========================================================= */
.floating-text {
  position: fixed;
  display: flex; align-items: center; gap: 6px;
  font-family: 'Syne', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--amber-soft);
  pointer-events: none;
  text-shadow: 0 0 14px rgba(245, 177, 76, 0.7);
  transform: translate(-50%, -50%);
  z-index: 999;
}
.floating-text img { width: 22px; height: 22px; object-fit: contain; }
.floating-text--crit {
  color: var(--magenta);
  font-size: 1.6rem;
  text-shadow: 0 0 18px rgba(255, 95, 162, 0.9);
}
.float-enter-active, .float-leave-active { transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1); }
.float-enter-from { opacity: 1; transform: translate(-50%, -50%); }
.float-leave-to {
  opacity: 0;
  transform: translate(calc(-50% + 20px), -220%) scale(1.4) rotate(10deg);
}

/* =========================================================
   TOASTS
========================================================= */
.toast-stack {
  position: fixed;
  top: 28px; right: 28px;
  display: flex; flex-direction: column;
  gap: 12px;
  z-index: 1001;
  max-width: 340px;
}
.toast {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(20, 14, 8, 0.85), rgba(8, 6, 10, 0.85));
  border: 1px solid var(--line);
  backdrop-filter: blur(14px);
  box-shadow: 0 20px 50px rgba(0,0,0,0.6);
  min-width: 280px;
}
.toast--gold { border-color: rgba(245, 177, 76, 0.55); box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(245, 177, 76, 0.18); }
.toast--mint { border-color: rgba(124, 255, 178, 0.55); box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(124, 255, 178, 0.18); }
.toast--magenta { border-color: rgba(255, 95, 162, 0.55); box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(255, 95, 162, 0.2); }
.toast-icon {
  font-size: 1.6rem;
  width: 40px; height: 40px;
  display: grid; place-items: center;
  border-radius: 12px;
  background: rgba(0,0,0,0.3);
  flex-shrink: 0;
}
.toast-body { display: flex; flex-direction: column; gap: 2px; }
.toast-body strong {
  font-family: 'Syne', sans-serif;
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--amber-soft);
}
.toast--mint .toast-body strong { color: var(--mint); }
.toast--magenta .toast-body strong { color: var(--magenta); }
.toast-body span { font-style: italic; color: var(--ink-text); }
.toast-enter-active, .toast-leave-active { transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-enter-from { opacity: 0; transform: translateX(60px); }
.toast-leave-to { opacity: 0; transform: translateX(60px) scale(0.95); }

/* =========================================================
   ACHIEVEMENT UNLOCK MODAL (novo)
========================================================= */
.achievement-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.achievement-modal-box {
  position: relative;
  width: min(420px, 100%);
  padding: 48px 32px 40px;
  border-radius: 24px;
  background: linear-gradient(160deg, #1a140c, #120d08);
  border: 1px solid rgba(245, 177, 76, 0.3);
  box-shadow: 0 40px 120px rgba(0,0,0,0.7);
  text-align: center;
  overflow: hidden;
}

.achievement-modal-rays {
  position: absolute;
  inset: 0;
  background: conic-gradient(from 90deg at 50% 20%, transparent, rgba(245,177,76,0.12) 30deg, transparent 60deg);
  animation: spin 25s linear infinite;
  pointer-events: none;
}

.achievement-icon-big {
  font-size: 4.5rem;
  margin-bottom: 16px;
  filter: drop-shadow(0 10px 30px rgba(245, 177, 76, 0.4));
}

.achievement-modal-eyebrow {
  font-family: 'Syne', sans-serif;
  font-size: 0.7rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--amber-soft);
  margin-bottom: 8px;
}

.achievement-modal-title {
  font-family: 'Syne', sans-serif;
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--amber);
  margin: 0 0 12px;
  line-height: 1.1;
}

.achievement-modal-desc {
  color: var(--ink-mute);
  font-size: 0.95rem;
  margin-bottom: 28px;
  line-height: 1.5;
}

.achievement-reward-box {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding: 16px 28px;
  margin-bottom: 32px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(245, 177, 76, 0.15), rgba(245, 177, 76, 0.05));
  border: 1px solid rgba(245, 177, 76, 0.35);
}

.achievement-reward-text {
  text-align: left;
  line-height: 1.1;
}

.achievement-reward-text strong {
  font-family: 'Syne', sans-serif;
  font-size: 2.1rem;
  color: var(--amber);
  display: block;
}

.achievement-reward-text span {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-mute);
}

.achievement-modal-btn {
  padding: 16px 42px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--amber-soft), var(--amber));
  color: #1a1208;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 10px 30px rgba(245, 177, 76, 0.35);
}

.achievement-modal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 40px rgba(245, 177, 76, 0.5);
}

/* =========================================================
   ANIMATIONS
========================================================= */
@keyframes coinFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-4px) rotate(6deg); }
}
@keyframes dinoBob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}
@keyframes orbDrift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, -20px); }
}
@keyframes auroraDrift {
  0%, 100% { transform: translate(-10%, -10%) scale(1); opacity: 0.6; }
  50%      { transform: translate(10%, 10%) scale(1.15); opacity: 0.9; }
}
@keyframes heartbeat {
  0% { transform: scale(0.85); opacity: 0; }
  50% { opacity: 0.5; }
  100% { transform: scale(1.15); opacity: 0; }
}
@keyframes comboHalo {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.08); }
}
@keyframes goldenBob {
  0%, 100% { transform: translate(-50%, -50%) translateY(0); }
  50%      { transform: translate(-50%, -50%) translateY(-8px); }
}
@keyframes goldenPing {
  0% { opacity: 0.8; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.8); }
}
@keyframes surgeBreath {
  0%, 100% { box-shadow: 0 0 30px rgba(124, 255, 178, 0.25); }
  50% { box-shadow: 0 0 50px rgba(124, 255, 178, 0.5); }
}
@keyframes dnaFlow {
  0% { transform: translateY(-50%) translateY(0); }
  100% { transform: translateY(-50%) translateY(40px); }
}

/* =========================================================
   RESPONSIVE
========================================================= */
@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .side-panel {
    position: static;
    max-height: none;
  }
}
@media (max-width: 760px) {
  .clicker-page { padding: 24px 16px 60px; }
  .page-header {
    grid-template-columns: 1fr;
    text-align: left;
    padding: 22px;
  }
  .header-right { justify-content: flex-start; flex-wrap: wrap; }
  .page-header h1 { font-size: 1.9rem; }
  .stats-strip {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .stat-pod { padding: 16px; }
  .pod-icon { width: 46px; height: 46px; font-size: 1.4rem; }
  .pod-value { font-size: 1.25rem; }
  .arena { padding: 14px; border-radius: 28px; }
  .dna-decor { display: none; }
  .toast-stack { top: 14px; right: 14px; left: 14px; max-width: none; }
  .toast { min-width: 0; }
}
@media (max-width: 460px) {
  .stats-strip { grid-template-columns: 1fr; }
  .tab-btn { padding: 14px 6px; font-size: 0.68rem; }
  .tab-pill { display: none; }
}

/* =========================================================
   ACHIEVEMENT UNLOCK MODAL — Premium Redesign
========================================================= */
.achievement-modal {
  position: fixed;
  inset: 0;
  background: rgba(8, 5, 2, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
  overflow: hidden;
  pointer-events: auto;
  animation: modal-overlay-fade 0.25s ease-out;
}

@keyframes modal-overlay-fade {
  from { background: rgba(8, 5, 2, 0); }
  to   { background: rgba(8, 5, 2, 0.32); }
}

/* Soft aurora drifting behind the card */
.modal-aurora {
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(circle at 30% 40%, rgba(245,177,76,0.22), transparent 45%),
    radial-gradient(circle at 70% 60%, rgba(255,99,180,0.18), transparent 50%),
    radial-gradient(circle at 50% 80%, rgba(124,255,178,0.15), transparent 45%);
  filter: blur(60px);
  animation: aurora-drift 14s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes aurora-drift {
  0%   { transform: translate(0,0) scale(1); }
  100% { transform: translate(-3%, 2%) scale(1.08); }
}

.modal-box {
  position: relative;
  width: min(500px, 100%);
  padding: 56px 40px 40px;
  border-radius: 28px;
  background:
    linear-gradient(165deg, rgba(38,26,14,0.96) 0%, rgba(20,13,7,0.98) 60%, rgba(14,9,5,1) 100%);
  border: 1px solid transparent;
  background-clip: padding-box;
  box-shadow:
    0 50px 140px rgba(0,0,0,0.85),
    0 0 0 1px rgba(245,177,76,0.18),
    inset 0 1px 0 rgba(255,220,150,0.12),
    inset 0 -40px 80px rgba(0,0,0,0.4);
  text-align: center;
  overflow: hidden;
  isolation: isolate;
}

/* Golden gradient border via pseudo */
.modal-box::before {
  content: "";
  position: absolute;
  inset: 0;
  padding: 1.5px;
  border-radius: inherit;
  background: conic-gradient(
    from 0deg,
    rgba(245,177,76,0.0),
    rgba(245,177,76,0.9),
    rgba(255,217,124,0.6),
    rgba(245,177,76,0.0) 35%,
    rgba(245,177,76,0.0) 65%,
    rgba(255,217,124,0.6),
    rgba(245,177,76,0.9),
    rgba(245,177,76,0.0)
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  animation: spin 8s linear infinite;
  pointer-events: none;
  z-index: 0;
}

.modal-rays {
  position: absolute;
  inset: -25%;
  background:
    conic-gradient(from 90deg at 50% 35%,
      transparent 0deg,
      rgba(245,177,76,0.10) 20deg,
      transparent 40deg,
      transparent 180deg,
      rgba(255,217,124,0.08) 200deg,
      transparent 220deg);
  animation: spin 22s linear infinite;
  pointer-events: none;
  z-index: 0;
}

.modal-glow {
  position: absolute;
  top: -30%;
  left: 50%;
  transform: translateX(-50%);
  width: 140%;
  height: 80%;
  background: radial-gradient(ellipse at center top, rgba(245,177,76,0.35), transparent 60%);
  filter: blur(20px);
  pointer-events: none;
  z-index: 0;
}

.modal-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(245,177,76,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245,177,76,0.04) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
  pointer-events: none;
  z-index: 0;
}

.modal-box > *:not(.modal-rays):not(.modal-glow):not(.modal-grid):not(.confetti):not(.sparkles) {
  position: relative;
  z-index: 2;
}

/* Confetti */
.confetti, .sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 1;
}
.confetti span {
  position: absolute;
  top: -10%;
  left: calc(var(--i) * 3.4%);
  font-size: 0.95rem;
  color: hsl(calc(40 + var(--i) * 8), 90%, 65%);
  text-shadow: 0 0 10px rgba(245,177,76,0.7);
  animation: fall 3.6s linear infinite, sway 2.4s ease-in-out infinite;
  animation-delay: calc(var(--i) * -0.18s), calc(var(--i) * -0.12s);
  opacity: 0.85;
}
.sparkles span {
  position: absolute;
  top: calc(var(--i) * 8%);
  left: calc((var(--i) * 53) % 100 * 1%);
  width: 4px; height: 4px;
  background: #ffd97c;
  border-radius: 50%;
  box-shadow: 0 0 12px 2px rgba(255,217,124,0.9);
  animation: twinkle 2.4s ease-in-out infinite;
  animation-delay: calc(var(--i) * -0.2s);
}
@keyframes twinkle {
  0%, 100% { opacity: 0; transform: scale(0.4); }
  50%      { opacity: 1; transform: scale(1.2); }
}
@keyframes sway {
  0%,100% { margin-left: 0; }
  50%     { margin-left: 14px; }
}

/* Close button */
.modal-close {
  position: absolute;
  top: 16px; right: 16px;
  width: 36px; height: 36px;
  display: grid; place-items: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(245,177,76,0.25);
  color: #f5b14c;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all .2s ease;
}
.modal-close:hover {
  background: rgba(245,177,76,0.15);
  transform: rotate(90deg);
  border-color: rgba(245,177,76,0.6);
}

/* Ribbon eyebrow */
.modal-ribbon {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 18px;
  margin-bottom: 24px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(245,177,76,0.08), rgba(245,177,76,0.18), rgba(245,177,76,0.08));
  border: 1px solid rgba(245,177,76,0.35);
  box-shadow: 0 0 30px rgba(245,177,76,0.2), inset 0 1px 0 rgba(255,220,150,0.15);
}
.ribbon-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #ffd97c;
  box-shadow: 0 0 10px #ffd97c;
  animation: pulse-dot 1.6s ease-in-out infinite;
}
.ribbon-text {
  font-family: 'Syne', sans-serif;
  font-size: 0.72rem;
  letter-spacing: 0.45em;
  font-weight: 700;
  background: linear-gradient(90deg, #f5b14c, #ffe9a8, #f5b14c);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: shimmer 3s linear infinite;
}
@keyframes shimmer { to { background-position: 200% center; } }
@keyframes pulse-dot {
  0%,100% { transform: scale(1); opacity: 1; }
  50%     { transform: scale(1.4); opacity: 0.7; }
}

/* Trophy */
.trophy-wrap {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto 22px;
  display: grid;
  place-items: center;
}
.trophy-halo {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.trophy-halo--outer {
  inset: -18px;
  background: radial-gradient(circle, rgba(245,177,76,0.35), transparent 70%);
  filter: blur(14px);
  animation: pulse-halo 2.6s ease-in-out infinite;
}
.trophy-halo--mid {
  inset: -4px;
  background: conic-gradient(from 0deg, #f5b14c, #ffe9a8, #ff8a3d, #ffd97c, #f5b14c);
  filter: blur(6px);
  opacity: 0.55;
  animation: spin 6s linear infinite;
}
.trophy-ring {
  position: absolute;
  inset: 6px;
  border: 1.5px dashed rgba(245,177,76,0.7);
  border-radius: 50%;
  animation: spin 18s linear infinite reverse;
}
.trophy-disc {
  position: relative;
  width: 110px; height: 110px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 25%, #2a1d10, #0f0905 75%);
  border: 1px solid rgba(245,177,76,0.5);
  display: grid; place-items: center;
  box-shadow:
    inset 0 2px 0 rgba(255,220,150,0.2),
    inset 0 -10px 30px rgba(0,0,0,0.6),
    0 10px 40px rgba(245,177,76,0.4);
  animation: trophy-bob 3s ease-in-out infinite;
}
.trophy {
  font-size: 4.4rem;
  filter: drop-shadow(0 0 18px rgba(245,177,76,0.85));
  animation: trophy-tilt 4s ease-in-out infinite;
}
.trophy-stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.trophy-stars span {
  position: absolute;
  font-size: 0.9rem;
  color: #ffd97c;
  text-shadow: 0 0 10px #ffd97c;
  animation: star-pop 2.2s ease-in-out infinite;
}
.trophy-stars span:nth-child(1) { top: 4%;  left: 18%; animation-delay: 0s; }
.trophy-stars span:nth-child(2) { top: 12%; right: 8%; animation-delay: .7s; }
.trophy-stars span:nth-child(3) { bottom: 8%; left: 50%; animation-delay: 1.4s; }
@keyframes star-pop {
  0%,100% { transform: scale(0.6) rotate(0); opacity: 0.4; }
  50%     { transform: scale(1.2) rotate(20deg); opacity: 1; }
}
@keyframes trophy-bob {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-6px); }
}
@keyframes trophy-tilt {
  0%,100% { transform: rotate(-4deg); }
  50%     { transform: rotate(4deg); }
}
@keyframes pulse-halo {
  0%,100% { opacity: 0.55; transform: scale(1); }
  50%     { opacity: 1;    transform: scale(1.08); }
}

/* Title */
.modal-title {
  font-family: 'Syne', sans-serif;
  font-size: 2.3rem;
  font-weight: 800;
  margin: 0 0 10px;
  background: linear-gradient(180deg, #fff4d2 0%, #ffd97c 45%, #f5b14c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 4px 30px rgba(245,177,76,0.4);
  letter-spacing: -0.01em;
}
.modal-desc {
  color: #c9b69b;
  font-size: 1rem;
  line-height: 1.55;
  margin: 0 auto 22px;
  max-width: 36ch;
}

/* Divider */
.modal-divider {
  position: relative;
  height: 1px;
  margin: 8px auto 22px;
  width: 70%;
  background: linear-gradient(90deg, transparent, rgba(245,177,76,0.5), transparent);
}
.divider-gem {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  background: #14100a;
  padding: 0 10px;
  color: #f5b14c;
  font-size: 0.7rem;
  text-shadow: 0 0 12px rgba(245,177,76,0.8);
}

/* Reward */
.reward-box {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px 26px;
  margin: 0 auto 28px;
  width: fit-content;
  background:
    linear-gradient(135deg, rgba(245,177,76,0.18), rgba(245,177,76,0.06));
  border: 1px solid rgba(245,177,76,0.45);
  border-radius: 18px;
  box-shadow:
    inset 0 1px 0 rgba(255,220,150,0.18),
    0 10px 40px rgba(245,177,76,0.18);
}
.reward-coin {
  width: 52px; height: 52px;
  display: grid; place-items: center;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #ffe9a8, #d4912b);
  box-shadow:
    inset 0 -4px 8px rgba(0,0,0,0.3),
    0 0 24px rgba(245,177,76,0.6);
  animation: coin-spin 4s linear infinite;
}
.coin-icon {
  width: 36px; height: 36px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
}
@keyframes coin-spin {
  0%,100% { transform: rotateY(0); }
  50%     { transform: rotateY(180deg); }
}
.reward-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  line-height: 1.1;
}
.reward-label {
  font-family: 'Syne', sans-serif;
  font-size: 0.65rem;
  letter-spacing: 0.35em;
  color: #f5b14c;
  margin-bottom: 4px;
}
.reward-value {
  font-size: 2rem;
  font-weight: 800;
  color: #ffd97c;
  text-shadow: 0 0 18px rgba(255,217,124,0.6);
}
.reward-sub {
  margin-top: 4px;
  font-size: 0.72rem;
  color: #8a7a5e;
  letter-spacing: 0.08em;
}

/* Button */
.modal-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 38px;
  background: linear-gradient(135deg, #ffd97c 0%, #f5b14c 50%, #d4912b 100%);
  color: #1a1208;
  border: none;
  border-radius: 999px;
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  cursor: pointer;
  overflow: hidden;
  box-shadow:
    0 10px 30px rgba(245,177,76,0.45),
    inset 0 1px 0 rgba(255,255,255,0.5),
    inset 0 -3px 8px rgba(0,0,0,0.2);
  transition: transform .2s ease, box-shadow .2s ease;
}
.modal-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%);
  transform: translateX(-100%);
  transition: transform .6s ease;
}
.modal-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 14px 40px rgba(245,177,76,0.6),
    inset 0 1px 0 rgba(255,255,255,0.6);
}
.modal-btn:hover::before { transform: translateX(100%); }
.modal-btn:active { transform: translateY(0); }
.btn-arrow {
  display: inline-block;
  transition: transform .25s ease;
}
.modal-btn:hover .btn-arrow { transform: translateX(4px); }

/* Modal transitions */
.modal-pop-enter-active { transition: opacity .35s ease; }
.modal-pop-leave-active { transition: opacity .25s ease; }
.modal-pop-enter-from, .modal-pop-leave-to { opacity: 0; }
.modal-pop-enter-active .modal-box {
  animation: modal-in .55s cubic-bezier(.18,.89,.32,1.28);
}
@keyframes modal-in {
  0%   { transform: scale(.7) translateY(20px); opacity: 0; }
  60%  { transform: scale(1.03) translateY(-4px); opacity: 1; }
  100% { transform: scale(1) translateY(0); }
}

@media (max-width: 520px) {
  .modal-box { padding: 44px 22px 32px; border-radius: 22px; }
  .modal-title { font-size: 1.7rem; }
  .trophy-wrap { width: 124px; height: 124px; }
  .trophy-disc { width: 92px; height: 92px; }
  .trophy { font-size: 3.6rem; }
  .reward-box { padding: 14px 18px; gap: 14px; }
  .reward-value { font-size: 1.6rem; }
}

/* Destaque de conquistas recentes */
.unlocked-achievements {
  max-width: 1320px;
  margin: 20px auto 30px;
  padding: 0 38px;
}
.recent-unlocked {
  font-family: 'Syne', sans-serif;
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  color: #7cffb2;
  margin-bottom: 12px;
}
.unlocked-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.unlocked-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(124,255,178,0.1);
  border: 1px solid rgba(124,255,178,0.3);
  border-radius: 999px;
  font-size: 0.95rem;
}
</style>