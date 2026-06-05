<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import api from "../services/api";

const coinImage = new URL(
  "@/assets/moedaDoSite.png",
  import.meta.url
).href;

const balance = ref(0);
const coins = ref(0);

const coinsToConvert = ref(0);

const loading = ref(false);

const convertedValue = computed(() => {
  return (coinsToConvert.value / 100).toFixed(2);
});

/* ======================
   LOAD WALLET
====================== */
const loadWallet = async () => {

  try {

    const res = await api.get("/wallet/me");

    balance.value = res.data.balance;
    coins.value = res.data.coins;

  } catch (error) {

    console.log(error);

  }

};

/* ======================
   CONVERT COINS
====================== */
const convertCoins = async () => {

  if (coinsToConvert.value <= 0) {
    alert("Digite uma quantidade válida.");
    return;
  }

  if (coinsToConvert.value > coins.value) {
    alert("Você não possui moedas suficientes.");
    return;
  }

  try {

    loading.value = true;

    const res = await api.post("/wallet/convert", {
      coins: coinsToConvert.value
    });

    // 🔥 atualiza tela wallet
    balance.value = res.data.balance;
    coins.value = res.data.coins;

    // 🔥 sincroniza profile
    const savedUser = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    savedUser.balance = res.data.balance;
    savedUser.coins = res.data.coins;

    localStorage.setItem(
      "user",
      JSON.stringify(savedUser)
    );

    coinsToConvert.value = 0;

  } catch (error) {

    console.log(error);

  } finally {

    loading.value = false;

  }

};

onMounted(() => {
  loadWallet();
});
</script>


<template>
  <div class="wallet-page">

    <div class="wallet-container">

      <div class="wallet-header">

        <p class="eyebrow">
          Sistema Financeiro
        </p>

        <h1>
          Carteira Paleontológica
        </h1>

        <p class="subtitle">
          Converta moedas conquistadas nos jogos em saldo utilizável dentro da plataforma.
        </p>

      </div>

      <div class="wallet-grid">

        <div class="wallet-card">

          <span class="label">
            Saldo em Conta
          </span>

          <h2>
            R$ {{ balance.toFixed(2) }}
          </h2>

        </div>

        <div class="wallet-card">

          <span class="label">
            Minhas Moedas
          </span>

          <h2 class="coin-display">

            <img
              :src="coinImage"
              alt="Moeda"
            />

            {{ coins }}

          </h2>

        </div>

      </div>

      <div class="convert-card">

        <h3>
          Converter moedas
        </h3>

        <p class="convert-info">
          Taxa atual:
          <strong>
            100 moedas = R$ 1,00
          </strong>
        </p>

        <input
          type="number"
          v-model.number="coinsToConvert"
          placeholder="Quantidade de moedas"
          min="1"
          :max="coins"
        />

        <div class="preview">

          <span>
            Valor recebido
          </span>

          <strong>
            R$ {{ convertedValue }}
          </strong>

        </div>

        <button
          @click="convertCoins"
          :disabled="
            loading ||
            coinsToConvert <= 0 ||
            coinsToConvert > coins
          "
        >
          {{ loading ? "Convertendo..." : "Converter moedas" }}
        </button>

      </div>

    </div>
  </div>
</template>

<style scoped>

.wallet-page {
  min-height: 100vh;

  background:
    radial-gradient(circle at top, #2a1a08, transparent 40%),
    linear-gradient(180deg, #0a0604, #120b07);

  color: #f5e6c8;

  padding: 60px 20px;
}

.wallet-container {
  max-width: 1100px;
  margin: 0 auto;
}

.wallet-header {
  text-align: center;
  margin-bottom: 50px;
}

.eyebrow {
  color: #d4af37;
  text-transform: uppercase;
  letter-spacing: .4em;
  font-size: .7rem;
  margin-bottom: 10px;
}

.wallet-header h1 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  margin: 0;

  font-family: "Cinzel", serif;

  background: linear-gradient(
    180deg,
    #fff5d6,
    #d4af37
  );

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #cdbb90;
  max-width: 700px;
  margin: 20px auto 0;
  line-height: 1.7;
}

.wallet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(280px,1fr));
  gap: 20px;

  margin-bottom: 40px;
}

.wallet-card {
  padding: 35px;
  border-radius: 24px;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.05),
      rgba(255,255,255,.02)
    );

  border: 1px solid rgba(212,175,55,.18);
}

.label {
  display: block;

  color: #cdbb90;

  margin-bottom: 12px;

  letter-spacing: .2em;
  text-transform: uppercase;
  font-size: .75rem;
}

.wallet-card h2 {
  margin: 0;

  color: #f5e6c8;

  font-size: 2.3rem;

  font-family: "Cinzel", serif;
}

/* 🪙 MOEDA */
.coin-display {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.coin-display img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.convert-card {
  padding: 40px;
  border-radius: 28px;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.04),
      rgba(255,255,255,.015)
    );

  border: 1px solid rgba(212,175,55,.15);
}

.convert-card h3 {
  margin-top: 0;

  font-size: 1.7rem;

  color: #f1d98a;

  font-family: "Cinzel", serif;
}

.convert-info {
  color: #cdbb90;
  margin-bottom: 24px;
}

.convert-card input {
  width: 100%;
  box-sizing: border-box;

  padding: 18px;

  border-radius: 16px;

  border: 1px solid rgba(212,175,55,.2);

  background: rgba(0,0,0,.4);

  color: #f5e6c8;

  font-size: 1rem;

  margin-bottom: 24px;
}

.preview {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 30px;

  padding: 18px;

  border-radius: 16px;

  background: rgba(212,175,55,.08);
}

.preview strong {
  color: #f1d98a;
  font-size: 1.3rem;
}

.convert-card button {
  width: 100%;

  padding: 18px;

  border: none;

  border-radius: 16px;

  background:
    linear-gradient(
      135deg,
      #d4af37,
      #8a6a1f
    );

  color: #1a1208;

  font-weight: 700;

  font-size: .95rem;

  letter-spacing: .1em;
  text-transform: uppercase;

  cursor: pointer;

  transition: .3s;
}

.convert-card button:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
}

.convert-card button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

</style>