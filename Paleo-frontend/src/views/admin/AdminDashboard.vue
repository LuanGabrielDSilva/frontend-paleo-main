<template>
  <div class="page">
    <!-- HEADER -->
    <header class="header">
      <div class="header-left">
        <div class="crest">👑</div>
        <div>
          <h1>Painel Administrativo</h1>
          <p class="subtitle">
            Visão consolidada do sistema · atualizado {{ lastUpdate }}
          </p>
        </div>
      </div>

      <div class="header-right">
        <span class="status-dot" :class="{ live: !loading }"></span>
        <span class="status-text">
          {{ loading ? "Sincronizando..." : "Sistema operacional" }}
        </span>
        <button class="refresh-btn" @click="loadData" :disabled="loading">
          ↻ Atualizar
        </button>
      </div>
    </header>

    <!-- LOADING -->
    <div v-if="loading && !hydrated" class="loading">
      <div class="spinner"></div>
      <span>Carregando dados do sistema...</span>
    </div>

    <template v-else>
      <!-- SEÇÃO: VISÃO GERAL -->
      <section class="section">
        <div class="section-head">
          <h2>Visão Geral</h2>
          <span class="section-sub">Indicadores principais da plataforma</span>
        </div>

        <div class="grid grid-4">
          <div class="card">
            <div class="card-top">
              <span class="card-label">Usuários cadastrados</span>
              <span class="tag tag-blue">Comunidade</span>
            </div>
            <p class="card-value">{{ formatInt(stats.users) }}</p>
            <span class="card-foot">Total acumulado de contas ativas</span>
          </div>

          <div class="card">
            <div class="card-top">
              <span class="card-label">Eras catalogadas</span>
              <span class="tag tag-gold">Conteúdo</span>
            </div>
            <p class="card-value">{{ formatInt(stats.eras) }}</p>
            <span class="card-foot">Períodos geológicos registrados</span>
          </div>

          <div class="card">
            <div class="card-top">
              <span class="card-label">Animais</span>
              <span class="tag tag-amber">Acervo</span>
            </div>
            <p class="card-value">{{ formatInt(stats.animals) }}</p>
            <span class="card-foot">Espécies disponíveis no banco</span>
          </div>

          <div class="card">
            <div class="card-top">
              <span class="card-label">Períodos</span>
              <span class="tag tag-violet">Estrutura</span>
            </div>
            <p class="card-value">{{ formatInt(stats.periodos) }}</p>
            <span class="card-foot">Divisões cronológicas mapeadas</span>
          </div>
        </div>
      </section>

      <!-- SEÇÃO: VENDAS -->
      <section class="section">
        <div class="section-head">
          <h2>Desempenho Comercial</h2>
          <span class="section-sub">Receita, pedidos e ticket médio</span>
        </div>

        <div class="grid grid-4">
          <div class="card highlight">
            <div class="card-top">
              <span class="card-label">Receita total</span>
              <span class="tag tag-green">Financeiro</span>
            </div>
            <p class="card-value">{{ formatBRL(stats.revenue) }}</p>
            <span class="card-foot">Soma de todos os pedidos confirmados</span>
          </div>

          <div class="card">
            <div class="card-top">
              <span class="card-label">Ticket médio</span>
              <span class="tag tag-yellow">Conversão</span>
            </div>
            <p class="card-value">{{ formatBRL(stats.avgTicket) }}</p>
            <span class="card-foot">Valor médio por pedido realizado</span>
          </div>

          <div class="card">
            <div class="card-top">
              <span class="card-label">Pedidos</span>
              <span class="tag tag-blue">Operação</span>
            </div>
            <p class="card-value">{{ formatInt(stats.orders) }}</p>
            <span class="card-foot">Volume total de transações</span>
          </div>

          <div class="card">
            <div class="card-top">
              <span class="card-label">Produtos</span>
              <span class="tag tag-teal">Catálogo</span>
            </div>
            <p class="card-value">{{ formatInt(stats.products) }}</p>
            <span class="card-foot">Itens ativos disponíveis para venda</span>
          </div>
        </div>
      </section>

      <!-- SEÇÃO: LOGÍSTICA -->
      <section class="section">
        <div class="section-head">
          <h2>Status Logístico</h2>
          <span class="section-sub">Acompanhamento das entregas em andamento</span>
        </div>

        <div class="grid grid-3">
          <div class="card status-card">
            <div class="status-row">
              <span class="status-pill pill-orange">Preparando</span>
              <span class="status-pct">{{ pct(stats.pending) }}%</span>
            </div>
            <p class="card-value">{{ formatInt(stats.pending) }}</p>
            <div class="bar">
              <div class="bar-fill bar-orange" :style="{ width: pct(stats.pending) + '%' }"></div>
            </div>
            <span class="card-foot">Pedidos em fase de separação</span>
          </div>

          <div class="card status-card">
            <div class="status-row">
              <span class="status-pill pill-blue">Em rota</span>
              <span class="status-pct">{{ pct(stats.onTheWay) }}%</span>
            </div>
            <p class="card-value">{{ formatInt(stats.onTheWay) }}</p>
            <div class="bar">
              <div class="bar-fill bar-blue" :style="{ width: pct(stats.onTheWay) + '%' }"></div>
            </div>
            <span class="card-foot">A caminho do destinatário</span>
          </div>

          <div class="card status-card">
            <div class="status-row">
              <span class="status-pill pill-green">Entregues</span>
              <span class="status-pct">{{ pct(stats.delivered) }}%</span>
            </div>
            <p class="card-value">{{ formatInt(stats.delivered) }}</p>
            <div class="bar">
              <div class="bar-fill bar-green" :style="{ width: pct(stats.delivered) + '%' }"></div>
            </div>
            <span class="card-foot">Concluídos com sucesso</span>
          </div>
        </div>
      </section>

      <footer class="footer">
        Painel administrativo · dados em tempo real · uso interno
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import api from "../../services/api";

