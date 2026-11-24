import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {auditProceduralProject} from '../tools/procedural-gate.mjs';
function fixture(fn){const dir=mkdtempSync(join(tmpdir(),'gamekit-strict-'));try{writeFileSync(join(dir,'gamekit.json'),JSON.stringify({assetMode:'code-only'}));mkdirSync(join(dir,'src'));fn(dir);return auditProceduralProject(dir)}finally{rmSync(dir,{recursive:true,force:true})}}
const make=(dir,path,content)=>writeFileSync(join(dir,'src',path),content);
test('strict gate accepts deterministic mathematical rendering and procedural curves',()=>{
 const r=fixture(dir=>make(dir,'render.mjs','export function shape(seed){return Math.sin(seed)+Math.cos(seed*0.2)};'));assert.equal(r.ok,true);assert.equal(r.filesExamined,1);
});
test('strict gate rejects prebuilt model and binary texture files',()=>{
 const r=fixture(dir=>{make(dir,'hero.glb','binary');make(dir,'diffuse.png','x');});assert.equal(r.ok,false);assert.equal(r.errors.filter(x=>x.code==='ASSET_FILE').length,2);
});
test('strict gate rejects inlined bitmap payload',()=>{
 const r=fixture(dir=>make(dir,'t.mjs','export const x = "data:image/png;base64,iVBORw0KGgo="'));assert.ok(r.errors.some(x=>x.code==='INLINE_ASSET'));
});
test('strict gate rejects runtime dynamic external asset fetch',()=>{
 const r=fixture(dir=>make(dir,'t.mjs','const texture = fetch("https://example.com/texture.webp")'));assert.ok(r.errors.some(x=>x.code==='RUNTIME_ASSET_LOAD'));
});
test('strict gate rejects Math.random to keep world reproducible',()=>{
 const r=fixture(dir=>make(dir,'world.mjs','export const pos = Math.random();'));assert.ok(r.errors.some(x=>x.code==='NONDETERMINISTIC_RANDOM'));
});
test('strict gate rejects large precomputed Float32Array',()=>{
 const arr=Array.from({length:120},(_,i)=>i/10).join(',');const r=fixture(dir=>make(dir,'geom.mjs','const mesh=new Float32Array(['+arr+']);'));assert.ok(r.errors.some(x=>x.code==='BAKED_NUMERIC_BUFFER'));
});
test('strict gate rejects precomputed animation array in JSON',()=>{
 const r=fixture(dir=>make(dir,'clip.json',JSON.stringify({motionFrames:Array.from({length:120},(_,i)=>i)})));assert.ok(r.errors.some(x=>x.code==='BAKED_JSON_ASSET'));
});
test('strict gate rejects falsely marked hybrid project',()=>{
 const d=mkdtempSync(join(tmpdir(),'gamekit-hybrid-'));try{writeFileSync(join(d,'gamekit.json'),JSON.stringify({assetMode:'hybrid'}));mkdirSync(join(d,'src'));make(d,'world.mjs','export const x=1;');const r=auditProceduralProject(d);assert.ok(r.errors.some(x=>x.code==='MODE'));}finally{rmSync(d,{recursive:true,force:true})}
});
test('strict gate refuses to pass an empty project with no runtime files',()=>{
 const d=mkdtempSync(join(tmpdir(),'gamekit-empty-'));try{writeFileSync(join(d,'gamekit.json'),JSON.stringify({assetMode:'code-only'}));const r=auditProceduralProject(d);assert.ok(r.errors.some(x=>x.code==='NO_RUNTIME'));}finally{rmSync(d,{recursive:true,force:true})}
});