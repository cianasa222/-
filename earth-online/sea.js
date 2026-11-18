// 3D half of "退出地球 Online" (v2): a real reflective sea, a physical sky with soft clouds, a sandy beach, a little hut, the pier,
// and the smooth soft-clay characters from the 幻听 MV.
import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { T, kick, clamp, lerp, smooth, easeIn, easeOut, easeInOut, range, rng, lastBeat } from './common.js';
import { ZW, VOX, ghost3, voxelWorld, T_BURST, T_HAND } from './ghostpath.js';
import { makeMascot, setOpacity, pose, samplePoints, BD } from './mascot3d.js';

const W = 720, H = 1280, R = rng(5);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
const DPR = window.devicePixelRatio || 1; renderer.setPixelRatio(DPR); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .5;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#f3e4d6', 300, 2200);

// ---------------- physical sky + sun
// art-directed pastel sky (gradient + sun glow); colours are given as the sRGB we want on screen and pre-inverted through ACES
const ACESf = (r, g, b, e) => { const k = e / .6; r *= k; g *= k; b *= k;
  const i = [.59719 * r + .35458 * g + .04823 * b, .076 * r + .90834 * g + .01566 * b, .0284 * r + .13383 * g + .83777 * b].map(v => (v * (v + .0245786) - .000090537) / (v * (.983729 * v + .432951) + .238081));
  return [1.60475 * i[0] - .53108 * i[1] - .07367 * i[2], -.10208 * i[0] + 1.10813 * i[1] - .00605 * i[2], -.00327 * i[0] - .07276 * i[1] + 1.07602 * i[2]]; };
export const unACES = (hex, e = .46) => { const c = new THREE.Color(hex); const tg = [c.r, c.g, c.b]; let L = tg.map(v => v * 1.5 + .001);
  for (let n = 0; n < 60; n++) { const o = ACESf(L[0], L[1], L[2], e); L = L.map((v, j) => Math.max(0, v * Math.pow(Math.max(tg[j], 1e-4) / Math.max(o[j], 1e-4), .7))); } return new THREE.Vector3(...L); };
const SKY = { top: [unACES('#6fb0ee'), unACES('#7f78d4')], mid: [unACES('#b9dcf6'), unACES('#e59ac4')], hor: [unACES('#fff0e0'), unACES('#ffbd94')], sun: [unACES('#fff6e2'), unACES('#ffb27a')] };
const skyU = { top: { value: new THREE.Vector3() }, mid: { value: new THREE.Vector3() }, hor: { value: new THREE.Vector3() }, sunC: { value: new THREE.Vector3() }, sunD: { value: new THREE.Vector3(0, .5, -1) } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `uniform vec3 top, mid, hor, sunC, sunD; varying vec3 vD;
    void main(){ vec3 d = normalize(vD); float h = d.y;
      vec3 c = mix(hor, mid, smoothstep(-.005, .07, h)); c = mix(c, top, smoothstep(.06, .34, h));
      float s = max(dot(d, normalize(sunD)), 0.);
      c += sunC * (pow(s, 1400.) * 5. + pow(s, 60.) * .18 + pow(s, 10.) * .07);
      c = mix(c, hor * .92, smoothstep(0., -.08, h));
      gl_FragColor = vec4(c, 1.); }` }));
sky.frustumCulled = false; scene.add(sky);
const sunDir = V(0, .5, -1).normalize();
const sunL = new THREE.DirectionalLight('#fff1dc', 3.2); sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048);
Object.assign(sunL.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 120 }); sunL.shadow.bias = -.0004; sunL.shadow.normalBias = .03;
scene.add(sunL, sunL.target);
const hemi = new THREE.HemisphereLight('#b9d4ff', '#f3d2b0', 1.0); scene.add(hemi);

