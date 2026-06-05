<template>
  <div class="checkout-page">

    <div class="checkout-container">

      <!-- HEADER -->
      <div class="checkout-header">
        <h1>🦴 Finalizar Compra</h1>

        <p>
          Informe o endereço para entrega dos seus fósseis e itens paleontológicos.
        </p>
      </div>

      <!-- FORM -->
      <div class="checkout-card">

        <div class="form-grid">

          <!-- CEP -->
          <div class="field">
            <label>CEP</label>

            <input
              v-model="cep"
              type="text"
              placeholder="00000-000"
            />
          </div>

          <!-- RUA -->
          <div class="field full">
            <label>Rua</label>

            <input
              v-model="rua"
              type="text"
              placeholder="Rua dos Dinossauros"
            />
          </div>

          <!-- NUMERO -->
          <div class="field">
            <label>Número</label>

            <input
              v-model="numero"
              type="text"
              placeholder="123"
            />
          </div>

          <!-- BAIRRO -->
          <div class="field">
            <label>Bairro</label>

            <input
              v-model="bairro"
              type="text"
              placeholder="Centro"
            />
          </div>

          <!-- CIDADE -->
          <div class="field">
            <label>Cidade</label>

            <input
              v-model="cidade"
              type="text"
              placeholder="Belo Horizonte"
            />
          </div>

          <!-- ESTADO -->
          <div class="field">
            <label>Estado</label>

            <input
              v-model="estado"
              type="text"
              placeholder="MG"
            />
          </div>

        </div>

        <!-- BUTTON -->
        <button
          class="checkout-btn"
          @click="finishOrder"
          :disabled="loading"
        >
          {{
            loading
              ? "Finalizando..."
              : "🛒 Finalizar Pedido"
          }}
        </button>

      </div>

    </div>

    <!-- SUCCESS -->
<Teleport to="body">
  <Transition name="pop">

    <div
      v-if="showSuccessModal"
      class="modal-overlay"
      @click.self="closeModals"
    >

      <div class="modal-content success">

        <div class="seal success-seal">
          ✓
        </div>

        <h2 class="modal-title">
          Pedido Confirmado
        </h2>

        <p class="modal-text">
          Sua expedição foi registrada com sucesso.
          <br />
          Os fósseis estão sendo preparados para envio.
        </p>

        <button
          class="modal-btn success-btn"
          @click="finishSuccess"
        >
          Ver Minha Expedição
        </button>

      </div>

    </div>

  </Transition>
</Teleport>

<!-- ERROR -->
<Teleport to="body">
  <Transition name="pop">

    <div
      v-if="showErrorModal"
      class="modal-overlay"
      @click.self="closeModals"
    >

      <div class="modal-content error">

        <div class="seal error-seal">
          !
        </div>

        <h2 class="modal-title">
          Falha na Expedição
        </h2>

        <p class="modal-text">
          Não foi possível finalizar seu pedido.
        </p>

        <button
          class="modal-btn error-btn"
          @click="closeModals"
        >
          Tentar Novamente
        </button>

      </div>

    </div>

  </Transition>
</Teleport>

<!-- WARNING -->
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
<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../../services/api";

const router = useRouter();

/* =========================
   FORM
========================= */

const cep = ref("");
const rua = ref("");
const numero = ref("");
const bairro = ref("");
const cidade = ref("");
const estado = ref("");

const loading = ref(false);

const showSuccessModal = ref(false);
const showErrorModal = ref(false);

const warningMessage = ref("");
const showWarningModal = ref(false);

/* =========================
   MODAIS
========================= */

function closeModals() {
  showSuccessModal.value = false;
  showErrorModal.value = false;
  showWarningModal.value = false;
}

function finishSuccess() {
  closeModals();

  router.push("/profile");
}

/* =========================
   FINALIZAR PEDIDO
========================= */

const finishOrder = async () => {

  if (
    !cep.value ||
    !rua.value ||
    !numero.value ||
    !bairro.value ||
    !cidade.value ||
    !estado.value
  ) {
    warningMessage.value =
      "Preencha todos os campos obrigatórios da expedição.";

    showWarningModal.value = true;

    return;
  }

  try {

    loading.value = true;

    await api.post("/orders", {
      cep: cep.value,
      rua: rua.value,
      numero: numero.value,
      bairro: bairro.value,
      cidade: cidade.value,
      estado: estado.value
    });

    showSuccessModal.value = true;

  } catch (err) {

    console.error(err);

    showErrorModal.value = true;

  } finally {

    loading.value = false;

  }

};
</script>