const loading = ref(true);
const hydrated = ref(false);
const lastUpdate = ref("--:--");

const stats = ref({
  users: 0,
  eras: 0,
  animals: 0,
  periodos: 0,
  products: 0,
  orders: 0,
  revenue: 0,
  avgTicket: 0,
  pending: 0,
  onTheWay: 0,
  delivered: 0
});

function formatInt(n: number) {
  return Number(n || 0).toLocaleString("pt-BR");
}
function formatBRL(n: number) {
  return "R$ " + Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}
function pct(n: number) {
  const total = stats.value.pending + stats.value.onTheWay + stats.value.delivered;
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

async function loadData() {
  loading.value = true;
  try {
    const [statsRes, periodosRes, productsRes, ordersRes] = await Promise.all([
      api.get("/admin/stats"),
      api.get("/periodos"),
      api.get("/products"),
      api.get("/orders")
    ]);

    const orders = ordersRes.data;
    const products = productsRes.data;
    const revenue = orders.reduce(
      (sum: number, order: any) => sum + Number(order.total || 0),
      0
    );

    stats.value = {
      users: statsRes.data.users || 0,
      eras: statsRes.data.eras || 0,
      animals: statsRes.data.animals || 0,
      periodos: periodosRes.data.length,
      products: products.length,
      orders: orders.length,
      revenue,
      avgTicket: orders.length > 0 ? revenue / orders.length : 0,
      pending: orders.filter((o: any) => o.status === "pending").length,
      onTheWay: orders.filter((o: any) => o.status === "on_the_way").length,
      delivered: orders.filter((o: any) => o.status === "delivered").length
    };

    const now = new Date();
    lastUpdate.value = now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
    hydrated.value = true;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<style scoped>
.page {
  padding: 36px 40px 60px;
  min-height: 100vh;
  background: radial-gradient(circle at top, #1a1208, #0f0c08 70%);
  color: #f5e6c8;
  font-family: "Cinzel", serif;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding-bottom: 22px;
  margin-bottom: 32px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.15);
  flex-wrap: wrap;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.crest {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(212,175,55,0.18), rgba(212,175,55,0.04));
  border: 1px solid rgba(212, 175, 55, 0.3);
  display: grid;
  place-items: center;
  font-size: 1.6rem;
}
h1 {
  color: #d4af37;
  margin: 0;
  font-size: 1.6rem;
  letter-spacing: 0.5px;
}
.subtitle {
  margin: 4px 0 0;
  opacity: 0.65;
  font-size: 0.85rem;
  font-family: "Inter", system-ui, sans-serif;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 0.85rem;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #777;
}
.status-dot.live {
  background: #2ecc71;
  box-shadow: 0 0 0 4px rgba(46, 204, 113, 0.15);
}
.status-text {
  opacity: 0.75;
}
.refresh-btn {
  background: rgba(212, 175, 55, 0.08);
  color: #d4af37;
  border: 1px solid rgba(212, 175, 55, 0.3);
  padding: 7px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8rem;
  letter-spacing: 0.3px;
  transition: 0.2s;
}
.refresh-btn:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.18);
  border-color: rgba(212, 175, 55, 0.55);
}
.refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* LOADING */
.loading {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #d4af37;
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  padding: 40px 0;
}
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(212, 175, 55, 0.25);
  border-top-color: #d4af37;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* SECTION */
.section { margin-bottom: 38px; }
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(212, 175, 55, 0.12);
}
.section-head h2 {
  font-size: 1rem;
  color: #d4af37;
  margin: 0;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.section-sub {
  font-family: "Inter", sans-serif;
  font-size: 0.78rem;
  opacity: 0.55;
}

/* GRID */
.grid { display: grid; gap: 16px; }
.grid-4 { grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); }
.grid-3 { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }

