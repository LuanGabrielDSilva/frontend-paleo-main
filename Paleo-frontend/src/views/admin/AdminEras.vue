<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import api from "../../services/api";

/* =========================
   STATE
========================= */
const eras = ref<any[]>([]);
const selected = ref<any | null>(null);
const createModal = ref(false);

const newEra = ref({
  name: "",
  description: "",
  image: ""
});

const deleteModal = ref({
  isOpen: false,
  eraId: null as string | null,
  eraName: "",
  isDeleting: false
});

const ordemEras = ["Paleozoico", "Mesozoico", "Cenozoico"];

/* =========================
   LOAD
========================= */
async function load() {
  const res = await api.get("/eras");
  eras.value = res.data.sort(
    (a: any, b: any) => ordemEras.indexOf(a.name) - ordemEras.indexOf(b.name)
  );
}
onMounted(load);

const sortedEras = computed(() => eras.value);

/* =========================
   CREATE
========================= */
function openCreateModal() {
  newEra.value = { name: "", description: "", image: "" };
  createModal.value = true;
}
function closeCreateModal() {
  createModal.value = false;
}
async function create() {
  if (!newEra.value.name.trim()) return;
  await api.post("/eras", newEra.value);
  closeCreateModal();
  await load();
}

/* =========================
   DELETE
========================= */
function openDeleteModal(id: string, name: string) {
  deleteModal.value = { isOpen: true, eraId: id, eraName: name, isDeleting: false };
}
function closeDeleteModal() {
  deleteModal.value.isOpen = false;
  setTimeout(() => {
    deleteModal.value.eraId = null;
    deleteModal.value.eraName = "";
    deleteModal.value.isDeleting = false;
  }, 300);
}
async function confirmDelete() {
  if (!deleteModal.value.eraId) return;
  deleteModal.value.isDeleting = true;
  try {
    await api.delete(`/eras/${deleteModal.value.eraId}`);
    eras.value = eras.value.filter((e) => e.id !== deleteModal.value.eraId);
    closeDeleteModal();
  } catch (err) {
    console.error(err);
    deleteModal.value.isDeleting = false;
  }
}

/* =========================
   EDIT
========================= */
function openEdit(era: any) {
  selected.value = { ...era };
}
async function saveEdit() {
  if (!selected.value?.id) return;
  await api.put(`/eras/${selected.value.id}`, selected.value);
  selected.value = null;
  await load();
}
</script>

