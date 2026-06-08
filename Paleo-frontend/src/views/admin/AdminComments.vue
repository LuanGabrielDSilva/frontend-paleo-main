<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import api from "@/services/api";

const comments = ref<any[]>([]);
const loading = ref(false);
const search = ref("");
const filterRating = ref<number | null>(null);

// Toast system (substitui alert())
type Toast = { id: number; type: "success" | "error" | "info"; message: string };
const toasts = ref<Toast[]>([]);
let toastId = 0;
function pushToast(type: Toast["type"], message: string) {
  const id = ++toastId;
  toasts.value.push({ id, type, message });
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, 3500);
}

// Modal de confirmação (substitui window.confirm)
const confirmState = ref<{
  open: boolean;
  title: string;
  message: string;
  resolve?: (v: boolean) => void;
}>({ open: false, title: "", message: "" });

function askConfirm(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    confirmState.value = { open: true, title, message, resolve };
  });
}
function resolveConfirm(v: boolean) {
  confirmState.value.resolve?.(v);
  confirmState.value.open = false;
}

async function loadComments() {
  try {
    loading.value = true;
    const response = await api.get("/admin/comments");
    comments.value = response.data;
    pushToast("info", `${response.data.length} comentário(s) carregado(s)`);
  } catch (err) {
    console.error(err);
    pushToast("error", "Não foi possível carregar os comentários");
  } finally {
    loading.value = false;
  }
}

async function deleteComment(id: string) {
  const ok = await askConfirm(
    "Excluir comentário",
    "Esta ação é permanente. Deseja realmente remover este comentário?"
  );
  if (!ok) return;

  try {
    await api.delete(`/admin/comments/${id}`);
    comments.value = comments.value.filter((c) => c.id !== id);
    pushToast("success", "Comentário removido");
  } catch (err) {
    console.error(err);
    pushToast("error", "Falha ao excluir comentário");
  }
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return comments.value.filter((c) => {
    const matchesQ =
      !q ||
      c.text?.toLowerCase().includes(q) ||
      c.user?.name?.toLowerCase().includes(q) ||
      c.product?.name?.toLowerCase().includes(q);
    const matchesR = filterRating.value === null || c.rating === filterRating.value;
    return matchesQ && matchesR;
  });
});

const stats = computed(() => {
  const total = comments.value.length;
  const avg =
    total === 0
      ? 0
      : comments.value.reduce((s, c) => s + (c.rating || 0), 0) / total;
  const fiveStars = comments.value.filter((c) => c.rating === 5).length;
  return { total, avg: avg.toFixed(1), fiveStars };
});

function initials(name?: string) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

onMounted(() => {
  loadComments();
});
</script>

<template>
  <div class="admin-comments">
    <!-- Hero header -->
    <header class="hero">
      <div class="hero-text">
        <span class="eyebrow">PAINEL · MODERAÇÃO</span>
        <h1>Comentários</h1>
        <p>Gerencie, filtre e modere todas as avaliações da plataforma.</p>
      </div>
      <button class="refresh-btn" :disabled="loading" @click="loadComments">
        <span class="dot" :class="{ spinning: loading }"></span>
        {{ loading ? "Atualizando..." : "Atualizar" }}
      </button>
    </header>

    <!-- Stats -->
    <section class="stats">
      <div class="stat-card">
        <span class="stat-label">Total</span>
        <span class="stat-value">{{ stats.total }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Nota média</span>
        <span class="stat-value">{{ stats.avg }} <small>★</small></span>
      </div>
      <div class="stat-card">
        <span class="stat-label">5 estrelas</span>
        <span class="stat-value">{{ stats.fiveStars }}</span>
      </div>
    </section>

    <!-- Filtros -->
    <section class="toolbar">
      <div class="search">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input v-model="search" type="text" placeholder="Buscar por usuário, produto ou texto..." />
      </div>
      <div class="rating-filter">
        <button
          class="chip"
          :class="{ active: filterRating === null }"
          @click="filterRating = null"
        >Todas</button>
        <button
          v-for="r in [5, 4, 3, 2, 1]"
          :key="r"
          class="chip"
          :class="{ active: filterRating === r }"
          @click="filterRating = r"
        >{{ r }}★</button>
      </div>
    </section>

    <!-- Conteúdo -->
    <div v-if="loading" class="state">
      <div class="skeleton" v-for="i in 3" :key="i"></div>
    </div>

    <div v-else-if="filtered.length === 0" class="state empty">
      <div class="empty-icon">💬</div>
      <h3>Nada por aqui</h3>
      <p>Nenhum comentário corresponde aos filtros aplicados.</p>
    </div>

    <ul v-else class="cards">
      <li v-for="comment in filtered" :key="comment.id" class="card">
        <div class="card-left">
          <div class="avatar">{{ initials(comment.user?.name) }}</div>
        </div>
        <div class="card-body">
          <div class="card-head">
            <div>
              <strong class="user">{{ comment.user?.name || "Usuário removido" }}</strong>
              <span class="muted"> em </span>
              <span class="product">{{ comment.product?.name || "Produto removido" }}</span>
            </div>
            <div class="meta">
              <span class="rating">
                <span v-for="n in 5" :key="n" :class="['star', { filled: n <= comment.rating }]">★</span>
              </span>
              <span class="date">{{ formatDate(comment.created_at) }}</span>
            </div>
          </div>
          <p class="text">{{ comment.text }}</p>
        </div>
        <button class="delete-btn" @click="deleteComment(comment.id)" title="Excluir comentário">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
          Excluir
        </button>
      </li>
    </ul>

    <!-- Modal de confirmação (Teleport para o body — não quebra layout) -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirmState.open" class="modal-backdrop" @click.self="resolveConfirm(false)">
          <div class="modal" role="dialog" aria-modal="true">
            <div class="modal-icon">!</div>
            <h2>{{ confirmState.title }}</h2>
            <p>{{ confirmState.message }}</p>
            <div class="modal-actions">
              <button class="btn-ghost" @click="resolveConfirm(false)">Cancelar</button>
              <button class="btn-danger" @click="resolveConfirm(true)">Excluir</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toasts -->
    <Teleport to="body">
      <div class="toast-stack">
        <TransitionGroup name="toast">
          <div v-for="t in toasts" :key="t.id" :class="['toast', t.type]">
            <span class="toast-dot"></span>
            {{ t.message }}
          </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-comments {
  color: #f5e6c8;
  padding: 4px;
  max-width: 100%;
}

/* HERO */
.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  padding: 28px 30px;
  margin-bottom: 22px;
  border-radius: 18px;
  background:
    radial-gradient(120% 180% at 0% 0%, rgba(212, 175, 55, 0.18) 0%, transparent 55%),
    radial-gradient(120% 180% at 100% 100%, rgba(212, 175, 55, 0.08) 0%, transparent 60%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
  border: 1px solid rgba(212, 175, 55, 0.22);
  position: relative;
  overflow: hidden;
}
.hero::before {
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(212,175,55,0.06), transparent);
  transform: translateX(-100%);
  animation: shimmer 6s ease-in-out infinite;
}
@keyframes shimmer { 50% { transform: translateX(100%); } 100% { transform: translateX(100%); } }

