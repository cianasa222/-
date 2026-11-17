// 2D part of the MV: inside the song — the player window, the pixel orange one chasing pink footprints.
import { KICKS, BEAT, LINES, lastKick, kickEnv, clamp, lerp, smooth, easeOut, easeIn, easeInOut, range, pop, rng, tagStyle } from './timeline.js';

const O = '#e8703f', L = '#ff9a66', D = '#b8522c', E = '#2a1610', K = '#ff9a5c', C = '#fff3e6', B = '#ff8f8f', _ = null;
const STAND = [
  [_, _, _, C, C, C, C, C, C, C, C, C, _, _, _],
  [_, _, C, _, _, _, _, _, _, _, _, _, C, _, _],
  [_, _, C, L, L, L, L, L, L, L, L, L, C, _, _],
  [_, K, K, O, O, O, O, O, O, O, O, O, K, K, _],
  [_, K, K, O, O, E, O, O, O, E, O, O, K, K, _],
  [_, K, K, O, O, E, O, O, O, E, O, O, K, K, _],
  [_, _, O, O, B, O, O, O, O, O, B, O, O, _, _],
  [_, _, _, O, O, O, O, O, O, O, O, O, _, _, _],
  [_, _, _, D, D, D, D, D, D, D, D, D, _, _, _],
  [_, _, _, _, O, _, O, _, O, _, O, _, _, _, _]];
const JUMP = STAND.map((r, j) => j === 5 ? [O, K, K, O, O, E, O, O, O, E, O, O, K, K, O] : j === 6 ? [O, O, O, O, B, O, O, O, O, O, B, O, O, O, O].map((v, i) => (i === 2 || i === 12) ? _ : v) : j === 9 ? [_, _, _, _, O, O, _, _, _, O, O, _, _, _, _] : r);
const SAD = STAND.map((r, j) => j === 4 ? [_, K, K, O, O, O, O, O, O, O, O, O, K, K, _] : j === 5 ? [_, K, K, O, E, E, O, O, O, E, E, O, K, K, _] : r);
const SPR_W = 15, SPR_H = 10, PX = 5;

let root, cam, win, fx, fxc, spr, sprCtx, lyrBox, prevEl, nextEl, togetherTxt, avB, heartEl, specCols = [], timeEl, barFill, barKnob, playlist, rows = [], plTitle, chars2d = [], prints = [];
const grids = { STAND, JUMP, SAD }; let curGrid = null;
const R = rng(31);

function el(tag, css, parent, html) { const e = document.createElement(tag); if (css) e.style.cssText = css; if (html !== undefined) e.innerHTML = html; (parent || root).appendChild(e); return e; }
function drawGrid(ctx, g) { ctx.clearRect(0, 0, 99, 99); g.forEach((row, j) => row.forEach((v, i) => { if (v) { ctx.fillStyle = v; ctx.fillRect(i, j, 1, 1); } })); }
function face(col, cheek) { const g = []; for (let j = 0; j < 9; j++) { g.push([]); for (let i = 0; i < 9; i++) g[j].push(col); } g[2][2] = g[3][2] = g[2][6] = g[3][6] = E; g[4][1] = g[4][7] = cheek; return g; }

// window-space anchors (in #cam coordinates)
const WIN = { x: 150, y: 108, w: 860, h: 470 };
const LINE_X = 480, LINE_Y = 306, ADV = 37;
const COVER = { x: 186, y: 170, w: 228, h: 228 };
const SPR_HOME = { x: COVER.x + 76, y: COVER.y + 46 };       // assembled on top of the song block in the cover