<template>
  <div class="page">

    <!-- ====== HEADER ====== -->
    <header class="page-header">
      <div class="header-emblem">🌍</div>
      <div class="header-text">
        <span class="header-eyebrow">Painel Administrativo</span>
        <h1>Gerenciar Eras</h1>
        <p>Catálogo das eras geológicas do mundo perdido</p>
      </div>
      <div class="header-stats">
        <div class="stat">
          <strong>{{ eras.length }}</strong>
          <span>eras</span>
        </div>
        <button class="btn-new" @click="openCreateModal">
          <span class="plus">+</span> Nova Era
        </button>
      </div>
    </header>

    <!-- ====== ERAS GRID ====== -->
    <section v-if="sortedEras.length" class="era-section">
      <div class="era-header">
        <div class="era-marker"></div>
        <div class="era-titles">
          <span class="era-eyebrow">Coleção</span>
          <h2>Eras Catalogadas</h2>
        </div>
        <div class="era-count">{{ sortedEras.length }} {{ sortedEras.length > 1 ? 'registros' : 'registro' }}</div>
      </div>

      <div class="grid">
        <article v-for="(e, i) in sortedEras" :key="e.id" class="card">
          <div class="card-media">
            <img v-if="e.image" :src="e.image" :alt="e.name" />
            <div v-else class="placeholder">🌋</div>
            <div class="card-badge">Era · {{ String(i + 1).padStart(2, '0') }}</div>
            <div class="card-shadow"></div>
          </div>

          <div class="card-body">
            <h3>{{ e.name }}</h3>
            <p class="card-desc">{{ e.description || 'Sem descrição disponível.' }}</p>
          </div>

          <div class="card-footer">
            <button class="btn edit" @click="openEdit(e)">✏️ Editar</button>
            <button class="btn danger" @click="openDeleteModal(e.id, e.name)">🗑️ Excluir</button>
          </div>
        </article>
      </div>
    </section>

    <!-- ====== EMPTY ====== -->
    <div v-else class="empty-state">
      <span>🦴</span>
      <p>Nenhuma era cadastrada ainda</p>
    </div>

    <!-- ====== MODAL CRIAR (Museum Style) ====== -->
    <Transition name="fade-scale">
      <div v-if="createModal" class="modal-overlay" @click.self="closeCreateModal">
        <div class="modal-museum">
          <div class="catalog-bar">
            <div class="catalog-tag">
              <span class="catalog-dot"></span>
              NOVA FICHA · ERA
            </div>
            <button class="close-x" @click="closeCreateModal">✕</button>
          </div>

          <div class="museum-body">
            <div class="museum-preview">
              <div class="preview-frame">
                <img v-if="newEra.image" :src="newEra.image" />
                <div v-else class="preview-empty">
                  <span>🌋</span>
                  <small>Sem imagem</small>
                </div>
              </div>
              <div class="preview-caption">
                <span class="caption-label">Espécime</span>
                <strong>{{ newEra.name || 'Sem nome' }}</strong>
              </div>
            </div>

            <div class="museum-form">
              <h3 class="museum-title">Cadastrar Era</h3>
              <p class="museum-sub">Preencha os dados do novo registro geológico</p>

              <div class="museum-field">
                <label>Nome</label>
                <input v-model="newEra.name" placeholder="Ex: Mesozoico" />
              </div>

              <div class="museum-field">
                <label>Descrição</label>
                <textarea
                  v-model="newEra.description"
                  rows="3"
                  placeholder="Breve descrição da era..."
                ></textarea>
              </div>

              <div class="museum-field">
                <label>URL da Imagem</label>
                <input v-model="newEra.image" placeholder="https://..." />
              </div>

              <div class="museum-actions">
                <button class="btn-ghost" @click="closeCreateModal">Cancelar</button>
                <button class="btn-gold" @click="create">
                  <span>Criar Era</span>
                  <span class="arrow">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ====== MODAL EDITAR (Museum Style) ====== -->
    <Transition name="fade-scale">
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal-museum">
          <div class="catalog-bar">
            <div class="catalog-tag">
              <span class="catalog-dot"></span>
              FICHA Nº {{ selected.id?.slice(0, 6).toUpperCase() || '------' }}
            </div>
            <button class="close-x" @click="selected = null">✕</button>
          </div>

          <div class="museum-body">
            <div class="museum-preview">
              <div class="preview-frame">
                <img v-if="selected.image" :src="selected.image" />
                <div v-else class="preview-empty">
                  <span>🌋</span>
                  <small>Sem imagem</small>
                </div>
              </div>
              <div class="preview-caption">
                <span class="caption-label">Espécime</span>
                <strong>{{ selected.name || 'Sem nome' }}</strong>
              </div>
            </div>

            <div class="museum-form">
              <h3 class="museum-title">Editar Registro</h3>
              <p class="museum-sub">Atualize os dados da era</p>

              <div class="museum-field">
                <label>Nome</label>
                <input v-model="selected.name" />
              </div>

              <div class="museum-field">
                <label>Descrição</label>
                <textarea v-model="selected.description" rows="3"></textarea>
              </div>

              <div class="museum-field">
                <label>URL da Imagem</label>
                <input v-model="selected.image" />
              </div>

              <div class="museum-actions">
                <button class="btn-ghost" @click="selected = null">Cancelar</button>
                <button class="btn-gold" @click="saveEdit">
                  <span>Salvar</span>
                  <span class="arrow">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ====== MODAL CONFIRMAR EXCLUSÃO ====== -->
    <Transition name="fade-scale">
      <div v-if="deleteModal.isOpen" class="confirm-overlay" @click.self="closeDeleteModal">
        <div class="confirm-modal">
          <div class="confirm-header">
            <div class="confirm-icon">⚠️</div>
            <h3>Confirmar Exclusão</h3>
          </div>

          <div class="confirm-body">
            <p class="confirm-message">
              Você está prestes a excluir permanentemente a era:
            </p>
            <div class="confirm-target">
              <span class="target-icon">🌋</span>
              <strong>{{ deleteModal.eraName }}</strong>
            </div>
            <p class="confirm-warning">
              Esta ação não pode ser desfeita. Todos os dados associados serão perdidos.
            </p>
          </div>

          <div class="confirm-actions">
            <button class="btn-cancel" @click="closeDeleteModal" :disabled="deleteModal.isDeleting">
              Cancelar
            </button>
            <button
              class="btn-delete"
              @click="confirmDelete"
              :disabled="deleteModal.isDeleting"
            >
              <span v-if="deleteModal.isDeleting" class="spinner"></span>
              <span v-else>🗑️ Excluir Era</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

