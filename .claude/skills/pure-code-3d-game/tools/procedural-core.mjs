/** GameKit ProceduralCore 4.1: deliberately small executable, engine-agnostic
 * mathematical reference algorithms. No pre-authored mesh, texture or animation data.
 * Does not claim cinematic-quality human generation or real GPU validation.
 */
const TAU = Math.PI * 2;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const smoothstep = t => { const x=clamp(t,0,1); return x*x*(3-2*x); };
export const frac = x => x - Math.floor(x);
export function createRng(seed=1) {
  let state = (seed | 0) || 0x6d2b79f5;
  return () => {state ^= state << 13; state ^= state >>> 17;state ^= state << 5;return (state >>> 0) / 4294967296;};
}
export function hash3i(x,y,z,seed=1) {
  let n = Math.imul((x|0) ^ Math.imul((y|0), 0x45d9f3b) ^ Math.imul((z|0), 0x119de1f3) ^ (seed|0), 0x27d4eb2d);
  n ^= n >>> 15; n = Math.imul(n, 0x85ebca6b); n ^= n >>> 13;
  return (n>>>0) / 4294967296;
}
export function noise3(x,y,z,seed=1) {
  const ix=Math.floor(x), iy=Math.floor(y), iz=Math.floor(z);
  const sx=smoothstep(frac(x)), sy=smoothstep(frac(y)), sz=smoothstep(frac(z));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const h=(a,b,c)=>hash3i(ix+a,iy+b,iz+c,seed)*2-1;
  return lerp(lerp(lerp(h(0,0,0),h(1,0,0),sx),lerp(h(0,1,0),h(1,1,0),sx),sy),
              lerp(lerp(h(0,0,1),h(1,0,1),sx),lerp(h(0,1,1),h(1,1,1),sx),sy),sz);
}
export function fbm3(x,y,z,{seed=1,octaves=4,lacunarity=2,gain=0.5}={}) {
  let sum=0, amp=1, freq=1, norm=0;
  for(let i=0;i<clamp(Math.floor(octaves),1,8);i++){sum+=amp*noise3(x*freq,y*freq,z*freq,seed+i*101);norm+=amp;amp*=gain;freq*=lacunarity;}
  return sum/norm;
}
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(a,s)=>a.map(v=>v*s);
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>{const l=Math.hypot(...a);return l>1e-12?a.map(x=>x/l):[0,0,0];};
export function bezier3(a,b,c,d,t) {
  const u=1-t;return a.map((_,i)=>u*u*u*a[i]+3*u*u*t*b[i]+3*u*t*t*c[i]+t*t*t*d[i]);
}
/** Create generated tubular ribbon/eyebrow/hair-strand geometry along mathematical curves.
 * The sweep frame is progressively projected onto tangent-orthogonal planes to reduce sudden twist.
 * Body is elliptical and tapers at the ends, avoiding exposed BoxGeometry anatomy.
 */
