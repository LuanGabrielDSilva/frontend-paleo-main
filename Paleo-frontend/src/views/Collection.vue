<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import api from "../services/api";
import { useRoute } from "vue-router";

const route = useRoute();
const animals = ref<any[]>([]);
const eras = ref<any[]>([]);
const periodos = ref<any[]>([]);

const search = ref("");
const selectedEra = ref("");
const selectedPeriodo = ref("");
const selectedDieta = ref("");
const loading = ref(true);

/* =========================
   PAGINAÇÃO DOS PERÍODOS
========================= */

const currentPage = ref(1);

/* 1 período por página */
const periodsPerPage = 1;

/* =========================
   FAVORITOS
========================= */
const favorites = ref<string[]>([]);

const user = JSON.parse(
  localStorage.getItem("user") || "{}"
);

const FAVORITES_KEY = user?.id
  ? `paleo-favorites-${user.id}`
  : "paleo-favorites-guest";

/* carregar favoritos */
const loadFavorites = () => {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);

    if (saved) {
      favorites.value = JSON.parse(saved);
    }
  } catch (err) {
    console.error("Erro ao carregar favoritos:", err);
  }
};

/* salvar favoritos */
const saveFavorites = () => {
  localStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify(favorites.value)
  );
};

/* verificar favorito */
const isFavorite = (id: string) => {
  return favorites.value.includes(id);
};

/* alternar favorito */
const toggleFavorite = (animal: any) => {
  const id = String(animal.id);

  if (isFavorite(id)) {
    favorites.value = favorites.value.filter((f) => f !== id);
  } else {
    favorites.value.push(id);
  }

  saveFavorites();
};


