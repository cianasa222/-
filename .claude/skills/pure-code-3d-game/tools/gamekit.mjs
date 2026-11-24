#!/usr/bin/env node
/** GameKit v3: zero-dependency architecture and evidence gates. Node >= 20.
 * Tools are advisory until the project's CI runs them. Human visual sign-off cannot be automated.
 */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { validateContract, validateObservations, stageKeys } from './quality-contract.mjs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const [command = 'help', rootArg = '.', ...options] = process.argv.slice(2);
const root = path.resolve(rootArg);
const error = (message) => { throw new Error(message); };
const exists = (f) => fs.existsSync(f);
const readJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const assert = (test, message) => { if (!test) error(message); };
const normalize = (s) => s.replaceAll('\\', '/');
function inside(rel) {
  assert(typeof rel === 'string' && rel.length > 0, 'Path must be a nonempty string');
  assert(!path.isAbsolute(rel) && !rel.includes('\\') && !rel.split('/').includes('..'), `Path escape: ${rel}`);
  const full = path.resolve(root, rel);
  assert(full.startsWith(root + path.sep), `Path outside project: ${rel}`);
  if (exists(full)) assert(fs.realpathSync(full).startsWith(fs.realpathSync(root) + path.sep), `Symlink escapes project: ${rel}`);
  return full;
}
function glob(pattern) {
  assert(typeof pattern === 'string' && !pattern.includes('..') && !pattern.startsWith('/'), `Invalid glob: ${pattern}`);
  return new RegExp('^' + pattern.split('**').map(p => p.split('*').map(s => s.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')).join('[^/]*')).join('.*') + '$');
}
function sortedModules(project) {
  const mods = project.modules;
  assert(Array.isArray(mods) && mods.length > 0, 'modules must be a nonempty array');
  const map = new Map();
  for (const m of mods) {
    assert(m && /^[a-z][a-z0-9-]*$/.test(m.id), 'Invalid module id');
    assert(!map.has(m.id), `Duplicate module: ${m.id}`);
    assert(typeof m.owner === 'string' && m.owner.length, `Missing owner for ${m.id}`);
    assert(Array.isArray(m.deps), `Missing deps for ${m.id}`);
    assert(m.file.endsWith('.mjs'), `Only explicit .mjs modules supported: ${m.id}`);
    assert(exists(inside(m.file)), `Missing module file: ${m.file}`);
    map.set(m.id, m);
  }
  const ordered = [], visiting = new Set(), visited = new Set();
  function visit(id) {
    assert(map.has(id), `Unknown dependency ${id}`);
    if (visited.has(id)) return;
    assert(!visiting.has(id), `Circular module dependency at ${id}`);
    visiting.add(id);
    for (const d of map.get(id).deps) visit(d);
    visiting.delete(id); visited.add(id); ordered.push(map.get(id));
  }
  mods.forEach(m => visit(m.id));
  return ordered;
}
function validateConfig() {
  const f = path.join(root, 'gamekit.json');
  assert(exists(f), 'Missing gamekit.json: run init');
  const p = readJSON(f);
  assert(p.schemaVersion === 1, 'Unsupported schemaVersion');
  assert(['code-only', 'hybrid'].includes(p.assetMode), 'assetMode must be code-only or hybrid');
  assert(p.units === 'meter' && p.axes === 'right-handed-y-up', 'World units/axes mismatch');
  assert([30, 60, 90, 120].includes(p.fixedHz), 'fixedHz must be an approved project timestep');
  assert(['webgpu', 'webgl2', 'three', 'babylon'].includes(p.renderer?.primary), 'Unapproved renderer');
  assert(['webgl2', 'none'].includes(p.renderer?.fallback), 'Unapproved renderer fallback');
  assert(typeof p.renderer.owner === 'string' && p.renderer.owner, 'Missing single renderer owner');
  assert(p.quality && p.quality.characterPlaceholderFinal === false, 'Final placeholder characters prohibited');
  const mods = sortedModules(p);
  const pkgFile = path.join(root, 'package.json');
  if (p.assetMode === 'code-only' && exists(pkgFile)) {
    const pkg = readJSON(pkgFile);
    const approved = p.renderer.packages ?? {};
    assert(Object.entries(pkg.dependencies || {}).every(([name, version]) => Object.hasOwn(approved,name) && approved[name] === version && /^\d+\.\d+\.\d+$/.test(version)), 'Unexpected runtime dependencies in code-only mode');
  }
  if (p.assetMode === 'code-only') {
    const banned = /\.(?:png|jpe?g|webp|gif|glb|gltf|fbx|obj|ogg|mp3|wav|mp4|woff2?)$/i;
    function scan(dir) {
      for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        if (item.name === 'node_modules' || item.name === '.git') continue;
        if (dir === root && item.name === 'evidence' && item.isDirectory()) continue;
        const file = path.join(dir, item.name);
        if (item.isDirectory()) scan(file);
        else assert(!banned.test(file), `Binary asset violates code-only mode: ${path.relative(root, file)}`);
      }
    }
    scan(root);
  }
  for (const m of mods) {
    const c = fs.readFileSync(inside(m.file), 'utf8');
    assert(!/(?:from\s*|import\s*\(|new URL\s*\()\s*['"][^'"]*\bevidence\//.test(c), 'Runtime module references evidence: '+m.file);
    const syntax = spawnSync(process.execPath, ['--check', inside(m.file)], { encoding: 'utf8' });
    assert(syntax.status === 0, `Syntax failed: ${m.file}: ${syntax.stderr}`);
    if (m.kind === 'character') {
      assert(!/\b(?:makeBoxBody|cubePerson|placeholderHumanoid)\s*\(/.test(c), 'Final placeholder prohibited: '+m.file);
      const declared = ['stylized','hard-surface'].includes(m.characterGeometry) && typeof m.geometryRationale === 'string' && m.geometryRationale.trim().length >= 12;
      if (!declared) assert(!/\b(?:BoxGeometry|CapsuleGeometry)\s*\(/.test(c), 'Unapproved primitive body in '+m.file);
    }
  }
  if (exists(inside('quality-contract.json'))) validateContract(readJSON(inside('quality-contract.json')),p);
  return { p, mods };
}
function checkTask() {
  const index = options.indexOf('--task');
  if (index === -1) return null;
  assert(options[index + 1], 'Missing task file after --task');
  const task = readJSON(inside(options[index + 1]));
  assert(task.id && Array.isArray(task.allowedPaths) && task.allowedPaths.length, 'Bad task contract');
  assert(task.baseRevision && typeof task.baseRevision === 'string', 'Task must lock a baseline revision');
  const approved = task.allowedPaths.map(glob), denied = (task.forbiddenPaths || []).map(glob);
  const filesIndex = options.indexOf('--changed');
  let changed;
  if (filesIndex !== -1) changed = options.slice(filesIndex + 1).filter(x => !x.startsWith('--'));
  else {
    const paths = args => {
      const result=spawnSync('git',['-C',root,...args],{encoding:'utf8'});
      assert(result.status===0,'Cannot determine Git scope: '+result.stderr);
      return result.stdout.split('\0').filter(Boolean);
    };
    changed=[...new Set([
      ...paths(['diff','--no-renames','--name-only','-z',task.baseRevision+'...HEAD']),
      ...paths(['diff','--no-renames','--name-only','-z','HEAD']),
      ...paths(['ls-files','-z','--others','--exclude-standard'])
    ])];
  }
  assert(changed.length > 0, 'No changed-files evidence; task gate does not silently pass');
  for (const rel of changed) {
    inside(normalize(rel));
    assert(approved.some(re => re.test(normalize(rel))), `Out-of-scope file: ${rel}`);
    assert(!denied.some(re => re.test(normalize(rel))), `Forbidden file: ${rel}`);
  }
  return { id: task.id, changed };
}
function pngInfo(file) {
  const b = fs.readFileSync(inside(file));
  assert(b.length >= 24 && b.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')), `Invalid PNG: ${file}`);
  assert(b.toString('ascii', 12, 16) === 'IHDR', `Missing PNG IHDR: ${file}`);
  const width=b.readUInt32BE(16), height=b.readUInt32BE(20);
  assert(width>0 && height>0 && width*height<=24000000 && b[24]===8 && [2,6].includes(b[25]) && b[28]===0,'Use non-interlaced 8-bit RGB/RGBA captures');
  const chunks=[]; let ended=false;
  for(let off=8;off+12<=b.length;) {
    const size=b.readUInt32BE(off), tag=b.toString('ascii',off+4,off+8);
    assert(off+12+size<=b.length,'Truncated PNG');
    if(tag==='IDAT') chunks.push(b.subarray(off+8,off+8+size));
    off+=12+size;
    if(tag==='IEND'){ ended=size===0 && off===b.length; break; }
  }
  const bytes=height*(1+width*(b[25]===2?3:4));
  assert(ended && chunks.length && inflateSync(Buffer.concat(chunks),{maxOutputLength:bytes}).length===bytes,'Incomplete screenshot pixels');
  return { width,height,hash:createHash('sha256').update(b).digest('hex') };
}
function verifyEvidence(p) {
  const i = options.indexOf('--evidence');
  assert(i !== -1 && options[i + 1], 'Release requires --evidence <file>');
  assert(p.modules.some(m => m.kind === 'render'), 'Release requires a real renderer module (headless starter is not release-ready)');
  const e = readJSON(inside(options[i + 1]));
  assert(e.project === p.name && e.schemaVersion === 1, 'Evidence for wrong project/schema');
  assert(e.build?.exitCode === 0 && exists(inside(e.build.log)), 'Build evidence absent');
  const contract = readJSON(inside('quality-contract.json'));
  validateContract(contract,p);
  const rev=spawnSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'});
  assert(rev.status===0 && e.build.revision===rev.stdout.trim(), 'Build evidence needs current Git revision');
  assert(e.render?.errors === 0 && e.render?.realGpu === true, 'Real render required');
  validateObservations(contract,e);
  for(const t of contract.targets) {
    const hashes=new Set();
    for(const view of contract.shots) {
      const shot=e.targets[t.id].screenshots?.[view];
      assert(typeof shot==='string' && shot.startsWith('evidence/'), 'Missing capture '+t.id+'/'+view);
      const info=pngInfo(shot);
      assert(info.width===t.width && info.height===t.height, 'Wrong target capture dimensions');
      assert(!hashes.has(info.hash),'Duplicate capture for different views');
      hashes.add(info.hash);
    }
  }
  if(contract.character.enabled) {
    const g=readJSON(inside(e.character.geometryStats));
    assert(g.generatedBy==='character-lab' && Number.isSafeInteger(g.vertices) && g.vertices>0 && g.distinctMaterials>=contract.character.materialRegions.length, 'Missing character lab evidence');
    assert(g.invalidVertices===0 && g.invalidBoneWeights===0 && g.invalidTransforms===0 && g.bodyPrimitiveBoxes===0 && e.motion?.constraintFailures===0,'Character geometry or motion failed');
  }
  assert(e.visualReview?.status === 'approved' && e.visualReview?.reviewer && e.visualReview?.notes, 'Requires explicit human visual review');
  return { targets: contract.targets.map(t=>t.id), views: contract.shots, review: e.visualReview.reviewer };
}
const TEMPLATE = {
  'gamekit.json': JSON.stringify({
    schemaVersion: 1, kitVersion: '4.0.0', name: 'procedural-demo', assetMode: 'code-only',
    axes: 'right-handed-y-up', units: 'meter', fixedHz: 60, renderer: { primary: 'webgpu', fallback: 'webgl2', owner: 'render-core' },
    modules: [
      { id: 'world', kind: 'world', owner: 'world-kit', file: 'game/world.mjs', deps: [] },
      { id: 'actor', kind: 'character', owner: 'character-kit', file: 'game/actor.mjs', deps: ['world'] },
      { id: 'gameplay', kind: 'gameplay', owner: 'gameplay-kit', file: 'game/gameplay.mjs', deps: ['world', 'actor'] },
    ],
    quality: { characterPlaceholderFinal: false, minCharacterVertices: 2000, minCharacterMaterials: 3, maxFrameP95Ms: 33.3 },
  }, null, 2) + '\n',
  'package.json': '{"type":"module","scripts":{"test":"node --test","check":"node tools/gamekit.mjs check ."}}\n',
  'game/world.mjs': `export const id='world'; export const deps=[]; export function create() { const height=(x,z)=>0.1*Math.sin(x*0.2)*Math.cos(z*0.1); return { init(){}, fixedUpdate(){}, render(){}, dispose(){}, snapshot(){return {height:height(1,1)}} , height }; }\n`,
  'game/actor.mjs': `// Physics entity only. VISUAL CHARACTER NOT IMPLEMENTED; release gate must fail until Character Lab is complete.\nexport const id='actor'; export const deps=['world']; export function create() { let x=0,z=0; return {init(){}, fixedUpdate(dt){x+=dt;z+=dt/2}, render(){}, dispose(){}, snapshot(){return {x,z}}, get position(){return [x,0,z]} };}\n`,
  'game/gameplay.mjs': `export const id='gameplay'; export const deps=['world','actor']; export function create() {let ticks=0; return {init(){},fixedUpdate(){ticks++},render(){},dispose(){},snapshot(){return {ticks}}};}\n`,
  'game/runtime.mjs': `// Fixed-step reference assembler. 3D renderer is deliberately NOT faked.\nexport async function makeGame(config, load) {\n const byId=new Map(); const order=[]; const active=new Set();\n const visit=(id)=>{if(byId.has(id))return;if(active.has(id))throw Error('Cycle '+id);active.add(id);const m=config.modules.find(x=>x.id===id);if(!m)throw Error('Missing '+id);m.deps.forEach(visit);active.delete(id);order.push(m);byId.set(id,true)};config.modules.forEach(m=>visit(m.id));\n const systems=new Map();for(const m of order){const lib=await load(m.file);if(lib.id!==m.id||JSON.stringify(lib.deps)!==JSON.stringify(m.deps))throw Error('Contract drift '+m.id);if(typeof lib.create!=='function')throw Error('Missing factory '+m.id);const obj=lib.create({get:id=>systems.get(id)});for(const k of ['init','fixedUpdate','render','dispose','snapshot'])if(typeof obj[k]!=='function')throw Error('Missing lifecycle '+m.id+':'+k);systems.set(m.id,obj)}\n for(const m of order)systems.get(m.id).init();let acc=0;const step=1/config.fixedHz;return {frame(dt,renderer){acc+=Math.min(0.1,Math.max(0,dt));let n=0;while(acc>=step&&n++<6){for(const m of order)systems.get(m.id).fixedUpdate(step);acc-=step}for(const m of order)systems.get(m.id).render(acc/step,renderer)},snapshot(){return Object.fromEntries(order.map(m=>[m.id,systems.get(m.id).snapshot()]))},dispose(){for(const m of order.slice().reverse())systems.get(m.id).dispose()}};\n}\n`,
  'test/assembler.test.mjs': `import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {makeGame} from '../game/runtime.mjs';\nconst config=JSON.parse(fs.readFileSync(new URL('../gamekit.json',import.meta.url)));const load=p=>import(new URL('../'+p,import.meta.url).href);\ntest('deterministic composable fixed-step runtime',async()=>{const run=async()=>{const g=await makeGame(config,load);for(let i=0;i<60;i++)g.frame(1/60,null);const s=g.snapshot();g.dispose();return s};const a=await run(),b=await run();assert.deepEqual(a,b);assert.equal(a.gameplay.ticks,60);});\n`,
  'tasks/example-character.json': JSON.stringify({ id: 'character-001', baseRevision: 'BASE_SHA_REQUIRED', allowedPaths: ['game/actor.mjs', 'character/**', 'lab/**'], forbiddenPaths: ['game/runtime.mjs', 'game/world.mjs'] }, null, 2) + '\n',
  'README.md': '# Procedural GameKit starter (NOT a finished 3D game)\n\nThis is a **headless compositional skeleton**. It deliberately does not claim to render WebGPU characters or satisfy the visual acceptance gate. Replace the actor with validated Character Lab output, implement a real renderer and collect GPU screenshots before release.\n\nRun `node --test` then `node tools/gamekit.mjs check .`. Use `verify . --evidence path/to/evidence.json` only after actual hardware/browser evidence is collected.\n',
};
function init() {
  assert(!exists(path.join(root, 'gamekit.json')), 'Target already initialized; refusing overwrite');
  const outputs=[...Object.keys(TEMPLATE),'quality-contract.json','tools/gamekit.mjs','tools/quality-example.json','tools/quality-contract.mjs','tools/production.mjs'];
  for(const name of outputs)assert(!exists(inside(name)),'Refusing to replace '+name);
  fs.mkdirSync(root, { recursive: true });
  for (const [rel, content] of Object.entries(TEMPLATE)) {
    const f = inside(rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content);
  }
  const tool = inside('tools/gamekit.mjs');
  fs.mkdirSync(path.dirname(tool), { recursive: true }); fs.copyFileSync(new URL(import.meta.url), tool);
  for(const name of ['quality-contract.mjs','quality-example.json','production.mjs']) {
    const output=inside('tools/'+name);
    if(name.endsWith('.json')) fs.copyFileSync(new URL('./'+name,import.meta.url),inside('quality-contract.json'));
    fs.copyFileSync(new URL('./'+name,import.meta.url),output);
  }
  console.log(`Initialized ${root}: contracts + headless assembly only; visual validation pending`);
}
// Legacy schema-1 projects continue through the Web3D adapter.
const flag = (name, fallback) => {
  const index=options.indexOf(name);
  if(index<0)return fallback;
  assert(options[index+1] && !options[index+1].startsWith('--'),'Missing value for '+name);
  return options[index+1];
};
function initGeneral(contract) {
  const destinations=['gamekit.json','tools/gamekit.mjs','tools/quality-contract.mjs','tools/production.mjs','tools/quality-example.json'];
  for(const name of destinations)assert(!exists(inside(name)),'Refusing to replace '+name);
  fs.mkdirSync(inside('tools'),{recursive:true});
  for(const name of destinations.slice(1))fs.copyFileSync(new URL('./'+path.basename(name),import.meta.url),inside(name));
  fs.writeFileSync(inside('gamekit.json'),JSON.stringify(contract,null,2)+'\n');
  console.log('Created project contract draft. Fill loop, runtime and targets, then run plan.');
}
try {
  if(command==='init'){
    const profile=flag('--profile','general');
    assert(profile==='general'||profile==='web3d','Unknown profile');
    if(profile==='general')initGeneral((await import('./production.mjs')).draftContract());
    else init();
  }
  else if(command==='keys') console.log(JSON.stringify(stageKeys(readJSON(inside(options[0] || 'stages.json')),inside),null,2));
  else if(['plan','check','verify'].includes(command) && readJSON(inside('gamekit.json')).schemaVersion===2){
    const {plan,verifyProduction}=await import('./production.mjs');
    const project=readJSON(inside('gamekit.json')), stage=flag('--stage','release');
    const rows=plan(project,stage);
    if(command==='plan')console.log(JSON.stringify(rows,null,2));
    else {
      const task=checkTask();
      if(command==='verify'){
        const file=flag('--evidence',null);assert(file,'Supply --evidence <file>');
        const rev=spawnSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'});
        assert(rev.status===0,'A Git revision is required to verify captured evidence');
        const result=verifyProduction(project,readJSON(inside(file)),stage,inside,rev.stdout.trim());
        console.log(JSON.stringify({gate:'production-evidence',...result,task},null,2));
      }else console.log(JSON.stringify({gate:'project-contract',planned:rows.length,task},null,2));
    }
  }
  else if (command === 'check' || command === 'verify') {
    const { p, mods } = validateConfig();
    const task = checkTask();
    const evidence = command === 'verify' ? verifyEvidence(p) : null;
    console.log(JSON.stringify({ status: 'PASS', gate: command === 'verify' ? 'release-evidence-checked' : 'architecture-only', modules: mods.map(m => m.id), task, evidence }, null, 2));
  } else if (command === 'help') console.log('node gamekit.mjs init <dir> [--profile general|web3d] | plan <dir> [--stage prototype|slice|release] | check <dir> [--task tasks/x.json --changed path...] | verify <dir> --evidence evidence.json');
  else error('Unknown command: ' + command);
} catch (e) { console.error('GAMEKIT GATE FAIL:', e.message); process.exitCode = 1; }
