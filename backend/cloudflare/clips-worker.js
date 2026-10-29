const API='https://script.google.com/macros/s/AKfycby3YUAg5QncW-hb2tKDapu108F2RDlgEhFmluVsXPctKdlLP33ADPbVcJ8kEJSLmoij/exec';
const ORIGINS=['https://touchline.cipher-training.co.uk'];
const MAX=95*1048576;
const memo=new Map();
export default{async fetch(req,env,ctx){
 const o=req.headers.get('Origin')||'';
 const cors={'Access-Control-Allow-Origin':ORIGINS.includes(o)?o:ORIGINS[0],'Access-Control-Allow-Methods':'GET,HEAD,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Range','Access-Control-Expose-Headers':'Content-Length,Content-Range,Accept-Ranges','Vary':'Origin'};
 const bad=(s,t)=>new Response(t,{status:s,headers:cors});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 const u=new URL(req.url),m=u.pathname.match(/^\/(v|u)\/([A-Za-z0-9]{8,32})$/);
 if(!m)return bad(404,'Not found');
 const kind=m[1]==='v'?'play':'up',id=m[2],tok=u.searchParams.get('t')||'';
 if(!/^[a-f0-9]{40}$/.test(tok))return bad(401,'No');
 const mk=kind+id+tok,now=Date.now();let hit=memo.get(mk);
 if(!hit||hit.exp<now){
  let ok=false;
  try{const r=await fetch(API,{method:'POST',body:JSON.stringify({action:'clip.chk',tok:tok,id:id,kind:kind}),headers:{'Content-Type':'text/plain;charset=utf-8'},redirect:'follow'});const j=await r.json();ok=!!(j&&j.ok&&j.data&&j.data.ok);}catch(e){}
  hit={ok:ok,exp:now+(ok?300000:20000)};memo.set(mk,hit);if(memo.size>500)memo.clear();
 }
 if(!hit.ok)return bad(401,'No');
 const key='c/'+id+'.mp4';
 if(req.method==='PUT'){
  if(kind!=='up')return bad(405,'No');
  const len=Number(req.headers.get('content-length'))||0;
  if(!len)return bad(411,'Length needed');if(len>MAX)return bad(413,'Too big. Export at 1080p and keep it under 95MB.');
  await env.CLIPS.put(key,req.body,{httpMetadata:{contentType:'video/mp4'}});
  return new Response(JSON.stringify({ok:true}),{headers:Object.assign({'Content-Type':'application/json'},cors)});
 }
 if(req.method==='DELETE'){
  if(kind!=='up')return bad(405,'No');
  await env.CLIPS.delete(key);
  return new Response(JSON.stringify({ok:true}),{headers:Object.assign({'Content-Type':'application/json'},cors)});
 }
 if(req.method==='GET'||req.method==='HEAD'){
  if(kind!=='play')return bad(405,'No');
  const rg=req.headers.get('Range');
  const ob=await env.CLIPS.get(key,rg?{range:req.headers}:{});
  if(!ob)return bad(404,'Gone');
  const h=new Headers(cors);ob.writeHttpMetadata(h);h.set('etag',ob.httpEtag);h.set('Accept-Ranges','bytes');h.set('Cache-Control','private, max-age=600');h.set('Content-Type','video/mp4');
  let st=200;
  if(rg&&ob.range){const s=ob.range.offset||0,l=ob.range.length!==undefined?ob.range.length:ob.size-s;h.set('Content-Range','bytes '+s+'-'+(s+l-1)+'/'+ob.size);h.set('Content-Length',String(l));st=206;}else h.set('Content-Length',String(ob.size));
  return new Response(req.method==='HEAD'?null:ob.body,{status:st,headers:h});
 }
 return bad(405,'No');
}};
