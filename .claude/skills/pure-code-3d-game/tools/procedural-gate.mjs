#!/usr/bin/env node
/** Strict-code world *static preflight*, not proof of procedural aesthetics.
 * Validates authored and build outputs for obvious non-code assets or embedded
 * pre-baked data. Use alongside license, runtime trace, hash/provenance and visual tests.
 */
import { readdirSync, readFileSync, lstatSync } from 'node:fs';
import { join, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const forbidden = new Set(['.glb','.gltf','.obj','.fbx','.bvh','.vrm','.vrma','.usd','.usdz','.blend','.png','.jpg','.jpeg','.webp','.gif','.bmp','.tif','.tiff','.ktx','.ktx2','.basis','.hdr','.exr','.dds','.svg','.ogg','.mp3','.mp4','.wav','.m4a','.aac','.flac','.mid','.midi','.ttf','.otf','.woff','.woff2','.bin','.atlas','.psd','.anim']);
const text = new Set(['.js','.mjs','.cjs','.ts','.tsx','.jsx','.html','.css','.json','.wgsl','.glsl','.vert','.frag']);
const ignored = new Set(['node_modules','.git','coverage','.cache','.turbo','.next','.vite','test-results']);
const token = /\b(?:fetch|import|load|loadAsync)\s*\(\s*['"`]([^'"`]+\.(?:glb|gltf|obj|fbx|bvh|png|jpe?g|webp|ktx2?|ogg|mp3|wav|m4a|woff2?))(?:\?[^'"`]*)?['"`]/gi;
const inlineData = /data:(?:image|audio|font|model|application\/(?:octet-stream|gltf-buffer))\/[^;'"`]+;base64,/gi;
const bakedBinary = /(?:new\s+)?(?:Float32Array|Uint32Array|Uint16Array|Int16Array|Uint8Array)\s*\(\s*\[([^\]]+)\]/g;
function walk(p,out){
 const st=lstatSync(p);if(st.isSymbolicLink())throw Error('Symlinks not permitted in scanned runtime roots: '+p);
 if(st.isDirectory())for(const name of readdirSync(p)){if(!ignored.has(name))walk(join(p,name),out)}
 else if(st.isFile())out.push(p);
}
/** Expects a gamekit.json with assetMode='code-only'. Runtime roots must be explicit.
 * If no roots exist, fail instead of silently reporting 0 files as a PASS.
 */
export function auditProceduralProject(project,{roots=['src','game','public','dist']}={}){
 const root=resolve(project),cfg=JSON.parse(readFileSync(join(root,'gamekit.json'),'utf8'));
 const errors=[],warnings=[];
 if(cfg.assetMode!=='code-only')errors.push({code:'MODE',file:'gamekit.json',detail:'This preflight requires explicit assetMode: code-only; hybrid is a separate approved project mode'});
 const files=[];let rootsFound=0;
 for(const name of roots){
  if(name.startsWith('/')||name.includes('..')||name.includes('\\')){errors.push({code:'BAD_ROOT',file:name});continue;}
  const dir=resolve(root,name);
  if(dir!==root&&!dir.startsWith(root+'/')){errors.push({code:'ESCAPE',file:name});continue;}
  try{walk(dir,files);rootsFound++;}catch(e){if(e.code==='ENOENT')continue;errors.push({code:'READ',file:name,detail:e.message});}
 }
 if(!rootsFound)errors.push({code:'NO_RUNTIME',file:'.',detail:'No source or build output examined'});
 for(const file of files){
  const name=relative(root,file).replaceAll('\\','/'),ext=extname(file).toLowerCase();
  if(forbidden.has(ext)){errors.push({code:'ASSET_FILE',file:name,detail:ext});continue;}
  if(!text.has(ext)){
   if(ext){warnings.push({code:'UNRECOGNIZED_FILE',file:name,detail:ext});}
   else {warnings.push({code:'NO_EXTENSION',file:name});}
   continue;
  }
  if(lstatSync(file).size>8*1024*1024){warnings.push({code:'LARGE_TEXT',file:name});continue;}
  const data=readFileSync(file,'utf8');
  if(inlineData.test(data))errors.push({code:'INLINE_ASSET',file:name});inlineData.lastIndex=0;
  if(token.test(data))errors.push({code:'RUNTIME_ASSET_LOAD',file:name});token.lastIndex=0;
  if(/\bMath\.random\s*\(/.test(data)&&(name.startsWith('game/')||name.startsWith('src/')))errors.push({code:'NONDETERMINISTIC_RANDOM',file:name});
  if(/['"`][A-Za-z0-9+/]{2048,}={0,2}['"`]/.test(data))errors.push({code:'HIDDEN_BINARY_PAYLOAD',file:name});
  for(const m of data.matchAll(bakedBinary)){
   const n=(m[1].match(/[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)||[]).length;
   if(n>96){errors.push({code:'BAKED_NUMERIC_BUFFER',file:name,detail:n+' literal values'});break;}
  }
  if(ext==='.json'){
   try {const obj=JSON.parse(data);
    if(obj&&typeof obj==='object')for(const k of ['positions','vertices','boneFrames','motionFrames','animationFrames','prebakedFrames']){
      if(Array.isArray(obj[k])&&obj[k].length>96){errors.push({code:'BAKED_JSON_ASSET',file:name,detail:k+':'+obj[k].length});break;}
    }
   } catch(e){errors.push({code:'INVALID_JSON',file:name,detail:e.message});}
  }
 }
 const uniq=Array.from(new Set(files));
 return {ok:errors.length===0,mode:cfg.assetMode,rootsExamined:rootsFound,filesExamined:uniq.length,errors,warnings,limitations:[
  'Static heuristics cannot prove no hard-coded artwork, encoded asset formats, generated binary import or runtime network asset loads',
  'Do not claim natural animation, visual fidelity, GPU performance, license compliance or final-release readiness from this check',
  'Inspect actual emitted bundle and browser network trace, then verify generator hash, deterministic regeneration and real GPU screenshots'
 ]};
}
const self=fileURLToPath(import.meta.url);
if(process.argv[1]&&resolve(process.argv[1])===resolve(self)){
 const root=process.argv[2]||process.cwd();
 try{const result=auditProceduralProject(root);console.log(JSON.stringify(result,null,2));process.exitCode=result.ok?0:1;}
 catch(e){console.error(JSON.stringify({ok:false,error:e.message}));process.exitCode=2;}
}