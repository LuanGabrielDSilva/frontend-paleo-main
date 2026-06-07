<template>
  <div class="page">
    <section class="hero" data-testid="home-hero">

      <div class="particles" aria-hidden="true">
        <span
          v-for="p in particles"
          :key="p.id"
          class="dust"
          :style="{
            width: p.size + 'px',
            height: p.size + 'px',
            left: p.left + '%',
            top: p.top + '%',
            animationDuration: p.duration + 's',
            animationDelay: p.delay + 's',
          }"
        />
      </div>
      
      <div class="hero-content">
        <div class="hero-pre-title anim" style="animation-delay: 0.2s">
          <span class="line-deco"></span>
          <span class="pre-label">DESDE OS PRIMÓRDIOS</span>
          <span class="line-deco"></span>
        </div>
        <h1 class="hero-title anim" style="animation-delay: 0.4s">
          <span class="gold-text">PALEONTOLOGIA</span><br />
          <span class="hero-sub-title">A ARTE DOS FÓSSEIS</span>
        </h1>
        <p class="hero-desc anim" style="animation-delay: 0.6s">
          Desvende os segredos de criaturas que caminharam sobre a Terra há milhões de anos.
          Uma jornada através do tempo, gravada em pedra e osso.
        </p>
        
        <div class="hero-buttons anim" style="animation-delay: 0.8s">
          <router-link to="/animals" class="btn-primary" data-testid="hero-cta-primary">
            EXPLORAR COLEÇÃO
          </router-link>
          <router-link to="/saiba-mais" class="btn-secondary" data-testid="hero-cta-secondary">
            SAIBA MAIS
          </router-link>
        </div>

        <div class="scroll-cue anim" style="animation-delay: 1.2s" aria-hidden="true">
          <span class="scroll-cue__label">Role para explorar</span>
          <span class="scroll-cue__line"></span>
        </div>
      </div>
    </section>

    <section class="stats" data-testid="home-stats">
      <div
        v-for="(s, i) in stats"
        :key="s.label"
        class="stat-card"
        :style="{ animationDelay: 0.1 * i + 's' }"
      >
        <span class="stat-num gold-text">{{ s.value }}</span>
        <span class="stat-label">{{ s.label }}</span>
      </div>
    </section>

    <section class="section intro" data-testid="home-intro">
      <header class="section-head">
        <span class="eyebrow">— A CIÊNCIA —</span>
        <h2 class="section-title">O que é a <span class="gold-text">Paleontologia</span></h2>
        <p class="section-sub">
          A ciência que estuda a vida do passado a partir de vestígios preservados na rocha.
        </p>
      </header>

      <div class="pillars">
        <article
          v-for="(p, i) in pillars"
          :key="p.title"
          class="pillar"
          :style="{ animationDelay: 0.08 * i + 's' }"
        >
          <div class="pillar__icon" aria-hidden="true">{{ p.icon }}</div>
          <h3 class="pillar__title">{{ p.title }}</h3>
          <p class="pillar__desc">{{ p.desc }}</p>
        </article>
      </div>
    </section>

    <section class="section eras" data-testid="home-eras">
      <header class="section-head">
        <span class="eyebrow">— LINHA DO TEMPO —</span>
        <h2 class="section-title">As <span class="gold-text">Grandes Eras</span></h2>
      </header>
      
      <div class="eras-grid">
        <article
          v-for="(era, i) in eras"
          :key="era.name"
          class="era-card"
          :style="{ animationDelay: 0.08 * i + 's' }"
        >
          <div class="era-card__top">
            <span class="era-card__num">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="era-card__age">{{ era.age }}</span>
          </div>
          <h3 class="era-card__name">{{ era.name }}</h3>
          <p class="era-card__desc">{{ era.desc }}</p>
          <router-link to="/eras" class="era-card__link">
            Descobrir <span aria-hidden="true">→</span>
          </router-link>
        </article>
      </div>
    </section>

    <section class="feature feature--left" data-testid="home-feature-excavation">
      <div class="feature__media">
        <img :src="excavationImg" alt="Sítio de escavação paleontológica" />
        <div class="feature__badge"><span>PALEONTOLOGIA</span></div>
      </div>
      <div class="feature__body">
        <span class="eyebrow">— CIÊNCIA —</span>
        <h2 class="section-title">A Paleontologia<br /><span class="gold-text">é a memória da Terra</span></h2>
        <p class="feature__desc">
          Mais do que apenas ossos e fósseis, a paleontologia é a ciência que reconstrói a história da vida no planeta...
        </p>
      </div>
    </section>

    <section class="section process" data-testid="home-process">
      <header class="section-head">
        <span class="eyebrow">— PROCESSO —</span>
        <h2 class="section-title">Como <span class="gold-text">nasce um fóssil</span></h2>
      </header>

      <ol class="steps">
        <li
          v-for="(step, i) in fossilSteps"
          :key="step.title"
          class="step"
          :style="{ animationDelay: 0.1 * i + 's' }"
        >
          <div class="step__num gold-text">{{ String(i + 1).padStart(2, '0') }}</div>
          <div class="step__body">
            <h3 class="step__title">{{ step.title }}</h3>
            <p class="step__desc">{{ step.desc }}</p>
          </div>
        </li>
      </ol>
    </section>

    <section class="feature feature--right" data-testid="home-feature-science">
      <div class="feature__body">
        <span class="eyebrow">— CIÊNCIA —</span>
        <h2 class="section-title">Datação<br /><span class="gold-text">e estratigrafia</span></h2>
        <p class="feature__desc">Do Cambriano ao Holoceno: visualize a distribuição dos fósseis...</p>
        <div class="feature__metrics">
          <div class="metric"><span class="metric__val gold-text">540M</span><span class="metric__lbl">anos cobertos</span></div>
          <div class="metric"><span class="metric__val gold-text">12</span><span class="metric__lbl">períodos</span></div>
          <div class="metric"><span class="metric__val gold-text">5</span><span class="metric__lbl">extinções em massa</span></div>
        </div>
        <router-link to="/eras" class="btn-secondary btn-secondary--sm">EXPLORAR LINHA DO TEMPO</router-link>
      </div>
      <div class="feature__media">
        <img :src="fossilChartImg" alt="Gráfico de distribuição de fósseis" />
      </div>
    </section>

    <section class="section discoveries" data-testid="home-discoveries">
      <header class="section-head">
        <span class="eyebrow">— MARCOS HISTÓRICOS —</span>
        <h2 class="section-title">Grandes <span class="gold-text">Descobertas</span></h2>
      </header>

      <div class="timeline-disc">
        <article
          v-for="(d, i) in discoveries"
          :key="d.year"
          class="disc-item"
          :style="{ animationDelay: 0.08 * i + 's' }"
        >
          <div class="disc-year gold-text">{{ d.year }}</div>
          <div class="disc-line" aria-hidden="true"></div>
          <div class="disc-body">
            <h3 class="disc-title">{{ d.title }}</h3>
            <p class="disc-desc">{{ d.desc }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="section facts" data-testid="home-facts">
      <header class="section-head">
        <span class="eyebrow">— VOCÊ SABIA? —</span>
        <h2 class="section-title">Curiosidades <span class="gold-text">do passado</span></h2>
      </header>

      <div class="facts-grid">
        <div
          v-for="(f, i) in facts"
          :key="f.title"
          class="fact-card"
          :style="{ animationDelay: 0.08 * i + 's' }"
        >
          <span class="fact-mark" aria-hidden="true">◆</span>
          <h3 class="fact-title">{{ f.title }}</h3>
          <p class="fact-desc">{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <section class="section movies" data-testid="home-movies">
      <header class="section-head">
        <span class="eyebrow">— UNIVERSO JURASSIC —</span>
        <h2 class="section-title">Criaturas da <span class="gold-text">Ficção</span></h2>
        <p class="section-sub">
          Algumas das criaturas mais famosas dos filmes e séries de Jurassic World.
        </p>
      </header>

      <div class="movies-grid">
        <router-link
          v-for="(movie, i) in movieCreatures"
          :key="movie.name"
          :to="`/ficcao/${movie.slug}`"
          class="movie-card movie-link"
          :style="{ animationDelay: 0.08 * i + 's' }"
        >
          <img :src="movie.image" :alt="movie.name" class="movie-image" />
          <div class="movie-content">
            <span class="movie-type">{{ movie.origin }}</span>
            <h3 class="movie-name">{{ movie.name }}</h3>
            <p class="movie-desc">{{ movie.desc }}</p>
          </div>
        </router-link>
      </div>
    </section>

    <section class="cta" :style="{ backgroundImage: `linear-gradient(180deg, hsla(30,20%,5%,0.55), hsla(30,20%,5%,0.92)), url(${museumImg})` }" data-testid="home-cta">
      <div class="cta__inner">
        <span class="eyebrow">— LOJA OFICIAL —</span>
        <h2 class="section-title">Explore a <span class="gold-text">Loja Paleo</span></h2>
        <p class="cta__desc">Réplicas de fósseis, souvenirs exclusivos...</p>
        <div class="hero-buttons">
          <router-link to="/shop" class="btn-primary">EXPLORAR A LOJA</router-link>
          <router-link to="/cart" class="btn-secondary">VER COMPRAS</router-link>
        </div>
      </div>
    </section>

    <footer class="foot" data-testid="home-foot">
      <span class="foot__mark">◆</span>
      <p>PALEO PARK · gravado em pedra, contado em luz</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Importações dos caminhos das mídias locais (Imagens informativas)
import excavationImg from '@/assets/HomeImagem/excavation.jpg'
import museumImg from '@/assets/HomeImagem/museum.jpg'
import fossilChartImg from '@/assets/HomeImagem/GraficoFossil.jpg'

// Importações das imagens das criaturas híbridas da ficção
import indominusImg from '@/assets/Movies/indominus.jpg'
import indoraptorImg from '@/assets/Movies/indoraptor.jpg'
import scorpiusImg from '@/assets/Movies/scorpios.jpg'
import distortusImg from '@/assets/Movies/distortus.jpg'

// Objeto estático contendo os dados estruturados dos animais da ficção (Alimenta os cards clicáveis)
const movieCreatures = [
  {
    slug: 'indominus-rex',
    name: 'Indominus Rex',
    origin: 'Jurassic World (2015)',
    image: indominusImg,
    desc: 'Híbrido genético criado pela InGen combinando DNA de diversos predadores pré-históricos.'
  },
  {
    slug: 'indoraptor',
    name: 'Indoraptor',
    origin: 'Jurassic World: Fallen Kingdom',
    image: indoraptorImg,
    desc: 'Versão militarizada da Indominus Rex, projetada para operações táticas.'
  },
  {
    slug: 'scorpios-rex',
    name: 'Scorpios Rex',
    origin: 'Camp Cretaceous',
    image: scorpiusImg,
    desc: 'Protótipo instável de híbrido genético com comportamento extremamente agressivo.'
  },
  {
    slug: 'distortus-rex',
    name: 'Distortus Rex',
    origin: 'Jurassic World Rebirth',
    image: distortusImg,
    desc: 'Mutação experimental inspirada em múltiplos predadores, criada para ampliar o poder destrutivo.'
  }
]

/* SISTEMA DE PARTÍCULAS REATIVAS (ref):
  Cria uma lista reativa com 30 itens gerados dinamicamente com matemática matemática pura (Math.random).
  Define tamanho (size), posicionamento (left/top) e duração da animação para simular o efeito de poeira antiga no Hero.
*/
const particles = ref(
  Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 1,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 5,
  }))
)

