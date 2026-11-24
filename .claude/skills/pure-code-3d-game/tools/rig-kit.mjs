// GameKit original numerical reference. Not a complete skinned character renderer.
export function buildHumanoid({height=1.75,legRatio=.50,shoulderRatio=.25,hipRatio=.19,armRatio=.34,headRatio=.135}={}) {
 const vals=[height,legRatio,shoulderRatio,hipRatio,armRatio,headRatio];if(vals.some(x=>!Number.isFinite(x)||x<=0)||[legRatio,shoulderRatio,hipRatio,armRatio,headRatio].some(x=>x>=1)||legRatio+headRatio>=.90)throw Error("invalid rig proportions");
 const hip=height*legRatio,head=height*(1-headRatio),shoulder=head-height*.055,sw=height*shoulderRatio/2,hw=height*hipRatio/2,arm=height*armRatio;
 const bones=[];const add=(id,parent,position)=>bones.push({id,parent,position});
 add("root",null,[0,0,0]);add("pelvis","root",[0,hip,0]);add("spine_01","pelvis",[0,hip+(shoulder-hip)/3,0]);add("spine_02","spine_01",[0,hip+2*(shoulder-hip)/3,0]);add("chest","spine_02",[0,shoulder,0]);add("neck","chest",[0,head,0]);add("head","neck",[0,head+height*headRatio*.45,0]);
 for(const [s,d] of [["l",1],["r",-1]]){add("clavicle_"+s,"chest",[d*sw*.55,shoulder,0]);add("upperarm_"+s,"clavicle_"+s,[d*sw,shoulder,0]);add("lowerarm_"+s,"upperarm_"+s,[d*(sw+arm*.52),shoulder,0]);add("hand_"+s,"lowerarm_"+s,[d*(sw+arm*.94),shoulder,0]);add("thigh_"+s,"pelvis",[d*hw,hip,0]);add("calf_"+s,"thigh_"+s,[d*hw,hip*.51,0]);add("foot_"+s,"calf_"+s,[d*hw,height*.045,0]);add("ball_"+s,"foot_"+s,[d*hw,height*.02,height*.07]);}
 return {units:"m",up:"Y",forward:"+Z",parameterSource:"design-hypothesis",height,bones};
}
export function solveTwoBone3D(origin,target,l1,l2,pole=[0,0,1]){
 if(![origin,target,pole].every(v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite))||![l1,l2].every(x=>Number.isFinite(x)&&x>1e-8))throw Error("invalid IK input");
 const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),len=a=>Math.hypot(...a),norm=a=>mul(a,1/len(a));
 const delta=sub(target,origin),raw=len(delta),dir=raw>1e-9?norm(delta):[0,-1,0],eps=Math.min(1e-7,l1*.01,l2*.01),d=Math.max(Math.abs(l1-l2)+eps,Math.min(l1+l2-eps,raw));
 let p=sub(pole,mul(dir,dot(pole,dir)));if(len(p)<1e-8){const axis=Math.abs(dir[0])<.8?[1,0,0]:[0,1,0];p=sub(axis,mul(dir,dot(axis,dir)));}
 const along=(l1*l1-l2*l2+d*d)/(2*d),off=Math.sqrt(Math.max(0,l1*l1-along*along)),joint=add(origin,add(mul(dir,along),mul(norm(p),off))),end=add(origin,mul(dir,d));
 return {joint,end,reachable:raw>=Math.abs(l1-l2)-eps&&raw<=l1+l2+eps,error:len(sub(end,target))};
}
export function skinWeights(point,segments,{maxInfluences=4,falloff=.04}={}){
 if(!Array.isArray(point)||point.length!==3||!point.every(Number.isFinite)||!Array.isArray(segments)||!segments.length||!Number.isInteger(maxInfluences)||maxInfluences<1||!(falloff>0))throw Error("invalid skin input");
 const ranked=segments.map(({id,a,b})=>{if(typeof id!=="string"||![a,b].every(v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite)))throw Error("invalid segment");const ab=b.map((v,i)=>v-a[i]),ap=point.map((v,i)=>v-a[i]),den=ab.reduce((s,v)=>s+v*v,0),t=den?Math.max(0,Math.min(1,ap.reduce((s,v,i)=>s+v*ab[i],0)/den)):0;return {id,d:Math.hypot(...point.map((v,i)=>v-a[i]-t*ab[i]))};}).sort((a,b)=>a.d-b.d||a.id.localeCompare(b.id)).slice(0,maxInfluences);
 const base=ranked[0].d,ws=ranked.map(x=>Math.exp(-(x.d-base)/falloff)),sum=ws.reduce((a,b)=>a+b,0);return ranked.map((x,i)=>({id:x.id,weight:ws[i]/sum}));
}
