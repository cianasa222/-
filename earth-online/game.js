// 2D half of "退出地球 Online": the game's UI on warm paper. A tall page the camera scrolls through like a phone screen.
import { SPR, spring, BEATS, kick, clamp, lerp, range, smooth, easeIn, easeOut, easeInOut, backOut, rng, GRID, CLOSED, GHOST_GRID, GREY_GRID, FLOWER, ICONS, drawGrid } from './common.js';

const PW = 720, PH = 2600;                       // page size (camera coordinates)
const WIN = { x: 120, y: 170, w: 480, h: 450 };   // the window (a real hole in the paper: the 3D sea is behind it)
const CARD = { x: 100, y: 760, w: 520, h: 380 }, MAP = { x: 60, y: 1250, w: 600, h: 330 }, QUEST = { x: 80, y: 1690, w: 560, h: 280 }, INV = { x: 80, y: 2060, w: 560, h: 400 };
const INK = '#3a2b2a', SOFT = '#8a7a72', ORANGE = '#ff9a5c', PINK = '#ff8fb0', LAV = '#b9a6ff', MINT = '#8fe3c4', PANEL = '#fffaf2';
let blobs, cursor, cRing, sparkles = [], root, cam, fx, fxc, ghostCv, ghostEl, portrait, statusPill, hpFill, nameEl, flowerEl, flower2El, bodyEl, tick, stamp, reward, expFill, coinTxt, invSlots = [], invTitle, emptyTxt, slats = [], light, hud, clock, onlineTxt;
const el = (tag, css, parent, html) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (html !== undefined) e.innerHTML = html; (parent || root).appendChild(e); return e; };
const sprite = (grid, s, parent, css = '') => { const c = el('canvas', `position:absolute;image-rendering:pixelated;width:${grid[0].length * s}px;height:${grid.length * s}px;${css}`, parent); c.width = grid[0].length; c.height = grid.length; drawGrid(c.getContext('2d'), grid); return c; };
const panel = (r, title, parent) => { const p = el('div', `position:absolute;left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;border-radius:30px;background:rgba(255,252,247,.6);background-image:linear-gradient(170deg,rgba(255,255,255,.8),rgba(255,255,255,.15) 45%,rgba(255,255,255,.35));backdrop-filter:blur(28px) saturate(1.7);box-shadow:0 30px 60px -18px rgba(120,80,50,.22),0 8px 18px rgba(120,90,60,.08),0 0 0 1.5px rgba(255,255,255,.9) inset,0 -3px 0 rgba(120,90,60,.05) inset`, parent); p.className = 'pnl';
  if (title) el('div', `position:absolute;left:28px;top:22px;font:600 15px Noto Sans SC,sans-serif;letter-spacing:.18em;color:${SOFT}`, p, title); return p; };