// Listas estáticas de conteúdo para povoar as seções da página sem precisar sobrecarregar o banco de dados
const stats = [
  { value: '540M+', label: 'anos de história' },
  { value: '1.200', label: 'fósseis catalogados' },
  { value: '100',    label: 'espécies em exposição' },
  { value: '12',    label: 'eras geológicas' },
]

const pillars = [
  { icon: '🦴', title: 'Paleobiologia', desc: 'Estuda os organismos do passado: sua anatomia, comportamento, dieta...' },
  { icon: '🌑', title: 'Paleogeologia', desc: 'Analisa as rochas e os sedimentos que preservam os fósseis...' },
  { icon: '🧬', title: 'Paleoevolução', desc: 'Mapeia como as espécies surgiram, se transformaram e se extinguiram...' },
  { icon: '🌋', title: 'Paleoecologia', desc: 'Reconstrói ecossistemas inteiros de mundos que nunca veremos.' },
]

const eras = [
  { name: 'Paleozoica', age: '541 – 252 Ma', desc: 'A era dos primeiros vertebrados, das florestas de samambaias...' },
  { name: 'Mesozoica', age: '252 – 66 Ma', desc: 'O reinado dos dinossauros. Pterossauros cruzando os céus...' },
  { name: 'Cenozoica', age: '66 Ma – hoje', desc: 'A ascensão dos mamíferos, das aves modernas e dos primeiros hominídeos.' },
]