/* CARD */
.card {
  padding: 22px;
  border-radius: 12px;
  background: linear-gradient(160deg, rgba(255,255,255,0.025), rgba(0,0,0,0.25));
  border: 1px solid rgba(212, 175, 55, 0.12);
  transition: 0.25s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.card:hover {
  transform: translateY(-2px);
  border-color: rgba(212, 175, 55, 0.35);
  background: linear-gradient(160deg, rgba(255,255,255,0.04), rgba(0,0,0,0.3));
}
.card.highlight {
  border-color: rgba(46, 204, 113, 0.35);
  background: linear-gradient(160deg, rgba(46,204,113,0.06), rgba(0,0,0,0.3));
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-label {
  font-family: "Inter", sans-serif;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  opacity: 0.7;
}
.card-value {
  font-size: 1.9rem;
  font-weight: 600;
  color: #f5e6c8;
  margin: 4px 0 0;
  letter-spacing: 0.5px;
}
.card-foot {
  font-family: "Inter", sans-serif;
  font-size: 0.75rem;
  opacity: 0.5;
  margin-top: 2px;
}

/* TAGS */
.tag {
  font-family: "Inter", sans-serif;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid;
}
.tag-blue   { color: #79b8ff; border-color: rgba(121,184,255,0.3); background: rgba(121,184,255,0.06); }
.tag-gold   { color: #d4af37; border-color: rgba(212,175,55,0.35); background: rgba(212,175,55,0.06); }
.tag-amber  { color: #ffb371; border-color: rgba(255,179,113,0.3); background: rgba(255,179,113,0.06); }
.tag-violet { color: #b48ad9; border-color: rgba(180,138,217,0.3); background: rgba(180,138,217,0.06); }
.tag-green  { color: #6fd99a; border-color: rgba(111,217,154,0.3); background: rgba(111,217,154,0.06); }
.tag-yellow { color: #f1c40f; border-color: rgba(241,196,15,0.3);  background: rgba(241,196,15,0.06); }
.tag-teal   { color: #5fc9b3; border-color: rgba(95,201,179,0.3);  background: rgba(95,201,179,0.06); }

/* STATUS */
.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.status-pill {
  font-family: "Inter", sans-serif;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 4px 10px;
  border-radius: 6px;
}
.pill-orange { background: rgba(230,126,34,0.12); color: #e67e22; }
.pill-blue   { background: rgba(52,152,219,0.12); color: #5dade2; }
.pill-green  { background: rgba(46,204,113,0.12); color: #58d68d; }
.status-pct {
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  opacity: 0.75;
}
.bar {
  width: 100%;
  height: 5px;
  border-radius: 999px;
  background: rgba(255,255,255,0.05);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;
}
.bar-orange { background: linear-gradient(90deg, #e67e22, #f39c12); }
.bar-blue   { background: linear-gradient(90deg, #2980b9, #5dade2); }
.bar-green  { background: linear-gradient(90deg, #27ae60, #58d68d); }

/* FOOTER */
.footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid rgba(212,175,55,0.1);
  text-align: center;
  font-family: "Inter", sans-serif;
  font-size: 0.75rem;
  opacity: 0.4;
}

/* RESPONSIVE */
@media (max-width: 640px) {
  .page { padding: 20px; }
  h1 { font-size: 1.3rem; }
  .card-value { font-size: 1.5rem; }
}
</style>
