<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
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
};

/* =========================================================
   USER / SAVE SYSTEM
========================================================= */

const user = JSON.parse(
  localStorage.getItem("@paleoworld:user") || "null"
);

/* =========================================================
   GUEST ID ÚNICO
========================================================= */

let guestId =
  localStorage.getItem(
    "@paleoworld:guestId"
  );

if (!guestId) {
  guestId = crypto.randomUUID();

  localStorage.setItem(
    "@paleoworld:guestId",
    guestId
  );
}

/* =========================================================
   USER ID
========================================================= */

const userId = ref<string>(
  user?.id
    ? `user_${user.id}`
    : `guest_${guestId}`
);

const getSaveKey = () => {
  return `paleo_clicker_save_${userId.value}`;
};

/* =========================================================
   STATE
========================================================= */
const coins = ref<number>(0);

const rebirths = ref<number>(0);

const totalClicks = ref<number>(0);

const currentDino = ref<string>("🦖");

const dinos = ref<string[]>([
  "🦖",
  "🦕",
  "🐊",
  "🦴",
]);

const upgrades = ref<Upgrade[]>(
  upgradesData.map((upgrade: any) => ({
    ...upgrade,
    level: 0,
  }))
);

const floatingTexts =
  ref<FloatingText[]>([]);

/* =========================================================
   COMPUTEDS
========================================================= */
const rebirthMultiplier = computed(() => {
  return 1 + rebirths.value * 0.5;
});

const coinsPerSecond = computed(() => {
  const baseCps =
    upgrades.value.reduce(
      (total, upgrade) => {
        return (
          total +
          upgrade.level *
            (upgrade.cps || 0)
        );
      },
      0
    );

  return Math.floor(
    baseCps *
      rebirthMultiplier.value
  );
});

const clickPower = computed(() => {
  const basePower =
    upgrades.value.reduce(
      (total, upgrade) => {
        return (
          total +
          upgrade.level *
            upgrade.power
        );
      },
      1
    );

  return Math.floor(
    basePower *
      rebirthMultiplier.value
  );
});

const rebirthCost = computed(() => {
  return Math.floor(
    1000000 *
      Math.pow(
        3,
        rebirths.value
      )
  );
});

/* =========================================================
   RESET GAME
========================================================= */
const resetGameState = () => {
  coins.value = 0;

  rebirths.value = 0;

  totalClicks.value = 0;

  upgrades.value.forEach(
    (upgrade) => {
      upgrade.level = 0;
    }
  );
};

/* =========================================================
   LOAD GAME
========================================================= */

const loadGame = () => {
  const data = localStorage.getItem(
    getSaveKey()
  );

  if (!data) {
    resetGameState();
    return;
  }

  try {
    const parsed = JSON.parse(data);

    coins.value =
      parsed.coins ?? 0;

    rebirths.value =
      parsed.rebirths ?? 0;

    totalClicks.value =
      parsed.totalClicks ?? 0;

    upgrades.value.forEach(
      (upgrade) => {
        const savedUpgrade =
          parsed.upgrades?.find(
            (saved: any) =>
              saved.id ===
              upgrade.id
          );

        upgrade.level =
          savedUpgrade?.level ?? 0;
      }
    );
  } catch (error) {
    console.error(
      "Erro ao carregar save:",
      error
    );

    resetGameState();
  }
};

/* =========================================================
   SAVE GAME
========================================================= */
const saveGame = () => {
  const data = {
    coins: coins.value,

    rebirths:
      rebirths.value,

    totalClicks:
      totalClicks.value,

    upgrades:
      upgrades.value.map(
        (upgrade) => ({
          id: upgrade.id,
          level:
            upgrade.level,
        })
      ),
  };

  localStorage.setItem(
    getSaveKey(),
    JSON.stringify(data)
  );
};

/* =========================================================
   GAME LOOP
========================================================= */
let gameInterval:
  ReturnType<typeof setInterval>;

let saveInterval:
  ReturnType<typeof setInterval>;

onMounted(() => {
  loadGame();

  gameInterval = setInterval(() => {
    coins.value +=
      coinsPerSecond.value;
  }, 1000);

  saveInterval = setInterval(() => {
    saveGame();
  }, 5000);
});

onUnmounted(() => {
  clearInterval(gameInterval);

  clearInterval(saveInterval);

  saveGame();
});

