<template>
  <div class="checkout-page">

    <!-- Aged paper texture overlay -->
    <div class="paper-texture" aria-hidden="true"></div>
    <div class="vignette" aria-hidden="true"></div>

    <div class="checkout-container">

      <!-- HEADER -->
      <header class="checkout-header">

        <!-- Ornament top -->
        <svg
          class="ornament"
          viewBox="0 0 400 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M0 12 H160 M240 12 H400"
            stroke="currentColor"
            stroke-width="1"
            stroke-linecap="round"
          />
          <path
            d="M170 12 q10 -10 20 0 q10 10 20 0"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
          />
          <circle cx="200" cy="12" r="2.5" fill="currentColor" />
          <circle cx="170" cy="12" r="1.2" fill="currentColor" />
          <circle cx="230" cy="12" r="1.2" fill="currentColor" />
        </svg>

        <div class="kicker">Museu Paleontológico · Expedição N.º 042</div>

        <h1 class="checkout-title">
          <span class="title-fossil" aria-hidden="true">
            <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 40c0-10 8-18 18-18 6 0 10 3 12 6 3 4 8 4 10 1"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
              />
              <circle cx="30" cy="30" r="2" fill="currentColor" />
              <path
                d="M14 44c4 4 12 6 20 4 6-1 12-5 16-10"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-dasharray="1 3"
              />
            </svg>
          </span>
          Finalizar Expedição
        </h1>

        <p class="checkout-subtitle">
          Registre o destino para o envio dos seus fósseis e relíquias paleontológicas.
          Cada peça é catalogada e despachada com selo do curador.
        </p>

      </header>

      <!-- FORM CARD -->
      <section class="checkout-card">

        <!-- Corner stamps -->
        <span class="corner corner-tl" aria-hidden="true"></span>
        <span class="corner corner-tr" aria-hidden="true"></span>
        <span class="corner corner-bl" aria-hidden="true"></span>
        <span class="corner corner-br" aria-hidden="true"></span>

        <h2 class="section-title">
          <span class="section-num">I.</span>
          Coordenadas de Entrega
        </h2>

        <div class="form-grid">

          <!-- CEP -->
          <div class="field">
            <label for="cep">
              CEP
              <span class="hint">{{ cepLoading ? "buscando..." : "" }}</span>
            </label>
            <input
              id="cep"
              v-model="cep"
              type="text"
              inputmode="numeric"
              maxlength="9"
              placeholder="00000-000"
              :class="{ invalid: errors.cep, valid: touched.cep && !errors.cep }"
              @input="onCepInput"
              @blur="touched.cep = true; lookupCep()"
              autocomplete="postal-code"
            />
            <span v-if="errors.cep" class="error-msg">{{ errors.cep }}</span>
          </div>

          <!-- ESTADO -->
          <div class="field">
            <label for="estado">Estado (UF)</label>
            <div class="select-wrap">
              <select
                id="estado"
                v-model="estado"
                :class="{ invalid: errors.estado, valid: touched.estado && !errors.estado }"
                @change="touched.estado = true"
                @blur="touched.estado = true"
              >
                <option value="" disabled>Selecione...</option>
                <option v-for="uf in ufs" :key="uf.sigla" :value="uf.sigla">
                  {{ uf.sigla }} — {{ uf.nome }}
                </option>
              </select>
              <svg class="select-arrow" viewBox="0 0 12 8" aria-hidden="true">
                <path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>
              </svg>
            </div>
            <span v-if="errors.estado" class="error-msg">{{ errors.estado }}</span>
          </div>

          <!-- RUA -->
          <div class="field full">
            <label for="rua">Rua / Logradouro</label>
            <input
              id="rua"
              v-model="rua"
              type="text"
              maxlength="80"
              placeholder="Ex.: Avenida dos Paleontólogos"
              :class="{ invalid: errors.rua, valid: touched.rua && !errors.rua }"
              @blur="touched.rua = true"
              autocomplete="street-address"
            />
            <span v-if="errors.rua" class="error-msg">{{ errors.rua }}</span>
          </div>

          <!-- NUMERO -->
          <div class="field">
            <label for="numero">
              Número
              <label class="inline-check">
                <input type="checkbox" v-model="semNumero" @change="onSemNumero" />
                <span>Sem número</span>
              </label>
            </label>
            <input
              id="numero"
              v-model="numero"
              type="text"
              inputmode="numeric"
              maxlength="6"
              :disabled="semNumero"
              :placeholder="semNumero ? 'S/N' : '123'"
              :class="{ invalid: errors.numero, valid: touched.numero && !errors.numero }"
              @input="onNumeroInput"
              @blur="touched.numero = true"
            />
            <span v-if="errors.numero" class="error-msg">{{ errors.numero }}</span>
          </div>

          <!-- BAIRRO -->
          <div class="field">
            <label for="bairro">Bairro</label>
            <input
              id="bairro"
              v-model="bairro"
              type="text"
              maxlength="60"
              placeholder="Ex.: Centro Histórico"
              :class="{ invalid: errors.bairro, valid: touched.bairro && !errors.bairro }"
              @blur="touched.bairro = true"
            />
            <span v-if="errors.bairro" class="error-msg">{{ errors.bairro }}</span>
          </div>

          <!-- CIDADE -->
          <div class="field full">
            <label for="cidade">Cidade</label>
            <input
              id="cidade"
              v-model="cidade"
              type="text"
              maxlength="60"
              placeholder="Ex.: Belo Horizonte"
              :class="{ invalid: errors.cidade, valid: touched.cidade && !errors.cidade }"
              @blur="touched.cidade = true"
              autocomplete="address-level2"
            />
            <span v-if="errors.cidade" class="error-msg">{{ errors.cidade }}</span>
          </div>

        </div>

        <!-- Divider ornament -->
        <div class="divider" aria-hidden="true">
          <svg viewBox="0 0 400 16" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 8 H180" stroke="currentColor" stroke-width="0.8" />
            <path d="M220 8 H400" stroke="currentColor" stroke-width="0.8" />
            <path
              d="M186 8 l7 -6 7 6 7 -6 7 6"
              fill="none"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <!-- BUTTON -->
        <button
          class="checkout-btn"
          @click="finishOrder"
          :disabled="loading || !isFormValid"
        >
          <span class="btn-inner">
            <svg class="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 7h16l-1.5 11a2 2 0 0 1-2 1.7H7.5A2 2 0 0 1 5.5 18L4 7Z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
              <path
                d="M9 7V5a3 3 0 0 1 6 0v2"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
              />
            </svg>
            {{ loading ? "Selando expedição..." : "Selar e Finalizar Pedido" }}
          </span>
        </button>

        <p class="legal">
          Ao confirmar, você concorda com os termos da Curadoria.
          Cada fóssil é embalado em caixa-relicário com certificado de origem.
        </p>

      </section>

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
            <span class="corner corner-tl" aria-hidden="true"></span>
            <span class="corner corner-tr" aria-hidden="true"></span>
            <span class="corner corner-bl" aria-hidden="true"></span>
            <span class="corner corner-br" aria-hidden="true"></span>

            <div class="seal success-seal">
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M7 16l5 5 12-12" stroke="currentColor" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <h2 class="modal-title">Pedido Confirmado</h2>

            <p class="modal-text">
              Sua expedição foi registrada com sucesso.<br />
              Os fósseis estão sendo preparados pelo curador.
            </p>

            <button class="modal-btn success-btn" @click="finishSuccess">
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
            <span class="corner corner-tl" aria-hidden="true"></span>
            <span class="corner corner-tr" aria-hidden="true"></span>
            <span class="corner corner-bl" aria-hidden="true"></span>
            <span class="corner corner-br" aria-hidden="true"></span>

            <div class="seal error-seal">
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M9 9l14 14M23 9L9 23" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
              </svg>
            </div>

            <h2 class="modal-title">Falha na Expedição</h2>

            <p class="modal-text">
              Não foi possível finalizar seu pedido.<br />
              Verifique sua conexão e tente novamente.
            </p>

            <button class="modal-btn error-btn" @click="closeModals">
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
            <span class="corner corner-tl" aria-hidden="true"></span>
            <span class="corner corner-tr" aria-hidden="true"></span>
            <span class="corner corner-bl" aria-hidden="true"></span>
            <span class="corner corner-br" aria-hidden="true"></span>

            <div class="seal warning-seal">
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M16 7v11" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
                <circle cx="16" cy="23" r="1.8" fill="currentColor"/>
              </svg>
            </div>

            <h2 class="modal-title">Atenção, Explorador</h2>

            <p class="modal-text">{{ warningMessage }}</p>

            <button class="modal-btn warning-btn" @click="closeModals">
              Entendido
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { useRouter } from "vue-router";
import api from "../../services/api";

