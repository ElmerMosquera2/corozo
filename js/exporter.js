function esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmt(text) {
  let result = esc(text);
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/_(.+?)_/g, '<em>$1</em>');
  return result;
}

function renderBlocks(blocks) {
  return blocks.map(b => {
    switch (b.k) {
      case 'p': return `<p>${fmt(b.t)}</p>`;
      case 'h1': return `<h1>${fmt(b.t)}</h1>`;
      case 'h2': return `<h2>${fmt(b.t)}</h2>`;
      case 'h3': return `<h3 class="sub">${fmt(b.t)}</h3>`;
      case 'h4': return `<h4 class="sub">${fmt(b.t)}</h4>`;
      case 'h5': return `<h5 class="sub">${fmt(b.t)}</h5>`;
      case 'h6': return `<h6 class="sub">${fmt(b.t)}</h6>`;
      case 'quote': return `<blockquote>${fmt(b.t)}</blockquote>`;
      case 'list': return `<ul class="points">${b.items.map(i => `<li>${fmt(i)}</li>`).join('')}</ul>`;
      case 'olist': return `<ol class="points">${b.items.map(i => `<li>${fmt(i)}</li>`).join('')}</ol>`;
      case 'table': return b.html;
      default: return '';
    }
  }).join('');
}

function toStandaloneHtml(slides, design) {
  const fontFamily = design.fontFamily || "'Inter', sans-serif";
  const scale = design.scale || 1;
  const textAlign = design.textAlign || "left";

  const slideHtml = slides.map((slide, i) => {
    const isCover = i === 0;
    const isLast = i === slides.length - 1;
    const isShort = slide.blocks.length <= 2 && (slide.blocks.some(b => b.k === 'quote') || slide.blocks.every(b => b.k === 'p' || b.k === 'h2' || b.k === 'h3'));
    const isClosing = isLast && isShort;

    let html = '';
    if (isCover) {
      const imgStyle = slide.image ? ` style="--cover-img:url('${esc(slide.image)}')"` : '';
      html = `<section class="slide cover"${imgStyle}>
        <div class="cover-inner">
          <div class="slide-body">
            <div>
              <h1>${esc(slide.title)}</h1>
              ${slide.subtitle ? `<p class="subtitle">${esc(slide.subtitle)}</p>` : ''}
            </div>
          </div>
        </div>
      </section>`;
    } else if (isClosing) {
      const quoteBlock = slide.blocks.find(b => b.k === 'quote');
      const qt = quoteBlock ? quoteBlock.t : (slide.blocks.find(b => b.k === 'p')?.t || '');
      html = `<section class="slide closing">
        <div class="slide-body">
          <p class="closing-quote">${esc(qt)}</p>
        </div>
      </section>`;
    } else {
      const hasImage = !!slide.image;
      const label = slide.label || slide.title || `Diapositiva ${i + 1}`;
      html = `<section class="slide">
        <div class="slide-body">
          ${slide.title ? `<div class="eyebrow">${esc(label)}</div>
          <h2 class="title">${esc(slide.title)}</h2>` : ''}
          <div class="content-grid${hasImage ? '' : ' no-image'}">
            <div>${renderBlocks(slide.blocks)}</div>
            ${hasImage ? `<figure class="figure">
              <img src="${esc(slide.image)}" alt="" loading="lazy">
              <figcaption>Diapositiva ${i + 1}</figcaption>
            </figure>` : ''}
          </div>
        </div>
      </section>`;
    }
    return html;
  }).join('\n');

  const slideData = slides.map(s => ({
    title: s.title,
    label: s.label,
    image: s.image,
    subtitle: s.subtitle,
    blocks: s.blocks,
  }));
  const escapedData = JSON.stringify(slideData).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Presentación Corozo</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#0f1119;
    --bg-rail:#14171f;
    --panel:#171a23;
    --ink:#f3efe4;
    --ink-dim:#9aa0b4;
    --ink-faint:#5b6076;
    --accent:#ff7a45;
    --accent-soft:rgba(255,122,69,.14);
    --teal:#4fb6a4;
    --line:#262b38;
    --serif:'Fraunces', serif;
    --sans:'Inter', sans-serif;
    --mono:'IBM Plex Mono', monospace;
    --slide-scale:${scale};
    --slide-font:${fontFamily};
    --slide-align:${textAlign};
  }
  *{box-sizing:border-box;}
  html,body{height:100%;}
  body{
    margin:0; background:var(--bg); color:var(--ink); font-family:var(--sans);
    display:flex; flex-direction:column; overflow:hidden;
    height:100dvh; min-height:100vh;
  }
  body::before{
    content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
    background:
      radial-gradient(ellipse 60% 50% at 85% 0%, rgba(255,122,69,.07), transparent 60%),
      radial-gradient(ellipse 50% 40% at 0% 100%, rgba(79,182,164,.06), transparent 60%);
  }
  .app{flex:1; display:flex; min-height:0; position:relative; z-index:1;}
  .stage{flex:1; min-width:0; display:flex; flex-direction:column;}
  .slides{flex:1; position:relative; overflow:hidden;}
  .slide{
    position:absolute; inset:0; overflow:auto; display:none;
    padding:4.2rem 5rem 3rem;
    font-family:var(--slide-font);
  }
  .slide-body{
    transform-origin:top center;
    transform:scale(var(--slide-scale));
    text-align:var(--slide-align, left);
  }
  .cover .slide-body,
  .slide.closing .slide-body{
    transform-origin:center center;
  }
  .slide.active{display:block; animation:rise .5s cubic-bezier(.16,1,.3,1);}
  @keyframes rise{from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:translateY(0);}}
  .eyebrow{
    font-family:var(--mono); font-size:.72rem; letter-spacing:.16em; text-transform:uppercase;
    color:var(--accent); margin-bottom:1.1rem; display:flex; align-items:center; gap:.6rem;
  }
  .eyebrow::before{content:''; width:18px; height:1px; background:var(--accent);}
  .slide h1, .slide h2.title{
    font-family:var(--serif); font-weight:600; line-height:1.08;
    font-size:clamp(2rem, 3.6vw, 3.1rem); margin:0 0 .5rem; max-width:18ch;
  }
  .subtitle{font-size:1.15rem; color:var(--ink-dim); max-width:46ch; margin:.6rem 0 0; line-height:1.6;}
  .content-grid{display:grid; grid-template-columns:1.3fr .8fr; gap:3rem; margin-top:2.2rem; align-items:start;}
  .content-grid.no-image{grid-template-columns:1fr; max-width:62ch;}
  .slide p{font-size:1.05rem; line-height:1.75; color:var(--ink); margin:0 0 1rem; max-width:58ch;}
  .slide p.dim{color:var(--ink-dim);}
  h3.sub{
    font-family:var(--mono); font-size:.78rem; letter-spacing:.06em; text-transform:uppercase;
    color:var(--ink-dim); margin:1.5rem 0 .7rem; padding-bottom:.4rem; border-bottom:1px solid var(--line);
  }
  ul.points, ol.points{list-style:none; margin:0 0 .4rem; padding:0;}
  ul.points li, ol.points li{
    position:relative; padding-left:1.5rem; margin-bottom:.65rem; line-height:1.6; font-size:1.02rem; color:var(--ink);
  }
  ul.points li::before{
    content:''; position:absolute; left:0; top:.55em; width:7px; height:7px; border-radius:1px;
    background:var(--teal); transform:rotate(45deg);
  }
  ol.points li::before{
    content:''; position:absolute; left:0; top:.55em; width:7px; height:7px; border-radius:50%;
    background:var(--teal);
  }
  blockquote{
    margin:1.6rem 0 0; padding:1.1rem 1.4rem; border-left:2px solid var(--accent);
    font-family:var(--serif); font-style:italic; font-size:1.18rem; line-height:1.6;
    color:var(--ink); background:rgba(255,122,69,.05); max-width:56ch;
  }
  .figure{
    border:1px solid var(--line); border-radius:14px; overflow:hidden; background:var(--panel);
  }
  .figure img{width:100%; height:230px; object-fit:cover; display:block;}
  .figure figcaption{
    font-family:var(--mono); font-size:.68rem; letter-spacing:.08em; text-transform:uppercase;
    color:var(--ink-faint); padding:.7rem .9rem; border-top:1px solid var(--line);
  }
  .slide.cover{padding:0; display:none;}
  .slide.cover.active{display:flex;}
  .cover-inner{
    flex:1; display:flex; align-items:center; position:relative; padding:3.6rem 5rem;
    background:linear-gradient(180deg, rgba(15,17,25,.15), rgba(15,17,25,.92) 78%), var(--cover-img, none) center/cover no-repeat;
  }
  .cover h1{font-size:clamp(2.4rem, 5vw, 4.2rem); max-width:16ch;}
  .slide.closing{padding:3rem 6rem;}
  .slide.closing.active{display:flex; align-items:center; justify-content:center;}
  .closing-quote{
    font-family:var(--serif); font-style:italic; font-weight:500;
    font-size:clamp(1.5rem, 3vw, 2.3rem); line-height:1.45; max-width:34ch;
    color:var(--ink); position:relative;
  }
  .closing-quote::before{content:'\\201c'; color:var(--accent); font-size:1.4em; display:block; margin-bottom:.1em; font-family:var(--serif);}
  .controls{
    display:flex; align-items:center; gap:1rem; padding:1rem 2.4rem;
    border-top:1px solid var(--line); background:var(--bg-rail);
  }
  .nav-btn{
    all:unset; cursor:pointer; font-family:var(--mono); font-size:.78rem; letter-spacing:.04em;
    color:var(--ink); display:flex; align-items:center; gap:.5rem; padding:.55rem 1.1rem;
    border:1px solid var(--line); border-radius:999px; transition:border-color .15s, color .15s;
  }
  .nav-btn:hover:not(:disabled){border-color:var(--accent); color:var(--accent);}
  .nav-btn:focus-visible{outline:2px solid var(--accent); outline-offset:2px;}
  .nav-btn:disabled{opacity:.3; cursor:not-allowed;}
  .counter{font-family:var(--mono); font-size:.74rem; color:var(--ink-faint); margin-left:auto;}
  .hint{font-family:var(--mono); font-size:.7rem; color:var(--ink-faint);}
  table{width:100%; border-collapse:collapse; margin:.5rem 0;}
  th,td{border:1px solid var(--line); padding:.5rem .7rem; text-align:left; font-size:.9rem; color:var(--ink-dim);}
  th{color:var(--ink); background:rgba(255,255,255,.03);}
  .slide img:not(.figure img){max-width:80%; border-radius:8px; display:block; margin:.5rem auto;}
  @media (prefers-reduced-motion:reduce){.slide.active{animation:none;}}
  @media (max-width:880px){
    .slide{padding:2.2rem 1.4rem 1.6rem;}
    .content-grid{grid-template-columns:1fr; gap:1.4rem;}
    .figure img{height:180px;}
    .controls{padding:.85rem 1.2rem;}
    .hint{display:none;}
  }