const fossilSteps = [
  { title: 'Morte e soterramento', desc: 'O organismo morre e é rapidamente coberto por sedimento antes da decomposição.' },
  { title: 'Decomposição parcial', desc: 'As partes moles se perdem. Estruturas rígidas permanecem protegidas.' },
  { title: 'Mineralização', desc: 'Minerais infiltram-se nos restos, substituindo a matéria orgânica e formando rocha.' },
  { title: 'Exposição e descoberta', desc: 'Erosão ou escavação trazem o fóssil de volta à superfície para estudo.' },
]

const discoveries = [
  { year: '1824', title: 'Megalossauro', desc: 'William Buckland descreve o primeiro dinossauro reconhecido cientificamente.' },
  { year: '1861', title: 'Archaeopteryx', desc: 'O elo entre répteis e aves é encontrado na Alemanha, confirmando a teoria de Darwin.' },
  { year: '1902', title: 'Tyrannosaurus rex', desc: 'Barnum Brown descobre o primeiro esqueleto do predador em Montana.' },
  { year: '1993', title: 'Plumas em dinossauros', desc: 'Fósseis chineses revelam dinossauros com penas, mudando o imaginário visual.' },
  { year: '2014', title: 'Dreadnoughtus', desc: 'Um dos maiores saurópodes já encontrados é descrito na Patagônia.' },
]