.eyebrow {
  font-size: 11px;
  letter-spacing: 3px;
  color: #d4af37;
  font-weight: 700;
  opacity: 0.85;
}
.hero h1 {
  margin: 6px 0 4px;
  font-size: 34px;
  font-weight: 800;
  background: linear-gradient(135deg, #f5e6c8 0%, #d4af37 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: -0.5px;
}
.hero p { margin: 0; opacity: 0.7; font-size: 14px; }

.refresh-btn {
  display: inline-flex; align-items: center; gap: 10px;
  background: linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.12));
  border: 1px solid rgba(212, 175, 55, 0.45);
  color: #f5e6c8;
  padding: 12px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.25s ease;
}
.refresh-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.18);
  background: linear-gradient(135deg, rgba(212,175,55,0.35), rgba(212,175,55,0.18));
}
.refresh-btn:disabled { opacity: 0.6; cursor: wait; }
.dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #d4af37; box-shadow: 0 0 12px #d4af37;
}
.dot.spinning { animation: pulse 1s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: 0.3; transform: scale(0.7); } }

/* STATS */
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 22px;
}
.stat-card {
  padding: 18px 20px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(212, 175, 55, 0.15);
  display: flex; flex-direction: column; gap: 6px;
  transition: 0.25s;
}
.stat-card:hover {
  border-color: rgba(212, 175, 55, 0.35);
  background: rgba(212, 175, 55, 0.04);
}
.stat-label { font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.65; }
.stat-value { font-size: 26px; font-weight: 800; color: #d4af37; }
.stat-value small { font-size: 16px; }

/* TOOLBAR */
.toolbar {
  display: flex; gap: 14px; flex-wrap: wrap;
  margin-bottom: 20px;
  align-items: center;
}
.search {
  flex: 1; min-width: 240px;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(212, 175, 55, 0.18);
  border-radius: 12px;
  color: #d4af37;
  transition: 0.2s;
}
.search:focus-within {
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.08);
}
.search input {
  flex: 1; background: transparent; border: 0; outline: 0;
  color: #f5e6c8; font-size: 14px;
}
.search input::placeholder { color: rgba(245, 230, 200, 0.4); }

.rating-filter { display: flex; gap: 6px; flex-wrap: wrap; }
.chip {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(212, 175, 55, 0.2);
  background: transparent;
  color: #f5e6c8;
  cursor: pointer;
  font-size: 13px; font-weight: 600;
  transition: 0.2s;
}
.chip:hover { border-color: rgba(212, 175, 55, 0.45); }
.chip.active {
  background: rgba(212, 175, 55, 0.2);
  border-color: #d4af37;
  color: #d4af37;
}

