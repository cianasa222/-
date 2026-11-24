export function stepChain({positions,previous,restLengths,root,dt,gravity=[0,-9.81,0],damping=.05,compliance=0,iterations=8,spheres=[]}){
 const vec=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);
 const n=positions.length;
 if(n<2||previous.length!==n||restLengths.length!==n-1||!positions.every(vec)||!previous.every(vec)||!vec(root)||!vec(gravity)||!Number.isFinite(dt)||dt<=0||dt>.1||!Number.isFinite(damping)||damping<0||damping>1||!Number.isFinite(compliance)||compliance<0||!Number.isInteger(iterations)||iterations<1||iterations>128||restLengths.some(x=>!Number.isFinite(x)||x<=0)||spheres.some(s=>!vec(s.center)||!Number.isFinite(s.radius)||s.radius<0))throw Error("invalid chain parameters");
 const p=positions.map((v,i)=>i===0?[...root]:v.map((x,k)=>x+(x-previous[i][k])*(1-damping)+gravity[k]*dt*dt));
 const prev=positions.map(v=>[...v]),lambda=Array(n-1).fill(0),alpha=compliance/(dt*dt);
 for(let it=0;it<iterations;it++){
  for(let i=0;i<n-1;i++){
   const a=p[i],b=p[i+1],d=b.map((x,k)=>x-a[k]);let l=Math.hypot(...d);
   let u=l>1e-12?d.map(x=>x/l):[1,0,0];if(l<1e-12)l=0;
   const wa=i===0?0:1,wb=1,dl=(-(l-restLengths[i])-alpha*lambda[i])/(wa+wb+alpha);lambda[i]+=dl;
   for(let k=0;k<3;k++){a[k]-=wa*dl*u[k];b[k]+=wb*dl*u[k];}
  }
  for(let i=1;i<n;i++)for(const s of spheres){const d=p[i].map((x,k)=>x-s.center[k]),l=Math.hypot(...d);if(l<s.radius){const u=l>1e-12?d.map(x=>x/l):[0,1,0];p[i]=s.center.map((x,k)=>x+u[k]*s.radius);}}
 }
 const maxLengthError=Math.max(...restLengths.map((l,i)=>Math.abs(Math.hypot(...p[i+1].map((x,k)=>x-p[i][k]))-l)));
 const maxPenetration=Math.max(0,...p.slice(1).flatMap(v=>spheres.map(s=>Math.max(0,s.radius-Math.hypot(...v.map((x,k)=>x-s.center[k]))))));
 if(!p.every(vec)||!Number.isFinite(maxLengthError)||!Number.isFinite(maxPenetration))throw Error("nonfinite chain");
 return {positions:p,previous:prev,maxLengthError,maxPenetration};
}
