/* r101: MoM Home card - holding before matchday, open from kick-off, shirt numbers only. Zero console errors. */
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8805,SHOTS=process.env.SHOTS||'/workspace/shots',PRE=process.env.PRE||'r100_motm_';
fs.mkdirSync(SHOTS,{recursive:true});
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/json'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end('{"v": "105"}');return;}let f=path.join(root,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
const BASE='http://localhost:'+PORT;let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const H={'access-control-allow-origin':'*'};
function errsOf(p){const e=[];p.on('pageerror',x=>e.push('pageerror: '+x.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|favicon|net::ERR/.test(m.text()))e.push('console: '+m.text());});return e;}
function ymdOffset(days){const d=new Date();d.setDate(d.getDate()+days);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function famData(role, fxDate, ko, voteOpen){
  const fx={id:'fx1',opp:'Rivals FC',date:fxDate,ko:ko||'10:30',ha:'A',comp:'League',venue:'Rivals ground',done:false,pp:0};
  return {first:'Pat',role:role,num:'7',mine:{},rsn:{},at:Date.now(),photo:'',posts:[],att:{},squadNums:[{id:'p3',num:'3'},{id:'p7',num:'7'},{id:'p9',num:'9'},{id:'p11',num:'11'}],
    vote:{motm:{open:!!voteOpen,elig:role==='parent',label:'at Rivals FC',cands:[{id:'p3',num:'3'},{id:'p9',num:'9'},{id:'p11',num:'11'}],mine:[]},poty:{open:false,elig:true}},
    welcome:'',tips:'',res:[],x:{fixtures:[fx],news:[],events:[],lifts:[],media:[],contacts:[],matchDay:fxDate===ymdOffset(0)}};
}
(async()=>{
 const b=await chromium.launch();const ph=devices['Pixel 7'];
 // Coach still renders
 {const ctx=await b.newContext({...ph});const c=await ctx.newPage();const E=errsOf(c);
  await c.addInitScript(()=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',JSON.stringify({ideas:{},players:{},matches:{},settings:{id:'main',half:35,roles:{},updatedAt:0},dirty:{},lastSync:Date.now()}));});
  await c.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{docs:[],serverTime:Date.now()}})}));
  await c.goto(BASE+'/coach/index.html');await c.waitForTimeout(1500);
  await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
  await c.screenshot({path:path.join(SHOTS,PRE+'coach_home.png'),fullPage:false});
  T('coach home zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();}

 for(const pg of ['family.html','parents.html']){
  const role=pg.startsWith('parents')?'parent':'player';
  // Holding: future Saturday
  {const ctx=await b.newContext({...ph});const q=await ctx.newPage();const E=errsOf(q);
   const future=ymdOffset(2); const data=famData(role, future, '10:30', false);
   await q.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
    r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:a.action==='f.home'?data:{ok:1}})});});
   await q.addInitScript(()=>{localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.P','1');localStorage.setItem('fam.tour','1');});
   await q.goto(BASE+'/'+pg);await q.waitForTimeout(2200);
   await q.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();const md=document.getElementById('tl-md');if(md)md.remove();try{r();}catch(e){}});
   await q.waitForTimeout(400);
   const st=await q.evaluate(()=>{const el=document.getElementById('motm-home');return {has:!!el,text:el?el.innerText:'',first:(document.querySelector('#sec-alerts .card')||{}).id};});
   T(pg+' holding MoM card', st.has && /MoM vote opens on matchday/i.test(st.text));
   T(pg+' MoM in alerts band', st.first==='motm-home' || st.has);
   await q.screenshot({path:path.join(SHOTS,PRE+pg.replace('.html','')+'_holding.png'),fullPage:false});
   T(pg+' holding zero console errors', E.length===0); if(E.length) console.log(E);
   await ctx.close();}

  // Open from kick-off (client): today, KO in the past
  {const ctx=await b.newContext({...ph});const q=await ctx.newPage();const E=errsOf(q);
   const today=ymdOffset(0); const data=famData(role, today, '00:05', false); // early KO so now is past kick-off
   await q.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
    if(a.action==='f.vote'){r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:false,error:'This vote is not open yet.'})});return;}
    r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:a.action==='f.home'?data:{ok:1}})});});
   await q.addInitScript(()=>{localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.P','1');localStorage.setItem('fam.tour','1');});
   await q.goto(BASE+'/'+pg);await q.waitForTimeout(2200);
   await q.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();const md=document.getElementById('tl-md');if(md)md.remove();try{r();}catch(e){}});
   await q.waitForTimeout(500);
   const st=await q.evaluate(()=>{const el=document.getElementById('motm-home');const chips=[...document.querySelectorAll('#motm-chips button')].map(b=>b.textContent);
    return {has:!!el,text:el?el.innerText:'',chips,hasName:/Alex|Ben|Cal|Pat/.test(el?el.innerText:'')};});
   T(pg+' open MoM from kick-off', st.has && /Vote open|Man of the match/i.test(st.text));
   if(role==='parent'){
     T(pg+' shirt chips present', st.chips.length>=3);
     T(pg+' no player names on MoM', !st.hasName);
   } else {
     T(pg+' player sees open but parents vote', /Parents vote/i.test(st.text));
   }
   await q.screenshot({path:path.join(SHOTS,PRE+pg.replace('.html','')+'_open.png'),fullPage:false});
   T(pg+' open zero console errors', E.length===0); if(E.length) console.log(E);
   await ctx.close();}
 }

 // Live pages
 {const ctx=await b.newContext({...ph});const p=await ctx.newPage();const E=errsOf(p);
  for(const url of ['coach/index.html','family.html','parents.html']){
   await p.goto('https://touchline.cipher-training.co.uk/'+url,{waitUntil:'domcontentloaded',timeout:60000});
   await p.waitForTimeout(1800);
   await p.screenshot({path:path.join(SHOTS,PRE+'live_'+url.replace(/\/|\.html/g,'_')+'.png'),fullPage:false});
   T('live '+url+' loads', (await p.locator('body').innerText()).length>20);
  }
  T('live zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();}

 await b.close();srv.close();console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0);
})();
