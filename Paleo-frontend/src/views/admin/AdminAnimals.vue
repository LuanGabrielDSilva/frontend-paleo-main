<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import api from "../../services/api";

/* =========================
   STATE
========================= */
const animals = ref<any[]>([]);
const eras = ref<any[]>([]);
const periodos = ref<any[]>([]);
const selected = ref<any | null>(null);
const selectedEra = ref<string>("");
const search = ref("");
const preyDropdownOpen = ref(false);
const searchPreyCreate = ref("");
const searchPredatorCreate = ref("");

const filteredAnimalsForCreatePrey = computed(() => {
  const term = searchPreyCreate.value.toLowerCase().trim();

  return animals.value.filter((a) => {
    if (!term) return true;

    return (
      (a.name || "").toLowerCase().includes(term) ||
      (a.scientificName || "").toLowerCase().includes(term)
    );
  });
});

const filteredAnimalsForCreatePredator = computed(() => {
  const term = searchPredatorCreate.value.toLowerCase().trim();

  return animals.value.filter((a) => {
    if (!term) return true;

    return (
      (a.name || "").toLowerCase().includes(term) ||
      (a.scientificName || "").toLowerCase().includes(term)
    );
  });
});

/* ===== WIZARD CRIAÇÃO ===== */
const createStep = ref(1);
const totalSteps = 5;
const stepLabels = [
  "Identificação",
  "Biologia",
  "Habitat & Descoberta",
  "Classificação",
  "Relações & Descrição",
];
function nextStep() {
  if (createStep.value < totalSteps) createStep.value++;
}
function prevStep() {
  if (createStep.value > 1) createStep.value--;
}
function goToStep(n: number) {
  createStep.value = n;
}

/* ===== WIZARD EDIÇÃO ===== */
const editStep = ref(1);
const editStepLabels = [
  "Identificação",
  "Biologia",
  "Habitat",
  "Classificação",
  "Relações",
];

/* BUSCA PARA RELAÇÕES NO EDITAR */
const searchPreyEdit = ref("");
const searchPredatorEdit = ref("");

const filteredAnimalsForPrey = computed(() => {
  if (!selected.value) return [];
  const term = searchPreyEdit.value.toLowerCase().trim();
  return animals.value
    .filter(a => a.id !== selected.value.id)
    .filter(a => {
      if (!term) return true;
      return (
        (a.name || "").toLowerCase().includes(term) ||
        (a.scientificName || "").toLowerCase().includes(term)
      );
    });
});

const filteredAnimalsForPredator = computed(() => {
  if (!selected.value) return [];
  const term = searchPredatorEdit.value.toLowerCase().trim();
  return animals.value
    .filter(a => a.id !== selected.value.id)
    .filter(a => {
      if (!term) return true;
      return (
        (a.name || "").toLowerCase().includes(term) ||
        (a.scientificName || "").toLowerCase().includes(term)
      );
    });
});

function editNext() {
  if (editStep.value < 5) editStep.value++;
}
function editPrev() {
  if (editStep.value > 1) editStep.value--;
}

/* CONFIRMAÇÃO DE EXCLUSÃO */
const deleteModal = ref({
  isOpen: false,
  animalId: null as string | null,
  animalName: "",
  isDeleting: false,
});

const ordemPaleozoico = [
  "Cambriano", "Ordoviciano", "Siluriano",
  "Devoniano", "Carbonífero", "Permiano",
];

const dietas = [
  "Carnívoro", "Herbívoro", "Onívoro", "Insetívoro", "Piscívoro",
  "Necrófago", "Detritívoro", "Filtrador", "Nectarívoro",
  "Hematófago", "Fungívoro", "Micrófago", "Autótrofa",
];

const newAnimal = ref({
  name: "",
  scientificName: "",
  size: "",
  weight: "",
  image: "",
  dieta: "",
  habitat: "",
  clima: "",
  locomotion: "",
  defense: "",
  descoberta: "",
  local: "",
  description: "",
  periodoId: "",
  preyIds: [],
  predatorIds: [],
});

/* =========================
   LOAD DATA
========================= */
async function load() {
  const [animalsRes, erasRes, periodosRes] = await Promise.all([
    api.get("/animals"),
    api.get("/eras"),
    api.get("/periodos"),
  ]);
  animals.value = animalsRes.data;
  eras.value = erasRes.data;
  periodos.value = periodosRes.data;
}

/* =========================
   GROUPING
========================= */
const groupedAnimals = computed(() => {
  const groups: Record<string, any[]> = {};
  animals.value.forEach(animal => {
    const periodoId = animal.periodoId || "sem-periodo";
    if (!groups[periodoId]) groups[periodoId] = [];
    groups[periodoId].push(animal);
  });
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  });
  const sortedGroups = periodos.value
    .map(p => ({ id: p.id, name: p.name, eraId: p.eraId, animals: groups[p.id] || [] }))
    .sort((a, b) => {
      const ia = ordemPaleozoico.indexOf(a.name);
      const ib = ordemPaleozoico.indexOf(b.name);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return 0;
    })
    .filter(g => g.animals.length > 0);
  if (groups["sem-periodo"]?.length) {
    sortedGroups.push({ id: "sem-periodo", name: "Sem Período", eraId: null, animals: groups["sem-periodo"] });
  }
  return sortedGroups;
});

function getPeriodosByEra(eraId: string) {
  return periodos.value
    .filter(p => p.eraId === eraId)
    .sort((a, b) => ordemPaleozoico.indexOf(a.name) - ordemPaleozoico.indexOf(b.name));
}

function getEraName(eraId: string | null) {
  if (!eraId) return "Sem Era";
  return eras.value.find(e => e.id === eraId)?.name || "Era";
}

/* =========================
   CREATE
========================= */
async function create() {
  try {
    await api.post("/animals", {
      ...newAnimal.value,
      periodoId: newAnimal.value.periodoId || null,
      eraId: selectedEra.value || null,
    });

    newAnimal.value = {
      name: "",
      scientificName: "",
      size: "",
      weight: "",
      image: "",
      dieta: "",
      habitat: "",
      clima: "",
      locomotion: "",
      defense: "",
      descoberta: "",
      local: "",
      description: "",
      periodoId: "",
      preyIds: [],
      predatorIds: [],
    };

    selectedEra.value = "";
    createStep.value = 1;
    await load();

    openAlert("success", "Catalogação concluída", "A criatura foi registrada com sucesso no acervo.");
  } catch (err) {
    console.error(err);
    openAlert("error", "Falha na catalogação", "Não foi possível criar o animal.");
  }
}

/* =========================
   DELETE
========================= */
function openDeleteModal(id: string, name: string) {
  deleteModal.value = { isOpen: true, animalId: id, animalName: name, isDeleting: false };
}
function closeDeleteModal() {
  deleteModal.value.isOpen = false;
  setTimeout(() => {
    deleteModal.value.animalId = null;
    deleteModal.value.animalName = "";
    deleteModal.value.isDeleting = false;
  }, 300);
}
async function confirmDelete() {
  if (!deleteModal.value.animalId) return;
  deleteModal.value.isDeleting = true;
  try {
    await api.delete(`/animals/${deleteModal.value.animalId}`);
    animals.value = animals.value.filter(a => a.id !== deleteModal.value.animalId);
    closeDeleteModal();
  } catch (err) {
    console.error("Erro ao excluir:", err);
    deleteModal.value.isDeleting = false;
  }
}