// ---------------- soft clouds: layered billboards with a lit top and a shaded belly
function cloudTex(seed) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'), r = rng(seed);
  for (let i = 0; i < 46; i++) { const x = 70 + r() * 372, y = 120 + (r() - .5) * 70 - Math.sin((x - 70) / 372 * Math.PI) * 50, rad = 30 + r() * 62;
    const gr = g.createRadialGradient(x, y - rad * .25, 0, x, y, rad); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.55, 'rgba(255,250,245,.6)'); gr.addColorStop(1, 'rgba(255,245,240,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); }
  const sh = g.createLinearGradient(0, 60, 0, 230); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(170,150,200,.30)');
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = sh; g.fillRect(0, 0, 512, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const ctex = [cloudTex(1), cloudTex(2), cloudTex(3)];
const clouds = [];
for (let i = 0; i < 16; i++) { const m = new THREE.SpriteMaterial({ map: ctex[i % 3], transparent: true, depthWrite: false, fog: false, color: '#ffffff' });
  const s = new THREE.Sprite(m); const sc = 40 + R() * 60; s.scale.set(sc, sc * .5, 1); s.userData = { x: -160 + R() * 320, y: 34 + R() * 60, z: -160 - R() * 220, v: .4 + R() * .6 }; scene.add(s); clouds.push(s); }

// ---------------- the sea (reflective)
function normalTex() {
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), d = g.createImageData(N, N), r = rng(11);
  const waves = Array.from({ length: 14 }, () => ({ kx: Math.round((r() - .5) * 16), ky: Math.round((r() - .5) * 16), a: .4 + r(), p: r() * 6.28 }));
  const h = (x, y) => waves.reduce((s, w) => s + w.a * Math.sin(2 * Math.PI * (w.kx * x + w.ky * y) / N + w.p), 0);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = h(x + 1, y) - h(x - 1, y), dy = h(x, y + 1) - h(x, y - 1); const n = V(-dx * .35, -dy * .35, 1).normalize(); const i = (y * N + x) * 4;
    d.data[i] = (n.x * .5 + .5) * 255; d.data[i + 1] = (n.y * .5 + .5) * 255; d.data[i + 2] = (n.z * .5 + .5) * 255; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const water = new Water(new THREE.PlaneGeometry(900, 900), { textureWidth: 1024, textureHeight: 1024, waterNormals: normalTex(), sunDirection: sunDir.clone(), sunColor: 0xfff0d8, waterColor: 0x47bccb, distortionScale: 2.2, fog: true });
water.rotation.x = -Math.PI / 2; water.position.y = 0; scene.add(water);
// foam that runs up the sand and slides back
const foamTex = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 64; const g = c.getContext('2d'), r = rng(4);
  for (let i = 0; i < 900; i++) { const x = r() * 512, y = 20 + r() * 26 + Math.sin(x * .05) * 6; g.fillStyle = `rgba(255,255,255,${.25 + r() * .6})`; g.beginPath(); g.arc(x, y, 1 + r() * 4, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.repeat.set(6, 1); return t; })();
const foam = new THREE.Mesh(new THREE.PlaneGeometry(60, 1.4), new THREE.MeshBasicMaterial({ map: foamTex, transparent: true, depthWrite: false, opacity: .85 }));
foam.rotation.x = -Math.PI / 2; scene.add(foam);

// ---------------- sand: smooth dunes with grain, a wet band at the waterline
export const groundY = (x, z) => -.45 + clamp((z - 8.4) * .11, 0, 1.3) + Math.sin(x * .35 + z * .2) * .08 * smooth(range(z, 10, 14)) + Math.sin(x * 1.1 - z * .7) * .03;
{ const tex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'), r = rng(8); g.fillStyle = '#f3e1c4'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 60000; i++) { const v = r(); g.fillStyle = v < .5 ? `rgba(180,140,100,${r() * .18})` : `rgba(255,255,255,${r() * .35})`; g.fillRect(r() * 512, r() * 512, 1.4, 1.4); }
    for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(200,165,120,.10)'; g.lineWidth = 3; g.beginPath(); const y = r() * 512; g.moveTo(0, y); for (let x = 0; x <= 512; x += 16) g.lineTo(x, y + Math.sin(x * .03 + i) * 8); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 6); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const geo = new THREE.PlaneGeometry(80, 34, 320, 136); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, col = []; const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i) + 24; p.setXYZ(i, x, groundY(x, z), z);
    const wet = 1 - smooth(range(z, 8.6, 10.3)); c.set('#ffffff').lerp(new THREE.Color('#b99a78'), wet * .55); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const sand = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: .92 })); sand.receiveShadow = true; scene.add(sand);
  const shellM = [new THREE.MeshStandardMaterial({ color: '#ffe3ea', roughness: .5 }), new THREE.MeshStandardMaterial({ color: '#fff6ea', roughness: .5 }), new THREE.MeshStandardMaterial({ color: '#d8cfc6', roughness: .9 })];
  for (let i = 0; i < 70; i++) { const x = -12 + R() * 24, z = 10.2 + R() * 9; const m = new THREE.Mesh(i % 3 === 2 ? new THREE.SphereGeometry(.05 + R() * .06, 10, 8) : new THREE.ConeGeometry(.05 + R() * .04, .07, 9), shellM[i % 3]);
    m.position.set(x, groundY(x, z) + .02, z); m.rotation.set(R() * .6, R() * 6, R() * .6); m.scale.y = .6; m.castShadow = true; scene.add(m); }
  const blade = new THREE.ConeGeometry(.035, .55, 4); blade.translate(0, .27, 0);
  const grass = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .8 }), 900), o = new THREE.Object3D();
  for (let i = 0; i < 900; i++) { let cx = -12 + (i % 9) * 3 + R(), x = cx + (R() - .5) * 1.4, z = 18.5 + R() * 4; if (x > -4.6 && x < .2) x += x < -2.2 ? -2.6 : 2.6; o.position.set(x, groundY(x, z), z); o.rotation.set((R() - .5) * .6, R() * 6, (R() - .5) * .6); o.scale.setScalar(.6 + R() * .9); o.updateMatrix(); grass.setMatrixAt(i, o.matrix); grass.setColorAt(i, c.set(R() < .5 ? '#a7c98a' : '#c9d79a')); }
  grass.castShadow = true; scene.add(grass);
}
// ---------------- the pier with a lantern at the end
const wood = new THREE.MeshStandardMaterial({ color: '#c79a6e', roughness: .82 }), woodD = new THREE.MeshStandardMaterial({ color: '#a77a52', roughness: .9 });
for (let z = 13, i = 0; z > 1.6; z -= .5, i++) { const p = new THREE.Mesh(new RoundedBoxGeometry(1.5, .1, .44, 2, .03), i % 3 ? wood : woodD); p.position.set(1.6, .72, z); p.rotation.z = (R() - .5) * .03; p.castShadow = p.receiveShadow = true; scene.add(p); }
for (let z = 13; z > 1.6; z -= 1.5) for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 2.2, 10), woodD); p.position.set(1.6 + s * .66, -.3, z); p.castShadow = true; scene.add(p); }
const PIER_END = V(1.6, .78, 2.35);
const lanternLight = new THREE.PointLight('#ffc27a', 0, 6, 2); lanternLight.position.set(2.25, 1.45, 1.95); scene.add(lanternLight);
{ const pole = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .9, 8), woodD); pole.position.set(2.25, 1.1, 1.95); scene.add(pole);
  const lamp = new THREE.Mesh(new RoundedBoxGeometry(.2, .26, .2, 3, .05), new THREE.MeshStandardMaterial({ color: '#fff3dc', emissive: '#ffbf6e', emissiveIntensity: 0 })); lamp.position.set(2.25, 1.6, 1.95); scene.add(lamp); scene.userData.lamp = lamp; }
