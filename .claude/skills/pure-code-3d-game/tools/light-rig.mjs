// Original teaching implementation. World units in metres, RH/Y up, OpenGL clip depth [-1,1].
const dot = (a,b) => a.reduce((sum,x,i)=>sum+x*b[i],0);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit = a => {
  const n=Math.hypot(...a);
  if(!Number.isFinite(n)||n===0) throw Error('Light vector must be finite and nonzero');
  return a.map(x=>x/n);
};

// centre is an absolute-world focus point. origin is subtracted from scene coordinates on upload.
export function directionalFrame(centre, direction, halfWidth, depthSpan, resolution, origin=[0,0,0]) {
  if(!Number.isFinite(halfWidth)||halfWidth<=0||!Number.isFinite(depthSpan)||depthSpan<=0||!Number.isInteger(resolution)||resolution<1)
    throw Error('Invalid shadow volume or map size');
  for(const v of [centre,direction,origin])if(v.length!==3||!v.every(Number.isFinite))throw Error('Invalid world vector');
  const z=unit(direction), x=unit(cross(Math.abs(z[1])>.99?[0,0,1]:[0,1,0],z)), y=cross(z,x);
  const texel=2*halfWidth/resolution;
  const centreXY=[dot(centre,x),dot(centre,y)].map(v=>Math.round(v/texel)*texel);
  const tx=(dot(origin,x)-centreXY[0])/halfWidth;
  const ty=(dot(origin,y)-centreXY[1])/halfWidth;
  const dz=-2/depthSpan, tz=(dot(origin,z)-dot(centre,z))*dz;
  const matrix=new Float32Array([
    x[0]/halfWidth,y[0]/halfWidth,z[0]*dz,0,
    x[1]/halfWidth,y[1]/halfWidth,z[1]*dz,0,
    x[2]/halfWidth,y[2]/halfWidth,z[2]*dz,0,tx,ty,tz,1
  ]);
  return {matrix,texel,centreXY};
}

// Manual PCF on a NEAREST depth texture. Bias arguments use metres in light-space depth.
export const shadowGLSL = `
float mainVisibility(vec4 lightClip, float nDotL) {
  if (!uShadows) return 1.0;
  vec3 q = lightClip.xyz / lightClip.w * 0.5 + 0.5;
  vec3 dx=dFdx(q), dy=dFdy(q);
  float det=dx.x*dy.y-dx.y*dy.x;
  vec2 grad=abs(det)>1e-10 ? vec2(dx.z*dy.y-dy.z*dx.y, dx.x*dy.z-dy.x*dx.z)/det : vec2(0.0);
  if(q.z<=0.0 || q.z>=1.0 || any(lessThan(q.xy,vec2(0.0))) || any(greaterThan(q.xy,vec2(1.0))))return 1.0;
  vec2 pixel = 1.0 / vec2(textureSize(uDepth,0));
  float receiver = q.z - (uBiasM.x + uBiasM.y*(1.0-clamp(nDotL,0.0,1.0))) / uDepthSpan;
  float sum=0.0;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
    vec2 uv=q.xy+vec2(x,y)*pixel;
    vec2 centre=(floor(clamp(uv,0.5*pixel,1.0-0.5*pixel)/pixel)+0.5)*pixel;
    sum += step(receiver+dot(grad,centre-q.xy),texture(uDepth,centre).r);
  }
  float edge=min(min(q.x,1.0-q.x),min(q.y,1.0-q.y));
  return mix(1.0,sum/9.0,uStrength*smoothstep(0.0,0.06,edge));
}`;
