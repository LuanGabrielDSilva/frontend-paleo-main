<template>
  <div class="page">
    <transition name="slide-down">
      <div v-if="notification.visible" class="paleo-alert" :class="notification.type">
        <span class="alert-icon">{{ notification.type === 'error' ? '📜' : '✨' }}</span>
        <div class="alert-content">
          <p class="alert-message">{{ notification.message }}</p>
        </div>
        <button class="alert-close" @click="notification.visible = false">✕</button>
      </div>
    </transition>

    <div class="page-header">
      <h1>👑 Admin · Usuários</h1>
      <p class="subtitle">Gerencie os exploradores do reino jurássico</p>
    </div>

    <div class="form-card">
      <h2 class="form-title">✨ Registrar Novo Explorador</h2>
      
      <div class="form-inputs-container" autocomplete="off">
        <div class="input-group">
          <span class="input-icon">👤</span>
          <input 
            v-model="newUser.name" 
            type="text" 
            placeholder="Nome Completo" 
            autocomplete="none"
          />
        </div>
        
        <div class="input-group">
          <span class="input-icon">📧</span>
          <input 
            v-model="newUser.email" 
            type="email" 
            placeholder="Endereço de Email" 
            autocomplete="new-email"
          />
        </div>

        <div class="input-group">
          <span class="input-icon">🔑</span>
          <input 
            v-model="newUser.password" 
            :type="passwordFieldType" 
            placeholder="Senha de Acesso (Mín. 6 caracteres)" 
            autocomplete="new-password"
            @focus="passwordFieldType = 'password'"
            @blur="!newUser.password && (passwordFieldType = 'text')"
          />
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-primary btn-block" @click="create">
          <span>Insculpir Usuário no Banco</span>
        </button>
      </div>
    </div>

    <transition name="fade">
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal-card">
          <h2>✏️ Editando {{ selected.name }}</h2>
          <div class="modal-form-grid">
            <div class="input-group">
              <span class="input-icon">👤</span>
              <input v-model="selected.name" placeholder="Nome" autocomplete="off" />
            </div>
            <div class="input-group">
              <span class="input-icon">📧</span>
              <input v-model="selected.email" placeholder="Email" autocomplete="off" />
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="selected = null">Cancelar</button>
            <button class="btn btn-primary" @click="saveEdit">Salvar</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="userToDelete" class="modal-overlay" @click.self="userToDelete = null">
        <div class="modal-card modal-delete-confirm">
          <h2>⚠️ Banir Explorador?</h2>
          <p class="confirm-text">
            Tem certeza que deseja revogar o acesso de <strong>{{ userToDelete.name }}</strong> e apagá-lo das crônicas do reino? Esta ação é irreversível.
          </p>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="userToDelete = null">Preservar</button>
            <button class="btn btn-delete-confirm" @click="confirmRemove">Confirmar Exclusão</button>
          </div>
        </div>
      </div>
    </transition>

    <div class="grid">
      <div v-for="user in users" :key="user.id" class="user-card">
        <div class="card-header">
          <div class="avatar">{{ user.name?.charAt(0)?.toUpperCase() || '?' }}</div>
          <div class="user-info">
            <h3>{{ user.name }}</h3>
            <p class="email">{{ user.email }}</p>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-edit" @click="openEdit(user)">Editar</button>
          <button class="btn btn-delete" @click="askRemove(user)">Excluir</button>
        </div>
      </div>
    </div>

    <p v-if="!users.length" class="empty">Nenhum usuário encontrado 🦴</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import api from "../../services/api";

const users = ref<any[]>([]);
const selected = ref<any | null>(null);
const userToDelete = ref<any | null>(null); // Armazena o usuário aguardando exclusão
const passwordFieldType = ref("text");

const notification = ref({
  visible: false,
  message: "",
  type: "error"
});

function showAlert(message: string, type = "error") {
  notification.value.message = message;
  notification.value.type = type;
  notification.value.visible = true;

  setTimeout(() => {
    notification.value.visible = false;
  }, 4000);
}

const newUser = ref({
  name: "",
  email: "",
  password: ""
});

// REGEX E FUNÇÕES AUXILIARES DE VALIDAÇÃO
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidName(name: string): boolean {
  // Garante que tenha pelo menos duas palavras (Nome e Sobrenome) e letras normais
  const trimmed = name.trim();
  return trimmed.length >= 3 && trimmed.includes(" ");
}

async function load() {
  const res = await api.get("/users");
  users.value = res.data;
}

onMounted(load);