/* =========================================================
   UTIL
========================================================= */
const coinImage = new URL(
  "@/assets/moedaDoSite.png",
  import.meta.url
).href;

const formatNumber = (
  value:
    | number
    | undefined
    | null
): string => {
  if (
    value === undefined ||
    value === null ||
    isNaN(value)
  ) {
    return "0";
  }

  if (value < 1000) {
    return Math.floor(
      value
    ).toString();
  }

  const units = [
    "K",
    "M",
    "B",
    "T",
    "Qa",
    "Qi",
    "Sx",
    "Sp",
    "Oc",
    "No",
    "Dc",
  ];

  let unitIndex = -1;

  while (
    value >= 1000 &&
    unitIndex <
      units.length - 1
  ) {
    value /= 1000;

    unitIndex++;
  }

  return `${value.toFixed(1)}${
    units[unitIndex]
  }`;
};

/* =========================================================
   UPGRADES
========================================================= */
const getUpgradeCost = (
  upgrade: Upgrade
): number => {
  return Math.floor(
    upgrade.baseCost *
      Math.pow(
        1.45,
        upgrade.level
      )
  );
};

const buyUpgrade = (
  upgrade: Upgrade
) => {
  const cost =
    getUpgradeCost(
      upgrade
    );

  if (
    coins.value < cost
  ) {
    return;
  }

  coins.value -= cost;

  upgrade.level++;

  checkUpgradeMissions(
    cost
  );

  saveGame();
};

/* =========================================================
   REBIRTH SYSTEM
========================================================= */
const rebirth = () => {
  if (
    coins.value <
    rebirthCost.value
  ) {
    return;
  }

  rebirths.value++;

  coins.value = 0;

  totalClicks.value = 0;

  upgrades.value.forEach(
    (upgrade) => {
      upgrade.level = 0;
    }
  );

  saveGame();
};

/* =========================================================
   CLICK SYSTEM
========================================================= */
const clickDino = (
  event: MouseEvent
) => {
  coins.value +=
    clickPower.value;

  totalClicks.value++;

  checkClickMissions();

  currentDino.value =
    dinos.value[
      Math.floor(
        Math.random() *
          dinos.value.length
      )
    ];

  const id =
    Date.now() +
    Math.random();

  if (
    floatingTexts.value
      .length > 25
  ) {
    floatingTexts.value.shift();
  }

  floatingTexts.value.push({
    id,
    x: event.clientX,
    y: event.clientY,
    value: `+${formatNumber(
      clickPower.value
    )}`,
  });

  setTimeout(() => {
    floatingTexts.value =
      floatingTexts.value.filter(
        (text) =>
          text.id !== id
      );
  }, 900);
};
</script>

