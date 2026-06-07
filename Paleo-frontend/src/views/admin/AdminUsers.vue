<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import api from "../../services/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const users = ref<User[]>([]);
const loading = ref(true);
const search = ref("");
const sortBy = ref<"recent" | "name" | "email">("recent");

const selected = ref<User | null>(null);
const userToDelete = ref<User | null>(null);
const showCreatePanel = ref(false);

const newUser = ref({ name: "", email: "", password: "" });
const passwordVisible = ref(false);

const notification = ref({ visible: false, message: "", type: "error" as "error" | "success" });

function showAlert(message: string, type: "error" | "success" = "error") {
  notification.value = { visible: true, message, type };
  setTimeout(() => (notification.value.visible = false), 3800);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidName(name: string): boolean {
  const t = name.trim();
  return t.length >= 3 && t.includes(" ");
}

async function load() {
  loading.value = true;
  try {
    const res = await api.get("/users");
    users.value = res.data;
  } finally {
    loading.value = false;
  }
}
onMounted(load);

async function create() {
  if (!newUser.value.name || !newUser.value.email || !newUser.value.password) {
    showAlert("Preencha todos os campos para prosseguir."); return;
  }
  if (!isValidName(newUser.value.name)) {
    showAlert("Informe o nome completo (Nome e Sobrenome)."); return;
  }
  if (!isValidEmail(newUser.value.email)) {
    showAlert("O formato do e-mail não é válido."); return;
  }
  if (newUser.value.password.length < 6) {
    showAlert("A senha deve conter pelo menos 6 caracteres."); return;
  }

  try {
    await api.post("/users", newUser.value);
    newUser.value = { name: "", email: "", password: "" };
    passwordVisible.value = false;
    showCreatePanel.value = false;
    showAlert("Explorador documentado com sucesso!", "success");
    await load();
  } catch {
    showAlert("Falha mística: não foi possível registrar o usuário.");
  }
}

function openEdit(u: User) { selected.value = { ...u }; }
function askRemove(u: User) { userToDelete.value = u; }

async function saveEdit() {
  if (!selected.value) return;
  if (!selected.value.name || !selected.value.email) { showAlert("Campos não podem estar vazios."); return; }
  if (!isValidName(selected.value.name)) { showAlert("Forneça o nome completo."); return; }
  if (!isValidEmail(selected.value.email)) { showAlert("E-mail inválido."); return; }
  try {
    await api.put(`/users/${selected.value.id}`, { name: selected.value.name, email: selected.value.email });
    selected.value = null;
    showAlert("Crônicas atualizadas com sucesso.", "success");
    await load();
  } catch {
    showAlert("Erro ao salvar as modificações.");
  }
}

async function confirmRemove() {
  if (!userToDelete.value) return;
  try {
    await api.delete(`/users/${userToDelete.value.id}`);
    users.value = users.value.filter((u) => u.id !== userToDelete.value!.id);
    showAlert("Explorador banido com sucesso.", "success");
  } catch {
    showAlert("Erro ao tentar remover o explorador.");
  } finally {
    userToDelete.value = null;
  }
}

const filtered = computed(() => {
  let list = [...users.value];
  const q = search.value.trim().toLowerCase();
  if (q) list = list.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  switch (sortBy.value) {
    case "name":  list.sort((a, b) => (a.name || "").localeCompare(b.name || "")); break;
    case "email": list.sort((a, b) => (a.email || "").localeCompare(b.email || "")); break;
    default: break;
  }
  return list;
});

function initials(n: string) {
  return (n || "?").trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}
function maskedDomain(email: string) {
  const at = email?.indexOf("@");
  return at > 0 ? email.slice(at) : "";
}
</script>

<template>
  <div class="page">
    <div class="bg-grain"></div>
    <div class="bg-glow bg-glow-a"></div>
    <div class="bg-glow bg-glow-b"></div>

    <!-- TOAST -->
    <transition name="toast">
      <div v-if="notification.visible" class="toast" :class="notification.type">
        <span class="toast-bar"></span>
        <div class="toast-body">
          <span class="toast-tag">{{ notification.type === 'error' ? 'AVISO DO REINO' : 'CRÔNICA REAL' }}</span>
          <p>{{ notification.message }}</p>
        </div>
        <button class="toast-x" @click="notification.visible = false" aria-label="Fechar">×</button>
      </div>
    </transition>

    <!-- HEADER -->
    <header class="head">
      <div class="head-left">
        <span class="crumb">
          <span class="crumb-mark">◆</span> ADMIN · CODEX DOS EXPLORADORES
        </span>
        <h1 class="title">Conselho dos <em>Usuários</em></h1>
        <p class="subtitle">Inscreva, edite e mantenha as crônicas dos exploradores do reino jurássico.</p>
      </div>

      <div class="head-right">
        <div class="head-counter">
          <span class="counter-num">{{ users.length }}</span>
          <span class="counter-lbl">Exploradores</span>
        </div>
        <button class="btn-add" @click="showCreatePanel = !showCreatePanel">
          <span class="btn-add-plus" :class="{ rot: showCreatePanel }">+</span>
          <span>{{ showCreatePanel ? 'Cancelar inscrição' : 'Novo Explorador' }}</span>
        </button>
      </div>
    </header>

    <!-- CREATE PANEL -->
    <transition name="panel">
      <section v-if="showCreatePanel" class="create-panel">
        <div class="create-grid">
          <div class="create-side">
            <span class="side-tag">FORMULÁRIO</span>
            <h2>Inscrever no Banco Real</h2>
            <p>Preencha os pergaminhos abaixo para gravar um novo nome no codex.</p>
            <ul class="rules">
              <li><span>01</span> Nome completo (Nome e Sobrenome)</li>
              <li><span>02</span> E-mail em formato válido</li>
              <li><span>03</span> Senha com 6+ caracteres</li>
            </ul>
          </div>

          <form class="create-form" autocomplete="off" @submit.prevent="create">
            <label class="field">
              <span class="field-lbl">Nome do Explorador</span>
              <input v-model="newUser.name" type="text" placeholder="ex.: Cláudia Aurora Ferreira" autocomplete="off" />
            </label>

            <label class="field">
              <span class="field-lbl">E-mail de Contato</span>
              <input v-model="newUser.email" type="email" placeholder="ex.: claudia@reino.com" autocomplete="new-email" />
            </label>

            <label class="field">
              <span class="field-lbl">Senha de Acesso</span>
              <div class="pwd">
                <input
                  v-model="newUser.password"
                  :type="passwordVisible ? 'text' : 'password'"
                  placeholder="Mínimo de 6 caracteres"
                  autocomplete="new-password"
                />
                <button type="button" class="pwd-toggle" @click="passwordVisible = !passwordVisible">
                  {{ passwordVisible ? 'Ocultar' : 'Mostrar' }}
                </button>
              </div>
            </label>

            <div class="form-foot">
              <button type="button" class="btn-ghost" @click="showCreatePanel = false">Voltar</button>
              <button type="submit" class="btn-gold">
                <span>Insculpir no Codex</span>
                <span class="arrow">→</span>
              </button>
            </div>
          </form>
        </div>
      </section>
    </transition>

    <!-- TOOLBAR -->
    <section class="toolbar">
      <div class="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input v-model="search" type="text" placeholder="Buscar exploradores por nome ou e-mail…" />
        <button v-if="search" class="search-clear" @click="search = ''">×</button>
      </div>

      <div class="sort-wrap">
        <span class="sort-lbl">Ordenar</span>
        <select v-model="sortBy" class="sort">
          <option value="recent">Mais recentes</option>
          <option value="name">Nome (A → Z)</option>
          <option value="email">E-mail (A → Z)</option>
        </select>
      </div>
    </section>

    <!-- TABLE -->
    <section class="table-wrap">
      <div class="thead">
        <span class="th th-id">CODEX</span>
        <span class="th th-name">EXPLORADOR</span>
        <span class="th th-email">CONTATO</span>
        <span class="th th-actions">AÇÕES</span>
      </div>

      <div v-if="loading" class="tbody">
        <div v-for="i in 4" :key="i" class="row row-skeleton"><span></span></div>
      </div>

      <div v-else-if="filtered.length" class="tbody">
        <article v-for="(user, idx) in filtered" :key="user.id" class="row" :style="{ animationDelay: idx * 40 + 'ms' }">
          <div class="cell cell-id">
            <span class="row-index">{{ String(idx + 1).padStart(2, "0") }}</span>
          </div>

          <div class="cell cell-name">
            <div class="avatar">{{ initials(user.name) }}</div>
            <div class="who">
              <strong>{{ user.name || 'Sem nome' }}</strong>
              <span class="who-sub">Membro do reino</span>
            </div>
          </div>

          <div class="cell cell-email">
            <span class="email-full">{{ user.email }}</span>
            <span class="email-domain">{{ maskedDomain(user.email) }}</span>
          </div>

          <div class="cell cell-actions">
            <button class="act act-edit" @click="openEdit(user)" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              <span>Editar</span>
            </button>
            <button
              v-if="user.role !== 'admin'"
              class="act act-del"
              @click="askRemove(user)"
              title="Excluir"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
              </svg>
              <span>Excluir</span>
            </button>
          </div>
        </article>
      </div>

      <div v-else class="empty">
        <span class="empty-mark">◇</span>
        <h3>Nenhum explorador encontrado</h3>
        <p>Ajuste a busca ou registre um novo membro no codex.</p>
      </div>
    </section>

    <!-- EDIT MODAL -->
    <transition name="fade">
      <div v-if="selected" class="modal-wrap" @click.self="selected = null">
        <div class="modal">
          <button class="modal-x" @click="selected = null" aria-label="Fechar">×</button>
          <span class="modal-tag">EDIÇÃO DE CRÔNICA</span>
          <h2>Editar <em>{{ selected.name }}</em></h2>
          <p class="modal-sub">Atualize os dados do explorador. As alterações entram em vigor imediatamente.</p>

          <div class="modal-fields">
            <label class="field">
              <span class="field-lbl">Nome</span>
              <input v-model="selected.name" type="text" autocomplete="off" />
            </label>
            <label class="field">
              <span class="field-lbl">E-mail</span>
              <input v-model="selected.email" type="email" autocomplete="off" />
            </label>
          </div>

          <div class="modal-foot">
            <button class="btn-ghost" @click="selected = null">Cancelar</button>
            <button class="btn-gold" @click="saveEdit">
              <span>Salvar Alterações</span>
              <span class="arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- DELETE CONFIRM MODAL -->
    <transition name="fade">
      <div v-if="userToDelete" class="modal-wrap" @click.self="userToDelete = null">
        <div class="modal modal-danger">
          <button class="modal-x" @click="userToDelete = null" aria-label="Fechar">×</button>
          <span class="modal-tag danger">AÇÃO IRREVERSÍVEL</span>
          <h2>Banir do reino?</h2>
          <p class="modal-sub">
            Você está prestes a remover <strong>{{ userToDelete.name }}</strong> permanentemente das crônicas.
            Esta ação não pode ser desfeita.
          </p>
          <div class="danger-card">
            <div class="avatar danger-avatar">{{ initials(userToDelete.name) }}</div>
            <div>
              <strong>{{ userToDelete.name }}</strong>
              <span>{{ userToDelete.email }}</span>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn-ghost" @click="userToDelete = null">Preservar</button>
            <button class="btn-danger" @click="confirmRemove">
              <span>Confirmar Exclusão</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

.page {
  --bg:      #0a0604;
  --bg-2:    #120c07;
  --panel:   #1a120b;
  --panel-2: #221710;
  --line:    #3a2817;
  --line-2:  #4d3520;
  --text:    #f3e3c4;
  --muted:   #a08868;
  --gold:    #d4af37;
  --gold-2:  #f0d27a;
  --red:     #c0392b;
  --red-2:   #e64545;

  --f-display: 'Cormorant Garamond', serif;
  --f-mono:    'JetBrains Mono', monospace;
  --f-body:    'Inter', sans-serif;

  position: relative;
  min-height: 100vh;
  padding: 56px clamp(20px, 4vw, 64px) 96px;
  background:
    radial-gradient(1200px 700px at 80% -10%, #2a1a0c 0%, transparent 60%),
    radial-gradient(900px 600px at 0% 100%, #1c1208 0%, transparent 55%),
    var(--bg);
  color: var(--text);
  font-family: var(--f-body);
  overflow: hidden;
}

.bg-grain {
  position: absolute; inset: 0; pointer-events: none; opacity: .04;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='.9'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}
.bg-glow { position: absolute; border-radius: 50%; filter: blur(120px); pointer-events: none; opacity: .35; z-index: 0; }
.bg-glow-a { width: 480px; height: 480px; background: #6b3a12; top: -180px; right: -120px; }
.bg-glow-b { width: 380px; height: 380px; background: #2d2010; bottom: -160px; left: -100px; opacity: .25; }

/* ============ TOAST ============ */
.toast {
  position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
  z-index: 9999; display: flex; align-items: stretch; gap: 14px;
  min-width: 320px; max-width: 520px;
  background: linear-gradient(180deg, var(--panel), var(--panel-2));
  border: 1px solid var(--line-2);
  border-radius: 14px; padding: 14px 18px;
  box-shadow: 0 24px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(212,175,55,.05);
  backdrop-filter: blur(14px);
}
.toast-bar { width: 3px; background: var(--gold); border-radius: 3px; }
.toast.error .toast-bar { background: var(--red-2); }
.toast-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.toast-tag { font-family: var(--f-mono); font-size: .65rem; letter-spacing: .25em; color: var(--gold); }
.toast.error .toast-tag { color: #f29a9a; }
.toast-body p { margin: 0; color: var(--text); font-size: .92rem; line-height: 1.4; }
.toast-x { background: transparent; border: none; color: var(--muted); font-size: 1.4rem; cursor: pointer; line-height: 1; padding: 0 4px; transition: .2s; }
.toast-x:hover { color: var(--gold); }
.toast-enter-active, .toast-leave-active { transition: all .35s cubic-bezier(.17,.84,.32,1.27); }
.toast-enter-from { transform: translate(-50%, -30px); opacity: 0; }
.toast-leave-to { transform: translate(-50%, -20px); opacity: 0; }

/* ============ HEAD ============ */
.head { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 36px; flex-wrap: wrap; }
.crumb { display: inline-flex; gap: 10px; align-items: center; color: var(--gold); font-family: var(--f-mono); font-size: .72rem; letter-spacing: .35em; margin-bottom: 14px; }
.crumb-mark { font-size: .9rem; }
.title { font-family: var(--f-display); font-weight: 600; font-size: clamp(2.4rem, 5vw, 3.6rem); line-height: 1; margin: 0; letter-spacing: -.01em; }
.title em { font-style: italic; color: var(--gold); }
.subtitle { color: var(--muted); margin: 14px 0 0; max-width: 560px; line-height: 1.5; }

.head-right { display: flex; align-items: center; gap: 18px; }
.head-counter { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; padding-right: 18px; border-right: 1px solid var(--line); }
.counter-num { font-family: var(--f-display); font-size: 2rem; font-weight: 700; color: var(--gold); line-height: 1; }
.counter-lbl { font-family: var(--f-mono); font-size: .65rem; letter-spacing: .22em; color: var(--muted); text-transform: uppercase; }

.btn-add {
  display: inline-flex; align-items: center; gap: 10px;
  background: linear-gradient(135deg, var(--gold), #b8972e);
  color: #1a120b; border: none;
  padding: 13px 22px 13px 18px; border-radius: 999px;
  font-family: var(--f-mono); font-size: .78rem; letter-spacing: .14em; text-transform: uppercase;
  font-weight: 600; cursor: pointer; transition: .25s ease;
  box-shadow: 0 10px 24px -8px rgba(212,175,55,.55);
}
.btn-add:hover { transform: translateY(-2px); box-shadow: 0 16px 32px -10px rgba(212,175,55,.75); }
.btn-add-plus { font-size: 1.2rem; line-height: 1; transition: transform .35s ease; display: inline-block; }
.btn-add-plus.rot { transform: rotate(45deg); }

/* ============ CREATE PANEL ============ */
.create-panel {
  position: relative; z-index: 1;
  background: linear-gradient(180deg, var(--panel), var(--panel-2));
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 36px;
  margin-bottom: 36px;
  box-shadow: 0 24px 50px rgba(0,0,0,.45);
}
.create-grid { display: grid; grid-template-columns: 280px 1fr; gap: 48px; }
.create-side .side-tag { font-family: var(--f-mono); font-size: .68rem; letter-spacing: .25em; color: var(--gold); }
.create-side h2 { font-family: var(--f-display); font-size: 1.7rem; margin: 10px 0 12px; line-height: 1.15; }
.create-side p { color: var(--muted); margin: 0 0 22px; line-height: 1.5; font-size: .92rem; }
.rules { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.rules li { display: flex; gap: 12px; align-items: center; color: var(--text); font-size: .88rem; }
.rules li span { font-family: var(--f-mono); color: var(--gold); font-size: .72rem; letter-spacing: .15em; }

.create-form { display: flex; flex-direction: column; gap: 18px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field-lbl { font-family: var(--f-mono); font-size: .68rem; letter-spacing: .2em; color: var(--muted); text-transform: uppercase; }
.field input {
  background: var(--bg-2); color: var(--text);
  border: 1px solid var(--line); border-radius: 10px;
  padding: 13px 16px; font-family: var(--f-body); font-size: .98rem;
  outline: none; transition: .2s;
}
.field input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(212,175,55,.12); }
.pwd { position: relative; display: flex; align-items: center; }
.pwd input { flex: 1; padding-right: 100px; }
.pwd-toggle {
  position: absolute; right: 8px;
  background: transparent; border: 1px solid var(--line);
  color: var(--muted); padding: 6px 12px; border-radius: 7px;
  font-family: var(--f-mono); font-size: .68rem; letter-spacing: .15em; text-transform: uppercase;
  cursor: pointer; transition: .2s;
}
.pwd-toggle:hover { color: var(--gold); border-color: var(--gold); }

.form-foot { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }

.btn-gold, .btn-ghost, .btn-danger {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 12px 22px; border-radius: 999px;
  font-family: var(--f-mono); font-size: .76rem; letter-spacing: .14em; text-transform: uppercase;
  font-weight: 600; cursor: pointer; transition: .25s ease;
  border: 1px solid transparent;
}
.btn-gold { background: linear-gradient(135deg, var(--gold), #b8972e); color: #1a120b; box-shadow: 0 8px 22px -8px rgba(212,175,55,.5); }
.btn-gold:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -10px rgba(212,175,55,.7); }
.btn-gold .arrow { transition: transform .25s ease; }
.btn-gold:hover .arrow { transform: translateX(3px); }

.btn-ghost { background: transparent; color: var(--text); border-color: var(--line-2); }
.btn-ghost:hover { border-color: var(--gold); color: var(--gold); }

.btn-danger {
  background: linear-gradient(135deg, var(--red-2), var(--red));
  color: #fff; box-shadow: 0 8px 22px -8px rgba(200,57,43,.55);
}
.btn-danger:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -10px rgba(200,57,43,.75); }

.panel-enter-active, .panel-leave-active { transition: all .35s cubic-bezier(.16,1,.3,1); overflow: hidden; }
.panel-enter-from, .panel-leave-to { opacity: 0; transform: translateY(-12px); max-height: 0; }
.panel-enter-to, .panel-leave-from { max-height: 1000px; }

/* ============ TOOLBAR ============ */
.toolbar { position: relative; z-index: 1; display: flex; gap: 14px; align-items: center; margin-bottom: 18px; flex-wrap: wrap; }
.search {
  flex: 1; min-width: 260px;
  display: flex; align-items: center; gap: 12px;
  background: var(--panel); border: 1px solid var(--line);
  border-radius: 12px; padding: 12px 16px;
  transition: .2s;
}
.search:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(212,175,55,.1); }
.search svg { width: 18px; height: 18px; color: var(--muted); flex-shrink: 0; }
.search input { flex: 1; background: transparent; border: none; outline: none; color: var(--text); font-family: var(--f-body); font-size: .95rem; }
.search input::placeholder { color: #6b573e; }
.search-clear { background: transparent; border: none; color: var(--muted); font-size: 1.2rem; cursor: pointer; padding: 0 4px; }
.search-clear:hover { color: var(--gold); }

.sort-wrap { display: flex; align-items: center; gap: 10px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 6px 14px 6px 16px; }
.sort-lbl { font-family: var(--f-mono); font-size: .68rem; letter-spacing: .2em; color: var(--muted); text-transform: uppercase; }
.sort { background: transparent; color: var(--text); border: none; outline: none; padding: 8px 0; font-family: var(--f-mono); font-size: .8rem; cursor: pointer; }
.sort option { background: var(--panel); color: var(--text); }

/* ============ TABLE ============ */
.table-wrap { position: relative; z-index: 1; }
.thead {
  display: grid; grid-template-columns: 72px 1.4fr 1.4fr 240px;
  gap: 18px; padding: 14px 24px;
  border-bottom: 1px solid var(--line);
}
.th { font-family: var(--f-mono); font-size: .68rem; letter-spacing: .22em; color: var(--muted); text-transform: uppercase; }
.th-actions { text-align: right; }

.tbody { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }

.row {
  display: grid; grid-template-columns: 72px 1.4fr 1.4fr 240px;
  gap: 18px; align-items: center; padding: 18px 24px;
  background: linear-gradient(180deg, var(--panel), var(--panel-2));
  border: 1px solid var(--line); border-radius: 14px;
  transition: .25s ease;
  animation: rowIn .45s ease both;
}
@keyframes rowIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.row:hover { border-color: var(--gold); transform: translateY(-2px); box-shadow: 0 12px 32px -16px rgba(212,175,55,.35); }

.row-index { font-family: var(--f-mono); font-size: .85rem; color: var(--gold); letter-spacing: .15em; }
.cell-name { display: flex; align-items: center; gap: 14px; min-width: 0; }
.avatar {
  width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--gold), #8a6620);
  color: #1a120b; display: grid; place-items: center;
  font-family: var(--f-display); font-weight: 700; font-size: 1.05rem;
  box-shadow: 0 4px 14px -4px rgba(212,175,55,.55);
}
.who { min-width: 0; }
.who strong { display: block; font-size: 1rem; color: var(--text); }
.who-sub { font-family: var(--f-mono); font-size: .68rem; letter-spacing: .18em; color: var(--muted); text-transform: uppercase; }

.cell-email { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.email-full { font-size: .9rem; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.email-domain { font-family: var(--f-mono); font-size: .68rem; color: var(--gold); letter-spacing: .1em; }

.cell-actions { display: flex; gap: 10px; justify-content: flex-end; }
.act {
  display: inline-flex; align-items: center; gap: 8px;
  background: transparent; border: 1px solid var(--line-2);
  color: var(--text); padding: 9px 14px; border-radius: 999px;
  font-family: var(--f-mono); font-size: .7rem; letter-spacing: .14em; text-transform: uppercase;
  cursor: pointer; transition: .2s;
}
.act svg { width: 14px; height: 14px; }
.act-edit:hover { border-color: var(--gold); color: var(--gold); background: rgba(212,175,55,.08); }
.act-del { color: #d99; border-color: rgba(192,57,43,.4); }
.act-del:hover { background: var(--red); color: #fff; border-color: var(--red); }

.row-skeleton { height: 76px; background: linear-gradient(90deg, var(--panel) 0%, var(--panel-2) 50%, var(--panel) 100%); background-size: 200% 100%; animation: sk 1.4s linear infinite; border: 1px solid var(--line); border-radius: 14px; }
.row-skeleton span { display: none; }
@keyframes sk { to { background-position: -200% 0; } }

/* ============ EMPTY ============ */
.empty {
  margin-top: 18px; padding: 64px 20px; text-align: center;
  border: 1px dashed var(--line-2); border-radius: 16px;
  background: rgba(20,12,7,.4);
}
.empty-mark { display: block; font-size: 2.4rem; color: var(--gold); margin-bottom: 10px; opacity: .7; }
.empty h3 { font-family: var(--f-display); font-size: 1.5rem; margin: 0 0 6px; }
.empty p { margin: 0; color: var(--muted); font-size: .9rem; }

/* ============ MODAL ============ */
.modal-wrap {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(8,5,3,.78); backdrop-filter: blur(10px);
  display: grid; place-items: center; padding: 20px;
}
.modal {
  position: relative;
  width: min(520px, 100%);
  background: linear-gradient(180deg, var(--panel), var(--panel-2));
  border: 1px solid var(--line-2); border-radius: 20px; padding: 34px;
  box-shadow: 0 30px 80px rgba(0,0,0,.7), 0 0 60px -20px rgba(212,175,55,.18);
}
.modal-danger { border-color: rgba(200,57,43,.45); box-shadow: 0 30px 80px rgba(0,0,0,.7), 0 0 60px -20px rgba(200,57,43,.3); }
.modal-x {
  position: absolute; top: 18px; right: 18px;
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--bg-2); border: 1px solid var(--line); color: var(--text);
  font-size: 1.3rem; cursor: pointer; line-height: 1; transition: .2s;
}
.modal-x:hover { border-color: var(--gold); color: var(--gold); }
.modal-tag { font-family: var(--f-mono); font-size: .68rem; letter-spacing: .25em; color: var(--gold); text-transform: uppercase; }
.modal-tag.danger { color: var(--red-2); }
.modal h2 { font-family: var(--f-display); font-size: 1.7rem; margin: 8px 0 6px; line-height: 1.15; }
.modal h2 em { font-style: italic; color: var(--gold); }
.modal-sub { color: var(--muted); margin: 0 0 22px; line-height: 1.5; font-size: .92rem; }
.modal-sub strong { color: var(--text); }

.modal-fields { display: flex; flex-direction: column; gap: 16px; margin-bottom: 22px; }
.modal-foot { display: flex; gap: 10px; justify-content: flex-end; }

.danger-card {
  display: flex; align-items: center; gap: 14px;
  background: rgba(192,57,43,.07); border: 1px solid rgba(192,57,43,.3);
  border-radius: 12px; padding: 14px; margin-bottom: 22px;
}
.danger-avatar { background: linear-gradient(135deg, var(--red-2), var(--red)); color: #fff; box-shadow: 0 4px 14px -4px rgba(200,57,43,.55); }
.danger-card strong { display: block; font-size: 1rem; color: var(--text); }
.danger-card span { font-family: var(--f-mono); font-size: .78rem; color: var(--muted); }

.fade-enter-active, .fade-leave-active { transition: opacity .25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ============ RESPONSIVE ============ */
@media (max-width: 980px) {
  .create-grid { grid-template-columns: 1fr; gap: 28px; }
  .thead { display: none; }
  .row { grid-template-columns: 56px 1fr; row-gap: 14px; padding: 18px; }
  .cell-email { grid-column: 1 / -1; padding-left: 70px; }
  .cell-actions { grid-column: 1 / -1; justify-content: flex-start; }
}
@media (max-width: 560px) {
  .page { padding: 32px 18px 64px; }
  .head { flex-direction: column; align-items: stretch; }
  .head-right { justify-content: space-between; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .row { grid-template-columns: 1fr; }
  .cell-email { padding-left: 0; }
}
</style>
