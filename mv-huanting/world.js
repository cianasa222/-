// 3D part of the MV: night river of memory blocks, the orange one and the pink one.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { KICKS, BEAT, lastKick, kickEnv, jelly, clamp, lerp, smooth, easeOut, easeIn, easeInOut, range, rng } from './timeline.js';

const W = 1280, H = 720;
const rnd = rng(11);
export const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#3d3470', .03);

// ---------------- sky ----------------
const MOON_DIR = new THREE.Vector3(.42, .3, -.86).normalize();
scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { moon: { value: MOON_DIR } },
  vertexShader: `varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 moon; varying vec3 vd;
    float h1(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
    void main(){ float h = vd.y;
      vec3 c = mix(vec3(.30,.24,.50), vec3(.05,.05,.15), smoothstep(-.02,.6,h));
      c += vec3(.55,.28,.50) * pow(1.-abs(h), 7.) * .55;
      float d = max(dot(vd, moon), 0.);
      c += vec3(.55,.6,.9) * pow(d, 24.) * .45 + vec3(3.4,3.2,2.9) * smoothstep(.9986,.9991,d);
      vec3 g = floor(vd * 900.); float s = h1(g); float tw = step(.9986, s) * smoothstep(.0,.2,h);
      c += vec3(1.,.95,.9) * tw * (1.2 + 2.5*fract(s*91.));
      gl_FragColor = vec4(c, 1.); }` })));

// ---------------- lights ----------------
const moonL = new THREE.DirectionalLight('#b4bcff', 1.9);
moonL.position.copy(MOON_DIR).multiplyScalar(40).add(new THREE.Vector3(0, 0, 18)); moonL.castShadow = true; moonL.shadow.mapSize.set(2048, 2048);
Object.assign(moonL.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 100 }); moonL.shadow.bias = -.0005; moonL.shadow.normalBias = .02;
moonL.target.position.set(0, 0, -1); scene.add(moonL, moonL.target);
scene.add(new THREE.HemisphereLight('#7f78c8', '#2a2038', 1.22));
const fillL = new THREE.DirectionalLight('#a99cff', .48); fillL.position.set(6, 4, 9); scene.add(fillL);   // soft fill from the camera side so the grass reads

// ---------------- river ----------------
export const riverX = z => Math.sin(z * .09) * 3.2 - 2.6 + Math.sin(z * .23) * .6;
{
  const g = new THREE.PlaneGeometry(1, 1, 1, 220); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const v = p.getY(i), u = p.getX(i); const z = 8 - (v + .5) * 100; p.setXYZ(i, riverX(z) + u * 4.6, -.02, z); }
  g.computeVertexNormals();
  const water = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#0d1030', roughness: .08, metalness: .25, transparent: true, opacity: .74, side: THREE.DoubleSide }));
  water.receiveShadow = true; scene.add(water);
}
// ---------------- ground, grass, mountains ----------------
{
  const g = new THREE.PlaneGeometry(140, 140, 70, 70); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const d = Math.abs(x - riverX(z)); p.setY(i, d < 2.6 ? -.3 : Math.min(.0, -.3 + (d - 2.6) * .4) + Math.sin(x * .3 + z * .2) * .05); }
  g.computeVertexNormals(); const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#253d2e', roughness: 1 })); ground.receiveShadow = true; scene.add(ground);
}
{
  const blade = new THREE.BufferGeometry();
  blade.setAttribute('position', new THREE.Float32BufferAttribute([-.012, 0, 0, .012, 0, 0, -.008, .085, 0, .008, .085, 0, 0, .16, 0], 3));
  blade.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, .55, 1, .55, .5, 1], 2));
  blade.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]); blade.computeVertexNormals();
  const N = 120000, mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .8, side: THREE.DoubleSide });
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = grassTime;
    sh.vertexShader = 'uniform float uTime;\nvarying vec2 vUv2;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vec4 wp = instanceMatrix * vec4(0.,0.,0.,1.); transformed.x += sin(wp.x*1.7 + wp.z*1.3 + uTime*1.6) * .035 * uv.y * uv.y; vUv2 = uv;');
    sh.fragmentShader = 'varying vec2 vUv2;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= mix(.45, 1.35, vUv2.y);');
  };
  const im = new THREE.InstancedMesh(blade, mat, N), o = new THREE.Object3D(), c = new THREE.Color(); let n = 0;
  while (n < N) {
    const x = (rnd() - .5) * 20 + 1.5, z = 6 - rnd() * 19; const d = Math.abs(x - riverX(z)); if (d < 2.45) continue;
    o.position.set(x, d >= 2.6 ? Math.min(0, -.3 + (d - 2.6) * .4) + Math.sin(x * .3 + z * .2) * .05 : -.3, z);
    o.rotation.set((rnd() - .5) * .5, rnd() * 6.28, (rnd() - .5) * .5); const s = .7 + rnd() * .9; o.scale.set(s, s * (.8 + rnd() * .6), s); o.updateMatrix();
    im.setMatrixAt(n, o.matrix); c.setHSL(.35 + (rnd() - .5) * .08, .38 + rnd() * .2, .3 + rnd() * .14); im.setColorAt(n, c); n++;
  }
  im.receiveShadow = true; scene.add(im);
}
const grassTime = { value: 0 };
{
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 1 }), 3000); const o = new THREE.Object3D(); let n = 0; const c = new THREE.Color();
  for (let gx = -100; gx < 100; gx += 3) for (let gz = -160; gz < -105; gz += 3) {
    const h = Math.max(1, (Math.sin(gx * .05) + Math.cos(gz * .07 + gx * .03) + 1.6) * 6 + Math.sin(gx * .3 + gz * .2) * 1.8);
    if (n >= 3000) break; o.position.set(gx, h / 2 - 1, gz); o.scale.set(3, h, 3); o.updateMatrix(); m.setMatrixAt(n, o.matrix);
    c.set('#4a4380').lerp(new THREE.Color('#8a7cc0'), clamp((h - 8) / 10, 0, 1) * .6); m.setColorAt(n++, c);
  } m.count = n; scene.add(m);
}

