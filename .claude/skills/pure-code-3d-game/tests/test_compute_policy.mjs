import test from 'node:test';import assert from 'node:assert/strict';import {chooseBackend,decideIdle,decideCleanup} from '../tools/compute-policy.mjs';
function checks(){
 const p={id:"colab-t4",available:true,probed:true,authorized:true,external:true,paid:true,unitsPerMinute:.1,lifecycleVerified:true,cleanupAvailable:true,leaseAvailable:true,capabilities:["cpu","cuda"],startupSeconds:60,transferSeconds:10,executionSeconds:60,cleanupSeconds:10};
 const local={...p,id:"local",external:false,paid:false,costKnownZero:true,capabilities:["cpu"],startupSeconds:0,transferSeconds:0,executionSeconds:30,cleanupSeconds:0};
 const job={requires:["cpu"],externalDataAllowed:true,deadlineSeconds:300};const policy={allowPaid:true,remainingUnits:1};
 const idle={owned:true,watchdogActive:true,leaseValid:true,nextBatchKnown:true,nextReadyUpperSeconds:30,restartBillableSeconds:90,remainingLeaseSeconds:400,remainingUnits:1,unitsPerMinute:.1,cleanupReserveSeconds:15,nextBatchBillableSeconds:60};
 const rec={owner:"a",remoteId:"r1",accountScope:"s",expiresAtSeconds:100};const remote={id:"r1",accountScope:"s",exists:true};
 return [
 ["CPU prioritizes verified free local",chooseBackend(job,[p,local],policy).selected?.id==="local"],
 ["CUDA routes to verified GPU",chooseBackend({...job,requires:["cuda"]},[p,local],policy).selected?.id==="colab-t4"],
 ["CUDA not equal graphics",chooseBackend({...job,requires:["webgpu-hardware"]},[p,local],policy).action==="DEFER"],
 ["paid default off",chooseBackend({...job,requires:["cuda"]},[p],{}).action==="DEFER"],
 ["unknown rates blocked",chooseBackend({...job,requires:["cuda"]},[{...p,unitsPerMinute:null}],policy).action==="DEFER"],
 ["budget enforced",chooseBackend({...job,requires:["cuda"]},[p],{...policy,remainingUnits:.01}).action==="DEFER"],
 ["deadline enforced",chooseBackend({...job,deadlineSeconds:1},[p,local],policy).action==="DEFER"],
 ["external data authorization",chooseBackend({...job,requires:["cuda"],externalDataAllowed:false},[p],policy).action==="DEFER"],
 ["lease required",chooseBackend({...job,requires:["cuda"]},[{...p,leaseAvailable:false}],policy).action==="DEFER"],
 ["cleanup required",chooseBackend({...job,requires:["cuda"]},[{...p,cleanupAvailable:false}],policy).action==="DEFER"],
 ["short gap keep",decideIdle(idle).action==="KEEP"],
 ["long gap release",decideIdle({...idle,nextReadyUpperSeconds:120}).action==="RELEASE"],
 ["unknown next release",decideIdle({...idle,nextBatchKnown:false}).action==="RELEASE"],
 ["done release",decideIdle({...idle,taskDone:true}).action==="RELEASE"],
 ["no watchdog release",decideIdle({...idle,watchdogActive:false}).action==="RELEASE"],
 ["reserve next batch",decideIdle({...idle,remainingLeaseSeconds:80}).action==="RELEASE"],
 ["idle cap release",decideIdle({...idle,idleCapSeconds:15}).action==="RELEASE"],
 ["budget reserve release",decideIdle({...idle,remainingUnits:.1}).action==="RELEASE"],
 ["owner exact cleanup",decideCleanup({record:rec,remote,callerOwner:"a",nowSeconds:1}).action==="STOP_EXACT_ID"],
 ["other owner protected",decideCleanup({record:rec,remote,callerOwner:"b",nowSeconds:1}).action==="DO_NOT_TOUCH"],
 ["watchdog authorized expired lease",decideCleanup({record:rec,remote,callerOwner:"b",nowSeconds:101,supervisorAuthorized:true}).action==="STOP_EXACT_ID"],
 ["wrong identity reconcile",decideCleanup({record:rec,remote:{...remote,id:"r2"},callerOwner:"a",nowSeconds:1}).action==="RECONCILE"],
 ["provider confirms release",decideCleanup({record:rec,remote:{...remote,exists:false},callerOwner:"a",nowSeconds:1}).action==="CLOSED"]
 ];
}
for(const [name,result] of checks())test(name,()=>assert.equal(result,true));