<template>
  <div class="clicker-page">
    <!-- BACKGROUND -->
    <div class="bg-glow bg-glow--1"></div>
    <div class="bg-glow bg-glow--2"></div>
    <div class="bg-grid"></div>

    <!-- HEADER -->
    <header class="page-header">
      <div class="emblem">🦖</div>

      <div class="header-text">
        <span class="eyebrow">
          Expedição Paleontológica
        </span>

        <h1>
          Arena dos Fósseis
        </h1>

        <p>
          Clique, escave e expanda seu império jurássico
        </p>
      </div>
    </header>

    <!-- HUD -->
    <section class="hud">

      <!-- TESOURO -->
      <div class="stat-card stat-card--primary">

        <div class="stat-icon">
          <img
            :src="coinImage"
            alt="Moeda"
          />
        </div>

        <div class="stat-body">

          <span class="stat-label">
            Tesouro
          </span>

          <strong class="stat-value">
            {{ formatNumber(coins) }}
          </strong>

        </div>

        <div class="stat-glow"></div>

      </div>

      <!-- PODER -->
      <div class="stat-card">

        <div class="stat-icon stat-icon--power">
          ⚡
        </div>

        <div class="stat-body">

          <span class="stat-label">
            Poder por Clique
          </span>

          <strong class="stat-value">
            {{ formatNumber(clickPower) }}
          </strong>

        </div>

      </div>

      <!-- CLIQUES -->
      <div class="stat-card">

        <div class="stat-icon stat-icon--bone">
          🦴
        </div>

        <div class="stat-body">

          <span class="stat-label">
            Cliques Totais
          </span>

          <strong class="stat-value">
            {{ formatNumber(totalClicks) }}
          </strong>

        </div>

      </div>

      <!-- CPS -->
      <div class="stat-card">

        <div class="stat-icon">
          ⏱️
        </div>

        <div class="stat-body">

          <span class="stat-label">
            Cliques por Segundo
          </span>

          <strong class="stat-value cps-value">
            {{ formatNumber(coinsPerSecond) }}
          </strong>

        </div>

      </div>

    </section>

    <!-- ARENA -->
    <section class="arena">

      <div class="arena-ring">

        <div class="ring ring--outer"></div>
        <div class="ring ring--mid"></div>
        <div class="ring ring--inner"></div>

        <button
          class="dino-button"
          @click="clickDino"
          aria-label="Clicar no dinossauro"
        >

          <span class="dino-emoji">
            {{ currentDino }}
          </span>

          <span class="dino-shadow"></span>

        </button>

      </div>

      <p class="instruction">

        <span class="dot"></span>

        Clique no dinossauro para escavar moedas

        <span class="dot"></span>

      </p>

    </section>

    <!-- LOJA -->
    <section class="shop">

      <header class="shop-header">

        <span class="shop-eyebrow">
          Mercado Fóssil
        </span>

        <h2>
          Loja Paleontológica
        </h2>

        <div class="shop-divider">

          <span></span>

          <em>✦</em>

          <span></span>

        </div>

      </header>

      <div class="upgrades-list">

        <article
          v-for="upgrade in upgrades"
          :key="upgrade.id"
          class="shop-card"
        >

          <div class="shop-icon">
            {{ upgrade.icon }}
          </div>

          <div class="shop-info">

            <div class="shop-title-row">

              <h3>
                {{ upgrade.name }}
              </h3>

              <span class="shop-level">
                Nv. {{ upgrade.level }}
              </span>

            </div>

            <p>
              {{ upgrade.description }}
            </p>

          </div>

          <button
            class="buy-btn"
            @click="buyUpgrade(upgrade)"
            :disabled="coins < getUpgradeCost(upgrade)"
          >

            <span class="buy-label">
              Comprar
            </span>

            <span class="buy-cost">

              <img
                :src="coinImage"
                alt=""
              />

              {{
                formatNumber(
                  getUpgradeCost(upgrade)
                )
              }}

            </span>

          </button>

        </article>

      </div>

    </section>

    <!-- FLOATING TEXT -->
    <transition-group
      name="float"
      tag="div"
    >

      <div
        v-for="text in floatingTexts"
        :key="text.id"
        class="floating-text"
        :style="{
          left: text.x + 'px',
          top: text.y + 'px'
        }"
      >

        <img
          :src="coinImage"
          alt=""
        />

        {{ text.value }}

      </div>

    </transition-group>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Crimson+Text:wght@400;600&display=swap');

/* =========================================================
   PAGE
========================================================= */
.clicker-page {
  position: relative;
  min-height: 100vh;
  padding: 50px 24px 80px;
  overflow: hidden;
  background:
    radial-gradient(ellipse at top, #3a2410 0%, transparent 55%),
    radial-gradient(ellipse at bottom, #1a0d05 0%, transparent 60%),
    linear-gradient(180deg, #0a0604, #0e0805 60%, #14080a);
  color: #f5e6c8;
  font-family: 'Crimson Text', serif;
}

/* BG DECOR */
.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
}
.bg-glow--1 {
  width: 500px; height: 500px;
  top: -150px; left: -100px;
  background: radial-gradient(circle, rgba(212,175,55,.18), transparent 70%);
}
.bg-glow--2 {
  width: 600px; height: 600px;
  bottom: -200px; right: -150px;
  background: radial-gradient(circle, rgba(184,80,40,.15), transparent 70%);
}
.bg-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(212,175,55,.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212,175,55,.04) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, #000 30%, transparent 75%);
  pointer-events: none;
  z-index: 0;
}

.clicker-page > *:not(.bg-glow):not(.bg-grid) {
  position: relative;
  z-index: 1;
}

/* =========================================================
   HEADER
========================================================= */
.page-header {
  max-width: 1100px;
  margin: 0 auto 40px;
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 24px 28px;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(40,24,14,.7), rgba(20,12,8,.7));
  border: 1px solid rgba(212,175,55,.2);
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05);
}
.emblem {
  width: 72px; height: 72px;
  border-radius: 18px;
  display: grid; place-items: center;
  font-size: 2.4rem;
  background: radial-gradient(circle at 30% 30%, #4a2e15, #1a0e07);
  border: 1px solid rgba(243,217,139,.3);
  box-shadow: inset 0 0 20px rgba(243,217,139,.15), 0 0 25px rgba(243,217,139,.1);
}
.header-text { flex: 1; }
.eyebrow {
  display: block;
  font-family: 'Cinzel', serif;
  font-size: .7rem;
  letter-spacing: .35em;
  text-transform: uppercase;
  color: #b89556;
  margin-bottom: 6px;
}
.page-header h1 {
  margin: 0;
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  background: linear-gradient(135deg, #f3d98b, #d4af37 50%, #b8780f);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.page-header p {
  margin: 4px 0 0;
  color: rgba(245,230,200,.6);
  font-style: italic;
}

/* =========================================================
   HUD
========================================================= */
.hud {
  max-width: 1100px;
  margin: 0 auto 50px;

  display: grid;

  grid-template-columns:
    repeat(auto-fit, minmax(250px, 1fr));

  gap: 20px;
}

.stat-card {
  position: relative;

  min-height: 120px;

  padding: 22px 24px;

  border-radius: 20px;

  display: flex;
  align-items: center;
  gap: 16px;

  overflow: hidden;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.05),
      rgba(255,255,255,.015)
    );

  border: 1px solid rgba(212,175,55,.18);

  backdrop-filter: blur(10px);

  transition:
    transform .25s ease,
    border-color .25s ease;
}

