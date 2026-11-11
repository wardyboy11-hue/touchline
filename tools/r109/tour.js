/* r109 plain language and UX tour. Fake backend, phone size. Screenshots every main screen and audits:
   small text (<16px body), small tap targets (<48px), icon only buttons without a label, low contrast.
   Usage: OUT=/workspace/r109_language PRE=before_ NODE_PATH=/tmp/pw/node_modules node tools/r109/tour.js */
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..'),PORT=+process.env.PORT||8839,OUT=process.env.OUT||'/workspace/r109_language',PRE=process.env.PRE||'shot_';
fs.mkdirSync(OUT,{recursive:true});
const MT={'.js':'text/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/json','.svg':'image/svg+xml','.mp3':'audio/mpeg','.vtt':'text/vtt','.mp4':'video/mp4'};
const VER=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).v;
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/version.json'){r.writeHead(200,{'content-type':'application/json'});r.end(JSON.stringify({v:VER}));return;}let f=path.join(root,u);if(f.endsWith('/'))f+='index.html';fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':MT[path.extname(f)]||'application/octet-stream'});r.end(d);});}).listen(PORT);
const BASE='http://127.0.0.1:'+PORT,w=ms=>new Promise(r=>setTimeout(r,ms)),H={'access-control-allow-origin':'*'};
const iso='2026-11-11';
const fakeDate=`(()=>{const T=new Date('${iso}T17:30:00').getTime(),D0=Date.now(),R=Date;class FD extends R{constructor(...a){if(a.length)super(...a);else super(T+(R.now()-D0));}static now(){return T+(R.now()-D0);}}window.Date=FD;})()`;
const NM=['Alfie','Ben','Cal','Dan','Eli','Finn','Gus','Hal','Ike','Jay','Kit','Leo','Max','Ned','Oli','Rohan'];
const players={};NM.forEach((n,i)=>{players['p'+i]={id:'p'+i,name:n+' Test',num:String(i+1),pos:['CM'],active:true};});
const state={ideas:{},players,matches:{t1:{id:'t1',opp:'Training',comp:'Training',kind:'train',date:iso,ko:'20:00',venue:'Christopher Park',status:'plan',avail:{},lineup:{},stints:{},events:[],ratings:{},updatedAt:1},
 m1:{id:'m1',opp:'Rivals FC',date:'2026-11-15',ko:'10:30',ha:'A',formation:'352',half:35,avail:{},lineup:{},status:'plan',period:1,clock:{acc:0,running:false,t0:0},stints:{},events:[],ratings:{},updatedAt:1}},
 settings:{id:'main',half:35,roles:{},posts:[{id:'p1',type:'training',date:iso,time:'20:00',title:'Training',status:'published'},{id:'p2',type:'match',date:'2026-11-15',time:'10:30',title:'Match at Rivals',status:'published'}],updatedAt:0},dirty:{},lastSync:Date.now()};
const AUDIT=fn=>fn(); const audits=[];
async function audit(p,name){
 const a=await p.evaluate(()=>{
  const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>0.05&&r.bottom>0&&r.top<innerHeight*3;};
  const lum=c=>{const m=c.match(/[\d.]+/g);if(!m)return null;const [r,g,b]=m.slice(0,3).map(x=>{x=+x/255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);});return 0.2126*r+0.7152*g+0.0722*b;};
  const bgOf=e=>{while(e){const s=getComputedStyle(e);const b=s.backgroundColor;const m=b.match(/[\d.]+/g);if(m&&(m.length<4||+m[3]>0.5))return b;if(s.backgroundImage&&s.backgroundImage!=='none')return null;e=e.parentElement;}return 'rgb(11,19,48)';};
  const txt=e=>[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').replace(/\s+/g,' ').trim();
  const small=[],low=[],tap=[],icon=[];
  document.querySelectorAll('body *').forEach(e=>{if(!vis(e))return;const t=txt(e);if(t.length<3||/^(script|style|svg|path|title)$/i.test(e.tagName))return;const s=getComputedStyle(e),fs=parseFloat(s.fontSize);
   if(fs<14)small.push(fs+'px: '+t.slice(0,60));
   const bg=bgOf(e);if(bg){const L1=lum(s.color),L2=lum(bg);if(L1!=null&&L2!=null){const cr=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);if(cr<4.5)low.push(cr.toFixed(1)+': '+t.slice(0,50));}}});
  document.querySelectorAll('button,a[href],[role=button],summary,select,input:not([type=hidden]),[data-act]').forEach(e=>{if(!vis(e))return;const r=e.getBoundingClientRect();const lab=(e.innerText||'').trim()||e.getAttribute('aria-label')||e.getAttribute('title')||e.getAttribute('placeholder')||e.value||'';
   if((r.height<44||r.width<44)&&!(e.tagName==='A'&&e.closest('p')))tap.push(Math.round(r.width)+'x'+Math.round(r.height)+': '+(lab||e.outerHTML.slice(0,60)).replace(/\s+/g,' ').slice(0,50));
   if(/^(BUTTON|A)$/.test(e.tagName)&&!(e.innerText||'').trim()&&!e.getAttribute('aria-label')&&!e.getAttribute('title'))icon.push(e.outerHTML.slice(0,90));});
  return {text:(document.body.innerText||'').split('\n').map(x=>x.trim()).filter(Boolean),small:[...new Set(small)],low:[...new Set(low)],tap:[...new Set(tap)],icon:[...new Set(icon)]};});
 a.name=name;audits.push(a);return a;}