// ---------------- island, lighthouse, sailboat, rocks
{ const rockM = new THREE.MeshStandardMaterial({ color: '#b8aea4', roughness: .9, flatShading: true });
  [[-6, 8.9, 1.0], [-7.1, 9.6, .7], [5.6, 8.8, .8], [6.6, 9.4, .55], [-3.6, 8.3, .5]].forEach(([x, z, s]) => { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 1), rockM); r.position.set(x, s * .2, z); r.rotation.set(R(), R() * 6, R()); r.scale.y = .7; r.castShadow = true; scene.add(r); });
  const isl = new THREE.Group(); isl.position.set(-22, 0, -60); scene.add(isl);
  const rk = new THREE.MeshStandardMaterial({ color: '#c5b29e', roughness: .95, flatShading: true }), gr = new THREE.MeshStandardMaterial({ color: '#8fc27c', roughness: .95, flatShading: true });
  const hill = new THREE.Mesh(new THREE.SphereGeometry(6, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), gr); hill.scale.set(1.3, .45, .8); isl.add(hill);
  const cliff = new THREE.Mesh(new THREE.CylinderGeometry(7.4, 8, 1.4, 18), rk); cliff.position.y = -.4; cliff.scale.z = .65; isl.add(cliff);
  const red = new THREE.MeshStandardMaterial({ color: '#ff8a78', roughness: .6 }), wh = new THREE.MeshStandardMaterial({ color: '#fffaf2', roughness: .6 });
  for (let i = 0; i < 7; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(.62 - i * .04, .66 - i * .04, .7, 20), i % 2 ? wh : red); seg.position.set(2.2, 2.6 + i * .7, 0); isl.add(seg); }
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.4, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff2c8').multiplyScalar(1.3) })); lamp.position.set(2.2, 7.6, 0); isl.add(lamp);
  const boat = new THREE.Group(); boat.position.set(20, .25, -90); scene.add(boat); scene.userData.boat = boat;
  const hull = new THREE.Mesh(new RoundedBoxGeometry(3, .55, 1, 3, .22), wh); boat.add(hull);
  const sail = new THREE.Mesh(new THREE.ConeGeometry(1.3, 3.6, 3), new THREE.MeshStandardMaterial({ color: '#fff4e6', roughness: .7 })); sail.position.set(0, 2.2, 0); sail.scale.z = .12; boat.add(sail); }