/* NORMALIZADOR */
const normalize = (v: string) =>
  (v || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/* LOAD */
onMounted(async () => {
  loadFavorites();

  try {
    const [aRes, eRes, pRes] = await Promise.all([
      api.get("/animals"),
      api.get("/eras"),
      api.get("/periodos"),
    ]);

    animals.value = aRes.data.map((a: any) => ({
      ...a,
      normalizedName: normalize(a.name),
      normalizedDieta: normalize(a.dieta),
    }));

    const animalId = route.query.id;

if (animalId) {
  const animal = animals.value.find(
    a => String(a.id) === String(animalId)
  );

  if (animal) {
    await openAnimal(animal);
  }
}

    eras.value = eRes.data;
    periodos.value = pRes.data;

  } catch (error) {
    console.error("Erro ao buscar dados:", error);
  } finally {
    loading.value = false;
  }
});

const totalAnimals = computed(() => animals.value.length);
const totalEras = computed(() => eras.value.length);
const totalPeriodos = computed(() => periodos.value.length);

const filteredPeriodos = computed(() => {
  if (!selectedEra.value) return periodos.value;
  return periodos.value.filter((p) => p.eraId === selectedEra.value);
});

const dietasDisponiveis = computed(() => {
  const set = new Set(
    animals.value.map((a) => normalize(a.dieta)).filter(Boolean)
  );
  return Array.from(set);
});

const filteredAnimals = computed(() => {
  return animals.value.filter((a) => {
    const matchSearch = a.normalizedName.includes(
      normalize(search.value)
    );

    const matchEra =
      !selectedEra.value ||
      String(a.periodo?.eraId) === String(selectedEra.value);

    const matchPeriodo =
      !selectedPeriodo.value ||
      String(a.periodoId) === String(selectedPeriodo.value);

    const matchDieta =
      !selectedDieta.value ||
      a.normalizedDieta === normalize(selectedDieta.value);

    return (
      matchSearch &&
      matchEra &&
      matchPeriodo &&
      matchDieta
    );
  });
});


/* =========================
   TODOS OS PERÍODOS
========================= */

const groupedFull = computed(() => {

  const eraOrder = [
    "Paleozoico",
    "Mesozoico",
    "Cenozoico",
  ];

  const periodoOrder: Record<string, string[]> = {

    Paleozoico: [
      "Cambriano",
      "Ordoviciano",
      "Siluriano",
      "Devoniano",
      "Carbonífero",
      "Permiano",
    ],

    Mesozoico: [
      "Triássico",
      "Jurássico",
      "Cretáceo",
    ],

    Cenozoico: [
      "Paleógeno",
      "Neógeno",
      "Quaternário",
    ],

  };

  const allPeriods: any[] = [];

  eraOrder.forEach((era) => {

    periodoOrder[era].forEach((periodo) => {

      const periodoAnimals =
        filteredAnimals.value
          .filter(
            (a) => a.periodo?.name === periodo
          )
          .sort((a, b) =>
            a.name.localeCompare(b.name)
          );

      if (periodoAnimals.length > 0) {

        allPeriods.push({
          era,
          periodo,
          animals: periodoAnimals,
        });

      }

    });

  });

  return allPeriods;

});

/* =========================
   TOTAL DE PÁGINAS
========================= */

const totalPages = computed(() => {

  return Math.ceil(
    groupedFull.value.length /
    periodsPerPage
  );

});

/* =========================
   PÁGINA ATUAL
========================= */

const grouped = computed(() => {

  const start =
    (currentPage.value - 1) *
    periodsPerPage;

  const end =
    start + periodsPerPage;

  return groupedFull.value.slice(
    start,
    end
  );

});

const dietIcon = (d: string) => {
  const n = normalize(d);
  if (n.includes("carn")) return "🦴";
  if (n.includes("herb")) return "🌿";
  if (n.includes("oni")) return "🍖";
  if (n.includes("pisc")) return "🐟";
  if (n.includes("inset")) return "🐛";
  return "✦";
};

const clearFilters = () => {
  search.value = "";
  selectedEra.value = "";
  selectedPeriodo.value = "";
  selectedDieta.value = "";
};

const hasFilters = computed(
  () =>
    search.value ||
    selectedEra.value ||
    selectedPeriodo.value ||
    selectedDieta.value
);

/* =========================
   MODAL — NOVO VISUAL
========================= */
const selectedAnimal = ref<any | null>(null);
const activeTab = ref<"ficha" | "habitat" | "descoberta" | "cadeia">("ficha");

const openAnimal = async (animal: any) => {

  try {

    const response = await api.get(
      `/animals/${animal.id}`
    );

    selectedAnimal.value = response.data;

    activeTab.value = "ficha";

  } catch (err) {

    console.error(
      "Erro ao abrir animal:",
      err
    );

  }

};

const closeAnimal = () => {
  selectedAnimal.value = null;
};

const fossilCode = (id: any) => {
  const base = String(id ?? Math.random())
    .replace(/\D/g, "")
    .padStart(4, "0")
    .slice(-4);
  return `FSL-${base}`;
};

const eraOf = (a: any) =>
  eras.value.find((e) => e.id === a?.periodo?.eraId)?.name || "Era desconhecida";
</script>

<template>
  <div class="page">
    <!-- AURORA / FUNDO ANIMADO -->
    <div class="aurora">
      <span class="blob blob-a"></span>
      <span class="blob blob-b"></span>
      <span class="blob blob-c"></span>
      <div class="grain"></div>
    </div>

    <!-- HEADER -->
    <header class="header">
      <div class="brand">
        <div class="crest">ᛝ</div>
        <div>
          <p class="eyebrow">Coleção Permanente</p>
          <h1>Museu dos Animais</h1>
          <p class="tagline">
            Uma travessia pelas eras pré-históricas — espécies, períodos e
            dietas reunidos em um só acervo.
          </p>
        </div>
      </div>

      <div class="stats">
        <div class="stat">
          <span class="stat-num">{{ totalAnimals }}</span>
          <span class="stat-label">Espécies</span>
        </div>
        <div class="divider"></div>
        <div class="stat">
          <span class="stat-num">{{ totalEras }}</span>
          <span class="stat-label">Eras</span>
        </div>
        <div class="divider"></div>
        <div class="stat">
          <span class="stat-num">{{ totalPeriodos }}</span>
          <span class="stat-label">Períodos</span>
        </div>
      </div>
    </header>

    <!-- CONTROLES -->
    <section class="controls-card">
      <div class="search-wrap">
        <span class="search-icon">⌕</span>
        <input v-model="search" placeholder="Buscar espécie pelo nome..." />
      </div>

      <div class="selects">
        <label class="select">
          <span>Era</span>
          <select v-model="selectedEra">
            <option value="">Todas</option>
            <option v-for="e in eras" :key="e.id" :value="e.id">
              {{ e.name }}
            </option>
          </select>
        </label>

        <label class="select" :class="{ disabled: !selectedEra }">
          <span>Período</span>
          <select v-model="selectedPeriodo" :disabled="!selectedEra">
            <option value="">Todos</option>
            <option v-for="p in filteredPeriodos" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </label>

        <label class="select">
          <span>Dieta</span>
          <select v-model="selectedDieta">
            <option value="">Todas</option>
            <option v-for="d in dietasDisponiveis" :key="d" :value="d">
              {{ d }}
            </option>
          </select>
        </label>

        <button class="clear" :disabled="!hasFilters" @click="clearFilters">
          Limpar
        </button>
      </div>

      <div class="result-line">
        <span class="dot"></span>
        <strong>{{ filteredAnimals.length }}</strong>
        de {{ totalAnimals }} espécies em exibição
      </div>
    </section>

    <!-- LOADING -->
    <div v-if="loading" class="state">
      <div class="loader"></div>
      <p>Abrindo as vitrines...</p>
    </div>

    <!-- VAZIO -->
    <div v-else-if="filteredAnimals.length === 0" class="state">
      <div class="empty-icon">𓃥</div>
      <h3>Nenhuma espécie encontrada</h3>
      <p>Ajuste os filtros ou limpe a busca para reabrir o acervo.</p>
      <button class="clear ghost" @click="clearFilters">Limpar filtros</button>
    </div>

    <!-- ACERVO -->
    <div v-else class="acervo">

  <div
    v-for="(group, index) in grouped"
    :key="group.periodo"
    class="era"
  >

    <div class="era-head">

      <div class="era-mark">
        {{ String(currentPage).padStart(2, "0") }}
      </div>

      <div>
        <p class="eyebrow small">
          Era
        </p>

        <h2 class="era-title">
          {{ group.era }}
        </h2>
      </div>

      <div class="era-line"></div>

      <div class="era-count">
        {{ group.animals.length }}
        espécies
      </div>

    </div>

    <div class="periodo">

      <div class="periodo-head">

        <span class="bullet"></span>

        <h3 class="periodo-title">
          {{ group.periodo }}
        </h3>

        <span class="periodo-count">
          {{ group.animals.length }}
        </span>

      </div>

      <div class="grid">

        <article
          v-for="animal in group.animals"
          :key="animal.id"
          class="card clickable"
          @click="openAnimal(animal)"
        >

          <span class="card-glow"></span>

          <button
            class="favorite-btn"
            @click.stop="toggleFavorite(animal)"
          >
            {{ isFavorite(animal.id) ? "★" : "☆" }}
          </button>

          <div class="card-media">

            <img
              v-if="animal.image"
              :src="animal.image"
              :alt="animal.name"
            />

            <div v-else class="no-image">
              𓆉
            </div>

            <span class="card-tag">
              {{ group.periodo }}
            </span>

          </div>

          <div class="card-body">

            <h4>
              {{ animal.name }}
            </h4>

            <div class="card-meta">

              <span class="chip">
                {{ dietIcon(animal.dieta) }}
                {{ animal.dieta }}
              </span>

              <span class="chip ghost">
                ⇲ {{ animal.size || "—" }}
              </span>

            </div>

          </div>

        </article>

      </div>

    </div>

  </div>

</div>

<div
  v-if="totalPages > 1"
  class="pagination"
>

  <button
    class="page-btn"
    :disabled="currentPage === 1"
    @click="currentPage--"
  >
    ←
  </button>

  <button
    v-for="page in totalPages"
    :key="page"
    class="page-btn"
    :class="{ active: currentPage === page }"
    @click="currentPage = page"
  >
    {{ page }}
  </button>

  <button
    class="page-btn"
    :disabled="currentPage === totalPages"
    @click="currentPage++"
  >
    →
  </button>

</div>

    <!-- =========================================================
         MODAL — NOVO VISUAL "FICHA DE EXPEDIÇÃO"
    ========================================================= -->
    <transition name="fade">
      <div v-if="selectedAnimal" class="xmodal-overlay" @click="closeAnimal">
        <div class="xmodal" @click.stop>
          <span class="corner tl"></span>
          <span class="corner tr"></span>
          <span class="corner bl"></span>
          <span class="corner br"></span>

          <button class="xclose" @click="closeAnimal" aria-label="Fechar">
            ✕
          </button>

          <div class="xmodal-grid">
            <!-- LADO ESQUERDO: VITRINE -->
            <aside class="xmedia">
              <div class="xmedia-frame">
                <img
                  v-if="selectedAnimal.image"
                  :src="selectedAnimal.image"
                  :alt="selectedAnimal.name"
                />
                <div v-else class="xmedia-empty">𓆉</div>

                <div class="catalog">
                  <span class="catalog-dot"></span>
                  N.º {{ fossilCode(selectedAnimal.id) }}
                </div>
              </div>

              <ul class="quick-specs">
                <li>
                  <span>Era</span>
                  <strong>{{ eraOf(selectedAnimal) }}</strong>
                </li>
                <li>
                  <span>Período</span>
                  <strong>{{ selectedAnimal.periodo?.name || "—" }}</strong>
                </li>
                <li>
                  <span>Dieta</span>
                  <strong>
                    {{ dietIcon(selectedAnimal.dieta) }}
                    {{ selectedAnimal.dieta || "—" }}
                  </strong>
                </li>
              </ul>
            </aside>

            <!-- LADO DIREITO: FICHA -->
            <section class="xinfo">
              <header class="xhead">
                <p class="xeyebrow">
                  <span class="line"></span>
                  Ficha de Expedição
                  <span class="line"></span>
                </p>

                <h2 class="xname">{{ selectedAnimal.name }}</h2>
                <p class="xlatin">
                  <em>
                    {{
                      selectedAnimal.scientificName || selectedAnimal.name
                    }}
                  </em>
                </p>

                <div class="xchips">
                  <span class="xchip gold">
                    {{ dietIcon(selectedAnimal.dieta) }}
                    {{ selectedAnimal.dieta || "Dieta desconhecida" }}
                  </span>
                  <span class="xchip">
                    ⇲ {{ selectedAnimal.size || "Tamanho —" }}
                  </span>
                  <span class="xchip ghost">{{ eraOf(selectedAnimal) }}</span>
                 <button
  class="favorite-modal"
  :class="{ 'is-fav': isFavorite(selectedAnimal.id) }"
  @click="toggleFavorite(selectedAnimal)"
>
  <span class="favorite-modal__icon">
    {{ isFavorite(selectedAnimal.id) ? "★" : "☆" }}
  </span>
  <span class="favorite-modal__label">
    {{ isFavorite(selectedAnimal.id) ? "Favoritado" : "Favoritar" }}
  </span>
</button>

                </div>
              </header>

              <nav class="xtabs">
                <button
                  :class="['xtab', { active: activeTab === 'ficha' }]"
                  @click="activeTab = 'ficha'"
                >
                  ◆ Ficha
                </button>
                <button
                  :class="['xtab', { active: activeTab === 'habitat' }]"
                  @click="activeTab = 'habitat'"
                >
                  ❖ Habitat
                </button>
                <button
                  :class="['xtab', { active: activeTab === 'descoberta' }]"
                  @click="activeTab = 'descoberta'"
                >
                  ✦ Descoberta
                </button>

                <button
                  :class="['xtab', { active: activeTab === 'cadeia' }]"
                  @click="activeTab = 'cadeia'"
                >
                  🦴 Cadeia Alimentar
                </button>
              </nav>

              <div class="xtab-body">
                <!-- FICHA -->
                <div v-if="activeTab === 'ficha'" class="tab-pane">
                  <div class="data-list">

                      <div class="data-row">
                        <span class="k">Nome</span>
                        <span class="v">{{ selectedAnimal.name }}</span>
                      </div>

                      <div class="data-row">
                        <span class="k">Nome Científico</span>
                        <span class="v">
                          {{
                            selectedAnimal.scientificName ||
                            "Não informado"
                          }}
                        </span>
                      </div>

                      <div class="data-row">
                        <span class="k">Período</span>
                        <span class="v">
                          {{ selectedAnimal.periodo?.name || "—" }}
                        </span>
                      </div>

                      <div class="data-row">
                        <span class="k">Era Geológica</span>
                        <span class="v">
                          {{ eraOf(selectedAnimal) }}
                        </span>
                      </div>

                      <div class="data-row">
                        <span class="k">Dieta</span>
                        <span class="v">
                          {{ selectedAnimal.dieta || "—" }}
                        </span>
                      </div>

                      <div class="data-row">
                        <span class="k">Tamanho</span>
                        <span class="v">
                          {{ selectedAnimal.size || "Não informado" }}
                        </span>
                      </div>

                      <div class="data-row">
                        <span class="k">Peso</span>
                        <span class="v">
                          {{ selectedAnimal.weight || "Não informado" }}
                        </span>
                      </div>

                      <div class="data-row">
                        <span class="k">Locomoção</span>
                        <span class="v">
                          {{ selectedAnimal.locomotion || "Não informado" }}
                        </span>
                      </div>

                      <div class="data-row">
                        <span class="k">Defesa</span>
                        <span class="v">
                          {{ selectedAnimal.defense || "Não informado" }}
                        </span>
                      </div>

                      <div class="data-row">
                        <span class="k">Habitat</span>
                        <span class="v">
                          {{ selectedAnimal.habitat || "Não informado" }}
                        </span>
                      </div>

                      <div class="data-row">
                        <span class="k">Clima</span>
                        <span class="v">
                          {{ selectedAnimal.clima || "Não informado" }}
                        </span>
                      </div>

                      <div class="data-row">
                        <span class="k">Catálogo</span>
                        <span class="v mono">
                          {{ fossilCode(selectedAnimal.id) }}
                        </span>
                      </div>

                    </div>

                  <div class="scroll-block">
                    <h4>⌘ Notas do curador</h4>
                    <p>
                      {{
                        selectedAnimal.description ||
                        "Espécime registrado pelo acervo paleontológico digital. Notas adicionais ainda não foram catalogadas pelo curador responsável."
                      }}
                    </p>
                  </div>
                </div>

                <!-- HABITAT -->
                <div v-else-if="activeTab === 'habitat'" class="tab-pane">
                  <div class="habitat-card">
                    <div class="habitat-icon">🌍</div>
                    <div>
                      <h4>Ambiente predominante</h4>
                      <p>
                        {{
                          selectedAnimal.habitat ||
                          "Habitat não documentado. Estima-se que vivia em ecossistemas típicos do " +
                            (selectedAnimal.periodo?.name || "seu período") +
                            ", com vegetação e clima compatíveis com a fauna da época."
                        }}
                      </p>
                    </div>
                  </div>

                  <div class="habitat-card">
                    <div class="habitat-icon">🌡️</div>
                    <div>
                      <h4>Clima</h4>
                      <p>
                        {{
                          selectedAnimal.clima ||
                          "Variações climáticas próprias da era " +
                            eraOf(selectedAnimal) +
                            "."
                        }}
                      </p>
                    </div>
                  </div>
                </div>
               
                <!-- CADEIA ALIMENTAR -->
<div
  v-else-if="activeTab === 'cadeia'"
  class="tab-pane"
>

  <div class="food-chain-modern">

    <!-- PREDADORES -->
    <div class="chain-section">

      <h3 class="chain-title danger">
        ☠ Predadores
      </h3>

      <div
        v-if="
          selectedAnimal.predators &&
          selectedAnimal.predators.length
        "
        class="chain-grid"
      >

        <div
            v-for="relation in selectedAnimal.predators"
            :key="relation.predator.id"
            class="chain-card predator-card clickable-chain"
            @click="openAnimal(relation.predator)"
        >

          <img
            :src="relation.predator.image"
            :alt="relation.predator.name"
          />

          <div class="chain-info">
            <strong>
              {{ relation.predator.name }}
            </strong>

            <span>
              Caçava {{ selectedAnimal.name }}
            </span>
          </div>
        </div>

      </div>

      <div v-else class="chain-empty">
        Nenhum predador catalogado.
      </div>

    </div>

   

    <!-- PRESAS -->
    <div class="chain-section">

      <h3 class="chain-title success">
        🍖 Presas
      </h3>

      <div
        v-if="
          selectedAnimal.preys &&
          selectedAnimal.preys.length
        "
        class="chain-grid"
      >

        <div
            v-for="relation in selectedAnimal.preys"
            :key="relation.prey.id"
            class="chain-card prey-card clickable-chain"
            @click="openAnimal(relation.prey)"
        >
          <img
            :src="relation.prey.image"
            :alt="relation.prey.name"
          />

          <div class="chain-info">
            <strong>
              {{ relation.prey.name }}
            </strong>

            <span>
              Era caçado por {{ selectedAnimal.name }}
            </span>
          </div>
        </div>

      </div>

      <div v-else class="chain-empty">
        Nenhuma presa catalogada.
      </div>

    </div>

  </div>

</div>
                <!-- DESCOBERTA -->
                <div v-else class="tab-pane">
                  <div class="discover">
                    <div class="discover-line">
                      <span class="dot-g"></span>
                      <div>
                        <strong>Primeira descrição</strong>
                        <p>
                          {{
                            selectedAnimal.descoberta ||
                            "Registro fóssil em estudo."
                          }}
                        </p>
                      </div>
                    </div>
                    <div class="discover-line">
                      <span class="dot-g"></span>
                      <div>
                        <strong>Local de origem</strong>
                        <p>
                          {{
                            selectedAnimal.local ||
                            "Localização não catalogada."
                          }}
                        </p>
                      </div>
                    </div>
                    <div class="discover-line">
                      <span class="dot-g"></span>
                      <div>
                        <strong>Status do acervo</strong>
                        <p>Disponível para consulta pública no acervo digital.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <footer class="xfoot">
                <span>✦ Acervo Digital Paleontológico ✦</span>
                <button class="xfoot-btn" @click="closeAnimal">
                  Fechar ficha
                </button>
              </footer>
            </section>
          </div>
        </div>
      </div>
    </transition>

    <!-- FOOTER -->
    <footer class="foot">
      <span>✦</span>
      <p>Acervo digital — explorando o tempo profundo</p>
      <span>✦</span>
    </footer>
  </div>
</template>

<style scoped>


/* FAVORITO MODAL (ficha do animal) */
.favorite-modal {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid rgba(212, 175, 55, 0.4);
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #f1d98a;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.25s ease, background 0.25s ease,
    border-color 0.25s ease, box-shadow 0.25s ease, color 0.25s ease;
  position: relative;
  overflow: hidden;
}

.favorite-modal::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(212, 175, 55, 0.18),
    rgba(212, 175, 55, 0)
  );
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.favorite-modal:hover {
  transform: translateY(-1px);
  border-color: rgba(212, 175, 55, 0.85);
  color: #f6e7b6;
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.25);
}

