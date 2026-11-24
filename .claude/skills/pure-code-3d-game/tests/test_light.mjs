import test from 'node:test';
import assert from 'node:assert/strict';
import {directionalFrame} from '../tools/light-rig.mjs';
function project(m,p){return [0,1,2].map(row=>m[row]*p[0]+m[row+4]*p[1]+m[row+8]*p[2]+m[row+12])}
test('fixed sun stays on the same grid under a subtexel light-plane pan',()=>{
 const first=directionalFrame([0,0,0],[0,0,1],62,128,2048);
 assert.equal(first.texel,124/2048);
 const next=directionalFrame([first.texel*.49,0,0],[0,0,1],62,128,2048);
 assert.deepEqual(first.matrix,next.matrix);
});
test('origin rebasing preserves shadow coordinates of a world point',()=>{
 const focus=[300,4,600],sun=[.6,.4,-.5],origin=[256,0,512],p=[301,5,603];
 const a=project(directionalFrame(focus,sun,32,96,1024).matrix,p);
 const b=project(directionalFrame(focus,sun,32,96,1024,origin).matrix,p.map((v,i)=>v-origin[i]));
 a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<2e-5));
});
test('vertical light is finite and moves sunward points toward smaller depths',()=>{
 const m=directionalFrame([0,0,0],[0,1,0],4,10,256).matrix;
 assert.ok(Array.from(m).every(Number.isFinite));assert.ok(project(m,[0,2,0])[2]<project(m,[0,0,0])[2]);
 assert.throws(()=>directionalFrame([0,0,0],[0,0,0],4,10,256));
});