</style>
</head>
<body>
<div class="app">
  <div class="stage">
    <div class="slides" id="slides"></div>
    <div class="controls">
      <button class="nav-btn" id="prev">&larr; Anterior</button>
      <button class="nav-btn" id="next">Siguiente &rarr;</button>
      <span class="hint">usa las flechas del teclado</span>
      <span class="counter" id="counter"></span>
    </div>
  </div>
</div>
<script>
var slides = ${escapedData};
var container = document.getElementById('slides');
var counter = document.getElementById('counter');
var prev = document.getElementById('prev');
var next = document.getElementById('next');
var current = 0;

function renderSlide(s, i, total) {
  if (i === 0) {
    var imgStyle = s.image ? ' style="--cover-img:url(' + JSON.stringify(s.image) + ')"' : '';
    return '<section class="slide cover"' + imgStyle + '><div class="cover-inner"><div class="slide-body"><div><h1>' + esc(s.title) + '</h1>' + (s.subtitle ? '<p class="subtitle">' + esc(s.subtitle) + '</p>' : '') + '</div></div></div></section>';
  }
  var isLast = i === total - 1;
  var isShort = s.blocks.length <= 2 && (s.blocks.some(function(b){return b.k==='quote';}) || s.blocks.every(function(b){return b.k==='p'||b.k==='h2'||b.k==='h3';}));
  if (isLast && isShort) {
    var qt = '';
    for (var b = 0; b < s.blocks.length; b++) { if (s.blocks[b].k === 'quote') { qt = s.blocks[b].t; break; } }
    if (!qt) { for (var b = 0; b < s.blocks.length; b++) { if (s.blocks[b].k === 'p') { qt = s.blocks[b].t; break; } } }
    return '<section class="slide closing"><div class="slide-body"><p class="closing-quote">' + esc(qt) + '</p></div></section>';
  }
  var hasImage = !!s.image;
  var bodyHtml = renderBlocks(s.blocks);
  var lbl = s.label || s.title || 'Diapositiva ' + (i + 1);
  return '<section class="slide"><div class="slide-body">' + (s.title ? '<div class="eyebrow">' + esc(lbl) + '</div><h2 class="title">' + esc(s.title) + '</h2>' : '') + '<div class="content-grid' + (hasImage ? '' : ' no-image') + '"><div>' + bodyHtml + '</div>' + (hasImage ? '<figure class="figure"><img src="' + esc(s.image) + '" alt="" loading="lazy"><figcaption>Diapositiva ' + (i+1) + '</figcaption></figure>' : '') + '</div></div></section>';
}