export function build(container) {
  root = container;
  root.style.cssText = 'position:absolute;inset:0;overflow:hidden;opacity:0;background:radial-gradient(ellipse 90% 45% at 50% 100%, rgba(255,150,190,.28) 0%, transparent 70%),linear-gradient(180deg,#1b1840 0%,#2c2658 45%,#4a3f80 78%,#6a5aa0 100%)';
  const stars = el('canvas', 'position:absolute;inset:0'); stars.width = 1280; stars.height = 720;
  { const c = stars.getContext('2d'); for (let i = 0; i < 180; i++) { const b = R(); c.fillStyle = `rgba(255,250,240,${.35 + b * .65})`; const z = b > .93 ? 3 : 2; c.fillRect(R() * 1280 | 0, R() * 480 | 0, z, z); } }
  el('div', 'position:absolute;right:120px;top:70px;width:70px;height:70px;border-radius:50%;background:#fff4dc;box-shadow:0 0 30px #fff0d0,0 0 90px rgba(255,240,210,.45)');
  const mtn = el('canvas', 'position:absolute;left:0;bottom:0;width:1280px;height:200px'); mtn.width = 1280; mtn.height = 200;
  { const c = mtn.getContext('2d'); c.fillStyle = '#3e3574'; for (let x = 0; x < 1280; x += 16) { const h = 60 + Math.round((Math.sin(x * .006) + Math.cos(x * .013 + 1) * .7 + 1.4) * 22 / 8) * 8; c.fillRect(x, 200 - h, 16, h); } }
  cam = el('div', 'position:absolute;inset:0;transform-origin:50% 50%;will-change:transform');
  el('div', "position:absolute;left:0;right:0;top:0;height:26px;background:rgba(30,26,70,.45);color:#d9d4ff;font:12px 'WenQuanYi Zen Hei',sans-serif;display:flex;gap:18px;align-items:center;padding:0 16px;letter-spacing:.05em", cam, '<b>●</b><b>播放器</b><span>文件</span><span>编辑</span><span>播放</span><span>窗口</span><span style="margin-left:auto">02:47</span>');
  win = el('div', `position:absolute;left:${WIN.x}px;top:${WIN.y}px;width:${WIN.w}px;height:${WIN.h}px;border-radius:26px;background:linear-gradient(160deg,rgba(78,66,140,.66),rgba(40,34,90,.76));box-shadow:0 40px 90px rgba(10,6,40,.55),0 0 0 1.5px rgba(220,205,255,.28) inset,0 0 60px rgba(255,197,138,.14);overflow:hidden`, cam);
  el('div', "height:36px;display:flex;align-items:center;gap:8px;padding:0 16px;color:#c9c2f5;font:12px 'WenQuanYi Zen Hei',sans-serif", win, '<span style="width:11px;height:11px;border-radius:50%;background:#ff8f9f"></span><span style="width:11px;height:11px;border-radius:50%;background:#ffd28a"></span><span style="width:11px;height:11px;border-radius:50%;background:#9be8c4"></span><span style="margin-left:12px">正在播放 · 我们的歌单</span>');
  const cover = el('div', `position:absolute;left:${COVER.x - WIN.x}px;top:${COVER.y - WIN.y}px;width:${COVER.w}px;height:${COVER.h}px;border-radius:26px;background:radial-gradient(circle at 50% 40%, rgba(255,214,170,.35), rgba(40,34,90,.6) 70%);box-shadow:0 0 0 1px rgba(255,220,180,.25) inset`, win);
  el('div', 'position:absolute;left:54px;top:46px;width:120px;height:120px;border-radius:24px;background:linear-gradient(150deg,rgba(255,232,200,.55),rgba(255,180,120,.35));box-shadow:0 0 30px #ffc58a,0 0 80px rgba(255,180,120,.55),0 0 0 2px rgba(255,236,210,.7) inset', cover);
  el('div', `position:absolute;left:36px;top:306px;width:240px;color:#fff;font-family:'Noto Serif SC',serif`, win, `<div style="font-size:30px;font-weight:900;letter-spacing:.1em;text-shadow:0 0 18px rgba(255,197,138,.6)">幻听</div><div style="margin-top:4px;color:#c4bdf0;font:13px 'WenQuanYi Zen Hei',sans-serif">DJ 版 · 单曲循环</div>`);
  const bar = el('div', 'position:absolute;left:36px;top:384px;width:228px;height:6px;border-radius:3px;background:rgba(255,255,255,.16)', win);
  barFill = el('i', 'position:absolute;left:0;top:0;height:100%;border-radius:3px;background:linear-gradient(90deg,#ff9a5c,#ffc58a);box-shadow:0 0 10px #ffb07a', bar);
  barKnob = el('u', 'position:absolute;top:-6px;width:18px;height:18px;margin-left:-9px;border-radius:6px;background:#fff3e6;box-shadow:0 0 14px #ffc58a', bar);
  timeEl = el('div', "position:absolute;left:36px;top:398px;width:228px;display:flex;justify-content:space-between;color:#b9b1ee;font:11px 'WenQuanYi Zen Hei',sans-serif", win, '<span>0:15</span><span>0:30</span>');
  el('div', 'position:absolute;left:86px;top:424px;display:flex;gap:30px;color:#f1ecff;font:20px sans-serif', win, '<span>⏮</span><span>❚❚</span><span>⏭</span>');
  const tog = el('div', "position:absolute;right:24px;top:54px;padding:8px 14px 8px 8px;border-radius:999px;background:rgba(255,255,255,.1);box-shadow:0 0 0 1px rgba(255,255,255,.16) inset;display:flex;align-items:center;gap:8px;color:#efe9ff;font:12px 'WenQuanYi Zen Hei',sans-serif", win);
  const avA = el('canvas', 'width:28px;height:28px;border-radius:9px;image-rendering:pixelated', tog); avA.width = avA.height = 9; drawGrid(avA.getContext('2d'), face(O, B));
  heartEl = el('span', 'color:#ff86ad;font-size:15px;text-shadow:0 0 10px #ff86ad;display:inline-block', tog, '♥');
  avB = el('canvas', 'width:28px;height:28px;border-radius:9px;image-rendering:pixelated;display:inline-block', tog); avB.width = avB.height = 9; drawGrid(avB.getContext('2d'), face('#ff9cba', '#ff6f9a'));
  togetherTxt = el('span', 'display:inline-block', tog, '一起听 · 2 人在听');
  prevEl = el('div', `position:absolute;left:${LINE_X - WIN.x}px;top:${226 - WIN.y}px;color:rgba(225,215,255,.38);font:500 21px 'Noto Serif SC',serif;letter-spacing:.12em;white-space:nowrap`, win);
  nextEl = el('div', `position:absolute;left:${LINE_X - WIN.x}px;top:${398 - WIN.y}px;color:rgba(225,215,255,.32);font:500 21px 'Noto Serif SC',serif;letter-spacing:.12em;white-space:nowrap`, win);
  const spec = el('div', 'position:absolute;left:300px;right:22px;bottom:16px;height:84px;display:flex;align-items:flex-end;gap:7px', win);
  const cols = ['#ffc58a', '#ff9fbf', '#9fdcff', '#d2b0ff', '#ffe08a', '#a8f5d2'];
  for (let i = 0; i < 26; i++) { const col = el('div', 'flex:1;display:flex;flex-direction:column-reverse;gap:4px;height:84px', spec); const cc = cols[i % 6]; const bs = []; for (let k = 0; k < 6; k++) bs.push(el('b', `display:block;height:10px;border-radius:3px;background:${cc};box-shadow:0 0 8px ${cc};opacity:0`, col)); specCols.push(bs); }
  // playlist panel (列表里的歌)
  playlist = el('div', `position:absolute;left:${LINE_X - WIN.x - 14}px;top:58px;width:500px;height:330px;border-radius:20px;background:rgba(30,24,72,.72);box-shadow:0 0 0 1px rgba(220,205,255,.2) inset,0 20px 50px rgba(0,0,0,.35);opacity:0;padding:18px 20px;box-sizing:border-box`, win);
  plTitle = el('div', "position:relative;height:46px;font:900 30px 'Noto Serif SC',serif;color:#fff8ee", playlist);
  const names = ['第一次一起听', '雨天共用的耳机', '你哼过的那首', '晚安前的歌', '幻听 · 正在播放'];
  names.forEach((n, i) => {
    const r = el('div', `position:relative;height:46px;margin-top:6px;border-radius:12px;display:flex;align-items:center;gap:12px;padding:0 12px;background:${i === 4 ? 'rgba(255,197,138,.18)' : 'rgba(255,255,255,.06)'};color:#efe9ff;font:15px 'WenQuanYi Zen Hei',sans-serif;opacity:0`, playlist);
    const th = el('canvas', 'width:48px;height:28px;image-rendering:pixelated;border-radius:6px;background:rgba(255,220,180,.25)', r); th.width = 24; th.height = 14; pairThumb(th.getContext('2d'), i);
    el('span', '', r, n); el('span', 'margin-left:auto;color:#b9b1ee;font-size:12px', r, ['3:41', '4:02', '3:18', '2:56', '0:30'][i]);
    rows.push(r);
  });
  // lyric chars live in #cam space so the camera moves them with everything else
  lyrBox = el('div', 'position:absolute;inset:0;pointer-events:none', cam);
  // footprints layer + sprite + particles
  for (let k = 0; k < 40; k++) prints.push(el('div', 'position:absolute;width:12px;height:12px;border-radius:3px;background:#ffa3c6;box-shadow:0 0 10px #ff86ad,0 0 22px rgba(255,134,173,.7);opacity:0', cam));
  spr = el('canvas', `position:absolute;left:0;top:0;width:${SPR_W * PX}px;height:${SPR_H * PX}px;image-rendering:pixelated;transform-origin:50% 100%;filter:drop-shadow(0 0 10px rgba(255,154,92,.6));opacity:0`, cam);
  spr.width = SPR_W; spr.height = SPR_H; sprCtx = spr.getContext('2d');
  fx = el('canvas', 'position:absolute;left:-640px;top:-360px;width:2560px;height:1440px;pointer-events:none', cam); fx.width = 2560; fx.height = 1440; fxc = fx.getContext('2d');
  // vignette + grain on top (not affected by camera)
  el('div', 'position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(10,6,30,.55) 100%)');
  const gr = el('canvas', 'position:absolute;inset:0;width:1280px;height:720px;pointer-events:none;opacity:.07;mix-blend-mode:overlay'); gr.width = 640; gr.height = 360;
  { const g = gr.getContext('2d'), d = g.createImageData(640, 360); let s = 9; for (let i = 0; i < d.data.length; i += 4) { s = (s * 16807) % 2147483647; const v = s % 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); }
}
function pairThumb(g, i) {
  const P = '#ff9cba', PD = '#d9708f', put = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
  const dx = i % 2 ? 1 : 0;
  for (let x = 3; x <= 9; x++) for (let y = 4; y <= 10; y++) put(x + dx, y, y === 10 ? D : O);
  for (let x = 13; x <= 19; x++) for (let y = 4; y <= 10; y++) put(x - dx, y, y === 10 ? PD : P);
  put(5 + dx, 6, E); put(8 + dx, 6, E); put(15 - dx, 6, E); put(18 - dx, 6, E);
  if (i === 1) for (let x = 5; x <= 17; x++) put(x, 2, C);
  if (i === 2) { put(11, 3, '#ff6f9a'); put(12, 3, '#ff6f9a'); put(11, 4, '#ff6f9a'); }
  if (i === 3) { put(21, 1, '#fff4dc'); put(22, 1, '#fff4dc'); put(21, 2, '#fff4dc'); }
  if (i === 0) { put(10, 8, O); put(11, 8, '#ffc58a'); put(12, 8, P); }
}

