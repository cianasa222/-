import test from 'node:test';import assert from 'node:assert/strict';import {qNormalize,retargetLocalRotation,mapSemanticBones} from '../tools/motion-kit.mjs';import {stepChain} from '../tools/secondary-physics.mjs';import {makeFixedClock} from '../tools/fixed-clock.mjs';import {makeEmitter,sampleCurve} from '../tools/vfx-kit.mjs';
function checks(){
 const eq=(a,b,e=1e-8)=>Math.abs(a-b)<e, same=(a,b)=>Math.abs(a.reduce((s,v,i)=>s+v*b[i],0))>1-1e-8;
 const I=[0,0,0,1],X=[Math.SQRT1_2,0,0,Math.SQRT1_2],Z=[0,0,Math.SQRT1_2,Math.SQRT1_2],Y=[0,Math.SQRT1_2,0,Math.SQRT1_2];
 const c={positions:[[0,0,0],[1,0,0],[2,0,0]],previous:[[0,0,0],[1,0,0],[2,0,0]],root:[0,0,0],restLengths:[1,1],dt:1/60,iterations:32};
 const a=stepChain(c),d=stepChain({...c,positions:[[0,0,0],[0,0,0],[0,0,0]],previous:[[0,0,0],[0,0,0],[0,0,0]],gravity:[0,0,0]});
 const hit=stepChain({...c,spheres:[{center:[1,0,0],radius:.25}]});
 const f=makeFixedClock();let ticks=0;for(let i=0;i<60;i++)f.advance(1/60,()=>ticks++);
 const g=makeFixedClock();let ticks2=0;for(let i=0;i<30;i++)g.advance(1/30,()=>ticks2++);
 const z=makeFixedClock({maxSteps:2}).advance(.25,()=>{});
 const e1=makeEmitter({seed:5,rate:60,maxParticles:3}),e2=makeEmitter({seed:5,rate:60,maxParticles:3});let r1,r2;for(let i=0;i<60;i++){r1=e1.step(1/60);r2=e2.step(1/60);}
 const e3=makeEmitter({rate:60,lifetime:[.01,.01]});e3.step(1/60);const exp=e3.step(1/60);
 const throws=fn=>{try{fn();return false}catch{return true}};
 return [["rest to rest",same(retargetLocalRotation(X,X,Z),Z)],["identity basis",same(retargetLocalRotation(I,X,I),X)],["basis conjugation",same(retargetLocalRotation(I,X,I,Z),Y)],["normalization",eq(Math.hypot(...retargetLocalRotation(I,[2,0,0,2],I)),1)],["invalid quaternion",throws(()=>qNormalize([0,0,0,0]))],["mapping",mapSemanticBones([{id:"a",semantic:"hip"}],[{id:"b",semantic:"root"}],{root:"hip"}).pairs[0].source==="a"],["missing map",mapSemanticBones([],[{id:"b",semantic:"root"}]).missing[0]==="root"],["ambiguous map",throws(()=>mapSemanticBones([{id:"a",semantic:"hip"}],[{id:"b",semantic:"root"},{id:"c",semantic:"hip"}],{root:"hip"}))],["root fixed",a.positions[0].every(x=>x===0)],["length residual",a.maxLengthError<1e-5],["coincident finite",d.positions.flat().every(Number.isFinite)&&d.maxLengthError<1e-5],["sphere nonpenetration",hit.maxPenetration<1e-8],["input immutable",c.positions[1][1]===0],["invalid dt",throws(()=>stepChain({...c,dt:0}))],["fixed 60 ticks",ticks===60],["fixed frame partition",ticks2===ticks],["catchup bounded",z.steps===2&&z.droppedSeconds>0],["emitter seeded reproducible",JSON.stringify(r1)===JSON.stringify(r2)],["emitter bounded",r1.particles.length<=3&&r1.dropped>0],["particle expiry",exp.particles.length===1&&exp.particles[0].id===1],["invalid emitter",throws(()=>makeEmitter({rate:-1}))],["curve midpoint",eq(sampleCurve([[0,1],[1,3]],.5),2)],["curve endpoints",sampleCurve([[0,1],[1,3]],2)===3],["curve malformed",throws(()=>sampleCurve([[0,1],[0,2]],.5))]];
}
for(const [name,result] of checks())test(name,()=>assert.equal(result,true));
