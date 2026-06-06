<template>
  <div class="museum-page" data-testid="distortus-rex-page">
    <div class="grain" aria-hidden="true"></div>
    <div class="vignette" aria-hidden="true"></div>

    <!-- BACK BUTTON -->
    <button class="back-btn" @click="goBack" data-testid="back-button" aria-label="Voltar">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M19 12H5"/>
        <path d="M12 19l-7-7 7-7"/>
      </svg>
      <span>Voltar ao Início</span>
      <span class="gleam" aria-hidden="true"></span>
    </button>

    <header class="hero">
      <div class="hero__media">
        <img :src="image" alt="Distortus Rex" class="hero__img" />
        <div class="hero__fade"></div>
      </div>

      <div class="hero__content">
        <span class="kicker">Arquivos Classificados · Île Saint-Hubert · 2025</span>
        <h1 class="title">
          <span class="title__pre">Espécime Híbrido Terminal D-Rex</span>
          <span class="title__main">Distortus rex</span>
          <span class="title__post">— "A Aberração Final"</span>
        </h1>

        <p class="lede">
          O maior, mais deformado e mais perigoso teropoda já sintetizado. Resultado catastrófico
          do programa <em>Project Mutagen</em> conduzido pela InGen na <strong>Ilha Mutanio</strong>,
          um arquipélago esquecido onde experimentos descartados foram exilados. O Distortus rex
          ultrapassa qualquer escala anterior de criatura conhecida.
        </p>

        <div class="audio-plate" data-testid="distortus-audio">
          <div class="audio-plate__label">
            <span class="dot"></span>
            Registro Sonoro · Bramido Subsônico
          </div>
          <audio controls preload="metadata" :src="roar"></audio>
        </div>
      </div>
    </header>

    <section class="ledger">
      <h2 class="section-title"><span>I.</span> Ficha de Catalogação</h2>
      <div class="ledger__grid">
        <div class="stat"><dt>Classificação</dt><dd>Theropoda Mutagen-Class</dd></div>
        <div class="stat"><dt>Era de Concepção</dt><dd>2009 – 2014</dd></div>
        <div class="stat"><dt>Comprimento</dt><dd>20 – 22 m</dd></div>
        <div class="stat"><dt>Altura</dt><dd>~9 m (cabeça)</dd></div>
        <div class="stat"><dt>Massa estimada</dt><dd>14 – 16 toneladas</dd></div>
        <div class="stat"><dt>Velocidade</dt><dd>até 35 km/h</dd></div>
        <div class="stat"><dt>Dieta</dt><dd>Hipercarnívora oportunista</dd></div>
        <div class="stat status warning"><dt>Status</dt><dd>Em contenção · Vivo</dd></div>
      </div>
    </section>

    <section class="genome">
      <h2 class="section-title"><span>II.</span> Composição Genética</h2>
      <p class="genome__intro">
        Síntese mutagênica catastrófica — múltiplas camadas de DNA combinadas com
        sequências sintéticas instáveis. <em>Nenhum geneticista subsequente conseguiu
        replicar o resultado.</em>
      </p>
      <ul class="genome__list">
        <li v-for="g in genome" :key="g.name">
          <span class="genome__name">{{ g.name }}</span>
          <span class="genome__trait">{{ g.trait }}</span>
        </li>
      </ul>
    </section>

    <section class="behavior">
      <h2 class="section-title"><span>III.</span> Anomalias Morfológicas</h2>
      <div class="behavior__grid">
        <article>
          <h3>Membros supranumerários</h3>
          <p>
            Apresenta <strong>cinco braços funcionais</strong>: dois pares dianteiros mais um membro
            atrofiado emergindo do esterno. Cada par opera com graus diferentes de coordenação
            motora; o conjunto inferior é responsável por dilacerar presas já imobilizadas.
          </p>
        </article>
        <article>
          <h3>Crânio bipartido</h3>
          <p>
            Estrutura craniana fissurada em dois lóbulos parcialmente independentes,
            sugerindo <em>dois feixes neurais semi-autônomos</em>. Captura por radiografia
            mostra atividade cerebral assimétrica durante o sono.
          </p>
        </article>
        <article>
          <h3>Pele queratinizada irregular</h3>
          <p>
            Placas dérmicas distribuídas caoticamente, com regiões de exoesqueleto inseto-derivado
            sobre couro escamoso. Resistente a calibres antitanque leves; vulnerável apenas
            nas articulações expostas.
          </p>
        </article>
      </div>
    </section>

    <section class="combat">
      <h2 class="section-title"><span>IV.</span> Capacidades de Combate</h2>
      <div class="combat__bars">
        <div v-for="s in stats" :key="s.label" class="bar">
          <div class="bar__top"><span>{{ s.label }}</span><span>{{ s.value }}/10</span></div>
          <div class="bar__track"><div class="bar__fill" :style="{ width: (s.value * 10) + '%' }"></div></div>
        </div>
      </div>
    </section>

    <section class="notes">
      <h2 class="section-title"><span>V.</span> Notas de Campo</h2>
      <ol class="notes__list">
        <li>Sobrevive a mais de uma década em isolamento total, sem registro de alimentação contínua.</li>
        <li>Emissões vocais ultrapassam 137 dB, abaixo da faixa audível humana — sentem-se como pressão torácica.</li>
        <li>Atinge a maturidade morfológica completa apenas aos 12 anos, indicando metabolismo retardado.</li>
        <li>O esqueleto contém densidade óssea 4× superior à de um T. rex de mesma proporção.</li>
        <li>Localizado no setor sul da Ilha Mutanio · acesso interditado por protocolo internacional desde 2025.</li>
      </ol>
    </section>

    <footer class="signature">
      <p>Arquivo restaurado · Departamento de Paleozoologia Híbrida</p>
      <p class="seal">— Museu de História Natural Bio-Sintética —</p>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import image from '@/assets/fiction/distortus.jpg'
