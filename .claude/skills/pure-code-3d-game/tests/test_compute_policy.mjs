import test from 'node:test';import assert from 'node:assert/strict';import {chooseBackend,decideIdle,decideCleanup} from '../tools/compute-policy.mjs';
function checks(){
 const p={id:"colab-t4",available:true,probed:true,authorized:true,external:true,paid:true,unitsPerMinute:.1,lifecycleVerified:true,cleanupAvailable:true,namedOwnership:true,oneShotSupported:true,capabilities:["cpu","cuda"],startupSeconds:60,transferSeconds:10,executionSeconds:60,cleanupSeconds:10};
 const local={...p,id:"local",external:false,paid:false,costKnownZero:true,capabilities:["cpu"],startupSeconds:0,transferSeconds:0,executionSeconds:30,cleanupSeconds:0};
 const job={requires:["cpu"],externalDataAllowed:true,deadlineSeconds:300},policy={allowPaid:true,remainingUnits:1},gpu={...job,requires:["cuda"]};
 const idle={owned:true,sameInvocation:true,cleanupInFinally:true,nextBatchKnown:true,nextBatchPrepared:true,nextReadyUpperSeconds:30,restartBillableSeconds:90,remainingTaskSeconds:400,remainingUnits:1,unitsPerMinute:.1,cleanupReserveSeconds:15,nextBatchBillableSeconds:60};
 const rec={owner:"a",remoteId:"r1",accountScope:"s"},remote={id:"r1",accountScope:"s",exists:true};
 return [
 ["free CPU first",chooseBackend(job,[p,local],policy).selected?.id==="local"],
 ["GPU direct without watchdog or central lease",chooseBackend(gpu,[p],policy).selected?.mode==="one-shot"],
 ["CUDA not graphics",chooseBackend({...job,requires:["webgpu-hardware"]},[p],policy).action==="DEFER"],
 ["paid off by default",chooseBackend(gpu,[p],{}).action==="DEFER"],
 ["unknown rate",chooseBackend(gpu,[{...p,unitsPerMinute:null}],policy).action==="DEFER"],
 ["budget",chooseBackend(gpu,[p],{...policy,remainingUnits:.01}).action==="DEFER"],
 ["deadline",chooseBackend({...job,deadlineSeconds:1},[p,local],policy).action==="DEFER"],
 ["external authorization",chooseBackend({...gpu,externalDataAllowed:false},[p],policy).action==="DEFER"],
 ["cleanup",chooseBackend(gpu,[{...p,cleanupAvailable:false}],policy).action==="DEFER"],
 ["ownership",chooseBackend(gpu,[{...p,namedOwnership:false}],policy).action==="DEFER"],
 ["one shot",chooseBackend(gpu,[{...p,oneShotSupported:false}],policy).action==="DEFER"],
 ["unresolved runtime",chooseBackend(gpu,[p],{...policy,unresolvedRuntime:true}).action==="DEFER"],
 ["short prepared batch",decideIdle(idle).action==="KEEP_IN_BATCH"],
 ["long gap",decideIdle({...idle,nextReadyUpperSeconds:120}).action==="RELEASE"],
 ["no next batch",decideIdle({...idle,nextBatchKnown:false}).action==="RELEASE"],
 ["unprepared",decideIdle({...idle,nextBatchPrepared:false}).action==="RELEASE"],
 ["model reasoning",decideIdle({...idle,returningToModel:true}).action==="RELEASE"],
 ["tool boundary",decideIdle({...idle,crossToolBoundary:true}).action==="RELEASE"],
 ["different invocation",decideIdle({...idle,sameInvocation:false}).action==="RELEASE"],
 ["user wait",decideIdle({...idle,waitingForUser:true}).action==="RELEASE"],
 ["done",decideIdle({...idle,taskDone:true}).action==="RELEASE"],
 ["missing finally",decideIdle({...idle,cleanupInFinally:false}).action==="RELEASE"],
 ["deadline reserve",decideIdle({...idle,remainingTaskSeconds:80}).action==="RELEASE"],
 ["idle cap",decideIdle({...idle,idleCapSeconds:15}).action==="RELEASE"],
 ["budget reserve",decideIdle({...idle,remainingUnits:.1}).action==="RELEASE"],
 ["owner stops",decideCleanup({record:rec,remote,callerOwner:"a"}).action==="STOP_EXACT_ID"],
 ["other owner protected",decideCleanup({record:rec,remote,callerOwner:"b"}).action==="DO_NOT_TOUCH"],
 ["wrong identity",decideCleanup({record:rec,remote:{...remote,id:"r2"},callerOwner:"a"}).action==="RECONCILE"],
 ["confirmed absent",decideCleanup({record:rec,remote:{...remote,exists:false},callerOwner:"a"}).action==="CLOSED"]
 ];
}
for(const [name,result] of checks())test(name,()=>assert.equal(result,true));