<style scoped>
.checkout-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(212,175,55,0.08), transparent 40%),
    radial-gradient(circle at bottom right, rgba(141,107,63,0.08), transparent 40%),
    #0b0a08;
  padding: 40px 20px;
  color: #f5e6c8;
  font-family: 'Crimson Text', serif;
}

.checkout-container {
  max-width: 900px;
  margin: 0 auto;
}

.checkout-header {
  margin-bottom: 30px;
}

.checkout-header h1 {
  font-family: 'Cinzel', serif;
  color: #f1d98a;
  font-size: 2rem;
  margin-bottom: 10px;
}

.checkout-header p {
  color: #bba980;
  font-size: 1rem;
}

.checkout-card {
  background: linear-gradient(145deg, #16120c, #0e0a06);
  border: 1px solid #3a2f1d;
  border-radius: 18px;
  padding: 30px;
  box-shadow:
    0 20px 40px rgba(0,0,0,0.45),
    0 0 20px rgba(212,175,55,0.05);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field.full {
  grid-column: span 2;
}

.field label {
  font-family: 'Cinzel', serif;
  color: #d4af37;
  font-size: 0.85rem;
  letter-spacing: 1px;
}

.field input {
  background: rgba(255,255,255,0.04);
  border: 1px solid #3a2f1d;
  border-radius: 10px;
  padding: 14px;
  color: #f5e6c8;
  font-size: 1rem;
  outline: none;
  transition: all 0.25s ease;
}

.field input:focus {
  border-color: #d4af37;
  box-shadow: 0 0 0 3px rgba(212,175,55,0.12);
}

.checkout-btn {
  margin-top: 30px;
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #d4af37, #8d6b3f);
  color: #0b0a08;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.25s ease;
}

.checkout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(212,175,55,0.25);
}

.checkout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 700px) {

  .form-grid {
    grid-template-columns: 1fr;
  }

  .field.full {
    grid-column: span 1;
  }

}

/* =========================
   MODAIS
========================= */

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  background: rgba(0,0,0,0.82);

  backdrop-filter: blur(6px);
}

.modal-content {
  width: 100%;
  max-width: 420px;

  padding: 40px 32px;

  border-radius: 20px;

  background:
    linear-gradient(
      145deg,
      #16120c,
      #0e0a06
    );

  border: 1px solid rgba(212,175,55,0.25);

  text-align: center;

  box-shadow:
    0 25px 60px rgba(0,0,0,0.65);
}

.seal {
  width: 74px;
  height: 74px;

  margin: 0 auto 24px;

  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 2rem;
  font-weight: bold;

  color: #120d08;
}

.success-seal {
  background: linear-gradient(135deg,#f1d98a,#d4af37);
}

.error-seal {
  background: linear-gradient(135deg,#ff6b6b,#c0392b);
}

.warning-seal {
  background: linear-gradient(135deg,#f1c40f,#d4a017);
}

.modal-title {
  font-family: 'Cinzel', serif;

  color: #f1d98a;

  font-size: 1.7rem;

  margin-bottom: 16px;
}

.modal-text {
  color: #c9b896;

  line-height: 1.7;

  margin-bottom: 28px;
}

.modal-btn {
  border: none;

  padding: 14px 28px;

  border-radius: 12px;

  cursor: pointer;

  font-family: 'Cinzel', serif;
  font-weight: 700;

  transition: 0.25s;
}

.success-btn {
  background: linear-gradient(135deg,#d4af37,#8d6b3f);
  color: #120d08;
}

.error-btn {
  background: linear-gradient(135deg,#e74c3c,#992d22);
  color: white;
}

.warning-btn {
  background: linear-gradient(135deg,#f1c40f,#b8860b);
  color: #120d08;
}

.modal-btn:hover {
  transform: translateY(-2px);
}

.pop-enter-active,
.pop-leave-active {
  transition: all 0.3s ease;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

</style>