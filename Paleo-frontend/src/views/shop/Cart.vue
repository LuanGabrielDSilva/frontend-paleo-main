<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import api from "../../services/api";

/* =========================
   STATE
========================= */

const cart = ref<any>(null);

const showSuccessModal = ref(false);
const showErrorModal = ref(false);
const showWarningModal = ref(false);
const warningMessage = ref("");

const lastTotal = ref(0);

/* =========================
   ADDRESS
========================= */

const address = ref({
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
});

/* =========================
   CART
========================= */

async function loadCart() {
  const { data } = await api.get("/cart");
  cart.value = data;
}

async function removeItem(item_id: string) {
  await api.delete("/cart/remove", {
    data: { item_id },
  });

  await loadCart();
}

async function increaseQuantity(item: any) {
  await api.put("/cart/item", {
    item_id: item.id,
    quantity: item.quantity + 1,
  });

  await loadCart();
}

async function decreaseQuantity(item: any) {
  if (item.quantity <= 1) {
    await removeItem(item.id);
    return;
  }

  await api.put("/cart/item", {
    item_id: item.id,
    quantity: item.quantity - 1,
  });

  await loadCart();
}

/* =========================
   TOTAL
========================= */

const total = computed(() => {
  if (!cart.value?.items) return 0;

  return cart.value.items.reduce((sum: number, item: any) => {
    return sum + item.product.price * item.quantity;
  }, 0);
});

/* =========================
   PURCHASE
========================= */

async function finalizePurchase() {
  try {
    if (
      !address.value.cep ||
      !address.value.rua ||
      !address.value.numero ||
      !address.value.bairro ||
      !address.value.cidade ||
      !address.value.estado
    ) {
      alert("Preencha todos os os campos obrigatórios.");
      return;
    }

    const { data } = await api.post("/orders", {
      ...address.value,
    });

    lastTotal.value = data.total ?? total.value;

    await loadCart();

    showSuccessModal.value = true;
    showErrorModal.value = false;
  } catch (err: any) {
    console.log(err?.response?.data);

    showErrorModal.value = true;
    showSuccessModal.value = false;
  }
}

/* =========================
   MODALS
========================= */

function closeModals() {
  showSuccessModal.value = false;
  showErrorModal.value = false;
  showWarningModal.value = false;
}

/* =========================
   INIT
========================= */

onMounted(loadCart);
</script>

<template>
  <div class="cart-page">

    <h1 class="title">Expedição de Compras</h1>

    <!-- EMPTY -->
    <div v-if="!cart?.items?.length" class="empty">
      <div class="empty-icon">🏺</div>
      <p>Seu acervo está vazio, explorador.</p>
      <span class="empty-hint">Adicione artefatos ao seu cesto de expedição.</span>
    </div>

    <!-- CART -->
    <div v-else class="cart-list">

      <div
        class="cart-item"
        v-for="item in cart.items"
        :key="item.id"
      >

        <div class="item-image-wrap">
          <img :src="item.product.image" class="product-image" />
        </div>

        <div class="info">
          <h2>{{ item.product.name }}</h2>

          <p class="item-desc">
            {{ item.product.description }}
          </p>

          <div class="item-meta">
            <span class="price">
              R$ {{ item.product.price }}
            </span>

            <div class="qty-controls">

              <button class="qty-btn" @click="decreaseQuantity(item)">
                −
              </button>

              <span class="qty">
                {{ item.quantity }}
              </span>

              <button class="qty-btn" @click="increaseQuantity(item)">
                +
              </button>

            </div>
          </div>
        </div>

        <button class="remove-btn" @click="removeItem(item.id)">
          ❌
        </button>

      </div>

      <!-- ENDEREÇO -->
      <div class="address-box">

              </div>

            <!-- TOTAL -->
            <div class="total-box">

              <div class="total-label">
                <span>Valor Total da Expedição</span>
                <strong>R$ {{ total.toFixed(2) }}</strong>
              </div>

              <button class="finish-btn" @click="$router.push('/checkout')">
                Continuar Expedição
              </button>

            </div>

    </div>

    <!-- =========================
     MODAL SUCESSO NOVO