// ---------------- mascot factory ----------------
function heartShape(sz) { const s = new THREE.Shape(); s.moveTo(0, -sz); s.bezierCurveTo(sz * 1.3, -sz * .1, sz * .7, sz * 1.0, 0, sz * .45); s.bezierCurveTo(-sz * .7, sz * 1.0, -sz * 1.3, -sz * .1, 0, -sz); return s; }
const BW = 1.0, BH = .76, BD = .82, CY = .62;
function makeMascot({ color, cup, led, scale = 1, glow = 0 }) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); root.scale.setScalar(scale);
  const mats = [];
  const M = (p) => { const m = new THREE.MeshPhysicalMaterial(p); mats.push(m); return m; };
  const clay = M({ color, roughness: .5, sheen: .7, sheenRoughness: .45, sheenColor: new THREE.Color(color).lerp(new THREE.Color('#fff'), .45), clearcoat: .15, clearcoatRoughness: .55, emissive: color, emissiveIntensity: glow ? .3 : .14, transparent: !!glow, opacity: glow ? .82 : 1 });
  const torso = new THREE.Mesh(new RoundedBoxGeometry(BW, BH, BD, 10, .16), clay); torso.position.y = BH / 2 + .12; torso.castShadow = !glow; body.add(torso);
  const auraM = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.3), transparent: true, opacity: glow ? .14 : .1, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }); mats.push(auraM);
  const aura = new THREE.Mesh(new RoundedBoxGeometry(BW * 1.09, BH * 1.11, BD * 1.1, 6, .2), auraM); aura.position.y = BH / 2 + .12; body.add(aura);
  const dark = M({ color: '#1c1210', roughness: .3, transparent: !!glow, opacity: glow ? .85 : 1 });
  for (const s of [-1, 1]) { const eye = new THREE.Mesh(new THREE.CapsuleGeometry(.032, .09, 6, 12), dark); eye.position.set(s * .19, BH * .6 + .12, BD / 2 + .004); eye.scale.z = .5; body.add(eye); }
  const cheekM = new THREE.MeshBasicMaterial({ color: '#ff7f8f', transparent: true, opacity: .4 });
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CircleGeometry(.06, 20), cheekM); c.position.set(s * .31, BH * .44 + .12, BD / 2 + .005); c.scale.y = .6; body.add(c); }
  const arms = {};
  for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(s * (BW / 2), .48, .05); body.add(piv); const a = new THREE.Mesh(new RoundedBoxGeometry(.17, .17, .21, 5, .06), clay); a.position.set(s * .06, -.06, 0); a.castShadow = !glow; piv.add(a); arms[s] = piv; }
  const legs = [];
  for (const [x, z] of [[-.31, .23], [.31, .23], [-.31, -.23], [.31, -.23]]) { const l = new THREE.Mesh(new RoundedBoxGeometry(.16, .16, .16, 5, .055), clay); l.position.set(x, .08, z); l.castShadow = !glow; root.add(l); legs.push(l); }
  const hp = new THREE.Group(); body.add(hp);
  const cream = M({ color: '#fff3e6', roughness: .75, sheen: .5, sheenColor: new THREE.Color('#ffffff'), emissive: glow ? '#ffd0e0' : '#000', emissiveIntensity: glow ? .12 : 0, transparent: !!glow, opacity: glow ? .85 : 1 });
  const shell = M({ color: cup, roughness: .35, clearcoat: .6, clearcoatRoughness: .3, emissive: glow ? cup : '#000', emissiveIntensity: glow ? .15 : 0, transparent: !!glow, opacity: glow ? .85 : 1 });
  const arc = new THREE.Mesh(new THREE.TorusGeometry(BW / 2 + .1, .085, 18, 56, Math.PI), cream); arc.position.set(0, CY, -.04); arc.scale.y = .78; arc.castShadow = !glow; hp.add(arc);
  const cups = {};
  for (const s of [-1, 1]) {
    const cg = new THREE.Group(); cg.position.set(s * (BW / 2), CY - .02, -.04); hp.add(cg); cups[s] = cg;
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(.215, .2, .15, 40), shell); sh.rotation.z = Math.PI / 2; sh.position.x = s * .12; sh.castShadow = !glow; cg.add(sh);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.2, 32, 16), shell); cap.scale.set(.35, 1, 1); cap.position.x = s * .19; cg.add(cap);
    const cu = new THREE.Mesh(new THREE.TorusGeometry(.17, .065, 14, 40), cream); cu.rotation.y = Math.PI / 2; cu.position.x = s * .04; cg.add(cu);
    const icoMat = new THREE.MeshStandardMaterial({ color: '#000', emissive: led === 'heart' ? '#ffd6e4' : '#fff1d6', emissiveIntensity: 2.6 });
    let ico;
    if (led === 'heart') { ico = new THREE.Mesh(new THREE.ExtrudeGeometry(heartShape(.07), { depth: .015, bevelEnabled: false }), icoMat); ico.rotation.y = s * Math.PI / 2; }
    else { ico = new THREE.Group(); const h = new THREE.Mesh(new THREE.SphereGeometry(.045, 14, 10), icoMat); h.scale.set(.6, .8, 1); h.position.set(0, -.04, -.02); const st = new THREE.Mesh(new THREE.BoxGeometry(.015, .12, .015), icoMat); st.position.set(0, .02, .015); const fl = new THREE.Mesh(new THREE.BoxGeometry(.015, .035, .05), icoMat); fl.position.set(0, .07, .035); ico.add(h, st, fl); }
    ico.position.x = s * .265; cg.add(ico);
  }
  root.userData = { body, hp, arms, legs, cups, torso, mats, glow };
  return root;
}
function setOpacity(m, o) { m.userData.mats.forEach(mt => { mt.transparent = true; mt.opacity = o * (mt.userData.base ?? (mt.userData.base = mt.opacity)); }); m.visible = o > .01; }
// pose: jelly squash, sway, arm lift
function pose(m, { sy = 1, sx = 1, lean = 0, tilt = 0, arms = 0, armsIn = 0, hop = 0 }) {
  const u = m.userData; u.body.scale.set(sx, sy, sx); u.body.rotation.set(tilt, 0, lean);
  u.arms[-1].rotation.set(0, -armsIn, -arms); u.arms[1].rotation.set(0, armsIn, arms);
  u.body.position.y = hop;
}

