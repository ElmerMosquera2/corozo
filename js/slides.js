import { Parser } from './parser.js';

const state = {
  items: [],
  current: 0,
};

function esc(s) {
  return Parser.escapeHtml(s);
}

function fmt(text) {
  return Parser.formatInline(text);
}

/* ---------- Block renderers ---------- */

const Block = {
  p:      (b) => `<p${b.dim ? ' class="dim"' : ''}>${fmt(b.t)}</p>`,
  h1:     (b) => `<h1>${fmt(b.t)}</h1>`,
  h2:     (b) => `<h2>${fmt(b.t)}</h2>`,
  h3:     (b) => `<h3 class="sub">${fmt(b.t)}</h3>`,
  h4:     (b) => `<h4 class="sub">${fmt(b.t)}</h4>`,
  h5:     (b) => `<h5 class="sub">${fmt(b.t)}</h5>`,
  h6:     (b) => `<h6 class="sub">${fmt(b.t)}</h6>`,
  quote:  (b) => `<blockquote>${fmt(b.t)}</blockquote>`,
  list:   (b) => `<ul class="points">${b.items.map(i => `<li>${fmt(i)}</li>`).join('')}</ul>`,
  olist:  (b) => `<ol class="points">${b.items.map(i => `<li>${fmt(i)}</li>`).join('')}</ol>`,
  table:  (b) => b.html,
};

function renderBlocks(blocks) {
  return blocks.map(b => (Block[b.k] ? Block[b.k](b) : '')).join('');
}

/* ---------- Slide component ---------- */

function coverSlide(slide, index) {
  const imgStyle = slide.image ? ` style="--cover-img:url('${slide.image}')"` : '';
  return `<section class="slide cover"${imgStyle}>
    <div class="cover-inner">
      <div class="slide-body">
        <div>
          <h1>${esc(slide.title)}</h1>
          ${slide.subtitle ? `<p class="subtitle">${esc(slide.subtitle)}</p>` : ''}
        </div>
      </div>
    </div>
  </section>`;
}

function contentSlide(slide, index) {
  const hasImage = !!slide.image;
  return `<section class="slide">
    <div class="slide-body">
      ${slide.title ? `<div class="eyebrow">${esc(slide.label)}</div>
      <h2 class="title">${esc(slide.title)}</h2>` : ''}
      <div class="content-grid${hasImage ? '' : ' no-image'}">
        <div>${renderBlocks(slide.blocks)}</div>
        ${hasImage ? `<figure class="figure">
          <img src="${slide.image}" alt="" loading="lazy" onerror="this.closest('.figure').style.display='none'">
          <figcaption>Diapositiva ${index + 1}</figcaption>
        </figure>` : ''}
      </div>
    </div>
  </section>`;
}

function closingSlide(slide) {
  const quoteBlock = slide.blocks.find(b => b.k === 'quote');
  const quoteText = quoteBlock ? quoteBlock.t : (slide.blocks.find(b => b.k === 'p')?.t || '');
  return `<section class="slide closing">
    <div class="slide-body">
      <p class="closing-quote">${esc(quoteText)}</p>
    </div>
  </section>`;
}

function renderSlide(slide, index, total) {
  if (index === 0) return coverSlide(slide, index);
  const isLast = index === total - 1;
  const isShort = slide.blocks.length <= 2 && (slide.blocks.some(b => b.k === 'quote') || slide.blocks.every(b => b.k === 'p' || b.k === 'h2' || b.k === 'h3'));
  if (isLast && isShort) return closingSlide(slide);
  return contentSlide(slide, index);
}

/* ---------- Wave ---------- */

function seeded(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const BARS = 28;

function buildWave(progress) {
  const svg = document.getElementById('waveSvg');
  if (!svg) return;
  let bars = '';
  const baseH = 22;
  for (let i = 0; i < BARS; i++) {
    const noise = (seeded(i * 13.7 + 1) - 0.5) * 2;
    const h = baseH + noise * (1 - progress) * 18 + Math.sin(i / BARS * Math.PI) * progress * 6;
    const clamped = Math.max(3, h);
    const y = (46 - clamped) / 2;
    const x = i * (240 / BARS);
    const color = progress > 0.75 ? 'var(--teal)' : (progress > 0.35 ? '#c9905a' : 'var(--accent)');
    bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(240 / BARS - 2).toFixed(1)}" height="${clamped.toFixed(1)}" rx="1" fill="${color}"/>`;
  }
  svg.innerHTML = bars;
}

function updateSignal(progress) {
  const el = document.getElementById('signalState');
  if (el) {
    el.textContent = progress > 0.75 ? 'clara' : (progress > 0.35 ? 'ajustando' : 'ruido');
  }
}

/* ---------- Navigation ---------- */

function updateNav() {
  const counter = document.getElementById('slideCounter');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const total = state.items.length;

  if (counter) counter.textContent = `${state.current + 1} / ${total}`;
  if (prevBtn) prevBtn.disabled = state.current === 0;
  if (nextBtn) nextBtn.disabled = state.current === total - 1;

  if (total > 1) {
    const progress = state.current / (total - 1);
    buildWave(progress);
    updateSignal(progress);
  }
}

function updateProgressList() {
  const list = document.getElementById('progressList');
  if (!list) return;
  list.innerHTML = state.items.map((s, i) =>
    `<li data-i="${i}"><button><span class="dot"></span><span class="p-label">${String(i + 1).padStart(2, '0')} · ${esc(s.label)}</span></button></li>`
  ).join('');
  const items = list.querySelectorAll('li');
  items.forEach((n, i) => {
    n.classList.toggle('is-active', i === state.current);
    n.classList.toggle('is-done', i < state.current);
  });
}

function showSlide(index) {
  state.current = Math.max(0, Math.min(index, state.items.length - 1));

  const container = document.getElementById('slidesContainer');
  if (!container) return;

  const nodes = container.querySelectorAll('.slide');
  nodes.forEach((node, i) => {
    node.classList.toggle('active', i === state.current);
  });

  updateProgressList();
  updateNav();

  const active = nodes[state.current];
  if (active) active.scrollTop = 0;
}

function render(markdown) {
  const parsed = Parser.buildSlides(markdown);
  state.items = parsed;
  state.current = 0;

  const container = document.getElementById('slidesContainer');
  if (!container) return 0;

  parsed.forEach((slide, i) => {
    slide.label = slide.title || `Diapositiva ${i + 1}`;
  });

  container.innerHTML = parsed.map((slide, i) =>
    renderSlide(slide, i, parsed.length)
  ).join('');

  const nodes = container.querySelectorAll('.slide');
  if (nodes[0]) nodes[0].classList.add('active');

  updateProgressList();
  updateNav();
  return parsed.length;
}

function next() { showSlide(state.current + 1); }
function prev() { showSlide(state.current - 1); }

function getItems()   { return state.items; }
function getCurrent() { return state.current; }

export const Slides = {
  render,
  showSlide,
  next,
  prev,
  getItems,
  getCurrent,
  buildWave,
};
