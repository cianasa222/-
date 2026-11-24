// Original scalar JS reference; no Ozz source copied. XYZW, local TRS, column-major matrices.
function unit(q){if(!Array.isArray(q)||q.length!==4||!q.every(Number.isFinite))throw Error("quaternion");const l=Math.hypot(...q);if(!Number.isFinite(l)||l<1e-12)throw Error("quaternion norm");return q.map(v=>v/l);}

function vec(v,n){if(!Array.isArray(v)||v.length!==n||!v.every(Number.isFinite))throw Error("invalid vector");return v.slice();}

function transform(v){if(!v)throw Error("missing transform");const t=vec(v.t,3),r=unit(v.r),s=vec(v.s,3);if(s.some(x=>x<=0))throw Error("positive scale required");return {t,r,s};}

function mix(a,b,u){const dot=a.r.reduce((v,x,i)=>v+x*b.r[i],0),sign=dot<0?-1:1;const lerp=(x,y)=>x.map((v,i)=>v*(1-u)+y[i]*u);return transform({t:lerp(a.t,b.t),r:lerp(a.r,b.r.map(x=>x*sign)),s:lerp(a.s,b.s)});}

function trsMatrix(p){const {t:[tx,ty,tz],r:[x,y,z,w],s:[a,b,c]}=transform(p);return [(1-2*y*y-2*z*z)*a,(2*x*y+2*z*w)*a,(2*x*z-2*y*w)*a,0,(2*x*y-2*z*w)*b,(1-2*x*x-2*z*z)*b,(2*y*z+2*x*w)*b,0,(2*x*z+2*y*w)*c,(2*y*z-2*x*w)*c,(1-2*x*x-2*y*y)*c,0,tx,ty,tz,1];}

function matMul(a,b){const m=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)m[c*4+r]+=a[k*4+r]*b[c*4+k];return m;}

function makeProceduralClip({duration,segments,joints,poseAt,loop=false}){if(!Number.isFinite(duration)||duration<=0||!Number.isInteger(segments)||segments<1||segments>10000||!Number.isInteger(joints)||joints<1||joints>4096||segments*joints>1000000||typeof poseAt!=="function")throw Error("invalid recipe");const frames=[];for(let i=0;i<=segments;i++){const p=poseAt(duration*(i/segments));if(!Array.isArray(p)||p.length!==joints)throw Error("pose size");frames.push(p.map(transform));}if(loop)for(let j=0;j<joints;j++){const a=frames[0][j],b=frames[segments][j];if([...a.t.map((v,i)=>Math.abs(v-b.t[i])),...a.s.map((v,i)=>Math.abs(v-b.s[i])),1-Math.abs(a.r.reduce((v,x,i)=>v+x*b.r[i],0))].some(x=>x>1e-5))throw Error("loop seam");}return {duration,segments,joints,loop,frames};}

function sampleClip(clip,time){if(!Number.isFinite(time))throw Error("invalid time");const {duration,segments,loop,frames}=clip;if(!Number.isFinite(duration)||duration<=0||!Number.isInteger(segments)||segments<1||frames.length!==segments+1)throw Error("invalid clip");let t=loop?time%duration:Math.max(0,Math.min(duration,time));if(t<0)t+=duration;const x=t/duration*segments,i=Math.min(segments-1,Math.floor(x));return frames[i].map((p,j)=>mix(p,frames[i+1][j],x-i));}

function blendLocalPoses(rest,layers,threshold=.1){if(!Number.isFinite(threshold)||threshold<=0||!Array.isArray(rest)||!rest.length||!Array.isArray(layers))throw Error("invalid blend");const base=rest.map(transform);const ls=layers.map(l=>{if(!Number.isFinite(l.weight)||l.weight<0||!Array.isArray(l.pose)||l.pose.length!==base.length)throw Error("invalid layer");const mask=l.mask??base.map(()=>1);if(!Array.isArray(mask)||mask.length!==base.length||mask.some(v=>!Number.isFinite(v)||v<0||v>1))throw Error("invalid mask");return {weight:l.weight,pose:l.pose.map(transform),mask};});return base.map((b,j)=>{let entries=ls.map(l=>[l.pose[j],l.weight*l.mask[j]]).filter(x=>x[1]>0);let sum=entries.reduce((s,x)=>s+x[1],0);if(!Number.isFinite(sum))throw Error("weight overflow");if(sum<threshold){entries.push([b,threshold-sum]);sum=threshold;}const anchor=entries[0][0].r,t=[0,0,0],s=[0,0,0],r=[0,0,0,0];for(const [p,w0] of entries){const w=w0/sum,sign=anchor.reduce((v,x,i)=>v+x*p.r[i],0)<0?-1:1;for(let i=0;i<3;i++){t[i]+=p.t[i]*w;s[i]+=p.s[i]*w;}for(let i=0;i<4;i++)r[i]+=p.r[i]*w*sign;}return transform({t,r,s});});}

function localToModelMatrices(parents,pose){if(!Array.isArray(parents)||!Array.isArray(pose)||parents.length!==pose.length||!pose.length)throw Error("invalid hierarchy");const out=[];for(let i=0;i<parents.length;i++){const p=parents[i];if(!Number.isInteger(p)||p< -1||p>=i)throw Error("parent order");const m=trsMatrix(pose[i]);out.push(p===-1?m:matMul(out[p],m));if(!out[i].every(Number.isFinite))throw Error("matrix overflow");}return out;}
export {makeProceduralClip,sampleClip,blendLocalPoses,localToModelMatrices};
