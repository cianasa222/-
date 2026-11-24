export function chooseBackend(job,providers,policy={}) {
 const finite=x=>typeof x==="number"&&Number.isFinite(x)&&x>=0;
 if(!job||!Array.isArray(job.requires)||!job.requires.length||!job.requires.every(x=>typeof x==="string"&&x)||!Array.isArray(providers))throw Error("invalid job/providers");
 const safety=policy.safetyFactor??1.25;if(!finite(safety)||safety<1)throw Error("invalid safetyFactor");
 const deadline=job.deadlineSeconds??Infinity;if(!(deadline>0))throw Error("invalid deadline");
 const budget=policy.remainingUnits??0;if(!finite(budget))throw Error("invalid budget");
 const viable=[],rejected=[];
 for(const p of providers){
  let reason=null;
  if(!p?.id||p.available!==true||p.probed!==true||p.authorized!==true)reason="unavailable or not authorized";
  else if(!job.requires.every(x=>p.capabilities?.includes(x)))reason="missing required capability";
  else if(p.external===true&&job.externalDataAllowed!==true)reason="external data transfer not approved";
  else if(p.paid===true&&(!policy.allowPaid||!finite(p.unitsPerMinute)||p.unitsPerMinute<=0||p.lifecycleVerified!==true||p.cleanupAvailable!==true||p.leaseAvailable!==true||p.graphicsProbeRequired===true))reason="paid backend lacks approval, rate, lifecycle, cleanup, lease or probe";
  else if(p.paid!==true&&p.costKnownZero!==true)reason="unknown cost";
  const times=[p?.startupSeconds,p?.transferSeconds,p?.executionSeconds,p?.cleanupSeconds];
  if(!reason&&!times.every(finite))reason="unknown duration";
  if(reason){rejected.push({id:p?.id??null,reason});continue;}
  const wallSeconds=times.reduce((a,b)=>a+b,0)*safety;
  const units=p.paid?wallSeconds*p.unitsPerMinute/60:0;
  if(wallSeconds>deadline){rejected.push({id:p.id,reason:"deadline"});continue;}
  if(units>budget){rejected.push({id:p.id,reason:"budget"});continue;}
  viable.push({id:p.id,units,wallSeconds,mode:p.paid?"one-shot":"direct",paid:p.paid===true});
 }
 viable.sort((a,b)=>a.units-b.units||a.wallSeconds-b.wallSeconds||a.id.localeCompare(b.id));
 return {action:viable.length?"RUN":"DEFER",selected:viable[0]??null,alternatives:viable.slice(1),rejected};
}

export function decideIdle(input){
 const release=reason=>({action:"RELEASE",reason,keepSeconds:0});
 if(input.taskDone||input.failed||input.cancelled||input.budgetExhausted)return release("terminal or budget exhausted");
 if(!input.owned||!input.watchdogActive||!input.leaseValid||!input.nextBatchKnown)return release("no verified ownership/watchdog/lease/next batch");
 const v=[input.nextReadyUpperSeconds,input.restartBillableSeconds,input.remainingLeaseSeconds,input.remainingUnits,input.unitsPerMinute,input.cleanupReserveSeconds,input.nextBatchBillableSeconds];
 if(v.some(x=>typeof x!=="number"||!Number.isFinite(x)||x<0)||input.unitsPerMinute<=0)return release("unknown or invalid estimate");
 const idleCap=input.idleCapSeconds??300;if(!Number.isFinite(idleCap)||idleCap<=0)return release("invalid idle cap");
 const wait=input.nextReadyUpperSeconds, restart=input.restartBillableSeconds, cleanup=input.cleanupReserveSeconds, next=input.nextBatchBillableSeconds;
 const roomSeconds=Math.min(input.remainingLeaseSeconds,input.remainingUnits*60/input.unitsPerMinute)-cleanup-next;
 if(wait>idleCap||wait>roomSeconds)return release("idle cap, lease or budget");
 if(wait>=restart)return release("restart cheaper or equal");
 return {action:"KEEP",reason:"bounded next batch cheaper than reprovision",keepSeconds:wait,estimatedIdleUnits:wait*input.unitsPerMinute/60};
}

export function decideCleanup({record,remote,callerOwner,nowSeconds,supervisorAuthorized=false}){
 const hold=reason=>({action:"RECONCILE",reason});
 if(!record||!record.owner||!record.remoteId||!remote||remote.id!==record.remoteId||remote.accountScope!==record.accountScope)return hold("unverified remote identity/account");
 if(remote.exists===false)return {action:"CLOSED",reason:"provider confirms absent"};
 if(remote.exists!==true)return hold("provider state unknown");
 const expired=Number.isFinite(nowSeconds)&&Number.isFinite(record.expiresAtSeconds)&&nowSeconds>=record.expiresAtSeconds;
 if(callerOwner!==record.owner&&!(supervisorAuthorized===true&&expired))return {action:"DO_NOT_TOUCH",reason:"not owner or authorized expired-lease supervisor"};
 return {action:"STOP_EXACT_ID",remoteId:record.remoteId,reason:"owned or authorized expired lease"};
}
