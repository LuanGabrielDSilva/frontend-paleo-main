/*
=========================================================
ROUTER PRINCIPAL DO VUE
=========================================================

Esse arquivo controla:
✔ rotas
✔ páginas
✔ layouts
✔ proteção de login
✔ navegação do sistema
*/

import { createRouter, createWebHistory } from "vue-router";

/* ================= LAYOUTS ================= */

import DefaultLayout from "../layouts/DefaultLayout.vue";
import AdminLayout from "../layouts/AdminLayout.vue";

/* ================= AUTH ================= */

import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import ForgotPassword from "../views/auth/ForgotPassword.vue";
import ResetPassword from "../views/auth/ResetPassword.vue";

/* ================= USER ================= */

import Home from "../views/Home.vue";
import Profile from "../views/Profile.vue";
import Collection from "../views/Collection.vue";
import Eras from "../views/Eras.vue";
import EraDetailsView from "../views/EraDetailsView.vue";
import Users from "../views/Users.vue";
import SaibaMais from "../views/SaibaMais.vue";
import Game from "../views/Game.vue";
import WalletView from "../views/WalletView.vue";

/* ================= SHOP ================= */

import Shop from "../views/shop/Shop.vue";
import Inventory from "../views/shop/Inventory.vue";
import Checkout from "../views/shop/Checkout.vue";
import Cart from "../views/shop/Cart.vue";

/* ================= GAMES ================= */

import DinoClickerView from "../views/games/DinoClickerView.vue";
import MemoryGame from "../views/games/MemoryGame.vue";
import QuizGame from "../views/games/QuizGame.vue";

/* ================= ERAS ================= */

import Mesozoico from "../views/eras/Mesozoico.vue";
import Paleozoico from "../views/eras/Paleozoico.vue";
import Cenozoico from "../views/eras/Cenozoico.vue";

/* ================= ADMIN ================= */

import AdminDashboard from "../views/admin/AdminDashboard.vue";
import AdminEras from "../views/admin/AdminEras.vue";
import AdminAnimals from "../views/admin/AdminAnimals.vue";
import AdminUsers from "../views/admin/AdminUsers.vue";
import AdminPeriodos from "../views/admin/AdminPeriodos.vue";
import AdminProducts from "../views/admin/AdminProducts.vue";
import AdminOrders from "../views/admin/AdminOrders.vue";
import AdminComments from "@/views/admin/AdminComments.vue";

/*
=========================================================
ROTAS
=========================================================

Cada objeto representa uma rota/página.
*/

const routes = [

  /*
  =====================================================
  REDIRECIONAMENTO INICIAL
  =====================================================

  "/" -> "/login"
  */

  {
    path: "/",
    redirect: "/login",
  },



  /*
  =====================================================
  ROTAS PÚBLICAS
  =====================================================
  */

  {
    path: "/login",
    component: Login,
  },

  {
    path: "/register",
    component: Register,
  },

  {
  path: "/forgot-password",
  component: ForgotPassword,
  },

  {
    path: "/reset-password",
    component: ResetPassword,
  },



  /*
  =====================================================
  LAYOUT PADRÃO DO USUÁRIO
  =====================================================

  Todas páginas abaixo usam:
  DefaultLayout.vue
  */

  {
    path: "/",
    component: DefaultLayout,

    children: [

      /* PÁGINAS PRINCIPAIS */
      { path: "home", component: Home },
      { path: "profile", component: Profile },
      { path: "saiba-mais", component: SaibaMais },
      { path: "animals", component: Collection },
      { path: "eras", component: Eras },

      /*
      :id = parâmetro dinâmico

      Exemplo:
      /eras/1
      */
      { path: "eras/:id", component: EraDetailsView },

      { path: "users", component: Users },
      { path: "game", component: Game },
      { path: "wallet", component: WalletView },



      /*
      =================================================
      SHOP
      =================================================
      */

      { path: "shop", component: Shop },
      { path: "inventory", component: Inventory },
      { path: "checkout", component: Checkout },
      { path: "cart", component: Cart },

      /*
      IMPORTAÇÃO DINÂMICA

      Carrega componente apenas quando necessário.
      */

      {
        path: "shop/:id",
        component: () =>
          import("../views/shop/ProductDetails.vue")
      },



      /*
      =================================================
      GAMES
      =================================================
      */

      {
        path: "games/dino-clicker",
        component: DinoClickerView
      },

      {
        path: "games/memory-game",
        component: MemoryGame
      },

      {
        path: "games/quiz",
        component: QuizGame
      },



      /*
      =================================================
      ERAS
      =================================================
      */

      {
        path: "eras/mesozoico",
        component: Mesozoico
      },

      {
        path: "eras/paleozoico",
        component: Paleozoico
      },

      {
        path: "eras/cenozoico",
        component: Cenozoico
      },
    ],
  },

  /*
  ======================================
    ROTAS DOS 4 FICTICIOS
  ======================================
  */

  {
  path: '/ficcao/indominus-rex',
  component: () => import('@/views/fiction/IndominusRex.vue')
},
{
  path: '/ficcao/indoraptor',
  component: () => import('@/views/fiction/Indoraptor.vue')
},
{
  path: '/ficcao/scorpios-rex',
  component: () => import('@/views/fiction/ScorpiosRex.vue')
},
{
  path: '/ficcao/distortus-rex',
  component: () => import('@/views/fiction/DistortusRex.vue')
},



  /*
  =====================================================
  ROTAS ADMIN
  =====================================================

  Todas usam:
  AdminLayout.vue
  */

  {
    path: "/admin",

    component: AdminLayout,

    children: [

      {
        path: "",
        component: AdminDashboard
      },

      {
        path: "eras",
        component: AdminEras
      },

      {
        path: "animals",
        component: AdminAnimals
      },

      {
        path: "users",
        component: AdminUsers
      },

      {
        path: "periodos",
        component: AdminPeriodos
      },

      {
        path: "products",
        component: AdminProducts
      },

      {
        path: "orders",
        component: AdminOrders
      },
      {
        path: "/admin/comments",
        component: AdminComments,
      }
    ],
  },
];



/*
=========================================================
CRIAÇÃO DO ROUTER
=========================================================
*/

export const router = createRouter({

  /*
  History mode sem "#"
  */
  history: createWebHistory(),

  /*
  Lista de rotas
  */
  routes,

  /*
  =====================================================
  COMPORTAMENTO DE SCROLL
  =====================================================
  Sempre que trocar de rota → volta para o TOPO.
  Se o usuário usar voltar/avançar do navegador →
  restaura a posição anterior.
  */
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { el: to.hash, behavior: "smooth" };
    }
    return { top: 0, left: 0 };
  },
});


/*
=========================================================
MIDDLEWARE / GUARD DE ROTAS
=========================================================

Executa ANTES de trocar de página.

Usado para:
✔ proteger rotas
✔ verificar login
✔ redirecionar usuário
*/

router.beforeEach((to) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const publicPages = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  const isPublic = publicPages.includes(to.path);

  // não logado
  if (!token && !isPublic) {
    return "/login";
  }

  // logado tentando ir pro login
  if (token && to.path === "/login") {
    return "/home";
  }

  // 🔥 PROTEÇÃO ADMIN
  if (to.path.startsWith("/admin") && user.role !== "admin") {
    return "/home";
  }

  return true;
});
