import { readFileSync, writeFileSync } from 'node:fs';

const ICONS = 'C:/Users/lucas/Desktop/arkan-icons/icons/';
const inner = (n) => readFileSync(ICONS + n + '.svg', 'utf8').replace(/^\uFEFF/, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
const ic = (n, s = 16, extra = '') => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ${extra}>${inner(n)}</svg>`;
const label = (n) => n.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

// --- minimal path parser: anchors + handle lines, for the Points card ---
function pathPoints(d) {
  const t = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g);
  const A = [], H = [];
  let i = 0, cx = 0, cy = 0, sx = 0, sy = 0, cmd = '', lc = null;
  const n = () => parseFloat(t[i++]);
  while (i < t.length) {
    if (/[a-zA-Z]/.test(t[i])) cmd = t[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    const ox = rel ? cx : 0, oy = rel ? cy : 0;
    if (C === 'Z') { cx = sx; cy = sy; lc = null; continue; }
    if (C === 'M') { cx = ox + n(); cy = oy + n(); sx = cx; sy = cy; A.push([cx, cy]); cmd = rel ? 'l' : 'L'; lc = null; continue; }
    if (C === 'L') { cx = ox + n(); cy = oy + n(); }
    else if (C === 'H') { cx = (rel ? cx : 0) + n(); }
    else if (C === 'V') { cy = (rel ? cy : 0) + n(); }
    else if (C === 'C' || C === 'S') {
      let x1, y1;
      if (C === 'C') { x1 = ox + n(); y1 = oy + n(); } else { x1 = lc ? 2 * cx - lc[0] : cx; y1 = lc ? 2 * cy - lc[1] : cy; }
      const x2 = ox + n(), y2 = oy + n(), x = ox + n(), y = oy + n();
      H.push([cx, cy, x1, y1], [x, y, x2, y2]); lc = [x2, y2]; cx = x; cy = y; A.push([cx, cy]); continue;
    } else if (C === 'Q') { const x1 = ox + n(), y1 = oy + n(); cx = ox + n(); cy = oy + n(); H.push([cx, cy, x1, y1]); }
    else if (C === 'A') { n(); n(); n(); n(); n(); cx = ox + n(); cy = oy + n(); }
    lc = null; A.push([cx, cy]);
  }
  return { A, H };
}
function iconPoints(name) {
  const s = inner(name); const A = [], H = [];
  for (const m of s.matchAll(/<path[^>]*\sd="([^"]+)"/g)) { const p = pathPoints(m[1]); A.push(...p.A); H.push(...p.H); }
  for (const m of s.matchAll(/<circle[^>]*>/g)) { const g = (k) => +m[0].match(new RegExp(`\\s${k}="([^"]+)"`))[1]; const [x, y, r] = [g('cx'), g('cy'), g('r')]; A.push([x, y - r], [x + r, y], [x, y + r], [x - r, y]); }
  for (const m of s.matchAll(/<rect[^>]*>/g)) { const g = (k, d = 0) => { const r = m[0].match(new RegExp(`\\s${k}="([^"]+)"`)); return r ? +r[1] : d; }; const [x, y, w, h, r] = [g('x'), g('y'), g('width'), g('height'), g('rx')]; A.push([x + r, y], [x + w - r, y], [x + w, y + r], [x + w, y + h - r], [x + w - r, y + h], [x + r, y + h], [x, y + h - r], [x, y + r]); }
  for (const m of s.matchAll(/<line[^>]*>/g)) { const g = (k) => +m[0].match(new RegExp(`\\s${k}="([^"]+)"`))[1]; A.push([g('x1'), g('y1')], [g('x2'), g('y2')]); }
  const key = (p) => p.map((v) => v.toFixed(3)).join(',');
  return { A: [...new Map(A.map((p) => [key(p), p])).values()], H };
}
const grid16 = (cls = 'grid') => `<g class="${cls}">${Array.from({ length: 15 }, (_, i) => i + 1).map((i) => `<line x1="${i}" y1="0" x2="${i}" y2="16"/><line x1="0" y1="${i}" x2="16" y2="${i}"/>`).join('')}</g>`;
const keylines = `<g class="kl"><circle cx="8" cy="8" r="6"/><rect x="2.25" y="2.25" width="11.5" height="11.5" rx="2"/><rect x="3" y="1.75" width="10" height="12.5" rx="2"/><rect x="1.75" y="3" width="12.5" height="10" rx="2"/></g>`;