.favorite-modal:hover::before {
  opacity: 1;
}

.favorite-modal:active {
  transform: translateY(0) scale(0.97);
}

.favorite-modal__icon {
  font-size: 1.05rem;
  line-height: 1;
  display: inline-block;
  transition: transform 0.3s ease;
}

.favorite-modal:hover .favorite-modal__icon {
  transform: rotate(-12deg) scale(1.15);
}

/* Estado ativo (favoritado) */
.favorite-modal.is-fav {
  background: linear-gradient(135deg, #f6e7b6 0%, #d4af37 55%, #8a6a1f 100%);
  border-color: #f1d98a;
  color: #1a1208;
  box-shadow: 0 0 22px rgba(212, 175, 55, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.15);
}

.favorite-modal.is-fav:hover {
  filter: brightness(1.05);
  box-shadow: 0 0 28px rgba(212, 175, 55, 0.75),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.favorite-modal.is-fav .favorite-modal__icon {
  color: #1a1208;
  text-shadow: 0 0 8px rgba(255, 230, 150, 0.6);
  animation: favPulse 1.6s ease-in-out infinite;
}

@keyframes favPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.12); }
}

/* =========================
   PAGE
========================= */
.page {
  position: relative;
  min-height: 100vh;
  padding: 60px 6vw 40px;
  color: #f5e6c8;
  font-family: "Crimson Text", Georgia, serif;
  background: #0c0907;
  overflow: hidden;
}