async function shot(p,name,full){await w(250);await p.screenshot({path:path.join(OUT,PRE+name+'.png'),fullPage:!!full});await audit(p,name);}
(async()=>{
 const b=await chromium.launch();const ph={viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true};
 /* coach */
 {const ctx=await b.newContext(ph);const p=await ctx.newPage();
  await p.addInitScript(fakeDate);
  await p.route('**/*',async route=>{const u=route.request().url();if(/macros|touchline-push|pushover/i.test(u)){let a={};try{a=JSON.parse(route.request().postData()||'{}');}catch(e){}
   const D={'voice.list':{rows:[{id:'v1',kind:'q',status:'new',text:'Can we do more shooting at training?',who:''}]},'push.stats':{squad:16,on:12,missing:[{num:'4',name:'Sam'}]}}[a.action]||{docs:[],rows:[],serverTime:Date.now()};
   return route.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:D})});}return route.continue();});
  await p.addInitScript(s=>{localStorage.setItem('tl.code','x');localStorage.setItem('tl.who','Tim');localStorage.setItem('tl.state.v1',s);localStorage.setItem('tl.accts',JSON.stringify([{role:'coach',code:'x',label:'Coach'},{role:'player',code:'pl',label:'Player of Rohan'},{role:'parent',code:'pa',label:'Parent of Rohan'}]));},JSON.stringify(state));
  await p.goto(BASE+'/coach/index.html#/today');await w(1800);await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
  await shot(p,'coach_today');
  await p.evaluate(()=>document.getElementById('acctbtn')&&document.getElementById('acctbtn').click());await shot(p,'coach_accounts');await p.evaluate(()=>document.getElementById('acctbtn')&&document.getElementById('acctbtn').click());
  for(const v of ['match','train','pos','squad','hub','more']){await p.evaluate(v=>{const b=document.querySelector('[data-act="tab"][data-v="'+v+'"]');if(b)b.click();else location.hash='#/'+v;},v);await w(700);await p.evaluate(()=>scrollTo(0,0));await shot(p,'coach_'+v);}
  await ctx.close();}
 /* session page */
 {const ctx=await b.newContext(ph);const p=await ctx.newPage();await p.goto(BASE+'/coach/anim/s1111_training.html');await w(2500);await shot(p,'session_page');
  await p.evaluate(()=>{const b=document.querySelector('[data-mode="role"]');if(b)b.click();});await w(700);await shot(p,'session_page_mode');await ctx.close();}
 /* shape */
 {const ctx=await b.newContext(ph);const p=await ctx.newPage();await p.goto(BASE+'/shape/index.html');await w(2000);await shot(p,'shape');await ctx.close();}
 /* family and parents */
 for(const pg of ['family.html','parents.html']){for(const role of (pg==='family.html'?['player']:['parent'])){
  const ctx=await b.newContext(ph);const p=await ctx.newPage();
  await p.addInitScript(fakeDate);
  await p.route('**/macros/**',r=>{let a={};try{a=JSON.parse(r.request().postData()||'{}');}catch(e){}
   const data={first:'Rohan',role:role,num:'16',mine:{},evMine:{},evAtt:{},at:Date.now(),posts:[{id:'tr1',type:'training',title:'Training',date:iso,time:'20:00',place:'Christopher Park'}],att:{},vote:{motm:{open:false},poty:{open:false}},x:{fixtures:[{id:'g1',opp:'Rivals FC',date:'2026-11-15',ko:'10:30',ha:'A',venue:'Rivals Park'}],news:[],events:[],lifts:[],media:[],contacts:[]}};
   r.fulfill({status:200,contentType:'application/json',headers:H,body:JSON.stringify({ok:true,data:a.action==='f.clips'?{rows:[],pt:''}:a.action==='who.am.i'?{role:'player',first:'Rohan'}:data})});});
  const key=pg.replace('.html','');
  /* signed out first */
  await p.goto(BASE+'/'+pg);await w(1500);await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});await shot(p,key+'_signin');
  await p.evaluate(()=>{localStorage.setItem('fam.code','p');localStorage.setItem('tl.accts',JSON.stringify([{role:'player',code:'p',label:'Player of Rohan'},{role:'parent',code:'pa',label:'Parent of Rohan'}]));});
  await p.reload();await w(2600);await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();});
  await shot(p,key+'_first_open');
  await p.evaluate(()=>{localStorage.setItem('fam.ok1','1');localStorage.setItem('fam.wel.P','1');localStorage.setItem('fam.wel.R','1');localStorage.setItem('fam.tour','1');localStorage.setItem('fam.pushAsk','9999999999999');});
  await p.reload();await w(2600);await p.evaluate(()=>{const s=document.getElementById('splash');if(s)s.remove();const m=document.getElementById('tl-md');if(m)m.remove();});
  await shot(p,key+'_home');
  await p.evaluate(()=>document.getElementById('acctbtn')&&document.getElementById('acctbtn').click());await shot(p,key+'_accounts');await p.evaluate(()=>document.getElementById('acctbtn')&&document.getElementById('acctbtn').click());
  for(const t of ['games','events','media','me','faq','voice']){await p.evaluate(t=>{try{goTab(t);}catch(e){}},t);await w(450);await p.evaluate(()=>scrollTo(0,0));await shot(p,key+'_'+t);}
  await ctx.close();}}
 fs.writeFileSync(path.join(OUT,PRE+'audit.json'),JSON.stringify(audits,null,1));
 await b.close();srv.close();console.log('screens',audits.length);
})().catch(e=>{console.error(e);process.exit(1);});