function fmt(t) {
  return esc(t).replace(/\\*\\*(.+?)\\*\\*/g,'<strong>$1</strong>').replace(/_(.+?)_/g,'<em>$1</em>');
}
function renderBlocks(blocks) {
  var html = '';
  for (var i = 0; i < blocks.length; i++) {
    var b = blocks[i];
    switch (b.k) {
      case 'p': html += '<p>' + fmt(b.t) + '</p>'; break;
      case 'h1': html += '<h1>' + fmt(b.t) + '</h1>'; break;
      case 'h2': html += '<h2>' + fmt(b.t) + '</h2>'; break;
      case 'h3': html += '<h3 class="sub">' + fmt(b.t) + '</h3>'; break;
      case 'h4': html += '<h4 class="sub">' + fmt(b.t) + '</h4>'; break;
      case 'h5': html += '<h5 class="sub">' + fmt(b.t) + '</h5>'; break;
      case 'h6': html += '<h6 class="sub">' + fmt(b.t) + '</h6>'; break;
      case 'quote': html += '<blockquote>' + fmt(b.t) + '</blockquote>'; break;
      case 'list': html += '<ul class="points">'; for (var j = 0; j < b.items.length; j++) { html += '<li>' + fmt(b.items[j]) + '</li>'; } html += '</ul>'; break;
      case 'olist': html += '<ol class="points">'; for (var j = 0; j < b.items.length; j++) { html += '<li>' + fmt(b.items[j]) + '</li>'; } html += '</ol>'; break;
      case 'table': html += b.html; break;
    }
  }
  return html;
}

function esc(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function show(idx) {
  current = Math.max(0, Math.min(idx, slides.length - 1));
  var nodes = container.children;
  for (var i = 0; i < nodes.length; i++) { nodes[i].classList.toggle('active', i === current); }
  prev.disabled = current === 0;
  next.disabled = current === slides.length - 1;
  counter.textContent = (current + 1) + ' / ' + slides.length;
  if (nodes[current]) nodes[current].scrollTop = 0;
}

container.innerHTML = slides.map(function(s, i) { return renderSlide(s, i, slides.length); }).join('');
if (container.firstChild) container.firstChild.classList.add('active');
prev.addEventListener('click', function(){ show(current - 1); });
next.addEventListener('click', function(){ show(current + 1); });
document.addEventListener('keydown', function(e){
  if (e.key === 'ArrowLeft') show(current - 1);
  if (e.key === 'ArrowRight') show(current + 1);
});
show(0);
<\/script>
</body>
</html>`;
}

function download(slides, design) {
  const html = toStandaloneHtml(slides, design);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "presentacion-corozo.html";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const Exporter = {
  toStandaloneHtml,
  download,
};