.page {
  padding: 40px 30px 60px;
  color: #f5e6c8;
  min-height: 100vh;
  background:
    radial-gradient(ellipse at top, rgba(212,175,55,0.06), transparent 60%),
    linear-gradient(180deg, #0b0a08, #14110c);
  font-family: 'Crimson Text', serif;
}

/* ===== PAGE HEADER ===== */
.page-header {
  max-width: 1100px;
  margin: 0 auto 40px;
  padding: 26px 30px;
  display: flex;
  align-items: center;
  gap: 22px;
  border-radius: 18px;
  background: linear-gradient(120deg, rgba(212,175,55,0.08), rgba(0,0,0,0.4));
  border: 1px solid rgba(212,175,55,0.18);
  position: relative;
  overflow: hidden;
}
.page-header::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
}

.header-emblem {
  width: 64px; height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  background: rgba(212,175,55,0.15);
  border: 1px solid rgba(212,175,55,0.35);
  box-shadow: inset 0 0 20px rgba(212,175,55,0.1);
}

.header-text { flex: 1; }
.header-eyebrow {
  font-family: 'Cinzel', serif;
  font-size: 0.65rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #d4af37;
  opacity: 0.8;
}
.header-text h1 {
  margin: 4px 0 4px;
  font-family: 'Cinzel', serif;
  font-size: 1.7rem;
  letter-spacing: 2px;
  color: #f5e6c8;
}
.header-text p {
  margin: 0;
  font-style: italic;
  color: rgba(245,230,200,0.55);
  font-size: 0.9rem;
}

.header-stats {
  display: flex;
  gap: 14px;
  align-items: center;
}
.stat {
  text-align: center;
  padding: 10px 18px;
  border-radius: 12px;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(212,175,55,0.18);
  min-width: 70px;
}
.stat strong {
  display: block;
  font-family: 'Cinzel', serif;
  font-size: 1.4rem;
  color: #d4af37;
}
.stat span {
  font-size: 0.65rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(245,230,200,0.5);
}

/* botão Nova Era no header */
.btn-new {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #d4af37, #b8972e);
  color: #1a140f;
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  box-shadow: 0 6px 20px rgba(212,175,55,0.3);
  transition: all 0.25s ease;
}
.btn-new:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(212,175,55,0.5); }
.btn-new .plus { font-size: 1.1rem; line-height: 1; }

/* ===== ERA SECTION ===== */
.era-section {
  max-width: 1100px;
  margin: 0 auto 50px;
}
.era-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
  padding: 14px 20px;
  border-radius: 14px;
  background: linear-gradient(90deg, rgba(212,175,55,0.1), transparent);
  border-left: 3px solid #d4af37;
}
.era-marker {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #d4af37;
  box-shadow: 0 0 12px #d4af37;
  flex-shrink: 0;
}
.era-titles { flex: 1; }
.era-eyebrow {
  font-family: 'Cinzel', serif;
  font-size: 0.6rem;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: rgba(212,175,55,0.7);
}
.era-titles h2 {
  margin: 2px 0 0;
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
  letter-spacing: 1.5px;
  color: #f5e6c8;
}
.era-count {
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(212,175,55,0.15);
  border: 1px solid rgba(212,175,55,0.3);
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  letter-spacing: 1.5px;
  color: #d4af37;
}

/* ===== GRID ===== */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

/* ===== CARD ===== */
.card {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: linear-gradient(170deg, #1a150e, #0b0a08);
  border: 1px solid rgba(212,175,55,0.15);
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 6px 18px rgba(0,0,0,0.4);
}
.card:hover {
  transform: translateY(-6px);
  border-color: rgba(212,175,55,0.4);
  box-shadow: 0 18px 40px rgba(0,0,0,0.6), 0 0 30px rgba(212,175,55,0.15);
}

.card-media {
  position: relative;
  height: 160px;
  overflow: hidden;
}
.card-media img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.card:hover .card-media img { transform: scale(1.08); }

.placeholder {
  width: 100%; height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  background: radial-gradient(circle, rgba(212,175,55,0.12), transparent);
}

.card-badge {
  position: absolute;
  top: 12px; left: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(0,0,0,0.7);
  border: 1px solid rgba(212,175,55,0.4);
  color: #d4af37;
  font-family: 'Cinzel', serif;
  font-size: 0.6rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  backdrop-filter: blur(6px);
}
.card-shadow {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(11,10,8,0.9) 100%);
  pointer-events: none;
}