import roar from '@/assets/sounds/Distortus rex sounds - Mazellmi (youtube).mp3'

const genome = [
  { name: 'Tyrannosaurus rex', trait: 'estrutura base do esqueleto' },
  { name: 'Giganotosaurus', trait: 'volumetria muscular abdominal' },
  { name: 'Indominus rex (resíduo)', trait: 'mutações dérmicas secundárias' },
  { name: 'Therizinosaurus', trait: 'múltiplos membros anteriores' },
  { name: 'Buthidae (Escorpião)', trait: 'placas exoesqueléticas dispersas' },
  { name: 'Architeuthis (Lula gigante)', trait: 'crescimento sem limite definido' },
  { name: 'DNA sintético InGen', trait: 'instabilidade celular permanente' }
]

const stats = [
  { label: 'Força bruta', value: 10 },
  { label: 'Velocidade', value: 4 },
  { label: 'Inteligência', value: 6 },
  { label: 'Furtividade', value: 3 },
  { label: 'Resistência', value: 10 },
  { label: 'Agressividade', value: 10 }
]

const router = useRouter()
function goBack() {
  router.push('/home')
}
</script>

<style scoped>
.museum-page {
  --paper: #d9c79a; --gold: #c9a557; --gold-bright: #e8c97a; --gold-deep: #8a6a22;
  --ink: #e9ddc1; --ink-soft: #b3a585; --rule: rgba(201, 165, 87, 0.32);
  position:relative; min-height:100vh;
  background:
    radial-gradient(1200px 700px at 20% -10%, rgba(201,165,87,0.10), transparent 60%),
    radial-gradient(900px 600px at 110% 30%, rgba(138,106,34,0.08), transparent 60%),
    linear-gradient(180deg, #0b0805 0%, #120c06 100%);
  color: var(--ink); font-family: 'Cormorant Garamond', 'EB Garamond', Georgia, serif; overflow-x:hidden;
}
.grain { pointer-events:none; position:fixed; inset:0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.85  0 0 0 0 0.72  0 0 0 0 0.42  0 0 0 0.08 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  opacity:0.55; mix-blend-mode:overlay; z-index:1; }
.vignette { pointer-events:none; position:fixed; inset:0; background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%); z-index:1; }

.hero { position:relative; z-index:2; display:grid; grid-template-columns: 1fr 1.05fr; gap:64px; padding:88px 7vw 64px; max-width:1500px; margin:0 auto; }
.hero__media { position:relative; aspect-ratio:4/5; border:1px solid var(--rule); order:2;
  box-shadow: 0 30px 90px rgba(0,0,0,0.6), inset 0 0 0 6px rgba(201,165,87,0.08); }
