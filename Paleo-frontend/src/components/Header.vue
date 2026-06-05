<template>
  <header
    class="topbar"
    :class="{ 'topbar--scrolled': isScrolled }"
  >
    <div class="topbar__container">
      <!-- Logo -->
      <div class="topbar__logo">
        <router-link to="/home" class="logo-link">
          <img
            src="/Logo.jpg"
            alt="Paleo Park"
            class="logo-image"
            :class="{ loading: isLoading }"
          />
          <span class="logo-text">Paleo Park</span>
          <span class="logo-glow"></span>
        </router-link>
      </div>

      <!-- Menu de Navegação -->
      <nav class="topbar__nav" :class="{ 'nav--open': menuOpen }">
        <router-link
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          active-class="nav-link--active"
        >
          <span class="nav-link__text">{{ link.label }}</span>
          <span class="nav-link__line"></span>
        </router-link>
      </nav>

      <!-- Ações do Usuário -->
      <div class="topbar__actions">
        <!-- Perfil -->
        <UserProfile />

        <!-- Menu Mobile -->
        <button
          class="menu-toggle"
          @click="menuOpen = !menuOpen"
          :aria-expanded="menuOpen"
          aria-label="Toggle menu"
        >
          <span class="menu-toggle__line"></span>
          <span class="menu-toggle__line"></span>
          <span class="menu-toggle__line"></span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import UserProfile from '@/components/UserProfile.vue'

const menuOpen = ref(false)
const isScrolled = ref(false)
const isLoading = ref(true)

const navLinks = [
  { to: '/home', label: 'Home' },
  { to: '/animals', label: 'Animais' },
  { to: '/eras', label: 'Eras' },
  { to: '/game', label: 'Jogo' },
  { to: '/wallet', label: 'Carteira' },
  { to: '/shop', label: 'Loja' },
]

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  
  // Animação de carregamento da logo
  setTimeout(() => {
    isLoading.value = false
  }, 1800)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

/* ====================== VARIÁVEIS ====================== */
:root {
  --topbar-height: 80px;
  --bg-topbar: hsla(30, 20%, 5%, 0.75);
  --bg-topbar-scroll: hsla(30, 20%, 5%, 0.95);
  --gold: hsl(36, 60%, 50%);
  --gold-light: hsl(40, 70%, 70%);
  --gold-dim: hsla(36, 60%, 50%, 0.6);
  --fg: hsl(36, 50%, 88%);
  --fg-dim: hsl(36, 20%, 65%);
  --border-gold: hsla(36, 60%, 50%, 0.28);
}

/* ====================== TOPBAR BASE ====================== */
.topbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
  height: var(--topbar-height);
  background: var(--bg-topbar);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid var(--border-gold);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideDown 0.6s ease-out;
}
.topbar--scrolled {
  height: 70px;
  background: var(--bg-topbar-scroll);
  border-bottom-color: hsla(36, 60%, 50%, 0.45);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.topbar__container {
  max-width: 1440px;
  height: 100%;
  margin: 0 auto;
  padding: 0 clamp(20px, 4vw, 60px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

/* ====================== LOGO ====================== */
.topbar__logo {
  position: relative;
  z-index: 10;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  color: inherit;
  padding: 6px 10px;
  border-radius: 12px;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo-link:hover {
  transform: scale(1.04);
}

/* Imagem da Logo - REDONDA + ANIMAÇÃO DE CARREGAMENTO */
.logo-image {
  width: 54px;
  height: 54px;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid var(--gold);
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.4);
  transition: all 0.4s ease;
  flex-shrink: 0;
  position: relative;
}

/* Animação de Carregando */
.logo-image.loading {
  animation: logo-loading-spin 1.2s linear infinite;
  border-color: var(--gold-light);
  box-shadow: 0 0 18px rgba(212, 175, 55, 0.6);
}

.logo-image.loading::after {
  content: '';
  position: absolute;
  inset: -6px;
  border: 3px solid transparent;
  border-top-color: var(--gold-light);
  border-radius: 50%;
  animation: logo-loading-ring 1s linear infinite;
}

.logo-link:hover .logo-image:not(.loading) {
  border-color: var(--gold-light);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.55);
}

/* Texto da Logo */
.logo-text {
  font-family: 'Cinzel Decorative', serif;
  font-size: 1.48rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  background: linear-gradient(
    135deg,
    hsl(45, 80%, 72%) 0%,
    hsl(38, 70%, 55%) 50%,
    hsl(45, 80%, 72%) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 16px rgba(212, 175, 55, 0.45);
  transition: all 0.4s ease;
}

.logo-link:hover .logo-text {
  text-shadow: 0 6px 22px rgba(212, 175, 55, 0.65);
  transform: translateY(-1px);
}

/* Glow Effect */
.logo-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(
    circle at center,
    hsla(36, 80%, 60%, 0.22) 0%,
    transparent 68%
  );
  border-radius: 50%;
  opacity: 0;
  pointer-events: none;
  z-index: -1;
  transition: opacity 0.5s ease;
}

.logo-link:hover .logo-glow {
  opacity: 1;
  animation: logo-glow-pulse 3s ease-in-out infinite;
}

/* ====================== NAVEGAÇÃO ====================== */
.topbar__nav {
  display: flex;
  align-items: center;
  gap: clamp(16px, 3vw, 32px);
  flex: 1;
  justify-content: center;
}
.nav-link {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--fg-dim);
  transition: color 0.35s ease, transform 0.25s ease;
  cursor: pointer;
}
.nav-link:hover {
  color: var(--gold-light);
  transform: translateY(-2px);
}
.nav-link__text {
  position: relative;
  z-index: 1;
}
.nav-link__line {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 60%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--gold),
    transparent
  );
  border-radius: 2px;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px var(--gold);
}
.nav-link:hover .nav-link__line,
.nav-link--active .nav-link__line {
  transform: translateX(-50%) scaleX(1);
}
.nav-link--active {
  color: var(--gold);
}