const facts = [
  { title: 'As aves são dinossauros', desc: 'Geneticamente, as aves descendem de terópodes — o T. rex é parente da galinha.' },
  { title: 'Petróleo é vida antiga', desc: 'Forma-se a partir de microrganismos marinhos soterrados há milhões de anos.' },
  { title: 'Tubarões mais antigos que árvores', desc: 'Tubarões surgiram há 450 Ma; as árvores apareceram 100 milhões de anos depois.' },
  { title: '5 extinções em massa', desc: 'A vida na Terra já foi quase exterminada cinco vezes ao longo de sua história.' },
]
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Cinzel+Decorative:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=JetBrains+Mono:wght@300;400&display=swap');

/* ====================== BASE ====================== */
.page {
  --bg: hsl(30, 20%, 5%);
  --bg-2: hsl(30, 22%, 7%);
  --fg: hsl(36, 50%, 88%);
  --fg-dim: hsl(36, 20%, 65%);
  --gold: hsl(36, 60%, 50%);
  --gold-light: hsl(40, 70%, 70%);
  --gold-soft: hsla(36, 60%, 50%, 0.14);
  --gold-line: hsla(36, 60%, 50%, 0.28);

  min-height: 100vh;
  background: var(--bg);
  color: var(--fg);
  font-family: 'Cormorant Garamond', Georgia, serif;
  overflow-x: hidden;
  position: relative;
}

.gold-text {
  background: linear-gradient(135deg, hsl(45,60%,60%) 0%, hsl(40,60%,45%) 50%, hsl(45,60%,60%) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  font-weight: 900;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));
}

.eyebrow {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 14px;
}

.section {
  padding: clamp(60px, 9vw, 120px) clamp(20px, 5vw, 80px);
  position: relative;
}

.section-head {
  text-align: center;
  max-width: 720px;
  margin: 0 auto clamp(40px, 6vw, 70px);
}

