/* r98: attendance Yes/No at top of family/parents home and matchday. Zero console errors. */
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8798,SHOTS=process.env.SHOTS||'/workspace/shots',PRE=process.env.PRE||'r98_';
fs.mkdirSync(SHOTS,{recursive:true});
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/json'};
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
const BASE='http://localhost:'+PORT;
let ok=0,bad=0;const T=(n,c)=>{console.log((c?'PASS ':'FAIL ')+n);c?ok++:bad++;};
const H={'access-control-allow-origin':'*'};
function errsOf(p){const e=[];p.on('pageerror',x=>e.push('pageerror: '+x.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|favicon/.test(m.text()))e.push('console: '+m.text());});return e;}
const td=new Date();const ymd=td.getFullYear()+'-'+String(td.getMonth()+1).padStart(2,'0')+'-'+String(td.getDate()).padStart(2,'0');
function famData(role){
  const fx={id:'fx1',opp:'Rivals FC',date:ymd,ko:'10:30',ha:'A',comp:'League',venue:'Rivals ground',done:false,pp:0};
  return {first:'Pat',role:role,num:'7',mine:{},rsn:{},at:Date.now(),photo:'',posts:[
    {id:'m1',type:'match',title:'Match at Rivals FC',date:ymd,time:'10:30',place:'Rivals ground',why:'',bring:'Kit'},
    {id:'t1',type:'training',title:'Training',date:ymd,time:'20:00',place:'Christopher Park'}
  ],welcome:'',tips:'',vote:{},res:[],matchDay:true,
   x:{fixtures:[fx],news:[],welcome:'',matchDay:true,events:[],lifts:[],media:[],contacts:[]}};
}
(async()=>{
 const b=await chromium.launch();const ph=devices['Pixel 7'];
 // Coach home / matchday
 {const ctx=await b.newContext({...ph});const c=await ctx.newPage();const E=errsOf(c);
  await c.addInitScript(()=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',JSON.stringify({ideas:{},players:{},matches:{m1:{id:'m1',opp:'Rivals FC',date:new Date().toISOString().slice(0,10),ko:'10:30',ha:'A',formation:'352',half:35,avail:{},lineup:{},status:'plan',period:1,clock:{acc:0,running:false,t0:0},stints:{},events:[],ratings:{},updatedAt:1}},settings:{id:'main',half:35,roles:{},updatedAt:0},dirty:{},lastSync:Date.now()}));});
  await c.route('**/macros/**',r=>r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:{docs:[],serverTime:Date.now()}})}));
  await c.goto(BASE+'/coach/index.html');await c.waitForTimeout(1500);
  await c.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
  await c.screenshot({path:path.join(SHOTS,PRE+'coach_home.png'),fullPage:false});
  T('coach home renders', (await c.locator('body').innerText()).length>40);
  T('coach home zero console errors', E.length===0); if(E.length) console.log(E);
  await ctx.close();}
 for(const pg of ['family.html','parents.html']){
  const role=pg==='parents.html'?'parent':'player';
  for(const [vn,vp] of [['mobile',{...ph}],['pc',{viewport:{width:1280,height:900}}]]){
   const ctx=await b.newContext(vp);const q=await ctx.newPage();const E=errsOf(q);
   const data=famData(role);
   await q.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
    const d=a.action==='f.home'?data:(a.action==='f.answer'?{ok:1}:{});
    r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:d})});});
   await q.addInitScript(()=>{localStorage.setItem('fam.code','p');localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.P','1');localStorage.setItem('fam.tour','1');});
   await q.goto(BASE+'/'+pg);await q.waitForTimeout(2800);
   await q.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();const w=document.getElementById('wel');if(w)w.remove();try{if(window.goTab)goTab('home');}catch(e){}try{r();}catch(e){}});
   await q.waitForTimeout(600);
   const top=await q.evaluate(()=>{
     const att=document.getElementById('att-top');
     if(!att) return {has:false};
     const cards=[...document.querySelectorAll('#root .card')];
     const i=cards.indexOf(att);
     return {has:true, index:i, text:att.innerText.slice(0,120), firstId:cards[0]&&cards[0].id};
   });
   T(pg+' '+vn+' has att-top card', top.has);
   T(pg+' '+vn+' att-top is first card', top.has && top.index===0);
   T(pg+' '+vn+' att-top asks Playing or Can you come', top.has && /Playing\?|Can you come\?|Is Pat playing/.test(top.text));
   await q.screenshot({path:path.join(SHOTS,PRE+pg.replace('.html','')+'_home_'+vn+'.png')});
   // Matchday view: force matchday overlay if TLCD present
   await q.evaluate((d)=>{try{var fx=(d.x&&d.x.fixtures&&d.x.fixtures[0]);if(window.TLCD&&fx)TLCD.showMatchday(fx,{role:d.role,anim:'12_352_in_transition'});}catch(e){}}, data);
   await q.waitForTimeout(500);
   await q.screenshot({path:path.join(SHOTS,PRE+pg.replace('.html','')+'_matchday_'+vn+'.png')});
   T(pg+' '+vn+' zero console errors', E.length===0); if(E.length) console.log(E);
   await ctx.close();
  }
 }
 await b.close();srv.close();console.log(ok+' passed, '+bad+' failed');process.exit(bad?1:0);
})();