// ---------------- characters ----------------
const P0 = new THREE.Vector3(.75, 0, 1.0), PP = new THREE.Vector3(1.85, .02, .62);
const orange = makeMascot({ color: '#e0683d', cup: '#ff9a5c', led: 'note' }); scene.add(orange);
const pink = makeMascot({ color: '#ff9cba', cup: '#ff86ad', led: 'heart', scale: .88, glow: 1 }); scene.add(pink);
const pinkL = new THREE.PointLight('#ff8fb8', 0, 5, 2); scene.add(pinkL);
const keyL = new THREE.PointLight('#ffc39a', 5.5, 8, 2); scene.add(keyL);
// whisper ripples
const ripples = [0, 1, 2].map(() => { const r = new THREE.Mesh(new THREE.TorusGeometry(.3, .009, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd8ec').multiplyScalar(2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(r); return r; });
// fireflies
const flies = [];
{ const g = new THREE.OctahedronGeometry(1); for (let i = 0; i < 70; i++) { const f = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(rnd() < .5 ? '#ffe6b0' : '#ffd0e4').multiplyScalar(2.4), transparent: true })); f.userData = { p: new THREE.Vector3(-1.5 + rnd() * 5, rnd() * 2.2, -2 + rnd() * 5), ph: rnd() * 6.28, s: .012 + rnd() * .02 }; scene.add(f); flies.push(f); } }

// ---------------- memory blocks (flowing) ----------------
const SONG_COLS = ['#ffb36b', '#ff8fa8', '#8fd8ff', '#c9a6ff', '#ffe08a', '#9dffcf'];
const blockGeo = new RoundedBoxGeometry(1, 1, 1, 4, .12);
const FLOW = .3;
const flowing = [];
function addFlow(obj, refl, z0, xoff, s, y = .42) { flowing.push({ obj, refl, z0, xoff, s, y }); }
function glowBlock(z0, xoff, s, col) {
  const m = new THREE.Mesh(blockGeo, new THREE.MeshStandardMaterial({ color: '#111', emissive: col, emissiveIntensity: 1.35, roughness: .3 })); m.scale.setScalar(s); m.rotation.set((rnd() - .5) * .25, rnd() * 3, (rnd() - .5) * .25); scene.add(m);
  const r = new THREE.Mesh(blockGeo, new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(.55), transparent: true, opacity: .55 })); r.scale.set(s, -s, s); r.rotation.copy(m.rotation); scene.add(r);
  addFlow(m, r, z0, xoff, s, .38);
}
function memoryBlock(z0, xoff, s, col, kind) {
  const g = new THREE.Group(); g.scale.setScalar(s); g.rotation.set(0, .35 + (rnd() - .5) * .3, 0); scene.add(g);
  const glass = new THREE.Mesh(blockGeo, new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: .28, transparent: true, opacity: .18, roughness: .05, depthWrite: false })); g.add(glass);
  g.add(new THREE.Mesh(new RoundedBoxGeometry(1.02, 1.02, 1.02, 4, .13), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(1.6), transparent: true, opacity: .22, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending })));
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.36, .38, .06, 32), new THREE.MeshStandardMaterial({ color: '#3d7a52', emissive: '#2a5a3a', emissiveIntensity: .5, roughness: .8 })); base.position.y = -.38; g.add(base);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(.045, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff4d8').multiplyScalar(2.2) })); moon.position.set(.3, .3, -.25); g.add(moon);
  const A = makeMascot({ color: '#e0683d', cup: '#ff9a5c', led: 'note', scale: .3 }), B = makeMascot({ color: '#ff9cba', cup: '#ff86ad', led: 'heart', scale: .27 });
  A.position.set(-.13, -.35, 0); B.position.set(.13, -.35, 0); g.add(A, B);
  if (kind === 'share') {
    A.userData.hp.visible = false; B.userData.hp.visible = false;
    const band = new THREE.Mesh(new THREE.TorusGeometry(.2, .022, 10, 40, Math.PI), new THREE.MeshStandardMaterial({ color: '#fff1e0', roughness: .7 })); band.position.set(0, -.12, 0); band.scale.set(1.05, .95, 1); g.add(band);
    for (const s2 of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .04, 20), new THREE.MeshStandardMaterial({ color: s2 < 0 ? '#ff9a5c' : '#ff86ad', roughness: .5 })); c.rotation.z = Math.PI / 2; c.position.set(s2 * .25, -.17, 0); g.add(c); }
    A.rotation.z = -.12; B.rotation.z = .12;
  } else if (kind === 'hug') { A.position.x = -.08; B.position.x = .08; A.rotation.set(0, .5, -.25); B.rotation.set(0, -.5, .25); }
  else if (kind === 'hands') { A.position.x = -.16; B.position.x = .16; A.userData.arms[1].rotation.z = .5; B.userData.arms[-1].rotation.z = -.5; }
  else if (kind === 'run') { A.rotation.set(.3, .4, 0); B.rotation.set(.3, .4, 0); A.position.set(-.16, -.3, .06); B.position.set(.14, -.27, -.08); }
  else if (kind === 'wave') { A.visible = false; B.position.x = 0; B.userData.arms[1].rotation.z = 2.2; B.rotation.y = -.2; }
  const L = new THREE.PointLight('#fff0dc', 1.1, 2.2, 2); L.position.set(0, .25, .3); g.add(L);
  const r = new THREE.Mesh(blockGeo, new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(.5), transparent: true, opacity: .45 })); r.scale.set(s, -s, s); scene.add(r);
  g.userData = { glass, minis: [A, B], kind };
  addFlow(g, r, z0, xoff, s, s * .44); return g;
}
const C = (h) => new THREE.Color(h);
memoryBlock(.2, -.8, .8, C('#d2b0ff'), 'run');          // seen during the dive
memoryBlock(-.25, .05, .85, C('#ff9fbf'), 'hug');
memoryBlock(-2.0, 1.25, .75, C('#9fdcff'), 'hands');
const shareBlock = memoryBlock(2.55, 1.85, .95, C('#ffc58a'), 'share');   // the pink one steps out of this
memoryBlock(-4.5, -.6, .7, C('#ffe08a'), 'hug');
const waveBlock = memoryBlock(9.0, 1.65, .85, C('#ff9fbf'), 'wave');      // the last one, at the end
for (let i = 0; i < 44; i++) glowBlock(-7 - i * 1.1 - rnd() * .6, (rnd() - .5) * 2.8, .3 + rnd() * .3, C(SONG_COLS[(rnd() * 6) | 0]));
for (let i = 0; i < 10; i++) glowBlock(4 + i * 1.3 + rnd(), (rnd() - .5) * 2.6, .3 + rnd() * .3, C(SONG_COLS[(rnd() * 6) | 0]));