/* =========================
   EDIT
========================= */
function openEdit(animal: any) {
  selected.value = {
    ...animal,
    preyIds: animal.preys ? animal.preys.map((p: any) => p.prey.id) : [],
    predatorIds: animal.predators ? animal.predators.map((p: any) => p.predator.id) : [],
  };
  editStep.value = 1;
  
  // Resetar buscas ao abrir o modal
  searchPreyEdit.value = "";
  searchPredatorEdit.value = "";
}

async function saveEdit() {
  if (!selected.value) return;
  await api.put(`/animals/${selected.value.id}`, {
    ...selected.value,
    preyIds: selected.value.preyIds || [],
    predatorIds: selected.value.predatorIds || [],
  });
  selected.value = null;
  await load();
}

/* =========================
   UI STATE
========================= */
const openPeriods = ref<string[]>([]);
function togglePeriod(id: string) {
  if (openPeriods.value.includes(id)) {
    openPeriods.value = openPeriods.value.filter(p => p !== id);
  } else {
    openPeriods.value.push(id);
  }
}

const openEras = ref<string[]>([]);
function toggleEra(id: string) {
  if (openEras.value.includes(id)) {
    openEras.value = openEras.value.filter(e => e !== id);
  } else {
    openEras.value.push(id);
  }
}

/* =========================
   GROUP BY ERA
========================= */
const groupedByEra = computed(() => {
  const erasMap: Record<string, any> = {};
  groupedAnimals.value.forEach(period => {
    const eraId = period.eraId || "sem-era";
    if (!erasMap[eraId]) {
      erasMap[eraId] = { eraId, eraName: getEraName(eraId), periods: [] };
    }
    erasMap[eraId].periods.push(period);
  });
  return Object.values(erasMap);
});

/* =========================
   ALERT MODAL
========================= */
const alertModal = ref({
  isOpen: false,
  type: "success" as "success" | "error" | "warning" | "info",
  title: "",
  message: "",
  pulse: true,
});

function openAlert(type: "success" | "error" | "warning" | "info", title: string, message: string) {
  alertModal.value = { isOpen: true, type, title, message, pulse: true };
  setTimeout(() => { alertModal.value.pulse = false; }, 1200);
}
function closeAlert() { alertModal.value.isOpen = false; }

onMounted(load);
</script>

<template>
  <div class="page">
    <!-- HEADER -->
    <header class="page-header">
      <div class="header-emblem">🦖</div>
      <div class="header-text">
        <span class="header-eyebrow">Painel Administrativo</span>
        <h1>Acervo de Criaturas</h1>
        <p>Catalogue espécies pré-históricas e organize-as por período</p>
      </div>
      <div class="header-stats">
        <div class="stat">
          <strong>{{ animals.length }}</strong>
          <span>espécies</span>
        </div>
        <div class="stat">
          <strong>{{ groupedAnimals.length }}</strong>
          <span>períodos</span>
        </div>
      </div>
    </header>

    <!-- FORMULÁRIO DE CRIAÇÃO — WIZARD -->
    <section class="form-card">
      <div class="form-header">
        <div class="form-icon">🦖</div>
        <div>
          <h2>Catalogar Nova Criatura</h2>
          <p class="form-subtitle">Etapa {{ createStep }} de {{ totalSteps }} — {{ stepLabels[createStep - 1] }}</p>
        </div>
      </div>

      <!-- PROGRESS / STEPPER -->
      <div class="stepper">
        <div
          v-for="(label, i) in stepLabels"
          :key="i"
          class="step"
          :class="{
            active: createStep === i + 1,
            done: createStep > i + 1,
          }"
          @click="goToStep(i + 1)"
        >
          <div class="step-dot">
            <span v-if="createStep > i + 1">✓</span>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <div class="step-label">{{ label }}</div>
        </div>
        <div class="stepper-bar">
          <div class="stepper-fill" :style="{ width: ((createStep - 1) / (totalSteps - 1)) * 100 + '%' }"></div>
        </div>
      </div>

      <Transition name="step-fade" mode="out-in">
        <div class="form-grid" :key="createStep">
          <!-- ETAPA 1: IDENTIFICAÇÃO -->
          <template v-if="createStep === 1">
            <div class="field full">
              <label>Nome da Espécie</label>
              <input v-model="newAnimal.name" placeholder="Ex: Tyrannosaurus Rex" />
            </div>
            <div class="field full">
              <label>Nome Científico</label>
              <input v-model="newAnimal.scientificName" placeholder="Ex: Tyrannosaurus rex" />
            </div>
            <div class="field full">
              <label>URL da Imagem</label>
              <input v-model="newAnimal.image" placeholder="https://..." />
            </div>
          </template>

          <!-- ETAPA 2: BIOLOGIA -->
          <template v-else-if="createStep === 2">
            <div class="field">
              <label>Tamanho</label>
              <input v-model="newAnimal.size" placeholder="Ex: 12m de comprimento" />
            </div>
            <div class="field">
              <label>Peso</label>
              <input v-model="newAnimal.weight" placeholder="Ex: 8 toneladas" />
            </div>
            <div class="field">
              <label>Dieta</label>
              <select v-model="newAnimal.dieta">
                <option disabled value="">Selecione a dieta</option>
                <option v-for="d in dietas" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div class="field">
              <label>Locomoção</label>
              <input v-model="newAnimal.locomotion" placeholder="Ex: Bípede" />
            </div>
            <div class="field full">
              <label>Defesa</label>
              <input v-model="newAnimal.defense" placeholder="Ex: Espinhos ósseos" />
            </div>
          </template>

          <!-- ETAPA 3: HABITAT & DESCOBERTA -->
          <template v-else-if="createStep === 3">
            <div class="field">
              <label>Habitat</label>
              <input v-model="newAnimal.habitat" placeholder="Ex: Florestas tropicais" />
            </div>
            <div class="field">
              <label>Clima</label>
              <input v-model="newAnimal.clima" placeholder="Ex: Quente e úmido" />
            </div>
            <div class="field">
              <label>Descoberta</label>
              <input v-model="newAnimal.descoberta" placeholder="Ex: 1902" />
            </div>
            <div class="field">
              <label>Local da Descoberta</label>
              <input v-model="newAnimal.local" placeholder="Ex: Argentina" />
            </div>
          </template>

          <!-- ETAPA 4: CLASSIFICAÇÃO -->
          <template v-else-if="createStep === 4">
            <div class="field">
              <label>Era Geológica</label>
              <select v-model="selectedEra">
                <option disabled value="">Selecione uma era</option>
                <option v-for="e in eras" :key="e.id" :value="e.id">{{ e.name }}</option>
              </select>
            </div>
            <div class="field">
              <label>
                Período
                <span v-if="!selectedEra" class="hint">— selecione uma era</span>
              </label>
              <select v-model="newAnimal.periodoId" :disabled="!selectedEra">
                <option disabled value="">Selecione um período</option>
                <option v-for="p in getPeriodosByEra(selectedEra)" :key="p.id" :value="p.id">
                  {{ p.name }}
                </option>
              </select>
            </div>
          </template>

          <!-- ETAPA 5: RELAÇÕES & DESCRIÇÃO -->
          <template v-else-if="createStep === 5">
  <div class="field full">
    <div class="relations-header">
      <h4>
        Presas
        <span class="count">
          ({{ newAnimal.preyIds.length }})
        </span>
      </h4>

      <h4>
        Predadores
        <span class="count">
          ({{ newAnimal.predatorIds.length }})
        </span>
      </h4>
    </div>

    <div class="relations-container">
      <!-- PRESAS -->
      <div class="relation-column">
        <input
          v-model="searchPreyCreate"
          placeholder="Buscar presas..."
          class="search-input"
        />

        <div class="relation-list">
          <label
            v-for="animal in filteredAnimalsForCreatePrey"
            :key="animal.id"
            class="relation-item"
          >
            <input
              type="checkbox"
              :value="animal.id"
              v-model="newAnimal.preyIds"
            />

            <span class="relation-name">
              {{ animal.name }}
              <small v-if="animal.scientificName">
                ({{ animal.scientificName }})
              </small>
            </span>
          </label>
        </div>
      </div>

      <!-- PREDADORES -->
      <div class="relation-column">
        <input
          v-model="searchPredatorCreate"
          placeholder="Buscar predadores..."
          class="search-input"
        />

        <div class="relation-list">
          <label
            v-for="animal in filteredAnimalsForCreatePredator"
            :key="animal.id"
            class="relation-item"
          >
            <input
              type="checkbox"
              :value="animal.id"
              v-model="newAnimal.predatorIds"
            />

            <span class="relation-name">
              {{ animal.name }}
              <small v-if="animal.scientificName">
                ({{ animal.scientificName }})
              </small>
            </span>
          </label>
        </div>
      </div>
    </div>
  </div>

  <div class="field full">
    <label>Descrição Paleontológica</label>

    <textarea
      v-model="newAnimal.description"
      rows="6"
      placeholder="Descreva a criatura..."
    ></textarea>
  </div>
