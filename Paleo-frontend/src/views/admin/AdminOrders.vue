<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import api from "../../services/api";

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;

  user: {
    name: string;
    email: string;
  };

  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  complemento?: string;

  items: {
    id: string;
    quantity: number;
    product: {
      name: string;
      image: string;
      price: number;
    };
  }[];
};

const orders = ref<Order[]>([]);
const loading = ref(true);
const search = ref("");
const statusFilter = ref<"all" | "pending" | "on_the_way" | "delivered">("all");
const sortBy = ref<"recent" | "oldest" | "highest" | "lowest">("recent");
const selected = ref<Order | null>(null);

async function loadOrders() {
  loading.value = true;
  try {
    const { data } = await api.get("/orders");
    orders.value = data;
  } finally {
    loading.value = false;
  }
}

async function updateStatus(id: string, status: string) {
  await api.put(`/orders/${id}/status`, { status });
  await loadOrders();
  if (selected.value?.id === id) {
    selected.value = orders.value.find((o) => o.id === id) ?? null;
  }
}

async function deleteOrder(id: string) {
  if (!confirm("Deseja realmente deletar este pedido?")) return;
  await api.delete(`/orders/${id}`);
  if (selected.value?.id === id) selected.value = null;
  await loadOrders();
}

onMounted(loadOrders);

const STATUS_META: Record<string, { label: string; tone: string; step: number }> = {
  pending:    { label: "Preparando", tone: "amber",   step: 1 },
  on_the_way: { label: "Chegando",   tone: "blue",    step: 2 },
  delivered:  { label: "Entregue",   tone: "emerald", step: 3 },
};

function statusMeta(s: string) {
  return STATUS_META[s] ?? { label: s, tone: "neutral", step: 0 };
}

const filtered = computed(() => {
  let list = [...orders.value];
  if (statusFilter.value !== "all") {
    list = list.filter((o) => o.status === statusFilter.value);
  }
  const q = search.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (o) =>
        o.user.name.toLowerCase().includes(q) ||
        o.user.email.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.items.some((i) => i.product.name.toLowerCase().includes(q))
    );
  }
  switch (sortBy.value) {
    case "oldest":  list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)); break;
    case "highest": list.sort((a, b) => b.total - a.total); break;
    case "lowest":  list.sort((a, b) => a.total - b.total); break;
    default:        list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }
  return list;
});

const kpis = computed(() => {
  const total = orders.value.reduce((s, o) => s + o.total, 0);
  const pending = orders.value.filter((o) => o.status === "pending").length;
  const otw = orders.value.filter((o) => o.status === "on_the_way").length;
  const delivered = orders.value.filter((o) => o.status === "delivered").length;
  const items = orders.value.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0);
  const avg = orders.value.length ? total / orders.value.length : 0;
  return { total, pending, otw, delivered, items, avg, count: orders.value.length };
});

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function shortId(id: string) {
  return "#" + id.slice(0, 8).toUpperCase();
}
function timeAgo(iso: string) {
  const diff = (Date.now() - +new Date(iso)) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}
</script>