const POINTS_ICON = 'heart';
const pts = iconPoints(POINTS_ICON);
const pointsSvg = `<svg viewBox="0 0 16 16" width="210" height="210" class="pts">${grid16()}<g class="ink" fill="none" stroke="#ececef" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner(POINTS_ICON)}</g><g fill="none" stroke="#18181b" stroke-width=".06">${inner(POINTS_ICON)}</g>
<g class="hd">${pts.H.map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}"/><circle cx="${c}" cy="${d}" r=".16"/>`).join('')}</g>
<g class="an">${pts.A.map(([x, y]) => `<rect x="${x - 0.2}" y="${y - 0.2}" width=".4" height=".4" rx=".06"/>`).join('')}</g></svg>`;

const KL_ICONS = ['calendar', 'settings', 'bell', 'user', 'inbox'];
const klData = Object.fromEntries(KL_ICONS.map((n) => [n, inner(n)]));
const SOLID = ['user', 'calendar', 'flag', 'tag', 'priority-high', 'circle-check', 'lock', 'thumbs-up'];

const card = (id, title, line, stage, ctrls = '') => `<div class="cc" id="${id}"><div class="cc-stage">${stage}${ctrls ? `<div class="ctrls">${ctrls}</div>` : ''}</div><div class="cc-foot"><div><b>${title}</b><p>${line}</p></div><span class="soon">Article soon</span></div></div>`;

const cards = `<div class="cc-grid">
${card('c-key', 'Keylines', 'Four shapes under every icon. Hover to see them.',
  `<div class="kl-wrap"><svg viewBox="0 0 16 16" width="170" height="170">${grid16()}${keylines}<g id="kl-ink" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner('calendar')}</g></svg></div>`,
  KL_ICONS.map((n, i) => `<button data-kl="${n}" class="${i ? '' : 'on'}">${ic(n, 16)}</button>`).join(''))}
${card('c-stroke', 'One stroke', 'Tuned for 16 and 20. Bigger, the stroke scales with the icon, or you pin it at 1.5.',
  `<div class="st-wrap"><div class="st-row"><span id="st-icon">${ic('bell', 32, 'id="st-svg"')}</span></div><div class="readout"><span id="st-size">32px</span> · stroke <b id="st-w">1.5px</b></div></div>`,
  `<input type="range" min="16" max="64" value="32" id="st-range"/><button id="st-abs">scaled</button>`)}
${card('c-opt', 'Looks right', 'A circle drawn the same size as a square reads smaller.',
  `<div class="op-wrap"><svg viewBox="0 0 34 16" width="204" height="96"><line class="guide" x1="0" y1="2.25" x2="34" y2="2.25"/><line class="guide" x1="0" y1="13.75" x2="34" y2="13.75"/><rect x="1.25" y="2.25" width="11.5" height="11.5" rx="2" class="shape"/><circle id="op-c" cx="25" cy="8" r="5.75" class="shape"/></svg><div class="readout" id="op-r">Equal on paper: 11.5 and 11.5</div></div>`,
  `<button data-op="math" class="on">On paper</button><button data-op="eye">By eye</button>`)}
${card('c-solid', 'Solid accents', 'One solid part per icon gives it weight at 16px.',
  `<div class="so-wrap" id="so">${SOLID.map((n) => `<span>${ic(n, 28)}</span>`).join('')}</div>`,
  `<button id="so-t" class="on">Accents on</button>`)}
