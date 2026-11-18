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

// ------------------------------------------------------------------ sprite animation frames
const RUN_A = STAND.map((r, j) => j === 9 ? [_, _, _, O, _, _, _, _, _, _, _, O, _, _, _] : r);
const RUN_B = STAND.map((r, j) => j === 9 ? [_, _, _, _, _, O, _, _, _, O, _, _, _, _, _] : r);
const FALL = JUMP.map((r, j) => j === 9 ? [_, _, _, _, O, _, O, _, O, _, O, _, _, _, _] : r);
const SIT = STAND.map((r, j) => j === 9 ? [_, _, O, O, _, _, _, _, _, _, _, O, O, _, _] : r);
// ------------------------------------------------------------------ hop choreography (beat-locked)
const L5c = LINES[4].chars, L6c = LINES[5].chars;
const sungIdx = (chars, t) => { let i = -1; chars.forEach(([, tc], k) => { if (t >= tc - .02) i = k; }); return i; };
const CH = (i) => sprOnChar(i);
const knob = (t) => ({ x: WIN.x + 36 + 228 * range(t, 0, 30.6) - SPR_W * PX / 2, y: WIN.y + 384 - SPR_H * PX + 8 });
const ROW_TT = [23.94, 24.43, 24.89, 25.36, 25.82];
const ROW_POS = (i) => ({ x: WIN.x + (LINE_X - WIN.x - 14) + 500 - 110 - i * 14, y: WIN.y + 58 + 18 + 46 + 6 + i * 52 + 23 - SPR_H * PX });
const EDGE = { x: WIN.x + WIN.w - SPR_W * PX - 6, y: LINE_Y - SPR_H * PX + 6 };
// [takeoff time, destination, arc height px, flips (+1/-1 = full spin), duration]
const EVENTS = [
  [16.12, CH(1), 140, 1, .34],
  [16.93, CH(3), 46, 0, .32], [17.39, CH(4), 34, 0, .3], [17.86, CH(6), 58, -1, .34], [18.32, CH(8), 48, 0, .32],
  [18.81, CH(10), 58, 1, .34], [19.27, CH(12), 50, 0, .32],
  [19.74, { x: CH(13).x + 26, y: CH(13).y + 46 }, 18, 0, .5, 'slip'],
  [20.67, CH(1), 170, -1, .44],
  [21.13, CH(2), 34, 0, .3], [21.62, CH(5), 56, 1, .34], [22.08, CH(6), 30, 0, .3], [22.55, CH(8), 44, 0, .3],
  [22.94, EDGE, 8, 0, .1, 'dash'],
  [23.18, CH(10), 96, -1, .36],
  [23.94, ROW_POS(0), 90, 1, .34], [24.43, ROW_POS(1), 40, 0, .3], [24.89, ROW_POS(2), 40, -1, .32], [25.36, ROW_POS(3), 40, 0, .3], [25.82, ROW_POS(4), 46, 1, .32],
  [26.31, 'knob', 120, -1, .42],
];
const resolve = (p, t) => p === 'knob' ? knob(t) : p;
function spriteAt(t) {
  // returns {x, y, rot, sx, sy, grid}
  let pos = { ...SPR_HOME }, prevPos = { ...SPR_HOME }, e = -1;
  for (let i = 0; i < EVENTS.length; i++) if (t >= EVENTS[i][0]) e = i;
  const out = { x: pos.x, y: pos.y, rot: 0, sx: 1, sy: 1, grid: STAND };
  if (e >= 0) prevPos = e === 0 ? { ...SPR_HOME } : resolve(EVENTS[e - 1][1], EVENTS[e][0]);
  if (e < 0) { const d = t - 16.0; const w = Math.exp(-d * 9) * Math.cos(d * 30); out.sy = 1 - .25 * w; out.sx = 1 / Math.sqrt(out.sy); }
  else {
    const [t0, dst, h, flip, dur, kind] = EVENTS[e], b = resolve(dst, Math.min(t, t0 + dur)), k = (t - t0) / dur;
    if (k < 1) {
      out.x = lerp(prevPos.x, b.x, kind === 'dash' ? easeIn(k) : k); out.y = lerp(prevPos.y, b.y, k) - 4 * h * k * (1 - k);
      out.grid = kind === 'dash' ? (Math.floor(k * 6) % 2 ? RUN_A : RUN_B) : (k < .5 ? JUMP : FALL);
      out.sy = kind === 'dash' ? .9 : 1 + .16 * Math.sin(Math.PI * k) * (k < .5 ? 1 : .4); out.sx = kind === 'dash' ? 1.2 : 1 / Math.sqrt(out.sy);
      out.rot = flip * 360 * easeInOut(k) + Math.sign(b.x - prevPos.x) * 10 * Math.sin(Math.PI * k);
      if (kind === 'slip') { out.rot = -28 * k; out.grid = FALL; }
    } else {
      const land = resolve(dst, t); out.x = land.x; out.y = land.y; const d = t - (t0 + dur);
      const w = Math.exp(-d * 10) * Math.cos(d * 32); out.sy = 1 - .28 * w; out.sx = 1 / Math.sqrt(Math.max(.5, out.sy));
      if (kind === 'slip') { out.grid = SAD; out.rot = -28 + 20 * smooth(range(d, 0, .3)); }
      if (kind === 'dash') { out.sx = .45 + .55 * (1 - Math.exp(-d * 12)); out.sy = 1 / out.sx; out.grid = SAD; }   // bonk: flattened against the frame
      if (dst === 'knob') { out.grid = SIT; const j = kickEnv(t, 10); out.sy = (1 - .12 * j) * out.sy; }
      // crouch before the next take-off
      const nx = EVENTS[e + 1]; if (nx && nx[0] - t < .07 && nx[0] - t > 0) { out.sy *= .8; out.sx *= 1.12; }
      // idle bounce on kicks while waiting
      if (!nx || nx[0] - t > .07) { const j = kickEnv(t, 12); out.sy *= 1 - .08 * j; }
    }
  }
  return out;
}

