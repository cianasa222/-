// Shared geometry between the 2D page and the 3D world. The page is a real wall standing in the 3D scene:
// 1 page px = S metres, the window centre (page 360,395) sits at world (0, 2.3, ZW). From the hand-off camera
// (0, 2.3, 25.2), fov 36°, looking straight down -z, the wall fills the screen exactly as the DOM page does at scale 1.12.
import { GHOST_GRID, lerp, range, smooth, easeIn, easeInOut, spring, SPR, kick } from './common.js';
export const S = .006, CAMZ = 25.2, FOV0 = 36, D = 640 * S / 1.12 / Math.tan(FOV0 / 2 * Math.PI / 180), ZW = CAMZ - D, T_HAND = 9.30;
// page point → world, with dz (+ toward the camera). Objects off the wall plane are rescaled so that from the
// hand-off camera they land on exactly the same pixels as in the DOM.
export const K = (dz) => (D - dz) / D;
export const Pg = (px, py, dz = 0) => [(px - 360) * S * K(dz), 2.3 - (py - 395) * S * K(dz), ZW + dz];
export const GW = GHOST_GRID[0].length, GH = GHOST_GRID.length;
export const VOX = []; GHOST_GRID.forEach((row, j) => row.forEach((c, i) => { if (c) VOX.push({ i, j, c }); }));
// the pixel ghost: continues its DOM path at the hand-off, comes off the wall, extrudes into voxels on the beat,
// then dives through the window and bursts (10.0) into the particle stream that re-forms the 3D mascot on the pier.
export const T_BURST = 10.0, T_POP = 9.474;
export function ghost3(t) {
  const bob = Math.sin(t * 2.4) * 8, gsc = .9 * (1 + kick(t, 9) * .04);
  const a = Pg(300, 500 + bob, .12), b = Pg(232, 432 + bob * .6, .9), c = [1.2, 1.7, ZW - 5.6];
  const e1 = easeInOut(range(t, T_HAND, 9.8)), e2 = easeIn(range(t, 9.8, T_BURST));
  const p = [0, 1, 2].map(i => lerp(lerp(a[i], b[i], e1), c[i], e2));
  const cell = 8 * S * gsc * K(.12) * lerp(1, 1.35, e1);
  const ext = Math.max(0, spring(t - T_POP, SPR.toy));            // 0 = flat pixels, 1 = full voxels
  return { p, cell, ext, rz: -Math.sin(t * 1.7) * 4 * Math.PI / 180, ry: Math.sin((t - T_HAND) * 3.2) * .45 * Math.min(1, ext) * (1 - e2) };
}
export function voxelWorld(v, g) {   // one voxel's centre in world space
  let x = (v.i - (GW - 1) / 2) * g.cell, y = -(v.j - (GH - 1) / 2) * g.cell, z = 0;
  const cz = Math.cos(g.rz), sz = Math.sin(g.rz); [x, y] = [x * cz - y * sz, x * sz + y * cz];
  const cy = Math.cos(g.ry), sy = Math.sin(g.ry); [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  return [g.p[0] + x, g.p[1] + y, g.p[2] + z];
}