.section-title {
  font-family: 'Cinzel Decorative', serif;
  font-size: clamp(2rem, 4.5vw, 3.4rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  margin: 0 0 18px;
}

.section-sub {
  color: var(--fg-dim);
  font-size: clamp(1rem, 1.6vw, 1.15rem);
  font-style: italic;
  line-height: 1.7;
}

/* ====================== HERO ====================== */
.hero {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  /* ======================
   IMAGEM PRINCIPAL
   Fundo temático da página
   inspirado em escavações
   paleontológicas
====================== */

  background: url('/src/assets/hero-bg.jpg') center/cover no-repeat,
              linear-gradient(180deg, #0b0805, #120d08);
}

/* ======================
   OVERLAY DO HERO
   Escurece a imagem de fundo
   para melhorar a leitura
   do texto principal
====================== */

.hero::before {
  content: '';
  position: absolute; inset: 0; z-index: 2;
  background: linear-gradient(to bottom,
    hsla(30,20%,5%,0.70) 0%, hsla(30,20%,5%,0.35) 30%,
    hsla(30,20%,5%,0.20) 50%, hsla(30,20%,5%,0.50) 75%,
    hsla(30,20%,5%,0.95) 100%);
}

/* ======================
   OVERLAY DO HERO
   Escurece a imagem de fundo
   para melhorar a leitura
   do texto principal
====================== */

.hero::after {
  content: '';
  position: absolute; inset: 0; z-index: 3;
  background: linear-gradient(to right,
    hsla(30,20%,5%,0.70), transparent 30%, transparent 70%, hsla(30,20%,5%,0.70));
}

.particles { position: absolute; inset: 0; z-index: 4; pointer-events: none; }
.dust {
  position: absolute;
  border-radius: 50%;
  background: hsla(36, 60%, 50%, 0.4);
  animation: dust-kf ease-in-out infinite;
}

.hero-content { position: relative; z-index: 10; text-align: center; padding: 20px; max-width: 820px; }

/* ======================
   ANIMAÇÃO DE ENTRADA
   Faz os elementos surgirem
   suavemente ao carregar a página
====================== */

.anim { opacity: 0; animation: reveal-up 0.9s ease-out forwards; }

.hero-pre-title { display: flex; align-items: center; justify-content: center; gap: 14px; margin-bottom: 28px; }
.line-deco { width: 60px; height: 1px; background: linear-gradient(90deg, transparent, var(--gold), transparent); }
.pre-label { font-family: 'Cinzel', serif; font-size: 0.78rem; letter-spacing: 0.4em; text-transform: uppercase; color: hsla(36,60%,55%,0.9); }

.hero-title {
  font-family: 'Cinzel Decorative', serif;
  font-size: clamp(2.6rem, 7vw, 5.5rem);
  font-weight: 700; line-height: 1.05; text-transform: uppercase;
  margin: 0 0 20px; letter-spacing: -0.02em;
}
.hero-sub-title {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.1rem, 3vw, 2.2rem);
  letter-spacing: 0.3em; text-transform: uppercase; color: hsl(36,40%,82%);
}
.hero-desc { font-size: 1.15rem; font-style: italic; max-width: 560px; margin: 0 auto 40px; line-height: 1.7; color: var(--fg-dim); }

.hero-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

.btn-primary, .btn-secondary {
  display: inline-block;
  padding: 16px 44px;
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: 2px;
  transition: transform 0.35s ease, background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
  color: var(--fg);
  cursor: pointer;
}
.btn-primary--sm, .btn-secondary--sm { padding: 13px 30px; font-size: 0.78rem; }

/* ======================
   GLOW DOURADO
   Destaca o botão principal
====================== */
.btn-primary {
  background: hsla(36,60%,50%,0.12);
  border: 1px solid hsla(36,60%,50%,0.5);
  animation: pulse-glow 3s ease-in-out infinite;
}

.btn-primary:hover { background: hsla(36,60%,50%,0.28); transform: translateY(-2px); }
.btn-secondary { border: 1px solid hsla(36,25%,40%,0.5); background: transparent; }
.btn-secondary:hover { background: hsla(36,60%,50%,0.1); border-color: hsla(36,60%,50%,0.6); transform: translateY(-2px); }

/* ======================
   INDICADOR DE SCROLL
   Mostra ao usuário que
   existe conteúdo abaixo
====================== */

.scroll-cue {
  position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  font-family: 'JetBrains Mono', monospace; font-size: 0.65rem;
  letter-spacing: 0.35em; color: hsla(36,40%,70%,0.7); text-transform: uppercase;
}
.scroll-cue__line { width: 1px; height: 50px; background: linear-gradient(180deg, var(--gold), transparent); animation: scroll-pulse 2s ease-in-out infinite; }

/* ====================== STATS ====================== */
.stats {
  position: relative; z-index: 5;
  margin: -60px auto 0;
  max-width: 1180px;
  padding: 0 clamp(20px, 5vw, 60px);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}
.stat-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--gold-line);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 28px 22px; text-align: center;
  display: flex; flex-direction: column; gap: 8px;
  opacity: 0; animation: reveal-up 0.8s ease-out forwards;
  transition: transform 0.4s ease, border-color 0.4s ease, background 0.4s ease;
}

/* ======================
   EFEITO HOVER
   Destaca o card ao passar
   o mouse sobre ele
====================== */

.stat-card:hover { transform: translateY(-4px); border-color: hsla(36,60%,50%,0.55); background: rgba(212,175,55,0.06); }
.stat-num { font-family: 'Cinzel Decorative', serif; font-size: clamp(1.8rem, 3.2vw, 2.6rem); }
.stat-label { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--fg-dim); }