</template>
        </div>
      </Transition>

      <!-- NAVIGATION -->
      <div class="wizard-nav">
        <button class="btn-ghost" @click="prevStep" :disabled="createStep === 1">← Voltar</button>
        <span class="wizard-counter">{{ createStep }} / {{ totalSteps }}</span>
        <button v-if="createStep < totalSteps" class="btn-next" @click="nextStep">Próximo →</button>
        <button v-else class="btn-create" @click="create">✦ Catalogar Criatura</button>
      </div>
    </section>

    <!-- LISTAGEM POR ERA -->
    <section v-for="era in groupedByEra" :key="era.eraId" class="period-section">
      <div class="period-header" @click="toggleEra(era.eraId)" style="cursor:pointer;">
        <div class="period-marker"></div>
        <div class="period-titles">
          <span class="period-eyebrow">ERA</span>
          <h2>{{ era.eraName }}</h2>
        </div>
        <div class="period-count">
          {{ era.periods.length }} período{{ era.periods.length > 1 ? 's' : '' }}
        </div>
      </div>

      <Transition name="slide-fade">
        <div v-show="openEras.includes(era.eraId)">
          <div v-for="group in era.periods" :key="group.id" class="group-block">
            <div class="group-header" @click="togglePeriod(group.id)" style="cursor:pointer;">
              <div class="group-titles">
                <span class="group-era">{{ era.eraName }}</span>
                <h3>{{ group.name }}</h3>
              </div>
              <div class="group-count">
                {{ group.animals.length }} espécie{{ group.animals.length > 1 ? 's' : '' }}
              </div>
            </div>

            <Transition name="slide-fade">
              <div v-show="openPeriods.includes(group.id)" class="group-grid">
                <div v-for="a in group.animals" :key="a.id" class="card">
                  <div class="card-media">
                    <div v-if="a.image" class="image-wrap">
                      <img :src="a.image" :alt="a.name" />
                    </div>
                    <div v-else class="placeholder">🦕</div>
                    <div class="card-shadow"></div>
                    <div class="card-badge">{{ group.name }}</div>
                  </div>
                  <div class="card-body">
                    <h3>{{ a.name }}</h3>
                    <div class="card-meta">
                      <span class="meta-pill">📏 {{ a.size || "—" }}</span>
                      <span class="meta-pill diet">🍖 {{ a.dieta || "—" }}</span>
                    </div>
                    <div class="extra-info">
                      <p>🌍 {{ a.habitat || "Habitat desconhecido" }}</p>
                      <p>☁️ {{ a.clima || "Clima desconhecido" }}</p>
                      <p>📍 {{ a.local || "Local desconhecido" }}</p>
                      <p>⛏️ {{ a.descoberta || "Descoberta desconhecida" }}</p>
                    </div>
                  </div>
                  <div class="card-footer">
                    <button class="btn edit" @click="openEdit(a)">✏️ Editar</button>
                    <button class="btn danger" @click="openDeleteModal(a.id, a.name)">🗑️ Excluir</button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </section>

    <div v-if="animals.length === 0" class="empty-state">
      <span>🦴</span>
      <p>Nenhum animal catalogado ainda</p>
    </div>

    <!-- MODAL DE EDIÇÃO — COMPACTO COM WIZARD -->
    <div v-if="selected" class="modal-overlay" @click.self="selected = null">
      <div class="modal-compact">
        <!-- TOPO -->
        <div class="compact-bar">
          <div class="catalog-tag">
            <span class="catalog-dot"></span>
            ESPÉCIME Nº {{ selected.id?.slice(0, 6).toUpperCase() || '------' }}
          </div>
          <button class="close-x" @click="selected = null">✕</button>
        </div>

        <!-- HEADER COM PREVIEW + STEPPER -->
        <div class="compact-header">
          <div class="compact-thumb">
            <img v-if="selected.image" :src="selected.image" />
            <span v-else>🦕</span>
          </div>
          <div class="compact-titles">
            <span class="caption-label">Editando</span>
            <strong>{{ selected.name || 'Sem nome' }}</strong>
          </div>
        </div>

        <div class="stepper compact">
          <div
            v-for="(label, i) in editStepLabels"
            :key="i"
            class="step"
            :class="{ active: editStep === i + 1, done: editStep > i + 1 }"
            @click="editStep = i + 1"
          >
            <div class="step-dot">
              <span v-if="editStep > i + 1">✓</span>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <div class="step-label">{{ label }}</div>
          </div>
          <div class="stepper-bar">
            <div class="stepper-fill" :style="{ width: ((editStep - 1) / 4) * 100 + '%' }"></div>
          </div>
        </div>

        <!-- CORPO -->
        <div class="compact-body">
          <Transition name="step-fade" mode="out-in">
            <div class="compact-grid" :key="editStep">
              <!-- 1: IDENTIFICAÇÃO -->
              <template v-if="editStep === 1">
                <div class="museum-field full">
                  <label>Nome</label>
                  <input v-model="selected.name" />
                </div>
                <div class="museum-field full">
                  <label>Nome Científico</label>
                  <input v-model="selected.scientificName" />
                </div>
                <div class="museum-field full">
                  <label>URL da Imagem</label>
                  <input v-model="selected.image" />
                </div>
              </template>

              <!-- 2: BIOLOGIA -->
              <template v-else-if="editStep === 2">
                <div class="museum-field">
                  <label>Tamanho</label>
                  <input v-model="selected.size" />
                </div>
                <div class="museum-field">
                  <label>Peso</label>
                  <input v-model="selected.weight" />
                </div>
                <div class="museum-field">
                  <label>Dieta</label>
                  <select v-model="selected.dieta">
                    <option v-for="d in dietas" :key="d" :value="d">{{ d }}</option>
                  </select>
                </div>
                <div class="museum-field">
                  <label>Locomoção</label>
                  <input v-model="selected.locomotion" />
                </div>
                <div class="museum-field full">
                  <label>Defesa</label>
                  <input v-model="selected.defense" />
                </div>
              </template>

              <!-- 3: HABITAT -->
              <template v-else-if="editStep === 3">
                <div class="museum-field">
                  <label>Habitat</label>
                  <input v-model="selected.habitat" />
                </div>
                <div class="museum-field">
                  <label>Clima</label>
                  <input v-model="selected.clima" />
                </div>
                <div class="museum-field">
                  <label>Descoberta</label>
                  <input v-model="selected.descoberta" />
                </div>
                <div class="museum-field">
                  <label>Local</label>
                  <input v-model="selected.local" />
                </div>
              </template>

              <!-- 4: CLASSIFICAÇÃO + DESCRIÇÃO -->
              <template v-else-if="editStep === 4">
                <div class="museum-field full">
                  <label>Período</label>
                  <select v-model="selected.periodoId">
                    <option v-for="p in periodos" :key="p.id" :value="p.id">{{ p.name }}</option>
                  </select>
                </div>
                <div class="museum-field full">
                  <label>Descrição</label>
                  <textarea v-model="selected.description" rows="5" placeholder="Descrição paleontológica..."></textarea>
                </div>
              </template>

              <!-- 5: RELAÇÕES -->
              <template v-else-if="editStep === 5">
  <div class="museum-field full">
    <div class="relations-header">
      <h4>Presas <span class="count">({{ selected.preyIds?.length || 0 }})</span></h4>
      <h4>Predadores <span class="count">({{ selected.predatorIds?.length || 0 }})</span></h4>
    </div>

    <div class="relations-container">
      <!-- Coluna Presas -->
      <div class="relation-column">
        <input
          v-model="searchPreyEdit"
          placeholder="Buscar presas..."
          class="search-input"
        />
        <div class="relation-list">
          <label
            v-for="animal in filteredAnimalsForPrey"
            :key="animal.id"
            class="relation-item"
          >
            <input
              type="checkbox"
              :value="animal.id"
              v-model="selected.preyIds"
            />
            <span class="relation-name">
              {{ animal.name }}
              <small v-if="animal.scientificName">({{ animal.scientificName }})</small>
            </span>
          </label>
        </div>
      </div>

      <!-- Coluna Predadores -->
      <div class="relation-column">
        <input
          v-model="searchPredatorEdit"
          placeholder="Buscar predadores..."
          class="search-input"
        />
        <div class="relation-list">
          <label
            v-for="animal in filteredAnimalsForPredator"
            :key="animal.id"
            class="relation-item"
          >
            <input
              type="checkbox"
              :value="animal.id"
              v-model="selected.predatorIds"
            />
            <span class="relation-name">
              {{ animal.name }}
              <small v-if="animal.scientificName">({{ animal.scientificName }})</small>
            </span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

            </div>
          </Transition>
        </div>

        <!-- AÇÕES -->
        <div class="compact-actions">
          <button class="btn-ghost" @click="editPrev" :disabled="editStep === 1">← Voltar</button>
          <span class="wizard-counter">{{ editStep }} / 5</span>
          <button v-if="editStep < 5" class="btn-next" @click="editNext">Próximo →</button>
          <button v-else class="btn-gold" @click="saveEdit">
            <span>Salvar</span><span class="arrow">→</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DE EXCLUSÃO -->
    <Transition name="fade-scale">
      <div v-if="deleteModal.isOpen" class="confirm-overlay" @click.self="closeDeleteModal">
        <div class="confirm-modal">
          <div class="confirm-header">
            <div class="confirm-icon">⚠️</div>
            <h3>Confirmar Extinção</h3>
          </div>
          <div class="confirm-body">
            <p class="confirm-message">Você está prestes a remover permanentemente do acervo:</p>
            <div class="confirm-target">
              <span class="target-icon">🦕</span>
              <strong>{{ deleteModal.animalName }}</strong>
            </div>
            <p class="confirm-warning">Esta ação não pode ser desfeita.</p>
          </div>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="closeDeleteModal" :disabled="deleteModal.isDeleting">Cancelar</button>
            <button class="btn-delete" @click="confirmDelete" :disabled="deleteModal.isDeleting">
              <span v-if="deleteModal.isDeleting" class="spinner"></span>
              <span v-else>🗑️ Remover Espécime</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ALERT MODAL -->
    <Transition name="alert-pop">
      <div v-if="alertModal.isOpen" class="alert-overlay" @click.self="closeAlert">
        <div class="alert-card" :class="alertModal.type">
          <div class="alert-glow"></div>
          <div class="alert-header">
            <div class="alert-icon" :class="{ pulse: alertModal.pulse }">
              <span v-if="alertModal.type === 'success'">✔</span>
              <span v-else-if="alertModal.type === 'error'">✖</span>
              <span v-else-if="alertModal.type === 'warning'">⚠</span>
              <span v-else>ℹ</span>
            </div>
            <div class="alert-title">
              <h3>{{ alertModal.title }}</h3>
              <small>{{ alertModal.type.toUpperCase() }}</small>
            </div>
          </div>
          <div class="alert-body"><p>{{ alertModal.message }}</p></div>
          <div class="alert-footer"><button @click="closeAlert">Entendido</button></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;1,400&display=swap');