export function build(container) {
  root = container; root.style.cssText = 'position:absolute;inset:0;overflow:hidden';
  cam = el('div', `position:absolute;left:0;top:0;width:${PW}px;height:${PH}px;transform-origin:0 0;will-change:transform`);
  // paper with a hole for the window
  const paper = el('canvas', `position:absolute;left:-400px;top:-400px;width:${PW + 800}px;height:${PH + 800}px`, cam); paper.width = PW + 800; paper.height = PH + 800;
  { const g = paper.getContext('2d'); g.fillStyle = '#f6eee1'; g.fillRect(0, 0, paper.width, paper.height);
    const r = rng(3); for (let i = 0; i < 26000; i++) { const x = r() * paper.width, y = r() * paper.height, a = r() * .05; g.fillStyle = `rgba(${r() < .5 ? '120,90,60' : '255,255,255'},${a})`; g.fillRect(x, y, 1 + r() * 2, 1); }
    g.strokeStyle = 'rgba(160,130,100,.07)'; g.lineWidth = 1; for (let x = 0; x < paper.width; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, paper.height); g.stroke(); } for (let y = 0; y < paper.height; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(paper.width, y); g.stroke(); }
    g.clearRect(WIN.x + 400, WIN.y + 400, WIN.w, WIN.h); }
  // ---- soft colour bokeh drifting behind the panels (its own parallax layer)
  blobs = el('div', `position:absolute;left:0;top:0;width:${PW}px;height:${PH}px`, cam);
  { const r = rng(21), cols = ['255,154,92', '255,143,176', '185,166,255', '143,227,196']; for (let i = 0; i < 22; i++) { const d = 220 + r() * 300, x = -80 + r() * (PW + 60), y = 700 + r() * (PH - 600);
      const b = el('div', `position:absolute;left:${x}px;top:${y}px;width:${d}px;height:${d}px;border-radius:50%;background:radial-gradient(circle,rgba(${cols[i % 4]},.62),rgba(${cols[i % 4]},0) 68%)`, blobs); b.dataset.p = (r() * 6.28).toFixed(2); } }
  // ---- window: frame, sill, shutters (slats) with light leaking through
  light = el('div', `position:absolute;left:${WIN.x}px;top:${WIN.y}px;width:${WIN.w}px;height:${WIN.h}px;background:linear-gradient(180deg,#ffe9c9,#ffd7b0);`, cam);
  for (let i = 0; i < 7; i++) slats.push(el('div', `position:absolute;left:${WIN.x}px;top:${WIN.y + i * WIN.h / 7}px;width:${WIN.w}px;height:${WIN.h / 7 - 6}px;background:linear-gradient(180deg,#fffaf3,#f1e3d0);border-radius:6px;box-shadow:0 3px 0 rgba(150,110,80,.18);transform-origin:50% 0;backface-visibility:hidden`, cam));
  el('div', `position:absolute;left:${WIN.x - 18}px;top:${WIN.y - 18}px;width:${WIN.w + 36}px;height:${WIN.h + 36}px;border-radius:30px;box-shadow:0 0 0 18px #e9d3f0 inset,0 0 0 21px #d9bfe6 inset,0 20px 40px rgba(120,90,60,.15);pointer-events:none`, cam);
  el('div', `position:absolute;left:${WIN.x + WIN.w / 2 - 9}px;top:${WIN.y}px;width:18px;height:${WIN.h}px;background:#e9d3f0`, cam);
  el('div', `position:absolute;left:${WIN.x - 40}px;top:${WIN.y + WIN.h + 14}px;width:${WIN.w + 80}px;height:24px;border-radius:12px;background:#e2c6ec;box-shadow:0 10px 20px rgba(120,90,60,.12)`, cam);
  // ---- character card
  const card = panel(CARD, '角 色', cam);
  const pf = el('div', `position:absolute;left:34px;top:70px;width:200px;height:200px;border-radius:22px;background:#fff1e6;overflow:hidden`, card);
  portrait = sprite(GRID, 12, pf, 'left:10px;top:40px'); portrait.dataset.grey = '0';
  nameEl = el('div', `position:absolute;left:262px;top:78px;font:900 34px Noto Sans SC,sans-serif;color:${INK}`, card, '小橙 <span style="font:600 16px Noto Sans SC,sans-serif;color:#b9a99f;letter-spacing:.1em">Lv.25</span>');
  statusPill = el('div', `position:absolute;left:262px;top:136px;padding:6px 16px;border-radius:999px;font:600 15px Noto Sans SC,sans-serif;letter-spacing:.12em;background:${MINT};color:#21533f`, card, '● 在线');
  el('div', `position:absolute;left:262px;top:196px;font:600 13px Noto Sans SC,sans-serif;color:${SOFT};letter-spacing:.15em`, card, 'HP');
  const hp = el('div', `position:absolute;left:300px;top:196px;width:184px;height:14px;border-radius:7px;background:#efe4d8`, card);
  hpFill = el('div', `position:absolute;left:0;top:0;height:100%;width:100%;border-radius:7px;background:linear-gradient(90deg,${PINK},${ORANGE})`, hp);
  el('div', `position:absolute;left:34px;top:300px;font:500 15px Noto Sans SC,sans-serif;color:${SOFT};letter-spacing:.08em`, card, '在线时长 · 9,125 天');
  flowerEl = sprite(FLOWER, 7, card, 'left:420px;top:240px;opacity:0');
  // ---- map strip with the body lying on the grass
  const map = panel(MAP, '地 图 · 家 附 近', cam);
  const grass = el('canvas', 'position:absolute;left:24px;top:64px;width:552px;height:240px;border-radius:18px', map); grass.width = 138; grass.height = 60;
  { const g = grass.getContext('2d'), r = rng(9); for (let y = 0; y < 60; y++) for (let x = 0; x < 138; x++) { const v = r(); g.fillStyle = y > 40 ? (v < .5 ? '#cfe9b8' : '#c4e2aa') : (v < .5 ? '#dff1cc' : '#d6ecc0'); g.fillRect(x, y, 1, 1); }
    for (let i = 0; i < 40; i++) { g.fillStyle = r() < .5 ? '#ffffff' : '#ffd1df'; g.fillRect((r() * 138) | 0, (r() * 60) | 0, 1, 1); } grass.style.imageRendering = 'pixelated'; }
  el('div', 'position:absolute;left:226px;top:202px;width:140px;height:26px;border-radius:50%;background:rgba(80,110,60,.18);filter:blur(3px)', map);
  bodyEl = sprite(CLOSED, 9, map, 'left:228px;top:130px;filter:saturate(.85)');
  flower2El = sprite(FLOWER, 6, map, 'left:350px;top:200px');
  // ---- quest
  const quest = panel(QUEST, '任 务', cam);
  el('div', `position:absolute;left:30px;top:66px;font:600 14px Noto Sans SC,sans-serif;color:${ORANGE};letter-spacing:.2em`, quest, '主线任务');
  const cb = el('div', `position:absolute;left:30px;top:104px;width:34px;height:34px;border-radius:10px;box-shadow:0 0 0 3px #e3d6c8 inset`, quest);
  tick = el('div', `position:absolute;left:5px;top:-2px;font:900 30px sans-serif;color:${MINT};transform-origin:50% 60%`, cb, '✓');
  el('div', `position:absolute;left:80px;top:102px;font:900 28px Noto Sans SC,sans-serif;color:${INK}`, quest, '好好地过完这一生');
  el('div', `position:absolute;left:30px;top:174px;font:600 13px Noto Sans SC,sans-serif;color:${SOFT};letter-spacing:.15em`, quest, 'EXP');
  const eb = el('div', `position:absolute;left:72px;top:176px;width:440px;height:12px;border-radius:6px;background:#efe4d8`, quest);
  expFill = el('div', `position:absolute;left:0;top:0;height:100%;width:60%;border-radius:6px;background:linear-gradient(90deg,${LAV},${PINK})`, eb);
  reward = el('div', `position:absolute;left:30px;top:212px;font:500 16px Noto Sans SC,sans-serif;color:${SOFT};opacity:0`, quest, '奖励 · <b style="color:#8a74e0">一段很长很长的回忆</b>');
  stamp = el('div', `position:absolute;left:356px;top:40px;padding:8px 18px;border:4px solid #ff7f9f;border-radius:12px;color:#ff7f9f;font:900 30px Noto Sans SC,sans-serif;letter-spacing:.2em;opacity:0;mix-blend-mode:multiply`, quest, '已完成');
  // ---- inventory
  const inv = panel(INV, '背 包', cam);
  invTitle = el('div', `position:absolute;right:28px;top:22px;font:600 15px Noto Sans SC,sans-serif;color:${SOFT}`, inv, '6 / 6');
  const names = ['coin', 'heart', 'trophy', 'pad', 'star', 'book'], counts = ['99,999', '1', '12', '1', '520', '3'];
  names.forEach((n, i) => { const sx = 28 + (i % 3) * 172, sy = 70 + Math.floor(i / 3) * 150;
    const slot = el('div', `position:absolute;left:${sx}px;top:${sy}px;width:156px;height:132px;border-radius:20px;background:rgba(255,255,255,.45);box-shadow:0 0 0 1.5px rgba(255,255,255,.9) inset,0 6px 16px -6px rgba(120,90,60,.18)`, inv);
    const ic = sprite(ICONS[n], 9, slot, 'left:42px;top:20px');
    const cnt = el('div', `position:absolute;right:14px;bottom:10px;font:600 14px Noto Sans SC,sans-serif;color:${SOFT}`, slot, '×' + counts[i]);
    invSlots.push({ slot, ic, cnt, n, sx: INV.x + sx + 42, sy: INV.y + sy + 20 }); });
  coinTxt = invSlots[0].cnt;
  emptyTxt = el('div', `position:absolute;left:0;right:0;top:${INV.h / 2 - 22}px;text-align:center;font:900 30px Noto Sans SC,sans-serif;color:${INK};opacity:0`, inv, '背包已清空');
  // ---- ghost (above everything in the page) + fx canvas for pixel bursts
  fx = el('canvas', `position:absolute;left:0;top:0;width:${PW}px;height:${PH}px;pointer-events:none`, cam); const DPR = window.devicePixelRatio || 1; fx.width = PW * DPR; fx.height = PH * DPR; fxc = fx.getContext('2d'); fxc.scale(DPR, DPR);
  ghostEl = el('div', 'position:absolute;left:0;top:0;width:120px;height:80px;filter:drop-shadow(0 0 14px rgba(190,170,255,.8))', cam);
  ghostCv = sprite(GHOST_GRID, 8, ghostEl, 'left:0;top:0');
  // ---- the player's finger: a soft dot that taps things on the beat
  cursor = el('div', 'position:absolute;left:0;top:0;width:46px;height:46px;margin:-23px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff,#ffe9dc);box-shadow:0 10px 22px rgba(120,80,50,.28),0 0 0 3px rgba(255,255,255,.8);opacity:0', cam);
  cRing = el('div', 'position:absolute;left:0;top:0;width:46px;height:46px;margin:-23px;border-radius:50%;border:3px solid #ff9a5c;opacity:0', cam);
  // twinkles that pop around things on beats
  for (let i = 0; i < 10; i++) sparkles.push(el('div', `position:absolute;left:0;top:0;width:18px;height:18px;margin:-9px;opacity:0;background:${['#ff9a5c', '#ff8fb0', '#b9a6ff', '#8fe3c4'][i % 4]};clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)`, cam));
  // ---- HUD: the game's status bar (not moved by the camera)
  hud = el('div', `position:absolute;left:0;top:0;right:0;height:92px;background:linear-gradient(180deg,rgba(246,238,225,.96),rgba(246,238,225,.82));box-shadow:0 8px 24px rgba(120,90,60,.08);display:flex;align-items:center;padding:0 30px;gap:14px`);
  const globe = el('canvas', 'width:40px;height:40px;image-rendering:pixelated', hud); globe.width = 10; globe.height = 10;
  { const g = globe.getContext('2d'); const b = '#7cc9c6', gr = '#9fd98a'; drawGrid(g, [[null, null, null, b, b, b, b, null, null, null], [null, b, b, b, gr, gr, b, b, b, null], [null, b, gr, gr, gr, b, b, b, b, null], [b, b, gr, gr, b, b, b, gr, b, b], [b, b, b, gr, b, b, gr, gr, gr, b], [b, b, b, b, b, b, gr, gr, b, b], [b, gr, gr, b, b, b, b, gr, b, b], [null, b, gr, gr, b, b, b, b, b, null], [null, b, b, b, b, b, b, b, b, null], [null, null, null, b, b, b, b, null, null, null]]); }
  el('div', `font:900 28px Noto Sans SC,sans-serif;color:${INK};letter-spacing:.06em`, hud, '地球 <span style="color:#ff9a5c">Online</span>');
  onlineTxt = el('div', `margin-left:auto;text-align:right;font:600 13px Noto Sans SC,sans-serif;color:${SOFT};line-height:1.5`, hud, '在线玩家<br><b style="font-size:16px;color:#3a2b2a">8,123,456,789</b>');
}