/* ====================== INTRO / PILARES ====================== */
.intro { background: linear-gradient(180deg, var(--bg), var(--bg-2)); }
.pillars {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 22px;
  max-width: 1180px;
  margin: 0 auto;
}
.pillar {
  padding: 32px 26px;
  background: rgba(255,255,255,0.025);
  border: 1px solid var(--gold-line);
  border-radius: 4px;
  text-align: center;
  opacity: 0; animation: reveal-up 0.8s ease-out forwards;
  transition: transform 0.4s ease, border-color 0.4s ease, background 0.4s ease;
}
.pillar:hover { transform: translateY(-6px); border-color: hsla(36,60%,50%,0.6); background: rgba(255,255,255,0.04); }
.pillar__icon {
  font-size: 2.2rem;
  margin-bottom: 14px;
  filter: drop-shadow(0 4px 10px hsla(36,60%,50%,0.3));
}
.pillar__title {
  font-family: 'Cinzel', serif;
  font-size: 1.2rem; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  margin: 0 0 12px; color: var(--fg);
}
.pillar__desc { margin: 0; font-size: 0.98rem; line-height: 1.65; color: var(--fg-dim); }

/* ====================== ERAS ====================== */
.eras { background: linear-gradient(180deg, var(--bg-2), var(--bg)); }
.eras-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 22px; max-width: 1180px; margin: 0 auto;
}
.era-card {
  position: relative;
  padding: 32px 28px;
  background: rgba(255,255,255,0.025);
  border: 1px solid var(--gold-line);
  border-radius: 4px;
  display: flex; flex-direction: column; gap: 14px;
  opacity: 0; animation: reveal-up 0.8s ease-out forwards;
  transition: transform 0.4s ease, border-color 0.4s ease, background 0.4s ease;
  overflow: hidden;
}
.era-card::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, transparent 60%, hsla(36,60%,50%,0.08));
  opacity: 0; transition: opacity 0.4s ease; pointer-events: none;
}
.era-card:hover { transform: translateY(-6px); border-color: hsla(36,60%,50%,0.6); background: rgba(255,255,255,0.04); }
.era-card:hover::before { opacity: 1; }
.era-card__top { display: flex; justify-content: space-between; align-items: center; }
.era-card__num { font-family: 'Cinzel Decorative', serif; font-size: 1.6rem; color: var(--gold); opacity: 0.55; }
.era-card__age { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.18em; color: var(--fg-dim); padding: 4px 10px; border: 1px solid var(--gold-line); border-radius: 2px; }
.era-card__name { font-family: 'Cinzel', serif; font-size: 1.55rem; font-weight: 600; margin: 0; color: var(--fg); }
.era-card__desc { margin: 0; font-size: 1rem; line-height: 1.65; color: var(--fg-dim); }
.era-card__link {
  margin-top: auto;
  font-family: 'Cinzel', serif; font-size: 0.8rem;
  letter-spacing: 0.25em; text-transform: uppercase;
  color: var(--gold); text-decoration: none;
  display: inline-flex; align-items: center; gap: 8px;
  transition: gap 0.3s ease, color 0.3s ease;
}
.era-card__link:hover { gap: 14px; color: var(--gold-light); }

/* ====================== FEATURES ====================== */
.feature {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(28px, 5vw, 70px);
  align-items: center;
  padding: clamp(60px, 9vw, 120px) clamp(20px, 5vw, 80px);
  max-width: 1280px; margin: 0 auto;
}
.feature--right .feature__media { order: 2; }
.feature__media {
  position: relative;
  border: 1px solid var(--gold-line);
  border-radius: 4px; overflow: hidden;
  aspect-ratio: 4 / 5;
  box-shadow: 0 25px 60px rgba(0,0,0,0.55);
}
.feature__media img {
  width: 100%; height: 100%; object-fit: cover;
  filter: brightness(0.85) contrast(1.05) saturate(0.95);
  transition: transform 0.8s ease, filter 0.6s ease;
}
.feature:hover .feature__media img { transform: scale(1.04); filter: brightness(0.95) contrast(1.08) saturate(1); }
.feature__media::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 55%, hsla(30,20%,5%,0.6)); pointer-events: none; }
.feature__badge {
  position: absolute; top: 18px; left: 18px; z-index: 2;
  padding: 6px 12px;
  background: hsla(30,20%,5%,0.7);
  border: 1px solid var(--gold);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem; letter-spacing: 0.3em; color: var(--gold);
}
.feature__body { max-width: 540px; }
.feature__desc { color: var(--fg-dim); font-size: 1.1rem; line-height: 1.8; margin: 0 0 24px; }
.feature__metrics {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 16px; margin: 0 0 28px; padding: 22px 0;
  border-top: 1px solid var(--gold-line);
  border-bottom: 1px solid var(--gold-line);
}
.metric { display: flex; flex-direction: column; gap: 4px; }
.metric__val { font-family: 'Cinzel Decorative', serif; font-size: 1.7rem; }
.metric__lbl { font-family: 'JetBrains Mono', monospace; font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--fg-dim); }

