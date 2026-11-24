export function qNormalize(q){if(!Array.isArray(q)||q.length!==4||!q.every(Number.isFinite))throw Error("invalid quaternion");const n=Math.hypot(...q);if(n<1e-12)throw Error("zero quaternion");return q.map(x=>x/n);}

export function qMul(a,b){const [x,y,z,w]=a,[X,Y,Z,W]=b;return [w*X+x*W+y*Z-z*Y,w*Y-x*Z+y*W+z*X,w*Z+x*Y-y*X+z*W,w*W-x*X-y*Y-z*Z];}

export function qInv(q){const [x,y,z,w]=qNormalize(q);return [-x,-y,-z,w];}

export function retargetLocalRotation(sourceRest,sourcePose,targetRest,basis=[0,0,0,1]){
 // XYZW active rotations, local pose = rest * delta; basis maps source rest axes to target rest axes.
 const delta=qMul(qInv(sourceRest),qNormalize(sourcePose)),B=qNormalize(basis);
 return qNormalize(qMul(qNormalize(targetRest),qMul(qMul(B,delta),qInv(B))));
}

export function mapSemanticBones(source,target,aliases={}){
 const index=new Map();for(const b of source){if(typeof b.semantic!=="string"||!b.semantic||typeof b.id!=="string"||!b.id||index.has(b.semantic))throw Error("invalid/duplicate source semantic");index.set(b.semantic,b.id);}
 const seen=new Set(),used=new Set(),pairs=[],missing=[];
 for(const b of target){if(typeof b.semantic!=="string"||!b.semantic||typeof b.id!=="string"||!b.id||seen.has(b.semantic))throw Error("invalid/duplicate target semantic");seen.add(b.semantic);const s=index.get(Object.hasOwn(aliases,b.semantic)?aliases[b.semantic]:b.semantic);if(s===undefined){missing.push(b.semantic);continue;}if(used.has(s))throw Error("ambiguous source mapping");used.add(s);pairs.push({source:s,target:b.id,semantic:b.semantic});}
 return {pairs,missing};
}
