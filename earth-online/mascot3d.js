// Smooth soft-clay mascot (shared with the 幻听 MV): rounded body, cheeks, chunky couple headphones.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
// ---------------- mascot factory ----------------
function heartShape(sz) { const s = new THREE.Shape(); s.moveTo(0, -sz); s.bezierCurveTo(sz * 1.3, -sz * .1, sz * .7, sz * 1.0, 0, sz * .45); s.bezierCurveTo(-sz * .7, sz * 1.0, -sz * 1.3, -sz * .1, 0, -sz); return s; }
export const BW = 1.0, BH = .76, BD = .82, CY = .62;
export function makeMascot({ color, cup, led, scale = 1, glow = 0 }) {
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
export function setOpacity(m, o) { m.userData.mats.forEach(mt => { mt.transparent = true; mt.opacity = o * (mt.userData.base ?? (mt.userData.base = mt.opacity)); }); m.visible = o > .01; }
// pose: jelly squash, sway, arm lift
export function pose(m, { sy = 1, sx = 1, lean = 0, tilt = 0, arms = 0, armsIn = 0, hop = 0 }) {
  const u = m.userData; u.body.scale.set(sx, sy, sx); u.body.rotation.set(tilt, 0, lean);
  u.arms[-1].rotation.set(0, -armsIn, -arms); u.arms[1].rotation.set(0, armsIn, arms);
  u.body.position.y = hop;
}

export function samplePoints(pal) {   // points on the mascot's surface in its local (unscaled) space, with colours
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