export function sweepCurve(points,{segments=32,sides=8,radius=0.009,aspect=0.45,taper=true}={}) {
  if(!Array.isArray(points)||points.length!==4||points.some(p=>p.length!==3||p.some(x=>!Number.isFinite(x))))throw Error('Four 3D Bézier controls required');
  if(segments<2||sides<3||segments>512||sides>32||radius<=0)throw Error('Invalid sweep resolution or radius');
  const positions=[],indices=[],normals=[];
  let previousSide=null;
  for(let i=0;i<=segments;i++){
    const t=i/segments, c=bezier3(...points,t),t0=clamp(t-1e-4,0,1),t1=clamp(t+1e-4,0,1);
    const tangent=norm(sub(bezier3(...points,t1),bezier3(...points,t0)));
    if(Math.hypot(...tangent)<0.5)throw Error('Degenerate curve tangent');
    let side=previousSide?norm(sub(previousSide,mul(tangent,dot(previousSide,tangent)))):[0,0,0];
    if(Math.hypot(...side)<0.5)side=norm(cross(Math.abs(tangent[1])<0.9?[0,1,0]:[1,0,0],tangent));
    previousSide=side;
    const binormal=norm(cross(tangent,side));
    const r=radius*(taper?Math.max(0.12,Math.sin(Math.PI*t)**0.6):1);
    for(let j=0;j<sides;j++){
      const angle=TAU*j/sides;
      const direction=add(mul(side,Math.cos(angle)),mul(binormal,aspect*Math.sin(angle)));
      const pos=add(c,mul(direction,r));
      positions.push(...pos);normals.push(...norm(add(mul(side,Math.cos(angle)),mul(binormal,Math.sin(angle)/Math.max(0.001,aspect)))));
    }
  }
  for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){
    const a=i*sides+j,b=i*sides+(j+1)%sides,c=(i+1)*sides+j,d=(i+1)*sides+(j+1)%sides;
    indices.push(a,c,b,b,c,d);
  }
  return {positions,indices,normals,generatedBy:'procedural-curve-sweep-v1',units:'meters'};
}
/** Smooth per-vertex normals from computed triangles. */
export function computeNormals(positions,indices){
  if(positions.length%3||indices.length%3)throw Error('Invalid triangular mesh');
  const out=new Array(positions.length).fill(0);
  for(let i=0;i<indices.length;i+=3){
    const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3;
    if(c+2>=positions.length||a<0||b<0)throw Error('Out-of-bounds triangle index');
    const ab=[positions[b]-positions[a],positions[b+1]-positions[a+1],positions[b+2]-positions[a+2]];
    const ac=[positions[c]-positions[a],positions[c+1]-positions[a+1],positions[c+2]-positions[a+2]];
    const n=cross(ab,ac);
    for(const k of [a,b,c]){out[k]+=n[0];out[k+1]+=n[1];out[k+2]+=n[2]}
  }
  for(let i=0;i<out.length;i+=3){let n=norm(out.slice(i,i+3));if(Math.hypot(...n)<0.5)n=[0,1,0];out[i]=n[0];out[i+1]=n[1];out[i+2]=n[2]}
  return out;
}
/** A symmetric procedural head volume. Mild forehead/jaw/cheek/nose shaping
 * comes from functions of angular position, not a stored mesh or body scan.
 * Example only: it requires independent lips/eyes/ears/hair for convincing faces.
 */
export function createFaceVolume({height=0.23,width=0.17,depth=0.18,headY=1.6,latitudes=36,longitudes=64,style=0.5}={}) {
  if(height<=0||width<=0||depth<=0||latitudes<8||longitudes<12||latitudes>256||longitudes>512)throw Error('Invalid head dimensions/resolution');
  const p=[],idx=[],uv=[];
  for(let i=0;i<=latitudes;i++){
    const theta=Math.PI*(i+1e-4)/(latitudes+2e-4),sy=Math.cos(theta),s=Math.sin(theta);
    const jaw=1-0.22*smoothstep((-sy+0.05)*1.3);
    for(let j=0;j<=longitudes;j++){
      const phi=TAU*j/longitudes,ux=Math.cos(phi),uz=Math.sin(phi),front=Math.max(0,uz);
      let x=width*s*ux*jaw,y=headY+height*sy,z=depth*s*uz;
      const nose=0.095*depth*Math.exp(-Math.pow(x/(width*0.2),2)-Math.pow((sy-0.01)/0.18,2))*front;
      const cheek=0.032*depth*Math.exp(-Math.pow((Math.abs(x)/width-0.47)/0.25,2)-Math.pow((sy+0.06)/0.20,2))*front;
      z+=style*(nose+cheek);
      p.push(x,y,z);uv.push(j/longitudes,i/latitudes);
      if(i<latitudes&&j<longitudes){const a=i*(longitudes+1)+j,b=a+longitudes+1;idx.push(a,b,a+1,a+1,b,b+1);}
    }
  }
  return {positions:p,indices:idx,uv,normals:computeNormals(p,idx),generatedBy:'procedural-head-volume-v1',units:'meters'};
}
/** Procedural brows generated with independent controllable arches and thickness.
 * NOTE: curves and 3D cross-sections, not SVG raster assets or preset image textures.
 */
