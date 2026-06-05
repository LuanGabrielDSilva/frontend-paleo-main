<template>
  <header class="topbar">
    <div class="left">
      🦖 <span>PaleoApp</span>
    </div>

    <nav class="nav">
      <router-link to="/home">Home</router-link>
      <router-link to="/animals">Animais</router-link>
      <router-link to="/eras">Eras</router-link>
      <router-link to="/users">Usuários</router-link>
      <router-link to="/game">Jogo</router-link>
    </nav>

    <div class="right">
      🧬 Museu Digital
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 100;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 16px 30px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(212,175,55,0.2);
}

.left {
  color: #d4af37;
  font-weight: bold;
  display: flex;
  gap: 8px;
}

.nav {
  display: flex;
  gap: 15px;
}

.nav a {
  color: #f5e6c8;
  text-decoration: none;
}

.nav a.router-link-active {
  color: #d4af37;
  border-bottom: 2px solid #d4af37;
}
</style>