const router = useRouter();

/* =========================
   ESTADOS BRASILEIROS (UFs)
========================= */
const ufs = [
  { sigla: "AC", nome: "Acre" }, { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" }, { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" }, { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" }, { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" }, { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" }, { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" }, { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" }, { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" }, { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" }, { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" }, { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" }, { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" }, { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" }
];
const ufSiglas = ufs.map(u => u.sigla);

/* =========================
   FORM STATE
========================= */
const cep = ref("");
const rua = ref("");
const numero = ref("");
const semNumero = ref(false);
const bairro = ref("");
const cidade = ref("");
const estado = ref("");

const loading = ref(false);
const cepLoading = ref(false);

const showSuccessModal = ref(false);
const showErrorModal = ref(false);
const warningMessage = ref("");
const showWarningModal = ref(false);

const touched = reactive({
  cep: false, rua: false, numero: false,
  bairro: false, cidade: false, estado: false
});

/* =========================
   MASKS
========================= */
function onCepInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, "").slice(0, 8);
  cep.value = raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
}

function onNumeroInput(e: Event) {
  numero.value = (e.target as HTMLInputElement).value.replace(/\D/g, "").slice(0, 6);
}

function onSemNumero() {
  if (semNumero.value) {
    numero.value = "S/N";
    touched.numero = true;
  } else {
    numero.value = "";
  }
}