.cps-value {
  color: #6df7c1;

  text-shadow:
    0 0 10px rgba(109,247,193,.45);
}

@media (max-width: 700px) {

  .hud {
    grid-template-columns: 1fr;
  }

}

.stat-card::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, transparent 40%, rgba(243,217,139,.06));
  pointer-events: none;
}
.stat-card:hover {
  transform: translateY(-3px);
  border-color: rgba(243,217,139,.4);
}
.stat-card--primary {
  border-color: rgba(243,217,139,.35);
  box-shadow: 0 0 30px rgba(243,217,139,.08);
}
.stat-glow {
  position: absolute;
  width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(243,217,139,.18), transparent 70%);
  top: -50px; right: -50px;
  pointer-events: none;
}
.stat-icon {
  width: 56px; height: 56px;
  border-radius: 14px;
  display: grid; place-items: center;
  font-size: 1.7rem;
  background: linear-gradient(135deg, rgba(243,217,139,.12), rgba(0,0,0,.3));
  border: 1px solid rgba(243,217,139,.2);
}
.stat-icon img {
  width: 36px; height: 36px;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgba(243,217,139,.5));
  animation: coinFloat 3s ease-in-out infinite;
}
.stat-icon--power { color: #ffd866; text-shadow: 0 0 14px rgba(255,216,102,.55); }
.stat-icon--bone { color: #e9d6a8; }
.stat-body { display: flex; flex-direction: column; }
.stat-label {
  font-family: 'Cinzel', serif;
  font-size: .68rem;
  letter-spacing: .25em;
  text-transform: uppercase;
  color: #b89556;
  margin-bottom: 4px;
}
.stat-value {
  font-family: 'Cinzel', serif;
  font-size: 1.7rem;
  color: #f3d98b;
  line-height: 1;
}

/* =========================================================
   ARENA
========================================================= */
.arena {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 70px;
}
.arena-ring {
  position: relative;
  width: 320px; height: 320px;
  display: grid; place-items: center;
}
.ring {
  position: absolute;
  border-radius: 50%;
  border: 1px dashed rgba(243,217,139,.25);
  pointer-events: none;
}
.ring--outer { width: 100%; height: 100%; animation: spin 30s linear infinite; }
.ring--mid {
  width: 82%; height: 82%;
  border-style: solid;
  border-color: rgba(243,217,139,.15);
  box-shadow: inset 0 0 30px rgba(243,217,139,.08);
}
.ring--inner {
  width: 70%; height: 70%;
  border-color: rgba(243,217,139,.35);
  animation: spin 18s linear infinite reverse;
}
.dino-button {
  position: relative;
  width: 240px; height: 240px;
  border-radius: 50%;
  display: grid; place-items: center;
  cursor: pointer;
  user-select: none;
  background:
    radial-gradient(circle at 30% 30%, rgba(243,217,139,.25), transparent 60%),
    radial-gradient(circle, rgba(60,30,12,.9), rgba(10,5,3,.95));
  border: 3px solid rgba(243,217,139,.35);
  transition: transform .12s ease, box-shadow .25s ease;
  box-shadow:
    0 0 60px rgba(243,217,139,.18),
    inset 0 0 40px rgba(0,0,0,.5);
}
.dino-button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 80px rgba(243,217,139,.3), inset 0 0 40px rgba(0,0,0,.5);
}
.dino-button:active { transform: scale(.93); }
.dino-emoji {
  font-size: 7rem;
  filter: drop-shadow(0 6px 14px rgba(0,0,0,.6));
  animation: dinoBob 2.5s ease-in-out infinite;
}
.dino-shadow {
  position: absolute;
  bottom: 18px; left: 50%;
  transform: translateX(-50%);
  width: 120px; height: 16px;
  background: radial-gradient(ellipse, rgba(0,0,0,.55), transparent 70%);
  border-radius: 50%;
  filter: blur(2px);
}

.instruction {
  margin-top: 32px;
  display: flex; align-items: center; gap: 14px;
  font-family: 'Cinzel', serif;
  font-size: .85rem;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: #b89556;
}
.dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #d4af37;
  box-shadow: 0 0 8px #d4af37;
}