// camera keys: [t, ox, oy, scale, rotX, rotZ, whip]
const CK = [
  [0.0, 360, 960, 1.04, 0, -1], [2.1, 360, 940, 1.14, 0, 1],
  [2.26, 360, 940, 1.14, 0, 1, 1], [2.75, 360, 1430, 1.16, 4, -1.5], [4.4, 360, 1420, 1.27, 3, 1],
  [4.58, 360, 1420, 1.27, 3, 1, 1], [5.05, 360, 1830, 1.2, 0, 0], [6.4, 360, 1830, 1.33, 2, -1],
  [6.58, 360, 1830, 1.33, 2, -1, 1], [7.05, 360, 2260, 1.14, 0, 1], [8.9, 360, 2240, 1.26, 0, -1],
  [9.06, 360, 2240, 1.26, 0, -1, 1], [9.36, 360, 395, 1.12, 0, 0], [10.4, 360, 395, 9.5, 16, 0],
];
function camAt(t) {
  let i = 0; while (i < CK.length - 2 && t >= CK[i + 1][0]) i++;
  const a = CK[i], b = CK[i + 1], u = range(t, a[0], b[0]);
  const k = b[6] ? 1 - Math.pow(1 - u, 4) : (i === CK.length - 2 ? Math.pow(u, 2.2) : easeInOut(u));   // whips are fast-out; the final zoom accelerates
  return a.slice(1, 6).map((v, j) => lerp(v, b[j + 1], k));
}
// ghost path in page coordinates: [t, x, y, scale]
const GK = [[.3, 240, 930, .5], [1.4, 430, 790, 1], [2.26, 440, 800, 1], [2.9, 330, 1320, 1], [4.58, 340, 1330, 1], [5.2, 560, 1730, .95], [6.58, 560, 1740, .95], [7.15, 560, 2080, .9], [9.06, 560, 2090, .9], [9.36, 300, 470, .9], [9.62, 360, 395, .25]];
function ghostAt(t) { let i = 0; while (i < GK.length - 2 && t >= GK[i + 1][0]) i++; const a = GK[i], b = GK[i + 1], k = easeInOut(range(t, a[0], b[0])); return [lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)]; }

