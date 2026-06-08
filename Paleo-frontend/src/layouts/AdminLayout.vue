<template>
  <div class="admin-layout">
    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="logo">
        🦴 PALEO ADMIN
      </div>

      <nav class="nav">
        <router-link to="/admin">Geral</router-link>
        <router-link to="/admin/users">Usuários</router-link>
        <router-link to="/admin/eras">Eras</router-link>
        <router-link to="/admin/periodos">Períodos</router-link>
        <router-link to="/admin/animals">Animais</router-link>
        <router-link to="/admin/products">Produtos</router-link>
        <router-link to="/admin/orders">Pedidos</router-link>
        <router-link to="/admin/comments">Comentários</router-link>
      </nav>

      <div class="divider"></div>

      <div class="admin-info">
        {{ user?.name || 'Administrador' }} • Admin Panel
      </div>

      <div class="logout" @click="logout">
        Sair
      </div>
    </aside>

    <!-- CONTEÚDO -->
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { onMounted, ref } from "vue";

const router = useRouter();
const user = ref<any>({});

onMounted(() => {
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    user.value = JSON.parse(savedUser);
  }
});

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  router.push("/login");
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #0b0a08;
  color: #f5e6c8;
  font-family: 'Cinzel', serif;
}

/* =========================
   SIDEBAR
========================= */
.sidebar {
  width: 260px;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  padding: 26px 18px;

  background: linear-gradient(180deg, #0f0d0a, #060504);
  border-right: 1px solid rgba(212,175,55,0.15);
  z-index: 100;

  display: flex;
  flex-direction: column;
}

.logo {
  text-align: center;
  color: #d4af37;
  font-weight: bold;
  margin-bottom: 30px;
  letter-spacing: 2px;
}

/* =========================
   NAV
========================= */
.nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav a {
  color: #f5e6c8;
  text-decoration: none;
  padding: 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav a:hover {
  background: rgba(212,175,55,0.1);
  transform: translateX(3px);
}

.nav a.router-link-exact-active {
  background: rgba(212,175,55,0.2);
  border-left: 3px solid #d4af37;
  font-weight: bold;
}

/* =========================
   DIVIDER
========================= */
.divider {
  height: 1px;
  margin: 15px 0;
  background: rgba(212,175,55,0.2);
}

/* =========================
   ADMIN INFO
========================= */
.admin-info {
  margin-top: auto;
  font-size: 0.8rem;
  text-align: center;
  opacity: 0.7;
}

/* =========================
   LOGOUT
========================= */
.logout {
  margin-top: 10px;
  text-align: center;
  padding: 10px;
  cursor: pointer;
  color: #ff8a8a;
  border: 1px solid rgba(255,80,80,0.2);
  border-radius: 8px;
  transition: 0.2s;
}

.logout:hover {
  background: rgba(255,80,80,0.08);
}

/* =========================
   CONTENT
========================= */
.content {
  margin-left: 260px;
  width: calc(100% - 260px);
  padding: 30px;
  min-height: 100vh;
}
</style>