<template>
  <div class="page">
    <div class="grain"></div>
    <div class="glow glow-a"></div>
    <div class="glow glow-b"></div>

    <header class="head">
      <div class="head-left">
        <div class="brand">
          <span class="brand-mark">◆</span>
          <span class="brand-text">ORDERS · COMMAND</span>
        </div>
        <h1 class="title">Central de <em>Pedidos</em></h1>
        <p class="subtitle">Acompanhe, gerencie e despache cada pedido em tempo real.</p>
      </div>
      <div class="head-right">
        <button class="ghost-btn" @click="loadOrders" :disabled="loading">
          <span class="dot" :class="{ spinning: loading }"></span>
          {{ loading ? "Atualizando…" : "Atualizar" }}
        </button>
      </div>
    </header>

    <section class="kpis">
      <article class="kpi kpi-hero">
        <span class="kpi-label">Faturamento</span>
        <span class="kpi-value gold">{{ brl(kpis.total) }}</span>
        <span class="kpi-meta">{{ kpis.count }} pedidos · ticket {{ brl(kpis.avg) }}</span>
      </article>
      <article class="kpi">
        <span class="kpi-tag amber">●</span>
        <span class="kpi-label">Preparando</span>
        <span class="kpi-value">{{ kpis.pending }}</span>
      </article>
      <article class="kpi">
        <span class="kpi-tag blue">●</span>
        <span class="kpi-label">Chegando</span>
        <span class="kpi-value">{{ kpis.otw }}</span>
      </article>
      <article class="kpi">
        <span class="kpi-tag emerald">●</span>
        <span class="kpi-label">Entregues</span>
        <span class="kpi-value">{{ kpis.delivered }}</span>
      </article>
      <article class="kpi">
        <span class="kpi-label">Itens vendidos</span>
        <span class="kpi-value">{{ kpis.items }}</span>
      </article>
    </section>

    <section class="toolbar">
      <div class="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input v-model="search" type="text" placeholder="Buscar por cliente, email, produto ou ID…" />
      </div>

      <div class="chip-row">
        <button
          v-for="opt in [
            { v: 'all',        l: 'Todos' },
            { v: 'pending',    l: 'Preparando' },
            { v: 'on_the_way', l: 'Chegando' },
            { v: 'delivered',  l: 'Entregues' },
          ]"
          :key="opt.v"
          class="chip"
          :class="{ active: statusFilter === opt.v }"
          @click="statusFilter = opt.v as any"
        >
          {{ opt.l }}
        </button>
      </div>

      <select v-model="sortBy" class="sort">
        <option value="recent">Mais recentes</option>
        <option value="oldest">Mais antigos</option>
        <option value="highest">Maior valor</option>
        <option value="lowest">Menor valor</option>
      </select>
    </section>

    <article
  v-for="order in filtered"
  :key="order.id"
  class="order"
  @click="selected = order"
>
  <!-- LINHA 1: identificação + status + ações -->
  <div class="order-top">
    <div class="ord-id">
      <span class="ord-code">{{ shortId(order.id) }}</span>
      <span class="ord-time">há {{ timeAgo(order.created_at) }}</span>
    </div>

    <div class="ord-user">
      <div class="avatar">{{ order.user.name.charAt(0).toUpperCase() }}</div>
      <div class="ord-user-text">
        <strong>{{ order.user.name }}</strong>
        <span>{{ order.user.email }}</span>
      </div>
    </div>

    <div class="ord-end">
      <span class="ord-total">{{ brl(order.total) }}</span>
      <span :class="['badge', statusMeta(order.status).tone]">
        {{ statusMeta(order.status).label }}
      </span>
    </div>

    <div class="ord-actions" @click.stop>
      <select
        :value="order.status"
        @change="updateStatus(order.id, ($event.target as HTMLSelectElement).value)"
      >
        <option value="pending">Preparando</option>
        <option value="on_the_way">Chegando</option>
        <option value="delivered">Entregue</option>
      </select>
      <button class="del" @click="deleteOrder(order.id)" title="Deletar pedido">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
        </svg>
      </button>
    </div>
  </div>

  <!-- LINHA 2: pipeline + itens -->
  <div class="order-bottom">
    <div class="ord-pipe">
      <div class="pipe">
        <div
          class="pipe-fill"
          :style="{ width: (statusMeta(order.status).step / 3) * 100 + '%' }"
        ></div>
      </div>
      <div class="pipe-steps">
        <span :class="{ done: statusMeta(order.status).step >= 1 }">Preparo</span>
        <span :class="{ done: statusMeta(order.status).step >= 2 }">Rota</span>
        <span :class="{ done: statusMeta(order.status).step >= 3 }">Entregue</span>
      </div>
    </div>

    <div class="ord-items">
      <div class="thumbs">
        <img
          v-for="item in order.items.slice(0, 4)"
          :key="item.id"
          :src="item.product.image"
          :alt="item.product.name"
        />
        <span v-if="order.items.length > 4" class="more">
          +{{ order.items.length - 4 }}
        </span>
      </div>
      <span class="items-count">
        {{ order.items.reduce((a, i) => a + i.quantity, 0) }} itens
      </span>
    </div>
  </div>