async function create() {
  // 1. Verificação de preenchimento básico
  if (!newUser.value.name || !newUser.value.email || !newUser.value.password) {
    showAlert("Alerta do Conselho: Preencha todos os campos para prosseguir.");
    return;
  }

  // 2. Validação do Nome Completo
  if (!isValidName(newUser.value.name)) {
    showAlert("Inscrição inválida: Por favor, insira o nome completo (Nome e Sobrenome).");
    return;
  }

  // 3. Validação do Formato de Email
  if (!isValidEmail(newUser.value.email)) {
    showAlert("Inscrição inválida: O formato do endereço de e-mail não é reconhecido.");
    return;
  }

  // 4. Validação do tamanho da senha
  if (newUser.value.password.length < 6) {
    showAlert("Segurança Fraca: A senha de acesso deve conter pelo menos 6 caracteres.");
    return;
  }
  
  try {
    await api.post("/users", newUser.value);
    newUser.value = { name: "", email: "", password: "" };
    passwordFieldType.value = "text";
    showAlert("Explorador documentado com sucesso nos registros reais!", "success");
    await load();
  } catch (err) {
    showAlert("Falha mística: Não foi possível realizar a inscrição no banco.");
  }
}

// Inicia o processo de exclusão abrindo o modal customizado
function askRemove(user: any) {
  userToDelete.value = user;
}

// Executa a exclusão após confirmação no modal do Reino
async function confirmRemove() {
  if (!userToDelete.value) return;

  try {
    await api.delete(`/users/${userToDelete.value.id}`);
    users.value = users.value.filter(u => u.id !== userToDelete.value.id);
    showAlert("Explorador banido com sucesso do reino.", "success");
  } catch (err) {
    showAlert("Erro crítico ao tentar remover o explorador.");
  } finally {
    userToDelete.value = null; // Fecha o modal
  }
}

function openEdit(user: any) {
  selected.value = { ...user };
}

async function saveEdit() {
  if (!selected.value.name || !selected.value.email) {
    showAlert("Os campos de edição não podem ficar vazios.");
    return;
  }

  if (!isValidName(selected.value.name)) {
    showAlert("Forneça o nome completo para atualização.");
    return;
  }

  if (!isValidEmail(selected.value.email)) {
    showAlert("O e-mail de atualização precisa ser um endereço válido.");
    return;
  }

  try {
    await api.put(`/users/${selected.value.id}`, {
      name: selected.value.name,
      email: selected.value.email
    });
    selected.value = null;
    showAlert("Crônicas do explorador atualizadas com sucesso.", "success");
    await load();
  } catch (err) {
    showAlert("Erro ao salvar as modificações.");
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');

.page {
  padding: 40px 28px;
  min-height: 100vh;
  background:
    radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.08) 0%, transparent 50%),
    linear-gradient(180deg, #0b0a08 0%, #1a140f 50%, #0d0b08 100%);
  color: #f5e6c8;
  font-family: 'Cinzel', serif;
}

/* ===== PALEO ALERT DESIGN ===== */
.paleo-alert {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.1);
  backdrop-filter: blur(10px);
}

.paleo-alert.error {
  background: linear-gradient(135deg, rgba(40, 15, 15, 0.95), rgba(20, 8, 8, 0.98));
  border: 1px solid rgba(255, 80, 80, 0.4);
}

.paleo-alert.success {
  background: linear-gradient(135deg, rgba(15, 30, 20, 0.95), rgba(8, 15, 10, 0.98));
  border: 1px solid rgba(212, 175, 55, 0.4);
}

