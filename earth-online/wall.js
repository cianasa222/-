// The 2D page as a real object in the 3D world. At T_HAND the DOM page is swapped for this replica, pixel for pixel
// (same paper canvas, same bokeh blobs, same card), seen from the matching camera. Then the camera starts to move and
// the "flat UI" reveals depth: a thick window frame, a recessed opening, blinds that flip open on the beat, warm light,
// and the pixel ghost extruding into voxels before it dives through the window. It is drawn on its own transparent
// canvas, untone-mapped, above the sea scene (the camera is always on the room side of the wall when it is shown).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { cam } from './sea.js';
import * as GAME from './game.js';
import { GREY_GRID, FLOWER, drawGrid, clamp, lerp, range, smooth, easeIn, easeOut, easeInOut, spring, SPR, rng } from './common.js';
import { S, ZW, K, Pg, VOX, ghost3, voxelWorld, T_HAND, T_POP, T_BURST } from './ghostpath.js';

const W = 720, H = 1280, DPR = window.devicePixelRatio || 1;
export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(DPR); renderer.setSize(W, H); renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const WIN = { x: 120, y: 170, w: 480, h: 450 }, CARD = { x: 100, y: 760, w: 520, h: 380 };
const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const amb = new THREE.AmbientLight('#ffffff', 1), key = new THREE.DirectionalLight('#ffffff', 0), sun = new THREE.DirectionalLight('#ffc98f', 0);
key.position.set(-1.2, 1.6, 4); sun.position.set(.6, 1.4, -4); scene.add(amb, key, sun);
// lit materials keep their exact flat colour when only the ambient term is on: emissive carries the base,
// the key light adds shading on bevels and sides, the warm "sun" through the window lights the inner edges.
const mat = (hex, extra = {}) => new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: .68, roughness: .75, ...extra });

let wallMesh, frame, slats = [], lightPlane, vox, voxGlow, motes = [], glow, built = false;
const SL_TOP = (i) => WIN.y + i * WIN.h / 7, SL_H = WIN.h / 7 - 6, SL_DZ = -.22, REVEAL = .12;

