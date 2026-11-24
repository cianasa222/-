import fs from 'node:fs';
export function resolveModules(index,requested){
 const order=[],files=new Set(index.core),done=new Set(),visiting=new Set();function visit(id){if(done.has(id))return;if(visiting.has(id))throw Error("module dependency cycle: "+id);const m=index.modules[id];if(!m)throw Error("unknown module: "+id);visiting.add(id);for(const d of m.depends||[])visit(d);visiting.delete(id);done.add(id);order.push(id);for(const f of m.files)files.add(f);}for(const id of requested)visit(id);return {modules:order,files:[...files]};
}
if(process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href){const index=JSON.parse(fs.readFileSync(new URL('../MODULES.json',import.meta.url),'utf8'));console.log(JSON.stringify(resolveModules(index,process.argv.slice(2)),null,2));}