/* ====================== AÇÕES (CARRINHO + PERFIL) ====================== */
.topbar__actions {
  display: flex;
  align-items: center;
  gap: 18px;
}
.cart-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: hsla(36, 60%, 50%, 0.08);
  border: 1px solid var(--border-gold);
  border-radius: 6px;
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--fg);
  transition: all 0.35s ease;
  overflow: hidden;
}
.cart-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    transparent,
    hsla(36, 60%, 50%, 0.15),
    transparent
  );
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}
.cart-btn:hover {
  background: hsla(36, 60%, 50%, 0.18);
  border-color: hsla(36, 60%, 50%, 0.55);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.2);
}
.cart-btn:hover::before {
  transform: translateX(100%);
}
.cart-icon {
  width: 20px;
  height: 20px;
  color: var(--gold);
  transition: transform 0.3s ease;
}
.cart-btn:hover .cart-icon {
  transform: scale(1.1) rotate(5deg);
}
.cart-label {
  font-weight: 600;
}
.cart-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e63946, #d62828);
  border: 2px solid hsl(30, 20%, 5%);
  border-radius: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  animation: badge-pop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* ====================== MENU MOBILE ====================== */
.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 28px;
  height: 22px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}
.menu-toggle__line {
  width: 100%;
  height: 3px;
  background: var(--gold);
  border-radius: 2px;
  transition: all 0.3s ease;
  box-shadow: 0 0 6px var(--gold-dim);
}
.menu-toggle:hover .menu-toggle__line {
  background: var(--gold-light);
  box-shadow: 0 0 10px var(--gold);
}

/* ====================== ANIMAÇÕES ====================== */
@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes logo-loading-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes logo-loading-ring {
  to { transform: rotate(360deg); }
}

@keyframes logo-glow-pulse {
  0%, 100% { transform: scale(0.92); opacity: 0.65; }
  50%      { transform: scale(1.15); opacity: 1; }
}

@keyframes badge-pop {
  0% { transform: scale(0); }
  70% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

/* ====================== RESPONSIVO ====================== */
@media (max-width: 1024px) {
  .topbar__nav {
    gap: 20px;
  }
  .nav-link {
    font-size: 0.82rem;
    padding: 6px 10px;
  }
}
@media (max-width: 768px) {
  .topbar {
    height: 70px;
  }
 
  .topbar__nav {
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 20px;
    background: var(--bg-topbar-scroll);
    border-bottom: 1px solid var(--border-gold);
    transform: translateY(-120%);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  }
 
  .nav--open {
    transform: translateY(0);
    opacity: 1;
  }
 
  .nav-link {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-gold);
    font-size: 1rem;
  }
 
  .nav-link:hover {
    transform: translateX(8px);
    background: hsla(36, 60%, 50%, 0.08);
  }
 
  .cart-label {
    display: none;
  }
 
  .menu-toggle {
    display: flex;
  }
}
@media (max-width: 480px) {
  .topbar__logo {
    font-size: 1.1rem;
  }
 
  .cart-btn {
    padding: 8px 12px;
    font-size: 0;
  }
 
  .cart-icon {
    width: 22px;
    height: 22px;
  }
}
/* Reduz animações se usuário preferir */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>