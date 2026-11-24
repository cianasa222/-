// Parametric cuff or collar. Rows run from low to high in local metres.
// Body section radii, ease, material thickness and fold amplitude are independent.
// Outer and lining vertices are separate; the hems close the two open ends.
export function makeCuff(rows,{segments=48,ease=.012,thickness=.002,folds=6,amplitude=.004}={}) {
  if(!Array.isArray(rows)||rows.length<2||!Number.isInteger(segments)||segments<8||
     !Number.isInteger(folds)||folds<0||folds*2>=segments||
     ![ease,thickness,amplitude].every(Number.isFinite)||thickness<=0||amplitude<0||ease<thickness+amplitude)
    throw Error('Invalid cuff dimensions, sampling or clearance');
  rows.forEach(([y,rx,rz],i)=>{
    if(![y,rx,rz].every(Number.isFinite)||Math.min(rx,rz)<=0||(i && y<=rows[i-1][0]))throw Error('Invalid body section');
  });
  const positions=[],uv=[],indices=[],groups={outer:[],lining:[],hem:[]};
  const count=segments+1,layer=count*rows.length;
  for(let side=0;side<2;side++)for(const [i,[y,rx,rz]] of rows.entries()) {
    const v=(y-rows[0][0])/(rows.at(-1)[0]-rows[0][0]);
    for(let j=0;j<=segments;j++){
      const t=2*Math.PI*(j%segments)/segments;
      const offset=ease-side*thickness+amplitude*(1-v)*Math.cos(folds*t+.5*v);
      positions.push((rx+offset)*Math.cos(t),y,(rz+offset)*Math.sin(t));uv.push(j/segments,v);
      if(i===rows.length-1||j===segments)continue;
      const a=side*layer+i*count+j;
      (side?groups.lining:groups.outer).push(...(side?[a,a+1,a+count,a+1,a+count+1,a+count]:[a,a+count,a+1,a+1,a+count,a+count+1]));
    }
  }
  for(let j=0;j<segments;j++){
    const lo=j,hi=(rows.length-1)*count+j;
    groups.hem.push(lo,lo+1,lo+layer,lo+1,lo+layer+1,lo+layer,hi,hi+layer,hi+1,hi+1,hi+layer,hi+layer+1);
  }
  const ranges={};
  for(const [key,ix] of Object.entries(groups)){
    ranges[key]={start:indices.length,count:ix.length};for(const index of ix)indices.push(index);
  }
  return {positions,uv,indices,ranges};
}

export function dielectricF0(ior,outside=1){
  if(![ior,outside].every(n=>Number.isFinite(n)&&n>0))throw Error('Invalid index');
  return ((ior-outside)/(ior+outside))**2;
}

// Shader functions take linear-light inputs. T/B are a local orthonormal fabric frame.
export const surfaceGLSL=`
const float PI=3.14159265;
float schlick(float f0,float cosTheta){return f0+(1.-f0)*pow(1.-clamp(cosTheta,0.,1.),5.);}
float specLobe(vec3 n,vec3 t,vec3 b,vec3 l,vec3 v,vec2 alpha,float f0){
 float nl=dot(n,l),nv=dot(n,v);if(min(nl,nv)<=0.)return 0.;
 vec3 h=normalize(l+v); vec2 a=max(alpha,vec2(.035));vec3 h2=vec3(dot(t,h)/a.x,dot(b,h)/a.y,dot(n,h));
 float denom=dot(h2,h2);
 float D=1./max(PI*a.x*a.y*denom*denom,1e-7);
 float vis=.5/max(nl*length(vec3(a*vec2(dot(t,v),dot(b,v)),nv))+nv*length(vec3(a*vec2(dot(t,l),dot(b,l)),nl)),1e-5);
 return D*vis*schlick(f0,dot(v,h))*nl;
}
float threadWave(float phase){
 float w=fwidth(phase);
 return sin(6.2831853*phase)*(1.-smoothstep(.22,.50,w));
}
vec3 shadeFabric(vec3 base,vec3 n,vec3 tangent,vec3 l,vec3 v,vec2 clothUv,bool satin){
 vec3 t=normalize(tangent-n*dot(tangent,n)),b=cross(n,t);
 vec2 fiber=vec2(threadWave(clothUv.x*95.),threadWave(clothUv.y*78.));
 n=normalize(n+.045*(t*fiber.x+b*fiber.y));t=normalize(t-n*dot(t,n));b=cross(n,t);
 float nl=max(dot(n,l),0.),nv=max(dot(n,v),0.);
 float spec=specLobe(n,t,b,l,v,satin?vec2(.09,.42):vec2(.58),.04);
 float fuzz=pow(1.-nv,3.)*(satin?.03:.23)*(.2+.8*nl);
 return base*(.20+.74*nl)+vec3(spec)*(satin?.83:.28)+sqrt(base)*fuzz;
}
vec3 shadeSkin(vec3 base,vec3 n,vec3 t,vec3 l,vec3 v,float thicknessMask,float oilMask){
 vec3 b=cross(n,t);float nl=dot(n,l);
 float wrapped=clamp((nl+.27)/1.27,0.,1.);
 vec3 diffuse=base*(vec3(.20)+mix(vec3(max(nl,0.)),vec3(wrapped),vec3(.60,.25,.12)));
 float back=thicknessMask*max(-nl,0.)*pow(max(dot(v,-l),0.),2.);
 float shine=.70*specLobe(n,t,b,l,v,vec2(.37),.028)+.30*oilMask*specLobe(n,t,b,l,v,vec2(.16),.028);
 return diffuse+back*base*vec3(.44,.095,.045)+vec3(shine);
}
vec3 lensComposite(vec3 behind,vec3 reflected,float cosView,float f0,vec3 tint){
 float F=schlick(f0,cosView);
 return (1.-F)*behind*tint+F*reflected;
}`;