.page {
  padding: 40px 30px 60px;
  min-height: 100vh;
  color: #f5e6c8;
  background:
    radial-gradient(ellipse at top, rgba(212,175,55,0.06), transparent 60%),
    linear-gradient(180deg, #0b0a08, #14110c);
  font-family: 'Crimson Text', serif;
}

/* ===== HEADER ===== */
.page-header {
  max-width: 1100px;
  margin: 0 auto 35px;
  padding: 26px 30px;
  display: flex; align-items: center; gap: 22px;
  border-radius: 18px;
  background: linear-gradient(120deg, rgba(212,175,55,0.08), rgba(0,0,0,0.4));
  border: 1px solid rgba(212,175,55,0.18);
  position: relative; overflow: hidden;
}
.page-header::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
}
.header-emblem {
  width: 64px; height: 64px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem;
  background: rgba(212,175,55,0.15);
  border: 1px solid rgba(212,175,55,0.35);
  box-shadow: inset 0 0 20px rgba(212,175,55,0.1);
}
.header-text { flex: 1; }
.header-eyebrow {
  font-family: 'Cinzel', serif; font-size: 0.65rem;
  letter-spacing: 3px; text-transform: uppercase; color: #d4af37;
}
.header-text h1 {
  margin: 4px 0; font-family: 'Cinzel', serif;
  font-size: 1.7rem; letter-spacing: 2px; color: #f5e6c8;
}
.header-text p { margin: 0; font-style: italic; color: rgba(245,230,200,0.55); font-size: 0.9rem; }
.header-stats { display: flex; gap: 12px; }
.stat {
  text-align: center; padding: 10px 18px; border-radius: 12px;
  background: rgba(0,0,0,0.4); border: 1px solid rgba(212,175,55,0.18); min-width: 70px;
}
.stat strong { display: block; font-family: 'Cinzel', serif; font-size: 1.4rem; color: #d4af37; }
.stat span { font-size: 0.65rem; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(245,230,200,0.5); }

/* ===== FORM CARD ===== */
.form-card {
  max-width: 900px; margin: 0 auto 50px; padding: 30px;
  border-radius: 18px;
  background: linear-gradient(160deg, #1a150e, #0b0a08);
  border: 1px solid rgba(212,175,55,0.2);
  box-shadow: 0 20px 60px rgba(0,0,0,0.6), inset 0 0 40px rgba(212,175,55,0.05);
  position: relative; overflow: hidden;
}
.form-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
}
.form-header {
  display: flex; align-items: center; gap: 16px;
  margin-bottom: 20px; padding-bottom: 18px;
  border-bottom: 1px solid rgba(212,175,55,0.15);
}
.form-icon {
  width: 50px; height: 50px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
  background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.3);
}
.form-header h2 { margin: 0; font-family: 'Cinzel', serif; font-size: 1.25rem; letter-spacing: 1.5px; color: #f5e6c8; }
.form-subtitle { margin: 2px 0 0; font-style: italic; font-size: 0.85rem; color: rgba(245,230,200,0.5); }

/* ===== STEPPER ===== */
.stepper {
  position: relative;
  display: flex; justify-content: space-between;
  margin: 10px 4px 30px;
  padding-bottom: 4px;
}
.stepper-bar {
  position: absolute; left: 14px; right: 14px; top: 14px;
  height: 2px; background: rgba(212,175,55,0.15);
  z-index: 0; border-radius: 2px; overflow: hidden;
}
.stepper-fill {
  height: 100%; background: linear-gradient(90deg, #b8972e, #d4af37);
  transition: width 0.4s ease; box-shadow: 0 0 10px rgba(212,175,55,0.5);
}
.step {
  position: relative; z-index: 1; flex: 1;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  cursor: pointer; user-select: none;
}
.step-dot {
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #0b0a08; border: 2px solid rgba(212,175,55,0.25);
  color: rgba(245,230,200,0.5); font-family: 'Cinzel', serif;
  font-size: 0.8rem; transition: all 0.25s ease;
}
.step.active .step-dot {
  background: linear-gradient(135deg, #d4af37, #b8972e);
  color: #1a140f; border-color: #d4af37;
  box-shadow: 0 0 0 4px rgba(212,175,55,0.15), 0 0 18px rgba(212,175,55,0.4);
}
.step.done .step-dot {
  background: rgba(212,175,55,0.2); border-color: #d4af37; color: #d4af37;
}
.step-label {
  font-family: 'Cinzel', serif; font-size: 0.6rem;
  letter-spacing: 1.5px; text-transform: uppercase;
  color: rgba(245,230,200,0.4); text-align: center;
  transition: color 0.2s ease;
}
.step.active .step-label { color: #d4af37; }
.step.done .step-label { color: rgba(245,230,200,0.7); }

.stepper.compact { margin: 6px 2px 16px; }
.stepper.compact .step-dot { width: 26px; height: 26px; font-size: 0.7rem; }
.stepper.compact .stepper-bar { top: 12px; }
.stepper.compact .step-label { font-size: 0.55rem; letter-spacing: 1px; }

/* ===== FORM GRID ===== */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; min-height: 280px; }
.field, .museum-field { display: flex; flex-direction: column; gap: 6px; }
.field.full, .museum-field.full { grid-column: 1 / -1; }
.field label, .museum-field label {
  font-family: 'Cinzel', serif; font-size: 0.65rem;
  letter-spacing: 2px; text-transform: uppercase; color: rgba(245,230,200,0.6);
}
.hint {
  font-family: 'Crimson Text', serif; font-style: italic;
  text-transform: none; letter-spacing: 0;
  font-size: 0.75rem; color: rgba(245,230,200,0.4); margin-left: 6px;
}
.field input, .field select, .field textarea,
.museum-field input, .museum-field select, .museum-field textarea {
  padding: 11px 14px; border-radius: 10px;
  border: 1px solid rgba(212,175,55,0.2);
  background: rgba(0,0,0,0.5); color: #f5e6c8;
  font-family: 'Crimson Text', serif; font-size: 0.95rem;
  transition: all 0.25s ease; width: 100%; box-sizing: border-box;
}
.field input:hover, .field select:hover,
.museum-field input:hover, .museum-field select:hover { border-color: rgba(212,175,55,0.5); }
.field input:focus, .field select:focus, .field textarea:focus,
.museum-field input:focus, .museum-field select:focus, .museum-field textarea:focus {
  outline: none; border-color: #d4af37; box-shadow: 0 0 0 3px rgba(212,175,55,0.2);
}
.field select:disabled, .museum-field select:disabled { opacity: 0.5; cursor: not-allowed; }
.field select option, .museum-field select option { background: #1a140f; }

/* ===== MULTI SELECT ===== */
.multi-select { position: relative; }
.multi-select-trigger {
  width: 100%; padding: 11px 14px; border-radius: 10px;
  background: rgba(0,0,0,0.5); border: 1px solid rgba(212,175,55,0.2);
  color: #f5e6c8; font-family: 'Crimson Text', serif;
  text-align: left; cursor: pointer; transition: all 0.2s ease;
}
.multi-select-trigger:hover { border-color: rgba(212,175,55,0.5); }
.multi-select-dropdown {
  margin-top: 6px; max-height: 200px; overflow-y: auto;
  border: 1px solid rgba(212,175,55,0.25); border-radius: 10px;
  background: rgba(0,0,0,0.6); padding: 8px;
}
/* ==========================
   PRESAS E PREDADORES
========================== */

.multi-select-dropdown-static {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  max-height: 220px;
  overflow-y: auto;

  padding: 14px;

  border-radius: 12px;
  border: 1px solid rgba(212,175,55,0.18);

  background:
    linear-gradient(
      180deg,
      rgba(212,175,55,0.04),
      rgba(0,0,0,0.35)
    );
}

.multi-select-dropdown-static.slim {
  max-height: 220px;
}

.checkbox-item {
  position: relative;

  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 10px 14px;

  border-radius: 999px;

  background: rgba(0,0,0,0.45);

  border: 1px solid rgba(212,175,55,0.18);

  color: rgba(245,230,200,0.85);

  cursor: pointer;

  transition: all .25s ease;

  font-size: .9rem;

  user-select: none;
}

.checkbox-item:hover {
  border-color: rgba(212,175,55,0.5);

  background: rgba(212,175,55,0.08);

  transform: translateY(-2px);
}

.checkbox-item input {
  width: 16px;
  height: 16px;

  accent-color: #d4af37;

  cursor: pointer;
}

.checkbox-item:has(input:checked) {
  background:
    linear-gradient(
      135deg,
      rgba(212,175,55,0.22),
      rgba(184,151,46,0.18)
    );

  border-color: #d4af37;

  box-shadow:
    0 0 0 1px rgba(212,175,55,0.25),
    0 0 15px rgba(212,175,55,0.18);
}

.checkbox-item:has(input:checked)::after {
  content: "✓";

  color: #d4af37;

  font-weight: bold;

  margin-left: 4px;
}

/* Scroll bonito */

.multi-select-dropdown-static::-webkit-scrollbar {
  width: 8px;
}

.multi-select-dropdown-static::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.25);
}

.multi-select-dropdown-static::-webkit-scrollbar-thumb {
  background: rgba(212,175,55,0.25);
  border-radius: 999px;
}

.multi-select-dropdown-static::-webkit-scrollbar-thumb:hover {
  background: rgba(212,175,55,0.45);
}

.multi-select-dropdown-static.slim { max-height: 130px; }
.checkbox-item {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 8px; border-radius: 6px; cursor: pointer;
  font-family: 'Crimson Text', serif; color: rgba(245,230,200,0.85);
  transition: background 0.15s ease;
}
.checkbox-item:hover { background: rgba(212,175,55,0.08); }
.checkbox-item input { accent-color: #d4af37; }

/* ===== WIZARD NAV ===== */
.wizard-nav {
  display: flex; align-items: center; gap: 12px;
  margin-top: 24px; padding-top: 20px;
  border-top: 1px solid rgba(212,175,55,0.12);
}
.wizard-counter {
  flex: 1; text-align: center;
  font-family: 'Cinzel', serif; font-size: 0.75rem;
  letter-spacing: 2px; color: rgba(212,175,55,0.7);
}
.btn-ghost, .btn-next, .btn-create, .btn-gold {
  padding: 11px 22px; border-radius: 10px;
  font-family: 'Cinzel', serif; font-size: 0.8rem;
  letter-spacing: 1.5px; text-transform: uppercase;
  cursor: pointer; transition: all 0.25s ease; border: 1px solid transparent;
}
.btn-ghost {
  background: transparent; color: rgba(245,230,200,0.7);
  border-color: rgba(212,175,55,0.25);
}
.btn-ghost:hover:not(:disabled) { background: rgba(212,175,55,0.08); color: #f5e6c8; }
.btn-ghost:disabled { opacity: 0.35; cursor: not-allowed; }
.btn-next {
  background: rgba(212,175,55,0.15); color: #d4af37;
  border-color: rgba(212,175,55,0.4);
}
.btn-next:hover { background: rgba(212,175,55,0.28); }
.btn-create, .btn-gold {
  background: linear-gradient(135deg, #d4af37, #b8972e);
  color: #1a140f; border: none;
  box-shadow: 0 6px 20px rgba(212,175,55,0.3);
  display: inline-flex; align-items: center; gap: 8px;
}
.btn-create:hover, .btn-gold:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(212,175,55,0.5); }
.btn-create:active, .btn-gold:active { transform: scale(0.97); }
.btn-gold .arrow { transition: transform 0.2s ease; }
.btn-gold:hover .arrow { transform: translateX(4px); }

/* ===== TRANSITION ENTRE ETAPAS ===== */
.step-fade-enter-active, .step-fade-leave-active { transition: all 0.25s ease; }
.step-fade-enter-from { opacity: 0; transform: translateX(12px); }
.step-fade-leave-to { opacity: 0; transform: translateX(-12px); }

/* ===== PERIODOS / GRID / CARD ===== */
.period-section { max-width: 1100px; margin: 0 auto 50px; }
.period-header {
  display: flex; align-items: center; gap: 16px;
  padding: 14px 20px; margin-bottom: 18px; border-radius: 14px;
  background: linear-gradient(90deg, rgba(212,175,55,0.1), transparent);
  border-left: 3px solid #d4af37;
}
.period-marker { width: 12px; height: 12px; border-radius: 50%; background: #d4af37; box-shadow: 0 0 12px #d4af37; }
.period-titles { flex: 1; }
.period-eyebrow { font-family: 'Cinzel', serif; font-size: 0.6rem; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(212,175,55,0.7); }
.period-titles h2 { margin: 2px 0 0; font-family: 'Cinzel', serif; font-size: 1.3rem; letter-spacing: 1.5px; color: #f5e6c8; }
.period-count {
  padding: 6px 12px; border-radius: 20px;
  background: rgba(212,175,55,0.15); border: 1px solid rgba(212,175,55,0.3);
  font-family: 'Cinzel', serif; font-size: 0.7rem; letter-spacing: 1.5px; color: #d4af37;
}

.group-block { margin-bottom: 20px; }
.group-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; margin-bottom: 14px; border-radius: 12px;
  background: rgba(0,0,0,0.4); border: 1px solid rgba(212,175,55,0.12);
  transition: all 0.2s ease;
}
.group-header:hover { background: rgba(212,175,55,0.08); border-color: rgba(212,175,55,0.25); }
.group-titles { flex: 1; }
.group-era { font-family: 'Cinzel', serif; font-size: 0.55rem; letter-spacing: 2px; text-transform: uppercase; color: rgba(212,175,55,0.6); }
.group-titles h3 { margin: 4px 0 0; font-family: 'Cinzel', serif; font-size: 1.1rem; letter-spacing: 1px; color: #f5e6c8; }
.group-count {
  padding: 5px 12px; border-radius: 20px;
  background: rgba(212,175,55,0.1);
  font-family: 'Cinzel', serif; font-size: 0.65rem; letter-spacing: 1.5px; color: #d4af37;
}

.group-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px; padding: 0 8px;
}
.card {
  display: flex; flex-direction: column; border-radius: 16px;
  background: linear-gradient(170deg, #1a150e, #0b0a08);
  border: 1px solid rgba(212,175,55,0.15);
  overflow: hidden; transition: all 0.3s ease;
  box-shadow: 0 6px 18px rgba(0,0,0,0.4);
}
.card:hover {
  transform: translateY(-6px); border-color: rgba(212,175,55,0.4);
  box-shadow: 0 18px 40px rgba(0,0,0,0.6), 0 0 30px rgba(212,175,55,0.15);
}
.card-media { position: relative; height: 170px; overflow: hidden; }
.image-wrap { width: 100%; height: 100%; transition: transform 0.5s ease; }
.card:hover .image-wrap { transform: scale(1.08); }
.card-media img { width: 100%; height: 100%; object-fit: cover; }
.placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 3rem;
  background: radial-gradient(circle, rgba(212,175,55,0.12), transparent);
}
.card-badge {
  position: absolute; top: 12px; left: 12px;
  padding: 4px 10px; border-radius: 6px;
  background: rgba(0,0,0,0.7); border: 1px solid rgba(212,175,55,0.4);
  color: #d4af37; font-family: 'Cinzel', serif;
  font-size: 0.6rem; letter-spacing: 1.5px; text-transform: uppercase;
  backdrop-filter: blur(6px);
}
.card-shadow { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 50%, rgba(11,10,8,0.9) 100%); pointer-events: none; }
.card-body { padding: 16px 18px 12px; flex: 1; }
.card-body h3 { margin: 0 0 10px; font-family: 'Cinzel', serif; font-size: 1.1rem; letter-spacing: 1px; color: #f5e6c8; }
.card-meta { display: flex; flex-wrap: wrap; gap: 6px; }
.meta-pill {
  padding: 4px 9px; border-radius: 8px; font-size: 0.72rem; letter-spacing: 0.5px;
  border: 1px solid rgba(212,175,55,0.2); background: rgba(0,0,0,0.4); color: rgba(245,230,200,0.75);
}
.meta-pill.diet { border-color: rgba(255,159,67,0.3); color: #ffb56b; background: rgba(255,159,67,0.08); }
.extra-info p { margin: 4px 0; font-size: 0.82rem; color: rgba(245,230,200,0.65); }

.card-footer {
  display: flex; gap: 8px; padding: 12px 14px;
  border-top: 1px solid rgba(212,175,55,0.12); background: rgba(0,0,0,0.3);
}
.btn {
  flex: 1; padding: 8px 10px; border-radius: 8px;
  border: 1px solid transparent; cursor: pointer;
  font-family: 'Cinzel', serif; font-size: 0.7rem;
  letter-spacing: 1.5px; text-transform: uppercase;
  transition: all 0.2s ease;
}
.btn.edit { background: rgba(212,175,55,0.12); color: #d4af37; border-color: rgba(212,175,55,0.3); }
.btn.edit:hover { background: rgba(212,175,55,0.22); }
.btn.danger { background: rgba(255,80,80,0.1); color: #ff8a8a; border-color: rgba(255,80,80,0.3); }
.btn.danger:hover { background: rgba(255,80,80,0.2); }

/* ===== EMPTY ===== */
.empty-state {
  max-width: 500px; margin: 60px auto; text-align: center; padding: 40px;
  border-radius: 16px; border: 1px dashed rgba(212,175,55,0.3); background: rgba(0,0,0,0.3);
}
.empty-state span { font-size: 3rem; display: block; margin-bottom: 10px; }
.empty-state p { margin: 0; font-family: 'Cinzel', serif; letter-spacing: 1.5px; color: rgba(245,230,200,0.5); }

/* ===== MODAL ===== */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
  display: flex; justify-content: center; align-items: center;
  z-index: 999; padding: 20px; animation: fadeIn 0.25s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* ===== MODAL COMPACTO DE EDIÇÃO ===== */
.modal-compact {
  width: min(92vw, 1000px);
  max-width: 1000px;
  max-height: 92vh;

  display: flex;
  flex-direction: column;

  background: linear-gradient(160deg, #1a150e, #0b0a08);
  border: 1px solid rgba(212,175,55,0.25);
  border-radius: 16px;
  overflow: hidden;

  box-shadow:
    0 30px 80px rgba(0,0,0,0.9),
    0 0 60px rgba(212,175,55,0.08);

  animation: slideUp 0.3s cubic-bezier(.2,.9,.3,1.2);
}

@keyframes slideUp {
  from { transform: translateY(20px) scale(0.97); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
}

.compact-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(212,175,55,0.15);
  background: rgba(0,0,0,0.4);
}
.catalog-tag {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: 'Cinzel', serif; font-size: 0.65rem;
  letter-spacing: 2px; color: #d4af37;
}
.catalog-dot { width: 8px; height: 8px; border-radius: 50%; background: #d4af37; box-shadow: 0 0 8px #d4af37; }
.close-x {
  width: 30px; height: 30px; border-radius: 8px;
  background: rgba(0,0,0,0.4); border: 1px solid rgba(212,175,55,0.2);
  color: #f5e6c8; cursor: pointer; font-size: 0.9rem;
  transition: all 0.2s ease;
}
.close-x:hover { background: rgba(255,80,80,0.15); border-color: rgba(255,80,80,0.4); color: #ff8a8a; }

.compact-header {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px 8px;
}
.compact-thumb {
  width: 56px; height: 56px; border-radius: 12px;
  background: rgba(0,0,0,0.5); border: 1px solid rgba(212,175,55,0.25);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden; font-size: 1.6rem; flex-shrink: 0;
}
.compact-thumb img { width: 100%; height: 100%; object-fit: cover; }
.compact-titles { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.caption-label {
  font-family: 'Cinzel', serif; font-size: 0.55rem;
  letter-spacing: 2px; text-transform: uppercase; color: rgba(212,175,55,0.7);
}
.compact-titles strong {
  font-family: 'Cinzel', serif; font-size: 1rem; color: #f5e6c8;
  letter-spacing: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.compact-body {
  flex: 1; overflow-y: auto;
  padding: 4px 18px 18px;
}
.compact-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  min-height: 220px;
}

.compact-actions {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px;
  border-top: 1px solid rgba(212,175,55,0.15);
  background: rgba(0,0,0,0.4);
}
.compact-actions .btn-ghost,
.compact-actions .btn-next,
.compact-actions .btn-gold {
  padding: 9px 16px; font-size: 0.72rem;
}

/* Scrollbar do body do modal */
.compact-body::-webkit-scrollbar { width: 8px; }
.compact-body::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
.compact-body::-webkit-scrollbar-thumb {
  background: rgba(212,175,55,0.25); border-radius: 4px;
}
.compact-body::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.45); }

/* ===== TRANSIÇÕES ===== */
.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { opacity: 0; transform: translateY(-8px); }

.fade-scale-enter-active, .fade-scale-leave-active { transition: all 0.25s ease; }
.fade-scale-enter-from, .fade-scale-leave-to { opacity: 0; transform: scale(0.95); }

.alert-pop-enter-active, .alert-pop-leave-active { transition: all 0.25s cubic-bezier(.2,.9,.3,1.2); }
.alert-pop-enter-from, .alert-pop-leave-to { opacity: 0; transform: scale(0.9); }

/* ===== CONFIRM MODAL ===== */
.confirm-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
}
.confirm-modal {
  width: 100%; max-width: 420px; padding: 24px;
  border-radius: 16px;
  background: linear-gradient(160deg, #1a150e, #0b0a08);
  border: 1px solid rgba(255,80,80,0.25);
  box-shadow: 0 30px 80px rgba(0,0,0,0.9), 0 0 40px rgba(255,80,80,0.1);
}
.confirm-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.confirm-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: rgba(255,80,80,0.12); border: 1px solid rgba(255,80,80,0.3);
  display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
}
.confirm-header h3 { margin: 0; font-family: 'Cinzel', serif; color: #ff8a8a; letter-spacing: 1.5px; font-size: 1rem; }
.confirm-message { color: rgba(245,230,200,0.7); font-size: 0.9rem; margin: 0 0 12px; }
.confirm-target {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px;
  background: rgba(0,0,0,0.4); border: 1px solid rgba(212,175,55,0.2); margin-bottom: 12px;
}
.target-icon { font-size: 1.3rem; }
.confirm-target strong { color: #f5e6c8; font-family: 'Cinzel', serif; letter-spacing: 1px; }
.confirm-warning { margin: 0; color: rgba(255,138,138,0.7); font-style: italic; font-size: 0.85rem; }
.confirm-actions { display: flex; gap: 10px; margin-top: 18px; }
.btn-cancel, .btn-delete {
  flex: 1; padding: 11px; border-radius: 10px; cursor: pointer;
  font-family: 'Cinzel', serif; font-size: 0.75rem;
  letter-spacing: 1.5px; text-transform: uppercase;
  border: 1px solid transparent; transition: all 0.2s ease;
}
.btn-cancel { background: transparent; border-color: rgba(212,175,55,0.25); color: rgba(245,230,200,0.7); }
.btn-cancel:hover:not(:disabled) { background: rgba(212,175,55,0.08); }
.btn-delete {
  background: linear-gradient(135deg, #c0392b, #922b21);
  color: #fff5e1; box-shadow: 0 6px 18px rgba(192,57,43,0.35);
}
.btn-delete:hover:not(:disabled) { transform: translateY(-1px); }
.spinner {
  display: inline-block; width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== ALERT ===== */
.alert-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 20px;
}
.alert-card {
  position: relative; width: 100%; max-width: 420px; padding: 24px;
  border-radius: 16px; overflow: hidden;
  background: linear-gradient(160deg, #1a150e, #0b0a08);
  border: 1px solid rgba(212,175,55,0.25);
  box-shadow: 0 30px 80px rgba(0,0,0,0.9);
}
.alert-glow { position: absolute; inset: 0; pointer-events: none; opacity: 0.4;
  background: radial-gradient(circle at top, rgba(212,175,55,0.2), transparent 60%); }
.alert-card.success .alert-glow { background: radial-gradient(circle at top, rgba(80,200,120,0.25), transparent 60%); }
.alert-card.error .alert-glow { background: radial-gradient(circle at top, rgba(255,80,80,0.25), transparent 60%); }
.alert-card.warning .alert-glow { background: radial-gradient(circle at top, rgba(255,180,70,0.25), transparent 60%); }
.alert-header { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; position: relative; }
.alert-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem; background: rgba(212,175,55,0.15);
  border: 1px solid rgba(212,175,55,0.35); color: #d4af37;
}
.alert-card.success .alert-icon { background: rgba(80,200,120,0.15); border-color: rgba(80,200,120,0.4); color: #6fdc8c; }
.alert-card.error .alert-icon { background: rgba(255,80,80,0.15); border-color: rgba(255,80,80,0.4); color: #ff8a8a; }
.alert-card.warning .alert-icon { background: rgba(255,180,70,0.15); border-color: rgba(255,180,70,0.4); color: #ffc46b; }
.alert-icon.pulse { animation: pulseIcon 1.2s ease; }
@keyframes pulseIcon { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
.alert-title h3 { margin: 0; font-family: 'Cinzel', serif; letter-spacing: 1.5px; font-size: 1rem; color: #f5e6c8; }
.alert-title small { font-size: 0.6rem; letter-spacing: 2px; color: rgba(212,175,55,0.7); font-family: 'Cinzel', serif; }
.alert-body p { margin: 0; color: rgba(245,230,200,0.8); font-size: 0.9rem; position: relative; }
.alert-footer { margin-top: 18px; display: flex; justify-content: flex-end; position: relative; }
.alert-footer button {
  padding: 9px 22px; border-radius: 10px; cursor: pointer;
  background: linear-gradient(135deg, #d4af37, #b8972e);
  color: #1a140f; border: none;
  font-family: 'Cinzel', serif; font-size: 0.75rem;
  letter-spacing: 1.5px; text-transform: uppercase;
  transition: all 0.2s ease;
}
.alert-footer button:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(212,175,55,0.4); }

/* ===== RESPONSIVO ===== */
@media (max-width: 640px) {
  .form-grid, .compact-grid { grid-template-columns: 1fr; }
  .step-label { display: none; }
  .modal-compact { max-width: 100%; }
}

/* RELAÇÕES */

.relation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 10px;

  max-height: 260px;
  overflow-y: auto;

  padding: 10px;
  border-radius: 12px;

  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(212,175,55,0.15);
}

.relation-card {
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 10px 12px;

  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(212,175,55,0.12);
  border-radius: 10px;

  cursor: pointer;
  transition: all .2s ease;
}

.relation-card:hover {
  border-color: rgba(212,175,55,0.45);
  background: rgba(212,175,55,0.08);
}

.relation-card input {
  accent-color: #d4af37;
  flex-shrink: 0;
}

.relation-name {
  color: #f5e6c8;
  font-size: .85rem;
  line-height: 1.2;
}

.relation-grid::-webkit-scrollbar {
  width: 8px;
}

.relation-grid::-webkit-scrollbar-thumb {
  background: rgba(212,175,55,0.3);
  border-radius: 999px;
}

/* ====================== RELAÇÕES NO MODAL DE EDIÇÃO ====================== */
.relations-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 14px;
  padding: 0 8px;
}

.relations-header h4 {
  margin: 0;
  font-family: 'Cinzel', serif;
  font-size: 1.12rem;
  color: #d4af37;
  text-align: center;
}

.relations-header .count {
  font-size: 0.78rem;
  color: rgba(212,175,55,0.75);
  margin-left: 8px;
}

.relations-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  min-height: 340px;
}

.relation-column {
  display: flex;
  flex-direction: column;
}

.search-input {
  padding: 11px 14px;
  border-radius: 10px;
  border: 1px solid rgba(212,175,55,0.35);
  background: rgba(0,0,0,0.55);
  color: #f5e6c8;
  font-family: 'Crimson Text', serif;
  width: 100%;
  margin-bottom: 12px;
}

.search-input:focus {
  outline: none;
  border-color: #d4af37;
  box-shadow: 0 0 0 3px rgba(212,175,55,0.25);
}

.relation-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 6px;
}

.relation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 10px;
  background: rgba(0,0,0,0.45);
  border: 1px solid rgba(212,175,55,0.2);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.relation-item:hover {
  background: rgba(212,175,55,0.12);
  border-color: #d4af37;
}

.relation-item input {
  accent-color: #d4af37;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.relation-name {
  font-family: 'Crimson Text', serif;
  color: #f5e6c8;
  flex: 1;
  line-height: 1.3;
}

.relation-name small {
  display: block;
  color: rgba(245,230,200,0.65);
  font-size: 0.82rem;
}

/* Scrollbar mais bonita */
.relation-list::-webkit-scrollbar {
  width: 7px;
}
.relation-list::-webkit-scrollbar-thumb {
  background: rgba(212,175,55,0.4);
  border-radius: 20px;
}
.relation-list::-webkit-scrollbar-thumb:hover {
  background: rgba(212,175,55,0.7);
}

.relation-dropdown-btn {
  width: 100%;
  border: 1px solid rgba(255,255,255,.15);
  background: rgba(255,255,255,.04);
  color: white;
  padding: 12px 14px;
  border-radius: 10px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  cursor: pointer;
  margin-bottom: 10px;

  transition: .25s;
}

.relation-dropdown-btn:hover {
  background: rgba(255,255,255,.08);
}

.arrow {
  transition: transform .25s ease;
}

.arrow.open {
  transform: rotate(180deg);
}

.relation-list {
  max-height: 280px;
  overflow-y: auto;

  border: 1px solid rgba(255,255,255,.1);
  border-radius: 10px;

  padding: 8px;
  background: rgba(0,0,0,.2);
}

.relation-item {
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 8px;
  border-radius: 8px;

  transition: .2s;
}

.relation-item:hover {
  background: rgba(255,255,255,.06);
}

.relation-name {
  display: flex;
  flex-direction: column;
}

.relation-name small {
  opacity: .6;
  font-size: .75rem;
}

</style>