// Cross-engine project scope and acceptance ledger. Node is only a development tool.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const stages=['prototype','slice','release'];
const present=x=>typeof x==='string' && x.trim().length>0;
const id=x=>present(x) && /^[a-z][a-z0-9-]*$/.test(x);
function unique(list,label) {
  assert(Array.isArray(list) && list.length && list.every(id) && new Set(list).size===list.length,'Declare distinct '+label);
}
const conditionalCases={
  saves:['save-resume','save-migration','interrupted-write'],
  settings:['settings-persist'],
  audio:['mix-and-mute'],
  network:['disconnect-reconnect','duplicate-action'],
  economy:['reward-once','progression-pacing'],
  procgen:['seed-replay','reachable-content'],
  streaming:['stream-boundary','memory-recovery'],
  narrative:['branch-return'],
  wardrobe:['pose-and-lod'],
  localization:['text-layout'],
  onlineService:['service-unavailable','compatible-release']
};
const essentials={
  prototype:['play-loop'],
  slice:['first-session','read-feedback','recover-or-retry','input-interruption'],
  release:['clean-install','accessible-cues','repeat-session','deliver-and-recover','asset-provenance']
};

export function draftContract(){
  return {
    schemaVersion:2,kitVersion:'4.0.0',workflow:'general',name:'',genre:'',assetMode:'code-only',
    coreLoop:{action:'',decision:'',feedback:'',continueOrFinish:''},
    runtime:{engine:'',buildCommand:'',timeModel:''},
    targets:[],features:[],extraChecks:[]
  };
}

export function plan(p,through='release'){
  assert(p.schemaVersion===2 && p.workflow==='general','Expected general schema 2');
  assert(stages.includes(through),'Unknown stage');
  for(const key of ['name','genre'])assert(present(p[key]),'Set '+key);
  assert(['code-only','hybrid'].includes(p.assetMode),'Set asset policy');
  for(const k of ['action','decision','feedback','continueOrFinish'])assert(present(p.coreLoop?.[k]),'Define loop '+k);
  for(const k of ['engine','buildCommand','timeModel'])assert(present(p.runtime?.[k]),'Set runtime '+k);
  assert(Array.isArray(p.targets),'Declare targets');
  unique(p.targets.map(t=>t.id),'target IDs');
  assert(Array.isArray(p.features) && new Set(p.features).size===p.features.length &&
    p.features.every(f=>Object.hasOwn(conditionalCases,f)),'Unknown/duplicate feature');
  assert(Array.isArray(p.extraChecks),'Declare extraChecks (empty is valid)');
  const rows=[];
  for(const t of p.targets){
    const targetFeatures=t.features ?? p.features;
    assert(Array.isArray(targetFeatures) && targetFeatures.every(f=>p.features.includes(f)) &&
      new Set(targetFeatures).size===targetFeatures.length, 'Invalid features for '+t.id);
    assert(present(t.platform) && present(t.device),'Describe target platform and device');
    unique(t.inputs,'input IDs');assert(Array.isArray(t.views),'Declare presentations');
    unique(t.views.map(v=>v.id),'presentation IDs');
    for(const v of t.views)assert(present(v.framing) && present(v.priority),'Set framing and visual priority for '+v.id);
    assert(Array.isArray(t.budgets),'Declare measurable budgets');unique(t.budgets.map(b=>b.id),'budget IDs');
    for(const b of t.budgets)assert(present(b.unit) && Number.isFinite(b.max) && b.max>0,'Budget needs unit and positive ceiling');
    const add=(stage,check)=>{
      const key=t.id+'/'+check;assert(!rows.some(r=>r.key===key),'Duplicate gate '+key);
      rows.push({key,target:t.id,stage,check});
    };
    for(const s of stages)for(const check of essentials[s])add(s,check);
    for(const input of t.inputs)add('slice','input/'+input);
    for(const view of t.views){
      add('slice','view/'+view.id);
      if(view.checks!==undefined){
        unique(view.checks,'view-specific check IDs');
        for(const test of view.checks)add('slice','view/'+view.id+'/'+test);
      }
    }
    for(const feature of targetFeatures)for(const check of conditionalCases[feature])add('release',check);
  }
  for(const f of p.features)assert(p.targets.some(t=>(t.features ?? p.features).includes(f)), 'Unassigned feature '+f);
  const registered=new Set(rows.map(r=>r.key));
  for(const extra of p.extraChecks){
    assert(id(extra.id) && stages.includes(extra.stage) && present(extra.expected),'Invalid extra check');
    unique(extra.targets,'extra-check targets');
    for(const target of extra.targets){
      const key=target+'/project/'+extra.id;
      assert(p.targets.some(t=>t.id===target) && !registered.has(key),'Unknown target or repeated check '+key);
      registered.add(key);rows.push({key,target,stage:extra.stage,check:extra.id,expected:extra.expected});
    }
  }
  return rows.filter(r=>stages.indexOf(r.stage)<=stages.indexOf(through));
}

export function verifyProduction(p,e,stage,inside,revision){
  const rows=plan(p,stage);
  assert(e?.project===p.name && e.revision===revision && e.stage===stage,'Evidence project, stage or revision differs');
  const seen=new Map();
  function proof(record){
    assert(record && present(record.path) && /^evidence\//.test(record.path) && /^[0-9a-f]{64}$/.test(record.sha256),'Missing evidence artifact/hash');
    if(!seen.has(record.path)){
      const file=inside(record.path);
      assert(fs.statSync(file).isFile() && fs.statSync(file).size>0,'Empty capture or log');
      seen.set(record.path,createHash('sha256').update(fs.readFileSync(file)).digest('hex'));
    }
    assert(record.sha256===seen.get(record.path),'Artifact hash differs: '+record.path);
  }
  for(const row of rows){
    const obs=e.cases?.[row.key];
    assert(obs?.status==='pass' && present(obs.observed),'Missing result '+row.key);
    proof(obs.proof);
  }
  if(stage==='release'){
    assert(e.build?.exitCode===0 && present(e.build.artifactId),'Missing build identity');proof(e.build.proof);
    for(const t of p.targets){
      const run=e.measurements?.[t.id];
      assert(run?.device===t.device && run.platform===t.platform,'Wrong device or platform '+t.id);proof(run.proof);
      for(const b of t.budgets){
        const obs=run.metrics?.[b.id];
        assert(obs?.unit===b.unit && Number.isFinite(obs.value) && obs.value>=0 && obs.value<=b.max,'Budget failed '+t.id+'/'+b.id);
      }
    }
  }
  return {stage,verifiedCases:rows.length,artifacts:seen.size};
}
