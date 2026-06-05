import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import "./assets/theme.css";
import "@/assets/styles/theme.css";

createApp(App)
  .use(router) 
  .mount("#app");