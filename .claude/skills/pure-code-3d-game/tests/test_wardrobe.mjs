import {makeCuff,dielectricF0} from '../tools/wardrobe.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
const rows=[[0,.12,.09],[.12,.11,.08],[.25,.085,.075]];
test('cuff outer, lining and hem all have valid triangles',()=>{
 const m=makeCuff(rows),n=m.positions.length/3;
 assert.equal(m.uv.length,2*n);
 assert.equal(m.ranges.hem.count,48*12);
 assert.equal(m.ranges.hem.start+m.ranges.hem.count,m.indices.length);
 for(let i=0;i<m.indices.length;i+=3){
  const ix=m.indices.slice(i,i+3);assert.equal(new Set(ix).size,3);assert.ok(ix.every(j=>j>=0&&j<n));
  const [a,b,c]=ix.map(j=>m.positions.slice(j*3,j*3+3)),u=b.map((x,k)=>x-a[k]),v=c.map((x,k)=>x-a[k]);
  const area=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]);assert.ok(area>1e-9);
 }
});
test('cloth seam positions coincide but warp coordinate unwraps',()=>{
 const m=makeCuff(rows);
 for(let i=0;i<rows.length*2;i++){
  const a=i*49,b=a+48;
  assert.deepEqual(m.positions.slice(a*3,a*3+3),m.positions.slice(b*3,b*3+3));
  assert.equal(m.uv[a*2],0);assert.equal(m.uv[b*2],1);
 }
});
test('inner surface clears referenced rest sections; negative clearance rejected',()=>{
 const m=makeCuff(rows);
 for(let i=0;i<rows.length;i++)for(let j=0;j<48;j++){
  const k=3*(49*(rows.length+i)+j),[,rx,rz]=rows[i];assert.ok((m.positions[k]/rx)**2+(m.positions[k+2]/rz)**2>=1);
 }
 assert.throws(()=>makeCuff(rows,{ease:.001}));
});
test('dielectric interface response and invalid IOR',()=>{
 assert.ok(Math.abs(dielectricF0(1.5)-.04)<1e-10);assert.equal(dielectricF0(1,1),0);
 assert.throws(()=>dielectricF0(0));assert.throws(()=>dielectricF0(NaN));
});

import {validateContract} from '../tools/quality-contract.mjs';
import fs from 'node:fs';
test('surface review is opt-in; unknown cases are rejected',()=>{
 const c=JSON.parse(fs.readFileSync(new URL('../tools/quality-example.json',import.meta.url)));
 const p={modules:[{kind:'character'}],renderer:{primary:'webgpu',fallback:'webgl2'},fixedHz:60};
 c.character.surfaceChecks=['fabric-turn','glasses-gaze'];validateContract(c,p);
 c.character.surfaceChecks=['nice-looking'];assert.throws(()=>validateContract(c,p));
});