// ---------------- the door: the song "幻听" as a big standing block ----------------
const DOOR = new THREE.Vector3(-1.05, .9, -4.15), DOOR_S = 1.75;
const doorTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 118, 10, 128, 128, 170); g.addColorStop(0, '#fff3e2'); g.addColorStop(.55, '#ffc58a'); g.addColorStop(1, '#ff9a6a'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  x.fillStyle = 'rgba(70,50,130,.55)'; x.beginPath(); x.roundRect(46, 70, 164, 112, 14); x.fill();               // a tiny window — the song's inside
  x.fillStyle = '#fff4dc'; x.beginPath(); x.arc(90, 112, 18, 0, 7); x.fill(); x.fillStyle = 'rgba(70,50,130,1)'; x.beginPath(); x.arc(98, 106, 16, 0, 7); x.fill();
  for (let i = 0; i < 9; i++) { x.fillStyle = ['#ffc58a', '#ff9fbf', '#9fdcff', '#d2b0ff'][i % 4]; const h = 8 + (i * 37 % 26); x.fillRect(122 + i * 9, 168 - h, 6, h); }
  x.fillStyle = '#fff8ee'; x.font = 'bold 30px "Noto Serif SC", serif'; x.textAlign = 'center'; x.fillText('幻听', 128, 228);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const doorMat = new THREE.MeshStandardMaterial({ color: '#221a33', emissive: '#ffffff', emissiveMap: doorTex, emissiveIntensity: 1.1, roughness: .2 });
const door = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 5, .1), doorMat); door.scale.setScalar(DOOR_S); door.position.copy(DOOR); door.rotation.y = .12; scene.add(door);
const doorHalo = new THREE.Mesh(new RoundedBoxGeometry(1.06, 1.06, 1.06, 5, .12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffc58a').multiplyScalar(1.4), transparent: true, opacity: .25, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })); doorHalo.scale.setScalar(DOOR_S); doorHalo.position.copy(DOOR); doorHalo.rotation.y = .12; scene.add(doorHalo);
const doorL = new THREE.PointLight('#ffc58a', 3, 7, 2); doorL.position.copy(DOOR).add(new THREE.Vector3(1.4, .9, 1.9)); scene.add(doorL);
const DOOR_FACE_Z = DOOR.z + DOOR_S / 2;

// ---------------- pink footprints ----------------
const FP = [];
{
  const path = new THREE.CatmullRomCurve3([PP.clone().setY(0), new THREE.Vector3(1.05, 0, -.35), new THREE.Vector3(.15, 0, -1.25), new THREE.Vector3(-.55, 0, -2.0), new THREE.Vector3(-.95, 0, -2.9)]);
  const g = new RoundedBoxGeometry(.13, .03, .17, 3, .012);
  for (let k = 0; k < 10; k++) {
    const u = (k + .5) / 10, p = path.getPointAt(u), tg = path.getTangentAt(u), side = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
    const grp = new THREE.Group(); grp.position.copy(p); grp.rotation.y = Math.atan2(tg.x, tg.z); scene.add(grp);
    const mats = [];
    for (const s of [-1, 1]) { const m = new THREE.MeshStandardMaterial({ color: '#2a0f1a', emissive: '#ff8fb8', emissiveIntensity: 0 }); mats.push(m); const f = new THREE.Mesh(g, m); f.position.set(s * .09, .02, s * .05); grp.add(f); }
    const ring = new THREE.Mesh(new THREE.RingGeometry(.2, .24, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff9cc0').multiplyScalar(2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .03; grp.add(ring);
    FP.push({ grp, mats, ring, t: 12.92 + k * .075, pos: p.clone(), side });
  }
}
const fpL = [0, 1].map(() => { const l = new THREE.PointLight('#ff8fb8', 0, 3, 2); scene.add(l); return l; });

// ---------------- particles ----------------
function samplePoints(pal) {   // points on the mascot's surface in its local (unscaled) space, with colours
  const pts = [];
  const add = (x, y, z, c) => pts.push({ p: new THREE.Vector3(x, y, z), c: new THREE.Color(c) });
  const st = .068, cy = BH / 2 + .12;
  for (let x = -BW / 2 + .04; x <= BW / 2 - .03; x += st) for (let y = .16; y <= BH + .1; y += st) {
    const front = Math.abs(x - .19) < .045 && Math.abs(y - (BH * .6 + .12)) < .07 || Math.abs(x + .19) < .045 && Math.abs(y - (BH * .6 + .12)) < .07;
    const cheek = Math.abs(Math.abs(x) - .31) < .05 && Math.abs(y - (BH * .44 + .12)) < .04;
    add(x, y, BD / 2, front ? '#24140f' : cheek ? pal.cheek : pal.body); add(x, y, -BD / 2, pal.body);
  }
  for (let z = -BD / 2 + .04; z <= BD / 2 - .03; z += st) for (let y = .16; y <= BH + .1; y += st) { add(-BW / 2, y, z, pal.body); add(BW / 2, y, z, pal.body); }
  for (let x = -BW / 2 + .04; x <= BW / 2 - .03; x += st) for (let z = -BD / 2 + .04; z <= BD / 2 - .03; z += st) add(x, BH + .12, z, pal.top);
  for (let a = 0; a <= Math.PI; a += .07) for (let k = 0; k < 3; k++) add(Math.cos(a) * .6 + (k - 1) * .02, CY + Math.sin(a) * .6 * .78 + .02 * k, -.04 + (k - 1) * .05, pal.cream);
  for (const s of [-1, 1]) for (let r = 0; r <= .2; r += .06) for (let a = 0; a < 6.28; a += .5 / Math.max(r, .06)) add(s * (BW / 2 + .2), CY - .02 + Math.sin(a) * r, -.04 + Math.cos(a) * r, r > .15 ? pal.cream : pal.cup);
  for (const [x, z] of [[-.31, .23], [.31, .23], [-.31, -.23], [.31, -.23]]) for (let dx = -1; dx <= 1; dx += 2) for (let dz = -1; dz <= 1; dz += 2) add(x + dx * .05, .08, z + dz * .05, pal.body);
  return pts;
}
const voxGeo = new THREE.BoxGeometry(.05, .05, .05);
function particleSet(pts) {
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 1.0, 1.0), toneMapped: true });
  const im = new THREE.InstancedMesh(voxGeo, mat, pts.length); pts.forEach((q, i) => im.setColorAt(i, q.c)); im.frustumCulled = false; im.visible = false; scene.add(im);
  return im;
}
const ORANGE_PAL = { body: '#ef7a46', top: '#ff9a66', cheek: '#ff8f8f', cream: '#fff3e6', cup: '#ff9a5c' };
const PINK_PAL = { body: '#ffa8c6', top: '#ffc2d8', cheek: '#ff6f9a', cream: '#fff3f8', cup: '#ff86ad' };
const oPts = samplePoints(ORANGE_PAL), pPts = samplePoints(PINK_PAL);
const oPar = particleSet(oPts), pPar = particleSet(pPts);
const prnd = rng(77); const oRand = oPts.map(() => new THREE.Vector3(prnd() - .5, prnd() - .5, prnd() - .5)), pRand = pPts.map(() => new THREE.Vector3(prnd() - .5, prnd() - .5, prnd() - .5));
const _o = new THREE.Object3D(), _v = new THREE.Vector3(), _w = new THREE.Vector3();

// ---------------- camera + post ----------------
export const cam = new THREE.PerspectiveCamera(40, W / H, .03, 400);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, cam));
const bokeh = new BokehPass(scene, cam, { focus: 3, aperture: .0025, maxblur: .008 }); composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .6, .6, .86); composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, time: { value: 0 }, flash: { value: 0 }, pix: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time, flash, pix; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + time*7.) * 43758.5453); }
    void main(){ vec2 res = vec2(1280.,720.); vec2 uv = pix > 1.01 ? (floor(vUv*res/pix)+.5)*pix/res : vUv; vec2 d = uv - .5; vec3 c;
      float ca = .0018 + flash * .006; c.r = texture2D(tDiffuse, uv + d*ca).r; c.g = texture2D(tDiffuse, uv).g; c.b = texture2D(tDiffuse, uv - d*ca).b;
      if (pix > 1.01) { vec2 f = fract(vUv*res/pix); float edge = step(f.x, 1.5/pix) + step(f.y, 1.5/pix); c *= 1. - .18*min(edge,1.)*smoothstep(4.,16.,pix); }   // chromatic aberration, stronger on impacts
      float v = smoothstep(1.1, .3, length(d*vec2(1.3,1.))); c *= mix(.58, 1., v);
      c += (h(vUv*vec2(1280.,720.)) - .5) * .03; gl_FragColor = vec4(c, 1.); }` });
composer.addPass(grade);

// camera keyframes [t, pos, target, fov]
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const KEYS = [
  [0.00, V(-7.5, 7.5, 15), V(-3.2, .2, -9), 50],
  [0.55, V(-5.2, 3.0, 9.0), V(-2.8, .3, -3), 46],
  [1.30, V(-1.0, 1.7, 6.6), V(-2.6, .4, -1.2), 42],
  [2.30, V(.2, 1.35, 5.4), V(-1.9, .4, -1.6), 40],
  [3.30, V(2.0, 1.35, 5.9), V(.3, .45, .3), 40],
  [4.40, V(3.3, 1.4, 5.3), V(.85, .5, 1.0), 38],
  [5.60, V(4.3, 1.7, 5.9), V(1.3, .55, .85), 40],
  [6.90, V(3.7, 1.35, 4.9), V(1.3, .6, .85), 37],
  [8.10, V(3.1, 1.15, 4.0), V(1.3, .62, .8), 35],
  [9.20, V(5.0, 2.5, 2.9), V(1.3, .7, .7), 40],
  [10.30, V(2.0, .75, 5.8), V(1.45, 1.4, -1.6), 44],
  [11.40, V(1.7, 1.2, 4.6), V(1.3, .6, .8), 38],
  [12.60, V(1.55, 1.05, 3.8), V(1.3, .55, .8), 35],
  [13.30, V(3.9, 2.5, 4.1), V(.6, .3, -.8), 42],
  [14.20, V(2.4, 1.45, -.2), V(-.3, .4, -1.7), 40],
  [14.85, V(2.1, 1.15, -1.9), V(-.85, .5, -2.75), 36],
  [15.15, V(1.85, .9, -2.5), V(-.95, .5, -2.9), 30],
  [15.55, V(-.45, .85, -1.9), V(-1.05, .85, -3.6), 26],
  // ---- ending (from 28.5)
  [28.50, V(-.4, 1.1, -1.2), V(-1.05, .9, -4.1), 34],
  [29.20, V(1.4, 1.9, 4.2), V(-.2, .55, -1.2), 42],
  [30.00, V(4.2, 3.7, 6.9), V(.2, .6, -1.5), 44],
  [30.70, V(4.8, 7.0, 8.6), V(-.5, 1.6, -5), 46],
];
function camAt(t) {
  const ks = t < 20 ? KEYS.slice(0, 18) : KEYS.slice(18);
  let i = 0; while (i < ks.length - 2 && t > ks[i + 1][0]) i++;
  const k = clamp((t - ks[i][0]) / (ks[i + 1][0] - ks[i][0]), 0, 1), e = easeInOut(k) * .55 + k * .45;
  const P = (j) => ks[clamp(j, 0, ks.length - 1)];
  const cr = (a, b, c, d, u) => { const u2 = u * u, u3 = u2 * u; return a.clone().multiplyScalar(-.5 * u3 + u2 - .5 * u).add(b.clone().multiplyScalar(1.5 * u3 - 2.5 * u2 + 1)).add(c.clone().multiplyScalar(-1.5 * u3 + 2 * u2 + .5 * u)).add(d.clone().multiplyScalar(.5 * u3 - .5 * u2)); };
  const pos = cr(P(i - 1)[1], P(i)[1], P(i + 1)[1], P(i + 2)[1], e), tgt = cr(P(i - 1)[2], P(i)[2], P(i + 1)[2], P(i + 2)[2], e);
  return { pos, tgt, fov: lerp(P(i)[3], P(i + 1)[3], e) };
}

// ---------------- per-frame update ----------------
const hopPath = [[13.19, V(.75, 0, 1.0)], [13.63, V(.55, 0, .1)], [14.12, V(.05, 0, -.75)], [14.58, V(-.55, 0, -1.65)], [15.05, V(-1.0, .32, DOOR_FACE_Z + .44)]];
export function update(t) {
  grassTime.value = t; grade.uniforms.time.value = t;
  const env = kickEnv(t, 8);
  // -------- flowing blocks
  for (const f of flowing) {
    const z = f.z0 - FLOW * t, x = riverX(z) + f.xoff, bob = Math.sin(t * 1.3 + f.z0) * .03 + env * .03;
    f.obj.position.set(x, f.y + bob, z); f.refl.position.set(x, -f.y - .06 - bob, z); f.refl.rotation.copy(f.obj.rotation);
    if (f.obj.isMesh) f.obj.material.emissiveIntensity = (t > 28 ? .8 : 1.0) + env * .7;
    else f.obj.userData.glass.material.emissiveIntensity = .28 + env * .35;
  }
  // -------- orange
  const j = jelly(t, 1);
  orange.visible = !(t > 15.27 && t < 28.5);
  let oPos = P0.clone(), oRot = .32, o = { sy: j.sy, sx: j.sx, lean: 0, tilt: 0, arms: .1 + env * .25, armsIn: 0, hop: env * .02 };
  if (t >= 5.06 && t < 11.26) oRot = lerp(.32, .55, smooth(range(t, 5.4, 6.2)));
  if (t >= 6.86 && t < 8.6) { o.lean = -.08 * smooth(range(t, 6.86, 7.2)); }                       // leans into the whisper
  if (t >= 8.84 && t < 11.0) { const ph = (t - 8.84) / (BEAT * 2); o.lean = Math.sin(ph * Math.PI) * .14; oRot = .55; }   // sway together
  if (t >= 11.0 && t < 13.19) {                                                          // turn, open arms, hug — nothing
    oRot = lerp(.55, .95, smooth(range(t, 11.0, 11.7))); oPos.x += .18 * smooth(range(t, 11.8, 12.6));
    o.arms = lerp(.2, 1.3, smooth(range(t, 11.3, 12.2))); o.lean = -.1 * smooth(range(t, 11.8, 12.6));
    if (t > 12.7) { const d = t - 12.7, w = Math.exp(-d * 6) * Math.cos(d * 24); o.sy = 1 - .25 * w; o.sx = 1 / Math.sqrt(o.sy); o.arms = lerp(1.3, -.1, smooth(range(t, 12.7, 12.9))); o.armsIn = .5 * smooth(range(t, 12.7, 12.85)); }
  }
  if (t >= 13.19 && t < 15.27) {                                                          // chase the footprints, hop on every kick, leap at the door
    let i = 0; while (i < hopPath.length - 2 && t > hopPath[i + 1][0]) i++;
    const [ta, pa] = hopPath[i], [tb, pb] = hopPath[i + 1], k = range(t, ta, tb);
    oPos = pa.clone().lerp(pb, easeInOut(k) * .7 + k * .3); const H = i === 3 ? .75 : .32; oPos.y += Math.sin(Math.PI * k) * H;
    oRot = Math.atan2(pb.x - pa.x, pb.z - pa.z);
    o.sy = 1 + .18 * Math.sin(Math.PI * k) - .22 * Math.exp(-k * 9); o.sx = 1 / Math.sqrt(o.sy); o.arms = .3 + .9 * Math.sin(Math.PI * k);
    if (t > 15.05) { oPos = hopPath[4][1].clone(); oRot = Math.PI + .12; const d = t - 15.05; o.sy = 1 - .2 * Math.exp(-d * 8) * Math.cos(d * 30); o.sx = 1 / Math.sqrt(o.sy) * 1.06; o.arms = 1.2; }
  }
  if (t >= 28.5) {                                                                         // ending: alone on the bank, turns to the empty spot, one last soft bounce
    oPos = P0.clone(); oRot = lerp(.3, .95, smooth(range(t, 29.0, 29.9)));
    const d = t - 29.12, w = d > 0 ? Math.exp(-d * 5) * Math.cos(d * 22) : 0; o.sy = 1 - .14 * w; o.sx = 1 / Math.sqrt(o.sy); o.arms = .1;
    o.lean = -.06 * smooth(range(t, 29.4, 30.2));
  }
  orange.position.copy(oPos); orange.rotation.y = oRot; pose(orange, o);
  keyL.position.copy(oPos).add(V(1.7, 1.6, 2.2));

  // -------- pink: forms from particles (5.06), whispers, sways, hugs, bursts (12.7)
  const pinkOn = t >= 5.45 && t < 12.7;
  const pOp = smooth(range(t, 5.45, 5.95));
  setOpacity(pink, pinkOn ? pOp : 0);
  const pj = jelly(t, .8);
  let pRot = -.2, pp = { sy: pj.sy, sx: pj.sx, lean: .1, tilt: 0, arms: .1 + env * .2, armsIn: 0, hop: env * .02 };
  const pPos = PP.clone();
  if (t >= 6.86 && t < 8.6) { pp.lean = .1 + .14 * smooth(range(t, 6.86, 7.3)); pPos.x -= .12 * smooth(range(t, 6.86, 7.3)); pRot = -.18; }   // whisper: lean in, face still toward camera
  if (t >= 8.84 && t < 11.0) { const ph = (t - 8.84) / (BEAT * 2); pp.lean = Math.sin(ph * Math.PI) * .14; pRot = -.12; }
  if (t >= 11.0) { pRot = lerp(-.12, -.95, smooth(range(t, 11.0, 11.7))); pPos.x -= .2 * smooth(range(t, 11.8, 12.6)); pp.arms = lerp(.2, 1.3, smooth(range(t, 11.3, 12.2))); pp.lean = .1 * smooth(range(t, 11.8, 12.6)); }
  pink.position.copy(pPos); pink.rotation.y = pRot; pose(pink, pp);
  pinkL.position.copy(pPos).add(V(.5, 1.3, -.7)); pinkL.intensity = pinkOn ? 1.3 * pOp : 0;

  // whisper ripples from the orange's right ear cup
  orange.updateMatrixWorld(true);
  const cupW = orange.userData.cups[1].getWorldPosition(new THREE.Vector3());
  ripples.forEach((r, i) => {
    const on = t >= 6.86 && t < 8.7; const ph = ((t - 6.86) / (BEAT * 2) + i / 3) % 1;
    r.position.copy(cupW); r.rotation.set(0, oRot + Math.PI / 2, 0); r.scale.setScalar(.5 + ph * 1.6); r.material.opacity = on ? (1 - ph) * .7 * smooth(range(t, 6.86, 7.1)) : 0;
  });
  // fireflies drift up, more during 夜色多温柔
  const fly = .35 + .65 * smooth(range(t, 8.84, 9.4)) * (1 - smooth(range(t, 11.5, 12.5)));
  flies.forEach(f => { const u = f.userData; f.position.set(u.p.x + Math.sin(t * .6 + u.ph) * .3, u.p.y + ((t * .12 + u.ph) % 1.5) , u.p.z + Math.cos(t * .5 + u.ph) * .3); f.scale.setScalar(u.s * (.6 + .4 * Math.sin(t * 3 + u.ph * 3)) * fly); });

  // -------- footprints: light up one pair after another, ring flash, pulse on kicks
  FP.forEach((f, k) => {
    const d = t - f.t, on = d >= 0 && t < 28.5 ? 1 : (t >= 28.5 ? .45 : 0);
    const flash = d >= 0 ? Math.exp(-d * 5) : 0;
    f.mats.forEach(m => m.emissiveIntensity = on ? 1.6 + 3.5 * flash + env * .8 : 0);
    f.ring.material.opacity = d >= 0 && d < .6 ? (1 - d / .6) * .9 : 0; f.ring.scale.setScalar(.4 + Math.min(d, .6) * 3.2);
    // the orange one stepping on it: brief brighter flash
  });
  const lastFp = FP.filter(f => t >= f.t).pop();
  fpL[0].intensity = lastFp && t < 15.3 ? 2.5 : 0; if (lastFp) fpL[0].position.copy(lastFp.pos).add(V(0, .3, 0));
  fpL[1].intensity = t > 13.0 && t < 15.3 ? 1.6 : 0; fpL[1].position.copy(FP[2].pos).add(V(0, .3, 0));

  // -------- door
  const doorBoost = smooth(range(t, 14.6, 15.4));
  const late = t > 28 ? .6 : 1; doorMat.emissiveIntensity = (.85 + env * .3 + doorBoost * .7) * late; doorHalo.material.opacity = (.1 + env * .06 + doorBoost * .12) * late;
  doorL.intensity = 2.5 + doorBoost * 1.2;

  // -------- pink particles: gather into her (5.06 → 5.9); burst at the hug (12.7) and rain down into the footprints
  pPar.visible = (t >= 5.06 && t < 6.0) || (t >= 12.7 && t < 13.75);
  if (pPar.visible) {
    pink.updateMatrixWorld(true);
    const src = shareBlock.position;
    for (let i = 0; i < pPts.length; i++) {
      const home = _w.copy(pPts[i].p).applyMatrix4(pink.matrixWorld); let s = 1;
      if (t < 6.0) {
        const delay = (i % 17) / 17 * .25, k = easeOut(range(t, 5.06 + delay, 5.62 + delay));
        _v.copy(src).addScaledVector(pRand[i], .9); _v.y += .1;
        _v.lerp(home, k); _v.y += Math.sin(Math.PI * k) * .35 * (pRand[i].y + .6);
        s = k < 1 ? .9 : 1 - smooth(range(t, 5.62 + delay, 5.95));
      } else {
        const fp = FP[i % FP.length], k1 = easeOut(range(t, 12.7, 12.95)), tk = fp.t;
        const burst = home.clone().addScaledVector(pRand[i], 1.4).add(V(0, .4, 0));
        _v.copy(home).lerp(burst, k1);
        const k2 = easeIn(range(t, Math.max(12.8, tk - .28), tk));
        _v.lerp(_w.copy(fp.pos).addScaledVector(fp.side, (i % 2 ? .09 : -.09)).setY(.04), k2);
        s = t < tk ? 1 : 0;
      }
      _o.position.copy(_v); _o.rotation.set(t * 3 + i, t * 2 + i * .3, 0); _o.scale.setScalar(s * .88); _o.updateMatrix(); pPar.setMatrixAt(i, _o.matrix);
    }
    pPar.instanceMatrix.needsUpdate = true;
  }
  // -------- orange dissolve: voxel wave spreading from the contact point (15.05), then shatter into the door (15.27 → 15.55)
  oPar.visible = t >= 15.05 && t < 15.6;
  if (oPar.visible) {
    const tt = Math.min(t, 15.27); const save = orange.visible; orange.visible = true;
    orange.position.copy(hopPath[4][1]); orange.rotation.y = Math.PI + .12; orange.updateMatrixWorld(true);
    const M = orange.matrixWorld.clone(); orange.visible = save && t < 15.27;
    const contact = V(0, .45, BD / 2).applyMatrix4(M), centre = V(0, .5, 0).applyMatrix4(M);
    const R = easeOut(range(t, 15.05, 15.25)) * 1.5;
    for (let i = 0; i < oPts.length; i++) {
      const home = _w.copy(oPts[i].p).applyMatrix4(M); const dist = home.distanceTo(contact);
      let s = dist < R ? 1 : 0; const age = (R - dist) / 1.5; if (s) s = 1 + .5 * Math.exp(-age * 30);
      _v.copy(home);
      if (t > 15.27) {
        const d = t - 15.27 + (i % 7) * .006;
        const out = _o.position.copy(home).sub(centre).normalize();
        _v.addScaledVector(out, d * .9).addScaledVector(oRand[i], d * .8);
        _v.add(V(-.02, .1, -1).multiplyScalar(d * d * 9));           // sucked into the song
        s *= 1 - smooth(range(t, 15.42, 15.58));
      }
      _o.position.copy(_v); _o.rotation.set(t > 15.27 ? (t - 15.27) * 9 * oRand[i].x : 0, t > 15.27 ? (t - 15.27) * 9 * oRand[i].y : 0, 0); _o.scale.setScalar(s); _o.updateMatrix(); oPar.setMatrixAt(i, _o.matrix);
    }
    oPar.instanceMatrix.needsUpdate = true;
  }
  // -------- camera
  const c = camAt(t);
  let fov = c.fov;
  const dk = lastKick(t); const isDown = [3, 7, 11, 15, 19, 23, 27, 31].map(i => KICKS[i]).includes(dk);
  if (dk > 0 && t < 15) fov -= (isDown ? 2.4 : .8) * Math.exp(-(t - dk) * 9);
  const shake = (t > 12.7 && t < 13.0 ? .025 * Math.exp(-(t - 12.7) * 10) : 0) + (t > 15.05 && t < 15.4 ? .02 * Math.exp(-(t - 15.05) * 8) : 0);
  cam.position.copy(c.pos).add(V(Math.sin(t * 1.1) * .03 + Math.sin(t * 37) * shake, Math.sin(t * 1.4) * .02 + Math.cos(t * 41) * shake, 0));
  cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(c.tgt);
  // focus: on whoever matters
  let fp = orange.position.clone().add(V(0, .5, 0));
  if (t < 4.0) fp = c.tgt.clone();
  if (t >= 5.6 && t < 12.7) fp = orange.position.clone().lerp(pink.position, .5).add(V(0, .5, 0));
  bokeh.uniforms.focus.value = cam.position.distanceTo(fp);
  bokeh.uniforms.aperture.value = t > 15.0 && t < 15.6 ? .004 : .0025;
  grade.uniforms.flash.value = Math.max(t > 12.7 && t < 13.2 ? Math.exp(-(t - 12.7) * 8) : 0, t > 15.05 && t < 15.6 ? Math.exp(-(t - 15.05) * 6) : 0, env * .25);
  bloom.strength = .58 + env * .08 + doorBoost * .08 - (t > 15.0 && t < 15.8 ? .22 : 0);
  grade.uniforms.pix.value = t < 20 ? 1 + 39 * easeIn(range(t, 15.3, 15.52)) : 1 + 39 * (1 - easeOut(range(t, 28.5, 29.05)));
}
export function render() { composer.render(); const gl = renderer.getContext(), px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
export function project(v3) { const v = v3.clone().project(cam); return { x: (v.x * .5 + .5) * W, y: (-v.y * .5 + .5) * H }; }
export const anchors = { orange, pink, door, DOOR };
