<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
} from "vue";

import { upgrades as upgradesData } from "@/data/upgrades";

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
  id: number;
  x: number;
  y: number;
  value: string;
  critical: boolean;
};

type Particle = {
  id: number;
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
const rebirths = ref<number>(0);
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

/* Combo system */
const combo = ref<number>(0);
const comboBarPct = ref<number>(0);
let comboResetTimer: ReturnType<typeof setTimeout> | null = null;
let comboDecayInterval: ReturnType<typeof setInterval> | null = null;
const COMBO_WINDOW_MS = 1600;

/* Tabs */
const activeTab = ref<"shop" | "achievements" | "stats">("shop");

/* Surge state — temporary 3x CPS multiplier */
const surgeActive = ref<boolean>(false);
const surgeUntil = ref<number>(0);

/* Screen shake */
const shakeStrength = ref<number>(0);

/* Heartbeat for arena pulse */
const heartbeat = ref<number>(0);

/* =========================================================
   ACHIEVEMENTS
========================================================= */
const achievements = ref<Achievement[]>([
  { id: "click_100",    icon: "🪨", name: "Primeiro Fóssil",      description: "Clique 100 vezes",                 goal: 100,            metric: "clicks",   unlocked: false },
  { id: "click_1k",     icon: "🦴", name: "Escavador Nato",       description: "Clique 1.000 vezes",               goal: 1000,           metric: "clicks",   unlocked: false },
  { id: "click_10k",    icon: "⛏️",  name: "Mineiro Implacável",   description: "Clique 10.000 vezes",              goal: 10000,          metric: "clicks",   unlocked: false },
  { id: "click_100k",   icon: "🔥", name: "Dedos de Lava",        description: "Clique 100.000 vezes",             goal: 100000,         metric: "clicks",   unlocked: false },
  { id: "coins_1k",     icon: "🪙", name: "Pequeno Tesouro",      description: "Acumule 1.000 moedas",             goal: 1000,           metric: "coins",    unlocked: false },
  { id: "coins_1m",     icon: "💰", name: "Caçador de Milhões",   description: "Acumule 1M de moedas",             goal: 1000000,        metric: "coins",    unlocked: false },
  { id: "coins_1b",     icon: "💎", name: "Bilionário Jurássico", description: "Acumule 1B de moedas",             goal: 1000000000,     metric: "coins",    unlocked: false },
  { id: "coins_1t",     icon: "👑", name: "Lorde do Âmbar",       description: "Acumule 1T de moedas",             goal: 1000000000000,  metric: "coins",    unlocked: false },
  { id: "up_5",         icon: "🧬", name: "Genoma Aberto",        description: "Compre 5 upgrades distintos",      goal: 5,              metric: "upgrades", unlocked: false },
  { id: "up_15",        icon: "🛰️", name: "Cientista Cósmico",    description: "Compre 15 upgrades distintos",     goal: 15,             metric: "upgrades", unlocked: false },
  { id: "up_all",       icon: "♾️", name: "Êxodo Eterno",         description: "Compre todos os upgrades",         goal: 26,             metric: "upgrades", unlocked: false },
  { id: "combo_25",     icon: "⚡", name: "Combo Frenético",      description: "Atinja um combo de 25x",           goal: 25,             metric: "combo",    unlocked: false },
  { id: "combo_75",     icon: "🌪️", name: "Tempestade Fóssil",    description: "Atinja um combo de 75x",           goal: 75,             metric: "combo",    unlocked: false },
  { id: "combo_150",    icon: "🌌", name: "Singularidade",         description: "Atinja um combo de 150x",          goal: 150,            metric: "combo",    unlocked: false },
]);

/* =========================================================
   COMPUTEDS
========================================================= */
const rebirthMultiplier = computed(() => 1 + rebirths.value * 0.5);

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
  return Math.floor(baseCps * rebirthMultiplier.value * surgeMultiplier.value);
});

