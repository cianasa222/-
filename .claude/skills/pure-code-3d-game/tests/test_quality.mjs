import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {deflateSync} from 'node:zlib';
import {validateContract,validateObservations,stageKeys} from '../tools/quality-contract.mjs';
const profile=()=>JSON.parse(fs.readFileSync(new URL('../tools/quality-example.json',import.meta.url)));
const project={renderer:{primary:'webgpu',fallback:'webgl2'},modules:[{kind:'character'}],fixedHz:60};
const tool=new URL('../tools/gamekit.mjs',import.meta.url).pathname;
const cli=(...args)=>spawnSync(process.execPath,[tool,...args],{encoding:'utf8'});
function observations(c) {
  const probe={passed:true,ticks:120,maxPenetrationM:.001};
  const collision=Object.fromEntries(['thinWall','glancingSlide','slopeBoundary','restingContact','spawnOverlap','layerFilter'].map(k=>[k,{...probe}]));
  Object.assign(collision.thinWall,{relativeSpeedMps:24,barrierM:.12,missedHits:0});
  const fx={concurrentEmitters:8,peakParticles:256,onFrameP95Ms:15,offFrameP95Ms:14,warningsReadable:true,gameplayHashHigh:'a'.repeat(64),gameplayHashLow:'a'.repeat(64),observedEvents:c.fx.events};
  return {collision,character:{heightM:1.75,maxPlantedFootErrorM:.008,visibleMaterialRegions:['skin','cloth','metal'],geometryStats:'evidence/geo.json'},motion:{constraintFailures:0},targets:Object.fromEntries(c.targets.map(t=>[t.id,{...t,realGpu:true,errors:0,frameP95Ms:15,sampleFrames:600,gameHeightPx:80,lighting:{mapSize:1024,coverageWidthM:64,edgeDriftPx:.25,contactGapM:.008,shadowDetailReviewed:true,highlightDetailReviewed:true,pairedFrames:600,onFrameP95Ms:15,offFrameP95Ms:14},fx:{...fx},screenshots:{}}]))};
}
function temp(fn){const d=fs.mkdtempSync(path.join(os.tmpdir(),'kit31-'));try{return fn(d)}finally{fs.rmSync(d,{recursive:true,force:true})}}
test('example contract and synthetic observations accepted',()=>{const c=profile();validateContract(c,project);validateObservations(c,observations(c))});
test('sweep or enough bounded substeps at stress speed',()=>{const c=profile();c.collision.fastMotion='discrete';assert.throws(()=>validateContract(c,project));c.collision.fastMotion='substep';c.collision.substeps=4;validateContract(c,project)});
test('project may omit a character and unpromised backend',()=>{const c=profile();c.targets.pop();c.character={enabled:false,reason:'car'};c.shots=['driver'];validateContract(c,{...project,renderer:{primary:'webgpu',fallback:'none'},modules:[]});assert.throws(()=>validateContract(c,project))});
for(const [label,mutate] of [
  ['shadow texel density',e=>e.targets.phone.lighting.coverageWidthM=250],
  ['shadow shimmer',e=>e.targets.phone.lighting.edgeDriftPx=3],
  ['floating shadow',e=>e.targets.phone.lighting.contactGapM=.12],
  ['washed highlights',e=>e.targets.phone.lighting.highlightDetailReviewed=false],
  ['shadow cost',e=>e.targets.phone.lighting.onFrameP95Ms+=5],
  ['tunneling',e=>e.collision.thinWall.missedHits++],['foot contact',e=>e.character.maxPlantedFootErrorM=.2],
  ['material region',e=>e.character.visibleMaterialRegions.pop()],['subject framing',e=>e.targets.phone.gameHeightPx=18],
  ['FX cost',e=>e.targets.phone.fx.onFrameP95Ms+=4],['warning visibility',e=>e.targets.phone.fx.warningsReadable=false],
  ['simulation divergence',e=>e.targets.phone.fx.gameplayHashLow='b'.repeat(64)],['insufficient samples',e=>e.targets.phone.sampleFrames=1]
])test('reject '+label,()=>{const c=profile(),e=observations(c);mutate(e);assert.throws(()=>validateObservations(c,e))});
test('stage fingerprints invalidate only changed stage and consumers',()=>temp(d=>{
  const file=f=>path.join(d,f);
  const graph=['mesh','cloth','scene'].map(id=>({id,files:[id],deps:id==='scene'?['mesh','cloth']:[],toolchain:'node24'}));
  graph.forEach(s=>fs.writeFileSync(file(s.id),'1'));const old=stageKeys(graph,file);
  fs.writeFileSync(file('cloth'),'2');const next=stageKeys(graph,file);
  assert.equal(old.mesh,next.mesh);assert.notEqual(old.cloth,next.cloth);assert.notEqual(old.scene,next.scene);
  graph[0].deps=['scene'];assert.throws(()=>stageKeys(graph,file));
}));
function png(w,h,color) {
  function chunk(name,data){const buf=Buffer.concat([Buffer.from(name),data]);let crc=-1;for(const x of buf){crc^=x;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}const len=Buffer.alloc(4),end=Buffer.alloc(4);len.writeUInt32BE(data.length);end.writeUInt32BE((crc^-1)>>>0);return Buffer.concat([len,buf,end])}
  const hdr=Buffer.alloc(13);hdr.writeUInt32BE(w);hdr.writeUInt32BE(h,4);hdr[8]=8;hdr[9]=2;
  const row=Buffer.alloc(1+3*w,color);row[0]=0;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',hdr),chunk('IDAT',deflateSync(Buffer.concat(Array(h).fill(row)))),chunk('IEND',Buffer.alloc(0))]);
}
test('normal verify entry point with synthetic captures; reject shipped evidence and stale revision',()=>temp(d=>{
  const run=(...a)=>cli(a[0],d,...a.slice(1));const ok=r=>assert.equal(r.status,0,r.stderr);
  const write=(f,v)=>fs.writeFileSync(path.join(d,f),typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v));
  ok(run('init','--profile','web3d'));ok(spawnSync(process.execPath,['--test'],{cwd:d,encoding:'utf8'}));fs.mkdirSync(path.join(d,'evidence'));
  const p=JSON.parse(fs.readFileSync(path.join(d,'gamekit.json')));
  p.modules.push({id:'render',kind:'render',owner:'tests',file:'game/render.mjs',deps:[]});write('gamekit.json',p);write('game/render.mjs','export const synthetic=true;');
  const git=(...a)=>spawnSync('git',['-C',d,...a],{encoding:'utf8'});
  ok(git('init','-q'));ok(git('add','.'));ok(git('-c','user.name=Test','-c','user.email=test@localhost','commit','-qm','fixture'));
  const c=profile(),e=observations(c);
  Object.assign(e,{schemaVersion:1,project:p.name,build:{exitCode:0,log:'evidence/build.log',revision:git('rev-parse','HEAD').stdout.trim()},render:{realGpu:true,errors:0},visualReview:{status:'approved',reviewer:'synthetic fixture',notes:'format test only'}});
  write('evidence/build.log','synthetic');write('evidence/geo.json',{generatedBy:'character-lab',vertices:3000,distinctMaterials:3,invalidVertices:0,invalidBoneWeights:0,invalidTransforms:0,bodyPrimitiveBoxes:0});
  for(const t of c.targets)for(const [i,key] of c.shots.entries()){const f='evidence/'+t.id+'-'+key+'.png';write(f,png(t.width,t.height,i*40));e.targets[t.id].screenshots[key]=f}
  write('evidence/release.json',e);
  const verify=()=>run('verify','--evidence','evidence/release.json');
  ok(verify());e.build.revision='stale';write('evidence/release.json',e);assert.notEqual(verify().status,0);
  fs.mkdirSync(path.join(d,'dist'));write('dist/screenshot.png',png(4,4,20));assert.notEqual(run('check').status,0);
}));

test('requested surface checks use two captured project views on each target',()=>{
 const c=profile(),e=observations(c);c.character.surfaceChecks=['glasses-gaze'];
 assert.throws(()=>validateObservations(c,e));
 for(const t of c.targets)e.targets[t.id].surfaces={'glasses-gaze':{passed:true,views:['gameplay','side'],notes:'synthetic format fixture'}};
 validateObservations(c,e);
 e.targets.phone.surfaces['glasses-gaze'].views=['gameplay','gameplay'];
 assert.throws(()=>validateObservations(c,e));
});