.alert-icon { font-size: 1.3rem; }
.alert-content { flex: 1; }
.alert-message { margin: 0; font-family: 'Crimson Text', serif; font-size: 1.05rem; }
.paleo-alert.error .alert-message { color: #ffb3b3; }
.paleo-alert.success .alert-message { color: #e2f5c8; }

.alert-close {
  background: transparent;
  border: none;
  color: rgba(245, 230, 200, 0.5);
  cursor: pointer;
  font-size: 1rem;
  transition: color 0.2s;
  padding: 4px;
}
.alert-close:hover { color: #d4af37; }

/* Animações do Alerta */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.slide-down-enter-from { transform: translate(-50%, -100px); opacity: 0; }
.slide-down-leave-to { transform: translate(-50%, -40px); opacity: 0; }

/* ===== PAGE HEADER ===== */
.page-header { text-align: center; margin-bottom: 36px; }

h1 {
  font-family: "Cinzel", serif;
  font-size: 2.4rem;
  letter-spacing: 2px;
  margin: 0 0 8px;
  background: linear-gradient(180deg, #f5e6c8, #d4af37);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-family: 'Crimson Text', serif;
  font-style: italic;
  color: rgba(212, 175, 55, 0.6);
  margin: 0;
}

/* ===== FORM CARD ===== */
.form-card {
  background: linear-gradient(170deg, rgba(20, 15, 10, 0.98), rgba(10, 8, 5, 0.99));
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 45px;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 24px 50px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.03), 0 0 30px rgba(212, 175, 55, 0.03);
}

.form-title {
  font-size: 1rem;
  letter-spacing: 2px;
  color: #d4af37;
  margin: 0 0 24px;
  text-transform: uppercase;
  text-align: center;
  position: relative;
}

.form-title::after {
  content: '';
  display: block;
  width: 40px;
  height: 1px;
  background: #d4af37;
  margin: 8px auto 0;
  opacity: 0.5;
}

.form-inputs-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.modal-form-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.45);
  border: 1.5px solid rgba(212, 175, 55, 0.15);
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.input-icon { padding-left: 16px; font-size: 1.1rem; opacity: 0.7; user-select: none; }

input {
  flex: 1;
  background: transparent;
  border: none !important;
  padding: 14px 16px 14px 10px;
  color: #f5e6c8;
  font-family: 'Crimson Text', serif;
  font-size: 1.05rem;
  outline: none;
}

input::placeholder { color: rgba(212, 175, 55, 0.35); font-style: italic; }
.input-group:focus-within { border-color: rgba(212, 175, 55, 0.7); background: rgba(0, 0, 0, 0.6); box-shadow: 0 0 15px rgba(212, 175, 55, 0.15); }

.form-actions { display: flex; justify-content: center; }
.btn-block { width: auto; min-width: 280px; padding: 14px 32px; font-size: 0.85rem; }

/* ===== BUTTONS ===== */
.btn {
  padding: 11px 18px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-primary { background: linear-gradient(135deg, #d4af37, #b8972e); color: #0f0c08; box-shadow: 0 6px 18px rgba(212, 175, 55, 0.25); }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(212, 175, 55, 0.35); }

.btn-ghost { background: rgba(212, 175, 55, 0.1); color: #d4af37; border-color: rgba(212, 175, 55, 0.25); }
.btn-ghost:hover { background: rgba(212, 175, 55, 0.2); }

.btn-edit { background: rgba(245, 230, 200, 0.06); color: #f5e6c8; border-color: rgba(245, 230, 200, 0.15); }
.btn-edit:hover { background: rgba(245, 230, 200, 0.12); transform: translateY(-2px); }

.btn-delete { background: rgba(255, 80, 80, 0.08); color: #ff8a8a; border-color: rgba(255, 80, 80, 0.25); }
.btn-delete:hover { background: rgba(255, 80, 80, 0.18); transform: translateY(-2px); }

/* Botão Vermelho de confirmação real dentro do modal */
.btn-delete-confirm {
  background: linear-gradient(135deg, #cc3b3b, #991f1f);
  color: #fff;
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 10px;
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(200, 50, 50, 0.3);
}
.btn-delete-confirm:hover { transform: translateY(-2px); background: linear-gradient(135deg, #e64545, #b32424); box-shadow: 0 8px 20px rgba(200, 50, 50, 0.5); }

/* ===== MODAL GENERAL ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal-card {
  background: linear-gradient(170deg, #1a150e, #0d0b08);
  border: 1px solid rgba(212, 175, 55, 0.35);
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 60px rgba(212, 175, 55, 0.08);
}

.modal-card h2 { font-size: 1.2rem; color: #d4af37; margin: 0 0 20px; letter-spacing: 1px; }
.modal-actions { display: flex; gap: 12px; margin-top: 8px; }
.modal-actions .btn, .modal-actions .btn-delete-confirm { flex: 1; padding: 12px; }

/* Modal específico para deleção */
.modal-delete-confirm {
  border-color: rgba(255, 80, 80, 0.4);
  box-shadow: 0 20px 60px rgba(0,0,0,0.9), 0 0 50px rgba(255, 80, 80, 0.05);
}
.confirm-text {
  font-family: 'Crimson Text', serif;
  font-size: 1.15rem;
  color: rgba(245, 230, 200, 0.8);
  line-height: 1.5;
  margin-bottom: 24px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ===== GRID ===== */
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }

.user-card {
  background: linear-gradient(170deg, rgba(26, 20, 15, 0.95), rgba(14, 11, 8, 0.98));
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03);
}

.user-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
  opacity: 0.6;
}

.user-card:hover { transform: translateY(-6px); border-color: rgba(212, 175, 55, 0.4); box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 25px rgba(212, 175, 55, 0.1); }
.card-header { display: flex; align-items: center; gap: 14px; }

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d4af37, #b8972e);
  color: #0f0c08;
  font-weight: 700;
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid rgba(212, 175, 55, 0.3);
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}

.user-info h3 { margin: 0; font-size: 1.1rem; color: #f5e6c8; }
.email { margin: 4px 0 0; font-size: 0.85rem; color: rgba(245, 230, 200, 0.6); font-family: 'Crimson Text', serif; }
.empty { text-align: center; color: rgba(245, 230, 200, 0.5); font-family: 'Crimson Text', serif; font-style: italic; margin-top: 40px; }
</style>