// ------------------------------------------------------------------ camera keys: big beat-locked moves
// [time, originX, originY, scale, rotX, rotY, rotZ]
const CK = [
  [16.5, 650, 330, 1.32, 5, -7, -1.2],
  [16.93, 820, 430, 1.62, 8, -14, -4],                    // slam in at bottom-right after the drop-out…
  [19.9, 540, 270, 1.36, 3, 5, 2.5],                       // …and sweep diagonally up to top-left
  [20.5, 380, 300, 1.55, 4, 12, -3],                       // whip to the left for the new line
  [22.85, 860, 300, 1.45, 4, -9, 1.5],                     // track right with him
  [23.0, 960, 300, 1.95, 2, -14, 3],                       // push into the bonk
  [23.6, 700, 320, 1.42, 5, -4, -1],
  [24.0, 760, 250, 1.55, 10, -6, 2],                       // tilt down the playlist
  [25.9, 760, 420, 1.55, 3, -2, -1.5],
  [26.3, 420, 470, 1.6, 4, 8, -2],                         // he rides the progress bar
  [27.9, 760, 380, 1.25, 4, -6, 1.5],                      // pan right with the stream of pixels
];
function camKeys(t) {
  let i = 0; while (i < CK.length - 2 && t >= CK[i + 1][0]) i++;
  const a = CK[i], b = CK[i + 1], k = easeInOut(range(t, a[0], b[0]));
  const fast = (b[0] - a[0]) < .7;                         // short segments are whips
  const kk = fast ? 1 - Math.pow(1 - range(t, a[0], b[0]), 4) : k;
  return a.slice(1).map((v, j) => lerp(v, b[j + 1], kk));
}