========================= -->
<Teleport to="body">
  <Transition name="checkout-success">

    <div
      v-if="showSuccessModal"
      class="success-overlay"
      @click.self="closeModals"
    >

      <div class="success-modal">

        <!-- brilho -->
        <div class="success-glow"></div>

        <!-- ícone -->
        <div class="success-icon-wrap">
          <div class="success-icon">
            ✓
          </div>
        </div>

        <!-- título -->
        <h2 class="success-title">
          Pedido Confirmado
        </h2>

        <p class="success-subtitle">
          Sua expedição foi registrada com sucesso.
        </p>

        <!-- card resumo -->
        <div class="success-summary">

          <div class="summary-row">
            <span>Total da Expedição</span>
            <strong>R$ {{ lastTotal.toFixed(2) }}</strong>
          </div>

          <div class="summary-row">
            <span>Status</span>
            <strong class="status">
              Preparando envio
            </strong>
          </div>

        </div>

        <!-- mensagem -->
        <p class="success-message">
          Seus artefatos estão sendo preparados para envio.
        </p>

        <!-- botão -->
        <button
          class="success-button"
          @click="closeModals"
        >
          Continuar Explorando
        </button>

      </div>

    </div>

  </Transition>
</Teleport>

    <!-- =========================
         MODAL ERRO
    ========================= -->
    <Teleport to="body">
      <Transition name="pop">

        <div v-if="showErrorModal" class="modal-overlay" @click.self="closeModals">

          <div class="modal-content error">

            <div class="seal error-seal">!</div>

            <h2 class="modal-title">
              Falha na Expedição
            </h2>

            <p class="modal-text">
              Não foi possível finalizar sua compra.
              <br />
              Tente novamente.
            </p>

            <button class="modal-btn error-btn" @click="closeModals">
              Tentar Novamente
            </button>

          </div>

        </div>

      </Transition>
    </Teleport>

    <!-- =========================
     MODAL AVISO
========================= -->
<Teleport to="body">
  <Transition name="pop">

    <div
      v-if="showWarningModal"
      class="modal-overlay"
      @click.self="closeModals"
    >

      <div class="modal-content warning">

        <div class="seal warning-seal">
          ⚠
        </div>

        <h2 class="modal-title">
          Atenção Explorador
        </h2>

        <p class="modal-text">
          {{ warningMessage }}
        </p>

        <button
          class="modal-btn warning-btn"
          @click="closeModals"
        >
          Entendido
        </button>

      </div>

    </div>

  </Transition>
</Teleport>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

.cart-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px;
  color: #e8dcc8;
  font-family: 'Crimson Text', serif;
}

.title {
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  font-weight: 700;
  color: #f1d98a;
  text-align: center;
  margin-bottom: 40px;
  text-shadow: 0 2px 12px rgba(241, 217, 138, 0.25);
  letter-spacing: 2px;
}

