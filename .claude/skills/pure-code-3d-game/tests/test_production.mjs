import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {plan,draftContract,verifyProduction} from '../tools/production.mjs';
const fixture=name=>JSON.parse(fs.readFileSync(new URL('../examples/general-'+name+'.json',import.meta.url)));
const tool=fileURLToPath(new URL('../tools/gamekit.mjs',import.meta.url));
const exec=(exe,args,cwd)=>spawnSync(exe,args,{cwd,encoding:'utf8'});
const ok=r=>assert.equal(r.status,0,r.stderr);
function temp(fn){const root=fs.mkdtempSync(path.join(os.tmpdir(),'kit4-'));try{return fn(root)}finally{fs.rmSync(root,{recursive:true,force:true})}}
test('template requires real project choices',()=>assert.throws(()=>plan(draftContract())));
test('turn-based 2D project requires only its actual inputs, view and features',()=>{
 const c=fixture('puzzle'),rows=plan(c).map(r=>r.key);
 assert.ok(rows.includes('desktop/save-migration') && rows.includes('desktop/input/keyboard') && rows.includes('desktop/project/undo-chain'));
 assert.ok(!rows.some(k=>/wardrobe|gpu|touch|shadow|disconnect/.test(k)));
 assert.equal(plan(c,'prototype').length,1);
});
test('one project can have multiple perspectives; each requires evidence',()=>{
 const c=fixture('exploration'),keys=plan(c,'slice').map(r=>r.key);
 for(const k of ['pc/view/follow','pc/view/inspect','pc/input/gamepad','pc/project/camera-transition'])assert.ok(keys.includes(k));
});
test('features can be scoped to particular builds',()=>{
 const c=fixture('puzzle');c.targets.push({...c.targets[0],id:'kiosk',features:[]});const keys=plan(c).map(r=>r.key);
 assert.ok(keys.includes('desktop/save-resume'));assert.ok(!keys.includes('kiosk/save-resume'));
 c.targets[0].features=[];assert.throws(()=>plan(c),/Unassigned/);
});
test('evidence matches artifacts, targets, stage and budgets through the normal CLI',()=>temp(d=>{
 const call=(...args)=>exec(process.execPath,[tool,args[0],d,...args.slice(1)]);
 ok(call('init'));assert.equal(fs.existsSync(path.join(d,'game','actor.mjs')),false);
 assert.notEqual(call('check').status,0);
 const c=fixture('puzzle');fs.writeFileSync(path.join(d,'gamekit.json'),JSON.stringify(c));
 const local=cmd=>exec(process.execPath,[path.join(d,'tools/gamekit.mjs'),cmd,d]);
 ok(local('plan'));ok(local('check'));assert.notEqual(call('init').status,0);
 for(const args of [['init','-q'],['add','.'],['-c','user.name=Fixture','-c','user.email=test@localhost','commit','-qm','Fixture']])ok(exec('git',args,d));
 const rev=exec('git',['rev-parse','HEAD'],d).stdout.trim();
 fs.mkdirSync(path.join(d,'evidence'));const text='Synthetic test fixture only';
 const proof={path:'evidence/run.log',sha256:createHash('sha256').update(text).digest('hex')};fs.writeFileSync(path.join(d,proof.path),text);
 const e={project:c.name,revision:rev,stage:'release',build:{exitCode:0,artifactId:'fixture-artifact',proof},measurements:{desktop:{platform:c.targets[0].platform,device:c.targets[0].device,proof,metrics:{'action-feedback':{unit:'ms',value:60}}}},cases:{}};
 for(const row of plan(c))e.cases[row.key]={status:'pass',observed:'synthetic observed result',proof};
 const verify=()=>{fs.writeFileSync(path.join(d,'evidence/release.json'),JSON.stringify(e));return call('verify','--evidence','evidence/release.json')};
 ok(verify());e.measurements.desktop.metrics['action-feedback'].value=101;assert.notEqual(verify().status,0);
 e.measurements.desktop.metrics['action-feedback'].value=60;e.stage='prototype';assert.notEqual(verify().status,0);
 e.stage='release';fs.appendFileSync(path.join(d,proof.path),'changed');assert.notEqual(verify().status,0);
}));
test('new version preserves existing schema-1 adapter and avoids overwriting user files',()=>temp(d=>{
 fs.writeFileSync(path.join(d,'package.json'),'original');
 const res=exec(process.execPath,[tool,'init',d,'--profile','web3d']);
 assert.notEqual(res.status,0);assert.equal(fs.readFileSync(path.join(d,'package.json'),'utf8'),'original');
 assert.equal(fs.existsSync(path.join(d,'gamekit.json')),false);
}));

test('visual details are assigned to particular views',()=>{
 const rows=plan(fixture('exploration'),'slice').map(r=>r.key);
 assert.ok(rows.includes('pc/view/follow/garment-motion'));
 assert.ok(rows.includes('pc/view/inspect/material-response'));
 assert.ok(!rows.includes('pc/view/inspect/garment-motion'));
});