export function update(t) {
  const env = kickEnv(t, 9);
  root.style.opacity = (t < 15.4 || t > 29.0) ? 0 : 1;          // the block-flip mask (mv.html) does the reveal
  if (t < 15.4 || t > 29.0) return;
  const tf = (t >= 16.44 && t < 16.93) ? 16.44 : t;               // the beat drops out: everything holds
  // ---------------- camera
  const intro = easeOut(range(t, 15.42, 16.5));
  let [ox, oy, sc, rx, ry, rz] = camKeys(Math.max(16.5, tf));
  if (t < 16.5) { ox = lerp(COVER.x + COVER.w / 2, 650, intro); oy = lerp(COVER.y + COVER.h / 2, 330, intro); sc = lerp(5.4, 1.32, intro); rx = 5; ry = lerp(0, -7, intro); rz = lerp(6, -1.2, intro); }
  sc *= 1 + .03 * kickEnv(tf, 9) + (t >= 16.93 ? .14 * Math.exp(-(t - 16.93) * 5) : 0);
  let shx = 0, shy = 0; if (t > 23.04 && t < 23.45) { const d = t - 23.04, a = 16 * Math.exp(-d * 10); shx = Math.sin(d * 90) * a; shy = Math.cos(d * 70) * a * .6; }
  const outro = smooth(range(t, 27.95, 28.9)); sc *= lerp(1, .45, outro); rz += outro * 5;
  cam.style.transformOrigin = `${ox}px ${oy}px`;
  cam.style.transform = `translate(${640 - ox + shx}px,${352 - oy + shy}px) perspective(1400px) rotateX(${rx}deg) rotateY(${ry * (1 - outro)}deg) rotateZ(${rz}deg) scale(${sc})`;
  root.style.filter = (t >= 16.44 && t < 16.93) ? 'brightness(.78) saturate(.8)' : 'none';
  // ---------------- player widgets
  const prog = range(t, 0, 30.6); barFill.style.width = (prog * 100) + '%'; barKnob.style.left = (prog * 100) + '%';
  timeEl.firstChild.textContent = '0:' + String(Math.floor(t)).padStart(2, '0');
  specCols.forEach((bs, i) => { const k = lastKick(tf); const h = Math.round(1 + (Math.abs(Math.sin(i * .9 + k * 3.1)) * 3.5 + Math.abs(Math.sin(i * .37 + k * 1.7)) * 1.5) * (.35 + .65 * env) + env * 1.2); bs.forEach((b, j) => b.style.opacity = j < h ? (.35 + .65 * (j + 1) / h).toFixed(2) : 0); });
  avB.style.filter = `grayscale(${smooth(range(t, 20.56, 20.85))})`; avB.style.transform = `translateX(${easeIn(range(t, 20.85, 21.25)) * 40}px)`; avB.style.opacity = 1 - smooth(range(t, 20.95, 21.25));
  heartEl.style.opacity = 1 - smooth(range(t, 20.56, 20.8)); heartEl.style.transform = `scale(${1 + .3 * kickEnv(t, 8) * (t < 20.56 ? 1 : 0)})`;
  const newTxt = t >= 21.25 ? '一起听 · 1 人在听' : '一起听 · 2 人在听';
  if (togetherTxt.textContent !== newTxt) togetherTxt.textContent = newTxt;
  togetherTxt.style.transform = t >= 21.25 ? `scale(${1 + .4 * Math.exp(-(t - 21.25) * 8)})` : 'none';
  // ---------------- lyrics
  const L5 = LINES[4], L6 = LINES[5], L7 = LINES[6], L8 = LINES[7];
  if (t < 20.45) { prevEl.textContent = '你有多爱我'; nextEl.textContent = '爱已不在这里我却还没走脱'; renderLine(L5, tf, { id: 5 }); }
  else if (t < 23.8) { prevEl.textContent = '如今一个人听歌总是会觉得难过'; nextEl.textContent = '列表里的歌'; renderLine(L6, t, { id: 6 }); }
  else if (t < 26.1) { prevEl.textContent = ''; nextEl.textContent = ''; lyrBox.innerHTML = ''; lyrBox.dataset.line = ''; }
  else { prevEl.textContent = ''; nextEl.textContent = ''; renderLine(L8, t, { id: 8, x: 520, y: 470, adv: 74, size: 52, flow: true }); }
  prevEl.style.opacity = t < 23.6 ? 1 : 0; nextEl.style.opacity = t < 23.6 ? 1 : 0;
  // ---------------- playlist
  const plIn = easeOut(range(t, 23.7, 24.05)), plOut = range(t, 28.3, 28.6);
  playlist.style.opacity = (plIn * (1 - plOut)).toFixed(3); playlist.style.transform = `translateX(${(1 - plIn) * 60}px) scale(${.96 + .04 * plIn})`;
  if (t >= 23.7) {
    if (plTitle.dataset.b !== '1') { plTitle.innerHTML = ''; L7.chars.forEach(([ch, , tag]) => { const s = document.createElement('span'); s.textContent = ch; const st = tagStyle(tag); s.style.cssText = `position:absolute;top:0;transform-origin:50% 90%;color:${st.color};text-shadow:${st.shadow}`; plTitle.appendChild(s); }); plTitle.dataset.b = '1'; }
    [...plTitle.children].forEach((s, i) => { const p = pop(t - L7.chars[i][1]); s.style.left = (i * 34) + 'px'; s.style.opacity = p.o; s.style.transform = `translateY(${p.y}px) scale(${Math.max(0, p.s)}) rotate(${(1 - p.r) * (i % 2 ? 18 : -18)}deg)`; });
  }
  const GONE_T = [26.18, 26.5, 27.02, 27.56, 27.88];
  rows.forEach((r, i) => { const a = easeOut(range(t, ROW_TT[i] - .1, ROW_TT[i] + .15)), b = range(t, GONE_T[i], GONE_T[i] + .25); r.style.opacity = (a * (1 - b)).toFixed(3); r.style.transform = `translateX(${(1 - a) * 40 + b * 30}px) scale(${1 + .06 * (t > ROW_TT[i] + .3 && t < ROW_TT[i] + .45 ? 1 : 0)})`; });
  // ---------------- footprints (pink, ahead of him)
  const fpts = [];
  if (t < 20.45) for (let i = 1; i < 14; i++) fpts.push({ x: LINE_X + i * ADV + 6, y: LINE_Y - 8 - (i % 2) * 6, t0: 15.95 + i * .035, step: stepTime(i, 5) });
  else if (t < 23.8) { for (let i = 1; i < 12; i++) fpts.push({ x: LINE_X + i * ADV + 6, y: LINE_Y - 8 - (i % 2) * 6, t0: 20.3 + i * .03, step: stepTime(i, 6) });
    for (let k = 0; k < 4; k++) fpts.push({ x: LINE_X + 12 * ADV + 10 + k * 26, y: LINE_Y - 8 - (k % 2) * 6, t0: 20.66 + k * .03, step: 22.97 }); }
  prints.forEach((p, k) => {
    const f = fpts[k >> 1]; if (!f) { p.style.opacity = 0; return; }
    const second = k & 1; const a = smooth(range(t, f.t0, f.t0 + .12)), stepped = t > f.step ? 1 - smooth(range(t, f.step, f.step + .25)) * .8 : 1;
    p.style.left = (f.x + (second ? 14 : 0)) + 'px'; p.style.top = (f.y - (second ? 6 : 0)) + 'px';
    p.style.opacity = (a * stepped * (.75 + .25 * env)).toFixed(3); p.style.transform = `scale(${1 + .8 * Math.exp(-(t - f.t0) * 8) * (t > f.t0 ? 1 : 0) + (t > f.step ? .5 * Math.exp(-(t - f.step) * 8) : 0)})`;
  });
  // ---------------- sprite
  const show = t >= 16.0 && t < 28.45;
  const s = spriteAt(tf);
  setGrid(s.grid);
  spr.style.opacity = show ? 1 : 0; spr.style.left = s.x + 'px'; spr.style.top = s.y + 'px';
  spr.style.transform = `rotate(${s.rot.toFixed(2)}deg) scale(${s.sx.toFixed(3)},${s.sy.toFixed(3)})`;
  // ---------------- fx canvas: reassembly particles, motion ghosts, row pixel streams
  fxc.clearRect(0, 0, 2560, 1440);
  const OX = 640, OY = 360;
  if (show) {                                   // motion ghosts when moving fast
    for (let g = 1; g <= 3; g++) { const q = spriteAt(Math.max(16.0, tf - g * .028)); const dist = Math.hypot(q.x - s.x, q.y - s.y); if (dist < 7) continue;
      fxc.globalAlpha = [.3, .17, .08][g - 1]; fxc.imageSmoothingEnabled = false; fxc.drawImage(spr, OX + q.x, OY + q.y, SPR_W * PX, SPR_H * PX); }
    fxc.globalAlpha = 1;
  }
  if (t >= 15.42 && t < 16.05) {
    const pr = rng(5);
    STAND.forEach((row, jj) => row.forEach((v, ii) => {
      if (!v) return;
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
      const rx0 = WIN.x + (LINE_X - WIN.x - 14) + 20, ry0 = WIN.y + 58 + 18 + 46 + 6 + i * 52;
      const cols = ['#ffc58a', '#ff9fbf', '#9fdcff', '#d2b0ff', '#fff3e6', '#ef7a46'];
      for (let q = 0; q < 70; q++) {
        const d = t - t0 - pr() * .25; const px = rx0 + pr() * 450, py = ry0 + pr() * 46, c = cols[(pr() * 6) | 0], sp = 260 + pr() * 380, wob = pr() * 6;
        if (d < 0) continue;
        const x = px + d * sp + d * d * 120, y = py - d * 40 * (pr() + .3) + Math.sin(d * 5 + wob) * 18;
        const sz = 6 * (1 - Math.min(1, d / 2.4)) + 2; fxc.globalAlpha = Math.max(0, 1 - d / 2.6); fxc.shadowColor = c; fxc.shadowBlur = 10; fxc.fillStyle = c; fxc.fillRect(OX + x, OY + y, sz, sz);
      }
    });
    fxc.globalAlpha = 1; fxc.shadowBlur = 0;
  }
}
// when does the sprite land on (or pass) char i of line n — used to fade the footprint he steps on
function stepTime(i, n) {
  for (const e of EVENTS) { const d = e[1]; if (d && d.x !== undefined && Math.abs(d.y - LINE_Y + SPR_H * PX - 6) < 2 && d.x >= sprOnChar(i).x - 2 && ((n === 5 && e[0] < 20.4) || (n === 6 && e[0] > 20.4 && e[0] < 23.8))) return e[0] + e[4]; }
  return n === 6 ? 22.97 : 19.9;
}