/* ====================== PROCESS / STEPS ====================== */
.process { background: linear-gradient(180deg, var(--bg), var(--bg-2)); }
.steps {
  list-style: none; padding: 0; margin: 0;
  max-width: 980px; margin: 0 auto;
  display: flex; flex-direction: column; gap: 20px;
  counter-reset: step;
}
.step {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 24px; align-items: start;
  padding: 26px 30px;
  background: rgba(255,255,255,0.025);
  border: 1px solid var(--gold-line);
  border-left: 3px solid var(--gold);
  border-radius: 4px;
  opacity: 0; animation: reveal-up 0.8s ease-out forwards;
  transition: transform 0.4s ease, background 0.4s ease, border-color 0.4s ease;
}
.step:hover { transform: translateX(6px); background: rgba(255,255,255,0.045); border-color: hsla(36,60%,50%,0.6); }
.step__num { font-family: 'Cinzel Decorative', serif; font-size: 2.8rem; line-height: 1; }
.step__title {
  font-family: 'Cinzel', serif; font-size: 1.25rem; font-weight: 600;
  letter-spacing: 0.06em; text-transform: uppercase;
  margin: 4px 0 10px; color: var(--fg);
}
.step__desc { margin: 0; font-size: 1.02rem; line-height: 1.7; color: var(--fg-dim); }

/* ====================== DESCOBERTAS ====================== */
.discoveries { background: linear-gradient(180deg, var(--bg-2), var(--bg)); }
.timeline-disc {
  max-width: 980px; margin: 0 auto;
  display: flex; flex-direction: column;
}
.disc-item {
  display: grid;
  grid-template-columns: 110px 30px 1fr;
  gap: 18px; align-items: start;
  padding: 24px 0;
  position: relative;
  opacity: 0; animation: reveal-up 0.8s ease-out forwards;
}
.disc-item + .disc-item { border-top: 1px dashed var(--gold-line); }
.disc-year { font-family: 'Cinzel Decorative', serif; font-size: 1.6rem; }
.disc-line {
  position: relative;
  width: 100%; height: 100%;
  min-height: 40px;
}

/* ======================
   TIMELINE HISTÓRICA
   Cria os pontos e linhas
   da linha do tempo
====================== */

.disc-line::before {
  content: ''; position: absolute; top: 12px; left: 50%;
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 14px hsla(36,60%,50%,0.6);
  transform: translateX(-50%);
}
.disc-line::after {
  content: ''; position: absolute;
  top: 28px; left: 50%; transform: translateX(-50%);
  width: 1px; height: calc(100% + 24px);
  background: linear-gradient(180deg, var(--gold-line), transparent);
}
.disc-item:last-child .disc-line::after { display: none; }
.disc-title {
  font-family: 'Cinzel', serif; font-size: 1.25rem; font-weight: 600;
  letter-spacing: 0.06em; text-transform: uppercase;
  margin: 0 0 8px; color: var(--fg);
}
.disc-desc { margin: 0; font-size: 1rem; line-height: 1.7; color: var(--fg-dim); }

/* ====================== FACTS ====================== */
.facts { background: linear-gradient(180deg, var(--bg), var(--bg-2)); }
.facts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 22px;
  max-width: 1180px; margin: 0 auto;
}
.fact-card {
  position: relative;
  padding: 28px 26px 26px;
  background: rgba(255,255,255,0.025);
  border: 1px solid var(--gold-line);
  border-radius: 4px;
  opacity: 0; animation: reveal-up 0.8s ease-out forwards;
  transition: transform 0.4s ease, background 0.4s ease, border-color 0.4s ease;
}
.fact-card:hover { transform: translateY(-4px); background: rgba(255,255,255,0.045); border-color: hsla(36,60%,50%,0.55); }
.fact-mark { color: var(--gold); font-size: 1rem; display: block; margin-bottom: 12px; }
.fact-title {
  font-family: 'Cinzel', serif; font-size: 1.1rem; font-weight: 600;
  letter-spacing: 0.06em; text-transform: uppercase;
  margin: 0 0 10px; color: var(--fg);
}
.fact-desc { margin: 0; font-size: 0.98rem; line-height: 1.65; color: var(--fg-dim); }