/* =========================================================
   SHOP
========================================================= */
.shop { max-width: 900px; margin: 0 auto; }
.shop-header { text-align: center; margin-bottom: 28px; }
.shop-eyebrow {
  font-family: 'Cinzel', serif;
  font-size: .7rem;
  letter-spacing: .4em;
  text-transform: uppercase;
  color: #b89556;
}
.shop-header h2 {
  margin: 6px 0 14px;
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  background: linear-gradient(135deg, #f3d98b, #d4af37);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.shop-divider {
  display: flex; align-items: center; justify-content: center;
  gap: 12px;
  color: #d4af37;
}
.shop-divider span {
  width: 80px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,175,55,.5), transparent);
}
.shop-divider em { font-style: normal; }

.shop-card {
  position: relative;
  padding: 26px;
  border-radius: 22px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 22px;
  background: linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.01));
  border: 1px solid rgba(212,175,55,.22);
  backdrop-filter: blur(10px);
  box-shadow: 0 12px 40px rgba(0,0,0,.4);
  transition: border-color .25s ease, transform .25s ease;
}
.shop-card:hover {
  border-color: rgba(243,217,139,.4);
  transform: translateY(-2px);
}
.shop-icon {
  width: 64px; height: 64px;
  border-radius: 16px;
  display: grid; place-items: center;
  font-size: 1.9rem;
  background: linear-gradient(135deg, rgba(243,217,139,.15), rgba(0,0,0,.4));
  border: 1px solid rgba(243,217,139,.25);
}
.shop-info { min-width: 0; }
.shop-title-row {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 4px;
}
.shop-card h3 {
  margin: 0;
  font-family: 'Cinzel', serif;
  color: #f3d98b;
  font-size: 1.15rem;
}
.shop-level {
  font-family: 'Cinzel', serif;
  font-size: .7rem;
  letter-spacing: .15em;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(243,217,139,.12);
  border: 1px solid rgba(243,217,139,.3);
  color: #f3d98b;
}
.shop-card p {
  margin: 0 0 12px;
  color: rgba(245,230,200,.65);
  font-size: .95rem;
}
.progress {
  height: 6px;
  border-radius: 999px;
  background: rgba(0,0,0,.45);
  overflow: hidden;
  border: 1px solid rgba(243,217,139,.15);
}
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #b8780f, #f3d98b);
  box-shadow: 0 0 12px rgba(243,217,139,.5);
  transition: width .3s ease;
}
.progress-label {
  display: block;
  margin-top: 6px;
  font-size: .75rem;
  color: #b89556;
  letter-spacing: .1em;
}

