<script setup lang="ts">
import { ref } from "vue";
import api from "@/services/api";

const email = ref("");
const loading = ref(false);
const message = ref("");
const error = ref("");

const sendReset = async () => {
  loading.value = true;
  message.value = "";
  error.value = "";

  try {
    await api.post("/auth/forgot-password", {
      email: email.value,
    });

    message.value =
      "Se o email existir, você receberá um link para redefinir sua senha.";
  } catch (err) {
    error.value = "Erro ao enviar solicitação.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-container">
    <h1>Esqueci minha senha</h1>

    <input
      v-model="email"
      type="email"
      placeholder="Digite seu email"
    />

    <button
      @click="sendReset"
      :disabled="loading"
    >
      {{ loading ? "Enviando..." : "Enviar link" }}
    </button>

    <p v-if="message" style="color: green">
      {{ message }}
    </p>

    <p v-if="error" style="color: red">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 100px auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
input {
  padding: 10px;
}
button {
  padding: 10px;
}
</style>