</article>


    <transition name="fade">
      <div v-if="selected" class="modal-wrap" @click.self="selected = null">
        <div class="modal">
          <button class="modal-close" @click="selected = null" aria-label="Fechar">×</button>

          <header class="modal-head">
            <div>
              <span class="ord-code big">{{ shortId(selected.id) }}</span>
              <h2>{{ selected.user.name }}</h2>
              <p>{{ selected.user.email }}</p>
              <small>{{ new Date(selected.created_at).toLocaleString("pt-BR") }}</small>
            </div>
            <div class="modal-total">
              <span>Total</span>
              <strong>{{ brl(selected.total) }}</strong>
              <span class="badge" :class="statusMeta(selected.status).tone">
                {{ statusMeta(selected.status).label }}
              </span>
            </div>
          </header>

          <section class="modal-timeline">
            <div class="tl-step" :class="{ done: statusMeta(selected.status).step >= 1 }">
              <span class="tl-dot"></span><span>Pedido recebido & em preparo</span>
            </div>
            <div class="tl-step" :class="{ done: statusMeta(selected.status).step >= 2 }">
              <span class="tl-dot"></span><span>Em rota de entrega</span>
            </div>
            <div class="tl-step" :class="{ done: statusMeta(selected.status).step >= 3 }">
              <span class="tl-dot"></span><span>Entregue ao cliente</span>
            </div>
          </section>

          <section class="modal-address">
            <h3>Endereço de entrega</h3>

            <p>
              {{ selected.rua }}, {{ selected.numero }}
              <span v-if="selected.complemento"> - {{ selected.complemento }}</span>
            </p>

            <p>
              {{ selected.bairro }} - {{ selected.cidade }}/{{ selected.estado }}
            </p>

            <p>
              CEP: {{ selected.cep }}
            </p>
          </section>

          <section class="modal-items">
            <h3>Itens do pedido</h3>
            <div v-for="item in selected.items" :key="item.id" class="modal-item">
              <img :src="item.product.image" :alt="item.product.name" />
              <div class="mi-body">
                <strong>{{ item.product.name }}</strong>
                <span>{{ brl(item.product.price) }} · un.</span>
              </div>
              <span class="mi-qty">×{{ item.quantity }}</span>
              <span class="mi-sub">{{ brl(item.product.price * item.quantity) }}</span>
            </div>
          </section>

          <footer class="modal-foot">
            <select
              :value="selected.status"
              @change="updateStatus(selected.id, ($event.target as HTMLSelectElement).value)"
            >
              <option value="pending">Preparando</option>
              <option value="on_the_way">Chegando</option>
              <option value="delivered">Entregue</option>
            </select>
            <button class="del big" @click="deleteOrder(selected.id)">
              Deletar pedido
            </button>
          </footer>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap");

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
  --amber:   #e8a23a;
  --blue:    #5fa8d3;
  --emerald: #4fb286;
  --red:     #c0392b;
  --font-d:  "Cinzel", serif;
  --font-m:  "JetBrains Mono", monospace;
  --font-b:  "Inter", sans-serif;

  position: relative;
  min-height: 100vh;
  padding: 48px clamp(20px, 4vw, 64px) 80px;
  background:
    radial-gradient(1200px 700px at 80% -10%, #2a1a0c 0%, transparent 60%),
    radial-gradient(900px 600px at 0% 100%, #1c1208 0%, transparent 55%),
    var(--bg);
  color: var(--text);
  font-family: var(--font-b);
  overflow: hidden;
}

.grain {
  position: absolute; inset: 0; pointer-events: none; opacity: .04;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='.9'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}
.glow { position: absolute; border-radius: 50%; filter: blur(120px); pointer-events: none; opacity: .35; }
.glow-a { width: 480px; height: 480px; background: #6b3a12; top: -180px; right: -120px; }
.glow-b { width: 380px; height: 380px; background: #2d4a3d; bottom: -160px; left: -100px; opacity: .25; }

.head { position: relative; display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 40px; flex-wrap: wrap; }
.brand { display: inline-flex; gap: 10px; align-items: center; color: var(--gold); font-family: var(--font-m); font-size: .72rem; letter-spacing: .35em; margin-bottom: 14px; }
.brand-mark { font-size: 1rem; }
.title { font-family: var(--font-d); font-weight: 500; font-size: clamp(2.4rem, 5vw, 3.6rem); line-height: 1; margin: 0; letter-spacing: -.01em; }
.title em { font-style: italic; color: var(--gold); }
.subtitle { color: var(--muted); margin: 14px 0 0; max-width: 520px; }
.ghost-btn {
  display: inline-flex; align-items: center; gap: 10px;
  background: transparent; color: var(--text);
  border: 1px solid var(--line-2); padding: 12px 18px; border-radius: 999px;
  font-family: var(--font-m); font-size: .78rem; letter-spacing: .12em; text-transform: uppercase;
  cursor: pointer; transition: .2s;
}
.ghost-btn:hover { border-color: var(--gold); color: var(--gold); }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 12px var(--gold); }
.dot.spinning { animation: pulse 1s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: .3; transform: scale(.7); } }

.kpis { display: grid; grid-template-columns: 1.4fr repeat(4, 1fr); gap: 14px; margin-bottom: 32px; }
.kpi {
  position: relative;
  background: linear-gradient(180deg, var(--panel), var(--panel-2));
  border: 1px solid var(--line); border-radius: 16px; padding: 20px;
  display: flex; flex-direction: column; gap: 8px;
}
.kpi-hero { border-color: rgba(212,175,55,.35); background: linear-gradient(135deg, #2a1b0d, #1a120b); }
.kpi-label { font-family: var(--font-m); font-size: .68rem; letter-spacing: .2em; text-transform: uppercase; color: var(--muted); }
.kpi-value { font-family: var(--font-d); font-size: 1.9rem; font-weight: 700; }
.kpi-value.gold { color: var(--gold); font-size: 2.2rem; }
.kpi-meta { font-family: var(--font-m); font-size: .7rem; color: var(--muted); }
.kpi-tag { position: absolute; top: 18px; right: 18px; font-size: .9rem; }
.kpi-tag.amber { color: var(--amber); }
.kpi-tag.blue { color: var(--blue); }
.kpi-tag.emerald { color: var(--emerald); }

.toolbar { display: flex; gap: 14px; align-items: center; margin-bottom: 22px; flex-wrap: wrap; }
.search {
  flex: 1; min-width: 260px;
  display: flex; align-items: center; gap: 12px;
  background: var(--panel); border: 1px solid var(--line); border-radius: 12px;
  padding: 12px 16px;
}
.search svg { width: 18px; height: 18px; color: var(--muted); flex-shrink: 0; }
.search input { flex: 1; background: transparent; border: none; outline: none; color: var(--text); font-family: var(--font-b); font-size: .95rem; }
.search input::placeholder { color: #6b573e; }
.chip-row { display: flex; gap: 6px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 4px; }
.chip {
  background: transparent; border: none; color: var(--muted);
  padding: 8px 16px; border-radius: 9px; cursor: pointer;
  font-family: var(--font-m); font-size: .72rem; letter-spacing: .1em; text-transform: uppercase;
  transition: .2s;
}
.chip:hover { color: var(--text); }
.chip.active { background: var(--gold); color: #1a120b; }
.sort {
  background: var(--panel); color: var(--text); border: 1px solid var(--line);
  padding: 12px 16px; border-radius: 12px; font-family: var(--font-m); font-size: .8rem; cursor: pointer;
}

.list { 
  display: flex; 
  flex-direction: column; 
  gap: 12px; 
  position: relative; 
}

.order {
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: linear-gradient(180deg, var(--panel), var(--panel-2));
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 22px 26px;
  cursor: pointer;
  transition: .25s;
}
.order:hover {
  border-color: var(--gold);
  transform: translateY(-2px);
  box-shadow: 0 12px 40px -20px rgba(212,175,55,.4);
}

.order-top {
  display: grid;
  grid-template-columns: 140px minmax(0, 1.6fr) auto auto;
  align-items: center;
  gap: 28px;
}

.order-bottom {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 28px;
  padding-top: 16px;
  border-top: 1px dashed var(--line);
}

.ord-user { display: flex; align-items: center; gap: 14px; min-width: 0; }
.ord-user-text { min-width: 0; }
.ord-user strong { display: block; font-size: .95rem; }
.ord-user span {
  display: block; font-size: .78rem; color: var(--muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px;
}

.ord-pipe { display: flex; flex-direction: column; gap: 8px; max-width: 420px; width: 100%; }
.ord-items { display: flex; align-items: center; gap: 14px; }

.ord-end { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }

@media (max-width: 1100px) {
  .kpis { grid-template-columns: 1fr 1fr; }
  .order-top {
    grid-template-columns: 1fr 1fr;
    row-gap: 18px;
  }
  .ord-actions { grid-column: 1 / -1; justify-content: flex-end; }
}
@media (max-width: 640px) {
  .page { padding: 28px 18px 60px; }
  .kpis { grid-template-columns: 1fr; }
  .order-top, .order-bottom { grid-template-columns: 1fr; }
  .ord-end { align-items: flex-start; }
  .ord-items { justify-content: flex-start; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .chip-row { overflow-x: auto; }
}


.ord-id { display: flex; flex-direction: column; gap: 4px; }
.ord-code { font-family: var(--font-m); font-size: .85rem; color: var(--gold); font-weight: 600; }
.ord-code.big { font-size: 1rem; }
.ord-time { font-family: var(--font-m); font-size: .7rem; color: var(--muted); }

.ord-user { display: flex; align-items: center; gap: 12px; min-width: 0; }
.avatar {
  width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--gold), #8a6620);
  color: #1a120b; display: grid; place-items: center;
  font-family: var(--font-d); font-weight: 700;
}
.ord-user strong { display: block; font-size: .95rem; }
.ord-user span { display: block; font-size: .78rem; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ord-pipe { display: flex; flex-direction: column; gap: 6px; }
.pipe { height: 4px; background: var(--line); border-radius: 2px; overflow: hidden; }
.pipe-fill { height: 100%; background: linear-gradient(90deg, var(--amber), var(--gold), var(--emerald)); transition: width .4s; }
.pipe-steps { display: flex; justify-content: space-between; font-family: var(--font-m); font-size: .65rem; color: var(--muted); letter-spacing: .08em; }
.pipe-steps .done { color: var(--gold); }

.ord-items { display: flex; flex-direction: column; gap: 6px; }
.thumbs { display: flex; }
.thumbs img {
  width: 38px; height: 38px; border-radius: 8px; object-fit: cover;
  border: 2px solid var(--panel-2); margin-left: -8px;
}
.thumbs img:first-child { margin-left: 0; }
.thumbs .more {
  width: 38px; height: 38px; border-radius: 8px; margin-left: -8px;
  background: var(--bg-2); border: 2px solid var(--panel-2);
  display: grid; place-items: center; font-family: var(--font-m); font-size: .72rem; color: var(--muted);
}
.items-count { font-family: var(--font-m); font-size: .7rem; color: var(--muted); }

.ord-end { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.ord-total { font-family: var(--font-d); font-size: 1.3rem; color: var(--gold); font-weight: 700; }
.badge {
  font-family: var(--font-m); font-size: .65rem; letter-spacing: .12em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 999px; border: 1px solid;
}
.badge.amber   { color: var(--amber);   border-color: rgba(232,162,58,.4);  background: rgba(232,162,58,.08); }
.badge.blue    { color: var(--blue);    border-color: rgba(95,168,211,.4);  background: rgba(95,168,211,.08); }
.badge.emerald { color: var(--emerald); border-color: rgba(79,178,134,.4);  background: rgba(79,178,134,.08); }

.ord-actions { display: flex; gap: 8px; align-items: center; }
.ord-actions select {
  background: var(--bg-2); color: var(--text); border: 1px solid var(--line);
  padding: 9px 12px; border-radius: 9px; font-family: var(--font-m); font-size: .75rem; cursor: pointer;
}
.del {
  background: transparent; border: 1px solid var(--line);
  color: var(--muted); width: 38px; height: 38px; border-radius: 9px;
  display: grid; place-items: center; cursor: pointer; transition: .2s;
}
.del svg { width: 16px; height: 16px; }
.del:hover { background: var(--red); border-color: var(--red); color: white; }
.del.big { width: auto; padding: 12px 22px; font-family: var(--font-m); font-size: .78rem; letter-spacing: .15em; text-transform: uppercase; }

.empty { display: flex; flex-direction: column; gap: 12px; }
.skeleton { height: 92px; border-radius: 16px; background: linear-gradient(90deg, var(--panel) 0%, var(--panel-2) 50%, var(--panel) 100%); background-size: 200% 100%; animation: sk 1.4s linear infinite; }
@keyframes sk { to { background-position: -200% 0; } }
.empty-card { padding: 60px; text-align: center; border: 1px dashed var(--line-2); border-radius: 16px; }
.empty-icon { font-size: 3rem; color: var(--gold); display: block; margin-bottom: 12px; }

.modal-wrap {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 99999;
}

.modal {
  margin: auto;
  position: relative; 
  width: min(820px, 100%); 
  max-height: 88vh; 
  overflow-y: auto;
  background: linear-gradient(180deg, var(--panel), var(--panel-2));
  border: 1px solid var(--line-2); border-radius: 20px; padding: 36px;
}
.modal-close {
  position: absolute; top: 18px; right: 18px;
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--bg-2); border: 1px solid var(--line); color: var(--text);
  font-size: 1.4rem; cursor: pointer;
}
.modal-head { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--line); margin-bottom: 24px; flex-wrap: wrap; }
.modal-head h2 { font-family: var(--font-d); font-size: 1.6rem; margin: 8px 0 4px; }
.modal-head p { color: var(--muted); margin: 0; font-size: .9rem; }
.modal-head small { font-family: var(--font-m); font-size: .72rem; color: var(--muted); display: block; margin-top: 6px; }
.modal-total { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
.modal-total span:first-child { font-family: var(--font-m); font-size: .7rem; letter-spacing: .2em; color: var(--muted); text-transform: uppercase; }
.modal-total strong { font-family: var(--font-d); font-size: 2rem; color: var(--gold); }

.modal-timeline { display: flex; flex-direction: column; gap: 14px; padding: 22px; background: var(--bg-2); border-radius: 12px; margin-bottom: 24px; }
.tl-step { display: flex; align-items: center; gap: 14px; font-family: var(--font-m); font-size: .85rem; color: var(--muted); }
.tl-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--line-2); }
.tl-step.done { color: var(--text); }
.tl-step.done .tl-dot { background: var(--gold); box-shadow: 0 0 14px var(--gold); }

.modal-items h3 { font-family: var(--font-d); font-size: 1rem; letter-spacing: .15em; text-transform: uppercase; color: var(--muted); margin: 0 0 14px; }
.modal-item { display: grid; grid-template-columns: 64px 1fr auto auto; gap: 16px; align-items: center; padding: 12px; border: 1px solid var(--line); border-radius: 12px; margin-bottom: 8px; }
.modal-item img { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; }
.mi-body strong { display: block; font-size: .95rem; }
.mi-body span { font-family: var(--font-m); font-size: .75rem; color: var(--muted); }
.mi-qty { font-family: var(--font-m); color: var(--gold); font-size: .9rem; }
.mi-sub { font-family: var(--font-d); font-size: 1.05rem; color: var(--text); min-width: 100px; text-align: right; }

.modal-foot { display: flex; justify-content: space-between; gap: 14px; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--line); flex-wrap: wrap; }
.modal-foot select {
  background: var(--bg-2); color: var(--text); border: 1px solid var(--line);
  padding: 12px 18px; border-radius: 10px; font-family: var(--font-m); font-size: .85rem; cursor: pointer; flex: 1;
}

.fade-enter-active, .fade-leave-active { transition: opacity .25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.modal-address {
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  margin-bottom: 24px;
  background: var(--bg-2);
}

.modal-address h3 {
  font-family: var(--font-d);
  font-size: 1rem;
  margin-bottom: 10px;
  color: var(--gold);
}

.modal-address p {
  margin: 4px 0;
  color: var(--text);
  font-family: var(--font-b);
  font-size: .9rem;
}

</style>