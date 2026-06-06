<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const open = ref(false)
const showLogoutModal = ref(false)
const wrapperRef = ref(null)

const user = computed(() => {
  const data = localStorage.getItem('user')
  return data ? JSON.parse(data) : { name: 'Usuário Explorador' }
})

const inicial = computed(() => user.value.name?.[0]?.toUpperCase() || 'U')
const firstName = computed(() => user.value.name?.split(' ')[0] || 'Usuário')

function toggle() {
  open.value = !open.value
}

const handleClickOutside = (event) => {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

function goToProfile() {
  router.push('/profile')
  open.value = false
}

function askLogout() {
  open.value = false
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
</script>

<template>
  <div class="wrapper" ref="wrapperRef">
    <div class="user-trigger" :class="{ 'is-active': open }" @click="toggle">
      <div class="avatar-container">
        <div class="avatar-ring"></div>
        <div class="avatar-core">{{ inicial }}</div>
      </div>
      <div class="user-info">
        <span class="name">{{ firstName }}</span>
        <span class="rank">Explorador</span>
      </div>
      <svg class="chevron" :class="{ rotate: open }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>

    <Transition name="menu-anim">
      <div v-if="open" class="dropdown-menu">
        <div class="menu-header">
          <p>Sua Conta</p>
        </div>
        <div class="menu-content">
          <button @click.stop="goToProfile" class="menu-item">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Meu Perfil</span>
          </button>

          <div class="divider"></div>

          <button @click.stop="askLogout" class="menu-item logout">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- ============================
         MODAL DE LOGOUT (ESTILO MUSEU)
    ============================ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showLogoutModal" class="logout-overlay" @click.self="cancelLogout">
          <Transition name="pop" appear>
            <div v-if="showLogoutModal" class="logout-modal">
              <!-- Cantos ornamentais -->
              <span class="corner tl"></span>
              <span class="corner tr"></span>
              <span class="corner bl"></span>
              <span class="corner br"></span>

              <!-- Selo girando -->
              <div class="seal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>

              <p class="modal-eyebrow">— Encerramento de Sessão —</p>
              <h2 class="modal-title">Deixar a Expedição?</h2>
              <div class="ornament">
                <span></span><span class="diamond">◆</span><span></span>
              </div>
              <p class="modal-desc">
                Sua jornada pelo museu será pausada. Os fósseis aguardarão seu retorno
                no próximo acesso, paleontólogo.
              </p>

              <div class="modal-actions">
                <button class="btn ghost" @click="cancelLogout">
                  <span>Continuar Explorando</span>
                </button>
                <button class="btn danger" @click="confirmLogout">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span>Sim, Sair</span>
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
.wrapper {
  --gold: #d4af37;
  --gold-light: #f1d98a;
  --bg-dark: #120c08;
  --text-cream: #f5e6c8;
  --danger: #ff4d4d;
  position: relative;
  font-family: 'Cormorant Garamond', serif;
}

/* === GATILHO === */
.user-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 14px 6px 6px;
  border-radius: 40px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(212, 175, 55, 0.1);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  user-select: none;
}
.user-trigger:hover, .user-trigger.is-active {
  background: rgba(212, 175, 55, 0.08);
  border-color: rgba(212, 175, 55, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.avatar-container { position: relative; width: 38px; height: 38px; }
.avatar-core {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, var(--gold), #8a6a1f);
  color: #000; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 1.1rem; z-index: 2;
  font-family: 'Cinzel', serif;
}
.avatar-ring {
  position: absolute; inset: -3px;
  border: 1px solid var(--gold);
  border-radius: 50%; opacity: 0.3;
  transition: all 0.4s ease;
}
.user-trigger:hover .avatar-ring { inset: -5px; opacity: 0.6; }

.user-info { display: flex; flex-direction: column; line-height: 1.1; }
.name {
  color: var(--text-cream); font-weight: 600;
  font-family: 'Cinzel', serif; font-size: 0.9rem; letter-spacing: 0.5px;
}
.rank {
  font-size: 0.65rem; color: var(--gold);
  text-transform: uppercase; letter-spacing: 1px; opacity: 0.7;
}
.chevron { width: 16px; height: 16px; color: var(--gold); transition: transform 0.4s ease; }
.chevron.rotate { transform: rotate(180deg); }

/* === DROPDOWN === */
.dropdown-menu {
  position: absolute; top: calc(100% + 12px); right: 0;
  width: 200px;
  background: rgba(18, 12, 8, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.7);
  z-index: 1000; overflow: hidden;
}
.menu-header {
  padding: 12px 16px;
  background: rgba(212, 175, 55, 0.05);
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
}
.menu-header p {
  margin: 0; font-size: 0.7rem;
  text-transform: uppercase; letter-spacing: 2px;
  color: var(--gold); opacity: 0.8;
}
.menu-content { padding: 6px; }
.menu-item {
  width: 100%; display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; background: transparent; border: none;
  color: var(--text-cream); font-size: 0.95rem; cursor: pointer;
  border-radius: 8px; transition: all 0.2s ease;
  font-family: 'Cormorant Garamond', serif;
}
.icon { width: 18px; height: 18px; opacity: 0.7; transition: 0.2s; }
.menu-item:hover { background: rgba(212, 175, 55, 0.1); color: #fff; }
.menu-item:hover .icon { opacity: 1; transform: translateX(2px); }
.divider { height: 1px; background: rgba(212, 175, 55, 0.1); margin: 6px 12px; }
.logout { color: var(--danger); }
.logout:hover { background: rgba(255, 77, 77, 0.08); }

.menu-anim-enter-active { animation: menu-in 0.3s cubic-bezier(0.23, 1, 0.32, 1); }
.menu-anim-leave-active { animation: menu-in 0.2s reverse ease-in; }
@keyframes menu-in {
  from { opacity: 0; transform: translateY(-10px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ============================
   MODAL DE LOGOUT
============================ */
.logout-overlay {
  position: fixed; inset: 0;
  background:
    radial-gradient(circle at 50% 30%, rgba(212,175,55,0.12), transparent 60%),
    rgba(8, 5, 3, 0.85);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
  font-family: 'Cormorant Garamond', serif;
  padding: 20px;
}

.logout-modal {
  position: relative;
  width: 100%; max-width: 460px;
  background:
    linear-gradient(145deg, #1a1108 0%, #0e0905 100%);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  padding: 50px 40px 36px;
  text-align: center;
  color: #f5e6c8;
  box-shadow:
    0 30px 80px rgba(0,0,0,0.8),
    0 0 60px rgba(212,175,55,0.08),
    inset 0 0 40px rgba(212,175,55,0.04);
  overflow: hidden;
}

.logout-modal::before {
  content: '';
  position: absolute; inset: 8px;
  border: 1px dashed rgba(212, 175, 55, 0.2);
  border-radius: 4px;
  pointer-events: none;
}

/* Cantos ornamentais */
.corner {
  position: absolute; width: 22px; height: 22px;
  border: 2px solid #d4af37; opacity: 0.8;
}
.corner.tl { top: 14px; left: 14px; border-right: none; border-bottom: none; }
.corner.tr { top: 14px; right: 14px; border-left: none; border-bottom: none; }
.corner.bl { bottom: 14px; left: 14px; border-right: none; border-top: none; }
.corner.br { bottom: 14px; right: 14px; border-left: none; border-top: none; }

/* Selo */
.seal {
  width: 70px; height: 70px;
  margin: 0 auto 18px;
  border-radius: 50%;
  background: radial-gradient(circle, #2a1a0c, #0e0905);
  border: 2px solid #d4af37;
  display: flex; align-items: center; justify-content: center;
  color: #d4af37;
  box-shadow:
    0 0 25px rgba(212,175,55,0.35),
    inset 0 0 15px rgba(212,175,55,0.15);
  animation: pulseSeal 2.4s ease-in-out infinite;
}
.seal svg { width: 32px; height: 32px; }

@keyframes pulseSeal {
  0%,100% { box-shadow: 0 0 25px rgba(212,175,55,0.35), inset 0 0 15px rgba(212,175,55,0.15); }
  50%     { box-shadow: 0 0 40px rgba(212,175,55,0.55), inset 0 0 20px rgba(212,175,55,0.25); }
}

.modal-eyebrow {
  margin: 0 0 6px;
  font-size: 0.75rem;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #d4af37;
  opacity: 0.85;
  font-family: 'Cinzel', serif;
}

.modal-title {
  font-family: 'Cinzel', serif;
  font-size: 1.9rem;
  margin: 0 0 14px;
  color: #f1d98a;
  letter-spacing: 1px;
  text-shadow: 0 0 18px rgba(212,175,55,0.3);
}

.ornament {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; margin: 0 auto 16px;
  width: 60%;
}
.ornament span:not(.diamond) {
  flex: 1; height: 1px;
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
}
.diamond { color: #d4af37; font-size: 0.75rem; }

.modal-desc {
  margin: 0 0 28px;
  font-size: 1.05rem;
  line-height: 1.55;
  color: #d8c8a5;
  opacity: 0.9;
  padding: 0 8px;
}

.modal-actions {
  display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
}

.btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  position: relative; overflow: hidden;
}
.btn svg { width: 16px; height: 16px; }

.btn.ghost {
  background: transparent;
  color: #f1d98a;
  border: 1px solid rgba(212, 175, 55, 0.4);
}
.btn.ghost:hover {
  background: rgba(212, 175, 55, 0.1);
  border-color: #d4af37;
  transform: translateY(-2px);
}

.btn.danger {
  background: linear-gradient(135deg, #7a1f1f, #4a1010);
  color: #ffd9d9;
  border: 1px solid rgba(255, 77, 77, 0.5);
  box-shadow: 0 4px 18px rgba(255,77,77,0.2);
}
.btn.danger:hover {
  background: linear-gradient(135deg, #951f1f, #5a1010);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(255,77,77,0.4);
}
.btn.danger::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(120deg, transparent, rgba(255,255,255,0.15), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}
.btn.danger:hover::before { transform: translateX(100%); }

/* Animações modal */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.pop-enter-active { animation: popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-leave-active { animation: popIn 0.25s reverse ease-in; }
@keyframes popIn {
  from { opacity: 0; transform: translateY(20px) scale(0.92) rotateX(8deg); }
  to   { opacity: 1; transform: translateY(0) scale(1) rotateX(0); }
}

@media (max-width: 768px) {
  .user-info { display: none; }
  .user-trigger { padding: 5px; }
  .chevron { display: none; }
  .modal-title { font-size: 1.5rem; }
  .logout-modal { padding: 40px 24px 28px; }
  .btn { flex: 1; padding: 12px 14px; font-size: 0.75rem; }
}
</style>