// ---------------- seagulls
const gulls = [];
{ const white = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .6 }), grey = new THREE.MeshStandardMaterial({ color: '#cfd4de', roughness: .6 }), beak = new THREE.MeshStandardMaterial({ color: '#ffb25a' });
  for (let i = 0; i < 9; i++) { const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.09, .34, 6, 12), white); body.rotation.z = Math.PI / 2; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.08, 12, 10), white); head.position.set(.26, .05, 0); g.add(head);
    const bk = new THREE.Mesh(new THREE.ConeGeometry(.025, .1, 6), beak); bk.rotation.z = -Math.PI / 2; bk.position.set(.36, .04, 0); g.add(bk);
    const wings = [-1, 1].map(s => { const piv = new THREE.Group(); piv.position.set(0, .04, s * .05); const w = new THREE.Mesh(new RoundedBoxGeometry(.22, .02, .55, 2, .01), grey); w.position.set(0, 0, s * .28); w.rotation.y = s * .25; piv.add(w); g.add(piv); return piv; });
    g.userData = { wings, cx: -8 + R() * 16, cy: 3.2 + R() * 4, cz: -6 - R() * 22, r: 3 + R() * 6, sp: .32 + R() * .3, ph: R() * 6.28 }; g.traverse(o => { o.castShadow = true; }); scene.add(g); gulls.push(g); } }

// ---------------- characters (same family as the 幻听 MV)
const ghost = makeMascot({ color: '#ff9a68', cup: '#ffb38a', led: 'note', glow: 1 }); scene.add(ghost);
ghost.userData.mats.forEach(m => { if (m.emissive) { m.emissive.set('#fff0f6'); m.emissiveIntensity = .16; } });
const ghostL = new THREE.PointLight('#ffe8f4', .5, 3, 2); scene.add(ghostL);
const pinkOne = makeMascot({ color: '#ff9cba', cup: '#ff86ad', led: 'heart', scale: .9 }); scene.add(pinkOne);
const kids = [makeMascot({ color: '#8fe3c4', cup: '#5fcaa6', led: 'note', scale: .45 }), makeMascot({ color: '#c6b6ff', cup: '#a58ff2', led: 'heart', scale: .45 })]; kids.forEach(k => scene.add(k));
const rims = [0, 1, 2, 3].map(i => { const l = new THREE.PointLight(i < 2 ? '#ffe2c4' : '#ffc7dc', 0, 2.8, 2); scene.add(l); return l; });
const flowerG = new THREE.Group(); scene.add(flowerG);
{ const stem = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .32, 6), new THREE.MeshStandardMaterial({ color: '#6fae6a' })); stem.position.y = .16; flowerG.add(stem);
  for (let i = 0; i < 7; i++) { const pt = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 8), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .5 })); const a = i / 7 * 6.28; pt.position.set(Math.cos(a) * .055, .34, Math.sin(a) * .055); pt.scale.set(1, .45, 1.3); pt.rotation.y = -a; flowerG.add(pt); }
  const ctr = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), new THREE.MeshStandardMaterial({ color: '#ffd66e' })); ctr.position.y = .345; flowerG.add(ctr); flowerG.traverse(o => o.castShadow = true); }
const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(.32, 1), new THREE.MeshStandardMaterial({ color: '#d9d2c6', roughness: .85 })); stone.scale.set(1.2, .7, .9); scene.add(stone);
const prints = []; { const g = new THREE.CircleGeometry(.07, 16); g.rotateX(-Math.PI / 2); const m = new THREE.MeshBasicMaterial({ color: '#e8a7b8', transparent: true, opacity: 0, depthWrite: false });
  for (let i = 0; i < 8; i++) { const f = new THREE.Mesh(g, m.clone()); f.scale.set(1, 1, 1.35); scene.add(f); prints.push(f); } }
const STONE = V(-1.7, 0, 13.4); STONE.y = groundY(STONE.x, STONE.z) + .12; stone.position.copy(STONE); stone.castShadow = true;
const heart = new THREE.Mesh(new THREE.ExtrudeGeometry((() => { const s = new THREE.Shape(), z = .16; s.moveTo(0, -z); s.bezierCurveTo(z * 1.3, -z * .1, z * .7, z, 0, z * .45); s.bezierCurveTo(-z * .7, z, -z * 1.3, -z * .1, 0, -z); return s; })(), { depth: .05, bevelEnabled: true, bevelSize: .015, bevelThickness: .015, bevelSegments: 3 }),
  new THREE.MeshStandardMaterial({ color: '#ff8fb8', emissive: '#ff6f9a', emissiveIntensity: .6, transparent: true })); scene.add(heart);