.buy-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 22px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  background: linear-gradient(135deg, #f3d98b, #d4af37 50%, #8a6a1f);
  color: #1a1208;
  transition: transform .2s ease, box-shadow .2s ease, filter .2s ease;
  box-shadow: 0 6px 20px rgba(212,175,55,.35), inset 0 1px 0 rgba(255,255,255,.4);
}
.buy-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(212,175,55,.5);
  filter: brightness(1.05);
}
.buy-btn:active:not(:disabled) { transform: translateY(0); }
.buy-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
  filter: grayscale(.4);
}
.buy-label {
  font-weight: 700;
  letter-spacing: .15em;
  text-transform: uppercase;
  font-size: .85rem;
}
.buy-cost {
  display: flex; align-items: center; gap: 6px;
  font-weight: 700;
  font-size: .95rem;
}
.buy-cost img { width: 18px; height: 18px; object-fit: contain; }

/* =========================================================
   FLOATING TEXT
========================================================= */
.floating-text {
  position: fixed;
  display: flex; align-items: center;
  gap: 6px;
  font-family: 'Cinzel', serif;
  font-size: 1.4rem;
  font-weight: bold;
  color: #f3d98b;
  pointer-events: none;
  text-shadow: 0 0 14px rgba(243,217,139,.7);
  transform: translate(-50%, -50%);
  z-index: 999;
}
.floating-text img { width: 24px; height: 24px; object-fit: contain; }

.float-enter-active, .float-leave-active { transition: all .9s ease-out; }
.float-enter-from { opacity: 1; transform: translate(-50%, -50%); }
.float-leave-to { opacity: 0; transform: translate(-50%, -180%) scale(1.3); }

/* =========================================================
   ANIMAÇÕES
========================================================= */
@keyframes coinFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-4px) rotate(6deg); }
}
@keyframes dinoBob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-8px); }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* =========================================================
   MOBILE
========================================================= */
@media (max-width: 700px) {
  .page-header { flex-direction: column; text-align: center; }
  .arena-ring { width: 260px; height: 260px; }
  .dino-button { width: 200px; height: 200px; }
  .dino-emoji { font-size: 5.5rem; }
  .shop-card { grid-template-columns: 1fr; text-align: center; }
  .shop-icon { margin: 0 auto; }
  .shop-title-row { justify-content: center; }

  @media (max-width: 700px) {

  .hud {

    grid-template-columns: 1fr;

  }

}
}

.upgrades-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* =========================================================
   MISSIONS HUD
========================================================= */
.missions {
  position: fixed;

  top: 24px;
  right: 24px;

  width: 320px;

  z-index: 50;
}

.missions .shop-header {
  margin-bottom: 14px;

  padding: 0 4px;

  text-align: left;
}

.missions .shop-header h2 {
  font-size: 1.3rem;
}

.missions .shop-divider {
  justify-content: flex-start;
}

.missions-list {
  display: flex;
  flex-direction: column;

  gap: 12px;

  max-height: 420px;

  overflow-y: auto;

  padding-right: 6px;
}

/* SCROLL */
.missions-list::-webkit-scrollbar {
  width: 6px;
}

.missions-list::-webkit-scrollbar-thumb {
  background: rgba(243,217,139,.3);
  border-radius: 999px;
}

/* CARD */
.mission-card {
  position: relative;

  overflow: hidden;

  display: flex;
  align-items: center;

  gap: 14px;

  padding: 14px;

  border-radius: 16px;

  background:
    linear-gradient(
      145deg,
      rgba(30,18,10,.94),
      rgba(10,6,4,.96)
    );

  border: 1px solid rgba(243,217,139,.15);

  backdrop-filter: blur(10px);

  transition:
    transform .2s ease,
    border-color .2s ease;
}

.mission-card:hover {
  transform: translateY(-2px);

  border-color:
    rgba(243,217,139,.35);
}

.mission-card.completed {
  border-color:
    rgba(109,247,193,.5);

  box-shadow:
    0 0 18px rgba(109,247,193,.18);
}

/* ICON */
.mission-icon {
  width: 52px;
  height: 52px;

  flex-shrink: 0;

  border-radius: 14px;

  display: grid;
  place-items: center;

  font-size: 1.4rem;

  background:
    linear-gradient(
      145deg,
      rgba(243,217,139,.15),
      rgba(0,0,0,.35)
    );

  border: 1px solid rgba(243,217,139,.15);
}

/* INFO */
.mission-info {
  flex: 1;
  min-width: 0;
}

.mission-info h3 {
  margin: 0 0 4px;

  font-size: .92rem;

  line-height: 1.3;

  color: #f3d98b;

  font-family: 'Cinzel', serif;
}

.mission-info p {
  margin: 0;

  font-size: .78rem;

  color: rgba(245,230,200,.65);
}

