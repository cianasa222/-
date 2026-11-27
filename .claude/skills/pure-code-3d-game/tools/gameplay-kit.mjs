// Engine-neutral procedural reference components; seconds unless explicitly Ms.
function finite(x){if(!Number.isFinite(x))throw Error("nonfinite parameter");return x}

function clamp(x,lo,hi){return Math.max(lo,Math.min(hi,x))}

function damp(x,y,halfLife,dt){[x,y,halfLife,dt].forEach(finite);if(halfLife<=0||dt<0)throw Error("invalid time");return y+(x-y)*2**(-dt/halfLife)}

function createInputWindows({coyoteMs=100,bufferMs=100}={}){if(![coyoteMs,bufferMs].every(x=>Number.isFinite(x)&&x>=0))throw Error("invalid window");let ground=-Infinity,queued=-Infinity,last=-Infinity,was=false,spent=false;function advance(t){finite(t);if(t<last)throw Error("time reversal");last=t}return {press(t){advance(t);queued=t},update(t,onGround){advance(t);if(onGround){if(!was)spent=false;ground=t}was=!!onGround;if(t-queued>bufferMs)queued=-Infinity;if(!spent&&(onGround||t-ground<=coyoteMs)&&queued!==-Infinity){spent=true;queued=-Infinity;return true}return false},reset(){ground=queued=last=-Infinity;was=spent=false}}}

function hitFeedback(tier,{reducedMotion=false}={}){const p={small:[.12,0,3,-18],medium:[.35,55,9,-12],heavy:[.7,100,18,-8]};if(!Object.hasOwn(p,tier))throw Error("tier");const [trauma,actorPauseMs,particles,gainDb]=p[tier];return {trauma:reducedMotion?0:trauma,actorPauseMs,particles:reducedMotion?Math.min(3,particles):particles,gainDb}}

function chooseAimTarget(origin,forward,targets,{range,coneRad=Math.PI/4}={}){if(!Number.isFinite(range)||range<=0||!Number.isFinite(coneRad)||coneRad<0||coneRad>Math.PI)throw Error("aim bounds");const norm=Math.hypot(...forward);if(!norm||!Number.isFinite(norm))throw Error("forward");let best=null;for(const t of targets){if(t.blocked||t.alive===false)continue;const d=t.position.map((x,i)=>x-origin[i]),len=Math.hypot(...d);if(!Number.isFinite(len)||!len||len>range)continue;const angle=Math.acos(clamp(d.reduce((sum,x,i)=>sum+x*forward[i],0)/(len*norm),-1,1));if(!Number.isFinite(angle)||angle>coneRad)continue;const score=len/range+angle/Math.max(coneRad,1e-9);if(!best||score<best.score||(score===best.score&&String(t.id)<String(best.id)))best={id:t.id,distance:len,angle,score}}return best}

function phaseWave(time,hz,amp,phase=0){[time,hz,amp,phase].forEach(finite);return amp*Math.sin(2*Math.PI*hz*time+phase)}

function gaitOffsets(kind,count){if(!Number.isInteger(count)||count<1||count>128)throw Error("joint count");if(kind==="quadruped"&&count===4)return [0,Math.PI,Math.PI,0];if(kind==="hexapod"&&count===6)return [0,Math.PI,0,Math.PI,0,Math.PI];if(kind==="octopod"&&count===8)return Array.from({length:8},(_,i)=>(i%4+Math.floor(i/4))%2*Math.PI);if(kind==="traveling")return Array.from({length:count},(_,i)=>2*Math.PI*i/count);throw Error("invalid gait")}

function squashStretch(z){finite(z);if(z<=0)throw Error("positive scale");return [1/Math.sqrt(z),1/Math.sqrt(z),z]}

function seededRandom(seed){let n=2166136261;for(const ch of String(seed))n=Math.imul(n^ch.codePointAt(0),16777619)>>>0;return ()=>{n=(n+0x6D2B79F5)>>>0;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}

function waveSchedule({waves,baseCount,growth=1,intervalTicks=60}){if(!Number.isInteger(waves)||waves<1||waves>10000||!Number.isInteger(baseCount)||baseCount<1||!Number.isFinite(growth)||growth<=0||!Number.isInteger(intervalTicks)||intervalTicks<1)throw Error("wave config");return Array.from({length:waves},(_,i)=>{const count=Math.round(baseCount*growth**i),tick=i*intervalTicks;if(!Number.isSafeInteger(count)||count<1||!Number.isSafeInteger(tick))throw Error("wave overflow");return {wave:i+1,count,tick}})}

function simulateRoute({create,step,outcome,policy,seed,maxTicks=2500}){if(!Number.isInteger(maxTicks)||maxTicks<1||maxTicks>1000000)throw Error("tick cap");const ctx={random:seededRandom(seed),tick:0};let state=create(ctx);for(let tick=0;tick<=maxTicks;tick++){ctx.tick=tick;const result=outcome(state,ctx);if(result!==null){if(!["win","loss","draw"].includes(result))throw Error("outcome");return {seed,ticks:tick,result}}if(tick===maxTicks)break;state=step(state,policy(state,ctx),ctx)}return {seed,ticks:maxTicks,result:"timeout"}}

function sweepRoutes({seeds,policies,create,step,outcome,maxTicks=2500}){if(!Array.isArray(seeds)||!seeds.length||seeds.length>1000)throw Error("seed set");const reports=Object.create(null);for(const [name,policy] of Object.entries(policies)){const rows=seeds.map(seed=>simulateRoute({create,step,outcome,policy,seed,maxTicks}));const counts={win:0,loss:0,draw:0,timeout:0};rows.forEach(r=>counts[r.result]++);reports[name]={counts,winRate:counts.win/rows.length,rows}}return reports}

function createRuntimeBridge({state,stats,dispatch,selfTests}){for(const f of [state,stats,dispatch,selfTests])if(typeof f!=="function")throw Error("missing hook");const snap=x=>JSON.parse(JSON.stringify(x));return Object.freeze({getState:()=>snap(state()),getStats:()=>snap(stats()),sendAction:a=>dispatch(snap(a)),runSelfTests:()=>snap(selfTests())})}

function dbToGain(db){return 10**(finite(db)/20)}

function synthImpact({sampleRate=22050,duration=.12,seed=0,frequency=120,noise=.35}={}){if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000||!Number.isFinite(duration)||duration<=0||duration>3||!Number.isFinite(frequency)||frequency<=0||frequency>=sampleRate/2||!Number.isFinite(noise)||noise<0||noise>1)throw Error("audio params");const rng=seededRandom(seed),n=Math.max(2,Math.round(sampleRate*duration)),out=new Float32Array(n);let low=0;for(let i=0;i<n;i++){const t=i/sampleRate,u=i/(n-1),env=Math.min(1,i/(sampleRate*.003))*(1-u)**3;low+=.25*((rng()*2-1)-low);out[i]=env*((1-noise)*Math.sin(2*Math.PI*frequency*(t-.35*t*t/duration))+noise*low)}return out}
export { damp, createInputWindows, hitFeedback, chooseAimTarget, phaseWave, gaitOffsets, squashStretch, seededRandom, waveSchedule, simulateRoute, sweepRoutes, createRuntimeBridge, dbToGain, synthImpact };
