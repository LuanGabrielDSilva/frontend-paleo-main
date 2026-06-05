<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()

/* =========================
   STATE
========================= */
const user = ref(null)
const favoriteAnimals = ref([])
const orders = ref([])

const showId = ref(false)
const showLogoutModal = ref(false)
const showEditModal = ref(false)
const activeTab = ref('overview')

const editName = ref('')
const editPassword = ref('')
const isSaving = ref(false)
const errorMessage = ref('')

/* =========================
   LOAD USER + DATA
========================= */
const loadUser = async () => {
  try {
    const [userRes, animalsRes, , ordersRes] = await Promise.all([
      api.get('/me'),
      api.get('/animals'),
      api.get('/expeditions'),
      api.get('/orders')
    ])

    user.value = userRes.data
    localStorage.setItem('user', JSON.stringify(userRes.data))

    const savedFavorites = JSON.parse(
      localStorage.getItem('paleo-favorites') || '[]'
    )

    favoriteAnimals.value = animalsRes.data.filter((animal) =>
      savedFavorites.includes(String(animal.id))
    )

    orders.value = ordersRes.data || []
  } catch (error) {
    console.log(error)
    if (error?.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.replace('/login')
    }
  }
}

/* =========================
   EDIT USER
========================= */
function openEditModal() {
  editName.value = user.value?.name || ''
  editPassword.value = ''
  errorMessage.value = ''
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
}