const clickPower = computed(() => {
  const basePower = upgrades.value.reduce(
    (total, upgrade) => total + upgrade.level * upgrade.power,
    1
  );
  return Math.floor(basePower * rebirthMultiplier.value);
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

const rebirthCost = computed(() =>
  Math.floor(1000000 * Math.pow(3, rebirths.value))
);

/* =========================================================
   SAVE / LOAD
========================================================= */
const resetGameState = () => {
  coins.value = 0;
  rebirths.value = 0;
  totalClicks.value = 0;
  lifetimeCoins.value = 0;
  upgrades.value.forEach((u) => (u.level = 0));
  achievements.value.forEach((a) => (a.unlocked = false));
};

const loadGame = () => {
  const data = localStorage.getItem(getSaveKey());
  if (!data) {
    resetGameState();
    return;
  }
  try {
    const parsed = JSON.parse(data);
    coins.value = parsed.coins ?? 0;
    rebirths.value = parsed.rebirths ?? 0;
    totalClicks.value = parsed.totalClicks ?? 0;
    lifetimeCoins.value = parsed.lifetimeCoins ?? parsed.coins ?? 0;

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
    resetGameState();
  }
};

const saveGame = () => {
  const data = {
    coins: coins.value,
    rebirths: rebirths.value,
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
   LOOPS
========================================================= */
let gameInterval: ReturnType<typeof setInterval>;
let saveInterval: ReturnType<typeof setInterval>;
let eventInterval: ReturnType<typeof setInterval>;
let heartbeatInterval: ReturnType<typeof setInterval>;
let particleAnimFrame: number | null = null;

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

  /* Mini-events — roll every 25s, small chance to trigger */
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
  if (particleAnimFrame) cancelAnimationFrame(particleAnimFrame);
  if (comboResetTimer) clearTimeout(comboResetTimer);
  if (comboDecayInterval) clearInterval(comboDecayInterval);
  saveGame();
});

/* =========================================================
   PARTICLE ANIMATION
========================================================= */
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

  particleAnimFrame = requestAnimationFrame(animateParticles);
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
      id: Date.now() + Math.random(),
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed - 2,
      color: palette[Math.floor(Math.random() * palette.length)],
      size: 6 + Math.random() * 5,
    });
  }

  if (particles.value.length > 200) {
    particles.value.splice(0, particles.value.length - 200);
  }
};

/* =========================================================
   UTILS
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

/* =========================================================
   TOASTS
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

/* =========================================================
   ACHIEVEMENTS CHECK
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
      pushToast(
        ach.icon,
        "Conquista desbloqueada!",
        ach.name,
        "magenta"
      );
    }
  });
};

watch([totalClicks, coins, combo, upgradesOwned], checkAchievements);

/* =========================================================
   UPGRADES
========================================================= */
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

/* =========================================================
   MINI-EVENTS
========================================================= */
const spawnGoldenDino = () => {
  const x = 20 + Math.random() * 60;
  const y = 25 + Math.random() * 50;
  const id = Date.now();
  gameEvents.value.push({
    id,
    type: "golden",
    x,
    y,
    expires: Date.now() + 6500,
  });

  setTimeout(() => {
    gameEvents.value = gameEvents.value.filter((e) => e.id !== id);
  }, 6500);
};

const claimGolden = (event: GameEvent, e: MouseEvent) => {
  gameEvents.value = gameEvents.value.filter((ev) => ev.id !== event.id);
  const reward = Math.max(500, clickPower.value * 50 + coinsPerSecond.value * 30);
  coins.value += reward;
  lifetimeCoins.value += reward;
  spawnParticles(e.clientX, e.clientY, true);
  shakeStrength.value = 14;
  setTimeout(() => (shakeStrength.value = 0), 350);
  pushToast("✨", "Dino Dourado capturado!", `+${formatNumber(reward)} moedas`, "gold");
  spawnFloatingText(e.clientX, e.clientY, `+${formatNumber(reward)}`, true);
};