/* EMPTY */
.empty {
  text-align: center;
  padding: 80px 20px;
  opacity: 0.7;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty p {
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
  color: #f1d98a;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 1rem;
  color: #a89f8d;
  font-style: italic;
}

/* LIST */
.cart-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cart-item {
  background: linear-gradient(145deg, #1e1810 0%, #16120c 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  gap: 20px;
  align-items: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.cart-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #d4af37, #8b6914);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.cart-item:hover::before {
  opacity: 1;
}

.cart-item:hover {
  border-color: rgba(212, 175, 55, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.item-image-wrap {
  flex-shrink: 0;
  width: 110px;
  height: 110px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.cart-item:hover .product-image {
  transform: scale(1.08);
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.info h2 {
  font-family: 'Cinzel', serif;
  font-size: 1.15rem;
  color: #f1d98a;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-desc {
  font-size: 0.95rem;
  color: #a89f8d;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 4px;
}

.price {
  font-family: 'Cinzel', serif;
  font-size: 1.05rem;
  color: #d4af37;
  font-weight: 600;
}

.qty {
  font-size: 0.9rem;
  color: #8a7f6e;
  background: rgba(212, 175, 55, 0.08);
  padding: 3px 10px;
  border-radius: 20px;
}

.remove-btn {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(231, 76, 60, 0.3);
  background: rgba(231, 76, 60, 0.08);
  color: #e74c3c;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
}

.remove-btn:hover {
  background: rgba(231, 76, 60, 0.2);
  border-color: rgba(231, 76, 60, 0.5);
  transform: scale(1.05);
}

/* TOTAL */
.total-box {
  margin-top: 24px;
  background: linear-gradient(145deg, #1e1810 0%, #16120c 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 14px;
  padding: 22px 26px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.total-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.total-label span {
  font-size: 0.9rem;
  color: #a89f8d;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.total-label strong {
  font-family: 'Cinzel', serif;
  font-size: 1.6rem;
  color: #f1d98a;
}

.finish-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
  border: none;
  padding: 14px 28px;
  border-radius: 10px;
  color: #0f0a05;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(212, 175, 55, 0.25);
}

.finish-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(212, 175, 55, 0.4);
}

.finish-btn:active {
  transform: translateY(0);
}

/* ============ MODAL ============ */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 5, 2, 0.85);
  backdrop-filter: blur(6px);
  padding: 20px;
}

.modal-content {
  position: relative;
  background: linear-gradient(160deg, #1e1810 0%, #140e08 100%);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 16px;
  padding: 48px 40px 36px;
  max-width: 440px;
  width: 100%;
  text-align: center;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7),
              0 0 0 1px rgba(212, 175, 55, 0.1);
}

.modal-content.error {
  border-color: rgba(231, 76, 60, 0.3);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7),
              0 0 0 1px rgba(231, 76, 60, 0.1);
}

.modal-content.error .corner {
  border-color: #c0392b;
}

/* SELO */
.seal {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d4af37, #b8941f);
  color: #0f0a05;
  font-family: 'Cinzel', serif;
  font-size: 1.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.15),
              0 0 30px rgba(212, 175, 55, 0.3);
  animation: pulseSeal 2s ease-in-out infinite;
}

.error-seal {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  box-shadow: 0 0 0 4px rgba(231, 76, 60, 0.15),
              0 0 30px rgba(231, 76, 60, 0.3);
}

.modal-title {
  font-family: 'Cinzel', serif;
  font-size: 1.5rem;
  color: #f1d98a;
  margin: 0 0 12px;
  letter-spacing: 1px;
}

.modal-text {
  font-family: 'Crimson Text', serif;
  font-size: 1.05rem;
  color: #c4b89a;
  line-height: 1.7;
  margin: 0 0 28px;
}

/* BOTÃO MODAL */
.modal-btn {
  display: inline-block;
  padding: 12px 32px;
  border-radius: 10px;
  border: 1px solid rgba(212, 175, 55, 0.4);
  background: rgba(212, 175, 55, 0.08);
  color: #f1d98a;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.8px;
  transition: all 0.3s ease;
}

.modal-btn:hover {
  background: rgba(212, 175, 55, 0.18);
  border-color: rgba(212, 175, 55, 0.6);
  transform: translateY(-2px);
}

.error-btn {
  border-color: rgba(231, 76, 60, 0.4);
  background: rgba(231, 76, 60, 0.08);
  color: #e88a80;
}

.error-btn:hover {
  background: rgba(231, 76, 60, 0.18);
  border-color: rgba(231, 76, 60, 0.6);
}

/* TRANSICAO */
.pop-enter-active,
.pop-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.92) rotateX(6deg);
}

.pop-enter-to,
.pop-leave-from {
  opacity: 1;
  transform: scale(1) rotateX(0);
}

/* RESPONSIVO */
@media (max-width: 640px) {
  .cart-page {
    padding: 24px 16px;
  }
  
  .title {
    font-size: 1.5rem;
  }
  
  .cart-item {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    gap: 14px;
  }
  
  .item-image-wrap {
    width: 100%;
    height: 180px;
    align-self: center;
  }
  
  .info h2 {
    white-space: normal;
  }
  
  .item-meta {
    justify-content: center;
  }
  
  .remove-btn {
    align-self: center;
  }
  
  .total-box {
    flex-direction: column;
    text-align: center;
  }
  
  .total-label strong {
    font-size: 1.3rem;
  }
  
  .modal-content {
    padding: 36px 24px 28px;
  }
}

.qty-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(212, 175, 55, 0.08);
  padding: 4px 10px;
  border-radius: 20px;
  width: fit-content;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(212, 175, 55, 0.3);
  background: rgba(212, 175, 55, 0.12);
  color: #f1d98a;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:hover {
  background: rgba(212, 175, 55, 0.25);
  transform: scale(1.08);
}

.qty-btn:active {
  transform: scale(0.95);
}

