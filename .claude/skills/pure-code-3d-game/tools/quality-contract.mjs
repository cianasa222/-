// Project thresholds are authored before tuning. Observations come from the game or capture harness.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';

const positive = x => Number.isFinite(x) && x > 0;
const nonneg = x => Number.isFinite(x) && x >= 0;
const integer = x => Number.isSafeInteger(x) && x > 0;
const ids = arr => Array.isArray(arr) && arr.length > 0 && arr.every(x=>typeof x==='string' && /^[a-zA-Z][\w-]*$/.test(x)) && new Set(arr).size===arr.length;
const profiles = ['collision','character','fx'];
export function validateContract(c,p) {
  assert(c?.schema===1 && Array.isArray(c.targets) && ids(c.targets.map(t=>t.id)), 'Declare unique release targets');
  assert(ids(c.shots), 'Declare unique acceptance views');
  const promised = [p.renderer.primary,p.renderer.fallback].filter(x=>['webgpu','webgl2'].includes(x));
  for (const backend of promised) assert(c.targets.some(t=>t.backend===backend), 'Missing promised backend '+backend);
  for (const t of c.targets) {
    assert(['webgpu','webgl2'].includes(t.backend) && integer(t.width) && integer(t.height) && positive(t.maxFrameP95Ms) && integer(t.minSampleFrames), 'Invalid render target');
    assert(typeof t.device==='string' && t.device.trim().length, 'Missing target device');
  }
  if (c.lighting !== undefined) {
    assert(typeof c.lighting?.enabled==='boolean','Declare lighting decision');
    if(c.lighting.enabled) {
      assert(c.lighting.method==='directional-depth-pcf','Use documented directional depth path or extend the contract for the chosen method');
      for(const t of c.targets) {
        const b=t.shadowBudget;
        assert(b && integer(b.maxMapSize) && positive(b.maxWorldTexelM) && nonneg(b.maxEdgeDriftPx) &&
          nonneg(b.maxContactGapM) && nonneg(b.maxDeltaFrameP95Ms),'Missing target shadow budget');
      }
    } else assert(typeof c.lighting.reason==='string' && c.lighting.reason.trim(),'Explain alternate lighting path');
  }
  for (const name of profiles) {
    const group=c[name];
    assert(group && typeof group.enabled==='boolean', 'Missing feature decision '+name);
    if(!group.enabled) assert(typeof group.reason==='string' && group.reason.trim(), 'Give reason to omit '+name);
  }
  if (p.modules.some(m=>m.kind==='character')) assert(c.character.enabled,'Character module needs character acceptance');
  if(c.collision.enabled) {
    const k=c.collision;
    assert(['capsule','box','sphere'].includes(k.shape),'Choose a supported proxy');
    if(k.shape==='capsule') assert(positive(k.radiusM) && positive(k.heightM) && k.heightM>=2*k.radiusM,'Invalid upright capsule dimensions');
    if(k.shape==='sphere') assert(positive(k.radiusM),'Invalid sphere radius');
    if(k.shape==='box') assert(Array.isArray(k.halfExtentsM) && k.halfExtentsM.length===3 && k.halfExtentsM.every(positive),'Invalid box half extents');
    const size=k.shape==='box'?Math.min(...k.halfExtentsM):k.radiusM;
    assert(positive(k.skinM) && k.skinM<size && nonneg(k.maxPenetrationM) && k.maxPenetrationM<size,'Invalid contact tolerances');
    assert(positive(k.fastestSpeedMps) && positive(k.thinnestBarrierM),'Set worst relative speed and barrier thickness');
    const stepTravel=k.fastestSpeedMps/p.fixedHz;
    assert(['sweep','substep','discrete'].includes(k.fastMotion),'Select fast motion policy');
    if(k.fastMotion!=='sweep') {
      const n=k.fastMotion==='substep'?k.substeps:1;
      assert(integer(n) && stepTravel/n < k.thinnestBarrierM,'Step too long for declared barrier; sweep or reduce it');
    }
  }
  if(c.character.enabled) {
    const a=c.character;
    assert(positive(a.heightM) && nonneg(a.heightToleranceM) && positive(a.maxFootErrorM) && integer(a.minGameHeightPx),'Invalid character tolerances');
    assert(ids(a.materialRegions) && ids(a.views) && a.views.every(v=>c.shots.includes(v)), 'Declare material regions and subject views');
  }
  if (c.character.surfaceChecks !== undefined) {
    const checks=c.character.surfaceChecks;
    const supported=['garment-motion','fabric-turn','skin-backlight','glasses-gaze','hair-lod'];
    assert(c.character.enabled && ids(checks) && checks.every(id=>supported.includes(id)), 'Invalid character surface checks');
  }
  if(c.fx.enabled) {
    const f=c.fx;
    assert(ids(f.events) && integer(f.peakEmitters) && integer(f.particleCap) && nonneg(f.maxDeltaFrameP95Ms),'Invalid FX budget');
  }
}