export function createEyebrows({width=0.17,headY=1.6,depth=0.18,arch=0.016,thickness=0.007}={}) {
  return [-1,1].map(sign=>{
    const pts=[ [sign*width*0.10,headY+0.035,depth*0.92],
                [sign*width*0.25,headY+0.06+arch,depth*1.06],
                [sign*width*0.57,headY+0.06+arch*0.6,depth*0.97],
                [sign*width*0.85,headY+0.028,depth*0.79] ];
    return {side:sign===-1?'left':'right',...sweepCurve(pts,{segments:28,sides:7,radius:thickness,aspect:0.55})};
  });
}
export function makeRig({height=1.75,shoulderRatio=0.26,hipRatio=0.19,legRatio=0.51}={}) {
  if(height<0.3||height>3.5||legRatio<0.35||legRatio>0.64)throw Error('Invalid design proportions');
  const legs=height*legRatio,hipY=legs,shoulderY=height*0.82;
  const bones=[
    {name:'hips',parent:null,rest:[0,hipY,0]},
    {name:'spine',parent:'hips',rest:[0,height*0.69,0]},
    {name:'chest',parent:'spine',rest:[0,shoulderY,0]},
    {name:'neck',parent:'chest',rest:[0,height*0.88,0]},
    {name:'head',parent:'neck',rest:[0,height*0.95,0]}
  ];
  for(const s of [-1,1]){
    const side=s<0?'Left':'Right';const x=s*height*hipRatio/2,armX=s*height*shoulderRatio/2;
    bones.push({name:side+'UpperLeg',parent:'hips',rest:[x,hipY,0]},
      {name:side+'LowerLeg',parent:side+'UpperLeg',rest:[x,hipY-legs*0.52,0]},
      {name:side+'Foot',parent:side+'LowerLeg',rest:[x,0,0.03]},
      {name:side+'UpperArm',parent:'chest',rest:[armX,shoulderY,0]},
      {name:side+'LowerArm',parent:side+'UpperArm',rest:[armX+s*height*0.16,shoulderY-height*0.13,0]},
      {name:side+'Hand',parent:side+'LowerArm',rest:[armX+s*height*0.28,shoulderY-height*0.27,0]});
  }
  return {profile:'generated-humanoid-reference-v1',heightM:height,legLengthM:legs,upperLegM:legs*0.52,lowerLegM:legs*0.48,bones,origin:'design-proportions-not-anthropometric-scan'};
}
/** 2 bone sagittal IK, returns an explicit reachable flag. Negative y is down. */
export function solveLegIK(hip,ankle,upper,lower,{bendForward=true}={}) {
  if(!(upper>0&&lower>0)||hip.length!==2||ankle.length!==2)throw Error('Invalid IK lengths/points');
  const dx=ankle[0]-hip[0],dy=ankle[1]-hip[1],raw=Math.hypot(dx,dy);
  const minimum=Math.abs(upper-lower)+1e-6,maximum=upper+lower-1e-6;
  const d=clamp(raw,minimum,maximum),ux=raw>1e-9?dx/raw:0,uy=raw>1e-9?dy/raw:-1;
  const along=(upper*upper-lower*lower+d*d)/(2*d),h=Math.sqrt(Math.max(0,upper*upper-along*along));
  const dir=bendForward?1:-1;
  const knee=[hip[0]+along*ux-dir*h*uy,hip[1]+along*uy+dir*h*ux];
  return {hip:[...hip],knee,ankle:[...ankle],reachable:raw<=upper+lower+1e-6&&raw>=Math.abs(upper-lower)-1e-6,clampedDistance:d};
}
/** One analytical locomotion sample: fixed world-space foot position during stance.
 * Does not require frame-by-frame baked animation curves or a warm previous frame.
 * Units: meters, seconds. Assumes level ground and nonzero forward speed.
 */