.card-body {
  padding: 16px 18px 12px;
  flex: 1;
}
.card-body h3 {
  margin: 0 0 6px;
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  letter-spacing: 1px;
  color: #f5e6c8;
}
.card-desc {
  margin: 0;
  font-size: 0.88rem;
  color: rgba(245,230,200,0.6);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid rgba(212,175,55,0.12);
  background: rgba(0,0,0,0.3);
}

/* ===== BUTTONS DE CARD ===== */
.btn {
  flex: 1;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  transition: all 0.2s ease;
}
.btn.edit {
  background: rgba(212,175,55,0.12);
  color: #d4af37;
  border-color: rgba(212,175,55,0.3);
}
.btn.edit:hover { background: rgba(212,175,55,0.22); }
.btn.danger {
  background: rgba(255,80,80,0.1);
  color: #ff8a8a;
  border-color: rgba(255,80,80,0.3);
}
.btn.danger:hover { background: rgba(255,80,80,0.2); }

/* ===== EMPTY ===== */
.empty-state {
  max-width: 500px;
  margin: 60px auto;
  text-align: center;
  padding: 40px;
  border-radius: 16px;
  border: 1px dashed rgba(212,175,55,0.3);
  background: rgba(0,0,0,0.3);
}
.empty-state span { font-size: 3rem; display: block; margin-bottom: 10px; }
.empty-state p {
  margin: 0;
  font-family: 'Cinzel', serif;
  letter-spacing: 1.5px;
  color: rgba(245,230,200,0.5);
}