function wallTexture() {
  const X0 = -400, Y0 = -400, TW = 1520, TH = 1800, R2 = 2;
  const c = document.createElement('canvas'); c.width = TW * R2; c.height = TH * R2; const g = c.getContext('2d');
  g.scale(R2, R2); g.translate(-X0, -Y0);
  g.drawImage(GAME.paperCanvas, -400, -400);
  // colour bokeh (same layout as the DOM at hand-off)
  GAME.blobsAt(T_HAND).forEach(b => { const R = b.d * .7071, gr = g.createRadialGradient(b.cx, b.cy, 0, b.cx, b.cy, R);
    gr.addColorStop(0, `rgba(${b.col},.62)`); gr.addColorStop(.68, `rgba(${b.col},0)`); g.fillStyle = gr; g.fillRect(b.cx - R, b.cy - R, 2 * R, 2 * R); });
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const shadowOnly = (x, y, w, h, r, oy, blur, col) => { g.save(); g.shadowColor = col; g.shadowBlur = blur; g.shadowOffsetX = 10000; g.shadowOffsetY = oy; rr(x - 10000, y, w, h, r); g.fillStyle = '#000'; g.fill(); g.restore(); };
  // window frame + sill shadows (the frame and sill themselves are real geometry)
  shadowOnly(WIN.x - 18, WIN.y - 18, WIN.w + 36, WIN.h + 36, 30, 20, 40, 'rgba(120,90,60,.15)');
  shadowOnly(WIN.x - 40, WIN.y + WIN.h + 14, WIN.w + 80, 24, 12, 10, 20, 'rgba(120,90,60,.12)');
  g.clearRect(WIN.x, WIN.y, WIN.w, WIN.h);
  // the character card (glass panel over the bokeh)
  shadowOnly(CARD.x + 12, CARD.y + 12, CARD.w - 24, CARD.h - 24, 30, 30, 60, 'rgba(120,80,50,.22)');
  g.save(); g.translate(CARD.x, CARD.y);
  rr(0, 0, CARD.w, CARD.h, 30); g.fillStyle = 'rgba(255,252,247,.78)'; g.fill();
  const lg = g.createLinearGradient(0, 0, 60, CARD.h); lg.addColorStop(0, 'rgba(255,255,255,.8)'); lg.addColorStop(.45, 'rgba(255,255,255,.15)'); lg.addColorStop(1, 'rgba(255,255,255,.35)'); g.fillStyle = lg; g.fill();
  g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,.9)'; rr(.75, .75, CARD.w - 1.5, CARD.h - 1.5, 29.5); g.stroke();
  const txt = (s, x, y, font, col, ls = 0) => { g.font = font; g.fillStyle = col; g.letterSpacing = ls + 'px'; g.textBaseline = 'top'; g.fillText(s, x, y); g.letterSpacing = '0px'; };
  txt('角 色', 28, 22, "600 15px 'Noto Sans SC'", '#8a7a72', 2.7);
  rr(34, 70, 200, 200, 22); g.fillStyle = '#fff1e6'; g.fill();
  const sp = (grid, s, x, y) => { const t = document.createElement('canvas'); t.width = grid[0].length; t.height = grid.length; drawGrid(t.getContext('2d'), grid); g.imageSmoothingEnabled = false; g.drawImage(t, x, y, t.width * s, t.height * s); g.imageSmoothingEnabled = true; };
  g.save(); rr(34, 70, 200, 200, 22); g.clip(); sp(GREY_GRID, 12, 44, 110); g.restore();
  txt('小橙', 262, 78, "900 34px 'Noto Sans SC'", '#3a2b2a'); g.font = "900 34px 'Noto Sans SC'"; const nw = g.measureText('小橙 ').width;
  txt('Lv.25', 262 + nw, 92, "600 16px 'Noto Sans SC'", '#b9a99f', 1.6);
  g.font = "600 15px 'Noto Sans SC'"; g.letterSpacing = '1.8px'; const pwid = g.measureText('○ 离线').width + 32; g.letterSpacing = '0px';
  rr(262, 136, pwid, 31, 15.5); g.fillStyle = '#e9e1d8'; g.fill(); txt('○ 离线', 278, 142, "600 15px 'Noto Sans SC'", '#8a7a72', 1.8);
  txt('HP', 262, 196, "600 13px 'Noto Sans SC'", '#8a7a72', 1.95); rr(300, 196, 184, 14, 7); g.fillStyle = '#efe4d8'; g.fill();
  txt('在线时长 · 9,125 天', 34, 300, "500 15px 'Noto Sans SC'", '#8a7a72', 1.2);
  sp(FLOWER, 7, 420, 240);
  g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return { t, X0, Y0, TW, TH };
}
function ring(ow, oh, orad, iw, ih, irad, depth, hex) {
  const sh = new THREE.Shape(); sh.moveTo(0, 0); const rrPath = (p, w, h, r) => { p.moveTo(-w / 2 + r, -h / 2); p.lineTo(w / 2 - r, -h / 2); p.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); p.lineTo(w / 2, h / 2 - r); p.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); p.lineTo(-w / 2 + r, h / 2); p.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); p.lineTo(-w / 2, -h / 2 + r); p.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); };
  const s2 = new THREE.Shape(); rrPath(s2, ow, oh, orad); const hole = new THREE.Path(); rrPath(hole, iw, ih, irad); s2.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s2, { depth, bevelEnabled: true, bevelThickness: depth * .35, bevelSize: Math.min(depth * .3, .012), bevelSegments: 4, curveSegments: 18 });
  geo.translate(0, 0, -depth); return new THREE.Mesh(geo, mat(hex));
}
export function build() {
  const { t, X0, Y0, TW, TH } = wallTexture();
  // the wall: a big plane carrying the page texture (the window hole is transparent)
  const pl = new THREE.PlaneGeometry(TW * S, TH * S); wallMesh = new THREE.Mesh(pl, new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .02, side: THREE.DoubleSide }));
  const [cx, cy] = Pg(X0 + TW / 2, Y0 + TH / 2, 0); wallMesh.position.set(cx, cy, ZW); scene.add(wallMesh);
  // the opening's reveal: the wall has thickness, seen at an angle as the camera moves
  const revM = new THREE.MeshStandardMaterial({ color: '#efe3d2', emissive: '#efe3d2', emissiveIntensity: .45, roughness: .9, side: THREE.DoubleSide });
  const ww = WIN.w * S, wh = WIN.h * S;
  [[0, wh / 2, ww, 'h'], [0, -wh / 2, ww, 'h'], [-ww / 2, 0, wh, 'v'], [ww / 2, 0, wh, 'v']].forEach(([x, y, len, o]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(o === 'h' ? len : REVEAL, o === 'h' ? REVEAL : len), revM);
    if (o === 'h') m.rotation.x = Math.PI / 2; else m.rotation.y = Math.PI / 2; m.position.set(x, 2.3 + y, ZW - REVEAL / 2); scene.add(m); });
  // frame (lavender ring + darker inner lip), mullion, sill — positioned so they land on the DOM pixels at hand-off
  const fz = .07, kf = K(fz);
  frame = new THREE.Group(); scene.add(frame);
  const outer = ring((WIN.w + 36) * S * kf, (WIN.h + 36) * S * kf, 30 * S * kf, WIN.w * S * kf, WIN.h * S * kf, 12 * S * kf, fz, '#e9d3f0'); outer.position.set(0, 2.3, ZW + fz); frame.add(outer);
  const kl = K(.05), lip = ring(WIN.w * S * kl, WIN.h * S * kl, 12 * S * kl, (WIN.w - 6) * S * kl, (WIN.h - 6) * S * kl, 9 * S * kl, .05, '#d9bfe6'); lip.position.set(0, 2.3, ZW + .05); frame.add(lip);
  const km = K(.05), mull = new THREE.Mesh(new RoundedBoxGeometry(18 * S * km, WIN.h * S * km, .1, 3, 4 * S), mat('#e9d3f0')); mull.position.set(0, 2.3, ZW); frame.add(mull);
  const ks = K(.32), sill = new THREE.Mesh(new RoundedBoxGeometry((WIN.w + 80) * S * ks, 24 * S * ks, .32, 4, 12 * S * ks), mat('#e2c6ec'));
  const sp = Pg(360, WIN.y + WIN.h + 14 + 12, .32); sill.position.set(sp[0], sp[1], ZW + .16); frame.add(sill);
  // light behind the blinds (the DOM gradient), with the slats' little shadows baked in
  { const c = document.createElement('canvas'); c.width = 64; c.height = 900; const g = c.getContext('2d'); const lg = g.createLinearGradient(0, 0, 0, 900); lg.addColorStop(0, '#ffe9c9'); lg.addColorStop(1, '#ffd7b0'); g.fillStyle = lg; g.fillRect(0, 0, 64, 900);
    for (let i = 0; i < 7; i++) { const y = (i * WIN.h / 7 + SL_H) * 2; g.fillStyle = 'rgba(150,110,80,.18)'; g.fillRect(0, y, 64, 6); }
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const kz = K(-.42);
    lightPlane = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w * S * kz, WIN.h * S * kz), new THREE.MeshBasicMaterial({ map: tx, transparent: true })); lightPlane.position.set(0, 2.3, ZW - .42); scene.add(lightPlane); }
  // blinds: seven slats, recessed in the opening
  { const c = document.createElement('canvas'); c.width = 4; c.height = 64; const g = c.getContext('2d'); const lg = g.createLinearGradient(0, 0, 0, 64); lg.addColorStop(0, '#fffaf3'); lg.addColorStop(1, '#f1e3d0'); g.fillStyle = lg; g.fillRect(0, 0, 4, 64);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const kz = K(SL_DZ);
    for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new RoundedBoxGeometry(WIN.w * S * kz, SL_H * S * kz, .018, 2, .008), new THREE.MeshStandardMaterial({ color: '#ffffff', map: tx, emissive: '#ffffff', emissiveMap: tx, emissiveIntensity: .67, roughness: .55 }));
      m.userData.home = Pg(360, SL_TOP(i) + SL_H / 2, SL_DZ); scene.add(m); slats.push(m); } }
  // the voxel ghost (pixels that will extrude)
  const voxLit = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: .7, roughness: .35 }), voxFlat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  voxLit.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * diffuseColor.rgb;'); };
  vox = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 2, .14), voxFlat, VOX.length); vox.userData = { voxLit, voxFlat };
  VOX.forEach((v, i) => vox.setColorAt(i, new THREE.Color(v.c))); vox.frustumCulled = false; scene.add(vox);
  { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(190,170,255,.75)'); gr.addColorStop(1, 'rgba(190,170,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const tx = new THREE.CanvasTexture(c); voxGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false })); scene.add(voxGlow);
    // warm glow that wraps the window when the light comes in
    const c2 = document.createElement('canvas'); c2.width = c2.height = 256; const g2 = c2.getContext('2d'); const g3 = g2.createRadialGradient(128, 128, 0, 128, 128, 128); g3.addColorStop(0, 'rgba(255,214,160,0)'); g3.addColorStop(.55, 'rgba(255,214,160,0)'); g3.addColorStop(.72, 'rgba(255,206,150,.55)'); g3.addColorStop(1, 'rgba(255,200,150,0)'); g2.fillStyle = g3; g2.fillRect(0, 0, 256, 256);
    glow = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 5.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })); glow.position.set(0, 2.3, ZW + .12); scene.add(glow); }
  // dust motes floating in the light in front of the window
  { const r = rng(77), g = new THREE.SphereGeometry(.012, 6, 4); for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#fff3dc', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.userData = { x: (r() - .5) * 2.6, y: 2.3 + (r() - .5) * 2.4, z: ZW + .3 + r() * 4.5, ph: r() * 6.28, s: .5 + r() * 1.2 }; scene.add(m); motes.push(m); } }
  built = true;
}