/* =========================
   VALIDAÇÕES
========================= */
const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s.,'°ºª/-]{2,}$/;

const errors = computed(() => {
  const e: Record<string, string> = {};

  // CEP
  const cepDigits = cep.value.replace(/\D/g, "");
  if (!cepDigits) e.cep = "Informe o CEP.";
  else if (cepDigits.length !== 8) e.cep = "CEP deve ter 8 dígitos.";
  else if (/^(\d)\1+$/.test(cepDigits)) e.cep = "CEP inválido.";

  // Rua
  if (!rua.value.trim()) e.rua = "Informe a rua.";
  else if (rua.value.trim().length < 3) e.rua = "Rua muito curta.";

  // Número
  if (!semNumero.value) {
    if (!numero.value) e.numero = "Informe o número.";
    else if (!/^\d{1,6}$/.test(numero.value)) e.numero = "Apenas dígitos (1 a 6).";
    else if (Number(numero.value) === 0) e.numero = "Número inválido.";
  }

  // Bairro
  if (!bairro.value.trim()) e.bairro = "Informe o bairro.";
  else if (!nameRegex.test(bairro.value.trim())) e.bairro = "Bairro inválido.";

  // Cidade
  if (!cidade.value.trim()) e.cidade = "Informe a cidade.";
  else if (!nameRegex.test(cidade.value.trim())) e.cidade = "Cidade inválida.";
  else if (cidade.value.trim().length < 2) e.cidade = "Cidade muito curta.";

  // Estado
  if (!estado.value) e.estado = "Selecione o estado.";
  else if (!ufSiglas.includes(estado.value)) e.estado = "UF inválida.";

  return e;
});