${card('c-ctx', 'In context', 'Made for menus, not posters.',
  `<div class="cx-wrap" id="cx"><div class="mini-menu">${['inbox', 'user-arrow', 'calendar', 'tag', 'archive'].map((x, i) => `<div class="${i === 2 ? 'hov' : ''}">${ic(x, 16)}<span>${['Inbox', 'Assign to…', 'Due date', 'Labels', 'Archive'][i]}</span><kbd>${['G I', 'A', 'D', 'L', 'E'][i]}</kbd></div>`).join('')}</div></div>`,
  `<button data-cx="lt" class="on">Light</button><button data-cx="dk">Dark</button>`)}
${card('c-pts', 'Points', `Every anchor on a quarter-pixel grid. ${pts.A.length} on ${POINTS_ICON}.`,
  `<div class="pt-wrap" id="pt">${pointsSvg}</div>`,
  `<button id="pt-h">Show handles</button>`)}
</div>`;

const css = `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet"><style>
.cwrap{max-width:780px;font:15px/1.6 Inter,ui-sans-serif,system-ui,sans-serif;color:#18181b;background:#fafafa;border:1px solid #e4e4e7;border-radius:14px;padding:28px}
.cwrap svg{display:block}
.cc-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.cc{border:1px solid #ececef;border-radius:18px;padding:6px;background:#fff}
.cc-stage{position:relative;height:250px;border:1px solid #f1f1f3;border-radius:13px;display:grid;place-items:center;background:#fcfcfd;overflow:hidden}
.cc-foot{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:12px 10px 8px}
.cc-foot b{display:block;font-size:13px;font-weight:500;line-height:1.4}
.cc-foot p{margin:2px 0 0;font-size:12px;color:#71717a;line-height:1.5}
.soon{font-size:11px;color:#a1a1aa;white-space:nowrap;border:1px solid #ececef;border-radius:999px;padding:1px 8px}
.ctrls{position:absolute;left:10px;right:10px;bottom:10px;display:flex;gap:6px;justify-content:center;align-items:center}
.ctrls button{font:12px Inter,sans-serif;border:1px solid #ececef;background:#fff;color:#71717a;border-radius:999px;padding:3px 10px;cursor:pointer;display:inline-flex;align-items:center;gap:4px}
.ctrls button.on{color:#18181b;border-color:#d4d4d8;background:#f4f4f5}
.ctrls input[type=range]{width:130px;accent-color:#18181b}
.grid line{stroke:#eceef3;stroke-width:.04}
.kl *{fill:none;stroke:#3b82f6;stroke-width:.05;opacity:0;transition:opacity .2s}
.kl-wrap{margin-top:-24px}.kl-wrap:hover .kl *,#c-key .cc-stage:hover .kl *{opacity:.6}
.st-wrap{margin-top:-24px;text-align:center}.st-row{height:120px;display:grid;place-items:center}
.readout{font-size:12px;color:#a1a1aa;font-variant-numeric:tabular-nums;margin-top:6px}.readout b{color:#18181b;font-weight:500}
.op-wrap{margin-top:-24px;text-align:center}.shape{fill:none;stroke:#18181b;stroke-width:1.5}.guide{stroke:#3b82f6;stroke-width:.06;stroke-dasharray:.4 .4}
#op-c{transition:r .35s cubic-bezier(.2,.8,.2,1)}
.so-wrap{margin-top:-24px;display:grid;grid-template-columns:repeat(4,60px);gap:8px}.so-wrap span{display:grid;place-items:center;height:60px}
.so-wrap.off [fill="currentColor"]{fill:none;stroke:currentColor}
.cx-wrap{margin-top:-24px;padding:26px 40px;border-radius:12px;transition:background .2s}
.mini-menu{background:#fff;border:1px solid #ececef;border-radius:10px;padding:5px;box-shadow:0 4px 14px rgba(0,0,0,.05);font-size:12.5px;width:200px;color:#3f3f46}
.mini-menu div{display:flex;gap:10px;align-items:center;padding:4px 8px;border-radius:6px;cursor:default}
.mini-menu div span{flex:1}.mini-menu kbd{font:10.5px Inter,sans-serif;color:#a1a1aa}
.mini-menu div:hover,.mini-menu .hov{background:#f4f4f5;color:#18181b}
.mini-menu:hover .hov:not(:hover){background:none;color:#3f3f46}
.cx-wrap.dk{background:#0e0f13}.cx-wrap.dk .mini-menu{background:#16181d;border-color:#25272e;color:#9b9da8;box-shadow:0 8px 24px rgba(0,0,0,.4)}
.cx-wrap.dk .mini-menu div:hover,.cx-wrap.dk .mini-menu .hov{background:#1e2027;color:#e6e7eb}.cx-wrap.dk .mini-menu:hover .hov:not(:hover){background:none;color:#9b9da8}.cx-wrap.dk kbd{color:#5d606c}
.pt-wrap{margin-top:-24px}.pts .ink [fill="currentColor"]{fill:#ececef}.pts .an rect{fill:#fff;stroke:#3b82f6;stroke-width:.06}
.pts .hd{opacity:0;transition:opacity .2s}.pts .hd line{stroke:#3b82f6;stroke-width:.04}.pts .hd circle{fill:#3b82f6}
.pt-wrap.h .hd,.pt-wrap:hover .hd{opacity:1}
</style>`;

const js = `<script>
(function(){
  const KL=${JSON.stringify(klData)};
  document.querySelectorAll('[data-kl]').forEach(b=>b.onclick=()=>{document.getElementById('kl-ink').innerHTML=KL[b.dataset.kl];document.querySelectorAll('[data-kl]').forEach(x=>x.classList.toggle('on',x===b));});
  const r=document.getElementById('st-range'),abs=document.getElementById('st-abs'),svg=document.getElementById('st-svg');
  const upd=()=>{const s=+r.value;svg.setAttribute('width',s);svg.setAttribute('height',s);const a=abs.classList.contains('on');svg.querySelectorAll('*').forEach(e=>a?e.setAttribute('vector-effect','non-scaling-stroke'):e.removeAttribute('vector-effect'));document.getElementById('st-size').textContent=s+'px';document.getElementById('st-w').textContent=(a?1.5:1.5*s/16).toFixed(2).replace(/\\.?0+$/,'')+'px';};
  r.oninput=upd;abs.onclick=()=>{abs.classList.toggle('on');abs.textContent=abs.classList.contains('on')?'absolute':'scaled';upd();};upd();
  document.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>{const eye=b.dataset.op==='eye';document.getElementById('op-c').setAttribute('r',eye?6:5.75);document.getElementById('op-r').textContent=eye?'Equal by eye: circle 12, square 11.5':'Equal on paper: 11.5 and 11.5';document.querySelectorAll('[data-op]').forEach(x=>x.classList.toggle('on',x===b));});
  const so=document.getElementById('so-t');so.onclick=()=>{const off=document.getElementById('so').classList.toggle('off');so.classList.toggle('on',!off);so.textContent=off?'Accents off':'Accents on';};
  document.querySelectorAll('[data-cx]').forEach(b=>b.onclick=()=>{document.getElementById('cx').classList.toggle('dk',b.dataset.cx==='dk');document.querySelectorAll('[data-cx]').forEach(x=>x.classList.toggle('on',x===b));});
  const ph=document.getElementById('pt-h');ph.onclick=()=>{const on=document.getElementById('pt').classList.toggle('h');ph.classList.toggle('on',on);};
})();
</script>`;

writeFileSync(process.argv[2], `${css}
<h2>Craft cards, live</h2>
<p class="subtitle">These are real: hover, click, drag. Six cards under "Craft" in the index, one per Site 2 article. Until the articles ship each card says "Article soon"; then the whole card links through. Tell me which demos land and which feel flat.</p>
<div class="cwrap">${cards}</div>${js}`);
console.log('ok', pts.A.length, 'anchors', pts.H.length, 'handles');
