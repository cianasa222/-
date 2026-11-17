// Shared timing for the MV (all times in seconds of the song)
export const BEAT = 0.4645;
export const BEATS = [0.07, 0.53, 1.0, 1.46, 1.93, 2.39, 2.88, 3.32, 3.81, 4.27, 4.74, 5.2, 5.69, 6.13, 6.62, 7.08, 7.55, 8.01, 8.5, 8.94, 9.43, 9.89, 10.36, 10.82, 11.31, 11.77, 12.24, 12.7, 13.19, 13.63, 14.12, 14.58, 15.05, 15.51, 16.0, 16.44, 16.93, 17.39, 17.86, 18.32, 18.81, 19.27, 19.74, 20.2, 20.67, 21.13, 21.62, 22.08, 22.55, 23.01, 23.5, 23.94, 24.43, 24.89, 25.36, 25.82, 26.31, 26.77, 27.24, 27.7, 28.19];
const SILENT = new Set([1, 35]);            // kick drops out here (0.53 s, 16.44 s); drums stop after 28.19
export const KICKS = BEATS.filter((_, i) => !SILENT.has(i));
export const DOWNBEATS = BEATS.filter((_, i) => i % 4 === 3 && !SILENT.has(i));

export function lastKick(t, list = KICKS) { let k = -1; for (const b of list) { if (b <= t) k = b; else break; } return k; }
export function kickEnv(t, decay = 9, list = KICKS) { const k = lastKick(t, list); return k < 0 ? 0 : Math.exp(-(t - k) * decay); }
// jelly: squash on the kick, then a damped wobble
export function jelly(t, amp = 1, list = KICKS) {
  const k = lastKick(t, list); if (k < 0) return { sy: 1, sx: 1, wob: 0 };
  const d = t - k, w = Math.exp(-d * 7) * Math.cos(d * 30);
  const sy = 1 - .16 * amp * w; return { sy, sx: 1 / Math.sqrt(sy), wob: w };
}
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
export const easeOut = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
export const easeIn = k => Math.pow(clamp(k, 0, 1), 3);
export const easeInOut = k => { k = clamp(k, 0, 1); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const range = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

// per-character sing times (from word-level alignment of the vocal)
export const LINES = [
  { s3d: true, end: 4.9, chars: [['如', .64], ['今', 1.28], ['一', 1.76, 'lav'], ['个', 2.04, 'lav'], ['人', 2.32, 'lav'], ['听', 2.54], ['歌', 2.74], ['总', 3.04], ['是', 3.22], ['会', 3.44], ['觉', 3.70], ['得', 3.86], ['失', 4.02, 'blue'], ['落', 4.48, 'blue']] },
  { s3d: true, end: 8.6, chars: [['幻', 5.06, 'pink'], ['听', 5.82, 'pink'], ['你', 6.00], ['在', 6.17], ['我', 6.34], ['的', 6.60], ['耳', 6.86, 'peach'], ['边', 7.22, 'peach'], ['轻', 7.36, 'pink'], ['轻', 7.64, 'pink'], ['诉', 7.88], ['说', 8.10]] },
  { s3d: true, end: 10.6, chars: [['夜', 8.84, 'lav'], ['色', 9.10, 'lav'], ['多', 9.28], ['温', 9.66, 'peach'], ['柔', 10.04, 'peach']] },
  { s3d: true, end: 13.25, chars: [['你', 11.26, 'pink'], ['有', 11.43], ['多', 11.60], ['爱', 12.24, 'love'], ['我', 12.78]] },
  { s3d: false, end: 20.2, chars: [['如', 15.62], ['今', 16.12], ['一', 16.66, 'lav'], ['个', 16.98, 'lav'], ['人', 17.30, 'lav'], ['听', 17.52], ['歌', 17.76], ['总', 18.02], ['是', 18.22], ['会', 18.44], ['觉', 18.70], ['得', 18.85], ['难', 19.00, 'blue'], ['过', 19.40, 'blue']] },
  { s3d: false, end: 23.7, chars: [['爱', 20.56, 'love'], ['已', 20.90], ['不', 21.18, 'blue'], ['在', 21.28, 'blue'], ['这', 21.46], ['里', 21.69], ['我', 21.92], ['却', 22.22], ['还', 22.44], ['没', 22.74], ['走', 22.94, 'gold'], ['脱', 23.18, 'gold']] },
  { s3d: false, end: 25.95, chars: [['列', 23.88], ['表', 24.10], ['里', 24.32], ['的', 24.62], ['歌', 24.98, 'gold']] },
  { s3d: false, end: 28.5, chars: [['随', 26.18], ['过', 26.50, 'lav'], ['往', 27.02, 'lav'], ['流', 27.56, 'cyan'], ['动', 27.88, 'cyan']] },
];
// colour per meaning; every glyph gets a dark rim + soft drop shadow so it reads on any background
const TAGC = { lav: ['#ddd3ff', '170,150,255'], blue: ['#a6c8ff', '110,160,255'], pink: ['#ffb6d3', '255,130,185'], love: ['#ff86b8', '255,90,160'], peach: ['#ffd4ae', '255,170,110'], gold: ['#ffd77e', '255,190,80'], cyan: ['#b0ecff', '120,210,255'] };
export function tagStyle(tag) {
  const [c, g] = TAGC[tag] || ['#fff8ee', '255,190,130'];
  return { color: c, shadow: `0 0 1px rgba(25,12,45,.95),0 0 3px rgba(25,12,45,.8),0 3px 8px rgba(15,8,35,.75),0 0 16px rgba(${g},.5)` };
}
// pop curve for a character that appeared d seconds ago: overshoot then settle
export function pop(d) {
  if (d < 0) return { s: 0, y: 0, r: 0, o: 0 };
  const e = Math.exp(-d * 7.5);
  return { s: 1 - e * Math.cos(d * 17) * 1.05 + (d < .05 ? 0 : 0), y: -26 * e * Math.cos(d * 13), r: 1 - e, o: clamp(d / .06, 0, 1) };
}
// seeded rng
export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
