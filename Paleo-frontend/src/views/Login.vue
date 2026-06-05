<script setup lang="ts">
import {
  ref,
  computed,
  onMounted
} from "vue";

import { useRouter } from "vue-router";

import api from "../services/api";

import video from "@/assets/video.mp4";

const router = useRouter();

const email = ref("");
const password = ref("");

const error = ref("");

const loading = ref(false);

/* =========================================================
   LIMPAR CAMPOS AO ENTRAR
========================================================= */
onMounted(() => {
  email.value = "";
  password.value = "";

  const emailInput =
    document.getElementById(
      "email"
    ) as HTMLInputElement;

  const passwordInput =
    document.getElementById(
      "password"
    ) as HTMLInputElement;

  if (emailInput) {
    emailInput.value = "";
  }

  if (passwordInput) {
    passwordInput.value = "";
  }
});

const formValido = computed(() => {
  return (
    email.value
      .trim()
      .includes("@") &&
    email.value
      .trim()
      .includes(".") &&
    password.value.length >= 6
  );
});

async function handleLogin() {
  if (
    !formValido.value ||
    loading.value
  ) {
    return;
  }

  error.value = "";

  loading.value = true;

  try {
    const response =
      await api.post(
        "/session",
        {
          email: email.value
            .trim()
            .toLowerCase(),

          password:
            password.value,
        }
      );

    const user =
      response.data;

    localStorage.setItem(
      "token",
      user.token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    if (
      user.role === "admin"
    ) {
      router.push("/admin");
    } else {
      router.replace("/home");
    }
  } catch (err: any) {
    error.value =
      err.response?.data
        ?.error ||
      err.response?.data
        ?.message ||
      "Email ou senha incorretos.";
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <div class="container">
    <!-- LEFT -->
    <div class="left">

      <form
        class="card"
        autocomplete="off"
        @submit.prevent="handleLogin"
      >

        <h1 class="title">
          Login
          <span class="title-line"></span>
        </h1>

        <!-- EMAIL -->
        <div class="field">

          <label for="email">
            Email
          </label>

          <input
            id="email"
            v-model="email"
            type="email"
            name="fake-email-field"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="seu@email.com"
            :disabled="loading"
          />

        </div>

        <!-- PASSWORD -->
        <div class="field">

          <label for="password">
            Senha
          </label>

          <input
            id="password"
            v-model="password"
            type="password"
            name="fake-password-field"
            autocomplete="new-password"
            placeholder="Sua senha"
            :disabled="loading"
          />

          <!-- FORGOT PASSWORD -->
<div class="forgot-area">

  <button
  type="button"
  class="btn-forgot"
  @click="router.push('/forgot-password')"
>
  Esqueci minha senha
</button>

</div>

        </div>

        <!-- BUTTON -->
        <button
          type="submit"
          :disabled="
            !formValido ||
            loading
          "
          class="btn-login"
        >

          {{
            loading
              ? "Entrando..."
              : "Entrar"
          }}
        
        </button>

        <!-- ERROR -->
        <p
          v-if="error"
          class="error"
        >
          {{ error }}
        </p>

        <!-- REGISTER -->
        <div class="register-area">

          <p>
            Não tem conta?
          </p>

          <button
            type="button"
            @click="
              router.push(
                '/register'
              )
            "
            class="btn-link"
          >
            Criar conta
          </button>

        </div>

      </form>

    </div>

    <!-- RIGHT -->
    <div class="right">

      <video
        autoplay
        loop
        muted
        playsinline
        disablePictureInPicture
        controlsList="
          nodownload
          nofullscreen
          noremoteplayback
        "
        class="bg-video"
      >

        <source
          :src="video"
          type="video/mp4"
        />

      </video>

      <div class="overlay"></div>

    </div>

  </div>
</template>

<style scoped>
.container {
  position: fixed;
  inset: 0;
  display: flex;
  background: #0b0a08;
  color: #f5e6c8;
  font-family: 'Cinzel', serif;
  overflow: hidden;
}

.left {
  width: 45%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(6px);
}

.card {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.title {
  font-size: 42px;
  margin-bottom: 8px;
}

.title-line {
  display: block;
  width: 110px;
  height: 3px;
  margin-top: 10px;
  background: linear-gradient(90deg, #c6a46c, #8d6b3f);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 14px;
  opacity: 0.9;
}

input {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid #3a2f1d;
  background: #16120c;
  color: #f5e6c8;
  font-size: 16px;
  transition: border 0.3s;
}

input:focus {
  outline: none;
  border-color: #c6a46c;
}

.btn-login {
  padding: 15px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(90deg, #c6a46c, #8d6b3f);
  color: #0b0a08;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  margin-top: 8px;
  transition: all 0.3s;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(198, 164, 108, 0.3);
}

.btn-login:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #ff6b6b;
  font-size: 14px;
  text-align: center;
  min-height: 20px;
}

.register-area {
  text-align: center;
  margin-top: 12px;
}

.register-area p {
  margin-bottom: 8px;
  opacity: 0.8;
}

.btn-link {
  background: none;
  border: none;
  color: #c6a46c;
  font-size: 16px;
  cursor: pointer;
  text-decoration: underline;
  padding: 4px 8px;
}

.btn-link:hover {
  color: #e8d0a0;
}

/* Right Side - Video */
.right {
  width: 55%;
  position: relative;
  overflow: hidden;
}

.bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(11, 10, 8, 0.35);
}

/* Responsividade */
@media (max-width: 1024px) {
  .left {
    width: 100%;
  }
  .right {
    display: none;
  }
}

.forgot-area {
  text-align: right;
  margin-top: -8px;
}

.btn-forgot {
  background: none;
  border: none;
  color: #c6a46c;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
  opacity: 0.9;
}

.btn-forgot:hover {
  opacity: 1;
  color: #e8d0a0;
}
</style>