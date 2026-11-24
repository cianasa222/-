export function chooseBackend(job,providers,policy={}){
 const finite=x=>typeof x==="number"&&Number.isFinite(x)&&x>=0;
 if(!job||!Array.isArray(job.requires)||!job.requires.length||!job.requires.every(x=>typeof x==="string"&&x)||!Array.isArray(providers))throw Error("invalid job/providers");
 const safety=policy.safetyFactor??1.25,deadline=job.deadlineSeconds??Infinity,budget=policy.remainingUnits??0;
 if(!finite(safety)||safety<1||!(deadline>0)||!finite(budget))throw Error("invalid policy");
 const viable=[],rejected=[];
 for(const p of providers){
  let reason=null;
  if(!p?.id||p.available!==true||p.probed!==true||p.authorized!==true)reason="unavailable or not authorized";
  else if(!job.requires.every(x=>p.capabilities?.includes(x)))reason="missing required capability";
  else if(p.external===true&&job.externalDataAllowed!==true)reason="external data transfer not approved";
  else if(p.paid===true&&(!policy.allowPaid||policy.unresolvedRuntime===true||!finite(p.unitsPerMinute)||p.unitsPerMinute<=0||p.lifecycleVerified!==true||p.cleanupAvailable!==true||p.namedOwnership!==true||p.oneShotSupported!==true||p.graphicsProbeRequired===true))reason="paid backend lacks approval, rate, lifecycle, cleanup, ownership, one-shot support or probe";
  else if(p.paid!==true&&p.costKnownZero!==true)reason="unknown cost";
  const times=[p?.startupSeconds,p?.transferSeconds,p?.executionSeconds,p?.cleanupSeconds];
  if(!reason&&!times.every(finite))reason="unknown duration";
  if(reason){rejected.push({id:p?.id??null,reason});continue;}
  const wallSeconds=times.reduce((a,b)=>a+b,0)*safety,units=p.paid?wallSeconds*p.unitsPerMinute/60:0;
  if(wallSeconds>deadline){rejected.push({id:p.id,reason:"deadline"});continue;}
  if(units>budget){rejected.push({id:p.id,reason:"budget"});continue;}
  viable.push({id:p.id,units,wallSeconds,mode:p.paid?"one-shot":"direct",paid:p.paid===true});
 }
 viable.sort((a,b)=>a.units-b.units||a.wallSeconds-b.wallSeconds||a.id.localeCompare(b.id));
 return {action:viable.length?"RUN":"DEFER",selected:viable[0]??null,alternatives:viable.slice(1),rejected};
}

export function decideIdle(input){
 const release=reason=>({action:"RELEASE",reason,keepSeconds:0});
 if(input.taskDone||input.failed||input.cancelled||input.budgetExhausted||input.waitingForUser||input.returningToModel||input.crossToolBoundary)return release("terminal, model/user wait or tool boundary");
 if(input.owned!==true||input.sameInvocation!==true||input.cleanupInFinally!==true||input.nextBatchKnown!==true||input.nextBatchPrepared!==true)return release("not an owned, prepared, uninterrupted batch");
 const v=[input.nextReadyUpperSeconds,input.restartBillableSeconds,input.remainingTaskSeconds,input.remainingUnits,input.unitsPerMinute,input.cleanupReserveSeconds,input.nextBatchBillableSeconds];
 if(v.some(x=>typeof x!=="number"||!Number.isFinite(x)||x<0)||input.unitsPerMinute<=0)return release("unknown or invalid estimate");
 const idleCap=input.idleCapSeconds??300;if(!Number.isFinite(idleCap)||idleCap<=0)return release("invalid idle cap");
 const wait=input.nextReadyUpperSeconds,restart=input.restartBillableSeconds;
 const room=Math.min(input.remainingTaskSeconds,input.remainingUnits*60/input.unitsPerMinute)-input.cleanupReserveSeconds-input.nextBatchBillableSeconds;
 if(wait>idleCap||wait>room)return release("idle cap, task deadline or budget");
 if(wait>=restart)return release("restart cheaper or equal");
 return {action:"KEEP_IN_BATCH",reason:"prepared same-invocation next batch cheaper than restart",keepSeconds:wait,estimatedIdleUnits:wait*input.unitsPerMinute/60};
}

export function decideCleanup({record,remote,callerOwner}){
 const hold=reason=>({action:"RECONCILE",reason});
 if(!record||!record.owner||!record.remoteId||!record.accountScope||!remote||remote.id!==record.remoteId||remote.accountScope!==record.accountScope)return hold("unverified remote identity/account");
 if(remote.exists===false)return {action:"CLOSED",reason:"provider confirms absent"};
 if(remote.exists!==true)return hold("provider state unknown");
 if(callerOwner!==record.owner)return {action:"DO_NOT_TOUCH",reason:"not owner"};
 return {action:"STOP_EXACT_ID",remoteId:record.remoteId,reason:"owned runtime"};
}