export function update(t) {
  const on = t < 10.45; root.style.display = on ? 'block' : 'none'; if (!on) return;
  const kb = kick(t, 9);
  // camera
  let [ox, oy, s, rx, rz] = camAt(t); s *= 1 + kb * .012;
  cam.style.transformOrigin = `${ox}px ${oy}px`;
  cam.style.transform = `translate(${360 - ox}px,${640 - oy}px) perspective(1600px) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${s})`;
  root.style.opacity = 1 - smooth(range(t, 10.05, 10.42));
  // whip motion blur: blur follows camera speed
  { const a = camAt(t - 1 / 120), b = camAt(t + 1 / 120); const sp = Math.hypot(b[0] - a[0], b[1] - a[1]) * 60; const bl = t < 9.36 ? clamp((sp - 300) / 900, 0, 1) * 4.5 : 0;
    cam.style.filter = bl > .05 ? `blur(${bl.toFixed(2)}px)` : 'none'; }
  blobs.style.transform = `translateY(${(oy - 1400) * .22}px)`;
  [...blobs.children].forEach((b, i) => { const p = +b.dataset.p; b.style.transform = `translate(${Math.sin(t * .5 + p) * 24}px,${Math.cos(t * .4 + p) * 18}px) scale(${1 + .08 * Math.sin(t * .7 + p) + kb * .05})`; });
  // intro: panels settle in at the very start
  document.querySelectorAll('.pnl').forEach((pn, i) => { const k = spring(t - i * .06, SPR.ui); pn.style.transform = t < 1.6 ? `translateY(${(1 - k) * 80}px) scale(${.92 + .08 * k})` : 'none'; pn.style.opacity = t < 1.6 ? clamp(range(t, i * .06, i * .06 + .18), 0, 1) : 1; });
  // finger taps: the quest checkbox, then each inventory item as it is let go
  const TAPS = [[4.53, QUEST.x + 47, QUEST.y + 121], [6.734, invSlots[0].sx + 36, invSlots[0].sy + 40], [7.268, invSlots[1].sx + 36, invSlots[1].sy + 40], [7.802, invSlots[2].sx + 36, invSlots[2].sy + 40], [8.382, invSlots[3].sx + 36, invSlots[3].sy + 40], [8.94, invSlots[4].sx + 36, invSlots[4].sy + 40]];
  { let j = TAPS.findIndex(q => q[0] > t); if (j < 0) j = TAPS.length; const prev = TAPS[Math.max(0, j - 1)], next = TAPS[Math.min(TAPS.length - 1, j)];
    const span = next[0] - prev[0], u = span > 0 ? easeInOut(range(t, prev[0] + .12, next[0] - .06)) : 1;
    let cx = lerp(prev[1], next[1], u), cy = lerp(prev[2], next[2], u) - Math.sin(Math.PI * u) * 40;
    if (t < TAPS[0][0]) { const e = easeOut(range(t, 3.9, 4.4)); cx = lerp(QUEST.x + 300, TAPS[0][1], e); cy = lerp(QUEST.y + 330, TAPS[0][2], e); }
    const vis = smooth(range(t, 3.9, 4.15)) * (1 - smooth(range(t, 5.0, 5.3))) + smooth(range(t, 6.3, 6.55)) * (1 - smooth(range(t, 9.0, 9.15)));
    const lt = Math.min(...TAPS.map(q => t >= q[0] ? t - q[0] : 9)), press = lt < .22 ? Math.sin(Math.PI * lt / .22) : 0;
    cursor.style.opacity = vis; cursor.style.transform = `translate(${cx}px,${cy}px) scale(${1 - press * .22})`;
    cRing.style.opacity = vis * (lt < .45 ? 1 - lt / .45 : 0); cRing.style.transform = `translate(${cx}px,${cy}px) scale(${1 + lt * 4})`; }
  // sparkles: little stars that pop on the big moments
  const SP = [[1.23, CARD.x + 330, CARD.y + 150], [4.53, QUEST.x + 47, QUEST.y + 121], [5.06, QUEST.x + 440, QUEST.y + 70], [9.0, INV.x + 280, INV.y + 200]];
  sparkles.forEach((sp, i) => { let best = null; SP.forEach(q => { if (t >= q[0] && t - q[0] < .7) best = q; }); if (!best) { sp.style.opacity = 0; return; }
    const d = t - best[0], a = i / 10 * 6.28 + best[0], rr = 30 + 70 * easeOut(range(d, 0, .5)) + (i % 3) * 14;
    sp.style.opacity = 1 - smooth(range(d, .35, .7)); sp.style.transform = `translate(${best[1] + Math.cos(a) * rr}px,${best[2] + Math.sin(a) * rr}px) rotate(${d * 300}deg) scale(${backOut(range(d, 0, .2), 3) * (1 - d)})`; });

  hud.style.transform = `translateY(${-110 * easeIn(range(t, 9.3, 9.7))}px)`;
  onlineTxt.lastChild.textContent = (8123456789 - Math.floor(range(t, 0, 1.4) * 1)).toLocaleString('en-US');
  // character card: colour drains to grey, status flips to offline, HP empties, a flower drops onto the card
  const grey = t > .67;
  if (portrait.dataset.grey !== String(grey)) { const g = portrait.getContext('2d'); g.clearRect(0, 0, 99, 99); drawGrid(g, grey ? GREY_GRID : GRID); portrait.dataset.grey = String(grey); }
  portrait.style.filter = `saturate(${1 - smooth(range(t, .4, .7))})`;
  if (t > 1.23) { statusPill.textContent = '○ 离线'; statusPill.style.background = '#e9e1d8'; statusPill.style.color = '#8a7a72'; statusPill.style.transform = `scale(${lerp(1.35, 1, spring(t - 1.23, SPR.toy))})`; }
  hpFill.style.width = (100 * (1 - easeInOut(range(t, .2, 1.75)))) + '%';
  const fl = range(t, 1.5, 1.77); flowerEl.style.opacity = fl > 0 ? 1 : 0; flowerEl.style.transform = `translateY(${-160 * (1 - spring(t - 1.5, SPR.toy))}px) rotate(${(1 - spring(t - 1.5, SPR.ui)) * -30}deg)`;
  // body on the map: gentle breath of light; flower beside it
  bodyEl.style.filter = `brightness(${1 + .06 * Math.sin(t * 2)})`;
  // quest: tick on the beat, then the stamp slams down, reward fades in, EXP fills
  const tk = range(t, 4.53, 4.75); tick.style.opacity = tk > 0 ? 1 : 0; tick.style.transform = `scale(${spring(t - 4.53, SPR.toy)})`;
  expFill.style.width = (60 + 40 * easeOut(range(t, 4.6, 5.0))) + '%';
  const st = range(t, 5.06, 5.24); stamp.style.opacity = st > 0 ? .92 : 0; stamp.style.transform = `rotate(${lerp(-24, -12, spring(t - 5.06, SPR.snap))}deg) scale(${t < 5.18 ? lerp(2.2, .92, easeIn(range(t, 5.06, 5.18))) : lerp(.92, 1, spring(t - 5.18, SPR.toy))})`;
  reward.style.opacity = smooth(range(t, 5.62, 6.0)); reward.style.transform = `translateY(${10 * (1 - smooth(range(t, 5.62, 6.0)))}px)`;
  // inventory: one item per beat bursts into pixels that float up; the coin counter runs down to zero
  const IT = [6.734, 7.268, 7.802, 8.382, 8.94, 8.94 + .12];
  fxc.clearRect(0, 0, PW, PH); fxc.imageSmoothingEnabled = false;
  let left = 6;
  invSlots.forEach((it, i) => { const d = t - IT[i];
    if (d > 0) left--;
    it.ic.style.opacity = d > 0 ? 0 : 1; it.ic.style.transform = d > -.12 && d <= 0 ? `scale(${1 + (d + .12) * 2})` : `translateY(${Math.sin(t * 3 + i) * 4}px)`;
    it.slot.style.transform = d > 0 && d < .3 ? `scale(${1 - .06 * Math.sin(Math.PI * d / .3)})` : 'none';
    if (d > 0 && d < .5) { const cx = it.sx + 36, cy = it.sy + 36, e = easeOut(d / .5);   // flash ring
      fxc.save(); fxc.globalAlpha = 1 - e; fxc.strokeStyle = ['#ff9a5c', '#ff8fb0', '#b9a6ff', '#8fe3c4'][i % 4]; fxc.lineWidth = 10 * (1 - e) + 1; fxc.beginPath(); fxc.arc(cx, cy, 20 + e * 90, 0, 7); fxc.stroke();
      for (let q = 0; q < 8; q++) { const a = q / 8 * 6.28 + i; fxc.beginPath(); fxc.moveTo(cx + Math.cos(a) * (30 + e * 60), cy + Math.sin(a) * (30 + e * 60)); fxc.lineTo(cx + Math.cos(a) * (44 + e * 100), cy + Math.sin(a) * (44 + e * 100)); fxc.lineWidth = 5 * (1 - e) + .5; fxc.stroke(); }
      fxc.restore(); }
    if (d > 0 && d < 1.8) {                               // the burst: every pixel of the icon drifts upward, spinning and fading
      const r = rng(40 + i); const grid = ICONS[it.n];
      grid.forEach((row, jj) => row.forEach((c, ii) => { if (!c) return;
        const vx = (r() - .5) * 120, vy = -(140 + r() * 260), sp = (r() - .5) * 8;
        const x = it.sx + ii * 9 + vx * d, y = it.sy + jj * 9 + vy * d + 60 * d * d * .2;
        fxc.save(); fxc.globalAlpha = Math.max(0, 1 - d / 1.8); fxc.translate(x + 4.5, y + 4.5); fxc.rotate(sp * d); fxc.fillStyle = c; fxc.fillRect(-4.5, -4.5, 9, 9); fxc.restore(); })); }
  });
  invTitle.textContent = `${left} / 6`;
  coinTxt.textContent = '×' + Math.round(99999 * (1 - easeIn(range(t, 6.6, 6.734)))).toLocaleString('en-US');
  emptyTxt.style.opacity = smooth(range(t, 9.0, 9.2)) * (1 - smooth(range(t, 9.1, 9.3)));
  // window: slats flip open one after another on the line "窗外…", light spills
  slats.forEach((sl, i) => { const k = easeOut(range(t, 9.06 + i * .035, 9.32 + i * .035)); sl.style.transform = `perspective(600px) rotateX(${-88 * k}deg)`; sl.style.opacity = 1 - k * .9; });
  light.style.opacity = 1 - smooth(range(t, 9.1, 9.4));
  // ghost
  const [gx, gy, gs] = ghostAt(t); const bob = Math.sin(t * 2.4) * 8;
  ghostEl.style.opacity = smooth(range(t, .3, 1.0)) * (1 - smooth(range(t, 9.5, 9.62)));
  ghostEl.style.transform = `translate(${gx - 60}px,${gy - 40 + bob}px) scale(${gs * (1 + kb * .04)}) rotate(${Math.sin(t * 1.7) * 4}deg)`;
}