async function saveName() {
  if (!editName.value.trim()) {
    errorMessage.value = 'O nome não pode ficar vazio.'
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    const token = localStorage.getItem('token')
    const payload = { name: editName.value.trim() }
    if (editPassword.value) payload.password = editPassword.value

    await api.put(`/users/${user.value.id}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    })

    user.value.name = payload.name
    localStorage.setItem('user', JSON.stringify(user.value))
    editPassword.value = ''
    showEditModal.value = false
    await loadUser()
  } catch (err) {
    console.log(err)
    errorMessage.value = 'Erro ao atualizar usuário.'
  } finally {
    isSaving.value = false
  }
}

/* =========================
   TABS
========================= */
const tabs = computed(() => [
  {
    id: 'overview',
    label: 'Visão Geral',
    count: null,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>'
  },
  {
    id: 'account',
    label: 'Conta',
    count: null,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
  },
  {
    id: 'animals',
    label: 'Animais',
    count: favoriteAnimals.value.length,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 12.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0z"/><path d="M14.5 12.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0z"/><path d="M9 18c1 1 2 1.5 3 1.5s2-.5 3-1.5"/></svg>'
  },
  {
    id: 'orders',
    label: 'Pedidos',
    count: orders.value.length,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v4H3z"/><path d="M5 7v13h14V7"/><path d="M9 12h6"/></svg>'
  }
])

const userInitial = computed(() =>
  user.value?.name ? user.value.name.charAt(0).toUpperCase() : 'U'
)

/* =========================
   LOGOUT
========================= */
function askLogout() {
  showLogoutModal.value = true
}
function confirmLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  showLogoutModal.value = false
  router.push('/login')
}
function cancelLogout() {
  showLogoutModal.value = false
}

function openAnimal(animal) {
  router.push({
    path: "/animals",
    query: {
      id: animal.id
    }
  });
}

/* =========================
   INIT
========================= */
onMounted(() => {
  loadUser()
})
</script>

<template>
  <div class="profile-page">
    <div class="container">

      <!-- ===== HEADER ===== -->
      <header class="profile-hero">
        <div class="hero-left">
          <div class="avatar-big">{{ userInitial }}</div>

          <div class="identity">
            <span class="eyebrow">— Ficha do Paleontólogo —</span>
            <h1>{{ user?.name || 'Nome não informado' }}</h1>
            <p class="email">{{ user?.email || 'Email não informado' }}</p>
            <span class="badge" :class="user?.role">
              {{ user?.role === 'admin' ? 'Administrador' : 'Explorador' }}
            </span>
          </div>
        </div>

        <div class="hero-right">
          <div class="mini-stat">
            <span class="mini-label">Saldo</span>
            <span class="mini-value">
              R$ {{ Number(user?.balance || 0).toFixed(2) }}
            </span>
          </div>

          <div class="mini-stat highlight">
            <span class="mini-label">Moedas</span>
            <span class="mini-value coin">
              <img src="@/assets/moedaDoSite.png" alt="Moeda" class="coin-icon" />
              {{ user?.coins || 0 }}
            </span>
          </div>

          <button class="btn-logout" @click="askLogout" title="Sair da conta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      <!-- ===== DASHBOARD ===== -->
      <div class="dashboard">

        <!-- NAV LATERAL -->
        <nav class="side-nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="nav-item"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <span class="nav-icon" v-html="tab.icon"></span>
            <span class="nav-label">{{ tab.label }}</span>
            <span v-if="tab.count !== null" class="nav-count">{{ tab.count }}</span>
          </button>
        </nav>

        <!-- PAINEL -->
        <section class="panel">
          <Transition name="swap" mode="out-in">
            <div :key="activeTab" class="panel-inner">

              <!-- ===== OVERVIEW ===== -->
              <div v-if="activeTab === 'overview'">
                <div class="panel-head">
                  <h2>Visão Geral</h2>
                  <span class="panel-sub">Resumo da sua expedição</span>
                </div>

                <div class="overview-grid">
                  <div class="ov-card">
                    <span class="ov-num">{{ favoriteAnimals.length }}</span>
                    <span class="ov-cap">Espécies</span>
                  </div>
                  <div class="ov-card">
                    <span class="ov-num">{{ user?.coins || 0 }}</span>
                    <span class="ov-cap">Moedas</span>
                  </div>
                  <div class="ov-card">
                    <span class="ov-num">R$ {{ Number(user?.balance || 0).toFixed(2) }}</span>
                    <span class="ov-cap">Saldo</span>
                  </div>
                  <div class="ov-card">
                    <span class="ov-num">{{ orders.length }}</span>
                    <span class="ov-cap">Pedidos</span>
                  </div>
                </div>

                <div class="quick-info">
                  <h3>Status</h3>
                  <p>
                    Continue explorando espécies pré-históricas para evoluir
                    seu perfil no museu paleontológico.
                  </p>
                </div>
              </div>

              <!-- ===== ACCOUNT ===== -->
              <div v-else-if="activeTab === 'account'">
                <div class="panel-head">
                  <h2>Informações da Conta</h2>
                  <span class="panel-sub">Seus dados pessoais</span>
                </div>

                <div class="info-list">
                  <div class="info-row">
                    <span class="label">Nome completo</span>
                    <span class="value">{{ user?.name || '—' }}</span>
                  </div>

                  <div class="info-row">
                    <span class="label">Email</span>
                    <span class="value">{{ user?.email || '—' }}</span>
                  </div>

                  <div class="info-row">
                    <span class="label">Tipo de conta</span>
                    <span class="value">
                      {{ user?.role === 'admin' ? 'Administrador do Sistema' : 'Conta de Usuário' }}
                    </span>
                  </div>

                  <div class="info-row">
                    <span class="label">ID do usuário</span>
                    <span class="value">
                      <span class="id-text">
                        {{ showId ? (user?.id || '—') : '••••••••••••' }}
                      </span>
                      <button @click="showId = !showId" class="btn-toggle-id">👁</button>
                    </span>
                  </div>
                </div>

                <!-- Botão Premium "Editar Perfil" -->
                <div class="edit-action-wrap">
                  <button
                    class="edit-btn"
                    @click="openEditModal"
                    aria-label="Editar Perfil do paleontólogo"
                    type="button"
                  >
                    <span class="edit-btn__shine" aria-hidden="true"></span>
                    <span class="edit-btn__glow" aria-hidden="true"></span>
                    <span class="edit-btn__corner edit-btn__corner--tl" aria-hidden="true"></span>
                    <span class="edit-btn__corner edit-btn__corner--tr" aria-hidden="true"></span>
                    <span class="edit-btn__corner edit-btn__corner--bl" aria-hidden="true"></span>
                    <span class="edit-btn__corner edit-btn__corner--br" aria-hidden="true"></span>
                    <span class="edit-btn__icon" aria-hidden="true">✏️</span>
                    <span class="edit-btn__label">Editar perfil</span>
                  </button>
                </div>
              </div>

              <!-- ===== ANIMALS ===== -->
              <div v-else-if="activeTab === 'animals'">
                <div class="panel-head">
                  <h2>Animais Descobertos</h2>
                  <span class="panel-sub">{{ favoriteAnimals.length }} espécie(s)</span>
                </div>

               <div v-if="favoriteAnimals.length" class="animals-grid">
                <div
                  v-for="animal in favoriteAnimals"
                  :key="animal.id"
                  class="animal-card"
                  @click="openAnimal(animal)"
                >
                  <img
                    :src="animal.image"
                    :alt="animal.name"
                    class="animal-image"
                  />

                  <span class="animal-name">
                    {{ animal.name }}
                  </span>
                </div>
              </div>

                <p v-else class="empty">Nenhum animal descoberto ainda.</p>
              </div>

              <!-- ===== ORDERS ===== -->
              <div v-else-if="activeTab === 'orders'">
                <div class="panel-head">
                  <h2>Meus Pedidos</h2>
                  <span class="panel-sub">{{ orders.length }} pedido(s)</span>
                </div>

                <div v-if="orders.length" class="purchases-scroll">
                  <div v-for="order in orders" :key="order.id" class="purchase-card">
                    <div class="purchase-header">
                      <div>
                        <span class="purchase-id">
                          Pedido #{{ order.id.slice(0, 8) }}
                        </span>
                        <span class="purchase-date">
                          {{ new Date(order.created_at).toLocaleDateString('pt-BR') }}
                        </span>
                      </div>
                      <span class="purchase-status" :class="order.status">
                        {{
                          order.status === 'pending' ? 'Preparando' :
                          order.status === 'on_the_way' ? 'Chegando' :
                          order.status === 'delivered' ? 'Entregue' : order.status
                        }}
                      </span>
                    </div>

                    <div class="purchase-products">
                      <div v-for="item in order.items" :key="item.id" class="purchase-product">
                        <img :src="item.product.image" :alt="item.product.name" />
                        <div>
                          <strong>{{ item.product.name }}</strong>
                          <p>Quantidade: {{ item.quantity }}</p>
                        </div>
                      </div>
                    </div>

                    <div class="purchase-footer">
                      Total: R$ {{ order.total.toFixed(2) }}
                    </div>
                  </div>
                </div>

                <p v-else class="empty">Nenhum pedido encontrado.</p>
              </div>

            </div>
          </Transition>
        </section>
      </div>
    </div>

    <!-- ===== MODAL LOGOUT ===== -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showLogoutModal" class="logout-overlay" @click.self="cancelLogout">
          <Transition name="pop" appear>
            <div class="logout-modal">
              <span class="corner tl"></span>
              <span class="corner tr"></span>
              <span class="corner bl"></span>
              <span class="corner br"></span>

              <div class="seal">🚪</div>

              <p class="modal-eyebrow">— Encerramento de Sessão —</p>
              <h2 class="modal-title">Deixar a Expedição?</h2>

              <div class="ornament">
                <span></span><span class="diamond">◆</span><span></span>
              </div>

              <p class="modal-desc">
                Sua jornada ficará salva até o próximo acesso.
              </p>

              <div class="modal-actions">
                <button class="btn ghost" @click="cancelLogout">Continuar Explorando</button>
                <button class="btn danger" @click="confirmLogout">Sim, Sair</button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- ===== MODAL Editar Perfil ===== -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEditModal" class="logout-overlay" @click.self="closeEditModal">
          <Transition name="pop" appear>
            <div class="logout-modal">
              <span class="corner tl"></span>
              <span class="corner tr"></span>
              <span class="corner bl"></span>
              <span class="corner br"></span>

              <div class="seal">✏️</div>

              <p class="modal-eyebrow">— Atualizar Registro —</p>
              <h2 class="modal-title">Editar Perfil</h2>

              <div class="ornament">
                <span></span><span class="diamond">◆</span><span></span>
              </div>

              <div class="edit-user-box">
                <input
                  v-model="editName"
                  type="text"
                  placeholder="Novo nome"
                  class="edit-input"
                  @keyup.enter="saveName"
                />
                <input
                  v-model="editPassword"
                  type="password"
                  placeholder="Nova senha (opcional)"
                  class="edit-input"
                />
                <p v-if="errorMessage" class="edit-error">{{ errorMessage }}</p>
              </div>

              <div class="modal-actions" style="margin-top: 18px;">
                <button class="btn ghost" @click="closeEditModal" :disabled="isSaving">
                  Cancelar
                </button>
                <button class="btn danger" @click="saveName" :disabled="isSaving">
                  {{ isSaving ? 'Salvando...' : 'Salvar' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ====== PAGE ====== */
.profile-page {
  background:
    radial-gradient(circle at 20% 10%, rgba(212,175,55,0.07), transparent 50%),
    radial-gradient(circle at 80% 90%, rgba(141,107,63,0.08), transparent 50%),
    #0b0a08;
  min-height: 100vh;
  color: #f5e6c8;
  padding: 30px 20px;
  font-family: 'Crimson Text', 'Cormorant Garamond', serif;
}
.container { max-width: 1200px; margin: 0 auto; }

/* ====== HERO ====== */
.profile-hero {
  display: flex; justify-content: space-between; align-items: center;
  gap: 24px; flex-wrap: wrap;
  background: linear-gradient(145deg, #16120c, #0e0a06);
  border: 1px solid #3a2f1d; border-radius: 16px;
  padding: 22px 28px; margin-bottom: 24px;
  position: relative; overflow: hidden;
}
.profile-hero::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(circle at 30% 50%, rgba(212,175,55,0.08), transparent 60%);
  pointer-events: none;
}
.hero-left { display: flex; align-items: center; gap: 22px; position: relative; }
.avatar-big {
  width: 90px; height: 90px; border-radius: 50%;
  background: linear-gradient(135deg, #d4af37, #8d6b3f);
  color: #0b0a08; font-size: 2.6rem; font-weight: bold;
  display: flex; align-items: center; justify-content: center;
  border: 3px solid #d4af37;
  box-shadow: 0 0 25px rgba(212,175,55,0.3);
}
.identity { display: flex; flex-direction: column; gap: 4px; }
.eyebrow {
  font-family: 'Cinzel', serif;
  font-size: 0.7rem; letter-spacing: 3px;
  color: #d4af37; opacity: 0.8; text-transform: uppercase;
}
.identity h1 {
  font-family: 'Cinzel', serif;
  font-size: 1.7rem; margin: 0; color: #f1d98a;
}
.email { font-size: 0.95rem; opacity: 0.75; margin: 0; }
.badge {
  align-self: flex-start; margin-top: 4px;
  padding: 4px 14px; border-radius: 30px;
  font-size: 0.75rem; font-weight: 600; letter-spacing: 1px;
  background: rgba(212,175,55,0.15); color: #d4af37;
  border: 1px solid rgba(212,175,55,0.3); text-transform: uppercase;
}
.badge.admin { background: #8d6b3f; color: white; border-color: #8d6b3f; }

.hero-right {
  display: flex; align-items: center; gap: 14px;
  position: relative; flex-wrap: wrap;
}
.mini-stat {
  background: rgba(0,0,0,0.3);
  border: 1px solid #3a2f1d; border-radius: 12px;
  padding: 12px 18px;
  display: flex; flex-direction: column; min-width: 110px;
}
.mini-stat.highlight { border-color: #d4af37; }
.mini-label {
  font-size: 0.7rem; letter-spacing: 2px;
  color: #bba980; text-transform: uppercase;
}
.mini-value {
  font-family: 'Cinzel', serif;
  font-size: 1.1rem; color: #d4af37; font-weight: bold;
  margin-top: 4px;
}
.coin { display: flex; align-items: center; gap: 8px; }
.coin-icon {
  width: 22px; height: 22px; object-fit: contain;
  filter: drop-shadow(0 0 4px rgba(212,175,55,0.6));
}
.btn-logout {
  width: 46px; height: 46px; border-radius: 50%;
  background: transparent; color: #ff6b6b;
  border: 1px solid rgba(255,107,107,0.4);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.3s ease;
}
.btn-logout svg { width: 20px; height: 20px; }
.btn-logout:hover {
  background: rgba(255,107,107,0.1);
  border-color: #ff8a8a; transform: rotate(-10deg) scale(1.05);
  box-shadow: 0 0 18px rgba(255,107,107,0.25);
}

/* ====== DASHBOARD ====== */
.dashboard {
  display: grid; grid-template-columns: 240px 1fr;
  gap: 22px; align-items: start;
}

/* ====== NAV LATERAL ====== */
.side-nav {
  display: flex; flex-direction: column; gap: 6px;
  background: linear-gradient(145deg, #16120c, #0e0a06);
  border: 1px solid #3a2f1d;
  border-radius: 16px; padding: 14px;
  position: sticky; top: 20px;
}
.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 10px;
  background: transparent; border: 1px solid transparent;
  color: #bba980; cursor: pointer; text-align: left;
  font-family: 'Cinzel', serif; font-size: 0.9rem;
  letter-spacing: 1px; transition: all 0.25s ease;
  position: relative;
}
.nav-item:hover { background: rgba(212,175,55,0.06); color: #f1d98a; }
.nav-item.active {
  background: linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05));
  border-color: rgba(212,175,55,0.4); color: #f1d98a;
  box-shadow: inset 0 0 20px rgba(212,175,55,0.08);
}
.nav-item.active::before {
  content: ''; position: absolute; left: -1px; top: 20%; bottom: 20%;
  width: 3px; background: #d4af37; border-radius: 4px;
}
.nav-icon { display: flex; }
.nav-icon :deep(svg) { width: 18px; height: 18px; }
.nav-label { flex: 1; }
.nav-count {
  background: rgba(212,175,55,0.15); color: #d4af37;
  border-radius: 20px; padding: 2px 9px; font-size: 0.75rem;
  font-family: 'Crimson Text', serif; font-weight: bold;
}

/* ====== PAINEL ====== */
.panel {
  background: linear-gradient(145deg, #16120c, #0e0a06);
  border: 1px solid #3a2f1d; border-radius: 16px;
  padding: 30px; min-height: 480px;
  position: relative; overflow: hidden;
}
.panel-inner { animation: fadeUp 0.4s ease both; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.panel-head {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 26px; padding-bottom: 14px;
  border-bottom: 1px solid #3a2f1d;
}
.panel-head h2 {
  font-family: 'Cinzel', serif;
  color: #f1d98a; margin: 0; font-size: 1.5rem; letter-spacing: 1px;
}
.panel-sub {
  font-size: 0.85rem; color: #bba980;
  font-family: 'Cinzel', serif; letter-spacing: 1px;
}

.swap-enter-active, .swap-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.swap-enter-from { opacity: 0; transform: translateX(10px); }
.swap-leave-to   { opacity: 0; transform: translateX(-10px); }

/* ====== OVERVIEW ====== */
.overview-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px; margin-bottom: 28px;
}
.ov-card {
  background: rgba(0,0,0,0.25);
  border: 1px solid #3a2f1d; border-radius: 12px;
  padding: 22px 18px;
  display: flex; flex-direction: column; gap: 6px;
  transition: all 0.25s ease;
}
.ov-card:hover {
  border-color: #d4af37; transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.4), 0 0 18px rgba(212,175,55,0.1);
}
.ov-num {
  font-family: 'Cinzel', serif;
  font-size: 1.6rem; color: #d4af37; font-weight: bold;
}
.ov-cap {
  font-size: 0.78rem; letter-spacing: 2px;
  color: #bba980; text-transform: uppercase;
}
.quick-info {
  background: rgba(0,0,0,0.2);
  border-left: 3px solid #d4af37;
  padding: 16px 20px; border-radius: 8px;
}
.quick-info h3 {
  font-family: 'Cinzel', serif;
  margin: 0 0 6px; color: #f1d98a; font-size: 1rem; letter-spacing: 1px;
}
.quick-info p { margin: 0; color: #d8c8a5; font-size: 1rem; }

/* ====== ACCOUNT INFO ====== */
.info-list { display: flex; flex-direction: column; gap: 18px; }
.info-row {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 14px; border-bottom: 1px solid #3a2f1d;
}
.info-row:last-child { border-bottom: none; padding-bottom: 0; }
.label { opacity: 0.75; font-size: 1.05rem; }
.value {
  font-weight: 500; font-size: 1.1rem;
  display: flex; align-items: center; gap: 12px;
  color: #f1d98a;
}
.id-text {
  letter-spacing: 1px; min-width: 130px;
  display: inline-block; text-align: right;
}
.btn-toggle-id {
  background: none; border: none; cursor: pointer; padding: 0;
  display: flex; align-items: center; transition: transform 0.2s;
  color: #d4af37; font-size: 1.1rem;
}
.btn-toggle-id:hover { transform: scale(1.15); }

/* ====== BOTÃO PREMIUM EDIT ====== */
.edit-action-wrap {
  margin-top: 30px; display: flex; justify-content: flex-end;
}
.edit-btn {
  --gold: #d4af37;
  --gold-soft: #f1d98a;
  --bg-1: #1a1108;
  --bg-2: #0e0905;
  position: relative;
  display: inline-flex; align-items: center; justify-content: center;
  gap: 10px;
  padding: 14px 32px;
  font-family: 'Cinzel', serif;
  font-size: 0.82rem; font-weight: 600;
  letter-spacing: 3px; text-transform: uppercase;
  color: var(--gold-soft);
  background: linear-gradient(145deg, var(--bg-1), var(--bg-2));
  border: 1px solid rgba(212,175,55,0.4);
  border-radius: 4px; cursor: pointer;
  overflow: hidden; isolation: isolate;
  box-shadow:
    0 4px 18px rgba(0,0,0,0.4),
    inset 0 0 20px rgba(212,175,55,0.06);
  transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1);
}
.edit-btn:hover {
  color: #fff8dc;
  border-color: var(--gold);
  transform: translateY(-2px);
  box-shadow:
    0 10px 28px rgba(0,0,0,0.5),
    0 0 30px rgba(212,175,55,0.25),
    inset 0 0 25px rgba(212,175,55,0.12);
}
.edit-btn:active { transform: translateY(0); transition-duration: 0.12s; }

.edit-btn__shine {
  position: absolute; inset: 0;
  background: linear-gradient(120deg, transparent 0%, rgba(255,235,180,0.18) 50%, transparent 100%);
  transform: translateX(-120%);
  transition: transform 0.7s ease;
  pointer-events: none;
}
.edit-btn:hover .edit-btn__shine { transform: translateX(120%); }

.edit-btn__glow {
  position: absolute; inset: -2px;
  background: radial-gradient(circle at 50% 100%, rgba(212,175,55,0.25), transparent 70%);
  opacity: 0; transition: opacity 0.4s ease;
  pointer-events: none; z-index: -1;
}
.edit-btn:hover .edit-btn__glow { opacity: 1; }

.edit-btn__corner {
  position: absolute; width: 8px; height: 8px;
  border: 1px solid var(--gold); opacity: 0.7;
  transition: all 0.3s ease;
}
.edit-btn__corner--tl { top: 4px; left: 4px;  border-right: none; border-bottom: none; }
.edit-btn__corner--tr { top: 4px; right: 4px; border-left: none;  border-bottom: none; }
.edit-btn__corner--bl { bottom: 4px; left: 4px;  border-right: none; border-top: none; }
.edit-btn__corner--br { bottom: 4px; right: 4px; border-left: none;  border-top: none; }
.edit-btn:hover .edit-btn__corner { opacity: 1; width: 10px; height: 10px; }

.edit-btn__icon {
  font-size: 1rem; transition: transform 0.4s ease;
  filter: drop-shadow(0 0 6px rgba(212,175,55,0.4));
}
.edit-btn:hover .edit-btn__icon { transform: rotate(-12deg) scale(1.15); }
.edit-btn__label { position: relative; z-index: 1; }

/* ====== EDIT MODAL INPUTS ====== */
.edit-user-box {
  margin-top: 8px;
  display: flex; flex-direction: column; gap: 12px;
}
.edit-input {
  width: 100%;
  padding: 13px 14px;
  border-radius: 4px;
  border: 1px solid rgba(212,175,55,0.3);
  background: rgba(0,0,0,0.4);
  color: #f5e6c8;
  font-family: 'Crimson Text', serif;
  font-size: 1rem;
  transition: all 0.25s ease;
}
.edit-input:focus {
  outline: none;
  border-color: #d4af37;
  box-shadow: 0 0 0 3px rgba(212,175,55,0.15);
}
.edit-input::placeholder { color: #bba980; opacity: 0.7; }
.edit-error {
  margin: 4px 0 0; color: #ff8a8a;
  font-size: 0.85rem; font-style: italic;
}

/* ====== ORDERS ====== */
.purchases-scroll {
  display: flex; flex-direction: column; gap: 18px;
  max-height: 540px; overflow-y: auto; padding-right: 6px;
}
.purchases-scroll::-webkit-scrollbar { width: 6px; }
.purchases-scroll::-webkit-scrollbar-thumb {
  background: rgba(212,175,55,0.3); border-radius: 4px;
}
.purchase-card {
  background: linear-gradient(145deg, #1a140d, #120d08);
  border: 1px solid #3a2f1d; border-radius: 14px; padding: 18px;
  transition: all 0.25s ease;
}
.purchase-card:hover {
  border-color: #d4af37; transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.4), 0 0 18px rgba(212,175,55,0.12);
}
.purchase-header {
  display: flex; justify-content: space-between; align-items: center;
  gap: 16px; margin-bottom: 14px;
}
.purchase-id {
  display: block; color: #f1d98a; font-family: 'Cinzel', serif;
  font-size: 0.95rem; margin-bottom: 4px;
}
.purchase-date { color: #bba980; font-size: 0.85rem; }
.purchase-status {
  padding: 6px 12px; border-radius: 30px; font-size: 0.72rem;
  font-weight: bold; text-transform: uppercase; letter-spacing: 1px;
}
.purchase-status.pending    { background: rgba(255,196,0,0.15); color: #ffd54f; }
.purchase-status.on_the_way { background: rgba(0,140,255,0.15); color: #6ec1ff; }
.purchase-status.delivered  { background: rgba(0,255,136,0.12); color: #57ffb0; }

.purchase-products { display: flex; flex-direction: column; gap: 10px; }
.purchase-product {
  display: flex; align-items: center; gap: 12px;
  padding: 10px; border-radius: 10px;
  background: rgba(255,255,255,0.03);
}
.purchase-product img {
  width: 56px; height: 56px; object-fit: cover;
  border-radius: 8px; border: 1px solid #4a3922;
}
.purchase-product strong { display: block; margin-bottom: 4px; color: #f5e6c8; }
.purchase-product p { margin: 0; color: #bba980; font-size: 0.9rem; }
.purchase-footer {
  margin-top: 14px; padding-top: 12px;
  border-top: 1px solid #3a2f1d; text-align: right;
  color: #f1d98a; font-size: 1rem;
}

/* ====== ANIMALS ====== */
.animals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  max-height: 540px; overflow-y: auto; padding-right: 6px;
}
.animals-grid::-webkit-scrollbar { width: 6px; }
.animals-grid::-webkit-scrollbar-thumb {
  background: rgba(212,175,55,0.3); border-radius: 4px;
}
.animal-card {
  background: linear-gradient(145deg, #1a140d, #120d08);
  border: 1px solid #3a2f1d; border-radius: 14px;
  padding: 12px; text-align: center;
  transition: all 0.25s ease;
}
.animal-card:hover {
  transform: translateY(-4px); border-color: #d4af37;
  box-shadow: 0 10px 25px rgba(0,0,0,0.4), 0 0 18px rgba(212,175,55,0.15);
}
.animal-image {
  width: 100%; height: 100px; object-fit: cover;
  border-radius: 10px; border: 1px solid #4a3922; margin-bottom: 8px;
}
.animal-name {
  display: block; color: #f5e6c8; font-size: 0.95rem;
  font-weight: 600; font-family: 'Cinzel', serif;
}
.empty {
  text-align: center; opacity: 0.6; padding: 40px 0;
  font-style: italic; font-size: 1.05rem;
}

/* ====== RESPONSIVO ====== */
@media (max-width: 860px) {
  .dashboard { grid-template-columns: 1fr; }
  .side-nav {
    flex-direction: row; overflow-x: auto; position: static; padding: 10px;
  }
  .nav-item { flex-shrink: 0; }
  .nav-item.active::before { display: none; }
  .nav-label { display: none; }
  .nav-icon :deep(svg) { width: 22px; height: 22px; }
}
@media (max-width: 600px) {
  .profile-hero { flex-direction: column; align-items: flex-start; }
  .hero-right { width: 100%; justify-content: space-between; }
  .mini-stat { min-width: 90px; padding: 10px 14px; }
  .edit-action-wrap { justify-content: stretch; }
  .edit-btn { width: 100%; padding: 13px 18px; font-size: 0.78rem; letter-spacing: 2px; }
}

/* ====== MODAL LOGOUT / EDIT ====== */
.logout-overlay {
  position: fixed; inset: 0;
  background:
    radial-gradient(circle at 50% 30%, rgba(212,175,55,0.12), transparent 60%),
    rgba(8,5,3,0.85);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 20px;
}
.logout-modal {
  position: relative; width: 100%; max-width: 460px;
  background: linear-gradient(145deg, #1a1108 0%, #0e0905 100%);
  border: 1px solid rgba(212,175,55,0.3);
  border-radius: 6px; padding: 50px 40px 36px;
  text-align: center; color: #f5e6c8;
  box-shadow:
    0 30px 80px rgba(0,0,0,0.8),
    0 0 60px rgba(212,175,55,0.08),
    inset 0 0 40px rgba(212,175,55,0.04);
  overflow: hidden;
}
.logout-modal::before {
  content: ''; position: absolute; inset: 8px;
  border: 1px dashed rgba(212,175,55,0.2);
  border-radius: 4px; pointer-events: none;
}
.corner { position: absolute; width: 22px; height: 22px; border: 2px solid #d4af37; opacity: 0.8; }
.corner.tl { top: 14px; left: 14px;  border-right: none; border-bottom: none; }
.corner.tr { top: 14px; right: 14px; border-left: none;  border-bottom: none; }
.corner.bl { bottom: 14px; left: 14px;  border-right: none; border-top: none; }
.corner.br { bottom: 14px; right: 14px; border-left: none;  border-top: none; }

.seal {
  width: 70px; height: 70px; margin: 0 auto 18px;
  border-radius: 50%;
  background: radial-gradient(circle, #2a1a0c, #0e0905);
  border: 2px solid #d4af37;
  display: flex; align-items: center; justify-content: center;
  color: #d4af37; font-size: 1.8rem;
  box-shadow: 0 0 25px rgba(212,175,55,0.35), inset 0 0 15px rgba(212,175,55,0.15);
  animation: pulseSeal 2.4s ease-in-out infinite;
}
@keyframes pulseSeal {
  0%,100% { box-shadow: 0 0 25px rgba(212,175,55,0.35), inset 0 0 15px rgba(212,175,55,0.15); }
  50%     { box-shadow: 0 0 40px rgba(212,175,55,0.55), inset 0 0 20px rgba(212,175,55,0.25); }
}
.modal-eyebrow {
  margin: 0 0 6px; font-size: 0.75rem; letter-spacing: 4px;
  text-transform: uppercase; color: #d4af37; opacity: 0.85;
  font-family: 'Cinzel', serif;
}
.modal-title {
  font-family: 'Cinzel', serif; font-size: 1.9rem; margin: 0 0 14px;
  color: #f1d98a; letter-spacing: 1px;
  text-shadow: 0 0 18px rgba(212,175,55,0.3);
}
.ornament {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; margin: 0 auto 16px; width: 60%;
}
.ornament span:not(.diamond) {
  flex: 1; height: 1px;
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
}
.diamond { color: #d4af37; font-size: 0.75rem; }
.modal-desc {
  margin: 0 0 28px; font-size: 1.05rem; line-height: 1.55;
  color: #d8c8a5; opacity: 0.9; padding: 0 8px;
}
.modal-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

.btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 8px; padding: 12px 22px; border-radius: 4px; cursor: pointer;
  font-family: 'Cinzel', serif; font-size: 0.85rem; letter-spacing: 1.5px;
  text-transform: uppercase;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  position: relative; overflow: hidden;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn.ghost {
  background: transparent; color: #f1d98a;
  border: 1px solid rgba(212,175,55,0.4);
}
.btn.ghost:hover:not(:disabled) {
  background: rgba(212,175,55,0.1);
  border-color: #d4af37; transform: translateY(-2px);
}
.btn.danger {
  background: linear-gradient(135deg, #7a1f1f, #4a1010);
  color: #ffd9d9;
  border: 1px solid rgba(255,77,77,0.5);
  box-shadow: 0 4px 18px rgba(255,77,77,0.2);
}
.btn.danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #951f1f, #5a1010);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(255,77,77,0.4);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.pop-enter-active { animation: popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-leave-active { animation: popIn 0.25s reverse ease-in; }
@keyframes popIn {
  from { opacity: 0; transform: translateY(20px) scale(0.92); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ====== REDUCED MOTION ====== */
@media (prefers-reduced-motion: reduce) {
  .edit-btn, .edit-btn__shine, .edit-btn__icon, .edit-btn__glow, .edit-btn__corner,
  .btn, .seal { transition: none !important; animation: none !important; }
  .edit-btn:hover { transform: none; }
}
</style>