export function sampleWalk({t=0,speed=1.2,legLength=0.9,stepLength,stanceRatio=0.61,hipY,footLift,hipBob}={}){
  if(t<0||speed<=0||legLength<=0||stanceRatio<=0.5||stanceRatio>=0.8)throw Error('Invalid gait');
  const stride=2*(stepLength??legLength*0.26),cycleSec=stride/speed;
  const rootX=speed*t,rootY=(hipY??legLength*0.90)+(hipBob??legLength*0.008)*Math.sin(TAU*t/cycleSec*2);
  const legs=[0,0.5].map((offset,i)=>{
    const cycle=t/cycleSec+offset,index=Math.floor(cycle),phase=frac(cycle);
    const x0=(index-offset)*stride;const stance=phase<stanceRatio;
    const u=stance?0:smoothstep((phase-stanceRatio)/(1-stanceRatio));
    const footX=x0+u*stride,footY=stance?0:(footLift??legLength*0.10)*Math.sin(Math.PI*u);
    const upper=legLength*0.52,lower=legLength*0.48;
    const ik=solveLegIK([rootX,rootY],[footX,footY],upper,lower);
    return {side:i===0?'left':'right',phase,stance,footWorld:[footX,footY],...ik};
  });
  return {time:t,root:[rootX,rootY],cycleSec,legs,design:'procedural-contact-ik-v1'};
}
/** Stateless snow: every flake addressable by integer id, seed and absolute time. */
export function sampleSnowflake({seed=1,id=0,time=0,wind=0.2,extent=12,height=8}={}) {
  if(!Number.isInteger(id)||id<0||extent<=0||height<=0)throw Error('Invalid snow world');
  const speed=0.25+hash3i(id,0,0,seed)*0.9;
  const x0=(hash3i(id,1,0,seed)-0.5)*extent;
  const y0=hash3i(id,2,0,seed)*height;
  const z0=(hash3i(id,3,0,seed)-0.5)*extent;
  const wrap=(a,l)=>((a%l)+l)%l;
  return {id,position:[wrap(x0+wind*time+extent/2,extent)-extent/2,
    wrap(y0-speed*time,height),wrap(z0+extent/2+0.15*Math.sin(time*0.7+id),extent)-extent/2],
    sizeM:0.003+hash3i(id,4,0,seed)*0.009,
    spin:time*(0.5+hash3i(id,5,0,seed)*1.4),
    sixFoldLobes:6,origin:'seeded-procedural-flake'};
}
/** Continuous six-fold crystal branch silhouette. In a GPU shader this function
 * is evaluated in parallel per fragment / instanced point, not allocated as textures.
 */
export function snowCrystalRadius(angle,{seed=1,flakeId=0,branchiness=0.35}={}){
  const phase=hash3i(flakeId,6,0,seed)*TAU/6;
  const v=Math.cos(6*(angle-phase)),v2=Math.cos(12*(angle-phase));
  return clamp(0.65+branchiness*v+0.08*v2,0.05,1.08);
}
/** Deterministic synthesized impact sound source sample (code only).
 * Real audio integration should use Web Audio scheduling and voice/limiter caps.
 */
export function impactSample(t,{seed=1,frequency=170,decay=18}={}){
  if(t<0||!Number.isFinite(t))return 0;
  const harmonic=0.7*Math.sin(TAU*frequency*t*(1-0.14*t))+0.3*Math.sin(TAU*frequency*2.03*t);
  const noise=(hash3i(Math.floor(t*48000),0,0,seed)-0.5)*0.08;
  return (harmonic+noise)*Math.exp(-decay*t);
}