const isFormValid = computed(() => Object.keys(errors.value).length === 0);

// Marcar como tocado ao digitar (após primeiro blur)
watch([cep, rua, numero, bairro, cidade], () => { /* live revalidation */ });

/* =========================
   VIA CEP
========================= */
async function lookupCep() {
  const cepDigits = cep.value.replace(/\D/g, "");
  if (cepDigits.length !== 8) return;
  try {
    cepLoading.value = true;
    const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
    const data = await res.json();
    if (data && !data.erro) {
      if (data.logradouro) { rua.value = data.logradouro; touched.rua = true; }
      if (data.bairro)     { bairro.value = data.bairro; touched.bairro = true; }
      if (data.localidade) { cidade.value = data.localidade; touched.cidade = true; }
      if (data.uf && ufSiglas.includes(data.uf)) {
        estado.value = data.uf;
        touched.estado = true;
      }
    }
  } catch {
    // silencioso — usuário pode digitar manualmente
  } finally {
    cepLoading.value = false;
  }
}

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
  // marca tudo como tocado para exibir erros
  Object.keys(touched).forEach(k => (touched[k as keyof typeof touched] = true));

  if (!isFormValid.value) {
    warningMessage.value =
      "Verifique os campos destacados antes de selar a expedição.";
    showWarningModal.value = true;
    return;
  }

  try {
    loading.value = true;
    await api.post("/orders", {
      cep: cep.value,
      rua: rua.value.trim(),
      numero: numero.value,
      bairro: bairro.value.trim(),
      cidade: cidade.value.trim(),
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
/* =========================
   BASE / PAPER
========================= */
.checkout-page {
  position: relative;
  min-height: 100vh;
  padding: 56px 20px 80px;
  color: #2a1d10;
  font-family: 'Cormorant Garamond', 'Crimson Text', Georgia, serif;
  background:
    radial-gradient(ellipse at 20% 10%, #f3e4c2 0%, transparent 55%),
    radial-gradient(ellipse at 80% 90%, #e6cf9d 0%, transparent 50%),
    linear-gradient(180deg, #f0dfb8 0%, #e7d2a3 100%);
  overflow-x: hidden;
}

.paper-texture {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.5;
  mix-blend-mode: multiply;
  background-image:
    radial-gradient(circle at 12% 18%, rgba(120,82,40,0.18) 0 1px, transparent 1.5px),
    radial-gradient(circle at 78% 32%, rgba(120,82,40,0.14) 0 1.2px, transparent 1.6px),
    radial-gradient(circle at 42% 70%, rgba(80,50,20,0.16) 0 0.8px, transparent 1.2px),
    radial-gradient(circle at 88% 82%, rgba(120,82,40,0.18) 0 1.4px, transparent 1.8px),
    repeating-linear-gradient(115deg, rgba(140,100,55,0.06) 0 2px, transparent 2px 7px),
    repeating-linear-gradient(25deg, rgba(110,75,35,0.05) 0 1px, transparent 1px 5px);
}

.vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(ellipse at center, transparent 55%, rgba(60,35,10,0.35) 100%);
}

.checkout-container {
  position: relative;
  z-index: 1;
  max-width: 760px;
  margin: 0 auto;
}

/* =========================
   HEADER
========================= */
.checkout-header {
  text-align: center;
  margin-bottom: 32px;
  color: #4a311a;
}

.ornament {
  width: min(380px, 90%);
  height: 22px;
  color: #6b4523;
  margin: 0 auto 14px;
  display: block;
  opacity: 0.85;
}

.kicker {
  font-family: 'Cinzel', 'Cormorant Garamond', serif;
  letter-spacing: 4px;
  font-size: 0.72rem;
  text-transform: uppercase;
  color: #8a6435;
  margin-bottom: 10px;
}

.checkout-title {
  font-family: 'Cinzel', 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: clamp(1.9rem, 4vw, 2.6rem);
  color: #3a2410;
  margin: 0 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  line-height: 1.1;
}

.title-fossil {
  display: inline-flex;
  width: 44px;
  height: 44px;
  color: #6b4523;
}
.title-fossil svg { width: 100%; height: 100%; }

.checkout-subtitle {
  max-width: 560px;
  margin: 0 auto;
  color: #6b4f30;
  font-size: 1.05rem;
  line-height: 1.55;
  font-style: italic;
}

/* =========================
   CARD
========================= */
.checkout-card {
  position: relative;
  background:
    linear-gradient(180deg, rgba(168, 147, 88, 0.92), rgba(248, 233, 198, 0.85));
  border: 1px solid #b89464;
  border-radius: 4px;
  padding: 44px 38px 36px;
  box-shadow:
    0 1px 0 rgba(255,255,255,0.6) inset,
    0 0 0 1px rgba(120,82,40,0.15) inset,
    0 24px 60px -20px rgba(80,50,20,0.45),
    0 4px 12px rgba(80,50,20,0.18);
}

/* Decorative corners (fleur-de-coin) */
.corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border: 1px solid #8a6435;
  opacity: 0.7;
}
.corner-tl { top: 10px; left: 10px;  border-right: none; border-bottom: none; }
.corner-tr { top: 10px; right: 10px; border-left: none;  border-bottom: none; }
.corner-bl { bottom: 10px; left: 10px;  border-right: none; border-top: none; }
.corner-br { bottom: 10px; right: 10px; border-left: none;  border-top: none; }

.section-title {
  font-family: 'Cinzel', serif;
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #5a3a1c;
  margin: 0 0 22px;
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.section-num {
  font-family: 'Cinzel', serif;
  color: #a3742d;
  font-size: 1.1rem;
}

/* =========================
   GRID
========================= */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 22px 24px;
}
.field { display: flex; flex-direction: column; gap: 6px; }
.field.full { grid-column: span 2; }

.field label {
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: #6b4523;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.hint {
  font-family: 'Cormorant Garamond', serif;
  text-transform: none;
  letter-spacing: 0.5px;
  font-size: 0.78rem;
  font-style: italic;
  color: #a3742d;
}

.inline-check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  letter-spacing: 1.5px;
  color: #8a6435;
  cursor: pointer;
  text-transform: none;
}
.inline-check input { accent-color: #6b4523; }

/* Inputs */
.field input,
.field select {
  background: rgba(255, 250, 235, 0.85);
  border: none;
  border-bottom: 1.5px solid #b89464;
  border-radius: 2px;
  padding: 10px 4px 10px;
  color: #2a1d10;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.1rem;
  outline: none;
  transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
  box-shadow: inset 0 -1px 0 rgba(110,75,35,0.08);
}
.field input::placeholder { color: #b89464; font-style: italic; }

.field input:focus,
.field select:focus {
  border-bottom-color: #6b4523;
  background: rgba(255, 252, 240, 1);
  box-shadow: inset 0 -2px 0 #a3742d;
}
.field input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.field input.valid,
.field select.valid {
  border-bottom-color: #6b8e3c;
  box-shadow: inset 0 -2px 0 #6b8e3c;
}
.field input.invalid,
.field select.invalid {
  border-bottom-color: #a8341f;
  box-shadow: inset 0 -2px 0 #a8341f;
  background: rgba(255, 235, 225, 0.7);
}

.select-wrap { position: relative; }
.field select {
  appearance: none;
  width: 100%;
  padding-right: 28px;
  cursor: pointer;
}
.select-arrow {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 8px;
  color: #6b4523;
  pointer-events: none;
}

.error-msg {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.88rem;
  color: #a8341f;
  margin-top: 2px;
  letter-spacing: 0.3px;
}

/* =========================
   DIVIDER
========================= */
.divider {
  margin: 32px auto 24px;
  width: min(420px, 100%);
  color: #8a6435;
  opacity: 0.7;
}
.divider svg { width: 100%; height: 14px; display: block; }

/* =========================
   BUTTON
========================= */
.checkout-btn {
  position: relative;
  width: 100%;
  padding: 16px 20px;
  border: 1px solid #6b4523;
  border-radius: 3px;
  background:
    linear-gradient(180deg, #c8943f 0%, #a3742d 55%, #8a5e1f 100%);
  color: #fff8e0;
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.25s ease;
  box-shadow:
    0 1px 0 rgba(255,235,180,0.4) inset,
    0 -2px 0 rgba(60,35,10,0.25) inset,
    0 10px 24px -8px rgba(80,50,20,0.6);
}
.checkout-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.05);
  box-shadow:
    0 1px 0 rgba(255,235,180,0.4) inset,
    0 -2px 0 rgba(60,35,10,0.25) inset,
    0 16px 30px -10px rgba(80,50,20,0.7);
}
.checkout-btn:active:not(:disabled) { transform: translateY(0); }
.checkout-btn:disabled {
  background: linear-gradient(180deg, #c9b88a, #a89466);
  color: #f5e6c8;
  cursor: not-allowed;
  filter: grayscale(0.3);
  opacity: 0.85;
}
.btn-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.btn-icon { width: 18px; height: 18px; }

.legal {
  margin: 16px 4px 0;
  text-align: center;
  font-size: 0.82rem;
  font-style: italic;
  color: #8a6435;
  line-height: 1.5;
}

/* =========================
   RESPONSIVE
========================= */
@media (max-width: 720px) {
  .checkout-card { padding: 36px 22px 28px; }
  .form-grid { grid-template-columns: 1fr; gap: 18px; }
  .field.full { grid-column: span 1; }
  .checkout-title { gap: 10px; }
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
  background: rgba(40, 25, 10, 0.55);
  backdrop-filter: blur(8px);
}
.modal-content {
  position: relative;
  width: 100%;
  max-width: 440px;
  padding: 44px 34px 36px;
  border-radius: 4px;
  text-align: center;
  background:
    linear-gradient(180deg, #fdf3d8, #f0dfb8);
  border: 1px solid #8a6435;
  box-shadow:
    0 1px 0 rgba(255,255,255,0.6) inset,
    0 30px 70px rgba(40,25,10,0.6);
  color: #3a2410;
}

.seal {
  width: 74px;
  height: 74px;
  margin: 0 auto 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff8e0;
  box-shadow:
    0 1px 0 rgba(255,255,255,0.45) inset,
    0 -2px 0 rgba(0,0,0,0.18) inset,
    0 8px 18px rgba(80,50,20,0.45);
}
.seal svg { width: 38px; height: 38px; }

.success-seal { background: radial-gradient(circle at 30% 30%, #c8943f, #6b4523); }
.error-seal   { background: radial-gradient(circle at 30% 30%, #c0392b, #6b1a10); }
.warning-seal { background: radial-gradient(circle at 30% 30%, #d4a017, #8a5e1f); }

.modal-title {
  font-family: 'Cinzel', serif;
  font-weight: 600;
  color: #3a2410;
  font-size: 1.5rem;
  letter-spacing: 2px;
  margin: 0 0 12px;
}
.modal-text {
  color: #6b4f30;
  line-height: 1.65;
  margin-bottom: 26px;
  font-size: 1.05rem;
}

.modal-btn {
  border: 1px solid #6b4523;
  padding: 12px 26px;
  border-radius: 3px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  transition: transform 0.2s ease, filter 0.2s ease;
}
.success-btn {
  background: linear-gradient(180deg, #c8943f, #8a5e1f);
  color: #fff8e0;
}
.error-btn {
  background: linear-gradient(180deg, #c0392b, #6b1a10);
  color: #fff8e0;
  border-color: #6b1a10;
}
.warning-btn {
  background: linear-gradient(180deg, #d4a017, #8a5e1f);
  color: #2a1d10;
}
.modal-btn:hover { transform: translateY(-2px); filter: brightness(1.06); }

.pop-enter-active, .pop-leave-active { transition: all 0.3s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(0.92); }
</style>