/* ====================== CTA FINAL ====================== */
.cta {
  position: relative;
  padding: clamp(80px, 12vw, 160px) clamp(20px, 5vw, 80px);
  background-size: cover; background-position: center; background-repeat: no-repeat;
  text-align: center;
}
.cta__inner { max-width: 720px; margin: 0 auto; }
.cta__desc { color: var(--fg-dim); font-size: 1.15rem; font-style: italic; line-height: 1.7; margin: 0 0 36px; }

/* ====================== RODAPÉ MINI ====================== */
.foot {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  padding: 36px 20px;
  border-top: 1px solid var(--gold-line);
  font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;
  letter-spacing: 0.25em; text-transform: uppercase; color: var(--fg-dim);
}
.foot__mark { color: var(--gold); font-size: 1rem; }

/* ====================== ANIMAÇÕES ====================== */

/* =====================================
   KEYFRAMES
   dust-kf      -> partículas flutuando
   reveal-up    -> entrada dos elementos
   pulse-glow   -> brilho do botão
   scroll-pulse -> indicador de rolagem
===================================== */

@keyframes dust-kf {
  0%, 100% { opacity: 0; transform: translateY(0) scale(0); }
  50%      { opacity: 1; transform: translateY(-100px) scale(1); }
}
@keyframes reveal-up {
  from { opacity: 0; transform: translateY(60px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px hsla(36,60%,50%,0.1); }
  50%      { box-shadow: 0 0 40px hsla(36,60%,50%,0.3); }
}
@keyframes scroll-pulse {
  0%, 100% { opacity: 0.4; transform: scaleY(1); }
  50%      { opacity: 1;   transform: scaleY(1.3); }
}

/* ====================== RESPONSIVO ====================== */
@media (max-width: 1024px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
  .feature, .feature--right { grid-template-columns: 1fr; }
  .feature--right .feature__media { order: 0; }
  .feature__media { aspect-ratio: 16 / 10; max-height: 460px; }
}

@media (max-width: 640px) {
  .stats { grid-template-columns: 1fr 1fr; gap: 12px; margin-top: -40px; }
  .hero-buttons { flex-direction: column; align-items: stretch; }
  .btn-primary, .btn-secondary { text-align: center; }
  .feature__metrics { grid-template-columns: 1fr; gap: 12px; }
  .step { grid-template-columns: 60px 1fr; gap: 14px; padding: 22px; }
  .step__num { font-size: 2rem; }
  .disc-item { grid-template-columns: 80px 22px 1fr; gap: 12px; }
  .disc-year { font-size: 1.2rem; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .anim, .stat-card, .era-card, .pillar, .step, .disc-item, .fact-card { opacity: 1 !important; }
}

/* ====================== FILMES ====================== */

.movies {
  background: linear-gradient(
    180deg,
    var(--bg-2),
    var(--bg)
  );
}

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;

  max-width: 1200px;
  margin: 0 auto;
}

.movie-card {
  overflow: hidden;

  background: rgba(255,255,255,0.03);
  border: 1px solid var(--gold-line);
  border-radius: 6px;

  transition: all 0.4s ease;
}

.movie-card:hover {
  transform: translateY(-8px);

  border-color: hsla(36,60%,50%,0.6);

  box-shadow:
    0 15px 35px rgba(0,0,0,0.4);
}

.movie-image {
  width: 100%;
  height: 260px;
  object-fit: cover;

  transition: transform 0.6s ease;
}

.movie-card:hover .movie-image {
  transform: scale(1.05);
}

.movie-content {
  padding: 20px;
}

.movie-type {
  display: inline-block;

  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;

  letter-spacing: 0.15em;
  text-transform: uppercase;

  color: var(--gold);

  margin-bottom: 10px;
}

.movie-name {
  font-family: 'Cinzel', serif;

  font-size: 1.3rem;
  margin-bottom: 12px;
}

.movie-desc {
  color: var(--fg-dim);
  line-height: 1.6;
}

.movie-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

</style>