/* CARDS */
.cards { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
.card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(212, 175, 55, 0.12);
  border-radius: 14px;
  transition: 0.25s;
}
.card:hover {
  border-color: rgba(212, 175, 55, 0.3);
  background: rgba(212, 175, 55, 0.04);
  transform: translateY(-1px);
}
.avatar {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(212,175,55,0.3), rgba(212,175,55,0.1));
  border: 1px solid rgba(212, 175, 55, 0.35);
  color: #d4af37;
  display: grid; place-items: center;
  font-weight: 700; font-size: 14px;
}
.card-head {
  display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  margin-bottom: 8px;
}
.user { color: #f5e6c8; font-weight: 700; }
.product { color: #d4af37; font-weight: 600; }
.muted { opacity: 0.5; }
.meta { display: flex; align-items: center; gap: 12px; font-size: 12px; }
.rating { display: inline-flex; gap: 2px; }
.star { color: rgba(245, 230, 200, 0.2); font-size: 14px; }
.star.filled { color: #d4af37; }
.date { opacity: 0.55; }
.text { margin: 0; line-height: 1.55; opacity: 0.88; }

.delete-btn {
  align-self: flex-start;
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(220, 53, 69, 0.1);
  color: #ff8a8a;
  border: 1px solid rgba(220, 53, 69, 0.3);
  padding: 9px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px; font-weight: 600;
  transition: 0.2s;
}
.delete-btn:hover {
  background: rgba(220, 53, 69, 0.22);
  border-color: rgba(220, 53, 69, 0.5);
  transform: translateY(-1px);
}

/* ESTADOS */
.state { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
.skeleton {
  height: 88px; border-radius: 14px;
  background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(212,175,55,0.06) 50%, rgba(255,255,255,0.02) 100%);
  background-size: 200% 100%;
  animation: skel 1.4s ease-in-out infinite;
  border: 1px solid rgba(212, 175, 55, 0.1);
}
@keyframes skel { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.empty {
  align-items: center; text-align: center;
  padding: 50px 20px;
  border: 1px dashed rgba(212, 175, 55, 0.2);
  border-radius: 16px;
}
.empty-icon { font-size: 42px; margin-bottom: 8px; }
.empty h3 { margin: 6px 0; color: #d4af37; }
.empty p { margin: 0; opacity: 0.6; }

/* MODAL */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(8, 5, 2, 0.65);
  backdrop-filter: blur(6px);
  display: grid; place-items: center;
  z-index: 9999;
  padding: 20px;
}
.modal {
  width: 100%; max-width: 420px;
  background: linear-gradient(160deg, #1a1410 0%, #221912 100%);
  border: 1px solid rgba(212, 175, 55, 0.35);
  border-radius: 18px;
  padding: 28px;
  text-align: center;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(212, 175, 55, 0.1) inset;
}
.modal-icon {
  width: 56px; height: 56px;
  margin: 0 auto 14px;
  border-radius: 50%;
  display: grid; place-items: center;
  background: rgba(220, 53, 69, 0.15);
  border: 1px solid rgba(220, 53, 69, 0.4);
  color: #ff8a8a;
  font-size: 26px; font-weight: 800;
}
.modal h2 { margin: 0 0 8px; color: #d4af37; font-size: 20px; }
.modal p { margin: 0 0 22px; opacity: 0.8; line-height: 1.5; font-size: 14px; }
.modal-actions { display: flex; gap: 10px; justify-content: center; }
.btn-ghost, .btn-danger {
  padding: 11px 20px; border-radius: 10px;
  cursor: pointer; font-weight: 600; font-size: 14px;
  transition: 0.2s; border: 1px solid transparent;
}
.btn-ghost {
  background: transparent;
  color: #f5e6c8;
  border-color: rgba(212, 175, 55, 0.25);
}
.btn-ghost:hover { background: rgba(212, 175, 55, 0.08); }
.btn-danger {
  background: linear-gradient(135deg, #dc3545, #a82836);
  color: #fff;
}
.btn-danger:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(220, 53, 69, 0.35); }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.25s cubic-bezier(.2,.9,.3,1.2), opacity 0.2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.92) translateY(8px); opacity: 0; }

/* TOASTS */
.toast-stack {
  position: fixed; top: 20px; right: 20px;
  display: flex; flex-direction: column; gap: 10px;
  z-index: 10000;
}
.toast {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px; min-width: 260px;
  background: linear-gradient(135deg, #1a1410, #221912);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  color: #f5e6c8;
  box-shadow: 0 12px 36px rgba(0,0,0,0.5);
  font-size: 14px;
}
.toast-dot { width: 8px; height: 8px; border-radius: 50%; background: #d4af37; }
.toast.success { border-color: rgba(40, 200, 120, 0.45); }
.toast.success .toast-dot { background: #4ade80; box-shadow: 0 0 10px #4ade80; }
.toast.error { border-color: rgba(220, 53, 69, 0.5); }
.toast.error .toast-dot { background: #ff8a8a; box-shadow: 0 0 10px #ff8a8a; }
.toast.info .toast-dot { box-shadow: 0 0 10px #d4af37; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateX(40px); }
.toast-leave-to { opacity: 0; transform: translateX(40px); }

@media (max-width: 720px) {
  .stats { grid-template-columns: 1fr; }
  .hero { flex-direction: column; align-items: flex-start; padding: 22px; }
  .card { grid-template-columns: auto 1fr; }
  .delete-btn { grid-column: 1 / -1; justify-self: end; }
}
</style>