/* STATUS */
.mission-status {
  position: absolute;

  top: 10px;
  right: 10px;

  font-size: .7rem;

  font-family: 'Cinzel', serif;

  color: #f3d98b;
}

.mission-card.completed .mission-status {
  color: #6df7c1;
}

/* =========================================================
   MOBILE
========================================================= */
@media (max-width: 900px) {

  .missions {
    position: relative;

    top: unset;
    right: unset;

    width: 100%;

    margin-bottom: 40px;
  }

  .missions-list {
    max-height: unset;
    overflow: visible;
  }

}

/* =========================================================
   MISSION POPUP
========================================================= */
.mission-popup {
  position: fixed;

  top: 30px;
  left: 50%;

  transform: translateX(-50%);

  width: 360px;
  max-width: calc(100% - 30px);

  display: flex;
  align-items: center;

  gap: 16px;

  padding: 18px;

  border-radius: 22px;

  background:
    linear-gradient(
      145deg,
      rgba(30,18,10,.97),
      rgba(10,6,4,.98)
    );

  border: 1px solid
    rgba(109,247,193,.45);

  box-shadow:
    0 0 35px rgba(109,247,193,.18),
    0 10px 40px rgba(0,0,0,.45);

  z-index: 9999;

  backdrop-filter: blur(14px);
}

.mission-popup-icon {
  width: 64px;
  height: 64px;

  flex-shrink: 0;

  border-radius: 18px;

  display: grid;
  place-items: center;

  font-size: 2rem;

  background:
    linear-gradient(
      145deg,
      rgba(109,247,193,.18),
      rgba(0,0,0,.35)
    );

  border: 1px solid
    rgba(109,247,193,.25);
}

.mission-popup-content {
  flex: 1;
}

.mission-popup-label {
  display: block;

  margin-bottom: 4px;

  font-size: .72rem;

  letter-spacing: .22em;

  text-transform: uppercase;

  color: #6df7c1;

  font-family: 'Cinzel', serif;
}

.mission-popup-content h3 {
  margin: 0 0 4px;

  font-size: 1rem;

  color: #f3d98b;

  font-family: 'Cinzel', serif;
}

.mission-popup-content p {
  margin: 0;

  font-size: .92rem;

  color: rgba(255,255,255,.78);
}

/* ANIMAÇÃO */
.mission-popup-enter-active,
.mission-popup-leave-active {
  transition:
    opacity .35s ease,
    transform .35s ease;
}

.mission-popup-enter-from,
.mission-popup-leave-to {
  opacity: 0;

  transform:
    translateX(-50%)
    translateY(-20px)
    scale(.95);
}

/* =========================================
   BOTÃO MOSTRAR / OCULTAR MISSÕES
========================================= */
.toggle-missions-btn {
  width: 100%;

  margin-bottom: 14px;

  padding: 12px 16px;

  border: 1px solid rgba(243,217,139,.25);

  border-radius: 14px;

  background:
    linear-gradient(
      145deg,
      rgba(243,217,139,.12),
      rgba(0,0,0,.3)
    );

  color: #f3d98b;

  font-family: 'Cinzel', serif;

  font-size: .82rem;

  letter-spacing: .12em;

  text-transform: uppercase;

  cursor: pointer;

  transition:
    transform .2s ease,
    border-color .2s ease,
    background .2s ease;
}

.toggle-missions-btn:hover {
  transform: translateY(-2px);

  border-color:
    rgba(243,217,139,.45);

  background:
    linear-gradient(
      145deg,
      rgba(243,217,139,.18),
      rgba(0,0,0,.35)
    );
}

/* =========================================
   ANIMAÇÃO ABRIR / FECHAR MISSÕES
========================================= */
.missions-fade-enter-active,
.missions-fade-leave-active {
  transition:
    opacity .3s ease,
    transform .3s ease;
}

.missions-fade-enter-from,
.missions-fade-leave-to {
  opacity: 0;

  transform:
    translateY(-10px);
}

/* =========================================
   ANIMAÇÃO DOS CARDS
========================================= */
.mission-slide-enter-active,
.mission-slide-leave-active {
  transition:
    all .35s ease;
}

.mission-slide-enter-from {
  opacity: 0;

  transform:
    translateX(20px);
}

.mission-slide-leave-to {
  opacity: 0;

  transform:
    translateX(-20px);
}

</style>