// ------------------------------------------------------------------ per frame
const charPos = (i) => ({ x: LINE_X + i * ADV, y: LINE_Y });
const sprOnChar = (i) => ({ x: LINE_X + i * ADV + ADV / 2 - SPR_W * PX / 2, y: LINE_Y - SPR_H * PX + 6 });
function setGrid(g) { if (curGrid !== g) { drawGrid(sprCtx, g); curGrid = g; } }
function renderLine(line, t, opts = {}) {
  // lazily (re)build spans for this line
  if (lyrBox.dataset.line !== String(opts.id)) {
    lyrBox.innerHTML = ''; lyrBox.dataset.line = String(opts.id); chars2d = line.chars.map(([ch, , tag]) => {
      const s = document.createElement('span'); s.textContent = ch;
      const st = tagStyle(tag);
      s.style.cssText = `position:absolute;font:900 ${opts.size || 38}px 'Noto Serif SC',serif;color:${st.color};transform-origin:50% 90%;text-shadow:${st.shadow};white-space:nowrap`;
      lyrBox.appendChild(s); return s;
    });
  }
  const env = kickEnv(t, 10);
  line.chars.forEach(([ch, tc, tag], i) => {
    const s = chars2d[i], p = pop(t - tc), x0 = (opts.x ?? LINE_X) + i * (opts.adv || ADV), y0 = (opts.y ?? LINE_Y) + Math.sin(i * 1.1) * 4;
    let dx = 0, dy = p.y, sc = p.s * (1 + env * .06 * (t > tc ? 1 : 0)), rot = (1 - p.r) * (i % 2 ? 18 : -18), op = p.o;
    if (opts.flow) { const d = Math.max(0, t - tc); dx += d * 22; dy += Math.sin(d * 4 + i) * 6; }
    const ex = t - line.end - i * .025;                                       // exit: fly up and away
    if (ex > 0) { const k = easeIn(range(ex, 0, .35)); dy -= 90 * k; dx += 40 * k * (i % 2 ? 1 : -1); rot += 50 * k * (i % 2 ? 1 : -1); op *= 1 - k; }
    s.style.left = (x0 + dx) + 'px'; s.style.top = (y0 + dy) + 'px'; s.style.opacity = op.toFixed(3);
    s.style.transform = `scale(${Math.max(0, sc).toFixed(3)}) rotate(${rot.toFixed(2)}deg)`;
  });
}
function hopBetween(a, b, k, h) { return { x: lerp(a.x, b.x, easeInOut(k)), y: lerp(a.y, b.y, easeInOut(k)) - Math.sin(Math.PI * k) * h }; }

