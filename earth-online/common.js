// shared timing + pixel art for "退出地球 Online"
export const BEATS = [0.116, 0.673, 1.231, 1.765, 2.322, 2.879, 3.437, 3.971, 4.528, 5.062, 5.619, 6.177, 6.734, 7.268, 7.802, 8.382, 8.94, 9.474, 10.031, 10.588, 11.122, 11.68, 12.237, 12.771, 13.328, 13.886, 14.443, 14.977, 15.511, 16.068, 16.625];
export const T = { beat: .5535, dur: 17.71, lines: [0, 2.26, 4.58, 6.58, 9.06, 11.0, 13.16, 15.38, 17.71] };
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const range = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
export const smooth = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
export const easeOut = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
export const easeIn = k => Math.pow(clamp(k, 0, 1), 3);
export const easeInOut = k => { k = clamp(k, 0, 1); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const backOut = (k, s = 1.7) => { k = clamp(k, 0, 1) - 1; return 1 + k * k * ((s + 1) * k + s); };
export function lastBeat(t) { let b = -1; for (const x of BEATS) { if (x <= t) b = x; else break; } return b; }
export function kick(t, decay = 9) { const b = lastBeat(t); return b < 0 ? 0 : Math.exp(-(t - b) * decay); }
export function beatIndex(t) { let i = -1; BEATS.forEach((x, k) => { if (x <= t) i = k; }); return i; }
export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// ---- pixel art (colour strings; null = empty)
const _ = null;
const O = '#e8703f', L = '#ff9a66', D = '#b8522c', E = '#2a1610', K = '#ff9a5c', C = '#fff3e6', B = '#ff8f8f';
export const GRID = [
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
const recolor = (g, map) => g.map(r => r.map(c => c && (map[c] || c)));
export const CLOSED = GRID.map((r, j) => j === 4 ? r.map(c => c === E ? O : c) : j === 5 ? [_, K, K, O, E, E, O, O, E, E, O, O, K, K, _].map((c, i) => (i === 1 || i === 2 || i === 12 || i === 13) ? K : c) : r);
export const GHOST_GRID = recolor(GRID, { [O]: '#f4f0ff', [L]: '#ffffff', [D]: '#d9cff7', [K]: '#e3dbff', [C]: '#ffffff', [E]: '#7d6fb8', [B]: '#ffc2d6' });
export const PINK_GRID = recolor(GRID, { [O]: '#ff9cba', [L]: '#ffc0d4', [D]: '#d9708f', [K]: '#ff86ad', [B]: '#ff6f9a' });
export const GREY_GRID = recolor(GRID, { [O]: '#cfc8bf', [L]: '#ddd7cf', [D]: '#aaa298', [K]: '#c4bcb2', [C]: '#ece6dd', [B]: '#d8c8c0' });
const Wt = '#ffffff', Yl = '#ffd66e', Gn = '#7fbf7a', Gd = '#5c9a58';
export const FLOWER = [
  [_, _, Wt, Wt, _, Wt, Wt, _, _],
  [_, Wt, Wt, Wt, Wt, Wt, Wt, Wt, _],
  [Wt, Wt, Wt, Yl, Yl, Yl, Wt, Wt, Wt],
  [_, Wt, Wt, Yl, Yl, Yl, Wt, Wt, _],
  [_, _, Wt, Wt, Wt, Wt, Wt, _, _],
  [_, _, _, _, Gn, _, _, _, _],
  [_, _, Gn, _, Gn, _, _, _, _],
  [_, _, _, Gd, Gn, _, _, _, _],
  [_, _, _, _, Gn, _, Gn, _, _],
  [_, _, _, _, Gn, Gd, _, _, _],
  [_, _, _, _, Gn, _, _, _, _]];
const g = '#ffc94a', gd = '#e0a12a', r = '#ff8fb0', rd = '#e0607f', v = '#b9a6ff', vd = '#8a74e0', m = '#8fe3c4', md = '#4fb894', w = '#ffffff', k = '#3a2b2a';
export const ICONS = {
  coin: [[_, _, g, g, g, g, _, _], [_, g, gd, g, g, gd, g, _], [g, g, g, gd, gd, g, g, g], [g, g, gd, g, g, g, g, g], [g, g, g, gd, gd, g, g, g], [g, g, g, g, g, gd, g, g], [_, g, gd, gd, gd, g, g, _], [_, _, g, g, g, g, _, _]],
  heart: [[_, r, r, _, _, r, r, _], [r, r, r, r, r, w, r, r], [r, r, r, r, r, r, r, r], [r, r, r, r, r, r, r, r], [_, r, r, r, r, r, r, _], [_, _, r, r, r, r, _, _], [_, _, _, r, r, _, _, _], [_, _, _, _, _, _, _, _]],
  trophy: [[g, g, g, g, g, g, g, g], [g, gd, g, g, g, g, gd, g], [_, g, g, g, g, g, g, _], [_, g, g, g, g, g, g, _], [_, _, g, g, g, g, _, _], [_, _, _, g, g, _, _, _], [_, _, gd, gd, gd, gd, _, _], [_, gd, gd, gd, gd, gd, gd, _]],
  pad: [[_, _, _, _, _, _, _, _], [_, v, v, v, v, v, v, _], [v, v, w, v, v, v, k, v], [v, w, w, w, v, k, v, k], [v, v, w, v, v, v, k, v], [v, v, v, vd, vd, v, v, v], [_, v, v, _, _, v, v, _], [_, _, _, _, _, _, _, _]],
  star: [[_, _, _, g, g, _, _, _], [_, _, _, g, g, _, _, _], [g, g, g, g, g, g, g, g], [_, g, g, g, g, g, g, _], [_, _, g, g, g, g, _, _], [_, g, g, _, _, g, g, _], [g, g, _, _, _, _, g, g], [_, _, _, _, _, _, _, _]],
  book: [[m, m, m, m, m, m, m, _], [m, w, w, w, w, w, m, md], [m, w, md, md, md, w, m, md], [m, w, w, w, w, w, m, md], [m, w, md, md, w, w, m, md], [m, w, w, w, w, w, m, md], [m, m, m, m, m, m, m, md], [_, md, md, md, md, md, md, md]],
};
export function drawGrid(ctx, grid, x = 0, y = 0, s = 1, alpha = 1) { ctx.save(); ctx.globalAlpha = alpha; grid.forEach((row, j) => row.forEach((c, i) => { if (c) { ctx.fillStyle = c; ctx.fillRect(x + i * s, y + j * s, s, s); } })); ctx.restore(); }

// ---- closed-form damped spring (0 → 1). One "motion personality" for the whole film:
// SPR.snap = buttons/ticks, SPR.ui = cards & camera, SPR.calm = big type & 3D, SPR.toy = mascots & stickers
export const SPR = { snap: [3.6, .8], ui: [2.4, .75], calm: [1.6, .95], toy: [2.8, .45] };
export function spring(t, [freq, damp] = SPR.ui) {
  if (t <= 0) return 0; const w = 2 * Math.PI * freq;
  if (damp >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const wd = w * Math.sqrt(1 - damp * damp); return 1 - Math.exp(-damp * w * t) * (Math.cos(wd * t) + damp * w / wd * Math.sin(wd * t));
}
// spring that starts at time t0 (returns 0 before)
export const springAt = (t, t0, p) => spring(t - t0, p);