export function validateObservations(c,e) {
  if(c.collision.enabled) {
    const a=e.collision;
    for (const kind of ['thinWall','glancingSlide','slopeBoundary','restingContact','spawnOverlap','layerFilter']) {
      const run=a?.[kind];
      assert(run?.passed===true && integer(run.ticks) && nonneg(run.maxPenetrationM) && run.maxPenetrationM<=c.collision.maxPenetrationM, 'Collision probe failed '+kind);
    }
    assert(positive(a.thinWall.relativeSpeedMps) && a.thinWall.relativeSpeedMps>=c.collision.fastestSpeedMps && positive(a.thinWall.barrierM) && a.thinWall.barrierM<=c.collision.thinnestBarrierM && a.thinWall.missedHits===0,'Thin wall stress missing');
  }
  if(c.character.enabled) {
    const a=e.character;
    assert(positive(a.heightM) && Math.abs(a.heightM-c.character.heightM)<=c.character.heightToleranceM,'Measured character height drift');
    assert(nonneg(a.maxPlantedFootErrorM) && a.maxPlantedFootErrorM<=c.character.maxFootErrorM,'Planted foot slip/penetration');
    assert(c.character.materialRegions.every(x=>a.visibleMaterialRegions?.includes(x)),'Missing material separation');
  }
  for(const target of c.targets) {
    const t=e.targets?.[target.id];
    assert(t?.realGpu===true && t.device===target.device && t.backend===target.backend && t.width===target.width && t.height===target.height && t.errors===0,'Missing target evidence '+target.id);
    assert(integer(t.sampleFrames) && t.sampleFrames>=target.minSampleFrames && positive(t.frameP95Ms) && t.frameP95Ms<=target.maxFrameP95Ms,'Frame budget failed '+target.id);
    if(c.lighting?.enabled) {
      const b=target.shadowBudget, l=t.lighting;
      assert(l && integer(l.mapSize) && l.mapSize<=b.maxMapSize && positive(l.coverageWidthM) &&
        l.coverageWidthM/l.mapSize<=b.maxWorldTexelM,'Shadow footprint exceeds budget');
      assert(nonneg(l.edgeDriftPx) && l.edgeDriftPx<=b.maxEdgeDriftPx && nonneg(l.contactGapM) &&
        l.contactGapM<=b.maxContactGapM,'Shadow edge drift or detached contact');
      assert(l.shadowDetailReviewed===true && l.highlightDetailReviewed===true,'Review highlight and shadow detail');
      assert(integer(l.pairedFrames) && l.pairedFrames>=target.minSampleFrames && positive(l.onFrameP95Ms) &&
        positive(l.offFrameP95Ms) && l.onFrameP95Ms<=target.maxFrameP95Ms &&
        l.onFrameP95Ms-l.offFrameP95Ms<=b.maxDeltaFrameP95Ms,'Shadow timing budget failed');
    }
    if(c.character.enabled) assert(integer(t.gameHeightPx) && t.gameHeightPx>=c.character.minGameHeightPx, 'Subject too small in gameplay view');
    for (const name of c.character.surfaceChecks ?? []) {
      const review=t.surfaces?.[name];
      assert(review?.passed===true && typeof review.notes==='string' && review.notes.trim().length>0 &&
        Array.isArray(review.views) && new Set(review.views).size>=2 &&
        review.views.every(v=>c.shots.includes(v)), 'Missing posed surface review '+target.id+'/'+name);
    }
    if(c.fx.enabled) {
      const f=t.fx, budget=c.fx;
      assert(f && integer(f.concurrentEmitters) && f.concurrentEmitters>=budget.peakEmitters && Number.isSafeInteger(f.peakParticles) && nonneg(f.peakParticles) && f.peakParticles<=budget.particleCap,'Missing peak FX load or pool overflow');
      assert(positive(f.onFrameP95Ms) && positive(f.offFrameP95Ms) && f.onFrameP95Ms<=target.maxFrameP95Ms && f.onFrameP95Ms-f.offFrameP95Ms<=budget.maxDeltaFrameP95Ms,'Paired FX frame cost exceeds budget');
      assert(f.warningsReadable===true && f.gameplayHashHigh===f.gameplayHashLow && /^[a-f0-9]{64}$/.test(f.gameplayHashLow),'FX obscures warnings or changes simulation');
      assert(budget.events.every(x=>f.observedEvents?.includes(x)), 'Effect event not exercised');
    }
  }
}

// A stage key includes its toolchain and the transitive keys of upstream stages.
// For analysis only. The runner must also check saved outputs before skipping work.
export function stageKeys(graph,resolveFile) {
  assert(Array.isArray(graph) && ids(graph.map(s=>s.id)), 'Invalid stages');
  const stages=new Map(graph.map(s=>[s.id,s])), done=new Map(), busy=new Set();
  function visit(id) {
    if(done.has(id)) return done.get(id);
    assert(stages.has(id) && !busy.has(id),'Missing/cyclic stage '+id);
    busy.add(id);
    const s=stages.get(id);
    assert(Array.isArray(s.files) && s.files.length && Array.isArray(s.deps) && typeof s.toolchain==='string' && s.toolchain.trim(),'Incomplete inputs '+id);
    const h=createHash('sha256');
    const inputs=[...new Set(s.files)].sort().map(file=>[file,createHash('sha256').update(fs.readFileSync(resolveFile(file))).digest('hex')]);
    h.update(JSON.stringify([1,id,s.toolchain,inputs,[...new Set(s.deps)].sort().map(d=>[d,visit(d)])]));
    const val=h.digest('hex');done.set(id,val);busy.delete(id);return val;
  }
  for(const id of stages.keys())visit(id);
  return Object.fromEntries(done);
}