const spawnMeteor = () => {
  pushToast("☄️", "Chuva de Meteoros!", "Bônus em moedas concedido", "gold");
  const reward = Math.max(250, coinsPerSecond.value * 45 + clickPower.value * 20);
  coins.value += reward;
  lifetimeCoins.value += reward;

  /* visual: emit particles from top */
  for (let i = 0; i < 30; i++) {
    particles.value.push({
      id: Date.now() + i,
      x: Math.random() * window.innerWidth,
      y: -20,
      dx: (Math.random() - 0.5) * 4,
      dy: 6 + Math.random() * 4,
      color: ["#f5b14c", "#ffd97c", "#ff5fa2"][i % 3],
      size: 8 + Math.random() * 4,
    });
  }
};

const triggerSurge = () => {
  surgeActive.value = true;
  surgeUntil.value = Date.now() + 15000;
  pushToast("🧬", "Surto de DNA!", "CPS x3 por 15 segundos", "mint");
};

/* =========================================================
   CLICK SYSTEM
========================================================= */
const spawnFloatingText = (
  x: number,
  y: number,
  value: string,
  critical: boolean
) => {
  const id = Date.now() + Math.random();
  if (floatingTexts.value.length > 25) floatingTexts.value.shift();
  floatingTexts.value.push({ id, x, y, value, critical });
  setTimeout(() => {
    floatingTexts.value = floatingTexts.value.filter((t) => t.id !== id);
  }, 1000);
};

const registerCombo = () => {
  combo.value++;
  comboBarPct.value = 100;

  if (comboResetTimer) clearTimeout(comboResetTimer);
  if (comboDecayInterval) clearInterval(comboDecayInterval);

  const start = Date.now();
  comboDecayInterval = setInterval(() => {
    const elapsed = Date.now() - start;
    comboBarPct.value = Math.max(0, 100 - (elapsed / COMBO_WINDOW_MS) * 100);
  }, 60);

  comboResetTimer = setTimeout(() => {
    combo.value = 0;
    comboBarPct.value = 0;
    if (comboDecayInterval) clearInterval(comboDecayInterval);
  }, COMBO_WINDOW_MS);
};

const clickDino = (event: MouseEvent) => {
  registerCombo();

  const gained = effectiveClickPower.value;
  coins.value += gained;
  lifetimeCoins.value += gained;
  totalClicks.value++;

  currentDino.value =
    dinos.value[Math.floor(Math.random() * dinos.value.length)];

  const critical = combo.value >= 10;
  spawnFloatingText(
    event.clientX,
    event.clientY,
    `+${formatNumber(gained)}`,
    critical
  );
  spawnParticles(event.clientX, event.clientY, critical);

  if (combo.value > 0 && combo.value % 25 === 0) {
    shakeStrength.value = 8;
    setTimeout(() => (shakeStrength.value = 0), 250);
  }
};

const shakeStyle = computed(() => {
  if (!shakeStrength.value) return {};
  const s = shakeStrength.value;
  const x = (Math.random() - 0.5) * s;
  const y = (Math.random() - 0.5) * s;
  return { transform: `translate(${x}px, ${y}px)` };
});

/* =========================================================
   PROGRESS HELPERS
========================================================= */
const getAchievementProgress = (ach: Achievement): number => {
  let current = 0;
  if (ach.metric === "clicks") current = totalClicks.value;
  else if (ach.metric === "coins") current = lifetimeCoins.value;
  else if (ach.metric === "upgrades") current = upgradesOwned.value;
  else if (ach.metric === "combo") current = combo.value;
  return Math.min(100, (current / ach.goal) * 100);
};
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
            <li>
              <span>Rebirths</span>
              <strong>{{ rebirths }}</strong>
            </li>
            <li>
              <span>Próximo Rebirth</span>
              <strong>{{ formatNumber(rebirthCost) }}</strong>
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
</style>