/* ===== MODAL MUSEUM (Criar/Editar) ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 20px;
}

.modal-museum {
  width: 100%;
  max-width: 820px;
  background: linear-gradient(160deg, #1a150e, #0b0a08);
  border: 1px solid rgba(212,175,55,0.25);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0,0,0,0.9), 0 0 60px rgba(212,175,55,0.08);
}

.catalog-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 22px;
  background: rgba(0,0,0,0.4);
  border-bottom: 1px solid rgba(212,175,55,0.18);
}
.catalog-tag {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  letter-spacing: 3px;
  color: #d4af37;
}
.catalog-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #d4af37;
  box-shadow: 0 0 10px #d4af37;
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.close-x {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: transparent;
  border: 1px solid rgba(212,175,55,0.3);
  color: #f5e6c8;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}
.close-x:hover { background: rgba(212,175,55,0.2); transform: rotate(90deg); }

.museum-body { display: grid; grid-template-columns: 280px 1fr; }
.museum-preview {
  padding: 24px;
  background: linear-gradient(180deg, rgba(212,175,55,0.05), transparent);
  border-right: 1px solid rgba(212,175,55,0.15);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.preview-frame {
  aspect-ratio: 1;
  border-radius: 12px;
  border: 1px solid rgba(212,175,55,0.25);
  background: rgba(0,0,0,0.5);
  overflow: hidden;
  position: relative;
}
.preview-frame::before {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px dashed rgba(212,175,55,0.15);
  border-radius: 8px;
  pointer-events: none;
  z-index: 2;
}
.preview-frame img { width: 100%; height: 100%; object-fit: cover; }
.preview-empty {
  width: 100%; height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(245,230,200,0.4);
}
.preview-empty span { font-size: 3rem; }
.preview-empty small {
  font-family: 'Cinzel', serif;
  font-size: 0.65rem;
  letter-spacing: 2px;
  text-transform: uppercase;
}
.preview-caption {
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid rgba(212,175,55,0.15);
}
.caption-label {
  display: block;
  font-family: 'Cinzel', serif;
  font-size: 0.6rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(245,230,200,0.5);
  margin-bottom: 4px;
}
.preview-caption strong {
  font-family: 'Cinzel', serif;
  color: #d4af37;
  font-size: 1rem;
  letter-spacing: 1px;
}

.museum-form { padding: 26px 28px; display: flex; flex-direction: column; gap: 14px; }
.museum-title {
  margin: 0;
  font-family: 'Cinzel', serif;
  color: #f5e6c8;
  font-size: 1.25rem;
  letter-spacing: 1.5px;
}
.museum-sub {
  margin: 0 0 8px;
  font-style: italic;
  font-size: 0.85rem;
  color: rgba(245,230,200,0.5);
}
.museum-field { display: flex; flex-direction: column; gap: 6px; }
.museum-field label {
  font-family: 'Cinzel', serif;
  font-size: 0.65rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(245,230,200,0.6);
}
.museum-field input,
.museum-field textarea {
  padding: 11px 14px;
  border-radius: 10px;
  border: 1px solid rgba(212,175,55,0.2);
  background: rgba(0,0,0,0.5);
  color: #f5e6c8;
  font-family: 'Crimson Text', serif;
  font-size: 0.95rem;
  resize: none;
  transition: all 0.2s ease;
}
.museum-field input:focus,
.museum-field textarea:focus {
  outline: none;
  border-color: #d4af37;
  background: rgba(0,0,0,0.7);
  box-shadow: 0 0 0 3px rgba(212,175,55,0.15);
}

.museum-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid rgba(212,175,55,0.12);
}
.btn-ghost {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid rgba(245,230,200,0.2);
  color: rgba(245,230,200,0.7);
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-ghost:hover { background: rgba(245,230,200,0.05); }
.btn-gold {
  flex: 1.4;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #d4af37, #b8972e);
  color: #1a140f;
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 16px rgba(212,175,55,0.3);
}
.btn-gold:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(212,175,55,0.5); }
.btn-gold .arrow { transition: transform 0.25s ease; }
.btn-gold:hover .arrow { transform: translateX(4px); }

/* ===== MODAL CONFIRMAR ===== */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.confirm-modal {
  width: 100%;
  max-width: 420px;
  background: linear-gradient(160deg, #1a150e, #0b0a08);
  border: 1px solid rgba(212,175,55,0.25);
  border-radius: 20px;
  overflow: hidden;
  box-shadow:
    0 30px 80px rgba(0,0,0,0.9),
    0 0 60px rgba(212,175,55,0.08),
    inset 0 1px 0 rgba(212,175,55,0.1);
}

.confirm-header {
  padding: 28px 24px 18px;
  text-align: center;
  background: linear-gradient(180deg, rgba(255,80,80,0.08), transparent);
  border-bottom: 1px solid rgba(255,80,80,0.15);
}
.confirm-icon {
  width: 72px; height: 72px;
  margin: 0 auto 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  background: rgba(255,80,80,0.12);
  border: 2px solid rgba(255,80,80,0.3);
  box-shadow: 0 0 30px rgba(255,80,80,0.2);
  animation: pulseWarning 2s ease-in-out infinite;
}
@keyframes pulseWarning {
  0%, 100% { box-shadow: 0 0 30px rgba(255,80,80,0.2); }
  50% { box-shadow: 0 0 50px rgba(255,80,80,0.4); }
}
.confirm-header h3 {
  margin: 0;
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
  letter-spacing: 2px;
  color: #ff8a8a;
}

.confirm-body {
  padding: 24px 28px;
  text-align: center;
}
.confirm-message {
  margin: 0 0 16px;
  font-size: 0.95rem;
  color: rgba(245,230,200,0.7);
  line-height: 1.5;
}
.confirm-target {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 18px;
  margin: 0 0 16px;
  border-radius: 12px;
  background: rgba(212,175,55,0.08);
  border: 1px solid rgba(212,175,55,0.2);
}
.target-icon { font-size: 1.4rem; }
.confirm-target strong {
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  color: #d4af37;
  letter-spacing: 1px;
}
.confirm-warning {
  margin: 0;
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(255,80,80,0.06);
  border: 1px solid rgba(255,80,80,0.15);
  font-size: 0.8rem;
  font-style: italic;
  color: rgba(255,138,138,0.7);
  line-height: 1.4;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  padding: 0 24px 24px;
}
.btn-cancel {
  flex: 1;
  padding: 14px 20px;
  border-radius: 12px;
  background: transparent;
  border: 1px solid rgba(245,230,200,0.25);
  color: rgba(245,230,200,0.8);
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.25s ease;
}
.btn-cancel:hover:not(:disabled) {
  background: rgba(245,230,200,0.08);
  border-color: rgba(245,230,200,0.4);
}
.btn-delete {
  flex: 1.3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #ff5a5a, #c73e3e);
  color: #fff;
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 6px 20px rgba(255,90,90,0.3);
}
.btn-delete:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(255,90,90,0.5);
}
.btn-delete:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== TRANSITIONS ===== */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
}
.fade-scale-enter-from .modal-museum,
.fade-scale-leave-to .modal-museum,
.fade-scale-enter-from .confirm-modal,
.fade-scale-leave-to .confirm-modal {
  transform: scale(0.95) translateY(20px);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 800px) {
  .page-header { flex-direction: column; text-align: center; }
  .museum-body { grid-template-columns: 1fr; }
  .museum-preview { border-right: none; border-bottom: 1px solid rgba(212,175,55,0.15); }
  .preview-frame { aspect-ratio: 16/9; }
  .confirm-actions { flex-direction: column; }
}
</style>