.address-box {
  margin-top: 24px;
  background: linear-gradient(145deg, #1e1810 0%, #16120c 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 14px;
  padding: 24px;
}

.address-box h2 {
  font-family: 'Cinzel', serif;
  color: #f1d98a;
  margin-bottom: 18px;
}

.address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.address-grid input {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(212,175,55,0.2);
  border-radius: 10px;
  padding: 14px;
  color: #f5e6c8;
  outline: none;
  transition: 0.25s;
}

.address-grid input:focus {
  border-color: #d4af37;
  box-shadow: 0 0 12px rgba(212,175,55,0.2);
}

.address-grid input::placeholder {
  color: #9e927d;
}

/* =========================================
   SUCCESS MODAL PREMIUM
========================================= */

.success-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;

  display: flex;
  align-items: center;
  justify-content: center;

  background:
    radial-gradient(circle at center,
      rgba(212,175,55,0.08),
      rgba(0,0,0,0.92)
    );

  backdrop-filter: blur(8px);
  padding: 20px;
}

.success-modal {
  position: relative;

  width: 100%;
  max-width: 480px;

  padding: 46px 38px;

  border-radius: 24px;

  overflow: hidden;

  background:
    linear-gradient(
      145deg,
      #1d160d 0%,
      #120d08 100%
    );

  border: 1px solid rgba(212,175,55,0.25);

  box-shadow:
    0 30px 80px rgba(0,0,0,0.7),
    0 0 60px rgba(212,175,55,0.08);

  text-align: center;
}

.success-glow {
  position: absolute;

  width: 320px;
  height: 320px;

  background: radial-gradient(
    circle,
    rgba(212,175,55,0.18),
    transparent 70%
  );

  top: -160px;
  left: 50%;
  transform: translateX(-50%);
}

.success-icon-wrap {
  position: relative;
  z-index: 2;
}

.success-icon {
  width: 92px;
  height: 92px;

  margin: 0 auto 26px;

  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 2.4rem;
  font-weight: bold;

  color: #1a1308;

  background:
    linear-gradient(
      135deg,
      #f1d98a,
      #d4af37
    );

  box-shadow:
    0 0 0 10px rgba(212,175,55,0.08),
    0 0 40px rgba(212,175,55,0.35);

  animation: successPulse 2.5s infinite;
}

@keyframes successPulse {
  0%,100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.08);
  }
}

.success-title {
  position: relative;
  z-index: 2;

  font-family: 'Cinzel', serif;

  font-size: 2rem;
  color: #f5e6b3;

  margin-bottom: 10px;

  letter-spacing: 1px;
}

.success-subtitle {
  position: relative;
  z-index: 2;

  color: #cdbb98;

  font-size: 1rem;

  margin-bottom: 28px;
}

.success-summary {
  position: relative;
  z-index: 2;

  background: rgba(255,255,255,0.03);

  border: 1px solid rgba(212,175,55,0.12);

  border-radius: 16px;

  padding: 20px;

  margin-bottom: 24px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 10px 0;

  color: #d9c8a8;

  font-size: 1rem;
}

.summary-row strong {
  color: #f1d98a;
  font-family: 'Cinzel', serif;
}

.status {
  color: #8ddc7f !important;
}

.success-message {
  position: relative;
  z-index: 2;

  color: #a89f8d;

  line-height: 1.7;

  margin-bottom: 30px;
}

.success-button {
  position: relative;
  z-index: 2;

  border: none;

  padding: 14px 34px;

  border-radius: 14px;

  background:
    linear-gradient(
      135deg,
      #d4af37,
      #b8941f
    );

  color: #120d08;

  font-family: 'Cinzel', serif;
  font-weight: 700;

  cursor: pointer;

  transition: 0.3s;
}

.success-button:hover {
  transform: translateY(-3px);

  box-shadow:
    0 10px 30px rgba(212,175,55,0.3);
}

/* animação */

.checkout-success-enter-active,
.checkout-success-leave-active {
  transition: all 0.4s ease;
}

.checkout-success-enter-from,
.checkout-success-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* WARNING MODAL */

.modal-content.warning {
  border-color: rgba(241, 196, 15, 0.35);

  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(241, 196, 15, 0.15);
}

.warning-seal {
  background: linear-gradient(
    135deg,
    #f1c40f,
    #d4a017
  );

  color: #1a1205;

  box-shadow:
    0 0 0 4px rgba(241, 196, 15, 0.15),
    0 0 30px rgba(241, 196, 15, 0.3);
}

.warning-btn {
  border-color: rgba(241, 196, 15, 0.4);

  background: rgba(241, 196, 15, 0.08);

  color: #f5d76e;
}

.warning-btn:hover {
  background: rgba(241, 196, 15, 0.18);

  border-color: rgba(241, 196, 15, 0.65);
}

</style>