<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import api from "../../services/api";

/* =========================================================
   TYPES
========================================================= */
type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  images?: string[];
  variants?: { color: string; image?: string; stock?: number }[];
};

type ImageInput = {
  type: "url" | "file";
  value: string | File | null;
};

/* =========================================================
   STATE
========================================================= */
const products = ref<Product[]>([]);
const loading = ref(true);
const search = ref("");

const name = ref("");
const price = ref<string>(""); // string p/ máscara BRL
const description = ref("");
const submitting = ref(false);

const productImages = ref<ImageInput[]>([{ type: "url", value: "" }]);
const preview = ref<string>("");
const selectedFile = ref<File | null>(null);

const showDeleteModal = ref(false);
const showEditModal = ref(false);
const targetProduct = ref<Product | null>(null);

const editName = ref("");
const editPrice = ref<string>("");
const editDescription = ref("");

const toasts = ref<{ id: number; text: string; type: "success" | "error" | "info" }[]>([]);
let toastSeed = 0;

function pushToast(text: string, type: "success" | "error" | "info" = "success") {
  const id = ++toastSeed;
  toasts.value.push({ id, text, type });
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, 3000);
}

/* =========================================================
   FORMATAÇÃO BRL
   - aceita apenas dígitos
   - converte para "1.234,56"
   - nunca permite negativo
========================================================= */
function maskBRL(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  const padded = digits.padStart(3, "0");
  const cents = padded.slice(-2);
  const intPart = padded.slice(0, -2);
  const intFmt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${intFmt},${cents}`;
}

function brlToNumber(masked: string): number {
  if (!masked) return 0;
  const n = Number(masked.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function onPriceInput(e: Event, target: "create" | "edit") {
  const val = (e.target as HTMLInputElement).value;
  const masked = maskBRL(val);
  if (target === "create") price.value = masked;
  else editPrice.value = masked;
}

function formatPrice(v: number | string) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* =========================================================
   COMPUTED
========================================================= */
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return products.value;
  return products.value.filter(
    p =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
  );
});

const totalValue = computed(() =>
  products.value.reduce((acc, p) => acc + Math.max(0, Number(p.price || 0)), 0)
);

/* =========================================================
   HELPERS
========================================================= */
function fossilCode(id: string) {
  return `ACH-${id.slice(-4).toUpperCase()}`;
}

/* =========================================================
   API
========================================================= */
async function loadProducts() {
  try {
    loading.value = true;
    const { data } = await api.get("/products");
    products.value = data;
  } catch {
    pushToast("Erro ao carregar produtos", "error");
  } finally {
    loading.value = false;
  }
}

/* =========================================================
   IMAGES
========================================================= */
function addImageField() {
  productImages.value.push({ type: "url", value: "" });
}
function removeImage(index: number) {
  productImages.value.splice(index, 1);
}
function handleFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  selectedFile.value = file;
  const reader = new FileReader();
  reader.onload = e => (preview.value = e.target?.result as string);
  reader.readAsDataURL(file);
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.imageUrl;
}

async function processImages(): Promise<string[]> {
  const images: string[] = [];
  for (const img of productImages.value) {
    if (img.type === "url" && typeof img.value === "string" && img.value.trim()) {
      images.push(img.value.trim());
    }
    if (img.type === "file" && img.value instanceof File) {
      const url = await uploadFile(img.value);
      images.push(url);
    }
  }
  return images;
}

/* =========================================================
   CRUD
========================================================= */
async function createProduct() {
  const numericPrice = brlToNumber(price.value);
  if (!name.value.trim()) return pushToast("Nome é obrigatório", "error");
  if (numericPrice <= 0) return pushToast("Informe um preço válido (maior que zero)", "error");

  try {
    submitting.value = true;
    const images = await processImages();
    if (preview.value && selectedFile.value) {
      const main = await uploadFile(selectedFile.value);
      images.unshift(main);
    }
    const variants = images.map(img => ({ color: "default", image: img, stock: 1 }));

    await api.post("/products", {
      name: name.value.trim(),
      price: numericPrice,
      description: description.value.trim(),
      image: images[0] || "",
      variants,
    });

    clearForm();
    await loadProducts();
    pushToast("Peça catalogada com sucesso!", "success");
  } catch (err) {
    console.error(err);
    pushToast("Erro ao criar produto", "error");
  } finally {
    submitting.value = false;
  }
}

function clearForm() {
  name.value = "";
  price.value = "";
  description.value = "";
  productImages.value = [{ type: "url", value: "" }];
  preview.value = "";
  selectedFile.value = null;
}

function askDelete(p: Product) {
  targetProduct.value = p;
  showDeleteModal.value = true;
}
function cancelDelete() {
  showDeleteModal.value = false;
  targetProduct.value = null;
}
async function confirmDelete() {
  if (!targetProduct.value) return;
  try {
    await api.delete(`/products/${targetProduct.value.id}`);
    pushToast("Produto removido", "info");
    cancelDelete();
    await loadProducts();
  } catch {
    pushToast("Erro ao remover", "error");
  }
}

function askEdit(p: Product) {
  targetProduct.value = p;
  editName.value = p.name;
  editPrice.value = maskBRL(String(Math.round(Number(p.price) * 100)));
  editDescription.value = p.description;
  showEditModal.value = true;
}
function cancelEdit() {
  showEditModal.value = false;
  targetProduct.value = null;
}
async function confirmEdit() {
  if (!targetProduct.value) return;
  const numericPrice = brlToNumber(editPrice.value);
  if (!editName.value.trim()) return pushToast("Nome obrigatório", "error");
  if (numericPrice <= 0) return pushToast("Preço inválido", "error");

  try {
    await api.put(`/products/${targetProduct.value.id}`, {
      name: editName.value.trim(),
      price: numericPrice,
      description: editDescription.value.trim(),
      image: targetProduct.value.image,
      variants: targetProduct.value.variants || [],
    });
    pushToast("Atualizado com sucesso", "success");
    cancelEdit();
    await loadProducts();
  } catch {
    pushToast("Erro ao atualizar", "error");
  }
}

/* mantém máscara reativa caso alguém cole valor */
watch(price, v => {
  const m = maskBRL(v);
  if (m !== v) price.value = m;
});
watch(editPrice, v => {
  const m = maskBRL(v);
  if (m !== v) editPrice.value = m;
});

onMounted(loadProducts);
</script>

<template>
  <div class="page">
    <!-- BG -->
    <div class="bg-grain"></div>
    <div class="bg-glow"></div>
    <div class="bg-vignette"></div>

    <!-- HERO -->
    <header class="hero">
      <div class="hero-tag">
        <span class="dot"></span> CURADORIA · ACERVO PALEONTOLÓGICO
      </div>
      <h1 class="hero-title">
        Catálogo de <span class="accent">Achados</span>
      </h1>
      <p class="hero-sub">
        Registre, examine e cataloge cada peça do museu pré-histórico
        com a precisão de um curador.
      </p>

      <div class="stats">
        <div class="stat">
          <span class="stat-num">{{ products.length }}</span>
          <span class="stat-label">Peças no acervo</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <span class="stat-num">R$ {{ formatPrice(totalValue) }}</span>
          <span class="stat-label">Valor estimado</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat">
          <span class="stat-num">{{ filtered.length }}</span>
          <span class="stat-label">Em exibição</span>
        </div>
      </div>
    </header>

    <!-- FORM -->
    <section class="panel form-panel">
      <div class="panel-head">
        <span class="panel-icon">🦴</span>
        <div>
          <h2>Nova Peça</h2>
          <p>Catalogue um novo item para o acervo</p>
        </div>
      </div>

      <div class="form-grid">
        <!-- DROPZONE -->
        <label class="dropzone" :class="{ filled: preview }">
          <input type="file" accept="image/*" @change="handleFile" hidden />
          <template v-if="!preview">
            <div class="drop-icon">📷</div>
            <strong>Imagem da peça</strong>
            <span>Clique para selecionar uma foto</span>
          </template>
          <template v-else>
            <img :src="preview" alt="preview" class="drop-preview" />
            <span class="drop-change">Trocar imagem</span>
          </template>
        </label>

        <!-- CAMPOS -->
        <div class="fields">
          <div class="field">
            <label>Nome da peça</label>
            <input v-model="name" type="text" placeholder="Ex: Crânio de T-Rex" />
          </div>

          <div class="field">
            <label>Preço (R$)</label>
            <div class="input-prefix">
              <span class="prefix">R$</span>
              <input
                :value="price"
                @input="(e) => onPriceInput(e, 'create')"
                inputmode="numeric"
                placeholder="0,00"
              />
            </div>
          </div>

          <div class="field full">
            <label>Descrição</label>
            <textarea
              v-model="description"
              rows="3"
              placeholder="Descreva a peça, era geológica, procedência..."
            ></textarea>
          </div>

          <!-- IMAGENS EXTRAS -->
          <div class="variants-box full">
            <div class="variants-head">
              <h3>Imagens do produto</h3>
              <button type="button" class="btn-ghost" @click="addImageField">+ Nova imagem</button>
            </div>

            <div class="variant-images">
              <div class="img-row" v-for="(img, index) in productImages" :key="index">
                <select v-model="img.type" class="select-mini">
                  <option value="url">URL</option>
                  <option value="file">Upload</option>
                </select>

                <input
                  v-if="img.type === 'url'"
                  type="text"
                  placeholder="https://..."
                  :value="typeof img.value === 'string' ? img.value : ''"
                  @input="(e: any) => (img.value = e.target.value)"
                />

                <input
                  v-else
                  type="file"
                  accept="image/*"
                  @change="(e: any) => (img.value = e.target.files[0])"
                />

                <button class="btn-ghost danger" type="button" @click="removeImage(index)">✕</button>
              </div>
            </div>
          </div>

          <button
            class="btn-primary full"
            :disabled="submitting"
            @click="createProduct"
          >
            <span v-if="!submitting">✦ Catalogar Peça</span>
            <span v-else>Registrando...</span>
          </button>
        </div>
      </div>
    </section>

    <!-- BUSCA -->
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input v-model="search" placeholder="Buscar por nome ou descrição..." />
      <span class="search-count">{{ filtered.length }} resultado(s)</span>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="state-block">
      <div class="state-icon">🦴</div>
      <p>Escavando o acervo...</p>
    </div>

    <!-- VAZIO -->
    <div v-else-if="!filtered.length" class="state-block">
      <div class="state-icon">🏺</div>
      <h3>Nenhuma peça encontrada</h3>
      <p>O acervo está aguardando novas descobertas.</p>
    </div>

    <!-- GRID -->
    <section v-else class="grid">
      <article v-for="p in filtered" :key="p.id" class="card">
        <div class="card-img-wrap">
          <img
            v-if="p.image"
            :src="p.image"
            :alt="p.name"
            loading="lazy"
            class="card-img"
          />
          <div v-else class="card-img card-img-fallback">🦖</div>
          <span class="card-code">{{ fossilCode(p.id) }}</span>
        </div>

        <div class="card-body">
          <h3 class="card-title">{{ p.name }}</h3>
          <p class="card-desc">{{ p.description || "Sem descrição registrada." }}</p>

          <div v-if="p.variants?.length" class="card-variants">
            <span class="variant-chip" v-for="(v, i) in p.variants.slice(0, 4)" :key="i">
              {{ v.color }}
            </span>
          </div>

          <div class="card-footer">
            <div class="card-price">R$ {{ formatPrice(p.price) }}</div>
            <div class="card-actions">
              <button class="ico edit" @click="askEdit(p)" title="Editar">✎</button>
              <button class="ico delete" @click="askDelete(p)" title="Remover">✕</button>
            </div>
          </div>
        </div>
      </article>
    </section>

    <!-- MODAL DELETE -->
    <Teleport to="body">
      <Transition name="pop">
        <div v-if="showDeleteModal" class="overlay" @click.self="cancelDelete">
          <div class="modal">
            <div class="modal-seal warn">⚠</div>
            <h3>Remover do Acervo</h3>
            <p>
              Tem certeza que deseja remover
              <strong>{{ targetProduct?.name }}</strong>
              permanentemente do catálogo?
            </p>
            <div class="modal-actions">
              <button class="btn-ghost" @click="cancelDelete">Cancelar</button>
              <button class="btn-danger" @click="confirmDelete">Remover</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- MODAL EDIT -->
    <Teleport to="body">
      <Transition name="pop">
        <div v-if="showEditModal" class="overlay" @click.self="cancelEdit">
          <div class="modal">
            <div class="modal-seal">✎</div>
            <h3>Revisar Registro</h3>

            <div class="field">
              <label>Nome</label>
              <input v-model="editName" type="text" />
            </div>

            <div class="field">
              <label>Preço</label>
              <div class="input-prefix">
                <span class="prefix">R$</span>
                <input
                  :value="editPrice"
                  @input="(e) => onPriceInput(e, 'edit')"
                  inputmode="numeric"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div class="field">
              <label>Descrição</label>
              <textarea v-model="editDescription" rows="3"></textarea>
            </div>

            <div class="modal-actions">
              <button class="btn-ghost" @click="cancelEdit">Cancelar</button>
              <button class="btn-primary" @click="confirmEdit">Salvar alterações</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- TOASTS -->
    <Teleport to="body">
      <div class="toast-stack">
        <TransitionGroup name="toast">
          <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">
            <span class="toast-icon">
              {{ t.type === 'success' ? '✦' : t.type === 'error' ? '⚠' : '◆' }}
            </span>
            {{ t.text }}
          </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* =========================================================
   BASE
========================================================= */
.page {
  position: relative;
  min-height: 100vh;
  padding: 60px 40px 80px;
  background:
    radial-gradient(ellipse at top, #1a1208 0%, #0a0604 60%, #050302 100%);
  color: #e8d9b0;
  font-family: 'Cormorant Garamond', serif;
  overflow: hidden;
}

.bg-grain {
  position: fixed; inset: 0; pointer-events: none; opacity: .06; z-index: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>");
}
.bg-glow {
  position: fixed; inset: -20% -10% auto -10%; height: 70vh;
  background: radial-gradient(ellipse at 50% 0%, rgba(212,175,55,.18), transparent 60%);
  pointer-events: none; z-index: 0;
}
.bg-vignette {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.6) 100%);
}

.page > *:not(.bg-grain):not(.bg-glow):not(.bg-vignette) { position: relative; z-index: 1; }

/* =========================================================
   HERO
========================================================= */
.hero { text-align: center; max-width: 980px; margin: 0 auto 60px; animation: fadeUp .8s ease both; }
.hero-tag {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 8px 18px; border-radius: 999px;
  background: rgba(212,175,55,.08);
  border: 1px solid rgba(212,175,55,.25);
  color: #d4af37; font-family: 'Cinzel', serif;
  font-size: .72rem; letter-spacing: 3px;
}
.hero-tag .dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #d4af37; box-shadow: 0 0 10px #d4af37;
}
.hero-title {
  font-family: 'Cinzel Decorative', serif;
  font-size: clamp(2.2rem, 5vw, 3.8rem);
  margin: 22px 0 14px; font-weight: 700; letter-spacing: 2px;
  color: #f5e9c4;
  text-shadow: 0 4px 30px rgba(212,175,55,.2);
}
.hero-title .accent {
  background: linear-gradient(135deg, #f4d56b, #d4af37, #8b6914);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.hero-sub { color: #a8987a; font-size: 1.05rem; max-width: 620px; margin: 0 auto 36px; font-style: italic; }

.stats {
  display: inline-flex; align-items: center; gap: 30px;
  padding: 22px 40px; border-radius: 18px;
  background: linear-gradient(180deg, rgba(40,28,12,.6), rgba(20,14,6,.6));
  border: 1px solid rgba(212,175,55,.18);
  backdrop-filter: blur(8px);
  box-shadow: 0 12px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,220,140,.08);
}
.stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat-num { font-family: 'Cinzel', serif; font-size: 1.6rem; color: #f4d56b; font-weight: 700; }
.stat-label { font-size: .72rem; letter-spacing: 2px; color: #8a7551; text-transform: uppercase; }
.stat-divider { width: 1px; height: 36px; background: linear-gradient(180deg, transparent, rgba(212,175,55,.3), transparent); }

/* =========================================================
   PANEL / FORM
========================================================= */
.panel {
  max-width: 1100px; margin: 0 auto 50px;
  padding: 36px;
  background: linear-gradient(180deg, rgba(30,20,10,.7), rgba(15,10,5,.7));
  border: 1px solid rgba(212,175,55,.2);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,220,140,.05);
  animation: fadeUp .9s ease both;
}
.panel-head { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
.panel-icon {
  width: 52px; height: 52px; display: grid; place-items: center;
  border-radius: 14px; font-size: 1.4rem;
  background: linear-gradient(135deg, rgba(212,175,55,.18), rgba(139,105,20,.08));
  border: 1px solid rgba(212,175,55,.3);
}
.panel-head h2 { font-family: 'Cinzel', serif; color: #f4d56b; margin: 0; letter-spacing: 2px; font-size: 1.3rem; }
.panel-head p { margin: 4px 0 0; color: #8a7551; font-size: .9rem; }

.form-grid { display: grid; grid-template-columns: 280px 1fr; gap: 28px; }

/* dropzone */
.dropzone {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; text-align: center; padding: 20px;
  min-height: 260px; cursor: pointer;
  border: 2px dashed rgba(212,175,55,.3);
  border-radius: 16px;
  background: rgba(0,0,0,.25);
  color: #a8987a; transition: all .3s ease; position: relative; overflow: hidden;
}
.dropzone:hover { border-color: #d4af37; background: rgba(212,175,55,.05); transform: translateY(-2px); }
.dropzone.filled { padding: 0; border-style: solid; }
.drop-icon { font-size: 2.4rem; opacity: .7; }
.dropzone strong { font-family: 'Cinzel', serif; color: #d4af37; letter-spacing: 2px; font-size: .85rem; }
.dropzone span { font-size: .8rem; }
.drop-preview { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
.drop-change {
  position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
  padding: 6px 14px; background: rgba(0,0,0,.7); border: 1px solid rgba(212,175,55,.4);
  border-radius: 999px; color: #f4d56b; font-size: .75rem; letter-spacing: 1px;
}

/* fields */
.fields { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field.full, .full { grid-column: 1 / -1; }
.field label {
  font-family: 'Cinzel', serif; font-size: .72rem;
  letter-spacing: 2px; color: #d4af37; text-transform: uppercase;
}
.field input, .field textarea, .input-prefix input, .img-row input, .select-mini, .modal .field input, .modal .field textarea {
  padding: 12px 14px;
  background: rgba(0,0,0,.4);
  border: 1px solid rgba(212,175,55,.2);
  border-radius: 10px;
  color: #f1d98a;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1rem;
  transition: all .2s ease;
}
.field input:focus, .field textarea:focus, .input-prefix input:focus, .img-row input:focus {
  outline: none; border-color: #d4af37;
  box-shadow: 0 0 0 3px rgba(212,175,55,.15);
}
.field textarea { resize: vertical; }

.input-prefix {
  display: flex; align-items: stretch;
  background: rgba(0,0,0,.4);
  border: 1px solid rgba(212,175,55,.2);
  border-radius: 10px; overflow: hidden;
  transition: all .2s ease;
}
.input-prefix:focus-within { border-color: #d4af37; box-shadow: 0 0 0 3px rgba(212,175,55,.15); }
.input-prefix .prefix {
  display: grid; place-items: center;
  padding: 0 14px; background: rgba(212,175,55,.1);
  color: #d4af37; font-family: 'Cinzel', serif; font-size: .85rem; letter-spacing: 1px;
  border-right: 1px solid rgba(212,175,55,.2);
}
.input-prefix input { flex: 1; background: transparent; border: none; border-radius: 0; }
.input-prefix input:focus { box-shadow: none; }

/* botões */
.btn-primary {
  padding: 14px 22px; border-radius: 12px;
  background: linear-gradient(135deg, #d4af37, #8b6914);
  color: #1a1208; font-family: 'Cinzel', serif; letter-spacing: 2px; font-weight: 700;
  border: 1px solid rgba(255,220,140,.4); cursor: pointer;
  transition: all .25s ease; font-size: .9rem;
  box-shadow: 0 8px 24px rgba(212,175,55,.25);
}
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(212,175,55,.4); }
.btn-primary:disabled { opacity: .5; cursor: not-allowed; }

.btn-ghost {
  padding: 8px 14px; border-radius: 10px;
  background: transparent; color: #d4af37;
  border: 1px solid rgba(212,175,55,.3);
  font-family: 'Cinzel', serif; font-size: .75rem; letter-spacing: 1px;
  cursor: pointer; transition: all .2s ease;
}
.btn-ghost:hover { background: rgba(212,175,55,.1); border-color: #d4af37; }
.btn-ghost.danger { color: #ff6b6b; border-color: rgba(255,107,107,.3); }
.btn-ghost.danger:hover { background: rgba(255,107,107,.1); }

.btn-danger {
  padding: 12px 20px; border-radius: 10px;
  background: linear-gradient(135deg, #c0392b, #7a1f15);
  color: #fff; border: 1px solid rgba(255,107,107,.4);
  font-family: 'Cinzel', serif; letter-spacing: 1px; cursor: pointer; font-weight: 600;
  transition: all .2s ease;
}
.btn-danger:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(192,57,43,.4); }

/* variants box */
.variants-box {
  padding: 18px;
  border: 1px solid rgba(212,175,55,.15);
  border-radius: 14px;
  background: rgba(0,0,0,.3);
}
.variants-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.variants-head h3 {
  margin: 0; font-family: 'Cinzel', serif;
  font-size: .8rem; letter-spacing: 2px; color: #d4af37;
}
.variant-images { display: flex; flex-direction: column; gap: 10px; }
.img-row { display: flex; gap: 8px; align-items: center; }
.img-row input { flex: 1; }
.select-mini {
  padding: 10px 12px; min-width: 90px;
  border: 1px solid rgba(212,175,55,.2);
  background: rgba(0,0,0,.5); color: #d4af37;
  border-radius: 10px; font-family: 'Cinzel', serif; font-size: .75rem;
}

/* =========================================================
   SEARCH
========================================================= */
.search-bar {
  max-width: 1100px; margin: 0 auto 30px;
  display: flex; align-items: center; gap: 12px;
  padding: 14px 22px;
  background: linear-gradient(180deg, rgba(30,20,10,.7), rgba(15,10,5,.7));
  border: 1px solid rgba(212,175,55,.2);
  border-radius: 14px;
  backdrop-filter: blur(8px);
}
.search-icon { font-size: 1.1rem; opacity: .7; }
.search-bar input {
  flex: 1; background: transparent; border: none; outline: none;
  color: #f1d98a; font-family: 'Cormorant Garamond', serif; font-size: 1.05rem;
}
.search-count {
  font-family: 'Cinzel', serif; font-size: .72rem;
  letter-spacing: 2px; color: #8a7551;
  padding: 4px 12px; border: 1px solid rgba(212,175,55,.2); border-radius: 999px;
}

/* =========================================================
   STATE BLOCKS
========================================================= */
.state-block {
  max-width: 600px; margin: 60px auto; text-align: center;
  padding: 50px 20px; color: #a8987a;
}
.state-icon { font-size: 3rem; margin-bottom: 14px; animation: bob 3s ease-in-out infinite; }
.state-block h3 { font-family: 'Cinzel', serif; color: #d4af37; letter-spacing: 2px; margin: 0 0 8px; }

/* =========================================================
   GRID + CARD
========================================================= */
.grid {
  max-width: 1300px; margin: 0 auto;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}
.card {
  background: linear-gradient(180deg, rgba(35,25,12,.8), rgba(15,10,5,.85));
  border: 1px solid rgba(212,175,55,.18);
  border-radius: 18px;
  overflow: hidden;
  transition: all .35s ease;
  display: flex; flex-direction: column;
  box-shadow: 0 10px 30px rgba(0,0,0,.5);
}
.card:hover {
  transform: translateY(-6px);
  border-color: rgba(212,175,55,.45);
  box-shadow: 0 20px 50px rgba(0,0,0,.7), 0 0 30px rgba(212,175,55,.15);
}
.card-img-wrap {
  position: relative;
  aspect-ratio: 4/3;
  background: #0a0604; overflow: hidden;
}
.card-img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s ease; }
.card:hover .card-img { transform: scale(1.08); }
.card-img-fallback { display: grid; place-items: center; font-size: 3rem; color: #3a2a18; }
.card-code {
  position: absolute; top: 12px; left: 12px;
  padding: 4px 10px; border-radius: 999px;
  background: rgba(0,0,0,.7); border: 1px solid rgba(212,175,55,.4);
  color: #d4af37; font-family: 'Cinzel', serif;
  font-size: .68rem; letter-spacing: 2px;
  backdrop-filter: blur(6px);
}

.card-body { padding: 18px 20px 20px; display: flex; flex-direction: column; flex: 1; }
.card-title {
  font-family: 'Cinzel', serif; color: #f4d56b;
  font-size: 1.1rem; margin: 0 0 8px; letter-spacing: 1px;
}
.card-desc {
  color: #a8987a; font-size: .92rem; line-height: 1.5;
  margin: 0 0 14px; flex: 1;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}

.card-variants { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.variant-chip {
  padding: 4px 10px; border-radius: 999px;
  background: rgba(212,175,55,.08);
  border: 1px solid rgba(212,175,55,.2);
  color: #d4af37; font-size: .68rem;
  letter-spacing: 1px; font-family: 'Cinzel', serif;
}

.card-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 14px;
  border-top: 1px solid rgba(212,175,55,.15);
}
.card-price {
  font-family: 'Cinzel', serif; font-size: 1.15rem;
  background: linear-gradient(135deg, #f4d56b, #d4af37);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  font-weight: 700;
}
.card-actions { display: flex; gap: 6px; }
.ico {
  width: 34px; height: 34px; display: grid; place-items: center;
  border-radius: 10px; border: 1px solid rgba(212,175,55,.25);
  background: rgba(0,0,0,.4); color: #d4af37;
  cursor: pointer; transition: all .2s ease;
}
.ico:hover { background: rgba(212,175,55,.12); transform: translateY(-2px); }
.ico.delete { color: #ff6b6b; border-color: rgba(255,107,107,.25); }
.ico.delete:hover { background: rgba(255,107,107,.12); }

/* =========================================================
   MODAL
========================================================= */
.overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,.75); backdrop-filter: blur(8px);
  display: grid; place-items: center; padding: 20px;
}
.modal {
  width: 100%; max-width: 460px;
  padding: 32px;
  background: linear-gradient(180deg, #1f1508, #110b04);
  border: 1px solid rgba(212,175,55,.3);
  border-radius: 20px;
  box-shadow: 0 30px 80px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,220,140,.08);
  text-align: center;
  display: flex; flex-direction: column; gap: 14px;
}
.modal h3 { font-family: 'Cinzel', serif; color: #f4d56b; margin: 0; letter-spacing: 2px; }
.modal p { color: #a8987a; margin: 0; line-height: 1.5; }
.modal p strong { color: #f4d56b; }
.modal-seal {
  width: 70px; height: 70px; margin: 0 auto 6px;
  display: grid; place-items: center; border-radius: 50%;
  background: linear-gradient(135deg, #d4af37, #8b6914);
  color: #1a1208; font-size: 1.6rem;
  border: 2px solid rgba(255,220,140,.4);
  animation: pulseSeal 2.4s ease-in-out infinite;
}
.modal-seal.warn { background: linear-gradient(135deg, #c0392b, #7a1f15); color: #fff; }
.modal .field { text-align: left; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px; }

/* =========================================================
   TOASTS
========================================================= */
.toast-stack {
  position: fixed; top: 20px; right: 20px; z-index: 200;
  display: flex; flex-direction: column; gap: 10px;
}
.toast {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px; border-radius: 12px;
  background: linear-gradient(135deg, rgba(30,20,10,.95), rgba(15,10,5,.95));
  border: 1px solid rgba(212,175,55,.3);
  color: #f1d98a; font-family: 'Cormorant Garamond', serif;
  box-shadow: 0 10px 30px rgba(0,0,0,.5);
  min-width: 240px;
}
.toast-icon { color: #d4af37; font-size: 1.1rem; }
.toast.success { border-color: rgba(132,212,55,.4); }
.toast.success .toast-icon { color: #84d437; }
.toast.error { border-color: rgba(255,107,107,.4); }
.toast.error .toast-icon { color: #ff6b6b; }

/* =========================================================
   TRANSITIONS
========================================================= */
.pop-enter-active, .pop-leave-active { transition: all .25s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: scale(.95); }

.toast-enter-active, .toast-leave-active { transition: all .3s ease; }
.toast-enter-from { opacity: 0; transform: translateX(40px); }
.toast-leave-to { opacity: 0; transform: translateX(40px); }

/* =========================================================
   KEYFRAMES
========================================================= */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}
@keyframes pulseSeal {
  0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(212,175,55,.5); }
  50%      { transform: scale(1.05); box-shadow: 0 0 45px rgba(212,175,55,.8); }
}

/* =========================================================
   RESPONSIVE
========================================================= */
@media (max-width: 900px) {
  .form-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .page { padding: 30px 16px 60px; }
  .fields { grid-template-columns: 1fr; }
  .stats { flex-direction: column; gap: 14px; padding: 16px 24px; }
  .stat-divider { width: 60px; height: 1px; }
  .panel { padding: 24px; }
}
</style>
