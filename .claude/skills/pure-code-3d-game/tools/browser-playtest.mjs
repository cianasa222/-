// Optional development runner. puppeteer-core and Chrome must be supplied by operator.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export async function playtest({url,executablePath,outputDir,viewports=[{width:1280,height:720},{width:390,height:844,isMobile:true,hasTouch:true}],steps=[],timeoutMs=15000}){
 const u=new URL(url);if(!['http:','https:'].includes(u.protocol)||!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw Error('local dev URL only');
 if(!outputDir||!executablePath||!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>60000||!Array.isArray(steps)||steps.length>100||!viewports.length||viewports.length>6)throw Error('invalid config');
 const {default:puppeteer}=await import('puppeteer-core');await fs.mkdir(outputDir,{recursive:true});const browser=await puppeteer.launch({executablePath,headless:true,timeout:timeoutMs});const reports=[];
 try{for(let i=0;i<viewports.length;i++){const vp=viewports[i],page=await browser.newPage(),errors=[],blocked=[],captures=[];
 try{await page.setViewport(vp);page.setDefaultTimeout(timeoutMs);await page.setRequestInterception(true);
 page.on('request',r=>{const v=r.url();let ok=false;try{ok=new URL(v).origin===u.origin||v.startsWith('data:')||v.startsWith('blob:'+u.origin+'/')}catch{}if(!ok)blocked.push(v);(ok?r.continue():r.abort()).catch(()=>{})});
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});page.on('requestfailed',r=>errors.push('request failed '+r.url()));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:timeoutMs});
 await page.waitForFunction(()=>{const h=window.__gamekitRuntime??window.__omGame;return !!h&&typeof h.getState==='function'&&h.getState()?.phase!=='loading'},{timeout:timeoutMs});
 const snap=()=>page.evaluate(()=>{const h=window.__gamekitRuntime??window.__omGame;return {state:h.getState(),stats:h.getStats?.()??null}});
 const before=await snap();
 for(let j=0;j<steps.length;j++){const s=steps[j];
 if(s.type==='key')await page.keyboard.press(s.key,{delay:s.delay??0});
 else if(s.type==='click')await page.click(s.selector);
 else if(s.type==='tap')await page.touchscreen.tap(s.x,s.y);
 else if(s.type==='action')await page.evaluate(a=>{const h=window.__gamekitRuntime??window.__omGame;if(typeof h.sendAction!=='function')throw Error('sendAction missing');return h.sendAction(a)},s.action);
 else if(s.type==='wait'){if(!Number.isFinite(s.ms)||s.ms<0||s.ms>2000)throw Error('invalid wait');await new Promise(r=>setTimeout(r,s.ms))}
 else if(s.type==='screenshot'||s.type==='burst'){const n=s.type==='burst'?Math.min(8,Math.max(2,s.count??4)):1;for(let k=0;k<n;k++){const f='view-'+i+'-step-'+j+'-'+k+'.png';await page.screenshot({path:path.join(outputDir,f)});captures.push(f);if(k+1<n)await new Promise(r=>setTimeout(r,Math.min(1000,Math.max(16,s.intervalMs??100))))}}
 else throw Error('unsupported step '+s.type);
 }
 const after=await snap(),checks=await page.evaluate(async()=>{const h=window.__gamekitRuntime??window.__omGame;return typeof h.runSelfTests==='function'?await h.runSelfTests():null});
 const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth+1}));
 const f='view-'+i+'-final.png';await page.screenshot({path:path.join(outputDir,f)});captures.push(f);
 const entries=checks&&typeof checks==='object'?Object.values(checks):[];const ok=entries.length>0&&entries.every(v=>v===true||v?.pass===true||v?.passed===true);
 reports.push({viewport:vp,before,after,checks,layout,captures,errors,blocked,pass:ok&&!layout.overflow&&!errors.length&&!blocked.length});
 }catch(e){reports.push({viewport:vp,error:String(e),pass:false,errors,blocked,captures})}finally{await page.close()}
 }}finally{await browser.close()}
 const result={kind:'browser-functional-evidence',realGpuVerified:false,deviceVerified:false,audibleReview:false,visualSignoff:false,pass:reports.length>0&&reports.every(r=>r.pass),reports};await fs.writeFile(path.join(outputDir,'playtest.json'),JSON.stringify(result,null,2));return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const r=await playtest(JSON.parse(await fs.readFile(process.argv[2],'utf8')));console.log(JSON.stringify(r,null,2));if(!r.pass)process.exitCode=1}