export function update(t) {
  const env = kickEnv(t, 9), env2 = kickEnv(t, 5);
  // visibility of the whole 2D layer
  root.style.opacity = (t < 15.4 || t > 29.0) ? 0 : 1;          // the block-flip mask (mv.html) does the reveal
  if (t < 15.4 || t > 29.0) return;
  // ---------------- camera
  let sc, ox, oy, ry = -7 + 3 * Math.sin((t - 15.5) * .45), rz = -1.2 + .9 * Math.sin((t - 15.5) * .6), rx = 5;
  const intro = easeOut(range(t, 15.42, 16.5));
  const fz = (t >= 16.44 && t < 16.93) ? 16.44 : t;                       // the beat drops out: hold the frame
  sc = lerp(5.4, 1.32, intro) * (1 + .028 * kickEnv(fz, 9)) + (t >= 16.93 ? .16 * Math.exp(-(t - 16.93) * 5) : 0);
  ox = lerp(COVER.x + COVER.w / 2, 650 + 50 * Math.sin((t - 15.5) * .3), intro); oy = lerp(COVER.y + COVER.h / 2, 330, intro);
  if (t >= 16.44 && t < 16.93) { ry = -7 + 3 * Math.sin((16.44 - 15.5) * .45); rz = -1.2 + .9 * Math.sin((16.44 - 15.5) * .6); }
  let shx = 0, shy = 0; if (t > 23.0 && t < 23.4) { const d = t - 23.0, a = 14 * Math.exp(-d * 10); shx = Math.sin(d * 90) * a; shy = Math.cos(d * 70) * a * .6; }
  const outro = smooth(range(t, 27.95, 28.9)); sc *= lerp(1, .45, outro); rz += outro * 5;
  cam.style.transformOrigin = `${ox}px ${oy}px`;
  cam.style.transform = `translate(${640 - ox + shx}px,${352 - oy + shy}px) perspective(1400px) rotateX(${rx}deg) rotateY(${ry * (1 - outro)}deg) rotateZ(${rz}deg) scale(${sc})`;
  root.style.filter = (t >= 16.44 && t < 16.93) ? 'brightness(.78) saturate(.8)' : 'none';
  // ---------------- player widgets
  const prog = range(t, 0, 30.6); barFill.style.width = (prog * 100) + '%'; barKnob.style.left = (prog * 100) + '%';
  timeEl.firstChild.textContent = '0:' + String(Math.floor(t)).padStart(2, '0');
  specCols.forEach((bs, i) => { const k = lastKick(t); const h = Math.round(1 + (Math.abs(Math.sin(i * .9 + k * 3.1)) * 3.5 + Math.abs(Math.sin(i * .37 + k * 1.7)) * 1.5) * (.35 + .65 * env) + env * 1.2); bs.forEach((b, j) => b.style.opacity = j < h ? (.35 + .65 * (j + 1) / h).toFixed(2) : 0); });
  // together: 2 → 1 (爱已不在这里)
  const leave = range(t, 20.56, 21.25);
  avB.style.filter = `grayscale(${smooth(range(t, 20.56, 20.85))})`; avB.style.transform = `translateX(${easeIn(range(t, 20.85, 21.25)) * 40}px)`; avB.style.opacity = 1 - smooth(range(t, 20.95, 21.25));
  heartEl.style.opacity = 1 - smooth(range(t, 20.56, 20.8)); heartEl.style.transform = `scale(${1 + .3 * kickEnv(t, 8) * (t < 20.56 ? 1 : 0)})`;
  const newTxt = t >= 21.25 ? '一起听 · 1 人在听' : '一起听 · 2 人在听';
  if (togetherTxt.textContent !== newTxt) togetherTxt.textContent = newTxt;
  togetherTxt.style.transform = t >= 21.25 ? `scale(${1 + .4 * Math.exp(-(t - 21.25) * 8)})` : 'none';
  // ---------------- lyrics
  const L5 = LINES[4], L6 = LINES[5], L7 = LINES[6], L8 = LINES[7];
  if (t < 20.45) { prevEl.textContent = '你有多爱我'; nextEl.textContent = '爱已不在这里我却还没走脱'; renderLine(L5, t, { id: 5 }); }
  else if (t < 23.8) { prevEl.textContent = '如今一个人听歌总是会觉得难过'; nextEl.textContent = '列表里的歌'; renderLine(L6, t, { id: 6 }); }
  else if (t < 26.1) { prevEl.textContent = ''; nextEl.textContent = ''; lyrBox.innerHTML = ''; lyrBox.dataset.line = ''; }
  else { prevEl.textContent = ''; nextEl.textContent = ''; renderLine(L8, t, { id: 8, x: 520, y: 470, adv: 74, size: 52, flow: true }); }
  prevEl.style.opacity = t < 23.6 ? 1 : 0; nextEl.style.opacity = t < 23.6 ? 1 : 0;
  // ---------------- playlist (列表里的歌), then it flows away (随过往流动)
  const plIn = easeOut(range(t, 23.7, 24.05)), plOut = range(t, 28.3, 28.6);
  playlist.style.opacity = (plIn * (1 - plOut)).toFixed(3); playlist.style.transform = `translateX(${(1 - plIn) * 60}px) scale(${.96 + .04 * plIn})`;
  if (t >= 23.7) {
    if (plTitle.dataset.b !== '1') { plTitle.innerHTML = ''; L7.chars.forEach(([ch]) => { const s = document.createElement('span'); s.textContent = ch; const st = tagStyle(L7.chars[plTitle.children.length][2]); s.style.cssText = `position:absolute;top:0;transform-origin:50% 90%;color:${st.color};text-shadow:${st.shadow}`; plTitle.appendChild(s); }); plTitle.dataset.b = '1'; }
    [...plTitle.children].forEach((s, i) => { const p = pop(t - L7.chars[i][1]); s.style.left = (i * 34) + 'px'; s.style.opacity = p.o; s.style.transform = `translateY(${p.y}px) scale(${Math.max(0, p.s)}) rotate(${(1 - p.r) * (i % 2 ? 18 : -18)}deg)`; });
  }
  const ROW_T = [23.94, 24.43, 24.89, 25.36, 25.82], GONE_T = [26.18, 26.5, 27.02, 27.56, 27.88];
  rows.forEach((r, i) => { const a = easeOut(range(t, ROW_T[i], ROW_T[i] + .25)), b = range(t, GONE_T[i], GONE_T[i] + .25); r.style.opacity = (a * (1 - b)).toFixed(3); r.style.transform = `translateX(${(1 - a) * 40 + b * 30}px)`; });
  // ---------------- footprints (pink, ahead of him)
  const fpts = [];
  if (t < 20.45) for (let i = 1; i < 14; i++) fpts.push({ x: LINE_X + i * ADV + 6, y: LINE_Y - 8 - (i % 2) * 6, t0: 15.95 + i * .035, step: L5.chars[i][1] + .1 });
  else if (t < 23.8) { for (let i = 1; i < 12; i++) fpts.push({ x: LINE_X + i * ADV + 6, y: LINE_Y - 8 - (i % 2) * 6, t0: 20.3 + i * .03, step: L6.chars[i][1] + .1 });
    for (let k = 0; k < 4; k++) fpts.push({ x: LINE_X + 12 * ADV + 10 + k * 26, y: LINE_Y - 8 - (k % 2) * 6, t0: 20.66 + k * .03, step: 22.97 }); }
  prints.forEach((p, k) => {
    const f = fpts[k >> 1]; if (!f) { p.style.opacity = 0; return; }
    const second = k & 1; const a = smooth(range(t, f.t0, f.t0 + .12)), stepped = t > f.step ? 1 - smooth(range(t, f.step, f.step + .25)) * .8 : 1;
    p.style.left = (f.x + (second ? 14 : 0)) + 'px'; p.style.top = (f.y - (second ? 6 : 0)) + 'px';
    p.style.opacity = (a * stepped * (.75 + .25 * env)).toFixed(3); p.style.transform = `scale(${1 + .8 * Math.exp(-(t - f.t0) * 8) * (t > f.t0 ? 1 : 0) + (t > f.step ? .5 * Math.exp(-(t - f.step) * 8) : 0)})`;
  });
  // ---------------- sprite
  let pos = { ...SPR_HOME }, g = STAND, sx = 1, sy = 1, rot = 0, show = t >= 16.0 && t < 28.45;
  const j = kickEnv(t, 9), jw = Math.exp(-(t - lastKick(t)) * 7) * Math.cos((t - lastKick(t)) * 30);
  sy = 1 - .14 * jw; sx = 1 / Math.sqrt(sy);
  const hopLine = (line, startPos) => {     // hop onto the char being sung
    let idx = -1; line.chars.forEach(([, tc], i) => { if (t >= tc - .02) idx = i; });
    if (idx < 0) return startPos;
    const tc = line.chars[idx][1], prev = idx === 0 ? startPos : sprOnChar(idx - 1), k = range(t, tc - .02, tc + .2);
    if (k < 1) { g = JUMP; return hopBetween(prev, sprOnChar(idx), k, idx === 0 ? 120 : 34); }
    return sprOnChar(idx);
  };
  if (t >= 16.0 && t < 20.45) pos = hopLine({ chars: L5.chars.map((c, i) => i === 0 ? [c[0], 16.12] : c) }, SPR_HOME);
  if (t >= 20.45 && t < 23.8) {
    const L6h = { chars: L6.chars.slice(0, 10) };
    pos = hopLine(L6h, sprOnChar(13));
    if (t >= 22.9) {                               // dash along the footprints to the edge… bonk… bounced back
      const edge = { x: WIN.x + WIN.w - SPR_W * PX - 8, y: LINE_Y - SPR_H * PX + 6 };
      if (t < 23.0) { pos = hopBetween(sprOnChar(9), edge, range(t, 22.9, 23.0), 20); g = JUMP; }
      else if (t < 23.18) { pos = edge; const d = t - 23.0; sx = .55 + .45 * (1 - Math.exp(-d * 12)); sy = 1 / sx; rot = 0; g = SAD; }
      else { pos = hopBetween(edge, sprOnChar(10), range(t, 23.18, 23.5), 60); g = t < 23.5 ? JUMP : SAD; rot = -20 * Math.sin(Math.PI * range(t, 23.18, 23.5)); }
    }
  }
  if (t >= 23.8 && t < 26.1) {                    // hops down the playlist rows
    const ROW_Y = (i) => WIN.y + 58 + 18 + 46 + 6 + i * 52 + 23 - SPR_H * PX;
    const RX = WIN.x + (LINE_X - WIN.x - 14) + 500 - 110;
    let i = -1; ROW_T.forEach((rt, k) => { if (t >= rt) i = k; });
    const from = i <= 0 ? sprOnChar(10) : { x: RX, y: ROW_Y(i - 1) }, to = i < 0 ? sprOnChar(10) : { x: RX, y: ROW_Y(i) };
    const k = i < 0 ? 1 : range(t, ROW_T[i], ROW_T[i] + .22); pos = k < 1 ? hopBetween(from, to, k, 40) : to; if (k < 1) g = JUMP;
  }
  if (t >= 26.1) { const RX = WIN.x + (LINE_X - WIN.x - 14) + 500 - 110, y = WIN.y + 58 + 18 + 46 + 6 + 4 * 52 + 23 - SPR_H * PX; pos = { x: RX, y }; g = SAD; sy = 1 - .08 * jw; }
  setGrid(g);
  const sprIn = t >= 16.0 ? Math.exp(-(t - 16.0) * 6) : 0;
  spr.style.opacity = show ? 1 : 0; spr.style.left = pos.x + 'px'; spr.style.top = pos.y + 'px';
  spr.style.transform = `rotate(${rot}deg) scale(${(sx * (1 + .3 * sprIn)).toFixed(3)},${(sy * (1 - .3 * sprIn)).toFixed(3)})`;
  // ---------------- particles: reassemble the sprite (15.5 → 16.0), rows dissolving into pixel streams (26.18 →)
  fxc.clearRect(0, 0, 2560, 1440);
  const OX = 640, OY = 360;   // fx canvas offset
  if (t >= 15.42 && t < 16.05) {
    const pr = rng(5); let n = 0;
    STAND.forEach((row, jj) => row.forEach((v, ii) => {
      if (!v) return; n++;
      const ang = pr() * 6.283, rad = 220 + pr() * 380, delay = pr() * .2, k = easeOut(range(t, 15.45 + delay, 15.85 + delay * .6));
      const tx = SPR_HOME.x + ii * PX, ty = SPR_HOME.y + jj * PX, sx0 = tx + Math.cos(ang) * rad, sy0 = ty + Math.sin(ang) * rad * .7;
      const x = lerp(sx0, tx, k), y = lerp(sy0, ty, k) - Math.sin(Math.PI * k) * 40;
      const size = PX * (1 + (1 - k) * 3.5), spin = (1 - k) * 6 * (pr() - .5);
      fxc.save(); fxc.translate(OX + x + PX / 2, OY + y + PX / 2); fxc.rotate(spin); fxc.shadowColor = v; fxc.shadowBlur = 14 * (1 - k) + 4; fxc.fillStyle = v; fxc.fillRect(-size / 2, -size / 2, size, size); fxc.restore();
    }));
  }
  if (t >= 26.18 && t < 28.95) {
    const pr = rng(9);
    rows.forEach((r, i) => {
      const t0 = GONE_T[i]; if (t < t0) return;
      const rx = WIN.x + (LINE_X - WIN.x - 14) + 20, ry = WIN.y + 58 + 18 + 46 + 6 + i * 52;
      const cols = ['#ffc58a', '#ff9fbf', '#9fdcff', '#d2b0ff', '#fff3e6', '#ef7a46'];
      for (let q = 0; q < 70; q++) {
        const d = t - t0 - pr() * .25; const px = rx + pr() * 450, py = ry + pr() * 46, c = cols[(pr() * 6) | 0], sp = 260 + pr() * 380, wob = pr() * 6;
        if (d < 0) continue;
        const x = px + d * sp + d * d * 120, y = py - d * 40 * (pr() + .3) + Math.sin(d * 5 + wob) * 18;
        const s = 6 * (1 - Math.min(1, d / 2.4)) + 2; fxc.globalAlpha = Math.max(0, 1 - d / 2.6); fxc.shadowColor = c; fxc.shadowBlur = 10; fxc.fillStyle = c; fxc.fillRect(OX + x, OY + y, s, s);
      }
    });
    fxc.globalAlpha = 1;
  }
}