// blinds and light: open on the beat (T_POP), gather up on 10.031; at the end they come down and close on 「靓丽」
function blindState(t, i) {
  const flipOpen = Math.max(0, spring(t - (T_POP + i * .035), SPR.toy)), up = clamp(spring(t - (10.031 + (6 - i) * .025), SPR.ui), 0, 1.05);
  const down = clamp(spring(t - (16.86 + i * .03), SPR.ui), 0, 1.05), close = Math.max(0, spring(t - (17.02 + i * .04), SPR.ui));
  let open = flipOpen, raise = up; if (t > 16.7) { open = 1 - close; raise = 1 - down; }
  return { ang: open * 1.42, raise };
}
export function lightAmount(t) { return t < 16.7 ? smooth(range(t, T_POP, T_POP + .3)) : 1 - smooth(range(t, 17.05, 17.32)); }

export function update(t) {
  if (!built) return false;
  const show = ((t >= T_HAND && t < 11.0) || t >= 16.62) && cam.position.z > ZW + .03; renderer.domElement.style.visibility = show ? 'visible' : 'hidden';
  if (!show) return false;
  const L = lightAmount(t);
  key.intensity = .55 * smooth(range(t, T_HAND, T_HAND + .25)) + (t > 16.6 ? .55 : 0); key.intensity = Math.min(.55, key.intensity);
  amb.intensity = 1 - key.intensity * .5;
  sun.intensity = 1.1 * L;
  lightPlane.material.opacity = 1 - L;
  glow.material.opacity = .16 * L;
  slats.forEach((m, i) => { const b = blindState(t, i), h = m.userData.home, top = Pg(360, WIN.y + 4 + i * 5, SL_DZ);
    m.position.set(h[0], lerp(h[1], top[1], b.raise), h[2]); m.rotation.x = -b.ang; m.visible = true; });
  // voxel ghost
  const g = ghost3(t), o = new THREE.Object3D(), vis = t < T_BURST; vox.visible = vis; voxGlow.visible = vis;
  vox.material = t < T_POP ? vox.userData.voxFlat : vox.userData.voxLit;
  if (vis) { VOX.forEach((v, i) => { const p = voxelWorld(v, g); o.position.set(p[0], p[1], p[2]); o.rotation.set(0, g.ry, g.rz); const d = g.cell * lerp(.08, 1, clamp(g.ext, 0, 1.3));
      o.scale.set(g.cell * 1.001, g.cell * 1.001, d); o.updateMatrix(); vox.setMatrixAt(i, o.matrix); }); vox.instanceMatrix.needsUpdate = true;
    voxGlow.position.set(g.p[0], g.p[1], g.p[2] - .05); voxGlow.scale.setScalar(g.cell * 26); voxGlow.material.opacity = .8; }
  motes.forEach((m, i) => { const u = m.userData; m.position.set(u.x + Math.sin(t * .5 * u.s + u.ph) * .15, u.y + Math.sin(t * .37 * u.s + u.ph * 2) * .1 + ((t * .05 * u.s) % .4), u.z);
    const inBeam = Math.max(0, 1 - Math.hypot(u.x / 1.6, (u.y - 2.0) / 1.6)); m.material.opacity = L * inBeam * (.5 + .5 * Math.sin(t * 3 * u.s + u.ph)); });
  return true;
}
export function render() { renderer.render(scene, cam); }
