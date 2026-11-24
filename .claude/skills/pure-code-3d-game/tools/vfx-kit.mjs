export function makeEmitter({seed=1,rate=20,lifetime=[.5,1],speed=[1,3],gravity=[0,-9.81,0],maxParticles=1024}={}){
 if(!Number.isInteger(seed)||!Number.isFinite(rate)||rate<0||rate>1e6||!Array.isArray(lifetime)||lifetime.length!==2||!lifetime.every(Number.isFinite)||lifetime[0]<=0||lifetime[1]<lifetime[0]||!Array.isArray(speed)||speed.length!==2||!speed.every(Number.isFinite)||speed[0]<0||speed[1]<speed[0]||!Array.isArray(gravity)||gravity.length!==3||!gravity.every(Number.isFinite)||!Number.isInteger(maxParticles)||maxParticles<1||maxParticles>100000)throw Error("invalid emitter");
 let rng=seed>>>0,carry=0,id=0,particles=[],dropped=0;
 const rand=()=>{rng=(Math.imul(1664525,rng)+1013904223)>>>0;return rng/4294967296;};
 const range=(a,b)=>a+(b-a)*rand();
 return {step(dt,origin=[0,0,0]){if(!Number.isFinite(dt)||dt<=0||dt>.1||!Array.isArray(origin)||origin.length!==3||!origin.every(Number.isFinite))throw Error("invalid emitter step");
 for(const p of particles){p.age+=dt;for(let k=0;k<3;k++){p.v[k]+=gravity[k]*dt;p.p[k]+=p.v[k]*dt;}}
 particles=particles.filter(p=>p.age<p.life);
 carry+=rate*dt;const count=Math.floor(carry+1e-9);carry=Math.max(0,carry-count);
 const accepted=Math.min(count,maxParticles-particles.length);dropped+=count-accepted;
 for(let i=0;i<accepted;i++){const y=range(-1,1),phi=range(0,2*Math.PI),r=Math.sqrt(Math.max(0,1-y*y)),s=range(...speed);particles.push({id:id++,p:[...origin],v:[s*r*Math.cos(phi),s*y,s*r*Math.sin(phi)],age:0,life:range(...lifetime)});}
 return {particles:particles.map(p=>({...p,p:[...p.p],v:[...p.v],normalizedAge:p.age/p.life})),dropped};}};
}

export function sampleCurve(keys,t){if(!Array.isArray(keys)||!keys.length||!Number.isFinite(t)||keys.some((x,i)=>!Array.isArray(x)||x.length!==2||!x.every(Number.isFinite)||(i>0&&x[0]<=keys[i-1][0])))throw Error("invalid curve");if(t<=keys[0][0])return keys[0][1];for(let i=1;i<keys.length;i++){if(t<=keys[i][0]){const [a,v]=keys[i-1],[b,w]=keys[i];return v+(w-v)*(t-a)/(b-a);}}return keys.at(-1)[1];}
