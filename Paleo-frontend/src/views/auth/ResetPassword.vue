<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";

const route = useRoute();
const router = useRouter();

/* =========================
   QUERY TOKEN (CORRETO AGORA)
========================= */
const token = computed(() => route.query.token as string);

/* =========================
   STATE
========================= */
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const message = ref("");
const error = ref("");

/* =========================
   RESET
========================= */
const resetPassword = async () => {
  error.value = "";
  message.value = "";

  if (!token.value) {
    error.value = "Token inválido.";
    return;
  }

  if (password.value.length < 6) {
    error.value = "Senha precisa ter pelo menos 6 caracteres.";
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = "As senhas não coincidem.";
    return;
  }

  loading.value = true;

  try {
    await api.post("/auth/reset-password", {
      token: token.value,
      password: password.value,
    });

    message.value = "Senha alterada com sucesso!";

    setTimeout(() => {
      router.push("/login");
    }, 2000);

  } catch (err: any) {
    error.value =
      err.response?.data?.message ||
      "Token inválido ou expirado.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-container">

    <h1>Resetar senha</h1>

    <!-- NOVA SENHA -->
    <input
      v-model="password"
      type="password"
      placeholder="Nova senha"
      :disabled="loading"
    />

    <!-- CONFIRMA SENHA -->
    <input
      v-model="confirmPassword"
      type="password"
      placeholder="Confirmar senha"
      :disabled="loading"
    />

    <!-- BOTÃO -->
    <button
      @click="resetPassword"
      :disabled="loading"
    >
      {{ loading ? "Salvando..." : "Alterar senha" }}
    </button>

    <!-- SUCESSO -->
    <p v-if="message" class="success">
      {{ message }}
    </p>

    <!-- ERRO -->
    <p v-if="error" class="error">
      {{ error }}
    </p>

  </div>
</template>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 80px auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: Arial, sans-serif;
}

input {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ccc;
}

button {
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #c6a46c;
  cursor: pointer;
  font-weight: bold;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success {
  color: green;
}

.error {
  color: red;
}
</style>