/* AURORA */
.aurora {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.blob {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.25;
  animation: float 18s ease-in-out infinite;
}
.blob-a { background: #d4af37; top: -150px; left: -120px; }
.blob-b { background: #6b4d12; bottom: -200px; right: -100px; animation-delay: -6s; }
.blob-c { background: #8a6a1f; top: 40%; left: 50%; animation-delay: -12s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -30px) scale(1.1); }
}
.grain {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 3px 3px;
  opacity: 0.5;
}

.header,
.controls-card,
.acervo,
.state,
.foot { position: relative; z-index: 1; }

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 40px;
  flex-wrap: wrap;
  padding-bottom: 32px;
  border-bottom: 1px solid rgba(212,175,55,0.18);
  margin-bottom: 32px;
}
.brand { display: flex; gap: 22px; align-items: flex-start; max-width: 720px; }
.crest {
  font-size: 2.4rem;
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.05));
  border: 1px solid rgba(212,175,55,0.35);
  color: #f1d98a;
  box-shadow: inset 0 0 30px rgba(212,175,55,0.15);
}
.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.35em;
  font-size: 0.7rem;
  color: #d4af37;
  opacity: 0.85;
  margin-bottom: 6px;
}
.eyebrow.small { font-size: 0.6rem; letter-spacing: 0.3em; margin: 0; }
.header h1 {
  font-family: "Cinzel", "Playfair Display", Georgia, serif;
  font-size: clamp(2.2rem, 4vw, 3.4rem);
  line-height: 1.05;
  font-weight: 600;
  background: linear-gradient(180deg, #f6e7b6 0%, #d4af37 60%, #8a6a1f 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin: 0 0 10px;
}
.tagline { color: #c9b37a; opacity: 0.8; max-width: 520px; line-height: 1.6; }

.stats {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 18px 24px;
  border: 1px solid rgba(212,175,55,0.25);
  border-radius: 18px;
  background: rgba(20, 12, 6, 0.55);
  backdrop-filter: blur(10px);
}
.stat { display: flex; flex-direction: column; align-items: center; min-width: 64px; }
.stat-num { font-family: "Cinzel", serif; font-size: 1.7rem; color: #f1d98a; line-height: 1; }
.stat-label {
  font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase;
  color: #c9b37a; opacity: 0.7; margin-top: 6px;
}
.divider {
  width: 1px; height: 32px;
  background: linear-gradient(180deg, transparent, rgba(212,175,55,0.5), transparent);
}

/* CONTROLES */
.controls-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(26,18,8,0.85), rgba(12,9,6,0.85));
  border: 1px solid rgba(212,175,55,0.2);
  box-shadow: 0 30px 60px -30px rgba(0,0,0,0.8);
  margin-bottom: 40px;
}
.search-wrap { position: relative; width: 100%; max-width: 100%; overflow: hidden; }
.search-icon {
  position: absolute; left: 18px; top: 50%;
  transform: translateY(-50%); color: #d4af37; font-size: 1.1rem;
}
.search-wrap input {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 18px 14px 46px;
  border-radius: 14px;
  border: 1px solid rgba(212,175,55,0.2);
  background: rgba(0,0,0,0.4);
  color: #f5e6c8;
  font-size: 1rem;
  transition: 0.25s;
}
.search-wrap input:focus {
  outline: none;
  border-color: #d4af37;
  box-shadow: 0 0 0 4px rgba(212,175,55,0.12);
}

.selects {
  display: grid;
  grid-template-columns: repeat(3, 1fr) auto;
  gap: 12px;
}
.select { display: flex; flex-direction: column; gap: 4px; position: relative; }
.select span {
  font-size: 0.65rem; letter-spacing: 0.25em; text-transform: uppercase;
  color: #d4af37; opacity: 0.75; padding-left: 4px;
}
.select select {
  appearance: none;
  padding: 12px 36px 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(212,175,55,0.18);
  background:
    linear-gradient(135deg, rgba(212,175,55,0.04), transparent),
    rgba(0,0,0,0.4);
  color: #f5e6c8;
  font-size: 0.95rem;
  cursor: pointer;
  transition: 0.25s;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1l5 5 5-5' stroke='%23d4af37' stroke-width='1.5' stroke-linecap='round'/></svg>");
  background-repeat: no-repeat;
  background-position: right 14px center;
}
.select select:focus {
  outline: none; border-color: #d4af37;
  box-shadow: 0 0 0 4px rgba(212,175,55,0.12);
}
.select.disabled select { opacity: 0.4; cursor: not-allowed; }

.clear {
  align-self: end;
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid rgba(212,175,55,0.4);
  background: linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.05));
  color: #f1d98a;
  font-weight: 600;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: 0.2s;
}
.clear:hover:not(:disabled) {
  background: linear-gradient(135deg, #d4af37, #a07c1c);
  color: #1a1208;
}
.clear:disabled { opacity: 0.35; cursor: not-allowed; }
.clear.ghost { background: transparent; }

.result-line {
  display: flex; align-items: center; gap: 10px;
  font-size: 0.85rem; color: #c9b37a;
  padding-top: 6px; border-top: 1px dashed rgba(212,175,55,0.15);
}
.result-line strong { color: #f1d98a; }
.dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #d4af37; box-shadow: 0 0 12px #d4af37;
  animation: pulse 1.6s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

/* STATES */
.state { text-align: center; padding: 80px 20px; color: #c9b37a; }
.state h3 { color: #f1d98a; margin: 12px 0 8px; font-family: "Cinzel", serif; }
.empty-icon { font-size: 3rem; color: #d4af37; opacity: 0.7; }
.loader {
  width: 42px; height: 42px; border-radius: 50%;
  border: 3px solid rgba(212,175,55,0.2);
  border-top-color: #d4af37;
  margin: 0 auto 16px;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ACERVO */
.acervo { display: flex; flex-direction: column; gap: 56px; }
.era { animation: fadeUp 0.6s ease both; }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.era-head { display: flex; align-items: center; gap: 18px; margin-bottom: 26px; }
.era-mark {
  width: 54px; height: 54px;
  border-radius: 14px;
  display: grid; place-items: center;
  background: linear-gradient(135deg, #d4af37, #6b4d12);
  color: #1a1208;
  font-family: "Cinzel", serif;
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: 0 10px 30px -10px rgba(212,175,55,0.5);
}
.era-title {
  font-family: "Cinzel", serif;
  font-size: 1.8rem;
  color: #f1d98a;
  margin: 2px 0 0;
  letter-spacing: 0.02em;
}
.era-line { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(212,175,55,0.4), transparent); }
.era-count {
  font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase;
  color: #c9b37a;
  padding: 6px 12px;
  border: 1px solid rgba(212,175,55,0.25);
  border-radius: 20px;
}

.periodo { margin-bottom: 32px; }
.periodo-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-left: 6px; }
.bullet {
  width: 10px; height: 10px; border-radius: 50%;
  background: radial-gradient(circle, #f1d98a, #6b4d12);
  box-shadow: 0 0 12px rgba(212,175,55,0.6);
}
.periodo-title {
  font-family: "Cinzel", serif;
  font-size: 1.05rem;
  color: #f5e6c8;
  margin: 0;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.periodo-count {
  font-size: 0.7rem; color: #c9b37a;
  background: rgba(212,175,55,0.1);
  padding: 3px 10px; border-radius: 20px;
}

/* ======================
   GRID RESPONSIVO
   Ajusta automaticamente
   a quantidade de colunas
   conforme o tamanho da tela
====================== */

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 22px;
}

/* CARD */
.card {
  position: relative;
  background: linear-gradient(180deg, rgba(40,26,12,0.7), rgba(12,9,6,0.85));
  border: 1px solid rgba(212,175,55,0.18);
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.4s cubic-bezier(.2,.8,.2,1),
              border-color 0.3s, box-shadow 0.4s;
  animation: fadeUp 0.5s ease both;
  isolation: isolate;
}
.card:hover {
  transform: translateY(-8px);
  border-color: rgba(212,175,55,0.55);
  box-shadow: 0 25px 50px -20px rgba(0,0,0,0.9),
              0 0 30px -10px rgba(212,175,55,0.3);
}
.card-glow {
  position: absolute; inset: -2px;
  border-radius: inherit;
  background: radial-gradient(400px circle at var(--x,50%) var(--y,0%),
              rgba(212,175,55,0.15), transparent 40%);
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
  z-index: -1;
}
.card:hover .card-glow { opacity: 1; }
.clickable { cursor: pointer; }

.card-media {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #1a1208;
}
.card-media img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.6s cubic-bezier(.2,.8,.2,1);
  filter: saturate(0.9) contrast(1.05);
}
.card:hover .card-media img { transform: scale(1.08); }
.no-image {
  display: grid; place-items: center; height: 100%;
  font-size: 3rem; color: rgba(212,175,55,0.4);
}
.card-tag {
  position: absolute; top: 12px; left: 12px;
  padding: 4px 10px;
  font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase;
  color: #f1d98a;
  background: rgba(0,0,0,0.65);
  border: 1px solid rgba(212,175,55,0.3);
  border-radius: 20px;
  backdrop-filter: blur(6px);
}

.card-body {
  padding: 16px 18px 20px;
  display: flex; flex-direction: column; gap: 12px;
  flex: 1;
}
.card h4 {
  font-family: "Cinzel", serif;
  font-size: 1.15rem;
  color: #f5e6c8;
  margin: 0;
  letter-spacing: 0.02em;
}
.card-meta { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  font-size: 0.72rem;
  padding: 5px 10px;
  border-radius: 20px;
  background: rgba(212,175,55,0.12);
  color: #f1d98a;
  border: 1px solid rgba(212,175,55,0.2);
  letter-spacing: 0.03em;
}
.chip.ghost { background: transparent; color: #c9b37a; }

/* FOOT */
.foot {
  margin-top: 80px;
  padding-top: 30px;
  border-top: 1px solid rgba(212,175,55,0.15);
  display: flex;
  justify-content: center;
  gap: 14px;
  align-items: center;
  color: #c9b37a;
  opacity: 0.7;
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.foot span { color: #d4af37; }

/* RESPONSIVO BASE */
@media (max-width: 720px) {
  .header { flex-direction: column; align-items: flex-start; }
  .stats { width: 100%; justify-content: space-between; }
  .selects { grid-template-columns: 1fr 1fr; }
  .clear { grid-column: 1 / -1; }
}

/* =========================================================
   MODAL — "FICHA DE EXPEDIÇÃO"
========================================================= */
.xmodal-overlay {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at center, rgba(60,40,15,0.35), rgba(0,0,0,0.85) 70%);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 28px;
  z-index: 9999;
}

.xmodal {
  position: relative;

  width: min(96vw, 1450px);

  height: min(92vh, 950px);

  border-radius: 24px;

  background:
    repeating-linear-gradient(
      0deg,
      rgba(212,175,55,0.025) 0px,
      rgba(212,175,55,0.025) 1px,
      transparent 1px,
      transparent 4px
    ),
    linear-gradient(180deg, #1c140a 0%, #0c0907 100%);

  border: 1px solid rgba(212,175,55,0.28);

  box-shadow:
    0 50px 120px rgba(0,0,0,0.95),
    0 0 80px rgba(212,175,55,0.08),
    inset 0 0 100px rgba(0,0,0,0.4);

  animation: xmodalIn .45s cubic-bezier(.2,.9,.25,1);

  overflow: hidden;

  display: flex;
  flex-direction: column;
}

.xmodal-grid {
  display: grid;

  grid-template-columns: 0.95fr 1.1fr;

  height: 100%;

  overflow: hidden;
}

@keyframes xmodalIn {
  from { opacity: 0; transform: scale(.92) translateY(30px) rotateX(8deg); }
  to   { opacity: 1; transform: scale(1) translateY(0) rotateX(0); }
}

.corner {
  position: absolute;
  width: 28px; height: 28px;
  border: 2px solid #d4af37;
  opacity: 0.7;
  pointer-events: none;
}
.corner.tl { top: 14px; left: 14px; border-right: none; border-bottom: none; border-top-left-radius: 8px; }
.corner.tr { top: 14px; right: 14px; border-left: none; border-bottom: none; border-top-right-radius: 8px; }
.corner.bl { bottom: 14px; left: 14px; border-right: none; border-top: none; border-bottom-left-radius: 8px; }
.corner.br { bottom: 14px; right: 14px; border-left: none; border-top: none; border-bottom-right-radius: 8px; }

.xclose {
  position: absolute;
  top: 22px; right: 22px;
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(212,175,55,0.4);
  background: rgba(0,0,0,0.5);
  color: #f5e6c8;
  cursor: pointer;
  z-index: 10;
  transition: .25s;
  font-size: .9rem;
}
.xclose:hover {
  background: #d4af37;
  color: #1a1208;
  transform: rotate(90deg);
}

.xmodal-grid {
  display: grid;
  grid-template-columns: 0.95fr 1.1fr;
  max-height: 92vh;
  overflow: hidden;
}

/* LADO ESQUERDO */
.xmedia {
  position: relative;
  padding: 36px 28px;
  background:
    radial-gradient(circle at 30% 20%, rgba(212,175,55,0.12), transparent 60%),
    linear-gradient(180deg, rgba(40,28,12,0.5), rgba(10,8,6,0.7));
  border-right: 1px solid rgba(212,175,55,0.18);
  display: flex;
  flex-direction: column;
  gap: 22px;
  overflow-y: auto;
}

.xmedia-frame {
  position: relative;
  aspect-ratio: 4/5;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(212,175,55,0.35);
  box-shadow:
    0 30px 60px rgba(0,0,0,0.6),
    inset 0 0 60px rgba(0,0,0,0.5);
  background: #1a1208;
}
.xmedia-frame img {
  width: 100%; height: 100%; object-fit: cover;
  filter: saturate(0.95) contrast(1.05);
}
.xmedia-empty {
  height: 100%; display: grid; place-items: center;
  font-size: 7rem; color: rgba(212,175,55,0.35);
}

.catalog {
  position: absolute;
  top: 14px; left: 14px;
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px;
  background: rgba(0,0,0,0.65);
  border: 1px solid rgba(212,175,55,0.3);
  border-radius: 20px;
  font-family: "JetBrains Mono", "Courier New", monospace;
  font-size: 0.7rem;
  color: #f1d98a;
  letter-spacing: 0.1em;
  backdrop-filter: blur(6px);
}
.catalog-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #6dffa1;
  box-shadow: 0 0 8px #6dffa1;
}

.quick-specs {
  list-style: none;
  margin: 0; padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.quick-specs li {
  padding: 12px 10px;
  border-radius: 12px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(212,175,55,0.12);
  text-align: center;
  display: flex; flex-direction: column; gap: 4px;
}
.quick-specs span {
  font-size: 0.6rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #c9b37a;
  opacity: 0.7;
}
.quick-specs strong {
  color: #f5e6c8;
  font-size: 0.8rem;
  line-height: 1.2;
}

/* LADO DIREITO */
.xinfo {
  display: flex;
  flex-direction: column;

  min-height: 0;

  overflow: hidden;

  padding: 36px 38px 24px;
}

.xtab-body {
  flex: 1;

  min-height: 0;

  overflow-y: auto;

  padding: 22px 4px 12px 0;

  animation: fadeUp 0.35s ease;
}

/* scrollbar */
.xtab-body::-webkit-scrollbar {
  width: 8px;
}

.xtab-body::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.03);
  border-radius: 999px;
}

.xtab-body::-webkit-scrollbar-thumb {
  background: rgba(212,175,55,0.45);
  border-radius: 999px;
}

.xtab-body::-webkit-scrollbar-thumb:hover {
  background: rgba(212,175,55,0.7);
}

.xhead { padding-bottom: 22px; }

.xeyebrow {
  display: flex; align-items: center; gap: 12px;
  font-size: 0.65rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: #d4af37;
  opacity: 0.85;
  margin: 0 0 16px;
}
.xeyebrow .line {
  flex: 0 0 36px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
}

.xname {
  font-family: "Cinzel", serif;
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 600;
  margin: 0;
  line-height: 1.1;
  background: linear-gradient(180deg, #f6e7b6 0%, #d4af37 60%, #8a6a1f 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.xlatin {
  margin: 6px 0 18px;
  color: #c9b37a;
  font-style: italic;
  opacity: 0.85;
  font-size: 0.95rem;
}

.xchips { display: flex; flex-wrap: wrap; gap: 8px; }
.xchip {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(212,175,55,0.2);
  color: #f1d98a;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
}
.xchip.gold {
  background: linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.08));
  border-color: rgba(212,175,55,0.45);
}
.xchip.ghost { background: transparent; color: #c9b37a; }

/* TABS */
.xtabs {
  display: flex;
  gap: 4px;
  margin-top: 22px;
  padding: 4px;
  border-radius: 14px;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(212,175,55,0.15);
}
.xtab {
  flex: 1;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: #c9b37a;
  font-family: "Cinzel", serif;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.25s;
}
.xtab:hover { color: #f5e6c8; }
.xtab.active {
  background: linear-gradient(135deg, #d4af37, #8a6a1f);
  color: #1a1208;
  box-shadow: 0 6px 18px -6px rgba(212,175,55,0.6);
}

.xtab-body {
  flex: 1;
  padding: 22px 0 12px;
  animation: fadeUp 0.35s ease;
}
.tab-pane { display: flex; flex-direction: column; gap: 22px; }

/* DATA LIST */
.data-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(212,175,55,0.15);
}
.data-row {
  padding: 12px 14px;
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid rgba(212,175,55,0.08);
  border-right: 1px solid rgba(212,175,55,0.08);
  display: flex; flex-direction: column; gap: 4px;
}
.data-row:nth-child(2n) { border-right: none; }
.data-row .k {
  font-size: 0.62rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #c9b37a;
  opacity: 0.75;
}
.data-row .v { color: #f5e6c8; font-size: 0.95rem; }
.data-row .v.mono {
  font-family: "JetBrains Mono", "Courier New", monospace;
  color: #f1d98a;
  letter-spacing: 0.08em;
}

/* SCROLL BLOCK */
.scroll-block {
  position: relative;

  padding: 22px;

  border-radius: 16px;

  background:
    linear-gradient(
      180deg,
      rgba(212,175,55,0.06),
      rgba(212,175,55,0.02)
    );

  border-left: 3px solid #d4af37;

  border-top: 1px solid rgba(212,175,55,0.18);
  border-right: 1px solid rgba(212,175,55,0.1);
  border-bottom: 1px solid rgba(212,175,55,0.1);

  max-height: 260px;

  overflow-y: auto;

  padding-right: 12px;
}

.scroll-block::-webkit-scrollbar {
  width: 8px;
}

.scroll-block::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.03);
  border-radius: 999px;
}

.scroll-block::-webkit-scrollbar-thumb {
  background: rgba(212,175,55,0.5);
  border-radius: 999px;
}

.scroll-block::-webkit-scrollbar-thumb:hover {
  background: rgba(212,175,55,0.8);
}

.scroll-block h4 {
  margin: 0 0 10px;
  color: #f1d98a;
  font-family: "Cinzel", serif;
  font-size: 0.95rem;
  letter-spacing: 0.1em;
}
.scroll-block p {
  margin: 0;
  color: #d8c8a5;
  line-height: 1.75;
  font-size: 0.95rem;
}

/* HABITAT */
.habitat-card {
  display: flex;
  gap: 16px;
  padding: 18px;
  border-radius: 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(212,175,55,0.15);
  align-items: flex-start;
}
.habitat-icon {
  font-size: 2rem;
  width: 52px; height: 52px;
  display: grid; place-items: center;
  border-radius: 12px;
  background: rgba(212,175,55,0.1);
  border: 1px solid rgba(212,175,55,0.2);
  flex-shrink: 0;
}
.habitat-card h4 {
  margin: 0 0 6px;
  color: #f1d98a;
  font-family: "Cinzel", serif;
  font-size: 0.95rem;
}
.habitat-card p {
  margin: 0;
  color: #d8c8a5;
  line-height: 1.6;
  font-size: 0.9rem;
}

/* DISCOVER */
.discover { display: flex; flex-direction: column; gap: 4px; }
.discover-line {
  display: flex; gap: 16px;
  padding: 16px 8px;
  border-bottom: 1px dashed rgba(212,175,55,0.15);
  align-items: flex-start;
}
.discover-line:last-child { border-bottom: none; }
.dot-g {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle, #f1d98a, #6b4d12);
  box-shadow: 0 0 14px rgba(212,175,55,0.6);
  margin-top: 5px;
  flex-shrink: 0;
}
.discover-line strong {
  display: block;
  color: #f5e6c8;
  font-family: "Cinzel", serif;
  font-size: 0.9rem;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}
.discover-line p {
  margin: 0;
  color: #d8c8a5;
  line-height: 1.6;
  font-size: 0.88rem;
}

/* FOOTER do modal */
.xfoot {
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid rgba(212,175,55,0.18);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #c9b37a;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.xfoot-btn {
  padding: 10px 22px;
  border-radius: 10px;
  border: 1px solid rgba(212,175,55,0.4);
  background: linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.04));
  color: #f1d98a;
  font-family: "Cinzel", serif;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  cursor: pointer;
  transition: 0.25s;
}
.xfoot-btn:hover {
  background: linear-gradient(135deg, #d4af37, #a07c1c);
  color: #1a1208;
}

/* RESPONSIVO MODAL */
@media (max-width: 880px) {
  .xmodal-grid { grid-template-columns: 1fr; }
  .xmedia { border-right: none; border-bottom: 1px solid rgba(212,175,55,0.18); }
  .xmedia-frame { aspect-ratio: 16/10; }
  .data-list { grid-template-columns: 1fr; }
  .data-row { border-right: none; }
}

.fade-enter-active,
.fade-leave-active { transition: opacity .25s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

/* FAVORITO CARD */
.favorite-btn { position: absolute; top: 12px; right: 12px; z-index: 5; width: 42px; height: 42px; border-radius: 50%; border: 1px solid rgba(212,175,55,0.35); background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); color: #f1d98a; font-size: 1.2rem; cursor: pointer; transition: transform .2s, background .2s, border-color .2s; }
.favorite-btn:hover { transform: scale(1.08); background: linear-gradient(135deg, rgba(212,175,55,0.3), rgba(212,175,55,0.1)); border-color: rgba(212,175,55,0.7); }
.favorite-btn:active { transform: scale(.92); }
.favorite-btn.is-fav { background: linear-gradient(135deg, #d4af37, #8a6a1f); color: #1a1208; border-color: #f1d98a; box-shadow: 0 0 20px rgba(212,175,55,0.5); }

/* ========= FOOT (página) ========= */
.foot { margin-top: 80px; padding-top: 30px; border-top: 1px solid rgba(212,175,55,0.15); display: flex; justify-content: center; gap: 14px; align-items: center; color: #c9b37a; opacity: 0.7; font-size: 0.85rem; letter-spacing: 0.2em; text-transform: uppercase; }
.foot span { color: #d4af37; }


/* =========================
   CADEIA ALIMENTAR
========================= */

.food-chain {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 10px 0;
}

.food-level {
  background:
    linear-gradient(145deg, #1c140c, #120d08);

  border:
    1px solid #3f311d;

  border-radius: 14px;

  padding: 18px;

  position: relative;

  overflow: hidden;
}

.food-level::before {
  content: '';
  position: absolute;
  inset: 0;

  background:
    radial-gradient(
      circle at top right,
      rgba(212,175,55,0.08),
      transparent 60%
    );

  pointer-events: none;
}

.level-title {
  display: block;

  color: #d4af37;

  font-family: 'Cinzel', serif;

  font-size: 0.95rem;

  letter-spacing: 1px;

  margin-bottom: 10px;

  text-transform: uppercase;
}

.food-level h3 {
  margin: 0 0 8px;

  font-size: 1.5rem;

  color: #f5e6c8;

  font-family: 'Cinzel', serif;
}

.food-level p {
  margin: 0;

  color: #d6c7aa;

  line-height: 1.6;
}

.chain-arrow {
  text-align: center;

  color: #d4af37;

  font-size: 1.5rem;

  opacity: 0.8;
}

.producer {
  border-color: #3d5c2d;
}

.consumer {
  border-color: #7a6a2f;
}

.predator {
  border-color: #8b2d2d;
}

.decomposer {
  border-color: #5a4a39;
}

.food-chain-modern{
  display:flex;
  flex-direction:column;
  gap:28px;
}

.chain-section{
  display:flex;
  flex-direction:column;
  gap:16px;
}

.chain-title{
  font-size:1.1rem;
  font-weight:700;
  letter-spacing:.5px;
}

.chain-title.danger{
  color:#ff8c8c;
}

.chain-title.success{
  color:#8cffb1;
}

.chain-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:16px;
}

.chain-card{
  display:flex;
  align-items:center;
  gap:14px;

  padding:14px;
  border-radius:18px;

  background:rgba(255,255,255,.04);

  border:1px solid rgba(255,255,255,.08);

  transition:.25s;
}

.chain-card:hover{
  transform:translateY(-4px);
  border-color:rgba(255,255,255,.18);
}

.chain-card img{
  width:72px;
  height:72px;
  object-fit:cover;
  border-radius:14px;
}

.chain-info{
  display:flex;
  flex-direction:column;
  gap:4px;
}

.chain-info strong{
  font-size:1rem;
}

.chain-info span{
  opacity:.7;
  font-size:.9rem;
}

.chain-center{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;

  gap:12px;

  padding:22px;

  border-radius:24px;

  background:linear-gradient(
    135deg,
    rgba(255,255,255,.05),
    rgba(255,255,255,.02)
  );

  border:1px solid rgba(255,255,255,.08);
}

.center-circle{
  width:160px;
  height:160px;

  border-radius:50%;
  overflow:hidden;

  border:3px solid rgba(255,255,255,.12);
}

.center-circle img{
  width:100%;
  height:100%;
  object-fit:cover;
}

.chain-empty{
  opacity:.6;
  padding:12px 0;
  font-style:italic;
}

.clickable-chain{
  cursor:pointer;
}

.clickable-chain:hover{
  transform:translateY(-6px) scale(1.02);

  box-shadow:
    0 10px 30px rgba(0,0,0,.45),
    0 0 25px rgba(212,175,55,.15);

  border-color:rgba(212,175,55,.35);
}

/* =========================================================
   PAGINAÇÃO
========================================================= */

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  margin-top: 50px;
  margin-bottom: 20px;

  flex-wrap: wrap;
}

.page-btn {
  min-width: 46px;
  height: 46px;

  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,0.06),
      rgba(255,255,255,0.03)
    );

  color: #e8dcc2;

  font-size: 15px;
  font-weight: 700;

  cursor: pointer;

  transition:
    transform .2s ease,
    background .2s ease,
    border .2s ease,
    box-shadow .2s ease;

  backdrop-filter: blur(10px);

  box-shadow:
    0 4px 18px rgba(0,0,0,.25);
}

.page-btn:hover:not(:disabled) {
  transform: translateY(-2px);

  border-color:
    rgba(255, 210, 120, 0.4);

  background:
    linear-gradient(
      180deg,
      rgba(255,210,120,0.18),
      rgba(255,210,120,0.08)
    );

  box-shadow:
    0 0 18px rgba(255,210,120,.15);
}

.page-btn.active {
  background:
    linear-gradient(
      180deg,
      #d8b36a,
      #9b7332
    );

  color: #1d1408;

  border-color:
    rgba(255,220,160,.45);

  box-shadow:
    0 0 22px rgba(255,200,100,.35);
}

.page-btn:disabled {
  opacity: .35;
  cursor: not-allowed;
  transform: none;
}

/* MOBILE */

@media (max-width: 700px) {

  .pagination {
    gap: 8px;
  }

  .page-btn {
    min-width: 40px;
    height: 40px;

    font-size: 14px;
    border-radius: 12px;
  }

}

</style>