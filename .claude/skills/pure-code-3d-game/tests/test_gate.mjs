import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
const tool = new URL('../tools/gamekit.mjs', import.meta.url).pathname;
function call(args){return spawnSync(process.execPath,[tool,...args],{encoding:'utf8'})}
function withProject(fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gamekit-gate-'));try{assert.equal(call(['init',dir,'--profile','web3d']).status,0);return fn(dir)}finally{fs.rmSync(dir,{recursive:true,force:true})}}
test('starter valid and release gate cannot silently pass without renderer',()=>withProject(d=>{assert.equal(call(['check',d]).status,0);assert.notEqual(call(['verify',d,'--evidence','missing.json']).status,0)}));
test('module cycle is rejected',()=>withProject(d=>{const file=path.join(d,'gamekit.json');const x=JSON.parse(fs.readFileSync(file));x.modules[0].deps=['gameplay'];fs.writeFileSync(file,JSON.stringify(x));assert.notEqual(call(['check',d]).status,0)}));
test('task requires changed files and forbids unrelated core mutation',()=>withProject(d=>{const task=path.join(d,'tasks/example-character.json');let r=call(['check',d,'--task','tasks/example-character.json']);assert.notEqual(r.status,0);r=call(['check',d,'--task','tasks/example-character.json','--changed','game/runtime.mjs']);assert.notEqual(r.status,0);r=call(['check',d,'--task','tasks/example-character.json','--changed','game/actor.mjs']);assert.equal(r.status,0,r.stderr)}));
test('code-only rejects binary models or textures',()=>withProject(d=>{fs.mkdirSync(path.join(d,'assets'));fs.writeFileSync(path.join(d,'assets/hero.glb'),'fake');assert.notEqual(call(['check',d]).status,0)}));
test('character body block-geometry shortcut rejected',()=>withProject(d=>{fs.appendFileSync(path.join(d,'game/actor.mjs'),'\nconst bad=BoxGeometry(1);\n');assert.notEqual(call(['check',d]).status,0)}));
test('v4.2 character body capsule-assembly shortcut rejected',()=>withProject(d=>{fs.appendFileSync(path.join(d,'game/actor.mjs'),'\nconst bad=CapsuleGeometry(0.1,0.5);\n');assert.notEqual(call(['check',d]).status,0)}));
test('unknown module dependency fails',()=>withProject(d=>{const file=path.join(d,'gamekit.json');const x=JSON.parse(fs.readFileSync(file));x.modules[1].deps=['unknown'];fs.writeFileSync(file,JSON.stringify(x));assert.notEqual(call(['check',d]).status,0)}));
test('path traversal via module file fails',()=>withProject(d=>{const file=path.join(d,'gamekit.json');const x=JSON.parse(fs.readFileSync(file));x.modules[1].file='../escape.mjs';fs.writeFileSync(file,JSON.stringify(x));assert.notEqual(call(['check',d]).status,0)}));