const gPts = samplePoints({ body: '#ffd9c6', top: '#ffe8da', cheek: '#ffb0c0', cream: '#fff6ee', cup: '#ffc3a0' });
const gPar = new THREE.InstancedMesh(new THREE.BoxGeometry(.03, .03, .03), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.9, 1.9, 1.9) }), gPts.length); gPts.forEach((q, i) => gPar.setColorAt(i, q.c)); gPar.frustumCulled = false; scene.add(gPar);
const gRand = gPts.map(() => V(R() - .5, R() - .5, R() - .5));
const sparks = []; { const g = new THREE.OctahedronGeometry(.04); for (let i = 0; i < 46; i++) { const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(R() < .5 ? '#fff0c8' : '#ffe2ef').multiplyScalar(1.6) })); m.userData = { a: R() * 6.28, r: .35 + R() * .8, v: .4 + R() * .8, ph: R() * 3 }; scene.add(m); sparks.push(m); } }
const motes = []; { const g = new THREE.SphereGeometry(.02, 6, 4), m = new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff6e4').multiplyScalar(1.4), transparent: true, opacity: .8 }); for (let i = 0; i < 60; i++) { const s = new THREE.Mesh(g, m); s.userData = V(-4 + R() * 9, .3 + R() * 3, 4 + R() * 14); scene.add(s); motes.push(s); } }

// ---------------- camera + post (depth of field, bloom, sun shafts, grade)
export const cam = new THREE.PerspectiveCamera(42, W / H, .05, 6000);
const composer = new EffectComposer(renderer); composer.setPixelRatio(DPR); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, cam));
const bokeh = new BokehPass(scene, cam, { focus: 5, aperture: .0016, maxblur: .006 }); composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .28, .5, .95); composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, time: { value: 0 }, sunUV: { value: new THREE.Vector2(.5, .8) }, shaft: { value: 0 }, warm: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time, shaft, warm; uniform vec2 sunUV; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + time*7.) * 43758.5453); }
    void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb;
      vec2 d = (sunUV - vUv) / 28.; vec2 p = vUv; float acc = 0., w = 1.;
      for (int i = 0; i < 28; i++){ p += d; vec3 s = texture2D(tDiffuse, p).rgb; acc += max(0., dot(s, vec3(.33)) - .9) * w; w *= .94; }
      c += acc * shaft * mix(vec3(1.,.92,.78), vec3(1.,.7,.5), warm) * .12;
      vec2 q = vUv - .5; c *= mix(.78, 1., smoothstep(.9, .28, length(q * vec2(1., .72))));
      c = mix(c, c * vec3(1.04, 1., .94), .45 + warm * .3);
      float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, 1.14); c = (c - .5) * 1.06 + .5; c = max(c, 0.); c += (h(floor(gl_FragCoord.xy)) - .5) * .022; gl_FragColor = vec4(c, 1.); }` });
composer.addPass(grade);

// ---------------- shots (hard cuts sit on the line changes)
const camKeys = [
  // hand-off: exactly the DOM framing, then a slow drift reveals depth, then the dive through the window to the pier
  [9.30, V(0, 2.3, 25.2), V(0, 2.3, -40), 36],
  [9.75, V(-.32, 2.14, 24.0), V(-.05, 2.12, -40), 37],
  [10.2, V(.32, 1.8, 14.0), V(.9, 1.2, -6), 44],
  [10.6, V(.95, 1.35, 10.9), V(1.5, 1.0, 0), 47],
  [11.0, V(1.4, 1.15, 9.2), V(1.6, 1.0, 2.0), 46],
  // cut: beside the little one on the pier, a slow orbit as the sun goes down
  [11.01, V(2.3, 1.9, 9.0), V(1.5, 1.0, -6), 46],
  [12.1, V(4.3, 1.55, 8.4), V(-1.2, .85, -6.5), 44],
  [13.1, V(4.4, 1.3, 6.9), V(-2.0, .9, -6.0), 42],
  // cut: the beach, the pink one arrives — a low arc that pushes in
  [13.16, V(-3.6, 2.4, 20.6), V(-2.6, .6, 13.8), 40],
  [14.3, V(-3.1, 1.55, 19.7), V(-2.3, .62, 13.7), 37],
  [15.3, V(-1.4, 1.35, 19.1), V(-2.0, .62, 13.6), 34],
  // cut: the farewell — a crane up following the rise
  [15.38, V(4.4, 1.5, 7.6), V(1.6, 1.4, 1.8), 42],
  [16.0, V(4.6, 3.0, 9.0), V(1.5, 2.8, -1), 44],
  [16.6, V(4.5, 4.2, 10.0), V(1.5, 3.9, -4), 46],
  // cut on 「退出」: from just inside the window, pull back into the room; the world becomes the flat page again
  [16.625, V(.45, 2.05, 14.9), V(1.0, 3.4, -20), 44],
  [17.3, V(0, 2.3, 25.2), V(0, 2.3, -40), 36],
  [17.8, V(0, 2.3, 25.2), V(0, 2.3, -40), 36],
];
const shots = []; { let cur = [camKeys[0]]; for (let i = 1; i < camKeys.length; i++) { if (camKeys[i][0] - camKeys[i - 1][0] < .1) { shots.push(cur); cur = []; } cur.push(camKeys[i]); } shots.push(cur); }
// monotone (Fritsch–Carlson) time → spline-parameter map: velocity is continuous, nothing stops mid-shot
function pchip(xs, ys, m0) { const n = xs.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = m0 !== undefined ? m0 : d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 3 * (xs[i + 1] - xs[i - 1]) / ((2 * xs[i + 1] - xs[i] - xs[i - 1]) / d[i - 1] + (xs[i + 1] + xs[i] - 2 * xs[i - 1]) / d[i]);
  return (x) => { let i = 0; while (i < n - 2 && x > xs[i + 1]) i++; const h = xs[i + 1] - xs[i], u = clamp((x - xs[i]) / h, 0, 1);
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
    return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1]; }; }
shots.forEach((sh, si) => { const n = sh.length;
  sh.pc = new THREE.CatmullRomCurve3(sh.map(k => k[1]), false, 'centripetal'); sh.tc = new THREE.CatmullRomCurve3(sh.map(k => k[2]), false, 'centripetal');
  sh.map_ = pchip(sh.map(k => k[0]), sh.map((k, i) => i / (n - 1)), si === 0 ? 0 : undefined); });
function camAt(t) {
  let sh = shots[0]; for (const x of shots) if (t >= x[0][0]) sh = x;
  const s = clamp(sh.map_(t), 0, 1), n = sh.length, f = s * (n - 1), i = Math.min(n - 2, Math.floor(f)), fov = lerp(sh[i][3], sh[i + 1][3], f - i);
  return { pos: sh.pc.getPoint(s), tgt: sh.tc.getPoint(s), fov };
}

export function update(t) {
  const kb = kick(t, 8);
  water.material.uniforms.time.value = t * .55; grade.uniforms.time.value = t;
  const day = smooth(range(t, 11.0, 13.16)), dusk = smooth(range(t, 13.16, 17.7));
  const el = lerp(lerp(.62, .22, day), .035, dusk), az = lerp(-.18, .06, day) + dusk * .05;
  sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
  const dk = clamp(day * .25 + dusk, 0, 1); skyU.top.value.lerpVectors(SKY.top[0], SKY.top[1], dk); skyU.mid.value.lerpVectors(SKY.mid[0], SKY.mid[1], dk); skyU.hor.value.lerpVectors(SKY.hor[0], SKY.hor[1], dk); skyU.sunC.value.lerpVectors(SKY.sun[0], SKY.sun[1], dk); skyU.sunD.value.copy(sunDir);
  water.material.uniforms.sunDirection.value.copy(sunDir);
  sunL.position.copy(sunDir).multiplyScalar(60).add(V(0, 0, 8)); sunL.target.position.set(0, 0, 8);
  const warm = clamp(day * .5 + dusk * .7, 0, 1); grade.uniforms.warm.value = warm;
  sunL.color.set('#fff1dc').lerp(new THREE.Color('#ff9d68'), warm); sunL.intensity = lerp(3.2, 2.2, dusk);
  hemi.color.set('#b9d4ff').lerp(new THREE.Color('#c9a8e0'), dusk); hemi.intensity = lerp(1.3, .95, dusk);
  scene.fog.color.set('#f3e4d6').lerp(new THREE.Color('#f0a890'), warm * .8);
  renderer.toneMappingExposure = lerp(.44, .5, dusk);
  const ct = t + day * 26 + dusk * 8, ctint = new THREE.Color('#ffffff').lerp(new THREE.Color('#ffc9b0'), warm).lerp(new THREE.Color('#e9a3b8'), dusk * .4);
  clouds.forEach(c => { const u = c.userData; c.position.set(((u.x + ct * u.v * 3 + 260) % 520) - 260, u.y, u.z); c.material.color.copy(ctint).multiplyScalar(2.1); });
  const sw = Math.sin(t * 1.4); foam.position.set(0, groundY(0, 9.3 + sw * .35) + .03, 9.3 + sw * .35); foam.material.opacity = .55 + .3 * (sw * .5 + .5); foamTex.offset.x = t * .02;
  if (scene.userData.boat) scene.userData.boat.position.x = 20 - t * .3 - day * 6;
  gulls.forEach(g => { const u = g.userData, a = u.ph + t * u.sp * (1 + day * 2); g.position.set(u.cx + Math.cos(a) * u.r, u.cy + Math.sin(a * 2) * .4, u.cz + Math.sin(a) * u.r * .5); g.rotation.set(0, -a + Math.PI, Math.sin(a) * .25);
    const f = Math.sin(t * 8 + u.ph * 3) * .7; u.wings[0].rotation.x = f; u.wings[1].rotation.x = -f; });
  const lampOn = smooth(range(t, 13.6, 15.2)); scene.userData.lamp.material.emissiveIntensity = 2.2 * lampOn; lanternLight.intensity = 3 * lampOn;
  const formed = smooth(range(t, 10.75, 11.05)), rise = easeIn(range(t, 15.6, 17.7));
  const gpos = PIER_END.clone().add(V(0, Math.sin(t * 2.2) * .03 + rise * 5.5, -rise * 3.5));
  const lookBack = t > 13.3 && t < 15.6 ? smooth(range(t, 13.7, 14.4)) * (1 - smooth(range(t, 15.0, 15.5))) : 0;
  ghost.position.copy(gpos); ghost.rotation.set(0, Math.PI + lookBack * 2.4, 0);
  const j = kick(t, 7), wob = Math.exp(-(t - lastBeat(t)) * 7) * Math.cos((t - lastBeat(t)) * 30);
  const lb = lastBeat(t), hopOn = t > 11.3 && t < 15.5 && Math.round((lb - .116) / T.beat) % 2 === 0, hp = hopOn ? Math.sin(Math.PI * clamp((t - lb) / .32, 0, 1)) : 0;
  ghost.rotation.y += Math.sin(t * 1.1) * .22 * formed * (1 - rise);
  pose(ghost, { sy: 1 - .1 * wob + hp * .06, sx: 1 / Math.sqrt(1 - .1 * wob + hp * .06), lean: Math.sin(t * Math.PI / (T.beat * 2)) * .09, tilt: -hp * .08, hop: hp * .14, arms: .15 + rise * 1.2 + j * .25 + hp * .5 });
  setOpacity(ghost, formed * (1 - smooth(range(t, 17.1, 17.6))) * .93);
  ghostL.position.copy(gpos).add(V(0, .8, .6)); ghostL.intensity = .5 * formed;
  gPar.visible = t >= T_BURST && t < 11.1;
  if (gPar.visible) { ghost.updateMatrixWorld(true); const o = new THREE.Object3D(), w = V(0, 0, 0), g0 = ghost3(T_BURST - 1e-4);
    for (let i = 0; i < gPts.length; i++) { const home = w.copy(gPts[i].p).applyMatrix4(ghost.matrixWorld).clone(); const dl = (i % 23) / 23 * .3, k = easeInOut(range(t, T_BURST + dl * .25, 10.75 + dl * .5));
      const f = voxelWorld(VOX[i % VOX.length], g0), from = V(f[0] + gRand[i].x * .12, f[1] + gRand[i].y * .12, f[2] + gRand[i].z * .12);
      const mid = from.clone().lerp(home, .5).add(V(gRand[i].x * .9, .5 + gRand[i].y * .7, gRand[i].z * .9));
      const a = from.clone().lerp(mid, k), b = mid.clone().lerp(home, k); const p = a.lerp(b, k);
      o.position.copy(p); o.rotation.set(t * 4 + i, t * 3, 0); o.scale.setScalar(lerp(1.25, 1, k) * (1 - smooth(range(t, 10.75 + dl * .5, 11.05)))); o.updateMatrix(); gPar.setMatrixAt(i, o.matrix); }
    gPar.instanceMatrix.needsUpdate = true; }
  const steps = [13.328, 13.886, 14.443], start = V(-3.4, 0, 14.6), at = V(-2.2, 0, 13.8);
  let k = 0; steps.forEach((s, i) => { if (t > s) k = i + Math.min(1, (t - s) / .42); });
  const pp = start.clone().lerp(at, k / 3); pp.y = groundY(pp.x, pp.z) + Math.abs(Math.sin(Math.PI * (k % 1))) * .3 * (k < 3 ? 1 : 0);
  pinkOne.position.copy(pp); pinkOne.rotation.y = .75 + .85 * smooth(range(t, 14.5, 14.75)) * (1 - smooth(range(t, 15.0, 15.3)));
  pinkOne.visible = t > 13.16 && t < 15.38;
  prints.forEach((f, i) => { const st = Math.floor(i / 2), land = steps[st] + .42, kk = (st + 1) / 3, side = i % 2 ? .1 : -.1;
    const q = start.clone().lerp(at, kk - (st === 2 ? 0 : 0)); const fx = q.x + side * .8, fz = q.z + side * .6 + .35; f.position.set(fx, groundY(fx, fz) + .015, fz); f.rotation.y = .9;
    f.material.opacity = i < 6 && t > land ? .7 * Math.min(1, (t - land) / .12) : 0; f.scale.setScalar(1).multiplyScalar(t > land ? 1 + .4 * Math.exp(-(t - land) * 14) : 1); f.scale.z *= 1.35; });
  const pw = Math.exp(-(t - lastBeat(t)) * 8) * Math.cos((t - lastBeat(t)) * 28);
  pose(pinkOne, { sy: 1 - .14 * pw, sx: 1 / Math.sqrt(1 - .14 * pw), arms: t > 14.55 && t < 15.0 ? 1.0 : .25, armsIn: .3 });
  const place = smooth(range(t, 14.6, 14.95)); pinkOne.updateMatrixWorld(true);
  const hand = pinkOne.userData.arms[1].getWorldPosition(V(0, 0, 0)).add(V(0, -.15, 0));
  flowerG.position.copy(hand.lerp(STONE.clone().add(V(0, .16, 0)), place)); flowerG.rotation.set(0, .4, (1 - place) * .4); flowerG.visible = t > 13.16;
  const hh = range(t, 14.95, 15.6); heart.visible = hh > 0 && hh < 1; heart.position.copy(STONE).add(V(0, .55 + hh * 1.1, 0)); heart.material.opacity = 1 - hh; heart.scale.setScalar(.7 + hh * .6); heart.rotation.y = t * 2.5;
  const rim = (i0, pos, on) => { const dir = cam.position.clone().sub(pos).setY(0).normalize(); [1, -1].forEach((s, q) => { const r = dir.clone().applyAxisAngle(V(0, 1, 0), s * Math.PI * .75); rims[i0 + q].position.copy(pos).addScaledVector(r, 1.0).add(V(0, .9, 0)); rims[i0 + q].intensity = 3 * on; }); };
  sparks.forEach(s => { const u = s.userData; s.visible = t > 15.6; const lt = (t * u.v + u.ph) % 2; s.position.copy(gpos).add(V(Math.cos(u.a + t) * u.r, -1 + lt * 1.5, Math.sin(u.a + t) * u.r)); s.scale.setScalar((1 - lt / 2) * (.6 + kb * .6)); });
  motes.forEach((m, i) => { const b = m.userData; m.position.set(b.x + Math.sin(t * .4 + i) * .3, b.y + Math.sin(t * .6 + i * 2) * .2, b.z); m.visible = t > 10.4; });
  // the children: chasing each other on the pier, then running past the camera back to the beach
  kids.forEach((kd, i) => { kd.visible = t > 8.9 && t < 11.0; if (!kd.visible) return;
    const lb = lastBeat(t), ph = clamp((t - lb) / T.beat, 0, 1), hop = Math.abs(Math.sin(Math.PI * ph)) * .16;
    const a = t * 3.4 + i * Math.PI, play = V(1.6 + Math.cos(a) * .36, .78, 6.0 + Math.sin(a) * .55);
    const lane = V(i ? 2.08 : 1.12, .78, 6.0 + Math.max(0, t - 10.35) * 3.4 + Math.max(0, t - 10.35) ** 2 * 2), run = smooth(range(t, 10.3, 10.48));
    const p = play.clone().lerp(lane, run); p.y += hop * (1 - run * .4); kd.position.copy(p);
    const face = Math.atan2(-Math.sin(a), Math.cos(a)) * (i ? 1 : -1); kd.rotation.y = lerp(face, 0, run) + Math.sin(t * 9 + i) * .12 * run;
    const w = Math.exp(-(t - lb) * 9) * Math.cos((t - lb) * 30);
    pose(kd, { sy: 1 - .16 * w, sx: 1 / Math.sqrt(1 - .16 * w), lean: Math.sin(t * 7 + i * 2) * .12, arms: .3 + .9 * run + Math.abs(Math.sin(t * 9 + i)) * .5 }); });
  const c = camAt(t);
  sky.position.copy(c.pos);
  const hAmp = (t < 11.0 ? smooth(range(t, T_HAND, T_HAND + .6)) : 1) * (t > 16.62 ? 1 - smooth(range(t, 16.9, 17.3)) : 1);   // no handheld at the 2D↔3D hand-offs
  cam.position.copy(c.pos).add(V(Math.sin(t * .9) * .025 * hAmp, Math.sin(t * 1.3) * .02 * hAmp, 0)); cam.fov = c.fov - kb * .9 * hAmp; cam.updateProjectionMatrix(); cam.lookAt(c.tgt);
  if (t > 10.3 && t < 11.0) cam.rotateZ(.1 * Math.sin((t - 10.3) / .7 * Math.PI));
  rim(0, gpos, formed); rim(2, pp, pinkOne.visible ? 1 : 0);
  const subj = t < 10.4 ? V(1.6, 1.0, 6.0) : (t > 13.16 && t < 15.38 ? pp.clone().add(V(0, .5, 0)) : gpos.clone().add(V(0, .5, 0)));
  bokeh.uniforms.focus.value = cam.position.distanceTo(subj); bokeh.uniforms.aperture.value = t < 10.4 ? .0009 : .0016;
  const sv = cam.position.clone().addScaledVector(sunDir, 1000).project(cam); grade.uniforms.sunUV.value.set(sv.x * .5 + .5, sv.y * .5 + .5);
  grade.uniforms.shaft.value = (sv.z < 1 && Math.abs(sv.x) < 1.3 && Math.abs(sv.y) < 1.3) ? 1 : 0;
  bloom.strength = .26 + dusk * .14;
}
export function render() { composer.render(); const gl = renderer.getContext(), px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