.hero__img { width:100%; height:100%; object-fit:cover; filter: contrast(1.05) saturate(0.9) sepia(0.15); }
.hero__fade { position:absolute; inset:0; background: linear-gradient(180deg, transparent 50%, rgba(11,8,5,0.85) 100%); }
.hero__content { display:flex; flex-direction:column; justify-content:center; order:1; }
.kicker { display:inline-block; font-family:'Courier New', monospace; font-size:11px; letter-spacing:0.35em; text-transform:uppercase; color:var(--gold-bright); border-top:1px solid var(--rule); border-bottom:1px solid var(--rule); padding:8px 0; width:max-content; margin-bottom:28px; }
.title { font-weight:400; line-height:1; margin:0 0 24px; }
.title__pre { display:block; font-size:14px; letter-spacing:0.4em; text-transform:uppercase; color:var(--ink-soft); margin-bottom:14px; }
.title__main { display:block; font-size:clamp(48px, 6vw, 86px); font-style:italic;
  background: linear-gradient(180deg, #f1d98a 0%, #c9a557 55%, #8a6a22 100%);
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.title__post { display:block; font-size:18px; color:var(--ink-soft); margin-top:10px; letter-spacing:0.08em; }
.lede { font-size:20px; line-height:1.7; max-width:56ch; margin:0 0 36px; }
.lede em { color:var(--gold-bright); font-style:italic; } .lede strong { color:var(--paper); font-weight:600; }

.audio-plate { border:1px solid var(--rule); background: linear-gradient(180deg, rgba(201,165,87,0.06), rgba(0,0,0,0.4)); padding:18px 20px; position:relative; }
.audio-plate::before, .audio-plate::after { content:""; position:absolute; width:6px; height:6px; background:var(--gold); border-radius:50%; }
.audio-plate::before { top:8px; left:8px; } .audio-plate::after { bottom:8px; right:8px; }
.audio-plate__label { font-family:'Courier New', monospace; font-size:11px; letter-spacing:0.3em; text-transform:uppercase; color:var(--gold-bright); margin-bottom:12px; display:flex; align-items:center; gap:10px; }
.dot { width:8px; height:8px; border-radius:50%; background:#d94c2b; box-shadow:0 0 8px #d94c2b; animation: pulse 1.6s infinite; }
@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
.audio-plate audio { width:100%; filter: sepia(0.3) hue-rotate(-10deg) saturate(0.9); }

.section-title { font-family:'Cinzel', serif; font-size:28px; letter-spacing:0.18em; text-transform:uppercase; color:var(--gold-bright); margin:0 0 36px; display:flex; align-items:baseline; gap:18px; }
.section-title span { font-family:'Courier New', monospace; font-size:14px; color:var(--gold-deep); letter-spacing:0; }
.section-title::after { content:""; flex:1; height:1px; background:var(--rule); margin-left:10px; }
section { position:relative; z-index:2; padding:64px 7vw; max-width:1500px; margin:0 auto; }

.ledger__grid { display:grid; grid-template-columns: repeat(4, 1fr); border-top:1px solid var(--rule); border-left:1px solid var(--rule); }
.stat { padding:22px 20px; border-right:1px solid var(--rule); border-bottom:1px solid var(--rule); background: linear-gradient(180deg, rgba(201,165,87,0.03), transparent); }
.stat dt { font-family:'Courier New', monospace; font-size:10px; letter-spacing:0.3em; text-transform:uppercase; color:var(--ink-soft); margin-bottom:8px; }
.stat dd { margin:0; font-size:22px; color:var(--paper); font-style:italic; }
.stat.status dd { color:#d94c2b; }
.stat.warning dd { color:#e8a440; }

.genome__intro { font-size:18px; color:var(--ink-soft); max-width:60ch; margin:0 0 28px; }
.genome__intro em { color:var(--gold-bright); }
.genome__list { list-style:none; padding:0; display:grid; grid-template-columns: repeat(2,1fr); }
.genome__list li { display:flex; justify-content:space-between; align-items:baseline; padding:14px 0; border-bottom:1px dashed var(--rule); gap:20px; }
.genome__name { font-size:20px; color:var(--gold-bright); font-style:italic; }
.genome__trait { color:var(--ink-soft); font-size:15px; text-align:right; }

.behavior__grid { display:grid; grid-template-columns: repeat(3,1fr); gap:36px; }
.behavior__grid article { border-top:2px solid var(--gold); padding-top:18px; }
.behavior__grid h3 { font-family:'Cinzel', serif; color:var(--gold-bright); font-weight:500; letter-spacing:0.1em; text-transform:uppercase; font-size:15px; margin:0 0 12px; }
.behavior__grid p { font-size:17px; line-height:1.65; margin:0; }
.behavior__grid em { color: var(--gold-bright); } .behavior__grid strong { color: var(--paper); }

.combat__bars { display:grid; grid-template-columns: repeat(2,1fr); gap:28px 60px; }
.bar__top { display:flex; justify-content:space-between; font-family:'Courier New', monospace; font-size:12px; letter-spacing:0.2em; text-transform:uppercase; color:var(--ink-soft); margin-bottom:8px; }
.bar__top span:last-child { color:var(--gold-bright); }
.bar__track { height:6px; background:rgba(255,255,255,0.05); position:relative; overflow:hidden; }
.bar__fill { height:100%; background: linear-gradient(90deg, #8a6a22, #e8c97a, #c9a557); box-shadow:0 0 12px rgba(232,201,122,0.4); }

.notes__list { list-style:none; padding:0; counter-reset:n; }
.notes__list li { counter-increment:n; position:relative; padding:18px 0 18px 56px; border-bottom:1px solid var(--rule); font-size:18px; line-height:1.6; }
.notes__list li::before { content:counter(n, decimal-leading-zero); position:absolute; left:0; top:18px; font-family:'Courier New', monospace; color:var(--gold-bright); letter-spacing:0.1em; font-size:14px; }

.signature { text-align:center; padding:64px 7vw 88px; color:var(--ink-soft); position:relative; z-index:2; }
.signature p { margin:4px 0; font-family:'Courier New', monospace; font-size:11px; letter-spacing:0.3em; text-transform:uppercase; }
.signature .seal { color:var(--gold-bright); margin-top:14px; letter-spacing:0.4em; }

/* Back button — Brass museum plate */
.back-btn {
  position: fixed; top: 28px; left: 28px; z-index: 50;
  display: inline-flex; align-items: center; gap: 12px;
  padding: 12px 22px 12px 16px;
  font-family: 'Courier New', monospace;
  font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase;
  color: var(--gold-bright);
  background:
    linear-gradient(180deg, rgba(232,201,122,0.10) 0%, rgba(201,165,87,0.06) 50%, rgba(0,0,0,0.55) 100%);
  border: 1px solid var(--rule); cursor: pointer;
  backdrop-filter: blur(10px) saturate(1.1); -webkit-backdrop-filter: blur(10px) saturate(1.1);
  box-shadow:
    inset 0 1px 0 rgba(232,201,122,0.18),
    inset 0 -1px 0 rgba(0,0,0,0.35),
    0 12px 28px rgba(0,0,0,0.45);
  transition: color 260ms ease, border-color 260ms ease, transform 260ms ease, background 260ms ease, box-shadow 260ms ease, letter-spacing 260ms ease;
}
/* Nailheads dourados nos 4 cantos */
.back-btn::before, .back-btn::after {
  content: ""; position: absolute; width: 5px; height: 5px;
  background: radial-gradient(circle at 35% 35%, #f1d98a, #8a6a22 70%);
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(232,201,122,0.6);
}
.back-btn::before { top: 6px; left: 6px;  box-shadow: 0 0 4px rgba(232,201,122,0.6), 0 0 0 0 transparent; }
.back-btn::after  { bottom: 6px; right: 6px; }
/* Linha dourada animada na borda inferior */
.back-btn > .gleam {
  position: absolute; left: 12px; right: 12px; bottom: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-bright), transparent);
  opacity: 0; transition: opacity 320ms ease;
}
.back-btn:hover {
  color: #fff5cf; border-color: var(--gold-bright);
  transform: translateX(-3px) translateY(-1px);
  letter-spacing: 0.36em;
  background:
    linear-gradient(180deg, rgba(232,201,122,0.22) 0%, rgba(201,165,87,0.14) 50%, rgba(0,0,0,0.6) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255,245,207,0.35),
    inset 0 -1px 0 rgba(0,0,0,0.4),
    0 18px 36px rgba(0,0,0,0.55),
    0 0 24px rgba(232,201,122,0.18);
}
.back-btn:hover > .gleam { opacity: 1; }
.back-btn:active { transform: translateX(-4px) translateY(0); }
.back-btn svg { transition: transform 260ms cubic-bezier(.4,.0,.2,1); }
.back-btn:hover svg { transform: translateX(-4px); }
.back-btn:focus-visible { outline: 2px solid var(--gold-bright); outline-offset: 3px; }
@media (max-width: 560px) {
  .back-btn { top: 14px; left: 14px; padding: 10px 16px 10px 12px; font-size: 10px; letter-spacing: 0.22em; }
  .back-btn span { display: none; }
}

@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; padding-top:56px; gap:36px; }
  .hero__media { order:1; } .hero__content { order:2; }
  .ledger__grid, .behavior__grid, .combat__bars, .genome__list { grid-template-columns: 1fr 1fr; }
  .behavior__grid { grid-template-columns: 1fr; }
  .title__main { font-size: clamp(40px, 10vw, 64px); }
}
@media (max-width: 560px) { .ledger__grid, .combat__bars, .genome__list { grid-template-columns: 1fr; } }
</style>
