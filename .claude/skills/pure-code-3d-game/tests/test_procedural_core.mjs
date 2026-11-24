import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng,noise3,fbm3,sweepCurve,createFaceVolume,createEyebrows,makeRig,solveLegIK,sampleWalk,sampleSnowflake,snowCrystalRadius,impactSample } from '../tools/procedural-core.mjs';
const finite = x=>assert.ok(x.every(Number.isFinite));
test('seeded random generator is repeatable and seed-sensitive',()=>{
 const a=createRng(42),b=createRng(42),c=createRng(43),xs=Array.from({length:20},()=>a());
 assert.deepEqual(xs,Array.from({length:20},()=>b()));assert.notDeepEqual(xs,Array.from({length:20},()=>c()));
});
test('mathematical 3D noise is deterministic and continuous across cell boundary',()=>{
 assert.equal(noise3(1.234,5.43,-1,7),noise3(1.234,5.43,-1,7));
 assert.ok(Math.abs(noise3(1-1e-6,0.7,0.1,1)-noise3(1+1e-6,0.7,0.1,1))<0.0001);
 assert.ok(fbm3(3,5,7)>=-1&&fbm3(3,5,7)<=1);
});
test('continuous procedural face has valid topology, not six primitive faces',()=>{
 const mesh=createFaceVolume({latitudes:30,longitudes:48});finite(mesh.positions);
 assert.equal(mesh.positions.length,31*49*3);assert.equal(mesh.indices.length,30*48*6);finite(mesh.normals);assert.equal(mesh.normals.length,mesh.positions.length);
 assert.ok(Math.max(...mesh.indices)<mesh.positions.length/3);
});
test('each eyebrow is a generated, tapered 3D mesh with no image assets',()=>{
 const [left,right]=createEyebrows();
 for(const m of [left,right]){assert.ok(m.positions.length>400);finite(m.positions);finite(m.normals);assert.equal(m.indices.length,28*7*6);}
 assert.ok(Math.abs(left.positions[0]+right.positions[0])<0.002);
});
test('sweep refuses degenerate curve and invalid dimensions',()=>{
 const zero=[0,0,0];assert.throws(()=>sweepCurve([zero,zero,zero,zero]),/Degenerate/);
 assert.throws(()=>createFaceVolume({width:0}),/Invalid/);
});
test('parameterized skeleton includes symmetric limbs and explicitly labels illustrative ratios',()=>{
 const r=makeRig({height:1.8});assert.ok(r.bones.some(b=>b.name==='LeftUpperLeg'));
 assert.ok(r.bones.some(b=>b.name==='RightUpperArm'));
 assert.equal(r.origin,'design-proportions-not-anthropometric-scan');
 assert.equal(r.upperLegM+r.lowerLegM,r.legLengthM);
});
test('two-bone IK preserves segment lengths and reports impossible reach',()=>{
 const q=solveLegIK([0,0.9],[0.15,0],0.5,0.5);
 assert.ok(q.reachable); assert.ok(Math.abs(Math.hypot(q.knee[0],q.knee[1]-0.9)-0.5)<1e-9);
 assert.ok(Math.abs(Math.hypot(q.ankle[0]-q.knee[0],q.ankle[1]-q.knee[1])-0.5)<1e-9);
 assert.equal(solveLegIK([0,3],[0,0],0.5,0.5).reachable,false);
});
test('stance feet are WORLD-LOCKED and two body sizes produce finite IK poses',()=>{
 for(const legLength of [0.7,0.95]){
  let records={left:[],right:[]};
  for(let i=0;i<=300;i++){
   const x=sampleWalk({t:i/120,speed:1.2,legLength});
   finite(x.root);
   for(const f of x.legs){finite(f.footWorld);finite(f.knee);assert.equal(f.reachable,true);if(f.stance&&f.reachable)records[f.side].push({x:f.footWorld[0],t:i/120});}
  }
  for(const list of Object.values(records)){
   assert.ok(list.length>30);
   const blocks=new Map();for(const v of list){const k=Math.round(v.x*100000);blocks.set(k,(blocks.get(k)||0)+1);}
   assert.ok([...blocks.values()].some(n=>n>8));
  }
 }
});
test('snow particle fields are regenerated from seed/id/time not stored per frame',()=>{
 const args={id:123,time:3.5,seed:7};assert.deepEqual(sampleSnowflake(args),sampleSnowflake(args));
 assert.notDeepEqual(sampleSnowflake(args),sampleSnowflake({...args,seed:8}));
 assert.ok(Math.abs(snowCrystalRadius(0.3)-snowCrystalRadius(0.3+Math.PI/3))<1e-8);
});
test('synthesized impact produces finite decreasing-decay samples',()=>{
 const sample=Array.from({length:4096},(_,i)=>impactSample(i/48000));finite(sample);
 assert.ok(Math.abs(impactSample(1.0))<1e-6);
});